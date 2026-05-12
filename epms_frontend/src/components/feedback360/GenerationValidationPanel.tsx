import React from 'react';
import { AlertCircle, RefreshCcw, Info, CheckCircle2 } from 'lucide-react';

interface ValidationPanelProps {
  isValidating: boolean;
  warnings: string[];
  errors: string[];
}

export const GenerationValidationPanel: React.FC<ValidationPanelProps> = ({ 
  isValidating, 
  warnings, 
  errors 
}) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        Pre-Generation Check
      </h3>
      
      {isValidating ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm italic">
          <RefreshCcw className="w-4 h-4 animate-spin" /> Validating resources...
        </div>
      ) : warnings.length > 0 || errors.length > 0 ? (
        <div className="space-y-3">
          <div className="text-amber-700 text-xs font-semibold uppercase tracking-wider">
            {warnings.length + errors.length} Potential Issues Found
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {errors.map((error, i) => (
              <div key={`err-${i}`} className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            ))}
            {warnings.map((warning, i) => (
              <div key={`warn-${i}`} className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                {warning}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          All limits and resources verified.
        </div>
      )}
    </div>
  );
};
