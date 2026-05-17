import DashboardRouter from "../pages/DashboardRouter";
import ProfilePage from "../pages/ProfilePage";
import EditProfilePage from "../pages/EditProfilePage";
import NotificationsPage from "../pages/NotificationsPage";

export const generalRoutes = [
  { path: "/dashboard", element: <DashboardRouter /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/profile/edit", element: <EditProfilePage /> },
  { path: "/notifications", element: <NotificationsPage /> },
];
