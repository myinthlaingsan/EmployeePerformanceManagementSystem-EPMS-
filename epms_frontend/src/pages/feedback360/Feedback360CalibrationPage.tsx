import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useGetAllSummariesByCycleQuery,
  useGetCalibrationDeltasQuery,
  useGetScoreDistributionQuery,
  useFlagSummaryForReviewMutation,
  useAdjustSummaryScoreMutation,
  useApproveSummaryMutation,
  useRevertSummaryMutation,
  useLockCalibrationCycleMutation,
  useListCalibrationSessionsQuery,
  useCreateCalibrationSessionMutation,
} from '../../features/feedback360/feedback360Api';
import {
  Flag, CheckCircle2, RotateCcw, Sliders, Lock, BarChart2, List, Plus, ChevronDown, ChevronUp
} from 'lucide-react';
import type { FeedbackSummaryResponse, CalibrationStatus } from '../../features/feedback360/feedback360Types';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NOT_STARTED:  { bg: '#F5F6F8', text: '#5A6070', border: '#E4E6EC' },
  UNDER_REVIEW: { bg: '#FFF8E6', text: '#633806', border: '#F5D48A' },
  ADJUSTED:     { bg: '#EEF3FD', text: '#0C447C', border: '#BFD4F5' },
  APPROVED:     { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0' },
  LOCKED:       { bg: '#F0F1F5', text: '#9EA3B0', border: '#D0D3DC' },
};

const StatusBadge = ({ status }: { status?: CalibrationStatus | null }) => {
  const s = status ?? 'NOT_STARTED';
  const c = STATUS_COLORS[s] ?? STATUS_COLORS.NOT_STARTED;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
      textTransform: 'uppercase', letterSpacing: '0.4px',
    }}>
      {s.replace('_', ' ')}
    </span>
  );
};

interface AdjustModalProps {
  summary: FeedbackSummaryResponse;
  onClose: () => void;
}

const AdjustModal = ({ summary, onClose }: AdjustModalProps) => {
  const [score, setScore] = useState<string>(
    String(summary.calibratedFinalScore ?? summary.totalAverageScore ?? '')
  );
  const [reason, setReason] = useState('');
  const [adjust, { isLoading }] = useAdjustSummaryScoreMutation();

  const handleSave = async () => {
    const parsed = parseFloat(score);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error('Score must be between 0 and 100'); return;
    }
    if (!reason.trim()) { toast.error('Calibration reason is required'); return; }
    try {
      await adjust({ summaryId: summary.summaryId!, calibratedFinalScore: parsed, calibrationReason: reason.trim() }).unwrap();
      toast.success('Score calibrated');
      onClose();
    } catch (e: any) { toast.error(e?.data?.message || 'Failed to adjust score'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Calibrate Score</p>
        <p style={{ fontSize: 12, color: '#5A6070', marginBottom: 16 }}>{summary.targetUserName}</p>

        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#5A6070', marginBottom: 4 }}>Raw System Score</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
            {summary.totalAverageScore?.toFixed(2) ?? '—'}
          </p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#5A6070', display: 'block', marginBottom: 4 }}>
            Calibrated Score (0–100) *
          </label>
          <input
            type="number" step="0.1" min="0" max="100"
            value={score}
            onChange={e => setScore(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #E4E6EC', borderRadius: 8, fontSize: 14 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#5A6070', display: 'block', marginBottom: 4 }}>
            Reason * (required)
          </label>
          <textarea
            rows={3} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Explain why the score is being adjusted..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #E4E6EC', borderRadius: 8, fontSize: 13, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #E4E6EC', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isLoading} style={{ padding: '8px 16px', background: '#1A56DB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Saving…' : 'Save Calibration'}
          </button>
        </div>
      </div>
    </div>
  );
};

const BUCKET_ORDER = ['0-60', '60-70', '70-80', '80-90', '90-100'];
const BUCKET_COLORS = ['#FCEBEB', '#FAEEDA', '#EEF3FD', '#EAF3DE', '#D4EDDA'];

const DistributionChart = ({ cycleId }: { cycleId: number }) => {
  const { data: raw } = useGetScoreDistributionQuery({ cycleId, calibrated: false });
  const { data: cal } = useGetScoreDistributionQuery({ cycleId, calibrated: true });
  const maxVal = useMemo(() => {
    if (!raw) return 1;
    return Math.max(...BUCKET_ORDER.map(b => raw.rawBuckets[b] ?? 0), 1);
  }, [raw]);

  return (
    <div style={{ background: '#fff', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <BarChart2 size={14} style={{ color: '#1A56DB' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Score Distribution</p>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9EA3B0' }}>
          Avg raw: {raw?.rawAverage?.toFixed(1) ?? '—'} | calibrated: {cal?.calibratedAverage?.toFixed(1) ?? '—'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
        {BUCKET_ORDER.map((b, i) => {
          const r = raw?.rawBuckets[b] ?? 0;
          const h = (r / maxVal) * 72;
          return (
            <div key={b} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 10, color: '#5A6070' }}>{r}</span>
              <div style={{ width: '100%', height: h, background: BUCKET_COLORS[i], border: `0.5px solid ${BUCKET_COLORS[i]}`, borderRadius: 4, minHeight: 4 }} />
              <span style={{ fontSize: 9, color: '#9EA3B0' }}>{b}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SummaryRow = ({
  summary, onAdjust,
}: {
  summary: FeedbackSummaryResponse;
  onAdjust: (s: FeedbackSummaryResponse) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [flag, { isLoading: isFlagging }] = useFlagSummaryForReviewMutation();
  const [approve, { isLoading: isApproving }] = useApproveSummaryMutation();
  const [revert, { isLoading: isReverting }] = useRevertSummaryMutation();
  const isLocked = summary.calibrationStatus === 'LOCKED';
  const displayScore = summary.calibratedFinalScore ?? summary.totalAverageScore;

  const handleFlag = async () => {
    if (!summary.summaryId) return;
    try { await flag(summary.summaryId).unwrap(); toast.success('Flagged for review'); }
    catch (e: any) { toast.error(e?.data?.message || 'Failed'); }
  };
  const handleApprove = async () => {
    if (!summary.summaryId) return;
    try { await approve({ summaryId: summary.summaryId }).unwrap(); toast.success('Approved'); }
    catch (e: any) { toast.error(e?.data?.message || 'Failed'); }
  };
  const handleRevert = async () => {
    if (!summary.summaryId) return;
    try { await revert(summary.summaryId).unwrap(); toast.success('Reverted'); }
    catch (e: any) { toast.error(e?.data?.message || 'Failed'); }
  };

  return (
    <>
      <tr style={{ borderBottom: '0.5px solid #F0F2F6' }} className="hover:bg-[#FAFBFF] transition-colors">
        <td style={{ padding: '10px 18px', fontSize: 13, color: '#111827', fontWeight: 500 }}>
          <button onClick={() => setExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {summary.targetUserName}
          </button>
        </td>
        <td style={{ padding: '10px 18px', textAlign: 'center', fontSize: 12, color: '#5A6070' }}>
          {summary.totalAverageScore?.toFixed(2) ?? '—'}
        </td>
        <td style={{ padding: '10px 18px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: summary.calibratedFinalScore != null ? '#1A56DB' : '#5A6070' }}>
          {typeof displayScore === 'number' ? displayScore.toFixed(2) : '—'}
          {summary.calibratedFinalScore != null && (
            <span style={{ marginLeft: 4, fontSize: 10, color: '#9EA3B0' }}>
              (Δ {(summary.calibratedFinalScore - summary.totalAverageScore).toFixed(2)})
            </span>
          )}
        </td>
        <td style={{ padding: '10px 18px', textAlign: 'center' }}>
          <StatusBadge status={summary.calibrationStatus} />
        </td>
        <td style={{ padding: '10px 18px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isLocked && summary.calibrationStatus !== 'UNDER_REVIEW' && summary.calibrationStatus !== 'ADJUSTED' && summary.calibrationStatus !== 'APPROVED' && (
              <button onClick={handleFlag} disabled={isFlagging} title="Flag for Review"
                style={{ padding: '4px 10px', fontSize: 11, border: '0.5px solid #F5D48A', background: '#FFF8E6', color: '#633806', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Flag size={10} /> Flag
              </button>
            )}
            {!isLocked && (summary.calibrationStatus === 'UNDER_REVIEW' || summary.calibrationStatus === 'ADJUSTED' || summary.calibrationStatus === 'APPROVED') && (
              <button onClick={() => onAdjust(summary)} title="Adjust Score"
                style={{ padding: '4px 10px', fontSize: 11, border: '0.5px solid #BFD4F5', background: '#EEF3FD', color: '#0C447C', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Sliders size={10} /> Adjust
              </button>
            )}
            {!isLocked && summary.calibrationStatus === 'UNDER_REVIEW' && (
              <button onClick={() => onAdjust(summary)} title="Set Score"
                style={{ padding: '4px 10px', fontSize: 11, border: '0.5px solid #BFD4F5', background: '#EEF3FD', color: '#0C447C', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Sliders size={10} /> Set Score
              </button>
            )}
            {!isLocked && summary.calibrationStatus === 'ADJUSTED' && (
              <>
                <button onClick={handleApprove} disabled={isApproving} title="Approve"
                  style={{ padding: '4px 10px', fontSize: 11, border: '0.5px solid #B8DCA0', background: '#EAF3DE', color: '#27500A', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle2 size={10} /> Approve
                </button>
                <button onClick={handleRevert} disabled={isReverting} title="Revert"
                  style={{ padding: '4px 10px', fontSize: 11, border: '0.5px solid #E4E6EC', background: '#F5F6F8', color: '#5A6070', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <RotateCcw size={10} /> Revert
                </button>
              </>
            )}
            {!isLocked && summary.calibrationStatus === 'UNDER_REVIEW' && (
              <button onClick={handleApprove} disabled={isApproving} title="No change needed"
                style={{ padding: '4px 10px', fontSize: 11, border: '0.5px solid #B8DCA0', background: '#EAF3DE', color: '#27500A', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <CheckCircle2 size={10} /> No Change
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: '#FAFBFF' }}>
          <td colSpan={5} style={{ padding: '10px 28px 14px' }}>
            <div style={{ fontSize: 12, color: '#5A6070' }}>
              {summary.calibrationReason && (
                <p><strong>Reason:</strong> {summary.calibrationReason}</p>
              )}
              {summary.managerSummary && (
                <p style={{ marginTop: 4 }}><strong>Manager summary:</strong> {summary.managerSummary}</p>
              )}
              <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                {summary.managerScores?.length > 0 && (
                  <span>Manager avg: <strong>{summary.managerScores.reduce((a, b) => a + b.averageScore, 0) / summary.managerScores.length | 0}%</strong></span>
                )}
                {summary.peerScores?.length > 0 && (
                  <span>Peer avg: <strong>{summary.peerScores.reduce((a, b) => a + b.averageScore, 0) / summary.peerScores.length | 0}%</strong></span>
                )}
                {summary.subordinateScores?.length > 0 && (
                  <span>Subordinate avg: <strong>{summary.subordinateScores.reduce((a, b) => a + b.averageScore, 0) / summary.subordinateScores.length | 0}%</strong></span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const Feedback360CalibrationPage = () => {
  const [searchParams] = useSearchParams();
  const cycleId = Number(searchParams.get('cycleId'));

  const { data: summaries = [], isLoading } = useGetAllSummariesByCycleQuery(cycleId, { skip: !cycleId });
  const { data: deltas = [] } = useGetCalibrationDeltasQuery(cycleId, { skip: !cycleId });
  const [lockCycle, { isLoading: isLocking }] = useLockCalibrationCycleMutation();
  const [createSession, { isLoading: isCreatingSession }] = useCreateCalibrationSessionMutation();

  const [adjustTarget, setAdjustTarget] = useState<FeedbackSummaryResponse | null>(null);
  const [view, setView] = useState<'table' | 'deltas'>('table');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { NOT_STARTED: 0, UNDER_REVIEW: 0, ADJUSTED: 0, APPROVED: 0, LOCKED: 0 };
    summaries.forEach(s => { const k = s.calibrationStatus ?? 'NOT_STARTED'; counts[k] = (counts[k] ?? 0) + 1; });
    return counts;
  }, [summaries]);

  const filtered = useMemo(() =>
    filterStatus === 'ALL' ? summaries
      : summaries.filter(s => (s.calibrationStatus ?? 'NOT_STARTED') === filterStatus),
    [summaries, filterStatus]);

  const handleLock = async () => {
    try { await lockCycle(cycleId).unwrap(); toast.success('Cycle locked — all summaries finalized'); setShowLockConfirm(false); }
    catch (e: any) { toast.error(e?.data?.message || 'Lock failed'); }
  };

  if (!cycleId) return <div style={{ padding: 24, fontSize: 13, color: '#791F1F' }}>No cycleId in URL. Add ?cycleId=X</div>;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Calibration Workbench</p>
          <p style={{ fontSize: 12, color: '#9EA3B0' }}>Cycle ID: {cycleId}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView(v => v === 'table' ? 'deltas' : 'table')}
            style={{ padding: '7px 14px', fontSize: 12, border: '0.5px solid #E4E6EC', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {view === 'table' ? <><BarChart2 size={13} /> View Deltas</> : <><List size={13} /> View Table</>}
          </button>
          <button onClick={() => setShowLockConfirm(true)} disabled={isLocking}
            style={{ padding: '7px 14px', fontSize: 12, border: 'none', borderRadius: 8, background: '#111827', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isLocking ? 0.7 : 1 }}>
            <Lock size={13} /> Lock Cycle
          </button>
        </div>
      </div>

      {/* Status counters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['ALL', 'NOT_STARTED', 'UNDER_REVIEW', 'ADJUSTED', 'APPROVED', 'LOCKED'] as const).map(s => {
          const count = s === 'ALL' ? summaries.length : (statusCounts[s] ?? 0);
          const c = s === 'ALL' ? { bg: '#F5F6F8', text: '#111827', border: '#E4E6EC' } : STATUS_COLORS[s];
          return (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `0.5px solid ${filterStatus === s ? c.text : c.border}`, background: filterStatus === s ? c.bg : '#fff', color: c.text, fontSize: 12, cursor: 'pointer', fontWeight: filterStatus === s ? 600 : 400 }}>
              {s.replace('_', ' ')} <strong>({count})</strong>
            </button>
          );
        })}
      </div>

      {/* Distribution chart */}
      <DistributionChart cycleId={cycleId} />

      {/* Main content */}
      {view === 'table' ? (
        <div style={{ background: '#fff', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '0.5px solid #E4E6EC', background: '#FAFBFF', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={14} style={{ color: '#1A56DB' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Summary Calibration ({filtered.length})</p>
          </div>
          {isLoading ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #E4E6EC' }}>
                    {['Employee', 'Raw Score', 'Effective Score', 'Status', 'Actions'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i > 0 ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <SummaryRow key={s.summaryId ?? s.targetUserId} summary={s} onAdjust={setAdjustTarget} />
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>No summaries match the filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '0.5px solid #E4E6EC', background: '#FAFBFF', display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={14} style={{ color: '#1A56DB' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Calibration Deltas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #E4E6EC' }}>
                  {['Employee', 'Department', 'Raw Score', 'Calibrated', 'Δ Delta', 'Status', 'Reason'].map((h, i) => (
                    <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i > 0 ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deltas.map(d => (
                  <tr key={d.summaryId} style={{ borderBottom: '0.5px solid #F0F2F6' }}>
                    <td style={{ padding: '10px 18px', fontSize: 13, color: '#111827', fontWeight: 500 }}>{d.employeeName}</td>
                    <td style={{ padding: '10px 18px', textAlign: 'center', fontSize: 12, color: '#5A6070' }}>{d.departmentName}</td>
                    <td style={{ padding: '10px 18px', textAlign: 'center', fontSize: 12, color: '#5A6070' }}>{d.rawFinalScore?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '10px 18px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: d.calibratedFinalScore != null ? '#1A56DB' : '#5A6070' }}>{d.calibratedFinalScore?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '10px 18px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: d.delta != null ? (d.delta > 0 ? '#27500A' : d.delta < 0 ? '#791F1F' : '#5A6070') : '#5A6070' }}>
                      {d.delta != null ? (d.delta > 0 ? '+' : '') + d.delta.toFixed(2) : '—'}
                    </td>
                    <td style={{ padding: '10px 18px', textAlign: 'center' }}><StatusBadge status={d.calibrationStatus} /></td>
                    <td style={{ padding: '10px 18px', fontSize: 11, color: '#5A6070', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.calibrationReason ?? ''}>{d.calibrationReason ?? '—'}</td>
                  </tr>
                ))}
                {deltas.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>No calibration adjustments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust modal */}
      {adjustTarget && <AdjustModal summary={adjustTarget} onClose={() => setAdjustTarget(null)} />}

      {/* Lock confirm dialog */}
      {showLockConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Lock Calibration Cycle?</p>
            <p style={{ fontSize: 13, color: '#5A6070', marginBottom: 20 }}>
              All summaries will be set to LOCKED and cannot be edited. Any summary still UNDER_REVIEW or ADJUSTED must be approved or reverted first.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowLockConfirm(false)} style={{ padding: '8px 16px', border: '1px solid #E4E6EC', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleLock} disabled={isLocking} style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', opacity: isLocking ? 0.7 : 1 }}>
                {isLocking ? 'Locking…' : 'Confirm Lock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback360CalibrationPage;
