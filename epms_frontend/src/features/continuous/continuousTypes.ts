export const FeedbackType = {
  PRAISE: 'PRAISE',
  IMPROVEMENT: 'IMPROVEMENT',
  WARNING: 'WARNING',
} as const;

export type FeedbackType = typeof FeedbackType[keyof typeof FeedbackType];

export const CommentType = {
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type CommentType = typeof CommentType[keyof typeof CommentType];

export interface FeedbackTagResponse {
  tagId: number;
  tagName: string;
}

export interface FeedbackTagRequest {
  tagName: string;
}

export interface ContinuousFeedbackResponse {
  feedbackId: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  feedbackType: FeedbackType;
  tag: FeedbackTagResponse;
  description: string;
  isPrivate: boolean;
  createdBy: number;
  createdAt: string;
}

export interface ContinuousFeedbackRequest {
  employeeId: number;
  managerId: number;
  feedbackType: FeedbackType;
  tagId: number;
  description: string;
  isPrivate: boolean;
}

export interface FeedbackReplyResponse {
  replyId: number;
  feedbackId: number;
  employeeId: number;
  employeeName: string;
  replyText: string;
  createdAt: string;
}

export interface FeedbackReplyRequest {
  employeeId: number;
  replyText: string;
}

export interface OneOnOneMeetingResponse {
  meetingId: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  meetingDate: string;
  meetingTime: string;
  discussionPoints: string;
  keyIssues: string;
  actionItems: string;
  followUpDate?: string;
  isPrivateNote: boolean;
  createdBy: number;
  createdAt: string;
}

export interface OneOnOneMeetingRequest {
  employeeId: number;
  managerId: number;
  meetingDate: string;
  meetingTime: string;
  discussionPoints: string;
  keyIssues: string;
  actionItems: string;
  followUpDate?: string;
  isPrivateNote: boolean;
}

export interface MeetingCommentResponse {
  id: number;
  meetingId: number;
  employeeId?: number;
  employeeName?: string;
  managerId?: number;
  managerName?: string;
  comment: string;
  commentType: CommentType;
  createdAt: string;
}

export interface MeetingCommentRequest {
  employeeId?: number;
  managerId?: number;
  comment: string;
  commentType: CommentType;
}

export interface PerformanceHistoryResponse {
  historyId: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  sourceType: 'FEEDBACK' | 'MEETING';
  sourceId: number;
  title: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
}
