import { api } from "./api";
import type {
    PipResponse,
    PipCreateRequest,
    PipExtendRequest,
    PipObjectiveResponse,
    PipObjectiveRequest,
    PipProgressResponse,
    PipProgressRequest,
    PipReviewResponse,
    PipReviewRequest,
} from "../features/pip/types";
import {
    ObjectiveStatus,
    PipOutcome
} from "../features/pip/types";
import type { ApiResponse } from "./ApiResponse";

export const pipApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // PIP Endpoints
        getPips: builder.query<PipResponse[], void>({
            query: () => "/pip",
            providesTags: (result) =>
                result
                    ? [...result.map(({ pipId }) => ({ type: "PIP" as const, id: pipId })), { type: "PIP", id: "LIST" }]
                    : [{ type: "PIP", id: "LIST" }],
        }),
        getPipById: builder.query<PipResponse, number>({
            query: (id) => `/pip/${id}`,
            providesTags: (_result, _error, id) => [{ type: "PIP", id }],
        }),
        getPipsByEmployee: builder.query<PipResponse[], number>({
            query: (employeeId) => `/pip/employee/${employeeId}`,
            providesTags: (result) =>
                result
                    ? [...result.map(({ pipId }) => ({ type: "PIP" as const, id: pipId })), { type: "PIP", id: "LIST" }]
                    : [{ type: "PIP", id: "LIST" }],
        }),
        getPipsByInvolvedUser: builder.query<PipResponse[], number>({
            query: (userId) => `/pip/involved/${userId}`,
            providesTags: (result) =>
                result
                    ? [...result.map(({ pipId }) => ({ type: "PIP" as const, id: pipId })), { type: "PIP", id: "LIST" }]
                    : [{ type: "PIP", id: "LIST" }],
        }),
        createPip: builder.mutation<PipResponse, PipCreateRequest>({
            query: (body) => ({
                url: "/pip",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "PIP", id: "LIST" }],
        }),
        activatePip: builder.mutation<void, number>({
            query: (id) => ({
                url: `/pip/${id}/activate`,
                method: "PUT",
            }),
            invalidatesTags: (_result, _error, id) => [{ type: "PIP", id }],
        }),
        extendPip: builder.mutation<PipResponse, { id: number; body: PipExtendRequest }>({
            query: ({ id, body }) => ({
                url: `/pip/${id}/extend`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: "PIP", id }],
        }),

        // Objective Endpoints
        getObjectivesByPip: builder.query<ApiResponse<PipObjectiveResponse[]>, number>({
            query: (pipId) => `/pip/objectives/${pipId}`,
            providesTags: (result) =>
                result?.data
                    ? [...result.data.map(({ objectiveId }) => ({ type: "PipObjective" as const, id: objectiveId })), { type: "PipObjective", id: "LIST" }]
                    : [{ type: "PipObjective", id: "LIST" }],
        }),
        createObjective: builder.mutation<ApiResponse<PipObjectiveResponse>, PipObjectiveRequest>({
            query: (body) => ({
                url: "/pip/objectives",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "PipObjective", id: "LIST" }],
        }),
        updateObjectiveStatus: builder.mutation<ApiResponse<PipObjectiveResponse>, { id: number; status: ObjectiveStatus }>({
            query: ({ id, status }) => ({
                url: `/pip/objectives/${id}/status`,
                method: "PUT",
                params: { status },
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: "PipObjective", id }],
        }),

        // Progress Endpoints
        getProgressByObjective: builder.query<ApiResponse<PipProgressResponse[]>, number>({
            query: (objectiveId) => `/pip/progress/${objectiveId}`,
            providesTags: (result) =>
                result?.data
                    ? [...result.data.map(({ logId }) => ({ type: "PipProgress" as const, id: logId })), { type: "PipProgress", id: "LIST" }]
                    : [{ type: "PipProgress", id: "LIST" }],
        }),
        addProgress: builder.mutation<ApiResponse<PipProgressResponse>, PipProgressRequest>({
            query: (body) => ({
                url: "/pip/progress",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "PipProgress", id: "LIST" }],
        }),

        // Review Endpoints
        getReviewsByPip: builder.query<ApiResponse<PipReviewResponse[]>, number>({
            query: (pipId) => `/pip/reviews/${pipId}`,
            providesTags: (result) =>
                result?.data
                    ? [...result.data.map(({ reviewId }) => ({ type: "PipReview" as const, id: reviewId })), { type: "PipReview", id: "LIST" }]
                    : [{ type: "PipReview", id: "LIST" }],
        }),
        createReview: builder.mutation<ApiResponse<PipReviewResponse>, PipReviewRequest>({
            query: (body) => ({
                url: "/pip/reviews",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "PipReview", id: "LIST" }],
        }),
        finalizePip: builder.mutation<ApiResponse<void>, { pipId: number; outcome: PipOutcome; comment: string }>({
            query: ({ pipId, outcome, comment }) => ({
                url: `/pip/reviews/${pipId}/finalize`,
                method: "PUT",
                params: { outcome, comment },
            }),
            invalidatesTags: (_result, _error, { pipId }) => [{ type: "PIP", id: pipId }],
        }),
        deletePip: builder.mutation<void, number>({
            query: (id) => ({
                url: `/pip/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "PIP", id: "LIST" }],
        }),
    }),
});

export const {
    useGetPipsQuery,
    useGetPipByIdQuery,
    useGetPipsByEmployeeQuery,
    useGetPipsByInvolvedUserQuery,
    useCreatePipMutation,
    useActivatePipMutation,
    useExtendPipMutation,
    useDeletePipMutation,
    useGetObjectivesByPipQuery,
    useCreateObjectiveMutation,
    useUpdateObjectiveStatusMutation,
    useGetProgressByObjectiveQuery,
    useAddProgressMutation,
    useGetReviewsByPipQuery,
    useCreateReviewMutation,
    useFinalizePipMutation,
} = pipApi;
