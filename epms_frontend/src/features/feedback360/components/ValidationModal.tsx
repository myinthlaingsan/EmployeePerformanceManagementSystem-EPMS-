import React from 'react';
import { AlertTriangle, XCircle, CheckCircle2, X } from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  errors: string[];
  warnings: string[];
}

const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  errors,
  warnings
}) => {
  if (!isOpen) return null;

  const hasErrors = errors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${hasErrors ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'}`}>
          <div className="flex items-center gap-3">
            {hasErrors ? (
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            )}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {hasErrors && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">
                Critical Issues ({errors.length})
              </h4>
              <ul className="space-y-2">
                {errors.map((err, idx) => (
                  <li key={idx} className="flex gap-3 p-3 bg-red-50/50 dark:bg-red-900/5 rounded-lg text-red-700 dark:text-red-300 text-sm border border-red-100/50 dark:border-red-900/20">
                    <span className="shrink-0">•</span>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">
                Warnings & Suggestions ({warnings.length})
              </h4>
              <ul className="space-y-2">
                {warnings.map((warn, idx) => (
                  <li key={idx} className="flex gap-3 p-3 bg-amber-50/50 dark:bg-amber-900/5 rounded-lg text-amber-700 dark:text-amber-300 text-sm border border-amber-100/50 dark:border-amber-900/20">
                    <span className="shrink-0">•</span>
                    {warn}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 italic">
                * Warnings will not block generation, but may result in fewer feedback assignments than requested.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            {hasErrors ? 'Cancel' : 'Go Back'}
          </button>
          
          {!hasErrors && (
            <button
              onClick={onConfirm}
              className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              Proceed Anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;
