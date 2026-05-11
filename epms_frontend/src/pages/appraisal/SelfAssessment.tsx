import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetSelfAssessmentFormQuery,
  useSaveSelfAssessmentAnswersMutation,
  useSubmitSelfAssessmentMutation,
  useSaveDraftMutation,
} from '../../features/appraisal/appraisalApi';
import {
  User,
  Cloud,
  ChevronLeft,
  Target,
  Save,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/* ─── Shared rating scale (mirrors ManagerEvaluation) ───────── */
const RATING_SCALE = [
  { v: 1, label: 'Unsatisfactory', color: '#ef4444' },
  { v: 2, label: 'Below Average', color: '#f97316' },
  { v: 3, label: 'Meets Expects', color: '#eab308' },
  { v: 4, label: 'Exceeds', color: '#22c55e' },
  { v: 5, label: 'Outstanding', color: '#0052CC' },
];

const SelfAssessment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isHR, isAdmin } = useAuth();

  const { data: formResp, isLoading: appraisalLoading } = useGetSelfAssessmentFormQuery(id || '', { skip: !id });
  const [saveAnswers, { isLoading: isSaving }] = useSaveSelfAssessmentAnswersMutation();
  const [submitSelfAssessment, { isLoading: isSubmitting }] = useSubmitSelfAssessmentMutation();
  const [saveDraftMutation, { isLoading: isDrafting }] = useSaveDraftMutation();

  const [responses, setResponses] = useState<Record<string, { ratingValue: number; isCompleted: boolean | null; comment?: string }>>({});
  const [comment, setComment] = useState('');

  const formData = formResp;

  useEffect(() => {
    if (formData?.categories) {
      const initial: Record<string, { ratingValue: number; isCompleted: boolean | null; comment?: string }> = {};
      formData.categories.forEach((cat: any) => {
        cat.questions.forEach((q: any) => {
          initial[q.questionId] = {
            ratingValue: q.ratingValue || 0,
            isCompleted: q.isCompleted ?? null,
            comment: q.comment || '',
          };
        });
      });
      setResponses(initial);
      setComment(formData.overallReflection || '');
    }
  }, [formData]);

  const totalQuestions = useMemo(() =>
    formData?.categories?.reduce((acc: number, s: any) => acc + s.questions.length, 0) || 0,
    [formData]);

  const completedCount = useMemo(() =>
    Object.values(responses).filter(r => r.ratingValue > 0 && r.isCompleted !== null).length,
    [responses]);

  const handleRatingChange = (qId: string, val: number) => setResponses(p => ({ ...p, [qId]: { ...p[qId], ratingValue: val } }));
  const handleCompletionChange = (qId: string, val: boolean) => setResponses(p => ({ ...p, [qId]: { ...p[qId], isCompleted: val } }));
  const handleCommentChange = (qId: string, val: string) => setResponses(p => ({ ...p, [qId]: { ...p[qId], comment: val } }));

  const buildPayload = () => Object.keys(responses).map(qId => ({
    questionId: Number(qId),
    ratingValue: responses[qId].ratingValue,
    isCompleted: responses[qId].isCompleted,
    comment: responses[qId].comment || null,
  }));

  const handleSaveDraft = async () => {
    if (!formData?.selfAssessmentId) return;
    try {
      await saveAnswers({ id: formData.selfAssessmentId, answers: buildPayload() }).unwrap();
      await saveDraftMutation({ selfAssessmentId: formData.selfAssessmentId, overallReflection: comment }).unwrap();
      alert('Draft saved successfully!');
    } catch (err: any) {
      alert(err?.data?.message || 'Operation failed. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (completedCount < totalQuestions) {
      alert('Please answer all questions before submitting.');
      return;
    }
    try {
      await saveAnswers({ id: formData.selfAssessmentId, answers: buildPayload() }).unwrap();
      await saveDraftMutation({ selfAssessmentId: formData.selfAssessmentId, overallReflection: comment }).unwrap();
      await submitSelfAssessment(formData.selfAssessmentId).unwrap();
      alert('Self-assessment submitted successfully!');
      navigate('/appraisal');
    } catch (err: any) {
      alert(err?.data?.message || 'Operation failed. Please try again.');
    }
  };

  if (appraisalLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
    </div>
  );
  if (!formData) return (
    <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-2xl max-w-xl mx-auto mt-20">
      Assessment Form not found.
    </div>
  );

  const isOwner = Number(user?.id) === Number(formData.employeeId);

  // A form is read-only if:
  // 1. It is already submitted
  // 2. The viewer is NOT the employee who owns the form (Manager, HR, Admin)
  const isReadOnly = !!formData.submitted || !isOwner;
  const isDisabled = isSubmitting || isReadOnly;

  // HARD BLOCK: If viewer is NOT the owner AND form is NOT submitted, show nothing.
  if (!isOwner && !formData.submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center max-w-2xl shadow-xl">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Target className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Assessment Not Yet Available</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            You are not authorized to view this self-assessment until <strong>{formData.employeeName}</strong> has completed and submitted it.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg"
          >
            Return to Previous Page
          </button>
        </div>
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
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Employee Self-Assessment</h1>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Reflect on your performance for the current cycle.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-black text-indigo-700">{completedCount}</span>
              <span className="text-sm text-indigo-400 font-medium">/ {totalQuestions}</span>
            </div>
            {!isReadOnly && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving || isDrafting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 text-sm"
                >
                  <Save className="w-4 h-4 text-slate-400" />
                  {isDrafting ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSaving || completedCount < totalQuestions}
                  className="px-7 py-2.5 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Assessment'}
                </button>
              </>
            )}
            {formData.submitted && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-4 py-2 text-sm font-black">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Submitted
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pt-8 space-y-6">

        {/* ── Employee Info Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 flex flex-wrap gap-10 items-center">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-inner">
            <User className="w-7 h-7 text-indigo-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-3 flex-1">
            {[
              { label: 'Employee Name', value: formData.employeeName },
              { label: 'Employee ID', value: formData.employeeCode },
              { label: 'Department', value: formData.departmentName },
              { label: 'Manager', value: formData.managerName },
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
        {formData.categories?.map((section: any, sIdx: number) => {
          const sectionMax = section.questions.length * 5;
          const sectionScore = section.questions.reduce((acc: number, q: any) =>
            acc + (responses[q.questionId.toString()]?.ratingValue || 0), 0);
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
                {section.questions.map((q: any, qIdx: number) => {
                  const qId = q.questionId.toString();
                  const resp = responses[qId] || { ratingValue: 0, isCompleted: null };
                  const hasYN = q.questionType === 'YESNO' || q.secondaryQuestionType === 'YESNO';
                  const hasRating = q.questionType === 'RATING' || q.secondaryQuestionType === 'RATING';
                  const hasText = q.questionType === 'TEXT' || q.secondaryQuestionType === 'TEXT';
                  const selectedScale = resp.ratingValue ? RATING_SCALE.find(s => s.v === resp.ratingValue) : null;
                  const ratingLocked = hasYN && hasRating && resp.isCompleted === null;

                  return (
                    <div key={q.questionId} className="px-6 py-5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Index */}
                        <div className="w-6 h-6 flex-shrink-0 rounded-md bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400 mt-0.5">
                          {qIdx + 1}
                        </div>

                        {/* Question text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 leading-snug mb-3">{q.questionText}</p>

                          <div className="flex flex-wrap items-center gap-3">
                            {/* Yes / No */}
                            {hasYN && (
                              <div className="flex gap-2">
                                {[true, false].map(val => (
                                  <button
                                    key={String(val)}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => handleCompletionChange(qId, val)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold border-2 transition-all duration-200 shadow-sm
                                      ${resp.isCompleted === val
                                        ? val
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200 shadow-md scale-105'
                                          : 'bg-rose-500 text-white border-rose-500 shadow-rose-200 shadow-md scale-105'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:shadow-md'
                                      }
                                      ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                                  >
                                    {val ? 'Yes' : 'No'}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Separator if both */}
                            {hasYN && hasRating && (
                              <div className="w-px h-6 bg-slate-200 mx-1" />
                            )}

                            {/* Rating 1–5 */}
                            {hasRating && (
                              <>
                                {[1, 2, 3, 4, 5].map(n => {
                                  const scale = RATING_SCALE.find(s => s.v === n)!;
                                  const sel = resp.ratingValue === n;
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      disabled={isDisabled || ratingLocked}
                                      onClick={() => handleRatingChange(qId, n)}
                                      title={scale.label}
                                      className={`relative w-10 h-10 rounded-lg text-sm font-black border-2
                                        transition-all duration-200 flex items-center justify-center
                                        ${sel
                                          ? 'text-white border-transparent shadow-lg scale-105'
                                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:scale-105 hover:shadow-md'
                                        }
                                        ${isDisabled || ratingLocked ? 'cursor-not-allowed opacity-50 !scale-100' : 'cursor-pointer'}`}
                                      style={sel ? {
                                        background: `linear-gradient(135deg, ${scale.color}cc, ${scale.color})`,
                                        boxShadow: `0 4px 12px ${scale.color}55`,
                                      } : {}}
                                    >
                                      {n}
                                      {sel && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-sm flex items-center justify-center shadow"
                                          style={{ background: scale.color }}>
                                          <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none">
                                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                                {selectedScale && !ratingLocked && (
                                  <div
                                    className="hidden md:flex items-center text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border"
                                    style={{ color: selectedScale.color, borderColor: `${selectedScale.color}44`, background: `${selectedScale.color}11` }}
                                  >
                                    {selectedScale.label}
                                  </div>
                                )}
                                {ratingLocked && (
                                  <span className="text-[10px] text-amber-500 font-bold italic">Select Yes/No first</span>
                                )}
                              </>
                            )}

                            {/* Text input */}
                            {hasText && (
                              <input
                                type="text"
                                value={resp.comment || ''}
                                disabled={isDisabled || ratingLocked}
                                onChange={e => handleCommentChange(qId, e.target.value)}
                                placeholder={ratingLocked ? 'Select Yes/No first' : 'Your note…'}
                                className="flex-1 min-w-[160px] bg-white border-2 border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all"
                              />
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


        {/* ── Overall Reflection ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 mb-8">
          <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" />
            Overall Self-Reflection
          </h2>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all min-h-[120px] resize-none"
            placeholder="Share your major achievements, challenges, and goals for the next period..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            disabled={isDisabled}
          />
        </div>

      </div>
    </div>
  );
};

export default SelfAssessment;
