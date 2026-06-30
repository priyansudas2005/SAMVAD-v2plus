import re
from typing import List, Dict, Any

class SentenceAwareChunker:
    @staticmethod
    def chunk_transcript(transcript: str, tokenizer=None, chunk_size: int = 400, overlap_sentences: int = 2) -> List[Dict[str, Any]]:
        """
        Split transcript into sentence-boundary safe chunks with token-count limits.
        Supports customizable sentence overlap.
        """
        if not transcript or len(transcript.strip()) < 10:
            return []
            
        sentences = re.split(r'(?<=[.!?])\s+', transcript.strip())
        sentences = [s.strip() for s in sentences if s.strip()]
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            if tokenizer:
                token_count = len(tokenizer.encode(sentence, add_special_tokens=False))
            else:
                token_count = len(sentence.split())
                
            if current_length + token_count > chunk_size:
                if current_chunk:
                    chunks.append({
                        "text": " ".join(current_chunk),
                        "chunk_index": len(chunks)
                    })
                # Safely slide back by configured overlap sentences
                slide_back = max(0, min(overlap_sentences, len(current_chunk)))
                if slide_back > 0:
                    current_chunk = current_chunk[-slide_back:]
                else:
                    current_chunk = []
                    
                if tokenizer:
                    current_length = sum(len(tokenizer.encode(s, add_special_tokens=False)) for s in current_chunk)
                else:
                    current_length = sum(len(s.split()) for s in current_chunk)
            
            current_chunk.append(sentence)
            current_length += token_count
            
        if current_chunk:
            chunks.append({
                "text": " ".join(current_chunk),
                "chunk_index": len(chunks)
            })
            
        return chunks
