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
import { UserCheck, Cloud } from 'lucide-react';

const ManagerEvaluation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: formData, isLoading } = useGetManagerEvaluationFormQuery(id || '', { skip: !id });
  const [saveAnswers, { isLoading: isSaving }] = useSaveManagerEvaluationAnswersMutation();
  const [submitEvaluation, { isLoading: isSubmitting }] = useSubmitManagerEvaluationMutation();
  const [signOffAppraisal, { isLoading: isSigningOff }] = useSubmitAppraisalManagerMutation();

  const [managerRatings, setManagerRatings] = useState<Record<string, number>>({});
  const [managerComment, setManagerComment] = useState('');
  const [otherRemarks, setOtherRemarks] = useState('');

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
                {section.questions.map((q: any, qIdx: number) => (
                  <QuestionItem
                    key={q.questionId}
                    index={qIdx + 1}
                    question={q.questionText}
                    primaryType={q.questionType || 'RATING'}
                    secondaryType={q.secondaryQuestionType || 'NONE'}
                    ratingValue={managerRatings[q.questionId] || 0}
                    isCompleted={null}
                    onRatingChange={(val) => handleRatingChange(q.questionId.toString(), val)}
                    onCompletionChange={() => {}}
                    disabled={isSubmitting || formData.submitted}
                    employeeRating={q.ratingValue} // This comes from the backend DTO
                  />
                ))}
            </div>
          </SectionCard>
        ))}

        {/* Remarks Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">Other Remarks</h3>
            <textarea
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-32"
              placeholder="Additional observations or notes..."
              value={otherRemarks}
              onChange={(e) => setOtherRemarks(e.target.value)}
              disabled={formData.submitted}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">Appraiser's Comment</h3>
            <textarea
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-32"
              placeholder="Final summary from the evaluator..."
              value={managerComment}
              onChange={(e) => setManagerComment(e.target.value)}
              disabled={formData.submitted}
            />
          </div>
        </div>

        {/* Signature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm h-40 flex flex-col justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appraisee Signature</p>
            <div className="flex flex-col items-center">
                <p className="text-2xl font-serif italic text-slate-700">{formData.employeeName || 'Employee'}</p>
                <div className="w-full border-b border-slate-200 mt-2 mb-4"></div>
                <p className="text-[10px] text-slate-400">Digitally Signed on {new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm h-40 flex flex-col justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appraiser Signature</p>
            <div className="flex flex-col items-center">
                <div className="w-full border-b border-slate-200 mt-2 mb-4"></div>
                <p className="text-[10px] text-slate-400">Pending Approval</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm h-40 flex flex-col justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HR Verification</p>
            <div className="flex flex-col items-center">
                <div className="w-full border-b border-slate-200 mt-2 mb-4"></div>
                <p className="text-[10px] text-slate-400">Pending Verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-4 z-50 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Cloud className="w-4 h-4 text-slate-400" />
            Last saved: 2 minutes ago
          </div>
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate(-1)}
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Discard Draft
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || isSaving || completedCount < totalQuestions || formData.submitted}
              className="px-10 py-3 bg-[#0052CC] text-white font-bold rounded-lg hover:bg-[#0747A6] transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerEvaluation;
