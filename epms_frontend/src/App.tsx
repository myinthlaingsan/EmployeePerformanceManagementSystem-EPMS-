import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./hooks/reduxHooks";
import { useGetMeQuery } from "./features/auth/authApi";
import { setUser } from "./features/auth/authSlice";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
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
import HRDashboard from "./pages/admin/HRDashboard";
import EmployeeDepartmentHistory from "./pages/admin/org/EmployeeDepartmentHistory";
import PermissionList from "./pages/admin/PermissionList";
import RoleLevelPermissionManager from "./pages/admin/org/RoleLevelPermissionManager";

// Mock Components for other specialized pages
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />

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
            </Route>

            {/* Specialized Manager Routes (Level L01-L04 + Specific Permission) */}
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