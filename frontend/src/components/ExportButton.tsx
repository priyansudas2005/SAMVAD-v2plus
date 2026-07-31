import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader2, FileText, FileSpreadsheet, FileCode } from 'lucide-react';

interface ExportFormat {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const FORMATS: ExportFormat[] = [
  { key: 'pdf', label: 'PDF', icon: <FileText className="w-3.5 h-3.5" />, color: 'rose' },
  { key: 'docx', label: 'Word', icon: <FileText className="w-3.5 h-3.5" />, color: 'blue' },
  { key: 'txt', label: 'Plain Text', icon: <FileCode className="w-3.5 h-3.5" />, color: 'slate' },
];

interface ExportButtonProps {
  meetingId: string;
  onExport: (format: string) => Promise<void>;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ meetingId, onExport, disabled }) => {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (fmt: ExportFormat) => {
    setExporting(fmt.key);
    setOpen(false);
    try {
      await onExport(fmt.key);
    } finally {
      setExporting(null);
    }
  };

  const isExporting = exporting !== null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled || isExporting}
        className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 text-sky-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {isExporting ? `Exporting ${exporting?.toUpperCase()}...` : 'Download'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          {FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              onClick={() => handleExport(fmt)}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-40"
            >
              <span className={`text-${fmt.color}-400`}>{fmt.icon}</span>
              {fmt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
