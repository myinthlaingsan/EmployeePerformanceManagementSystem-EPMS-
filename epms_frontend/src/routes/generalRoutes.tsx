import DashboardRouter from "../pages/DashboardRouter";
import ProfilePage from "../pages/ProfilePage";
import NotificationsPage from "../pages/NotificationsPage";

export const generalRoutes = [
  { path: "/dashboard", element: <DashboardRouter /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/notifications", element: <NotificationsPage /> },
];
