/**
 * Flagsmith API types — derived from official API documentation and webhook payload schema.
 * No invented fields. Fields not confirmed as returned are marked optional.
 */

export interface FlagsmithOrganisation {
  id: number;
  name: string;
  plan: string;
}

export interface FlagsmithProject {
  id: number;
  uuid: string;
  name: string;
  organisation: number;
  created_date: string;
}

export interface FlagsmithEnvironment {
  id: number;
  uuid: string;
  name: string;
  api_key: string; // client-side SDK key (used for environment document)
  project: number;
  description?: string;
  created_date?: string;
}

export interface FlagsmithFeature {
  id: number;
  name: string;
  type: 'STANDARD' | 'MULTIVARIATE';
  description?: string;
  created_date: string;
  default_enabled: boolean;
  initial_value?: string | number | boolean | null;
  is_archived: boolean;
  project: number;
}

export interface MultivariateFeatureStateValue {
  id: number;
  multivariate_feature_option: number;
  percentage_allocation: number;
}

export interface FlagsmithFeatureState {
  id: number;
  feature: number | {
    id: number;
    name: string;
    type: 'STANDARD' | 'MULTIVARIATE';
  };
  environment: number;
  enabled: boolean;
  feature_state_value: string | number | boolean | null;
  multivariate_feature_state_values: MultivariateFeatureStateValue[];
  identity?: number | null;
  feature_segment?: number | null;
}

/** Returned by GET /environment-document/ using the server-side SDK key */
export interface FlagsmithEnvironmentDocument {
  id: number;
  name?: string;
  api_key: string;
  project: {
    id: number;
    name: string;
    organisation: number | { id: number; name: string; plan: string };
    hide_disabled_flags: boolean;
    segments: EnvironmentDocumentSegment[];
    enable_realtime_updates?: boolean;
    server_key_only_feature_ids?: number[];
  };
  feature_states: EnvironmentDocumentFeatureState[];
  identity_overrides?: unknown[];
  allow_client_traits?: boolean;
  updated_at?: string;
  hide_sensitive_data?: boolean;
  hide_disabled_flags?: boolean | null;
  use_identity_composite_key_for_hashing?: boolean;
  use_identity_overrides_in_local_eval?: boolean;
  amplitude_config?: unknown;
  mixpanel_config?: unknown;
}

export interface EnvironmentDocumentSegment {
  id: number;
  name: string;
  rules: SegmentRule[];
  feature_states: EnvironmentDocumentFeatureState[];
}

export interface SegmentRule {
  type: 'ALL' | 'ANY' | 'NONE';
  rules: SegmentRule[];
  conditions: SegmentCondition[];
}

export interface SegmentCondition {
  operator: string;
  property_: string;
  value: string;
}

export interface EnvironmentDocumentFeatureState {
  id: number;
  feature: {
    id: number;
    name: string;
    type: 'STANDARD' | 'MULTIVARIATE';
  };
  enabled: boolean;
  value: string | number | boolean | null;
  multivariate_feature_state_values?: MultivariateFeatureStateValue[];
}

export interface AuditChangeDetail {
  field: string;
  old: string | number | boolean | null;
  new: string | number | boolean | null;
}

export interface FlagsmithAuditEntryDetail extends FlagsmithAuditEntry {
  change_details: AuditChangeDetail[];
  change_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'UNKNOWN';
}

export interface FlagsmithAuditEntry {
  id: number;
  created_date: string;
  log: string;
  author?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  environment?: {
    id: number;
    name: string;
  };
  project: {
    id: number;
    name: string;
  };
  related_object_id?: number;
  related_object_uuid?: string;
  related_object_type:
    | 'FEATURE'
    | 'FEATURE_STATE'
    | 'SEGMENT'
    | 'ENVIRONMENT'
    | 'CHANGE_REQUEST'
    | 'EDGE_IDENTITY'
    | 'IMPORT_REQUEST'
    | 'EF_VERSION'
    | 'FEATURE_HEALTH'
    | 'RELEASE_PIPELINE';
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FlagsmithSegment {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  project: number;
  rules: SegmentRule[];
  feature_states?: EnvironmentDocumentFeatureState[];
}
