import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Pencil, Palette, BarChart2, User, FileText, Check, X, Tag } from 'lucide-react';
import { SPEAKER_COLORS, RenameSpeakerModal, SpeakerStats } from './SpeakerManagerPanel';
import { SpeakerProfile, SPEAKER_ROLES, getInitials } from '../types/speakerProfile';

const COLOR_PALETTE = [
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#10B981', // emerald
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#FBBF24', // amber
  '#3B82F6', // blue
  '#A3E635', // lime
  '#F472B6', // rose
];

export interface ExtendedSpeakerStats extends SpeakerStats {
  wordsSpoken: number;
  avgWpm: number;
  role: string;
  notes: string;
  avatarInitials: string;
}

interface SpeakerPopoverProps {
  speaker: ExtendedSpeakerStats;
  position: { top: number; left: number };
  onUpdateProfile: (updates: { displayName?: string; role?: string; notes?: string; color?: string }) => void;
  onOpenRenameModal: () => void;
  onOpenStatsPanel: () => void;
  onClose: () => void;
}

const SpeakerPopover: React.FC<SpeakerPopoverProps> = ({
  speaker,
  position,
  onUpdateProfile,
  onOpenRenameModal,
  onOpenStatsPanel,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'edit'>('profile');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editName, setEditName] = useState(speaker.displayName);
  const [editRole, setEditRole] = useState(speaker.role);
  const [editNotes, setEditNotes] = useState(speaker.notes);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Position adjustments for screen boundaries
  const adjustedLeft = Math.min(Math.max(16, position.left), window.innerWidth - 320);
  const adjustedTop = Math.min(position.top + 6, window.innerHeight - 380);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSaveEdit = () => {
    onUpdateProfile({
      displayName: editName.trim() || speaker.displayName,
      role: editRole,
      notes: editNotes,
    });
    setActiveTab('profile');
  };

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: adjustedTop, left: adjustedLeft, zIndex: 99998 }}
      className="w-76 bg-[#0e1016]/95 border border-white/[0.1] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-[24px] font-sans text-xs"
    >
      {/* Header Profile Summary */}
      <div className="p-3 bg-gradient-to-b from-white/[0.03] to-transparent border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar Initials Badge */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-inner shrink-0 relative"
            style={{
              backgroundColor: `${speaker.color}25`,
              border: `1px solid ${speaker.color}50`,
              color: speaker.color,
            }}
          >
            {speaker.avatarInitials}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0e1016]"
              style={{ backgroundColor: speaker.color }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs truncate max-w-[130px]">{speaker.displayName}</span>
              <span
                className="px-1.5 py-0.2 text-[9px] font-bold rounded uppercase font-mono tracking-wide"
                style={{ backgroundColor: `${speaker.color}15`, color: speaker.color, border: `1px solid ${speaker.color}30` }}
              >
                {speaker.role}
              </span>
            </div>
            <div className="text-[9px] text-[#98A2B3] font-mono truncate">{speaker.originalLabel}</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-[#98A2B3] hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] bg-black/20 text-[10px] font-bold font-mono">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-[#8B5CF6] text-white bg-white/[0.02]'
              : 'border-transparent text-[#98A2B3] hover:text-white'
          }`}
        >
          PROFILE
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
            activeTab === 'stats'
              ? 'border-[#8B5CF6] text-white bg-white/[0.02]'
              : 'border-transparent text-[#98A2B3] hover:text-white'
          }`}
        >
          METRICS
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
            activeTab === 'edit'
              ? 'border-[#8B5CF6] text-white bg-white/[0.02]'
              : 'border-transparent text-[#98A2B3] hover:text-white'
          }`}
        >
          EDIT
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-3 space-y-3">
        {activeTab === 'profile' && (
          <div className="space-y-3">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#030305] p-2 rounded-lg border border-white/[0.04] text-center">
                <div className="text-[8px] text-[#98A2B3] font-mono uppercase">SHARE</div>
                <div className="text-xs font-bold text-[#F5F7FA] font-mono">{speaker.percentage.toFixed(1)}%</div>
              </div>
              <div className="bg-[#030305] p-2 rounded-lg border border-white/[0.04] text-center">
                <div className="text-[8px] text-[#98A2B3] font-mono uppercase">WORDS</div>
                <div className="text-xs font-bold text-[#F5F7FA] font-mono">{speaker.wordsSpoken}</div>
              </div>
              <div className="bg-[#030305] p-2 rounded-lg border border-white/[0.04] text-center">
                <div className="text-[8px] text-[#98A2B3] font-mono uppercase">AVG WPM</div>
                <div className="text-xs font-bold text-[#10B981] font-mono">{speaker.avgWpm}</div>
              </div>
            </div>

            {/* Notes Section */}
            {speaker.notes ? (
              <div className="bg-[#08080c] p-2 rounded border border-white/[0.05]">
                <div className="text-[9px] font-bold text-[#98A2B3] font-mono uppercase mb-1 flex items-center gap-1">
                  <FileText className="w-2.5 h-2.5 text-[#8B5CF6]" /> NOTES
                </div>
                <p className="text-[10px] text-[#F5F7FA] leading-relaxed italic">{speaker.notes}</p>
              </div>
            ) : (
              <div className="text-[9.5px] text-[#98A2B3]/50 italic text-center py-1">
                No optional notes added yet.
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-1 flex items-center justify-between border-t border-white/[0.04]">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="text-[10px] text-[#06B6D4] hover:underline font-mono flex items-center gap-1 font-semibold"
              >
                <Palette className="w-3 h-3" /> Change Accent Color
              </button>
              <button
                onClick={onOpenRenameModal}
                className="text-[10px] text-[#8B5CF6] hover:underline font-mono flex items-center gap-1 font-semibold"
              >
                <Pencil className="w-3 h-3" /> Full Rename
              </button>
            </div>

            {/* Color Palette Dropdown */}
            {showColorPicker && (
              <div className="p-2 bg-black/40 rounded border border-white/[0.08] mt-1">
                <div className="grid grid-cols-5 gap-1.5">
                  {COLOR_PALETTE.map((col) => (
                    <button
                      key={col}
                      onClick={() => {
                        onUpdateProfile({ color: col });
                        setShowColorPicker(false);
                      }}
                      className="w-5 h-5 rounded hover:scale-110 transition-transform relative border border-white/20"
                      style={{ backgroundColor: col }}
                    >
                      {col === speaker.color && <Check className="w-3 h-3 text-white m-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-2.5">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-[#98A2B3] font-mono">
                <span>Speaking Time</span>
                <span className="text-white font-bold">{formatDuration(speaker.totalSeconds)}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, speaker.percentage)}%`, backgroundColor: speaker.color }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
              <div className="p-2 bg-[#030305] rounded border border-white/[0.04]">
                <div className="text-[8px] text-[#98A2B3]">SEGMENTS</div>
                <div className="text-xs font-bold text-white">{speaker.segments}</div>
              </div>
              <div className="p-2 bg-[#030305] rounded border border-white/[0.04]">
                <div className="text-[8px] text-[#98A2B3]">TOTAL WORDS</div>
                <div className="text-xs font-bold text-white">{speaker.wordsSpoken}</div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenStatsPanel();
              }}
              className="w-full py-1.5 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-colors mt-2"
            >
              Open Full Speaker Manager
            </button>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="space-y-2.5">
            <div>
              <label className="text-[9px] text-[#98A2B3] font-mono font-bold uppercase block mb-1">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#030305] border border-white/[0.08] rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono"
              />
            </div>

            <div>
              <label className="text-[9px] text-[#98A2B3] font-mono font-bold uppercase block mb-1">Speaker Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full bg-[#030305] border border-white/[0.08] rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono cursor-pointer"
              >
                {SPEAKER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-[#98A2B3] font-mono font-bold uppercase block mb-1">Optional Notes</label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Key context or title..."
                className="w-full bg-[#030305] border border-white/[0.08] rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono resize-none"
              />
            </div>

            <button
              onClick={handleSaveEdit}
              className="w-full py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-colors mt-1"
            >
              Save Profile Changes
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ── SpeakerBadge ────────────────────────────────────────────────────────────────

interface SpeakerBadgeProps {
  originalLabel: string;
  displayName: string;
  color: string;
  stats: ExtendedSpeakerStats;
  onRename: (originalLabel: string) => void;
  onColorChange: (originalLabel: string, color: string) => void;
  onUpdateProfile: (originalLabel: string, updates: { displayName?: string; role?: string; notes?: string; color?: string }) => void;
  onViewStats: (originalLabel: string) => void;
}

export const SpeakerBadge: React.FC<SpeakerBadgeProps> = ({
  originalLabel,
  displayName,
  color,
  stats,
  onRename,
  onColorChange,
  onUpdateProfile,
  onViewStats,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const badgeRef = useRef<HTMLButtonElement>(null);

  const openPopover = useCallback(() => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom, left: rect.left });
    }
    setPopoverOpen(true);
  }, []);

  return (
    <div className="shrink-0 flex items-center">
      <button
        ref={badgeRef}
        onClick={openPopover}
        className="group/badge px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide select-none border transition-all duration-150 cursor-pointer flex items-center gap-1.5 max-w-[120px] truncate shadow-sm hover:scale-[1.02]"
        style={{
          backgroundColor: popoverOpen ? `${color}20` : `${color}10`,
          borderColor: popoverOpen ? `${color}50` : `${color}30`,
          color,
        }}
        title={`Click to view ${displayName}'s profile`}
      >
        <span
          className="w-4 h-4 rounded-full text-[8px] font-extrabold flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}30`, color }}
        >
          {stats.avatarInitials}
        </span>
        <span className="truncate">{displayName}</span>
      </button>

      {popoverOpen && (
        <SpeakerPopover
          speaker={stats}
          position={popoverPos}
          onUpdateProfile={(updates) => {
            if (updates.color) onColorChange(originalLabel, updates.color);
            onUpdateProfile(originalLabel, updates);
          }}
          onOpenRenameModal={() => {
            setPopoverOpen(false);
            onRename(originalLabel);
          }}
          onOpenStatsPanel={() => {
            setPopoverOpen(false);
            onViewStats(originalLabel);
          }}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </div>
  );
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}
