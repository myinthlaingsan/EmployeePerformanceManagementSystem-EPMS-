import { createApi } from '@reduxjs/toolkit/query/react';
import {type ApiResponse } from '../../services/ApiResponse.ts';
import { baseQueryWithReauth } from '../../services/baseQueryWithReauth';
import type {
  KpiLibraryRequest,
  KpiLibraryResponse,
  KpiCategory,
  GoalAssignmentRequest,
  GoalSetResponse,
  KpiGoalItemRequest,
  ProgressRequest,
  KpiRevisionRequest,
  KpiScoreResponse,
  KpiHistoryLog,
} from './kpiTypes';

export const kpiApi = createApi({
  reducerPath: 'kpiApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Library', 'GoalSet', 'Progress', 'Score', 'Category'],
  endpoints: (builder) => ({

    // ==================== Categories ====================
    getCategories: builder.query<ApiResponse<KpiCategory[]>, void>({
      query: () => '/kpi/categories',
      providesTags: ['Category'],
    }),

    // ==================== KPI Library ====================
    createLibrary: builder.mutation<ApiResponse<KpiLibraryResponse>, KpiLibraryRequest>({
      query: (body) => ({
        url: '/kpi/library',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Library'],
    }),

    getAllLibraries: builder.query<ApiResponse<KpiLibraryResponse[]>, void>({
      query: () => '/kpi/library',
      providesTags: ['Library'],
    }),

    toggleLibraryStatus: builder.mutation<
      ApiResponse<KpiLibraryResponse>,
      { id: number; active: boolean }
    >({
      query: ({ id, active }) => ({
        url: `/kpi/library/${id}/status?active=${active}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Library'],
    }),

    // ==================== Assignment ====================
    assignKpiToEmployee: builder.mutation<ApiResponse<GoalSetResponse>, GoalAssignmentRequest>({
      query: (body) => ({
        url: '/kpi/assign',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GoalSet'],
    }),

    // ==================== Goal Item Management ====================
    addGoalItem: builder.mutation<
      ApiResponse<GoalSetResponse>,
      { goalSetId: number; data: KpiGoalItemRequest }
    >({
      query: ({ goalSetId, data }) => ({
        url: `/kpi/goal-set/${goalSetId}/items`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['GoalSet'],
    }),

    updateGoalItem: builder.mutation<
      ApiResponse<GoalSetResponse>,
      { itemId: number; data: KpiGoalItemRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/kpi/items/${itemId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['GoalSet'],
    }),

    deleteGoalItem: builder.mutation<ApiResponse<GoalSetResponse>, number>({
      query: (itemId) => ({
        url: `/kpi/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GoalSet'],
    }),

    // ==================== Approval ====================
    approveGoalSet: builder.mutation<ApiResponse<GoalSetResponse>, number>({
      query: (id) => ({
        url: `/kpi/approve/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['GoalSet'],
    }),

    // ==================== Progress ====================
    updateProgress: builder.mutation<ApiResponse<GoalSetResponse>, ProgressRequest>({
      query: (body) => ({
        url: '/kpi/progress',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GoalSet', 'Progress'],
    }),

    // ==================== Revision ====================
    reviseKpi: builder.mutation<
      ApiResponse<GoalSetResponse>,
      { itemId: number; data: KpiRevisionRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/kpi/revise/${itemId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['GoalSet'],
    }),

    // ==================== Score Calculation ====================
    calculateScore: builder.mutation<
      ApiResponse<KpiScoreResponse>,
      { employeeId: number; cycleId: number }
    >({
      query: ({ employeeId, cycleId }) => ({
        url: `/kpi/calculate-score?employeeId=${employeeId}&cycleId=${cycleId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Score'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateLibraryMutation,
  useGetAllLibrariesQuery,
  useToggleLibraryStatusMutation,
  useAssignKpiToEmployeeMutation,
  useAddGoalItemMutation,
  useUpdateGoalItemMutation,
  useDeleteGoalItemMutation,
  useApproveGoalSetMutation,
  useUpdateProgressMutation,
  useReviseKpiMutation,
  useCalculateScoreMutation,
} = kpiApi;