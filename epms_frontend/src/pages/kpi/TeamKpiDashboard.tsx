import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useAuth } from '../../hooks/useAuth';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { getStatusColor, getPriorityFromWeight } from '../../utils/kpiCalculations';

const TeamKpiDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const { activeCycleName } = useActiveCycle();

  const teamMembers = useMemo(() => {
    if (!user) return [];
    
    const isAdminOrHr = user.roles?.some(r => r === 'ADMIN' || r === 'HR');
    
    console.log('--- DEBUG: Team Dashboard ---');
    console.log('Current User:', user.staffName, 'Roles:', user.roles);
    console.log('Total Employees in System:', employees.length);

    if (isAdminOrHr) {
      return employees; // Show everyone for HR/Admin
    }

    // Filter by direct manager for standard managers
    console.log('Checking matches for user ID:', user.id);
    employees.forEach(emp => {
      console.log(`- Employee: ${emp.staffName}, ManagerID: ${emp.directManagerId}, Match: ${Number(emp.directManagerId) === Number(user.id)}`);
    });

    const reports = employees.filter(emp => Number(emp.directManagerId) === Number(user.id));
    console.log('Filtered Direct Reports Result:', reports.length);
    return reports;
  }, [employees, user]);

  const stats = useMemo(() => ({
    overallCompletion: 72.4,
    onTrack: 24,
    atRisk: 4,
    targetDate: 'Sept 30',
    phase: 'Execution'
  }), []);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Team Performance</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" />
              Direct Reports & Goal Tracking • {activeCycleName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all w-64 shadow-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-900 text-xs font-black rounded-xl hover:bg-gray-50 transition-all shadow-sm uppercase tracking-widest">
              <Download className="w-4 h-4" />
              Report
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overall Completion</p>
              <div className="flex items-center gap-1 text-blue-600 font-bold text-xs">
                <TrendingUp className="w-3 h-3" />
                +5.2% vs LW
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <h3 className="text-5xl font-black text-gray-900">{stats.overallCompletion}%</h3>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.overallCompletion}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <span>Q3 Phase: {stats.phase}</span>
              <span>Target: 85% by {stats.targetDate}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">On Track</p>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-black text-gray-900">{stats.onTrack}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Active Individual KPIs</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Risk & Overdue</p>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-red-600">{stats.atRisk}</p>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">At Risk</p>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Requires manager action</p>
            </div>
          </div>
        </div>

        {/* Goals Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Direct Reports Tracking</h3>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[10px] font-black text-gray-600 hover:bg-gray-50 transition-colors uppercase tracking-widest">
                <Filter className="w-3 h-3" />
                Filter
              </button>
              <button
                onClick={() => navigate('/kpi/manage')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-[10px] font-black hover:bg-black transition-all shadow-md uppercase tracking-widest active:scale-95"
              >
                <Plus className="w-3 h-3" />
                Assign Goal
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Direct Report</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Goal / KPI</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Date</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamMembers.map((emp, idx) => {
                  const mockWeights = [35, 20, 25, 15, 5];
                  const weight = mockWeights[idx % mockWeights.length];
                  const priority = getPriorityFromWeight(weight);
                  const progress = idx % 2 === 0 ? 85 : 42;

                  return (
                    <tr key={emp.id} className="hover:bg-blue-50/10 transition-colors group cursor-pointer" onClick={() => navigate(`/kpi/goals/${emp.id}`)}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                            {emp.staffName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm tracking-tight">{emp.staffName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{emp.positionName || 'Associate'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                            {idx === 0 ? 'Migrate Core Architecture to Cloud' :
                              idx === 1 ? 'Design System Accessibility Compliance' :
                                idx === 2 ? 'Automated Test Coverage > 85%' :
                                  'Standard KPI Deliverable'}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-black uppercase tracking-tighter">
                            {idx === 0 ? 'Architecture' : idx === 1 ? 'Compliance' : 'Stability'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${priority.label === 'Critical' || priority.label === 'High' ? 'bg-red-500' : 'bg-gray-400'
                            }`}></div>
                          <span className="text-xs font-bold text-gray-700">{priority.label}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${progress >= 70 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                          {progress >= 70 ? 'On Track' : 'Delayed'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="w-32 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-black">
                            <span className="text-gray-400 uppercase tracking-widest">{progress}%</span>
                            <ArrowUpRight className={`w-3 h-3 ${progress >= 70 ? 'text-blue-500' : 'text-red-400 rotate-90'}`} />
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${progress >= 70 ? 'bg-blue-600' : 'bg-orange-500'}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-gray-600">Oct 12, 2024</p>
                      </td>
                      <td className="px-4 py-5 text-right">
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
    );
};

export default TeamKpiDashboard;
