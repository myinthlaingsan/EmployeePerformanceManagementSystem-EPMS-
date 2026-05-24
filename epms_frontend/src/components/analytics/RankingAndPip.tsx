import { memo, useMemo, useState } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { DashboardCard, EmptyState, SkeletonBlock } from './DashboardPrimitives';
import { DASHBOARD_COLORS, DASHBOARD_BORDER } from '../../styles/dashboardStyles';
import { formatScore, getTopRows } from '../../utils/reportUtils';
import type { PerformanceRankingReportDTO, PipTrackingReportDTO } from '../../types/report';

export const PerformanceRankingTable = memo(({
  data,
  loading,
  isError,
  pageSize = 5,
  onDownload,
}: {
  data?: PerformanceRankingReportDTO[];
  loading: boolean;
  isError?: boolean;
  pageSize?: number;
  onDownload: () => void;
}) => {
  const [showAll, setShowAll] = useState(false);
  const visibleRows = useMemo(() => showAll ? data || [] : getTopRows(data, pageSize), [data, pageSize, showAll]);

  return (
    <DashboardCard
      className="lg:col-span-7"
      title="Top Performers Leaderboard"
      isError={isError}
      style={{ overflow: 'hidden', padding: 0 }}
      action={(
        <button
          aria-label="Download full performance ranking"
          onClick={onDownload}
          style={{ fontSize: 12, color: DASHBOARD_COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Export Full Ranking
        </button>
      )}
    >
      {loading ? <div style={{ padding: 16 }}><SkeletonBlock height={180} /></div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
            <thead>
              <tr style={{ borderBottom: DASHBOARD_BORDER, background: DASHBOARD_COLORS.surfaceAlt }}>
                {['Rank', 'Employee', 'Final Score'].map((heading, index) => (
                  <th key={heading} style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: DASHBOARD_COLORS.subtle, textTransform: 'uppercase', letterSpacing: 0, textAlign: index === 2 ? 'right' : 'left' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!visibleRows.length ? (
                <tr><td colSpan={3}><EmptyState title="No appraisal data" body="Ranking data will appear after employee scores are available." /></td></tr>
              ) : visibleRows.map((row) => (
                <tr key={`${row.rank}-${row.employeeName}`} style={{ borderBottom: `0.5px solid ${DASHBOARD_COLORS.grid}` }}>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: DASHBOARD_COLORS.primary }}>#{row.rank}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DASHBOARD_COLORS.ink }}>{row.employeeName}</div>
                    <div style={{ fontSize: 11, color: DASHBOARD_COLORS.subtle, marginTop: 1 }}>{row.departmentName}</div>
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                    <span style={{ padding: '2px 8px', background: DASHBOARD_COLORS.primarySoft, color: '#0C447C', border: `0.5px solid ${DASHBOARD_COLORS.primaryBorder}`, borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                      {formatScore(row.currentScore, 2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.length || 0) > pageSize && (
            <button
              aria-label={showAll ? 'Show fewer performers' : 'View all performers'}
              onClick={() => setShowAll((value) => !value)}
              style={{ width: '100%', padding: '10px 14px', background: DASHBOARD_COLORS.surface, border: 'none', borderTop: DASHBOARD_BORDER, color: DASHBOARD_COLORS.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {showAll ? 'Show Top 5' : `View All ${data?.length || 0}`}
            </button>
          )}
        </div>
      )}
    </DashboardCard>
  );
});

export const PipPanel = memo(({ data, onDownload }: { data?: PipTrackingReportDTO; onDownload: () => void }) => (
  <div style={{ background: DASHBOARD_COLORS.dark, borderRadius: 8, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={18} color="#FFFFFF" />
        </div>
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>PIP Tracking</h4>
          <p style={{ fontSize: 11, color: DASHBOARD_COLORS.subtle, marginTop: 1 }}>Performance Improvement Oversight</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Active', value: data?.totalActivePip || 0, color: '#FFFFFF' },
          { label: 'Passed', value: data?.successfulCount || 0, color: DASHBOARD_COLORS.successBorder },
          { label: 'Failed', value: data?.failedCount || 0, color: '#F5BFBF' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: label === 'Active' ? DASHBOARD_COLORS.subtle : color, marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>
      <button
        aria-label="Download global PIP audit"
        onClick={onDownload}
        style={{ width: '100%', padding: 8, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Download Global PIP Audit
      </button>
    </div>
    <div style={{ position: 'absolute', top: 0, right: 0, padding: 12, opacity: 0.06 }}>
      <AlertCircle size={80} color="#FFFFFF" />
    </div>
  </div>
));

export const StrategicInsightCard = () => (
  <div style={{ background: DASHBOARD_COLORS.dark, borderRadius: 8, padding: '18px 20px' }}>
    <p style={{ fontSize: 11, fontWeight: 600, color: DASHBOARD_COLORS.subtle, textTransform: 'uppercase', letterSpacing: 0, marginBottom: 10 }}>Strategic Tip</p>
    <p style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.6, marginBottom: 14 }}>
      Appraisal cycles with over 85% completion rate in the first 2 weeks correlate with higher employee satisfaction scores.
    </p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>EP</div>
      <p style={{ fontSize: 12, color: DASHBOARD_COLORS.subtle }}>EPMS AI Insights</p>
    </div>
  </div>
);
