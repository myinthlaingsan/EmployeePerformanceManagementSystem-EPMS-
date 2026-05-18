import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetFeedbackFormQuery, 
  useGetMyFeedbackRequestsQuery
} from '../../features/feedback360/feedback360Api';
import { useFeedbackForm } from '../../features/feedback360/hooks/useFeedbackForm';
import { 
  ChevronLeft,
  Target,
  Send,
  Loader2,
  User,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

const RATING_SCALE = [
  { v: 1, label: 'Unsatisfactory', color: '#ef4444' },
  { v: 2, label: 'Below Average', color: '#f97316' },
  { v: 3, label: 'Meets Expects', color: '#eab308' },
  { v: 4, label: 'Exceeds', color: '#22c55e' },
  { v: 5, label: 'Outstanding', color: '#0052CC' },
];

const FeedbackForm: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const rid = Number(requestId || '0');

  const { data: form, isLoading: loadingForm, error } = useGetFeedbackFormQuery(rid, { skip: !rid });
  const { data: requests } = useGetMyFeedbackRequestsQuery();
  
  const {
    answers,
    overallComment,
    isSubmitting,
    setOverallComment,
    handleScore,
    handleComment,
    isFormValid,
    handleSubmit,
  } = useFeedbackForm(rid, form);

  const currentRequest = requests?.find(r => r.id === rid);

  const totalQuestions = useMemo(() => 
    form?.categories.reduce((acc, cat) => acc + cat.questions.length, 0) || 0,
    [form]);

  const completedCount = useMemo(() => 
    Object.values(answers).filter(a => (a.score || 0) > 0).length,
    [answers]);

  if (loadingForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-black tracking-widest uppercase text-xs">Loading Secure Form...</p>
      </div>
    );
  }

  if (error || !form || form.categories.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 text-center bg-red-50 border border-red-100 rounded-3xl shadow-xl">
        <h3 className="text-2xl font-black text-red-900 mb-4">Form Not Ready</h3>
        <p className="text-red-700 font-medium mb-8">
          {!form ? "This request may have been completed or expired." : "This feedback form has no categories or questions configured."}
        </p>
        <button 
          onClick={() => navigate('/feedback360')}
          className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #f8fafc 60%, #eef2f7 100%)' }}>
      
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
              <h1 className="text-xl font-black text-slate-900 tracking-tight">360° Peer Review</h1>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Confidential feedback for {currentRequest?.targetUserName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Privacy Shield</span>
              <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                CONFIDENTIAL
              </div>
            </div>

            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-black text-indigo-700">{completedCount}</span>
              <span className="text-sm text-indigo-400 font-medium">/ {totalQuestions}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid()}
              className="flex items-center gap-3 px-7 py-2.5 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit Review
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pt-8 space-y-6">

        {/* ── Info Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 flex flex-wrap gap-10 items-center">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-inner">
            <User className="w-7 h-7 text-indigo-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-3 flex-1">
            {[
              { label: 'Being Reviewed', value: currentRequest?.targetUserName },
              { label: 'Relationship', value: currentRequest?.relationship },
              { label: 'Cycle', value: currentRequest?.cycleName },
              { label: 'Form Name', value: form.formName },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Rating Scale ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Rating Scale Reference
          </p>
          <div className="flex flex-wrap gap-3">
            {RATING_SCALE.map(({ v, label, color }) => (
              <div key={v} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-md flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${color}99, ${color})` }}
                >
                  {v}
                </div>
                <span className="text-xs font-bold text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Assessment Sections ── */}
        {form.categories.map((section, sIdx) => {
          const sectionMax = section.questions.length * 5;
          const sectionScore = section.questions.reduce((acc, q) =>
            acc + (answers[q.questionId]?.score || 0), 0);
          const pct = sectionMax > 0 ? (sectionScore / sectionMax) * 100 : 0;

          return (
            <div
              key={section.categoryId}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_rgba(79,70,229,0.07)]"
            >
              {/* Section header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
                style={{ background: 'linear-gradient(90deg, #f5f0ff 0%, #ffffff 100%)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-indigo-200">
                    {sIdx + 1}
                  </div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">{section.categoryName}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Subtotal Score</p>
                    <p className="text-lg font-black text-indigo-600 leading-none mt-0.5">
                      {sectionScore}
                      <span className="text-sm font-bold text-slate-300"> / {sectionMax}</span>
                    </p>
                  </div>
                  <div className="w-28">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #a78bfa, #4f46e5)' }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold text-right mt-0.5">{Math.round(pct)}%</p>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="divide-y divide-slate-50">
                {section.questions.map((q, qIdx) => {
                  const resp = answers[q.questionId] || { score: 0, comment: '' };
                  const selScore = resp.score;
                  const selectedScale = selScore ? RATING_SCALE.find(s => s.v === selScore) : null;

                  return (
                    <div key={q.questionId} className="px-6 py-6 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 flex-shrink-0 rounded-md bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400 mt-0.5">
                          {qIdx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 leading-snug mb-4">{q.questionText}</p>
                          
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(n => {
                                const scale = RATING_SCALE.find(s => s.v === n)!;
                                const sel = selScore === n;
                                return (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => handleScore(q.questionId, n)}
                                    title={scale.label}
                                    className={`relative w-10 h-10 rounded-lg text-sm font-black border-2
                                      transition-all duration-200 flex items-center justify-center
                                      ${sel
                                        ? 'text-white border-transparent shadow-lg scale-105'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:scale-105 hover:shadow-md'
                                      }`}
                                    style={sel ? {
                                      background: `linear-gradient(135deg, ${scale.color}cc, ${scale.color})`,
                                      boxShadow: `0 4px 12px ${scale.color}55`,
                                    } : {}}
                                  >
                                    {n}
                                    {sel && (
                                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md border border-white"
                                        style={{ background: scale.color }}>
                                        <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none">
                                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {selectedScale && (
                              <div
                                className="hidden md:flex items-center text-[10px] font-black uppercase tracking-wide px-3 py-1 rounded-full border"
                                style={{ color: selectedScale.color, borderColor: `${selectedScale.color}44`, background: `${selectedScale.color}11` }}
                              >
                                {selectedScale.label}
                              </div>
                            )}

                            <div className="flex-1 min-w-[200px] relative group">
                              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
                              <input
                                type="text"
                                value={resp.comment || ''}
                                onChange={e => handleComment(q.questionId, e.target.value)}
                                placeholder="Add context (optional)..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-300 focus:bg-white transition-all"
                              />
                            </div>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 mb-8">
          <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" />
            Overall Summary & Recommendations
          </h2>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all min-h-[120px] resize-none"
            placeholder="Provide a constructive summary of your colleague's performance and areas for growth..."
            value={overallComment}
            onChange={e => setOverallComment(e.target.value)}
          />
        </div>

      </div>
    </div>
  );
};

export default FeedbackForm;

