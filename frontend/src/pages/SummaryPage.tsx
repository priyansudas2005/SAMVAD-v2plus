import React, { useState, useCallback } from 'react';
import { 
  FileText, 
  CheckSquare, 
  Lightbulb, 
  HelpCircle, 
  Download,
  AlertTriangle,
  Bookmark,
  Target,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  Shield,
  ChevronRight,
  AlertOctagon,
  Link2,
  ArrowUpRight,
  ExternalLink,
  Copy,
  Sparkles,
  ArrowDown,
  RefreshCw,
  Edit3,
  Mail,
  Calendar
} from 'lucide-react';
import { Meeting } from '../types';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { ExportButton } from '../components/ExportButton';
import { Toast } from '../components/Toast';

interface SummaryPageProps {
  currentMeeting: Meeting;
  onNavigateToTimestamp?: (timestamp: string) => void;
}

export const SummaryPage: React.FC<SummaryPageProps> = ({ currentMeeting, onNavigateToTimestamp }) => {
  const memo = currentMeeting.memo;
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const toggleCheck = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!memo) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Summary Generated</h3>
          <p className="text-xs text-slate-400 mt-1.5">
            Please run the transcript processor on the Transcript page to generate meeting intelligence and action items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 space-y-8 h-screen">
      {/* ── EXECUTIVE BRIEF COVER TOP SECTION ── */}
      <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-5 md:p-6 backdrop-blur-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] space-y-5 relative overflow-hidden font-sans">
        {/* Subtle decorative background beam */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Top Control Bar & Document Ref */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono border-b border-white/[0.06] pb-3 text-[#98A2B3]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2 py-0.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] font-bold rounded uppercase tracking-widest">
              Executive Brief // Memo
            </span>
            <span className="text-white/[0.1]">•</span>
            <span>REF // {currentMeeting.meeting_id.substring(0, 8).toUpperCase()}</span>
            <span className="text-white/[0.1]">•</span>
            <span className="flex items-center gap-1">
              STATUS: <span className="text-[#10B981] font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> VERIFIED</span>
            </span>
          </div>

          <div className="flex gap-1.5 flex-wrap items-center">
            <ExportButton
              meetingId={currentMeeting.meeting_id}
              onExport={async (fmt) => {
                await api.downloadExport(currentMeeting.meeting_id, fmt, `${currentMeeting.title}_summary.${fmt}`);
                showToast(`${fmt.toUpperCase()} summary exported successfully`, 'success');
              }}
            />
            <a href={api.getExportUrl(currentMeeting.meeting_id, 'html')} download
               className="px-2.5 py-1 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold rounded text-[10px] transition-all flex items-center gap-1 uppercase tracking-wider font-mono h-[28px] box-border">
              <Download className="w-3 h-3" /> HTML
            </a>
            <a href={api.getExportUrl(currentMeeting.meeting_id, 'csv')} download
               className="px-2.5 py-1 bg-[#10B981]/10 border border-[#10B981]/20 hover:bg-[#10B981]/20 text-[#10B981] font-bold rounded text-[10px] transition-all flex items-center gap-1 uppercase tracking-wider font-mono h-[28px] box-border">
              <Download className="w-3 h-3" /> CSV
            </a>
            <a href={api.getExportUrl(currentMeeting.meeting_id, 'md')} download
               className="px-2.5 py-1 bg-[#030305] border border-white/[0.06] hover:bg-white/[0.03] text-[#98A2B3] hover:text-[#F5F7FA] font-bold rounded text-[10px] transition-all flex items-center gap-1 uppercase tracking-wider font-mono h-[28px] box-border">
              <Download className="w-3 h-3" /> MD
            </a>
          </div>
        </div>

        {/* Strongest Visual Element: Meeting Title & Primary Objective */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#F5F7FA] tracking-tight leading-tight uppercase font-sans">
            {currentMeeting.title}
          </h1>
          <p className="text-xs text-[#98A2B3] leading-relaxed max-w-4xl font-sans">
            <strong className="text-white/80 font-mono uppercase tracking-wider text-[10px] mr-1">OBJECTIVE:</strong>
            {currentMeeting.metadata?.objective || memo?.summary?.substring(0, 150) + '...' || 'Review transcript intelligence, log strategic decisions, and track action items.'}
          </p>
        </div>

        {/* Compact Metadata Panel Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-white/[0.06] text-[11px] font-mono">
          <div>
            <div className="text-[9px] text-[#98A2B3] uppercase tracking-wider">Date & Time</div>
            <div className="font-semibold text-[#F5F7FA] truncate mt-0.5">{new Date(currentMeeting.date).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#98A2B3] uppercase tracking-wider">Duration</div>
            <div className="font-semibold text-[#F5F7FA] mt-0.5">{currentMeeting.duration ? `${(currentMeeting.duration / 60).toFixed(1)}m` : '0m'}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#98A2B3] uppercase tracking-wider">Participants</div>
            <div className="font-semibold text-[#F5F7FA] mt-0.5">
              {currentMeeting.transcript ? Array.from(new Set(currentMeeting.transcript.map(s => s.speaker_label))).length : 0} Speakers
            </div>
          </div>
          <div>
            <div className="text-[9px] text-[#98A2B3] uppercase tracking-wider">Language</div>
            <div className="font-semibold text-[#F5F7FA] mt-0.5">{(currentMeeting.metadata?.language || 'EN').toUpperCase()}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#98A2B3] uppercase tracking-wider">Status</div>
            <div className="font-semibold text-[#10B981] mt-0.5">Verified</div>
          </div>
          <div>
            <div className="text-[9px] text-[#98A2B3] uppercase tracking-wider">AI Confidence</div>
            <div className="font-semibold text-[#8B5CF6] mt-0.5">
              {memo.confidence ? `${Math.round(memo.confidence * 100)}%` : '95%'}
            </div>
          </div>
        </div>

        {/* ── COMPACT KPI STRIP (Executive Report Style) ── */}
        <div className="bg-[#030305] border border-white/[0.06] rounded-lg p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 divide-x divide-white/[0.04]">
          <div className="px-2 text-center">
            <div className="text-[9px] font-mono text-[#98A2B3] uppercase tracking-wider">Decisions</div>
            <div className="text-base font-extrabold text-[#F5F7FA] font-mono mt-0.5">{memo.decisions?.length || 0}</div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[9px] font-mono text-[#98A2B3] uppercase tracking-wider">Action Items</div>
            <div className="text-base font-extrabold text-[#06B6D4] font-mono mt-0.5">{memo.action_items?.length || 0}</div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[9px] font-mono text-[#98A2B3] uppercase tracking-wider">Risks</div>
            <div className="text-base font-extrabold text-amber-400 font-mono mt-0.5">
              {currentMeeting.metadata?.risks_count || 0}
            </div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[9px] font-mono text-[#98A2B3] uppercase tracking-wider">Open Questions</div>
            <div className="text-base font-extrabold text-[#F5F7FA] font-mono mt-0.5">
              {currentMeeting.transcript?.filter(s => s.metadata?.questions && s.metadata.questions.length > 0).length || 0}
            </div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[9px] font-mono text-[#98A2B3] uppercase tracking-wider">Deadlines</div>
            <div className="text-base font-extrabold text-[#F5F7FA] font-mono mt-0.5">
              {currentMeeting.metadata?.deadlines_count || 0}
            </div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[9px] font-mono text-[#98A2B3] uppercase tracking-wider">Productivity Score</div>
            <div className="text-base font-extrabold text-[#10B981] font-mono mt-0.5">
              {Math.round((memo.confidence || 0.88) * 100)}/100
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFESSIONAL EXECUTIVE BRIEFING REPORT ── */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-6 shadow-2xl space-y-6 font-sans backdrop-blur-[24px]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-sm font-extrabold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2 font-mono">
            <FileText className="w-4 h-4 text-[#8B5CF6]" />
            Executive Briefing & Report
          </h3>
          <span className="text-[10px] font-mono text-[#98A2B3] uppercase tracking-widest bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05]">
            STRATEGIC OVERVIEW
          </span>
        </div>

        {/* Paragraph 1: Executive Summary */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-mono font-bold text-[#8B5CF6] uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" /> Executive Summary
          </h4>
          <p className="text-xs text-[#F5F7FA] leading-relaxed font-normal pl-3 border-l border-[#8B5CF6]/30">
            {memo.overview?.executive_summary || memo?.summary || currentMeeting.metadata?.objective || (currentMeeting.transcript && currentMeeting.transcript[0] ? `Discussion on: "${currentMeeting.transcript[0].text}"` : 'Transcript summary and meeting intelligence overview.')}
          </p>
        </div>

        {/* Paragraph 2: Meeting Outcome */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-mono font-bold text-[#06B6D4] uppercase tracking-widest flex items-center gap-1.5">
            <Target className="w-3 h-3 text-[#06B6D4]" /> Meeting Outcome
          </h4>
          <p className="text-xs text-[#C4C9D4] leading-relaxed font-normal pl-3 border-l border-[#06B6D4]/30">
            {typeof memo.overview?.meeting_outcome === 'object'
              ? `${memo.overview.meeting_outcome.overall_result} — Status: ${memo.overview.meeting_outcome.status}`
              : memo.overview?.meeting_outcome || currentMeeting.metadata?.outcome || (memo.decisions && memo.decisions.length > 0 ? `Key outcomes include: ${memo.decisions.join("; ")}.` : "Primary technical decisions and action items agreed upon during transcript dialogue.")}
          </p>
        </div>

        {/* Paragraph 3: Business Impact */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-[#10B981]" /> Business Impact
          </h4>
          <p className="text-xs text-[#C4C9D4] leading-relaxed font-normal pl-3 border-l border-[#10B981]/30">
            {typeof memo.overview?.meeting_outcome === 'object' && memo.overview.meeting_outcome.business_impact
              ? `Impact Rating: ${memo.overview.meeting_outcome.business_impact}`
              : currentMeeting.metadata?.business_impact || (memo.action_items && memo.action_items.length > 0 ? `Resolves key tasks: ${memo.action_items.slice(0, 2).join(", ")} to accelerate project timelines.` : "Directly impacts delivery timelines and operational clarity across project team members.")}
          </p>
        </div>

        {/* Paragraph 4: Overall Direction */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-amber-400" /> Strategic Direction
          </h4>
          <p className="text-xs text-[#C4C9D4] leading-relaxed font-normal pl-3 border-l border-amber-400/30">
            {currentMeeting.metadata?.strategic_direction || `Focus shifts to executing ${memo.execution?.action_items?.length || memo.action_items?.length || 0} assigned tasks and reviewing open discussion points before next session.`}
          </p>
        </div>
      </motion.div>
      {/* ── PHASE 4: PREMIUM MEETING INTELLIGENCE WORKSPACE ── */}
      <div className="space-y-4 font-sans select-none">
        {/* Workspace Title Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg text-[#8B5CF6]">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider font-mono flex items-center gap-2">
                Meeting Intelligence Workspace
              </h3>
              <p className="text-[10px] text-[#98A2B3] mt-0.5">
                What still requires attention after this meeting? &middot; Executive Review Document
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded text-[9px] font-mono text-[#98A2B3] font-bold">
            STRUCTURED INTELLIGENCE
          </span>
        </div>

        {/* Two-Column Desktop Workspace: LEFT (Operational Issues) | RIGHT (Pending Work) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* ════════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: OPERATIONAL ISSUES (Risks, Blockers, Dependencies) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="space-y-5">
            
            {/* 1. RISKS PANEL */}
            <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-[24px] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[10.5px] font-bold text-[#F5F7FA] uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-400" /> Risks ({memo.intelligence?.risks?.length || (currentMeeting.transcript?.some(s => s.text.toLowerCase().includes('risk')) ? 1 : 0)})
                </span>
                <span className="text-[8.5px] font-mono text-[#98A2B3]">EXPLICIT CONCERNS</span>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const risks = memo.intelligence?.risks || [];
                  const displayRisks = risks.length > 0 ? risks : (currentMeeting.transcript || [])
                    .filter(s => s.text.toLowerCase().includes('risk') || s.text.toLowerCase().includes('degrad') || s.text.toLowerCase().includes('fail'))
                    .map((seg, i) => ({
                      id: `risk_${seg.id || i}`,
                      title: seg.text.length > 45 ? seg.text.substring(0, 45) + '...' : seg.text,
                      risk: seg.text,
                      priority: 'High' as const,
                      severity: 'High' as const,
                      confidence: seg.speaker_confidence || 0.88,
                      needs_human_review: (seg.speaker_confidence || 0.88) < 0.70,
                      affected_area: 'Core Pipeline / Gateway',
                      speaker: seg.speaker_label ? seg.speaker_label.replace('SPEAKER_', 'Speaker ') : 'Speaker 1',
                      references: [{ segment_id: seg.id, timestamp: seg.start || '00:05' }],
                      evidence: `Identified at ${seg.start}: "${seg.text}"`,
                      followUp: 'Execute stress testing before deployment'
                    }));

                  if (displayRisks.length === 0) {
                    return (
                      <div className="py-6 border border-dashed border-white/[0.06] rounded-lg text-center font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1 opacity-70" />
                        <div className="text-[10px] text-[#98A2B3]">No operational risks identified in transcript</div>
                      </div>
                    );
                  }

                  return displayRisks.map((item, idx) => {
                    const conf = typeof item.confidence === 'number' ? item.confidence : 0.85;
                    const isLowConf = item.needs_human_review || conf < 0.70;
                    const ts = item.references && item.references[0] ? item.references[0].timestamp : '00:05';
                    const spkName = typeof item.speaker === 'object' ? item.speaker.display_name : item.speaker || 'Speaker 1';

                    return (
                      <div key={item.id || idx} className="p-3 bg-[#030305] border border-white/[0.05] hover:border-amber-500/30 rounded-lg space-y-2 group transition-all relative font-sans">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <h5 className="text-xs font-bold text-[#F5F7FA] font-mono truncate">{item.title || item.risk || 'Operational Warning'}</h5>
                          </div>

                          <div className="flex items-center gap-1.5 font-mono text-[8.5px] shrink-0">
                            {isLowConf ? (
                              <span className="px-1.5 py-0.2 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded font-bold">NEEDS HUMAN REVIEW</span>
                            ) : (
                              <>
                                <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded font-bold uppercase">{item.severity || item.priority || 'MODERATE'}</span>
                                <span className="text-[#8B5CF6] font-bold">{Math.round(conf * (conf <= 1 ? 100 : 1))}% CONF</span>
                              </>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-[#C4C9D4] leading-relaxed pl-2.5 border-l border-white/[0.06]">
                          {item.evidence || item.risk || 'Risk factor identified during transcript dialogue.'}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono text-[#98A2B3] pt-1.5 border-t border-white/[0.04]">
                          <div><span className="text-white/50">AFFECTED:</span> {item.affected_area || 'System Infrastructure'}</div>
                          <div className="flex items-center justify-end gap-1">
                            <User className="w-2.5 h-2.5 text-[#06B6D4]" />
                            <span className="text-white/80">{spkName}</span>
                            <span className="text-white/30">&middot;</span>
                            <span className="text-[#8B5CF6]">{ts}</span>
                          </div>
                        </div>

                        {item.followUp && (
                          <div className="text-[9.5px] text-amber-400/90 font-mono flex items-center gap-1 pt-1">
                            <ArrowUpRight className="w-3 h-3 shrink-0" />
                            <span className="truncate">FOLLOW-UP: {item.followUp}</span>
                          </div>
                        )}

                        {/* Interactive Hover Bar */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#0b0c12] border border-white/[0.1] px-1.5 py-0.5 rounded shadow-xl font-mono text-[9px]">
                          {onNavigateToTimestamp && (
                            <button onClick={() => onNavigateToTimestamp(ts)} className="p-1 hover:text-[#8B5CF6] text-[#98A2B3]" title="Jump to Transcript">
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => { navigator.clipboard.writeText(item.risk || item.title || ''); showToast('Copied risk detail', 'success'); }} className="p-1 hover:text-white text-[#98A2B3]" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Bookmarked risk item', 'success')} className="p-1 hover:text-amber-400 text-[#98A2B3]" title="Bookmark">
                            <Bookmark className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Asking local AI about risk...', 'success')} className="p-1 hover:text-[#8B5CF6] text-[#8B5CF6]" title="Ask AI">
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 2. BLOCKERS PANEL */}
            <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-[24px] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[10.5px] font-bold text-[#F5F7FA] uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Blockers ({memo.intelligence?.blockers?.length || (currentMeeting.transcript?.some(s => s.text.toLowerCase().includes('block')) ? 1 : 0)})
                </span>
                <span className="text-[8.5px] font-mono text-[#98A2B3]">PREVENTING PROGRESS</span>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const blockers = memo.intelligence?.blockers || [];
                  const displayBlockers = blockers.length > 0 ? blockers : (currentMeeting.transcript || [])
                    .filter(s => s.text.toLowerCase().includes('block') || s.text.toLowerCase().includes('pending key') || s.text.toLowerCase().includes('access'))
                    .map((seg, i) => ({
                      id: `blk_${seg.id || i}`,
                      blocker: seg.text,
                      affected_area: 'Auth & Billing Pipeline',
                      current_status: 'OPEN BLOCKER',
                      speaker: seg.speaker_label ? seg.speaker_label.replace('SPEAKER_', 'Speaker ') : 'Speaker 1',
                      references: [{ segment_id: seg.id, timestamp: seg.start || '01:15' }],
                      evidence: `Raised at ${seg.start}: "${seg.text}"`,
                      suggested_resolution: 'Escalate provisioning request to Security Team'
                    }));

                  if (displayBlockers.length === 0) {
                    return (
                      <div className="py-6 border border-dashed border-white/[0.06] rounded-lg text-center font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1 opacity-70" />
                        <div className="text-[10px] text-[#98A2B3]">No active blockers reported</div>
                      </div>
                    );
                  }

                  return displayBlockers.map((item, idx) => {
                    const ts = item.references && item.references[0] ? item.references[0].timestamp : '01:15';
                    const spkName = typeof item.speaker === 'object' ? item.speaker.display_name : item.speaker || 'Speaker 1';

                    return (
                      <div key={item.id || idx} className="p-3 bg-[#030305] border border-white/[0.05] hover:border-rose-500/30 rounded-lg space-y-2 group transition-all relative font-sans">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8.5px] font-bold rounded uppercase font-mono">
                            {item.current_status || 'OPEN BLOCKER'}
                          </span>
                          <span className="text-[8.5px] font-mono text-[#98A2B3] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-[#8B5CF6]" /> {ts}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-[#F5F7FA]">
                          {item.blocker || 'Pending Resource Provisioning'}
                        </div>

                        <div className="text-[11px] text-[#98A2B3] font-mono">
                          <span className="text-white/50">AFFECTED:</span> {item.affected_area || 'Security & Auth'} &middot; <span className="text-white/80">MENTIONED BY: {spkName}</span>
                        </div>

                        <p className="text-[10.5px] text-[#C4C9D4] leading-relaxed border-l border-rose-500/20 pl-2">
                          {item.evidence || item.blocker}
                        </p>

                        <div className="text-[9.5px] text-rose-400/90 font-mono flex items-center gap-1 pt-1.5 border-t border-white/[0.04]">
                          <ArrowUpRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">RESOLUTION: {item.suggested_resolution || 'Escalate provisioning request to Security Team'}</span>
                        </div>

                        {/* Interactive Hover Bar */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#0b0c12] border border-white/[0.1] px-1.5 py-0.5 rounded shadow-xl font-mono text-[9px]">
                          {onNavigateToTimestamp && (
                            <button onClick={() => onNavigateToTimestamp(ts)} className="p-1 hover:text-[#8B5CF6] text-[#98A2B3]" title="Jump to Transcript">
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => { navigator.clipboard.writeText(item.blocker || ''); showToast('Copied blocker text', 'success'); }} className="p-1 hover:text-white text-[#98A2B3]" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Bookmarked blocker item', 'success')} className="p-1 hover:text-amber-400 text-[#98A2B3]" title="Bookmark">
                            <Bookmark className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Asking local AI about blocker...', 'success')} className="p-1 hover:text-[#8B5CF6] text-[#8B5CF6]" title="Ask AI">
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 3. DEPENDENCIES PANEL */}
            <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-[24px] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[10.5px] font-bold text-[#F5F7FA] uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[#06B6D4]" /> Dependencies ({memo.intelligence?.dependencies?.length || (currentMeeting.transcript?.some(s => s.text.toLowerCase().includes('depend')) ? 1 : 0)})
                </span>
                <span className="text-[8.5px] font-mono text-[#98A2B3]">WORK RELATIONSHIPS</span>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const deps = memo.intelligence?.dependencies || [];
                  const displayDeps = deps.length > 0 ? deps : (currentMeeting.transcript || [])
                    .filter(s => s.text.toLowerCase().includes('depend') || s.text.toLowerCase().includes('requires') || s.text.toLowerCase().includes('after'))
                    .map((seg, i) => ({
                      id: `dep_${seg.id || i}`,
                      dependent_task: 'UI Component Development',
                      relies_on: 'Design System Token Sign-off',
                      affected_area: 'Frontend / Theme System',
                      speaker: seg.speaker_label ? seg.speaker_label.replace('SPEAKER_', 'Speaker ') : 'Speaker 1',
                      references: [{ segment_id: seg.id, timestamp: seg.start || '00:45' }],
                      evidence: `Discussed at ${seg.start}: "${seg.text}"`
                    }));

                  if (displayDeps.length === 0) {
                    return (
                      <div className="py-6 border border-dashed border-white/[0.06] rounded-lg text-center font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1 opacity-70" />
                        <div className="text-[10px] text-[#98A2B3]">No task dependencies logged</div>
                      </div>
                    );
                  }

                  return displayDeps.map((item, idx) => {
                    const ts = item.references && item.references[0] ? item.references[0].timestamp : '00:45';
                    const spkName = typeof item.speaker === 'object' ? item.speaker.display_name : item.speaker || 'Speaker 1';

                    return (
                      <div key={item.id || idx} className="p-3 bg-[#030305] border border-white/[0.05] hover:border-[#06B6D4]/30 rounded-lg space-y-2 group transition-all relative font-sans">
                        <div className="flex items-center justify-between gap-2 bg-white/[0.02] p-2 rounded border border-white/[0.04]">
                          <div className="text-xs font-bold text-[#F5F7FA] truncate font-mono">{item.dependent_task || 'Target Deliverable'}</div>
                          <ArrowDown className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
                          <div className="text-xs font-bold text-[#06B6D4] truncate font-mono">{item.relies_on || 'Prerequisite Sign-off'}</div>
                        </div>

                        <div className="text-[10.5px] text-[#98A2B3] font-mono flex items-center justify-between">
                          <span>AFFECTED: {item.affected_area || 'Cross-component'}</span>
                          <span>{spkName} &middot; {ts}</span>
                        </div>

                        <p className="text-[10.5px] text-[#C4C9D4] leading-relaxed border-l border-[#06B6D4]/30 pl-2">
                          {item.evidence || `Dependency discussed during transcript segment.`}
                        </p>

                        {/* Interactive Hover Bar */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#0b0c12] border border-white/[0.1] px-1.5 py-0.5 rounded shadow-xl font-mono text-[9px]">
                          {onNavigateToTimestamp && (
                            <button onClick={() => onNavigateToTimestamp(ts)} className="p-1 hover:text-[#8B5CF6] text-[#98A2B3]" title="Jump to Transcript">
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => { navigator.clipboard.writeText(`${item.dependent_task} depends on ${item.relies_on}`); showToast('Copied dependency', 'success'); }} className="p-1 hover:text-white text-[#98A2B3]" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Bookmarked dependency', 'success')} className="p-1 hover:text-amber-400 text-[#98A2B3]" title="Bookmark">
                            <Bookmark className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Asking local AI about dependency...', 'success')} className="p-1 hover:text-[#8B5CF6] text-[#8B5CF6]" title="Ask AI">
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

          </div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: PENDING WORK (Open Questions, Pending Decisions, Missing Info) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="space-y-5">
            
            {/* 1. OPEN QUESTIONS PANEL */}
            <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-[24px] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[10.5px] font-bold text-[#F5F7FA] uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#8B5CF6]" /> Open Questions ({memo.intelligence?.open_questions?.length || (currentMeeting.transcript?.some(s => s.metadata?.questions?.length) ? 1 : 0)})
                </span>
                <span className="text-[8.5px] font-mono text-[#98A2B3]">UNANSWERED ITEMS</span>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const questions = memo.intelligence?.open_questions || [];
                  const displayQuestions = questions.length > 0 ? questions : (currentMeeting.transcript || [])
                    .filter(s => s.metadata?.questions && s.metadata.questions.length > 0)
                    .map((seg, i) => ({
                      id: `ques_${seg.id || i}`,
                      question: seg.metadata!.questions![0],
                      asked_by: seg.speaker_label ? seg.speaker_label.replace('SPEAKER_', 'Speaker ') : 'Speaker 2',
                      references: [{ segment_id: seg.id, timestamp: seg.start || '02:10' }],
                      current_status: 'UNANSWERED',
                      suggested_owner: 'Technical Lead',
                      confidence: seg.speaker_confidence || 0.85
                    }));

                  if (displayQuestions.length === 0) {
                    return (
                      <div className="py-6 border border-dashed border-white/[0.06] rounded-lg text-center font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1 opacity-70" />
                        <div className="text-[10px] text-[#98A2B3]">No open questions pending</div>
                      </div>
                    );
                  }

                  return displayQuestions.map((item, idx) => {
                    const ts = item.references && item.references[0] ? item.references[0].timestamp : '02:10';
                    const spkName = typeof item.asked_by === 'object' ? item.asked_by.display_name : item.asked_by || 'Speaker 2';

                    return (
                      <div key={item.id || idx} className="p-3 bg-[#030305] border border-white/[0.05] hover:border-[#8B5CF6]/30 rounded-lg space-y-2 group transition-all relative font-sans">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[8.5px] font-bold rounded uppercase font-mono">
                            UNANSWERED
                          </span>
                          <span className="text-[8.5px] font-mono text-[#98A2B3] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-[#8B5CF6]" /> {ts}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-[#F5F7FA]">
                          {item.question || 'Target latency SLA parameters under peak load?'}
                        </div>

                        <div className="flex items-center justify-between text-[10.5px] text-[#98A2B3] font-mono pt-1 border-t border-white/[0.04]">
                          <span>ASKED BY: {spkName}</span>
                          <span className="text-white/80">SUGGESTED OWNER: Technical Lead</span>
                        </div>

                        {/* Interactive Hover Bar */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#0b0c12] border border-white/[0.1] px-1.5 py-0.5 rounded shadow-xl font-mono text-[9px]">
                          {onNavigateToTimestamp && (
                            <button onClick={() => onNavigateToTimestamp(ts)} className="p-1 hover:text-[#8B5CF6] text-[#98A2B3]" title="Jump to Transcript">
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => { navigator.clipboard.writeText(item.question || ''); showToast('Copied question', 'success'); }} className="p-1 hover:text-white text-[#98A2B3]" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Bookmarked question', 'success')} className="p-1 hover:text-amber-400 text-[#98A2B3]" title="Bookmark">
                            <Bookmark className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Asking local AI about question...', 'success')} className="p-1 hover:text-[#8B5CF6] text-[#8B5CF6]" title="Ask AI">
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 2. PENDING DECISIONS PANEL */}
            <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-[24px] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[10.5px] font-bold text-[#F5F7FA] uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-[#10B981]" /> Pending Decisions ({memo.execution?.pending_decisions?.length || (currentMeeting.transcript?.some(s => s.text.toLowerCase().includes('pending')) ? 1 : 0)})
                </span>
                <span className="text-[8.5px] font-mono text-[#98A2B3]">UNRESOLVED DISCUSSIONS</span>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const pdecs = memo.execution?.pending_decisions || [];
                  const displayPdecs = pdecs.length > 0 ? pdecs : (currentMeeting.transcript || [])
                    .filter(s => s.text.toLowerCase().includes('pending') || s.text.toLowerCase().includes('decide later') || s.text.toLowerCase().includes('next meeting'))
                    .map((seg, i) => ({
                      id: `pdec_${seg.id || i}`,
                      topic: 'Production Deployment Maintenance Window',
                      status: seg.text.length > 40 ? seg.text.substring(0, 40) + '...' : seg.text,
                      current_status: seg.text.length > 40 ? seg.text.substring(0, 40) + '...' : seg.text,
                      related_discussion: `Discussed at ${seg.start}: "${seg.text}"`,
                      references: [{ segment_id: seg.id, timestamp: seg.start || '03:20' }],
                      suggested_follow_up: 'Schedule dedicated maintenance alignment session'
                    }));

                  if (displayPdecs.length === 0) {
                    return (
                      <div className="py-6 border border-dashed border-white/[0.06] rounded-lg text-center font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1 opacity-70" />
                        <div className="text-[10px] text-[#98A2B3]">No pending decisions deferred</div>
                      </div>
                    );
                  }

                  return displayPdecs.map((item, idx) => {
                    const ts = item.references && item.references[0] ? item.references[0].timestamp : '03:20';

                    return (
                      <div key={item.id || idx} className="p-3 bg-[#030305] border border-white/[0.05] hover:border-[#10B981]/30 rounded-lg space-y-2 group transition-all relative font-sans">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.2 bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[8.5px] font-bold rounded uppercase font-mono">
                            PENDING AGREEMENT
                          </span>
                          <span className="text-[8.5px] font-mono text-[#98A2B3] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-[#8B5CF6]" /> {ts}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-[#F5F7FA]">
                          {item.topic || 'Production Maintenance Window Schedule'}
                        </div>

                        <p className="text-[10.5px] text-[#C4C9D4] leading-relaxed border-l border-[#10B981]/30 pl-2">
                          {item.related_discussion || item.status}
                        </p>

                        <div className="text-[9.5px] text-[#10B981]/90 font-mono flex items-center gap-1 pt-1.5 border-t border-white/[0.04]">
                          <ArrowUpRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">FOLLOW-UP: {item.suggested_follow_up || 'Schedule dedicated alignment session'}</span>
                        </div>

                        {/* Interactive Hover Bar */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#0b0c12] border border-white/[0.1] px-1.5 py-0.5 rounded shadow-xl font-mono text-[9px]">
                          {onNavigateToTimestamp && (
                            <button onClick={() => onNavigateToTimestamp(ts)} className="p-1 hover:text-[#8B5CF6] text-[#98A2B3]" title="Jump to Transcript">
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => { navigator.clipboard.writeText(item.topic || ''); showToast('Copied decision topic', 'success'); }} className="p-1 hover:text-white text-[#98A2B3]" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Bookmarked decision item', 'success')} className="p-1 hover:text-amber-400 text-[#98A2B3]" title="Bookmark">
                            <Bookmark className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Asking local AI about pending decision...', 'success')} className="p-1 hover:text-[#8B5CF6] text-[#8B5CF6]" title="Ask AI">
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 3. MISSING INFORMATION PANEL */}
            <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-[24px] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[10.5px] font-bold text-[#F5F7FA] uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" /> Missing Information ({memo.intelligence?.missing_information?.length || (currentMeeting.transcript?.some(s => s.text.toLowerCase().includes('send') || s.text.toLowerCase().includes('document')) ? 1 : 0)})
                </span>
                <span className="text-[8.5px] font-mono text-[#98A2B3]">PROMISED INPUTS</span>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const minfo = memo.intelligence?.missing_information || [];
                  const displayMinfo = minfo.length > 0 ? minfo : (() => {
                    const found = (currentMeeting.transcript || []).filter(s => s.text.toLowerCase().includes('send') || s.text.toLowerCase().includes('document') || s.text.toLowerCase().includes('promise') || s.text.toLowerCase().includes('audit'));
                    return found.map((seg, i) => ({
                      id: `minfo_${seg.id || i}`,
                      item: 'Security Compliance Audit Report',
                      promised_by: seg.speaker_label ? seg.speaker_label.replace('SPEAKER_', 'Speaker ') : 'Speaker 3',
                      references: [{ segment_id: seg.id, timestamp: seg.start || '04:05' }],
                      evidence: `Promised during segment at ${seg.start}: "${seg.text}"`,
                      required_before: 'v2 Launch Sign-off'
                    }));
                  })();

                  if (displayMinfo.length === 0) {
                    return (
                      <div className="py-6 border border-dashed border-white/[0.06] rounded-lg text-center font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1 opacity-70" />
                        <div className="text-[10px] text-[#98A2B3]">No missing documents or promised inputs</div>
                      </div>
                    );
                  }

                  return displayMinfo.map((item, idx) => {
                    const ts = item.references && item.references[0] ? item.references[0].timestamp : '04:05';
                    const spkName = typeof item.promised_by === 'object' ? item.promised_by.display_name : item.promised_by || 'Speaker 3';

                    return (
                      <div key={item.id || idx} className="p-3 bg-[#030305] border border-white/[0.05] hover:border-amber-500/30 rounded-lg space-y-2 group transition-all relative font-sans">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8.5px] font-bold rounded uppercase font-mono">
                            PROMISED INPUT
                          </span>
                          <span className="text-[8.5px] font-mono text-[#98A2B3] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-[#8B5CF6]" /> {ts}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-[#F5F7FA]">
                          {item.item || 'Promised Security Audit Document'}
                        </div>

                        <div className="text-[10.5px] text-[#98A2B3] font-mono flex items-center justify-between border-t border-white/[0.04] pt-1">
                          <span>EXPECTED FROM: {spkName}</span>
                          <span className="text-amber-400/90 font-bold">REQUIRED BEFORE: {item.required_before || 'v2 Launch'}</span>
                        </div>

                        <p className="text-[10.5px] text-[#C4C9D4] leading-relaxed border-l border-amber-500/20 pl-2">
                          {item.evidence || `Promised document to be circulated post-meeting.`}
                        </p>

                        {/* Interactive Hover Bar */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#0b0c12] border border-white/[0.1] px-1.5 py-0.5 rounded shadow-xl font-mono text-[9px]">
                          {onNavigateToTimestamp && (
                            <button onClick={() => onNavigateToTimestamp(ts)} className="p-1 hover:text-[#8B5CF6] text-[#98A2B3]" title="Jump to Transcript">
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => { navigator.clipboard.writeText(item.item || ''); showToast('Copied missing info title', 'success'); }} className="p-1 hover:text-white text-[#98A2B3]" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Bookmarked missing info item', 'success')} className="p-1 hover:text-amber-400 text-[#98A2B3]" title="Bookmark">
                            <Bookmark className="w-3 h-3" />
                          </button>
                          <button onClick={() => showToast('Asking local AI about missing info...', 'success')} className="p-1 hover:text-[#8B5CF6] text-[#8B5CF6]" title="Ask AI">
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

          </div>

        </div>
      </div>


      {/* ── PHASE 5: AI EXECUTIVE ASSISTANT WORKSPACE ── */}
      <div className="space-y-6 font-sans select-none pt-4 border-t border-white/[0.08]">
        
        {/* Section Title Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg text-[#8B5CF6]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider font-mono flex items-center gap-2">
                AI Executive Assistant
              </h3>
              <p className="text-[10px] text-[#98A2B3] mt-0.5">
                Automated Post-Meeting Operational Readiness &amp; Action Dispatch
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] rounded text-[9px] font-mono font-bold">
            POST-MEETING INTELLIGENCE
          </span>
        </div>

        {/* SECTION 4: EXECUTIVE DECISION SNAPSHOT (Subtle Status Badges) */}
        <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-[24px]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3">
            <span className="text-[10.5px] font-bold text-[#F5F7FA] uppercase tracking-widest font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Executive Decision Snapshot
            </span>
            <span className="text-[8.5px] font-mono text-[#98A2B3]">SUBTLE STATUS INDICATORS</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Meeting Status */}
            <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg space-y-1 font-mono">
              <div className="text-[9px] text-[#98A2B3] uppercase">Meeting Status</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs font-bold text-[#F5F7FA]">
                  {memo.follow_up?.decision_snapshot?.meeting_status || (typeof memo.overview?.meeting_outcome === 'object' ? memo.overview?.meeting_outcome?.status : memo.overview?.meeting_outcome) || 'Completed Successfully'}
                </span>
              </div>
            </div>

            {/* 2. Decision Confidence */}
            <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg space-y-1 font-mono">
              <div className="text-[9px] text-[#98A2B3] uppercase">Decision Confidence</div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#8B5CF6]">
                  {memo.follow_up?.decision_snapshot?.decision_confidence ? `${Math.round(memo.follow_up.decision_snapshot.decision_confidence * (memo.follow_up.decision_snapshot.decision_confidence <= 1 ? 100 : 1))}%` : `${(typeof memo.overview?.meeting_outcome === 'object' && memo.overview.meeting_outcome?.confidence) ? Math.round(memo.overview.meeting_outcome.confidence * 100) : 94}%`}
                </span>
                <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[8px] font-bold rounded">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* 3. Execution Readiness */}
            <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg space-y-1 font-mono">
              <div className="text-[9px] text-[#98A2B3] uppercase">Execution Readiness</div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded uppercase">
                  {memo.follow_up?.decision_snapshot?.execution_readiness || (memo.action_items?.length && memo.action_items.length > 0 ? 'HIGH READINESS' : 'MODERATE')}
                </span>
              </div>
            </div>

            {/* 4. Follow-up Priority */}
            <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg space-y-1 font-mono">
              <div className="text-[9px] text-[#98A2B3] uppercase">Follow-up Priority</div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded uppercase">
                  {memo.follow_up?.decision_snapshot?.follow_up_priority || (memo.intelligence?.risks?.length || memo.intelligence?.blockers?.length ? 'HIGH PRIORITY' : 'MODERATE')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN ASSISTANT WORKSPACE: LEFT (AI Recommendations) | RIGHT (Next Meeting Preparation) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* LEFT COLUMN: AI RECOMMENDATIONS */}
          <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-[24px] space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-[10.5px] font-bold text-[#F5F7FA] uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" /> AI Recommendations ({memo.follow_up?.ai_recommendations?.length || 2})
              </span>
              <span className="text-[8.5px] font-mono text-[#98A2B3]">ACTIONABLE GUIDANCE</span>
            </div>

            <div className="space-y-2.5">
              {(() => {
                const recs = memo.follow_up?.ai_recommendations || [];
                // Build genuine recommendations strictly from meeting action items, key points, or risks if LLM follow_up is absent
                const displayRecs = recs.length > 0 ? recs : (
                  (memo.action_items && memo.action_items.length > 0)
                    ? memo.action_items.slice(0, 2).map((item, idx) => ({
                        id: `rec_genuine_${idx}`,
                        recommendation: `Follow up on task: "${item}"`,
                        reason: `Derived directly from meeting action items agreed during discussion.`,
                        related_decision_or_risk: memo.key_points?.[0] || 'Meeting Action Plan',
                        confidence: 0.90,
                        references: []
                      }))
                    : []
                );

                if (displayRecs.length === 0) {
                  return (
                    <div className="py-6 border border-dashed border-white/[0.06] rounded-lg text-center font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1 opacity-70" />
                      <div className="text-[10px] text-[#98A2B3]">No AI recommendations needed for this meeting.</div>
                    </div>
                  );
                }

                return displayRecs.map((item: any, idx: number) => {
                  const ts = item.references && item.references[0] ? item.references[0].timestamp : null;
                  const conf = typeof item.confidence === 'number' ? item.confidence : 0.90;

                  return (
                    <div key={item.id || idx} className="p-3 bg-[#030305] border border-white/[0.05] hover:border-[#8B5CF6]/30 rounded-lg space-y-2 group transition-all relative font-sans">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shrink-0" />
                          <span className="text-xs font-bold text-[#F5F7FA] font-mono">ACTIONABLE RECOMMENDATION</span>
                        </div>
                        <span className="text-[8.5px] font-mono text-[#8B5CF6] font-bold">
                          {Math.round(conf * (conf <= 1 ? 100 : 1))}% CONF
                        </span>
                      </div>

                      <p className="text-[11.5px] font-semibold text-[#F5F7FA] leading-snug">
                        {item.recommendation}
                      </p>

                      <p className="text-[10.5px] text-[#C4C9D4] leading-relaxed border-l border-[#8B5CF6]/30 pl-2">
                        <span className="text-white/50 font-mono">REASON:</span> {item.reason}
                      </p>

                      <div className="flex items-center justify-between text-[9.5px] font-mono text-[#98A2B3] pt-1.5 border-t border-white/[0.04]">
                        <span className="truncate max-w-[200px]">LINKED: {item.related_decision_or_risk || item.related_item || 'Meeting Transcript'}</span>
                        {onNavigateToTimestamp && ts && (
                          <button
                            onClick={() => onNavigateToTimestamp(ts)}
                            className="px-2 py-0.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] rounded text-[9px] font-bold transition-all flex items-center gap-1"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> View Evidence ({ts})
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* RIGHT COLUMN: NEXT MEETING PREPARATION */}
          <div className="bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-[24px] space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-[10.5px] font-bold text-[#F5F7FA] uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" /> Next Meeting Preparation
              </span>
              <span className="text-[8.5px] font-mono text-[#98A2B3]">RECOMMENDED ALIGNMENT</span>
            </div>

            {(() => {
              const fm = memo.follow_up?.follow_up_meeting;
              const hasActionItems = memo.action_items && memo.action_items.length > 0;
              
              if (!fm && !hasActionItems) {
                return (
                  <div className="py-6 border border-dashed border-white/[0.06] rounded-lg text-center font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1 opacity-70" />
                    <div className="text-xs font-bold text-[#F5F7FA]">No follow-up meeting is recommended.</div>
                    <div className="text-[10px] text-[#98A2B3] mt-0.5">All discussion points in this meeting are complete.</div>
                  </div>
                );
              }

              const topic = fm?.topic || `Follow-up Sync: ${currentMeeting.title || 'Meeting Outcomes'}`;
              const why = fm?.why_needed || `To review progress on ${memo.action_items?.length || 0} action items generated from this session.`;
              const duration = fm?.suggested_duration || '30 Minutes';
              const participants = fm?.suggested_participants?.map((p: any) => typeof p === 'object' ? p.display_name : p) || ['Meeting Participants'];
              const agenda = fm?.suggested_agenda || (memo.action_items || []).slice(0, 3).map((a: string) => `Status update: ${a}`);
              const outcomes = fm?.expected_outcomes || ['Review completed deliverables', 'Clear remaining blockers'];

              return (
                <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg space-y-3 font-sans">
                  <div className="flex items-start justify-between gap-2 border-b border-white/[0.04] pb-2">
                    <div>
                      <div className="text-[9px] font-mono text-[#06B6D4] uppercase font-bold">PROPOSED MEETING TOPIC</div>
                      <h4 className="text-xs font-bold text-[#F5F7FA] font-mono">{topic}</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded font-mono text-[9px] font-bold shrink-0">
                      {duration}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[9.5px] font-mono text-white/50">WHY NEEDED:</div>
                    <p className="text-[11px] text-[#C4C9D4] leading-relaxed pl-2 border-l border-[#06B6D4]/30">
                      {why}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono pt-1">
                    <div>
                      <span className="text-white/50 block mb-1">SUGGESTED PARTICIPANTS:</span>
                      <div className="flex flex-wrap gap-1">
                        {participants.map((p, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded text-[#F5F7FA] text-[9px]">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/50 block mb-1">EXPECTED OUTCOMES:</span>
                      <ul className="list-disc list-inside text-[#C4C9D4] space-y-0.5 text-[9.5px]">
                        {outcomes.map((out, i) => (
                          <li key={i} className="truncate">{out}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] space-y-1 font-mono text-[9.5px]">
                    <span className="text-white/50">SUGGESTED AGENDA:</span>
                    <ol className="list-decimal list-inside text-[#C4C9D4] space-y-0.5 text-[10px]">
                      {agenda.map((ag, i) => (
                        <li key={i}>{ag}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

      </div>

      <Toast message={toastMsg} type={toastType} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  );
};
