import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAppraisalFormQuery } from '../../features/appraisal/appraisalApi';
import { 
  FileText, 
  ChevronLeft, 
  Layout, 
  HelpCircle,
  Eye,
  CheckCircle2,
  Users
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
      <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-2xl border border-red-100 max-w-2xl mx-auto mt-20">
        Template not found or failed to load.
      </div>
    );
  }

  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Template Preview</h1>
            <p className="text-slate-400 text-xs">Reviewing: {form.formName || form.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/appraisal/assign', { state: { formId: id } })}
            className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Go to Assignment
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-10 px-4 space-y-10">
        
        {/* Metadata Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex items-center gap-10">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <FileText className="w-10 h-10" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 flex-1">
            <div>
              <p className={labelClass}>Template Name</p>
              <p className="font-bold text-slate-800">{form.formName || form.title}</p>
            </div>
            <div>
              <p className={labelClass}>Type</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <p className="font-bold text-slate-800 tracking-tight">{form.formType || 'GENERAL'}</p>
              </div>
            </div>
            <div>
              <p className={labelClass}>Questions</p>
              <p className="font-bold text-slate-800">
                {form.categories?.reduce((acc: number, cat: any) => acc + (cat.questions?.length || 0), 0) || 0} Total
              </p>
            </div>
          </div>
        </div>

        {/* Categories & Questions */}
        <div className="space-y-8">
          {(form.categories || form.sections || []).map((section: any, sIdx: number) => (
            <div key={sIdx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center gap-3">
                <Layout className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800">{section.categoryName || section.title}</h3>
              </div>
              <div className="p-8 space-y-6">
                {(section.questions || []).map((q: any, qIdx: number) => (
                  <div key={qIdx} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <span className="text-xs font-black text-slate-300 mt-1">{qIdx + 1}.</span>
                        <p className="font-bold text-slate-700 leading-relaxed">{q.questionText || q.text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {q.isRequired && (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-md">Required</span>
                        )}
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-md">{q.questionType || q.type}</span>
                      </div>
                    </div>
                    
                    {/* Visual Placeholder for inputs */}
                    { (q.questionType === 'RATING' || q.type === 'RATING') ? (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} className="w-8 h-8 rounded-lg border-2 border-slate-200 flex items-center justify-center text-xs font-bold text-slate-300">{n}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-10 w-full bg-white border border-slate-100 rounded-xl"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="bg-indigo-600 rounded-3xl p-10 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl font-black mb-4">Ready to Launch?</h2>
            <p className="text-indigo-100 font-medium opacity-80 leading-relaxed">
              Once you've reviewed this template, you can proceed to assign it to employees in an active appraisal cycle. 
              Changes to templates cannot be made once they are assigned.
            </p>
          </div>
          <Eye className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 rotate-12" />
        </div>

      </div>
    </div>
  );
};

export default FormView;
