import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  useGetAppraisalFormQuery, 
  useCreateAppraisalFormMutation,
  useUpdateAppraisalFormMutation 
} from '../../features/appraisal/appraisalApi';
import type { FormTemplate, FormSection, FormQuestion } from '../../types/form';

const AppraisalFormEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [form, setForm] = useState<Partial<FormTemplate>>({
    title: '',
    description: '',
    sections: [],
    totalWeightage: 0,
    status: 'DRAFT',
  });

  const { data: existingForm, isLoading: isFetching } = useGetAppraisalFormQuery(id!, {
    skip: !isEditMode,
  });
  
  const [createForm, { isLoading: isCreating }] = useCreateAppraisalFormMutation();
  const [updateForm, { isLoading: isUpdating }] = useUpdateAppraisalFormMutation();

  const isLoading = isFetching || isCreating || isUpdating;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingForm) {
      setForm({
        id: existingForm.id,
        title: existingForm.title,
        description: existingForm.description || '',
        sections: existingForm.sections?.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
          weightage: s.weightage || 0,
          questions: s.questions?.map(q => ({
            id: q.id,
            text: q.text,
            type: q.type as any,
            required: q.required,
            weightage: q.weightage || 0
          })) || []
        })) || [],
        totalWeightage: 0, // Will be calculated if needed
        status: 'DRAFT'
      });
    }
  }, [existingForm]);

  const handleSave = async () => {
    if (!form.title) {
      setError('Title is required.');
      return;
    }

    const payload: Partial<FormTemplate> = {
      title: form.title,
      description: form.description || '',
      sections: form.sections?.map(s => ({
        id: s.id,
        title: s.title,
        weightage: s.weightage,
        questions: s.questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required,
          weightage: q.weightage
        }))
      }))
    };

    try {
      if (isEditMode && id) {
        await updateForm({ id, body: payload }).unwrap();
      } else {
        await createForm(payload).unwrap();
      }
      navigate('/appraisal-forms');
    } catch (err) {
      setError('Failed to save form template.');
      console.error(err);
    }
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Section',
      questions: [],
      weightage: 0,
    };
    setForm({ ...form, sections: [...(form.sections || []), newSection] });
  };

  const removeSection = (sectionId: string) => {
    setForm({
      ...form,
      sections: (form.sections || []).filter((s) => s.id !== sectionId),
    });
  };

  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setForm({
      ...form,
      sections: (form.sections || []).map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    });
  };

  const addQuestion = (sectionId: string) => {
    const newQuestion: FormQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'New Question',
      type: 'RATING',
      required: true,
      weightage: 0,
    };
    setForm({
      ...form,
      sections: (form.sections || []).map((s) =>
        s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion] } : s
      ),
    });
  };

  const removeQuestion = (sectionId: string, questionId: string) => {
    setForm({
      ...form,
      sections: (form.sections || []).map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s
      ),
    });
  };

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<FormQuestion>) => {
    setForm({
      ...form,
      sections: (form.sections || []).map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            }
          : s
      ),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Appraisal Form' : 'Create New Appraisal Form'}
          </h1>
          <p className="text-gray-500 mt-1">Define sections and questions for this template.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/appraisal-forms')}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* General Settings */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Form Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              placeholder="e.g., Annual Performance Appraisal 2024"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition min-h-25"
              placeholder="Provide context for employees and managers..."
            />
          </div>
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Weightage (%)</label>
              <input
                type="number"
                value={form.totalWeightage}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl outline-none font-bold text-gray-600"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sections & Questions */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Sections & Questions</h2>
          <button
            onClick={addSection}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition flex items-center gap-2 border border-indigo-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Section
          </button>
        </div>

        {form.sections?.map((section, sIndex) => (
          <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
            <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex-1 flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    className="w-full bg-transparent border-none text-lg font-bold text-gray-900 focus:ring-0 p-0"
                    placeholder="Section Title"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    value={section.weightage}
                    onChange={(e) => updateSection(section.id, { weightage: Number(e.target.value) })}
                    className="w-full px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Weight %"
                  />
                </div>
              </div>
              <button
                onClick={() => removeSection(section.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {section.questions.map((q, qIndex) => (
                <div key={q.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 relative group/question">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(section.id, q.id, { text: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Question text..."
                    />
                    <div className="flex gap-4">
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(section.id, q.id, { type: e.target.value as any })}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="RATING">Rating (1-5)</option>
                        <option value="TEXT">Text Answer</option>
                        <option value="NUMBER">Number</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(section.id, q.id, { required: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-500 font-medium">Required</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      value={q.weightage}
                      onChange={(e) => updateQuestion(section.id, q.id, { weightage: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="W %"
                    />
                  </div>
                  <button
                    onClick={() => removeQuestion(section.id, q.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition opacity-0 group-hover/question:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => addQuestion(section.id)}
                className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 hover:border-blue-200 hover:text-blue-500 transition text-sm font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Question
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppraisalFormEditor;
