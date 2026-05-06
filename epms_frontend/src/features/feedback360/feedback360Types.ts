import type { FormTemplate } from "../../types/form";

export type FeedbackStatus = 'PENDING' | 'SUBMITTED' | 'EXPIRED';

export interface FeedbackRequest {
  id: string;
  subjectId: string;
  subjectName: string;
  evaluatorId: string;
  evaluatorName: string;
  status: FeedbackStatus;
  formTemplateId: string;
  dueDate: string;
  relationship: 'PEER' | 'SUBORDINATE' | 'MANAGER';
}

export interface FeedbackSubmission {
  requestId: string;
  responses: {
    questionId: string;
    rating?: number;
    comment?: string;
  }[];
}

export interface FeedbackSummary {
  subjectId: string;
  averageScore: number;
  totalEvaluations: number;
  categoryScores: {
    categoryName: string;
    score: number;
  }[];
}
