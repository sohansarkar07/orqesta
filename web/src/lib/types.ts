/* Types mirroring the CLI's core models */

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
  source: { environment: string };
  target: { environment: string };
  timestamp: string;
  drifts: DriftItem[];
  summary: { total: number; byCategory: Record<DriftCategory, number> };
}

export interface SyncOperation {
  id: string;
  feature: string;
  type: 'enable' | 'disable' | 'set_value' | 'set_multivariate_allocations';
  currentValue: unknown;
  proposedValue: unknown;
  description: string;
  featureStateId?: number;
}

export interface SyncPlan {
  source: { environment: string };
  target: { environment: string };
  createdAt: string;
  operations: SyncOperation[];
  checksum: string;
}

export interface SyncResult {
  success: boolean;
  applied: number;
  failed: number;
  errors?: Array<{ operation: string; message: string }>;
  plan: SyncPlan;
}

export interface PolicyViolation {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  feature: string;
  message: string;
  suggestion?: string;
}

export interface PolicyRunResult {
  environment: string;
  timestamp: string;
  total: number;
  errors: number;
  warnings: number;
  passed: number;
  violations: PolicyViolation[];
}

export interface AuditEntry {
  id: number;
  created_date: string;
  log: string;
  author?: { first_name: string; last_name: string; email: string };
  environment?: { name: string };
  related_object_type: string;
  change_details?: Array<{ field: string; old: unknown; new: unknown }>;
  change_type?: 'CREATE' | 'UPDATE' | 'DELETE' | 'UNKNOWN';
}

export interface Environment {
  id: number;
  name: string;
  api_key: string;
}
