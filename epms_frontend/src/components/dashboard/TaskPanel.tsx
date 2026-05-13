import React from 'react';

interface Task {
  id: string | number;
  title: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface TaskPanelProps {
  tasks: Task[];
  title?: string;
}

const TaskPanel: React.FC<TaskPanelProps> = ({ tasks, title = "Pending Tasks" }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
      </div>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{task.title}</span>
                <span className="text-xs text-gray-500 italic">Due: {task.deadline}</span>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                task.priority === 'High' ? 'bg-red-100 text-red-700' : 
                task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 
                'bg-blue-100 text-blue-700'
              }`}>
                {task.priority}
              </span>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 italic">No pending tasks</div>
        )}
      </div>
    </div>
  );
};

export default TaskPanel;
