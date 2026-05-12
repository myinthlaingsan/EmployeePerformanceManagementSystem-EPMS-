import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetFeedbackFormQuery, 
  useGetMyFeedbackRequestsQuery
} from '../../features/feedback360/feedback360Api';
import { useFeedbackForm } from '../../features/feedback360/hooks/useFeedbackForm';
import QuestionItem from '../../features/feedback360/components/QuestionItem';
import FormProgress from '../../features/feedback360/components/FormProgress';
import StatusBadge from '../../components/shared/StatusBadge';
import { 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft,
  Info,
  Send,
  Loader2,
  ShieldCheck
} from 'lucide-react';

const FeedbackForm: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const rid = Number(requestId || '0');

  const { data: form, isLoading: loadingForm, error } = useGetFeedbackFormQuery(rid, { skip: !rid });
  const { data: requests } = useGetMyFeedbackRequestsQuery();
  
  const {
    answers,
    overallComment,
    activeSection,
    isSubmitting,
    setOverallComment,
    handleScore,
    handleComment,
    isSectionComplete,
    isFormValid,
    handleSubmit,
    nextSection,
    prevSection
  } = useFeedbackForm(rid, form);

  const currentRequest = requests?.find(r => r.id === rid);

  if (loadingForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-black tracking-widest uppercase text-xs">Loading Secure Form...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="bg-red-50 p-12 rounded-[3rem] text-center border border-red-100 max-w-2xl mx-auto mt-20 shadow-xl shadow-red-100/20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h3 className="text-2xl font-black text-red-900">Form Not Available</h3>
        <p className="text-red-700 mt-2 font-medium">This request may have been completed, expired, or you don't have permission to view it.</p>
        <button 
          onClick={() => navigate('/feedback360')}
          className="mt-10 px-10 py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-red-200 transition-all active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentCategory = form.categories[activeSection];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-32 animate-in slide-in-from-bottom-8 duration-700">
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-xl -mx-6 px-6 py-6 border-b border-slate-200/60 mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all active:scale-90 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Review for {currentRequest?.isAnonymous ? 'Confidential Colleague' : currentRequest?.targetUserName}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <StatusBadge type="relationship" value={currentRequest?.relationship || ''} />
                <span className="text-xs text-slate-400 font-bold tracking-tight">{form.formName}</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Confidentiality Level</span>
            <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
              <ShieldCheck className="w-4 h-4" />
              FULLY ENCRYPTED
            </div>
          </div>
        </div>

        <div className="mt-8">
          <FormProgress 
            currentSection={activeSection} 
            totalSections={form.categories.length} 
            categoryName={currentCategory.categoryName} 
          />
        </div>
      </div>

      {/* Dynamic Content */}
      <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500" key={activeSection}>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{currentCategory.categoryName}</h3>
              <p className="text-sm text-slate-500 font-medium">Evaluate the professional performance in this category</p>
            </div>
          </div>

          <div className="space-y-16">
            {currentCategory.questions.map((q, idx) => (
              <QuestionItem 
                key={q.questionId}
                question={q}
                index={idx}
                score={answers[q.questionId]?.score || 0}
                comment={answers[q.questionId]?.comment || ''}
                onScoreChange={(score) => handleScore(q.questionId, score)}
                onCommentChange={(comment) => handleComment(q.questionId, comment)}
              />
            ))}
          </div>
        </div>

        {activeSection === form.categories.length - 1 && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Final Perspective</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
              Use this space for any final constructive thoughts or overall observations about this colleague's contributions.
            </p>
            <textarea
              placeholder="Your overall summary here..."
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSectionComplete(activeSection) ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
            {isSectionComplete(activeSection) ? <CheckCircle2 className="w-6 h-6" /> : <Info className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">
              {isSectionComplete(activeSection) ? 'Section Complete' : 'Ratings Required'}
            </p>
            <p className="text-xs text-slate-500 font-medium">Please rate all items to proceed</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {activeSection > 0 && (
            <button 
              onClick={prevSection}
              className="flex-1 md:flex-none px-8 py-4 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
            >
              Previous
            </button>
          )}
          
          {activeSection < form.categories.length - 1 ? (
            <button
              disabled={!isSectionComplete(activeSection)}
              onClick={nextSection}
              className="flex-1 md:flex-none px-12 py-4 rounded-2xl text-sm font-black bg-indigo-600 text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              Next Section
            </button>
          ) : (
            <button
              disabled={!isFormValid() || isSubmitting}
              onClick={handleSubmit}
              className="flex-1 md:flex-none px-12 py-4 rounded-2xl text-sm font-black bg-slate-900 text-white shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  Submit Final Review
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
