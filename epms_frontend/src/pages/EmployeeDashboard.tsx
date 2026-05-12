import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Trophy, Target, Clock, ClipboardList, MessageSquare
} from 'lucide-react';
import { useGetEmployeeDashboardQuery } from '../features/dashboard/dashboardApi';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import ChartCard from '../components/dashboard/ChartCard';
import TaskPanel from '../components/dashboard/TaskPanel';

const COLORS = ['#3b82f6', '#e5e7eb'];

const EmployeeDashboard: React.FC = () => {
  const { data, isLoading, error } = useGetEmployeeDashboardQuery();

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading your performance metrics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading dashboard.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-500">Here's your performance overview for the current cycle.</p>
        </div>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard 
          title="Performance Score" 
          value={`${data?.currentScore?.toFixed(1) || 0}%`} 
          icon={<Trophy size={24} />} 
          color="blue"
        />
        <DashboardStatCard 
          title="KPI Completion" 
          value={`${data?.kpiCompletionPercentage || 0}%`} 
          icon={<Target size={24} />} 
          color="green"
        />
        <DashboardStatCard 
          title="Pending Tasks" 
          value={data?.pendingTasksCount || 0} 
          icon={<ClipboardList size={24} />} 
          color="orange"
        />
        <DashboardStatCard 
          title="Feedback" 
          value={data?.feedbackCount || 0} 
          icon={<MessageSquare size={24} />} 
          color="purple"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Performance Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div>
          <ChartCard title="KPI Status">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.kpiStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.kpiStatus?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Row 3: Tasks and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskPanel 
          tasks={data?.tasks.map(t => ({
            id: t.id,
            title: t.title,
            deadline: t.deadline,
            priority: t.priority as any
          })) || []} 
        />
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            Appraisal Timeline
          </h3>
          <div className="space-y-6">
            {data?.appraisalTimeline.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${step.active ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-gray-300'}`}></div>
                  {idx !== (data?.appraisalTimeline.length || 0) - 1 && <div className="w-0.5 h-full bg-gray-100 my-1"></div>}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${step.active ? 'text-blue-600' : 'text-gray-700'}`}>{step.phase}</h4>
                  <p className="text-xs text-gray-500">{step.date} - {step.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
