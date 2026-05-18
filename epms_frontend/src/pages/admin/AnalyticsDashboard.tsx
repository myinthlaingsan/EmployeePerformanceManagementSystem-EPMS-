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
import { FileText, Download, Filter, TrendingUp, Users, Target, AlertCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';

const COLORS = ['#1A56DB', '#27500A', '#633806', '#791F1F', '#9EA3B0'];
const tooltipStyle = { borderRadius: 8, border: '0.5px solid #E4E6EC', boxShadow: 'none', background: '#FFFFFF', fontSize: 12 };

const AnalyticsDashboard: React.FC = () => {
  const [selectedCycle, setSelectedCycle] = useState<number | ''>('');
  const [selectedDept, setSelectedDept] = useState<number | ''>('');

  const { data: cycles } = useGetCyclesQuery();
  const { data: departments } = useGetDepartmentsQuery();

  const { data: appraisalStatus, isFetching: loadingStatus } = useGetAppraisalStatusReportQuery(Number(selectedCycle), { skip: !selectedCycle });
  const { data: kpiReport, isFetching: loadingKpi } = useGetKpiAchievementReportQuery({ cycleId: Number(selectedCycle), departmentId: selectedDept ? Number(selectedDept) : undefined }, { skip: !selectedCycle });
  const { data: rankingReport, isFetching: loadingRanking } = useGetPerformanceRankingReportQuery(Number(selectedCycle), { skip: !selectedCycle });
  const { data: pipReport } = useGetPipTrackingReportQuery();

  const [downloadReport] = useDownloadReportMutation();

  const handleDownload = async (endpoint: string, params: any, fileName: string) => {
    try { await downloadReport({ endpoint, params, fileName }).unwrap(); }
    catch { alert('Failed to download report'); }
  };

  const appraisalPieData = appraisalStatus?.data ? [
    { name: 'Completed', value: appraisalStatus.data.completed },
    { name: 'In Progress', value: appraisalStatus.data.inProgress },
    { name: 'Pending', value: appraisalStatus.data.pending },
  ] : [];

  const selectStyle: React.CSSProperties = { background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#111827', fontFamily: 'inherit' };

  return (
    <div className="space-y-4 pb-8">
      {/* Header & Filters */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>Reporting & Analytics</h1>
          <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>Strategic insights into organizational performance.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 8 }}>
            <Filter size={13} color="#9EA3B0" />
            <select style={selectStyle} value={selectedCycle} onChange={e => setSelectedCycle(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select Appraisal Cycle</option>
              {cycles?.map(c => <option key={c.cycleId} value={c.cycleId}>{c.cycleName}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 8 }}>
            <Users size={13} color="#9EA3B0" />
            <select style={selectStyle} value={selectedDept} onChange={e => setSelectedDept(e.target.value ? Number(e.target.value) : '')}>
              <option value="">All Departments</option>
              {departments?.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
            </select>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 8, cursor: 'pointer' }}
            className="hover:border-[#1A56DB] hover:text-[#1A56DB] transition-colors"
            onClick={() => window.location.reload()}>
            <RefreshCw size={14} color="#9EA3B0" />
          </button>
        </div>
      </div>

      {!selectedCycle ? (
        <div style={{ background: '#EEF3FD', border: '2px dashed #B5D4F4', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, background: '#FFFFFF', border: '0.5px solid #B5D4F4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Target size={22} color="#1A56DB" />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: '#0C447C', marginBottom: 6 }}>Select a cycle to view analytics</h3>
          <p style={{ fontSize: 12, color: '#5A6070', maxWidth: 360, margin: '0 auto' }}>
            Choose an active or historical appraisal cycle from the dropdown above to generate performance insights.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Appraisal Completion Pie */}
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 18px' }} className="lg:col-span-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Appraisal Completion Status</span>
              <button onClick={() => handleDownload('appraisal-status', { cycleId: selectedCycle }, `Appraisal_Status_${selectedCycle}.pdf`)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9EA3B0', display: 'flex' }}
                className="hover:text-[#1A56DB] transition-colors">
                <Download size={15} />
              </button>
            </div>

            <div style={{ height: 220, position: 'relative' }}>
              {loadingStatus ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9EA3B0' }}>Generating...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={appraisalPieData} innerRadius={55} outerRadius={75} paddingAngle={6} dataKey="value">
                      {appraisalPieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <div style={{ padding: '8px 10px', background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: '#9EA3B0', marginBottom: 2 }}>Total</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{appraisalStatus?.data?.totalEmployees || 0}</p>
              </div>
              <div style={{ padding: '8px 10px', background: '#EAF3DE', border: '0.5px solid #B8DCA0', borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: '#27500A', marginBottom: 2 }}>Live Rate</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#27500A' }}>
                  {appraisalStatus?.data ? Math.round((appraisalStatus.data.completed / appraisalStatus.data.totalEmployees) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* KPI Achievement Bar Chart */}
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 18px' }} className="lg:col-span-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KPI Achievement Distribution</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleDownload('kpi-achievement', { cycleId: selectedCycle, departmentId: selectedDept }, `KPI_Report_${selectedCycle}.pdf`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#EEF3FD', color: '#0C447C', border: '0.5px solid #B5D4F4', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
                  className="hover:bg-[#D6E8F9] transition-colors">
                  <FileText size={11} /> PDF
                </button>
                <button onClick={() => handleDownload('kpi-achievement', { cycleId: selectedCycle, departmentId: selectedDept, format: 'excel' }, `KPI_Report_${selectedCycle}.xlsx`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#EAF3DE', color: '#27500A', border: '0.5px solid #B8DCA0', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
                  className="hover:opacity-80 transition-opacity">
                  <FileSpreadsheet size={11} /> EXCEL
                </button>
              </div>
            </div>

            <div style={{ height: 260 }}>
              {loadingKpi ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9EA3B0' }}>Calculating Data...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpiReport?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F6" />
                    <XAxis dataKey="employeeName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9EA3B0' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9EA3B0' }} />
                    <Tooltip cursor={{ fill: '#F5F6F8' }} contentStyle={tooltipStyle} />
                    <Bar dataKey="totalWeightedScore" fill="#1A56DB" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Performance Ranking Table */}
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }} className="lg:col-span-7">
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #E4E6EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Performers Leaderboard</span>
              <button onClick={() => handleDownload('performance-ranking', { cycleId: selectedCycle }, `Performance_Ranking_${selectedCycle}.pdf`)}
                style={{ fontSize: 12, color: '#1A56DB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                className="hover:underline">
                Export Full Ranking
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 380 }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #E4E6EC', background: '#F5F6F8' }}>
                    {['Rank', 'Employee', 'Final Score'].map((h, i) => (
                      <th key={h} style={{ padding: '9px 14px', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i === 2 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingRanking ? (
                    <tr><td colSpan={3} style={{ padding: '32px 14px', textAlign: 'center', fontSize: 12, color: '#9EA3B0' }}>Ranking data incoming...</td></tr>
                  ) : rankingReport?.data?.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '32px 14px', textAlign: 'center', fontSize: 12, color: '#9EA3B0' }}>No appraisal data found for this cycle.</td></tr>
                  ) : rankingReport?.data?.slice(0, 5).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '0.5px solid #F0F2F6' }} className="hover:bg-[#FAFBFF] transition-colors">
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#1A56DB' }}>#{row.rank}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{row.employeeName}</div>
                        <div style={{ fontSize: 11, color: '#9EA3B0', marginTop: 1 }}>{row.departmentName}</div>
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        <span style={{ padding: '2px 8px', background: '#EEF3FD', color: '#0C447C', border: '0.5px solid #B5D4F4', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                          {Number(row.currentScore || 0).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PIP + Strategic Insights */}
          <div className="lg:col-span-5 space-y-3">
            {/* PIP Panel */}
            <div style={{ background: '#111827', borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} color="#FFFFFF" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>PIP Tracking</h4>
                    <p style={{ fontSize: 11, color: '#9EA3B0', marginTop: 1 }}>Performance Improvement Oversight</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#9EA3B0', marginBottom: 2 }}>Active</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF' }}>{pipReport?.data?.totalActivePip || 0}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#B8DCA0', marginBottom: 2 }}>Passed</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#B8DCA0' }}>{pipReport?.data?.successfulCount || 0}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#F5BFBF', marginBottom: 2 }}>Failed</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#F5BFBF' }}>{pipReport?.data?.failedCount || 0}</p>
                  </div>
                </div>

                <button onClick={() => handleDownload('pip-tracking', {}, 'PIP_Global_Report.pdf')}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  className="hover:bg-white/15 transition-colors">
                  Download Global PIP Audit
                </button>
              </div>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: 12, opacity: 0.06 }}>
                <AlertCircle size={80} color="#FFFFFF" />
              </div>
            </div>

            {/* Strategic Tip */}
            <div style={{ background: '#111827', borderRadius: 12, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Strategic Tip</p>
              <p style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.6, marginBottom: 14 }}>
                Appraisal cycles with over 85% completion rate in the first 2 weeks correlate with higher employee satisfaction scores.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#FFFFFF' }}>EP</div>
                <p style={{ fontSize: 12, color: '#9EA3B0' }}>EPMS AI Insights</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
