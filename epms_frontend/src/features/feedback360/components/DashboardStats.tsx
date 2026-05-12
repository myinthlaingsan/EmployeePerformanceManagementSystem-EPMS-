import React from 'react';
import { Users2 } from 'lucide-react';

interface DashboardStatsProps {
  pendingCount: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ pendingCount }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <Users2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My 360-Degree Reviews</h1>
          <p className="text-slate-500 font-medium">Contribute to your colleagues' professional growth</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
          <span className="text-indigo-600 font-black text-2xl">{pendingCount}</span>
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest ml-3">Pending</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
