import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import {
  Shield, Users, LayoutDashboard, Lock, Activity, Calendar,
  Server, Key, Database, Settings
} from 'lucide-react';
import { useGetAdminDashboardQuery } from '../features/dashboard/dashboardApi';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import ChartCard from '../components/dashboard/ChartCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import QuickActionPanel, { type Action } from '../components/dashboard/QuickActionPanel';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

const AdminDashboard: React.FC = () => {
  const { data, isLoading, error } = useGetAdminDashboardQuery();

  if (isLoading) return <div className="p-8 text-center">Loading Admin Controls...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading admin data.</div>;

  const userStats = [
    { name: 'Active', value: data?.activeUsers || 0 },
    { name: 'Locked', value: data?.lockedAccounts || 0 },
    { name: 'Inactive', value: (data?.totalEmployees || 0) - (data?.activeUsers || 0) - (data?.lockedAccounts || 0) },
  ];

  const quickActions: Action[] = [
    { id: '1', label: 'System Logs', icon: <Server size={20} />, onClick: () => { }, color: 'bg-gray-100 text-gray-600' },
    { id: '2', label: 'User Mgt', icon: <Users size={20} />, onClick: () => { }, color: 'bg-blue-100 text-blue-600' },
    { id: '3', label: 'Security', icon: <Shield size={20} />, onClick: () => { }, color: 'bg-red-100 text-red-600' },
    { id: '4', label: 'DB Backup', icon: <Database size={20} />, onClick: () => { }, color: 'bg-green-100 text-green-600' },
    { id: '5', label: 'Auth Config', icon: <Key size={20} />, onClick: () => { }, color: 'bg-orange-100 text-orange-600' },
    { id: '6', label: 'Settings', icon: <Settings size={20} />, onClick: () => { }, color: 'bg-indigo-100 text-indigo-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-red-600" size={28} />
            System Administration
          </h1>
          <p className="text-gray-500">Global system health and security overview.</p>
        </div>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title="Total Users"
          value={data?.totalEmployees || 0}
          icon={<Users size={24} />}
          color="blue"
        />
        <DashboardStatCard
          title="Departments"
          value={data?.totalDepartments || 0}
          icon={<LayoutDashboard size={24} />}
          color="indigo"
        />
        <DashboardStatCard
          title="Active Cycles"
          value={data?.activeCycles || 0}
          icon={<Calendar size={24} />}
          color="green"
        />
        <DashboardStatCard
          title="Locked Accounts"
          value={data?.lockedAccounts || 0}
          icon={<Lock size={24} />}
          color="red"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ChartCard title="User Account Status">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Shield size={20} className="text-red-500" />
              Security Alerts
            </h3>
            <div className="space-y-4">
              {data?.securityAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 border border-gray-50 rounded-lg hover:bg-red-50/30 transition-colors">
                  <div className={`mt-1 p-2 rounded ${alert.severity === 'HIGH' ? 'bg-red-100 text-red-600' :
                      alert.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                    <Activity size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-900">{alert.event}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{alert.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600">{alert.details}</p>
                    <span className={`text-[10px] font-bold uppercase mt-2 inline-block ${alert.severity === 'HIGH' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                      Severity: {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Quick Actions */}
      <QuickActionPanel actions={quickActions} />

      {/* Row 4: Activity Feed */}
      <div className="grid grid-cols-1 gap-6">
        <ActivityFeed
          activities={data?.recentActivities.map((act, idx) => ({
            id: idx,
            user: act.user,
            action: act.action,
            module: act.module,
            timestamp: act.timestamp
          })) || []}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
