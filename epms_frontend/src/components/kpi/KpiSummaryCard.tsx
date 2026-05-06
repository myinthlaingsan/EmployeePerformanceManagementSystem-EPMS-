import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiSummaryCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

const KpiSummaryCard: React.FC<KpiSummaryCardProps> = ({ label, value, icon: Icon, color = 'blue' }) => {
  return (
    <div className="bg-white rounded-2xl p-6 flex items-center gap-5 border border-slate-100 shadow-sm flex-1 lg:flex-none lg:min-w-[200px]">
      <div className={`w-12 h-12 bg-${color}-50 rounded-xl flex items-center justify-center text-${color}-600`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tight">{label}</p>
      </div>
    </div>
  );
};

export default KpiSummaryCard;
