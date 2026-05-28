import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import type { MidcycleSummaryResponse } from './midcycleTypes';
import { useTriggerMidcycleChangeMutation, useGetMidcycleSummaryQuery } from '../../services/midcycleApi';
import { toast } from 'react-toastify';

interface MidcycleChangeModalProps {
  employeeId: number;
  employeeName: string;
  cycleId: number;
  cycleName: string;
  cycleStartDate: string;
  cycleEndDate: string;
  summary: MidcycleSummaryResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const MidcycleChangeModal: React.FC<MidcycleChangeModalProps> = ({
  employeeId,
  employeeName,
  cycleId,
  cycleName,
  cycleStartDate,
  cycleEndDate,
  summary,
  onClose,
  onSuccess,
}) => {
  const [triggerChange, { isLoading }] = useTriggerMidcycleChangeMutation();

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { data: internalSummaryResponse } = useGetMidcycleSummaryQuery(
    { employeeId, cycleId },
    { skip: !!summary || !employeeId || !cycleId }
  );

  const effectiveSummary = summary || internalSummaryResponse?.data || null;

  // Find the start date of the current open phase
  const openPhase = effectiveSummary?.phases.find((p) => p.status === 'OPEN');
  const currentPhaseNumber = openPhase ? openPhase.phaseNumber : 1;
  const currentPhaseStartDate = openPhase ? openPhase.startDate : cycleStartDate;

  // Calculate constraints
  // Min date: currentPhaseStartDate + 1 day
  const minDateObj = new Date(currentPhaseStartDate);
  minDateObj.setDate(minDateObj.getDate() + 1);
  const minDateStr = toDateInputValue(minDateObj);

  // Max date: earlier of today and cycleEndDate - 1 day
  const cycleMaxDateObj = new Date(cycleEndDate);
  cycleMaxDateObj.setDate(cycleMaxDateObj.getDate() - 1);
  const todayObj = new Date();
  const maxDateObj = cycleMaxDateObj < todayObj ? cycleMaxDateObj : todayObj;
  const maxDateStr = toDateInputValue(maxDateObj);

  // Selected date defaults to minDateStr
  const [changeDate, setChangeDate] = useState(minDateStr);
  const [changeReason, setChangeReason] = useState('');
  const hasValidDateRange = minDateStr <= maxDateStr;
  const currentPhaseStartsInFuture = currentPhaseStartDate > toDateInputValue(new Date());

  // Live preview metrics
  const [currentPhaseDays, setCurrentPhaseDays] = useState(0);
  const [currentPhaseWeight, setCurrentPhaseWeight] = useState(0);
  const [nextPhaseDays, setNextPhaseDays] = useState(0);
  const [nextPhaseWeight, setNextPhaseWeight] = useState(0);

  const getDaysBetween = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  useEffect(() => {
    if (!hasValidDateRange) {
      setChangeDate('');
      return;
    }

    if (!changeDate || changeDate < minDateStr || changeDate > maxDateStr) {
      setChangeDate(maxDateStr);
      return;
    }

    if (cycleStartDate && cycleEndDate && changeDate) {
      const total = getDaysBetween(cycleStartDate, cycleEndDate);
      const current = getDaysBetween(currentPhaseStartDate, changeDate);
      
      // Next phase starts on changeDate + 1 and ends on cycleEndDate
      const nextStart = new Date(changeDate);
      nextStart.setDate(nextStart.getDate() + 1);
      const nextStartStr = nextStart.toISOString().split('T')[0];
      const next = getDaysBetween(nextStartStr, cycleEndDate);

      setCurrentPhaseDays(current);
      setCurrentPhaseWeight(Math.round((current / total) * 100));
      setNextPhaseDays(next);
      setNextPhaseWeight(Math.round((next / total) * 100));
    }
  }, [changeDate, cycleStartDate, cycleEndDate, currentPhaseStartDate, hasValidDateRange, minDateStr, maxDateStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeReason.trim()) {
      toast.warning('Please enter a change reason.');
      return;
    }
    if (!hasValidDateRange || !changeDate) {
      toast.warning('No valid change date is available yet.');
      return;
    }

    try {
      await triggerChange({
        employeeId,
        cycleId,
        changeDate,
        changeReason,
      }).unwrap();
      toast.success('KPI phase split triggered successfully! Managers have been notified.');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to trigger midcycle change');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }} className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            Trigger Midcycle KPI Split
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }} className="hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Info Banner */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
            <p style={{ fontSize: '12px', color: '#374151' }}>
              Employee: <strong>{employeeName}</strong>
            </p>
            <p style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>
              Cycle: <strong>{cycleName}</strong> ({new Date(cycleStartDate).toLocaleDateString()} - {new Date(cycleEndDate).toLocaleDateString()})
            </p>
            <p style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>
              Current Phase: <strong>Phase {currentPhaseNumber}</strong> (Started: {new Date(currentPhaseStartDate).toLocaleDateString()})
            </p>
          </div>

          {/* Date Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Effective Date of Change
            </label>
            <input
              type="date"
              min={minDateStr}
              max={maxDateStr}
              value={changeDate}
              onChange={(e) => setChangeDate(e.target.value)}
              disabled={!hasValidDateRange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '13px',
              }}
              required
            />
            <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
              {hasValidDateRange
                ? `Date boundary where Phase ${currentPhaseNumber} ends. Phase ${currentPhaseNumber + 1} begins on the next day.`
                : currentPhaseStartsInFuture
                  ? `No valid date is available yet. The current phase starts on ${new Date(currentPhaseStartDate).toLocaleDateString()}, which is still in the future.`
                  : 'No valid date is available yet. The change date cannot be in the future.'}
            </p>
          </div>

          {/* Live Weight Split Preview */}
          {hasValidDateRange && changeDate && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Phase Split Preview
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div className="flex justify-between" style={{ fontSize: '12px', color: '#1E3A8A' }}>
                <span>Phase {currentPhaseNumber} ends on {new Date(changeDate).toLocaleDateString()}:</span>
                <strong>{currentPhaseDays} days ({currentPhaseWeight}%)</strong>
              </div>
              <div className="flex justify-between" style={{ fontSize: '12px', color: '#1E3A8A' }}>
                <span>Phase {currentPhaseNumber + 1} starts on {new Date(new Date(changeDate).getTime() + 86400000).toLocaleDateString()}:</span>
                <strong>{nextPhaseDays} days ({nextPhaseWeight}%)</strong>
              </div>
            </div>
          </div>
          )}

          {/* Reason Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Reason for Change
            </label>
            <textarea
              rows={3}
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Explain the reason for this midcycle split (e.g. organizational changes, role modifications, revised business objectives)..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '13px',
                resize: 'none',
              }}
              required
            />
          </div>

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px 12px' }} className="flex gap-2 items-start">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p style={{ fontSize: '11px', color: '#92400E', lineHeight: '1.4' }}>
              <strong>Important:</strong> Triggering this split will lock the current goals and calculate their score. A new blank draft will be created for Phase {currentPhaseNumber + 1}, and the manager must assign new KPIs.
            </p>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !hasValidDateRange}
              style={{
                background: '#1A56DB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Processing...' : 'Confirm Split'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
