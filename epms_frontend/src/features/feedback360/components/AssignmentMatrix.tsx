import React from 'react';
import { Users, Lock, CheckCircle2, Mail, Loader2 } from 'lucide-react';
import StatusBadge from '../../../components/shared/StatusBadge';
import type { FeedbackRequestResponse } from '../feedback360Types';

interface AssignmentMatrixProps {
  items: FeedbackRequestResponse[] | undefined;
  isLoading: boolean;
  onGenerateSummaries: () => void;
  isGeneratingSummaries: boolean;
  canGenerateSummaries: boolean;
}

const AssignmentMatrix: React.FC<AssignmentMatrixProps> = ({
  items,
  isLoading,
  onGenerateSummaries,
  isGeneratingSummaries,
  canGenerateSummaries
}) => {
  return (
    <div className="lg:col-span-3 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
          <Users className="w-6 h-6 text-indigo-600" />
          Evaluation Preview Matrix
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {items?.length || 0} Assignments Identified
        </span>
      </div>

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
            {items?.map((item) => (
              <tr key={`${item.targetUserId}-${item.evaluatorId}`} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                      {item.targetUserName.charAt(0)}
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
                      {item.evaluatorName.charAt(0)}
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

            {!items && !isLoading && (
              <tr>
                <td colSpan={4} className="py-40 text-center">
                  <Mail className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Select a cycle and click 'Preview'</p>
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
