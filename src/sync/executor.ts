/**
 * Synchronisation executor
 * Applies a validated, approved sync plan to the target environment.
 */

import type { SyncPlan, SyncOperation, SyncResult, StaleOperationInfo } from '../types/sync.js';
import type { FlagsmithClient } from '../flagsmith/client.js';
import type { FlagsmithEnvironmentDocument } from '../types/flagsmith.js';
import { DriftComparator } from '../drift/comparator.js';
import { SyncPlanner } from './planner.js';

export class SyncExecutor {
  constructor(private readonly client: FlagsmithClient) {}

  /**
   * Apply a sync plan to the target environment.
   * Each operation is applied independently; partial failures are recorded.
   */
  async execute(
    plan: SyncPlan,
    opts: { dryRun: boolean },
  ): Promise<SyncResult> {
    const results: SyncResult['results'] = [];

    // Fetch current target state for staleness detection
    let currentTargetStates = await this.client.getFeatureStates(plan.target.apiKey);
    const staleOps = SyncPlanner.detectStaleOperations(plan, currentTargetStates);
    const staleOpIds = new Set(staleOps.map((s) => s.operationId));

    for (const op of plan.operations) {
      if (op.featureStateId === undefined) {
        // Unsupported operation (e.g. missing_in_target)
        results.push({
          operation: op,
          status: 'skipped',
          error: 'No target feature state ID available. Manual action required.',
        });
        continue;
      }

      // Check for staleness — skip stale operations even in live mode
      if (staleOpIds.has(op.id)) {
        const staleInfo = staleOps.find((s) => s.operationId === op.id)!;
        results.push({
          operation: op,
          status: 'stale',
          staleReason: staleInfo.reason,
        });
        continue;
      }

      if (opts.dryRun) {
        results.push({ operation: op, status: 'skipped' });
        continue;
      }

      try {
        const patch = this.buildPatch(op);
        await this.client.updateFeatureState(
          plan.target.apiKey,
          op.featureStateId,
          patch,
        );
        results.push({ operation: op, status: 'applied' });
      } catch (err) {
        results.push({
          operation: op,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Verification: re-fetch source and target, compare
    let verificationPassed = false;
    let verificationDrifts: SyncResult['verificationDrifts'];

    if (!opts.dryRun) {
      try {
        const sourceDoc = await this.client.getFeatureStates(plan.source.apiKey);
        // Re-fetch target after all patches
        currentTargetStates = await this.client.getFeatureStates(plan.target.apiKey);

        // Convert feature state arrays to minimal environment document shape
        // for the comparator (which expects environment documents)
        const sourceEnvDoc = featureStatesToDocument(
          sourceDoc.map((fs) => ({
            id: fs.id,
            feature: fs.feature,
            enabled: fs.enabled,
            value: fs.feature_state_value,
            multivariate_feature_state_values:
              fs.multivariate_feature_state_values,
          })),
          plan.source.apiKey,
        );
        const targetEnvDoc = featureStatesToDocument(
          currentTargetStates.map((fs) => ({
            id: fs.id,
            feature: fs.feature,
            enabled: fs.enabled,
            value: fs.feature_state_value,
            multivariate_feature_state_values:
              fs.multivariate_feature_state_values,
          })),
          plan.target.apiKey,
        );

        const postSyncDrift = DriftComparator.compare(
          sourceEnvDoc,
          plan.source.environment,
          targetEnvDoc,
          plan.target.environment,
        );

        // Verification passes if no features that were part of this plan still differ
        const plannedFeatures = new Set(plan.operations.map((op) => op.feature));
        const residualDrifts = postSyncDrift.drifts.filter((d) =>
          plannedFeatures.has(d.feature),
        );

        verificationPassed = residualDrifts.length === 0;
        verificationDrifts = residualDrifts;
      } catch (_err) {
        verificationPassed = false;
      }
    } else {
      verificationPassed = true; // dry-run is always "verified" (nothing changed)
    }

    return {
      plan,
      appliedAt: new Date().toISOString(),
      results,
      verificationPassed,
      verificationDrifts,
      hasStaleness: staleOps.length > 0,
      staleOperations: staleOps.length > 0 ? staleOps : undefined,
    };
  }

  private buildPatch(
    op: SyncOperation,
  ): Parameters<FlagsmithClient['updateFeatureState']>[2] {
    switch (op.type) {
      case 'enable':
        return { enabled: true };
      case 'disable':
        return { enabled: false };
      case 'set_value':
        return { feature_state_value: op.proposedValue as string | number | boolean | null };
      case 'set_multivariate_allocations': {
        const allocs = op.proposedValue as Array<{ id: number; percentage: number }>;
        return {
          multivariate_feature_state_values: allocs.map((a) => ({
            id: 0, // id is assigned by the server; use 0 as placeholder for new entries
            multivariate_feature_option: a.id,
            percentage_allocation: a.percentage,
          })),
        };
      }
      default: {
        const exhaustive: never = op.type;
        throw new Error(`Unknown operation type: ${exhaustive as string}`);
      }
    }
  }
}

function featureStatesToDocument(
  states: Array<{
    id: number;
    feature: { id: number; name: string; type: 'STANDARD' | 'MULTIVARIATE' };
    enabled: boolean;
    value: string | number | boolean | null;
    multivariate_feature_state_values?: Array<{
      id: number;
      multivariate_feature_option: number;
      percentage_allocation: number;
    }>;
  }>,
  apiKey: string,
): FlagsmithEnvironmentDocument {
  return {
    id: 0,
    api_key: apiKey,
    project: {
      id: 0,
      name: '',
      organisation: 0,
      hide_disabled_flags: false,
      segments: [],
    },
    feature_states: states.map((s) => ({
      id: s.id,
      feature: s.feature,
      enabled: s.enabled,
      value: s.value,
      multivariate_feature_state_values: s.multivariate_feature_state_values,
    })),
  };
}
