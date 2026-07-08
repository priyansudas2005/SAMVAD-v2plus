import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, visible, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-semibold backdrop-blur-md ${
        type === 'success'
          ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
          : 'bg-rose-500/15 border-rose-500/25 text-rose-300'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
        )}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
