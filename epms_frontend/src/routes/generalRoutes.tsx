import Dashboard from "../pages/Dashboard";
import ProfilePage from "../pages/ProfilePage";
import NotificationsPage from "../pages/NotificationsPage";

export const generalRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/notifications", element: <NotificationsPage /> },
];
