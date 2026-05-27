import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetScoringPoliciesQuery, useUpsertScoringPolicyMutation } from '../../../features/feedback360/feedback360Api';
import type { ScoringPolicy } from '../../../features/feedback360/feedback360Types';
import { inputStyle, smBtn } from '../constants/styles';

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

export default ScoringPolicyEditor;
