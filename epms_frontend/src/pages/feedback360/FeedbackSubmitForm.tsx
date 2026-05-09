import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetFeedbackQuestionsQuery, 
  useSubmitFeedbackMutation,
  useGetFeedbackTasksQuery
} from '../../features/feedback360/feedback360Api';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const FeedbackSubmitForm: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const rid = parseInt(requestId || '0', 10);

  const { data: form, isLoading, error } = useGetFeedbackQuestionsQuery(rid, { skip: !rid });
  const { data: requests } = useGetFeedbackTasksQuery();
  const [submitFeedback, { isLoading: submitting }] = useSubmitFeedbackMutation();

  const currentRequest = requests?.find(r => r.id === rid);

  const [responses, setResponses] = useState<Record<number, { score: number; comment: string }>>({});
  const [overallComment, setOverallComment] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (form) {
      const initialOpen: Record<number, boolean> = {};
      form.categories.forEach((cat, index) => {
        initialOpen[cat.categoryId] = index === 0; // Open first by default
      });
      setOpenCategories(initialOpen);
    }
  }, [form]);

  const handleScoreChange = (qId: number, score: number) => {
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], score }
    }));
  };

  const handleCommentChange = (qId: number, comment: string) => {
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], comment }
    }));
  };

  const isFormValid = () => {
    if (!form) return false;
    for (const cat of form.categories) {
      for (const q of cat.questions) {
        if (q.isRequired && (!responses[q.questionId] || !responses[q.questionId].score)) {
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        requestId: rid,
        overallComment,
        responses: Object.entries(responses).map(([qId, data]) => ({
          questionId: parseInt(qId, 10),
          score: data.score,
          comment: data.comment
        }))
      };
      await submitFeedback(payload).unwrap();
      navigate('/360-feedback', { state: { success: true } });
    } catch (err) {
      console.error('Failed to submit:', err);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      <p className="text-text-subtitle font-medium animate-pulse">Loading feedback form...</p>
    </div>
  );

  if (error || !form) return (
    <div className="bg-red-50 p-8 rounded-3xl text-center border border-red-100 max-w-lg mx-auto mt-12">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-red-900">Form Not Available</h3>
      <p className="text-red-700 mt-2">We couldn't load the requested feedback form. It may have been expired or deleted.</p>
      <button 
        onClick={() => navigate('/360-feedback')}
        className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm"
      >
        Go Back
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-surface-base/80 backdrop-blur-md py-4 z-10 border-b border-surface-border -mx-6 px-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-surface-border"
          >
            <ChevronLeft className="w-5 h-5 text-text-subtitle" />
          </button>
          <div>
            <h2 className="text-xl font-black text-text-title tracking-tight">
              Feedback for {currentRequest?.isAnonymous ? 'Colleague' : currentRequest?.targetUserName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {currentRequest?.relationship}
              </span>
              <span className="text-xs text-text-subtitle">{form.formName}</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-text-subtitle">
          <Info className="w-4 h-4 text-brand-primary" />
          Your identity will be protected
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {form.categories.map((category) => (
          <div 
            key={category.categoryId} 
            className="bg-white rounded-3xl border border-surface-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <button 
              onClick={() => setOpenCategories(prev => ({ ...prev, [category.categoryId]: !prev[category.categoryId] }))}
              className="w-full px-8 py-6 flex items-center justify-between bg-surface-base/30 hover:bg-surface-base/50 transition-colors"
            >
              <h3 className="text-lg font-black text-text-title tracking-tight flex items-center gap-3">
                <span className="w-2 h-6 bg-brand-primary rounded-full" />
                {category.categoryName}
              </h3>
              {openCategories[category.categoryId] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {openCategories[category.categoryId] && (
              <div className="px-8 pb-8 space-y-10 pt-6 animate-in fade-in duration-500">
                {category.questions.map((q) => (
                  <div key={q.questionId} className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-base font-bold text-text-title leading-relaxed flex-1">
                        {q.questionText}
                        {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      
                      {/* Rating Select (1-5 Stars) */}
                      <div className="flex items-center gap-1.5 bg-surface-base p-1 rounded-2xl border border-surface-border">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleScoreChange(q.questionId, star)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              (responses[q.questionId]?.score || 0) >= star
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-110'
                                : 'text-text-subtitle hover:bg-white hover:text-brand-primary'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${
                              (responses[q.questionId]?.score || 0) >= star ? 'fill-current' : ''
                            }`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question Specific Comment */}
                    <div className="relative group">
                      <div className="absolute left-4 top-4 text-text-subtitle group-focus-within:text-brand-primary transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <textarea
                        placeholder="Add specific comments or examples for this item (optional)..."
                        value={responses[q.questionId]?.comment || ''}
                        onChange={(e) => handleCommentChange(q.questionId, e.target.value)}
                        rows={2}
                        className="w-full bg-surface-base border border-surface-border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Comment */}
      <div className="bg-white p-8 rounded-3xl border border-surface-border shadow-sm space-y-4">
        <h3 className="text-lg font-black text-text-title">Overall Summary</h3>
        <p className="text-sm text-text-subtitle">Any final thoughts or overall observations about this colleague?</p>
        <textarea
          placeholder="Share your overall perspective here..."
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          rows={4}
          className="w-full bg-surface-base border border-surface-border rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
        />
      </div>

      {/* Footer / Submit */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-surface-border shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isFormValid() ? 'bg-green-50 text-green-600' : 'bg-brand-primary/5 text-brand-primary'}`}>
            {isFormValid() ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-bold text-text-title">
              {isFormValid() ? 'All requirements met' : 'Form Incomplete'}
            </p>
            <p className="text-xs text-text-subtitle">
              {isFormValid() ? 'You can now submit your feedback' : 'Please rate all required questions'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex-1 md:flex-none px-8 py-3.5 rounded-2xl text-sm font-bold text-text-subtitle hover:bg-surface-base transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!isFormValid() || submitting}
            onClick={handleSubmit}
            className={`flex-1 md:flex-none px-12 py-3.5 rounded-2xl text-sm font-black tracking-wide shadow-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${
              isFormValid() && !submitting
                ? 'bg-brand-primary text-white hover:bg-brand-secondary shadow-brand-primary/30'
                : 'bg-surface-border text-text-subtitle cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSubmitForm;
