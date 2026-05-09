import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  useGetAllLibrariesQuery,
  useGetGoalSetByEmployeeQuery
} from '../../services/kpiApi';
import { useActiveCycle } from '../../context/ActiveCycleContext';

const KpiHub: React.FC = () => {
  const navigate = useNavigate();
  const { user, isHR, isAdmin } = useAuth();
  const { activeCycleId, activeCycleName } = useActiveCycle();

  const { data: librariesResponse } = useGetAllLibrariesQuery();
  const libraries = librariesResponse?.data || [];

  const { data: myGoalsResponse, isLoading: loadingGoals } = useGetGoalSetByEmployeeQuery({
    employeeId: user?.id || 0,
    cycleId: activeCycleId
  }, { skip: !user });

  const myGoals = myGoalsResponse?.data;
  const isDraft = myGoals?.status === 'DRAFT';
  const items = isDraft ? [] : (myGoals?.items || []);

  const overallProgress = items.length > 0
    ? Math.floor(items.reduce((acc, item) => acc + ((item.currentProgress || 0) / item.targetValue * item.weightPercent), 0))
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-100 pb-8">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Enterprise</span>
            <span>/</span>
            <span className="text-blue-600">Performance Orchestrator</span>
          </nav>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Intelligence Hub</h1>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Cycle: {activeCycleName}</span>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">My Performance</p>
          <p className="text-4xl font-black text-gray-900">{overallProgress}%</p>
          <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>

        {(isAdmin || isHR) ? (
          <div className="bg-blue-700 p-8 rounded-xl text-white shadow-lg shadow-blue-700/20">
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-2">KPI Templates</p>
            <p className="text-4xl font-black">{libraries.length}</p>
            <button
              onClick={() => navigate('/kpi/library')}
              className="mt-6 text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md transition"
            >
              Manage Library
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assigned KPIs</p>
            <p className="text-4xl font-black text-gray-900">{items.length}</p>
            <p className="mt-4 text-xs font-bold text-gray-400">Active goals in this cycle</p>
          </div>
        )}

        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Goal Status</p>
          <p className="text-2xl font-black text-gray-900 uppercase">{myGoals?.status || 'No Active Goals'}</p>
          <p className="mt-2 text-xs font-bold text-gray-400">Next review scheduled in 12 days</p>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Personal Goals Section */}
        <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 bg-blue-700 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Active Goals</h2>
          </div>

          {loadingGoals ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-gray-50 rounded-lg"></div>
              <div className="h-20 bg-gray-50 rounded-lg"></div>
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-6">
              {items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group cursor-pointer" onClick={() => navigate('/kpi/my')}>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition">{item.title}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Weight: {item.weightPercent}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">{Math.floor((item.currentProgress || 0) / item.targetValue * 100)}%</p>
                    <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${(item.currentProgress || 0) / item.targetValue * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/kpi/my')}
                className="w-full mt-4 py-3 bg-gray-50 text-gray-500 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition"
              >
                View All Personal Goals
              </button>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase">No goals initialized for this cycle</p>
            </div>
          )}
        </section>

        {/* Strategic Control Section */}
        <section className="space-y-8">
          {(isAdmin || isHR) && (
            <div className="bg-gray-900 rounded-xl p-8 text-white shadow-xl">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6">Strategic Control</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/kpi/manage')}
                  className="flex flex-col gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition text-left"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs italic">A</div>
                  <div>
                    <p className="text-xs font-bold">Assign Goals</p>
                    <p className="text-[10px] text-white/40">Allocate library templates</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/kpi/library/new')}
                  className="flex flex-col gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition text-left"
                >
                  <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-black text-xs italic">L</div>
                  <div>
                    <p className="text-xs font-bold">Create Template</p>
                    <p className="text-[10px] text-white/40">Define new KPI models</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">System Sync</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Your performance data is synchronized with the global reference framework.
              Last sync: <span className="text-blue-600 font-bold">14 minutes ago</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default KpiHub;
