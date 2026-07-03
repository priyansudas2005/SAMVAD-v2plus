import os
import sys
import time
import json
import numpy as np
from pathlib import Path

# Setup paths
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

# Prevent heavy dependencies from crashing if torch isn't fully set up in this python instance
os.environ["SAMVAD_DB_DIR"] = "backend/data/database"

from src.services.qa.system import QuestionAnswering, chunk_transcript, SemanticRetriever
from sentence_transformers import SentenceTransformer

# Sample transcript for testing
SAMPLE_TRANSCRIPT = """
Speaker B: Hello, everyone. My name is Tom and today I have with me to my awesome colleagues when we can start by getting them introduced Samir.
Speaker A: Hey, everyone. This is Samir and I help in articulating the value provided by our open platform and the plethora of use cases that can be supported.
Speaker B: Let's go to the next one. Hi everyone. My name is Will and I talk about the how how do we use the APIs.
Speaker A: How do we integrate them? How do we deploy them go live in our production applications?
Speaker B: Awesome. Thanks guys. Today the topic is about Ring Central's AI APIs around conversational intelligence. So let's get started.
Speaker A: Question for Samir. AI is very highly used acronym over the past 4-5 years, especially. How do you how do you understand it in context of conversations?
Speaker B: What capabilities does it bring and how easy it is is it to use very well. Tom, you hit the nail on the head. Yes, AI is very, very highly used acronym for last. I would say five to six years, but when you think about AI in context of conversations, like first thing that comes to the mind is speech to text capability or text to speech capabilities, right, but I think it's much much beyond that. For example, you can do a lot of interaction analysis, sentiment analysis and emotion and analysis with these APIs that we offer. It means if you are in a context center kind of a use case where supervisor needs to understand what kind of calls are coming in, right, from all the people around the world to understand the sentiment level. They can simply have a pointer zero to five to figure out the calls coming in fall in what range to understand the sentiment of those calls, right, that's one of the biggest, biggest powers that we give through over AI APIs.
Speaker A: Wow, that is so interesting. Next question I have here is for Will, what are the different set of APIs that we just support today, and how can you throw some light on the three of the top most used conversational intelligence API use cases across our portfolio of API product.
Speaker B: Yeah, great question. We support basically APIs at two categories, one, their audio APIs and the other set of APIs are based on text and the three most popular APIs are, you can say the speech to text because even audio gets converted into text and then the AI engine gives you the transcript of that.
Speaker A: And it can give you transcript with punctuation, such as comma, so that you can turn it into a report. Another API, very popular is the speaker diarization API. So, for example, there are multiple people here in this meeting and the API will tell you which speaker is speaking at which point of time, who spoke what essentially.
Speaker B: And then there is another API that does speaker identification. This is similar to speaker diarization API. It detects who speaking and if the AI model has been trained by the speaker's voice, it can tell you who the person is if you provide a label, such as the name, the person, and then it will tell you, for example, Will is speaking at this time. Otherwise, it will just say person, a person, be person, see.
Speaker A: That's great. Well, Samir, well, thank you so much again for explaining the wise and the house of ring Central's open platform and specifically our intelligent APIs.
Speaker B: This program's in beta right now. We'll soon be working toward releasing it generally available to the public. So please stay tuned and we look forward to getting some feedback from you.
"""

TEST_CASES = [
    {
        "question": "names of the speakers",
        "expected_keywords": ["tom", "samir", "will"],
        "type": "speaker"
    },
    {
        "question": "what was the question for samir",
        "expected_keywords": ["acronym", "conversations", "how do you understand"],
        "type": "factual"
    },
    {
        "question": "what did tom say",
        "expected_keywords": ["tom", "colleagues", "introduced"],
        "type": "speaker_speech"
    },
    {
        "question": "what are the three most popular APIs",
        "expected_keywords": ["speech to text", "diarization", "identification"],
        "type": "synthesis"
    },
    {
        "question": "what did samir say about context centers",
        "expected_keywords": ["supervisor", "sentiment", "calls"],
        "type": "synthesis"
    },
    {
        "question": "what is the status of the program release",
        "expected_keywords": ["beta", "releasing", "generally available"],
        "type": "timeline"
    }
]

def profile_system():
    print("=== STARTING RUNTIME PROFILING & RETRIEVAL AUDIT ===")
    
    # 1. Profile Embedding Model Loading
    start_time = time.time()
    retriever = SemanticRetriever()
    load_time = (time.time() - start_time) * 1000
    print(f"Embedding model loading latency: {load_time:.2f} ms")
    
    # 2. Profile Embedding Generation on Transcript Chunks
    chunks = chunk_transcript(SAMPLE_TRANSCRIPT)
    print(f"Generated {len(chunks)} transcript chunks.")
    
    emb_latencies = []
    for chunk in chunks:
        t0 = time.time()
        retriever.model.encode([chunk["text"]], show_progress_bar=False)
        emb_latencies.append((time.time() - t0) * 1000)
        
    print(f"Embedding Generation Latencies (N={len(chunks)}):")
    print(f"  Average: {np.mean(emb_latencies):.2f} ms")
    print(f"  Median:  {np.median(emb_latencies):.2f} ms")
    print(f"  P95:     {np.percentile(emb_latencies, 95):.2f} ms")
    print(f"  Max:     {np.max(emb_latencies):.2f} ms")
    
    # Index the transcript for retrieval tests
    retriever.index_transcript(chunks)
    
    # 3. Profile Retrieval Latency
    ret_latencies = []
    for tc in TEST_CASES:
        t0 = time.time()
        retriever.retrieve(tc["question"], top_k=3)
        ret_latencies.append((time.time() - t0) * 1000)
        
    print(f"Retrieval Latencies (N={len(TEST_CASES)}):")
    print(f"  Average: {np.mean(ret_latencies):.2f} ms")
    print(f"  Median:  {np.median(ret_latencies):.2f} ms")
    print(f"  P95:     {np.percentile(ret_latencies, 95):.2f} ms")
    
    # 4. Profile QA System & Model Inference
    qa = QuestionAnswering()
    # Warm start model load
    t_load_0 = time.time()
    qa._load_model()
    model_load_ms = (time.time() - t_load_0) * 1000
    print(f"QA Model Loading Latency: {model_load_ms:.2f} ms")
    
    results = []
    qa_latencies = []
    
    for tc in TEST_CASES:
        t0 = time.time()
        res = qa.answer_question("meeting-prof", tc["question"], SAMPLE_TRANSCRIPT)
        qa_latencies.append((time.time() - t0) * 1000)
        
        # Check correctness based on expected keywords
        answer_lower = res["answer"].lower()
        matched = [k for k in tc["expected_keywords"] if k in answer_lower]
        score = len(matched) / len(tc["expected_keywords"])
        passed = score > 0.3 # matched at least 30% of key info
        
        results.append({
            "question": tc["question"],
            "answer": res["answer"],
            "confidence": res.get("confidence", 0.0),
            "passed": passed,
            "type": tc["type"],
            "score": score
        })
        
    print(f"QA System Latencies (N={len(TEST_CASES)}):")
    print(f"  Average: {np.mean(qa_latencies):.2f} ms")
    print(f"  Median:  {np.median(qa_latencies):.2f} ms")
    print(f"  P95:     {np.percentile(qa_latencies, 95):.2f} ms")
    
    # 5. Output results
    print("\n=== BENCHMARK CASE RESULTS ===")
    passed_cnt = sum(1 for r in results if r["passed"])
    accuracy = (passed_cnt / len(results)) * 100
    avg_conf = np.mean([r["confidence"] for r in results])
    
    for idx, r in enumerate(results):
        print(f"Q{idx+1} ({r['type']}): '{r['question']}'")
        print(f"  A: '{r['answer'][:120]}...'")
        print(f"  Confidence: {r['confidence']} | Passed: {r['passed']} (match score: {r['score']:.2f})")
        
    print(f"\nFinal Performance Metrics:")
    print(f"  Accuracy: {accuracy:.1f}%")
    print(f"  Average Confidence: {avg_conf:.3f}")
    
    # Save results as JSON for audit inclusion
    report_path = Path("backend/tests/profile_report.json")
    with open(report_path, "w") as f:
        json.dump({
            "accuracy": accuracy,
            "avg_confidence": avg_conf,
            "embedding_load_ms": load_time,
            "avg_emb_gen_ms": np.mean(emb_latencies),
            "p95_emb_gen_ms": np.percentile(emb_latencies, 95),
            "avg_retrieval_ms": np.mean(ret_latencies),
            "avg_qa_ms": np.mean(qa_latencies),
            "p95_qa_ms": np.percentile(qa_latencies, 95),
            "results": results
        }, f, indent=2)
    print(f"Saved profiling JSON report to {report_path}")

if __name__ == "__main__":
    profile_system()
