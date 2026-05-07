import FeedbackPage from "../pages/continuous/FeedbackPage";
import MeetingPage from "../pages/continuous/MeetingPage";
import PerformanceHistoryPage from "../pages/continuous/PerformanceHistoryPage";

export const continuousRoutes = [
  { path: "/continuous-feedback", element: <FeedbackPage /> },
  { path: "/meetings", element: <MeetingPage /> },
  { path: "/performance-history", element: <PerformanceHistoryPage /> },
];
