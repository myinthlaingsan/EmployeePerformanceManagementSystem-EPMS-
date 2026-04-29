import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appraisalApi } from '../../api/appraisalApi';
import { formApi } from '../../api/formApi';
import type { Appraisal, AssessmentResponse } from '../../types/appraisal';
import type { FormTemplate } from '../../types/form';

import { useAppraisal } from '../../hooks/useAppraisal';
import QuestionRenderer from '../../components/appraisal/QuestionRenderer';

const SelfAssessment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    appraisal, 
    form, 
    responses, 
    loading, 
    saving, 
    loadAppraisal, 
    updateRating, 
    updateComment, 
    saveDraft, 
    submitFinal 
  } = useAppraisal();

  useEffect(() => {
    if (id) loadAppraisal(id);
  }, [id, loadAppraisal]);

  const onSave = async () => {
    const success = await saveDraft('self');
    if (success) alert('Draft saved successfully!');
  };

  const onSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit? You cannot edit after submission.')) return;
    const success = await submitFinal('self');
    if (success) navigate(`/appraisal/${id}`);
  };

  if (loading) return <div className="p-8 text-center">Loading Assessment Form...</div>;
  if (!form || !appraisal) return <div className="p-8 text-center">Form not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{form.title}</h1>
            <p className="text-sm text-slate-500">Self-Assessment Phase</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button 
              onClick={onSubmit}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {form.sections.map((section) => (
          <div key={section.id} className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{section.title}</h2>
            {section.description && <p className="text-slate-500 mb-6">{section.description}</p>}
            
            <div className="space-y-6">
              {section.questions.map((question) => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  response={responses.find(r => r.questionId === question.id)}
                  onRatingChange={(r) => updateRating(question.id, r)}
                  onCommentChange={(c) => updateComment(question.id, c)}
                  disabled={saving}
                  theme="indigo"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelfAssessment;
