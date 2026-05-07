import { api } from "../../services/api";
import type { ApiResponse } from "../../services/ApiResponse";
import type {
  ContinuousFeedbackResponse,
  ContinuousFeedbackRequest,
  FeedbackReplyResponse,
  FeedbackReplyRequest,
  OneOnOneMeetingResponse,
  OneOnOneMeetingRequest,
  MeetingCommentResponse,
  MeetingCommentRequest,
  FeedbackTagResponse,
  FeedbackTagRequest,
  PerformanceHistoryResponse,
} from "./continuousTypes";
import type { PagedResponse } from "../employee/employeeTypes";

export const continuousApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Feedback Tags
    getAllFeedbacks: builder.query<PagedResponse<ContinuousFeedbackResponse>, { page: number; size: number }>({
      query: ({ page, size }) => `/feedbacks?page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<PagedResponse<ContinuousFeedbackResponse>>) => response.data,
      providesTags: ["ContinuousFeedback" as any],
    }),
    getFeedbackTags: builder.query<FeedbackTagResponse[], void>({
      query: () => "/tags",
      transformResponse: (response: ApiResponse<FeedbackTagResponse[]>) => response.data,
      providesTags: ["FeedbackTag" as any],
    }),
    createFeedbackTag: builder.mutation<FeedbackTagResponse, FeedbackTagRequest>({
      query: (body) => ({
        url: "/tags",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackTagResponse>) => response.data,
      invalidatesTags: ["FeedbackTag" as any],
    }),
    updateFeedbackTag: builder.mutation<FeedbackTagResponse, { id: number; body: FeedbackTagRequest }>({
      query: ({ id, body }) => ({
        url: `/tags/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackTagResponse>) => response.data,
      invalidatesTags: ["FeedbackTag" as any],
    }),
    deleteFeedbackTag: builder.mutation<void, number>({
      query: (id) => ({
        url: `/tags/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FeedbackTag" as any],
    }),

    // Continuous Feedback
    getFeedbacksByEmployee: builder.query<PagedResponse<ContinuousFeedbackResponse>, { employeeId: number; page: number; size: number }>({
      query: ({ employeeId, page, size }) => `/feedbacks/employee/${employeeId}?page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<PagedResponse<ContinuousFeedbackResponse>>) => response.data,
      providesTags: ["ContinuousFeedback" as any],
    }),
    getFeedbacksByManager: builder.query<PagedResponse<ContinuousFeedbackResponse>, { managerId: number; page: number; size: number }>({
      query: ({ managerId, page, size }) => `/feedbacks/manager/${managerId}?page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<PagedResponse<ContinuousFeedbackResponse>>) => response.data,
      providesTags: ["ContinuousFeedback" as any],
    }),
    createFeedback: builder.mutation<ContinuousFeedbackResponse, ContinuousFeedbackRequest>({
      query: (body) => ({
        url: "/feedbacks",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<ContinuousFeedbackResponse>) => response.data,
      invalidatesTags: ["ContinuousFeedback" as any, "PerformanceHistory" as any],
    }),
    updateFeedback: builder.mutation<ContinuousFeedbackResponse, { id: number; body: ContinuousFeedbackRequest }>({
      query: ({ id, body }) => ({
        url: `/feedbacks/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<ContinuousFeedbackResponse>) => response.data,
      invalidatesTags: ["ContinuousFeedback" as any, "PerformanceHistory" as any],
    }),
    deleteFeedback: builder.mutation<void, number>({
      query: (id) => ({
        url: `/feedbacks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ContinuousFeedback" as any, "PerformanceHistory" as any],
    }),

    // Feedback Replies
    getFeedbackReplies: builder.query<FeedbackReplyResponse[], number>({
      query: (feedbackId) => `/feedbacks/${feedbackId}/replies`,
      transformResponse: (response: ApiResponse<FeedbackReplyResponse[]>) => response.data,
      providesTags: (result, error, feedbackId) => [{ type: "FeedbackReply" as any, id: feedbackId }],
    }),
    replyToFeedback: builder.mutation<FeedbackReplyResponse, { feedbackId: number; body: FeedbackReplyRequest }>({
      query: ({ feedbackId, body }) => ({
        url: `/feedbacks/${feedbackId}/replies`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackReplyResponse>) => response.data,
      invalidatesTags: (result, error, { feedbackId }) => [{ type: "FeedbackReply" as any, id: feedbackId }, "PerformanceHistory" as any],
    }),
    deleteReply: builder.mutation<void, { replyId: number; feedbackId: number }>({
      query: ({ replyId }) => ({
        url: `/feedbacks/replies/${replyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { feedbackId }) => [{ type: "FeedbackReply" as any, id: feedbackId }, "PerformanceHistory" as any],
    }),
    updateReply: builder.mutation<FeedbackReplyResponse, { replyId: number; feedbackId: number; body: FeedbackReplyRequest }>({
      query: ({ replyId, body }) => ({
        url: `/feedbacks/replies/${replyId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackReplyResponse>) => response.data,
      invalidatesTags: (result, error, { feedbackId }) => [{ type: "FeedbackReply" as any, id: feedbackId }, "PerformanceHistory" as any],
    }),

    // 1-on-1 Meetings
    getAllMeetings: builder.query<PagedResponse<OneOnOneMeetingResponse>, { page: number; size: number }>({
      query: ({ page, size }) => `/meetings?page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<PagedResponse<OneOnOneMeetingResponse>>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    getMeetingsByEmployee: builder.query<PagedResponse<OneOnOneMeetingResponse>, { employeeId: number; page: number; size: number }>({
      query: ({ employeeId, page, size }) => `/meetings/employee/${employeeId}?page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<PagedResponse<OneOnOneMeetingResponse>>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    getMeetingsByManager: builder.query<PagedResponse<OneOnOneMeetingResponse>, { managerId: number; page: number; size: number }>({
      query: ({ managerId, page, size }) => `/meetings/manager/${managerId}?page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<PagedResponse<OneOnOneMeetingResponse>>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    scheduleMeeting: builder.mutation<OneOnOneMeetingResponse, OneOnOneMeetingRequest>({
      query: (body) => ({
        url: "/meetings",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<OneOnOneMeetingResponse>) => response.data,
      invalidatesTags: ["OneOnOneMeeting" as any, "PerformanceHistory" as any],
    }),
    updateMeeting: builder.mutation<OneOnOneMeetingResponse, { id: number; body: OneOnOneMeetingRequest }>({
      query: ({ id, body }) => ({
        url: `/meetings/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<OneOnOneMeetingResponse>) => response.data,
      invalidatesTags: ["OneOnOneMeeting" as any, "PerformanceHistory" as any],
    }),
    deleteMeeting: builder.mutation<void, number>({
      query: (id) => ({
        url: `/meetings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OneOnOneMeeting" as any, "PerformanceHistory" as any],
    }),

    // Meeting Comments
    getMeetingComments: builder.query<MeetingCommentResponse[], number>({
      query: (meetingId) => `/meetings/${meetingId}/comments`,
      transformResponse: (response: ApiResponse<MeetingCommentResponse[]>) => response.data,
      providesTags: (result, error, meetingId) => [{ type: "MeetingComment" as any, id: meetingId }],
    }),
    addMeetingComment: builder.mutation<MeetingCommentResponse, { meetingId: number; body: MeetingCommentRequest }>({
      query: ({ meetingId, body }) => ({
        url: `/meetings/${meetingId}/comments`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<MeetingCommentResponse>) => response.data,
      invalidatesTags: (result, error, { meetingId }) => [{ type: "MeetingComment" as any, id: meetingId }, "PerformanceHistory" as any],
    }),
    deleteComment: builder.mutation<void, { commentId: number; meetingId: number }>({
      query: ({ commentId }) => ({
        url: `/meetings/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { meetingId }) => [{ type: "MeetingComment" as any, id: meetingId }, "PerformanceHistory" as any],
    }),
    updateComment: builder.mutation<MeetingCommentResponse, { commentId: number; meetingId: number; body: MeetingCommentRequest }>({
      query: ({ commentId, body }) => ({
        url: `/meetings/comments/${commentId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<MeetingCommentResponse>) => response.data,
      invalidatesTags: (result, error, { meetingId }) => [{ type: "MeetingComment" as any, id: meetingId }, "PerformanceHistory" as any],
    }),

    // Performance History
    getPerformanceHistoryByEmployee: builder.query<PagedResponse<PerformanceHistoryResponse>, { employeeId: number; sourceType?: string; page: number; size: number }>({
      query: ({ employeeId, sourceType, page, size }) => {
        let url = `/performance-history/employee/${employeeId}?page=${page}&size=${size}`;
        if (sourceType && sourceType !== 'ALL') url += `&sourceType=${sourceType}`;
        return url;
      },
      transformResponse: (response: ApiResponse<PagedResponse<PerformanceHistoryResponse>>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getAllPerformanceHistory: builder.query<PagedResponse<PerformanceHistoryResponse>, { sourceType?: string; page: number; size: number }>({
      query: ({ sourceType, page, size }) => {
        let url = `/performance-history/all?page=${page}&size=${size}`;
        if (sourceType && sourceType !== 'ALL') url += `&sourceType=${sourceType}`;
        return url;
      },
      transformResponse: (response: ApiResponse<PagedResponse<PerformanceHistoryResponse>>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getPerformanceHistoryAnalytics: builder.query<PerformanceHistoryResponse[], void>({
      query: () => "/performance-history/all/raw",
      transformResponse: (response: ApiResponse<PerformanceHistoryResponse[]>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getEmployeePerformanceHistoryAnalytics: builder.query<PerformanceHistoryResponse[], number>({
      query: (employeeId) => `/performance-history/employee/${employeeId}/raw`,
      transformResponse: (response: ApiResponse<PerformanceHistoryResponse[]>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
  }),
});

export const {
  useGetAllFeedbacksQuery,
  useGetFeedbackTagsQuery,
  useCreateFeedbackTagMutation,
  useUpdateFeedbackTagMutation,
  useDeleteFeedbackTagMutation,
  useGetFeedbacksByEmployeeQuery,
  useGetFeedbacksByManagerQuery,
  useCreateFeedbackMutation,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
  useGetFeedbackRepliesQuery,
  useReplyToFeedbackMutation,
  useDeleteReplyMutation,
  useGetAllMeetingsQuery,
  useGetMeetingsByEmployeeQuery,
  useGetMeetingsByManagerQuery,
  useScheduleMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingCommentsQuery,
  useAddMeetingCommentMutation,
  useDeleteCommentMutation,
  useUpdateReplyMutation,
  useUpdateCommentMutation,
  useGetPerformanceHistoryByEmployeeQuery,
  useGetAllPerformanceHistoryQuery,
  useGetPerformanceHistoryAnalyticsQuery,
  useGetEmployeePerformanceHistoryAnalyticsQuery,
} = continuousApi;
