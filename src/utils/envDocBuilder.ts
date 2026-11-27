/**
 * Builds a minimal FlagsmithEnvironmentDocument from management API feature states.
 * The management API returns feature as a numeric ID, so we join against the
 * features list to resolve names and types.
 */

import type {
  FlagsmithFeature,
  FlagsmithFeatureState,
  FlagsmithEnvironmentDocument,
  EnvironmentDocumentFeatureState,
} from '../types/flagsmith.js';

export function buildEnvDoc(
  envId: number,
  apiKey: string,
  projectId: number,
  states: FlagsmithFeatureState[],
  features: FlagsmithFeature[],
): FlagsmithEnvironmentDocument {
  const featureById = new Map(features.map((f) => [f.id, f]));

  const feature_states: EnvironmentDocumentFeatureState[] = states.flatMap((s) => {
    const featureId = typeof s.feature === 'number' ? s.feature : s.feature.id;
    const meta = featureById.get(featureId);
    if (!meta) return []; // skip if feature not found (shouldn't happen)
    return [{
      id: s.id,
      feature: { id: meta.id, name: meta.name, type: meta.type },
      enabled: s.enabled,
      value: s.feature_state_value,
      multivariate_feature_state_values: s.multivariate_feature_state_values,
    }];
  });

  return {
    id: envId,
    api_key: apiKey,
    project: {
      id: projectId,
      name: '',
      organisation: 0,
      hide_disabled_flags: false,
      segments: [],
    },
    feature_states,
  };
}
