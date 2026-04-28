/**
 * Centralized logic for KPI performance calculations.
 * Ensures consistency across HR, Manager, and Employee dashboards.
 */

export const calculateProgressPercent = (actual: number, target: number): number => {
  if (!target || target === 0) return 0;
  const percent = (actual / target) * 100;
  return Math.min(Math.round(percent), 100);
};

export const calculateWeightedScore = (actual: number, target: number, weight: number): number => {
  if (!target || target === 0) return 0;
  const progress = actual / target;
  return Number((progress * weight).toFixed(2));
};

export interface WeightValidationResult {
  totalWeight: number;
  isValid: boolean;
  errors: string[];
}

export const validateKpiWeights = (items: { weightPercent: number }[]): WeightValidationResult => {
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weightPercent) || 0), 0);
  const errors: string[] = [];

  if (totalWeight !== 100) {
    errors.push(`Total weight must be exactly 100% (Current: ${totalWeight}%)`);
  }

  const exceedingItem = items.find(item => item.weightPercent > 35);
  if (exceedingItem) {
    errors.push('No single KPI item can exceed 35% weight.');
  }

  return {
    totalWeight,
    isValid: errors.length === 0,
    errors
  };
};

export const getStatusColor = (progress: number): string => {
  if (progress >= 100) return 'text-green-600 bg-green-50 border-green-100';
  if (progress >= 75) return 'text-blue-600 bg-blue-50 border-blue-100';
  if (progress >= 40) return 'text-amber-600 bg-amber-50 border-amber-100';
  return 'text-red-600 bg-red-50 border-red-100';
};
