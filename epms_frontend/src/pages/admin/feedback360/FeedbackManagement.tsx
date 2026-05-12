import React, { useState } from 'react';
import { useGetCyclesQuery } from '../../../features/appraisal/appraisalApi';
import { 
  usePreviewFeedbackRequestsQuery, 
  useGenerateFeedbackRequestsMutation,
  useGenerateAllSummariesMutation,
  useFinalizeEvaluatorsMutation,
  useResetCycleStatusMutation,
  useValidateGenerationQuery
} from '../../../features/feedback360/feedback360Api';
import GovernanceHeader from '../../../features/feedback360/components/GovernanceHeader';
import ConfigSidebar from '../../../features/feedback360/components/ConfigSidebar';
import AssignmentMatrix from '../../../features/feedback360/components/AssignmentMatrix';
import { usePagination } from '../../../hooks/usePagination';

const FeedbackManagement: React.FC = () => {
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [previousCycleId, setPreviousCycleId] = useState<number | undefined>();
  const [globalMaxLimit, setGlobalMaxLimit] = useState(7);
  const [excludeLongTermLeave, setExcludeLongTermLeave] = useState(true);

  // Independent pagination for the matrix (if backend supports it, otherwise handles client-side state)
  const matrixPaging = usePagination('matrix');

  const { data: cycles, refetch: refetchCycles } = useGetCyclesQuery();
  
  const { 
    data: previewItems, 
    isFetching: isPreviewing, 
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

  const handleFinalize = async (id: number) => {
    try {
      await finalize(id).unwrap();
      await refetchCycles(); // Force refresh cycle status
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

    if (validation && !validation.isValid) {
      alert('CRITICAL ERROR:\n' + validation.errors.join('\n') + '\n\nPlease fix these issues before launching.');
      return;
    }

    if (validation && validation.warnings.length > 0) {
      if (!window.confirm('WARNINGS FOUND:\n' + validation.warnings.slice(0, 5).join('\n') + (validation.warnings.length > 5 ? '\n...and more' : '') + '\n\nDo you want to proceed anyway?')) return;
    }

    if (!window.confirm('Are you sure you want to GENERATE and SAVE these requests? This will trigger notifications to all evaluators.')) return;
    try {
      await generate({ cycleId: selectedCycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave }).unwrap();
      alert('Feedback requests generated!');
    } catch (err) {
      console.error(err);
    }
  };



  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <GovernanceHeader 
        cycles={cycles} 
        selectedCycleId={selectedCycleId} 
        onCycleChange={setSelectedCycleId} 
        onFinalize={handleFinalize}
        onReset={handleReset}
        isFinalizing={isFinalizing}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <ConfigSidebar 
          globalMaxLimit={globalMaxLimit}
          setGlobalMaxLimit={setGlobalMaxLimit}
          excludeLongTermLeave={excludeLongTermLeave}
          setExcludeLongTermLeave={setExcludeLongTermLeave}
          isPreviewing={isPreviewing}
          isGenerating={isGenerating}
          onPreview={() => runPreview()}
          onGenerate={handleGenerate}
          canAction={!!selectedCycleId && canGenerate}
        />

        <AssignmentMatrix 
          items={previewItems}
          isLoading={isPreviewing}
          onGenerateSummaries={() => {}} // Not used here anymore
          isGeneratingSummaries={false}
          canGenerateSummaries={false}
        />
      </div>
    </div>
  );
};

export default FeedbackManagement;
