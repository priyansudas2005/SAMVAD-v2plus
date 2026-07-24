export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  probability: number;
}

export interface TranscriptSegment {
  id: number;
  meeting_id: string;
  start: string;
  end: string;
  start_seconds: number;
  end_seconds: number;
  text: string;
  words?: WordTimestamp[];
  speaker_label?: string;
  speaker_confidence?: number;
  metadata?: {
    is_edited?: boolean;
    edit_timestamp?: string;
    entities?: string[];
    action_items?: string[];
    decisions?: string[];
    questions?: string[];
    keywords?: string[];
  };
}

export interface SpeakerRef {
  speaker_id: string;
  display_name: string;
  color?: string;
}

export interface TranscriptRef {
  segment_id: string | number;
  timestamp: string;
}

export interface KeyTopicItem {
  id: string;
  title: string;
  references?: TranscriptRef[];
}

export interface MeetingOutcomeObj {
  status: string;
  overall_result: string;
  business_impact: string;
  confidence: number;
}

export interface MeetingHealthObj {
  productivity_score: number;
  decision_quality: number;
  actionability: number;
  participation_balance: number;
  overall_rating: string;
}

export interface OverviewSection {
  executive_summary: string;
  meeting_outcome?: string | MeetingOutcomeObj;
  meeting_health?: MeetingHealthObj;
  key_topics?: KeyTopicItem[];
}

export interface DecisionItem {
  id: string;
  title?: string;
  decision: string;
  confidence: number;
  needs_human_review?: boolean;
  references?: TranscriptRef[];
}

export interface ActionItemObj {
  id: string;
  task: string;
  owner?: SpeakerRef | string | null;
  priority: 'High' | 'Medium' | 'Low';
  severity?: 'Critical' | 'High' | 'Moderate' | 'Low';
  deadline?: string;
  confidence: number;
  needs_human_review?: boolean;
  references?: TranscriptRef[];
}

export interface PendingDecisionItem {
  id: string;
  topic: string;
  status: string;
  current_status?: string;
  related_discussion?: string;
  suggested_follow_up?: string;
  priority?: string;
  severity?: string;
  confidence: number;
  needs_human_review?: boolean;
  references?: TranscriptRef[];
}

export interface ExecutionSection {
  decisions: DecisionItem[];
  action_items: ActionItemObj[];
  pending_decisions?: PendingDecisionItem[];
}

export interface IntelligenceItem {
  id: string;
  category?: 'Risk' | 'Blocker' | 'Dependency' | 'Open Question' | 'Missing Info';
  title?: string;
  risk?: string;
  blocker?: string;
  dependent_task?: string;
  relies_on?: string;
  question?: string;
  item?: string;
  affected_area?: string;
  evidence?: string;
  current_status?: string;
  suggested_resolution?: string;
  suggested_owner?: string;
  required_before?: string;
  priority?: 'High' | 'Medium' | 'Low';
  severity?: 'Critical' | 'High' | 'Moderate' | 'Low';
  confidence: number;
  needs_human_review?: boolean;
  speaker?: SpeakerRef | string;
  asked_by?: SpeakerRef | string;
  promised_by?: SpeakerRef | string;
  references?: TranscriptRef[];
  followUp?: string;
}

export interface IntelligenceSection {
  risks?: IntelligenceItem[];
  blockers?: IntelligenceItem[];
  dependencies?: IntelligenceItem[];
  open_questions?: IntelligenceItem[];
  missing_information?: IntelligenceItem[];
}

export interface AIRecommendationItem {
  id: string;
  recommendation: string;
  reason: string;
  related_item?: string;
  related_decision_or_risk?: string;
  confidence: number;
  needs_human_review?: boolean;
  references?: TranscriptRef[];
}

export interface FollowUpMeetingObj {
  id?: string;
  proposed: boolean;
  topic: string;
  why_needed?: string;
  suggested_participants?: (SpeakerRef | string)[];
  suggested_duration?: string;
  suggested_agenda?: string[];
  expected_outcomes?: string[];
  target_date?: string;
  suggested_timeframe?: string;
  confidence: number;
}

export interface SuggestedEmailObj {
  id?: string;
  subject: string;
  greeting?: string;
  executive_summary?: string;
  decisions?: string[];
  action_items?: string[];
  deadlines?: string;
  closing?: string;
  body?: string;
}

export interface ExecutiveDecisionSnapshotObj {
  meeting_status: 'Completed Successfully' | 'In Progress' | 'Needs Follow-up' | string;
  decision_confidence: number;
  execution_readiness: 'High' | 'Medium' | 'Low' | string;
  follow_up_priority: 'High' | 'Medium' | 'Low' | string;
}

export interface FollowUpSection {
  ai_recommendations?: AIRecommendationItem[];
  follow_up_meeting?: FollowUpMeetingObj;
  suggested_email?: SuggestedEmailObj;
  decision_snapshot?: ExecutiveDecisionSnapshotObj;
}

export interface StructuredMemo {
  meeting_id: string;
  summary?: string;
  action_items?: string[];
  decisions?: string[];
  key_points?: string[];
  generated_at?: string;
  confidence?: number;
  overview?: OverviewSection;
  execution?: ExecutionSection;
  intelligence?: IntelligenceSection;
  follow_up?: FollowUpSection;
}

export interface Memo extends StructuredMemo {}

export interface QAEntry {
  id?: number;
  meeting_id: string;
  question: string;
  answer: string;
  timestamp: string;
  confidence?: number;
  was_helpful?: number | null;
  source_snippet?: string;
}

export interface Meeting {
  meeting_id: string;
  title: string;
  date: string;
  duration: number;
  audio_path?: string;
  metadata?: Record<string, any>;
  transcript?: TranscriptSegment[];
  memo?: Memo;
  qa_history?: QAEntry[];
}

export interface SystemSettings {
  model_size: string;
  default_language: string;
  vad_enabled: boolean;
  ollama_url?: string;
  db_path?: string;
  native_audio_available?: boolean;
}

export interface AnalyticsSummary {
  meetings_count: number;
  duration_total: number;
  words_total: number;
  action_items_total: number;
  timeline: { date: string; duration: number; words: number }[];
  keywords: { text: string; value: number }[];
  model_distribution: { name: string; value: number }[];
}

// --- Stats Types ---
export interface SpeakerStat {
  speaker: string;
  color: string;
  avatar: string;
  total_speaking_time: number;
  participation_percentage: number;
  turns: number;
  total_words: number;
  avg_confidence: number;
  avg_speaking_speed_wpm: number;
  longest_speaking_segment: number;
  interruptions_made: number;
  times_interrupted: number;
  silence_duration: number;
  first_appearance: string | null;
  last_appearance: string | null;
  contribution_summary: string[];
  important_statements: any[];
}

export interface SpeakerContribution {
  speaker: string;
  color: string;
  contributions: string[];
}

export interface ImportantStatement {
  speaker: string;
  color: string;
  timestamp: string;
  start_seconds: number;
  confidence: number;
  statement: string;
  topic: string;
  segment_id: number;
}

export interface MeetingHighlights {
  biggest_decision: string | null;
  most_important_action_item: string | null;
  biggest_risk: string | null;
  biggest_blocker: string | null;
  key_deadline: string | null;
  critical_discussion: string | null;
  meeting_outcome: string | null;
}

export interface ActionItemBreakdown {
  total: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  completed: number;
  pending: number;
  overdue: number;
  items: any[];
}

export interface DecisionSummary {
  major_decisions: string[];
  technical_decisions: string[];
  business_decisions: string[];
  pending_decisions: string[];
  open_decisions: string[];
}

export interface TopicEntity {
  name: string;
  type: string;
  frequency: number;
}

export interface TopicsEntities {
  topics: TopicEntity[];
  technologies: TopicEntity[];
  people: TopicEntity[];
  organizations: TopicEntity[];
  dates: TopicEntity[];
  deadlines: TopicEntity[];
  projects: TopicEntity[];
  products: TopicEntity[];
  keywords: string[];
}

export interface AudioDiagnostics {
  average_loudness_db: number | null;
  peak_level_db: number | null;
  rms_db: number | null;
  noise_level_db: number | null;
  speech_coverage_percent: number | null;
  silence_percent: number | null;
  echo_detected: boolean;
  clipping_count: number;
  audio_enhancement_applied: boolean;
  estimated_snr_db: number | null;
}

export interface TranscriptionDiagnostics {
  average_confidence: number;
  highest_confidence: number;
  lowest_confidence: number;
  unknown_words: number;
  corrected_words: number;
  speaker_detection_accuracy: number;
  total_speaker_changes: number;
  word_error_rate: number | null;
  character_error_rate: number | null;
  low_confidence_regions: any[];
}

export interface PipelineStage {
  name: string;
  status: string;
  start_time: string | null;
  finish_time: string | null;
  duration_ms: number | null;
}

export interface ProcessingPipeline {
  stages: PipelineStage[];
}

export interface MeetingHealth {
  overall_score: number;
  transcript_quality: number;
  audio_quality: number;
  speaker_detection_quality: number;
  meeting_completeness: number;
  confidence_score: number;
  ai_reliability: number;
  productivity_score: number;
  meeting_effectiveness: number;
  recommendations: string[];
}

export interface SmartInsights {
  most_active_speaker: string | null;
  least_active_speaker: string | null;
  most_technical_speaker: string | null;
  most_mentioned_topic: string | null;
  most_mentioned_technology: string | null;
  longest_discussion: string | null;
  most_questions_asked: string | null;
  most_decisions_made: string | null;
  most_tasks_assigned: string | null;
  estimated_meeting_productivity: string | null;
}

export interface MeetingStats {
  meeting_id: string;
  meeting_title: string;
  recording_date: string;
  meeting_duration_s: number;
  recording_duration_s: number;
  processing_time_s: number;
  recording_start_time: string | null;
  recording_end_time: string | null;
  total_speakers: number;
  total_transcript_segments: number;
  total_words: number;
  total_sentences: number;
  speaking_rate_wpm: number;
  audio_quality_score: number;
  transcript_confidence: number;
  overall_meeting_score: number;
  snapshot_kpis: Record<string, any>;
  speaker_statistics: SpeakerStat[];
  speaker_contributions: SpeakerContribution[];
  important_statements: ImportantStatement[];
  meeting_highlights: MeetingHighlights;
  action_item_breakdown: ActionItemBreakdown;
  decision_summary: DecisionSummary;
  topics_entities: TopicsEntities;
  audio_diagnostics: AudioDiagnostics;
  transcription_diagnostics: TranscriptionDiagnostics;
  processing_pipeline: ProcessingPipeline;
  meeting_health: MeetingHealth;
  smart_insights: SmartInsights;
}
