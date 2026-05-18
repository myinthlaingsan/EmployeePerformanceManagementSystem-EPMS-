import { api } from '../../services/api';
import type { ApiResponse } from '../../services/ApiResponse';
import type {
  FeedbackRequestResponse,
  FeedbackSubmissionRequest,
  FeedbackDraftRequest,
  FeedbackSummaryResponse,
  FeedbackDetailsResponse,
  FullFormResponse,
  GenerateParams,
  ScoringPolicy,
  Competency,
  EvaluatorNomination,
  FeedbackRelationship,
} from './feedback360Types';

export const feedback360Api = api.injectEndpoints({
  endpoints: (builder) => ({

    // ── Evaluator: my pending/all requests ─────────────────────────────────
    getMyFeedbackRequests: builder.query<FeedbackRequestResponse[], void>({
      query: () => '/feedback/my-requests',
      transformResponse: (res: ApiResponse<FeedbackRequestResponse[]>) => res.data,
      providesTags: ['Feedback360Request' as any],
    }),

    // ── Evaluator: get form questions for a request ────────────────────────
    getFormQuestions: builder.query<FullFormResponse, number>({
      query: (requestId) => `/360-feedback/feedbacks/request/${requestId}/questions`,
      transformResponse: (res: ApiResponse<FullFormResponse>) => res.data,
    }),

    // ── Evaluator: submit feedback ─────────────────────────────────────────
    submitFeedback: builder.mutation<void, FeedbackSubmissionRequest>({
      query: (body) => ({
        url: '/feedback/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Feedback360Request' as any, 'Feedback360Summary' as any],
    }),

    // ── Evaluator: save draft ─────────────────────────────────────────────
    saveFeedbackDraft: builder.mutation<void, FeedbackDraftRequest>({
      query: (body) => ({ url: '/feedback/draft', method: 'PUT', body }),
      invalidatesTags: ['Feedback360Request' as any],
    }),

    // ── Evaluator: get draft for resume ───────────────────────────────────
    getFeedbackDraft: builder.query<FeedbackDraftRequest | null, number>({
      query: (requestId) => `/feedback/draft/${requestId}`,
      transformResponse: (res: ApiResponse<FeedbackDraftRequest | null>) => res.data,
    }),

    // ── HR: cancel a request ──────────────────────────────────────────────
    cancelFeedbackRequest: builder.mutation<void, number>({
      query: (requestId) => ({
        url: `/feedback/request/${requestId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Feedback360Request' as any],
    }),

    // ── HR: reassign a request ────────────────────────────────────────────
    reassignFeedbackRequest: builder.mutation<void, { requestId: number; newEvaluatorId: number }>({
      query: ({ requestId, newEvaluatorId }) => ({
        url: `/feedback/request/${requestId}/reassign`,
        method: 'POST',
        body: { newEvaluatorId },
      }),
      invalidatesTags: ['Feedback360Request' as any],
    }),

    // ── Employee: received feedback details ───────────────────────────────
    getReceivedFeedback: builder.query<FeedbackDetailsResponse[], { employeeId: number; cycleId: number }>({
      query: ({ employeeId, cycleId }) =>
        `/360-feedback/feedbacks/employee/${employeeId}?cycleId=${cycleId}`,
      transformResponse: (res: ApiResponse<FeedbackDetailsResponse[]>) => res.data,
      providesTags: ['Feedback360Summary' as any],
    }),

    // ── Employee/HR: summary report ───────────────────────────────────────
    getFeedbackSummary: builder.query<FeedbackSummaryResponse, { targetUserId: number; cycleId: number }>({
      query: ({ targetUserId, cycleId }) =>
        `/feedback/summary/${targetUserId}/${cycleId}`,
      transformResponse: (res: ApiResponse<FeedbackSummaryResponse>) => res.data,
      providesTags: ['Feedback360Summary' as any],
    }),

    // ── HR: all summaries for a cycle ─────────────────────────────────────
    getAllSummariesByCycle: builder.query<FeedbackSummaryResponse[], number>({
      query: (cycleId) => `/360-feedback/summary/cycle/${cycleId}`,
      transformResponse: (res: ApiResponse<FeedbackSummaryResponse[]>) => res.data,
      providesTags: ['Feedback360Summary' as any],
    }),

    // ── HR: preview generation ────────────────────────────────────────────
    previewFeedbackRequests: builder.query<FeedbackRequestResponse[], GenerateParams>({
      query: ({ cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave }) => {
        let url = `/feedback/preview?cycleId=${cycleId}&globalMaxLimit=${globalMaxLimit}&excludeLongTermLeave=${excludeLongTermLeave}`;
        if (previousCycleId) url += `&previousCycleId=${previousCycleId}`;
        return url;
      },
      transformResponse: (res: ApiResponse<FeedbackRequestResponse[]>) => res.data,
      providesTags: ['Feedback360Preview' as any],
    }),

    // ── HR: generate requests ─────────────────────────────────────────────
    generateFeedbackRequests: builder.mutation<void, GenerateParams>({
      query: ({ cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave }) => ({
        url: `/feedback/generate?cycleId=${cycleId}&globalMaxLimit=${globalMaxLimit}&excludeLongTermLeave=${excludeLongTermLeave}${previousCycleId ? `&previousCycleId=${previousCycleId}` : ''}`,
        method: 'POST',
      }),
      invalidatesTags: ['Feedback360Request' as any, 'Feedback360Summary' as any],
    }),

    // ── HR: regenerate for a specific user ────────────────────────────────
    regenerateUserRequests: builder.mutation<void, { targetEmployeeId: number; cycleId: number; previousCycleId?: number; globalMaxLimit: number }>({
      query: ({ targetEmployeeId, cycleId, previousCycleId, globalMaxLimit }) => ({
        url: `/feedback/regenerate-user?targetEmployeeId=${targetEmployeeId}&cycleId=${cycleId}&globalMaxLimit=${globalMaxLimit}${previousCycleId ? `&previousCycleId=${previousCycleId}` : ''}`,
        method: 'POST',
      }),
      invalidatesTags: ['Feedback360Request' as any],
    }),

    // ── HR: generate all summaries ────────────────────────────────────────
    generateAllSummaries: builder.mutation<void, number>({
      query: (cycleId) => ({
        url: `/360-feedback/summary/generate-all?cycleId=${cycleId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Feedback360Summary' as any],
    }),

    // ── HR: finalize a summary ────────────────────────────────────────────
    finalizeSummary: builder.mutation<void, number>({
      query: (summaryId) => ({
        url: `/360-feedback/summary/${summaryId}/finalize`,
        method: 'PUT',
      }),
      invalidatesTags: ['Feedback360Summary' as any],
    }),

    // ── HR/Manager: post calibration + manager summary ────────────────────
    postManagerSummary: builder.mutation<void, { summaryId: number; managerSummary: string; calibratedFinalScore?: number }>({
      query: ({ summaryId, ...body }) => ({
        url: `/360-feedback/summary/${summaryId}/manager-review`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Feedback360Summary' as any],
    }),

    // ── HR: scoring policies for a cycle ─────────────────────────────────
    getScoringPolicies: builder.query<ScoringPolicy[], number>({
      query: (cycleId) => `/scoring-policy?cycleId=${cycleId}`,
      transformResponse: (res: ApiResponse<ScoringPolicy[]>) => res.data,
      providesTags: ['ScoringPolicy' as any],
    }),

    // ── HR: upsert scoring policy ─────────────────────────────────────────
    upsertScoringPolicy: builder.mutation<ScoringPolicy, Partial<ScoringPolicy> & { cycleId: number }>({
      query: (body) => ({ url: '/scoring-policy', method: 'PUT', body }),
      transformResponse: (res: ApiResponse<ScoringPolicy>) => res.data,
      invalidatesTags: ['ScoringPolicy' as any, 'Feedback360Summary' as any],
    }),

    // ── HR: competencies ─────────────────────────────────────────────────
    getCompetencies: builder.query<Competency[], void>({
      query: () => '/competency',
      transformResponse: (res: ApiResponse<Competency[]>) => res.data,
      providesTags: ['Competency' as any],
    }),

    createCompetency: builder.mutation<Competency, Pick<Competency, 'name' | 'description'>>({
      query: (body) => ({ url: '/competency', method: 'POST', body }),
      transformResponse: (res: ApiResponse<Competency>) => res.data,
      invalidatesTags: ['Competency' as any],
    }),

    updateCompetency: builder.mutation<Competency, Partial<Competency> & { id: number }>({
      query: ({ id, ...body }) => ({ url: `/competency/${id}`, method: 'PUT', body }),
      transformResponse: (res: ApiResponse<Competency>) => res.data,
      invalidatesTags: ['Competency' as any],
    }),

    deleteCompetency: builder.mutation<void, number>({
      query: (id) => ({ url: `/competency/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Competency' as any],
    }),

    // ── Nominations (Phase 4) ─────────────────────────────────────────────
    proposeNomination: builder.mutation<void, { targetUserId: number; nomineeId: number; relationship: FeedbackRelationship }>({
      query: (body) => ({ url: '/feedback/nomination', method: 'POST', body }),
      invalidatesTags: ['Nomination' as any],
    }),

    listMyNominations: builder.query<EvaluatorNomination[], void>({
      query: () => '/feedback/nomination/mine',
      transformResponse: (res: ApiResponse<EvaluatorNomination[]>) => res.data,
      providesTags: ['Nomination' as any],
    }),

    approveNomination: builder.mutation<void, number>({
      query: (id) => ({ url: `/feedback/nomination/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Nomination' as any],
    }),

    rejectNomination: builder.mutation<void, number>({
      query: (id) => ({ url: `/feedback/nomination/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['Nomination' as any],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyFeedbackRequestsQuery,
  useGetFormQuestionsQuery,
  useSubmitFeedbackMutation,
  useSaveFeedbackDraftMutation,
  useGetFeedbackDraftQuery,
  useCancelFeedbackRequestMutation,
  useReassignFeedbackRequestMutation,
  useGetReceivedFeedbackQuery,
  useGetFeedbackSummaryQuery,
  useGetAllSummariesByCycleQuery,
  useLazyPreviewFeedbackRequestsQuery,
  useGenerateFeedbackRequestsMutation,
  useRegenerateUserRequestsMutation,
  useGenerateAllSummariesMutation,
  useFinalizeSummaryMutation,
  usePostManagerSummaryMutation,
  useGetScoringPoliciesQuery,
  useUpsertScoringPolicyMutation,
  useGetCompetenciesQuery,
  useCreateCompetencyMutation,
  useUpdateCompetencyMutation,
  useDeleteCompetencyMutation,
  useProposeNominationMutation,
  useListMyNominationsQuery,
  useApproveNominationMutation,
  useRejectNominationMutation,
} = feedback360Api;
