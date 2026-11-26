/**
 * Environment drift comparator
 * Compares two Flagsmith environment snapshots and produces a structured drift report.
 */

import type {
  FlagsmithEnvironmentDocument,
  EnvironmentDocumentFeatureState,
} from '../types/flagsmith.js';
import type {
  DriftItem,
  DriftReport,
  DriftCategory,
  NormalisedFeatureState,
} from '../types/drift.js';

export class DriftComparator {
  /**
   * Compare two environment documents and produce a drift report.
   */
  static compare(
    source: FlagsmithEnvironmentDocument,
    sourceName: string,
    target: FlagsmithEnvironmentDocument,
    targetName: string,
  ): DriftReport {
    const sourceMap = this.normaliseFeatureStates(source.feature_states);
    const targetMap = this.normaliseFeatureStates(target.feature_states);

    const drifts: DriftItem[] = [];

    const allFeatureNames = new Set([
      ...sourceMap.keys(),
      ...targetMap.keys(),
    ]);

    for (const featureName of allFeatureNames) {
      const sourceState = sourceMap.get(featureName);
      const targetState = targetMap.get(featureName);

      if (!sourceState && targetState) {
        drifts.push({
          feature: featureName,
          category: 'missing_in_source',
          sourceValue: null,
          targetValue: targetState,
          description: `Feature exists in ${targetName} but not in ${sourceName}`,
        });
        continue;
      }

      if (sourceState && !targetState) {
        drifts.push({
          feature: featureName,
          category: 'missing_in_target',
          sourceValue: sourceState,
          targetValue: null,
          description: `Feature exists in ${sourceName} but not in ${targetName}`,
        });
        continue;
      }

      if (!sourceState || !targetState) continue; // should never happen after the above checks

      // Compare enabled state
      if (sourceState.enabled !== targetState.enabled) {
        drifts.push({
          feature: featureName,
          category: 'enabled_state',
          sourceValue: sourceState.enabled,
          targetValue: targetState.enabled,
          description: `${sourceName}: ${sourceState.enabled ? 'enabled' : 'disabled'} → ${targetName}: ${targetState.enabled ? 'enabled' : 'disabled'}`,
        });
      }

      // Compare value (only if both are enabled, or if values differ when disabled)
      if (sourceState.value !== targetState.value) {
        drifts.push({
          feature: featureName,
          category: 'value_change',
          sourceValue: sourceState.value,
          targetValue: targetState.value,
          description: `${sourceName}: ${JSON.stringify(sourceState.value)} → ${targetName}: ${JSON.stringify(targetState.value)}`,
        });
      }

      // Compare multivariate allocations
      if (sourceState.multivariateAllocations.length > 0 || targetState.multivariateAllocations.length > 0) {
        const sourceAlloc = this.serialiseMultivariateAllocation(
          sourceState.multivariateAllocations,
        );
        const targetAlloc = this.serialiseMultivariateAllocation(
          targetState.multivariateAllocations,
        );

        if (sourceAlloc !== targetAlloc) {
          drifts.push({
            feature: featureName,
            category: 'multivariate_allocation',
            sourceValue: sourceState.multivariateAllocations,
            targetValue: targetState.multivariateAllocations,
            description: `Multivariate allocation differs`,
          });
        }
      }
    }

    const summary = this.buildSummary(drifts);

    return {
      source: { environment: sourceName, apiKey: source.api_key },
      target: { environment: targetName, apiKey: target.api_key },
      timestamp: new Date().toISOString(),
      drifts,
      summary,
    };
  }

  private static normaliseFeatureStates(
    states: EnvironmentDocumentFeatureState[],
  ): Map<string, NormalisedFeatureState> {
    const map = new Map<string, NormalisedFeatureState>();

    for (const state of states) {
      map.set(state.feature.name, {
        id: state.id,
        name: state.feature.name,
        enabled: state.enabled,
        value: state.value,
        multivariateAllocations:
          state.multivariate_feature_state_values?.map((mv) => ({
            id: mv.multivariate_feature_option,
            percentage: mv.percentage_allocation,
          })) ?? [],
      });
    }

    return map;
  }

  private static serialiseMultivariateAllocation(
    allocations: Array<{ id: number; percentage: number }>,
  ): string {
    // Sort by ID, then serialise to a deterministic string
    const sorted = allocations.slice().sort((a, b) => a.id - b.id);
    return JSON.stringify(sorted);
  }

  private static buildSummary(drifts: DriftItem[]): DriftReport['summary'] {
    const byCategory: Record<DriftCategory, number> = {
      missing_in_source: 0,
      missing_in_target: 0,
      enabled_state: 0,
      value_change: 0,
      multivariate_allocation: 0,
    };

    for (const drift of drifts) {
      byCategory[drift.category]++;
    }

    return {
      total: drifts.length,
      byCategory,
    };
  }
}
