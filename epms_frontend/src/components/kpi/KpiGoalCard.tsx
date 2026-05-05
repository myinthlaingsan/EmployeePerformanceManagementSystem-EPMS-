import React from 'react';
import { Award, TrendingUp, Play, ChevronRight } from 'lucide-react';

interface KpiGoalCardProps {
  kpi: any;
  idx: number;
  onUpdate: (kpi: any) => void;
}

const KpiGoalCard: React.FC<KpiGoalCardProps> = ({ kpi, idx, onUpdate }) => {
  const progress = Math.min(Math.floor((kpi.currentProgress || 0) / (kpi.targetValue || 1) * 100), 100);
  
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'COMPLETED': return { label: 'Completed', color: 'bg-emerald-500' };
      case 'IN_PROGRESS': return { label: 'In Progress', color: 'bg-blue-500' };
      case 'NOT_STARTED':
      default:
        return { label: 'Not Started', color: 'bg-slate-300' };
    }
  };
  const statusDisplay = getStatusDisplay(kpi.status || 'NOT_STARTED');

  const getCategoryStyles = (category?: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('strategic')) return 'bg-blue-50 text-blue-600';
    if (cat.includes('efficiency')) return 'bg-rose-50 text-rose-600';
    if (cat.includes('learning')) return 'bg-emerald-50 text-emerald-600';
    return 'bg-slate-50 text-slate-600';
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-[1.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 group animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
      {/* Background Progress Number */}
      <div className="absolute top-4 right-8 text-[5rem] font-black text-blue-50 pointer-events-none select-none leading-none z-0">
        {progress}%
      </div>

      <div className="relative z-10">
        <div className="flex gap-3 mb-6">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md ${getCategoryStyles(kpi.categoryName)}`}>
            {kpi.categoryName || 'Strategic'}
          </span>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
            <Award className="w-3 h-3" /> {kpi.weightPercent}% Weight
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex-1 space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                {kpi.title}
              </h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xl">
                {kpi.description || 'Implement proactive engagement strategies to optimize results and achieve targets.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-2">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Target Value</p>
                <p className="text-sm font-black text-slate-900">{kpi.targetValue} {kpi.unit}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Actual Value</p>
                <p className="text-sm font-black text-blue-600">{kpi.currentProgress} {kpi.unit}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                <div className="flex items-center text-[11px] font-bold text-slate-600">
                  <span className={`w-2 h-2 rounded-full mr-2 ${statusDisplay.color}`}></span>
                  {statusDisplay.label}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 min-w-[220px]">
            <div className="space-y-2">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${kpi.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <button 
              onClick={() => onUpdate(kpi)}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2.5 group/btn border border-transparent hover:border-slate-200 shadow-sm"
            >
              {progress === 0 ? <Play className="w-3 h-3 fill-slate-900" /> : <TrendingUp className="w-4 h-4" />}
              {progress === 0 ? 'Start Goal' : 'Update Progress'}
              <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiGoalCard;
