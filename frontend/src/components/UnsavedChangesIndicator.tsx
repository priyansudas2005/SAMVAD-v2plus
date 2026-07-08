import React from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface UnsavedChangesIndicatorProps {
  hasUnsaved: boolean;
  saving: boolean;
  onSave: () => void;
}

export const UnsavedChangesIndicator: React.FC<UnsavedChangesIndicatorProps> = ({
  hasUnsaved,
  saving,
  onSave,
}) => {
  if (!hasUnsaved) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
      <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Unsaved changes</span>
      <button
        onClick={onSave}
        disabled={saving}
        className="ml-1 flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded-md transition-all disabled:opacity-50"
      >
        <Save className="w-3 h-3" />
        {saving ? 'Saving...' : 'Save All'}
      </button>
    </div>
  );
};
