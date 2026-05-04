import React from 'react';
import { History, Eye } from 'lucide-react';

import type { KpiProgressHistory } from '../../features/kpi/kpiTypes';

interface KpiUpdateHistoryCardProps {
  history: KpiProgressHistory[];
}

const KpiUpdateHistoryCard: React.FC<KpiUpdateHistoryCardProps> = ({ history }) => {
  return (
    <div className="bg-slate-100/50 rounded-3xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase">Update History</h3>
        <History className="w-4 h-4 text-slate-400" />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4 px-2">
        <div className="col-span-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Goal</div>
        <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</div>
      </div>

      <div className="space-y-2 mb-6">
        {history.length > 0 ? (
          history.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-50 transition-all hover:shadow-md hover:border-slate-100 group cursor-pointer" title={item.evidenceNote}>
              <div className="col-span-8 overflow-hidden pr-2">
                <p className="text-sm font-bold text-slate-900">{new Date(item.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1 truncate" title={item.goalTitle}>{item.goalTitle}</p>
              </div>
              <div className="col-span-4 text-right">
                <span className="text-lg font-black text-slate-900">{item.actualValue}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-sm text-slate-400 font-medium">
            No updates recorded yet.
          </div>
        )}
      </div>

      <button className="w-full py-3.5 bg-white text-blue-600 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm">
        View Full Log
      </button>
    </div>
  );
};

export default KpiUpdateHistoryCard;
