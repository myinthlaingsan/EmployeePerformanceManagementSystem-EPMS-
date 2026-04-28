import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGetGoalSetByEmployeeQuery } from '../../features/kpi/kpiApi';
import ProgressUpdateModal from './components/ProgressUpdateModal';
import { 
  calculateProgressPercent, 
  getStatusColor 
} from '../../utils/kpiCalculations';

import { useActiveCycle } from '../../context/ActiveCycleContext';

const MyKpiDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeCycleId } = useActiveCycle();
  
  const { data: goalSetResponse, isLoading } = useGetGoalSetByEmployeeQuery({ 
    employeeId: user?.id || 0, 
    cycleId: activeCycleId 
  }, { skip: !user });

  const [selectedKpi, setSelectedKpi] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const goalSet = goalSetResponse?.data;
  const kpis = goalSet?.items || [];

  const overallCompletion = useMemo(() => {
    if (kpis.length === 0) return 0;
    const total = kpis.reduce((sum, item) => {
      const itemProgress = calculateProgressPercent(item.currentProgress || 0, item.targetValue);
      return sum + (itemProgress * (item.weightPercent / 100));
    }, 0);
    return Math.min(Math.round(total), 100);
  }, [kpis]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Overall Progress */}
      <div className="flex flex-col lg:flex-row gap-10 items-center">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Performance</h1>
          <p className="text-gray-500 mt-2 font-medium text-lg">Appraisal Cycle: {goalSet?.appraisalCycleName || '2024 Q1 Strategic Cycle'}</p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
            <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-black text-gray-700 uppercase tracking-widest">{goalSet?.status || 'Active'}</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Weight Allocated:</span>
              <span className="text-sm font-black text-blue-600">100%</span>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity rounded-full"></div>
          <div className="relative bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * overallCompletion / 100)} className="text-blue-600 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-gray-900">{overallCompletion}%</span>
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Overall Completion</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {kpis.map((kpi, index) => {
          const progress = Math.min(Math.round((kpi.currentProgress / kpi.targetValue) * 100), 100);
          return (
            <div 
              key={kpi.id} 
              className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Weight: {kpi.weightPercent}%
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(progress)}`}>
                  {progress >= 100 ? 'Completed' : 'In Progress'}
                </div>
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{kpi.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-10 line-clamp-2">{kpi.description}</p>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Target Achievement</p>
                    <p className="text-2xl font-black text-gray-800">
                      {kpi.currentProgress} <span className="text-sm font-bold text-gray-300">/ {kpi.targetValue} {kpi.unit}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-blue-600">{progress}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner p-1">
                  <div 
                    className={`h-full rounded-full shadow-lg transition-all duration-1000 ease-in-out ${
                      progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <button 
                onClick={() => { setSelectedKpi(kpi); setIsUpdateModalOpen(true); }}
                className="w-full mt-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all transform active:scale-[0.98] shadow-lg"
              >
                Update Progress
              </button>
            </div>
          );
        })}
      </div>

      {/* Progress Update Modal (Reusing existing or new styled one) */}
      {isUpdateModalOpen && selectedKpi && (
        <ProgressUpdateModal 
          item={selectedKpi}
          onClose={() => setIsUpdateModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MyKpiDashboard;
