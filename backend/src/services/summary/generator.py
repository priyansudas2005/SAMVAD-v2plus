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
    # Strategy 1: direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: extract from ```json ... ``` block
    m = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Strategy 3: extract first { ... } block
    m = re.search(r'\{.*\}', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    # Strategy 4: key-value line extraction
    result = {}
    for key in ["summary", "action_items", "decisions", "key_points"]:
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


def _summarize_chunked(tokenizer, model, text: str, max_length: int, min_length: int, device: str) -> str:
    """Summarize long text by splitting into chunks and combining summaries."""
    words = text.split()
    if len(words) <= 800:
        truncated = text[:8000]
        inputs = tokenizer(truncated, max_length=1024, truncation=True, return_tensors="pt")
        if device == "cuda":
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        with torch.no_grad():
            summary_ids = model.generate(
                inputs["input_ids"],
                max_length=max_length,
                min_length=min_length,
                length_penalty=2.0,
                num_beams=4,
                early_stopping=True
            )
        return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    # Chunk: summarize each 800-word block, then combine
    chunks = []
    for i in range(0, len(words), 800):
        chunk = " ".join(words[i:i + 800])[:4000]
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
                early_stopping=True
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
            early_stopping=True
        )
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)


class MemoGenerator:

    def __init__(self):
        self.model_name = config.get("memo.model", "sshleifer/distilbart-cnn-12-6")
        self.summary_max_length = config.get("memo.summary_max_length", 150)
        self.summary_min_length = config.get("memo.summary_min_length", 50)
        self.max_action_items = config.get("memo.max_action_items", 5)
        self.max_key_points = config.get("memo.max_key_points", 5)

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = None
        self.model = None
        self.model_loaded = False
        logger.info(f"MemoGenerator initialized with model: {self.model_name} on {self.device}")

    def _load_model(self) -> bool:
        if not self.model_loaded:
            try:
                logger.info(f"Loading summarization model: {self.model_name}...")
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
                if self.device == "cuda":
                    self.model = self.model.to("cuda")
                self.model_loaded = True
                logger.info("Summarization model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load summarization model: {e}. Using rule-based fallback.")
                self.model_loaded = False
        return self.model_loaded

    async def generate_memo(self, meeting_id: str, transcript: str,
                            intelligence: Dict[str, Any] = None) -> Dict[str, Any]:
        if not transcript or len(transcript.strip()) < 10:
            return {
                "meeting_id": meeting_id,
                "summary": "No sufficient meeting content to summarize.",
                "action_items": [],
                "decisions": [],
                "key_points": [],
                "generated_at": datetime.now().isoformat(),
                "confidence": 0.0
            }

        logger.info(f"Generating memo for meeting {meeting_id}...")

        # 1. Fetch Ollama URL from settings
        from src.services.database.db import SessionLocal, DBSetting
        db = SessionLocal()
        ollama_setting = db.query(DBSetting).filter(DBSetting.key == "ollama_url").first()
        ollama_url = ollama_setting.value if ollama_setting else "http://localhost:11434"
        db.close()

        # 2. Try Ollama first
        ollama_run = await check_ollama_available(ollama_url)
        if ollama_run:
            result = await self._ollama_generate(meeting_id, transcript, ollama_url)
            if result:
                logger.info(f"Ollama memo generation succeeded for {meeting_id}")
                return result
            logger.warning(f"Ollama response wasn't usable, falling back to local model.")

        # 3. Fallback to HF pipeline
        summary = self._huggingface_summarize(transcript)
        action_items = self._extract_action_items(transcript)
        decisions = self._extract_decisions(transcript)
        key_points = self._extract_key_points(transcript)

        # Merge with intelligence report if available (prefer extracted items)
        if intelligence:
            if intelligence.get("action_items") and not action_items:
                action_items = [a.get("task", str(a)) if isinstance(a, dict) else str(a)
                                for a in intelligence["action_items"]]
            if intelligence.get("decisions") and not decisions:
                decisions = [d.get("text", str(d)) if isinstance(d, dict) else str(d)
                             for d in intelligence["decisions"]]

        confidence = min(0.95, 0.5 + (len(transcript.split()) / 500) * 0.1)

        return {
            "meeting_id": meeting_id,
            "summary": summary or "Meeting transcript analyzed.",
            "action_items": action_items[:self.max_action_items],
            "decisions": decisions[:5],
            "key_points": key_points[:self.max_key_points],
            "generated_at": datetime.now().isoformat(),
            "confidence": confidence
        }

    async def _ollama_generate(self, meeting_id: str, transcript: str,
                                ollama_url: str) -> Optional[Dict[str, Any]]:
        prompt = f"""You are an AI meeting assistant. Analyze the following meeting transcript and extract:
1. An executive summary (under 150 words)
2. Action items/todos (list of strings)
3. Decisions made (list of strings)
4. Key discussion points (list of strings)

Return the result strictly as a JSON object with this schema:
{{
  "summary": "string",
  "action_items": ["string"],
  "decisions": ["string"],
  "key_points": ["string"]
}}

Transcript:
{transcript}"""

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                models_res = await client.get(f"{ollama_url}/api/tags")
                models_data = models_res.json()
                models = [m["name"] for m in models_data.get("models", [])]
                model_name = models[0] if models else "llama3"

            logger.info(f"Querying Ollama model '{model_name}'...")
            async with httpx.AsyncClient(timeout=60.0) as client:
                ollama_res = await client.post(
                    f"{ollama_url}/api/generate",
                    json={"model": model_name, "prompt": prompt, "stream": False}
                )
                res_data = ollama_res.json()
                response_text = res_data.get("response", "")

            parsed = _extract_json_from_text(response_text)
            if parsed and isinstance(parsed, dict) and parsed.get("summary"):
                return {
                    "meeting_id": meeting_id,
                    "summary": parsed.get("summary", "No summary generated."),
                    "action_items": parsed.get("action_items", []),
                    "decisions": parsed.get("decisions", []),
                    "key_points": parsed.get("key_points", []),
                    "generated_at": datetime.now().isoformat(),
                    "confidence": 0.95
                }
            logger.warning(f"Could not parse JSON from Ollama response. Raw: {response_text[:200]}...")
            return None
        except Exception as e:
            logger.error(f"Ollama query failed: {e}")
            return None

    def _huggingface_summarize(self, transcript: str) -> str:
        if not self._load_model():
            return self._fallback_summary(transcript)
        try:
            return _summarize_chunked(
                self.tokenizer, self.model, transcript,
                self.summary_max_length, self.summary_min_length, self.device
            )
        except Exception as e:
            logger.error(f"HF inference failed: {e}")
            return self._fallback_summary(transcript)

    def _fallback_summary(self, text: str) -> str:
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        return " ".join(sentences[:5])

    def _extract_action_items(self, text: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        patterns = [
            r"\b(i|we|you|they|should|will|must|need to|ought to|scheduled to|plan to|going to)\s+\w+",
            r"\b(todo|action item|task|assign|responsible|deadline|follow.up|to.do)\b",
            r"\b(will handle|will take care|will look into|will follow up|will send|will create|will update|will prepare)\b",
            r"\b(can you|please|could you)\s+\w+"
        ]
        items = []
        for s in sentences:
            clean = s.strip()
            if not clean or clean.endswith('?') or len(clean.split()) < 4:
                continue
            for pat in patterns:
                if re.search(pat, clean, re.IGNORECASE):
                    cleaned = re.sub(r'^\[.*?\]\s*\w+:\s*', '', clean)
                    cleaned = re.sub(r'^[-\*\d\.\s]+', '', cleaned).strip()
                    if cleaned and len(cleaned) > 10 and cleaned not in items:
                        items.append(cleaned)
                    break
        return items

    def _extract_decisions(self, text: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        patterns = [
            r"\b(decided|agreed|approved|consensus|settled on|resolution|concluded|going to go with|voted|chose|selected)\b",
            r"\b(decision is|we will use|we chose|we selected|we decided|we agreed)\b",
            r"\b(finalized|confirmed|established|determined|resolved)\b"
        ]
        decisions = []
        for s in sentences:
            clean = s.strip()
            if not clean or clean.endswith('?') or len(clean.split()) < 4:
                continue
            for pat in patterns:
                if re.search(pat, clean, re.IGNORECASE):
                    cleaned = re.sub(r'^\[.*?\]\s*\w+:\s*', '', clean)
                    cleaned = re.sub(r'^[-\*\d\.\s]+', '', cleaned).strip()
                    if cleaned and len(cleaned) > 10 and cleaned not in decisions:
                        decisions.append(cleaned)
                    break
        return decisions

    def _extract_key_points(self, text: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        patterns = [
            r"\b(important|key|crucial|essential|focus|goal|target|takeaway|main point|primary|significant)\b",
            r"\b(problem is|issue is|challenge|opportunity|concern|priority|highlight)\b",
            r"\b(the main|the key|the primary|the biggest|the most important)\b"
        ]
        points = []
        for s in sentences:
            clean = s.strip()
            if not clean or clean.endswith('?') or len(clean.split()) < 5:
                continue
            for pat in patterns:
                if re.search(pat, clean, re.IGNORECASE):
                    cleaned = re.sub(r'^\[.*?\]\s*\w+:\s*', '', clean)
                    cleaned = re.sub(r'^[-\*\d\.\s]+', '', cleaned).strip()
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
            "## Summary",
            summary,
            "",
            "## Key Points Discussed",
        ]
        for kp in memo.get("key_points", []):
            lines.append(f"- {kp}")

        lines.append("")
        lines.append("## Action Items")
        for ai in memo.get("action_items", []):
            lines.append(f"- [ ] {ai}")

        lines.append("")
        lines.append("## Decisions Made")
        for dec in memo.get("decisions", []):
            lines.append(f"- {dec}")

        return "\n".join(lines)