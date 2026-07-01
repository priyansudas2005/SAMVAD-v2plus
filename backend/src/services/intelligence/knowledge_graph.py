"""
knowledge_graph.py
Builds a lightweight meeting knowledge graph linking topics, people, tasks, and risks.
"""
from typing import List, Dict, Any

class MeetingKnowledgeGraph:
    """
    Assembles entity relationships, tasks, and decisions into a queryable JSON-compatible graph.
    """

    def build_graph(
        self,
        actions: List[Dict[str, Any]],
        decisions: List[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        blockers: List[Dict[str, Any]],
        entities: Dict[str, List[Dict[str, Any]]],
        topics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Creates list of nodes and edges connecting actors, decisions, and outcomes.
        """
        nodes = []
        edges = []
        node_ids = set()

        def add_node(node_id: str, node_type: str, text: str) -> None:
            if node_id not in node_ids:
                nodes.append({
                    "id": node_id,
                    "type": node_type,
                    "text": text
                })
                node_ids.add(node_id)

        def add_edge(source: str, target: str, rel_type: str) -> None:
            edges.append({
                "source": source,
                "target": target,
                "relation": rel_type
            })

        # 1. Person -> Task
        for idx, act in enumerate(actions):
            task_id = f"task_{idx}"
            add_node(task_id, "TASK", act["task"])
            for owner in act.get("owners", []):
                owner_id = f"person_{owner.lower()}"
                add_node(owner_id, "PERSON", owner)
                add_edge(owner_id, task_id, "ASSIGNED_TO")

        # 2. Person -> Decision
        for idx, dec in enumerate(decisions):
            dec_id = f"decision_{idx}"
            add_node(dec_id, "DECISION", dec["text"])
            for speaker in dec.get("supporting_speakers", []):
                spk_id = f"person_{speaker.lower()}"
                add_node(spk_id, "PERSON", speaker)
                add_edge(spk_id, dec_id, "SUPPORTED")

        # 3. Decision -> Risk -> Blocker
        for idx, rsk in enumerate(risks):
            risk_id = f"risk_{idx}"
            add_node(risk_id, "RISK", rsk["text"])
            
            # Connect to relevant decisions (simple keyword heuristic)
            for d_idx, dec in enumerate(decisions):
                if any(w in rsk["text"].lower() for w in dec["text"].lower().split() if len(w) > 4):
                    add_edge(f"decision_{d_idx}", risk_id, "CREATES_RISK")

            # Connect risk -> blocker
            for b_idx, blk in enumerate(blockers):
                blocker_id = f"blocker_{b_idx}"
                add_node(blocker_id, "BLOCKER", blk["text"])
                if any(w in blk["text"].lower() for w in rsk["text"].lower().split() if len(w) > 4):
                    add_edge(risk_id, blocker_id, "LEADS_TO_BLOCKER")

        # 4. Entity -> Topic
        for ent_type, items in entities.items():
            for ent in items:
                ent_id = f"ent_{ent['text'].lower().replace(' ', '_')}"
                add_node(ent_id, "ENTITY", ent["text"])
                
                # Check for topic associations
                for topic_group in ["primary", "secondary"]:
                    for topic_obj in topics.get(topic_group, []):
                        topic_text = topic_obj["topic"]
                        topic_id = f"topic_{topic_text.lower()}"
                        add_node(topic_id, "TOPIC", topic_text)
                        
                        if topic_text.lower() in ent["text"].lower() or ent["text"].lower() in topic_text.lower():
                            add_edge(ent_id, topic_id, "ASSOCIATED_WITH")

        return {
            "nodes": nodes,
            "edges": edges
        }
