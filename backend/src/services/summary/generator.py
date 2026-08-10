"""
Memo Generation Module
Automatically generates meeting summaries, action items, decisions, and key points offline.
"""

import re
import json
import httpx
import torch
from datetime import datetime
from typing import Dict, List, Any, Optional
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

from src.utils.logger import get_logger
from src.utils.config import load_config

logger = get_logger(__name__)
config = load_config()


async def check_ollama_available(url="http://localhost:11434"):
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{url}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


def _extract_json_from_text(text: str) -> Optional[dict]:
    """Try multiple strategies to extract JSON from LLM output."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    m = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass

    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    result = {}
    for key in [
        "summary",
        "action_items",
        "decisions",
        "key_points",
        "discussion_points",
    ]:
        m = re.search(rf'"{key}"\s*:\s*(".*?"|\[.*?\])', text, re.DOTALL)
        if m:
            raw = m.group(1)
            try:
                result[key] = json.loads(raw)
            except json.JSONDecodeError:
                result[key] = raw.strip('"') if raw.startswith('"') else []
    if result:
        return result

    return None


def _summarize_chunked(
    tokenizer, model, text: str, max_length: int, min_length: int, device: str
) -> str:
    """Summarize long text by splitting into chunks and combining summaries."""
    words = text.split()
    if len(words) <= 800:
        truncated = text[:8000]
        inputs = tokenizer(
            truncated, max_length=1024, truncation=True, return_tensors="pt"
        )
        if device == "cuda":
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        with torch.no_grad():
            summary_ids = model.generate(
                inputs["input_ids"],
                max_length=max_length,
                min_length=min_length,
                length_penalty=2.0,
                num_beams=4,
                early_stopping=True,
            )
        return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    chunks = []
    for i in range(0, len(words), 800):
        chunk = " ".join(words[i : i + 800])[:4000]
        inputs = tokenizer(chunk, max_length=1024, truncation=True, return_tensors="pt")
        if device == "cuda":
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        with torch.no_grad():
            summary_ids = model.generate(
                inputs["input_ids"],
                max_length=min(max_length, 80),
                min_length=min(min_length, 30),
                length_penalty=1.5,
                num_beams=3,
                early_stopping=True,
            )
        chunks.append(tokenizer.decode(summary_ids[0], skip_special_tokens=True))

    combined = " ".join(chunks)
    inputs = tokenizer(combined, max_length=1024, truncation=True, return_tensors="pt")
    if device == "cuda":
        inputs = {k: v.to("cuda") for k, v in inputs.items()}
    with torch.no_grad():
        summary_ids = model.generate(
            inputs["input_ids"],
            max_length=max_length,
            min_length=min_length,
            length_penalty=2.0,
            num_beams=4,
            early_stopping=True,
        )
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)


def _build_discussion_points(intelligence: Dict[str, Any]) -> List[str]:
    """Generate structured discussion points from timeline phases and intelligence data."""
    points = []
    timeline = intelligence.get("timeline", {})
    phases = timeline.get("phases", [])

    for phase in phases:
        name = phase.get("name", "Discussion")
        duration = phase.get("duration", 0)
        topic = phase.get("dominant_topic", "General")
        speakers = phase.get("speakers", [])
        action_count = phase.get("action_items_count", 0)
        decision_count = phase.get("decisions_count", 0)

        speaker_str = ", ".join(speakers[:3])
        if len(speakers) > 3:
            speaker_str += f" and {len(speakers)-3} others"
        duration_min = duration / 60.0

        line = f"{name} Phase ({duration_min:.0f} min) — {speaker_str}"
        if topic != "General":
            line += f" — Focus: {topic}"
        if action_count > 0 or decision_count > 0:
            extras = []
            if action_count > 0:
                extras.append(f"{action_count} action item(s)")
            if decision_count > 0:
                extras.append(f"{decision_count} decision(s)")
            line += f" | {'; '.join(extras)}"
        points.append(line)

    if not points:
        topics = intelligence.get("topics", {})
        primary_topics = topics.get("primary", [])
        if primary_topics:
            for t in primary_topics[:5]:
                topic_text = t.get("topic", t) if isinstance(t, dict) else t
                points.append(f"Discussion on {topic_text}")

    return points


def _format_action_items(
    intelligence: Dict[str, Any], max_items: int = 10
) -> List[str]:
    """Format action items from intelligence data with owner/priority/deadline."""
    items = intelligence.get("action_items", [])
    if not items:
        return []

    formatted = []
    for item in items[:max_items]:
        task = item.get("task", str(item)) if isinstance(item, dict) else str(item)
        owner = item.get("owner", "UNKNOWN") if isinstance(item, dict) else "UNKNOWN"
        priority = (
            item.get("priority", "MEDIUM") if isinstance(item, dict) else "MEDIUM"
        )
        deadline = item.get("deadline", "NONE") if isinstance(item, dict) else "NONE"

        if deadline != "NONE":
            formatted.append(
                f"[{priority}] {task} (Assignee: {owner}, Deadline: {deadline})"
            )
        else:
            formatted.append(f"[{priority}] {task} (Assignee: {owner})")
    return formatted


def _format_decisions(intelligence: Dict[str, Any], max_items: int = 10) -> List[str]:
    """Format decisions from intelligence data with type and supporting speakers."""
    decisions = intelligence.get("decisions", [])
    if not decisions:
        return []

    formatted = []
    for dec in decisions[:max_items]:
        text = dec.get("text", str(dec)) if isinstance(dec, dict) else str(dec)
        dec_type = dec.get("type", "FINAL") if isinstance(dec, dict) else "FINAL"
        confidence = dec.get("confidence", 0.5) if isinstance(dec, dict) else 0.5
        speakers = dec.get("supporting_speakers", []) if isinstance(dec, dict) else []

        speaker_str = f" (by {', '.join(speakers[:3])})" if speakers else ""
        conf_pct = confidence * 100
        formatted.append(f"[{dec_type}] {text}{speaker_str}")
    return formatted


def _prioritize_action_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sort action items by priority (HIGH > MEDIUM > LOW) then by confidence."""
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "UNKNOWN": 3}
    return sorted(
        items,
        key=lambda x: (
            priority_order.get(x.get("priority", "MEDIUM"), 1),
            -x.get("confidence", 0),
        ),
    )


class MemoGenerator:

    def __init__(self):
        self.model_name = config.get("memo.model", "sshleifer/distilbart-cnn-12-6")
        self.summary_max_length = config.get("memo.summary_max_length", 200)
        self.summary_min_length = config.get("memo.summary_min_length", 80)
        self.max_action_items = config.get("memo.max_action_items", 10)
        self.max_key_points = config.get("memo.max_key_points", 8)
        self.max_discussion_points = config.get("memo.max_discussion_points", 10)

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = None
        self.model = None
        self.model_loaded = False
        logger.info(
            f"MemoGenerator initialized with model: {self.model_name} on {self.device}"
        )

    def _load_model(self) -> bool:
        if not self.model_loaded:
            try:
                logger.info(f"Loading summarization model: {self.model_name}...")
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_name
                )  # nosec B615
                self.model = AutoModelForSeq2SeqLM.from_pretrained(
                    self.model_name
                )  # nosec B615
                if self.device == "cuda":
                    self.model = self.model.to("cuda")
                test_decode = self.tokenizer.decode([0], skip_special_tokens=True)
                if not isinstance(test_decode, str):
                    raise RuntimeError("Model returned non-string (mock detected)")
                self.model_loaded = True
                logger.info("Summarization model loaded successfully.")
            except Exception as e:
                logger.error(
                    f"Failed to load summarization model: {e}. Using rule-based fallback."
                )
                self.model_loaded = False
        return self.model_loaded

    async def generate_memo(
        self, meeting_id: str, transcript: str, intelligence: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        if not transcript or len(transcript.strip()) < 10:
            return {
                "meeting_id": meeting_id,
                "summary": "No sufficient meeting content to summarize.",
                "action_items": [],
                "decisions": [],
                "key_points": [],
                "discussion_points": [],
                "generated_at": datetime.now().isoformat(),
                "confidence": 0.0,
            }

        logger.info(f"Generating memo for meeting {meeting_id}...")

        intelligence = intelligence or {}

        from src.services.database.db import SessionLocal, DBSetting

        db = SessionLocal()
        ollama_setting = (
            db.query(DBSetting).filter(DBSetting.key == "ollama_url").first()
        )
        ollama_url = (
            ollama_setting.value if ollama_setting else "http://localhost:11434"
        )
        db.close()

        ollama_run = await check_ollama_available(ollama_url)
        if ollama_run:
            result = await self._ollama_generate(
                meeting_id, transcript, intelligence, ollama_url
            )
            if result:
                logger.info(f"Ollama memo generation succeeded for {meeting_id}")
                return result
            logger.warning(
                f"Ollama response wasn't usable, falling back to local model."
            )

        summary = self._huggingface_summarize(transcript)

        action_items = _format_action_items(intelligence, self.max_action_items)
        decisions = _format_decisions(intelligence, 5)
        key_points = self._extract_key_points(transcript, intelligence)
        discussion_points = _build_discussion_points(intelligence)

        if not action_items:
            action_items = self._extract_action_items(transcript)
        if not decisions:
            decisions = self._extract_decisions(transcript)

        word_count = len(transcript.split())
        speaker_count = len(
            intelligence.get("timeline", {}).get("speaker_activity", {})
        )
        if speaker_count == 0:
            speaker_count = (
                len(
                    set(
                        s.get("speaker_label", "")
                        for s in intelligence.get("timeline", {})
                        .get("phases", [{}])[0]
                        .get("speakers", [])
                    )
                )
                if intelligence.get("timeline", {}).get("phases")
                else 1
            )

        confidence = min(0.95, 0.5 + (word_count / 500) * 0.1)

        return {
            "meeting_id": meeting_id,
            "summary": summary or "Meeting transcript analyzed.",
            "action_items": action_items[: self.max_action_items],
            "decisions": decisions[:5],
            "key_points": key_points[: self.max_key_points],
            "discussion_points": discussion_points[: self.max_discussion_points],
            "generated_at": datetime.now().isoformat(),
            "confidence": confidence,
        }

    async def _ollama_generate(
        self,
        meeting_id: str,
        transcript: str,
        intelligence: Dict[str, Any],
        ollama_url: str,
    ) -> Optional[Dict[str, Any]]:
        timeline = intelligence.get("timeline", {})
        phases = timeline.get("phases", [])
        speaker_activity = timeline.get("speaker_activity", {})
        topics = intelligence.get("topics", {})
        analytics = intelligence.get("analytics", {})

        phase_desc = ""
        if phases:
            phase_lines = []
            for p in phases:
                phase_lines.append(
                    f"  - {p.get('name', 'Discussion')} ({p.get('duration', 0)/60:.0f} min): {p.get('dominant_topic', 'General')}"
                )
            phase_desc = "Meeting phases:\n" + "\n".join(phase_lines)

        speaker_desc = ""
        if speaker_activity:
            spk_lines = [
                f"  - {spk}: {info.get('total_duration_s', 0)/60:.1f} min, {info.get('segment_count', 0)} segments"
                for spk, info in sorted(
                    speaker_activity.items(),
                    key=lambda x: x[1].get("total_duration_s", 0),
                    reverse=True,
                )
            ]
            speaker_desc = "Speakers:\n" + "\n".join(spk_lines)

        topic_desc = ""
        if topics:
            all_topics = []
            for cat in ["primary", "secondary", "emerging"]:
                for t in topics.get(cat, []):
                    topic_text = t.get("topic", t) if isinstance(t, dict) else t
                    all_topics.append(topic_text)
            if all_topics:
                topic_desc = "Topics discussed: " + ", ".join(all_topics[:8])

        analytics_summary = ""
        if analytics:
            productivity = analytics.get(
                "productivity_score", analytics.get("overall_productivity", "")
            )
            engagement = analytics.get(
                "engagement_score", analytics.get("overall_engagement", "")
            )
            if productivity:
                analytics_summary = f"Productivity: {productivity}"
            if engagement:
                analytics_summary += f" | Engagement: {engagement}"

        context_block = "\n".join(
            filter(None, [phase_desc, speaker_desc, topic_desc, analytics_summary])
        )

        prompt = f"""You are an AI meeting assistant. Analyze the following meeting transcript and extract:

1. EXECUTIVE SUMMARY: A comprehensive yet concise summary (100-200 words) covering the meeting's purpose, key participants, main topics discussed, outcomes achieved, and overall tone.

2. ACTION ITEMS: List specific tasks assigned. For each, include the task description, assignee (who is responsible), priority level (HIGH/MEDIUM/LOW), and deadline if mentioned.

3. DECISIONS MADE: List significant decisions reached. For each, indicate the decision type (FINAL/APPROVED/PROPOSED/DEFERRED) and briefly note any context.

4. KEY HIGHLIGHTS: Important insights, announcements, milestones, or notable contributions. These are the most valuable takeaways from the discussion.

5. DISCUSSION POINTS: The natural flow of the meeting as it progressed through different topics or phases.

Return the result strictly as a JSON object with this schema:
{{
  "summary": "string",
  "action_items": ["string"],
  "decisions": ["string"],
  "key_points": ["string"],
  "discussion_points": ["string"]
}}

Meeting context:
{context_block}

Transcript:
{transcript}"""

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                models_res = await client.get(f"{ollama_url}/api/tags")
                models_data = models_res.json()
                models = [m["name"] for m in models_data.get("models", [])]
                model_name = models[0] if models else "llama3"

            logger.info(f"Querying Ollama model '{model_name}'...")
            async with httpx.AsyncClient(timeout=120.0) as client:
                ollama_res = await client.post(
                    f"{ollama_url}/api/generate",
                    json={"model": model_name, "prompt": prompt, "stream": False},
                )
                res_data = ollama_res.json()
                response_text = res_data.get("response", "")

            parsed = _extract_json_from_text(response_text)
            if parsed and isinstance(parsed, dict) and parsed.get("summary"):
                action_items = parsed.get("action_items", [])
                if not action_items:
                    action_items = _format_action_items(
                        intelligence, self.max_action_items
                    )

                return {
                    "meeting_id": meeting_id,
                    "summary": parsed.get("summary", "No summary generated."),
                    "action_items": action_items[: self.max_action_items],
                    "decisions": parsed.get("decisions", [])[:5],
                    "key_points": parsed.get("key_points", [])[: self.max_key_points],
                    "discussion_points": parsed.get(
                        "discussion_points", _build_discussion_points(intelligence)
                    )[: self.max_discussion_points],
                    "generated_at": datetime.now().isoformat(),
                    "confidence": 0.95,
                }
            logger.warning(
                f"Could not parse JSON from Ollama response. Raw: {response_text[:200]}..."
            )
            return None
        except Exception as e:
            logger.error(f"Ollama query failed: {e}")
            return None

    def _huggingface_summarize(self, transcript: str) -> str:
        if not self._load_model():
            return self._fallback_summary(transcript)
        try:
            return _summarize_chunked(
                self.tokenizer,
                self.model,
                transcript,
                self.summary_max_length,
                self.summary_min_length,
                self.device,
            )
        except Exception as e:
            logger.error(f"HF inference failed: {e}")
            return self._fallback_summary(transcript)

    def _fallback_summary(self, text: str) -> str:
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        if not sentences:
            return text[:500]

        # Score sentences by relevance (position, length, keyword signals)
        scored = []
        keywords = [
            "decision",
            "agree",
            "conclude",
            "approve",
            "launch",
            "deploy",
            "deadline",
            "important",
            "critical",
            "blocker",
            "risk",
            "release",
            "goal",
            "target",
            "next step",
            "action",
            "assign",
            "responsible",
            "schedule",
            "plan",
            "problem",
            "issue",
            "solution",
            "fix",
            "update",
            "change",
            "migrate",
            "implement",
            "build",
            "create",
            "setup",
            "configure",
            "integrate",
        ]
        for i, s in enumerate(sentences):
            clean = s.strip()
            if len(clean.split()) < 5:
                continue
            score = 0.0
            # Prefer early sentences
            score += max(0, 1.0 - (i / len(sentences)) * 0.5)
            # Prefer medium-length sentences (substantive but not rambling)
            wc = len(clean.split())
            if 8 <= wc <= 40:
                score += 0.3
            # Boost for keyword hits
            lower = clean.lower()
            for kw in keywords:
                if kw in lower:
                    score += 0.15
            # Boost for sentences with named entities (capitalized words)
            caps = sum(1 for w in clean.split() if w[0].isupper() if len(w) > 1)
            if caps >= 2:
                score += 0.1
            scored.append((score, clean))

        scored.sort(key=lambda x: x[0], reverse=True)
        taken = []
        total_words = 0
        for _, s in scored:
            wc = len(s.split())
            if total_words + wc > 150:
                break
            taken.append(s)
            total_words += wc
            if len(taken) >= 5:
                break

        if not taken:
            taken = [s.strip() for s in sentences[:3] if len(s.strip().split()) >= 5]
        return " ".join(taken) if taken else text[:500]

    def _extract_action_items(self, text: str) -> List[str]:
        sentences = re.split(r"(?<=[.!?])\s+", text)
        patterns = [
            r"\b(?:will|shall|must|need to|has to|have to|going to|plan to|scheduled to)\b",
            r"\b(?:assigned?|responsible|tasked|delegated|owner)\b",
            r"\b(?:action item|to.?do|todo|follow.?up|next step)\b",
            r"\b(?:will handle|will take care|will look into|will follow up|will send|will create|will update|will prepare|will fix|will implement)\b",
            r"^(?:please|can you|could you|we need|we should|we must|i need|i will)\b",
        ]
        items = []
        for s in sentences:
            clean = s.strip()
            if (
                not clean
                or clean.endswith("?")
                or len(clean.split()) < 4
                or len(clean.split()) > 50
            ):
                continue
            for pat in patterns:
                if re.search(pat, clean, re.IGNORECASE):
                    cleaned = re.sub(r"^\[.*?\]\s*\w+:\s*", "", clean).strip()
                    cleaned = re.sub(r"^[-\*\d\.\s]+", "", cleaned).strip()
                    if cleaned and len(cleaned) > 15 and cleaned not in items:
                        items.append(cleaned)
                    break
        return items

    def _extract_decisions(self, text: str) -> List[str]:
        sentences = re.split(r"(?<=[.!?])\s+", text)
        patterns = [
            r"\b(?:decided|agreed|approved|consensus|settled on|resolution|concluded|voted|chose|selected|finalized|confirmed|established|determined|resolved|ratified|endorsed)\b",
            r"\b(?:we will use|we chose|we selected|we decided|we agreed|we opted|we picked|we settled)\b",
            r"\b(?:decision is|plan is|goal is|target is|objective is)\b",
            r"\b(?:going forward|moving forward|from now on|effective immediately)\b",
            r"\b(?:greenlit|signed off|rubber.?stamped|given the go.?ahead|got approval)\b",
        ]
        decisions = []
        for s in sentences:
            clean = s.strip()
            if (
                not clean
                or clean.endswith("?")
                or len(clean.split()) < 5
                or len(clean.split()) > 50
            ):
                continue
            for pat in patterns:
                if re.search(pat, clean, re.IGNORECASE):
                    cleaned = re.sub(r"^\[.*?\]\s*\w+:\s*", "", clean).strip()
                    cleaned = re.sub(r"^[-\*\d\.\s]+", "", cleaned).strip()
                    if cleaned and len(cleaned) > 15 and cleaned not in decisions:
                        decisions.append(cleaned)
                    break
        return decisions

    def _extract_key_points(
        self, text: str, intelligence: Dict[str, Any] = None
    ) -> List[str]:
        """Extract key highlights. Falls back from intelligence data > regex."""
        points = []

        if intelligence:
            risks = intelligence.get("risks", [])
            for r in risks:
                r_text = r.get("text", str(r)) if isinstance(r, dict) else str(r)
                points.append(f"⚠ Risk identified: {r_text[:200]}")

            blockers = intelligence.get("blockers", [])
            for b in blockers:
                b_text = b.get("text", str(b)) if isinstance(b, dict) else str(b)
                points.append(f"Blocked: {b_text[:200]}")

            followups = intelligence.get("followups", [])
            for f in followups:
                f_text = f.get("text", str(f)) if isinstance(f, dict) else str(f)
                points.append(f"Follow-up required: {f_text[:200]}")

            questions = intelligence.get("questions", [])
            for q in questions:
                q_text = q.get("text", str(q)) if isinstance(q, dict) else str(q)
                speaker = q.get("speaker", "")
                prefix = f"Question from {speaker}: " if speaker else "Question: "
                points.append(f"{prefix}{q_text[:200]}")

        if not points:
            sentences = re.split(r"(?<=[.!?])\s+", text)
            patterns = [
                r"\b(important|key|crucial|essential|focus|goal|target|takeaway|main point|primary|significant)\b",
                r"\b(problem is|issue is|challenge|opportunity|concern|priority|highlight)\b",
                r"\b(the main|the key|the primary|the biggest|the most important)\b",
            ]
            for s in sentences:
                clean = s.strip()
                if not clean or clean.endswith("?") or len(clean.split()) < 5:
                    continue
                for pat in patterns:
                    if re.search(pat, clean, re.IGNORECASE):
                        cleaned = re.sub(r"^\[.*?\]\s*\w+:\s*", "", clean)
                        cleaned = re.sub(r"^[-\*\d\.\s]+", "", cleaned).strip()
                        if cleaned and len(cleaned) > 15 and cleaned not in points:
                            points.append(cleaned)
                        break
        return points

    def format_memo_text(self, memo: Dict[str, Any]) -> str:
        meeting_id = memo.get("meeting_id", "N/A")
        generated_at = memo.get("generated_at", "N/A")
        summary = memo.get("summary", "No summary available.")

        lines = [
            f"# MEETING MEMO",
            f"**Meeting ID:** {meeting_id}",
            f"**Generated At:** {generated_at}",
            f"**Confidence Score:** {memo.get('confidence', 1.0)*100:.1f}%",
            "",
            "## Executive Summary",
            summary,
            "",
        ]

        kp = memo.get("key_points", [])
        if kp:
            lines.append("## Key Highlights")
            for point in kp:
                lines.append(f"- {point}")
            lines.append("")

        dp = memo.get("discussion_points", [])
        if dp:
            lines.append("## Discussion Points")
            for point in dp:
                lines.append(f"- {point}")
            lines.append("")

        ai = memo.get("action_items", [])
        if ai:
            lines.append("## Assigned Tasks & Action Items")
            for item in ai:
                lines.append(f"- [ ] {item}")
            lines.append("")

        dec = memo.get("decisions", [])
        if dec:
            lines.append("## Decisions Logged")
            for d in dec:
                lines.append(f"- {d}")
            lines.append("")

        return "\n".join(lines)
