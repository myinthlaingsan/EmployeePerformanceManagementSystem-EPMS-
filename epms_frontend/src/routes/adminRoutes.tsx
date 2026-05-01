import EmployeeList from "../pages/admin/EmployeeList";
import EmployeeForm from "../pages/admin/EmployeeForm";
import DepartmentList from "../pages/admin/DepartmentList";
import RoleList from "../pages/admin/RoleList";
import JobLevelList from "../pages/admin/JobLevelList";
import PositionList from "../pages/admin/PositionList";
import HRDashboard from "../pages/admin/HRDashboard";

export const adminRoutes = [
  { path: "/hr", element: <HRDashboard /> },
  { path: "/employees", element: <EmployeeList /> },
  { path: "/employees/new", element: <EmployeeForm /> },
  { path: "/employees/edit/:id", element: <EmployeeForm /> },
  { path: "/departments", element: <DepartmentList /> },
  { path: "/roles", element: <RoleList /> },
  { path: "/job-levels", element: <JobLevelList /> },
  { path: "/positions", element: <PositionList /> },
];
