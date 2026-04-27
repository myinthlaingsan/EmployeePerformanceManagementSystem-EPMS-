import { useState, useCallback } from 'react';
import { appraisalApi } from '../api/appraisalApi';
import { formApi } from '../api/formApi';
import type { Appraisal, AssessmentResponse } from '../types/appraisal';
import type { FormTemplate } from '../types/form';

export const useAppraisal = () => {
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppraisal = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const appraisalData = await appraisalApi.getAppraisalById(id);
      const formData = await formApi.getFormById(appraisalData.formId);
      
      setAppraisal(appraisalData);
      setForm(formData);

      // Initialize responses based on existing data or form structure
      const existingResponses = appraisalData.status === 'PENDING_ASSESSMENT' 
        ? appraisalData.selfAssessment?.responses 
        : appraisalData.managerEvaluation?.responses;

      if (existingResponses && existingResponses.length > 0) {
        setResponses(existingResponses);
      } else {
        const initialResponses: AssessmentResponse[] = formData.sections.flatMap(s => 
          s.questions.map(q => ({ questionId: q.id, rating: 0, comment: '' }))
        );
        setResponses(initialResponses);
      }
    } catch (err) {
      setError('Failed to load appraisal data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRating = (questionId: string, rating: number) => {
    setResponses(prev => prev.map(r => r.questionId === questionId ? { ...r, rating } : r));
  };

  const updateComment = (questionId: string, comment: string) => {
    setResponses(prev => prev.map(r => r.questionId === questionId ? { ...r, comment } : r));
  };

  const saveDraft = async (type: 'self' | 'manager') => {
    if (!appraisal) return;
    setSaving(true);
    try {
      if (type === 'self') {
        await appraisalApi.saveSelfAssessment(appraisal.id, { responses });
      } else {
        await appraisalApi.saveManagerEvaluation(appraisal.id, { responses });
      }
      return true;
    } catch (err) {
      setError('Failed to save draft');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitFinal = async (type: 'self' | 'manager') => {
    if (!appraisal) return;
    setSaving(true);
    try {
      if (type === 'self') {
        await appraisalApi.submitSelfAssessment(appraisal.id, { responses });
      } else {
        await appraisalApi.submitManagerEvaluation(appraisal.id, { responses });
      }
      return true;
    } catch (err) {
      setError('Failed to submit final assessment');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    appraisal,
    form,
    responses,
    loading,
    saving,
    error,
    loadAppraisal,
    updateRating,
    updateComment,
    saveDraft,
    submitFinal,
  };
};
