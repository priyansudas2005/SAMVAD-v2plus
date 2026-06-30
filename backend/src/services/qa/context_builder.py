from typing import List, Dict, Any

class ContextBuilder:
    def __init__(self, config=None):
        from .config import QAConfig
        self.config = config or QAConfig()

    def build_context(self, candidates: List[Dict[str, Any]], tokenizer=None) -> List[Dict[str, Any]]:
        """
        Takes top-K retrieved candidates, merges adjacent overlapping segments,
        preserves chronological order, and keeps text under max_context_length tokens.
        """
        if not candidates:
            return []
            
        # 1. Sort chronologically by chunk index (or order of appearance in transcript)
        chrono_candidates = sorted(candidates, key=lambda x: x.get("chunk_index", 0))
        
        merged_blocks = []
        
        # 2. Merge overlapping or adjacent texts
        for cand in chrono_candidates:
            if not merged_blocks:
                merged_blocks.append(cand)
                continue
                
            last_block = merged_blocks[-1]
            # Simple check if there's significant overlap or adjacency
            # Since chunk sizes have sentence overlaps, we look if the text has matching sentence subsets
            # Or if chunk indexes are adjacent (e.g. index diff <= 1)
            idx_diff = cand.get("chunk_index", 999) - last_block.get("chunk_index", -999)
            if idx_diff <= 1:
                # Merge them by appending new text sentences that are not already present
                last_sentences = last_block["text"].split(". ")
                cand_sentences = cand["text"].split(". ")
                
                new_sentences = []
                for s in cand_sentences:
                    s_clean = s.strip()
                    if s_clean and not any(s_clean in ls for ls in last_sentences):
                        new_sentences.append(s_clean)
                        
                if new_sentences:
                    last_block["text"] += " " + ". ".join(new_sentences)
            else:
                merged_blocks.append(cand)
                
        # 3. Limit context sizes to fit within model sequence length
        max_len = self.config.max_context_length
        final_contexts = []
        
        for block in merged_blocks:
            text = block["text"]
            if tokenizer:
                tokens = tokenizer.encode(text, truncation=True, max_length=max_len - 50)
                truncated_text = tokenizer.decode(tokens, skip_special_tokens=True)
            else:
                # Fallback to word split estimation
                words = text.split()
                truncated_text = " ".join(words[:int(max_len * 0.75)])
                
            final_contexts.append({
                "text": truncated_text,
                "chunk_index": block.get("chunk_index", -1),
                "score": block.get("score", 0.0)
            })
            
        return final_contexts
