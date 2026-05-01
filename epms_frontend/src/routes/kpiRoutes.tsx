import KpiHub from "../pages/kpi/KpiHub";
import MyKpiDashboard from "../pages/kpi/MyKpiDashboard";
import TeamKpiDashboard from "../pages/kpi/TeamKpiDashboard";
import KpiLibraryDashboard from "../pages/kpi/KpiLibraryDashboard";
import KpiLibraryEntry from "../pages/kpi/KpiLibraryEntry";
import GoalManagement from "../pages/kpi/GoalManagement";
import GoalDetail from "../pages/kpi/GoalDetail";

export const kpiRoutes = [
  { path: "/kpi", element: <KpiHub /> },
  { path: "/kpi/my", element: <MyKpiDashboard /> },
  { path: "/kpi/team", element: <TeamKpiDashboard /> },
  { path: "/kpi/library", element: <KpiLibraryDashboard /> },
  { path: "/kpi/library/new", element: <KpiLibraryEntry /> },
  { path: "/kpi/library/edit/:id", element: <KpiLibraryEntry /> },
  { path: "/kpi/manage", element: <GoalManagement /> },
  { path: "/kpi/goals/:employeeId", element: <GoalDetail /> },
];
