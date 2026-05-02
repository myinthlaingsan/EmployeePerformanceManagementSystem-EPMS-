import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  History, 
  Plus, 
  MoreHorizontal,
  ChevronRight,
  Target,
  ArrowUpRight,
  Activity,
  Flame
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useAuth } from '../../hooks/useAuth';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { getStatusColor, getPriorityFromWeight } from '../../utils/kpiCalculations';

const GOAL_VELOCITY_DATA = [
  { month: 'Jul', progress: 45 },
  { month: 'Aug', progress: 52 },
  { month: 'Sep', progress: 64 },
  { month: 'Oct', progress: 72 },
];

const TeamKpiDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const { activeCycleName } = useActiveCycle();

  const teamMembers = useMemo(() => {
    if (!user) return [];
    // Only show employees whose direct manager is the current user
    return employees.filter(emp => emp.directManagerId === user.id);
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
      {/* Sub-Header / Tabs */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-8">
          <h2 className="text-lg font-bold text-gray-900">Performance Management</h2>
          <nav className="flex items-center gap-6">
            <button className="text-sm font-medium text-gray-500 hover:text-gray-900 px-1 py-4">Team Overview</button>
            <button className="text-sm font-bold text-blue-600 border-b-2 border-blue-600 px-1 py-4">Department Goals</button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-900 px-1 py-4">Archive</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search team data..."
              className="pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all w-64"
            />
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <History className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors">
            <Download className="w-4 h-4" />
            EXPORT REPORT
          </button>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
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

        {/* Table Toolbar */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['All Goals', 'By Employee', 'Critical Path'].map((tab) => (
              <button 
                key={tab}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  tab === 'All Goals' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button 
              onClick={() => navigate('/kpi/manage')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-all shadow-md shadow-blue-700/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Team Goal
            </button>
          </div>
        </div>

        {/* Goals Table */}
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
                  <tr key={emp.id} className="hover:bg-blue-50/10 transition-colors group">
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
                        <div className={`w-2 h-2 rounded-full ${
                          priority.label === 'Critical' || priority.label === 'High' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-xs font-bold text-gray-700">{priority.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        progress >= 70 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
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
                    <td className="px-4 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">View all direct reports</button>
          </div>
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Goal Velocity Chart */}
          <div className="xl:col-span-2 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Goal Velocity</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">Progress speed across team milestones (Last 3 Months)</p>
              </div>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                View History
              </button>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GOAL_VELOCITY_DATA}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                    dy={10}
                  />
                  <YAxis 
                    hide 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 900, color: '#1e293b', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="progress" 
                    stroke="#2563eb" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorProgress)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Actions/Spotlight */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Critical Action Required</p>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="w-1 bg-red-500 rounded-full h-10"></div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Review: Backend KPI</p>
                    <p className="text-[10px] font-bold text-red-500 mt-1 uppercase">Sarah Miller's project is 12 days overdue</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div className="w-1 bg-blue-500 rounded-full h-10"></div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Set Q4 Department Goals</p>
                    <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase">Planning opens in 3 days</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
                <Activity className="w-32 h-32 text-blue-500" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-4">
                  <Flame className="w-6 h-6" />
                </div>
                <h4 className="text-white font-black text-lg tracking-tight mb-2">Team Spotlight</h4>
                <p className="text-gray-400 text-xs font-medium leading-relaxed">
                  Your team reached 95% of their security goals this quarter. Celebrate the win!
                </p>
                <button className="mt-6 flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest group-hover:gap-3 transition-all">
                  View Spotlight <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamKpiDashboard;
