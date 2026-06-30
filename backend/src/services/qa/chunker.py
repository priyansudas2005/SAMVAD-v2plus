import re
from typing import List, Dict, Any

class SentenceAwareChunker:
    @staticmethod
    def chunk_transcript(transcript: str, tokenizer=None, chunk_size: int = 3) -> List[Dict[str, Any]]:
        """Split transcript into sliding sentence-aware chunks."""
        if not transcript or len(transcript.strip()) < 10:
            return []
            
        sentences = re.split(r'(?<=[.!?])\s+', transcript.strip())
        sentences = [s.strip() for s in sentences if s.strip()]
        
        chunks = []
        # Sliding window with chunk_size sentences
        for i in range(0, len(sentences), max(1, chunk_size - 1)):
            chunk_sents = sentences[i : i + chunk_size]
            if not chunk_sents:
                continue
            text = " ".join(chunk_sents)
            chunks.append({
                "text": text,
                "chunk_index": len(chunks)
            })
            if i + chunk_size >= len(sentences):
                break
                
        return chunks
