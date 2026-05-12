import React from 'react';
import { Settings2, ShieldCheck, CheckCircle2, Loader2, Layout as LayoutIcon } from 'lucide-react';
import type { AppraisalCycle } from '../../../features/appraisal/appraisalApi';
import { Link } from 'react-router-dom';

interface GovernanceHeaderProps {
  cycles: AppraisalCycle[] | undefined;
  selectedCycleId: number | undefined;
  onCycleChange: (id: number) => void;
  onFinalize?: (id: number) => void;
  onReset?: (id: number) => void;
  isFinalizing?: boolean;
}

const GovernanceHeader: React.FC<GovernanceHeaderProps> = ({ 
  cycles, 
  selectedCycleId, 
  onCycleChange,
  onFinalize,
  onReset,
  isFinalizing
}) => {
  const selectedCycle = cycles?.find(c => (c.cycleId || c.id) === selectedCycleId);
  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-200">
          <Settings2 className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">360° Cycle Governance</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Configure, preview, and launch feedback collection</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/feedback360/form-builder"
          className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all border border-slate-200 shadow-sm active:scale-95"
        >
          <LayoutIcon className="w-4 h-4" />
          Form Builder
        </Link>

        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2.5rem] border border-slate-200">
          <div className="px-6 py-4 flex flex-col border-r border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Cycle</span>
            <select 
              value={selectedCycleId}
              onChange={(e) => onCycleChange(Number(e.target.value))}
              className="bg-transparent border-none text-slate-900 font-black focus:ring-0 cursor-pointer text-lg p-0"
            >
              <option value="">Select Cycle</option>
              {cycles?.map(c => (
                <option key={c.cycleId || c.id} value={c.cycleId || c.id}>
                  {c.cycleName} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {selectedCycle && selectedCycle.status === 'PLANNING' && (
            <button
              onClick={() => onFinalize && onFinalize(selectedCycle.id)}
              disabled={isFinalizing}
              className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-[2rem] text-sm transition-all active:scale-95 flex items-center gap-3"
            >
              {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Finalize Population
            </button>
          )}

          {selectedCycle && (selectedCycle.status === 'FINALIZED' || selectedCycle.status === 'GENERATED') && (
            <div className="flex items-center gap-4">
              <div className="px-8 py-4 flex items-center gap-3 text-emerald-600 font-black text-sm uppercase tracking-widest">
                <CheckCircle2 className="w-5 h-5" />
                {selectedCycle.status}
              </div>
              <button
                onClick={() => onReset && onReset(selectedCycle.id)}
                className="px-6 py-4 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 font-black rounded-[2rem] text-[10px] uppercase tracking-widest transition-all active:scale-95"
                title="Reset to Planning Stage"
              >
                Reset Status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GovernanceHeader;
