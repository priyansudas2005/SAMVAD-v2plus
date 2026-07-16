import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { RecorderPage } from './pages/RecorderPage';
import { TranscriptPage } from './pages/TranscriptPage';
import { SummaryPage } from './pages/SummaryPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Meeting } from './types';
import { api } from './services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { WebGLShader } from './components/ui/web-gl-shader';

const QAPage = lazy(() => import('./pages/QAPage').then(m => ({ default: m.QAPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then(m => ({ default: m.StatsPage })));

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
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [appError, setAppError] = useState<string | null>(null);

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

  const fetchMeetingsList = async () => {
    try {
      const data = await api.getMeetings();
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMeetings(sorted);
      
      if (currentMeeting) {
        const found = sorted.find(m => m.meeting_id === currentMeeting.meeting_id);
        if (found) setCurrentMeeting(found);
      }
    } catch (err) {
      console.error(err);
      setAppError('Could not sync with local database server.');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchMeetingsList();
      
      // Load initial settings
      try {
        const settings = await api.getSettings();
        if (settings) {
          setModelSize(settings.model_size);
          setLanguage(settings.default_language);
          setVadEnabled(settings.vad_enabled);
        }
      } catch (e) {
        console.error("Failed to load initial settings:", e);
      }
      
      setLoading(false);
    };
    initialize();
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
      {/* ── WebGL Shader Background ────────────────────────── */}
      <WebGLShader />
      
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
        
        // Recording states
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
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-[99] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
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
              className="flex-1 flex flex-col min-h-0"
            >
              <DashboardPage 
                meetings={meetings}
                onSelectMeeting={handleSelectMeeting}
                setActivePage={setActivePage}
                refreshMeetings={fetchMeetingsList}
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
              className="flex-1 flex flex-col min-h-0"
            >
              <RecorderPage 
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
              className="flex-1 flex flex-col min-h-0"
            >
              <HistoryPage 
                meetings={meetings}
                onSelectMeeting={handleSelectMeeting}
                setActivePage={setActivePage}
                refreshMeetings={fetchMeetingsList}
              />
            </motion.div>
          )}

          {activePage === 'transcript' && currentMeeting && (
            <motion.div
              key={`transcript-${currentMeeting.meeting_id}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              <TranscriptPage 
                currentMeeting={currentMeeting}
                onUpdateMeeting={handleUpdateCurrentMeeting}
              />
            </motion.div>
          )}

          {activePage === 'summary' && currentMeeting && (
            <motion.div
              key={`summary-${currentMeeting.meeting_id}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              <SummaryPage 
                currentMeeting={currentMeeting}
              />
            </motion.div>
          )}

          {activePage === 'stats' && currentMeeting && (
            <motion.div
              key={`stats-${currentMeeting.meeting_id}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              <Suspense fallback={<TabSkeleton />}>
                <StatsPage currentMeeting={currentMeeting} onUpdateMeeting={handleUpdateCurrentMeeting} />
              </Suspense>
            </motion.div>
          )}

          {activePage === 'qa' && currentMeeting && (
            <motion.div
              key={`qa-${currentMeeting.meeting_id}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              <Suspense fallback={<TabSkeleton />}>
                <QAPage 
                  currentMeeting={currentMeeting}
                  onUpdateMeeting={handleUpdateCurrentMeeting}
                />
              </Suspense>
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
              className="flex-1 flex flex-col min-h-0"
            >
              <Suspense fallback={<TabSkeleton />}>
                <AnalyticsPage currentMeeting={currentMeeting} />
              </Suspense>
            </motion.div>
          )}

          {activePage === 'settings' && (
            <motion.div
              key="settings"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              <SettingsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
