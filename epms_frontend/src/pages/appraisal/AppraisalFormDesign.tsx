import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  useCreateAppraisalFormMutation, 
  useAddCategoryMutation, 
  useAddQuestionMutation,
  useGetCyclesQuery,
  useGetAppraisalFormsQuery,
  useLazyGetAppraisalFormQuery
} from '../../features/appraisal/appraisalApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
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
  CheckCircle2,
  Layers,
  ChevronRight
} from 'lucide-react';

interface QuestionDraft {
  text: string;
  type: 'RATING' | 'TEXT' | 'YESNO';
  secondaryType?: 'RATING' | 'TEXT' | 'YESNO' | 'NONE';
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
  const queryParams = new URLSearchParams(location.search);
  const initialCycleId = queryParams.get('cycleId') || location.state?.cycleId || '';
  const initialType = queryParams.get('type') || 'SELF_ASSESSMENT';
  const initialSetName = queryParams.get('setName') ? decodeURIComponent(queryParams.get('setName')!) : '';
  
  const [formName, setFormName] = useState(
    initialType === 'MANAGER_EVALUATION' 
      ? 'Manager Evaluation Template' 
      : 'Self Assessment Template'
  );
  const [formType, setFormType] = useState(initialType);
  const [selectedCycleId, setSelectedCycleId] = useState<string>(initialCycleId);
  // setName: comes from URL (drill-down flow) or user can type it manually
  const [setName, setSetName] = useState<string>(initialSetName);
  const { data: positions = [] } = useGetPositionsQuery();
  const { data: allForms = [], isLoading: formsLoading } = useGetAppraisalFormsQuery();
  const [fetchFormDetail] = useLazyGetAppraisalFormQuery();

  // Only show position dropdown when no setName from URL
  const isSetNameFromUrl = !!initialSetName;
  const [categories, setCategories] = useState<CategoryDraft[]>([
    {
      name: initialType === 'MANAGER_EVALUATION' ? 'Management Skills' : 'Technical Competencies',
      questions: [
        { 
          text: initialType === 'MANAGER_EVALUATION' 
            ? 'Rate the employee\'s leadership and team management skills.' 
            : 'How do you rate your code quality and adherence to standards?', 
          type: 'RATING', 
          secondaryType: initialType === 'SELF_ASSESSMENT' ? 'YESNO' : 'NONE',
          isRequired: true 
        }
      ]
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [settings, setSettings] = useState({
    mandatory: true
  });

  // Filter system forms to show in library based on current type
  const libraryForms = allForms.filter(f => {
    const fType = f.formType?.toString().toUpperCase().replace(/[\s_]/g, '');
    const targetType = formType?.toString().toUpperCase().replace(/[\s_]/g, '');
    return fType === targetType;
  });

  const applySystemTemplate = async (formId: number) => {
    try {
      const fullForm = await fetchFormDetail(String(formId)).unwrap();
      const sections = fullForm.sections || fullForm.categories || [];
      
      if (sections.length > 0) {
        setCategories(sections.map((s: any) => ({
          name: s.categoryName || s.title || 'Section',
          questions: (s.questions || []).map((q: any) => ({
            text: q.questionText || q.text || '',
            type: q.questionType || q.type || 'RATING',
            secondaryType: q.secondaryQuestionType || q.secondaryType || 'NONE',
            isRequired: q.isRequired ?? q.required ?? true
          }))
        })));
      }
      setShowLibrary(false);
    } catch (err) {
      console.error('Failed to load template:', err);
      alert('Could not load this template. Please try another.');
    }
  };

  // Handlers
  const addNewCategory = () => {
    setCategories([...categories, { name: 'New Section', questions: [] }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const addQuestionToCategory = (catIndex: number) => {
    const newCats = [...categories];
    newCats[catIndex].questions.push({ 
      text: '', 
      type: 'RATING', 
      secondaryType: formType === 'SELF_ASSESSMENT' ? 'YESNO' : 'NONE',
      isRequired: true 
    });
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
    if (!setName.trim()) {
      alert('Please provide a Form Set name (e.g. the position name).');
      return;
    }
    const prefixedFormName = `${setName.trim()} | ${formName}`;

    try {
      setIsSubmitting(true);
      
    // 1. Create the Form
    const formId = await createForm({
      formName: prefixedFormName,
      formType,
      cycleId: Number(selectedCycleId),
      formSetId: queryParams.get('formSetId') ? Number(queryParams.get('formSetId')) : undefined
    }).unwrap();

      // 2. Add Categories and Questions
      for (const cat of categories) {
        const catId = await addCategory({ formId, categoryName: cat.name }).unwrap();
        
        for (const q of cat.questions) {
          await addQuestion({
            categoryId: catId,
            questionText: q.text,
            questionType: q.type,
            secondaryQuestionType: q.secondaryType === 'NONE' ? null : q.secondaryType,
            isRequired: q.isRequired
          }).unwrap();
        }
      }

      const cycle = cycles.find(c => Number(c.cycleId) === Number(selectedCycleId));
      const cycleName = cycle?.cycleName || '';

      alert('Form saved successfully!');
      navigate('/appraisal', { 
        state: { 
          activeTab: 'forms', 
          expandedCycle: cycleName 
        } 
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save form design.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const cycle = cycles.find(c => Number(c.cycleId) === Number(selectedCycleId));
              navigate('/appraisal', { 
                state: { 
                  activeTab: 'forms', 
                  expandedCycle: cycle?.cycleName,
                  expandedSet: setName || '__unassigned__'
                } 
              });
            }} 
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              <span>Templates</span>
              <span className="text-slate-300">/</span>
              <span className="text-indigo-600">Builder</span>
            </nav>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">HR Appraisal Form Template Builder</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-5 py-2.5 font-bold rounded-xl border transition-all flex items-center gap-2 ${isPreviewMode ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            <FileText className="w-4 h-4" /> {isPreviewMode ? 'Exit Preview' : 'Preview'}
          </button>
          {!isPreviewMode && (
            <button 
              onClick={handleSaveForm}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save Template</>}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-8 px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Metadata & Settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Template Metadata</h2>
            
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Template Name</label>
                <input 
                  type="text" 
                  className={inputClass}
                  placeholder="e.g. 2024 Engineering Appraisal"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Appraisal Type</label>
                <select 
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  className={`${inputClass} appearance-none cursor-not-allowed opacity-75`}
                  disabled
                >
                  <option value="SELF_ASSESSMENT">Self Assessment</option>
                  <option value="MANAGER_EVALUATION">Manager Evaluation</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Target Appraisal Cycle</label>
                <select 
                  value={selectedCycleId}
                  onChange={e => setSelectedCycleId(e.target.value)}
                  className={`${inputClass} appearance-none cursor-not-allowed opacity-75`}
                  disabled
                >
                  <option value="">Select a Cycle...</option>
                  {cycles.map(c => (
                    <option key={c.cycleId} value={c.cycleId}>{c.cycleName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Form Set Name</label>
                {isSetNameFromUrl ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <Layers className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="font-black text-indigo-700 text-sm">{setName}</span>
                    <span className="ml-auto text-[10px] font-black text-indigo-400 uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded-lg">Locked</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    className={inputClass}
                    placeholder='e.g. "Software Engineer"'
                    value={setName}
                    onChange={e => setSetName(e.target.value)}
                  />
                )}
                <p className="text-[10px] font-medium text-slate-400 mt-2 leading-relaxed">
                  {isSetNameFromUrl
                    ? 'Set from the Form Set you created. Saved as prefix in the form name.'
                    : 'This name groups the two forms together as a Form Set.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Template Settings</h2>
            
            <div className="space-y-6">
              <div 
                onClick={() => setSettings({...settings, mandatory: !settings.mandatory})}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">Mandatory Completion</p>
                  <p className="text-[10px] font-medium text-slate-400">Requires all items to be filled</p>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all shadow-inner ${settings.mandatory ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.mandatory ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>


              <div className="pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Scoring Weight</p>
                  <span className="text-xs font-black text-indigo-600">100%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-full"></div>
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-2 italic">Weights are balanced across {categories.length} categories.</p>
              </div>
            </div>
          </div>

          {/* Guide Card */}
          <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-xl">
             <div className="relative z-10">
                <h3 className="text-lg font-black mb-2 leading-tight">Design Guide</h3>
                <p className="text-indigo-200 text-xs leading-relaxed">Ensure all categories have at least 3 measurable indicators for statistical validity.</p>
             </div>
             <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Settings className="w-24 h-24" />
             </div>
          </div>
        </div>

        {/* Right Content: Builder Area or Preview */}
        <div className="lg:col-span-8 space-y-6">
          {isPreviewMode ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {categories.map((cat, idx) => (
                <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <h3 className="text-xl font-black text-slate-900 mb-8 pb-4 border-b border-slate-50 flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                    {cat.name}
                  </h3>
                  <div className="space-y-10">
                    {cat.questions.map((q, qIdx) => (
                      <div key={qIdx} className="space-y-4">
                        <div className="flex items-start gap-4">
                          <span className="text-xs font-black text-slate-300 mt-1">{qIdx + 1}.</span>
                          <p className="text-lg font-bold text-slate-800 leading-tight flex-1">
                            {q.text}
                            {q.isRequired && <span className="text-rose-500 ml-1">*</span>}
                          </p>
                        </div>
                        <div className="pl-8 flex flex-col gap-8">
                          {/* Box 1 Preview (Secondary) */}
                          {q.secondaryType && q.secondaryType !== 'NONE' && (
                            <div className="space-y-4">
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Rating 1: {q.secondaryType}</span>
                              {q.secondaryType === 'RATING' && (
                                <div className="flex gap-4">
                                  {[5,4,3,2,1].map(n => (
                                    <div key={n} className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 font-bold">{n}</div>
                                  ))}
                                </div>
                              )}
                              {q.secondaryType === 'YESNO' && (
                                <div className="flex gap-4">
                                  {['Yes', 'No'].map(opt => (
                                    <div key={opt} className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-400 font-bold">{opt}</div>
                                  ))}
                                </div>
                              )}
                              {q.secondaryType === 'TEXT' && (
                                <div className="w-full h-24 bg-slate-50 rounded-2xl border border-slate-200 border-dashed"></div>
                              )}
                            </div>
                          )}

                          {/* Box 2 Preview (Primary) */}
                          <div className="space-y-4">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Rating 2: {q.type}</span>
                            {q.type === 'RATING' && (
                              <div className="flex gap-4">
                                {[5,4,3,2,1].map(n => (
                                  <div key={n} className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 font-bold">{n}</div>
                                ))}
                              </div>
                            )}
                            {q.type === 'YESNO' && (
                              <div className="flex gap-4">
                                {['Yes', 'No'].map(opt => (
                                  <div key={opt} className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-400 font-bold">{opt}</div>
                                ))}
                              </div>
                            )}
                            {q.type === 'TEXT' && (
                              <div className="w-full h-32 bg-slate-50 rounded-2xl border border-slate-200 border-dashed"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {categories.map((cat, catIdx) => (
            <div key={catIdx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group/section">
              <div className="bg-white border-b border-slate-50 p-6 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Layout className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={cat.name}
                        onChange={e => {
                          const newCats = [...categories];
                          newCats[catIdx].name = e.target.value;
                          setCategories(newCats);
                        }}
                        className="bg-transparent border-none focus:ring-0 text-lg font-black text-slate-800 p-0 w-full placeholder:text-slate-200"
                        placeholder="Category Name..."
                      />
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg">
                        {Math.floor(100/categories.length)}% Weight
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Section Indicators</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
                  <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeCategory(catIdx)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-4 bg-slate-50/30">
                {cat.questions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group/q">
                    <div className="flex gap-6 items-start">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 text-xs font-black">
                        {qIdx + 1}
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <textarea 
                          rows={1}
                          placeholder="What would you like to evaluate?"
                          className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 resize-none p-0 placeholder:text-slate-200"
                          value={q.text}
                          onChange={e => updateQuestion(catIdx, qIdx, { text: e.target.value })}
                        />
                        
                        <div className="pt-2">
                          {formType === 'SELF_ASSESSMENT' ? (
                            <div className="flex items-center gap-4">
                              {/* Rating Choosing Dropdown 1 */}
                              <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Rating Choose 1</label>
                                <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                  <select 
                                    value={q.secondaryType || 'NONE'}
                                    onChange={e => updateQuestion(catIdx, qIdx, { secondaryType: e.target.value as any })}
                                    className="w-full bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-indigo-600 outline-none p-0 pr-4 cursor-pointer"
                                  >
                                    <option value="YESNO">Yes / No</option>
                                    <option value="TEXT">Text</option>
                                    <option value="RATING">1-5 Rating</option>
                                  </select>
                                </div>
                              </div>

                              {/* Rating Choosing Dropdown 2 */}
                              <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Rating Choose 2</label>
                                <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                  <select 
                                    value={q.type}
                                    onChange={e => updateQuestion(catIdx, qIdx, { type: e.target.value as any })}
                                    className="w-full bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-indigo-600 outline-none p-0 pr-4 cursor-pointer"
                                  >
                                    <option value="YESNO">Yes / No</option>
                                    <option value="TEXT">Text</option>
                                    <option value="RATING">1-5 Rating</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 justify-end pb-1">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                                  <input 
                                    type="checkbox" 
                                    checked={q.isRequired}
                                    onChange={e => updateQuestion(catIdx, qIdx, { isRequired: e.target.checked })}
                                    className="w-3.5 h-3.5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                                  /> Is Required
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <select 
                                  value={q.type}
                                  onChange={e => updateQuestion(catIdx, qIdx, { type: e.target.value as any })}
                                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-indigo-600 outline-none p-0 pr-4 cursor-pointer"
                                >
                                  <option value="RATING">1-5 Rating</option>
                                  <option value="YESNO">Yes / No</option>
                                  <option value="TEXT">Text Area</option>
                                </select>
                              </div>

                              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={q.isRequired}
                                  onChange={e => updateQuestion(catIdx, qIdx, { isRequired: e.target.checked })}
                                  className="w-3.5 h-3.5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                                /> Is Required
                              </label>
                            </div>
                          )}
                        </div>

                        {/* Editor-mode Component Preview */}
                        <div className="pt-4 flex flex-col gap-4 border-t border-slate-50">
                          {q.secondaryType && q.secondaryType !== 'NONE' && (
                            <div className="flex flex-col gap-2">
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Box 1: {q.secondaryType}</span>
                              <div className="flex gap-1.5">
                                {q.secondaryType === 'YESNO' && ['Y', 'N'].map(o => <div key={o} className="w-6 h-6 rounded border border-slate-200 bg-slate-50/50 flex items-center justify-center text-[10px] font-bold text-slate-300">{o}</div>)}
                                {q.secondaryType === 'RATING' && [5,4,3,2,1].map(n => <div key={n} className="w-6 h-6 rounded border border-slate-200 bg-slate-50/50 flex items-center justify-center text-[9px] font-black text-slate-300">{n}</div>)}
                                {q.secondaryType === 'TEXT' && <div className="w-full h-4 bg-slate-50/50 rounded border border-slate-200 border-dashed"></div>}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Box 2: {q.type}</span>
                            <div className="flex gap-1.5">
                              {q.type === 'YESNO' && ['Y', 'N'].map(o => <div key={o} className="w-6 h-6 rounded border border-slate-200 bg-slate-50/50 flex items-center justify-center text-[10px] font-bold text-slate-300">{o}</div>)}
                              {q.type === 'RATING' && [5,4,3,2,1].map(n => <div key={n} className="w-6 h-6 rounded border border-slate-200 bg-slate-50/50 flex items-center justify-center text-[9px] font-black text-slate-300">{n}</div>)}
                              {q.type === 'TEXT' && <div className="w-full h-4 bg-slate-50/50 rounded border border-slate-200 border-dashed"></div>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => removeQuestion(catIdx, qIdx)}
                        className="p-2 text-slate-100 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => addQuestionToCategory(catIdx)}
                  className="w-full py-3 bg-white border border-slate-200 border-dashed text-slate-400 font-bold text-xs rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" /> Add Question to {cat.name || 'Section'}
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={addNewCategory}
            className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 group hover:border-indigo-300 hover:bg-white transition-all shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <span className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-all">Create New Assessment Category</span>
              <p className="text-[10px] font-medium text-slate-300 mt-1">Group indicators by competency area</p>
            </div>
          </button>

          {/* Expedite Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
             <div className="relative z-10 text-center md:text-left">
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Need to expedite template creation?</h3>
                <p className="text-sm font-medium text-slate-400">Browse our library of pre-configured industry-standard appraisal forms.</p>
             </div>
             <button 
               onClick={() => setShowLibrary(true)}
               className="relative z-10 px-8 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all"
             >
                Explore Library
             </button>
             </div>
          </>
        )}
      </div>
    </div>

      {/* Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLibrary(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Explore Appraisal Templates</h2>
              <p className="text-slate-400 font-medium text-sm">Choose a pre-configured template to jumpstart your form design.</p>
            </div>
            <div className="p-10 space-y-4 max-h-[50vh] overflow-y-auto">
              {formsLoading && <p className="text-center text-slate-400 py-10">Loading templates...</p>}
              {!formsLoading && libraryForms.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-medium">No previous {formType.replace('_', ' ').toLowerCase()} templates found.</p>
                </div>
              )}
              {libraryForms.map((tpl) => (
                <div 
                  key={tpl.formId}
                  onClick={() => applySystemTemplate(tpl.formId)}
                  className="group p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{tpl.formName}</h4>
                      <p className="text-xs text-slate-400">{tpl.cycleName || 'Template Library'} &bull; Click to apply</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                </div>
              ))}
            </div>
            <div className="p-10 bg-slate-50 flex justify-end">
              <button onClick={() => setShowLibrary(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppraisalFormDesign;
