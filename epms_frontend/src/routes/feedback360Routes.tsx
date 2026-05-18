import React from 'react';
import Feedback360Dashboard from '../pages/feedback360/Feedback360Dashboard';
import FeedbackForm from '../pages/feedback360/FeedbackForm';
import FeedbackSummaryView from '../pages/feedback360/FeedbackSummaryView';
import FeedbackManagement from '../pages/admin/feedback360/FeedbackManagement';
import FeedbackSummaryList from '../pages/admin/feedback360/FeedbackSummaryList';
import FeedbackFormBuilder from '../pages/feedback360/FeedbackFormBuilder';
import SubmissionReview from '../pages/feedback360/SubmissionReview';
import DepartmentConfigPage from '../pages/admin/feedback360/DepartmentConfigPage';

export interface FeedbackRoute {
  path: string;
  element: React.ReactNode;
  adminOnly: boolean;
}

export const feedback360Routes: FeedbackRoute[] = [
  // Evaluator routes (any authenticated user)
  { path: '/feedback360', element: <Feedback360Dashboard />, adminOnly: false },
  { path: '/feedback360/evaluate/:requestId', element: <FeedbackForm />, adminOnly: false },
  { path: '/feedback360/submission/:requestId', element: <SubmissionReview />, adminOnly: false },
  { path: '/feedback360/summary/:targetUserId/:cycleId', element: <FeedbackSummaryView />, adminOnly: false },

  // HR/Admin only
  { path: '/feedback360/manage', element: <FeedbackManagement />, adminOnly: true },
  { path: '/feedback360/form-builder', element: <FeedbackFormBuilder />, adminOnly: true },
  { path: '/feedback360/results', element: <FeedbackSummaryList />, adminOnly: true },
  { path: '/feedback360/config', element: <DepartmentConfigPage />, adminOnly: true },
];
