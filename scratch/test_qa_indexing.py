import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root / "backend"))

import traceback
try:
    print("Testing SentenceTransformer model loading...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("SentenceTransformer loaded successfully!")
    
    print("Testing QA model loading...")
    from transformers import AutoTokenizer, AutoModelForQuestionAnswering
    tokenizer = AutoTokenizer.from_pretrained("deepset/roberta-base-squad2")
    model_qa = AutoModelForQuestionAnswering.from_pretrained("deepset/roberta-base-squad2")
    print("QA model loaded successfully!")
    
except Exception as e:
    print("ERROR encountered during model loading:")
    traceback.print_exc()
