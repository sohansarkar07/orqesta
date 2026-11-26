/**
 * Synchronisation plan types
 */

export type SyncOperationType =
  | 'enable'
  | 'disable'
  | 'set_value'
  | 'set_multivariate_allocations';

export interface SyncOperation {
  id: string; // deterministic: `${feature}-${type}`
  feature: string;
  type: SyncOperationType;
  currentValue: unknown;
  proposedValue: unknown;
  description: string;
  featureStateId?: number; // target feature state ID, needed for PUT/PATCH
}

export interface SyncPlan {
  source: { environment: string; apiKey: string };
  target: { environment: string; apiKey: string };
  createdAt: string;
  operations: SyncOperation[];
  checksum: string; // SHA-256 of sorted operation IDs — staleness guard
  targetStateSnapshot: Array<{
    featureStateId: number;
    feature: string;
    enabled: boolean;
    value: string | number | boolean | null;
  }>;
}

export interface StaleOperationInfo {
  operationId: string;
  feature: string;
  reason: string;
}

export interface SyncResult {
  plan: SyncPlan;
  appliedAt: string;
  results: Array<{
    operation: SyncOperation;
    status: 'applied' | 'skipped' | 'failed' | 'stale';
    error?: string;
    staleReason?: string;
  }>;
  verificationPassed: boolean;
  verificationDrifts?: import('./drift.js').DriftItem[];
  hasStaleness: boolean;
  staleOperations?: StaleOperationInfo[];
}
