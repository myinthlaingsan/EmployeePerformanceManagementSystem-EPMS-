import React from 'react';

interface Activity {
  id: string | number;
  user: string;
  action: string;
  timestamp: string;
  module?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, title = "Recent Activity" }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((item, idx) => (
            <div key={item.id} className="relative pl-6 pb-6 last:pb-0">
              {idx !== activities.length - 1 && (
                <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-gray-100"></div>
              )}
              <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
              <div className="flex flex-col">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-900">{item.user}</span>
                  <span className="text-[10px] text-gray-400 font-mono uppercase">{item.timestamp}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {item.action} {item.module && <span className="text-blue-500 font-medium">[{item.module}]</span>}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 italic">No recent activity</div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
