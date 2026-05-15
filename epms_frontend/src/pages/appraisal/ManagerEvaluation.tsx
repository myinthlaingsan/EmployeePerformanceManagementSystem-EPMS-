import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useGetManagerEvaluationFormQuery,
  useSaveManagerDraftMutation,
  useSaveManagerEvaluationAnswersMutation,
  useSubmitManagerEvaluationMutation,
} from '../../features/appraisal/appraisalApi';
import {
  UserCheck,
  ChevronLeft,
  Target,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/* ─── Rating scale ───────────────────────────────────────────── */
const RATING_SCALE = [
  { v: 1, label: 'Unsatisfactory', color: '#ef4444' },
  { v: 2, label: 'Below Average', color: '#f97316' },
  { v: 3, label: 'Meets Expects', color: '#eab308' },
  { v: 4, label: 'Exceeds', color: '#22c55e' },
  { v: 5, label: 'Outstanding', color: '#0052CC' },
];

/* ─── Rating button (square) ─────────────────────────────────── */
const RatingButton: React.FC<{
  value: number;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}> = ({ value, selected, disabled, onClick }) => {
  const scale = RATING_SCALE.find(s => s.v === value)!;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={scale.label}
      className={[
        'relative w-11 h-11 rounded-lg text-sm font-black border-2',
        'transition-all duration-200 flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        selected
          ? 'text-white border-transparent shadow-lg scale-105'
          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:scale-105 hover:shadow-md',
        disabled ? 'cursor-not-allowed opacity-50 !scale-100' : 'cursor-pointer',
      ].join(' ')}
      style={selected ? {
        background: `linear-gradient(135deg, ${scale.color}cc, ${scale.color})`,
        boxShadow: `0 4px 12px ${scale.color}55`,
      } : {}}
    >
      {value}
      {selected && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-sm flex items-center justify-center shadow"
          style={{ background: scale.color }}
        >
          <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
};

/* ─── Main component ─────────────────────────────────────────── */
const ManagerEvaluation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isHR, isAdmin } = useAuth();

  const { data: formData, isLoading } = useGetManagerEvaluationFormQuery(id || '', { skip: !id });
  const [saveAnswers, { isLoading: isSaving }] = useSaveManagerEvaluationAnswersMutation();
  const [saveManagerDraft, { isLoading: isDrafting }] = useSaveManagerDraftMutation();
  const [submitEvaluation, { isLoading: isSubmitting }] = useSubmitManagerEvaluationMutation();

  const [managerRatings, setManagerRatings] = useState<Record<string, number>>({});
  const [managerComment, setManagerComment] = useState('');
  const [managerComments, setManagerComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (formData?.categories) {
      const initial: Record<string, number> = {};
      const initialComments: Record<string, string> = {};
      formData.categories.forEach((cat: any) => {
        cat.questions.forEach((q: any) => {
          if (q.managerRatingValue) initial[q.questionId] = q.managerRatingValue;
          if (q.managerComment) initialComments[q.questionId] = q.managerComment;
        });
      });
      setManagerRatings(initial);
      setManagerComments(initialComments);
      setManagerComment(formData.finalComment || '');
    }
  }, [formData]);

  const totalQuestions = useMemo(() =>
    formData?.categories?.reduce((acc: number, s: any) => acc + s.questions.length, 0) || 0,
    [formData]);

  const completedCount = useMemo(() =>
    Object.keys(managerRatings).length, [managerRatings]);

  const handleRatingChange = (qId: string, val: number) =>
    setManagerRatings(prev => ({ ...prev, [qId]: val }));

  const handleSubmit = async () => {
    if (completedCount < totalQuestions) {
      toast.warning('Please provide a rating for all questions before submitting.');
      return;
    }
    try {
      const allQIds = Array.from(new Set([...Object.keys(managerRatings), ...Object.keys(managerComments)]));
      const answersPayload = allQIds.map(qId => ({
        questionId: Number(qId),
        ratingValue: managerRatings[qId] || 0,
        comment: managerComments[qId] || null,
      }));
      await saveAnswers({ id: formData.evaluationId, answers: answersPayload }).unwrap();
      await saveManagerDraft({ evaluationId: formData.evaluationId, finalComment: managerComment }).unwrap();
      await submitEvaluation(formData.evaluationId).unwrap();
      toast.success('Manager evaluation submitted successfully!');
      navigate('/appraisal');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Operation failed. Please try again.');
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  if (!formData) return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-500 font-bold">
      Manager Evaluation form could not be loaded.
    </div>
  );
  // Debug: log IDs to verify they match (remove after confirming)
  console.log('[ManagerEval] user.id:', user?.id, '| formData.managerId:', formData.managerId, '| submitted:', formData.submitted);
  const isManager = formData.managerId != null
    ? Number(user?.id) === Number(formData.managerId)
    : isHR || isAdmin // fallback if managerId is null in DB
      ? false
      : true; // if no manager assigned, let role-based MANAGER access it
  const isPrivileged = isHR || isAdmin;

  // Read-only if already submitted OR if the current user is not the assigned manager
  const isReadOnly = !!formData.submitted || !isManager;
  const isDisabled = isSubmitting || isReadOnly;

  const grandTotal = Object.values(managerRatings).reduce((a, b) => a + b, 0);
  const grandMax = totalQuestions * 5;

  return (
    <div className="min-h-screen pb-16" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 60%, #eef2f7 100%)' }}>

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
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Manager Evaluation Form</h1>
              <p className="text-slate-400 text-xs font-medium mt-0.5">
                Evaluating: <span className="text-slate-700 font-bold">{formData.employeeName || 'Employee'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-black text-blue-700">{completedCount}</span>
              <span className="text-sm text-blue-400 font-medium">/ {totalQuestions} rated</span>
              {grandMax > 0 && (
                <span className="ml-1 text-xs font-black text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
                  {grandTotal} pts
                </span>
              )}
            </div>

            {isReadOnly ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-4 py-2 text-sm font-black">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {formData.submitted ? 'Submitted' : 'View Only'}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors px-3"
                >
                  Discard
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSaving || completedCount < totalQuestions || !formData.isSelfSubmitted}
                  title={!formData.isSelfSubmitted ? "Employee must submit self assessment first" : ""}
                  className="px-7 py-2.5 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm shadow-lg order-2"
                  style={{ background: 'linear-gradient(135deg, #0052CC, #0747A6)', boxShadow: '0 4px 14px rgba(0,82,204,0.35)' }}
                >
                  {!formData.isSelfSubmitted
                    ? 'Awaiting Employee'
                    : (isSubmitting ? 'Submitting...' : 'Submit Evaluation')}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const allQIds = Array.from(new Set([...Object.keys(managerRatings), ...Object.keys(managerComments)]));
                      const answersPayload = allQIds.map(qId => ({
                        questionId: Number(qId),
                        ratingValue: managerRatings[qId] || 0,
                        comment: managerComments[qId] || null,
                      }));
                      await saveAnswers({ id: formData.evaluationId, answers: answersPayload }).unwrap();
                      await saveManagerDraft({ evaluationId: formData.evaluationId, finalComment: managerComment }).unwrap();
                      toast.success('Draft saved successfully!');
                    } catch (err: any) {
                      toast.error(err?.data?.message || 'Save failed');
                    }
                  }}
                  disabled={isSubmitting || isSaving || isDrafting}
                  className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 text-sm order-1"
                >
                  {isDrafting ? 'Saving…' : 'Save Draft'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="max-w-5xl mx-auto px-8 pt-8 space-y-6">

        {/* Employee Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 flex flex-wrap gap-10 items-center">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-inner">
            <UserCheck className="w-7 h-7 text-blue-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-3 flex-1">
            {[
              { label: 'Employee Name', value: formData.employeeName },
              { label: 'Employee ID', value: formData.employeeCode },
              { label: 'Position', value: formData.positionName },
              { label: 'Department', value: formData.departmentName },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Scale */}
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

        {/* Evaluation Sections */}
        {formData.categories?.map((section: any, sIdx: number) => {
          const sectionMax = section.questions.length * 5;
          const sectionScore = section.questions.reduce(
            (acc: number, q: any) => acc + (managerRatings[q.questionId.toString()] || 0), 0
          );
          const pct = sectionMax > 0 ? (sectionScore / sectionMax) * 100 : 0;

          return (
            <div
              key={section.categoryId}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_rgba(0,82,204,0.07)]"
            >
              {/* Section header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
                style={{ background: 'linear-gradient(90deg, #f0f5ff 0%, #ffffff 100%)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#0747A6] text-white flex items-center justify-center text-sm font-black shadow-md shadow-blue-200">
                    {sIdx + 1}
                  </div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">{section.categoryName}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Subtotal Score</p>
                    <p className="text-lg font-black text-[#0052CC] leading-none mt-0.5">
                      {sectionScore}
                      <span className="text-sm font-bold text-slate-300"> / {sectionMax}</span>
                    </p>
                  </div>
                  <div className="w-28">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #60a5fa, #0052CC)' }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold text-right mt-0.5">{Math.round(pct)}%</p>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="divide-y divide-slate-50">
                {section.questions.map((q: any, qIdx: number) => {
                  const selected = managerRatings[q.questionId.toString()] || 0;
                  const selectedScale = selected ? RATING_SCALE.find(s => s.v === selected) : null;

                  return (
                    <div
                      key={q.questionId}
                      className="flex items-center gap-6 px-6 py-5 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="w-6 h-6 flex-shrink-0 rounded-md bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400">
                        {qIdx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 leading-snug">{q.questionText}</p>
                        {q.description && (
                          <p className="text-xs text-slate-400 mt-0.5 italic">{q.description}</p>
                        )}
                        {/* Employee Reference - ONLY show if submitted */}
                        {formData.isSelfSubmitted && (q.employeeRatingValue || q.employeeComment) && (
                          <div className="mt-2 flex items-start gap-2 bg-slate-100/50 rounded-lg p-2 border border-slate-100">
                            <div className="text-[9px] font-black text-slate-400 uppercase vertical-text mt-1">Ref</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500">Employee rated:</span>
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black">
                                  {q.employeeRatingValue || 'N/A'}
                                </span>
                              </div>
                              {q.employeeComment && (
                                <p className="text-[10px] text-slate-400 mt-0.5 italic">"{q.employeeComment}"</p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="mt-3">
                          <input
                            type="text"
                            placeholder="Manager's note for this question..."
                            value={managerComments[q.questionId.toString()] || ''}
                            disabled={isDisabled}
                            onChange={(e) => setManagerComments(prev => ({ ...prev, [q.questionId.toString()]: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                          />
                        </div>
                      </div>
                      {selectedScale && (
                        <div
                          className="hidden md:block text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border flex-shrink-0"
                          style={{
                            color: selectedScale.color,
                            borderColor: `${selectedScale.color}44`,
                            background: `${selectedScale.color}11`,
                          }}
                        >
                          {selectedScale.label}
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {[1, 2, 3, 4, 5].map(n => (
                          <RatingButton
                            key={n}
                            value={n}
                            selected={selected === n}
                            disabled={isDisabled}
                            onClick={() => handleRatingChange(q.questionId.toString(), n)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Remarks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 mb-8">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Appraiser's Comment</h3>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all min-h-[140px] resize-none"
                placeholder="Final summary and overall assessment from the evaluator…"
                value={managerComment}
                onChange={e => setManagerComment(e.target.value)}
                disabled={isDisabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerEvaluation;
