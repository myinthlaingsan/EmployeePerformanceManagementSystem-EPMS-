import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useSubmitSelfAssessmentMutation, 
  useCreateSelfAssessmentMutation,
  useSaveDraftMutation, 
  useGetEmployeeAssessmentQuery 
} from '../../features/appraisal/appraisalApi';
import { useGetMeQuery } from '../../features/auth/authApi';
import SectionCard from '../../components/appraisal/SectionCard';
import QuestionItem from '../../components/appraisal/QuestionItem';
import { Briefcase, Target, Shield, Users, Lightbulb, CheckCircle, Clock, User } from 'lucide-react';

const APPRAISAL_SECTIONS = [
  {
    id: 's1',
    title: 'Job Knowledge / Technical Skills',
    icon: <Briefcase className="w-5 h-5" />,
    questions: [
      { id: 'q1_1', text: 'Understands the company’s norms and operational standards' },
      { id: 'q1_2', text: 'Possesses technical skills required for the current role' },
      { id: 'q1_3', text: 'Effectively applies specialized knowledge to daily tasks' }
    ]
  },
  {
    id: 's2',
    title: 'Problem Solving & Supervision',
    icon: <Target className="w-5 h-5" />,
    questions: [
      { id: 'q2_1', text: 'Able to work independently with minimal supervision' },
      { id: 'q2_2', text: 'Identifies problems and proposes viable solutions' },
      { id: 'q2_3', text: 'Demonstrates sound judgment in decision making' }
    ]
  },
  {
    id: 's3',
    title: 'Accountability & Responsibility',
    icon: <Shield className="w-5 h-5" />,
    questions: [
      { id: 'q3_1', text: 'Takes ownership of assigned tasks and outcomes' },
      { id: 'q3_2', text: 'Reliable in meeting deadlines and commitments' }
    ]
  },
  {
    id: 's4',
    title: 'Teamwork & Collaboration',
    icon: <Users className="w-5 h-5" />,
    questions: [
      { id: 'q4_1', text: 'Works well with team members and colleagues' },
      { id: 'q4_2', text: 'Contributes to a positive team environment' },
      { id: 'q4_3', text: 'Communicates effectively with the team' }
    ]
  },
  {
    id: 's5',
    title: 'Innovation & Creativity',
    icon: <Lightbulb className="w-5 h-5" />,
    questions: [
      { id: 'q5_1', text: 'Shows creativity and initiative in tasks' },
      { id: 'q5_2', text: 'Suggests improvements to existing processes' }
    ]
  },
  {
    id: 's6',
    title: 'Work Quality',
    icon: <CheckCircle className="w-5 h-5" />,
    questions: [
      { id: 'q6_1', text: 'Is accurate and careful with work' },
      { id: 'q6_2', text: 'Consistently maintains high standards of quality' }
    ]
  },
  {
    id: 's7',
    title: 'Compliance / Attendance',
    icon: <Clock className="w-5 h-5" />,
    questions: [
      { id: 'q7_1', text: 'Follows company policies and procedures' },
      { id: 'q7_2', text: 'Maintains excellent attendance and punctuality' }
    ]
  }
];

const SelfAssessment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const { data: appraisalData, isLoading: appraisalLoading } = useGetEmployeeAssessmentQuery(id || '', { skip: !id });
  const [createSelfAssessment, { isLoading: isCreating }] = useCreateSelfAssessmentMutation();
  const [submitSelfAssessment, { isLoading: isSubmitting }] = useSubmitSelfAssessmentMutation();
  const [saveDraft, { isLoading: isSaving }] = useSaveDraftMutation();

  const [responses, setResponses] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');

  const totalQuestions = useMemo(() => 
    APPRAISAL_SECTIONS.reduce((acc, section) => acc + section.questions.length, 0), 
  []);
  
  const completedCount = useMemo(() => 
    Object.keys(responses).length, 
  [responses]);

  const handleRatingChange = (qId: string, val: number) => {
    setResponses(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (completedCount < totalQuestions) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    try {
      const payload: any = {
        appraisalId: id,
        responses: Object.keys(responses).reduce((acc, qId) => {
          acc[qId] = { rating: responses[qId], comment: qId === 'overall' ? comment : undefined };
          return acc;
        }, {} as any)
      };
      
      // Step 1: Save the assessment data
      await createSelfAssessment(payload).unwrap();
      
      // Step 2: Perform final submission
      await submitSelfAssessment(id || '').unwrap();
      
      alert('Self-assessment submitted successfully!');
      navigate('/appraisal');
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Operation failed. Please try again.';
      alert(errMsg);
    }
  };

  if (userLoading || appraisalLoading) return <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>;

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
                disabled={isSubmitting || completedCount < totalQuestions}
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
              <p className="font-bold text-slate-800">{user?.staffName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
              <p className="font-bold text-slate-800">{user?.employeeCode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Position</p>
              <p className="font-bold text-slate-800">{user?.positionName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
              <p className="font-bold text-slate-800">{user?.currentDepartmentName || 'N/A'}</p>
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
                  value={responses[q.id] || 0}
                  onChange={(val) => handleRatingChange(q.id, val)}
                  disabled={isSubmitting}
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
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[160px]"
            placeholder="Share your major achievements, challenges, and goals for the next period..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button 
            className="px-8 py-3.5 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
            onClick={() => alert('Draft saved!')}
            disabled={isSaving}
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelfAssessment;
