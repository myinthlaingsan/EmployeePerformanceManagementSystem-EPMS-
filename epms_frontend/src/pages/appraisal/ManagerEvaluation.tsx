import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetManagerEvaluationFormQuery,
  useSaveManagerEvaluationAnswersMutation,
  useSubmitManagerEvaluationMutation,
  useSubmitAppraisalManagerMutation
} from '../../features/appraisal/appraisalApi';
import SectionCard from '../../components/appraisal/SectionCard';
import QuestionItem from '../../components/appraisal/QuestionItem';
import { UserCheck } from 'lucide-react';

const ManagerEvaluation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: formData, isLoading } = useGetManagerEvaluationFormQuery(id || '', { skip: !id });
  const [saveAnswers, { isLoading: isSaving }] = useSaveManagerEvaluationAnswersMutation();
  const [submitEvaluation, { isLoading: isSubmitting }] = useSubmitManagerEvaluationMutation();
  const [signOffAppraisal, { isLoading: isSigningOff }] = useSubmitAppraisalManagerMutation();

  const [managerRatings, setManagerRatings] = useState<Record<string, number>>({});
  const [managerComment, setManagerComment] = useState('');

  useEffect(() => {
    if (formData?.categories) {
      const initial: Record<string, number> = {};
      formData.categories.forEach((cat: any) => {
        cat.questions.forEach((q: any) => {
          if (q.ratingValue) {
            initial[q.questionId] = q.ratingValue;
          }
        });
      });
      setManagerRatings(initial);
      setManagerComment(formData.managerComment || '');
    }
  }, [formData]);

  const totalQuestions = useMemo(() =>
    formData?.categories?.reduce((acc: number, section: any) => acc + section.questions.length, 0) || 0,
    [formData]);

  const completedCount = useMemo(() =>
    Object.keys(managerRatings).length,
    [managerRatings]);

  const handleRatingChange = (qId: string, val: number) => {
    setManagerRatings(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (completedCount < totalQuestions) {
      alert('Please provide evaluation for all questions.');
      return;
    }

    try {
      const answersPayload = Object.keys(managerRatings).map((qId) => ({
        questionId: Number(qId),
        ratingValue: managerRatings[qId],
        comment: null
      }));

      // Step 1: Save evaluation answers
      await saveAnswers({ id: formData.managerEvaluationId, answers: answersPayload }).unwrap();

      // Step 2: Finalize the evaluation
      await submitEvaluation(formData.managerEvaluationId).unwrap();

      alert('Manager evaluation submitted successfully!');
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Operation failed. Please try again.';
      alert(errMsg);
    }
  };

  const handleSignOff = async () => {
    if (!window.confirm('Are you sure you want to sign off? This will finalize your part of the appraisal.')) return;
    try {
      await signOffAppraisal({ id: id || '', comment: managerComment }).unwrap();
      alert('Appraisal signed off successfully!');
      navigate('/appraisal');
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Operation failed. Please try again.';
      alert(errMsg);
    }
  }

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Evaluation...</div>;
  if (!formData) return <div className="p-8 text-center text-gray-500 font-bold">Evaluation Form not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manager Evaluation Form</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Evaluate the performance of {formData.employeeName || 'Employee'} for the current cycle.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isSaving || completedCount < totalQuestions || formData.submitted}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Save Evaluation'}
            </button>
            <button
              onClick={handleSignOff}
              disabled={isSigningOff || !formData.submitted}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSigningOff ? 'Signing off...' : 'Sign Off Appraisal'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pt-10">
        {/* Employee Info Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-10 flex flex-wrap gap-10 items-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <UserCheck className="w-8 h-8" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee Name</p>
              <p className="font-bold text-slate-800">{formData.employeeName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
              <p className="font-bold text-slate-800">{formData.employeeCode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Position</p>
              <p className="font-bold text-slate-800">{formData.positionName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
              <p className="font-bold text-slate-800">{formData.departmentName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {formData.categories?.map((section: any) => (
          <SectionCard key={section.categoryId} title={section.categoryName}>
            <div className="divide-y divide-slate-50">
              {section.questions.map((q: any) => (
                <QuestionItem
                  key={q.questionId}
                  question={q.questionText}
                  value={managerRatings[q.questionId] || 0}
                  onChange={(val) => handleRatingChange(q.questionId.toString(), val)}
                  disabled={isSubmitting || formData.submitted}
                  employeeRating={q.employeeRating} // This field should come from the backend DTO
                />
              ))}
            </div>
          </SectionCard>
        ))}

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-10">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            Final Manager Summary
          </h2>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all min-h-40"
            placeholder="Provide a final summary of performance, areas of improvement, and promotion eligibility..."
            value={managerComment}
            onChange={(e) => setManagerComment(e.target.value)}
            disabled={formData.submitted}
          />
        </div>
      </div>
    </div>
  );
};

export default ManagerEvaluation;
