import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  Edit3, 
  Copy, 
  ExternalLink, 
  Download, 
  Bookmark, 
  Pin, 
  Sparkles, 
  MessageSquare, 
  Trash2, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  GitCommit, 
  AlertTriangle, 
  BarChart4, 
  Radio, 
  Layers, 
  Share2, 
  Clock, 
  CornerDownLeft,
  Sliders,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ContextMenuTargetType = 
  | 'meeting-card'
  | 'transcript-segment'
  | 'action-item'
  | 'decision'
  | 'risk'
  | 'ai-response'
  | 'timeline-event'
  | 'analytics-chart'
  | 'recorder-session';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string[];
  action?: () => void;
  danger?: boolean;
  disabled?: boolean;
  submenu?: ContextMenuItem[];
}

export interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  targetType: ContextMenuTargetType;
  targetData?: any;
  onAction?: (actionId: string, data?: any) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  isOpen,
  onClose,
  targetType,
  targetData,
  onAction
}) => {
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Generate context-aware menu items based on targetType
  const getMenuItems = (): ContextMenuItem[] => {
    switch (targetType) {
      case 'meeting-card':
        return [
          { id: 'open-meeting', label: 'Open Meeting Details', icon: FolderOpen, shortcut: ['↵'], action: () => onAction?.('open', targetData) },
          { id: 'open-transcript', label: 'Open Transcript Studio', icon: FileText, shortcut: ['Ctrl', '3'], action: () => onAction?.('open-transcript', targetData) },
          { id: 'generate-summary', label: 'Generate AI Summary', icon: Sparkles, shortcut: ['Ctrl', '4'], action: () => onAction?.('summary', targetData) },
          {
            id: 'export-menu',
            label: 'Export Meeting As...',
            icon: Download,
            submenu: [
              { id: 'export-pdf', label: 'PDF Document (.pdf)', icon: FileText, action: () => onAction?.('export-pdf', targetData) },
              { id: 'export-docx', label: 'Word Document (.docx)', icon: FileText, action: () => onAction?.('export-docx', targetData) },
              { id: 'export-markdown', label: 'Markdown Text (.md)', icon: FileText, action: () => onAction?.('export-md', targetData) },
              { id: 'export-json', label: 'JSON Data (.json)', icon: FileText, action: () => onAction?.('export-json', targetData) }
            ]
          },
          { id: 'pin-meeting', label: targetData?.isPinned ? 'Unpin Meeting' : 'Pin Meeting to Top', icon: Pin, action: () => onAction?.('pin', targetData) },
          { id: 'bookmark-meeting', label: 'Bookmark Session', icon: Bookmark, action: () => onAction?.('bookmark', targetData) },
          { id: 'copy-link', label: 'Copy Session Link', icon: ExternalLink, shortcut: ['Ctrl', 'C'], action: () => onAction?.('copy-link', targetData) },
          { id: 'delete-meeting', label: 'Delete Meeting', icon: Trash2, danger: true, action: () => onAction?.('delete', targetData) }
        ];

      case 'transcript-segment':
        return [
          { id: 'copy-text', label: 'Copy Segment Text', icon: Copy, shortcut: ['Ctrl', 'C'], action: () => onAction?.('copy-text', targetData) },
          { id: 'edit-segment', label: 'Edit Transcript Segment', icon: Edit3, action: () => onAction?.('edit-segment', targetData) },
          { id: 'ask-ai-segment', label: 'Ask AI About This Quote', icon: MessageSquare, shortcut: ['Ctrl', '6'], action: () => onAction?.('ask-ai', targetData) },
          { id: 'bookmark-segment', label: 'Bookmark Timestamp', icon: Bookmark, action: () => onAction?.('bookmark-segment', targetData) },
          { id: 'reassign-speaker', label: 'Reassign Speaker', icon: Sliders, action: () => onAction?.('reassign-speaker', targetData) }
        ];

      case 'action-item':
        return [
          { id: 'toggle-complete', label: 'Mark as Completed', icon: CheckCircle2, action: () => onAction?.('toggle-complete', targetData) },
          { id: 'reassign-owner', label: 'Reassign Task Owner', icon: Edit3, action: () => onAction?.('reassign-owner', targetData) },
          { id: 'copy-action', label: 'Copy Action Item', icon: Copy, action: () => onAction?.('copy-action', targetData) },
          { id: 'delete-action', label: 'Delete Action Item', icon: Trash2, danger: true, action: () => onAction?.('delete-action', targetData) }
        ];

      case 'decision':
        return [
          { id: 'copy-decision', label: 'Copy Decision Text', icon: Copy, action: () => onAction?.('copy-decision', targetData) },
          { id: 'verify-consensus', label: 'Verify Consensus in Transcript', icon: GitCommit, action: () => onAction?.('verify-consensus', targetData) },
          { id: 'edit-decision', label: 'Edit Decision Record', icon: Edit3, action: () => onAction?.('edit-decision', targetData) }
        ];

      case 'risk':
        return [
          { id: 'escalate-risk', label: 'Escalate Risk Level', icon: AlertTriangle, action: () => onAction?.('escalate-risk', targetData) },
          { id: 'copy-risk', label: 'Copy Risk Description', icon: Copy, action: () => onAction?.('copy-risk', targetData) }
        ];

      case 'ai-response':
        return [
          { id: 'copy-ai-response', label: 'Copy AI Response', icon: Copy, shortcut: ['Ctrl', 'C'], action: () => onAction?.('copy-ai', targetData) },
          { id: 'regenerate-ai', label: 'Regenerate via Ollama', icon: Sparkles, action: () => onAction?.('regenerate-ai', targetData) },
          { id: 'export-ai-text', label: 'Save as Note', icon: FileText, action: () => onAction?.('save-note', targetData) }
        ];

      case 'timeline-event':
        return [
          { id: 'jump-timestamp', label: 'Jump to Timestamp', icon: Clock, shortcut: ['↵'], action: () => onAction?.('jump-timestamp', targetData) },
          { id: 'copy-timestamp', label: 'Copy Timestamp Link', icon: ExternalLink, action: () => onAction?.('copy-timestamp', targetData) }
        ];

      case 'analytics-chart':
        return [
          { id: 'export-chart-png', label: 'Export Chart PNG', icon: Download, action: () => onAction?.('export-chart-png', targetData) },
          { id: 'filter-chart-data', label: 'Filter Chart View', icon: BarChart4, action: () => onAction?.('filter-chart', targetData) }
        ];

      case 'recorder-session':
        return [
          { id: 'pause-rec', label: 'Pause Capture', icon: Radio, shortcut: ['Space'], action: () => onAction?.('pause-rec', targetData) },
          { id: 'stop-save', label: 'Stop & Run Whisper', icon: CheckCircle2, shortcut: ['Ctrl', 'S'], action: () => onAction?.('stop-save', targetData) },
          { id: 'discard-rec', label: 'Discard Recording', icon: Trash2, danger: true, action: () => onAction?.('discard-rec', targetData) }
        ];

      default:
        return [];
    }
  };

  if (!isOpen) return null;

  const menuItems = getMenuItems();

  // Keep menu inside viewport boundaries
  const adjustedX = Math.min(x, window.innerWidth - 240);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
        className="fixed z-50 w-56 bg-[#10131c]/95 backdrop-blur-md border border-slate-800/90 shadow-2xl rounded-xl p-1.5 font-sans select-none text-xs transform-gpu"
      >
        {menuItems.map((item) => {
          const IconComp = item.icon;

          return (
            <div 
              key={item.id}
              className="relative"
              onMouseEnter={() => setActiveSubmenuId(item.submenu ? item.id : null)}
            >
              <button
                onClick={() => {
                  if (item.action && !item.disabled) {
                    item.action();
                    onClose();
                  }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors duration-75 group ${
                  item.disabled 
                    ? 'opacity-40 cursor-not-allowed text-slate-500' 
                    : item.danger 
                      ? 'hover:bg-rose-500/15 text-rose-400 font-semibold' 
                      : 'hover:bg-violet-600/20 text-slate-200 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComp className={`w-3.5 h-3.5 shrink-0 ${item.danger ? 'text-rose-400' : 'text-slate-400 group-hover:text-violet-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.shortcut && (
                    <div className="flex items-center gap-0.5">
                      {item.shortcut.map((sc, i) => (
                        <kbd key={i} className="px-1 py-0.2 text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded">
                          {sc}
                        </kbd>
                      ))}
                    </div>
                  )}

                  {item.submenu && <ChevronRight className="w-3 h-3 text-slate-500" />}
                </div>
              </button>

              {/* Submenu Overlay */}
              {item.submenu && activeSubmenuId === item.id && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute left-full top-0 ml-1 w-52 bg-[#10131c]/95 backdrop-blur-md border border-slate-800/90 shadow-2xl rounded-xl p-1.5 z-50"
                >
                  {item.submenu.map((subItem) => {
                    const SubIcon = subItem.icon;
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          if (subItem.action) {
                            subItem.action();
                            onClose();
                          }
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-violet-600/20 text-slate-200 hover:text-white transition-colors"
                      >
                        <SubIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{subItem.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
};
