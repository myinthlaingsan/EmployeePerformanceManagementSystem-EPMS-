import EmployeeList from "../pages/admin/EmployeeList";
import EmployeeForm from "../pages/admin/EmployeeForm";
import DepartmentList from "../pages/admin/DepartmentList";
import RoleList from "../pages/admin/RoleList";
import JobLevelList from "../pages/admin/JobLevelList";
import PositionList from "../pages/admin/PositionList";
import HRDashboard from "../pages/admin/HRDashboard";
import TeamList from "../pages/admin/TeamList";
import PermissionList from "../pages/admin/PermissionList";
import RoleLevelPermissionManager from "../pages/admin/org/RoleLevelPermissionManager";
import EmployeeDepartmentHistory from "../pages/admin/org/EmployeeDepartmentHistory";
import FeedbackAdminDashboard from "../pages/admin/FeedbackAdminDashboard";

export const adminRoutes = [
  { path: "/hr", element: <HRDashboard /> },
  { path: "/hr/feedback", element: <FeedbackAdminDashboard /> },
  { path: "/employees", element: <EmployeeList /> },
  { path: "/employees/new", element: <EmployeeForm /> },
  { path: "/employees/edit/:id", element: <EmployeeForm /> },
  { path: "/employees/:id/departments", element: <EmployeeDepartmentHistory /> },
  { path: "/departments", element: <DepartmentList /> },
  { path: "/roles", element: <RoleList /> },
  { path: "/job-levels", element: <JobLevelList /> },
  { path: "/positions", element: <PositionList /> },
  { path: "/teams", element: <TeamList /> },
  {path: "/permissions", element: <PermissionList />},
  {path : "/permissions/matrix", element: <RoleLevelPermissionManager />}
];
