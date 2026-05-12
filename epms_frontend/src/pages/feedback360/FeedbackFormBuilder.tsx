import React, { useState, useEffect } from 'react';
import { 
  useGetFeedbackFormByCycleQuery, 
  useSaveFeedbackFormMutation 
} from '../../features/feedback360/feedback360Api';
import { useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import type { FeedbackFormCreationRequest, CategoryPayload, QuestionPayload } from '../../features/feedback360/feedback360Types';
import { Plus, Trash2, Save, Lock, AlertCircle, Info } from 'lucide-react';

const FeedbackFormBuilder: React.FC = () => {
  const { data: cycles } = useGetCyclesQuery();
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

  const { data: existingForm, isLoading: loadingForm, error: formError } = useGetFeedbackFormByCycleQuery(selectedCycleId ?? 0, {
    skip: !selectedCycleId
  });

  const [saveForm, { isLoading: isSaving }] = useSaveFeedbackFormMutation();

  const [formName, setFormName] = useState('360 Feedback Form');
  const [categories, setCategories] = useState<CategoryPayload[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (cycles && cycles.length > 0 && !selectedCycleId) {
      const active = cycles.find(c => c.isActive) || cycles[0];
      setSelectedCycleId(active.cycleId);
    }
  }, [cycles]);

  useEffect(() => {
    if (selectedCycleId && cycles) {
      const cycle = cycles.find(c => c.cycleId === selectedCycleId);
      if (cycle) {
        const isPastEnd = cycle.endDate && new Date() > new Date(cycle.endDate);
        const isCycleLocked = cycle.status === 'GENERATED' || cycle.status === 'LOCKED' || cycle.status === 'EVALUATION';
        
        if (isPastEnd || isCycleLocked) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      } else {
        setIsLocked(false);
      }
    }
  }, [selectedCycleId, cycles]);

  useEffect(() => {
    if (existingForm) {
      setFormName(existingForm.formName);
      const mappedCats: CategoryPayload[] = (existingForm.categories || []).map(c => ({
        categoryName: c.categoryName,
        questions: c.questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType as 'RATING' | 'TEXT' | 'YESNO',
          isRequired: q.isRequired,
          requiresComment: (q as any).requiresComment || false
        }))
      }));
      setCategories(mappedCats);
    } else if (formError) {
      // If 404, we start fresh
      setCategories([{
        categoryName: 'General Performance',
        questions: [{ 
          questionText: 'How well does this person communicate?', 
          questionType: 'RATING', 
          isRequired: true,
          requiresComment: false 
        }]
      }]);
    }
  }, [existingForm, formError]);

  const handleAddCategory = () => {
    if (isLocked) return;
    setCategories([...categories, { categoryName: 'New Category', questions: [] }]);
  };

  const handleRemoveCategory = (index: number) => {
    if (isLocked) return;
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCategoryNameChange = (index: number, name: string) => {
    if (isLocked) return;
    const newCats = [...categories];
    newCats[index].categoryName = name;
    setCategories(newCats);
  };

  const handleAddQuestion = (catIndex: number) => {
    if (isLocked) return;
    const newCats = [...categories];
    newCats[catIndex].questions.push({
      questionText: 'New Question',
      questionType: 'RATING',
      isRequired: true,
      requiresComment: false
    });
    setCategories(newCats);
  };

  const handleRemoveQuestion = (catIndex: number, qIndex: number) => {
    if (isLocked) return;
    const newCats = [...categories];
    newCats[catIndex].questions = newCats[catIndex].questions.filter((_, i) => i !== qIndex);
    setCategories(newCats);
  };

  const handleQuestionChange = (catIndex: number, qIndex: number, field: keyof QuestionPayload, value: any) => {
    if (isLocked) return;
    const newCats = [...categories];
    newCats[catIndex].questions[qIndex] = { ...newCats[catIndex].questions[qIndex], [field]: value };
    setCategories(newCats);
  };

  const handleSave = async () => {
    if (!selectedCycleId || isLocked) return;
    try {
      const payload: FeedbackFormCreationRequest = {
        formName,
        categories
      };
      await saveForm({ cycleId: selectedCycleId, body: payload }).unwrap();
      alert('Form saved successfully!');
    } catch (err) {
      console.error('Failed to save form', err);
      alert('Failed to save form. Check console for details.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-title mb-2">Form Configuration</h1>
          <p className="text-text-subtitle text-sm">Design the 360 feedback questions and categories for the active cycle.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="px-4 py-2 bg-white border border-surface-border rounded-xl font-medium text-text-title shadow-sm outline-none focus:ring-2 focus:ring-brand-primary"
            value={selectedCycleId || ''}
            onChange={(e) => setSelectedCycleId(Number(e.target.value))}
          >
            <option value="">Select Cycle</option>
            {cycles?.map(c => (
              <option key={c.cycleId} value={c.cycleId}>{c.cycleName}</option>
            ))}
          </select>

          {!isLocked && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white rounded-xl font-bold shadow-md hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Form
            </button>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-8 flex items-start gap-4">
          <div className="bg-orange-100 p-2 rounded-xl mt-1">
            <Lock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-orange-900">Form Locked</h3>
            <p className="text-sm text-orange-800 mt-1">
              The appraisal cycle associated with this form has ended. Editing is strictly prohibited to ensure data integrity for generated reports.
            </p>
          </div>
        </div>
      )}

      {loadingForm ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-sm">
            <label className="block text-sm font-bold text-text-subtitle mb-2">Form Title</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-surface-base border border-surface-border rounded-xl font-bold text-text-title disabled:opacity-70"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={isLocked}
            />
          </div>

          <div className="space-y-6">
            {categories.map((cat, catIdx) => (
              <div key={catIdx} className="bg-white rounded-3xl border border-surface-border shadow-sm overflow-hidden">
                <div className="bg-surface-base px-6 py-4 border-b border-surface-border flex justify-between items-center">
                  <input 
                    type="text" 
                    className="bg-transparent font-black text-text-title text-lg outline-none w-1/2 disabled:opacity-70"
                    value={cat.categoryName}
                    onChange={(e) => handleCategoryNameChange(catIdx, e.target.value)}
                    disabled={isLocked}
                    placeholder="Category Name"
                  />
                  {!isLocked && (
                    <button 
                      onClick={() => handleRemoveCategory(catIdx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {cat.questions.map((q, qIdx) => (
                    <div key={qIdx} className="flex gap-4 items-start bg-surface-base/30 p-4 rounded-2xl border border-surface-border">
                      <div className="flex-1 space-y-3">
                        <input 
                          type="text"
                          className="w-full px-4 py-2 bg-white border border-surface-border rounded-xl font-medium text-text-title text-sm disabled:opacity-70"
                          value={q.questionText}
                          onChange={(e) => handleQuestionChange(catIdx, qIdx, 'questionText', e.target.value)}
                          disabled={isLocked}
                          placeholder="Question text..."
                        />
                        <div className="flex gap-4">
                          <select
                            className="px-4 py-2 bg-white border border-surface-border rounded-xl font-medium text-text-title text-xs disabled:opacity-70"
                            value={q.questionType}
                            onChange={(e) => handleQuestionChange(catIdx, qIdx, 'questionType', e.target.value)}
                            disabled={isLocked}
                          >
                            <option value="RATING">Rating (1-5)</option>
                            <option value="TEXT">Text Only</option>
                            <option value="YESNO">Yes / No</option>
                          </select>

                          <label className="flex items-center gap-2 text-xs font-bold text-text-subtitle cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={q.isRequired}
                              onChange={(e) => handleQuestionChange(catIdx, qIdx, 'isRequired', e.target.checked)}
                              disabled={isLocked}
                              className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                            />
                            Required
                          </label>

                          <label className="flex items-center gap-2 text-xs font-bold text-text-subtitle cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={q.requiresComment}
                              onChange={(e) => handleQuestionChange(catIdx, qIdx, 'requiresComment', e.target.checked)}
                              disabled={isLocked}
                              className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                            />
                            Require Comment
                          </label>
                        </div>
                      </div>
                      {!isLocked && (
                        <button 
                          onClick={() => handleRemoveQuestion(catIdx, qIdx)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {!isLocked && (
                    <button 
                      onClick={() => handleAddQuestion(catIdx)}
                      className="flex items-center gap-2 text-sm font-bold text-brand-primary hover:bg-brand-primary/5 px-4 py-2 rounded-xl transition-colors w-full justify-center border-2 border-dashed border-brand-primary/20"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isLocked && (
            <button 
              onClick={handleAddCategory}
              className="flex items-center gap-2 text-sm font-bold text-text-title hover:bg-surface-base px-6 py-4 rounded-3xl transition-colors w-full justify-center border-2 border-dashed border-surface-border bg-white"
            >
              <Plus className="w-5 h-5" />
              Add New Category
            </button>
          )}

        </div>
      )}
    </div>
  );
};

export default FeedbackFormBuilder;
