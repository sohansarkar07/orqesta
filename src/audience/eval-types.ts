/**
 * Types for identity-level evaluation (Audience Regression Guard — Phase 1C).
 *
 * Distinct from the allocation-comparison types in types.ts.
 * These types represent actual Flagsmith evaluation results per synthetic identity.
 */

export interface IdentityTrait {
  key: string;
  value: string | number | boolean;
}

export interface IdentityFixture {
  identifier: string;
  traits?: IdentityTrait[];
  description?: string;
}

export interface IdentityFixtureFile {
  version: 1;
  identities: IdentityFixture[];
}

export type EvalRegressionType =
  | 'UNCHANGED'
  | 'ENABLEMENT_REGRESSION'    // was enabled, now disabled — user loses access
  | 'ENABLEMENT_CHANGE'        // was disabled, now enabled — user gains access
  | 'VARIANT_CHANGE'           // MV variant changed
  | 'VALUE_CHANGE'             // remote config value changed
  | 'MISSING_FEATURE'          // feature exists in source but not target
  | 'EVALUATION_ERROR';        // API call failed for this identity

export interface FeatureEvaluation {
  featureName: string;
  enabled: boolean;
  value: string | number | boolean | null;
  variant: string | null;
  reason: string;
}

export interface EvalRegressionResult {
  feature: string;
  type: EvalRegressionType;
  severity: 'critical' | 'warning' | 'info';
  explanation: string;
  source: FeatureEvaluation;
  target: FeatureEvaluation | null;
}

export interface IdentityEvaluationResult {
  identifier: string;
  traits: IdentityTrait[];
  regressions: EvalRegressionResult[];
  featuresEvaluated: number;
  error?: string;
}

export interface EvalReport {
  sourceEnvironment: string;
  targetEnvironment: string;
  timestamp: string;
  identitiesEvaluated: number;
  totalRegressions: number;
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  results: IdentityEvaluationResult[];
}
