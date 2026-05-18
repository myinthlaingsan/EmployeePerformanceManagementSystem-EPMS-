import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { UserPlus, CheckCircle, XCircle, Loader2, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useListMyNominationsQuery,
  useProposeNominationMutation,
  useApproveNominationMutation,
  useRejectNominationMutation,
} from '../../features/feedback360/feedback360Api';
import type { EvaluatorNomination } from '../../features/feedback360/feedback360Types';
import { FeedbackRelationship } from '../../features/feedback360/feedback360Types';
import RelBadge from '../../components/feedback360/RelBadge';

// ── Style constants ────────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: '#FFFFFF',
  border: '0.5px solid #E4E6EC',
  borderRadius: 12,
  padding: '20px 22px',
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

const NOMINATION_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PROPOSED: { label: 'Proposed', bg: '#FAEEDA', text: '#633806' },
  APPROVED: { label: 'Approved', bg: '#EAF3DE', text: '#27500A' },
  REJECTED: { label: 'Rejected', bg: '#FCEBEB', text: '#791F1F' },
};

type PageTab = 'mine' | 'pending';

// ── Status badge ───────────────────────────────────────────────────────────────

const NomStatusBadge = ({ status }: { status: string }) => {
  const cfg = NOMINATION_STATUS_CONFIG[status] ?? { label: status, bg: '#F5F6F8', text: '#5A6070' };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.text }}>
      {cfg.label}
    </span>
  );
};

// ── Propose form ───────────────────────────────────────────────────────────────

interface ProposeFormProps {
  onSubmitted: () => void;
}

const ProposeForm = ({ onSubmitted }: ProposeFormProps) => {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId]   = useState('');
  const [nomineeId, setNomineeId]         = useState('');
  const [relationship, setRelationship]   = useState<string>(FeedbackRelationship.PEER);
  const [propose, { isLoading }]          = useProposeNominationMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tId = parseInt(targetUserId);
    const nId = parseInt(nomineeId);
    if (!tId || !nId) return toast.error('Enter valid employee IDs.');
    try {
      await propose({
        targetUserId: tId,
        nomineeId: nId,
        relationship: relationship as typeof FeedbackRelationship[keyof typeof FeedbackRelationship],
      }).unwrap();
      toast.success('Nomination proposed.');
      setNomineeId('');
      setTargetUserId('');
      onSubmitted();
    } catch {
      toast.error('Failed to propose nomination.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle}>Target Employee ID</label>
          <input
            type="number"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Whose evaluator?"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Nominee Employee ID</label>
          <input
            type="number"
            value={nomineeId}
            onChange={(e) => setNomineeId(e.target.value)}
            placeholder="Who should evaluate?"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Relationship</label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            style={inputStyle}
          >
            <option value={FeedbackRelationship.PEER}>Peer</option>
            <option value={FeedbackRelationship.SUBORDINATE}>Subordinate</option>
            <option value={FeedbackRelationship.DIRECT_MANAGER}>Direct Manager</option>
          </select>
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 500, color: '#FFFFFF',
            background: isLoading ? '#93A8E8' : '#1A56DB',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={13} />}
          Propose Nomination
        </button>
      </div>
    </form>
  );
};

// ── Nomination table ───────────────────────────────────────────────────────────

interface NominationTableProps {
  nominations: EvaluatorNomination[];
  showActions: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  approving?: boolean;
  rejecting?: boolean;
}

const NominationTable = ({ nominations, showActions, onApprove, onReject, approving, rejecting }: NominationTableProps) => {
  if (nominations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: '#9EA3B0' }}>
        <Users size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <p style={{ fontSize: 13, margin: 0 }}>No nominations found.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E4E6EC', background: '#FAFBFC' }}>
            {['Target', 'Nominee', 'Relationship', 'Status', ...(showActions ? ['Actions'] : [])].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: '#5A6070', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nominations.map((n, i) => (
            <tr key={n.id} style={{ borderBottom: '0.5px solid #F0F2F8', background: i % 2 === 0 ? '#FAFBFC' : '#FFFFFF' }}>
              <td style={{ padding: '10px 10px', color: '#5A6070' }}>#{n.targetUserId}</td>
              <td style={{ padding: '10px 10px', fontWeight: 500, color: '#111827' }}>{n.nomineeName}</td>
              <td style={{ padding: '10px 10px' }}><RelBadge rel={n.relationship} /></td>
              <td style={{ padding: '10px 10px' }}><NomStatusBadge status={n.status} /></td>
              {showActions && (
                <td style={{ padding: '8px 10px' }}>
                  {n.status === 'PROPOSED' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => onApprove?.(n.id)}
                        disabled={approving}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 500, color: '#27500A',
                          background: '#EAF3DE', border: '0.5px solid #B7E0A0',
                          borderRadius: 6, padding: '3px 9px', cursor: 'pointer',
                        }}
                      >
                        {approving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={11} />}
                        Approve
                      </button>
                      <button
                        onClick={() => onReject?.(n.id)}
                        disabled={rejecting}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 500, color: '#791F1F',
                          background: '#FCEBEB', border: '0.5px solid #F5C6C6',
                          borderRadius: 6, padding: '3px 9px', cursor: 'pointer',
                        }}
                      >
                        {rejecting ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={11} />}
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const Feedback360NominationsPage = () => {
  const { isAdmin, isHR, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<PageTab>('mine');

  const { data: myNominations = [], isLoading, isError, refetch } = useListMyNominationsQuery();
  const [approve, { isLoading: approving }] = useApproveNominationMutation();
  const [reject,  { isLoading: rejecting }] = useRejectNominationMutation();

  const pendingNominations = myNominations.filter((n) => n.status === 'PROPOSED');
  const canApprove = isAdmin || isHR || isManager;

  const handleApprove = async (id: number) => {
    try { await approve(id).unwrap(); toast.success('Nomination approved.'); }
    catch { toast.error('Failed to approve.'); }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Reject this nomination?')) return;
    try { await reject(id).unwrap(); toast.success('Nomination rejected.'); }
    catch { toast.error('Failed to reject.'); }
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
          360° Evaluator Nominations
        </h1>
        <p style={{ fontSize: 13, color: '#9EA3B0', marginTop: 4 }}>
          Propose peers and subordinates as evaluators; managers approve or reject.
        </p>
      </div>

      {/* Propose form */}
      <div style={panel}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Propose a Nomination</p>
        <ProposeForm onSubmitted={refetch} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: '#F5F6F8', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {([
          { key: 'mine'    as PageTab, label: 'My Nominations',   count: myNominations.length },
          { key: 'pending' as PageTab, label: 'Pending Approval', count: pendingNominations.length },
        ]).map(({ key, label, count }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? '#1A56DB' : '#5A6070',
                background: active ? '#FFFFFF' : 'transparent',
                border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: active ? '#EEF3FD' : '#E4E6EC',
                color: active ? '#1A56DB' : '#9EA3B0',
                borderRadius: 20, padding: '1px 6px',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={panel}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Loading nominations…</span>
          </div>
        ) : isError ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#791F1F' }}>
            <AlertCircle size={15} />
            <span style={{ fontSize: 13 }}>Failed to load nominations.</span>
          </div>
        ) : activeTab === 'mine' ? (
          <NominationTable nominations={myNominations} showActions={false} />
        ) : (
          <NominationTable
            nominations={pendingNominations}
            showActions={canApprove}
            onApprove={handleApprove}
            onReject={handleReject}
            approving={approving}
            rejecting={rejecting}
          />
        )}
      </div>
    </div>
  );
};

export default Feedback360NominationsPage;
