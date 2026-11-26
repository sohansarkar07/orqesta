/**
 * React hooks for fetching real data from the API.
 * No demo data. No hardcoded fallbacks.
 * Loading, error, and empty states are explicitly handled.
 */

import { useState, useEffect } from 'react';
import { api } from './api';
import type {
  DriftReport,
  SyncPlan,
  SyncResult,
  PolicyRunResult,
  AuditEntry,
} from './types';

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

export function useConnectionStatus() {
  const [state, setState] = useState<AsyncState<{
    connected: boolean;
    maskedKey?: string;
    apiUrl?: string;
    organisations?: Array<{ id: number; name: string }>;
  }>>({ status: 'idle' });

  useEffect(() => {
    setState({ status: 'loading' });
    api.settingsStatus()
      .then((data) => setState({ status: 'success', data }))
      .catch((err: Error) => setState({ status: 'error', error: err.message }));
  }, []);

  return state;
}

export function useEnvironments() {
  const [state, setState] = useState<AsyncState<
    Array<{
      id: number;
      name: string;
      projects: Array<{
        id: number;
        name: string;
        environments: Array<{ id: number; name: string }>;
      }>;
    }>
  >>({ status: 'idle' });

  useEffect(() => {
    setState({ status: 'loading' });
    api.environments()
      .then((data) => setState({ status: 'success', data }))
      .catch((err: Error) => setState({ status: 'error', error: err.message }));
  }, []);

  return state;
}

export function useDrift(
  projectId: number | null,
  sourceEnvName: string | null,
  targetEnvName: string | null,
) {
  const [state, setState] = useState<AsyncState<DriftReport>>({ status: 'idle' });

  useEffect(() => {
    if (!projectId || !sourceEnvName || !targetEnvName) {
      setState({ status: 'idle' });
      return;
    }

    setState({ status: 'loading' });
    api.compare(projectId, sourceEnvName, targetEnvName)
      .then((data) => setState({ status: 'success', data }))
      .catch((err: Error) => setState({ status: 'error', error: err.message }));
  }, [projectId, sourceEnvName, targetEnvName]);

  return state;
}

export function useSyncPlan(
  projectId: number | null,
  sourceEnvName: string | null,
  targetEnvName: string | null,
) {
  const [state, setState] = useState<AsyncState<{ planId: string; plan: SyncPlan } | { noDrift: true; message: string }>>({ status: 'idle' });

  useEffect(() => {
    if (!projectId || !sourceEnvName || !targetEnvName) {
      setState({ status: 'idle' });
      return;
    }

    setState({ status: 'loading' });
    api.syncPlan(projectId, sourceEnvName, targetEnvName)
      .then((data) => setState({ status: 'success', data }))
      .catch((err: Error) => setState({ status: 'error', error: err.message }));
  }, [projectId, sourceEnvName, targetEnvName]);

  return state;
}

export function useAuditLog(opts: {
  projectId: number | null;
  environmentId?: number;
  featureName?: string;
  pageSize?: number;
}) {
  const [state, setState] = useState<AsyncState<{
    count: number;
    results: AuditEntry[];
  }>>({ status: 'idle' });

  useEffect(() => {
    if (!opts.projectId) {
      setState({ status: 'idle' });
      return;
    }

    setState({ status: 'loading' });
    api.auditLog({ ...opts, projectId: opts.projectId })
      .then((data) => setState({ status: 'success', data }))
      .catch((err: Error) => setState({ status: 'error', error: err.message }));
  }, [opts.projectId, opts.environmentId, opts.featureName, opts.pageSize]);

  return state;
}

export function usePolicyRun(
  projectId: number | null,
  environmentName: string | null,
  policyYaml?: string,
) {
  const [state, setState] = useState<AsyncState<PolicyRunResult>>({ status: 'idle' });

  useEffect(() => {
    if (!projectId || !environmentName) {
      setState({ status: 'idle' });
      return;
    }

    setState({ status: 'loading' });
    api.policyRun(projectId, environmentName, policyYaml)
      .then((data) => setState({ status: 'success', data }))
      .catch((err: Error) => setState({ status: 'error', error: err.message }));
  }, [projectId, environmentName, policyYaml]);

  return state;
}
