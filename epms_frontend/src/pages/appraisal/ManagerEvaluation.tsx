import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetEmployeeAssessmentQuery,
  useCreateManagerEvaluationMutation,
  useSubmitManagerEvaluationMutation,
  useSubmitAppraisalManagerMutation
} from '../../features/appraisal/appraisalApi';
import SectionCard from '../../components/appraisal/SectionCard';
import QuestionItem from '../../components/appraisal/QuestionItem';
import { Briefcase, Target, Shield, Users, Lightbulb, CheckCircle, Clock, UserCheck } from 'lucide-react';

const APPRAISAL_SECTIONS = [
  {
    id: 's1',
    title: 'Job Knowledge / Technical Skills',
    questions: [
      { id: 'q1_1', text: 'Understands the company’s norms and operational standards' },
      { id: 'q1_2', text: 'Possesses technical skills required for the current role' },
      { id: 'q1_3', text: 'Effectively applies specialized knowledge to daily tasks' }
    ]
  },
  {
    id: 's2',
    title: 'Problem Solving & Supervision',
    questions: [
      { id: 'q2_1', text: 'Able to work independently with minimal supervision' },
      { id: 'q2_2', text: 'Identifies problems and proposes viable solutions' },
      { id: 'q2_3', text: 'Demonstrates sound judgment in decision making' }
    ]
  },
  {
    id: 's3',
    title: 'Accountability & Responsibility',
    questions: [
      { id: 'q3_1', text: 'Takes ownership of assigned tasks and outcomes' },
      { id: 'q3_2', text: 'Reliable in meeting deadlines and commitments' }
    ]
  },
  {
    id: 's4',
    title: 'Teamwork & Collaboration',
    questions: [
      { id: 'q4_1', text: 'Works well with team members and colleagues' },
      { id: 'q4_2', text: 'Contributes to a positive team environment' },
      { id: 'q4_3', text: 'Communicates effectively with the team' }
    ]
  },
  {
    id: 's5',
    title: 'Innovation & Creativity',
    questions: [
      { id: 'q5_1', text: 'Shows creativity and initiative in tasks' },
      { id: 'q5_2', text: 'Suggests improvements to existing processes' }
    ]
  },
  {
    id: 's6',
    title: 'Work Quality',
    questions: [
      { id: 'q6_1', text: 'Is accurate and careful with work' },
      { id: 'q6_2', text: 'Consistently maintains high standards of quality' }
    ]
  },
  {
    id: 's7',
    title: 'Compliance / Attendance',
    questions: [
      { id: 'q7_1', text: 'Follows company policies and procedures' },
      { id: 'q7_2', text: 'Maintains excellent attendance and punctuality' }
    ]
  }
];

// Mock Employee Ratings for fallback
const MOCK_EMPLOYEE_RATINGS: Record<string, number> = {
  'q1_1': 4, 'q1_2': 5, 'q1_3': 4,
  'q2_1': 3, 'q2_2': 4, 'q2_3': 4,
  'q3_1': 5, 'q3_2': 5,
  'q4_1': 4, 'q4_2': 4, 'q4_3': 5,
  'q5_1': 3, 'q5_2': 4,
  'q6_1': 5, 'q6_2': 4,
  'q7_1': 5, 'q7_2': 5,
};

const ManagerEvaluation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: appraisalData, isLoading } = useGetEmployeeAssessmentQuery(id || '', { skip: !id });
  const [createManagerEvaluation, { isLoading: isCreating }] = useCreateManagerEvaluationMutation();
  const [submitManagerEvaluation, { isLoading: isSubmitting }] = useSubmitManagerEvaluationMutation();
  const [finalizeAppraisal, { isLoading: isFinalizing }] = useSubmitAppraisalManagerMutation();

  const [managerRatings, setManagerRatings] = useState<Record<string, number>>({});
  const [managerComment, setManagerComment] = useState('');

  // Extract real employee ratings from appraisalData
  const employeeSelfRatings = useMemo(() => {
    if (!appraisalData?.selfAssessment?.responses) return {};
    return appraisalData.selfAssessment.responses;
  }, [appraisalData]);

  const totalQuestions = useMemo(() =>
    APPRAISAL_SECTIONS.reduce((acc, section) => acc + section.questions.length, 0),
    []);

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
      const payload: any = {
        appraisalId: id,
        responses: Object.keys(managerRatings).reduce((acc, qId) => {
          acc[qId] = { rating: managerRatings[qId], comment: qId === 'summary' ? managerComment : undefined };
          return acc;
        }, {} as any)
      };

      // Step 1: Save evaluation data
      await createManagerEvaluation(payload).unwrap();

      // Step 2: Finalize the evaluation
      await submitManagerEvaluation(id || '').unwrap();

      alert('Manager evaluation submitted successfully!');
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Operation failed. Please try again.';
      alert(errMsg);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Are you sure you want to finalize? This will lock the appraisal.')) return;
    try {
      await finalizeAppraisal(id || '').unwrap();
      alert('Appraisal finalized successfully!');
      navigate('/appraisal');
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Operation failed. Please try again.';
      alert(errMsg);
    }
  }

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Evaluation...</div>;

  const empInfo = appraisalData?.employeeInfo || {};

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manager Evaluation Form</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Evaluate the performance of {empInfo.staffName || 'Employee'} for the current cycle.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || completedCount < totalQuestions}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Save Evaluation'}
            </button>
            <button
              onClick={handleFinalize}
              disabled={isFinalizing || completedCount < totalQuestions}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isFinalizing ? 'Finalizing...' : 'Finalize Appraisal'}
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
              <p className="font-bold text-slate-800">{empInfo.staffName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
              <p className="font-bold text-slate-800">{empInfo.employeeCode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Position</p>
              <p className="font-bold text-slate-800">{empInfo.positionName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
              <p className="font-bold text-slate-800">{empInfo.currentDepartmentName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {APPRAISAL_SECTIONS.map((section) => (
          <SectionCard key={section.id} title={section.title}>
            <div className="divide-y divide-slate-50">
              {section.questions.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q.text}
                  value={managerRatings[q.id] || 0}
                  onChange={(val) => handleRatingChange(q.id, val)}
                  disabled={isSubmitting}
                  employeeRating={employeeSelfRatings[q.id]?.rating}
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
          />
        </div>
      </div>
    </div>
  );
};

export default ManagerEvaluation;
