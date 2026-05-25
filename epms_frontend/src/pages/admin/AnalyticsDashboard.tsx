import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  useDownloadReportMutation,
  useGetAppraisalStatusReportQuery,
  useGetFeedback360SummaryAnalyticsQuery,
  useGetGoalCompletionQuery,
  useGetKpiAchievementReportQuery,
  useGetOrganizationPerformanceTrendQuery,
  useGetPerformanceByDepartmentQuery,
  useGetPerformanceDistributionQuery,
  useGetPerformancePotentialMatrixQuery,
  useGetPerformanceRankingReportQuery,
  useGetPipTrackingReportQuery,
} from '../../features/report/reportApi';
import { useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import { FilterBar } from '../../components/analytics/FilterBar';
import { QuickInsights, SelectCyclePrompt, SummaryCards } from '../../components/analytics/SummaryPanels';
import {
  AppraisalCompletionCard,
  DepartmentHeatmap,
  Feedback360Card,
  GoalCompletionCard,
  KpiAchievementChart,
  PerformanceDistributionCard,
  PerformancePotentialMatrixCard,
  PerformanceTrendChart,
} from '../../components/analytics/ChartCards';
import { PerformanceRankingTable, PipPanel, StrategicInsightCard } from '../../components/analytics/RankingAndPip';
import {
  calculateCompletionRate,
  formatPercent,
  formatScore,
  isValidId,
  transformPieData,
} from '../../utils/reportUtils';
import type { DownloadParams, FilterState } from '../../types/reports';

const AnalyticsDashboard = () => {
  const [filters, setFilters] = useState<FilterState>({ selectedCycle: '', selectedDept: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { selectedCycle, selectedDept } = filters;
  const hasCycle = isValidId(selectedCycle);
  const departmentId = isValidId(selectedDept) ? selectedDept : undefined;

  const { data: cycles } = useGetCyclesQuery();
  const { data: departments } = useGetDepartmentsQuery();

  const appraisalStatusQuery = useGetAppraisalStatusReportQuery(Number(selectedCycle), { skip: !hasCycle });
  const kpiReportQuery = useGetKpiAchievementReportQuery({ cycleId: Number(selectedCycle), departmentId }, { skip: !hasCycle });
  const rankingReportQuery = useGetPerformanceRankingReportQuery(Number(selectedCycle), { skip: !hasCycle });
  const pipReportQuery = useGetPipTrackingReportQuery();
  const distributionReportQuery = useGetPerformanceDistributionQuery({ cycleId: Number(selectedCycle), departmentId }, { skip: !hasCycle });
  const departmentReportQuery = useGetPerformanceByDepartmentQuery(Number(selectedCycle), { skip: !hasCycle });
  const trendReportQuery = useGetOrganizationPerformanceTrendQuery(6, { skip: !hasCycle });
  const matrixReportQuery = useGetPerformancePotentialMatrixQuery(Number(selectedCycle), { skip: !hasCycle });
  const goalReportQuery = useGetGoalCompletionQuery(Number(selectedCycle), { skip: !hasCycle });
  const feedback360ReportQuery = useGetFeedback360SummaryAnalyticsQuery(Number(selectedCycle), { skip: !hasCycle });

  const [downloadReport] = useDownloadReportMutation();

  const handleCycleChange = useCallback((value: number | '') => {
    setFilters((current) => ({ ...current, selectedCycle: value }));
  }, []);

  const handleDeptChange = useCallback((value: number | '') => {
    setFilters((current) => ({ ...current, selectedDept: value }));
  }, []);

  const handleDownload = useCallback(async ({ endpoint, params, fileName }: DownloadParams) => {
    try {
      await downloadReport({ endpoint, params, fileName }).unwrap();
      toast.success('Report download started.');
    } catch {
      toast.error('Failed to download report.');
    }
  }, [downloadReport]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const refreshes: Array<Promise<unknown>> = [pipReportQuery.refetch()];
      if (hasCycle) {
        refreshes.push(
          appraisalStatusQuery.refetch(),
          kpiReportQuery.refetch(),
          rankingReportQuery.refetch(),
          distributionReportQuery.refetch(),
          departmentReportQuery.refetch(),
          trendReportQuery.refetch(),
          matrixReportQuery.refetch(),
          goalReportQuery.refetch(),
          feedback360ReportQuery.refetch(),
        );
      }
      await Promise.all(refreshes);
      toast.success('Analytics refreshed.');
    } catch {
      toast.error('Some analytics could not be refreshed.');
    } finally {
      setIsRefreshing(false);
    }
  }, [
    appraisalStatusQuery,
    departmentReportQuery,
    distributionReportQuery,
    feedback360ReportQuery,
    goalReportQuery,
    hasCycle,
    kpiReportQuery,
    matrixReportQuery,
    pipReportQuery,
    rankingReportQuery,
    trendReportQuery,
  ]);

  const appraisalPieData = useMemo(
    () => transformPieData(appraisalStatusQuery.data?.data),
    [appraisalStatusQuery.data],
  );

  const summaryMetrics = useMemo(() => [
    {
      label: 'Completion',
      value: `${calculateCompletionRate(
        appraisalStatusQuery.data?.data?.completed,
        appraisalStatusQuery.data?.data?.totalEmployees,
      )}%`,
    },
    { label: 'Avg Score', value: formatScore(distributionReportQuery.data?.data?.mean) },
    { label: 'Goal Done', value: formatPercent(goalReportQuery.data?.data?.completionRate) },
    { label: '360 Response', value: formatPercent(feedback360ReportQuery.data?.data?.participationRate) },
  ], [appraisalStatusQuery.data, distributionReportQuery.data, feedback360ReportQuery.data, goalReportQuery.data]);

  const insights = useMemo(() => [
    `${summaryMetrics[0].value} appraisal completion for this cycle.`,
    distributionReportQuery.data?.data
      ? `Average score is ${formatScore(distributionReportQuery.data.data.mean)} across ${distributionReportQuery.data.data.sampleSize} scored employees.`
      : 'Performance distribution is pending score data.',
    goalReportQuery.data?.data
      ? `${formatPercent(goalReportQuery.data.data.completionRate)} of goals are complete.`
      : 'Goal completion is pending KPI goals.',
  ], [distributionReportQuery.data, goalReportQuery.data, summaryMetrics]);

  return (
    <div className="space-y-4 pb-8">
      <FilterBar
        cycles={cycles}
        departments={departments}
        selectedCycle={selectedCycle}
        selectedDept={selectedDept}
        isRefreshing={isRefreshing}
        onCycleChange={handleCycleChange}
        onDeptChange={handleDeptChange}
        onRefresh={handleRefresh}
      />

      {!hasCycle ? (
        <SelectCyclePrompt />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          <SummaryCards metrics={summaryMetrics} />
          <QuickInsights insights={insights} />

          <AppraisalCompletionCard
            data={appraisalStatusQuery.data?.data}
            pieData={appraisalPieData}
            loading={appraisalStatusQuery.isFetching}
            isError={appraisalStatusQuery.isError}
            onDownload={() => handleDownload({
              endpoint: 'appraisal-status',
              params: { cycleId: selectedCycle },
              fileName: `Appraisal_Status_${selectedCycle}.pdf`,
            })}
          />
          <KpiAchievementChart
            data={kpiReportQuery.data?.data}
            loading={kpiReportQuery.isFetching}
            isError={kpiReportQuery.isError}
            onDownloadPdf={() => handleDownload({
              endpoint: 'kpi-achievement',
              params: { cycleId: selectedCycle, departmentId },
              fileName: `KPI_Report_${selectedCycle}.pdf`,
            })}
            onDownloadExcel={() => handleDownload({
              endpoint: 'kpi-achievement',
              params: { cycleId: selectedCycle, departmentId, format: 'excel' },
              fileName: `KPI_Report_${selectedCycle}.xlsx`,
            })}
          />

          <PerformanceDistributionCard data={distributionReportQuery.data?.data} />
          <DepartmentHeatmap data={departmentReportQuery.data?.data} />
          <PerformanceTrendChart data={trendReportQuery.data?.data} />
          <GoalCompletionCard data={goalReportQuery.data?.data} />
          <Feedback360Card data={feedback360ReportQuery.data?.data} />
          <PerformancePotentialMatrixCard data={matrixReportQuery.data?.data} />

          <PerformanceRankingTable
            data={rankingReportQuery.data?.data}
            loading={rankingReportQuery.isFetching}
            isError={rankingReportQuery.isError}
            onDownload={() => handleDownload({
              endpoint: 'performance-ranking',
              params: { cycleId: selectedCycle },
              fileName: `Performance_Ranking_${selectedCycle}.pdf`,
            })}
          />
          <div className="lg:col-span-5 space-y-3">
            <PipPanel
              data={pipReportQuery.data?.data}
              onDownload={() => handleDownload({
                endpoint: 'pip-tracking',
                params: {},
                fileName: 'PIP_Global_Report.pdf',
              })}
            />
            <StrategicInsightCard />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
