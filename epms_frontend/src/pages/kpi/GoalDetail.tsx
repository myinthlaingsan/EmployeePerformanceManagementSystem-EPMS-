import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useGetGoalSetByEmployeeQuery,
  useApproveGoalSetMutation,
  useCalculateScoresMutation
} from '../../services/kpiApi';
import { useAuth } from '../../hooks/useAuth';
import ProgressUpdateModal from '../../components/kpi/ProgressUpdateModal';
import KpiRevisionModal from '../../components/kpi/KpiRevisionModal';
import type { GoalItemResponse } from '../../features/kpi/kpiTypes';
import { ChevronLeft, CheckCircle2, AlertCircle, Edit3, Lock, Award, ShieldCheck } from 'lucide-react';

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  APPROVED: { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0' },
  LOCKED: { bg: '#F1EFE8', text: '#444441', border: '#DDDBD2' },
  DRAFT: { bg: '#FAEEDA', text: '#633806', border: '#F0D4A4' },
};

const STEPS = [
  { id: 'DRAFT', label: 'Draft', icon: Edit3 },
  { id: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
  { id: 'LOCKED', label: 'Locked', icon: Lock },
];

const GoalDetail: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { user, activeCycleId } = useAuth();

  const { data: goalSetResponse, isLoading, error } = useGetGoalSetByEmployeeQuery(
    { employeeId: parseInt(employeeId!), cycleId: Number(activeCycleId!) },
    { skip: !user?.id || !activeCycleId }
  );
  const [approveGoal] = useApproveGoalSetMutation();
  const [calculateScores] = useCalculateScoresMutation();

  const goalSet = goalSetResponse?.data;
  const items = goalSet?.items || [];

  const [selectedItem, setSelectedItem] = useState<GoalItemResponse | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const isOwner = user?.id === parseInt(employeeId!);
  const isManager = user?.roles.includes('MANAGER') || user?.roles.includes('ADMIN') || user?.roles.includes('HR');

  const handleApprove = async () => {
    if (!goalSet) return;
    try { await approveGoal(goalSet.id).unwrap(); toast.success('Goal set approved!'); }
    catch { toast.error('Failed to approve goal set'); }
  };

  const handleCalculate = async () => {
    if (!goalSet) return;
    try {
      await calculateScores({ employeeId: goalSet.employeeId, cycleId: goalSet.appraisalCycleId }).unwrap();
      toast.success('Score calculated!');
    } catch { toast.error('Failed to calculate score'); }
  };

  if (isLoading) return (
    <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Loading goal details…</div>
  );
  if (error || !goalSet) return (
    <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: '#791F1F' }}>Goal set not found for this cycle.</div>
  );

  const totalWeight = items.reduce((sum, i) => sum + i.weightPercent, 0);
  const ss = STATUS_STYLE[goalSet.status] || { bg: '#F5F6F8', text: '#9EA3B0', border: '#E0E2E8' };

  const currentStepIndex = STEPS.findIndex(s => s.id === goalSet.status);

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(-1)}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #E4E6EC', borderRadius: 8, background: '#FFFFFF', color: '#5A6070', flexShrink: 0, marginTop: 2 }}
            className="hover:bg-[#F5F6F8] transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>{goalSet.employeeName}'s Performance Goals</h1>
            <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 1 }}>
              Cycle: {goalSet.appraisalCycleId} &bull; Manager: {goalSet.managerName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {isManager && (goalSet.status === 'DRAFT' || goalSet.status === 'APPROVED') && (
            <>
              <button onClick={() => navigate(`/kpi/assign/${employeeId}`)}
                style={{ background: '#111827', color: '#FFFFFF', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500, border: 'none' }}>
                Modify Goals
              </button>
              {goalSet.status === 'DRAFT' && (
                <button onClick={handleApprove}
                  style={{ background: '#EAF3DE', color: '#27500A', border: '0.5px solid #B8DCA0', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500 }}>
                  Approve Goals
                </button>
              )}
              {goalSet.status === 'APPROVED' && (
                <button onClick={handleCalculate}
                  style={{ background: '#EEF3FD', color: '#0C447C', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500 }}>
                  Calculate Score
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Visual Stepper */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="flex items-center w-full max-w-2xl mx-auto relative">
          {STEPS.map((step, index) => {
            const isCompleted = currentStepIndex > index;
            const isCurrent = currentStepIndex === index;
            const statusColor = isCompleted || isCurrent ? '#1A56DB' : '#E4E6EC';
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex-1 flex items-center relative">
                <div className="flex flex-col items-center relative z-10 w-full">
                  <div style={{
                    width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCurrent ? '#EEF3FD' : isCompleted ? '#1A56DB' : '#F5F6F8',
                    color: isCurrent ? '#1A56DB' : isCompleted ? '#FFFFFF' : '#9EA3B0',
                    border: `1.5px solid ${statusColor}`,
                    transition: 'all 0.3s'
                  }}>
                    <Icon size={14} strokeWidth={isCurrent || isCompleted ? 3 : 2} />
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 500, marginTop: 8,
                    color: isCurrent ? '#111827' : '#9EA3B0'
                  }}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 16, left: '50%', right: '-50%', height: 2,
                    background: currentStepIndex > index ? '#1A56DB' : '#E4E6EC',
                    transform: 'translateY(-50%)', zIndex: 0
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Total Weight</p>
          <p style={{ fontSize: 22, fontWeight: 500, color: totalWeight === 100 ? '#1A56DB' : '#791F1F' }}>
            {totalWeight}% <span style={{ fontSize: 13, color: '#9EA3B0' }}>/ 100%</span>
          </p>
        </div>
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>KPI Count</p>
          <p style={{ fontSize: 22, fontWeight: 500, color: '#111827' }}>{items.length} Goals</p>
        </div>
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Execution Status</p>
          <p style={{ fontSize: 22, fontWeight: 500, color: '#111827' }}>{goalSet.status === 'APPROVED' ? 'Active' : 'Pending'}</p>
        </div>
      </div>

      {/* Goals table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #E4E6EC', background: '#FAFBFF' }}>
                {['KPI Item', 'Weight', 'Target', 'Progress', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '10px 18px', fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const pct = Math.min(Math.round(((item.currentProgress || 0) / item.targetValue) * 100), 100);
                const isComplianceRow = item.isCompliance;
                const rowBg = isComplianceRow ? '#FEFCE8' : '#FAFBFF';
                
                return (
                  <tr key={item.id} style={{ borderBottom: idx < items.length - 1 ? '0.5px solid #F0F2F6' : 'none' }}
                    className={`transition-colors ${isComplianceRow ? 'hover:bg-[#FEF9C3]' : 'hover:bg-[#F3F4F6]'}`}>
                    <td style={{ padding: '12px 18px', background: rowBg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{item.title}</p>
                        {isComplianceRow && (
                          <span title="Compliance KPI" className="flex">
                            <ShieldCheck size={14} className="text-amber-500" />
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 10, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.categoryName}</p>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 500, color: '#111827', background: rowBg }}>{item.weightPercent}%</td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: '#5A6070', background: rowBg }}>
                      {item.targetValue} <span style={{ fontSize: 10, color: '#9EA3B0', textTransform: 'uppercase' }}>{item.unit}</span>
                    </td>
                    <td style={{ padding: '12px 18px', background: rowBg }}>
                      <div className="flex items-center gap-3">
                        <div style={{ flex: 1, maxWidth: 100, background: isComplianceRow ? '#FDE68A' : '#F0F2F6', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: isComplianceRow ? '#D97706' : '#1A56DB', width: `${pct}%`, transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', background: rowBg }}>
                      <div className="flex justify-end gap-2">
                        {/* Employee update button - for regular goals */}
                        {isOwner && goalSet.status === 'APPROVED' && !item.isCompliance && (
                          <button
                            onClick={() => { setSelectedItem(item); setShowProgressModal(true); }}
                            style={{ background: '#EEF3FD', color: '#0C447C', border: '0.5px solid #B5D4F4', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500 }}
                            className="hover:bg-blue-100 transition">
                            UPDATE
                          </button>
                        )}
                        {/* Employee locked state - for compliance goals */}
                        {isOwner && goalSet.status === 'APPROVED' && item.isCompliance && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg" title="Requires manager verification">
                            <Lock size={12} />
                            <span style={{ fontSize: 10, fontWeight: 600 }}>MANAGER ONLY</span>
                          </div>
                        )}

                        {/* Manager verify button - for compliance items */}
                        {isManager && item.isCompliance && (
                          <button
                            onClick={() => { setSelectedItem(item); setShowProgressModal(true); }}
                            style={{ background: '#FEF3C7', color: '#92400E', border: '0.5px solid #FDE68A', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500 }}
                            className="hover:bg-amber-200 transition">
                            VERIFY
                          </button>
                        )}

                        {/* Manager revise button - for all items */}
                        {isManager && (
                          <button
                            onClick={() => { setSelectedItem(item); setShowRevisionModal(true); }}
                            style={{ background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E0E2E8', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500 }}
                            className="hover:bg-gray-100 transition">
                            REVISE
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showProgressModal && selectedItem && (
        <ProgressUpdateModal item={selectedItem} onClose={() => { setShowProgressModal(false); setSelectedItem(null); }} />
      )}
      {showRevisionModal && selectedItem && (
        <KpiRevisionModal item={selectedItem} onClose={() => { setShowRevisionModal(false); setSelectedItem(null); }} />
      )}

      <div style={{ display: 'none' }}><CheckCircle2 /><AlertCircle /></div>
    </div>
  );
};

export default GoalDetail;
