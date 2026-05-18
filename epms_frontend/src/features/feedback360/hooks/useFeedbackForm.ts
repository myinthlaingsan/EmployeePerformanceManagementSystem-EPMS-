import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmitFeedbackMutation } from '../feedback360Api';
import type { FeedbackSubmissionRequest, FeedbackResponseRequest, FullFormResponse } from '../feedback360Types';

export const useFeedbackForm = (requestId: number, form?: FullFormResponse) => {
  const navigate = useNavigate();
  const [submitFeedback, { isLoading: isSubmitting }] = useSubmitFeedbackMutation();

  const [answers, setAnswers] = useState<Record<number, FeedbackResponseRequest>>({});
  const [overallComment, setOverallComment] = useState('');
  const [activeSection, setActiveSection] = useState(0);

  const handleScore = (questionId: number, score: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { questionId, score, comment: prev[questionId]?.comment }
    }));
  };

  const handleComment = (questionId: number, comment: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], questionId, comment }
    }));
  };

  const isSectionComplete = (sectionIndex: number) => {
    if (!form) return false;
    const questions = form.categories[sectionIndex].questions;
    return questions.every(q => (answers[q.questionId]?.score || 0) > 0);
  };

  const isFormValid = () => {
    if (!form) return false;
    return form.categories.every((_, idx) => isSectionComplete(idx));
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    try {
      await submitFeedback({
        requestId,
        overallComment,
        responses: Object.values(answers),
      }).unwrap();
      navigate('/feedback360', { state: { success: true } });
    } catch (err) {
      console.error('Failed to submit:', err);
      throw err;
    }
  };

  const nextSection = () => setActiveSection(prev => prev + 1);
  const prevSection = () => setActiveSection(prev => prev - 1);

  return {
    answers,
    overallComment,
    activeSection,
    isSubmitting,
    setOverallComment,
    handleScore,
    handleComment,
    isSectionComplete,
    isFormValid,
    handleSubmit,
    nextSection,
    prevSection
  };
};
