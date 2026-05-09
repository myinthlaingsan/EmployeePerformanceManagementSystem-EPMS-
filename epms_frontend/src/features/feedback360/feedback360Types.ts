export type FeedbackRelationship = 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE' | 'SUPERIOR';
export type FeedbackStatus = 'PENDING' | 'SUBMITTED' | 'DECLINED';
export type FormType = 'SELF_ASSESSMENT' | 'MANAGER_EVALUATION' | 'FEEDBACK';

// GET /api/v1/feedback/my-requests
export interface FeedbackRequestResponse {
  id: number;
  targetUserId: number;
  targetUserName: string;
  evaluatorId: number;
  evaluatorName: string;
  cycleId: number;
  relationship: FeedbackRelationship;
  status: FeedbackStatus;
  targetDepartmentName: string;
  evaluatorDepartmentName: string;
  isAnonymous: boolean;
  isReciprocalFallback: boolean;
  formTemplateId?: string | number;
}

// GET /api/v1/360-feedback/feedbacks/request/{requestId}/questions
export interface QuestionDTO {
  questionId: number;
  questionText: string;
  questionType: 'RATING' | 'TEXT' | 'NUMBER';
  isRequired: boolean;
}

export interface CategoryDTO {
  categoryId: number;
  categoryName: string;
  questions: QuestionDTO[];
}

export interface FullFormResponse {
  formId: number;
  formName: string;
  formType: FormType;
  categories: CategoryDTO[];
}

// POST /api/v1/feedback/submit
export interface FeedbackResponseRequest {
  questionId: number;
  score: number;           // rating value
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
  averageScore: number;
}

export interface DetailedComment {
  categoryName: string;
  evaluatorRole: string;   // e.g. "PEER", masked
  evaluatorName: string;   // "Anonymous Peer 1"
  comment: string;
  score: number;
}

export interface FeedbackSummaryResponse {
  summaryId: number;
  targetUserId: number;
  targetUserName: string;
  cycleName: string;
  selfScores: CategoryScore[];
  scores: CategoryScore[];           // All evaluator average scores
  detailedComments: DetailedComment[];
  totalAverageScore: number;
  totalEvaluators: number;
  isFinalized: boolean;
}

// HR: Preview request structure
export interface FeedbackPreviewItem {
  id: number;
  targetUserId: number;
  targetUserName: string;
  targetDepartmentName: string;
  evaluatorId: number;
  evaluatorName: string;
  evaluatorDepartmentName: string;
  relationship: FeedbackRelationship;
  status: FeedbackStatus;
  isAnonymous: boolean;
  isReciprocalFallback: boolean;
}

// HR: Department Config
export interface DepartmentFeedbackConfigDTO {
  departmentId: number;
  departmentName?: string;
  levelId: number;
  levelName?: string;
  minPeers: number;
  maxPeers: number;
  minSubordinates: number;
  maxSubordinates: number;
  allowCrossDepartment: boolean;
}
