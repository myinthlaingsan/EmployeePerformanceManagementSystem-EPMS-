import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAppraisalFormQuery } from '../../features/appraisal/appraisalApi';
import { 
  ChevronLeft, 
  FileText
} from 'lucide-react';

const FormView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: form, isLoading, error } = useGetAppraisalFormQuery(id || '', { skip: !id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="p-8 text-center text-red-500 font-bold max-w-2xl mx-auto mt-20">
        Template not found or failed to load.
      </div>
    );
  }

  const getSetName = (formName: string) => {
    const idx = formName.indexOf(' | ');
    return idx >= 0 ? formName.slice(0, idx).trim() : '__unassigned__';
  };

  const renderRatingOptions = (type: string) => {
    if (type === 'RATING') {
      return (
        <div className="flex gap-2">
          {[5, 4, 3, 2, 1].map(n => (
            <div key={n} className="w-8 h-8 border border-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50">
              {n}
            </div>
          ))}
        </div>
      );
    }
    if (type === 'YESNO') {
      return (
        <div className="flex gap-2">
          <div className="px-4 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-400 bg-slate-50">Yes</div>
          <div className="px-4 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-400 bg-slate-50">No</div>
        </div>
      );
    }
    if (type === 'TEXT') {
      return (
        <div className="w-full h-12 border border-slate-200 border-dashed rounded flex items-center px-4 text-xs text-slate-300 italic">
          Text response area...
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white pb-24 font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-200 px-8 py-4 mb-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => navigate('/appraisal', { 
                 state: { 
                   activeTab: 'forms', 
                   expandedCycle: form.cycleName,
                   expandedSet: getSetName(form.formName)
                 } 
               })}
               className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
             >
               <ChevronLeft className="w-6 h-6" />
             </button>
             <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
               <FileText className="w-5 h-5 text-indigo-600" />
               Form Template Preview
             </div>
           </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8">
        
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {form.formName || 'Performance Evaluation Form'}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Cycle: <span className="text-indigo-600 font-bold">{form.cycleName || 'Current Cycle'}</span> | Type: <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black uppercase text-slate-600 ml-2">{form.formType?.replace('_', ' ')}</span>
          </p>
        </div>

        {/* Categories & Questions */}
        <div className="space-y-16">
          {(form.categories || []).map((cat: any, cIdx: number) => (
            <div key={cat.categoryId} className="space-y-8">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 border-b-2 border-slate-50 pb-3">
                <span className="text-indigo-600/30">#0{cIdx + 1}</span>
                {cat.categoryName}
              </h2>

              <div className="space-y-6">
                {(cat.questions || []).map((q: any, qIdx: number) => (
                  <div key={qIdx} className="p-8 border border-slate-100 rounded-2xl shadow-sm bg-white hover:border-slate-200 transition-all">
                    <div className="flex items-start gap-4 mb-6">
                      <span className="text-xs font-black text-slate-300 mt-1">{qIdx + 1}.</span>
                      <p className="text-lg font-bold text-slate-800 leading-tight flex-1">
                        {q.questionText}
                        {q.isRequired && <span className="text-rose-500 ml-1">*</span>}
                      </p>
                    </div>
                    
                    <div className="pl-8 space-y-6">
                      {/* Secondary Rating (Rating 1) */}
                      {q.secondaryQuestionType && q.secondaryQuestionType !== 'NONE' && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating 1: {q.secondaryQuestionType}</p>
                          {renderRatingOptions(q.secondaryQuestionType)}
                        </div>
                      )}

                      {/* Primary Rating (Rating 2) */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating 2: {q.questionType}</p>
                        {renderRatingOptions(q.questionType)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormView;
