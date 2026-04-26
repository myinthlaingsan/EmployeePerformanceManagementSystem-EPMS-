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
            query: () => "/v1/pip",
            providesTags: (result) =>
                result
                    ? [...result.map(({ pipId }) => ({ type: "PIP" as const, id: pipId })), { type: "PIP", id: "LIST" }]
                    : [{ type: "PIP", id: "LIST" }],
        }),
        getPipById: builder.query<PipResponse, number>({
            query: (id) => `/v1/pip/${id}`,
            providesTags: (_result, _error, id) => [{ type: "PIP", id }],
        }),
        getPipsByEmployee: builder.query<PipResponse[], number>({
            query: (employeeId) => `/v1/pip/employee/${employeeId}`,
            providesTags: (result) =>
                result
                    ? [...result.map(({ pipId }) => ({ type: "PIP" as const, id: pipId })), { type: "PIP", id: "LIST" }]
                    : [{ type: "PIP", id: "LIST" }],
        }),
        createPip: builder.mutation<PipResponse, PipCreateRequest>({
            query: (body) => ({
                url: "/v1/pip",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "PIP", id: "LIST" }],
        }),
        activatePip: builder.mutation<void, number>({
            query: (id) => ({
                url: `/v1/pip/${id}/activate`,
                method: "PUT",
            }),
            invalidatesTags: (_result, _error, id) => [{ type: "PIP", id }],
        }),
        extendPip: builder.mutation<PipResponse, { id: number; body: PipExtendRequest }>({
            query: ({ id, body }) => ({
                url: `/v1/pip/${id}/extend`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: "PIP", id }],
        }),

        // Objective Endpoints
        getObjectivesByPip: builder.query<ApiResponse<PipObjectiveResponse[]>, number>({
            query: (pipId) => `/v1/pip/objectives/${pipId}`,
            providesTags: (result) =>
                result?.data
                    ? [...result.data.map(({ objectiveId }) => ({ type: "PipObjective" as const, id: objectiveId })), { type: "PipObjective", id: "LIST" }]
                    : [{ type: "PipObjective", id: "LIST" }],
        }),
        createObjective: builder.mutation<ApiResponse<PipObjectiveResponse>, PipObjectiveRequest>({
            query: (body) => ({
                url: "/v1/pip/objectives",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "PipObjective", id: "LIST" }],
        }),
        updateObjectiveStatus: builder.mutation<ApiResponse<PipObjectiveResponse>, { id: number; status: ObjectiveStatus }>({
            query: ({ id, status }) => ({
                url: `/v1/pip/objectives/${id}/status`,
                method: "PUT",
                params: { status },
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: "PipObjective", id }],
        }),

        // Progress Endpoints
        getProgressByObjective: builder.query<ApiResponse<PipProgressResponse[]>, number>({
            query: (objectiveId) => `/v1/pip/progress/${objectiveId}`,
            providesTags: (result) =>
                result?.data
                    ? [...result.data.map(({ logId }) => ({ type: "PipProgress" as const, id: logId })), { type: "PipProgress", id: "LIST" }]
                    : [{ type: "PipProgress", id: "LIST" }],
        }),
        addProgress: builder.mutation<ApiResponse<PipProgressResponse>, PipProgressRequest>({
            query: (body) => ({
                url: "/v1/pip/progress",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "PipProgress", id: "LIST" }],
        }),

        // Review Endpoints
        getReviewsByPip: builder.query<ApiResponse<PipReviewResponse[]>, number>({
            query: (pipId) => `/v1/pip/reviews/${pipId}`,
            providesTags: (result) =>
                result?.data
                    ? [...result.data.map(({ reviewId }) => ({ type: "PipReview" as const, id: reviewId })), { type: "PipReview", id: "LIST" }]
                    : [{ type: "PipReview", id: "LIST" }],
        }),
        createReview: builder.mutation<ApiResponse<PipReviewResponse>, PipReviewRequest>({
            query: (body) => ({
                url: "/v1/pip/reviews",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "PipReview", id: "LIST" }],
        }),
        finalizePip: builder.mutation<ApiResponse<void>, { pipId: number; outcome: PipOutcome; comment: string }>({
            query: ({ pipId, outcome, comment }) => ({
                url: `/v1/pip/reviews/${pipId}/finalize`,
                method: "PUT",
                params: { outcome, comment },
            }),
            invalidatesTags: (_result, _error, { pipId }) => [{ type: "PIP", id: pipId }],
        }),
    }),
});

export const {
    useGetPipsQuery,
    useGetPipByIdQuery,
    useGetPipsByEmployeeQuery,
    useCreatePipMutation,
    useActivatePipMutation,
    useExtendPipMutation,
    useGetObjectivesByPipQuery,
    useCreateObjectiveMutation,
    useUpdateObjectiveStatusMutation,
    useGetProgressByObjectiveQuery,
    useAddProgressMutation,
    useGetReviewsByPipQuery,
    useCreateReviewMutation,
    useFinalizePipMutation,
} = pipApi;
