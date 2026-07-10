import os
import uuid
import json
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from src.services.database.db import get_db, DBMeeting, DBTranscriptSegment, DBMemo, DBQAHistory
from src.models.schemas import MeetingResponse, ProcessRequest, MeetingTitleUpdate, TranscriptSegmentUpdate
from src.services.audio.processor import AudioProcessor
from src.services.transcription import FasterWhisperSTT
from src.services.summary.generator import MemoGenerator
from src.services.export import ExportEngine
from src.services.transcript.timestamp import TimestampGenerator
from src.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/meetings", tags=["meetings"])

RECORDINGS_DIR = "backend/data/recordings"
os.makedirs(RECORDINGS_DIR, exist_ok=True)

# Helper function to convert DB model to schema response
def serialize_meeting(m: DBMeeting) -> dict:
    segments = []
    for s in m.transcript:
        seg_meta = json.loads(s.metadata_json) if s.metadata_json else {}
        segments.append({
            "id": s.id,
            "meeting_id": s.meeting_id,
            "start": s.start,
            "end": s.end,
            "start_seconds": s.start_seconds,
            "end_seconds": s.end_seconds,
            "text": s.text,
            "words": json.loads(s.words_json) if s.words_json else [],
            "speaker_label": s.speaker_label,
            "speaker_confidence": s.speaker_confidence,
            "metadata": seg_meta
        })
        
    memo_data = None
    if m.memo:
        memo_data = {
            "meeting_id": m.memo.meeting_id,
            "summary": m.memo.summary or "",
            "action_items": json.loads(m.memo.action_items_json) if m.memo.action_items_json else [],
            "decisions": json.loads(m.memo.decisions_json) if m.memo.decisions_json else [],
            "key_points": json.loads(m.memo.key_points_json) if m.memo.key_points_json else [],
            "discussion_points": json.loads(m.memo.discussion_points_json) if hasattr(m.memo, 'discussion_points_json') and m.memo.discussion_points_json else [],
            "generated_at": m.memo.generated_at or "",
            "confidence": m.memo.confidence or 1.0
        }
        
    qa_history = []
    for q in m.qa_history:
        qa_history.append({
            "id": q.id,
            "meeting_id": q.meeting_id,
            "question": q.question,
            "answer": q.answer,
            "timestamp": q.timestamp,
            "confidence": getattr(q, 'confidence', 0.0),
            "was_helpful": getattr(q, 'was_helpful', None),
            "source_snippet": getattr(q, 'source_snippet', "")
        })

    return {
        "meeting_id": m.meeting_id,
        "title": m.title,
        "date": m.date,
        "duration": m.duration,
        "audio_path": m.audio_path,
        "metadata": json.loads(m.metadata_json) if m.metadata_json else {},
        "transcript": segments,
        "memo": memo_data,
        "qa_history": qa_history
    }

@router.get("", response_model=List[MeetingResponse])
def get_meetings(db: Session = Depends(get_db)):
    meetings = db.query(DBMeeting).all()
    return [serialize_meeting(m) for m in meetings]

@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return serialize_meeting(m)

@router.get("/{meeting_id}/audio")
def get_meeting_audio(meeting_id: str, db: Session = Depends(get_db)):
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m or not m.audio_path:
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    # Try resolving path absolute, relative to CWD, or relative to project root
    path = m.audio_path
    if os.path.exists(path):
        return FileResponse(path)
        
    # If backend is running inside 'backend' folder, the path might be relative to the parent
    parent_path = os.path.join("..", path)
    if os.path.exists(parent_path):
        return FileResponse(parent_path)
        
    # If the database stored it as 'backend/data/...', but we are running in the backend directory
    if path.startswith("backend/"):
        sub_path = path[8:]
        if os.path.exists(sub_path):
            return FileResponse(sub_path)
            
    # Try search inside the standard recordings directory
    filename = os.path.basename(path)
    rec_path = os.path.join(RECORDINGS_DIR, filename)
    if os.path.exists(rec_path):
        return FileResponse(rec_path)
        
    parent_rec_path = os.path.join("..", RECORDINGS_DIR, filename)
    if os.path.exists(parent_rec_path):
        return FileResponse(parent_rec_path)

    raise HTTPException(status_code=404, detail=f"Audio file not found at {path}")



@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Try deleting audio file
    if m.audio_path and os.path.exists(m.audio_path):
        try:
            os.remove(m.audio_path)
            processed_wav = m.audio_path.replace(".wav", "_processed.wav")
            if os.path.exists(processed_wav):
                os.remove(processed_wav)
        except Exception as e:
            logger.error(f"Failed to delete audio file: {e}")
            
    db.delete(m)
    db.commit()
    return {"status": "success"}

@router.patch("/{meeting_id}", response_model=MeetingResponse)
def update_meeting_title(meeting_id: str, payload: MeetingTitleUpdate, db: Session = Depends(get_db)):
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    m.title = payload.title
    db.commit()
    db.refresh(m)
    return serialize_meeting(m)

@router.post("/upload", response_model=MeetingResponse)
def upload_meeting_audio(
    file: UploadFile = File(...),
    title: str = Form(None),
    db: Session = Depends(get_db)
):
    meeting_id = str(uuid.uuid4())
    final_title = title or file.filename.rsplit(".", 1)[0]
    
    # Save file
    file_ext = file.filename.rsplit(".", 1)[-1]
    audio_filename = f"{meeting_id}.{file_ext}"
    audio_path = os.path.join(RECORDINGS_DIR, audio_filename)
    
    with open(audio_path, "wb") as buffer:
        buffer.write(file.file.read())
        
    # Calculate duration
    duration = 0.0
    try:
        import soundfile as sf
        info = sf.info(audio_path)
        duration = info.duration
    except Exception as e:
        logger.error(f"Failed to calculate audio duration with soundfile: {e}, trying av...")
        try:
            import av
            with av.open(audio_path) as container:
                stream = container.streams.audio[0]
                # Convert time duration to float seconds
                if stream.duration and stream.time_base:
                    duration = float(stream.duration * stream.time_base)
                else:
                    # fallback if duration not in header
                    duration = float(container.duration / 1000000.0)
        except Exception as av_err:
            logger.error(f"Failed to calculate duration with av: {av_err}")
        
    meeting_data = DBMeeting(
        meeting_id=meeting_id,
        title=final_title,
        date=datetime.now().isoformat(),
        duration=duration,
        audio_path=audio_path,
        metadata_json="{}"
    )
    
    db.add(meeting_data)
    db.commit()
    db.refresh(meeting_data)
    return serialize_meeting(meeting_data)

@router.post("/{meeting_id}/process", response_model=MeetingResponse)
async def process_meeting(meeting_id: str, request: ProcessRequest, db: Session = Depends(get_db)):
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    if not m.audio_path or not os.path.exists(m.audio_path):
        raise HTTPException(status_code=400, detail="Meeting audio file not found on disk")
        
    try:
        # 1. Preprocess audio
        processor = AudioProcessor()
        processed_path = processor.preprocess_audio(m.audio_path)
        active_audio_path = processed_path if processed_path else m.audio_path
        
        # 2. Transcribe speech-to-text
        whisper_model_size = request.modelSize or "base"
        vad_filter = request.vadEnabled if request.vadEnabled is not None else None
        stt_lang = request.language
        
        stt_engine = FasterWhisperSTT(model_size=whisper_model_size)
        # Log actual vad_filter value being sent to engine
        logger.info(f"Transcription request: model_size={whisper_model_size}, vad_filter={vad_filter}, lang={stt_lang}")
        transcribe_result = stt_engine.transcribe(
            audio_path=active_audio_path,
            language=stt_lang,
            vad_filter=vad_filter
        )
        
        raw_segments = transcribe_result[0] if transcribe_result else []
        
        # 3. Speaker Diarization execution (uses float timestamps)
        try:
            from src.services.diarization import DiarizationEngine
            diar_engine = DiarizationEngine()
            logger.info(f"Diarization config: min_speakers={diar_engine.config.min_speakers}, max_speakers={diar_engine.config.max_speakers}, threshold={diar_engine.config.clustering_threshold}")
            segments = diar_engine.diarize(active_audio_path, raw_segments)
            unique_speakers = set(s.get("speaker_label", "NONE") for s in segments)
            logger.info(f"Speaker diarization completed. Speakers found: {unique_speakers}")
        except Exception as diar_err:
            logger.warning(f"Speaker diarization failed: {diar_err}. Continuing with fallback labels.")
            segments = raw_segments
            
        # 4. Intelligent Transcript Processing execution (uses float timestamps)
        try:
            from src.services.transcript import TranscriptProcessorPipeline
            pipeline = TranscriptProcessorPipeline()
            segments, meta = pipeline.process_transcript(meeting_id, segments)
            logger.info("Intelligent transcript processing completed successfully.")
        except Exception as proc_err:
            logger.warning(f"Intelligent transcript processing failed: {proc_err}. Skipping enhancements.")
            meta = {}
            
        # 5. Convert to string timestamps for storage and API response
        segments = TimestampGenerator.add_timestamps(segments)
            
        # 5. Store transcript segments
        # Clear existing
        db.query(DBTranscriptSegment).filter(DBTranscriptSegment.meeting_id == meeting_id).delete()
        
        full_text_list = []
        for seg in segments:
            full_text_list.append(seg.get("text", ""))
            
            # Pack parsed segment metadata
            seg_meta = {
                "entities": seg.get("entities", []),
                "action_items": seg.get("action_items", []),
                "decisions": seg.get("decisions", []),
                "questions": seg.get("questions", []),
                "keywords": seg.get("keywords", [])
            }
            
            db_seg = DBTranscriptSegment(
                meeting_id=meeting_id,
                start=seg.get("start"),
                end=seg.get("end"),
                start_seconds=seg.get("start_seconds"),
                end_seconds=seg.get("end_seconds"),
                text=seg.get("text", ""),
                words_json=json.dumps(seg.get("words", [])),
                speaker_label=seg.get("speaker_label", "UNKNOWN"),
                speaker_confidence=seg.get("speaker_confidence", 1.0),
                searchable_text=seg.get("searchable_text", ""),
                metadata_json=json.dumps(seg_meta)
            )
            db.add(db_seg)
            
        full_transcript = " ".join(full_text_list)
        
        # 6. Meeting Intelligence Engine
        intel_report = {}
        try:
            from src.services.intelligence import MeetingAnalyzer
            from src.services.database.db import DBMeetingIntelligence
            analyzer = MeetingAnalyzer()
            intel_report = analyzer.analyze(segments, meta.get("topics", []))
            
            # Persist structured intelligence
            db.query(DBMeetingIntelligence).filter(DBMeetingIntelligence.meeting_id == meeting_id).delete()
            db_intel = DBMeetingIntelligence(
                meeting_id=meeting_id,
                action_items_json=json.dumps(intel_report.get("action_items", [])),
                decisions_json=json.dumps(intel_report.get("decisions", [])),
                risks_json=json.dumps(intel_report.get("risks", [])),
                blockers_json=json.dumps(intel_report.get("blockers", [])),
                followups_json=json.dumps(intel_report.get("followups", [])),
                questions_json=json.dumps(intel_report.get("questions", [])),
                entities_json=json.dumps(intel_report.get("entities", {})),
                topics_json=json.dumps(intel_report.get("topics", [])),
                timeline_json=json.dumps(intel_report.get("timeline", {})),
                analytics_json=json.dumps(intel_report.get("analytics", {})),
                knowledge_graph_json=json.dumps(intel_report.get("knowledge_graph", {})),
                analysis_time_s=intel_report.get("analysis_time_s", 0.0)
            )
            db.add(db_intel)
            logger.info("Meeting intelligence analysis stored successfully.")
        except Exception as intel_err:
            logger.warning(f"Meeting intelligence analysis failed: {intel_err}. Continuing.")

        # 7. Generate structured summary / minutes
        memo_generator = MemoGenerator()
        memo_result = await memo_generator.generate_memo(meeting_id, full_transcript, intelligence=intel_report)
        
        # Store memo
        db.query(DBMemo).filter(DBMemo.meeting_id == meeting_id).delete()
        db_memo = DBMemo(
            meeting_id=meeting_id,
            summary=memo_result.get("summary"),
            action_items_json=json.dumps(intel_report.get("action_items", memo_result.get("action_items", []))),
            decisions_json=json.dumps(intel_report.get("decisions", memo_result.get("decisions", []))),
            key_points_json=json.dumps(memo_result.get("key_points", [])),
            discussion_points_json=json.dumps(memo_result.get("discussion_points", [])),
            generated_at=memo_result.get("generated_at"),
            confidence=memo_result.get("confidence", 1.0)
        )
        db.add(db_memo)
        
        # Index transcript for QA semantic search (Fix 7)
        try:
            from src.services.qa.system import index_meeting_transcript
            index_meeting_transcript(meeting_id, full_transcript, db)
        except Exception as idx_err:
            logger.error(f"Failed to index transcript for QA: {idx_err}")
        
        # Update meeting metadata (which model was used)
        meta = json.loads(m.metadata_json or "{}")
        meta["model_used"] = whisper_model_size
        m.metadata_json = json.dumps(meta)
        
        db.commit()
        db.refresh(m)
        return serialize_meeting(m)
        
    except Exception as e:
        logger.error(f"Process meeting error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Audio processing failure: {str(e)}")

@router.get("/{meeting_id}/export/{format_type}")
def export_meeting(meeting_id: str, format_type: str, db: Session = Depends(get_db)):
    from src.services.database.db import DBMeetingIntelligence
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    data = serialize_meeting(m)
    
    # Retrieve intelligence report if available
    intelligence_report = {}
    db_intel = db.query(DBMeetingIntelligence).filter(DBMeetingIntelligence.meeting_id == meeting_id).first()
    if db_intel:
        try:
            intelligence_report = {
                "action_items": json.loads(db_intel.action_items_json or "[]"),
                "decisions": json.loads(db_intel.decisions_json or "[]"),
                "risks": json.loads(db_intel.risks_json or "[]"),
                "blockers": json.loads(db_intel.blockers_json or "[]"),
                "followups": json.loads(db_intel.followups_json or "[]"),
                "questions": json.loads(db_intel.questions_json or "[]"),
                "entities": json.loads(db_intel.entities_json or "{}"),
                "topics": json.loads(db_intel.topics_json or "[]"),
                "timeline": json.loads(db_intel.timeline_json or "{}"),
            }
        except Exception:
            pass

    from src.services.export import ExportEngine
    
    fmt = format_type.lower().strip()
    if fmt not in ExportEngine.get_supported_formats():
        raise HTTPException(status_code=400, detail=f"Unsupported export format: {format_type}")
        
    try:
        content = ExportEngine.export(
            fmt=fmt,
            meeting_title=data["title"],
            date_str=data["date"],
            segments=data["transcript"],
            memo=data.get("memo"),
            intelligence=intelligence_report
        )
        
        media_types = {
            "txt": "text/plain",
            "md": "text/markdown",
            "json": "application/json",
            "srt": "text/plain",
            "vtt": "text/vtt",
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "html": "text/html",
            "csv": "text/csv",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
        
        actual_format = ExportEngine.get_actual_format(fmt)
        ext = fmt if actual_format == fmt else actual_format
        media_type = media_types.get(actual_format, media_types.get(fmt, "application/octet-stream"))
        
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={meeting_id}.{ext}"}
        )
    except Exception as exp_err:
        logger.error(f"Export failure: {exp_err}")
        raise HTTPException(status_code=500, detail=f"Failed to generate export file: {str(exp_err)}")

@router.post("/export/batch")
def export_meetings_batch(payload: dict, db: Session = Depends(get_db)):
    import zipfile
    import io
    from src.services.database.db import DBMeetingIntelligence
    from src.services.export import ExportEngine
    
    meeting_ids = payload.get("meeting_ids", [])
    fmt = payload.get("format_type", "zip").lower().strip()
    
    if not meeting_ids:
        raise HTTPException(status_code=400, detail="No meeting IDs provided")
        
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for mid in meeting_ids:
            m = db.query(DBMeeting).filter(DBMeeting.meeting_id == mid).first()
            if not m:
                continue
                
            data = serialize_meeting(m)
            
            # Retrieve intelligence report if available
            intel_report = {}
            db_intel = db.query(DBMeetingIntelligence).filter(DBMeetingIntelligence.meeting_id == mid).first()
            if db_intel:
                try:
                    intel_report = {
                        "action_items": json.loads(db_intel.action_items_json or "[]"),
                        "decisions": json.loads(db_intel.decisions_json or "[]"),
                        "risks": json.loads(db_intel.risks_json or "[]"),
                        "blockers": json.loads(db_intel.blockers_json or "[]"),
                        "followups": json.loads(db_intel.followups_json or "[]"),
                        "questions": json.loads(db_intel.questions_json or "[]"),
                        "entities": json.loads(db_intel.entities_json or "{}"),
                        "topics": json.loads(db_intel.topics_json or "[]"),
                        "timeline": json.loads(db_intel.timeline_json or "{}"),
                    }
                except Exception:
                    pass

            try:
                content = ExportEngine.export(
                    fmt=fmt,
                    meeting_title=data["title"],
                    date_str=data["date"],
                    segments=data["transcript"],
                    memo=data.get("memo"),
                    intelligence=intel_report
                )
                zip_file.writestr(f"{mid}.{fmt}", content)
            except Exception as e:
                logger.warning(f"Failed to include meeting {mid} in batch zip: {e}")

    zip_buffer.seek(0)
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=samvad_batch_export.zip"}
    )

@router.patch("/{meeting_id}/transcript/{segment_id}", response_model=MeetingResponse)
async def update_transcript_segment(
    meeting_id: str,
    segment_id: int,
    payload: TranscriptSegmentUpdate,
    db: Session = Depends(get_db)
):
    from src.services.database.db import DBTranscriptSegment
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    seg = db.query(DBTranscriptSegment).filter(
        DBTranscriptSegment.meeting_id == meeting_id,
        DBTranscriptSegment.id == segment_id
    ).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Transcript segment not found")
        
    # Update text and speaker
    seg.text = payload.text
    if payload.speaker_label:
        seg.speaker_label = payload.speaker_label
        
    # Pack edited flags in metadata
    meta = json.loads(seg.metadata_json or "{}")
    meta["is_edited"] = True
    meta["edit_timestamp"] = datetime.now().isoformat()
    seg.metadata_json = json.dumps(meta)
    
    db.commit()
    
    # Trigger downstream regenerations synchronously
    db.refresh(m)
    await regenerate_downstream_assets(m, db)
    
    db.refresh(m)
    return serialize_meeting(m)

@router.get("/{meeting_id}/analytics/speakers")
def get_speaker_analytics(meeting_id: str, db: Session = Depends(get_db)):
    from src.services.database.db import DBMeetingIntelligence
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    segments = []
    for s in m.transcript:
        seg_meta = json.loads(s.metadata_json or "{}")
        segments.append({
            "start": s.start,
            "end": s.end,
            "start_seconds": s.start_seconds,
            "end_seconds": s.end_seconds,
            "text": s.text,
            "speaker_label": s.speaker_label or "UNKNOWN",
            "speaker_confidence": s.speaker_confidence or 1.0,
            "words": json.loads(s.words_json) if s.words_json else [],
            "entities": seg_meta.get("entities", []),
            "action_items": seg_meta.get("action_items", []),
            "decisions": seg_meta.get("decisions", []),
            "questions": seg_meta.get("questions", []),
            "keywords": seg_meta.get("keywords", [])
        })
    
    # Compute per-speaker analytics
    speaker_data = {}
    total_duration = 0.0
    
    for seg in segments:
        spk = seg["speaker_label"]
        dur = (seg["end_seconds"] or 0) - (seg["start_seconds"] or 0)
        wc = len(seg["text"].split()) if seg["text"] else 0
        
        if spk not in speaker_data:
            speaker_data[spk] = {
                "speaker": spk,
                "total_speaking_time": 0.0,
                "speaking_turns": 0,
                "word_count": 0,
                "confidences": [],
                "longest_speech": 0.0,
                "statements": [],
                "entities": [],
                "action_items_assigned": [],
                "decisions_contributed": [],
                "questions_asked": [],
                "topics_discussed": [],
                "keywords": [],
                "timeline_segments": []
            }
        
        speaker_data[spk]["total_speaking_time"] += dur
        speaker_data[spk]["speaking_turns"] += 1
        speaker_data[spk]["word_count"] += wc
        if seg["speaker_confidence"]:
            speaker_data[spk]["confidences"].append(seg["speaker_confidence"])
        speaker_data[spk]["longest_speech"] = max(speaker_data[spk]["longest_speech"], dur)
        speaker_data[spk]["timeline_segments"].append({"start": seg["start"], "end": seg["end"], "duration": dur})
        
        if wc > 12 and len(speaker_data[spk]["statements"]) < 5:
            speaker_data[spk]["statements"].append(seg["text"])
        
        speaker_data[spk]["entities"].extend(seg.get("entities", []))
        speaker_data[spk]["action_items_assigned"].extend(seg.get("action_items", []))
        speaker_data[spk]["decisions_contributed"].extend(seg.get("decisions", []))
        speaker_data[spk]["questions_asked"].extend(seg.get("questions", []))
        speaker_data[spk]["keywords"].extend(seg.get("keywords", []))
        
        total_duration += dur
    
    # Incorporate intelligence data if available
    intel_data = {}
    db_intel = db.query(DBMeetingIntelligence).filter(DBMeetingIntelligence.meeting_id == meeting_id).first()
    if db_intel:
        try:
            intel_data = {
                "action_items": json.loads(db_intel.action_items_json or "[]"),
                "decisions": json.loads(db_intel.decisions_json or "[]"),
                "followups": json.loads(db_intel.followups_json or "[]"),
                "questions": json.loads(db_intel.questions_json or "[]"),
                "entities": json.loads(db_intel.entities_json or "{}"),
                "topics": json.loads(db_intel.topics_json or "[]"),
                "analytics": json.loads(db_intel.analytics_json or "{}"),
            }
        except Exception:
            pass
    
    result = []
    colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"]
    for idx, (spk, data) in enumerate(sorted(speaker_data.items())):
        avg_conf = sum(data["confidences"]) / len(data["confidences"]) if data["confidences"] else 1.0
        wpm = round(data["word_count"] / max(data["total_speaking_time"] / 60, 0.01))
        share = (data["total_speaking_time"] / max(total_duration, 0.001)) * 100
        
        # Deduplicate
        data["entities"] = list(set(data["entities"]))
        data["keywords"] = list(set(data["keywords"]))
        
        result.append({
            "speaker": spk,
            "color": colors[idx % len(colors)],
            "total_speaking_time": round(data["total_speaking_time"], 2),
            "speaking_share": round(share, 1),
            "speaking_turns": data["speaking_turns"],
            "word_count": data["word_count"],
            "avg_confidence": round(avg_conf, 4),
            "longest_speech": round(data["longest_speech"], 2),
            "speaking_speed_wpm": wpm,
            "important_statements": data["statements"],
            "timeline": data["timeline_segments"],
            "entities": data["entities"],
            "action_items": data["action_items_assigned"],
            "decisions": data["decisions_contributed"],
            "questions": data["questions_asked"],
            "keywords": data["keywords"]
        })
    
    return {
        "meeting_id": meeting_id,
        "meeting_title": m.title,
        "total_duration": round(total_duration, 2),
        "speakers": result,
        "intelligence": intel_data
    }

@router.get("/{meeting_id}/export/stats/{format_type}")
def export_meeting_statistics(meeting_id: str, format_type: str, db: Session = Depends(get_db)):
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Get speaker analytics
    from src.services.database.db import DBMeetingIntelligence
    segments = []
    for s in m.transcript:
        seg_meta = json.loads(s.metadata_json or "{}")
        segments.append({
            "start": s.start,
            "end": s.end,
            "start_seconds": s.start_seconds,
            "end_seconds": s.end_seconds,
            "text": s.text,
            "speaker_label": s.speaker_label or "UNKNOWN",
            "speaker_confidence": s.speaker_confidence or 1.0,
        })
    
    # Build stats content
    lines = []
    lines.append(f"=== MEETING STATISTICS: {m.title} ===")
    lines.append(f"Date: {m.date}")
    lines.append(f"Duration: {round(m.duration or 0, 1)}s")
    lines.append(f"Total Segments: {len(segments)}")
    lines.append("")
    
    # Speaker statistics
    speaker_stats = {}
    for seg in segments:
        spk = seg["speaker_label"]
        dur = (seg["end_seconds"] or 0) - (seg["start_seconds"] or 0)
        wc = len(seg["text"].split())
        if spk not in speaker_stats:
            speaker_stats[spk] = {"time": 0.0, "words": 0, "turns": 0}
        speaker_stats[spk]["time"] += dur
        speaker_stats[spk]["words"] += wc
        speaker_stats[spk]["turns"] += 1
    
    lines.append("--- SPEAKER ANALYTICS ---")
    for spk, st in sorted(speaker_stats.items()):
        wpm = round(st["words"] / max(st["time"] / 60, 0.01))
        lines.append(f"{spk}: {st['turns']} turns, {round(st['time'], 1)}s, {st['words']} words, {wpm} WPM")
    lines.append("")
    
    # Intelligence data
    db_intel = db.query(DBMeetingIntelligence).filter(DBMeetingIntelligence.meeting_id == meeting_id).first()
    if db_intel:
        try:
            actions = json.loads(db_intel.action_items_json or "[]")
            decisions = json.loads(db_intel.decisions_json or "[]")
            topics = json.loads(db_intel.topics_json or "[]")
            
            if actions:
                lines.append("--- ACTION ITEMS ---")
                for a in actions:
                    lines.append(f"- {a.get('task', a)} (Owner: {a.get('owner', 'N/A')}, Priority: {a.get('priority', 'MEDIUM')})")
                lines.append("")
            
            if decisions:
                lines.append("--- DECISIONS ---")
                for d in decisions:
                    lines.append(f"- {d.get('text', d)}")
                lines.append("")
            
            if topics:
                lines.append("--- TOPICS ---")
                for t in topics:
                    lines.append(f"- {t.get('topic', t)} (confidence: {t.get('confidence', 'N/A')})")
                lines.append("")
        except Exception:
            pass
    
    fmt = format_type.lower().strip()
    content = "\n".join(lines).encode("utf-8")
    
    media_types = {
        "txt": "text/plain",
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    
    return Response(
        content=content,
        media_type=media_types.get(fmt, "text/plain"),
        headers={"Content-Disposition": f"attachment; filename=statistics_{meeting_id}.{fmt}"}
    )

@router.post("/{meeting_id}/regenerate", response_model=MeetingResponse)
async def force_regenerate_intelligence(meeting_id: str, db: Session = Depends(get_db)):
    m = db.query(DBMeeting).filter(DBMeeting.meeting_id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    await regenerate_downstream_assets(m, db)
    db.refresh(m)
    return serialize_meeting(m)

async def regenerate_downstream_assets(m: DBMeeting, db: Session):
    from src.services.database.db import DBMeetingIntelligence, DBMemo
    from src.services.intelligence import MeetingAnalyzer
    
    meeting_id = m.meeting_id
    
    # 1. Rebuild segments list
    segments = []
    full_text_list = []
    for seg in m.transcript:
        full_text_list.append(seg.text)
        seg_meta = json.loads(seg.metadata_json or "{}")
        segments.append({
            "start": seg.start,
            "end": seg.end,
            "start_seconds": seg.start_seconds,
            "end_seconds": seg.end_seconds,
            "text": seg.text,
            "speaker_label": seg.speaker_label,
            "speaker_confidence": seg.speaker_confidence,
            "entities": seg_meta.get("entities", []),
            "action_items": seg_meta.get("action_items", []),
            "decisions": seg_meta.get("decisions", []),
            "questions": seg_meta.get("questions", []),
            "keywords": seg_meta.get("keywords", [])
        })
        
    full_transcript = " ".join(full_text_list)
    
    # 2. Regenerate intelligence
    try:
        analyzer = MeetingAnalyzer()
        intel_report = analyzer.analyze(segments, [])
        
        db.query(DBMeetingIntelligence).filter(DBMeetingIntelligence.meeting_id == meeting_id).delete()
        db_intel = DBMeetingIntelligence(
            meeting_id=meeting_id,
            action_items_json=json.dumps(intel_report.get("action_items", [])),
            decisions_json=json.dumps(intel_report.get("decisions", [])),
            risks_json=json.dumps(intel_report.get("risks", [])),
            blockers_json=json.dumps(intel_report.get("blockers", [])),
            followups_json=json.dumps(intel_report.get("followups", [])),
            questions_json=json.dumps(intel_report.get("questions", [])),
            entities_json=json.dumps(intel_report.get("entities", {})),
            topics_json=json.dumps(intel_report.get("topics", [])),
            timeline_json=json.dumps(intel_report.get("timeline", {})),
            analytics_json=json.dumps(intel_report.get("analytics", {})),
            knowledge_graph_json=json.dumps(intel_report.get("knowledge_graph", {})),
            analysis_time_s=intel_report.get("analysis_time_s", 0.0)
        )
        db.add(db_intel)
    except Exception as e:
        logger.warning(f"Downstream intelligence regeneration failed: {e}")
        intel_report = {}
        
    # 3. Regenerate memo
    try:
        memo_generator = MemoGenerator()
        memo_result = await memo_generator.generate_memo(meeting_id, full_transcript, intelligence=intel_report)
        
        db.query(DBMemo).filter(DBMemo.meeting_id == meeting_id).delete()
        db_memo = DBMemo(
            meeting_id=meeting_id,
            summary=memo_result.get("summary"),
            action_items_json=json.dumps(intel_report.get("action_items", memo_result.get("action_items", []))),
            decisions_json=json.dumps(intel_report.get("decisions", memo_result.get("decisions", []))),
            key_points_json=json.dumps(memo_result.get("key_points", [])),
            generated_at=memo_result.get("generated_at"),
            confidence=memo_result.get("confidence", 1.0)
        )
        db.add(db_memo)
    except Exception as e:
        logger.warning(f"Downstream summary regeneration failed: {e}")
        
    # 4. Reindex for QA QA history
    try:
        from src.services.qa.system import index_meeting_transcript
        index_meeting_transcript(meeting_id, full_transcript, db)
    except Exception as e:
        logger.error(f"Downstream reindexing failed: {e}")
        
    db.commit()
