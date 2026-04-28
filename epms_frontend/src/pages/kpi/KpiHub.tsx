import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  useGetAllLibrariesQuery,
  useGetGoalSetByEmployeeQuery
} from '../../features/kpi/kpiApi';

const KpiHub: React.FC = () => {
  const navigate = useNavigate();
  const { user, isHR, isAdmin } = useAuth();
  
  const { data: librariesResponse } = useGetAllLibrariesQuery();
  const libraries = librariesResponse?.data || [];

  const { data: myGoalsResponse, isLoading: loadingGoals } = useGetGoalSetByEmployeeQuery({ 
    employeeId: user?.id || 0, 
    cycleId: 1 // Default cycle
  }, { skip: !user });

  const myGoals = myGoalsResponse?.data;
  const firstItem = myGoals?.items?.[0];
  const completionPercent = firstItem ? Math.round((firstItem.currentProgress || 0) / firstItem.targetValue * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Performance Hub</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage organizational KPIs, goal assignments, and performance tracking.</p>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
            {user?.roles.join(' / ')}
          </span>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-lg relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-bold uppercase tracking-wider">KPI Templates</p>
            <p className="text-5xl font-black mt-2">{libraries.length}</p>
            <p className="mt-4 text-sm text-blue-100/80">Active in library</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Current Status</p>
          <p className="text-4xl font-black mt-2 text-gray-900">{myGoals?.status || 'No Active Cycle'}</p>
          <p className="mt-4 text-sm text-green-600 font-bold">{myGoals?.status === 'APPROVED' ? 'Focus on achievement' : 'Awaiting initialization'}</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">My Progress</p>
          <p className="text-5xl font-black mt-2 text-gray-900">{completionPercent}%</p>
          <p className="mt-4 text-sm text-blue-600 font-bold">Personal average</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Administrative Actions */}
        {(isHR || isAdmin) && (
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <span className="w-2.5 h-8 bg-blue-600 rounded-full"></span>
              Admin Control Center
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/kpi/library')}
                className="group p-8 bg-white border border-gray-100 rounded-[2rem] hover:border-blue-500 hover:shadow-xl transition-all text-left relative overflow-hidden"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 transform group-hover:rotate-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="font-black text-gray-900 text-xl">KPI Library</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">Define and manage performance templates for all job roles.</p>
              </button>

              <button 
                onClick={() => navigate('/kpi/manage')}
                className="group p-8 bg-white border border-gray-100 rounded-[2rem] hover:border-indigo-500 hover:shadow-xl transition-all text-left relative overflow-hidden"
              >
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 transform group-hover:-rotate-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="font-black text-gray-900 text-xl">Assignments</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">Allocate KPI templates to staff members for the current cycle.</p>
              </button>
            </div>
          </section>
        )}

        {/* My Performance Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <span className="w-2.5 h-8 bg-green-500 rounded-full"></span>
            My Performance
          </h2>
          <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
            {loadingGoals ? (
              <div className="py-10 text-center text-gray-400">Loading goal data...</div>
            ) : myGoals ? (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <div>
                    <h3 className="font-black text-gray-900 text-xl">My Active Goals</h3>
                    <p className="text-sm text-gray-500 font-medium">Appraisal Cycle: {myGoals.appraisalCycleId}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/kpi/goals/${user?.id}`)}
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    Full Details
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Featured Metric</p>
                        <p className="font-black text-gray-800">{firstItem?.title || 'No KPIs assigned'}</p>
                      </div>
                      <span className="font-black text-blue-600 text-2xl">{completionPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full shadow-inner transition-all duration-1000" 
                        style={{ width: `${completionPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-dashed border-gray-200 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Weight</p>
                      <p className="font-black text-gray-700">{firstItem?.weightPercent || 0}%</p>
                    </div>
                    <div className="p-4 border border-dashed border-gray-200 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                      <p className={`font-black ${myGoals.status === 'APPROVED' ? 'text-green-600' : 'text-amber-600'}`}>
                        {myGoals.status}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-10 text-center">
                <p className="text-gray-400 mb-4">You have no active KPI goals assigned for this cycle.</p>
                <button 
                  disabled
                  className="bg-gray-100 text-gray-400 px-6 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed"
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
