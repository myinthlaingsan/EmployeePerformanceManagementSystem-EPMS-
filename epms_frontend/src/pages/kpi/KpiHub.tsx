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
  const { activeCycleId } = useActiveCycle();

  const { data: librariesResponse } = useGetAllLibrariesQuery();
  const libraries = librariesResponse?.data || [];

  const { data: myGoalsResponse, isLoading: loadingGoals } = useGetGoalSetByEmployeeQuery({
    employeeId: user?.id || 0,
    cycleId: activeCycleId
  }, { skip: !user });

  const myGoals = myGoalsResponse?.data;
  const firstItem = myGoals?.items?.[0];
  const completionPercent = firstItem ? Math.round((firstItem.currentProgress || 0) / firstItem.targetValue * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Hub</h1>
          <p className="text-gray-600 mt-1">Manage KPIs, goal assignments, and performance tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            {user?.roles.join(' / ')}
          </span>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 p-6 rounded-xl text-white shadow-sm">
          <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">KPI Templates</p>
          <p className="text-4xl font-bold mt-2">{libraries.length}</p>
          <p className="mt-2 text-sm text-blue-100/80">Active in library</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Current Status</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{myGoals?.status || 'No Active Cycle'}</p>
          <p className="mt-2 text-sm text-green-600 font-semibold">{myGoals?.status === 'APPROVED' ? 'Focus on achievement' : 'Awaiting initialization'}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">My Progress</p>
          <p className="text-4xl font-bold mt-2 text-gray-900">{completionPercent}%</p>
          <p className="mt-2 text-sm text-blue-600 font-semibold">Personal average</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Administrative Actions */}
        {(isHR || isAdmin) && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Admin Control Center</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/kpi/library')}
                className="p-6 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">KPI Library</h3>
                <p className="text-sm text-gray-500 mt-1">Manage performance templates.</p>
              </button>

              <button
                onClick={() => navigate('/kpi/manage')}
                className="p-6 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Assignments</h3>
                <p className="text-sm text-gray-500 mt-1">Allocate KPI templates to staff.</p>
              </button>
            </div>
          </section>
        )}

        {/* My Performance Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">My Performance</h2>
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            {loadingGoals ? (
              <div className="py-6 text-center text-gray-400">Loading goal data...</div>
            ) : myGoals ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900">My Active Goals</h3>
                    <p className="text-xs text-gray-500">Cycle: {myGoals.appraisalCycleId}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/kpi/goals/${user?.id}`)}
                    className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100 transition"
                  >
                    View Full Details
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-bold text-gray-800">{firstItem?.title || 'No KPIs assigned'}</p>
                      <span className="font-bold text-blue-600">{completionPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${completionPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-gray-100 rounded-lg text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Weight</p>
                      <p className="font-bold text-gray-700">{firstItem?.weightPercent || 0}%</p>
                    </div>
                    <div className="p-3 border border-gray-100 rounded-lg text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                      <p className={`font-bold ${myGoals.status === 'APPROVED' ? 'text-green-600' : 'text-amber-600'}`}>
                        {myGoals.status}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-gray-400 text-sm mb-4">No active KPI goals assigned.</p>
                <button
                  disabled
                  className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg font-bold text-sm cursor-not-allowed"
                >
                  View Details
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default KpiHub;
