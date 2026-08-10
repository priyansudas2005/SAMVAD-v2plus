import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Sparkles, LayoutDashboard, Mic, AlertCircle, RefreshCw, Radio, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { NotificationCenter } from './components/NotificationCenter';
import { KeyboardProvider } from './components/KeyboardShortcuts';
import { 
  DashboardSkeleton, 
  RecorderSkeleton, 
  HistorySkeleton, 
  TranscriptSkeleton, 
  SummarySkeleton, 
  AnalyticsSkeleton, 
  QASkeleton, 
  SettingsSkeleton 
} from './components/Skeletons';
import { DashboardPage } from './pages/DashboardPage';
import { DAWRecorderPage } from './pages/DAWRecorderPage';
import { AudioInspector } from './components/AudioInspector';
import { TranscriptPage } from './pages/TranscriptPage';
import { SummaryPage } from './pages/SummaryPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Meeting } from './types';
import { api } from './services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CosmicDustBackground } from './components/CosmicDustBackground';
import { OnboardingWizard } from './components/OnboardingWizard';
import { InteractiveProductTour } from './components/InteractiveProductTour';
import { HelpLearningCenter } from './components/HelpLearningCenter';
import { useProfile } from './hooks/useProfile';
import { OnboardingModal } from './components/OnboardingModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';

import { SettingsProvider } from './context/SettingsContext';

const QAPage = lazy(() => import('./pages/QAPage').then(m => ({ default: m.QAPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then(m => ({ default: m.StatsPage })));

const NoMeetingSelected: React.FC<{ setActivePage: (p: string) => void; title?: string }> = ({ setActivePage, title = "No Active Meeting Selected" }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent min-h-[400px]">
    <div className="w-16 h-16 rounded-3xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 shadow-[0_0_30px_rgba(139,92,246,0.2)] animate-pulse">
      <Sparkles className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
    <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
      Please select a meeting from the Meeting History or Dashboard, or record audio in Studio Recorder / upload an audio file to view AI analysis.
    </p>
    <div className="flex items-center gap-3">
      <button
        onClick={() => setActivePage('dashboard')}
        className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2"
      >
        <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
      </button>
      <button
        onClick={() => setActivePage('recorder')}
        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 font-semibold text-xs transition-all flex items-center gap-2"
      >
        <Mic className="w-4 h-4 text-sky-400" /> Studio Recorder
      </button>
    </div>
  </div>
);

const TabSkeleton = () => (
  <div className="flex-1 bg-slate-950 p-8 space-y-6 animate-pulse w-full h-screen overflow-hidden">
    <div className="h-8 bg-slate-900 rounded-lg w-1/4"></div>
    <div className="h-48 bg-slate-900 rounded-2xl"></div>
    <div className="h-32 bg-slate-900 rounded-2xl"></div>
  </div>
);

// Initial theme check before first render to prevent flashing (Fix 2C/3)
const initialTheme = localStorage.getItem('samvad-theme') || 'dark';
document.documentElement.className = '';
if (initialTheme === 'light') {
  document.documentElement.classList.add('theme-light');
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 }
};

function App() {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingsReady, setMeetingsReady] = useState<boolean>(false);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [appError, setAppError] = useState<string | null>(null);
  const { profile, initials, hasProfile, createProfile, logout } = useProfile();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [isProductTourOpen, setIsProductTourOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !localStorage.getItem('samvad_onboarded');
  });

  // Global Ctrl+K / Cmd+K Command Palette Trigger
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Global Recording States
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [duration, setDuration] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Whisper model parameters
  const [modelSize, setModelSize] = useState<string>('base');
  const [language, setLanguage] = useState<string>('auto');
  const [vadEnabled, setVadEnabled] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Global Audio File Upload & Background Transcription State
  const [globalUploading, setGlobalUploading] = useState<boolean>(false);
  const [globalUploadFileName, setGlobalUploadFileName] = useState<string>('');
  const [globalUploadError, setGlobalUploadError] = useState<string | null>(null);

  // Global background processing map: { [meeting_id]: { title: string } }
  const [processingMeetings, setProcessingMeetings] = useState<Record<string, { title: string }>>({});

  const currentMeetingRef = useRef<Meeting | null>(null);
  useEffect(() => {
    currentMeetingRef.current = currentMeeting;
  }, [currentMeeting]);

  const startBackgroundProcessing = async (
    meetingId: string,
    options: { modelSize?: string; language?: string; vadEnabled?: boolean; title?: string }
  ) => {
    const meetingTitle = options.title || 'Audio File';
    setProcessingMeetings(prev => ({
      ...prev,
      [meetingId]: { title: meetingTitle }
    }));

    try {
      const updated = await api.processMeeting(meetingId, {
        modelSize: options.modelSize,
        language: options.language,
        vadEnabled: options.vadEnabled,
      });

      // Update full meetings list
      await fetchMeetingsList();

      // If this meeting is currently active, update the view state
      if (currentMeetingRef.current && currentMeetingRef.current.meeting_id === meetingId) {
        setCurrentMeeting(updated);
      }
    } catch (err: any) {
      console.error(`Background processing failed for ${meetingId}:`, err);
      setGlobalUploadError(err.message || 'Background processing failed.');
    } finally {
      setProcessingMeetings(prev => {
        const next = { ...prev };
        delete next[meetingId];
        return next;
      });
    }
  };

  const handleCancelProcessing = async (meetingId: string) => {
    try {
      await api.cancelMeetingProcessing(meetingId);
      setProcessingMeetings(prev => {
        const next = { ...prev };
        delete next[meetingId];
        return next;
      });
      if (currentMeetingRef.current && currentMeetingRef.current.meeting_id === meetingId) {
        const refreshed = await api.getMeeting(meetingId);
        setCurrentMeeting(refreshed);
      }
    } catch (err: any) {
      console.error(`Failed to cancel processing for ${meetingId}:`, err);
    }
  };

  const handleGlobalUpload = async (file: File) => {
    setGlobalUploading(true);
    setGlobalUploadFileName(file.name);
    setGlobalUploadError(null);

    try {
      const uploadTitle = file.name.replace(/\.[^/.]+$/, '');
      const newMeeting = await api.uploadAudio(file, uploadTitle);
      await fetchMeetingsList();
      setCurrentMeeting(newMeeting);
      setActivePage('transcript');

      // Instantly start background processing in App.tsx (non-blocking)
      startBackgroundProcessing(newMeeting.meeting_id, {
        modelSize: modelSize || 'base',
        language: language === 'auto' ? undefined : language,
        vadEnabled: vadEnabled || false,
        title: uploadTitle
      });
    } catch (err: any) {
      console.error('Global upload failed:', err);
      setGlobalUploadError(err.message || 'Failed to upload audio file.');
    } finally {
      setGlobalUploading(false);
    }
  };

  const fetchMeetingsList = async () => {
    try {
      const data = await api.getMeetings();
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMeetings(sorted);
      setMeetingsReady(true);
      
      if (currentMeeting) {
        const found = sorted.find(m => m.meeting_id === currentMeeting.meeting_id);
        if (found) setCurrentMeeting(found);
        else if (sorted.length > 0) setCurrentMeeting(sorted[0]);
      } else if (sorted.length > 0) {
        setCurrentMeeting(sorted[0]);
      }
    } catch (err) {
      console.error(err);
      setMeetingsReady(true); // Still mark ready so UI isn't stuck
    }
  };

  // Auto-select latest meeting when list loads or changes if none selected
  useEffect(() => {
    if (!currentMeeting && meetings.length > 0) {
      setCurrentMeeting(meetings[0]);
    }
  }, [meetings, currentMeeting]);

  useEffect(() => {
    let isMounted = true;

    // Show the UI immediately — don't block on data fetch
    setLoading(false);

    // Fetch meetings in background (doesn't block UI render)
    const fetchData = async () => {
      try {
        await fetchMeetingsList();
      } catch (e) {
        console.error('Failed to load meetings:', e);
      }
      // Fetch settings separately — non-blocking, best effort
      try {
        const settings = await api.getSettings();
        if (settings && isMounted) {
          setModelSize(settings.model_size || 'base');
          setLanguage(settings.default_language || 'auto');
          setVadEnabled(settings.vad_enabled || false);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Timer side-effect
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  // Recording capture source choice ('mic', 'system', 'both')
  const [captureSource, setCaptureSource] = useState<'mic' | 'system' | 'both'>('mic');

  // Global recording controls
  const startRecording = async () => {
    setRecordingError(null);
    audioChunksRef.current = [];
    setDuration(0);

    try {
      let audioStream: MediaStream;

      if (captureSource === 'mic') {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else if (captureSource === 'system') {
        const sysStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const audioTracks = sysStream.getAudioTracks();
        if (audioTracks.length === 0) {
          sysStream.getTracks().forEach(t => t.stop());
          throw new Error("No system audio shared. Check the 'Share Audio' option when selecting a tab!");
        }
        audioStream = new MediaStream(audioTracks);
      } else {
        // Mix microphone and system audio
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const sysStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const sysTracks = sysStream.getAudioTracks();
        
        if (sysTracks.length === 0) {
          micStream.getTracks().forEach(t => t.stop());
          sysStream.getTracks().forEach(t => t.stop());
          throw new Error("No system audio shared. Check the 'Share Audio' option when selecting a tab!");
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const dest = ctx.createMediaStreamDestination();

        const micSource = ctx.createMediaStreamSource(micStream);
        const sysSource = ctx.createMediaStreamSource(new MediaStream(sysTracks));

        micSource.connect(dest);
        sysSource.connect(dest);

        audioStream = dest.stream;
      }

      setStream(audioStream);

      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordingState('stopped');
      };

      mediaRecorder.start(1000);
      setRecordingState('recording');
      setTitle(`Meeting recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      
      // Route immediately to Recorder visualizer page
      setActivePage('recorder');
    } catch (err: any) {
      console.error(err);
      setRecordingError(err.message || 'Microphone/System audio access denied.');
      setRecordingState('idle');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const discardRecording = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setRecordingState('idle');
    setDuration(0);
    setTitle('');
    setRecordingError(null);
    audioChunksRef.current = [];
  };

  const saveRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      setRecordingError('No audio recorded.');
      return;
    }
    setUploading(true);
    setRecordingError(null);

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

    try {
      const finalTitle = title.trim() || 'Recorded Meeting';
      const meeting = await api.uploadRecording(audioBlob, finalTitle);
      
      // Fetch full meeting list again
      await fetchMeetingsList();
      setCurrentMeeting(meeting);
      
      // Reset recording state
      setStream(null);
      setRecordingState('idle');
      setDuration(0);
      setTitle('');
      
      // Auto route to transcript page
      setActivePage('transcript');
    } catch (err: any) {
      console.error(err);
      setRecordingError(err.message || 'Failed to save audio recording.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectMeeting = async (meeting: Meeting) => {
    try {
      setLoading(true);
      const details = await api.getMeeting(meeting.meeting_id);
      setCurrentMeeting(details);
    } catch (err) {
      console.error(err);
      setCurrentMeeting(meeting);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCurrentMeeting = (updated: Meeting) => {
    setCurrentMeeting(updated);
    setMeetings(prev => prev.map(m => m.meeting_id === updated.meeting_id ? updated : m));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-100 relative z-10">
      {/* ── Cosmic Dust Particle Background ──────────────────────────────── */}
      <CosmicDustBackground />

      
      {/* ── Layered Atmospheric Environment ─────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Deep radial ambient lighting vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#030408_100%)] opacity-85 z-10" />
        
        {/* Volumetric mesh gradients (violet bloom, indigo center, cyan lower-right) */}
        <div 
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-violet-600/12 to-transparent blur-[130px] opacity-90"
          style={{ animation: 'orb-slow-drift 45s infinite alternate ease-in-out' }}
        />
        <div 
          className="absolute top-[20%] left-[20%] w-[55%] h-[55%] rounded-full bg-gradient-to-tr from-indigo-600/10 to-transparent blur-[140px] opacity-80"
          style={{ animation: 'orb-slow-drift-rev 55s infinite alternate ease-in-out' }}
        />
        <div 
          className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-sky-500/8 to-transparent blur-[120px] opacity-85"
          style={{ animation: 'orb-slow-drift 60s infinite alternate ease-in-out' }}
        />
      </div>

      <Sidebar 
        activePage={activePage}
        setActivePage={setActivePage}
        currentMeeting={currentMeeting}
        meetings={meetings}
        onSelectMeeting={handleSelectMeeting}
        recordingState={recordingState}
        duration={duration}
        recordingError={recordingError}
        uploading={uploading}
        title={title}
        setTitle={setTitle}
        startRecording={startRecording}
        pauseRecording={pauseRecording}
        resumeRecording={resumeRecording}
        stopRecording={stopRecording}
        discardRecording={discardRecording}
        saveRecording={saveRecording}
        
        // Model parameters
        modelSize={modelSize}
        setModelSize={setModelSize}
        language={language}
        setLanguage={setLanguage}
        vadEnabled={vadEnabled}
        setVadEnabled={setVadEnabled}
        
        // Loopback Mixer Capture Source
        captureSource={captureSource}
        setCaptureSource={setCaptureSource}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onStartTour={() => setIsProductTourOpen(true)}
        userProfile={profile ? { name: profile.name, initials } : null}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onToggleTheme={() => {
          const current = localStorage.getItem('samvad-theme') || 'dark';
          const next = current === 'dark' ? 'light' : 'dark';
          localStorage.setItem('samvad-theme', next);
          document.documentElement.className = '';
          if (next === 'light') document.documentElement.classList.add('theme-light');
        }}
      />
      <main className="flex-1 flex flex-col min-w-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-[#040404]/80 backdrop-blur-md z-[99] flex flex-col items-center justify-center gap-6">
            <div className="samvad-loader" />
            <div className="text-xs font-bold text-[#F5F7FA] uppercase tracking-widest font-mono text-center">
              SAMVAD Engine Initializing...
            </div>
          </div>
        )}

        {appError && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-500 text-xs font-semibold px-6 py-3 flex items-center justify-between">
            <span>⚠️ {appError}</span>
            <button 
              onClick={() => { setAppError(null); fetchMeetingsList(); }}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Page Routing Switch (Fix 1A) */}
        <AnimatePresence mode="wait">
          {activePage === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              <DashboardPage 
                meetings={meetings}
                meetingsReady={meetingsReady}
                onSelectMeeting={handleSelectMeeting}
                setActivePage={setActivePage}
                refreshMeetings={fetchMeetingsList}
                onUploadFile={handleGlobalUpload}
                globalUploading={globalUploading}
              />
            </motion.div>
          )}

          {activePage === 'recorder' && (
            <motion.div
              key="recorder"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              <DAWRecorderPage 
                stream={stream}
                recordingState={recordingState}
                duration={duration}
                title={title}
                setTitle={setTitle}
                recordingError={recordingError}
                uploading={uploading}
                startRecording={startRecording}
                pauseRecording={pauseRecording}
                resumeRecording={resumeRecording}
                stopRecording={stopRecording}
                discardRecording={discardRecording}
                saveRecording={saveRecording}
                modelSize={modelSize}
                setModelSize={setModelSize}
                language={language}
                setLanguage={setLanguage}
                vadEnabled={vadEnabled}
                setVadEnabled={setVadEnabled}
                captureSource={captureSource}
                setCaptureSource={setCaptureSource}
              />
            </motion.div>
          )}

          {activePage === 'history' && (
            <motion.div
              key="history"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              <HistoryPage 
                meetings={meetings}
                onSelectMeeting={handleSelectMeeting}
                setActivePage={setActivePage}
                refreshMeetings={fetchMeetingsList}
              />
            </motion.div>
          )}

          {activePage === 'transcript' && (
            <motion.div
              key={`transcript-${currentMeeting?.meeting_id || 'none'}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              {currentMeeting ? (
                <TranscriptPage 
                  currentMeeting={currentMeeting}
                  onUpdateMeeting={handleUpdateCurrentMeeting}
                  isProcessing={!!processingMeetings[currentMeeting.meeting_id]}
                  onStartProcessing={(options) => startBackgroundProcessing(currentMeeting.meeting_id, options)}
                  onCancelProcessing={() => handleCancelProcessing(currentMeeting.meeting_id)}
                />
              ) : (
                <NoMeetingSelected setActivePage={setActivePage} title="No Active Transcript Selected" />
              )}
            </motion.div>
          )}

          {activePage === 'summary' && (
            <motion.div
              key={`summary-${currentMeeting?.meeting_id || 'none'}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              {currentMeeting ? (
                <SummaryPage 
                  currentMeeting={currentMeeting}
                  isProcessing={!!processingMeetings[currentMeeting.meeting_id]}
                  setActivePage={setActivePage}
                  onCancelProcessing={() => handleCancelProcessing(currentMeeting.meeting_id)}
                />
              ) : (
                <NoMeetingSelected setActivePage={setActivePage} title="No Meeting Selected for Memo" />
              )}
            </motion.div>
          )}

          {activePage === 'stats' && (
            <motion.div
              key={`stats-${currentMeeting?.meeting_id || 'none'}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              {currentMeeting ? (
                <Suspense fallback={<TabSkeleton />}>
                  <StatsPage 
                    currentMeeting={currentMeeting} 
                    onUpdateMeeting={handleUpdateCurrentMeeting} 
                    isProcessing={!!processingMeetings[currentMeeting.meeting_id]}
                    setActivePage={setActivePage}
                    onCancelProcessing={() => handleCancelProcessing(currentMeeting.meeting_id)}
                  />
                </Suspense>
              ) : (
                <NoMeetingSelected setActivePage={setActivePage} title="No Meeting Selected for Stats" />
              )}
            </motion.div>
          )}

          {activePage === 'qa' && (
            <motion.div
              key={`qa-${currentMeeting?.meeting_id || 'none'}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              {currentMeeting ? (
                <Suspense fallback={<QASkeleton />}>
                  <QAPage 
                    currentMeeting={currentMeeting}
                    onUpdateMeeting={handleUpdateCurrentMeeting}
                    isProcessing={!!processingMeetings[currentMeeting.meeting_id]}
                    setActivePage={setActivePage}
                    onCancelProcessing={() => handleCancelProcessing(currentMeeting.meeting_id)}
                  />
                </Suspense>
              ) : (
                <NoMeetingSelected setActivePage={setActivePage} title="No Meeting Selected for AI Assistant" />
              )}
            </motion.div>
          )}

          {activePage === 'analytics' && (
            <motion.div
              key="analytics"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              <Suspense fallback={<AnalyticsSkeleton />}>
                <AnalyticsPage currentMeeting={currentMeeting} />
              </Suspense>
            </motion.div>
          )}

          {activePage === 'settings' && (
            <motion.div
              key="settings-page"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              <SettingsPage 
                onUpdateGlobalSettings={(newModel, newLang, newVad) => {
                  if (newModel) setModelSize(newModel);
                  if (newLang) setLanguage(newLang);
                  if (newVad !== undefined) setVadEnabled(newVad);
                }}
              />
            </motion.div>
          )}

          {activePage === 'help' && (
            <motion.div
              key="help-page"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden"
            >
              <HelpLearningCenter />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Universal Command Palette Launcher Overlay */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActivePage={setActivePage}
        meetings={meetings}
        currentMeeting={currentMeeting}
        onSelectMeeting={handleSelectMeeting}
        startRecording={startRecording}
        stopRecording={stopRecording}
        recordingState={recordingState}
      />

      {/* Desktop Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onNavigate={setActivePage}
      />

      {/* First-Run Onboarding Wizard */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onComplete={(action) => {
          localStorage.setItem('samvad_onboarded', 'true');
          setIsOnboardingOpen(false);
          if (action === 'record') {
            setActivePage('recorder');
          } else {
            setActivePage('dashboard');
          }
        }}
      />

      {/* Interactive Feature Tour */}
      <InteractiveProductTour
        isOpen={isProductTourOpen}
        onClose={() => setIsProductTourOpen(false)}
        setActivePage={setActivePage}
      />

      {/* First Launch / Welcome Onboarding Screen */}
      {!hasProfile && (
        <OnboardingModal
          onComplete={(userName) => {
            createProfile(userName);
          }}
        />
      )}

      {/* Non-destructive Logout Session Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          logout();
          setActivePage('dashboard');
        }}
      />

      {/* Background Audio Transcription Status Floating Banner */}
      <AnimatePresence>
        {(globalUploading || Object.keys(processingMeetings).length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[9999] bg-[#0d0f1a]/95 border border-violet-500/40 backdrop-blur-xl p-4 rounded-2xl shadow-[0_10px_40px_rgba(139,92,246,0.35)] flex items-center gap-4 max-w-sm pointer-events-auto"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse text-violet-400" /> Background AI Pipeline
                </span>
                {!globalUploading && (
                  <button
                    onClick={() => {
                      const meetingId = Object.keys(processingMeetings)[0];
                      if (meetingId) handleCancelProcessing(meetingId);
                    }}
                    className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded text-[8px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" /> Cancel
                  </button>
                )}
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {globalUploading 
                  ? (globalUploadFileName || 'Audio File')
                  : (Object.values(processingMeetings)[0]?.title || 'Processing Meeting')
                }
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {globalUploading 
                  ? 'Uploading audio file to backend...'
                  : 'Transcribing Whisper STT & Speaker Diarization...'
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WrappedApp() {
  return (
    <SettingsProvider>
      <KeyboardProvider>
        <App />
      </KeyboardProvider>
    </SettingsProvider>
  );
}

