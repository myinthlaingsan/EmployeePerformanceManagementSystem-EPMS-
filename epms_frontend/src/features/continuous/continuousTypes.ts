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

export const ContinuousStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type ContinuousStatus = typeof ContinuousStatus[keyof typeof ContinuousStatus];

export const ActionItemStatus = {
  PENDING: 'PENDING',
  DONE: 'DONE',
} as const;

export type ActionItemStatus = typeof ActionItemStatus[keyof typeof ActionItemStatus];

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

  status: ContinuousStatus;
  createdBy: number;
  replyCount?: number;
  createdAt: string;
  publishedAt?: string; // Set when the draft is published; null if created directly as published (use createdAt fallback)
}

export interface ContinuousFeedbackRequest {
  employeeId: number;
  managerId: number;
  feedbackType: FeedbackType;
  tagId: number;
  description: string;

  status?: ContinuousStatus;
}

export interface FeedbackReplyResponse {
  replyId: number;
  feedbackId: number;
  employeeId: number;
  employeeName: string;
  replyText: string;
  parentId?: number;
  children?: FeedbackReplyResponse[];
  createdAt: string;
}

export interface FeedbackReplyRequest {
  employeeId: number;
  replyText: string;
  parentId?: number;
}

export interface MeetingActionItemRequest {
  id?: number;
  content: string;
  status?: ActionItemStatus;
  assignedToId?: number;
  dueDate?: string;
}

export interface MeetingActionItemResponse {
  id: number;
  content: string;
  status: ActionItemStatus;
  completedAt?: string;
  reopenReason?: string;
  assignedToId?: number;
  assignedToName?: string;
  dueDate?: string;
}

export interface OneOnOneMeetingResponse {
  meetingId: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  meetingTitle?: string;
  meetingDate: string;
  meetingTime: string;
  discussionPoints: string;
  keyIssues: string;
  actionItems: MeetingActionItemResponse[];
  followUpDate?: string;

  status: ContinuousStatus;
  createdBy: number;
  commentCount?: number;
  createdAt: string;
  publishedAt?: string; // Set when the draft is published; null if created directly as published (use createdAt fallback)
}

export interface OneOnOneMeetingRequest {
  employeeId: number;
  managerId: number;
  meetingTitle?: string;
  meetingDate: string;
  meetingTime: string;
  discussionPoints: string;
  keyIssues: string;
  actionItems: MeetingActionItemRequest[];
  followUpDate?: string;

  status?: ContinuousStatus;
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
  parentId?: number;
  createdAt: string;
}

export interface MeetingCommentRequest {
  employeeId?: number;
  managerId?: number;
  comment: string;
  commentType: CommentType;
  parentId?: number;
}

export interface PerformanceHistoryResponse {
  historyId: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  performerId: number;
  performerName: string;
  sourceType: 'FEEDBACK' | 'MEETING';
  sourceId: number;
  title: string;
  description: string;
  feedbackType?: FeedbackType;
  tagName?: string;

  createdAt: string;
}

export interface ContinuousStatsResponse {
  totalPublished: number;
  totalDraft: number;
}