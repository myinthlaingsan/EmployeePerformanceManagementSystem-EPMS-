import React, { useState } from 'react';
import { Users, Lock, CheckCircle2, Mail, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import StatusBadge from '../../../components/shared/StatusBadge';
import type { FeedbackRequestResponse } from '../feedback360Types';

interface AssignmentMatrixProps {
  items: FeedbackRequestResponse[] | undefined;
  isLoading: boolean;
  error?: any;
  onGenerateSummaries: () => void;
  isGeneratingSummaries: boolean;
  canGenerateSummaries: boolean;
}

type FilterType = 'ALL' | 'RANDOM' | 'SELF' | 'SUPERIOR_DIRECT';

const AssignmentMatrix: React.FC<AssignmentMatrixProps> = ({
  items,
  isLoading,
  error,
  onGenerateSummaries,
  isGeneratingSummaries,
  canGenerateSummaries
}) => {
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  // Calculates counts dynamically
  const allCount = items?.length || 0;
  const randomCount = items?.filter(item => item.relationship === 'PEER' || item.relationship === 'MANAGER').length || 0;
  const selfCount = items?.filter(item => item.relationship === 'SELF').length || 0;
  const superiorDirectCount = items?.filter(item => item.relationship === 'SUBORDINATE').length || 0;

  // Filter items based on selected category
  const filteredItems = items?.filter(item => {
    if (filterType === 'RANDOM') {
      // From evaluator perspective: PEER evaluates peer, MANAGER evaluates manager (which is a subordinate evaluating boss)
      return item.relationship === 'PEER' || item.relationship === 'MANAGER';
    }
    if (filterType === 'SELF') {
      return item.relationship === 'SELF';
    }
    if (filterType === 'SUPERIOR_DIRECT') {
      // From evaluator perspective: SUBORDINATE is direct manager/superior evaluating subordinate
      return item.relationship === 'SUBORDINATE';
    }
    return true;
  }) || [];

  return (
    <div className="lg:col-span-3 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
      
      {/* ── Card Header ── */}
      <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
          <Users className="w-6 h-6 text-indigo-600" />
          Evaluation Preview Matrix
        </h3>
        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          {filteredItems.length} of {allCount} Items Listed
        </span>
      </div>

      {/* ── PREMIUM SEGMENTED FILTER ROW ── */}
      {allCount > 0 && (
        <div className="px-8 py-4 border-b border-slate-100 flex flex-wrap gap-2 items-center bg-slate-50/30">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Filter View:</span>
          
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 duration-250 ${
              filterType === 'ALL'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-600/10'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            Show All ({allCount})
          </button>

          <button
            onClick={() => setFilterType('RANDOM')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 duration-250 flex items-center gap-1.5 ${
              filterType === 'RANDOM'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-600/10'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            Random Only (Peer & Sub) ({randomCount})
          </button>

          <button
            onClick={() => setFilterType('SELF')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 duration-250 ${
              filterType === 'SELF'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-600/10'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            Self ({selfCount})
          </button>

          <button
            onClick={() => setFilterType('SUPERIOR_DIRECT')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 duration-250 ${
              filterType === 'SUPERIOR_DIRECT'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-600/10'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            Direct Boss & Superior ({superiorDirectCount})
          </button>
        </div>
      )}

      {/* ── Table Workspace ── */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Employee</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Evaluator</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Relationship</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rules Applied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <tr key={`${item.targetUserId}-${item.evaluatorId}`} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                      {(item.targetUserName || '?').charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-slate-900">{item.targetUserName}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {item.targetDepartmentName}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        ({item.targetLevelCode || 'N/A'})
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600">
                      {(item.evaluatorName || '?').charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-slate-700">{item.evaluatorName}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {item.evaluatorDepartmentName || 'N/A'}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        ({item.evaluatorLevelCode || 'N/A'})
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <StatusBadge type="relationship" value={item.relationship} />
                </td>
                <td className="px-8 py-6">
                  <div className="flex gap-2">
                    {item.isAnonymous && (
                      <span className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white" title="Anonymous">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600" title="Valid Assignment">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  </div>
                </td>
              </tr>
            ))}

            {filteredItems.length === 0 && !isLoading && !error && (
              <tr>
                <td colSpan={4} className="py-40 text-center">
                  <Mail className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                    {allCount > 0 ? 'No assignments match the selected filter.' : "Select a cycle and click 'Preview'"}
                  </p>
                </td>
              </tr>
            )}

            {error && !isLoading && (
              <tr>
                <td colSpan={4} className="py-24 px-8 text-center">
                  <div className="max-w-md mx-auto bg-rose-50 border border-rose-100 rounded-3xl p-6 space-y-3">
                     <AlertCircle className="w-10 h-10 text-rose-600 mx-auto animate-bounce" />
                     <h4 className="font-black text-rose-900 text-sm uppercase tracking-wider">Failed to generate preview</h4>
                     <p className="text-xs text-rose-700 font-medium leading-relaxed">
                        {error.data?.message || error.message || "An unexpected internal server error occurred."}
                     </p>
                  </div>
                </td>
              </tr>
            )}
            
            {isLoading && (
              <tr>
                <td colSpan={4} className="py-40 text-center">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Simulating Lifecycle Dynamics...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
          Strategic Verification Active
        </div>
        <button 
          onClick={onGenerateSummaries}
          disabled={!canGenerateSummaries || isGeneratingSummaries}
          className="px-8 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGeneratingSummaries ? 'Processing...' : 'Generate Final Summaries'}
        </button>
      </div>
    </div>
  );
};

export default AssignmentMatrix;
