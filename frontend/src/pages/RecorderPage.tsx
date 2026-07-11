import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Mic,
  Clock,
  AlertCircle,
  CheckCircle2,
  Radio,
  Monitor,
  Disc3,
  Power,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface RecorderPageProps {
  stream: MediaStream | null;
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  duration: number;
  title: string;
  setTitle: (t: string) => void;
  recordingError: string | null;
  uploading: boolean;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  discardRecording: () => void;
  saveRecording: () => void;
  captureSource: 'mic' | 'system' | 'both';
  setCaptureSource: (s: 'mic' | 'system' | 'both') => void;
}

export const RecorderPage: React.FC<RecorderPageProps> = ({
  stream,
  recordingState,
  duration,
  title,
  setTitle,
  recordingError,
  uploading,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  discardRecording,
  saveRecording,
  captureSource,
  setCaptureSource,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 16-bars visualizer frequency factors state (Fix 1B)
  const [barValues, setBarValues] = useState<number[]>(new Array(16).fill(0.125));

  // Hook to start visualizer when stream changes or starts
  useEffect(() => {
    if (stream && recordingState === 'recording') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64; // smaller bin size for 16 distinct bands

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastTime = 0;
      const draw = (now: number) => {
        animationFrameRef.current = requestAnimationFrame(draw);
        
        // Limit state updates to ~30fps (33ms interval)
        if (now - lastTime < 33) {
          return;
        }
        lastTime = now;

        analyser.getByteFrequencyData(dataArray);

        const nextBars = [];
        const step = Math.floor(bufferLength / 16) || 1;
        for (let i = 0; i < 16; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j] || 0;
          }
          const avg = sum / step;
          // Limit max scale to 2.2 so bars never exceed container box height
          const scaled = 0.125 + (avg / 255) * 2.075;
          nextBars.push(scaled);
        }
        setBarValues(nextBars);
      };

      animationFrameRef.current = requestAnimationFrame(draw);

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        audioContext.close();
        setBarValues(new Array(16).fill(0.125));
      };
    } else {
      setBarValues(new Array(16).fill(0.125));
    }
  }, [stream, recordingState]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 flex flex-col justify-center max-w-4xl mx-auto w-full">
      <div className="glass-panel p-8 md:p-12 rounded-3xl flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-slate-900/0 to-slate-950/0 pointer-events-none" />

        <div className="mb-6 flex flex-col items-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
            recordingState === 'recording'
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-500 glow-record shadow-[0_0_24px_rgba(244,63,94,0.15)]'
              : recordingState === 'paused'
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <Mic className={`w-8 h-8 ${recordingState === 'recording' ? 'animate-pulse' : ''}`} />
          </div>
          
          <h2 className="text-2xl font-extrabold text-white mt-4 tracking-tight">
            {recordingState === 'idle' && 'Start a New Recording'}
            {recordingState === 'recording' && 'Recording Audio Active'}
            {recordingState === 'paused' && 'Recording Paused'}
            {recordingState === 'stopped' && 'Recording Complete'}
          </h2>
          
          <p className="text-slate-400 text-sm mt-1 max-w-sm leading-relaxed">
            {recordingState === 'idle' && 'Control recording from the sidebar or click the button below. Processing runs 100% locally.'}
            {recordingState === 'recording' && 'Your microphone is active. Waveform shows live volume frequency levels.'}
            {recordingState === 'paused' && 'Recording is paused. Time and duration counters are preserved.'}
            {recordingState === 'stopped' && 'Save the audio to SQLite and begin transcription.'}
          </p>
        </div>

        {/* Audio Visualizer (16 bars) */}
        <div className="w-full max-w-md bg-[#020617]/40 rounded-2xl border border-slate-900/80 px-8 py-8 my-4 shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)] flex items-end justify-center gap-2.5 h-32 overflow-hidden relative">
          {/* Subtle live sound background mesh grids */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_8px] pointer-events-none" />
          
          {barValues.map((val, idx) => (
            <motion.div
              key={idx}
              animate={{ scaleY: val }}
              transition={recordingState === 'recording'
                ? { type: "spring", stiffness: 350, damping: 15 }
                : { duration: 0.3, ease: "easeInOut" }
              }
              style={{ originY: 1 }}
              className={`w-3.5 h-12 bg-gradient-to-t from-violet-500 via-indigo-400 to-sky-400 rounded-full flex-shrink-0 transition-all ${
                recordingState === 'recording' 
                  ? 'shadow-[0_0_15px_rgba(56,189,248,0.7),0_0_30px_rgba(139,92,246,0.3)] opacity-100' 
                  : 'opacity-35'
              }`}
            />
          ))}
        </div>

        {/* Time duration indicator */}
        {recordingState !== 'idle' && (
          <div className="flex items-center gap-2 px-5 py-2 bg-slate-950/80 rounded-full border border-slate-850 text-slate-200 font-mono text-lg font-extrabold my-4 shadow-md">
            <Clock className={`w-4 h-4 ${recordingState === 'recording' ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
            {formatTime(duration)}
          </div>
        )}

        {/* Controls widgets */}
        <div className="flex flex-col items-center gap-6 w-full mt-4">
          {recordingState === 'idle' && (
            <div className="flex flex-col items-center gap-6 w-full">
              <div className="glass-radio-group">
                <input type="radio" name="source" id="glass-mic" checked={captureSource === 'mic'}
                  onChange={() => setCaptureSource('mic')} />
                <label htmlFor="glass-mic">
                  <Radio className="w-4 h-4 mr-2" />
                  Mic
                </label>
                <input type="radio" name="source" id="glass-system" checked={captureSource === 'system'}
                  onChange={() => setCaptureSource('system')} />
                <label htmlFor="glass-system">
                  <Monitor className="w-4 h-4 mr-2" />
                  System
                </label>
                <input type="radio" name="source" id="glass-mix" checked={captureSource === 'both'}
                  onChange={() => setCaptureSource('both')} />
                <label htmlFor="glass-mix">
                  <Disc3 className="w-4 h-4 mr-2" />
                  Mix
                </label>
                <div className="glass-glider" />
              </div>
              
              {/* Premium Start Button */}
              <button 
                onClick={startRecording}
                className="group relative bg-neutral-800 rounded-full p-px overflow-hidden focus:outline-none w-16 h-16 flex items-center justify-center"
                style={{
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.25)'
                }}
              >
                <span className="absolute inset-0 rounded-full overflow-hidden">
                  <span className="inset-0 absolute pointer-events-none select-none">
                    <span
                      className="block -translate-x-1/2 -translate-y-1/3 size-24 blur-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(122, 105, 249, 0.4))' }}
                    ></span>
                  </span>
                </span>
                <span
                  className="inset-0 absolute pointer-events-none select-none"
                  style={{ animation: '10s ease-in-out 0s infinite alternate none running border-glow-translate' }}
                >
                  <span
                    className="block z-0 h-full w-12 blur-xl -translate-x-1/2 rounded-full"
                    style={{
                      animation: '10s ease-in-out 0s infinite alternate none running border-glow-scale',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(122, 105, 249, 0.4))'
                    }}
                  ></span>
                </span>
                <span
                  className="flex items-center justify-center relative z-[1] bg-[#121212]/90 rounded-full w-full h-full text-white transition-colors duration-300"
                >
                  <Play className="w-5 h-5 fill-[#8B5CF6] text-[#8B5CF6] translate-x-[1.5px] group-hover:scale-110 transition-transform" />
                </span>
              </button>
            </div>
          )}

          <div className="flex justify-center gap-4">
            {recordingState === 'recording' && (
              <>
                {/* Premium Pause Button */}
                <button 
                  onClick={pauseRecording}
                  className="group relative bg-neutral-800 rounded-full p-px overflow-hidden focus:outline-none w-14 h-14"
                  style={{
                    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
                  }}
                >
                  <span className="absolute inset-0 rounded-full overflow-hidden">
                    <span className="inset-0 absolute pointer-events-none select-none">
                      <span
                        className="block -translate-x-1/2 -translate-y-1/3 size-24 blur-xl"
                        style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(20, 20, 20, 0.8), rgba(245, 158, 11, 0.1))' }}
                      ></span>
                    </span>
                  </span>
                  <span
                    className="inset-0 absolute pointer-events-none select-none"
                    style={{ animation: '10s ease-in-out 0s infinite alternate none running border-glow-translate' }}
                  >
                    <span
                      className="block z-0 h-full w-12 blur-xl -translate-x-1/2 rounded-full"
                      style={{
                        animation: '10s ease-in-out 0s infinite alternate none running border-glow-scale',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(20, 20, 20, 0.8), rgba(245, 158, 11, 0.1))'
                      }}
                    ></span>
                  </span>
                  <span
                    className="flex items-center justify-center relative z-[1] bg-[#121212]/90 rounded-full w-full h-full text-amber-400 font-bold transition-colors duration-300"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.12, 0.95, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Pause className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </motion.div>
                  </span>
                </button>

                {/* Premium Stop Button */}
                <button 
                  onClick={stopRecording}
                  className="group relative bg-neutral-800 rounded-full p-px overflow-hidden focus:outline-none w-14 h-14"
                  style={{
                    boxShadow: '0 4px 20px rgba(242, 99, 120, 0.15)'
                  }}
                >
                  <span className="absolute inset-0 rounded-full overflow-hidden">
                    <span className="inset-0 absolute pointer-events-none select-none">
                      <span
                        className="block -translate-x-1/2 -translate-y-1/3 size-24 blur-xl"
                        style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(242, 99, 120, 0.4))' }}
                      ></span>
                    </span>
                  </span>
                  <span
                    className="inset-0 absolute pointer-events-none select-none"
                    style={{ animation: '10s ease-in-out 0s infinite alternate none running border-glow-translate' }}
                  >
                    <span
                      className="block z-0 h-full w-12 blur-xl -translate-x-1/2 rounded-full"
                      style={{
                        animation: '10s ease-in-out 0s infinite alternate none running border-glow-scale',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(242, 99, 120, 0.4))'
                      }}
                    ></span>
                  </span>
                  <span
                    className="flex items-center justify-center relative z-[1] bg-[#121212]/90 rounded-full w-full h-full text-rose-300 font-bold transition-colors duration-300"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Power className="w-4.5 h-4.5 text-rose-455 hover:text-rose-400" />
                    </motion.div>
                  </span>
                </button>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                {/* Premium Resume Button */}
                <button 
                  onClick={resumeRecording}
                  className="group relative bg-neutral-800 rounded-full p-px overflow-hidden focus:outline-none w-14 h-14"
                  style={{
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.18)'
                  }}
                >
                  <span className="absolute inset-0 rounded-full overflow-hidden">
                    <span className="inset-0 absolute pointer-events-none select-none">
                      <span
                        className="block -translate-x-1/2 -translate-y-1/3 size-24 blur-xl"
                        style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(122, 105, 249, 0.4))' }}
                      ></span>
                    </span>
                  </span>
                  <span
                    className="inset-0 absolute pointer-events-none select-none"
                    style={{ animation: '10s ease-in-out 0s infinite alternate none running border-glow-translate' }}
                  >
                    <span
                      className="block z-0 h-full w-12 blur-xl -translate-x-1/2 rounded-full"
                      style={{
                        animation: '10s ease-in-out 0s infinite alternate none running border-glow-scale',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(122, 105, 249, 0.4))'
                      }}
                    ></span>
                  </span>
                  <span
                    className="flex items-center justify-center relative z-[1] bg-[#121212]/90 rounded-full w-full h-full text-white font-bold transition-colors duration-300"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 0.85, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 2.5 }}
                    >
                      <Play className="w-4 h-4 fill-[#8B5CF6] text-[#8B5CF6]" />
                    </motion.div>
                  </span>
                </button>

                {/* Premium Stop Button */}
                <button 
                  onClick={stopRecording}
                  className="group relative bg-neutral-800 rounded-full p-px overflow-hidden focus:outline-none w-14 h-14"
                  style={{
                    boxShadow: '0 4px 20px rgba(242, 99, 120, 0.15)'
                  }}
                >
                  <span className="absolute inset-0 rounded-full overflow-hidden">
                    <span className="inset-0 absolute pointer-events-none select-none">
                      <span
                        className="block -translate-x-1/2 -translate-y-1/3 size-24 blur-xl"
                        style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(242, 99, 120, 0.4))' }}
                      ></span>
                    </span>
                  </span>
                  <span
                    className="inset-0 absolute pointer-events-none select-none"
                    style={{ animation: '10s ease-in-out 0s infinite alternate none running border-glow-translate' }}
                  >
                    <span
                      className="block z-0 h-full w-12 blur-xl -translate-x-1/2 rounded-full"
                      style={{
                        animation: '10s ease-in-out 0s infinite alternate none running border-glow-scale',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(242, 99, 120, 0.4))'
                      }}
                    ></span>
                  </span>
                  <span
                    className="flex items-center justify-center relative z-[1] bg-[#121212]/90 rounded-full w-full h-full text-rose-300 font-bold transition-colors duration-300"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Power className="w-4.5 h-4.5 text-rose-455 hover:text-rose-400" />
                    </motion.div>
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Stopped Form Details */}
          {recordingState === 'stopped' && (
            <div className="w-full max-w-md bg-slate-900/30 p-6 rounded-2xl border border-slate-900 space-y-4">
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Meeting Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter meeting name..."
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-400 font-semibold"
                />
              </div>

              {recordingError && (
                <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold justify-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>{recordingError}</span>
                </div>
              )}

              <div className="flex gap-4 items-center">
                <button 
                  onClick={discardRecording}
                  disabled={uploading}
                  className="btn-discard-round focus:outline-none"
                >
                  <Trash2 className="svgIcon-discard text-slate-400 group-hover:text-rose-455" />
                </button>
                <button 
                  onClick={saveRecording}
                  disabled={uploading}
                  className="flex-1 group relative bg-neutral-800 rounded-xl p-px overflow-hidden focus:outline-none disabled:opacity-50"
                  style={{
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)'
                  }}
                >
                  <span className="absolute inset-0 rounded-xl overflow-hidden">
                    <span className="inset-0 absolute pointer-events-none select-none">
                      <span
                        className="block -translate-x-1/2 -translate-y-1/3 size-24 blur-xl"
                        style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(122, 105, 249, 0.4))' }}
                      ></span>
                    </span>
                  </span>
                  <span
                    className="inset-0 absolute pointer-events-none select-none"
                    style={{ animation: '10s ease-in-out 0s infinite alternate none running border-glow-translate' }}
                  >
                    <span
                      className="block z-0 h-full w-12 blur-xl -translate-x-1/2 rounded-full"
                      style={{
                        animation: '10s ease-in-out 0s infinite alternate none running border-glow-scale',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(20, 20, 20, 0.8), rgba(122, 105, 249, 0.4))'
                      }}
                    ></span>
                  </span>
                  <span
                    className="flex items-center justify-center gap-1.5 relative z-[1] bg-[#121212]/90 rounded-xl py-2 px-3 w-full text-white font-bold text-xs group-hover:text-white transition-colors duration-300"
                  >
                    <span className="relative transition-transform duration-500">
                      <motion.div
                        animate={{ scale: [1, 1.2, 0.9, 1.1, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      </motion.div>
                      <span
                        className="rounded-full size-11 absolute opacity-0 dark:opacity-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-lg"
                        style={{
                          animation: '14s ease-in-out 0s infinite alternate none running star-shine',
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(122, 105, 249, 0.3))'
                        }}
                      ></span>
                    </span>
                    <span className="bg-gradient-to-r from-violet-200 via-rose-200 to-amber-200 bg-clip-text text-transparent group-hover:scale-105 transition transform-gpu">
                      {uploading ? 'Saving...' : 'Save & Transcribe'}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
