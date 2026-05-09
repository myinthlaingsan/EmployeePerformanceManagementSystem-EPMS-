import { api } from '../../services/api';
import type { ApiResponse } from '../../services/ApiResponse';
import type {
  FeedbackRequestResponse,
  FullFormResponse,
  FeedbackSubmissionRequest,
  FeedbackSummaryResponse,
  FeedbackPreviewItem,
  DepartmentFeedbackConfigDTO,
} from './feedback360Types';

const transformResponse = (response: any) => response.data;

export const feedback360Api = api.injectEndpoints({
  endpoints: (builder) => ({

    // ── EMPLOYEE: My Pending Tasks ─────────────────────────────────────────
    getFeedbackTasks: builder.query<FeedbackRequestResponse[], void>({
      query: () => '/feedback/my-requests',
      transformResponse,
      providesTags: ['FeedbackRequest'],
    }),

    // ── EMPLOYEE: Get Questions for a specific request ────────────────────
    getFeedbackQuestions: builder.query<FullFormResponse, number>({
      query: (requestId) => `/360-feedback/feedbacks/request/${requestId}/questions`,
      transformResponse,
    }),

    // ── EMPLOYEE: Submit feedback ─────────────────────────────────────────
    submitFeedback: builder.mutation<void, FeedbackSubmissionRequest>({
      query: (body) => ({
        url: '/feedback/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeedbackRequest', 'FeedbackSubmission'],
    }),

    // ── EMPLOYEE: My feedback summary (self view) ─────────────────────────
    getMyFeedbackSummary: builder.query<FeedbackSummaryResponse, { targetUserId: number; cycleId: number }>({
      query: ({ targetUserId, cycleId }) => `/feedback/summary/${targetUserId}/${cycleId}`,
      transformResponse,
      providesTags: ['FeedbackSummary'],
    }),

    // ── EMPLOYEE: My submitted feedbacks ─────────────────────────────────
    getMySubmittedFeedbacks: builder.query<any[], number>({
      query: (evaluatorId) => `/360-feedback/feedbacks/my?evaluatorId=${evaluatorId}`,
      transformResponse,
      providesTags: ['FeedbackSubmission'],
    }),

    // ── MANAGER/HR: Feedbacks received by employee ────────────────────────
    getFeedbacksReceivedByEmployee: builder.query<any[], { employeeId: number; cycleId: number }>({
      query: ({ employeeId, cycleId }) =>
        `/360-feedback/feedbacks/employee/${employeeId}?cycleId=${cycleId}`,
      transformResponse,
      providesTags: ['FeedbackSubmission'],
    }),

    // ── HR: Preview requests before generating ────────────────────────────
    previewFeedbackRequests: builder.query<FeedbackPreviewItem[], {
      cycleId: number;
      previousCycleId?: number | null;
      globalMaxLimit?: number;
      excludeLongTermLeave?: boolean;
    }>({
      query: ({ cycleId, previousCycleId, globalMaxLimit = 7, excludeLongTermLeave = true }) => ({
        url: `/feedback/preview`,
        params: { cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave },
      }),
      transformResponse,
    }),

    // ── HR: Generate all requests ─────────────────────────────────────────
    generateFeedbackRequests: builder.mutation<void, {
      cycleId: number;
      previousCycleId?: number | null;
      globalMaxLimit?: number;
      excludeLongTermLeave?: boolean;
    }>({
      query: (params) => ({
        url: '/feedback/generate',
        method: 'POST',
        params,
      }),
      invalidatesTags: ['FeedbackRequest'],
    }),

    // ── HR: Regenerate for one employee ──────────────────────────────────
    regenerateForEmployee: builder.mutation<void, {
      targetEmployeeId: number;
      cycleId: number;
      previousCycleId?: number | null;
      globalMaxLimit?: number;
    }>({
      query: (params) => ({
        url: '/feedback/regenerate-user',
        method: 'POST',
        params,
      }),
      invalidatesTags: ['FeedbackRequest'],
    }),

    // ── HR: Summary management ─────────────────────────────────────────────
    generateSummaryForEmployee: builder.mutation<void, { employeeId: number; cycleId: number }>({
      query: ({ employeeId, cycleId }) => ({
        url: `/360-feedback/summary/generate`,
        method: 'POST',
        params: { employeeId, cycleId },
      }),
      invalidatesTags: ['FeedbackSummary'],
    }),
    generateAllSummaries: builder.mutation<void, number>({
      query: (cycleId) => ({
        url: `/360-feedback/summary/generate-all`,
        method: 'POST',
        params: { cycleId },
      }),
      invalidatesTags: ['FeedbackSummary'],
    }),
    getSummariesByCycle: builder.query<FeedbackSummaryResponse[], number>({
      query: (cycleId) => `/360-feedback/summary/cycle/${cycleId}`,
      transformResponse,
      providesTags: ['FeedbackSummary'],
    }),
    finalizeSummary: builder.mutation<void, number>({
      query: (summaryId) => ({
        url: `/360-feedback/summary/${summaryId}/finalize`,
        method: 'PUT',
      }),
      invalidatesTags: ['FeedbackSummary'],
    }),

    // ── HR: Department Config ─────────────────────────────────────────────
    getFeedbackConfigs: builder.query<DepartmentFeedbackConfigDTO[], void>({
      query: () => '/feedback/config',
      transformResponse,
      providesTags: ['FeedbackConfig'],
    }),
    setFeedbackLimit: builder.mutation<DepartmentFeedbackConfigDTO, {
      deptId: number; levelId: number; maxPeers: number; maxSubs: number;
    }>({
      query: (params) => ({
        url: '/feedback/config/set-limit',
        method: 'POST',
        params,
      }),
      invalidatesTags: ['FeedbackConfig'],
    }),
    updateFeedbackConfig: builder.mutation<any, any>({
      query: (body) => ({
        url: '/api/v1/feedback/configs',
        method: 'POST',
        body
      }),
      invalidatesTags: ['FeedbackConfig']
    })
  }),
});

export const {
  useGetFeedbackTasksQuery,
  useGetFeedbackQuestionsQuery,
  useSubmitFeedbackMutation,
  useGetMyFeedbackSummaryQuery,
  useGetMySubmittedFeedbacksQuery,
  useGetFeedbacksReceivedByEmployeeQuery,
  useLazyPreviewFeedbackRequestsQuery,
  useGenerateFeedbackRequestsMutation,
  useRegenerateForEmployeeMutation,
  useGenerateSummaryForEmployeeMutation,
  useGenerateAllSummariesMutation,
  useGetSummariesByCycleQuery,
  useFinalizeSummaryMutation,
  useGetFeedbackConfigsQuery,
  useSetFeedbackLimitMutation,
  useUpdateFeedbackConfigMutation
} = feedback360Api;
