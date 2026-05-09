import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/reduxHooks';
import {
  useGetFeedbackTasksQuery,
  useGetMySubmittedFeedbacksQuery
} from '../../features/feedback360/feedback360Api';
import Feedback360Admin from './Feedback360Admin';
import FeedbackAdminDashboard from '../admin/FeedbackAdminDashboard';
import {
  Users,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  AlertCircle
} from 'lucide-react';

const Feedback360Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.roles?.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isHR = user?.roles?.some(r => r === 'HR' || r === 'ROLE_HR');

  const [activeTab, setActiveTab] = React.useState<'tasks' | 'admin' | 'analytics'>('tasks');

  const { data: pendingRequests, isLoading: loadingPending } = useGetFeedbackTasksQuery();
  const { data: submittedFeedbacks, isLoading: loadingSubmitted } = useGetMySubmittedFeedbacksQuery(user?.id || 0, {
    skip: !user?.id
  });

  const pendingCount = pendingRequests?.length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* <div>
          <h1 className="text-3xl font-black text-text-title tracking-tight">360° Feedback</h1>
          <p className="text-text-subtitle mt-1 font-medium">Provide and view feedback for your colleagues</p>
        </div> */}

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-surface-border shadow-sm">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'tasks'
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105'
              : 'text-text-subtitle hover:text-brand-primary hover:bg-brand-primary/5'
              }`}
          >
            My Tasks
          </button>

          {(isAdmin || isHR) && (
            <>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105'
                  : 'text-text-subtitle hover:text-indigo-600 hover:bg-indigo-600/5'
                  }`}
              >
                Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105'
                  : 'text-text-subtitle hover:text-emerald-600 hover:bg-emerald-600/5'
                  }`}
              >
                Analytics
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'tasks' ? (
        <>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm group hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-brand-primary/10 rounded-xl">
                  <Clock className="w-6 h-6 text-brand-primary" />
                </div>
                <span className="text-3xl font-black text-brand-primary">{pendingCount}</span>
              </div>
              <h3 className="text-lg font-bold text-text-title mt-4">Pending Requests</h3>
              <p className="text-sm text-text-subtitle">Feedback you need to provide</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm group hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-3xl font-black text-green-600">{submittedFeedbacks?.length || 0}</span>
              </div>
              <h3 className="text-lg font-bold text-text-title mt-4">Completed</h3>
              <p className="text-sm text-text-subtitle">Feedbacks you have submitted</p>
            </div>
          </div>

          {/* Main Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pending Tasks List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardCheck className="w-5 h-5 text-brand-primary" />
                <h2 className="text-xl font-bold text-text-title">Tasks to Complete</h2>
              </div>

              {loadingPending ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-surface-base rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : pendingCount > 0 ? (
                <div className="grid gap-4">
                  {pendingRequests?.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white p-5 rounded-2xl border border-surface-border flex items-center justify-between group hover:border-brand-primary/30 hover:shadow-sm transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-surface-base flex items-center justify-center border border-surface-border overflow-hidden">
                          <Users className="w-6 h-6 text-text-subtitle" />
                        </div>
                        <div>
                          <h4 className="font-bold text-text-title">
                            {req.isAnonymous ? 'Anonymous Review' : req.targetUserName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                              {req.relationship}
                            </span>
                            <span className="text-xs text-text-subtitle">•</span>
                            <span className="text-xs text-text-subtitle">{req.targetDepartmentName}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/360-feedback/submit/${req.id}`)}
                        className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 transition-all duration-300 active:scale-95"
                      >
                        Start
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-base border border-dashed border-surface-border rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-surface-border">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-text-title">All Caught Up!</h3>
                  <p className="text-text-subtitle max-w-xs mx-auto mt-2">
                    You have completed all your pending 360° feedback requests.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar / Guidelines */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-6 rounded-3xl text-white shadow-xl shadow-brand-primary/20">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Guidelines
                </h3>
                <ul className="space-y-4 text-sm opacity-90">
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</span>
                    Be honest and constructive in your feedback.
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</span>
                    Focus on specific behaviors and examples.
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">3</span>
                    Your responses are aggregated and anonymous for Peer/Subordinate roles.
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm">
                <h3 className="font-bold text-text-title mb-4">Completed Recently</h3>
                {loadingSubmitted ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-12 bg-surface-base rounded-xl animate-pulse" />)}
                  </div>
                ) : submittedFeedbacks?.length ? (
                  <div className="space-y-3">
                    {submittedFeedbacks.slice(0, 5).map((f: any) => (
                      <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-base/50">
                        <span className="text-sm font-medium text-text-title truncate max-w-[120px]">
                          {f.targetName}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-text-subtitle bg-white px-2 py-1 rounded-md">
                          {f.relationship}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-subtitle text-center py-4 italic">No completions yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'admin' ? (
        <Feedback360Admin />
      ) : (
        <FeedbackAdminDashboard />
      )}
    </div>
  );
};

export default Feedback360Dashboard;
