import { api } from './api';
import type { ApiResponse } from './ApiResponse';
import type {
  KpiLibraryRequest,
  KpiLibraryResponse,
  KpiImportResult,
  KpiCategory,
  GoalAssignmentRequest,
  GoalSetResponse,
  KpiGoalItemRequest,
  KpiProgressHistory,
  ProgressRequest,
  KpiRevisionRequest,
  KpiScoreResponse,
  KpiGoalBulkUpdateRequest,
  BulkGoalAssignmentRequest,
  BulkAssignmentResponse,
  KpiHistoryLog,
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

    importLibraries: builder.mutation<ApiResponse<KpiImportResult>, FormData>({
      query: (body) => ({
        url: '/kpi/library/import',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Library'],
    }),

    getAllLibraries: builder.query<ApiResponse<KpiLibraryResponse[]>, void>({
      query: () => '/kpi/library',
      providesTags: ['Library'],
    }),

    getAllLibrariesWithInactive: builder.query<ApiResponse<KpiLibraryResponse[]>, void>({
      query: () => '/kpi/library/all',
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

    toggleHistoryStatus: builder.mutation<
      ApiResponse<KpiLibraryResponse>,
      { id: number; active: boolean }
    >({
      query: ({ id, active }) => ({
        url: `/kpi/library/${id}/toggle-history-status?active=${active}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Library'],
    }),

    deleteLibrary: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/kpi/library/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Library'],
    }),

    getLibraryById: builder.query<ApiResponse<KpiLibraryResponse>, number>({
      query: (id) => `/kpi/library/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Library', id }],
    }),

    updateLibrary: builder.mutation<ApiResponse<KpiLibraryResponse>, { id: number; data: KpiLibraryRequest }>({
      query: ({ id, data }) => ({
        url: `/kpi/library/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Library', id }, 'Library'],
    }),
    getLibraryHistory: builder.query<ApiResponse<KpiLibraryResponse[]>, number>({
      query: (positionId) => `/kpi/library/history/${positionId}`,
      providesTags: ['Library'],
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
    bulkAssignKpi: builder.mutation<ApiResponse<BulkAssignmentResponse>, BulkGoalAssignmentRequest>({
      query: (body) => ({
        url: '/kpi/bulk-assign',
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

    bulkUpdateGoalItems: builder.mutation<
      ApiResponse<GoalSetResponse>,
      { goalSetId: number; data: KpiGoalBulkUpdateRequest }
    >({
      query: ({ goalSetId, data }) => ({
        url: `/kpi/goal-set/${goalSetId}/bulk-items`,
        method: 'PUT',
        body: data,
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

    revertGoalSet: builder.mutation<ApiResponse<GoalSetResponse>, number>({
      query: (id) => ({
        url: `/kpi/goal-set/${id}/revert`,
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
    calculateScores: builder.mutation<
      ApiResponse<KpiScoreResponse>,
      { employeeId: number; cycleId: number }
    >({
      query: ({ employeeId, cycleId }) => ({
        url: `/kpi/calculate-score?employeeId=${employeeId}&cycleId=${cycleId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Score'],
    }),
    getTeamGoalSets: builder.query<ApiResponse<GoalSetResponse[]>, { managerId: number; cycleId: number }>({
      query: ({ managerId, cycleId }) => `/kpi/goal-set/team?managerId=${managerId}&cycleId=${cycleId}`,
      providesTags: ['GoalSet'],
    }),
    getDepartmentGoalSets: builder.query<ApiResponse<GoalSetResponse[]>, { departmentId?: number; cycleId: number }>({
      query: ({ departmentId, cycleId }) => {
        let url = `/kpi/goal-set/department?cycleId=${cycleId}`;
        if (departmentId) url += `&departmentId=${departmentId}`;
        return url;
      },
      providesTags: ['GoalSet'],
    }),
    getEmployeeKpiHistory: builder.query<ApiResponse<GoalSetResponse[]>, number>({
      query: (employeeId) => `/kpi-history/employee/${employeeId}`,
      providesTags: ['GoalSet'],
    }),
    getGoalSetAuditTrail: builder.query<ApiResponse<KpiHistoryLog[]>, number>({
      query: (goalSetId) => `/kpi-history/goal-set/${goalSetId}/audit`,
      providesTags: ['GoalSet'],
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
  useGetAllLibrariesWithInactiveQuery,
  useToggleLibraryStatusMutation,
  useToggleHistoryStatusMutation,
  useDeleteLibraryMutation,
  useAssignKpiToEmployeeMutation,
  useAddGoalItemMutation,
  useUpdateGoalItemMutation,
  useDeleteGoalItemMutation,
  useBulkUpdateGoalItemsMutation,
  useApproveGoalSetMutation,
  useRevertGoalSetMutation,
  useImportLibrariesMutation,
  useUpdateProgressMutation,
  useReviseKpiMutation,
  useCalculateScoresMutation,
  useGetGoalSetByEmployeeQuery,
  useGetGoalSetByIdQuery,
  useGetProgressHistoryQuery,
  useGetActiveCycleQuery,
  useGetLibraryByIdQuery,
  useUpdateLibraryMutation,
  useGetLibraryHistoryQuery,
  useGetTeamGoalSetsQuery,
  useGetDepartmentGoalSetsQuery,

  useBulkAssignKpiMutation,
  useGetEmployeeKpiHistoryQuery,
  useGetGoalSetAuditTrailQuery,
} = kpiApi;