import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appraisalApi } from '../../api/appraisalApi';
import { formApi } from '../../api/formApi';
import type { Appraisal, AssessmentResponse } from '../../types/appraisal';
import type { FormTemplate } from '../../types/form';

import { useAppraisal } from '../../hooks/useAppraisal';
import RatingInput from '../../components/appraisal/RatingInput';
import CommentBox from '../../components/appraisal/CommentBox';
import SideBySide from '../../components/appraisal/SideBySide';

const ManagerEvaluation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showSelfAssessment, setShowSelfAssessment] = useState(true);

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
    const success = await saveDraft('manager');
    if (success) alert('Draft saved successfully!');
  };

  const onSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit the final evaluation?')) return;
    const success = await submitFinal('manager');
    if (success) navigate(`/appraisal/${id}`);
  };

  if (loading) return <div className="p-8 text-center">Loading Evaluation Form...</div>;
  if (!form || !appraisal) return <div className="p-8 text-center">Form not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Manager Evaluation</h1>
            <p className="text-sm text-slate-500">Evaluating: {appraisal.employeeId}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSelfAssessment(!showSelfAssessment)}
              className={`px-4 py-2 font-semibold rounded-xl transition-colors ${showSelfAssessment ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {showSelfAssessment ? 'Hide Self-Assessment' : 'Show Self-Assessment'}
            </button>
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
              className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Finalize Evaluation'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {form.sections.map((section) => (
          <div key={section.id} className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{section.title}</h2>

            <div className="space-y-8">
              {section.questions.map((question) => {
                const managerResponse = responses.find(r => r.questionId === question.id);
                const selfResponse = appraisal.selfAssessment.responses.find(r => r.questionId === question.id);

                return (
                  <div key={question.id} className="space-y-4">
                    <p className="text-lg font-bold text-slate-800 px-2">{question.text}</p>
                    <SideBySide
                      leftTitle="Employee's Self-Assessment"
                      leftContent={
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-indigo-600">{selfResponse?.rating || '-'}</span>
                            <span className="text-slate-400 text-sm">/ 5 Rating</span>
                          </div>
                          <p className="text-slate-600 italic text-sm">
                            "{selfResponse?.comment || 'No comment provided.'}"
                          </p>
                        </div>
                      }
                      rightTitle="Manager's Evaluation"
                      rightContent={
                        <div className="space-y-6">
                          <RatingInput
                            value={managerResponse?.rating || 0}
                            onChange={(r) => updateRating(question.id, r)}
                            theme="emerald"
                            disabled={saving}
                          />
                          <CommentBox
                            value={managerResponse?.comment || ''}
                            onChange={(c) => updateComment(question.id, c)}
                            placeholder="Provide your feedback and justification..."
                            disabled={saving}
                          />
                        </div>
                      }
                      leftTheme={showSelfAssessment ? 'indigo' : 'slate'}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerEvaluation;
