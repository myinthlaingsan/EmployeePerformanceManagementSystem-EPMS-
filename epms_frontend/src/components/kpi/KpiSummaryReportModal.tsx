import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, FileText, Loader2, FileSpreadsheet, Check, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGetAllEmployeesQuery, useGetDirectReportsQuery } from '../../features/employee/employeeapi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import { useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import { useGetKpiSummaryReportQuery } from '../../services/kpiApi';
import { useAppSelector } from '../../hooks/reduxHooks';

interface KpiSummaryReportModalProps {
  onClose: () => void;
}

const KpiSummaryReportModal: React.FC<KpiSummaryReportModalProps> = ({ onClose }) => {
  const { user, isAdmin, isHR, activeCycleId } = useAuth();
  const token = useAppSelector((state) => state.auth.accessToken);
  const isAdminOrHr = isAdmin || isHR;

  // Sidebar selections
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCycleIds, setSelectedCycleIds] = useState<number[]>([]);

  // Fetch lists
  const { data: allEmployees, isLoading: isLoadingAll } = useGetAllEmployeesQuery(undefined, {
    skip: !isAdminOrHr,
  });
  const { data: directReports, isLoading: isLoadingDirect } = useGetDirectReportsQuery(user?.id || 0, {
    skip: isAdminOrHr || !user?.id,
  });
  const { data: departments, isLoading: isLoadingDepts } = useGetDepartmentsQuery();
  const { data: cyclesResponse, isLoading: isLoadingCycles } = useGetCyclesQuery();

  // Map employee and cycle collections
  const employees = useMemo(() => {
    return isAdminOrHr ? (allEmployees || []) : (directReports || []);
  }, [allEmployees, directReports, isAdminOrHr]);

  const isLoadingEmployees = isAdminOrHr ? isLoadingAll : isLoadingDirect;

  const cycles = useMemo(() => {
    return Array.isArray(cyclesResponse) ? cyclesResponse : ((cyclesResponse as any)?.data || []);
  }, [cyclesResponse]);

  const activeCycles = useMemo(() => {
    return cycles.filter((c: any) => (c.cycleId || c.id) === activeCycleId);
  }, [cycles, activeCycleId]);

  const historicalCycles = useMemo(() => {
    return cycles.filter((c: any) => (c.cycleId || c.id) !== activeCycleId);
  }, [cycles, activeCycleId]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesDept = !deptFilter || emp.currentDepartmentId === Number(deptFilter);
      const matchesSearch = !searchTerm || 
        emp.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesDept && matchesSearch;
    });
  }, [employees, deptFilter, searchTerm]);

  // Get selected employee object
  const selectedEmployee = useMemo(() => {
    return employees.find((emp) => emp.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  // Fetch report preview data
  const { data: reportDataResponse, isLoading: isLoadingPreview, isFetching: isFetchingPreview } = useGetKpiSummaryReportQuery(
    { employeeId: selectedEmployeeId || 0, cycleIds: selectedCycleIds },
    { skip: !selectedEmployeeId || selectedCycleIds.length === 0 }
  );

  const reportData = reportDataResponse?.data || null;

  // Auto-select first employee if list loaded
  useEffect(() => {
    if (filteredEmployees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(filteredEmployees[0].id);
    }
  }, [filteredEmployees, selectedEmployeeId]);

  // Pre-select active cycle if available
  useEffect(() => {
    if (activeCycleId && selectedCycleIds.length === 0 && cycles.length > 0) {
      const activeCycle = cycles.find((c: any) => (c.cycleId || c.id) === activeCycleId);
      if (activeCycle) {
        setSelectedCycleIds([activeCycle.cycleId || activeCycle.id]);
      }
    }
  }, [activeCycleId, cycles, selectedCycleIds]);

  // Cycle checkbox selection toggles
  const handleToggleCycle = (cycleId: number) => {
    setSelectedCycleIds((prev) =>
      prev.includes(cycleId) ? prev.filter((id) => id !== cycleId) : [...prev, cycleId]
    );
  };

  // Download handle
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (format: 'pdf' | 'xlsx') => {
    if (!selectedEmployeeId || selectedCycleIds.length === 0) return;

    setIsDownloading(true);
    try {
      const cycleIdsParam = selectedCycleIds.join(',');
      const response = await fetch(
        `http://localhost:8080/api/v1/reports/kpi-summary/download?employeeId=${selectedEmployeeId}&cycleIds=${cycleIdsParam}&format=${format}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const name = selectedEmployee?.staffName || 'Employee';
      a.download = `${name}_KPI_Summary_Report.${ext}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Color mapping helpers
  const getCategoryColor = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('outstanding') || name.includes('excellent')) {
      return { bg: '#ECFDF5', text: '#047857', border: '#D1FAE5' };
    }
    if (name.includes('exceed')) {
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' };
    }
    if (name.includes('meet') || name.includes('expectations')) {
      return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
    }
    return { bg: '#FEF2F2', text: '#B91C1C', border: '#FEE2E2' };
  };

  const formatMetric = (value?: number | null, suffix = '') => {
    if (value === null || value === undefined) return '-';
    return `${value}${suffix}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[960px] h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Employee KPI Summary Report</h2>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Report Generator &amp; Preview</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Columns */}
        <div className="flex-1 flex min-h-0">
          
          {/* LEFT SIDEBAR */}
          <div className="w-[280px] border-r border-gray-100 bg-gray-50/20 flex flex-col p-5 shrink-0 overflow-y-auto custom-scrollbar gap-5">
            
            {/* Filter: Department (HR/Admin only) */}
            {isAdminOrHr && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Department</label>
                <select
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter: Employee Search & Select */}
            <div className="flex flex-col gap-1.5 flex-1 min-h-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                {isAdminOrHr ? 'Employees' : 'Direct Reports'}
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex-1 border border-gray-100 rounded-xl bg-white overflow-y-auto max-h-[220px] custom-scrollbar p-1">
                {isLoadingEmployees ? (
                  <div className="py-10 flex justify-center text-[11px] text-gray-400 italic">
                    Loading employee list...
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="py-10 flex justify-center text-[11px] text-gray-400 italic">
                    No employees found
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border border-transparent ${
                        selectedEmployeeId === emp.id ? 'bg-blue-50/50 border-blue-100' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-employee"
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={selectedEmployeeId === emp.id}
                        onChange={() => setSelectedEmployeeId(emp.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-gray-800 truncate">{emp.staffName}</span>
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold">
                          {emp.employeeCode} &bull; {emp.positionName}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Selection: Appraisal Cycles */}
            <div className="flex flex-col gap-2 shrink-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Appraisal Cycles</label>
              
              {isLoadingCycles ? (
                <div className="text-xs text-gray-400 italic">Loading cycles...</div>
              ) : (
                <div className="space-y-3">
                  {/* Active Cycle Group */}
                  {activeCycles.length > 0 && (
                    <div>
                      <span className="block text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Active Cycle</span>
                      {activeCycles.map((c: any) => {
                        const cid = c.cycleId || c.id;
                        const isChecked = selectedCycleIds.includes(cid);
                        return (
                          <div
                            key={cid}
                            onClick={() => handleToggleCycle(cid)}
                            className="flex items-center gap-2.5 py-1 px-1 rounded cursor-pointer select-none group text-xs"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0" />
                            )}
                            <span className="font-bold text-gray-800">{c.cycleName || c.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Historical Cycle Group */}
                  {historicalCycles.length > 0 && (
                    <div>
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Historical Cycles</span>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                        {historicalCycles.map((c: any) => {
                          const cid = c.cycleId || c.id;
                          const isChecked = selectedCycleIds.includes(cid);
                          return (
                            <div
                              key={cid}
                              onClick={() => handleToggleCycle(cid)}
                              className="flex items-center gap-2.5 py-1 px-1 rounded cursor-pointer select-none group text-xs"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0" />
                              )}
                              <span className="font-bold text-gray-700">{c.cycleName || c.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PREVIEW PANEL */}
          <div className="flex-1 flex flex-col bg-white min-w-0">
            
            {/* Empty or Loaded state */}
            {!selectedEmployeeId || selectedCycleIds.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-gray-50/20">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Select Employee &amp; Cycles</h3>
                <p className="text-xs text-gray-400 max-w-xs leading-normal">
                  Choose an employee and select at least one appraisal cycle from the left sidebar to generate a KPI report preview.
                </p>
              </div>
            ) : isLoadingPreview ? (
              <div className="flex-1 flex flex-col justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading report preview...</p>
              </div>
            ) : !reportData ? (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-gray-50/20">
                <p className="text-xs font-semibold text-rose-500">Failed to fetch report preview data.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-8">
                
                {/* Employee Header Metadata Block */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 p-6 bg-slate-50 border border-slate-100 rounded-3xl mb-6 flex-shrink-0">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Report Subject</span>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">{reportData.employeeName}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 font-medium">
                      <span>{reportData.positionName}</span>
                      <span>&bull;</span>
                      <span>{reportData.departmentName}</span>
                    </div>
                  </div>

                  {/* Summary Scores Widget */}
                  <div className="flex items-center gap-3">
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-3 text-right">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Average Score</span>
                      <span className="text-xl font-black text-gray-900">{reportData.averageScore}%</span>
                    </div>

                    <div
                      className="border shadow-sm rounded-2xl p-3 text-center min-w-[120px]"
                      style={{
                        backgroundColor: getCategoryColor(reportData.overallCategory).bg,
                        borderColor: getCategoryColor(reportData.overallCategory).border,
                        color: getCategoryColor(reportData.overallCategory).text,
                      }}
                    >
                      <span className="text-[9px] font-black opacity-80 uppercase tracking-widest block">Overall Band</span>
                      <span className="text-xs font-black uppercase">{reportData.overallCategory}</span>
                    </div>
                  </div>
                </div>

                {/* KPI Cycles Table */}
                <div className="flex-1 min-h-0">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Selected Performance Cycles</h4>
                    <span className="text-[11px] text-gray-400 font-bold">
                      Sorted oldest to newest
                    </span>
                  </div>

                  <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/80 border-b border-gray-100 font-black text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Performance Cycle</th>
                          <th className="px-5 py-3">Evaluation Period</th>
                          <th className="px-5 py-3 text-center">KPI Items (Ach/Tot)</th>
                          <th className="px-5 py-3 text-center">KPI Score</th>
                          <th className="px-5 py-3 text-center">Performance Band</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {reportData.cycles.map((c, i) => {
                          const catColors = getCategoryColor(c.performanceCategory);
                          return (
                            <React.Fragment key={`${c.cycleName}-${i}`}>
                              <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-gray-900">{c.cycleName}</td>
                                <td className="px-5 py-3.5 text-gray-500 font-medium">
                                  {c.cycleStartDate} &rarr; {c.cycleEndDate}
                                </td>
                                <td className="px-5 py-3.5 text-center font-bold text-gray-800">
                                  {c.achievedItems} / {c.totalItems}
                                </td>
                                <td className="px-5 py-3.5 text-center font-black text-gray-900">{c.kpiScore}%</td>
                                <td className="px-5 py-3.5 text-center">
                                  <span
                                    className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                                    style={{
                                      backgroundColor: catColors.bg,
                                      color: catColors.text,
                                    }}
                                  >
                                    {c.performanceCategory}
                                  </span>
                                </td>
                              </tr>
                              <tr className="bg-white">
                                <td colSpan={5} className="px-5 py-4">
                                  <div className="space-y-4">
                                    <div>
                                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        KPI Goal Items
                                      </h5>
                                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                                        <table className="w-full text-[11px]">
                                          <thead className="bg-gray-50 text-gray-500 uppercase font-black">
                                            <tr>
                                              <th className="px-3 py-2 text-left">Goal</th>
                                              <th className="px-3 py-2 text-left">Unit</th>
                                              <th className="px-3 py-2 text-right">Target</th>
                                              <th className="px-3 py-2 text-right">Actual</th>
                                              <th className="px-3 py-2 text-right">Weight</th>
                                              <th className="px-3 py-2 text-right">Score</th>
                                              <th className="px-3 py-2 text-right">Weighted</th>
                                              <th className="px-3 py-2 text-center">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                            {(c.goalItems || []).length === 0 ? (
                                              <tr>
                                                <td colSpan={8} className="px-3 py-3 text-center text-gray-400 font-semibold">
                                                  No KPI goal items found for this cycle.
                                                </td>
                                              </tr>
                                            ) : (
                                              c.goalItems.map((item, itemIndex) => (
                                                <tr key={`${item.title}-${itemIndex}`}>
                                                  <td className="px-3 py-2 font-bold text-gray-800">{item.title}</td>
                                                  <td className="px-3 py-2 text-gray-500">{item.unit || '-'}</td>
                                                  <td className="px-3 py-2 text-right">{formatMetric(item.targetValue)}</td>
                                                  <td className="px-3 py-2 text-right">{formatMetric(item.actualValue)}</td>
                                                  <td className="px-3 py-2 text-right">{formatMetric(item.weightPercent, '%')}</td>
                                                  <td className="px-3 py-2 text-right">{formatMetric(item.scorePercent, '%')}</td>
                                                  <td className="px-3 py-2 text-right font-bold">{formatMetric(item.weightedScore, '%')}</td>
                                                  <td className="px-3 py-2 text-center text-[10px] font-black text-gray-500 uppercase">
                                                    {item.status}
                                                  </td>
                                                </tr>
                                              ))
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {(c.phases || []).length > 0 && (
                                      <div>
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                          KPI Phases
                                        </h5>
                                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                                          <table className="w-full text-[11px]">
                                            <thead className="bg-gray-50 text-gray-500 uppercase font-black">
                                              <tr>
                                                <th className="px-3 py-2 text-left">Phase</th>
                                                <th className="px-3 py-2 text-left">Period</th>
                                                <th className="px-3 py-2 text-right">Days</th>
                                                <th className="px-3 py-2 text-right">Weight</th>
                                                <th className="px-3 py-2 text-right">Score</th>
                                                <th className="px-3 py-2 text-left">Reason</th>
                                                <th className="px-3 py-2 text-center">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {c.phases.map((phase) => (
                                                <tr key={phase.phaseNumber}>
                                                  <td className="px-3 py-2 font-bold text-gray-800">Phase {phase.phaseNumber}</td>
                                                  <td className="px-3 py-2 text-gray-500">{phase.startDate} &rarr; {phase.endDate}</td>
                                                  <td className="px-3 py-2 text-right">{phase.days}</td>
                                                  <td className="px-3 py-2 text-right">{formatMetric(phase.weight)}</td>
                                                  <td className="px-3 py-2 text-right font-bold">{formatMetric(phase.score, '%')}</td>
                                                  <td className="px-3 py-2 text-gray-500">{phase.changeReason || '-'}</td>
                                                  <td className="px-3 py-2 text-center text-[10px] font-black text-gray-500 uppercase">
                                                    {phase.status}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* Bottom Generate / Download Action Bar */}
            {selectedEmployeeId && selectedCycleIds.length > 0 && reportData && (
              <div className="px-8 py-5 bg-gray-50/70 border-t border-gray-100 flex justify-between items-center shrink-0">
                <span className="text-[11px] text-gray-400 font-bold">
                  * Report downloads will cover the {selectedCycleIds.length} selected cycle{selectedCycleIds.length > 1 ? 's' : ''} only.
                </span>

                <div className="flex items-center gap-3">
                  {/* Excel Download button */}
                  <button
                    onClick={() => handleDownload('xlsx')}
                    disabled={isDownloading}
                    className="p-3 bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed rounded-2xl transition-all shadow-sm flex items-center justify-center"
                    title="Export to Excel"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
                  </button>

                  {/* PDF Download button */}
                  <button
                    onClick={() => handleDownload('pdf')}
                    disabled={isDownloading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300 disabled:cursor-not-allowed rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/10 transition-all"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    Generate PDF Report
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default KpiSummaryReportModal;
