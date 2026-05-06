import MyFeedbackTasksPage from "../pages/feedback360/MyFeedbackTasksPage";
import GiveFeedbackPage from "../pages/feedback360/GiveFeedbackPage";
import FeedbackResultsPage from "../pages/feedback360/FeedbackResultsPage";

export const feedback360Routes = [
  { path: "/feedback-360", element: <MyFeedbackTasksPage /> },
  { path: "/feedback-360/give/:id", element: <GiveFeedbackPage /> },
  { path: "/feedback-360/results", element: <FeedbackResultsPage /> },
  { path: "/feedback-360/results/:subjectId", element: <FeedbackResultsPage /> },
];
