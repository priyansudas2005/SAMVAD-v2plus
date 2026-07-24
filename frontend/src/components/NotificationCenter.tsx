import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  X, 
  Pin, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter, 
  Radio, 
  Pause, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  BarChart4, 
  MessageSquare, 
  Download, 
  Cpu, 
  AlertTriangle, 
  HardDrive, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type NotificationCategory = 'Recording' | 'Transcription' | 'AI & Intelligence' | 'System & Storage' | 'Export';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationItem {
  id: string;
  type: 
    | 'recording-started'
    | 'recording-paused'
    | 'recording-finished'
    | 'transcript-ready'
    | 'summary-ready'
    | 'analytics-generated'
    | 'ai-response-ready'
    | 'export-completed'
    | 'model-loaded'
    | 'model-failed'
    | 'storage-warning'
    | 'update-available';
  title: string;
  description: string;
  timestamp: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  isRead: boolean;
  isPinned: boolean;
  quickActions?: {
    label: string;
    action: () => void;
    primary?: boolean;
  }[];
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'summary-ready',
    title: 'Executive Meeting Summary Ready',
    description: 'AI synthesized key decisions and action items for "Q3 Product Architecture Sync".',
    timestamp: '2 mins ago',
    category: 'AI & Intelligence',
    priority: 'high',
    isRead: false,
    isPinned: true,
    quickActions: [
      { label: 'View Memo', action: () => {}, primary: true },
      { label: 'Export PDF', action: () => {} }
    ]
  },
  {
    id: 'notif-2',
    type: 'transcript-ready',
    title: 'Transcript Generated (Whisper V3)',
    description: '100% completed with 98.4% speaker diarization accuracy (4 Speakers).',
    timestamp: '15 mins ago',
    category: 'Transcription',
    priority: 'normal',
    isRead: false,
    isPinned: false,
    quickActions: [
      { label: 'Open Studio', action: () => {}, primary: true }
    ]
  },
  {
    id: 'notif-3',
    type: 'recording-finished',
    title: 'Meeting Recording Saved',
    description: '38 minutes of dual-channel audio captured & compressed to local SQLite vault.',
    timestamp: '18 mins ago',
    category: 'Recording',
    priority: 'normal',
    isRead: true,
    isPinned: false
  },
  {
    id: 'notif-4',
    type: 'storage-warning',
    title: 'Storage Capacity Alert',
    description: 'Local workspace storage is at 82% (4.2 GB remaining). Consider archiving older audio.',
    timestamp: '1 hour ago',
    category: 'System & Storage',
    priority: 'urgent',
    isRead: false,
    isPinned: true,
    quickActions: [
      { label: 'Manage Storage', action: () => {}, primary: true }
    ]
  },
  {
    id: 'notif-5',
    type: 'model-loaded',
    title: 'Ollama LLM Engine Initialized',
    description: 'Mistral 7B Instruct local weights loaded into NVIDIA CUDA GPU memory.',
    timestamp: '2 hours ago',
    category: 'AI & Intelligence',
    priority: 'low',
    isRead: true,
    isPinned: false
  },
  {
    id: 'notif-6',
    type: 'export-completed',
    title: 'PDF & DOCX Export Complete',
    description: 'Generated executive meeting brief saved to Downloads folder.',
    timestamp: '3 hours ago',
    category: 'Export',
    priority: 'normal',
    isRead: true,
    isPinned: false
  },
  {
    id: 'notif-7',
    type: 'update-available',
    title: 'SAMVAD v2.4 Studio Update Available',
    description: 'Includes Faster-Whisper v3.1 speedups and new cross-meeting analytics heatmaps.',
    timestamp: 'Yesterday',
    category: 'System & Storage',
    priority: 'normal',
    isRead: true,
    isPinned: false,
    quickActions: [
      { label: 'Update Now', action: () => {}, primary: true }
    ]
  }
];

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // Unread Count
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (unreadOnly && n.isRead) return false;
      if (activeCategory !== 'All' && n.category !== activeCategory) return false;
      return true;
    }).sort((a, b) => {
      // Pinned items stay at top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [notifications, activeCategory, unreadOnly]);

  // Actions
  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  const togglePin = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Icon mapping
  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'recording-started':   return { icon: Radio, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' };
      case 'recording-paused':    return { icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
      case 'recording-finished':  return { icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' };
      case 'transcript-ready':    return { icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/30' };
      case 'summary-ready':       return { icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' };
      case 'analytics-generated': return { icon: BarChart4, color: 'text-indigo-400', bg: 'bg-indigo-500/15 border-indigo-500/30' };
      case 'ai-response-ready':   return { icon: MessageSquare, color: 'text-teal-400', bg: 'bg-teal-500/15 border-teal-500/30' };
      case 'export-completed':    return { icon: Download, color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' };
      case 'model-loaded':       return { icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
      case 'model-failed':       return { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' };
      case 'storage-warning':     return { icon: HardDrive, color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' };
      case 'update-available':    return { icon: RefreshCw, color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/30' };
      default:                    return { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-800/40 border-slate-700' };
    }
  };

  // Redirect Action Handler
  const handleQuickAction = (targetPage: string, notifAction?: () => void) => {
    if (notifAction) notifAction();
    if (onNavigate && targetPage) {
      onNavigate(targetPage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      >
        {/* Desktop Notification Drawer (Right Side Overlay) */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#10131c] border-l border-slate-800/90 shadow-2xl flex flex-col z-50 overflow-hidden transform-gpu"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 bg-[#141722]/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-violet-600/15 border border-violet-500/30 text-violet-400 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="truncate">Notification Center</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-violet-500 text-white rounded-full shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono truncate">SAMVAD Studio System Logs</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1 font-mono"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Categories & Filter Bar */}
          <div className="px-3 py-2 border-b border-slate-800/60 bg-[#0e1016] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-[11px] shrink-0">
            <div className="flex items-center gap-1 shrink-0">
              {['All', 'AI & Intelligence', 'Transcription', 'Recording', 'System & Storage'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-1 rounded-lg font-semibold transition-all shrink-0 ${
                    activeCategory === cat 
                      ? 'bg-violet-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold shrink-0 transition-all border ${
                unreadOnly 
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-700 opacity-60" />
                <p className="text-xs font-semibold">No notifications in this filter.</p>
                <p className="text-[11px] text-slate-600">New system logs and AI completion alerts will appear here.</p>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const iconMeta = getNotificationIcon(notif.type);
                const IconComp = iconMeta.icon;

                // Determine navigation page target based on notification type
                const targetPage = 
                  notif.category === 'AI & Intelligence' ? 'summary' :
                  notif.category === 'Transcription' ? 'transcript' :
                  notif.category === 'Recording' ? 'recorder' :
                  notif.category === 'Export' ? 'summary' : 'settings';

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-xl border transition-all duration-150 relative group ${
                      !notif.isRead 
                        ? 'bg-[#141722] border-slate-700/80 shadow-sm' 
                        : 'bg-[#0e1016]/80 border-slate-800/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Unread Accent Bar */}
                    {!notif.isRead && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-violet-500 rounded-r-full" />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg border shrink-0 ${iconMeta.bg}`}>
                        <IconComp className={`w-4 h-4 ${iconMeta.color}`} />
                      </div>

                      {/* Content Area with pr-16 padding to prevent text overlap with action toolbar */}
                      <div className="flex-1 min-w-0 pr-14">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span>{notif.timestamp}</span>
                          <span>•</span>
                          <span className="text-violet-400">{notif.category}</span>
                          {notif.isPinned && (
                            <span className="text-amber-400 font-bold flex items-center gap-0.5">
                              <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 mt-1.5 leading-snug break-words">{notif.description}</p>

                        {/* Quick Action Redirect Buttons */}
                        {notif.quickActions && notif.quickActions.length > 0 ? (
                          <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/60 flex-wrap">
                            {notif.quickActions.map((qa, i) => (
                              <button
                                key={i}
                                onClick={() => handleQuickAction(targetPage, qa.action)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 ${
                                  qa.primary 
                                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-sm' 
                                    : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'
                                }`}
                              >
                                {qa.label} <ChevronRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleQuickAction(targetPage)}
                            className="mt-2 text-[10px] font-mono font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                          >
                            Open Details <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar (Pinned top right, structured position) */}
                    <div className="absolute right-2 top-2.5 flex items-center gap-1 bg-[#10131c] border border-slate-800 p-1 rounded-lg shadow-lg z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePin(notif.id); }}
                        className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${notif.isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}
                        title={notif.isPinned ? 'Unpin notification' : 'Pin to top'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleRead(notif.id); }}
                        className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${notif.isRead ? 'text-emerald-400' : 'text-slate-400'}`}
                        title={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-3 bg-[#0e1016] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0">
            <button
              onClick={clearAll}
              className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear All Logs
            </button>
            <span className="text-slate-600">SAMVAD Notification Vault</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
