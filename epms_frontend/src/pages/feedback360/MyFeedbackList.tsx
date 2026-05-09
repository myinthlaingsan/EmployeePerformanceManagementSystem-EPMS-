import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetFeedbackTasksQuery } from '../../features/feedback360/feedback360Api';
import { Search, FileText, ChevronRight, CheckCircle2, User, Users, Shield } from 'lucide-react';

const MyFeedbackList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Roles');
  
  const { data: tasks, isLoading } = useGetFeedbackTasksQuery();

  const filters = ['All Roles', 'Self-Evaluation', 'Direct Manager', 'Peer', 'Subordinate'];

  const ROLE_MAP: Record<string, string> = {
    'Self-Evaluation': 'SELF',
    'Direct Manager': 'MANAGER',
    'Peer': 'PEER',
    'Subordinate': 'SUBORDINATE'
  };

  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = task.targetUserName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = activeFilter === 'All Roles' || task.relationship === ROLE_MAP[activeFilter];
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Feedback</h1>
        <p className="text-slate-500 mt-1 font-medium">Reviews you need to complete or have submitted</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-6 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeFilter === filter 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-[2rem] animate-pulse border border-slate-50" />
          ))}
        </div>
      ) : filteredTasks && filteredTasks.length > 0 ? (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <div 
              key={task.id}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  {task.relationship === 'SELF' ? <User className="w-8 h-8" /> : 
                   task.relationship === 'MANAGER' ? <Shield className="w-8 h-8" /> : 
                   <Users className="w-8 h-8" />}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">
                    {task.isAnonymous ? 'Anonymous Peer Review' : task.targetUserName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {task.relationship?.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">•</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {task.targetDepartmentName}
                    </span>
                  </div>
                </div>
              </div>
              
              {task.status === 'SUBMITTED' ? (
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Submitted
                </div>
              ) : (
                <button 
                  onClick={() => navigate(`/360-feedback/give/${task.id}`)}
                  className="bg-slate-50 text-slate-400 px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all duration-300 flex items-center gap-2 group/btn"
                >
                  Complete Form
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-24 text-center shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <FileText className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">No feedback forms</h3>
          <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium">
            You have no feedback forms assigned yet. Check back later or contact HR if you think this is a mistake.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyFeedbackList;
