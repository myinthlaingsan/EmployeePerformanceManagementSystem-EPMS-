import React, { useState } from 'react';
import { useGetCyclesQuery } from '../../../features/appraisal/appraisalApi';
import { 
  usePreviewFeedbackRequestsQuery, 
  useGenerateFeedbackRequestsMutation,
  useGenerateAllSummariesMutation,
  useFinalizeEvaluatorsMutation,
  useResetCycleStatusMutation,
  useValidateGenerationQuery,
  useGetCycleProgressQuery,
  useGetRequestsByCycleQuery
} from '../../../features/feedback360/feedback360Api';
import GovernanceHeader from '../../../features/feedback360/components/GovernanceHeader';
import ConfigSidebar from '../../../features/feedback360/components/ConfigSidebar';
import AssignmentMatrix from '../../../features/feedback360/components/AssignmentMatrix';
import ValidationModal from '../../../features/feedback360/components/ValidationModal';
import PendingFeedbackList from './PendingFeedbackList';
import { usePagination } from '../../../hooks/usePagination';
import { Loader2, LayoutGrid, Clock } from 'lucide-react';

type ActiveTab = 'matrix' | 'pending';

const FeedbackManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('matrix');
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [previousCycleId, setPreviousCycleId] = useState<number | undefined>();
  const [globalMaxLimit, setGlobalMaxLimit] = useState(7);
  const [excludeLongTermLeave, setExcludeLongTermLeave] = useState(true);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  // Independent pagination for the matrix
  const matrixPaging = usePagination('matrix');

  const { data: cycles, refetch: refetchCycles } = useGetCyclesQuery();
  
  const { 
    data: previewItems, 
    isFetching: isPreviewing, 
    error: previewError,
    refetch: runPreview 
  } = usePreviewFeedbackRequestsQuery(
    { 
      cycleId: selectedCycleId || 0, 
      previousCycleId, 
      globalMaxLimit, 
      excludeLongTermLeave 
    },
    { skip: !selectedCycleId }
  );

  const [generate, { isLoading: isGenerating }] = useGenerateFeedbackRequestsMutation();
  const [generateSummaries, { isLoading: isGeneratingSummaries }] = useGenerateAllSummariesMutation();
  const [finalize, { isLoading: isFinalizing }] = useFinalizeEvaluatorsMutation();
  const [resetStatus] = useResetCycleStatusMutation();

  const { data: validation } = useValidateGenerationQuery(
    { cycleId: selectedCycleId || 0, excludeLongTermLeave },
    { skip: !selectedCycleId }
  );

  const selectedCycle = cycles?.find(c => (c.cycleId || c.id) === selectedCycleId);
  const canGenerate = selectedCycle?.status === 'FINALIZED';

  const { data: progress } = useGetCycleProgressQuery(selectedCycleId || 0, {
    skip: !selectedCycleId,
    pollingInterval: 30000 
  });

  const { data: actualRequests, isFetching: isFetchingActual } = useGetRequestsByCycleQuery(
    selectedCycleId || 0,
    { skip: !selectedCycleId || selectedCycle?.status !== 'GENERATED' }
  );

  const handleFinalize = async (id: number) => {
    try {
      await finalize(id).unwrap();
      await refetchCycles();
      alert('Evaluator list finalized! You can now generate requests.');
    } catch (err) {
      console.error(err);
      alert('Failed to finalize: ' + (err as any)?.data?.message || 'Unknown error');
    }
  };

  const handleReset = async (id: number) => {
    if (!window.confirm('WARNING: This will reset the cycle to PLANNING stage and delete all pending feedback requests. Continue?')) return;
    try {
      await resetStatus(id).unwrap();
      await refetchCycles();
      alert('Cycle status reset to PLANNING.');
    } catch (err) {
      console.error(err);
      alert('Failed to reset: ' + (err as any)?.data?.message || 'Unknown error');
    }
  };

  const handleGenerate = async () => {
    if (!selectedCycleId) return;
    if (!canGenerate) {
      alert('You must Finalize the population before launching the cycle.');
      return;
    }
    if (validation && (!validation.isValid || validation.warnings.length > 0)) {
      setIsValidationModalOpen(true);
      return;
    }
    if (!window.confirm('Are you sure you want to GENERATE and SAVE these requests? This will trigger notifications to all evaluators.')) return;
    try {
      await generate({ cycleId: selectedCycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave }).unwrap();
      alert('Feedback requests generated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to launch cycle: ' + ((err as any)?.data?.message || 'Unknown error'));
    }
  };

  const handleGenerateSummaries = async () => {
    if (!selectedCycleId) return;
    if (!window.confirm('Are you sure you want to generate summaries for all employees in this cycle? This will calculate final scores based on received feedback.')) return;
    
    try {
      await generateSummaries(selectedCycleId).unwrap();
      alert('Feedback summaries generated successfully!');
      await refetchCycles();
    } catch (err) {
      console.error(err);
      alert('Failed to generate summaries: ' + (err as any)?.data?.message || 'Unknown error');
    }
  };

  if (!cycles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'matrix',  label: 'Assignment Matrix',    icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending Feedback List', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20 animate-in fade-in duration-700">

      {/* Governance header — always visible */}
      <GovernanceHeader 
        cycles={cycles} 
        selectedCycle={selectedCycle} 
        onCycleChange={setSelectedCycleId} 
        onFinalize={handleFinalize}
        onReset={handleReset}
        isFinalizing={isFinalizing}
        progress={progress}
      />

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Assignment Matrix tab ── */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <ConfigSidebar 
            globalMaxLimit={globalMaxLimit}
            setGlobalMaxLimit={setGlobalMaxLimit}
            excludeLongTermLeave={excludeLongTermLeave}
            setExcludeLongTermLeave={setExcludeLongTermLeave}
            isPreviewing={isPreviewing}
            isGenerating={isGenerating}
            onPreview={() => runPreview()}
            onShuffle={() => runPreview()}
            onGenerate={handleGenerate}
            canAction={!!selectedCycleId && canGenerate}
          />
           <AssignmentMatrix 
            items={(
              (selectedCycle?.status === 'GENERATED' ? actualRequests : previewItems) || []
            ).filter(item => item && item.targetUserId && item.evaluatorId)}
            isLoading={
              selectedCycle?.status === 'GENERATED' ? (isFetchingActual || false) : isPreviewing
            }
            error={selectedCycle?.status === 'GENERATED' ? undefined : previewError}
            onGenerateSummaries={handleGenerateSummaries} 
            isGeneratingSummaries={isGeneratingSummaries}
            canGenerateSummaries={!!selectedCycleId && selectedCycle?.status === 'GENERATED'}
          />
        </div>
      )}

      {/* ── Pending Feedback List tab ── */}
      {activeTab === 'pending' && <PendingFeedbackList />}

      {/* ── Validation modal ── */}
      <ValidationModal 
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        onConfirm={async () => {
          setIsValidationModalOpen(false);
          if (window.confirm('Are you sure you want to GENERATE and SAVE these requests? This will trigger notifications to all evaluators.')) {
            try {
              await generate({ cycleId: selectedCycleId!, previousCycleId, globalMaxLimit, excludeLongTermLeave }).unwrap();
              alert('Feedback requests generated successfully!');
            } catch (err) {
              console.error(err);
              alert('Failed to launch cycle: ' + ((err as any)?.data?.message || 'Unknown error'));
            }
          }
        }}
        title={validation?.isValid ? "Generation Warnings" : "Critical Validation Errors"}
        errors={validation?.errors || []}
        warnings={validation?.warnings || []}
      />
    </div>
  );
};

export default FeedbackManagement;
