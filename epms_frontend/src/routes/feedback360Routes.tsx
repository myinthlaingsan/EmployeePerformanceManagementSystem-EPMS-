import Feedback360Dashboard from '../pages/feedback360/Feedback360Dashboard';
import FeedbackSubmitForm from '../pages/feedback360/FeedbackSubmitForm';
import GiveFeedbackPage from '../pages/feedback360/GiveFeedbackPage';
import MyFeedbackSummary from '../pages/feedback360/MyFeedbackSummary';
import Feedback360Admin from '../pages/feedback360/Feedback360Admin';

import FeedbackAdminDashboard from '../pages/admin/FeedbackAdminDashboard';

export const feedback360Routes = [
  // Employee-accessible routes
  { path: '/360-feedback', element: <Feedback360Dashboard />, adminOnly: false },
  { path: '/360-feedback/give/:id', element: <GiveFeedbackPage />, adminOnly: false },
  { path: '/360-feedback/submit/:requestId', element: <FeedbackSubmitForm />, adminOnly: false },
  { path: '/360-feedback/my-summary', element: <MyFeedbackSummary />, adminOnly: false },
  // HR-only routes
  { path: '/360-feedback/admin', element: <Feedback360Admin />, adminOnly: true },
  { path: '/360-feedback/analytics', element: <FeedbackAdminDashboard />, adminOnly: true },
];
