import React, { useState } from 'react';
import {
  useGetAppraisalStatusReportQuery,
  useGetKpiAchievementReportQuery,
  useGetPerformanceRankingReportQuery,
  useGetPipTrackingReportQuery,
  useDownloadReportMutation
} from '../../features/report/reportApi';
import { useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  FileText,
  Download,
  Filter,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AnalyticsDashboard: React.FC = () => {
  const [selectedCycle, setSelectedCycle] = useState<number | ''>('');
  const [selectedDept, setSelectedDept] = useState<number | ''>('');

  const { data: cycles } = useGetCyclesQuery();
  const { data: departments } = useGetDepartmentsQuery();

  // Fetch Reports
  const { data: appraisalStatus, isFetching: loadingStatus } = useGetAppraisalStatusReportQuery(Number(selectedCycle), { skip: !selectedCycle });
  const { data: kpiReport, isFetching: loadingKpi } = useGetKpiAchievementReportQuery({ cycleId: Number(selectedCycle), departmentId: selectedDept ? Number(selectedDept) : undefined }, { skip: !selectedCycle });
  const { data: rankingReport, isFetching: loadingRanking } = useGetPerformanceRankingReportQuery(Number(selectedCycle), { skip: !selectedCycle });
  const { data: pipReport } = useGetPipTrackingReportQuery();

  const [downloadReport] = useDownloadReportMutation();

  const handleDownload = async (endpoint: string, params: any, fileName: string) => {
    try {
      await downloadReport({ endpoint, params, fileName }).unwrap();
    } catch (err) {
      alert('Failed to download report');
    }
  };

  const appraisalPieData = appraisalStatus?.data ? [
    { name: 'Completed', value: appraisalStatus.data.completed },
    { name: 'In Progress', value: appraisalStatus.data.inProgress },
    { name: 'Pending', value: appraisalStatus.data.pending },
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & Global Filters */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Reporting & Analytics</h2>
          <p className="text-slate-500 font-medium">Strategic insights into organizational performance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="bg-transparent outline-none font-bold text-slate-700 text-sm"
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select Appraisal Cycle</option>
              {cycles?.map(c => (
                <option key={c.cycleId} value={c.cycleId}>{c.cycleName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
            <Users className="w-4 h-4 text-slate-400" />
            <select
              className="bg-transparent outline-none font-bold text-slate-700 text-sm"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Departments</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>{d.departmentName}</option>
              ))}
            </select>
          </div>

          <button
            className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!selectedCycle ? (
        <div className="bg-indigo-50 p-12 rounded-[3rem] border-2 border-dashed border-indigo-200 text-center space-y-4">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-indigo-600">
            <Target className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-indigo-900">Select a cycle to view analytics</h3>
          <p className="text-indigo-400 max-w-md mx-auto">Choose an active or historical appraisal cycle from the dropdown above to generate performance insights.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Appraisal Completion Chart */}
          <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
            <div className="flex justify-between items-start mb-8">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Appraisal Completion Status</h4>
              <button
                onClick={() => handleDownload('appraisal-status', { cycleId: selectedCycle }, `Appraisal_Status_${selectedCycle}.pdf`)}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="h-64 relative">
              {loadingStatus ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">Generating...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appraisalPieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {appraisalPieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
                <p className="text-xl font-black text-slate-900">{appraisalStatus?.data?.totalEmployees || 0}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl">
                <p className="text-[10px] font-black text-emerald-600 uppercase">Live Rate</p>
                <p className="text-xl font-black text-emerald-900">
                  {appraisalStatus?.data ? Math.round((appraisalStatus.data.completed / appraisalStatus.data.totalEmployees) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* KPI Achievement Chart */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">KPI Achievement Distribution</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('kpi-achievement', { cycleId: selectedCycle, departmentId: selectedDept }, `KPI_Report_${selectedCycle}.pdf`)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <FileText className="w-3 h-3" /> PDF
                </button>
                <button
                  onClick={() => handleDownload('kpi-achievement', { cycleId: selectedCycle, departmentId: selectedDept, format: 'excel' }, `KPI_Report_${selectedCycle}.xlsx`)}
                  className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3 h-3" /> EXCEL
                </button>
              </div>
            </div>

            <div className="h-80">
              {loadingKpi ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold">Calculating Data...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpiReport?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="employeeName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="achievementPercentage" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Performance Ranking Table */}
          <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Top Performers Leaderboard</h4>
              <button
                onClick={() => handleDownload('performance-ranking', { cycleId: selectedCycle }, `Performance_Ranking_${selectedCycle}.pdf`)}
                className="text-indigo-600 text-xs font-bold hover:underline"
              >
                Export Full Ranking
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">Rank</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">Employee</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Final Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRanking ? (
                    <tr><td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-bold">Ranking data incoming...</td></tr>
                  ) : rankingReport?.data?.length === 0 ? (
                    <tr><td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-bold">No appraisal data found for this cycle.</td></tr>
                  ) : rankingReport?.data?.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30">
                      <td className="px-8 py-5 font-black text-indigo-600">#{row.rank}</td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="font-bold text-slate-800">{row.employeeName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{row.departmentName}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-sm">
                          {Number(row.currentScore || 0).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PIP & Strategic Insights */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-black">PIP Tracking</h4>
                    <p className="text-slate-400 text-xs font-medium">Performance Improvement Oversight</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">Active</p>
                    <p className="text-2xl font-black text-white">{pipReport?.data?.totalActivePip || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-emerald-500 uppercase">Passed</p>
                    <p className="text-2xl font-black text-emerald-400">{pipReport?.data?.successfulCount || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-rose-500 uppercase">Failed</p>
                    <p className="text-2xl font-black text-rose-400">{pipReport?.data?.failedCount || 0}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload('pip-tracking', {}, 'PIP_Global_Report.pdf')}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-white/10"
                >
                  Download Global PIP Audit
                </button>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertCircle className="w-32 h-32 text-white" />
              </div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white">
              <h4 className="font-black uppercase tracking-widest text-[10px] opacity-70 mb-4">Strategic Tip</h4>
              <p className="text-lg font-bold leading-relaxed mb-6">
                Appraisal cycles with over 85% completion rate in the first 2 weeks correlate with higher employee satisfaction scores.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">EP</div>
                <p className="text-sm font-bold opacity-80">EPMS AI Insights</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
