export interface HrDashboardResponse {
  totalEmployeesUnderReview: number;
  appraisalCompletionRate: number;
  pendingSelfAssessments: number;
  pendingManagerReviews: number;
  openPips: number;
  promotionCandidates: number;
  departmentPerformance: DepartmentPerformance[];
  topPerformers: TopPerformer[];
  alerts: DashboardAlert[];
}

export interface DepartmentPerformance {
  departmentName: string;
  averageScore: number;
  employeeCount: number;
}

export interface TopPerformer {
  employeeName: string;
  department: string;
  score: number;
  photoUrl?: string;
}

export interface DashboardAlert {
  title: string;
  message: string;
  type: "info" | "warning" | "danger";
  timestamp: string;
}

export interface AdminDashboardResponse {
  totalEmployees: number;
  totalDepartments: number;
  totalManagers: number;
  activeUsers: number;
  lockedAccounts: number;
  activeCycles: number;
  recentActivities: RecentActivity[];
  securityAlerts: SecurityAlert[];
}

export interface RecentActivity {
  action: string;
  user: string;
  timestamp: string;
  module: string;
}

export interface SecurityAlert {
  event: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  timestamp: string;
  details: string;
}

export interface EmployeeDashboardResponse {
  currentScore: number;
  kpiCompletionPercentage: number;
  pendingTasksCount: number;
  feedbackCount: number;
  performanceTrend: ScoreTrend[];
  kpiStatus: KpiProgress[];
  appraisalTimeline: UpcomingPhase[];
  tasks: DashboardTask[];
}

export interface ScoreTrend {
  period: string;
  score: number;
}

export interface KpiProgress {
  name: string;
  value: number;
}

export interface UpcomingPhase {
  phase: string;
  status: string;
  date: string;
  active: boolean;
}

export interface DashboardTask {
  id: number;
  title: string;
  deadline: string;
  priority: string;
}

export interface ManagerDashboardResponse {
  teamSize: number;
  reviewsCompleted: number;
  totalReviews: number;
  pendingReviews: number;
  feedbackRequests: number;
  teamPerformance: TeamMemberPerformance[];
  teamKpis: TeamKpiProgress[];
  urgentReviews: DashboardTask[];
}

export interface TeamMemberPerformance {
  name: string;
  score: number;
}

export interface TeamKpiProgress {
  name: string;
  progress: number;
  color: string;
}
