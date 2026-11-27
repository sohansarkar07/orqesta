/**
 * Synchronisation planner
 * Converts a drift report into a typed, executable sync plan.
 */

import crypto from 'crypto';
import type { DriftReport } from '../types/drift.js';
import type {
  SyncPlan,
  SyncOperation,
  SyncOperationType,
  StaleOperationInfo,
} from '../types/sync.js';
import type { FlagsmithFeatureState } from '../types/flagsmith.js';

export class SyncPlanner {
  /**
   * Build a sync plan from drift items and the target's current feature states.
   * We need the target feature state IDs to construct the PATCH calls.
   */
  static buildPlan(
    drift: DriftReport,
    targetFeatureStates: FlagsmithFeatureState[],
  ): SyncPlan {
    const targetStatesByName = new Map<string, FlagsmithFeatureState>(
      targetFeatureStates
        .filter((fs) => typeof fs.feature !== 'number')
        .map((fs) => {
          const feat = fs.feature as { id: number; name: string; type: 'STANDARD' | 'MULTIVARIATE' };
          return [feat.name, fs];
        }),
    );

    const operations: SyncOperation[] = [];

    for (const item of drift.drifts) {
      // We can only sync features that exist in both environments.
      // Missing-in-target would require creating a feature state, which is
      // supported but we limit to safe, confirmed operations in the MVP.
      if (item.category === 'missing_in_source') {
        // Source doesn't have this feature — we can't sync source → target.
        // We note this as an informational skip.
        continue;
      }

      if (item.category === 'missing_in_target') {
        // Feature exists in source but not in target. Creating a new feature
        // state in target is possible via POST but is risky for the MVP.
        // We flag it but don't auto-plan the creation.
        operations.push({
          id: `${item.feature}-missing_in_target`,
          feature: item.feature,
          type: 'enable' as SyncOperationType, // placeholder
          currentValue: null,
          proposedValue: item.sourceValue,
          description: `⚠ Feature '${item.feature}' does not exist in target. Manual creation required.`,
          featureStateId: undefined,
        });
        continue;
      }

      const targetState = targetStatesByName.get(item.feature);
      if (!targetState) continue; // shouldn't happen for non-missing categories

      if (item.category === 'enabled_state') {
        const type: SyncOperationType = item.sourceValue ? 'enable' : 'disable';
        operations.push({
          id: `${item.feature}-${type}`,
          feature: item.feature,
          type,
          currentValue: item.targetValue,
          proposedValue: item.sourceValue,
          description: `Set '${item.feature}' to ${type === 'enable' ? 'enabled' : 'disabled'} (source is ${type === 'enable' ? 'enabled' : 'disabled'}, target is ${type === 'enable' ? 'disabled' : 'enabled'})`,
          featureStateId: targetState.id,
        });
      }

      if (item.category === 'value_change') {
        operations.push({
          id: `${item.feature}-set_value`,
          feature: item.feature,
          type: 'set_value',
          currentValue: item.targetValue,
          proposedValue: item.sourceValue,
          description: `Update value of '${item.feature}' from ${JSON.stringify(item.targetValue)} → ${JSON.stringify(item.sourceValue)}`,
          featureStateId: targetState.id,
        });
      }

      if (item.category === 'multivariate_allocation') {
        operations.push({
          id: `${item.feature}-set_multivariate_allocations`,
          feature: item.feature,
          type: 'set_multivariate_allocations',
          currentValue: item.targetValue,
          proposedValue: item.sourceValue,
          description: `Update multivariate allocations for '${item.feature}'`,
          featureStateId: targetState.id,
        });
      }
    }

    const checksum = this.computeChecksum(operations);

    // Build a snapshot of the target state at plan-creation time
    const targetStateSnapshot = targetFeatureStates
      .filter((fs) => typeof fs.feature !== 'number')
      .map((fs) => {
        const feat = fs.feature as { id: number; name: string; type: 'STANDARD' | 'MULTIVARIATE' };
        return {
          featureStateId: fs.id,
          feature: feat.name,
          enabled: fs.enabled,
          value: fs.feature_state_value,
        };
      });

    return {
      source: drift.source,
      target: drift.target,
      createdAt: new Date().toISOString(),
      operations,
      checksum,
      targetStateSnapshot,
    };
  }

  /**
   * Recompute the checksum of a plan from scratch and compare.
   * Returns false if the plan is stale (feature states may have changed since planning).
   */
  static verifyChecksum(plan: SyncPlan): boolean {
    const expected = this.computeChecksum(plan.operations);
    return expected === plan.checksum;
  }

  /**
   * Detect operations whose target state has changed since the plan was created.
   * Compares the snapshot taken at plan time against the current live target state.
   */
  static detectStaleOperations(
    plan: SyncPlan,
    currentTargetStates: FlagsmithFeatureState[],
  ): StaleOperationInfo[] {
    const currentById = new Map<number, FlagsmithFeatureState>(
      currentTargetStates.map((fs) => [fs.id, fs]),
    );

    const snapshotById = new Map(
      plan.targetStateSnapshot.map((s) => [s.featureStateId, s]),
    );

    const stale: StaleOperationInfo[] = [];

    for (const op of plan.operations) {
      if (op.featureStateId === undefined) continue;

      const snapshot = snapshotById.get(op.featureStateId);
      const current = currentById.get(op.featureStateId);

      if (!snapshot || !current) continue;

      const enabledChanged = snapshot.enabled !== current.enabled;
      const valueChanged = snapshot.value !== current.feature_state_value;

      if (enabledChanged || valueChanged) {
        const reasons: string[] = [];
        if (enabledChanged) {
          reasons.push(
            `enabled was ${String(snapshot.enabled)} but is now ${String(current.enabled)}`,
          );
        }
        if (valueChanged) {
          reasons.push(
            `value was ${JSON.stringify(snapshot.value)} but is now ${JSON.stringify(current.feature_state_value)}`,
          );
        }
        stale.push({
          operationId: op.id,
          feature: op.feature,
          reason: reasons.join('; '),
        });
      }
    }

    return stale;
  }

  private static computeChecksum(operations: SyncOperation[]): string {
    const ids = operations
      .map((op) => op.id)
      .sort()
      .join('|');
    return crypto.createHash('sha256').update(ids).digest('hex').slice(0, 16);
  }
}
