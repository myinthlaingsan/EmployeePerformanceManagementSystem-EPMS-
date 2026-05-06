import { api } from "../../services/api";
import type { 
  FeedbackRequest, 
  FeedbackSubmission, 
  FeedbackSummary 
} from "./feedback360Types";

export const feedback360Api = api.injectEndpoints({
  endpoints: (builder) => ({
    // Employee endpoints
    getFeedbackTasks: builder.query<FeedbackRequest[], void>({
      query: () => '/feedback/my-requests',
      transformResponse: (response: { data: FeedbackRequest[] }) => response.data,
      providesTags: ['Feedback360'],
    }),
    getFeedbackRequest: builder.query<FeedbackRequest, string>({
      query: (id) => `/feedback/requests/${id}`, // Backend mapping might need checking if this exists
      transformResponse: (response: { data: FeedbackRequest }) => response.data,
      providesTags: (result, error, id) => [{ type: 'Feedback360', id }],
    }),
    submitFeedback: builder.mutation<void, FeedbackSubmission>({
      query: (body) => ({
        url: '/feedback/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Feedback360'],
    }),
    getFeedbackSummary: builder.query<FeedbackSummary, { employeeId: number; cycleId: number }>({
      query: ({ employeeId, cycleId }) => `/feedback/summary/${employeeId}/${cycleId}`,
      transformResponse: (response: { data: FeedbackSummary }) => response.data,
      providesTags: (result, error, { employeeId }) => [{ type: 'Feedback360', id: `SUMMARY-${employeeId}` }],
    }),

    // Admin endpoints
    getFeedbackConfigs: builder.query<any[], void>({
      query: () => '/feedback/config',
      transformResponse: (response: { data: any[] }) => response.data,
      providesTags: ['Feedback360'],
    }),
    updateFeedbackConfig: builder.mutation<void, any>({
      query: (body) => ({
        url: '/feedback/config',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Feedback360'],
    }),
    generateFeedbackRequests: builder.mutation<void, { cycleId: number; previousCycleId?: number }>({
      query: (params) => ({
        url: '/feedback/generate',
        method: 'POST',
        params,
      }),
      invalidatesTags: ['Feedback360'],
    }),
  }),
});

export const {
  useGetFeedbackTasksQuery,
  useGetFeedbackRequestQuery,
  useSubmitFeedbackMutation,
  useGetFeedbackSummaryQuery,
  useGenerateFeedbackRequestsMutation,
  useGetFeedbackConfigsQuery,
  useUpdateFeedbackConfigMutation,
} = feedback360Api;
