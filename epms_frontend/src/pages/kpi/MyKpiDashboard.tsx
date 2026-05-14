import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGetGoalSetByEmployeeQuery, useGetProgressHistoryQuery } from '../../services/kpiApi';
import ProgressUpdateModal from '../../components/kpi/ProgressUpdateModal';
import { useActiveCycle } from '../../context/ActiveCycleContext';

// Import New Style Components
import KpiSummaryCard from '../../components/kpi/KpiSummaryCard';
import KpiGoalCard from '../../components/kpi/KpiGoalCard';
import KpiUpdateHistoryCard from '../../components/kpi/KpiUpdateHistoryCard';


import {
  Bell,
  HelpCircle,
  LayoutGrid,
  Filter,
  ChevronRight,
  TrendingUp,
  Target
} from 'lucide-react';

const MyKpiDashboard: React.FC = () => {
  const { user, activeCycleId, activeCycleName } = useAuth();

  const { data: goalSetResponse, isLoading } = useGetGoalSetByEmployeeQuery({
    employeeId: user?.id || 0,
    cycleId: activeCycleId
  }, { skip: !user });

  const { data: historyResponse } = useGetProgressHistoryQuery({
    employeeId: user?.id || 0,
    limit: 3
  }, { skip: !user });

  const [selectedKpi, setSelectedKpi] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const isDraft = goalSetResponse?.data?.status === 'DRAFT';
  const kpis = isDraft ? [] : (goalSetResponse?.data?.items || []);

  // Calculate Overall Progress
  const overallProgress = useMemo(() => {
    if (kpis.length === 0) return 0;
    const totalWeight = kpis.reduce((acc, kpi) => acc + (kpi.weightPercent || 0), 0);
    if (totalWeight === 0) return 0;

    const weightedSum = kpis.reduce((acc, kpi) => {
      const progress = Math.min(Math.floor((kpi.currentProgress || 0) / (kpi.targetValue || 1) * 100), 100);
      return acc + (progress * (kpi.weightPercent || 0));
    }, 0);

    return Math.floor(weightedSum / totalWeight);
  }, [kpis]);

  // Real history mapped directly via RTK Query and KpiUpdateHistoryCard

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-blue-100">

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title and Summary Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">My Assigned Goals</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              Cycle: {activeCycleName}
            </p>
          </div>

          <div className="flex gap-4">
            <KpiSummaryCard label="Overall Progress" value={`${overallProgress}%`} icon={TrendingUp} color="blue" />
            <KpiSummaryCard label="Active Goals" value={kpis.length} icon={Target} color="indigo" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Goals */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Primary Objectives</h2>
            </div>

            <div className="space-y-4">
              {kpis.map((kpi, idx) => (
                <KpiGoalCard
                  key={kpi.id}
                  kpi={kpi}
                  idx={idx}
                  onUpdate={(item) => { setSelectedKpi(item); setIsUpdateModalOpen(true); }}
                />
              ))}

              {kpis.length === 0 && (
                <div className="bg-white rounded-xl p-12 border border-dashed border-gray-200 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">
                      {isDraft ? "Goals are being drafted" : "No goals assigned yet"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isDraft ? "Your manager is currently working on your goals for this cycle." : "Wait for your manager to set up your objectives for this cycle."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <KpiUpdateHistoryCard history={historyResponse?.data || []} />
          </div>
        </div>
      </main>

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
