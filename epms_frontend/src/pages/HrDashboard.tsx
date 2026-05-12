import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Users, CheckSquare, ClipboardList, AlertTriangle, Star, Building2,
  Bell, FileText, UserPlus, TrendingDown
} from 'lucide-react';
import { useGetHrDashboardQuery } from '../features/dashboard/dashboardApi';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import ChartCard from '../components/dashboard/ChartCard';
import TaskPanel from '../components/dashboard/TaskPanel';
import ProgressBarCard from '../components/dashboard/ProgressBarCard';
import QuickActionPanel, { type Action } from '../components/dashboard/QuickActionPanel';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const HrDashboard: React.FC = () => {
  const { data, isLoading, error } = useGetHrDashboardQuery();

  if (isLoading) return <div className="p-8 text-center">Loading HR Insights...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading dashboard data.</div>;

  const quickActions: Action[] = [
    { id: '1', label: 'Launch Cycle', icon: <TrendingDown size={20} />, onClick: () => { }, color: 'bg-blue-100 text-blue-600' },
    { id: '2', label: 'Add Employee', icon: <UserPlus size={20} />, onClick: () => { }, color: 'bg-green-100 text-green-600' },
    { id: '3', label: 'Generate Report', icon: <FileText size={20} />, onClick: () => { }, color: 'bg-purple-100 text-purple-600' },
    { id: '4', label: 'Review PIPs', icon: <AlertTriangle size={20} />, onClick: () => { }, color: 'bg-red-100 text-red-600' },
    { id: '5', label: 'Send Reminder', icon: <Bell size={20} />, onClick: () => { }, color: 'bg-orange-100 text-orange-600' },
    { id: '6', label: 'Manage Roles', icon: <Building2 size={20} />, onClick: () => { }, color: 'bg-indigo-100 text-indigo-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR Analytics Dashboard</h1>
        <p className="text-gray-500">Monitoring organizational performance and review cycles.</p>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title="Employees Under Review"
          value={data?.totalEmployeesUnderReview || 0}
          icon={<Users size={24} />}
          color="blue"
        />
        <DashboardStatCard
          title="Pending Self-Assessments"
          value={data?.pendingSelfAssessments || 0}
          icon={<ClipboardList size={24} />}
          color="orange"
        />
        <DashboardStatCard
          title="Manager Reviews Pending"
          value={data?.pendingManagerReviews || 0}
          icon={<CheckSquare size={24} />}
          color="purple"
        />
        <DashboardStatCard
          title="Open PIPs"
          value={data?.openPips || 0}
          icon={<AlertTriangle size={24} />}
          color="red"
        />
      </div>

      {/* Row 2: Charts & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Departmental Performance Score">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="departmentName" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="averageScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="space-y-6">
          <ProgressBarCard
            title="Appraisal Completion Rate"
            percentage={data?.appraisalCompletionRate || 0}
            label="Total organization progress"
            color="green"
          />
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
              <Star size={16} className="text-yellow-500" />
              Top Performers
            </h3>
            <div className="space-y-4">
              {data?.topPerformers.map((performer, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {performer.employeeName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{performer.employeeName}</p>
                      <p className="text-[10px] text-gray-500">{performer.department}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">{performer.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Quick Actions */}
      <QuickActionPanel actions={quickActions} />

      {/* Row 4: Task Panels & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskPanel
          title="Urgent HR Tasks"
          tasks={data?.alerts.map((alert, idx) => ({
            id: idx,
            title: alert.title,
            deadline: alert.timestamp,
            priority: alert.type === 'danger' ? 'High' : alert.type === 'warning' ? 'Medium' : 'Low'
          })) || []}
        />
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
          <h3 className="font-semibold text-gray-800 mb-4">System Alerts</h3>
          <div className="space-y-4">
            {data?.alerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-lg flex gap-4 ${alert.type === 'danger' ? 'bg-red-50 text-red-700' :
                  alert.type === 'warning' ? 'bg-orange-50 text-orange-700' :
                    'bg-blue-50 text-blue-700'
                }`}>
                <AlertTriangle size={20} className="shrink-0" />
                <div>
                  <p className="font-bold text-sm">{alert.title}</p>
                  <p className="text-sm opacity-90">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrDashboard;
