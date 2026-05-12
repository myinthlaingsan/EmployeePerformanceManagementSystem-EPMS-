import React from 'react';

interface StatusBadgeProps {
  type: 'status' | 'relationship';
  value: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  const getStyles = () => {
    if (type === 'relationship') {
      switch (value) {
        case 'MANAGER': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'PEER': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'SUBORDINATE': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'SELF': return 'bg-slate-100 text-slate-700 border-slate-200';
        default: return 'bg-slate-50 text-slate-500 border-slate-100';
      }
    }
    
    // Status styles
    switch (value) {
      case 'COMPLETED':
      case 'SUBMITTED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PENDING':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'DECLINED':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStyles()}`}>
      {value}
    </span>
  );
};

export default StatusBadge;
