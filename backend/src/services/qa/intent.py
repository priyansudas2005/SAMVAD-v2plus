import re

class IntentDetector:
    QUESTION_PATTERNS = {
        "action_items": [
            "what are the action items",
            "what tasks were assigned",
            "who owns",
            "what needs to be done",
            "todo",
            "todo list",
            "task"
        ],
        "decisions": [
            "what was decided",
            "what decisions were made",
            "what was agreed",
            "decision",
            "decided"
        ],
        "summary": [
            "what was discussed",
            "summarize",
            "overview",
            "main points",
            "highlights",
            "summary"
        ]
    }

    def detect_intent(self, query: str) -> str:
        q_lower = query.lower().strip()
        for q_type, patterns in self.QUESTION_PATTERNS.items():
            if any(p in q_lower for p in patterns):
                return q_type
        return "general"
