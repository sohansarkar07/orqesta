/**
 * Identity-level evaluation engine for the Audience Regression Guard.
 *
 * Uses the Flagsmith Flags API (edge.api.flagsmith.com or self-hosted)
 * to evaluate synthetic identities against two environments and compare results.
 *
 * API used: POST /api/v1/identities/
 * Auth:     X-Environment-Key: <client or server-side key>
 * Docs:     https://docs.flagsmith.com/clients/rest#identities
 */

import axios from 'axios';
import type {
  IdentityFixture,
  IdentityEvaluationResult,
  FeatureEvaluation,
  EvalRegressionType,
  EvalRegressionResult,
  EvalReport,
} from './eval-types.js';

/** Single flag result returned by Flagsmith Flags API */
interface FlagsmithFlagResult {
  feature: { id: number; name: string; type: string };
  enabled: boolean;
  feature_state_value: string | number | boolean | null;
  reason?: string;
  variant?: string | null;
}

/** Evaluate one identity against one environment's Flags API */
async function evaluateIdentity(
  flagsApiUrl: string,
  envKey: string,
  identity: IdentityFixture,
): Promise<FeatureEvaluation[]> {
  const http = axios.create({
    baseURL: flagsApiUrl.replace(/\/$/, ''),
    headers: { 'X-Environment-Key': envKey, 'Content-Type': 'application/json' },
    timeout: 10_000,
  });

  const body = {
    identifier: identity.identifier,
    traits: (identity.traits ?? []).map((t) => ({
      trait_key: t.key,
      trait_value: t.value,
    })),
  };

  try {
    const res = await http.post<{ flags: FlagsmithFlagResult[] }>('/identities/', body);
    const flags = Array.isArray(res.data) ? res.data as FlagsmithFlagResult[] : (res.data as { flags: FlagsmithFlagResult[] }).flags ?? [];

    return flags.map((f) => ({
      featureName: f.feature.name,
      enabled: f.enabled,
      value: f.feature_state_value,
      variant: f.variant ?? null,
      reason: f.reason ?? 'STATIC',
    }));
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const detail = (err.response?.data as { detail?: string })?.detail;
      throw new Error(
        `Flags API error (${status ?? 'network'}) for identity "${identity.identifier}": ${detail ?? err.message}`,
      );
    }
    throw err;
  }
}

/** Classify the difference between two evaluations of the same feature */
function classifyRegression(
  feature: string,
  source: FeatureEvaluation,
  target: FeatureEvaluation,
): EvalRegressionResult | null {
  // No change at all
  if (
    source.enabled === target.enabled &&
    source.value === target.value &&
    source.variant === target.variant
  ) {
    return null;
  }

  let type: EvalRegressionType;
  let explanation: string;
  let severity: 'critical' | 'warning' | 'info';

  if (source.enabled && !target.enabled) {
    type = 'ENABLEMENT_REGRESSION';
    explanation = `Feature was enabled in source but is disabled in target. This user loses access.`;
    severity = 'critical';
  } else if (!source.enabled && target.enabled) {
    type = 'ENABLEMENT_CHANGE';
    explanation = `Feature was disabled in source but is enabled in target. This user gains access.`;
    severity = 'warning';
  } else if (source.variant !== target.variant && source.variant !== null && target.variant !== null) {
    type = 'VARIANT_CHANGE';
    explanation = `Multivariate variant changed from "${source.variant}" to "${target.variant}".`;
    severity = 'warning';
  } else if (source.value !== target.value) {
    type = 'VALUE_CHANGE';
    explanation = `Feature value changed from ${JSON.stringify(source.value)} to ${JSON.stringify(target.value)}.`;
    severity = 'info';
  } else {
    // Some other combination — flag as info
    type = 'VALUE_CHANGE';
    explanation = `Evaluation result differs between environments.`;
    severity = 'info';
  }

  return {
    feature,
    type,
    severity,
    explanation,
    source,
    target,
  };
}

/**
 * Evaluate all fixtures against both environments and produce a regression report.
 */
export async function runIdentityEvaluation(
  sourceEnvName: string,
  targetEnvName: string,
  sourceEnvKey: string,
  targetEnvKey: string,
  flagsApiUrl: string,
  fixtures: IdentityFixture[],
  featureFilter?: string[],
): Promise<EvalReport> {
  const identityResults: IdentityEvaluationResult[] = [];
  let totalRegressions = 0;
  const summary = { critical: 0, warning: 0, info: 0, total: 0 };

  for (const fixture of fixtures) {
    let sourceEvals: FeatureEvaluation[];
    let targetEvals: FeatureEvaluation[];
    let evalError: string | undefined;

    try {
      [sourceEvals, targetEvals] = await Promise.all([
        evaluateIdentity(flagsApiUrl, sourceEnvKey, fixture),
        evaluateIdentity(flagsApiUrl, targetEnvKey, fixture),
      ]);
    } catch (err) {
      evalError = err instanceof Error ? err.message : String(err);
      identityResults.push({
        identifier: fixture.identifier,
        traits: fixture.traits ?? [],
        regressions: [],
        featuresEvaluated: 0,
        error: evalError,
      });
      continue;
    }

    // Build map keyed by feature name
    const targetMap = new Map(targetEvals.map((e) => [e.featureName, e]));

    const regressions: EvalRegressionResult[] = [];

    for (const sourceEval of sourceEvals) {
      // Apply feature filter if provided
      if (featureFilter && featureFilter.length > 0) {
        if (!featureFilter.includes(sourceEval.featureName)) continue;
      }

      const targetEval = targetMap.get(sourceEval.featureName);
      if (!targetEval) {
        regressions.push({
          feature: sourceEval.featureName,
          type: 'MISSING_FEATURE',
          severity: 'critical',
          explanation: `Feature "${sourceEval.featureName}" exists in ${sourceEnvName} but not in ${targetEnvName}.`,
          source: sourceEval,
          target: null,
        });
        continue;
      }

      const regression = classifyRegression(sourceEval.featureName, sourceEval, targetEval);
      if (regression) regressions.push(regression);
    }

    // Count
    for (const reg of regressions) {
      summary[reg.severity]++;
      summary.total++;
    }
    totalRegressions += regressions.length;

    identityResults.push({
      identifier: fixture.identifier,
      traits: fixture.traits ?? [],
      regressions,
      featuresEvaluated: sourceEvals.length,
    });
  }

  return {
    sourceEnvironment: sourceEnvName,
    targetEnvironment: targetEnvName,
    timestamp: new Date().toISOString(),
    identitiesEvaluated: fixtures.length,
    totalRegressions,
    summary,
    results: identityResults,
  };
}
