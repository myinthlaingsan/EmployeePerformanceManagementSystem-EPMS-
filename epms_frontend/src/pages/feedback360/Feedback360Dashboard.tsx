import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMyFeedbackRequestsQuery } from '../../features/feedback360/feedback360Api';
import DashboardStats from '../../features/feedback360/components/DashboardStats';
import FeedbackTaskCard from '../../features/feedback360/components/FeedbackTaskCard';
import StatusBadge from '../../components/shared/StatusBadge';
import { usePagination } from '../../hooks/usePagination';
import { 
  CheckCircle2, 
  AlertCircle,
  ClipboardList,
  ShieldCheck
} from 'lucide-react';

const Feedback360Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Independent pagination for pending and completed lists
  const pendingPaging = usePagination('pending');
  const completedPaging = usePagination('completed');

  const { data: requests, isLoading } = useGetMyFeedbackRequestsQuery();

  const pendingRequests = requests?.filter(r => r.status === 'PENDING') || [];
  const completedRequests = requests?.filter(r => r.status === 'COMPLETED') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <DashboardStats pendingCount={pendingRequests.length} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
              Pending Tasks
            </h2>
          </div>

          {pendingRequests.length > 0 ? (
            <div className="grid gap-4">
              {pendingRequests.map((req) => (
                <FeedbackTaskCard 
                  key={req.id} 
                  request={req} 
                  onAction={(id) => navigate(`/feedback360/evaluate/${id}`)} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Mission Accomplished!</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">You've completed all your assigned 360° feedback reviews for this cycle.</p>
            </div>
          )}

          {completedRequests.length > 0 && (
            <div className="mt-12 space-y-6">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                Completed Recently
              </h2>
              <div className="grid gap-3">
                {completedRequests.map((req) => (
                  <div key={req.id} className="bg-white/60 p-4 rounded-2xl border border-slate-100 flex items-center justify-between opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                        {req.targetUserName.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700">{req.isAnonymous ? 'Confidential Review' : req.targetUserName}</span>
                    </div>
                    <StatusBadge type="relationship" value={req.relationship} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar / Guidelines */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6" />
              Guidelines
            </h3>
            <ul className="space-y-5 text-sm font-medium opacity-90">
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-lg bg-white/20 flex-shrink-0 flex items-center justify-center text-xs font-black">1</span>
                <span>Be **objective and constructive**. Focus on observable behaviors rather than personalities.</span>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-lg bg-white/20 flex-shrink-0 flex items-center justify-center text-xs font-black">2</span>
                <span>Provide **specific examples** in the comment fields to help your colleagues improve.</span>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-lg bg-white/20 flex-shrink-0 flex items-center justify-center text-xs font-black">3</span>
                <span>Your identity is **protected**. Peer and subordinate responses are always anonymized.</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h4 className="font-black text-amber-900 text-sm uppercase tracking-tight">Confidentiality Note</h4>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                Feedback for managers is aggregated. Your individual scores and comments will never be shown to them with your name attached.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback360Dashboard;
