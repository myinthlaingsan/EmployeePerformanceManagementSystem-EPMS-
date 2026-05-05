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
  const { user } = useAuth();
  const { activeCycleId, activeCycleName } = useActiveCycle();

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

  const kpis = goalSetResponse?.data?.items || [];

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

      <main className="max-w-[1440px] mx-auto px-8 py-12">
        {/* Title and Summary Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">
              <span className="w-8 h-px bg-blue-600"></span>
              Performance Cycle
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">My Assigned Goals</h1>
            <p className="text-slate-400 font-black text-sm uppercase tracking-widest flex items-center gap-2 mt-2">
              {activeCycleName} <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Q3 Progress Review
            </p>
          </div>

          <div className="flex flex-wrap gap-5 w-full lg:w-auto">
            <KpiSummaryCard label="Overall Progress" value={`${overallProgress}%`} icon={TrendingUp} color="blue" />
            <KpiSummaryCard label="Active Goals" value={kpis.length < 10 ? `0${kpis.length}` : kpis.length} icon={Target} color="indigo" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column: Goals */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Primary Objectives</h2>
              <div className="flex gap-3">
                <button className="p-2.5 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"><Filter className="w-5 h-5" /></button>
                <button className="p-2.5 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"><LayoutGrid className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="space-y-8">
              {kpis.map((kpi, idx) => (
                <KpiGoalCard
                  key={kpi.id}
                  kpi={kpi}
                  idx={idx}
                  onUpdate={(item) => { setSelectedKpi(item); setIsUpdateModalOpen(true); }}
                />
              ))}

              {kpis.length === 0 && (
                <div className="bg-white rounded-3xl p-20 border-2 border-dashed border-slate-100 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                    <Target className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-slate-900">No goals assigned yet</p>
                    <p className="text-sm text-slate-400 font-medium">Wait for your manager to set up your objectives for this cycle.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-4 space-y-16">
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
