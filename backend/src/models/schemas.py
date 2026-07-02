from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class WordTimestampSchema(BaseModel):
    word: str
    start: float
    end: float
    probability: float

class TranscriptSegmentSchema(BaseModel):
    id: int
    meeting_id: str
    start: Optional[str] = None
    end: Optional[str] = None
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None
    text: str
    words: Optional[List[WordTimestampSchema]] = []
    speaker_label: Optional[str] = "UNKNOWN"
    speaker_confidence: Optional[float] = 1.0

    class Config:
        from_attributes = True

class MemoSchema(BaseModel):
    meeting_id: str
    summary: Optional[str] = None
    action_items: List[str] = []
    decisions: List[str] = []
    key_points: List[str] = []
    generated_at: Optional[str] = None
    confidence: Optional[float] = 1.0

    class Config:
        from_attributes = True

class QAHistorySchema(BaseModel):
    id: int
    meeting_id: str
    question: str
    answer: str
    timestamp: str
    confidence: Optional[float] = 0.0
    was_helpful: Optional[int] = None
    source_snippet: Optional[str] = None

    class Config:
        from_attributes = True

class QAHistoryCreate(BaseModel):
    question: str

class QAFeedbackSchema(BaseModel):
    was_helpful: Optional[bool] = None

class MeetingResponse(BaseModel):
    meeting_id: str
    title: str
    date: str
    duration: Optional[float] = None
    audio_path: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    transcript: Optional[List[TranscriptSegmentSchema]] = []
    memo: Optional[MemoSchema] = None
    qa_history: Optional[List[QAHistorySchema]] = []

    class Config:
        from_attributes = True

class MeetingTitleUpdate(BaseModel):
    title: str

class SystemSettingsSchema(BaseModel):
    model_size: str
    default_language: str
    vad_enabled: bool
    ollama_url: Optional[str] = "http://localhost:11434"
    db_path: Optional[str] = ""
    native_audio_available: Optional[bool] = True

class ProcessRequest(BaseModel):
    modelSize: Optional[str] = None
    language: Optional[str] = None
    vadEnabled: Optional[bool] = None

class KeywordStat(BaseModel):
    text: str
    value: int

class TimelineStat(BaseModel):
    date: str
    duration: float
    words: int

class ModelStat(BaseModel):
    name: str
    value: int

class AnalyticsSummarySchema(BaseModel):
    meetings_count: int
    duration_total: float
    words_total: int
    avg_duration: float
    avg_words: float
    keywords_cloud: List[KeywordStat] = []
    timeline: List[TimelineStat] = []
    models_breakdown: List[ModelStat] = []

class TranscriptSegmentUpdate(BaseModel):
    text: str
    speaker_label: Optional[str] = None
