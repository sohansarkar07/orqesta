/**
 * Audience Regression Guard types.
 *
 * The guard compares multivariate flag allocations across two environment
 * snapshots and reports which user segments received more or less exposure
 * than expected after a sync operation.
 */

export interface MultivariateVariant {
  /** Flagsmith multivariate_feature_option ID */
  optionId: number;
  /** Human-readable label (derived from option ID, resolved where available) */
  label: string;
  /** Percentage allocation (0–100) */
  percentage: number;
}

export interface AudienceSnapshot {
  /** Feature flag name */
  feature: string;
  /** Percentage of users seeing the base/control value (100 - sum of MV allocations) */
  controlPercentage: number;
  /** All MV variants */
  variants: MultivariateVariant[];
  /** ISO timestamp */
  capturedAt: string;
}

export type RegressionSeverity = 'critical' | 'warning' | 'info';

export interface VariantShift {
  optionId: number;
  label: string;
  /** Allocation before */
  before: number;
  /** Allocation after */
  after: number;
  /** Signed delta (positive = more audience, negative = less) */
  delta: number;
}

export interface AudienceRegressionResult {
  feature: string;
  severity: RegressionSeverity;
  /** Short summary of what changed */
  summary: string;
  /** Per-variant allocation shifts */
  shifts: VariantShift[];
  /** Control (base value) shift */
  controlShift: VariantShift;
  /** Whether the total allocations still sum correctly to 100 */
  allocationsSumValid: boolean;
}

export interface AudienceGuardReport {
  /** Environment the guard ran against */
  environment: string;
  /** Source (reference) environment */
  sourceEnvironment: string;
  /** ISO timestamp */
  timestamp: string;
  /** Regressions found */
  regressions: AudienceRegressionResult[];
  /** Flags checked (MV flags only) */
  flagsChecked: number;
  /** Flags with no allocation changes */
  flagsUnchanged: number;
  /** Summary counts */
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
}
