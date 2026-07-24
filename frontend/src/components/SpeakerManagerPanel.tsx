import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Users, Pencil, X, Check, GitMerge, ArrowRight, CornerDownRight, Filter, Navigation } from 'lucide-react';
import { SpeakerProfile, getInitials } from '../types/speakerProfile';

interface TranscriptSegment {
  id: number;
  speaker_label?: string;
  start: string;
  end?: string;
  end_seconds?: number;
  text: string;
  speaker_confidence?: number;
  metadata?: Record<string, any>;
}

export interface SpeakerStats {
  originalLabel: string;
  displayName: string;
  color: string;
  segments: number;
  totalSeconds: number;
  percentage: number;
  wordsSpoken: number;
  avgWpm: number;
  role: string;
  notes: string;
  avatarInitials: string;
}

interface RenameSpeakerModalProps {
  speaker: SpeakerStats;
  onSave: (newName: string, scope: 'all' | 'current') => void;
  onCancel: () => void;
}

interface SpeakerManagerPanelProps {
  transcript: TranscriptSegment[];
  speakerNames: Record<string, string>;
  speakerProfiles?: Record<string, Partial<SpeakerProfile>>;
  speakerColors?: Record<string, string>;
  onRename: (originalLabel: string, newName: string, scope: 'all' | 'current') => void;
  onMergeSpeakers?: (sourceLabel: string, targetLabel: string) => void;
  onFilterBySpeaker?: (speakerLabel: string) => void;
  onJumpToTimestamp?: (timestamp: string) => void;
  onUpdateProfile?: (originalLabel: string, updates: Partial<SpeakerProfile>) => void;
  onClose: () => void;
}

export const SPEAKER_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#f97316', '#ef4444', '#ec4899'];

export function getSpeakerColor(index: number): string {
  return SPEAKER_COLORS[index % SPEAKER_COLORS.length];
}

export const RenameSpeakerModal: React.FC<RenameSpeakerModalProps> = ({ speaker, onSave, onCancel }) => {
  const [newName, setNewName] = useState(speaker.displayName);
  const [scope, setScope] = useState<'all' | 'current'>('all');

  const modal = ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center font-sans text-xs">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-80 bg-[#0e1016] border border-white/[0.1] rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: speaker.color }} />
            <span className="text-[10px] font-bold text-[#F5F7FA] uppercase tracking-widest">Rename Speaker</span>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-white/[0.06] text-[#98A2B3] hover:text-[#F5F7FA]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-[#98A2B3] uppercase tracking-widest mb-1.5 font-mono">Current Name</label>
            <div className="px-3 py-2 bg-[#080a0f] border border-white/[0.04] rounded text-xs text-[#98A2B3] font-mono">{speaker.originalLabel}</div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-[#98A2B3] uppercase tracking-widest mb-1.5 font-mono">New Display Name</label>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) onSave(newName.trim(), scope);
                if (e.key === 'Escape') onCancel();
              }}
              className="w-full px-3 py-2 bg-[#080a0f] border border-white/[0.08] rounded text-xs text-[#F5F7FA] font-mono focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-[#98A2B3] uppercase tracking-widest mb-2 font-mono">Apply To</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer" onClick={() => setScope('all')}>
                <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${scope === 'all' ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-white/20'}`}>
                  {scope === 'all' && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs text-[#C4C9D4]">Entire Meeting ({speaker.segments} segments)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer" onClick={() => setScope('current')}>
                <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${scope === 'current' ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-white/20'}`}>
                  {scope === 'current' && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs text-[#C4C9D4]">Current Segment Only</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-4">
          <button onClick={onCancel} className="flex-1 py-2 border border-white/[0.08] rounded text-xs text-[#98A2B3] hover:bg-white/[0.04] font-bold">CANCEL</button>
          <button onClick={() => newName.trim() && onSave(newName.trim(), scope)} disabled={!newName.trim()} className="flex-1 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded text-xs text-white font-bold">SAVE</button>
        </div>
      </div>
    </div>,
    document.body
  );
  return modal;
};

// Merge Modal
const MergeSpeakerModal: React.FC<{
  speakers: SpeakerStats[];
  sourceSpeaker: SpeakerStats;
  onConfirmMerge: (sourceLabel: string, targetLabel: string) => void;
  onCancel: () => void;
}> = ({ speakers, sourceSpeaker, onConfirmMerge, onCancel }) => {
  const targetOptions = speakers.filter((s) => s.originalLabel !== sourceSpeaker.originalLabel);
  const [selectedTarget, setSelectedTarget] = useState<string>(targetOptions[0]?.originalLabel || '');

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center font-sans text-xs">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-84 bg-[#0e1016] border border-white/[0.1] rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-[#8B5CF6]">
            <GitMerge className="w-4 h-4" />
            <span className="text-[10px] font-bold text-[#F5F7FA] uppercase tracking-widest">Merge Speaker</span>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-white/[0.06] text-[#98A2B3] hover:text-[#F5F7FA]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-[11px] text-[#98A2B3] leading-relaxed">
            Reassign all segments belonging to <strong className="text-white">{sourceSpeaker.displayName}</strong> ({sourceSpeaker.segments} segments) to another speaker.
          </p>

          <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg border border-white/[0.05]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sourceSpeaker.color }} />
              <span className="font-bold text-white">{sourceSpeaker.displayName}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B5CF6]" />
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="bg-[#030305] border border-white/[0.1] rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono cursor-pointer"
            >
              {targetOptions.map((t) => (
                <option key={t.originalLabel} value={t.originalLabel}>
                  {t.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-4">
          <button onClick={onCancel} className="flex-1 py-2 border border-white/[0.08] rounded text-xs text-[#98A2B3] hover:bg-white/[0.04] font-bold uppercase">
            Cancel
          </button>
          <button
            onClick={() => selectedTarget && onConfirmMerge(sourceSpeaker.originalLabel, selectedTarget)}
            disabled={!selectedTarget}
            className="flex-1 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded text-xs text-white font-bold uppercase transition-colors"
          >
            Confirm Merge
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const SpeakerManagerPanel: React.FC<SpeakerManagerPanelProps> = ({
  transcript,
  speakerNames,
  speakerProfiles = {},
  speakerColors = {},
  onRename,
  onMergeSpeakers,
  onFilterBySpeaker,
  onJumpToTimestamp,
  onClose,
}) => {
  const [renamingLabel, setRenamingLabel] = useState<string | null>(null);
  const [mergingSourceLabel, setMergingSourceLabel] = useState<string | null>(null);

  const uniqueLabels = useMemo(() => Array.from(new Set(transcript.map((s) => s.speaker_label || 'UNKNOWN'))), [transcript]);

  const totalDuration = useMemo(() => {
    return transcript.reduce((sum, seg) => {
      const start = parseTimestamp(seg.start);
      const end = seg.end_seconds ?? start + 5;
      return sum + (end - start);
    }, 0);
  }, [transcript]);

  const speakerStats: (SpeakerStats & { firstApp: string; lastApp: string })[] = useMemo(() => {
    return uniqueLabels.map((label, idx) => {
      const segs = transcript.filter((s) => (s.speaker_label || 'UNKNOWN') === label);
      const totalSeconds = segs.reduce((sum, seg) => {
        const start = parseTimestamp(seg.start);
        const end = seg.end_seconds ?? start + 5;
        return sum + (end - start);
      }, 0);
      const wordsSpoken = segs.reduce((sum, s) => sum + (s.text ? s.text.trim().split(/\s+/).length : 0), 0);
      const avgWpm = totalSeconds > 0 ? Math.round((wordsSpoken / totalSeconds) * 60) : 0;
      const profile = speakerProfiles[label];
      const displayName = profile?.displayName || speakerNames[label] || label;

      const firstApp = segs[0]?.start || '00:00';
      const lastApp = segs[segs.length - 1]?.start || '00:00';

      return {
        originalLabel: label,
        displayName,
        color: speakerColors[label] || profile?.accentColor || getSpeakerColor(idx),
        segments: segs.length,
        totalSeconds,
        percentage: totalDuration > 0 ? (totalSeconds / totalDuration) * 100 : 0,
        wordsSpoken,
        avgWpm,
        role: profile?.role || 'Participant',
        notes: profile?.notes || '',
        avatarInitials: profile?.avatarInitials || getInitials(displayName),
        firstApp,
        lastApp,
      };
    });
  }, [uniqueLabels, transcript, speakerNames, speakerProfiles, speakerColors, totalDuration]);

  const renamingSpeaker = renamingLabel ? speakerStats.find((s) => s.originalLabel === renamingLabel) ?? null : null;
  const mergingSpeaker = mergingSourceLabel ? speakerStats.find((s) => s.originalLabel === mergingSourceLabel) ?? null : null;

  return (
    <>
      <div className="absolute inset-0 z-[500] flex items-start justify-end pointer-events-none" style={{ top: 0, right: 0 }}>
        <div className="pointer-events-auto w-84 h-full bg-[#0a0c12]/95 backdrop-blur-[32px] border-l border-white/[0.07] flex flex-col shadow-[−20px_0_60px_rgba(0,0,0,0.5)] font-sans text-xs">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="text-[10px] font-bold text-[#F5F7FA] uppercase tracking-widest">Speaker Operations</span>
              <span className="px-1.5 py-0.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded text-[8px] font-bold text-[#8B5CF6] font-mono">
                {uniqueLabels.length}
              </span>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.06] text-[#98A2B3] hover:text-[#F5F7FA]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto premium-scrollbar p-3 space-y-2.5">
            {speakerStats.map((speaker) => (
              <div key={speaker.originalLabel} className="bg-[#0e1016]/80 border border-white/[0.05] rounded-xl p-3 space-y-2.5 hover:border-white/[0.1] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ backgroundColor: `${speaker.color}25`, border: `1px solid ${speaker.color}40`, color: speaker.color }}
                  >
                    {speaker.avatarInitials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F5F7FA] text-xs truncate">{speaker.displayName}</span>
                      <span
                        className="px-1.5 py-0.2 text-[8px] font-bold rounded font-mono uppercase"
                        style={{ backgroundColor: `${speaker.color}15`, color: speaker.color, border: `1px solid ${speaker.color}30` }}
                      >
                        {speaker.role}
                      </span>
                    </div>
                    <div className="text-[9px] text-[#98A2B3] font-mono truncate">{speaker.originalLabel}</div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setMergingSourceLabel(speaker.originalLabel)}
                      title="Merge into another speaker"
                      className="p-1.5 rounded hover:bg-[#8B5CF6]/15 text-[#98A2B3] hover:text-[#8B5CF6] transition-colors"
                    >
                      <GitMerge className="w-3 h-3" />
                    </button>
                    <button onClick={() => setRenamingLabel(speaker.originalLabel)} className="p-1.5 rounded hover:bg-white/[0.06] text-[#98A2B3] hover:text-white">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[8.5px] font-mono">
                    <span className="text-[#98A2B3] uppercase">Speaking Share</span>
                    <span style={{ color: speaker.color }} className="font-bold">{speaker.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${speaker.percentage}%`, backgroundColor: speaker.color }} />
                  </div>
                </div>

                {/* Operations Bar */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-white/[0.04] text-[9.5px] font-mono">
                  {onJumpToTimestamp && (
                    <>
                      <button
                        onClick={() => onJumpToTimestamp(speaker.firstApp)}
                        className="flex-1 py-1 px-1.5 bg-[#030305] hover:bg-white/[0.04] rounded border border-white/[0.04] text-[#98A2B3] hover:text-white flex items-center justify-center gap-1 transition-colors"
                        title="Jump to first appearance"
                      >
                        <Navigation className="w-2.5 h-2.5 text-[#06B6D4]" />
                        <span>1st: {speaker.firstApp}</span>
                      </button>

                      <button
                        onClick={() => onJumpToTimestamp(speaker.lastApp)}
                        className="flex-1 py-1 px-1.5 bg-[#030305] hover:bg-white/[0.04] rounded border border-white/[0.04] text-[#98A2B3] hover:text-white flex items-center justify-center gap-1 transition-colors"
                        title="Jump to last appearance"
                      >
                        <CornerDownRight className="w-2.5 h-2.5 text-[#10B981]" />
                        <span>Last: {speaker.lastApp}</span>
                      </button>
                    </>
                  )}

                  {onFilterBySpeaker && (
                    <button
                      onClick={() => onFilterBySpeaker(speaker.originalLabel)}
                      className="py-1 px-2 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/25 rounded text-[#8B5CF6] font-bold flex items-center justify-center gap-1 transition-colors"
                      title="Filter transcript to only this speaker"
                    >
                      <Filter className="w-2.5 h-2.5" />
                      <span>Filter</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {renamingSpeaker && (
        <RenameSpeakerModal
          speaker={renamingSpeaker}
          onSave={(newName, scope) => {
            onRename(renamingSpeaker.originalLabel, newName, scope);
            setRenamingLabel(null);
          }}
          onCancel={() => setRenamingLabel(null)}
        />
      )}

      {mergingSpeaker && onMergeSpeakers && (
        <MergeSpeakerModal
          speakers={speakerStats}
          sourceSpeaker={mergingSpeaker}
          onConfirmMerge={(source, target) => {
            onMergeSpeakers(source, target);
            setMergingSourceLabel(null);
          }}
          onCancel={() => setMergingSourceLabel(null)}
        />
      )}
    </>
  );
};

function parseTimestamp(ts: string): number {
  const parts = ts.split(':');
  if (parts.length === 3) return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
  if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
  return parseFloat(parts[0]);
}
