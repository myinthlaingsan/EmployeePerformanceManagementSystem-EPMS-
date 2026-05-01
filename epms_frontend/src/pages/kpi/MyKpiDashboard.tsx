import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGetGoalSetByEmployeeQuery } from '../../services/kpiApi';
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
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header & Overall Progress */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm gap-6">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
          <p className="text-gray-600 mt-1">Cycle: {goalSet?.appraisalCycleName || 'Active Appraisal Cycle'}</p>
          <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
              {goalSet?.status || 'ACTIVE'}
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
              Weight: 100%
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-gray-50 px-8 py-4 rounded-xl border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Overall Completion</p>
          <p className="text-4xl font-bold text-blue-600">{overallCompletion}%</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpis.map((kpi) => {
          const progress = Math.min(Math.round((kpi.currentProgress / kpi.targetValue) * 100), 100);
          return (
            <div
              key={kpi.id}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-gray-50 px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-500 uppercase">
                  Weight: {kpi.weightPercent}%
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${getStatusColor(progress)}`}>
                  {progress >= 100 ? 'Completed' : 'In Progress'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{kpi.title}</h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2">{kpi.description}</p>

              <div className="space-y-4 mt-auto">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Achievement</p>
                    <p className="text-xl font-bold text-gray-800">
                      {kpi.currentProgress} <span className="text-sm font-medium text-gray-400">/ {kpi.targetValue} {kpi.unit}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{progress}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-blue-600'
                      }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => { setSelectedKpi(kpi); setIsUpdateModalOpen(true); }}
                className="w-full mt-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors"
              >
                Update Progress
              </button>
            </div>
          );
        })}
      </div>

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
