"""
sentence_builder.py
Rebuilds proper sentences based on punctuation and timestamp boundaries.
"""
from typing import List, Dict, Any

class SentenceBuilder:
    """
    Groups and splits transcript segment fragments into complete readable sentences.
    """

    @staticmethod
    def rebuild_sentences(segments: List[Dict[str, Any]], max_silence_gap_s: float = 1.5) -> List[Dict[str, Any]]:
        """
        Merges adjacent segment fragments if they belong to the same speaker
        and represent a single continuous sentence.
        """
        if not segments:
            return []
            
        rebuilt = []
        current = segments[0].copy()
        
        for nxt in segments[1:]:
            # Check speaker matching
            same_speaker = current.get("speaker_label") == nxt.get("speaker_label")
            gap = nxt["start"] - current["end"]
            
            # Ends with punctuation?
            ends_sentence = current["text"].strip().endswith(('.', '?', '!'))
            
            if same_speaker and gap <= max_silence_gap_s and not ends_sentence:
                # Merge segment
                current["end"] = nxt["end"]
                current["text"] = f"{current['text']} {nxt['text']}".strip()
                
                # Merge words list
                if "words" in current and "words" in nxt:
                    current["words"] = current["words"] + nxt["words"]
            else:
                rebuilt.append(current)
                current = nxt.copy()
                
        rebuilt.append(current)
        return rebuilt
