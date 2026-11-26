/**
 * Clearly-labelled demo data for the dashboard preview.
 * All values are illustrative. No real Flagsmith credentials are used.
 */

import type { DriftReport, SyncPlan, PolicyRunResult, AuditEntry } from './types';

export const DEMO_DRIFT: DriftReport = {
  source: { environment: 'Staging' },
  target: { environment: 'Production' },
  timestamp: new Date().toISOString(),
  drifts: [
    {
      feature: 'checkout_redesign',
      category: 'enabled_state',
      sourceValue: true,
      targetValue: false,
      description: 'Staging: enabled → Production: disabled',
    },
    {
      feature: 'hero_text',
      category: 'value_change',
      sourceValue: 'Save 20% Today',
      targetValue: 'Free Shipping',
      description: 'Value differs between environments',
    },
    {
      feature: 'new_onboarding',
      category: 'missing_in_target',
      sourceValue: true,
      targetValue: null,
      description: 'Feature exists in Staging but not in Production',
    },
    {
      feature: 'ab_test_button',
      category: 'multivariate_allocation',
      sourceValue: [{ id: 1, percentage: 50 }, { id: 2, percentage: 50 }],
      targetValue: [{ id: 1, percentage: 70 }, { id: 2, percentage: 30 }],
      description: 'Multivariate allocation differs',
    },
  ],
  summary: {
    total: 4,
    byCategory: {
      enabled_state: 1,
      value_change: 1,
      missing_in_target: 1,
      missing_in_source: 0,
      multivariate_allocation: 1,
    },
  },
};

export const DEMO_PLAN: SyncPlan = {
  source: { environment: 'Staging' },
  target: { environment: 'Production' },
  createdAt: new Date().toISOString(),
  checksum: 'a3f8c2e1',
  operations: [
    {
      id: 'checkout_redesign-enable',
      feature: 'checkout_redesign',
      type: 'enable',
      currentValue: false,
      proposedValue: true,
      description: "Set 'checkout_redesign' to enabled",
      featureStateId: 42,
    },
    {
      id: 'hero_text-set_value',
      feature: 'hero_text',
      type: 'set_value',
      currentValue: 'Free Shipping',
      proposedValue: 'Save 20% Today',
      description: "Update value of 'hero_text'",
      featureStateId: 43,
    },
    {
      id: 'ab_test_button-set_multivariate_allocations',
      feature: 'ab_test_button',
      type: 'set_multivariate_allocations',
      currentValue: [{ id: 1, p: 70 }, { id: 2, p: 30 }],
      proposedValue: [{ id: 1, p: 50 }, { id: 2, p: 50 }],
      description: "Update multivariate allocations for 'ab_test_button'",
      featureStateId: 44,
    },
  ],
};

export const DEMO_POLICY: PolicyRunResult = {
  environment: 'Production',
  timestamp: new Date().toISOString(),
  total: 3,
  errors: 1,
  warnings: 2,
  passed: 18,
  violations: [
    {
      ruleId: 'production-descriptions',
      severity: 'error',
      feature: 'checkout_redesign',
      message: "Feature 'checkout_redesign' has no description.",
      suggestion: 'Add a description in the Flagsmith dashboard.',
    },
    {
      ruleId: 'naming-convention',
      severity: 'warning',
      feature: 'HeroText',
      message: "Feature name 'HeroText' does not match ^[a-z][a-z0-9_]*$.",
      suggestion: 'Rename to hero_text.',
    },
    {
      ruleId: 'staging-production-parity',
      severity: 'warning',
      feature: 'new_onboarding',
      message: "'new_onboarding' is enabled in Staging but missing in Production.",
      suggestion: 'Create the feature in Production or disable it in Staging.',
    },
  ],
};

export const DEMO_AUDIT: AuditEntry[] = [
  {
    id: 1,
    created_date: new Date(Date.now() - 3600_000).toISOString(),
    log: "Flag state changed: checkout_redesign",
    author: { first_name: 'Priya', last_name: 'Mehta', email: 'priya@example.com' },
    environment: { name: 'Staging' },
    related_object_type: 'FEATURE_STATE',
    change_type: 'UPDATE',
    change_details: [{ field: 'enabled', old: false, new: true }],
  },
  {
    id: 2,
    created_date: new Date(Date.now() - 7200_000).toISOString(),
    log: "New Flag / Remote Config created: new_onboarding",
    author: { first_name: 'Arjun', last_name: 'Singh', email: 'arjun@example.com' },
    environment: { name: 'Staging' },
    related_object_type: 'FEATURE',
    change_type: 'CREATE',
    change_details: [],
  },
  {
    id: 3,
    created_date: new Date(Date.now() - 86400_000).toISOString(),
    log: "Flag state changed: hero_text",
    author: { first_name: 'Priya', last_name: 'Mehta', email: 'priya@example.com' },
    environment: { name: 'Production' },
    related_object_type: 'FEATURE_STATE',
    change_type: 'UPDATE',
    change_details: [{ field: 'feature_state_value', old: 'Free Shipping', new: 'Save 20% Today' }],
  },
  {
    id: 4,
    created_date: new Date(Date.now() - 172800_000).toISOString(),
    log: "Flag state changed: ab_test_button",
    author: { first_name: 'Dev', last_name: 'Kumar', email: 'dev@example.com' },
    environment: { name: 'Staging' },
    related_object_type: 'FEATURE_STATE',
    change_type: 'UPDATE',
    change_details: [],
  },
];
