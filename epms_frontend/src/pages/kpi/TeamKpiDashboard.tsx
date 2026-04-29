import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { getStatusColor } from '../../utils/kpiCalculations';

const TeamKpiDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const { activeCycleName } = useActiveCycle();

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
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Intelligence</h1>
          <p className="text-gray-600 mt-1">Monitoring performance across your direct reports.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Active Cycle: {activeCycleName}</span>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Team Average</p>
          <p className="text-3xl font-bold text-gray-900">{teamStats.avgCompletion}%</p>
          <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${teamStats.avgCompletion}%` }}></div>
          </div>
        </div>

        <div className="bg-blue-600 p-6 rounded-xl text-white shadow-sm">
          <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">Pending Review</p>
          <p className="text-3xl font-bold">{teamStats.pendingReviews}</p>
          <p className="mt-2 text-xs font-semibold text-blue-100 uppercase tracking-wider">Requires Action</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">On Track</p>
          <p className="text-3xl font-bold text-green-600">{teamStats.onTrack}</p>
          <p className="mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Meeting Targets</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">At Risk</p>
          <p className="text-3xl font-bold text-red-600">{teamStats.atRisk}</p>
          <p className="mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Immediate Attention</p>
        </div>
      </div>

      {/* Subordinate List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h2 className="text-lg font-bold text-gray-900">Direct Reports Performance</h2>
          <button className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:text-blue-700 transition">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.slice(0, 6).map((emp, index) => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                        {emp.staffName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{emp.staffName}</p>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase">{emp.positionName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-400">Completion</span>
                        <span className="text-xs font-bold text-gray-900">{index % 2 === 0 ? '85%' : '42%'}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${index % 2 === 0 ? 'bg-green-500' : 'bg-amber-500'}`} 
                          style={{ width: index % 2 === 0 ? '85%' : '42%' }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      getStatusColor(index % 2 === 0 ? 85 : 42)
                    }`}>
                      {index % 3 === 0 ? 'Pending Review' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/kpi/goals/${emp.id}`)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:border-blue-600 hover:text-blue-600 transition shadow-sm"
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
