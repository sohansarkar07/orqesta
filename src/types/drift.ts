/**
 * Drift detection types
 */

export type DriftCategory =
  | 'missing_in_source'
  | 'missing_in_target'
  | 'enabled_state'
  | 'value_change'
  | 'multivariate_allocation';

export interface DriftItem {
  feature: string;
  category: DriftCategory;
  sourceValue: unknown;
  targetValue: unknown;
  description: string;
}

export interface DriftReport {
  source: {
    environment: string;
    apiKey: string;
  };
  target: {
    environment: string;
    apiKey: string;
  };
  timestamp: string;
  drifts: DriftItem[];
  summary: {
    total: number;
    byCategory: Record<DriftCategory, number>;
  };
}

export interface NormalisedFeatureState {
  id: number;
  name: string;
  enabled: boolean;
  value: string | number | boolean | null;
  multivariateAllocations: Array<{
    id: number;
    percentage: number;
  }>;
}
