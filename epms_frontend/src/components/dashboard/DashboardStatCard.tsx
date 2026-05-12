import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
}

const DashboardStatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = 'blue' }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
      <div className={`p-4 rounded-lg mr-4 ${colorClasses[color] || colorClasses.blue}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {trend && (
            <span className={`text-xs font-semibold ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isUp ? '↑' : '↓'} {trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardStatCard;
