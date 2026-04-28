import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { getStatusColor } from '../../utils/kpiCalculations';

const TeamKpiDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const { activeCycleId, activeCycleName } = useActiveCycle();

  // Mocking performance data for visualization purposes since the backend might not have aggregate team stats yet
  const teamStats = useMemo(() => {
    return {
      avgCompletion: 68,
      pendingReviews: 4,
      onTrack: 12,
      atRisk: 2
    };
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header & High Level Analytics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Team Intelligence</h1>
          <p className="text-gray-500 mt-2 font-medium">Monitoring performance across your direct reports.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-3">
            <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">Active Cycle: {activeCycleName}</span>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Team Average</p>
          <p className="text-4xl font-black text-gray-900">{teamStats.avgCompletion}%</p>
          <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${teamStats.avgCompletion}%` }}></div>
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Pending Review</p>
          <p className="text-4xl font-black">{teamStats.pendingReviews}</p>
          <p className="mt-4 text-xs font-bold text-indigo-200 uppercase tracking-widest">Requires Action</p>
          <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" /></svg>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">On Track</p>
          <p className="text-4xl font-black text-green-600">{teamStats.onTrack}</p>
          <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Meeting Targets</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">At Risk</p>
          <p className="text-4xl font-black text-red-600">{teamStats.atRisk}</p>
          <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Immediate Attention</p>
        </div>
      </div>

      {/* Subordinate List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-black text-gray-900">Direct Reports Performance</h2>
          <div className="flex gap-2">
            <button className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition">View All</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.slice(0, 6).map((emp, index) => (
                <tr key={emp.id} className="group hover:bg-indigo-50/30 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                        {emp.staffName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{emp.staffName}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">{emp.positionName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="w-48">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completion</span>
                        <span className="text-sm font-black text-gray-900">{index % 2 === 0 ? '85%' : '42%'}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${index % 2 === 0 ? 'bg-green-500' : 'bg-amber-500'}`} 
                          style={{ width: index % 2 === 0 ? '85%' : '42%' }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      getStatusColor(index % 2 === 0 ? 85 : 42)
                    }`}>
                      {index % 3 === 0 ? 'Pending Review' : 'Active'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => navigate(`/kpi/goals/${emp.id}`)}
                      className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition shadow-sm group-hover:shadow-md"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamKpiDashboard;
