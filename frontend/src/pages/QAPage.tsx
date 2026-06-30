import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  BrainCircuit, 
  HelpCircle, 
  User, 
  MessageSquare,
  AlertTriangle,
  Bot,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  SearchX
} from 'lucide-react';
import { Meeting, QAEntry } from '../types';
import { api } from '../services/api';
import { motion } from 'framer-motion';

interface QABubbleProps {
  entry: QAEntry;
  meetingId: string;
  onUpdateFeedback: (qaId: number, wasHelpful: number | null) => void;
}

const QABubble: React.FC<QABubbleProps> = ({ entry, meetingId, onUpdateFeedback }) => {
  const [expanded, setExpanded] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const getBadgeDetails = (conf: number) => {
    if (conf >= 0.80) return { label: "Very High", bg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
    if (conf >= 0.60) return { label: "High", bg: "bg-sky-500/10 text-sky-400 border border-sky-500/20" };
    if (conf >= 0.40) return { label: "Medium", bg: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
    if (conf >= 0.30) return { label: "Low", bg: "bg-orange-500/10 text-orange-400 border border-orange-500/20" };
    return { label: "Not Found", bg: "bg-rose-500/10 text-rose-400 border border-rose-500/20" };
  };

  const confidenceScore = entry.confidence ?? 0.0;
  const badge = getBadgeDetails(confidenceScore);
  const isNotFound = confidenceScore < 0.30;

  const handleFeedback = async (helpful: boolean) => {
    if (feedbackLoading || !entry.id) return;
    setFeedbackLoading(true);
    
    // Toggle: 1 is Up, 0 is Down
    const newHelpful = entry.was_helpful === (helpful ? 1 : 0) ? null : (helpful ? 1 : 0);
    try {
      await api.submitQAFeedback(meetingId, entry.id, newHelpful === null ? null : newHelpful === 1);
      onUpdateFeedback(entry.id, newHelpful);
    } catch (err) {
      console.error("Feedback error", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* User Bubble */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-3 justify-end"
      >
        <div className="bg-sky-500/10 border border-sky-500/20 text-sky-200 text-xs font-semibold px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-lg">
          {entry.question}
        </div>
        <div className="w-8 h-8 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold">
          <User className="w-4 h-4" />
        </div>
      </motion.div>

      {/* Assistant Bubble */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.08 }}
        className="flex gap-3"
      >
        <div className="w-8 h-8 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold">
          <Bot className="w-4 h-4 text-sky-400" />
        </div>
        <div className={`flex-1 rounded-2xl rounded-tl-sm p-5 border shadow-xl flex flex-col gap-4 max-w-[80%] ${
          isNotFound 
            ? 'bg-rose-500/5 border-rose-500/15 text-slate-300' 
            : 'bg-slate-950 border-slate-850 text-slate-200'
        }`}>
          {/* Top Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Local Assistant</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-sans uppercase tracking-wider ${badge.bg}`}>
              {badge.label}
            </span>
          </div>

          {/* Answer Area */}
          {isNotFound ? (
            <div className="flex gap-3 items-start bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl">
              <SearchX className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-250 leading-relaxed">
                  {entry.answer}
                </span>
                <span className="text-[10.5px] text-slate-400 font-medium">
                  Try rephrasing or ask about a specific topic from the meeting.
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs font-semibold leading-relaxed whitespace-pre-line text-slate-200">
              {entry.answer}
            </div>
          )}

          {/* Source Snippet Collapsible (Accordion) */}
          {!isNotFound && entry.source_snippet && (
            <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-900/10">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-900/30 text-[10.5px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span>Source from transcript</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {expanded && (
                <div className="p-4 border-t border-slate-850 bg-slate-950/40 text-[11px] font-mono text-slate-400 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                  {(() => {
                    const ans = entry.answer || "";
                    const snippet = entry.source_snippet || "";
                    if (ans && snippet.toLowerCase().includes(ans.toLowerCase())) {
                      const idx = snippet.toLowerCase().indexOf(ans.toLowerCase());
                      const before = snippet.substring(0, idx);
                      const match = snippet.substring(idx, idx + ans.length);
                      const after = snippet.substring(idx + ans.length);
                      return (
                        <>
                          {before}
                          <span className="text-sky-400 font-bold bg-sky-500/5 px-0.5 rounded">{match}</span>
                          {after}
                        </>
                      );
                    }
                    return snippet;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Bottom Feedback Area */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-900/40 flex-wrap">
            <span className="text-[10px] text-slate-500 font-medium">Was this response helpful?</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={feedbackLoading}
                onClick={() => handleFeedback(true)}
                className={`p-1.5 rounded-lg border transition-all hover:scale-105 flex items-center justify-center ${
                  entry.was_helpful === 1
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900/45 border-slate-850 text-slate-500 hover:text-slate-400 hover:border-slate-800'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={feedbackLoading}
                onClick={() => handleFeedback(false)}
                className={`p-1.5 rounded-lg border transition-all hover:scale-105 flex items-center justify-center ${
                  entry.was_helpful === 0
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-slate-900/45 border-slate-850 text-slate-500 hover:text-rose-400 hover:border-slate-800'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface QAPageProps {
  currentMeeting: Meeting;
  onUpdateMeeting: (meeting: Meeting) => void;
}

export const QAPage: React.FC<QAPageProps> = ({
  currentMeeting,
  onUpdateMeeting,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const qaHistory = currentMeeting.qa_history || [];

  const suggestedQuestions = [
    "What decisions were made?",
    "Who owns the action items?",
    "Summarize the main topics.",
    "What deadlines were mentioned?"
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaHistory, loading]);

  const handleSubmit = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setQuestion('');

    try {
      // Execute the QA API request
      const entry = await api.askQuestion(currentMeeting.meeting_id, trimmed);
      
      // Update local state by appending to meeting's QA history
      const updatedHistory = [...qaHistory, entry];
      const updatedMeeting = {
        ...currentMeeting,
        qa_history: updatedHistory
      };
      onUpdateMeeting(updatedMeeting);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve answer from local RAG engine.');
    } finally {
      setLoading(false);
    }
  };

  const hasTranscript = currentMeeting.transcript && currentMeeting.transcript.length > 0;

  if (!hasTranscript) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Transcript Required for Q&A</h3>
          <p className="text-xs text-slate-400 mt-1.5">
            Please run the audio transcriber on the Transcript page before launching the conversational AI assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 p-8 flex flex-col h-screen max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-sky-400" />
          Meeting Assistant Q&A
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Ask questions, query actions, or inspect specific intervals using local RAG context.
        </p>
      </div>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* Chat History Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {qaHistory.length === 0 ? (
            /* Welcome / Suggested Questions Layout */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6 select-none opacity-90">
              <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
                <Bot className="w-7 h-7 text-sky-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Ask your transcript anything</h4>
                <p className="text-xs text-slate-400 mt-1">
                  The local assistant will query the semantic database to find dates, decisions, assignments, or keyword contexts.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-2 gap-3 w-full text-left">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(q)}
                    className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl text-left text-xs font-semibold text-slate-300 transition-all hover:scale-[1.01]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Conversation bubbles */
            <div className="space-y-6">
              {qaHistory.map((entry, idx) => (
                <QABubble 
                  key={entry.id ?? idx}
                  entry={entry}
                  meetingId={currentMeeting.meeting_id}
                  onUpdateFeedback={(qaId, wasHelpful) => {
                    const updatedHistory = qaHistory.map(item => 
                      item.id === qaId ? { ...item, was_helpful: wasHelpful } : item
                    );
                    onUpdateMeeting({
                      ...currentMeeting,
                      qa_history: updatedHistory
                    });
                  }}
                />
              ))}
            </div>
          )}

          {/* Skeleton Load bubble */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-sky-400" />
              </div>
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl rounded-tl-sm max-w-[50%] flex gap-1.5 items-center">
                <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 max-w-md mx-auto">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/20 flex-shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(question);
            }} 
            className="flex gap-3"
          >
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about the meeting details..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 font-semibold"
            />
            <button 
              type="submit"
              disabled={loading || !question.trim()}
              className="w-12 h-12 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl flex items-center justify-center transition-all flex-shrink-0 hover:scale-[1.02] shadow-lg shadow-sky-500/10"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
