import re
from typing import List, Dict, Any

class SentenceAwareChunker:
    @staticmethod
    def chunk_transcript(transcript: str, tokenizer=None, chunk_size: int = 400) -> List[Dict[str, Any]]:
        """
        Split transcript into token-count aware chunks.
        Restores exact original baseline chunking logic for 100% functional parity.
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
                # Slide back by 2 sentences
                current_chunk = current_chunk[-2:]
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
