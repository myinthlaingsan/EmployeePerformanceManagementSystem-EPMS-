import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Settings2, 
  Building2, 
  Layers, 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft,
  Layout,
  User,
  Users,
  UserCheck,
  UserPlus,
  ChevronDown,
  ListTodo
} from 'lucide-react';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import { useGetJobLevelsByDepartmentQuery } from '../../features/org/jobLevelApi';
import { 
  useGetAppraisalFormSetsQuery, 
  useCreateFormSetMutation,
  useGetAppraisalFormsQuery
} from '../../features/appraisal/appraisalApi';
import { 
  useSaveFeedbackFormMutation 
} from '../../features/feedback360/feedback360Api';
import { useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import type { CategoryPayload, QuestionPayload } from '../../features/feedback360/feedback360Types';

const FeedbackFormBuilder: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'setup' | 'designer'>('setup');
  const [activeRole, setActiveRole] = useState<'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE' | null>(null);

  // Selection State
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [activeFormSet, setActiveFormSet] = useState<any>(null);

  // Designer State
  const [formName, setFormName] = useState('');
  const [categories, setCategories] = useState<CategoryPayload[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // API Hooks
  const { data: departments } = useGetDepartmentsQuery();
  const { data: jobLevels } = useGetJobLevelsByDepartmentQuery(selectedDeptId ?? 0, { skip: !selectedDeptId });
  const { data: cycles } = useGetCyclesQuery();
  const { data: formSets, refetch: refetchSets } = useGetAppraisalFormSetsQuery();
  const { data: allForms } = useGetAppraisalFormsQuery();
  
  const [createFormSet] = useCreateFormSetMutation();
  const [saveForm, { isLoading: isSaving }] = useSaveFeedbackFormMutation();

  // Initial Cycle Setup
  useEffect(() => {
    if (cycles && cycles.length > 0 && !selectedCycleId) {
      const active = cycles.find(c => c.isActive) || cycles[0];
      setSelectedCycleId(active.cycleId);
    }
  }, [cycles]);

  // Resolve Form Set when selection changes
  useEffect(() => {
    if (selectedCycleId && formSets) {
      if (selectedDeptId && selectedLevelId) {
        const match = formSets.find(fs => 
          fs.cycleId === selectedCycleId && 
          fs.name.includes(departments?.find(d => d.id === selectedDeptId)?.departmentName || '')
        );
        setActiveFormSet(match || null);
      } else if (!selectedDeptId) {
        const globalMatch = formSets.find(fs => fs.cycleId === selectedCycleId && fs.name.toLowerCase().includes('global'));
        setActiveFormSet(globalMatch || null);
      }
    }
  }, [selectedDeptId, selectedLevelId, selectedCycleId, formSets]);

  // Handle Role Designer Open
  const handleOpenDesigner = (role: 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE') => {
    setActiveRole(role);
    
    let formId: number | null = null;
    if (activeFormSet) {
      switch(role) {
        case 'SELF': formId = activeFormSet.selfFeedbackFormId; break;
        case 'MANAGER': formId = activeFormSet.managerFeedbackFormId; break;
        case 'PEER': formId = activeFormSet.peerFeedbackFormId; break;
        case 'SUBORDINATE': formId = activeFormSet.subordinateFeedbackFormId; break;
      }
    }

    const existingForm = allForms?.find(f => f.formId === formId);
    if (existingForm) {
      setFormName(existingForm.formName);
      setCategories(existingForm.categories.map(c => ({
        categoryName: c.categoryName,
        questions: c.questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType as any,
          isRequired: q.isRequired,
          requiresComment: (q as any).requiresComment || false
        }))
      })));
    } else {
      const deptName = selectedDeptId ? departments?.find(d => d.id === selectedDeptId)?.departmentName : 'Global';
      setFormName(`360 ${role} Form - ${deptName}`);
      setCategories([{
        categoryName: 'General Performance',
        questions: [{ questionText: 'New Question', questionType: 'RATING', isRequired: true, requiresComment: false }]
      }]);
    }
    
    setView('designer');
  };

  const handleSaveForm = async () => {
    if (!selectedCycleId || !activeRole) return;
    
    try {
      const res = await saveForm({ 
        cycleId: selectedCycleId, 
        body: { formName, categories } 
      }).unwrap();
      
      const newFormId = res;

      if (!activeFormSet) {
        const deptName = selectedDeptId ? departments?.find(d => d.id === selectedDeptId)?.departmentName : 'Global';
        const levelName = selectedLevelId ? jobLevels?.find(l => l.levelId === selectedLevelId)?.levelName : 'All Levels';
        
        await createFormSet({
          name: `${deptName} | ${levelName} Set`,
          cycleId: selectedCycleId,
          [`${activeRole.toLowerCase()}FeedbackFormId`]: newFormId
        }).unwrap();
      }

      alert('Form saved successfully!');
      refetchSets();
      setView('setup');
    } catch (err) {
      console.error(err);
      alert('Error saving form');
    }
  };

  if (view === 'designer') {
    return (
      <div className="max-w-6xl mx-auto p-6 pb-24 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-12">
            <button 
                onClick={() => setView('setup')}
                className="group flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-all"
            >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Back to Builder</span>
            </button>

            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all active:scale-95 border ${isPreviewOpen ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    {isPreviewOpen ? <ListTodo className="w-5 h-5" /> : <Layout className="w-5 h-5 text-indigo-500" />}
                    {isPreviewOpen ? 'Back to Editor' : 'Live Preview'}
                </button>
                <button 
                    onClick={handleSaveForm}
                    disabled={isSaving}
                    className="flex items-center gap-3 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <Settings2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Template
                </button>
            </div>
        </div>


            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Sidebar Metadata */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Template Metadata</h3>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Template Name</label>
                            <input 
                                type="text"
                                disabled={isPreviewOpen}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-75"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Feedback Role</label>
                            <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 font-black text-indigo-600 text-sm italic uppercase tracking-tighter">
                                {activeRole}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Designer / Preview (Same UI) */}
                <div className="lg:col-span-3 space-y-12">
                    {categories.map((cat, catIdx) => (
                        <div key={catIdx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 flex items-center justify-between border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <Layout className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <input 
                                            disabled={isPreviewOpen}
                                            className="bg-transparent font-black text-slate-900 text-2xl outline-none w-full tracking-tight disabled:opacity-100"
                                            value={cat.categoryName}
                                            onChange={(e) => {
                                                const newCats = [...categories];
                                                newCats[catIdx].categoryName = e.target.value;
                                                setCategories(newCats);
                                            }}
                                            placeholder="Section Title"
                                        />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Section Indicators</p>
                                    </div>
                                </div>
                                {!isPreviewOpen && (
                                    <button onClick={() => setCategories(categories.filter((_, i) => i !== catIdx))} className="p-2 text-slate-200 hover:text-rose-500 transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="p-8 space-y-8">
                                {cat.questions.map((q, qIdx) => (
                                    <div key={qIdx} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:border-indigo-100 transition-all relative group">
                                        <div className="flex gap-6">
                                            <div className="w-10 h-10 shrink-0 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-300">
                                                {qIdx + 1}
                                            </div>
                                            <div className="flex-1 space-y-8">
                                                <input 
                                                    disabled={isPreviewOpen}
                                                    className="w-full bg-transparent font-black text-slate-800 text-lg outline-none tracking-tight disabled:opacity-100"
                                                    value={q.questionText}
                                                    onChange={(e) => {
                                                        const newCats = [...categories];
                                                        newCats[catIdx].questions[qIdx].questionText = e.target.value;
                                                        setCategories(newCats);
                                                    }}
                                                    placeholder="Enter performance indicator or question..."
                                                />

                                                <div className="flex items-center gap-8">
                                                    <div className="relative group/select">
                                                        <select 
                                                            disabled={isPreviewOpen}
                                                            className="appearance-none bg-indigo-50 border border-indigo-100 rounded-xl pl-6 pr-12 py-3 text-[10px] font-black uppercase text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer disabled:opacity-75"
                                                            value={q.questionType}
                                                            onChange={(e) => {
                                                                const newCats = [...categories];
                                                                newCats[catIdx].questions[qIdx].questionType = e.target.value as any;
                                                                setCategories(newCats);
                                                            }}
                                                        >
                                                            <option value="RATING">Rating Scale</option>
                                                            <option value="TEXT">Descriptive</option>
                                                            <option value="YESNO">Yes / No</option>
                                                        </select>
                                                        {!isPreviewOpen && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />}
                                                    </div>

                                                    <label className={`flex items-center gap-3 cursor-pointer group/check ${isPreviewOpen ? 'pointer-events-none' : ''}`}>
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${q.isRequired ? 'bg-slate-700 border-slate-700' : 'bg-white border-slate-200 group-hover/check:border-slate-400'}`}>
                                                            {q.isRequired && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <input 
                                                            type="checkbox" 
                                                            className="hidden" 
                                                            disabled={isPreviewOpen}
                                                            checked={q.isRequired} 
                                                            onChange={(e) => {
                                                                const newCats = [...categories];
                                                                newCats[catIdx].questions[qIdx].isRequired = e.target.checked;
                                                                setCategories(newCats);
                                                            }} 
                                                        />
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Is Required</span>
                                                    </label>
                                                </div>

                                                {/* Preview Component */}
                                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Box 2: {q.questionType}</p>
                                                    
                                                    {q.questionType === 'RATING' && (
                                                        <div className="flex gap-2">
                                                            {[5, 4, 3, 2, 1].map(num => (
                                                                <div key={num} className="w-8 h-8 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-center text-[10px] font-black text-slate-300">
                                                                    {num}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {q.questionType === 'YESNO' && (
                                                        <div className="flex gap-2">
                                                            <div className="w-8 h-8 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-center text-[10px] font-black text-slate-300">Y</div>
                                                            <div className="w-8 h-8 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-center text-[10px] font-black text-slate-300">N</div>
                                                        </div>
                                                    )}

                                                    {q.questionType === 'TEXT' && (
                                                        <div className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center px-4">
                                                            <span className="text-[10px] font-bold text-slate-200 italic">Text response area...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {!isPreviewOpen && (
                                                <button onClick={() => {
                                                    const newCats = [...categories];
                                                    newCats[catIdx].questions = newCats[catIdx].questions.filter((_, i) => i !== qIdx);
                                                    setCategories(newCats);
                                                }} className="absolute top-8 right-8 p-2 text-slate-100 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {!isPreviewOpen && (
                                    <button 
                                        onClick={() => {
                                            const newCats = [...categories];
                                            newCats[catIdx].questions.push({ questionText: '', questionType: 'RATING', isRequired: true, requiresComment: false });
                                            setCategories(newCats);
                                        }}
                                        className="w-full py-4 border-2 border-dashed border-slate-100 rounded-[1.5rem] text-slate-300 font-bold text-sm hover:border-indigo-200 hover:text-indigo-400 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Plus className="w-4 h-4" /> Add Question to {cat.categoryName}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {!isPreviewOpen && (
                        <button 
                            onClick={() => setCategories([...categories, { categoryName: 'New Section', questions: [] }])}
                            className="w-full py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-4"
                        >
                            <Plus className="w-6 h-6" /> Create New Section
                        </button>
                    )}
                </div>
            </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24 animate-in fade-in duration-700">
      <header className="mb-12">
        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">360 Feedback Engine</p>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic uppercase">
          <Layout className="w-12 h-12 text-slate-200" />
          Form Set Builder
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Design specialized questionnaires for each evaluation relationship.</p>
      </header>

      {/* Setup Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Building2 className="w-5 h-5" />
                 </div>
                 <h2 className="text-lg font-black text-slate-800 tracking-tight">Scope Selection</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Appraisal Cycle</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                    value={selectedCycleId || ''}
                    onChange={(e) => setSelectedCycleId(Number(e.target.value))}
                  >
                    {cycles?.map(c => <option key={c.cycleId} value={c.cycleId}>{c.cycleName}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Department</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                    value={selectedDeptId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDeptId(val ? Number(val) : null);
                      setSelectedLevelId(null);
                    }}
                  >
                    <option value="">Global (All Departments)</option>
                    {departments?.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Job Level</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer disabled:opacity-50"
                    disabled={!selectedDeptId}
                    value={selectedLevelId || ''}
                    onChange={(e) => setSelectedLevelId(Number(e.target.value))}
                  >
                    <option value="">Select Level</option>
                    {jobLevels?.map(l => <option key={l.levelId} value={l.levelId}>{l.levelName}</option>)}
                  </select>
                </div>
              </div>
           </div>

           <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-300 mb-4">Pro Tip</h3>
                <p className="text-sm font-medium leading-relaxed text-indigo-100">
                  Form Sets allow you to use different questions for Peers versus Managers. Designing specific forms for each role provides more accurate data for 360 summaries.
                </p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
           </div>
        </div>

        <div className="lg:col-span-2">
          {(!selectedDeptId || (selectedDeptId && selectedLevelId)) ? (() => {
            const selectedLevel = selectedLevelId ? jobLevels?.find(l => l.levelId === selectedLevelId) : null;

            const getDisabledRoles = (level: typeof selectedLevel) => {
              if (!level) return [];
              const name = level.levelName.toLowerCase();
              const disabled: string[] = [];
              if (name.includes('junior')) disabled.push('SUBORDINATE');
              if (name.includes('senior manager') || level.levelRank === 4) disabled.push('MANAGER');
              return disabled;
            };

            const disabledRoles = getDisabledRoles(selectedLevel);

            return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {[
                { role: 'SELF', label: 'Self Feedback', icon: User, color: 'indigo', desc: 'How employees view their own performance.' },
                { role: 'MANAGER', label: 'Manager / Direct Manager', icon: UserCheck, color: 'violet', desc: 'Official review from direct supervisors.' },
                { role: 'PEER', label: 'Peer Review', icon: Users, color: 'blue', desc: 'Anonymous feedback from immediate colleagues.' },
                { role: 'SUBORDINATE', label: 'Subordinate Feedback', icon: UserPlus, color: 'emerald', desc: 'Insights from direct reports (Upward feedback).' },
              ]
              .filter(slot => !disabledRoles.includes(slot.role))
              .map((slot, i) => (
                <div 
                  key={i}
                  className="group bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 flex flex-col relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-3xl bg-${slot.color}-600`}></div>
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-${slot.color}-50 text-${slot.color}-600 flex items-center justify-center transition-all group-hover:scale-110`}>
                      <slot.icon className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{slot.label}</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                      {slot.desc}
                    </p>
                  </div>

                  <button 
                    onClick={() => handleOpenDesigner(slot.role as any)}
                    className="w-full py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:bg-indigo-600 hover:text-white group-hover:shadow-lg"
                  >
                    Design Questionnaire <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            );
          })() : (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center px-10">
               <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 shadow-sm">
                  <ArrowLeft className="w-10 h-10 text-slate-200" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Scope Not Defined</h3>
               <p className="text-slate-400 font-medium max-w-sm">Please select a Department and Job Level from the left panel to begin designing role-specific forms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackFormBuilder;
