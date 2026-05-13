import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAppraisalFormQuery } from '../../features/appraisal/appraisalApi';
import { 
  ChevronLeft, 
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  Printer
} from 'lucide-react';

const FormView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: form, isLoading, error } = useGetAppraisalFormQuery(id || '', { skip: !id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Template...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Template Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">The requested appraisal form could not be retrieved. It may have been deleted or moved.</p>
          <button onClick={() => navigate('/appraisal')} className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all">
            Return to Hub
          </button>
        </div>
      </div>
    );
  }

  const getSetName = (formName: string) => {
    const idx = formName.indexOf(' | ');
    return idx >= 0 ? formName.slice(0, idx).trim() : '__unassigned__';
  };

  const totalQuestions = (form.categories || []).reduce(
    (acc: number, cat: any) => acc + (cat.questions?.length || 0), 0
  );

  const renderRatingOptions = (type: string) => {
    if (type === 'RATING') {
      return (
        <div className="flex gap-1.5">
          {[5, 4, 3, 2, 1].map(n => (
            <div key={n} className="w-9 h-9 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 bg-white">
              {n}
            </div>
          ))}
        </div>
      );
    }
    if (type === 'YESNO') {
      return (
        <div className="flex gap-2">
          <div className="px-5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-400 bg-white">Yes</div>
          <div className="px-5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-400 bg-white">No</div>
        </div>
      );
    }
    if (type === 'TEXT') {
      return (
        <div className="w-full h-10 border border-slate-200 rounded-lg bg-slate-50/50 px-4 flex items-center">
          <div className="h-0.5 w-1/4 bg-slate-200 rounded-full"></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      
      {/* Top Professional Toolbar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-6">
             <button 
               onClick={() => navigate('/appraisal', { 
                 state: { 
                   activeTab: 'forms', 
                   expandedCycle: form.cycleName,
                   expandedSet: getSetName(form.formName)
                 } 
               })}
               className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group"
             >
               <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
               <span className="text-xs font-bold uppercase tracking-widest">Back</span>
             </button>
             <div className="h-4 w-px bg-slate-200"></div>
             <div className="flex items-center gap-3">
               <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                 <FileText className="w-4 h-4" />
               </div>
               <span className="text-sm font-bold text-slate-600">Template Review</span>
             </div>
           </div>
           <div className="flex items-center gap-3">
             <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
               <Printer className="w-5 h-5" />
             </button>
             <button className="px-5 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all shadow-sm">
               Publish Template
             </button>
           </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-8">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight max-w-xl">
                {form.formName?.split(' | ')[1] || form.formName}
              </h1>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Template
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-y-4 gap-x-8">
               <div className="flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-slate-400" />
                 <span className="text-xs font-semibold text-slate-500">{form.cycleName}</span>
               </div>
               <div className="flex items-center gap-2">
                 <Layers className="w-4 h-4 text-slate-400" />
                 <span className="text-xs font-semibold text-slate-500">{getSetName(form.formName)} Group</span>
               </div>
               <div className="ml-auto">
                  <span className="text-[10px] font-black text-white bg-slate-900 px-3 py-1 rounded-full uppercase tracking-wider">
                    {form.formType?.replace('_', ' ')}
                  </span>
               </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-16">
            {(form.categories || []).map((cat: any, cIdx: number) => (
              <div key={cat.categoryId} className="group">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 border border-slate-900 flex items-center justify-center text-sm font-bold shrink-0">
                    {cIdx + 1}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest">
                    {cat.categoryName}
                  </h2>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <div className="space-y-1">
                  {(cat.questions || []).map((q: any, qIdx: number) => (
                    <div key={qIdx} className="py-8 px-2 border-b border-slate-100 hover:bg-white transition-colors">
                      <div className="flex gap-8">
                        <div className="flex-1 max-w-xl">
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-slate-300 mt-1">{qIdx + 1}.</span>
                            <p className="text-base font-semibold text-slate-700 leading-relaxed">
                              {q.questionText}
                              {q.isRequired && <span className="text-rose-500 ml-1">*</span>}
                            </p>
                          </div>
                        </div>
                        
                        <div className="shrink-0 w-64 space-y-4">
                          {/* Rating 1 (Secondary) */}
                          {q.secondaryQuestionType && q.secondaryQuestionType !== 'NONE' && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{q.secondaryQuestionType} Selection</p>
                              {renderRatingOptions(q.secondaryQuestionType)}
                            </div>
                          )}

                          {/* Rating 2 (Primary) */}
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{q.questionType} Rating</p>
                            {renderRatingOptions(q.questionType)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Signature Placeholder */}
          <div className="pt-12 mt-12 border-t border-slate-200">
             <div className="flex justify-between items-end">
                <div className="space-y-4">
                  <div className="w-64 h-px bg-slate-300"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">HR Administrator Signature</p>
                </div>
                <p className="text-[10px] font-medium text-slate-300 italic">Document generated on {new Date().toLocaleDateString()}</p>
             </div>
          </div>
        </div>

        {/* Sidebar: Document Stats */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Template Metadata</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Structure Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Sections</p>
                      <p className="text-lg font-bold text-slate-900">{form.categories?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Questions</p>
                      <p className="text-lg font-bold text-slate-900">{totalQuestions}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Scoring Potential</p>
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold text-slate-600">Weighted Max</span>
                     <span className="text-sm font-bold text-indigo-600">{totalQuestions * 5}.0</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-600 w-full"></div>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF Export</span>
                   <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-bold rounded uppercase">V1.0</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-100 relative overflow-hidden group">
               <div className="relative z-10">
                 <h4 className="text-sm font-bold mb-2">Admin Note</h4>
                 <p className="text-xs text-indigo-100 leading-relaxed opacity-80">This template is locked for the {form.cycleName} cycle. Changes here will propagate to all assigned employees immediately.</p>
               </div>
               <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                 <CheckCircle2 className="w-24 h-24" />
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FormView;
