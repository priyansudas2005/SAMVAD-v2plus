import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Command, Keyboard, Settings, RotateCcw, Save, Check } from 'lucide-react';

export interface ShortcutConfig {
  id: string;
  label: string;
  category: 'Global Navigation' | 'Recording Studio' | 'Workspace & Actions';
  keys: string[];
  description: string;
}

export const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'command-palette', label: 'Universal Command Palette', category: 'Global Navigation', keys: ['Ctrl', 'K'], description: 'Open Raycast productivity launcher' },
  { id: 'global-search', label: 'Global Workspace Search', category: 'Global Navigation', keys: ['Ctrl', 'Shift', 'F'], description: 'Search meetings, transcripts & decisions' },
  { id: 'focus-search', label: 'Focus Active Search Bar', category: 'Global Navigation', keys: ['Ctrl', '/'], description: 'Move focus directly to page search input' },
  { id: 'start-recording', label: 'Start / Stop Live Recording', category: 'Recording Studio', keys: ['Ctrl', 'R'], description: 'Begin or halt active audio capture' },
  { id: 'pause-recording', label: 'Pause / Resume Recording', category: 'Recording Studio', keys: ['Space'], description: 'Toggle pause state when recording studio is active' },
  { id: 'quick-export', label: 'Quick Meeting Export', category: 'Workspace & Actions', keys: ['Ctrl', 'E'], description: 'Export active meeting memo as PDF/DOCX' },
  { id: 'close-dialog', label: 'Close Active Dialog / Modal', category: 'Global Navigation', keys: ['Esc'], description: 'Dismiss active overlays or command palette' }
];

interface KeyboardContextType {
  shortcuts: ShortcutConfig[];
  updateShortcut: (id: string, newKeys: string[]) => void;
  resetShortcuts: () => void;
  getShortcutKeys: (id: string) => string[];
}

const KeyboardContext = createContext<KeyboardContextType>({
  shortcuts: DEFAULT_SHORTCUTS,
  updateShortcut: () => {},
  resetShortcuts: () => {},
  getShortcutKeys: (id: string) => DEFAULT_SHORTCUTS.find(s => s.id === id)?.keys || []
});

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(() => {
    try {
      const saved = localStorage.getItem('samvad-shortcuts');
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('samvad-shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  const updateShortcut = (id: string, newKeys: string[]) => {
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, keys: newKeys } : s));
  };

  const resetShortcuts = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
  };

  const getShortcutKeys = (id: string) => {
    return shortcuts.find(s => s.id === id)?.keys || [];
  };

  return (
    <KeyboardContext.Provider value={{ shortcuts, updateShortcut, resetShortcuts, getShortcutKeys }}>
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboardShortcuts = () => useContext(KeyboardContext);

// --- Reusable Kbd Key Badge Component ---
export const KbdBadge: React.FC<{ keys?: string[]; className?: string }> = ({ keys, className = '' }) => {
  if (!keys || keys.length === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 select-none ${className}`}>
      {keys.map((k, i) => (
        <kbd 
          key={i} 
          className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded-md font-bold text-slate-300 shadow-xs"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
};

// --- Shortcut Customizer Component for Settings Page ---
export const ShortcutSettingsPanel: React.FC = () => {
  const { shortcuts, updateShortcut, resetShortcuts } = useKeyboardShortcuts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [capturedKeys, setCapturedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!editingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.metaKey) keys.push('Cmd');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');

      const keyName = e.key.toUpperCase();
      if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(keyName)) {
        keys.push(keyName === ' ' ? 'Space' : keyName);
        updateShortcut(editingId, keys);
        setEditingId(null);
      } else {
        setCapturedKeys(keys);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingId, updateShortcut]);

  const categories = ['Global Navigation', 'Recording Studio', 'Workspace & Actions'] as const;

  return (
    <div className="space-y-6 text-slate-300 font-sans">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-violet-400" />
            Keyboard Productivity & Hotkeys
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Customize global shortcuts across SAMVAD Studio.</p>
        </div>
        <button
          onClick={resetShortcuts}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
        </button>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat} className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">{cat}</h4>
            <div className="bg-[#141722] border border-slate-800/80 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
              {shortcuts.filter(s => s.category === cat).map((sc) => (
                <div key={sc.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-white block">{sc.label}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{sc.description}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === sc.id ? (
                      <span className="px-3 py-1 bg-violet-600/30 border border-violet-500 text-violet-300 rounded-lg text-xs font-mono font-bold animate-pulse">
                        Press Keys...
                      </span>
                    ) : (
                      <button
                        onClick={() => setEditingId(sc.id)}
                        className="hover:opacity-80 transition-opacity"
                        title="Click to rebind hotkey"
                      >
                        <KbdBadge keys={sc.keys} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
