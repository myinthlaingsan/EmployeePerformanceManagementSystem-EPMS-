import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./hooks/reduxHooks";
import { useGetMeQuery } from "./features/auth/authApi";
import { setUser } from "./features/auth/authSlice";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/MainLayout";
// Routes
import {
  publicRoutes,
  appraisalRoutes,
  adminRoutes,
  pipRoutes,
  generalRoutes
} from "./routes";

// Specialized Manager Component (Temporary here, can be moved later)
const ApprovalPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Manager Approval Page</h1></div>;

const App = () => {
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((state) => state.auth);

  const { data: userData, isSuccess } = useGetMeQuery(undefined, {
    skip: !accessToken || !!user,
  });

  useEffect(() => {
    if (isSuccess && userData) {
      dispatch(setUser(userData));
    }
  }, [isSuccess, userData, dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* General Routes (Dashboard, Profile, etc.) */}
            {generalRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* Appraisal Workflow Routes */}
            {appraisalRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* General PIP Routes (excluding new) */}
            {pipRoutes.filter(r => !r.adminOnly).map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* HR/Admin Management Routes */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "HR"]} />}>
              {adminRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* PIP Creation Route (Restricted) */}
              {pipRoutes.filter(r => r.adminOnly).map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Route>

            {/* Specialized Manager Routes */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["MANAGER"]}
                  maxLevel={4}
                  requiredPermissions={["APPROVAL_CREATE"]}
                />
              }
            >
              <Route path="/approvals" element={<ApprovalPage />} />
              <Route path="/kpi/team" element={<TeamKpiDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<div className="p-6 text-center mt-20 font-bold text-gray-400">404 | Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;