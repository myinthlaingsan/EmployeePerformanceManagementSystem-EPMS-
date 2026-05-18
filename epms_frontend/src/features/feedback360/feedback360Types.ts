// ── Enums ────────────────────────────────────────────────────────────────────

export const FeedbackRelationship = {
  DIRECT_MANAGER: 'DIRECT_MANAGER',
  PEER:           'PEER',
  SUBORDINATE:    'SUBORDINATE',
  SELF:           'SELF',
} as const;
export type FeedbackRelationship = typeof FeedbackRelationship[keyof typeof FeedbackRelationship];

export const FeedbackStatus = {
  PENDING:     'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED:   'COMPLETED',
  CANCELLED:   'CANCELLED',
} as const;
export type FeedbackStatus = typeof FeedbackStatus[keyof typeof FeedbackStatus];

export type NominationStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED';

// ── Shared ────────────────────────────────────────────────────────────────────

export interface CategoryScore {
  categoryName: string;
  averageScore:  number;
}

export interface DetailedComment {
  categoryName:  string;
  evaluatorRole: string;
  evaluatorName: string;
  comment:       string;
  score:         number | null;
}

export interface CategoryGap {
  categoryName: string;
  selfScore:    number | null;
  othersScore:  number | null;
  gap:          number | null; // self - others
}

export interface ParticipationStat {
  relationship: FeedbackRelationship;
  requested:    number;
  submitted:    number;
  suppressed:   boolean; // true if below threshold
}

// ── Pending Request ───────────────────────────────────────────────────────────

export interface FeedbackRequestResponse {
  id:                       number;
  targetUserId:             number;
  targetUserName:           string;
  targetDepartmentName?:    string;
  evaluatorId:              number;
  evaluatorName:            string;
  evaluatorDepartmentName?: string;
  relationship:             FeedbackRelationship;
  status:                   FeedbackStatus;
  isAnonymous:              boolean;
  isReciprocalFallback?:    boolean;
  dueDate?:                 string; // ISO
  startedAt?:               string; // ISO, present when draft exists
  lastReminderSentAt?:      string;
  formId?:                  number;
  isOverdue?:               boolean; // derived server-side
}

// ── Submission DTOs ───────────────────────────────────────────────────────────

export interface FeedbackResponseRequest {
  questionId: number;
  score?:     number;
  comment?:   string;
}

export interface FeedbackSubmissionRequest {
  requestId:       number;
  overallComment?: string;
  responses:       FeedbackResponseRequest[];
}

export interface FeedbackDraftRequest {
  requestId:       number;
  overallComment?: string;
  responses:       FeedbackResponseRequest[];
}

// ── Summary / Report ──────────────────────────────────────────────────────────

export interface FeedbackSummaryResponse {
  summaryId?:             number;
  targetUserId:           number;
  targetUserName:         string;
  cycleName:              string;
  selfScores:             CategoryScore[];
  managerScores:          CategoryScore[];
  peerScores:             CategoryScore[];
  subordinateScores:      CategoryScore[];
  scores:                 CategoryScore[];
  detailedComments:       DetailedComment[];
  totalAverageScore:      number;
  isFinalized:            boolean;
  selfVsOthersGap?:       CategoryGap[];
  participation?:         ParticipationStat[];
  managerSummary?:        string;
  calibratedFinalScore?:  number | null;
  finalizedAt?:           string;
  finalizedBy?:           string;
}

// ── Received feedback detail ──────────────────────────────────────────────────

export interface FeedbackResponseDetail {
  questionId:   number;
  questionText: string;
  score?:       number;
  comment?:     string;
}

export interface FeedbackDetailsResponse {
  feedbackId:      number;
  requestId:       number;
  relationship:    FeedbackRelationship;
  averageScore?:   number;
  overallComment?: string;
  submittedAt:     string;
  responses:       FeedbackResponseDetail[];
}

// ── Form / Questions ──────────────────────────────────────────────────────────

export interface QuestionDTO {
  questionId:            number;
  questionText:          string;
  questionType:          string;
  secondaryQuestionType: string;
  isRequired:            boolean;
  competencyId?:         number;
  competencyName?:       string;
  weight?:               number;
}

export interface CategoryDTO {
  categoryId:   number;
  categoryName: string;
  questions:    QuestionDTO[];
}

export interface FullFormResponse {
  formId:             number;
  formName:           string;
  formType:           string;
  cycleId:            number;
  cycleName:          string;
  categories:         CategoryDTO[];
  isAssigned:         boolean;
  targetRelationship: FeedbackRelationship;
}

// ── Generation params ─────────────────────────────────────────────────────────

export interface GenerateParams {
  cycleId:              number;
  previousCycleId?:     number;
  globalMaxLimit:       number;
  excludeLongTermLeave: boolean;
}

// ── Scoring Policy ────────────────────────────────────────────────────────────

export interface ScoringPolicy {
  id:                   number;
  cycleId:              number;
  jobLevelId?:          number; // null = cycle default
  managerWeight:        number;
  peerWeight:           number;
  subordinateWeight:    number;
  selfWeight:           number;
  includeSelfInFinal:   boolean;
  suppressionThreshold: number;
}

// ── Competency ────────────────────────────────────────────────────────────────

export interface Competency {
  id:          number;
  name:        string;
  description?: string;
  isActive:    boolean;
}

// ── Nominations ───────────────────────────────────────────────────────────────

export interface EvaluatorNomination {
  id:            number;
  targetUserId:  number;
  nomineeId:     number;
  nomineeName:   string;
  relationship:  FeedbackRelationship;
  status:        NominationStatus;
  nominatedById: number;
  approvedById?: number;
}
