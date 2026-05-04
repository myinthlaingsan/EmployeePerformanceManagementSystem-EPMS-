import React from 'react';
import { History, Eye } from 'lucide-react';

interface UpdateHistoryItem {
  id: number;
  date: string;
  context: string;
  value: string;
}

interface KpiUpdateHistoryCardProps {
  history: UpdateHistoryItem[];
}

const KpiUpdateHistoryCard: React.FC<KpiUpdateHistoryCardProps> = ({ history }) => {
  return (
    <div className="bg-slate-100/50 rounded-3xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase">Update History</h3>
        <History className="w-4 h-4 text-slate-400" />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4 px-2">
        <div className="col-span-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</div>
        <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Value</div>
        <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</div>
      </div>

      <div className="space-y-2 mb-6">
        {history.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-50 transition-all hover:shadow-md hover:border-slate-100 group cursor-pointer">
            <div className="col-span-6">
              <p className="text-sm font-bold text-slate-900">{item.date}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.context}</p>
            </div>
            <div className="col-span-4 text-center">
              <span className="text-lg font-black text-slate-900">{item.value}</span>
            </div>
            <div className="col-span-2 flex justify-end">
              <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-3.5 bg-white text-blue-600 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm">
        View Full Log
      </button>
    </div>
  );
};

export default KpiUpdateHistoryCard;
