import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Download, Loader2, FileText, FileCode } from 'lucide-react';

interface ExportFormat {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const FORMATS: ExportFormat[] = [
  { key: 'pdf', label: 'PDF Document', icon: <FileText className="w-3.5 h-3.5" />, color: 'rose' },
  { key: 'docx', label: 'Word Document', icon: <FileText className="w-3.5 h-3.5" />, color: 'blue' },
  { key: 'txt', label: 'Plain Text', icon: <FileCode className="w-3.5 h-3.5" />, color: 'slate' },
];

const COLOR_MAP: Record<string, string> = {
  rose: 'text-rose-400',
  blue: 'text-blue-400',
  slate: 'text-slate-400',
};

interface ExportButtonProps {
  meetingId: string;
  onExport: (format: string) => Promise<void>;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ meetingId, onExport, disabled }) => {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Position the portal dropdown relative to the button
  const openDropdown = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        // Check if the click was inside the dropdown portal
        const portal = document.getElementById('export-dropdown-portal');
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

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

  const dropdown =
    open && dropdownPos
      ? ReactDOM.createPortal(
          <div
            id="export-dropdown-portal"
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 99999,
              width: 176,
            }}
            className="bg-[#0e1016] border border-white/[0.1] rounded shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-[24px]"
          >
            <div className="py-1">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.key}
                  onClick={() => handleExport(fmt)}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[#C4C9D4] hover:bg-[#8B5CF6]/10 hover:text-[#F5F7FA] transition-colors text-left disabled:opacity-40"
                >
                  <span className={COLOR_MAP[fmt.color] || 'text-slate-400'}>{fmt.icon}</span>
                  <span>{fmt.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        disabled={disabled || isExporting}
        className="px-3 py-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold rounded text-[10px] transition-all flex items-center gap-1.5 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {isExporting ? `Exporting ${exporting?.toUpperCase()}...` : 'Download'}
      </button>
      {dropdown}
    </>
  );
};
