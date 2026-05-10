import type { GoalSetResponse } from '../features/kpi/kpiTypes';

/**
 * Interface for KPI metrics returned by calculation logic.
 */
export interface KpiMetrics {
  finalScore: number;
  completionRate: number;
}

/**
 * Extended GoalSetResponse with calculated metrics.
 */
export interface EnrichedGoalSet extends GoalSetResponse {
  finalScore: number;
  completionRate: number;
}

/**
 * Calculates metrics for a given goal set.
 * Returns a standalone metrics object.
 */
export const calculateGoalSetMetrics = (goalSet: GoalSetResponse): KpiMetrics => {
  const items = goalSet.items || [];

  if (items.length === 0) {
    return {
      finalScore: 0,
      completionRate: 0,
    };
  }

  let totalWeightedScore = 0;
  let totalCompletion = 0;

  items.forEach(item => {
    const progress = item.currentProgress || 0;
    const target = item.targetValue || 1;
    const weight = item.weightPercent || 0;

    // Calculate completion for this specific item (capped at 100%)
    const itemCompletion = Math.min((progress / target) * 100, 100);
    totalCompletion += itemCompletion;

    // Weighted contribution to the final score
    totalWeightedScore += (itemCompletion * weight) / 100;
  });

  return {
    finalScore: Math.round(totalWeightedScore * 10) / 10,
    completionRate: Math.round(totalCompletion / items.length),
  };
};

/**
 * Enriches a GoalSetResponse with calculated metrics.
 * Useful for components that need the entire object with scores attached.
 */
export const enrichGoalSet = (goalSet: GoalSetResponse): EnrichedGoalSet => {
  const metrics = calculateGoalSetMetrics(goalSet);
  return {
    ...goalSet,
    ...metrics,
    // Ensure we have a cycle name to display
    appraisalCycleName: goalSet.appraisalCycleName || 'Unknown Cycle'
  };
};

/**
 * Enriches a list of GoalSetResponses.
 */
export const enrichGoalSets = (goalSets: GoalSetResponse[]): EnrichedGoalSet[] => {
  return goalSets.map(enrichGoalSet);
};
