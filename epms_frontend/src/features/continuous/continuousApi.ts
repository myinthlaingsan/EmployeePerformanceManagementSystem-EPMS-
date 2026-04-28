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
} from "./continuousTypes";

export const continuousApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Feedback Tags
    getAllFeedbacks: builder.query<ContinuousFeedbackResponse[], void>({
      query: () => "/feedbacks",
      transformResponse: (response: ApiResponse<ContinuousFeedbackResponse[]>) => response.data,
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

    // Continuous Feedback
    getFeedbacksByEmployee: builder.query<ContinuousFeedbackResponse[], number>({
      query: (employeeId) => `/feedbacks/employee/${employeeId}`,
      transformResponse: (response: ApiResponse<ContinuousFeedbackResponse[]>) => response.data,
      providesTags: (result) =>
        result
          ? [...result.map(({ feedbackId }) => ({ type: "ContinuousFeedback" as any, id: feedbackId })), "ContinuousFeedback" as any]
          : ["ContinuousFeedback" as any],
    }),
    getFeedbacksByManager: builder.query<ContinuousFeedbackResponse[], number>({
      query: (managerId) => `/feedbacks/manager/${managerId}`,
      transformResponse: (response: ApiResponse<ContinuousFeedbackResponse[]>) => response.data,
      providesTags: ["ContinuousFeedback" as any],
    }),
    createFeedback: builder.mutation<ContinuousFeedbackResponse, ContinuousFeedbackRequest>({
      query: (body) => ({
        url: "/feedbacks",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<ContinuousFeedbackResponse>) => response.data,
      invalidatesTags: ["ContinuousFeedback" as any],
    }),
    deleteFeedback: builder.mutation<void, number>({
      query: (id) => ({
        url: `/feedbacks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ContinuousFeedback" as any],
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
      invalidatesTags: (result, error, { feedbackId }) => [{ type: "FeedbackReply" as any, id: feedbackId }],
    }),

    // 1-on-1 Meetings
    getAllMeetings: builder.query<OneOnOneMeetingResponse[], void>({
      query: () => "/meetings",
      transformResponse: (response: ApiResponse<OneOnOneMeetingResponse[]>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    getMeetingsByEmployee: builder.query<OneOnOneMeetingResponse[], number>({
      query: (employeeId) => `/meetings/employee/${employeeId}`,
      transformResponse: (response: ApiResponse<OneOnOneMeetingResponse[]>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    getMeetingsByManager: builder.query<OneOnOneMeetingResponse[], number>({
      query: (managerId) => `/meetings/manager/${managerId}`,
      transformResponse: (response: ApiResponse<OneOnOneMeetingResponse[]>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    scheduleMeeting: builder.mutation<OneOnOneMeetingResponse, OneOnOneMeetingRequest>({
      query: (body) => ({
        url: "/meetings",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<OneOnOneMeetingResponse>) => response.data,
      invalidatesTags: ["OneOnOneMeeting" as any],
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
      invalidatesTags: (result, error, { meetingId }) => [{ type: "MeetingComment" as any, id: meetingId }],
    }),
  }),
});

export const {
  useGetAllFeedbacksQuery,
  useGetFeedbackTagsQuery,
  useCreateFeedbackTagMutation,
  useGetFeedbacksByEmployeeQuery,
  useGetFeedbacksByManagerQuery,
  useCreateFeedbackMutation,
  useDeleteFeedbackMutation,
  useGetFeedbackRepliesQuery,
  useReplyToFeedbackMutation,
  useGetAllMeetingsQuery,
  useGetMeetingsByEmployeeQuery,
  useGetMeetingsByManagerQuery,
  useScheduleMeetingMutation,
  useGetMeetingCommentsQuery,
  useAddMeetingCommentMutation,
} = continuousApi;
