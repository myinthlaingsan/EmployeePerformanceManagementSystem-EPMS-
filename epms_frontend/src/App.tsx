import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { useGetMeQuery } from "./features/auth/authApi";
import { setUser } from "./features/auth/authSlice";
import { useEffect } from "react";
import LoginPage from "./pages/auth/LoginPage";
import SetPasswordPage from "./pages/auth/SetPasswordPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProfilePage from "./pages/ProfilePage";
import SetPasswordPage from "./pages/SetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Admin Pages
import EmployeeList from "./pages/admin/EmployeeList";
import EmployeeForm from "./pages/admin/EmployeeForm";
import DepartmentList from "./pages/admin/DepartmentList";
import RoleList from "./pages/admin/RoleList";
import JobLevelList from "./pages/admin/JobLevelList";
import PositionList from "./pages/admin/PositionList";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import HRDashboard from "./pages/admin/HRDashboard";
import EmployeeList from "./pages/admin/org/EmployeeList";
import EmployeeForm from "./pages/admin/org/EmployeeForm";
import DepartmentList from "./pages/admin/org/DepartmentList";
import RoleList from "./pages/admin/org/RoleList";
import JobLevelList from "./pages/admin/org/JobLevelList";
import PositionList from "./pages/admin/org/PositionList";
import EmployeeDepartmentHistory from "./pages/admin/org/EmployeeDepartmentHistory";
import PermissionList from "./pages/admin/PermissionList";
import RoleLevelPermissionManager from "./pages/admin/org/RoleLevelPermissionManager";
import KpiLibraryDashboard from "./pages/kpi/KpiLibraryDashboard";
import KpiLibraryEntry from "./pages/kpi/KpiLibraryEntry";
import MyKpiDashboard from "./pages/kpi/MyKpiDashboard";
import TeamKpiDashboard from "./pages/kpi/TeamKpiDashboard";
import GoalManagement from "./pages/kpi/GoalManagement";
import GoalDetail from "./pages/kpi/GoalDetail";
import KpiHub from "./pages/kpi/KpiHub";
import ApprovalPage from "./pages/ApprovalPage";
import { ActiveCycleProvider } from "./context/ActiveCycleContext";

const AppContent = () => {
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/kpi/goals/:employeeId" element={<GoalDetail />} />
              <Route path="/kpi/my-goals" element={<MyKpiDashboard />} />
              <Route path="/kpi/hub" element={<KpiHub />} />

              {/* HR/Admin Management Routes */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "HR"]} />}>
                <Route path="/hr" element={<HRDashboard />} />
                <Route path="/employees" element={<EmployeeList />} />
                <Route path="/employees/new" element={<EmployeeForm />} />
                <Route path="/employees/edit/:id" element={<EmployeeForm />} />
                <Route path="/employees/:id/departments" element={<EmployeeDepartmentHistory />} />

                <Route path="/permissions" element={<PermissionList />} />
                <Route path="/permissions/matrix" element={<RoleLevelPermissionManager />} />

                <Route path="/departments" element={<DepartmentList />} />
                <Route path="/roles" element={<RoleList />} />
                <Route path="/job-levels" element={<JobLevelList />} />
                <Route path="/positions" element={<PositionList />} />

                {/* KPI Routes (HR/Admin) */}
                <Route path="/kpi/library" element={<KpiLibraryDashboard />} />
                <Route path="/kpi/library/new" element={<KpiLibraryEntry />} />
                <Route path="/kpi/manage" element={<GoalManagement />} />
              </Route>

              {/* Specialized Manager Routes */}
              <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
                <Route path="/approvals" element={<ApprovalPage />} />
                <Route path="/kpi/team" element={<TeamKpiDashboard />} />
              </Route>
            </Route>
          </Route>

          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<div className="p-6 text-center mt-20 font-bold text-gray-400">404 | Page Not Found</div>} />
        </Routes>
        );
};

const App = () => {
  return (
        <Provider store={store}>
          <ActiveCycleProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ActiveCycleProvider>
        </Provider>
        );
};

        export default App;
