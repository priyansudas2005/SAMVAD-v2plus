from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any


class WordTimestampSchema(BaseModel):
    word: str
    start: float
    end: float
    probability: float


class TranscriptSegmentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
    metadata: Optional[Dict[str, Any]] = {}


class MemoSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    meeting_id: str
    summary: str = ""
    action_items: List[str] = []
    decisions: List[str] = []
    key_points: List[str] = []
    discussion_points: List[str] = []
    generated_at: str = ""
    confidence: float = 1.0


class QAHistorySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: str
    question: str
    answer: str
    timestamp: str
    confidence: Optional[float] = 0.0
    was_helpful: Optional[int] = None
    source_snippet: Optional[str] = None


class QAHistoryCreate(BaseModel):
    question: str


class QAFeedbackSchema(BaseModel):
    was_helpful: Optional[bool] = None


class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    meeting_id: str
    title: str
    date: str
    duration: Optional[float] = None
    audio_path: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    word_count: Optional[int] = 0
    transcript: Optional[List[TranscriptSegmentSchema]] = []
    memo: Optional[MemoSchema] = None
    qa_history: Optional[List[QAHistorySchema]] = []


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
    action_items_total: int = 0
    timeline: List[TimelineStat] = []
    keywords: List[KeywordStat] = []
    model_distribution: List[ModelStat] = []


class TranscriptSegmentUpdate(BaseModel):
    text: str
    speaker_label: Optional[str] = None


# --- Stats Module Schemas ---


class SpeakerStatSchema(BaseModel):
    speaker: str = ""
    color: str = "#8b5cf6"
    avatar: str = ""
    total_speaking_time: float = 0.0
    participation_percentage: float = 0.0
    turns: int = 0
    total_words: int = 0
    avg_confidence: float = 0.0
    avg_speaking_speed_wpm: float = 0.0
    longest_speaking_segment: float = 0.0
    interruptions_made: int = 0
    times_interrupted: int = 0
    silence_duration: float = 0.0
    first_appearance: Optional[str] = None
    last_appearance: Optional[str] = None
    contribution_summary: List[str] = []
    important_statements: List[Dict[str, Any]] = []


class SpeakerContributionSchema(BaseModel):
    speaker: str = ""
    color: str = "#8b5cf6"
    contributions: List[str] = []


class ImportantStatementSchema(BaseModel):
    speaker: str = ""
    color: str = "#8b5cf6"
    timestamp: str = ""
    start_seconds: float = 0.0
    confidence: float = 0.0
    statement: str = ""
    topic: str = ""
    segment_id: int = 0


class MeetingHighlightsSchema(BaseModel):
    biggest_decision: Optional[str] = None
    most_important_action_item: Optional[str] = None
    biggest_risk: Optional[str] = None
    biggest_blocker: Optional[str] = None
    key_deadline: Optional[str] = None
    critical_discussion: Optional[str] = None
    meeting_outcome: Optional[str] = None


class ActionItemBreakdownSchema(BaseModel):
    total: int = 0
    high_priority: int = 0
    medium_priority: int = 0
    low_priority: int = 0
    completed: int = 0
    pending: int = 0
    overdue: int = 0
    items: List[Dict[str, Any]] = []


class DecisionSummarySchema(BaseModel):
    major_decisions: List[str] = []
    technical_decisions: List[str] = []
    business_decisions: List[str] = []
    pending_decisions: List[str] = []
    open_decisions: List[str] = []


class TopicEntitySchema(BaseModel):
    name: str
    type: str
    frequency: int


class TopicsEntitiesSchema(BaseModel):
    topics: List[TopicEntitySchema] = []
    technologies: List[TopicEntitySchema] = []
    people: List[TopicEntitySchema] = []
    organizations: List[TopicEntitySchema] = []
    dates: List[TopicEntitySchema] = []
    deadlines: List[TopicEntitySchema] = []
    projects: List[TopicEntitySchema] = []
    products: List[TopicEntitySchema] = []
    keywords: List[str] = []


class AudioDiagnosticsSchema(BaseModel):
    average_loudness_db: Optional[float] = None
    peak_level_db: Optional[float] = None
    rms_db: Optional[float] = None
    noise_level_db: Optional[float] = None
    speech_coverage_percent: Optional[float] = None
    silence_percent: Optional[float] = None
    echo_detected: bool = False
    clipping_count: int = 0
    audio_enhancement_applied: bool = False
    estimated_snr_db: Optional[float] = None


class TranscriptionDiagnosticsSchema(BaseModel):
    average_confidence: float = 0.0
    highest_confidence: float = 0.0
    lowest_confidence: float = 0.0
    unknown_words: int = 0
    corrected_words: int = 0
    speaker_detection_accuracy: float = 0.0
    total_speaker_changes: int = 0
    word_error_rate: Optional[float] = None
    character_error_rate: Optional[float] = None
    low_confidence_regions: List[Dict[str, Any]] = []


class PipelineStageSchema(BaseModel):
    name: str = ""
    status: str = "pending"
    start_time: Optional[str] = None
    finish_time: Optional[str] = None
    duration_ms: Optional[float] = None


class ProcessingPipelineSchema(BaseModel):
    stages: List[PipelineStageSchema] = []


class MeetingHealthSchema(BaseModel):
    overall_score: float = 0.0
    transcript_quality: float = 0.0
    audio_quality: float = 0.0
    speaker_detection_quality: float = 0.0
    meeting_completeness: float = 0.0
    confidence_score: float = 0.0
    ai_reliability: float = 0.0
    productivity_score: float = 0.0
    meeting_effectiveness: float = 0.0
    recommendations: List[str] = []


class SmartInsightsSchema(BaseModel):
    most_active_speaker: Optional[str] = None
    least_active_speaker: Optional[str] = None
    most_technical_speaker: Optional[str] = None
    most_mentioned_topic: Optional[str] = None
    most_mentioned_technology: Optional[str] = None
    longest_discussion: Optional[str] = None
    most_questions_asked: Optional[str] = None
    most_decisions_made: Optional[str] = None
    most_tasks_assigned: Optional[str] = None
    estimated_meeting_productivity: Optional[str] = None


class MeetingStatsResponse(BaseModel):
    meeting_id: str
    meeting_title: str
    recording_date: str
    meeting_duration_s: float
    recording_duration_s: float
    processing_time_s: float
    recording_start_time: Optional[str] = None
    recording_end_time: Optional[str] = None
    total_speakers: int
    total_transcript_segments: int
    total_words: int
    total_sentences: int
    speaking_rate_wpm: float
    audio_quality_score: float
    transcript_confidence: float
    overall_meeting_score: float
    snapshot_kpis: Dict[str, Any] = {}
    speaker_statistics: List[SpeakerStatSchema] = []
    speaker_contributions: List[SpeakerContributionSchema] = []
    important_statements: List[ImportantStatementSchema] = []
    meeting_highlights: MeetingHighlightsSchema = MeetingHighlightsSchema()
    action_item_breakdown: ActionItemBreakdownSchema = ActionItemBreakdownSchema()
    decision_summary: DecisionSummarySchema = DecisionSummarySchema()
    topics_entities: TopicsEntitiesSchema = TopicsEntitiesSchema()
    audio_diagnostics: AudioDiagnosticsSchema = AudioDiagnosticsSchema()
    transcription_diagnostics: TranscriptionDiagnosticsSchema = (
        TranscriptionDiagnosticsSchema()
    )
    processing_pipeline: ProcessingPipelineSchema = ProcessingPipelineSchema()
    meeting_health: MeetingHealthSchema = MeetingHealthSchema()
    smart_insights: SmartInsightsSchema = SmartInsightsSchema()
