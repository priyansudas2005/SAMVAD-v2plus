import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Keyboard, 
  Cpu, 
  Mic, 
  Wrench, 
  Download, 
  HelpCircle, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type HelpCategory = 
  | 'all'
  | 'quickstart'
  | 'shortcuts'
  | 'models'
  | 'recording'
  | 'troubleshooting'
  | 'export'
  | 'faq'
  | 'whatsnew';

interface KnowledgeArticle {
  id: string;
  category: HelpCategory;
  title: string;
  summary: string;
  content: string[];
  tags: string[];
  hotkeys?: string[];
}

const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  // 1. Quick Start
  {
    id: 'qs-1',
    category: 'quickstart',
    title: 'Getting Started with SAMVAD Studio 2.0',
    summary: 'Learn how to capture audio, process transcripts with local Whisper models, and generate action items.',
    tags: ['quickstart', 'setup', 'first meeting', 'basics'],
    content: [
      'SAMVAD Studio operates 100% offline on your local hardware without sending telemetry to remote cloud servers.',
      'To record your first session, click the "Mic" button on the Sidebar or press Ctrl+R.',
      'When audio capture finishes, SAMVAD automatically initiates Whisper-v3 speech-to-text transcription and PyAnnote speaker diarization.'
    ]
  },
  {
    id: 'qs-2',
    category: 'quickstart',
    title: 'Importing Pre-Recorded Audio Files',
    summary: 'Drag and drop external MP3, WAV, M4A, or FLAC recordings directly onto the Dashboard workspace.',
    tags: ['upload', 'audio', 'import', 'mp3', 'wav'],
    content: [
      'Drop your audio file onto the 3D folder dropzone on the main Dashboard.',
      'Supports all standard audio codecs: WAV, MP3, M4A, FLAC, OGG, and AAC.',
      'Uploads are saved directly into your local SQLite meeting database.'
    ]
  },

  // 2. Keyboard Shortcuts
  {
    id: 'sc-1',
    category: 'shortcuts',
    title: 'Universal Keyboard Shortcuts & Commands',
    summary: 'Master desktop hotkeys to navigate pages, control live recordings, and open the command palette.',
    tags: ['shortcuts', 'hotkeys', 'keyboard', 'ctrl+k'],
    hotkeys: ['Ctrl + K', 'Ctrl + R', 'Space', 'Ctrl + E', 'Esc'],
    content: [
      'Ctrl + K: Open Universal Command Palette & Instant AI Search.',
      'Ctrl + R: Launch Live Audio Recording Visualizer.',
      'Space: Toggle Pause/Resume during active recording sessions.',
      'Ctrl + E: Quick Export Meeting Transcript & Summary PDF.'
    ]
  },

  // 3. AI Models
  {
    id: 'md-1',
    category: 'models',
    title: 'Configuring Whisper Speech-to-Text Models',
    summary: 'Choose between Tiny, Base, Small, Medium, and Large-v3 models depending on your GPU/CPU hardware.',
    tags: ['whisper', 'ai models', 'cuda', 'onnx', 'accuracy'],
    content: [
      'Base Model (74M parameters): Recommended for fast real-time transcription on standard laptops.',
      'Small Model (244M parameters): Excellent balance between accuracy and memory utilization (sub-second latency).',
      'Large-v3 (1.5B parameters): Maximum transcription precision for noisy multi-speaker conference recordings.'
    ]
  },
  {
    id: 'md-2',
    category: 'models',
    title: 'PyAnnote Speaker Diarization & Speaker Naming',
    summary: 'How SAMVAD distinguishes individual speakers and auto-assigns names across meetings.',
    tags: ['diarization', 'pyannote', 'speakers', 'audio separation'],
    content: [
      'PyAnnote generates acoustic embeddings for each speaker voice profile.',
      'You can rename "Speaker 1" or "Speaker 2" directly in the Transcript page; SAMVAD remembers speaker profiles for future sessions.'
    ]
  },

  // 4. Recording Tips
  {
    id: 'rc-1',
    category: 'recording',
    title: 'Optimizing Microphones & System Loopback Audio',
    summary: 'Tips for capturing crystal-clear dual-channel audio from Zoom, Google Meet, Microsoft Teams, and physical mics.',
    tags: ['microphones', 'loopback', 'zoom', 'teams', 'audio quality'],
    content: [
      'Use "Mix" mode in the sidebar to record both your physical USB Microphone AND incoming system audio simultaneously.',
      'Maintain a distance of 6-8 inches from condenser microphones to prevent audio clipping.',
      'Enable Voice Activity Detection (VAD) in Control Center to automatically trim ambient silence.'
    ]
  },

  // 5. Troubleshooting
  {
    id: 'tb-1',
    category: 'troubleshooting',
    title: 'Resolving GPU Out-of-Memory (OOM) Errors',
    summary: 'What to do if Whisper model loading fails due to CUDA VRAM limitations.',
    tags: ['troubleshooting', 'gpu', 'cuda', 'error', 'vram'],
    content: [
      'If your GPU runs out of VRAM, switch from Large-v3 to the "Small" or "Base" model in Settings → AI Models.',
      'Ensure ONNX Runtime DirectML fallback is enabled if using integrated AMD/Intel graphics.'
    ]
  },
  {
    id: 'tb-2',
    category: 'troubleshooting',
    title: 'Microphone Permission Denied Fixes',
    summary: 'Steps to grant audio input access in Windows Settings.',
    tags: ['microphone', 'permissions', 'windows', 'privacy'],
    content: [
      'Open Windows Settings → Privacy & Security → Microphone.',
      'Ensure "Allow desktop apps to access your microphone" is toggled ON.'
    ]
  },

  // 6. Export Guide
  {
    id: 'ex-1',
    category: 'export',
    title: 'Exporting PDF, Markdown, JSON & Subtitles (SRT)',
    summary: 'Guide to exporting meeting notes, speaker transcripts, action items, and SRT subtitles.',
    tags: ['export', 'pdf', 'markdown', 'json', 'srt'],
    content: [
      'PDF Export: Generates brand-formatted executive meeting memos with decision badges and action item checkboxes.',
      'Markdown (.md): Ideal for importing notes directly into Notion, Obsidian, or Logseq.',
      'SRT Subtitles: Export synchronized timestamped captions for video editing.'
    ]
  },

  // 7. FAQ
  {
    id: 'fq-1',
    category: 'faq',
    title: 'Does SAMVAD Studio require an active internet connection?',
    summary: 'No. SAMVAD is 100% offline and processes all AI pipelines locally on your machine.',
    tags: ['faq', 'offline', 'security', 'internet'],
    content: [
      'SAMVAD operates completely offline.',
      'Audio data, vector embeddings, and SQLite databases remain securely on your local disk.'
    ]
  },

  // 8. What's New
  {
    id: 'wn-1',
    category: 'whatsnew',
    title: 'What\'s New in SAMVAD Studio v2.0 Release',
    summary: 'Discover the latest features in version 2.0 including the Quantum Sonic Helix logo, glassmorphic badges, and hotkey customizer.',
    tags: ['release notes', 'v2.0', 'features', 'whats new'],
    content: [
      '✨ Brand System: Standalone Quantum Sonic Helix logo & glassmorphic v2.0 spark badge.',
      '⚡ Hotkey Customizer: Customize global keyboard shortcuts in Control Center.',
      '🎙️ Audio Loopback Mixer: Simultaneous physical mic + system audio capture.',
      '🎯 Context Menu System: Right-click menus across meeting cards, action items, and transcripts.'
    ]
  }
];

export const HelpLearningCenter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticleId, setActiveArticleId] = useState<string | null>('qs-1');

  const categories: { id: HelpCategory; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Topics', icon: BookOpen },
    { id: 'quickstart', label: 'Quick Start', icon: Zap },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'models', label: 'AI Models', icon: Cpu },
    { id: 'recording', label: 'Recording Tips', icon: Mic },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench },
    { id: 'export', label: 'Export Guide', icon: Download },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'whatsnew', label: "What's New", icon: Sparkles }
  ];

  // Filter Articles
  const filteredArticles = useMemo(() => {
    return KNOWLEDGE_ARTICLES.filter(art => {
      const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeArticle = useMemo(() => {
    return KNOWLEDGE_ARTICLES.find(a => a.id === activeArticleId) || filteredArticles[0] || KNOWLEDGE_ARTICLES[0];
  }, [activeArticleId, filteredArticles]);

  return (
    <div className="flex-1 bg-[#040404] text-slate-100 p-8 space-y-6 min-h-screen font-sans select-none overflow-y-auto">
      
      {/* Header Bar & Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-violet-400" /> SAMVAD Knowledge &amp; Learning Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search documentation, hardware guides, keyboard hotkeys, and troubleshooting tips.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search guides, hotkeys, CUDA errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d0f17] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
          />
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setActiveArticleId(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                isSelected 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 border border-violet-500/40' 
                  : 'bg-[#0d0f17] border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Master Content Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Article List (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">
            Articles ({filteredArticles.length})
          </div>

          <div className="space-y-2.5">
            {filteredArticles.length === 0 ? (
              <div className="p-8 bg-[#0d0f17] border border-slate-800 rounded-2xl text-center space-y-2">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-bold text-slate-400">No knowledge articles found</div>
                <div className="text-[11px] text-slate-500">Try searching for "Whisper", "Hotkeys", or "Export"</div>
              </div>
            ) : (
              filteredArticles.map((art) => {
                const isActive = activeArticle?.id === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => setActiveArticleId(art.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isActive 
                        ? 'bg-[#121522] border-violet-500/80 shadow-xl' 
                        : 'bg-[#0a0c12] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                        {art.category}
                      </span>
                      {isActive && <ChevronRight className="w-4 h-4 text-violet-400" />}
                    </div>

                    <h3 className="text-xs font-bold text-white leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Article Details View (7 cols) */}
        <div className="lg:col-span-7">
          {activeArticle ? (
            <div className="bg-[#0a0c12] border border-slate-800/80 rounded-2xl p-6 space-y-6 min-h-[500px] flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-400">
                      DOCUMENTATION GUIDE
                    </span>
                    <h2 className="text-lg font-extrabold text-white tracking-tight mt-1">
                      {activeArticle.title}
                    </h2>
                  </div>

                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-lg flex items-center gap-1.5 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Guide
                  </span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed font-semibold">
                  {activeArticle.summary}
                </p>

                {/* Hotkeys Display Badge if available */}
                {activeArticle.hotkeys && (
                  <div className="p-4 bg-[#121522] border border-violet-500/20 rounded-xl space-y-2">
                    <div className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider">
                      Keyboard Shortcut Reference
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeArticle.hotkeys.map((hk, i) => (
                        <kbd key={i} className="px-2.5 py-1 text-xs font-mono font-bold text-white bg-slate-900 border border-slate-700 rounded-lg shadow-inner">
                          {hk}
                        </kbd>
                      ))}
                    </div>
                  </div>
                )}

                {/* Article Detailed Steps */}
                <div className="space-y-3 pt-2">
                  {activeArticle.content.map((paragraph, idx) => (
                    <div key={idx} className="flex gap-3 text-xs text-slate-300 leading-relaxed p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                      <span className="w-5 h-5 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{paragraph}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span>TAGS:</span>
                  {activeArticle.tags.map(t => (
                    <span key={t} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
                <span>SAMVAD Studio Docs v2.0</span>
              </div>

            </div>
          ) : (
            <div className="bg-[#0a0c12] border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 font-mono text-xs">
              Select an article on the left to view detailed guide.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
