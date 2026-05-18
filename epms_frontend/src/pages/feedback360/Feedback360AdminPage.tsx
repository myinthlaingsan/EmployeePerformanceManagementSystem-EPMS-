import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  RefreshCw, Play, Eye, CheckCircle, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Lock, Edit3, X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useLazyPreviewFeedbackRequestsQuery,
  useGenerateFeedbackRequestsMutation,
  useGetAllSummariesByCycleQuery,
  useGenerateAllSummariesMutation,
  useFinalizeSummaryMutation,
  useRegenerateUserRequestsMutation,
  useCancelFeedbackRequestMutation,
  useReassignFeedbackRequestMutation,
  usePostManagerSummaryMutation,
  useGetScoringPoliciesQuery,
  useUpsertScoringPolicyMutation,
} from '../../features/feedback360/feedback360Api';
import type {
  FeedbackSummaryResponse,
  FeedbackRequestResponse,
  ScoringPolicy,
} from '../../features/feedback360/feedback360Types';
import { FeedbackStatus } from '../../features/feedback360/feedback360Types';
import RelBadge from '../../components/feedback360/RelBadge';
import StatusBadge from '../../components/feedback360/StatusBadge';

// ── Style constants ────────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: '#FFFFFF',
  border: '0.5px solid #E4E6EC',
  borderRadius: 12,
  padding: '20px 22px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  fontSize: 13, color: '#111827', background: '#FAFBFC',
  border: '0.5px solid #E4E6EC', borderRadius: 8,
  padding: '8px 12px', outline: 'none', width: '100%',
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#5A6070',
  marginBottom: 4, display: 'block',
};

const primaryBtn = (disabled = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 500, color: '#FFFFFF',
  background: disabled ? '#93A8E8' : '#1A56DB',
  border: 'none', borderRadius: 8, padding: '8px 16px',
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 500, color: '#1A56DB',
  background: '#EEF3FD', border: '0.5px solid #BFCFFA',
  borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
};

const smBtn = (variant: 'danger' | 'neutral' | 'success'): React.CSSProperties => {
  const map = {
    danger:  { bg: '#FCEBEB', text: '#791F1F', border: '#F5C6C6' },
    neutral: { bg: '#F5F6F8', text: '#5A6070', border: '#E4E6EC' },
    success: { bg: '#EAF3DE', text: '#27500A', border: '#B7E0A0' },
  };
  const c = map[variant];
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, fontWeight: 500, color: c.text,
    background: c.bg, border: `0.5px solid ${c.border}`,
    borderRadius: 6, padding: '3px 9px', cursor: 'pointer',
  };
};

// ── Scoring Policy Editor ──────────────────────────────────────────────────────

const WEIGHT_KEYS: Array<keyof Pick<ScoringPolicy, 'managerWeight' | 'peerWeight' | 'subordinateWeight' | 'selfWeight'>> =
  ['managerWeight', 'peerWeight', 'subordinateWeight', 'selfWeight'];

const WEIGHT_LABELS: Record<string, string> = {
  managerWeight: 'Manager', peerWeight: 'Peer',
  subordinateWeight: 'Subordinate', selfWeight: 'Self',
};

interface PolicyRowState {
  jobLevelId?: number;
  label: string;
  managerWeight: number;
  peerWeight: number;
  subordinateWeight: number;
  selfWeight: number;
  includeSelfInFinal: boolean;
  suppressionThreshold: number;
}

const ScoringPolicyEditor = ({ cycleId }: { cycleId: number }) => {
  const { data: policies, isLoading } = useGetScoringPoliciesQuery(cycleId, { skip: !cycleId });
  const [upsert, { isLoading: saving }] = useUpsertScoringPolicyMutation();
  const [rows, setRows] = useState<PolicyRowState[]>([]);

  useEffect(() => {
    if (!policies) return;
    setRows(policies.map((p) => ({
      jobLevelId: p.jobLevelId,
      label: p.jobLevelId ? `Job Level ${p.jobLevelId}` : 'Default (all levels)',
      managerWeight:        p.managerWeight,
      peerWeight:           p.peerWeight,
      subordinateWeight:    p.subordinateWeight,
      selfWeight:           p.selfWeight,
      includeSelfInFinal:   p.includeSelfInFinal,
      suppressionThreshold: p.suppressionThreshold,
    })));
  }, [policies]);

  const updateRow = (i: number, patch: Partial<PolicyRowState>) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const rowTotal = (row: PolicyRowState) =>
    +(row.managerWeight + row.peerWeight + row.subordinateWeight + row.selfWeight).toFixed(3);

  const handleSave = async (i: number) => {
    const row = rows[i];
    const total = rowTotal(row);
    if (Math.abs(total - 1) > 0.001) {
      toast.error(`Weights must sum to 1.00 (currently ${total.toFixed(3)}).`);
      return;
    }
    try {
      await upsert({ cycleId, ...row }).unwrap();
      toast.success('Scoring policy saved.');
    } catch {
      toast.error('Failed to save scoring policy.');
    }
  };

  if (isLoading) return <p style={{ fontSize: 13, color: '#9EA3B0' }}>Loading policies…</p>;
  if (!rows.length) return <p style={{ fontSize: 13, color: '#9EA3B0' }}>No scoring policies found for this cycle.</p>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E4E6EC', background: '#FAFBFC' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#5A6070', textTransform: 'uppercase' }}>Level</th>
            {WEIGHT_KEYS.map((k) => (
              <th key={k} style={{ textAlign: 'center', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#5A6070', textTransform: 'uppercase' }}>
                {WEIGHT_LABELS[k]}
              </th>
            ))}
            <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#5A6070', textTransform: 'uppercase' }}>Self in Final</th>
            <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#5A6070', textTransform: 'uppercase' }}>Min. Group</th>
            <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#5A6070', textTransform: 'uppercase' }}>Total</th>
            <th style={{ padding: '6px 8px' }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const total = rowTotal(row);
            const valid = Math.abs(total - 1) <= 0.001;
            return (
              <tr key={i} style={{ borderBottom: '0.5px solid #F0F2F8' }}>
                <td style={{ padding: '8px 8px', color: '#111827', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                {WEIGHT_KEYS.map((k) => (
                  <td key={k} style={{ padding: '4px 6px', textAlign: 'center' }}>
                    <input
                      type="number" min={0} max={1} step={0.05}
                      value={row[k]}
                      onChange={(e) => updateRow(i, { [k]: parseFloat(e.target.value) || 0 })}
                      style={{ ...inputStyle, width: 70, textAlign: 'center', padding: '5px 6px' }}
                    />
                  </td>
                ))}
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={row.includeSelfInFinal}
                    onChange={(e) => updateRow(i, { includeSelfInFinal: e.target.checked })}
                    style={{ width: 15, height: 15, cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <input
                    type="number" min={1} max={10} step={1}
                    value={row.suppressionThreshold}
                    onChange={(e) => updateRow(i, { suppressionThreshold: parseInt(e.target.value) || 1 })}
                    style={{ ...inputStyle, width: 60, textAlign: 'center', padding: '5px 6px' }}
                  />
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: valid ? '#059669' : '#EF4444' }}>
                    {total.toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: '4px 8px' }}>
                  <button
                    style={smBtn('success')}
                    onClick={() => handleSave(i)}
                    disabled={!valid || saving}
                  >
                    {saving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    Save
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Calibrate Modal ────────────────────────────────────────────────────────────

interface CalibrateModalProps {
  summary: FeedbackSummaryResponse;
  onClose: () => void;
}

const CalibrateModal = ({ summary, onClose }: CalibrateModalProps) => {
  const [calibratedScore, setCalibratedScore] = useState<string>(
    summary.calibratedFinalScore != null ? String(summary.calibratedFinalScore) : '',
  );
  const [managerSummaryText, setManagerSummaryText] = useState(summary.managerSummary ?? '');
  const [postManagerSummary, { isLoading }] = usePostManagerSummaryMutation();

  const handleSave = async () => {
    if (!summary.summaryId) return;
    try {
      await postManagerSummary({
        summaryId: summary.summaryId,
        managerSummary: managerSummaryText,
        calibratedFinalScore: calibratedScore ? parseFloat(calibratedScore) : undefined,
      }).unwrap();
      toast.success('Calibration saved.');
      onClose();
    } catch {
      toast.error('Failed to save calibration.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 520,
        border: '0.5px solid #E4E6EC', boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '0.5px solid #E4E6EC' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>
            Calibrate — {summary.targetUserName}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9EA3B0' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#9EA3B0', marginBottom: 4 }}>
              System Score (pre-calibration)
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {summary.totalAverageScore.toFixed(2)}
            </p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Calibrated Final Score (optional)</label>
            <input
              type="number" min={0} max={5} step={0.01}
              value={calibratedScore}
              onChange={(e) => setCalibratedScore(e.target.value)}
              placeholder="e.g. 4.25"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Manager Summary</label>
            <textarea
              value={managerSummaryText}
              onChange={(e) => setManagerSummaryText(e.target.value)}
              rows={5}
              placeholder="Overall narrative for this employee's 360° results…"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '0.5px solid #E4E6EC' }}>
          <button style={{ ...smBtn('neutral'), padding: '7px 14px', fontSize: 13 }} onClick={onClose}>Cancel</button>
          <button style={primaryBtn(isLoading)} onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            Save Calibration
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Summary row ────────────────────────────────────────────────────────────────

const ScorePill = ({ score }: { score: number }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
    background: score >= 4 ? '#EAF3DE' : score >= 3 ? '#FAEEDA' : '#FCEBEB',
    color:      score >= 4 ? '#27500A' : score >= 3 ? '#633806' : '#791F1F',
  }}>
    {score.toFixed(2)}
  </span>
);

interface SummaryRowProps {
  summary:     FeedbackSummaryResponse;
  isExpanded:  boolean;
  cycleLocked: boolean;
  onToggle:    () => void;
  onFinalize:  () => void;
  onCalibrate: () => void;
  isFinalizing: boolean;
}

const SummaryRow = ({ summary, isExpanded, cycleLocked, onToggle, onFinalize, onCalibrate, isFinalizing }: SummaryRowProps) => {
  const displayScore = summary.calibratedFinalScore ?? summary.totalAverageScore;

  return (
    <div style={{ border: '0.5px solid #E4E6EC', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#FAFBFC', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{summary.targetUserName}</p>
          {summary.calibratedFinalScore != null && (
            <p style={{ fontSize: 11, color: '#9EA3B0', margin: '2px 0 0' }}>
              Pre-calibration: {summary.totalAverageScore.toFixed(2)}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#9EA3B0' }}>Overall</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', background: '#F5F6F8', padding: '2px 8px', borderRadius: 6 }}>
            {displayScore.toFixed(2)}
          </span>
          {summary.calibratedFinalScore != null && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#EEF3FD', color: '#1A56DB' }}>
              Calibrated
            </span>
          )}
          {!cycleLocked && (
            <button
              style={smBtn('neutral')}
              onClick={(e) => { e.stopPropagation(); onCalibrate(); }}
              disabled={!summary.summaryId}
              title="Calibrate score and write manager summary"
            >
              <Edit3 size={11} />
              {summary.calibratedFinalScore != null || summary.managerSummary ? 'Edit Calibration' : 'Calibrate'}
            </button>
          )}
          {summary.isFinalized ? (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#EAF3DE', color: '#27500A' }}>
              Finalized
            </span>
          ) : !cycleLocked ? (
            <button
              style={smBtn('success')}
              onClick={(e) => { e.stopPropagation(); onFinalize(); }}
              disabled={isFinalizing || !summary.summaryId}
              title="Finalize this summary for employee viewing"
            >
              {isFinalizing ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={11} />}
              Finalize
            </button>
          ) : null}
          {isExpanded ? <ChevronUp size={14} color="#9EA3B0" /> : <ChevronDown size={14} color="#9EA3B0" />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '14px 16px', background: '#FFFFFF', borderTop: '0.5px solid #E4E6EC' }}>
          {summary.managerSummary && (
            <div style={{ marginBottom: 12, padding: '10px 12px', background: '#F5F6F8', borderRadius: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#5A6070', textTransform: 'uppercase', margin: '0 0 4px' }}>Manager Summary</p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{summary.managerSummary}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Manager',     scores: summary.managerScores,     color: '#1A56DB' },
              { label: 'Peer',        scores: summary.peerScores,        color: '#7C3AED' },
              { label: 'Subordinate', scores: summary.subordinateScores, color: '#059669' },
              { label: 'Self',        scores: summary.selfScores,        color: '#D97706' },
            ].map((group) => {
              const a = group.scores?.length
                ? group.scores.reduce((s, c) => s + c.averageScore, 0) / group.scores.length
                : null;
              return (
                <div key={group.label} style={{ background: '#FAFBFC', border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: group.color, textTransform: 'uppercase', margin: '0 0 4px' }}>{group.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                    {a !== null ? a.toFixed(2) : <span style={{ color: '#9EA3B0', fontSize: 13 }}>N/A</span>}
                  </p>
                </div>
              );
            })}
          </div>
          {summary.scores.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #E4E6EC' }}>
                  <th style={{ textAlign: 'left', padding: '4px 6px', color: '#5A6070', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Category</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px', color: '#5A6070', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Weighted</th>
                </tr>
              </thead>
              <tbody>
                {summary.scores.map((c) => (
                  <tr key={c.categoryName} style={{ borderBottom: '0.5px solid #F0F2F8' }}>
                    <td style={{ padding: '5px 6px', color: '#374151' }}>{c.categoryName}</td>
                    <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                      <ScorePill score={c.averageScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// ── Preview table row ──────────────────────────────────────────────────────────

interface PreviewRowProps {
  req: FeedbackRequestResponse;
  cycleLocked: boolean;
  onRegenerate: () => void;
  onCancel: () => void;
  onReassign: () => void;
}

const PreviewRow = ({ req, cycleLocked, onRegenerate, onCancel, onReassign }: PreviewRowProps) => {
  const isDone = req.status === FeedbackStatus.COMPLETED;
  return (
    <tr style={{
      borderBottom: '0.5px solid #F0F2F8',
      background: req.isReciprocalFallback ? '#FFFBEB' : 'transparent',
    }}>
      <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111827' }}>{req.targetUserName}</td>
      <td style={{ padding: '8px 10px', color: '#374151' }}>{req.evaluatorName}</td>
      <td style={{ padding: '8px 10px' }}><RelBadge rel={req.relationship} /></td>
      <td style={{ padding: '8px 10px' }}><StatusBadge status={req.status} /></td>
      <td style={{ padding: '8px 10px', color: '#9EA3B0', fontSize: 12 }}>
        {req.dueDate ? req.dueDate.slice(0, 10) : '—'}
        {req.isReciprocalFallback && (
          <span
            title="No rotated evaluator available — using last cycle's evaluator as fallback"
            style={{ marginLeft: 6, fontSize: 10, color: '#D97706', fontWeight: 600 }}
          >
            Fallback
          </span>
        )}
      </td>
      <td style={{ padding: '8px 10px' }}>
        {!cycleLocked && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={smBtn('neutral')} onClick={onRegenerate}>
              <RefreshCw size={10} /> Regen
            </button>
            {!isDone && (
              <>
                <button style={smBtn('neutral')} onClick={onReassign}>
                  <Edit3 size={10} /> Reassign
                </button>
                <button style={smBtn('danger')} onClick={onCancel}>
                  <X size={10} /> Cancel
                </button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

// ── Reassign modal ─────────────────────────────────────────────────────────────

interface ReassignModalProps {
  requestId: number;
  onClose: () => void;
}

const ReassignModal = ({ requestId, onClose }: ReassignModalProps) => {
  const [newEvaluatorId, setNewEvaluatorId] = useState('');
  const [reassign, { isLoading }] = useReassignFeedbackRequestMutation();

  const handleSave = async () => {
    const id = parseInt(newEvaluatorId);
    if (!id) return toast.error('Enter a valid employee ID.');
    try {
      await reassign({ requestId, newEvaluatorId: id }).unwrap();
      toast.success('Request reassigned.');
      onClose();
    } catch {
      toast.error('Reassignment failed.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#FFFFFF', borderRadius: 12, width: 380, border: '0.5px solid #E4E6EC', boxShadow: '0 12px 40px rgba(0,0,0,0.14)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '0.5px solid #E4E6EC' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Reassign Request</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9EA3B0' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '16px 18px' }}>
          <label style={labelStyle}>New Evaluator Employee ID</label>
          <input
            type="number"
            value={newEvaluatorId}
            onChange={(e) => setNewEvaluatorId(e.target.value)}
            placeholder="Enter employee ID"
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 18px', borderTop: '0.5px solid #E4E6EC' }}>
          <button style={{ ...smBtn('neutral'), padding: '7px 14px', fontSize: 13 }} onClick={onClose}>Cancel</button>
          <button style={primaryBtn(isLoading)} onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const Feedback360AdminPage = () => {
  const { activeCycleId } = useAuth();

  const [cycleId, setCycleId]                         = useState<number>(activeCycleId ?? 0);
  const [previousCycleId, setPreviousCycleId]         = useState<string>('');
  const [globalMaxLimit, setGlobalMaxLimit]           = useState<number>(5);
  const [excludeLongTermLeave, setExcludeLongTermLeave] = useState<boolean>(true);
  const [showPreview, setShowPreview]                 = useState(false);

  const [expandedSummary, setExpandedSummary]   = useState<number | null>(null);
  const [calibrateTarget, setCalibrateTarget]   = useState<FeedbackSummaryResponse | null>(null);
  const [reassignRequestId, setReassignRequestId] = useState<number | null>(null);

  const [previewTrigger, { data: previewData, isFetching: isPreviewing }] = useLazyPreviewFeedbackRequestsQuery();
  const [generate,         { isLoading: isGenerating }]       = useGenerateFeedbackRequestsMutation();
  const [generateSummaries, { isLoading: isGeneratingSummaries }] = useGenerateAllSummariesMutation();
  const [finalizeSummary,  { isLoading: isFinalizing }]       = useFinalizeSummaryMutation();
  const [regenerateUser]                                      = useRegenerateUserRequestsMutation();
  const [cancelRequest]                                       = useCancelFeedbackRequestMutation();

  const { data: summaries, isLoading: summariesLoading } = useGetAllSummariesByCycleQuery(
    cycleId, { skip: !cycleId },
  );

  const cycleLocked = !!(summaries && summaries.length > 0 && summaries.every((s) => s.isFinalized));

  const buildParams = () => ({
    cycleId,
    previousCycleId: previousCycleId ? Number(previousCycleId) : undefined,
    globalMaxLimit,
    excludeLongTermLeave,
  });

  const handlePreview = async () => {
    if (!cycleId) return toast.error('Please enter a cycle ID.');
    setShowPreview(true);
    try { await previewTrigger(buildParams()).unwrap(); } catch { toast.error('Preview failed.'); }
  };

  const handleGenerate = async () => {
    if (!cycleId) return toast.error('Please enter a cycle ID.');
    if (!window.confirm(`Generate feedback requests for cycle ${cycleId}? This may overwrite existing PENDING requests.`)) return;
    try { await generate(buildParams()).unwrap(); toast.success('Requests generated.'); } catch { toast.error('Generation failed.'); }
  };

  const handleGenerateSummaries = async () => {
    if (!cycleId) return toast.error('Please enter a cycle ID.');
    if (!window.confirm(`Generate all summaries for cycle ${cycleId}?`)) return;
    try { await generateSummaries(cycleId).unwrap(); toast.success('Summaries generated.'); } catch { toast.error('Failed.'); }
  };

  const handleFinalize = async (summaryId: number) => {
    if (!window.confirm('Finalize this summary? It will be visible to the employee.')) return;
    try { await finalizeSummary(summaryId).unwrap(); toast.success('Finalized.'); } catch { toast.error('Finalization failed.'); }
  };

  const handleRegenerate = async (req: FeedbackRequestResponse) => {
    try {
      await regenerateUser({ targetEmployeeId: req.targetUserId, cycleId, globalMaxLimit, previousCycleId: previousCycleId ? Number(previousCycleId) : undefined }).unwrap();
      toast.success('Requests regenerated.');
    } catch { toast.error('Regeneration failed.'); }
  };

  const handleCancel = async (requestId: number) => {
    if (!window.confirm('Cancel this feedback request?')) return;
    try { await cancelRequest(requestId).unwrap(); toast.success('Request cancelled.'); } catch { toast.error('Cancellation failed.'); }
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
            360° Feedback Admin Panel
          </h1>
          <p style={{ fontSize: 13, color: '#9EA3B0', marginTop: 4 }}>
            Configure policies, generate requests, and manage summaries.
          </p>
        </div>
        {cycleLocked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#ECFDF5', border: '0.5px solid #A7F3D0', borderRadius: 20 }}>
            <Lock size={13} color="#059669" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>Cycle Locked — All summaries finalized</span>
          </div>
        )}
      </div>

      {/* Cycle selector */}
      <div style={panel}>
        <p style={sectionTitle}>Cycle Settings</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <div>
            <label style={labelStyle}>Cycle ID *</label>
            <input type="number" style={inputStyle} value={cycleId || ''} onChange={(e) => setCycleId(Number(e.target.value))} placeholder="e.g. 3" />
          </div>
          <div>
            <label style={labelStyle}>Previous Cycle ID</label>
            <input type="number" style={inputStyle} value={previousCycleId} onChange={(e) => setPreviousCycleId(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label style={labelStyle}>Max Evaluators per Person</label>
            <input type="number" style={inputStyle} value={globalMaxLimit} min={1} max={20} onChange={(e) => setGlobalMaxLimit(Number(e.target.value))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>Exclude Long-Term Leave</label>
            <div style={{ display: 'flex', alignItems: 'center', height: 36 }}>
              <input type="checkbox" id="excludeLTL" checked={excludeLongTermLeave} onChange={(e) => setExcludeLongTermLeave(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="excludeLTL" style={{ fontSize: 13, color: '#5A6070', marginLeft: 8, cursor: 'pointer' }}>Yes</label>
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Policy Editor */}
      {cycleId > 0 && (
        <div style={panel}>
          <p style={sectionTitle}>Scoring Policy for Cycle {cycleId}</p>
          <ScoringPolicyEditor cycleId={cycleId} />
        </div>
      )}

      {/* Generate / Preview */}
      <div style={panel}>
        <p style={sectionTitle}>Generate / Preview Requests</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={secondaryBtn} onClick={handlePreview} disabled={isPreviewing || cycleLocked}>
            {isPreviewing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={14} />}
            Preview
          </button>
          <button style={primaryBtn(isGenerating || cycleLocked)} onClick={handleGenerate} disabled={isGenerating || cycleLocked}>
            {isGenerating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
            {cycleLocked ? 'Locked' : 'Generate'}
          </button>
          <button
            style={{ ...secondaryBtn, marginLeft: 'auto' }}
            onClick={handleGenerateSummaries}
            disabled={isGeneratingSummaries || !cycleId}
          >
            {isGeneratingSummaries ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
            Generate All Summaries
          </button>
        </div>
      </div>

      {/* Preview results */}
      {showPreview && (
        <div style={panel}>
          <p style={sectionTitle}>Preview — Assignments</p>
          {isPreviewing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0', padding: '12px 0' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13 }}>Loading preview…</span>
            </div>
          ) : !previewData || previewData.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9EA3B0' }}>No assignments to preview.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E4E6EC', background: '#FAFBFC' }}>
                    {['Target', 'Evaluator', 'Relationship', 'Status', 'Due Date / Flags', 'Actions'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: '#5A6070', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((req) => (
                    <PreviewRow
                      key={req.id}
                      req={req}
                      cycleLocked={cycleLocked}
                      onRegenerate={() => handleRegenerate(req)}
                      onCancel={() => handleCancel(req.id)}
                      onReassign={() => setReassignRequestId(req.id)}
                    />
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 10 }}>
                {previewData.length} assignment{previewData.length !== 1 ? 's' : ''} previewed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summaries */}
      <div style={panel}>
        <p style={sectionTitle}>Cycle Summaries</p>
        {!cycleId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0', fontSize: 13 }}>
            <AlertCircle size={15} /> Enter a Cycle ID above to view summaries.
          </div>
        ) : summariesLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0', padding: '12px 0' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Loading summaries…</span>
          </div>
        ) : !summaries || summaries.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9EA3B0' }}>No summaries found for cycle {cycleId}.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {summaries.map((s) => {
              const key = s.summaryId ?? s.targetUserId;
              return (
                <SummaryRow
                  key={key}
                  summary={s}
                  isExpanded={expandedSummary === key}
                  cycleLocked={cycleLocked}
                  onToggle={() => setExpandedSummary(expandedSummary === key ? null : key ?? null)}
                  onFinalize={() => s.summaryId && handleFinalize(s.summaryId)}
                  onCalibrate={() => setCalibrateTarget(s)}
                  isFinalizing={isFinalizing}
                />
              );
            })}
          </div>
        )}
      </div>

      {calibrateTarget && (
        <CalibrateModal summary={calibrateTarget} onClose={() => setCalibrateTarget(null)} />
      )}
      {reassignRequestId !== null && (
        <ReassignModal requestId={reassignRequestId} onClose={() => setReassignRequestId(null)} />
      )}
    </div>
  );
};

export default Feedback360AdminPage;
