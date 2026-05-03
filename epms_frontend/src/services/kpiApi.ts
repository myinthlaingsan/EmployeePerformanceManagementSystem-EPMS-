import { api } from './api';
import type { ApiResponse } from './ApiResponse';
import type {
  KpiLibraryRequest,
  KpiLibraryResponse,
  KpiCategory,
  GoalAssignmentRequest,
  GoalSetResponse,
  KpiGoalItemRequest,
  KpiProgressHistory,
  ProgressRequest,
  KpiRevisionRequest,
  KpiScoreResponse,
} from '../features/kpi/kpiTypes';

export const kpiApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== Categories ====================
    getKpiCategories: builder.query<ApiResponse<KpiCategory[]>, void>({
      query: () => '/kpi/categories',
      providesTags: ['Category'],
    }),
    createKpiCategory: builder.mutation<ApiResponse<KpiCategory>, { name: string }>({
      query: (body) => ({
        url: '/kpi/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    updateKpiCategory: builder.mutation<ApiResponse<KpiCategory>, { id: number; name: string }>({
      query: ({ id, ...body }) => ({
        url: `/kpi/categories/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteKpiCategory: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: `/kpi/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
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

    getLibraryById: builder.query<ApiResponse<KpiLibraryResponse>, number>({
      query: (id) => `/kpi/library/${id}`,
      providesTags: (result, error, id) => [{ type: 'Library', id }],
    }),

    updateLibrary: builder.mutation<ApiResponse<KpiLibraryResponse>, { id: number; data: KpiLibraryRequest }>({
      query: ({ id, data }) => ({
        url: `/kpi/library/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Library', id }, 'Library'],
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

    getProgressHistory: builder.query<ApiResponse<KpiProgressHistory[]>, { employeeId: number; limit?: number }>({
      query: ({ employeeId, limit = 10 }) => `/kpi/progress/history?employeeId=${employeeId}&limit=${limit}`,
      providesTags: ['Progress'],
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

    // ==================== Goal Set Retrieval ====================
    getGoalSetByEmployee: builder.query<ApiResponse<GoalSetResponse>, { employeeId: number; cycleId: number }>({
      query: ({ employeeId, cycleId }) => `/kpi/goal-set/employee/${employeeId}?cycleId=${cycleId}`,
      providesTags: ['GoalSet'],
    }),

    getGoalSetById: builder.query<ApiResponse<GoalSetResponse>, number>({
      query: (id) => `/kpi/goal-set/${id}`,
      providesTags: ['GoalSet'],
    }),

    // ==================== Appraisal Cycle ====================
    getActiveCycle: builder.query<ApiResponse<any>, void>({
      query: () => '/kpi/active-cycle',
      providesTags: ['GoalSet'], // Can use a specific tag if needed
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
  useGetKpiCategoriesQuery,
  useCreateKpiCategoryMutation,
  useUpdateKpiCategoryMutation,
  useDeleteKpiCategoryMutation,
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
  useGetGoalSetByEmployeeQuery,
  useGetGoalSetByIdQuery,
  useGetProgressHistoryQuery,
  useGetActiveCycleQuery,
  useGetLibraryByIdQuery,
  useUpdateLibraryMutation,
} = kpiApi;