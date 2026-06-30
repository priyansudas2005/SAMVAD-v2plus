from datetime import datetime
import torch
from transformers import AutoTokenizer, AutoModelForQuestionAnswering
from src.utils.logger import get_logger

logger = get_logger(__name__)

class AnswerExtractor:
    def __init__(self, config=None):
        from .config import QAConfig
        self.config = config or QAConfig()
        self.tokenizer = None
        self.qa_model = None
        self.model_loaded = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_name = self.config.model

    def load_model(self) -> bool:
        if not self.model_loaded:
            qa_models = [self.config.model] + [
                "deepset/roberta-base-squad2",
                "deepset/minilm-uncased-squad2",
                "distilbert-base-cased-distilled-squad"
            ]

            for model_name in qa_models:
                try:
                    logger.info(f"Loading QA model: {model_name}...")
                    self.tokenizer = AutoTokenizer.from_pretrained(model_name)
                    self.qa_model = AutoModelForQuestionAnswering.from_pretrained(model_name)
                    self.qa_model.to(self.device)
                    self.model_name = model_name
                    self.model_loaded = True
                    return True
                except Exception as e:
                    logger.warning(f"Could not load {model_name}: {e}")
            self.model_loaded = False
        return self.model_loaded

    def extract_answer(self, question: str, context: str) -> dict:
        self.load_model()
        if not self.model_loaded:
            return {}
            
        try:
            inputs = self.tokenizer(question, context, return_tensors="pt", truncation=True, max_length=self.config.max_context_length)
            if self.device == "cuda":
                inputs = {k: v.to("cuda") for k, v in inputs.items()}
                
            with torch.no_grad():
                outputs = self.qa_model(**inputs)
                
            start_logits = outputs.start_logits[0]
            end_logits = outputs.end_logits[0]
            
            start_probs = torch.softmax(start_logits, dim=-1)
            end_probs = torch.softmax(end_logits, dim=-1)
            
            start_idx = torch.argmax(start_probs).item()
            end_idx = torch.argmax(end_probs).item()
            
            confidence = (start_probs[start_idx] * end_probs[end_idx]).item()
            
            if end_idx >= start_idx:
                tokens = self.tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
                answer_tokens = tokens[start_idx : end_idx + 1]
                answer = self.tokenizer.convert_tokens_to_string(answer_tokens).strip()
                answer = answer.replace("[CLS]", "").replace("[SEP]", "").replace("<s>", "").replace("</s>", "").strip()
                if answer and not answer.startswith("..."):
                    return {
                        "answer": answer,
                        "confidence": confidence
                    }
        except Exception as e:
            logger.error(f"Inference failed: {e}")
            
        return {}
