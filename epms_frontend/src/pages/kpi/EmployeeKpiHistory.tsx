import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetEmployeeKpiHistoryQuery, useGetGoalSetAuditTrailQuery } from '../../services/kpiApi';
import {
  ChevronLeft, Calendar, Target, TrendingUp, Clock, AlertCircle, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateGoalSetMetrics } from '../../utils/kpiTransformationService';

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  APPROVED: { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0' },
  LOCKED:   { bg: '#F1EFE8', text: '#444441', border: '#DDDBD2' },
  DRAFT:    { bg: '#FAEEDA', text: '#633806', border: '#F0D4A4' },
};

const AUDIT_ACTION_STYLE: Record<string, { bg: string; text: string }> = {
  PROGRESS_UPDATE: { bg: '#EAF3DE', text: '#27500A' },
  ITEM:            { bg: '#EEF3FD', text: '#0C447C' },
};

const EmployeeKpiHistory: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [selectedGoalSetId, setSelectedGoalSetId] = useState<number | null>(null);

  const { data: historyResponse, isLoading: historyLoading } = useGetEmployeeKpiHistoryQuery(Number(employeeId));
  const { data: auditResponse, isLoading: auditLoading } = useGetGoalSetAuditTrailQuery(selectedGoalSetId || 0, { skip: !selectedGoalSetId });

  const goalSets = historyResponse?.data || [];
  const auditLogs = auditResponse?.data || [];
  const selectedGoalSet = goalSets.find(gs => gs.id === selectedGoalSetId);
  const metrics = selectedGoalSet ? calculateGoalSetMetrics(selectedGoalSet) : null;

  if (historyLoading) return (
    <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Loading KPI history…</div>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #E4E6EC', borderRadius: 8, background: '#FFFFFF', color: '#5A6070', flexShrink: 0 }}
          className="hover:bg-[#F5F6F8] transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>KPI Performance History</h1>
          <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 1 }}>Review past performance cycles and goal audit logs.</p>
        </div>
      </div>

      {/* Cycle Selector */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 16px' }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Performance Timeline</p>
          <p style={{ fontSize: 11, color: '#9EA3B0', marginTop: 2 }}>Select an appraisal cycle to view details</p>
        </div>
        <div className="relative" style={{ minWidth: 260 }}>
          <Calendar size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9EA3B0' }} />
          <select value={selectedGoalSetId || ''}
            onChange={e => setSelectedGoalSetId(Number(e.target.value))}
            style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '8px 36px 8px 12px', fontSize: 13, color: '#111827', outline: 'none', width: '100%', appearance: 'none' as any }}>
            <option value="" disabled>Choose a performance cycle…</option>
            {goalSets.map(gs => (
              <option key={gs.id} value={gs.id}>
                {gs.appraisalCycleName || 'Annual Cycle'} ({gs.status}) — {calculateGoalSetMetrics(gs).finalScore.toFixed(0)}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {goalSets.length === 0 && (
        <div style={{ background: '#FFFFFF', border: '0.5px dashed #E0E2E8', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: '#F5F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <AlertCircle size={22} style={{ color: '#9EA3B0' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 4 }}>No History Found</p>
          <p style={{ fontSize: 12, color: '#9EA3B0', maxWidth: 320, margin: '0 auto' }}>This employee doesn't have any past performance cycles recorded in the system yet.</p>
        </div>
      )}

      {/* Selected cycle details */}
      {selectedGoalSet && metrics ? (
        <div className="space-y-4">
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#1A56DB' }} />
              <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Cycle Performance Score</p>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: 28, fontWeight: 500, color: '#111827' }}>{metrics.finalScore.toFixed(1)}%</span>
                <span style={{ fontSize: 10, fontWeight: 500, background: '#EAF3DE', color: '#27500A', border: '0.5px solid #B8DCA0', borderRadius: 4, padding: '2px 6px' }}>Target Met</span>
              </div>
              <TrendingUp size={48} style={{ position: 'absolute', right: 12, bottom: 10, color: '#E4E6EC', opacity: 0.5 }} />
            </div>

            <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Goal Completion Rate</p>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: 28, fontWeight: 500, color: '#111827' }}>{metrics.completionRate.toFixed(1)}%</span>
                <span style={{ fontSize: 12, color: '#9EA3B0' }}>/ 100%</span>
              </div>
              <Target size={48} style={{ position: 'absolute', right: 12, bottom: 10, color: '#E4E6EC', opacity: 0.5 }} />
            </div>

            <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Cycle Status</p>
              {(() => {
                const ss = STATUS_STYLE[selectedGoalSet.status] || { bg: '#F5F6F8', text: '#9EA3B0', border: '#E0E2E8' };
                return (
                  <span style={{ fontSize: 14, fontWeight: 500, background: ss.bg, color: ss.text, border: `0.5px solid ${ss.border}`, borderRadius: 20, padding: '4px 12px', display: 'inline-block' }}>
                    {selectedGoalSet.status}
                  </span>
                );
              })()}
              <Clock size={48} style={{ position: 'absolute', right: 12, bottom: 10, color: '#E4E6EC', opacity: 0.5 }} />
            </div>
          </div>

          {/* Objectives + Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Objectives */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Assigned Objectives</p>
              <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
                {selectedGoalSet.items?.map((item, idx) => {
                  const pct = Math.min(((item.currentProgress || 0) / (item.targetValue || 1)) * 100, 100);
                  return (
                    <div key={item.id} style={{ padding: '14px 16px', borderBottom: idx < (selectedGoalSet.items?.length || 0) - 1 ? '0.5px solid #F0F2F6' : 'none' }}
                      className="hover:bg-[#FAFBFF] transition-colors">
                      <div className="flex justify-between items-start" style={{ marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{item.title}</p>
                          <p style={{ fontSize: 10, color: '#9EA3B0', textTransform: 'uppercase' }}>Weight: {item.weightPercent}%</p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>
                          {item.currentProgress} <span style={{ fontSize: 10, color: '#9EA3B0', textTransform: 'uppercase' }}>{item.unit}</span>
                        </span>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: 10, color: '#9EA3B0', marginBottom: 4 }}>
                        <span>Progress</span>
                        <span style={{ color: '#1A56DB', fontWeight: 500 }}>{pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ background: '#F0F2F6', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#1A56DB', width: `${pct}%`, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit Trail */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Goal Journey</p>
              <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ borderLeft: '0.5px solid #E4E6EC', marginLeft: 8, paddingBottom: 8 }} className="space-y-6">
                  {auditLoading ? (
                    <div className="space-y-3 pl-6">
                      {[1, 2, 3].map(i => <div key={i} style={{ height: 56, background: '#F5F6F8', borderRadius: 8 }} />)}
                    </div>
                  ) : auditLogs.map(log => {
                    const actionKey = log.action.includes('ITEM') ? 'ITEM' : log.action;
                    const as = AUDIT_ACTION_STYLE[actionKey] || { bg: '#EEF3FD', text: '#0C447C' };
                    return (
                      <div key={log.id} className="relative" style={{ paddingLeft: 22 }}>
                        <div style={{ position: 'absolute', left: -5, top: 4, width: 10, height: 10, borderRadius: '50%', background: '#1A56DB', border: '2px solid #FFFFFF' }} />
                        <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', background: as.bg, color: as.text, borderRadius: 4, padding: '2px 6px' }}>
                            {log.action.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: 10, color: '#9EA3B0' }}>
                            {format(new Date(log.createdAt), 'dd/MM/yyyy, h:mm a')}
                          </span>
                        </div>
                        {log.changeDetails && (
                          <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', marginBottom: 4 }}>{log.changeDetails}</p>
                        )}
                        {log.changeReason && (
                          <div style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 6 }}>
                            <MessageSquare size={12} style={{ color: '#9EA3B0', marginTop: 1, flexShrink: 0 }} />
                            <p style={{ fontSize: 12, color: '#5A6070', fontStyle: 'italic' }}>"{log.changeReason}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {auditLogs.length === 0 && !auditLoading && (
                    <div style={{ paddingLeft: 22, textAlign: 'center', paddingTop: 16 }}>
                      <Clock size={32} style={{ color: '#E0E2E8', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 11, color: '#9EA3B0' }}>No history logs available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : goalSets.length > 0 ? (
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Target size={24} style={{ color: '#1A56DB' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 4 }}>Select a Cycle</p>
          <p style={{ fontSize: 12, color: '#9EA3B0' }}>Pick a performance cycle from the timeline above to explore detailed scores and history.</p>
        </div>
      ) : null}
    </div>
  );
};

export default EmployeeKpiHistory;
