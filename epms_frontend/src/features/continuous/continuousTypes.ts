export const FeedbackType = {
  POSITIVE: 'POSITIVE',
  CONSTRUCTIVE: 'CONSTRUCTIVE',
  IMPROVEMENT: 'IMPROVEMENT',
} as const;

export type FeedbackType = typeof FeedbackType[keyof typeof FeedbackType];

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
  repliedBy: number;
  replierName: string;
  replyText: string;
  createdAt: string;
}

export interface FeedbackReplyRequest {
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
  commentId: number;
  meetingId: number;
  commentedBy: number;
  commenterName: string;
  commentText: string;
  isInternal: boolean;
  createdAt: string;
}

export interface MeetingCommentRequest {
  commentText: string;
  isInternal: boolean;
}
