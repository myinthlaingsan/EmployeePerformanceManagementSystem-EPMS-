import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  useCreateAppraisalFormMutation, 
  useAddCategoryMutation, 
  useAddQuestionMutation,
  useGetCyclesQuery
} from '../../features/appraisal/appraisalApi';
import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronLeft, 
  Layout, 
  ListTodo, 
  Settings, 
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface QuestionDraft {
  text: string;
  type: 'RATING' | 'TEXT' | 'YESNO';
  isRequired: boolean;
}

interface CategoryDraft {
  name: string;
  questions: QuestionDraft[];
}

const AppraisalFormDesign: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: cycles = [] } = useGetCyclesQuery();

  // Mutations
  const [createForm] = useCreateAppraisalFormMutation();
  const [addCategory] = useAddCategoryMutation();
  const [addQuestion] = useAddQuestionMutation();

  // State
  const [formName, setFormName] = useState('Standard Performance Template');
  const [formType, setFormType] = useState('SELF_ASSESSMENT');
  const [selectedCycleId, setSelectedCycleId] = useState<string>(location.state?.cycleId || '');
  const [categories, setCategories] = useState<CategoryDraft[]>([
    {
      name: 'Technical Competencies',
      questions: [
        { text: 'How do you rate your code quality and adherence to standards?', type: 'RATING', isRequired: true }
      ]
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers
  const addNewCategory = () => {
    setCategories([...categories, { name: 'New Section', questions: [] }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const addQuestionToCategory = (catIndex: number) => {
    const newCats = [...categories];
    newCats[catIndex].questions.push({ text: '', type: 'RATING', isRequired: true });
    setCategories(newCats);
  };

  const removeQuestion = (catIndex: number, qIndex: number) => {
    const newCats = [...categories];
    newCats[catIndex].questions = newCats[catIndex].questions.filter((_, i) => i !== qIndex);
    setCategories(newCats);
  };

  const updateQuestion = (catIndex: number, qIndex: number, updates: Partial<QuestionDraft>) => {
    const newCats = [...categories];
    newCats[catIndex].questions[qIndex] = { ...newCats[catIndex].questions[qIndex], ...updates };
    setCategories(newCats);
  };

  const handleSaveForm = async () => {
    if (!selectedCycleId) {
      alert('Please select an Appraisal Cycle first.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 1. Create the Form
      const formId = await createForm({
        formName,
        formType,
        cycleId: Number(selectedCycleId)
      }).unwrap();

      // 2. Add Categories and Questions
      for (const cat of categories) {
        const catId = await addCategory({ formId, categoryName: cat.name }).unwrap();
        
        for (const q of cat.questions) {
          await addQuestion({
            categoryId: catId,
            questionText: q.text,
            questionType: q.type,
            isRequired: q.isRequired
          }).unwrap();
        }
      }

      alert('Evaluation Form designed and saved successfully!');
      navigate('/appraisal/assign', { state: { cycleId: selectedCycleId } });
    } catch (err) {
      console.error(err);
      alert('Failed to save form design.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Form Designer</h1>
            <p className="text-slate-400 text-xs">Build your evaluation sections and questions.</p>
          </div>
        </div>
        <button 
          onClick={handleSaveForm}
          disabled={isSubmitting}
          className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving Design...' : <><Save className="w-4 h-4" /> Save Design</>}
        </button>
      </div>

      <div className="max-w-5xl mx-auto mt-8 px-4 grid grid-cols-1 gap-8">
        
        {/* Form Metadata Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className={labelClass}>Target Cycle</label>
            <select 
              value={selectedCycleId}
              onChange={e => setSelectedCycleId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a Cycle...</option>
              {cycles.map(c => (
                <option key={c.cycleId} value={c.cycleId}>{c.cycleName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Form Title</label>
            <input 
              type="text" 
              className={inputClass}
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Form Type</label>
            <select 
              value={formType}
              onChange={e => setFormType(e.target.value)}
              className={inputClass}
            >
              <option value="SELF_ASSESSMENT">Self Assessment</option>
              <option value="MANAGER_EVALUATION">Manager Evaluation</option>
            </select>
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-6">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group">
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div className="flex items-center gap-3 flex-1">
                  <Layout className="w-5 h-5 text-indigo-500" />
                  <input 
                    type="text" 
                    value={cat.name}
                    onChange={e => {
                      const newCats = [...categories];
                      newCats[catIdx].name = e.target.value;
                      setCategories(newCats);
                    }}
                    className="bg-transparent border-none focus:ring-0 text-lg font-bold text-slate-800 p-0 w-full"
                    placeholder="Category Name (e.g. Soft Skills)"
                  />
                </div>
                <button 
                  onClick={() => removeCategory(catIdx)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-4">
                {cat.questions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-indigo-100 transition-all">
                    <div className="flex gap-4 items-start">
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <select 
                          value={q.type}
                          onChange={e => updateQuestion(catIdx, qIdx, { type: e.target.value as any })}
                          className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-none rounded-lg px-2 py-1 outline-none"
                        >
                          <option value="RATING">Rating</option>
                          <option value="TEXT">Text</option>
                          <option value="YESNO">Yes/No</option>
                        </select>
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={q.isRequired}
                            onChange={e => updateQuestion(catIdx, qIdx, { isRequired: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          /> Required
                        </label>
                      </div>
                      <textarea 
                        rows={2}
                        placeholder="Type your question here..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 resize-none"
                        value={q.text}
                        onChange={e => updateQuestion(catIdx, qIdx, { text: e.target.value })}
                      />
                      <button 
                        onClick={() => removeQuestion(catIdx, qIdx)}
                        className="p-2 text-slate-200 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => addQuestionToCategory(catIdx)}
                  className="w-full py-4 border-2 border-dashed border-slate-100 text-slate-400 font-bold text-sm rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Question to Section
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={addNewCategory}
            className="w-full py-10 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 group hover:border-indigo-300 hover:bg-white transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-all">Add New Evaluation Section</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AppraisalFormDesign;
