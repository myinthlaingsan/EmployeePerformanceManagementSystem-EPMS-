import { api } from "../../services/api";
import type { ApiResponse } from "../../services/ApiResponse";
import type {
  KpiAchievementReportDTO,
  AppraisalStatusReportDTO,
  PerformanceTrendReportDTO,
  FeedbackParticipationReportDTO,
  PipTrackingReportDTO,
  AuditTrailReportDTO,
  DeptPerformanceReportDTO,
  PromotionReadinessReportDTO,
  EmployeePerformanceSummaryDTO,
  PerformanceRankingReportDTO,
} from "../../types/report";

export const reportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getKpiAchievementReport: builder.query<ApiResponse<KpiAchievementReportDTO[]>, { cycleId: number; departmentId?: number }>({
      query: ({ cycleId, departmentId }) => ({
        url: "/reports/kpi-achievement",
        params: { cycleId, departmentId },
      }),
    }),
    getAppraisalStatusReport: builder.query<ApiResponse<AppraisalStatusReportDTO>, number>({
      query: (cycleId) => ({
        url: "/reports/appraisal-status",
        params: { cycleId },
      }),
    }),
    getPerformanceTrendReport: builder.query<ApiResponse<PerformanceTrendReportDTO>, number>({
      query: (employeeId) => ({
        url: "/reports/performance-trend",
        params: { employeeId },
      }),
    }),
    getFeedbackParticipationReport: builder.query<ApiResponse<FeedbackParticipationReportDTO>, number>({
      query: (cycleId) => ({
        url: "/reports/feedback-participation",
        params: { cycleId },
      }),
    }),
    getPipTrackingReport: builder.query<ApiResponse<PipTrackingReportDTO>, void>({
      query: () => "/reports/pip-tracking",
    }),
    getAuditTrailReport: builder.query<ApiResponse<AuditTrailReportDTO[]>, { tableName?: string; recordId?: number }>({
      query: (params) => ({
        url: "/reports/audit-trail",
        params,
      }),
    }),
    getDeptComparisonReport: builder.query<ApiResponse<DeptPerformanceReportDTO[]>, number>({
      query: (cycleId) => ({
        url: "/reports/dept-comparison",
        params: { cycleId },
      }),
    }),
    getPromotionReadinessReport: builder.query<ApiResponse<PromotionReadinessReportDTO[]>, void>({
      query: () => "/reports/promotion-readiness",
    }),
    getEmployeePerformanceSummary: builder.query<ApiResponse<EmployeePerformanceSummaryDTO>, { employeeId: number; cycleId: number }>({
      query: ({ employeeId, cycleId }) => ({
        url: "/reports/performance-summary",
        params: { employeeId, cycleId },
      }),
    }),
    getPerformanceRankingReport: builder.query<ApiResponse<PerformanceRankingReportDTO[]>, number>({
      query: (cycleId) => ({
        url: "/reports/performance-ranking",
        params: { cycleId },
      }),
    }),
    downloadReport: builder.mutation<void, { endpoint: string; params?: any; fileName: string }>({
      query: ({ endpoint, params }) => ({
        url: `/reports/${endpoint}/download`,
        params,
        responseHandler: async (response: Response) => {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", params.fileName || "report.pdf");
          document.body.appendChild(link);
          link.click();
          link.remove();
        },
      }),
    }),
  }),
});

export const {
  useGetKpiAchievementReportQuery,
  useGetAppraisalStatusReportQuery,
  useGetPerformanceTrendReportQuery,
  useGetFeedbackParticipationReportQuery,
  useGetPipTrackingReportQuery,
  useGetAuditTrailReportQuery,
  useGetDeptComparisonReportQuery,
  useGetPromotionReadinessReportQuery,
  useGetEmployeePerformanceSummaryQuery,
  useGetPerformanceRankingReportQuery,
  useDownloadReportMutation,
} = reportApi;
