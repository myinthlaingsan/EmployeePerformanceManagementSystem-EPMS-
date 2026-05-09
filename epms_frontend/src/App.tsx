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
  generalRoutes,
  kpiRoutes,
  feedback360Routes
} from "./routes";
import { ActiveCycleProvider } from "./context/ActiveCycleContext";
import KpiCategoryManager from './pages/admin/kpi/KpiCategoryManager';

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
          <Route element={<ActiveCycleProvider><MainLayout /></ActiveCycleProvider>}>
            {/* General Routes (Dashboard, Profile, etc.) */}
            {generalRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* Appraisal Workflow Routes */}
            {appraisalRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* PIP Routes */}
            {pipRoutes.filter(r => !r.adminOnly).map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* Feedback 360 General Routes */}
            {feedback360Routes.filter(r => !r.adminOnly).map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* KPI General Routes */}
            {kpiRoutes.filter(r => !['/kpi/library', '/kpi/manage', '/kpi/library/new', '/kpi/library/edit/:id', '/kpi/assign/:employeeId', '/kpi/team'].includes(r.path)).map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* Manager & Admin/HR KPI Management Routes */}
            <Route element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "HR"]} />}>
              {kpiRoutes.filter(r => ['/kpi/team', '/kpi/manage', '/kpi/assign/:employeeId'].includes(r.path)).map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Route>

            {/* HR/Admin Management Routes */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "HR"]} />}>
              {adminRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* Feedback 360 Admin Routes */}
              {feedback360Routes.filter(r => r.adminOnly).map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* PIP Creation Route (Restricted) */}
              {pipRoutes.filter(r => r.adminOnly).map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* KPI Administrative Routes (Library Management) */}
              {kpiRoutes.filter(r => ['/kpi/library', '/kpi/library/new', '/kpi/library/edit/:id'].includes(r.path)).map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              <Route path="/kpi/categories" element={<KpiCategoryManager />} />
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