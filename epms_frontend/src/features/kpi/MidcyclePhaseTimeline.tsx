import React, { useState } from 'react';
import {
  Calendar,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MidcycleSummaryResponse } from './midcycleTypes';
import { useFinalizeCompositeScoreMutation } from '../../services/midcycleApi';
import { toast } from 'react-toastify';

interface MidcyclePhaseTimelineProps {
  summary: MidcycleSummaryResponse;
  isPrivileged: boolean; // HR or Admin to allow finalize
  onRefetch: () => void;
}

export const MidcyclePhaseTimeline: React.FC<MidcyclePhaseTimelineProps> = ({
  summary,
  isPrivileged,
  onRefetch,
}) => {
  const [finalizeScore, { isLoading: isFinalizing }] = useFinalizeCompositeScoreMutation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFinalize = async () => {
    try {
      await finalizeScore({ employeeId: summary.employeeId, cycleId: summary.cycleId }).unwrap();
      toast.success('Composite final score calculated and published successfully!');
      onRefetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to finalize composite score');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Present';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const phasesCountLabel = `${summary.phases.length} phase${summary.phases.length !== 1 ? 's' : ''}`;
  const firstPhase = summary.phases[0];
  const lastPhase = summary.phases[summary.phases.length - 1];

  return (
    <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '20px', marginBottom: '16px' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-4">
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }} className="flex items-center gap-1.5">
            <Clock size={16} className="text-blue-600" />
            Midcycle Phase Split Timeline
          </h3>
          <p style={{ fontSize: '11px', color: '#9EA3B0', marginTop: '2px' }}>
            Appraisal Cycle: {summary.cycleName} ({summary.totalCycleDays} days total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPrivileged && (
            <button
              onClick={handleFinalize}
              disabled={isFinalizing || summary.phases.length === 0}
              style={{
                background: '#1A56DB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: isFinalizing ? 'not-allowed' : 'pointer',
                opacity: isFinalizing ? 0.7 : 1,
                transition: 'background 0.2s',
              }}
              className="hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
            >
              {isFinalizing ? 'Finalizing...' : 'Finalize Composite Score'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse midcycle timeline' : 'Expand midcycle timeline'}
            title={isExpanded ? 'Collapse timeline' : 'Expand timeline'}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '0.5px solid #E4E6EC',
              borderRadius: 8,
              background: '#FFFFFF',
              color: '#5A6070',
              flexShrink: 0,
            }}
            className="hover:bg-[#F5F6F8] transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {!isExpanded ? (
        <div style={{ background: '#FAFBFF', border: '0.5px solid #F0F2F6', borderRadius: '10px', padding: '12px 16px' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Timeline collapsed</p>
              <p style={{ fontSize: '11px', color: '#9EA3B0', marginTop: '2px' }}>
                {phasesCountLabel} tracked for this cycle. Expand to review dates, scores, and phase breakdowns.
              </p>
              {firstPhase && lastPhase && (
                <p style={{ fontSize: '11px', color: '#5A6070', marginTop: '4px' }}>
                  {formatDate(firstPhase.startDate)} - {formatDate(lastPhase.endDate)}
                </p>
              )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: summary.compositeScore !== null ? '#27500A' : '#92400E', background: summary.compositeScore !== null ? '#EAF3DE' : '#FFFBEB', borderRadius: 999, padding: '4px 10px' }}>
              {summary.compositeScore !== null ? 'Finalized' : 'Pending'}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Timeline list */}
          <div className="space-y-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {summary.phases.map((phase) => {
              const isCompleted = phase.status === 'SCORED' || phase.status === 'LOCKED';
              const isActive = phase.status === 'OPEN';

              return (
                <div key={phase.phaseNumber} className="flex gap-4 relative">
                  {/* Timeline marker */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? '#EEF3FD' : isCompleted ? '#EAF3DE' : '#FFFFFF',
                      border: `2px solid ${isActive ? '#1A56DB' : isCompleted ? '#B8DCA0' : '#E4E6EC'}`,
                      color: isActive ? '#1A56DB' : isCompleted ? '#27500A' : '#5A6070',
                      fontWeight: 600,
                      fontSize: '12px',
                      zIndex: 2,
                      flexShrink: 0,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      alignSelf: 'flex-start',
                    }}
                    className="flex items-center justify-center"
                  >
                    {phase.phaseNumber}
                  </div>

                  {/* Phase details card */}
                  <div
                    style={{ flex: 1, background: '#FAFBFF', border: '0.5px solid #F0F2F6', borderRadius: '8px', padding: '12px 16px' }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                          Phase {phase.phaseNumber} Details
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            background: isActive ? '#EEF3FD' : '#EAF3DE',
                            color: isActive ? '#1A56DB' : '#27500A',
                            border: `0.5px solid ${isActive ? '#D1E2FF' : '#B8DCA0'}`,
                          }}
                        >
                          {phase.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#5A6070', marginTop: '6px' }}>
                        <Calendar size={12} className="text-gray-400" />
                        <span>{formatDate(phase.startDate)}</span>
                        <ArrowRight size={10} className="text-gray-400" />
                        <span>{formatDate(phase.endDate)}</span>
                        <span style={{ color: '#9EA3B0' }}>-</span>
                        <span>{phase.days} Days ({Math.round(phase.weight * 100)}%)</span>
                      </div>

                      {phase.changeReason && (
                        <p style={{ fontSize: '11px', color: '#9EA3B0', fontStyle: 'italic', marginTop: '6px' }}>
                          Reason: "{phase.changeReason}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 self-start md:self-auto">
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '9px', color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Phase Score
                        </p>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: phase.score !== null ? '#111827' : '#9EA3B0', marginTop: '2px' }}>
                          {phase.score !== null ? Number(phase.score).toFixed(1) : 'Pending'}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', borderLeft: '1px solid #E4E6EC', paddingLeft: '24px' }}>
                        <p style={{ fontSize: '9px', color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Contribution
                        </p>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: phase.weightedContribution !== null ? '#1A56DB' : '#9EA3B0', marginTop: '2px' }}>
                          {phase.weightedContribution !== null ? Number(phase.weightedContribution).toFixed(1) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary composite footer */}
          {summary.compositeScore !== null ? (
            <div
              style={{
                marginTop: '20px',
                background: '#EAF3DE',
                border: '0.5px solid #B8DCA0',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-700" />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#27500A' }}>Composite Appraisal score finalized</p>
                  <p style={{ fontSize: '10px', color: '#5A7A3A' }}>Calculated by duration-weighted averages of all {summary.phases.length} phases.</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Award size={16} className="text-green-700" />
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#27500A' }}>
                  {Number(summary.compositeScore).toFixed(2)}
                </span>
                <span style={{ fontSize: '12px', color: '#5A7A3A', alignSelf: 'flex-end', marginBottom: '2px' }}>/ 100</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: '20px',
                background: '#FFFBEB',
                border: '0.5px solid #FDE68A',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-700" />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400E' }}>Composite Score Pending</p>
                  <p style={{ fontSize: '10px', color: '#B45309' }}>The score will be compiled once the cycle ends or is finalized by HR.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

