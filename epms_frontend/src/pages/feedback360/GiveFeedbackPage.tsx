import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetFeedbackRequestQuery, 
  useSubmitFeedbackMutation 
} from '../../features/feedback360/feedback360Api';
import { useGetAppraisalFormQuery } from '../../features/appraisal/appraisalApi';
import QuestionRenderer from '../../components/appraisal/QuestionRenderer';
import { 
  ArrowLeft, 
  Send, 
  Info,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const GiveFeedbackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, { rating?: number; comment?: string }>>({});

  const { data: task, isLoading: loadingTask } = useGetFeedbackRequestQuery(id!);
  const { data: form, isLoading: loadingForm } = useGetAppraisalFormQuery(task?.formTemplateId?.toString() || '', {
    skip: !task?.formTemplateId
  });

  const [submitFeedback, { isLoading: submitting }] = useSubmitFeedbackMutation();

  const handleRatingChange = (questionId: string, rating: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], rating }
    }));
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], comment }
    }));
  };

  const handleSubmit = async () => {
    if (!id) return;

    try {
      const payload = {
        requestId: parseInt(id),
        responses: Object.entries(responses).map(([questionId, data]) => ({
          questionId: parseInt(questionId),
          score: data.rating || 0,
          comment: data.comment
        }))
      };

      await submitFeedback(payload as any).unwrap();
      navigate('/360-feedback', { state: { success: true, message: 'Feedback submitted successfully' } });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  if (loadingTask || loadingForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
        <p className="text-text-muted font-medium animate-pulse">Loading evaluation form...</p>
      </div>
    );
  }

  if (!task || !form) {
    return (
      <div className="p-10 text-center max-w-2xl mx-auto">
        <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 text-amber-700">
          <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-bold text-lg mb-2">Form Not Found</p>
          <p className="text-sm opacity-80">The requested evaluation task or form template could not be loaded.</p>
          <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-white rounded-xl border border-amber-200 font-bold text-sm">Go Back</button>
        </div>
      </div>
    );
  }

  const currentSection = form.sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === form.sections.length - 1;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-brand-primary font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </button>
        
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
             <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Evaluating</p>
             <p className="text-sm font-bold text-text-title">{task.targetUserName}</p>
           </div>
           <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black">
             {task.targetUserName.charAt(0)}
           </div>
        </div>
      </div>

      <header>
        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-2">{form.title}</p>
        <h1 className="text-4xl font-bold text-text-title tracking-tight">{currentSection.title}</h1>
        {currentSection.description && (
          <p className="text-text-muted mt-2 font-medium">{currentSection.description}</p>
        )}
      </header>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black text-text-muted uppercase tracking-widest">
          <span>Progress</span>
          <span>{currentSectionIndex + 1} of {form.sections.length} Sections</span>
        </div>
        <div className="h-2 w-full bg-surface-base rounded-full overflow-hidden border border-surface-border">
          <div 
            className="h-full bg-brand-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentSectionIndex + 1) / form.sections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8">
        {currentSection.questions.map((question) => (
          <QuestionRenderer 
            key={question.id}
            question={question as any}
            response={responses[question.id] as any}
            onRatingChange={(rating) => handleRatingChange(question.id, rating)}
            onCommentChange={(comment) => handleCommentChange(question.id, comment)}
            theme="indigo"
          />
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-10 border-t border-surface-border">
        <button
          disabled={currentSectionIndex === 0}
          onClick={() => setCurrentSectionIndex(prev => prev - 1)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            currentSectionIndex === 0 
            ? 'opacity-0 pointer-events-none' 
            : 'text-text-title hover:bg-surface-base border border-surface-border'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Section
        </button>

        <div className="flex items-center gap-4">
           <button 
             className="px-6 py-3 rounded-xl font-bold text-sm text-text-muted hover:text-text-title transition-colors"
           >
             Save Draft
           </button>
           
           {isLastSection ? (
             <button
               onClick={handleSubmit}
               disabled={submitting}
               className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition flex items-center gap-2 disabled:opacity-50"
             >
               {submitting ? 'Submitting...' : 'Submit Feedback'}
               <Send className="w-4 h-4" />
             </button>
           ) : (
             <button
               onClick={() => setCurrentSectionIndex(prev => prev + 1)}
               className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition flex items-center gap-2"
             >
               Next Section
               <ChevronRight className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default GiveFeedbackPage;
