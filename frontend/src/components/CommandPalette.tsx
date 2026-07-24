import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  Mic, 
  FileText, 
  Sparkles, 
  BarChart4, 
  MessageSquare, 
  History, 
  Settings, 
  Square, 
  Download, 
  Mail, 
  Users, 
  CheckCircle2, 
  GitCommit, 
  BookOpen, 
  Pin, 
  Clock, 
  CornerDownLeft, 
  ArrowUp, 
  ArrowDown, 
  Command, 
  X,
  Zap,
  ShieldCheck,
  FileCode,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Meeting } from '../types';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActivePage: (page: string) => void;
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  onSelectMeeting: (meeting: Meeting) => void;
  startRecording: () => void;
  stopRecording: () => void;
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  handleExportStats?: (format: string) => void;
  pinnedMeetingIds?: string[];
  onTogglePin?: (id: string) => void;
}

export interface CommandItem {
  id: string;
  category: 'Navigation' | 'Meeting Actions' | 'Search & Intelligence' | 'Recent & Pinned';
  title: string;
  description: string;
  icon: React.ElementType;
  shortcut?: string[];
  action: () => void;
  badge?: string;
  highlightText?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActivePage,
  meetings,
  currentMeeting,
  onSelectMeeting,
  startRecording,
  stopRecording,
  recordingState,
  pinnedMeetingIds = []
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Compute all available commands dynamically based on state & query
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // --- CATEGORY 1: Navigation ---
    items.push(
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Dashboard Overview',
        description: 'Go to workspace executive hub & active meetings',
        icon: LayoutDashboard,
        shortcut: ['Ctrl', '1'],
        action: () => { setActivePage('dashboard'); onClose(); }
      },
      {
        id: 'nav-recorder',
        category: 'Navigation',
        title: 'Live Audio Recorder',
        description: 'Open mic / system audio recording studio',
        icon: Mic,
        shortcut: ['Ctrl', '2'],
        action: () => { setActivePage('recorder'); onClose(); }
      },
      {
        id: 'nav-transcript',
        category: 'Navigation',
        title: 'Transcript Studio',
        description: 'View full speaker-labeled transcript & audio player',
        icon: FileText,
        shortcut: ['Ctrl', '3'],
        action: () => { setActivePage('transcript'); onClose(); }
      },
      {
        id: 'nav-summary',
        category: 'Navigation',
        title: 'Executive Meeting Summary',
        description: 'View AI-generated memo, decisions & action items',
        icon: Sparkles,
        shortcut: ['Ctrl', '4'],
        action: () => { setActivePage('summary'); onClose(); }
      },
      {
        id: 'nav-analytics',
        category: 'Navigation',
        title: 'Total Meeting Analytics',
        description: 'Executive long-term intelligence & system performance',
        icon: BarChart4,
        shortcut: ['Ctrl', '5'],
        action: () => { setActivePage('analytics'); onClose(); }
      },
      {
        id: 'nav-qa',
        category: 'Navigation',
        title: 'RAG AI Assistant',
        description: 'Ask questions across meeting transcripts via Ollama RAG',
        icon: MessageSquare,
        shortcut: ['Ctrl', '6'],
        action: () => { setActivePage('qa'); onClose(); }
      },
      {
        id: 'nav-history',
        category: 'Navigation',
        title: 'Meeting Vault & History',
        description: 'Search, filter, and export all stored sessions',
        icon: History,
        shortcut: ['Ctrl', '7'],
        action: () => { setActivePage('history'); onClose(); }
      },
      {
        id: 'nav-settings',
        category: 'Navigation',
        title: 'System Settings',
        description: 'Configure Whisper, Ollama, PyAnnote & System options',
        icon: Settings,
        shortcut: ['Ctrl', ','],
        action: () => { setActivePage('settings'); onClose(); }
      }
    );

    // --- CATEGORY 2: Meeting Actions ---
    if (recordingState === 'idle' || recordingState === 'stopped') {
      items.push({
        id: 'act-start-rec',
        category: 'Meeting Actions',
        title: 'Start Recording Session',
        description: 'Begin capturing microphone or system audio',
        icon: Mic,
        shortcut: ['Ctrl', 'R'],
        badge: 'Action',
        action: () => { startRecording(); onClose(); }
      });
    } else {
      items.push({
        id: 'act-stop-rec',
        category: 'Meeting Actions',
        title: 'Stop Active Recording',
        description: 'Halt audio capture and initiate Whisper pipeline',
        icon: Square,
        shortcut: ['Ctrl', 'S'],
        badge: 'Live',
        action: () => { stopRecording(); onClose(); }
      });
    }

    if (currentMeeting) {
      items.push(
        {
          id: 'act-open-transcript',
          category: 'Meeting Actions',
          title: `Open Transcript: ${currentMeeting.title}`,
          description: 'Jump directly to current active meeting transcript',
          icon: FileText,
          action: () => { setActivePage('transcript'); onClose(); }
        },
        {
          id: 'act-export-pdf',
          category: 'Meeting Actions',
          title: `Export Meeting PDF: ${currentMeeting.title}`,
          description: 'Download executive summary & transcript as PDF',
          icon: Download,
          badge: 'PDF',
          action: () => { setActivePage('summary'); onClose(); }
        },
        {
          id: 'act-exec-brief',
          category: 'Meeting Actions',
          title: 'Generate Executive Brief',
          description: 'Synthesize key decisions, risks & outcome snapshot',
          icon: Zap,
          badge: 'AI',
          action: () => { setActivePage('summary'); onClose(); }
        },
        {
          id: 'act-followup-email',
          category: 'Meeting Actions',
          title: 'Generate Follow-up Email',
          description: 'Draft structured participant follow-up email memo',
          icon: Mail,
          badge: 'Email',
          action: () => { setActivePage('summary'); onClose(); }
        }
      );
    }

    // --- CATEGORY 3: Search & Intelligence ---
    if (query.trim().length > 0) {
      const qLower = query.toLowerCase();

      meetings.forEach((m) => {
        if (m.title.toLowerCase().includes(qLower)) {
          items.push({
            id: `search-mtg-${m.meeting_id}`,
            category: 'Search & Intelligence',
            title: m.title,
            description: `Meeting on ${new Date(m.date).toLocaleDateString()} • ${(m.duration / 60).toFixed(0)} min`,
            icon: Calendar,
            action: () => { onSelectMeeting(m); setActivePage('summary'); onClose(); }
          });
        }

        if (m.transcript) {
          const matchedSpeakers = new Set<string>();
          m.transcript.forEach((seg: any) => {
            if (seg.speaker_label && seg.speaker_label.toLowerCase().includes(qLower)) {
              matchedSpeakers.add(seg.speaker_label);
            }
          });
          matchedSpeakers.forEach((spk) => {
            items.push({
              id: `search-spk-${m.meeting_id}-${spk}`,
              category: 'Search & Intelligence',
              title: `Speaker: ${spk}`,
              description: `Found in meeting "${m.title}"`,
              icon: Users,
              action: () => { onSelectMeeting(m); setActivePage('transcript'); onClose(); }
            });
          });
        }

        if (m.memo) {
          if (m.memo.execution?.decisions) {
            m.memo.execution.decisions.forEach((d: any, i: number) => {
              const dText = typeof d === 'string' ? d : d.decision;
              if (dText && dText.toLowerCase().includes(qLower)) {
                items.push({
                  id: `search-dec-${m.meeting_id}-${i}`,
                  category: 'Search & Intelligence',
                  title: `Decision: "${dText.slice(0, 45)}..."`,
                  description: `In "${m.title}"`,
                  icon: GitCommit,
                  action: () => { onSelectMeeting(m); setActivePage('summary'); onClose(); }
                });
              }
            });
          }

          if (m.memo.execution?.action_items) {
            m.memo.execution.action_items.forEach((a: any, i: number) => {
              const aText = typeof a === 'string' ? a : a.task;
              if (aText && aText.toLowerCase().includes(qLower)) {
                items.push({
                  id: `search-act-${m.meeting_id}-${i}`,
                  category: 'Search & Intelligence',
                  title: `Action Item: "${aText.slice(0, 45)}..."`,
                  description: `Assigned in "${m.title}"`,
                  icon: CheckCircle2,
                  action: () => { onSelectMeeting(m); setActivePage('summary'); onClose(); }
                });
              }
            });
          }
        }
      });
    }

    // --- CATEGORY 4: Recent & Pinned Meetings ---
    meetings.filter(m => pinnedMeetingIds.includes(m.meeting_id)).forEach(m => {
      items.push({
        id: `pinned-${m.meeting_id}`,
        category: 'Recent & Pinned',
        title: `📌 ${m.title}`,
        description: `Pinned Meeting • ${new Date(m.date).toLocaleDateString()}`,
        icon: Pin,
        badge: 'Pinned',
        action: () => { onSelectMeeting(m); setActivePage('summary'); onClose(); }
      });
    });

    meetings.slice(0, 4).forEach(m => {
      items.push({
        id: `recent-${m.meeting_id}`,
        category: 'Recent & Pinned',
        title: m.title,
        description: `Recent Recording • ${new Date(m.date).toLocaleDateString()} • ${(m.duration / 60).toFixed(0)}m`,
        icon: Clock,
        action: () => { onSelectMeeting(m); setActivePage('summary'); onClose(); }
      });
    });

    return items;
  }, [meetings, currentMeeting, recordingState, pinnedMeetingIds, query, setActivePage, onSelectMeeting, startRecording, stopRecording, onClose]);

  // Filter commands by text query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const qLower = query.toLowerCase();
    return allCommands.filter(c => 
      c.title.toLowerCase().includes(qLower) || 
      c.description.toLowerCase().includes(qLower) ||
      c.category.toLowerCase().includes(qLower)
    );
  }, [allCommands, query]);

  // Reset selectedIndex if commands list length changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Scroll active item into view reliably
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation inside search input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Group commands by category with global indexing
  const groupedCommandsWithIndices = useMemo(() => {
    const groups: { category: string; items: { cmd: CommandItem; index: number }[] }[] = [];
    let counter = 0;

    filteredCommands.forEach(cmd => {
      let group = groups.find(g => g.category === cmd.category);
      if (!group) {
        group = { category: cmd.category, items: [] };
        groups.push(group);
      }
      group.items.push({ cmd, index: counter++ });
    });

    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-950/70 backdrop-blur-md px-4 transition-all"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="bg-[#10131c] border border-slate-800/90 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[75vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Search Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-800/80 bg-[#141722]/60 gap-3">
            <Search className="w-5 h-5 text-violet-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command, search meetings, speakers, decisions..."
              className="bg-transparent text-white placeholder-slate-500 text-sm font-medium focus:outline-none flex-1 min-w-0"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded-md">
                <Command className="w-3 h-3" /> K
              </kbd>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Commands Scrollable List */}
          <div className="overflow-y-auto p-2 space-y-4 flex-1">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p className="text-xs font-semibold">No matching command or meeting found.</p>
                <p className="text-[11px] text-slate-600">Try searching for "Analytics", "Transcript", "Whisper" or a speaker name.</p>
              </div>
            ) : (
              groupedCommandsWithIndices.map((group) => (
                <div key={group.category} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    {group.category}
                  </div>
                  {group.items.map(({ cmd, index }) => {
                    const isSelected = index === selectedIndex;
                    const IconComponent = cmd.icon;

                    return (
                      <div
                        key={cmd.id}
                        ref={(el) => (itemRefs.current[index] = el)}
                        onClick={() => cmd.action()}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group ${
                          isSelected 
                            ? 'bg-violet-600/20 border border-violet-500/40 text-white shadow-sm' 
                            : 'hover:bg-slate-900/60 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`p-2 rounded-lg transition-colors shrink-0 ${
                            isSelected ? 'bg-violet-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-slate-200'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{cmd.title}</span>
                              {cmd.badge && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded">
                                  {cmd.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{cmd.description}</p>
                          </div>
                        </div>

                        {/* Keyboard Shortcuts or Action Arrow */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          {cmd.shortcut ? (
                            <div className="flex items-center gap-1">
                              {cmd.shortcut.map((sc, i) => (
                                <kbd key={i} className="px-1.5 py-0.5 text-[9.5px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded">
                                  {sc}
                                </kbd>
                              ))}
                            </div>
                          ) : (
                            <CornerDownLeft className={`w-3.5 h-3.5 transition-opacity ${isSelected ? 'opacity-100 text-violet-400' : 'opacity-0'}`} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer Keyboard Hints */}
          <div className="px-4 py-2 bg-[#0e1016] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400">↑</kbd>
                <kbd className="px-1 py-0.2 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400">Esc</kbd>
                Close
              </span>
            </div>
            <span className="text-violet-400/90 font-bold hidden sm:inline">SAMVAD Launcher v2.0</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
