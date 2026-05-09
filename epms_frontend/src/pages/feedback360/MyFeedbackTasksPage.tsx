import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetFeedbackTasksQuery } from '../../features/feedback360/feedback360Api';
import { format } from 'date-fns';
import {
  ClipboardList,
  User,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';

const MyFeedbackTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading, error } = useGetFeedbackTasksQuery();

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return {
          label: 'Completed',
          className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          icon: <CheckCircle2 className="w-3 h-3" />
        };
      case 'EXPIRED':
        return {
          label: 'Expired',
          className: 'bg-red-50 text-red-600 border-red-100',
          icon: <Clock className="w-3 h-3" />
        };
      default:
        return {
          label: 'Pending',
          className: 'bg-amber-50 text-amber-600 border-amber-100',
          icon: <Clock className="w-3 h-3" />
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
        <p className="text-text-muted font-medium animate-pulse">Loading feedback tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center max-w-2xl mx-auto">
        <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100">
          <p className="text-red-600 font-bold text-lg mb-2">Failed to load tasks</p>
          <p className="text-red-500/70 text-sm">Please refresh the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-2">360° Feedback System</p>
          <h1 className="text-4xl font-bold text-text-title tracking-tight">My Feedback Tasks</h1>
          <p className="text-text-muted mt-2 font-medium">Provide constructive feedback to your colleagues and team members.</p>
        </div>

        <div className="bg-white px-6 py-3 rounded-2xl border border-surface-border shadow-premium flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Tasks</p>
            <p className="text-xl font-black text-text-title">{tasks.length}</p>
          </div>
        </div>
      </header>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const status = getStatusDisplay(task.status);
            const isPending = task.status === 'PENDING';

            return (
              <div
                key={task.id}
                className={`group bg-white rounded-[2.5rem] border border-surface-border p-8 shadow-premium hover:shadow-hover transition-all duration-500 relative overflow-hidden flex flex-col ${!isPending ? 'opacity-75 grayscale-[0.5]' : ''}`}
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-8">
                  <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.className}`}>
                    {status.icon}
                    {status.label}
                  </div>
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-brand-primary/20 transition-colors">
                    {task.relationship}
                  </div>
                </div>

                {/* Subject Info */}
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-3xl bg-surface-base flex items-center justify-center text-brand-primary shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-title tracking-tight">{task.targetUserName}</h3>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">Evaluation Subject</p>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-text-muted">
                    <Calendar className="w-4 h-4 text-brand-primary/50" />
                    {/* <span className="text-sm font-medium">Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span> */}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  disabled={!isPending}
                  onClick={() => navigate(`/feedback-360/give/${task.id}`)}
                  className={`w-full mt-auto flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${isPending
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90'
                    : 'bg-surface-base text-text-muted cursor-not-allowed border border-surface-border'
                    }`}
                >
                  {isPending ? (
                    <>
                      Start Feedback
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    'View Submission'
                  )}
                </button>

                {/* Background Decoration */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors"></div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-surface-border shadow-premium border-dashed border-2">
            <div className="w-20 h-20 bg-surface-base rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <ClipboardList className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-text-title mb-2">All caught up!</h3>
            <p className="text-text-muted font-medium">There are no pending feedback tasks assigned to you at this moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFeedbackTasksPage;
