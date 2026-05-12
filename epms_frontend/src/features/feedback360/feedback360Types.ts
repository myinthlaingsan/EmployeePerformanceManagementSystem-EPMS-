// ─── Request / Response shapes that mirror the backend DTOs ───────────────────

export type FeedbackRelationship = 'SELF' | 'MANAGER' | 'SUPERIOR' | 'PEER' | 'SUBORDINATE';
export type FeedbackStatus = 'PENDING' | 'COMPLETED' | 'DECLINED';

// GET /api/v1/feedback/my-requests
export interface FeedbackRequestResponse {
  id: number;
  targetUserId: number;
  targetUserName: string;
  targetDepartmentName: string;
  targetLevelCode?: string;
  evaluatorId: number;
  evaluatorName: string;
  evaluatorDepartmentName?: string;
  evaluatorLevelCode?: string;
  relationship: FeedbackRelationship;
  status: FeedbackStatus;
  isAnonymous: boolean;
  cycleId: number;
  formId?: number;
}

// GET /api/v1/360-feedback/feedbacks/request/{id}/questions
export interface FormField {
  questionId: number;
  questionText: string;
  questionType: string;
  categoryName?: string;
}

export interface CategoryDTO {
  categoryId: number;
  categoryName: string;
  questions: FormField[];
}

export interface FullFormResponse {
  formId: number;
  formName: string;
  categories: CategoryDTO[];
}

// POST /api/v1/feedback/submit — Request body
export interface FeedbackResponseRequest {
  questionId: number;
  score: number;       // 1–5
  comment?: string;
}

export interface FeedbackSubmissionRequest {
  requestId: number;
  overallComment?: string;
  responses: FeedbackResponseRequest[];
}

// GET /api/v1/feedback/summary/{targetUserId}/{cycleId}
export interface CategoryScore {
  categoryName: string;
  averageScore: number;  // 0–100
}

export interface DetailedComment {
  categoryName: string;
  evaluatorRole: string;
  evaluatorName: string;
  comment: string;
  score: number;
}

export interface FeedbackSummaryResponse {
  summaryId?: number;
  targetUserId: number;
  targetUserName: string;
  cycleName: string;
  selfScores: CategoryScore[];
  scores: CategoryScore[];       // Others (Mgr, Peer, Sub) aggregate
  detailedComments: DetailedComment[];
  totalAverageScore: number;
  isFinalized: boolean;
}

// HR — Evaluator Assignment Preview
export interface EvaluatorAssignmentDTO {
  targetEmployeeId: number;
  targetEmployeeName: string;
  targetLevelCode: string;
  evaluatorId: number;
  evaluatorName: string;
  evaluatorLevelCode: string;
  cycleId: number;
  cycleName: string;
  roundRobinFallback: boolean;
}

export interface GenerationValidationResponse {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface QuestionPayload {
  questionText: string;
  questionType: 'RATING' | 'TEXT' | 'YESNO';
  isRequired: boolean;
  requiresComment?: boolean;
}

export interface CategoryPayload {
  categoryName: string;
  questions: QuestionPayload[];
}

export interface FeedbackFormCreationRequest {
  formName: string;
  categories: CategoryPayload[];
}
