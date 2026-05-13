export interface KpiAchievementReportDTO {
  employeeId: number;
  employeeName: string;
  departmentName: string;
  targetCount: number;
  completedCount: number;
  achievementPercentage: number;
}

export interface EmployeeStatusDTO {
  employeeName: string;
  status: string;
  completionDate?: string;
}

export interface AppraisalStatusReportDTO {
  totalEmployees: number;
  completed: number;
  pending: number;
  inProgress: number;
  details: EmployeeStatusDTO[];
}

export interface CycleScoreDTO {
  cycleName: string;
  finalScore: number;
}

export interface PerformanceTrendReportDTO {
  employeeName: string;
  scores: CycleScoreDTO[];
}

export interface FeedbackParticipationReportDTO {
  totalRequests: number;
  completedResponses: number;
  participationRate: number;
}

export interface PipDetailDTO {
  employeeName: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface PipTrackingReportDTO {
  totalActivePip: number;
  successfulCount: number;
  failedCount: number;
  details: PipDetailDTO[];
}

export interface AuditTrailReportDTO {
  action: string;
  tableName: string;
  recordId: number;
  performedBy: string;
  performedAt: string;
}

export interface DeptPerformanceReportDTO {
  departmentName: string;
  averageScore: number;
  employeeCount: number;
}

export interface PromotionReadinessReportDTO {
  employeeId: number;
  employeeName: string;
  currentPosition: string;
  averageScoreLast3Cycles: number;
  isReady: boolean;
}

export interface KpiItemDetailDTO {
  title: string;
  weight: number;
  achievement: number;
}

export interface EmployeeFeedbackDTO {
  providerName: string;
  rating: number;
  comment: string;
}

export interface EmployeePerformanceSummaryDTO {
  employeeName: string;
  finalScore: number;
  grade: string;
  kpiDetails: KpiItemDetailDTO[];
  feedbackSummary: EmployeeFeedbackDTO[];
}

export interface PerformanceRankingReportDTO {
  rank: number;
  employeeName: string;
  departmentName: string;
  finalScore: number;
  previousScore: number;
  rating: string;
  trend: string;
  isHighPerformer: boolean;
}
