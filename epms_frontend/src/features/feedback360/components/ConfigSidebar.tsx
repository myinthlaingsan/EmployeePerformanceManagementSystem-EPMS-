import React from 'react';
import { Lock, ChevronRight, Eye, Play, Loader2, AlertTriangle } from 'lucide-react';

interface ConfigSidebarProps {
  globalMaxLimit: number;
  setGlobalMaxLimit: (val: number) => void;
  excludeLongTermLeave: boolean;
  setExcludeLongTermLeave: (val: boolean) => void;
  isPreviewing: boolean;
  isGenerating: boolean;
  onPreview: () => void;
  onGenerate: () => void;
  canAction: boolean;
}

const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  globalMaxLimit,
  setGlobalMaxLimit,
  excludeLongTermLeave,
  setExcludeLongTermLeave,
  isPreviewing,
  isGenerating,
  onPreview,
  onGenerate,
  canAction
}) => {
  return (
    <div className="lg:col-span-1 space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Strategic Rules</h3>
          <Lock className="w-5 h-5 text-slate-300" />
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Workload</label>
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-black">{globalMaxLimit} Tasks</span>
            </div>
            <input 
              type="range" min="3" max="15" 
              value={globalMaxLimit} 
              onChange={(e) => setGlobalMaxLimit(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-4 group cursor-pointer">
              <div className={`w-12 h-6 rounded-full transition-all relative ${excludeLongTermLeave ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${excludeLongTermLeave ? 'left-7' : 'left-1'}`} />
              </div>
              <input 
                type="checkbox" className="hidden" 
                checked={excludeLongTermLeave} 
                onChange={(e) => setExcludeLongTermLeave(e.target.checked)} 
              />
              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Exclude Long Leave</span>
            </label>
          </div>

          <div className="pt-6 space-y-4">
            <button 
              onClick={onPreview}
              disabled={!canAction || isPreviewing}
              className="w-full py-5 px-8 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-between group hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {isPreviewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                Preview Population
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
            </button>

            <button 
              onClick={onGenerate}
              disabled={!canAction || isGenerating}
              className="w-full py-6 px-8 rounded-3xl bg-indigo-600 text-white font-black text-md flex items-center justify-center gap-4 shadow-2xl shadow-indigo-100 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-white" />}
              LAUNCH CYCLE
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 space-y-4">
         <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Pre-Flight Warning</span>
         </div>
         <p className="text-xs text-amber-700 font-medium leading-relaxed">
            Launching will generate email notifications to all identified evaluators. Ensure the Form Builder setup for this cycle is finalized before proceeding.
         </p>
      </div>
    </div>
  );
};

export default ConfigSidebar;
