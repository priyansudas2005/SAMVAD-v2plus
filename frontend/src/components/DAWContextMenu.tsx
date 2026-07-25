import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Bookmark, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Download, 
  BrainCircuit, 
  FileText, 
  Clock, 
  Grid, 
  Lock, 
  Unlock, 
  Activity, 
  Pause, 
  Square, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Settings, 
  Sliders, 
  Save, 
  FolderOpen, 
  ChevronRight, 
  Eye, 
  Pin, 
  BarChart2, 
  Check,
  Trash2,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContextMenuPosition {
  x: number;
  y: number;
  targetType: 'waveform' | 'timeline' | 'transport' | 'inspector' | 'monitor';
  targetData?: any;
}

export interface DAWContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  
  // Callbacks for Waveform / Timeline Actions
  onAddMarker?: () => void;
  onRenameMarker?: () => void;
  onDeleteMarker?: () => void;
  onBookmarkTime?: () => void;
  onCopyTimestamp?: () => void;
  onZoomToSelection?: () => void;
  onFitRecording?: () => void;
  onJumpToBeginning?: () => void;
  onJumpToPlayhead?: () => void;
  onExportSelectedAudio?: () => void;
  onAskAiSegment?: () => void;
  onOpenTranscriptTimestamp?: () => void;
  
  // Callbacks for Timeline Actions
  onJumpToTime?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onToggleGrid?: () => void;
  onToggleTimeRuler?: () => void;
  onToggleFollowRecording?: () => void;
  onToggleLockTimeline?: () => void;
  
  // Callbacks for Transport Actions
  onStartRecording?: () => void;
  onPauseRecording?: () => void;
  onStopRecording?: () => void;
  onRestartSession?: () => void;
  onToggleMonitoring?: () => void;
  onOpenRecordingPreferences?: () => void;
  
  // Callbacks for Inspector Actions
  onResetValues?: () => void;
  onSavePreset?: () => void;
  onLoadPreset?: () => void;
  onCollapseSection?: () => void;
  onExpandAll?: () => void;
  onCopyConfiguration?: () => void;
  
  // Callbacks for Monitor Actions
  onCopyMetrics?: () => void;
  onExportDiagnostics?: () => void;
  onResetStatistics?: () => void;
  onShowDetailedView?: () => void;
  onPinMetrics?: () => void;
  
  // Active States
  recordingState?: 'idle' | 'recording' | 'paused' | 'stopped';
  isMuteMonitoring?: boolean;
  followRecording?: boolean;
  scrollLock?: boolean;
}

export const DAWContextMenu: React.FC<DAWContextMenuProps> = ({
  position,
  onClose,
  onAddMarker,
  onRenameMarker,
  onDeleteMarker,
  onBookmarkTime,
  onCopyTimestamp,
  onZoomToSelection,
  onFitRecording,
  onJumpToBeginning,
  onJumpToPlayhead,
  onExportSelectedAudio,
  onAskAiSegment,
  onOpenTranscriptTimestamp,
  onJumpToTime,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleGrid,
  onToggleTimeRuler,
  onToggleFollowRecording,
  onToggleLockTimeline,
  onStartRecording,
  onPauseRecording,
  onStopRecording,
  onRestartSession,
  onToggleMonitoring,
  onOpenRecordingPreferences,
  onResetValues,
  onSavePreset,
  onLoadPreset,
  onCollapseSection,
  onExpandAll,
  onCopyConfiguration,
  onCopyMetrics,
  onExportDiagnostics,
  onResetStatistics,
  onShowDetailedView,
  onPinMetrics,
  recordingState = 'idle',
  isMuteMonitoring = false,
  followRecording = true,
  scrollLock = false
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Close context menu on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (position) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [position, onClose]);

  if (!position) return null;

  // Viewport Edge Collision Boundary Check
  const menuWidth = 240;
  const menuHeight = 320;
  const adjustedX = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(position.y, window.innerHeight - menuHeight - 10);

  const renderMenuItem = (
    label: string, 
    icon: React.ElementType, 
    action?: () => void, 
    shortcut?: string, 
    disabled?: boolean,
    submenuKey?: string
  ) => {
    const Icon = icon;
    return (
      <button
        key={label}
        onClick={() => {
          if (disabled) return;
          if (action) {
            action();
            onClose();
          }
        }}
        onMouseEnter={() => submenuKey && setActiveSubmenu(submenuKey)}
        disabled={disabled}
        className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono transition-all select-none ${
          disabled 
            ? 'opacity-30 cursor-not-allowed text-slate-500' 
            : 'text-slate-200 hover:text-white hover:bg-[#8B5CF6]/20 hover:border-[#8B5CF6]/30 cursor-pointer active:scale-[0.98]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
          <span>{label}</span>
        </div>

        {shortcut && (
          <span className="text-[9.5px] text-slate-400 font-mono tracking-wider ml-4 px-1 rounded bg-[#030407] border border-white/[0.06]">
            {shortcut}
          </span>
        )}

        {submenuKey && (
          <ChevronRight className="w-3 h-3 text-slate-500 ml-2" />
        )}
      </button>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed z-[100000] w-60 bg-[#0c0e14]/95 backdrop-blur-2xl border border-white/10 rounded-xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] font-mono text-xs select-none"
        style={{ top: adjustedY, left: adjustedX }}
      >
        {/* WAVEFORM CONTEXT MENU */}
        {position.targetType === 'waveform' && (
          <div className="space-y-0.5">
            <div className="text-[8.5px] font-extrabold text-[#8B5CF6] uppercase px-2 py-1 tracking-widest border-b border-white/[0.06] mb-1">
              WAVEFORM ACTIONS
            </div>
            {renderMenuItem('Add Marker', MapPin, onAddMarker, 'Key M')}
            {renderMenuItem('Rename Marker', Pencil, onRenameMarker, 'F2')}
            {renderMenuItem('Delete Marker', Trash2, onDeleteMarker, 'Del')}
            {renderMenuItem('Bookmark Time', Bookmark, onBookmarkTime, 'Key B')}
            {renderMenuItem('Copy Timestamp', Copy, onCopyTimestamp, 'Cmd+C')}
            
            <div className="h-px bg-white/[0.06] my-1" />
            
            {renderMenuItem('Zoom to Selection', ZoomIn, onZoomToSelection, '+')}
            {renderMenuItem('Fit Entire Recording', Maximize2, onFitRecording, 'Key F')}
            {renderMenuItem('Jump to Playhead', Play, onJumpToPlayhead, 'Home')}
            {renderMenuItem('Export Selected Audio', Download, onExportSelectedAudio, 'Cmd+E', true)}
            
            <div className="h-px bg-white/[0.06] my-1" />

            {renderMenuItem('Ask AI About Segment', BrainCircuit, onAskAiSegment, 'Cmd+AI')}
            {renderMenuItem('Open Transcript At Time', FileText, onOpenTranscriptTimestamp, 'Enter')}
          </div>
        )}

        {/* TIMELINE CONTEXT MENU */}
        {position.targetType === 'timeline' && (
          <div className="space-y-0.5">
            <div className="text-[8.5px] font-extrabold text-[#8B5CF6] uppercase px-2 py-1 tracking-widest border-b border-white/[0.06] mb-1">
              TIMELINE CONTROLS
            </div>
            {renderMenuItem('Add Marker', MapPin, onAddMarker, 'Key M')}
            {renderMenuItem('Jump to Time', Clock, onJumpToTime, 'Cmd+J')}
            
            <div className="h-px bg-white/[0.06] my-1" />

            {renderMenuItem('Zoom In', ZoomIn, onZoomIn, '+')}
            {renderMenuItem('Zoom Out', ZoomOut, onZoomOut, '-')}
            {renderMenuItem('Reset Zoom', Maximize2, onResetZoom, '100%')}
            
            <div className="h-px bg-white/[0.06] my-1" />

            {renderMenuItem('Toggle Grid', Grid, onToggleGrid, 'Key G')}
            {renderMenuItem('Toggle Time Ruler', Clock, onToggleTimeRuler, 'Key R')}
            {renderMenuItem('Follow Recording', Activity, onToggleFollowRecording, 'Key F')}
            {renderMenuItem(scrollLock ? 'Unlock Timeline' : 'Lock Timeline', scrollLock ? Unlock : Lock, onToggleLockTimeline, 'Key L')}
          </div>
        )}

        {/* TRANSPORT CONTEXT MENU */}
        {position.targetType === 'transport' && (
          <div className="space-y-0.5">
            <div className="text-[8.5px] font-extrabold text-[#8B5CF6] uppercase px-2 py-1 tracking-widest border-b border-white/[0.06] mb-1">
              TRANSPORT HARDWARE
            </div>
            {renderMenuItem('Start Recording', Play, onStartRecording, 'Space', recordingState === 'recording')}
            {renderMenuItem('Pause', Pause, onPauseRecording, 'Space', recordingState === 'idle')}
            {renderMenuItem('Stop', Square, onStopRecording, 'Esc', recordingState === 'idle')}
            {renderMenuItem('Restart Session', RotateCcw, onRestartSession, 'Cmd+R')}
            
            <div className="h-px bg-white/[0.06] my-1" />

            {renderMenuItem(isMuteMonitoring ? 'Unmute Monitoring' : 'Mute Monitoring', isMuteMonitoring ? Volume2 : VolumeX, onToggleMonitoring, 'Key M')}
            {renderMenuItem('Recording Preferences', Settings, onOpenRecordingPreferences, 'Cmd+,')}
          </div>
        )}

        {/* INSPECTOR CONTEXT MENU */}
        {position.targetType === 'inspector' && (
          <div className="space-y-0.5">
            <div className="text-[8.5px] font-extrabold text-[#8B5CF6] uppercase px-2 py-1 tracking-widest border-b border-white/[0.06] mb-1">
              INSPECTOR CONTROLS
            </div>
            {renderMenuItem('Reset Values', RotateCcw, onResetValues, 'Alt+R')}
            {renderMenuItem('Save Preset', Save, onSavePreset, 'Cmd+S')}
            {renderMenuItem('Load Preset', FolderOpen, onLoadPreset, 'Cmd+O')}
            
            <div className="h-px bg-white/[0.06] my-1" />

            {renderMenuItem('Collapse Section', Sliders, onCollapseSection)}
            {renderMenuItem('Expand All', Maximize2, onExpandAll)}
            {renderMenuItem('Copy Configuration', Copy, onCopyConfiguration, 'Cmd+C')}
          </div>
        )}

        {/* MONITOR CONTEXT MENU */}
        {position.targetType === 'monitor' && (
          <div className="space-y-0.5">
            <div className="text-[8.5px] font-extrabold text-[#8B5CF6] uppercase px-2 py-1 tracking-widest border-b border-white/[0.06] mb-1">
              MONITOR TELEMETRY
            </div>
            {renderMenuItem('Copy Metrics', Copy, onCopyMetrics, 'Cmd+C')}
            {renderMenuItem('Export Diagnostics', Download, onExportDiagnostics, 'Cmd+D')}
            {renderMenuItem('Reset Statistics', RotateCcw, onResetStatistics, 'Alt+R')}
            
            <div className="h-px bg-white/[0.06] my-1" />

            {renderMenuItem('Show Detailed View', Eye, onShowDetailedView)}
            {renderMenuItem('Pin Metrics', Pin, onPinMetrics, 'Key P')}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
