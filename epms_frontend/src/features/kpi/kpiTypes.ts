// ==================== Enums ====================
export type KpiGoalStatus = 'DRAFT' | 'APPROVED' | 'LOCKED' | 'ARCHIVED';

export type KpiItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// ==================== Category ====================
export interface KpiCategory {
  id: number;
  name?: string;           // Depends on entity field
  categoryName?: string;   // Alternative name
}

// ==================== KPI Library ====================
export interface KpiLibraryDetailRequest {
  goalTitle: string;
  unit?: string;
  targetValue: number;
  weightPercent: number;
  categoryId: number;
}

export interface KpiLibraryRequest {
  title: string;
  description?: string;
  positionId: number;
  targetLevelId?: number;
  details: KpiLibraryDetailRequest[];
}

export interface KpiLibraryDetailResponse {
  id: number;
  goalTitle: string;
  unit?: string;
  targetValue: number;
  weightPercent: number;
  isActive: boolean;
  categoryId?: number;
  categoryName?: string;
}

export interface KpiLibraryResponse {
  id: number;
  title: string;
  description?: string;
  positionId?: number;
  positionName: string;
  targetLevelId?: number;
  levelName?: string;
  isActive: boolean;
  details: KpiLibraryDetailResponse[];
}

// ==================== Goal Assignment ====================
export interface GoalAssignmentRequest {
  employeeId: number;
  libraryId?: number;
  appraisalCycleId: number;
  overwriteExisting?: boolean;
}

export interface BulkGoalAssignmentRequest {
  employeeIds: number[];
  libraryId: number;
  appraisalCycleId: number;
  overwriteExisting?: boolean;
}

export interface AssignmentResult {
  employeeId: number;
  employeeName: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  reason: string;
}

export interface BulkAssignmentResponse {
  totalProcessed: number;
  successfulCount: number;
  failedCount: number;
  skippedCount: number;
  results: AssignmentResult[];
}

// ==================== Goal Items ====================
export interface KpiGoalItemRequest {
  title: string;
  unit: string;
  targetValue: number;
  weightPercent: number;
  categoryId: number;
}

export interface GoalItemResponse {
  id: number;
  title: string;
  description?: string;
  targetValue: number;
  unit?: string;
  weightPercent: number;
  status: KpiItemStatus;
  currentProgress?: number;
  categoryId?: number;
  categoryName?: string;
}

export interface KpiGoalBulkUpdateRequest {
  items: {
    id: number;
    title: string;
    unit: string;
    targetValue: number;
    weightPercent: number;
    categoryId: number;
  }[];
}

// ==================== Goal Set ====================
export interface GoalSetResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  appraisalCycleId: number;
  appraisalCycleName?: string;
  status: KpiGoalStatus;
  items: GoalItemResponse[];
}

// ==================== Progress ====================
export interface ProgressRequest {
  goalItemId: number;
  actualValue: number;
  progressPercent: number;
  evidenceNote?: string;
}

export interface KpiProgressHistory {
  id: number;
  goalItemId: number;
  goalTitle: string;
  actualValue: number;
  progressPercent: number;
  evidenceNote?: string;
  updatedAt: string;
}

// ==================== Revision ====================
export interface KpiRevisionRequest {
  changeReason: string;
  updatedDetails: KpiLibraryDetailRequest;
}

// ==================== Score ====================
export interface KpiScoreResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  cycleId: number;
  totalAchievementPercent?: number;
  weightedScore: number;
  calculatedAt: string;
}

// ==================== History Log ====================
export interface KpiHistoryLog {
  id: number;
  employeeId: number;
  oldVersionId: number;
  newVersionId: number;
  action: string;
  changeReason: string;
  changeDetails?: string;
  changedBy: number;
  createdAt: string;
}