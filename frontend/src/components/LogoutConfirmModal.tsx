import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md p-6 rounded-3xl bg-[#090b14]/95 border border-white/[0.12] shadow-2xl backdrop-blur-2xl relative overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5 flex-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Logout?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You will return to the welcome screen.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Your meetings and recordings will remain safe on this device.</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 font-semibold text-xs">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer font-bold"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
