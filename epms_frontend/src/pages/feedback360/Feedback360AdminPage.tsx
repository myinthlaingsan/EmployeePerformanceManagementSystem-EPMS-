import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  RefreshCw, Play, Eye, CheckCircle, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Lock, Edit3, X, Plus, FileDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDownloadReportMutation } from '../../features/report/reportApi';
import { useGetFeedbackFormsByCycleQuery, useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import type { AppraisalForm } from '../../features/appraisal/appraisalApi';
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
  useListRequestsByCycleQuery,
  useGetFeedbackCycleDashboardQuery,
} from '../../features/feedback360/feedback360Api';
import {
  Users, Mail, Clock, FileText, CheckCircle2, BarChart3,
} from 'lucide-react';
import type {
  FeedbackSummaryResponse,
  FeedbackRequestResponse,
  ScoringPolicy,
} from '../../features/feedback360/feedback360Types';
import { FeedbackStatus } from '../../features/feedback360/feedback360Types';
import RelBadge from '../../components/feedback360/RelBadge';
import StatusBadge from '../../components/feedback360/StatusBadge';
import { useGetAllEmployeesQuery } from '../../features/employee/employeeapi';

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
    danger: { bg: '#FCEBEB', text: '#791F1F', border: '#F5C6C6' },
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
      managerWeight: p.managerWeight,
      peerWeight: p.peerWeight,
      subordinateWeight: p.subordinateWeight,
      selfWeight: p.selfWeight,
      includeSelfInFinal: p.includeSelfInFinal,
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
    color: score >= 4 ? '#27500A' : score >= 3 ? '#633806' : '#791F1F',
  }}>
    {score.toFixed(2)}
  </span>
);

interface SummaryRowProps {
  summary: FeedbackSummaryResponse;
  isExpanded: boolean;
  cycleLocked: boolean;
  onToggle: () => void;
  onFinalize: () => void;
  onCalibrate: () => void;
  isFinalizing: boolean;
  cycleId: number;
}

const SummaryRow = ({ summary, isExpanded, cycleLocked, onToggle, onFinalize, onCalibrate, isFinalizing, cycleId }: SummaryRowProps) => {
  const displayScore = summary.calibratedFinalScore ?? summary.totalAverageScore;
  const [downloadReport, { isLoading: isDownloading }] = useDownloadReportMutation();

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadReport({
        endpoint: 'feedback-360',
        params: { targetUserId: summary.targetUserId, cycleId },
        fileName: `Feedback_360_Report_${summary.targetUserName}.pdf`,
      }).unwrap();
      toast.success('Feedback report downloaded successfully.');
    } catch {
      toast.error('Failed to download individual feedback report.');
    }
  };

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
          {summary.summaryId && (
            <button
              style={{ ...smBtn('neutral'), display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              title="Download Individual 360 PDF Report"
            >
              {isDownloading ? (
                <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <FileDown size={11} />
              )}
              Report PDF
            </button>
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
              { label: 'Manager', scores: summary.managerScores, color: '#1A56DB' },
              { label: 'Peer', scores: summary.peerScores, color: '#7C3AED' },
              { label: 'Subordinate', scores: summary.subordinateScores, color: '#059669' },
              { label: 'Self', scores: summary.selfScores, color: '#D97706' },
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
  const [downloadReport, { isLoading: isPrinting }] = useDownloadReportMutation();

  const handlePrint = async () => {
    if (!req.id) return;
    try {
      await downloadReport({
        endpoint: 'feedback-360/print-form',
        params: { requestId: req.id },
        fileName: `Feedback_360_Form_${req.id}.pdf`,
      }).unwrap();
      toast.success('Paper form downloaded successfully.');
    } catch {
      toast.error('Failed to download paper form.');
    }
  };

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
                <button
                  style={{ ...smBtn('neutral'), opacity: req.id ? 1 : 0.45, cursor: req.id ? 'pointer' : 'not-allowed' }}
                  onClick={onReassign}
                  disabled={!req.id}
                  title={!req.id ? 'Click Generate to enable per-row actions' : undefined}
                >
                  <Edit3 size={10} /> Reassign
                </button>
                <button
                  style={{ ...smBtn('danger'), opacity: req.id ? 1 : 0.45, cursor: req.id ? 'pointer' : 'not-allowed' }}
                  onClick={onCancel}
                  disabled={!req.id}
                  title={!req.id ? 'Click Generate to enable per-row actions' : undefined}
                >
                  <X size={10} /> Cancel
                </button>
              </>
            )}
            {req.id && (
              <button
                style={{ ...smBtn('neutral'), background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }}
                onClick={handlePrint}
                disabled={isPrinting}
              >
                {isPrinting ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <FileDown size={10} />}
                Print Form
              </button>
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

// ── Form slots ─────────────────────────────────────────────────────────────────

const REL_SLOTS: Array<{ rel: string; label: string; color: string }> = [
  { rel: 'DIRECT_MANAGER', label: 'Manager → Target', color: '#1A56DB' },
  { rel: 'PEER', label: 'Peer → Target', color: '#7C3AED' },
  { rel: 'SUBORDINATE', label: 'Subordinate → Target', color: '#059669' },
  { rel: 'SELF', label: 'Self-Assessment', color: '#D97706' },
];

interface FeedbackFormSlotsProps { cycleId: number; }

const FeedbackFormSlots = ({ cycleId }: FeedbackFormSlotsProps) => {
  const navigate = useNavigate();
  const { data: forms = [], isLoading } = useGetFeedbackFormsByCycleQuery(cycleId, { skip: !cycleId });

  const byRel: Record<string, AppraisalForm | undefined> = {};
  forms.forEach((f) => { if (f.targetRelationship) byRel[f.targetRelationship] = f; });

  const filled = REL_SLOTS.filter((s) => byRel[s.rel]).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={sectionTitle}>360° Feedback Forms</p>
          <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: -12, marginBottom: 0 }}>
            Each relationship type needs its own form. {filled}/4 slots filled.
          </p>
        </div>
      </div>
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0', padding: '8px 0' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13 }}>Loading forms…</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {REL_SLOTS.map(({ rel, label, color }) => {
            const form = byRel[rel];
            return (
              <div key={rel} style={{
                border: `0.5px solid ${form ? '#A7F3D0' : '#E4E6EC'}`,
                borderRadius: 10,
                padding: '14px 16px',
                background: form ? '#F0FDF4' : '#FAFBFC',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</span>
                  {form && <CheckCircle size={13} color="#059669" style={{ marginLeft: 'auto' }} />}
                </div>
                {form ? (
                  <>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0, fontWeight: 500 }}>{form.formName}</p>
                    <button
                      style={{ ...smBtn('neutral'), fontSize: 11, padding: '5px 10px', alignSelf: 'flex-start' }}
                      onClick={() => navigate(`/appraisal-forms/design?edit=true&formId=${form.formId}&type=FEEDBACK&cycleId=${cycleId}&relationship=${rel}`)}
                    >
                      <Edit3 size={10} /> Edit Form
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 11, color: '#9EA3B0', margin: 0 }}>No form assigned</p>
                    <button
                      style={{ ...smBtn('neutral'), fontSize: 11, padding: '5px 10px', alignSelf: 'flex-start', background: '#EEF3FD', color: '#1A56DB', borderColor: '#BFCFFA' }}
                      onClick={() => navigate(`/appraisal-forms/design?type=FEEDBACK&cycleId=${cycleId}&relationship=${rel}`)}
                    >
                      <Plus size={10} /> Create Form
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      {filled < 4 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 12px', background: '#FFFBEB', border: '0.5px solid #FDE68A', borderRadius: 8 }}>
          <AlertCircle size={13} color="#D97706" />
          <span style={{ fontSize: 12, color: '#92400E' }}>
            {4 - filled} form{4 - filled !== 1 ? 's' : ''} missing — Generate will use a generic fallback form for those relationships.
          </span>
        </div>
      )}
    </div>
  );
};

// ── Cycle Dashboard Tab (Step 3) ──────────────────────────────────────────────

interface CycleDashboardTabProps {
  cycleId: number;
}

const CycleDashboardTab = ({ cycleId }: CycleDashboardTabProps) => {
  const { data: dashboard, isLoading, error } = useGetFeedbackCycleDashboardQuery(cycleId, { skip: !cycleId });

  if (!cycleId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0', fontSize: 13, padding: '20px 0' }}>
        <AlertCircle size={15} /> Select a Cycle above to view the dashboard.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0', padding: '24px 0' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 13 }}>Loading cycle dashboard metrics…</span>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontSize: 13, padding: '20px 0' }}>
        <AlertCircle size={15} /> Failed to load cycle dashboard metrics. Make sure feedback requests are generated for this cycle.
      </div>
    );
  }

  const statCard = (title: string, value: string | number, sub: string, icon: React.ReactNode, bg: string, color: string) => (
    <div style={{
      ...panel, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: 10, flex: 1, minWidth: 160
    }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#5A6070', margin: '0 0 6px 0' }}>{title}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{value}</p>
        <p style={{ fontSize: 11, color: '#9EA3B0', margin: '4px 0 0 0' }}>{sub}</p>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        {icon}
      </div>
    </div>
  );

  const getRelationshipColor = (rel: string) => {
    switch (rel) {
      case 'DIRECT_MANAGER': return '#1A56DB';
      case 'PEER': return '#7C3AED';
      case 'SUBORDINATE': return '#059669';
      case 'SELF': return '#D97706';
      default: return '#5A6070';
    }
  };

  const formatRelName = (rel: string) => {
    return rel.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat Cards Grid */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {statCard(
          'Submission Rate',
          `${dashboard.submissionRate}%`,
          'Overall completion rate',
          <BarChart3 size={18} />,
          '#EEF3FD',
          '#1A56DB'
        )}
        {statCard(
          'Total Requests',
          dashboard.totalRequests,
          'Total feedback slots assigned',
          <FileText size={18} />,
          '#F3F4F6',
          '#374151'
        )}
        {statCard(
          'Completed Feedback',
          dashboard.submittedRequests,
          'Submitted responses',
          <CheckCircle2 size={18} />,
          '#ECFDF5',
          '#059669'
        )}
        {statCard(
          'Overdue Requests',
          dashboard.overdueRequests,
          'Past due date requests',
          <Clock size={18} />,
          dashboard.overdueRequests > 0 ? '#FEF2F2' : '#F9FAFB',
          dashboard.overdueRequests > 0 ? '#DC2626' : '#9EA3B0'
        )}
        {statCard(
          'Pending / In Progress',
          dashboard.pendingRequests,
          'On schedule requests',
          <Loader2 size={18} style={{ animation: dashboard.pendingRequests > 0 ? 'spin 2s linear infinite' : 'none' }} />,
          '#FFFBEB',
          '#D97706'
        )}
        {statCard(
          'Target Employees',
          dashboard.totalTargets,
          'Receiving feedback',
          <Users size={18} />,
          '#F5F3FF',
          '#7C3AED'
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Left Side: Relationship Submission Rates */}
        <div style={panel}>
          <p style={sectionTitle}>Submission Rate by Relationship</p>
          {Object.keys(dashboard.relationshipRates).length === 0 ? (
            <p style={{ fontSize: 13, color: '#9EA3B0', margin: 0 }}>No relationship submission stats available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(dashboard.relationshipRates).map(([rel, rate]) => {
                const color = getRelationshipColor(rel);
                return (
                  <div key={rel} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500 }}>
                      <span style={{ color: '#374151' }}>{formatRelName(rel)}</span>
                      <span style={{ color: color }}>{rate}%</span>
                    </div>
                    <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease-out' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Top Bottlenecks */}
        <div style={panel}>
          <p style={sectionTitle}>Evaluator Bottlenecks</p>
          {dashboard.bottlenecks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: '#9EA3B0', gap: 6 }}>
              <CheckCircle2 size={24} color="#059669" />
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>No outstanding bottleneck evaluators!</p>
              <p style={{ fontSize: 11, margin: 0 }}>All pending reviews are nicely distributed.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E4E6EC', background: '#FAFBFC' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: '#5A6070', fontSize: 11, textTransform: 'uppercase' }}>Evaluator</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: '#5A6070', fontSize: 11, textTransform: 'uppercase' }}>Department</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, color: '#5A6070', fontSize: 11, textTransform: 'uppercase' }}>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.bottlenecks.map((b) => (
                    <tr key={b.evaluatorId} style={{ borderBottom: '0.5px solid #E4E6EC' }}>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, color: '#111827' }}>{b.evaluatorName}</span>
                          <span style={{ fontSize: 11, color: '#9EA3B0', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={10} /> {b.evaluatorEmail}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#5A6070' }}>{b.departmentName}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 12,
                          background: '#FEF2F2', color: '#DC2626', border: '0.5px solid #FEE2E2'
                        }}>
                          {b.pendingCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const Feedback360AdminPage = () => {
  const { activeCycleId } = useAuth();
  const { data: cycles = [], isLoading: cyclesLoading } = useGetCyclesQuery();

  const [cycleId, setCycleId] = useState<number>(activeCycleId ?? 0);
  const [previousCycleId, setPreviousCycleId] = useState<string>('');
  const [globalMaxLimit, setGlobalMaxLimit] = useState<number>(5);
  const [excludeLongTermLeave, setExcludeLongTermLeave] = useState<boolean>(true);
  const [showPreview, setShowPreview] = useState(false);

  const [expandedSummary, setExpandedSummary] = useState<number | null>(null);
  const [calibrateTarget, setCalibrateTarget] = useState<FeedbackSummaryResponse | null>(null);
  const [reassignRequestId, setReassignRequestId] = useState<number | null>(null);

  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup' | 'assignments' | 'summaries'>('dashboard');

  const { data: savedRequests = [] } = useListRequestsByCycleQuery(cycleId, { skip: !cycleId });

  useEffect(() => {
    if (savedRequests.length > 0) setHasGenerated(true);
  }, [savedRequests.length]);

  const [previewTrigger, { data: previewData, isFetching: isPreviewing }] = useLazyPreviewFeedbackRequestsQuery();
  const [generate, { isLoading: isGenerating }] = useGenerateFeedbackRequestsMutation();
  const [generateSummaries, { isLoading: isGeneratingSummaries }] = useGenerateAllSummariesMutation();
  const [finalizeSummary, { isLoading: isFinalizing }] = useFinalizeSummaryMutation();
  const [regenerateUser] = useRegenerateUserRequestsMutation();
  const [cancelRequest] = useCancelFeedbackRequestMutation();

  const { data: summaries, isLoading: summariesLoading } = useGetAllSummariesByCycleQuery(
    cycleId, { skip: !cycleId },
  );

  const [downloadReport, { isLoading: isDownloadingReport }] = useDownloadReportMutation();
  const [downloadManagerPack, { isLoading: isDownloadingPack }] = useDownloadReportMutation();

  const { data: allEmployees = [] } = useGetAllEmployeesQuery();
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');

  const handleDownloadSummaryReport = async () => {
    if (!cycleId) return toast.error('Please select a cycle.');
    try {
      await downloadReport({
        endpoint: 'feedback-360/cycle',
        params: { cycleId },
        fileName: `Feedback_360_Cycle_${cycleId}_Summary.pdf`,
      }).unwrap();
      toast.success('Summary report downloaded successfully.');
    } catch {
      toast.error('Failed to download summary report.');
    }
  };

  const handleDownloadManagerPack = async () => {
    if (!cycleId) return toast.error('Please select a cycle.');
    if (!selectedManagerId) return toast.error('Please select a manager.');
    try {
      await downloadManagerPack({
        endpoint: 'feedback-360/manager',
        params: { managerId: Number(selectedManagerId), cycleId },
        fileName: `Feedback_360_Manager_Pack_Cycle_${cycleId}_Manager_${selectedManagerId}.pdf`,
      }).unwrap();
      toast.success('Manager Review Pack downloaded successfully.');
    } catch {
      toast.error('Failed to download Manager Review Pack.');
    }
  };

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
    try {
      await generate(buildParams()).unwrap();
      toast.success('Requests generated.');
      setHasGenerated(true);
    } catch { toast.error('Generation failed.'); }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cycleId > 0 && (
            <button
              onClick={handleDownloadSummaryReport}
              disabled={isDownloadingReport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#374151',
                cursor: isDownloadingReport ? 'not-allowed' : 'pointer',
                opacity: isDownloadingReport ? 0.7 : 1,
                boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease-in-out',
              }}
              onMouseEnter={(e) => {
                if (!isDownloadingReport) {
                  e.currentTarget.style.borderColor = '#9CA3AF';
                  e.currentTarget.style.background = '#F9FAFB';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDownloadingReport) {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.background = '#FFFFFF';
                }
              }}
            >
              <FileDown size={14} />
              {isDownloadingReport ? 'Downloading...' : 'Download Summary PDF'}
            </button>
          )}
          {cycleLocked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#ECFDF5', border: '0.5px solid #A7F3D0', borderRadius: 20 }}>
              <Lock size={13} color="#059669" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>Cycle Locked — All summaries finalized</span>
            </div>
          )}
        </div>
      </div>

      {/* Cycle selector */}
      <div style={panel}>
        <p style={sectionTitle}>Cycle Settings</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <div>
            <label style={labelStyle}>Active Cycle *</label>
            {cyclesLoading ? (
              <select style={inputStyle} disabled><option>Loading cycles…</option></select>
            ) : (
              <select
                style={inputStyle}
                value={cycleId || ''}
                onChange={(e) => setCycleId(Number(e.target.value) || 0)}
              >
                <option value="">-- Select Cycle --</option>
                {cycles.map((c) => (
                  <option key={c.cycleId} value={c.cycleId}>
                    {c.cycleName} (ID: {c.cycleId})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label style={labelStyle}>Previous Cycle</label>
            {cyclesLoading ? (
              <select style={inputStyle} disabled><option>Loading cycles…</option></select>
            ) : (
              <select
                style={inputStyle}
                value={previousCycleId}
                onChange={(e) => setPreviousCycleId(e.target.value)}
              >
                <option value="">-- None / Select Previous Cycle --</option>
                {cycles
                  .filter((c) => c.cycleId !== cycleId)
                  .map((c) => (
                    <option key={c.cycleId} value={String(c.cycleId)}>
                      {c.cycleName} (ID: {c.cycleId})
                    </option>
                  ))}
              </select>
            )}
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

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E4E6EC', paddingBottom: 8, marginTop: 10 }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: activeTab === 'dashboard' ? 600 : 500,
            color: activeTab === 'dashboard' ? '#1A56DB' : '#5A6070',
            background: activeTab === 'dashboard' ? '#EEF3FD' : 'transparent',
            border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Cycle Dashboard
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: activeTab === 'setup' ? 600 : 500,
            color: activeTab === 'setup' ? '#1A56DB' : '#5A6070',
            background: activeTab === 'setup' ? '#EEF3FD' : 'transparent',
            border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Form & Policy Setup
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: activeTab === 'assignments' ? 600 : 500,
            color: activeTab === 'assignments' ? '#1A56DB' : '#5A6070',
            background: activeTab === 'assignments' ? '#EEF3FD' : 'transparent',
            border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Assignments ({savedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('summaries')}
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: activeTab === 'summaries' ? 600 : 500,
            color: activeTab === 'summaries' ? '#1A56DB' : '#5A6070',
            background: activeTab === 'summaries' ? '#EEF3FD' : 'transparent',
            border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Summaries ({summaries?.length ?? 0})
        </button>
      </div>

      {/* Conditionally Render Tab Content */}

      {activeTab === 'dashboard' && (
        <CycleDashboardTab cycleId={cycleId} />
      )}

      {activeTab === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Feedback Form Slots */}
          {cycleId > 0 && (
            <div style={panel}>
              <FeedbackFormSlots cycleId={cycleId} />
            </div>
          )}

          {/* Scoring Policy Editor */}
          {cycleId > 0 && (
            <div style={panel}>
              <p style={sectionTitle}>Scoring Policy for Cycle {cycleId}</p>
              <ScoringPolicyEditor cycleId={cycleId} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

          {/* Request table — preview or saved */}
          {(showPreview || hasGenerated) && (() => {
            const rows: FeedbackRequestResponse[] = hasGenerated ? savedRequests : (previewData ?? []);
            return (
              <div style={panel}>
                <p style={sectionTitle}>{hasGenerated ? 'Generated Assignments' : 'Preview — Assignments'}</p>
                {!hasGenerated && rows.length > 0 && (
                  <div style={{ background: '#FFFBEB', border: '0.5px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', marginBottom: 12 }}>
                    Preview mode — click <strong>Generate Requests</strong> to persist these rows. Reassign and Cancel are disabled until then.
                  </div>
                )}
                {isPreviewing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0', padding: '12px 0' }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 13 }}>Loading preview…</span>
                  </div>
                ) : rows.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9EA3B0' }}>No assignments to show.</p>
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
                        {rows.map((req, idx) => (
                          <PreviewRow
                            key={req.id ?? `preview-${idx}`}
                            req={req}
                            cycleLocked={cycleLocked}
                            onRegenerate={() => handleRegenerate(req)}
                            onCancel={() => req.id && handleCancel(req.id)}
                            onReassign={() => req.id && setReassignRequestId(req.id)}
                          />
                        ))}
                      </tbody>
                    </table>
                    <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 10 }}>
                      {rows.length} assignment{rows.length !== 1 ? 's' : ''} {hasGenerated ? 'saved' : 'previewed'}.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'summaries' && (
        /* Summaries */
        <div style={panel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>Cycle Summaries</p>
            {cycleId > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1A56DB',
                    cursor: isDownloadingReport ? 'not-allowed' : 'pointer',
                    opacity: isDownloadingReport ? 0.7 : 1,
                    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                  disabled={isDownloadingReport}
                  onClick={handleDownloadSummaryReport}
                >
                  <FileDown size={14} />
                  {isDownloadingReport ? 'Downloading Cycle PDF...' : 'Download Cycle PDF'}
                </button>

                <div style={{ width: '1px', height: '24px', background: '#E4E6EC' }} />

                <select
                  style={{ ...inputStyle, width: 220 }}
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                >
                  <option value="">-- Select Manager for Pack --</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.staffName} (ID: {emp.id})
                    </option>
                  ))}
                </select>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#374151',
                    cursor: isDownloadingPack || !selectedManagerId ? 'not-allowed' : 'pointer',
                    opacity: isDownloadingPack || !selectedManagerId ? 0.7 : 1,
                    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                  disabled={isDownloadingPack || !selectedManagerId}
                  onClick={handleDownloadManagerPack}
                >
                  <FileDown size={14} />
                  {isDownloadingPack ? 'Downloading Pack...' : 'Download Manager Pack'}
                </button>
              </div>
            )}
          </div>
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
                    cycleId={cycleId}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

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
