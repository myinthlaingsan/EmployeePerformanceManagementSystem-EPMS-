import { api } from '../../services/api';
import type {
  FeedbackRequestResponse,
  FullFormResponse,
  FeedbackSubmissionRequest,
  FeedbackSummaryResponse,
  EvaluatorAssignmentDTO,
  GenerationValidationResponse,
} from './feedback360Types';

// Helper: unwrap the standard { data: ... } ApiResponse wrapper
const transformResponse = (response: any) => response.data;

export const feedback360Api = api.injectEndpoints({
  endpoints: (builder) => ({

    // ── EVALUATOR ENDPOINTS ────────────────────────────────────────────────────

    // Step 4 in lifecycle: Get the logged-in user's pending feedback tasks
    getMyFeedbackRequests: builder.query<FeedbackRequestResponse[], void>({
      query: () => '/feedback/my-requests',
      transformResponse,
      providesTags: ['Feedback'],
    }),

    // Step 5 in lifecycle: Get the form (questions) for a specific request
    getFeedbackForm: builder.query<FullFormResponse, number>({
      query: (requestId) => `/feedback/request/${requestId}/questions`,
      transformResponse,
      providesTags: (_res, _err, requestId) => [{ type: 'Feedback', id: requestId }],
    }),

    // Step 6 in lifecycle: Submit completed feedback form
    submitFeedback: builder.mutation<void, FeedbackSubmissionRequest>({
      query: (body) => ({
        url: '/feedback/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Feedback'],
    }),

    // View a completed feedback summary for a target employee
    getFeedbackSummary: builder.query<FeedbackSummaryResponse, { targetUserId: number; cycleId: number }>({
      query: ({ targetUserId, cycleId }) => `/feedback/summary/${targetUserId}/${cycleId}`,
      transformResponse,
      providesTags: ['FeedbackSummary'],
    }),

    // ── HR / ADMIN ENDPOINTS ───────────────────────────────────────────────────

    // Preview requests before saving (dry-run)
    previewFeedbackRequests: builder.query<FeedbackRequestResponse[], {
      cycleId: number;
      previousCycleId?: number;
      globalMaxLimit?: number;
      excludeLongTermLeave?: boolean;
    }>({
      query: ({ cycleId, previousCycleId, globalMaxLimit = 7, excludeLongTermLeave = true }) => ({
        url: '/feedback/preview',
        params: { cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave },
      }),
      transformResponse,
    }),

    // Generate and save all feedback requests for a cycle
    generateFeedbackRequests: builder.mutation<void, {
      cycleId: number;
      previousCycleId?: number;
      globalMaxLimit?: number;
      excludeLongTermLeave?: boolean;
    }>({
      query: ({ cycleId, previousCycleId, globalMaxLimit = 7, excludeLongTermLeave = true }) => ({
        url: '/feedback/generate',
        method: 'POST',
        params: { cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave },
      }),
      invalidatesTags: ['Feedback', 'Cycle'],
    }),

    // Regenerate for a single employee
    regenerateEmployeeFeedback: builder.mutation<void, {
      targetEmployeeId: number;
      cycleId: number;
      previousCycleId?: number;
      globalMaxLimit?: number;
    }>({
      query: (params) => ({
        url: '/feedback/regenerate-user',
        method: 'POST',
        params,
      }),
      invalidatesTags: ['Feedback'],
    }),

    // Generate all FeedbackSummary records for a cycle
    generateAllSummaries: builder.mutation<void, number>({
      query: (cycleId) => ({
        url: '/360-feedback/summary/generate-all',
        method: 'POST',
        params: { cycleId },
      }),
      invalidatesTags: ['FeedbackSummary'],
    }),

    // Get all summaries for a cycle (HR list view)
    getSummariesByCycle: builder.query<FeedbackSummaryResponse[], number>({
      query: (cycleId) => `/360-feedback/summary/cycle/${cycleId}`,
      transformResponse,
      providesTags: ['FeedbackSummary'],
    }),

    // Finalize a summary (lock it)
    finalizeSummary: builder.mutation<void, number>({
      query: (summaryId) => ({
        url: `/360-feedback/summary/${summaryId}/finalize`,
        method: 'PUT',
      }),
      invalidatesTags: ['FeedbackSummary'],
    }),

    // Rotation Preview (Top Management → L04)
    previewRotationAssignments: builder.query<EvaluatorAssignmentDTO[], {
      currentCycleId: number;
      previousCycleId?: number;
    }>({
      query: ({ currentCycleId, previousCycleId }) => ({
        url: '/feedback/rotation/preview',
        params: { currentCycleId, previousCycleId },
      }),
      transformResponse,
    }),

    // Finalize the evaluator population for a cycle (moves status to FINALIZED)
    finalizeEvaluators: builder.mutation<void, number>({
      query: (cycleId) => ({
        url: '/feedback/finalize-evaluators',
        method: 'POST',
        params: { cycleId },
      }),
      invalidatesTags: ['Cycle'],
    }),

    resetCycleStatus: builder.mutation<void, number>({
      query: (cycleId) => ({
        url: '/feedback/reset-status',
        method: 'POST',
        params: { cycleId },
      }),
      invalidatesTags: ['Cycle', 'Feedback'],
    }),

    validateGeneration: builder.query<GenerationValidationResponse, { cycleId: number; excludeLongTermLeave?: boolean }>({
      query: ({ cycleId, excludeLongTermLeave = true }) => ({
        url: `/feedback/validate-generation/${cycleId}`,
        params: { excludeLongTermLeave },
      }),
    }),

    // Form Builder Endpoints
    getFeedbackFormByCycle: builder.query<FullFormResponse, number>({
      query: (cycleId) => `/feedback/form/cycle/${cycleId}`,
      transformResponse,
      providesTags: (_res, _err, cycleId) => [{ type: 'Cycle', id: cycleId }],
    }),

    saveFeedbackForm: builder.mutation<number, { cycleId: number; body: any }>({
      query: ({ cycleId, body }) => ({
        url: `/feedback/form/cycle/${cycleId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { cycleId }) => [{ type: 'Cycle', id: cycleId }],
    }),
  }),
});

export const {
  useGetMyFeedbackRequestsQuery,
  useGetFeedbackFormQuery,
  useSubmitFeedbackMutation,
  useGetFeedbackSummaryQuery,
  usePreviewFeedbackRequestsQuery,
  useGenerateFeedbackRequestsMutation,
  useRegenerateEmployeeFeedbackMutation,
  useGenerateAllSummariesMutation,
  useGetSummariesByCycleQuery,
  useFinalizeSummaryMutation,
  usePreviewRotationAssignmentsQuery,
  useFinalizeEvaluatorsMutation,
  useResetCycleStatusMutation,
  useValidateGenerationQuery,
  useGetFeedbackFormByCycleQuery,
  useSaveFeedbackFormMutation,
} = feedback360Api;
