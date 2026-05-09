import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  useGetManagerEvaluationFormQuery,
  useSaveManagerEvaluationAnswersMutation,
  useSubmitManagerEvaluationMutation,
  useSubmitAppraisalManagerMutation,
  useUploadManagerSignatureMutation
} from '../../features/appraisal/appraisalApi';
import SectionCard from '../../components/appraisal/SectionCard';
import QuestionItem from '../../components/appraisal/QuestionItem';
import { 
  UserCheck, 
  Cloud, 
  ChevronLeft, 
  Target, 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  AlertCircle,
  FileText,
  CheckCircle2
} from 'lucide-react';

const ManagerEvaluation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: formData, isLoading } = useGetManagerEvaluationFormQuery(id || '', { skip: !id });
  const [saveAnswers, { isLoading: isSaving }] = useSaveManagerEvaluationAnswersMutation();
  const [submitEvaluation, { isLoading: isSubmitting }] = useSubmitManagerEvaluationMutation();
  const [signOffAppraisal, { isLoading: isSigningOff }] = useSubmitAppraisalManagerMutation();
  const [uploadSignature, { isLoading: isUploadingSignature }] = useUploadManagerSignatureMutation();

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

        {/* Rating Scale Legend */}
        <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 mb-10">
          <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" /> Rating Scale Guide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { v: 5, l: 'Outstanding', d: 'Exceptional' },
              { v: 4, l: 'Exceeds', d: 'Above Avg' },
              { v: 3, l: 'Meets', d: 'Satisfactory' },
              { v: 2, l: 'Below', d: 'Needs Imp' },
              { v: 1, l: 'Unsatisfactory', d: 'Poor' },
            ].map(s => (
              <div key={s.v} className="bg-white/60 p-3 rounded-xl border border-white flex flex-col items-center text-center">
                <span className="text-lg font-black text-indigo-600">{s.v}</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
          {/* LEFT: Employee Self-Assessment Results */}
          <div className="space-y-10">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-4">
              <FileText className="w-4 h-4" /> Employee Self-Assessment
            </h3>
            {formData.categories?.map((section: any) => (
              <SectionCard key={section.categoryId} title={section.categoryName} noPadding={true}>
                <div className="divide-y divide-slate-100">
                    {section.questions.map((q: any, qIdx: number) => (
                      <QuestionItem
                        key={q.questionId}
                        index={qIdx + 1}
                        question={q.questionText}
                        primaryType={q.questionType}
                        secondaryType={q.secondaryQuestionType || 'NONE'}
                        ratingValue={q.employeeRating || 0}
                        isCompleted={q.employeeCompletion ?? null}
                        textValue={q.employeeComment || ''}
                        onRatingChange={() => {}}
                        onCompletionChange={() => {}}
                        disabled={true}
                      />
                    ))}
                </div>
              </SectionCard>
            ))}
          </div>

          {/* RIGHT: Manager Evaluation Form */}
          <div className="space-y-10">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 px-4">
              <UserCheck className="w-4 h-4" /> Your Evaluation
            </h3>
            {formData.categories?.map((section: any) => (
              <SectionCard key={section.categoryId} title={section.categoryName} noPadding={true}>
                <div className="divide-y divide-slate-100">
                    {section.questions.map((q: any, qIdx: number) => (
                      <QuestionItem
                        key={q.questionId}
                        index={qIdx + 1}
                        question={q.questionText}
                        primaryType={q.questionType}
                        secondaryType={q.secondaryQuestionType || 'NONE'}
                        ratingValue={managerRatings[q.questionId.toString()] || 0}
                        isCompleted={null}
                        onRatingChange={(val) => handleRatingChange(q.questionId.toString(), val)}
                        onCompletionChange={() => {}}
                        disabled={isSubmitting || formData.submitted}
                      />
                    ))}
                </div>
              </SectionCard>
            ))}
          </div>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Employee Signature */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appraisee Signature</p>
              {formData.employeeSignature && (
                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase">Verified</div>
              )}
            </div>
            
            <div className="flex flex-col items-center justify-center min-h-[140px] bg-slate-50/50 rounded-2xl border border-slate-100 relative transition-all">
              {formData.employeeSignature ? (
                <img 
                  src={`data:image/png;base64,${formData.employeeSignature}`} 
                  alt="Employee Signature" 
                  className="max-h-24 object-contain mix-blend-multiply"
                />
              ) : (
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Signature Pending</p>
              )}
            </div>
            
            <div className="mt-8 text-center border-t border-slate-50 pt-6">
                <p className="text-xl font-serif italic text-slate-700">{formData.employeeName}</p>
                <p className="text-[10px] text-slate-400 mt-2">Date: {formData.employeeSignedAt ? format(new Date(formData.employeeSignedAt), 'yyyy-MM-dd') : 'N/A'}</p>
            </div>
          </div>

          {/* Manager Signature */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appraiser Signature</p>
              {formData.managerSignature && (
                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase">Verified</div>
              )}
            </div>
            
            <div className="flex flex-col items-center justify-center min-h-[140px] bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 relative group transition-all">
              {formData.managerSignature ? (
                <img 
                  src={`data:image/png;base64,${formData.managerSignature}`} 
                  alt="Manager Signature" 
                  className="max-h-24 object-contain mix-blend-multiply"
                />
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-slate-300 mb-2 group-hover:text-indigo-400 transition-colors" />
                  <p className="text-[10px] font-bold text-slate-400">Click to upload signature photo</p>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (file && id) {
                         try {
                           await uploadSignature({ id, file }).unwrap();
                           alert("Signature photo uploaded successfully!");
                         } catch (err) {
                           alert("Failed to upload signature photo.");
                         }
                       }
                    }}
                    disabled={formData.submitted || isUploadingSignature}
                  />
                  {isUploadingSignature && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="mt-8 text-center border-t border-slate-50 pt-6">
                <p className="text-xl font-serif italic text-slate-700">Evaluator Sign-off</p>
                <p className="text-[10px] text-slate-400 mt-2">Date: {new Date().toISOString().split('T')[0]}</p>
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
