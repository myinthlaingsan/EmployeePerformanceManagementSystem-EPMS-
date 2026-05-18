import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetSubmissionByRequestQuery } from '../../features/feedback360/feedback360Api';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  ShieldCheck, 
  CheckCircle2,
  Target,
  FileText,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

const RATING_SCALE = [
  { v: 1, label: 'Unsatisfactory', color: '#ef4444' },
  { v: 2, label: 'Below Average', color: '#f97316' },
  { v: 3, label: 'Meets Expects', color: '#eab308' },
  { v: 4, label: 'Exceeds', color: '#22c55e' },
  { v: 5, label: 'Outstanding', color: '#0052CC' },
];

const SubmissionReview: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { data: submission, isLoading } = useGetSubmissionByRequestQuery(Number(requestId));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-slate-500 font-black tracking-widest uppercase text-xs">Loading Submission...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl shadow-xl">
        <h2 className="text-2xl font-black text-slate-800 mb-4">Submission not found</h2>
        <button onClick={() => navigate(-1)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-95">Go Back</button>
      </div>
    );
  }

  const categories = Array.from(new Set(submission.responses.map(r => r.categoryName)));

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #f8fafc 60%, #eef2f7 100%)' }}>
      
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Review Record</h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Submitted On {format(new Date(submission.submittedAt), 'PPP')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                COMPLETED
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pt-8 space-y-6">

        {/* ── Info Card ── */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <User className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4">
              {[
                { label: 'Subject', value: submission.targetUserName },
                { label: 'Relationship', value: submission.relationship },
                { label: 'Cycle', value: submission.cycleName },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{label}</p>
                  <p className="text-base font-bold text-slate-800">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-right border-l border-slate-100 pl-8">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Performance Index</p>
            <div className="text-4xl font-black text-indigo-600 tracking-tighter">
               {submission.averageScore.toFixed(0)}<span className="text-lg text-slate-300 ml-0.5">%</span>
            </div>
          </div>
        </div>

        {/* ── Responses by Category ── */}
        {categories.map((cat, sIdx) => {
          const catResponses = submission.responses.filter(r => r.categoryName === cat);
          const subtotal = catResponses.reduce((acc, r) => acc + r.score, 0);
          const maxSubtotal = catResponses.length * 5;
          const pct = maxSubtotal > 0 ? (subtotal / maxSubtotal) * 100 : 0;

          return (
            <div
              key={cat}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_rgba(79,70,229,0.07)]"
            >
              {/* Section header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
                style={{ background: 'linear-gradient(90deg, #f5f0ff 0%, #ffffff 100%)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-sm font-black shadow-md">
                    {sIdx + 1}
                  </div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">{cat}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Section Score</p>
                    <p className="text-lg font-black text-indigo-600 leading-none mt-0.5">
                      {subtotal}
                      <span className="text-sm font-bold text-slate-300"> / {maxSubtotal}</span>
                    </p>
                  </div>
                  <div className="w-28">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #a78bfa, #4f46e5)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="divide-y divide-slate-50">
                {catResponses.map((resp, qIdx) => {
                  const scale = RATING_SCALE.find(s => s.v === resp.score);
                  return (
                    <div key={resp.questionId} className="px-6 py-6 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 flex-shrink-0 rounded-md bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400 mt-0.5">
                          {qIdx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-700 leading-snug mb-4">{resp.questionText}</p>
                          <div className="flex flex-wrap items-center gap-4">
                             <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-md"
                                style={{ background: scale ? `linear-gradient(135deg, ${scale.color}cc, ${scale.color})` : '#cbd5e1' }}
                             >
                                {resp.score}
                             </div>
                             {scale && (
                               <div
                                 className="flex items-center text-[10px] font-black uppercase tracking-wide px-3 py-1 rounded-full border"
                                 style={{ color: scale.color, borderColor: `${scale.color}44`, background: `${scale.color}11` }}
                               >
                                 {scale.label}
                               </div>
                             )}
                             {resp.comment && (
                               <div className="flex-1 min-w-[200px] bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-3">
                                  <MessageSquare className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                  <p className="text-xs text-slate-500 italic">"{resp.comment}"</p>
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Overall Comment ── */}
        {submission.overallComment && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-8">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Final Recommendations & Executive Summary
            </h2>
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden shadow-xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
               <p className="text-lg font-medium italic leading-relaxed opacity-90 relative">
                 "{submission.overallComment}"
               </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SubmissionReview;

