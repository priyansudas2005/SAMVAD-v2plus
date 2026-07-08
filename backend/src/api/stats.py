import json
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.services.database.db import get_db, DBMeeting, DBMeetingIntelligence
from src.models.schemas import MeetingStatsResponse
from src.services.stats import StatsEngine
from src.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/meetings", tags=["stats"])


@router.get("/{meeting_id}/stats", response_model=MeetingStatsResponse)
def get_meeting_stats(meeting_id: str, db: Session = Depends(get_db)):
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")

    try:
        engine = StatsEngine(meeting_id, db)
        stats = engine.compute()
        return stats
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Stats computation failed for {meeting_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Stats computation failed: {str(e)}")


@router.get("/{meeting_id}/stats/export/{format_type}")
def export_meeting_stats(meeting_id: str, format_type: str, db: Session = Depends(get_db)):
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")

    try:
        engine = StatsEngine(meeting_id, db)
        stats = engine.compute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats computation failed: {str(e)}")

    fmt = format_type.lower().strip()

    if fmt == "json":
        content = json.dumps(stats, indent=2, default=str).encode("utf-8")
        media_type = "application/json"
        ext = "json"
    elif fmt == "txt":
        lines = _stats_to_text(stats)
        content = "\n".join(lines).encode("utf-8")
        media_type = "text/plain"
        ext = "txt"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported stats export format: {format_type}")

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename=stats_{meeting_id}.{ext}"}
    )


def _stats_to_text(stats: dict) -> list:
    lines = []
    lines.append(f"=== MEETING STATISTICS: {stats.get('meeting_title', 'N/A')} ===")
    lines.append(f"Date: {stats.get('recording_date', 'N/A')}")
    lines.append(f"Duration: {stats.get('meeting_duration_s', 0):.1f}s")
    lines.append(f"Total Speakers: {stats.get('total_speakers', 0)}")
    lines.append(f"Total Words: {stats.get('total_words', 0)}")
    lines.append(f"Speaking Rate: {stats.get('speaking_rate_wpm', 0)} WPM")
    lines.append(f"Transcript Confidence: {stats.get('transcript_confidence', 0):.2%}")
    lines.append("")

    # Speaker stats
    lines.append("--- SPEAKER STATISTICS ---")
    for spk in stats.get("speaker_statistics", []):
        lines.append(
            f"{spk['speaker']}: {spk['turns']} turns, "
            f"{spk['total_speaking_time']:.1f}s ({spk['participation_percentage']:.1f}%), "
            f"{spk['total_words']} words, {spk['avg_speaking_speed_wpm']} WPM, "
            f"conf: {spk['avg_confidence']:.2%}"
        )
    lines.append("")

    # Highlights
    highlights = stats.get("meeting_highlights", {})
    if highlights.get("biggest_decision"):
        lines.append(f"Biggest Decision: {highlights['biggest_decision']}")
    if highlights.get("most_important_action_item"):
        lines.append(f"Top Action: {highlights['most_important_action_item']}")
    if highlights.get("meeting_outcome"):
        lines.append(f"Outcome: {highlights['meeting_outcome']}")
    lines.append("")

    # Action items
    ai_breakdown = stats.get("action_item_breakdown", {})
    lines.append(f"--- ACTION ITEMS ({ai_breakdown.get('total', 0)} total) ---")
    lines.append(f"  High: {ai_breakdown.get('high_priority', 0)}")
    lines.append(f"  Medium: {ai_breakdown.get('medium_priority', 0)}")
    lines.append(f"  Low: {ai_breakdown.get('low_priority', 0)}")
    lines.append(f"  Pending: {ai_breakdown.get('pending', 0)}")
    lines.append(f"  Completed: {ai_breakdown.get('completed', 0)}")
    lines.append("")

    # Health
    health = stats.get("meeting_health", {})
    lines.append(f"--- MEETING HEALTH ---")
    lines.append(f"Overall Score: {health.get('overall_score', 0):.0f}/100")
    lines.append(f"Transcript Quality: {health.get('transcript_quality', 0):.0f}/100")
    lines.append(f"Productivity Score: {health.get('productivity_score', 0):.0f}/100")
    lines.append(f"Effectiveness: {health.get('meeting_effectiveness', 0):.0f}/100")
    lines.append("")

    # Insights
    insights = stats.get("smart_insights", {})
    if insights.get("most_active_speaker"):
        lines.append(f"Most Active: {insights['most_active_speaker']}")
    if insights.get("most_mentioned_topic"):
        lines.append(f"Top Topic: {insights['most_mentioned_topic']}")
    lines.append("")

    # Diagnostics
    audio = stats.get("audio_diagnostics", {})
    lines.append(f"--- AUDIO DIAGNOSTICS ---")
    if audio.get("estimated_snr_db"):
        lines.append(f"  Estimated SNR: {audio['estimated_snr_db']} dB")
    lines.append(f"  Speech Coverage: {audio.get('speech_coverage_percent', 'N/A')}%")

    return lines
