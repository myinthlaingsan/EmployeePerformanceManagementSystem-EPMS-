import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetSelfAssessmentFormQuery,
  useSaveSelfAssessmentAnswersMutation,
  useSubmitSelfAssessmentMutation,
  useSaveDraftMutation
} from '../../features/appraisal/appraisalApi';
import SectionCard from '../../components/appraisal/SectionCard';
import QuestionItem from '../../components/appraisal/QuestionItem';
import { User } from 'lucide-react';

const SelfAssessment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: formResp, isLoading: appraisalLoading } = useGetSelfAssessmentFormQuery(id || '', { skip: !id });
  const [saveAnswers, { isLoading: isSaving }] = useSaveSelfAssessmentAnswersMutation();
  const [submitSelfAssessment, { isLoading: isSubmitting }] = useSubmitSelfAssessmentMutation();
  const [saveDraftMutation, { isLoading: isDrafting }] = useSaveDraftMutation();

  const [responses, setResponses] = useState<Record<string, { ratingValue: number, isCompleted: boolean | null }>>({});
  const [comment, setComment] = useState('');

  const formData = formResp;

  useEffect(() => {
    if (formData?.categories) {
      const initial: Record<string, { ratingValue: number, isCompleted: boolean | null }> = {};
      formData.categories.forEach((cat: any) => {
        cat.questions.forEach((q: any) => {
          initial[q.questionId] = {
            ratingValue: q.ratingValue || 0,
            isCompleted: q.isCompleted ?? null
          };
        });
      });
      setResponses(initial);
    }
  }, [formData]);

  const totalQuestions = useMemo(() =>
    formData?.categories?.reduce((acc: number, section: any) => acc + section.questions.length, 0) || 0,
    [formData]);

  const completedCount = useMemo(() =>
    Object.values(responses).filter(r => r.ratingValue > 0 && r.isCompleted !== null).length,
    [responses]);

  const handleRatingChange = (qId: string, val: number) => {
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], ratingValue: val }
    }));
  };

  const handleCompletionChange = (qId: string, val: boolean) => {
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], isCompleted: val }
    }));
  };

  const handleCommentChange = (qId: string, val: string) => {
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], comment: val }
    }));
  };

  const handleSaveDraft = async () => {
    if (!formData?.selfAssessmentId) return;
    try {
      const answersPayload = Object.keys(responses).map((qId) => ({
        questionId: Number(qId),
        ratingValue: responses[qId].ratingValue,
        isCompleted: responses[qId].isCompleted,
        comment: responses[qId].comment || null
      }));
      await saveAnswers({ id: formData.selfAssessmentId, answers: answersPayload }).unwrap();
      await saveDraftMutation({ selfAssessmentId: formData.selfAssessmentId }).unwrap();
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
      const answersPayload = Object.keys(responses).map((qId) => ({
        questionId: Number(qId),
        ratingValue: responses[qId].ratingValue,
        isCompleted: responses[qId].isCompleted,
        comment: responses[qId].comment || null
      }));

      // Step 1: Save the assessment data
      await saveAnswers({ id: formData.selfAssessmentId, answers: answersPayload }).unwrap();

      // Step 2: Perform final submission
      await submitSelfAssessment(formData.selfAssessmentId).unwrap();

      alert('Self-assessment submitted successfully!');
      navigate('/appraisal');
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Operation failed. Please try again.';
      alert(errMsg);
    }
  };

  if (appraisalLoading) return <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>;
  if (!formData) return <div className="p-8 text-center text-gray-500 font-bold">Assessment Form not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Self-Assessment</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Reflect on your performance for the current cycle.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</p>
              <p className="text-sm font-black text-indigo-600">{completedCount} / {totalQuestions}</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isSaving || completedCount < totalQuestions}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pt-10">
        {/* Employee Info Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-10 flex flex-wrap gap-10 items-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <User className="w-8 h-8" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee Name</p>
              <p className="font-bold text-slate-800">{formData?.employeeName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
              <p className="font-bold text-slate-800">{formData?.employeeCode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Position</p>
              <p className="font-bold text-slate-800">{formData?.positionName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
              <p className="font-bold text-slate-800">{formData?.departmentName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {formData?.categories?.map((section: any) => (
          <SectionCard key={section.categoryId} title={section.categoryName} noPadding={true}>
            <div className="bg-slate-50 grid grid-cols-[40px_1fr_60px_60px_250px] border-b border-slate-300">
              <div className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-200 flex items-center justify-center">#</div>
              <div className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 flex items-center">Assessment Subject</div>
              <div className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-200 flex items-center justify-center">Yes</div>
              <div className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-200 flex items-center justify-center">No</div>
              <div className="flex flex-col border-slate-200">
                <div className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200">Rating</div>
                <div className="grid grid-cols-5 flex-1">
                  {[5, 4, 3, 2, 1].map(n => (
                    <div key={n} className="flex items-center justify-center text-[10px] font-black text-slate-400 border-r last:border-r-0 border-slate-200">{n}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-200">
              {section.questions.map((q: any, idx: number) => (
                <QuestionItem
                  key={q.questionId}
                  index={idx + 1}
                  question={q.questionText}
                  primaryType={q.questionType}
                  secondaryType={q.secondaryQuestionType || 'NONE'}
                  ratingValue={responses[q.questionId.toString()]?.ratingValue || 0}
                  isCompleted={responses[q.questionId.toString()]?.isCompleted ?? null}
                  textValue={responses[q.questionId.toString()]?.comment || ''}
                  onRatingChange={(val) => handleRatingChange(q.questionId.toString(), val)}
                  onCompletionChange={(val) => handleCompletionChange(q.questionId.toString(), val)}
                  onTextChange={(val) => handleCommentChange(q.questionId.toString(), val)}
                  disabled={isSubmitting || formData.submitted}
                />
              ))}
            </div>
          </SectionCard>
        ))}

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-10">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
            Overall Self-Reflection
          </h2>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-40"
            placeholder="Share your major achievements, challenges, and goals for the next period..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={formData?.submitted}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            className="px-8 py-3.5 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            onClick={handleSaveDraft}
            disabled={isDrafting || isSaving || formData?.submitted}
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelfAssessment;
