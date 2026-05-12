import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Users, CheckCircle2, AlertCircle, HelpCircle, TrendingUp
} from 'lucide-react';
import { useGetManagerDashboardQuery } from '../features/dashboard/dashboardApi';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import ChartCard from '../components/dashboard/ChartCard';
import TaskPanel from '../components/dashboard/TaskPanel';

const ManagerDashboard: React.FC = () => {
  const { data, isLoading, error } = useGetManagerDashboardQuery();

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading team overview...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading manager dashboard.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500">Manage your direct reports and their performance cycles.</p>
        </div>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard 
          title="Team Size" 
          value={data?.teamSize || 0} 
          icon={<Users size={24} />} 
          color="blue"
        />
        <DashboardStatCard 
          title="Reviews Completed" 
          value={`${data?.reviewsCompleted || 0}/${data?.totalReviews || 0}`} 
          icon={<CheckCircle2 size={24} />} 
          color="green"
        />
        <DashboardStatCard 
          title="Pending Reviews" 
          value={data?.pendingReviews || 0} 
          icon={<AlertCircle size={24} />} 
          color="orange"
        />
        <DashboardStatCard 
          title="Feedback Requests" 
          value={data?.feedbackRequests || 0} 
          icon={<HelpCircle size={24} />} 
          color="purple"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Team Performance Overview">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {data?.teamPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 90 ? '#10b981' : entry.score > 80 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Team KPI Progress
            </h3>
            <div className="space-y-6">
              {data?.teamKpis.map((kpi, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{kpi.name}</span>
                    <span className="font-bold text-gray-900">{kpi.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${kpi.color} h-2 rounded-full`} style={{ width: `${kpi.progress}%` }}></div>
                  </div>
                </div>
              ))}
              {(!data?.teamKpis || data.teamKpis.length === 0) && <p className="text-gray-400 italic text-sm">No KPI data available for team.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Tasks */}
      <div className="grid grid-cols-1 gap-6">
        <TaskPanel 
          title="Urgent Team Reviews"
          tasks={data?.urgentReviews.map(t => ({
            id: t.id,
            title: t.title,
            deadline: t.deadline,
            priority: t.priority as any
          })) || []} 
        />
      </div>
    </div>
  );
};

export default ManagerDashboard;
