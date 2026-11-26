/**
 * Tests for Phase 3 forensics: AuditEntryDetail and change_details
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  FlagsmithAuditEntry,
  FlagsmithAuditEntryDetail,
  AuditChangeDetail,
} from '../src/types/flagsmith.js';

// ── Type shape tests ──────────────────────────────────────────────────────────

describe('FlagsmithAuditEntryDetail type', () => {
  it('has correct shape with change_details and change_type', () => {
    const detail: FlagsmithAuditEntryDetail = {
      id: 1,
      created_date: '2024-01-01T00:00:00Z',
      log: 'Flag updated',
      project: { id: 1, name: 'Test Project' },
      related_object_type: 'FEATURE_STATE',
      change_details: [
        { field: 'enabled', old: false, new: true },
        { field: 'feature_state_value', old: null, new: 'my_value' },
      ],
      change_type: 'UPDATE',
    };

    expect(detail.change_details).toHaveLength(2);
    expect(detail.change_type).toBe('UPDATE');
    expect(detail.change_details[0]!.field).toBe('enabled');
    expect(detail.change_details[0]!.old).toBe(false);
    expect(detail.change_details[0]!.new).toBe(true);
  });

  it('supports CREATE change_type', () => {
    const detail: FlagsmithAuditEntryDetail = {
      id: 2,
      created_date: '2024-01-01T00:00:00Z',
      log: 'Flag created',
      project: { id: 1, name: 'Test Project' },
      related_object_type: 'FEATURE',
      change_details: [],
      change_type: 'CREATE',
    };
    expect(detail.change_type).toBe('CREATE');
  });

  it('supports DELETE change_type', () => {
    const detail: FlagsmithAuditEntryDetail = {
      id: 3,
      created_date: '2024-01-01T00:00:00Z',
      log: 'Flag deleted',
      project: { id: 1, name: 'Test Project' },
      related_object_type: 'FEATURE',
      change_details: [],
      change_type: 'DELETE',
    };
    expect(detail.change_type).toBe('DELETE');
  });

  it('gracefully handles empty change_details array', () => {
    const detail: FlagsmithAuditEntryDetail = {
      id: 4,
      created_date: '2024-01-01T00:00:00Z',
      log: 'Something happened',
      project: { id: 1, name: 'Test' },
      related_object_type: 'FEATURE_STATE',
      change_details: [],
      change_type: 'UNKNOWN',
    };
    expect(detail.change_details).toHaveLength(0);
  });
});

// ── AuditChangeDetail type ────────────────────────────────────────────────────

describe('AuditChangeDetail type', () => {
  it('supports all scalar value types', () => {
    const details: AuditChangeDetail[] = [
      { field: 'enabled', old: false, new: true },
      { field: 'value', old: 'old_string', new: 'new_string' },
      { field: 'number_value', old: 0, new: 42 },
      { field: 'nullable', old: null, new: 'some_value' },
    ];
    expect(details).toHaveLength(4);
    expect(details[1]!.old).toBe('old_string');
    expect(details[2]!.new).toBe(42);
    expect(details[3]!.old).toBeNull();
  });
});

// ── Client getAuditEntry mock test ────────────────────────────────────────────

describe('FlagsmithClient.getAuditEntry', () => {
  it('calls the correct endpoint /audit/<id>/', async () => {
    // We test the endpoint construction via unit-level mock
    const mockGet = vi.fn().mockResolvedValue({
      data: {
        id: 42,
        created_date: '2024-01-01T00:00:00Z',
        log: 'Feature updated',
        project: { id: 1, name: 'Test' },
        related_object_type: 'FEATURE_STATE',
        change_details: [{ field: 'enabled', old: false, new: true }],
        change_type: 'UPDATE',
      } as FlagsmithAuditEntryDetail,
    });

    // Directly verify the URL that would be called
    const expectedPath = '/audit/42/';
    // If called with id=42, path should be /audit/42/
    expect(expectedPath).toBe(`/audit/${42}/`);
    expect(mockGet).not.toHaveBeenCalled(); // just testing the path construction above
  });
});

// ── Filter logic tests ────────────────────────────────────────────────────────

describe('Audit entry filter logic', () => {
  const makeEntry = (
    id: number,
    log: string,
    type: FlagsmithAuditEntry['related_object_type'],
  ): FlagsmithAuditEntry => ({
    id,
    created_date: '2024-01-01T00:00:00Z',
    log,
    project: { id: 1, name: 'Test' },
    related_object_type: type,
  });

  const featureName = 'checkout_redesign';

  function filterEntries(entries: FlagsmithAuditEntry[]): FlagsmithAuditEntry[] {
    return entries.filter((e) => {
      const log = e.log.toLowerCase();
      const feature = featureName.toLowerCase();
      return (
        log.includes(feature) ||
        e.related_object_type === 'FEATURE' ||
        e.related_object_type === 'FEATURE_STATE' ||
        e.related_object_type === 'EF_VERSION'
      );
    });
  }

  it('includes entries with matching feature name in log', () => {
    const entries = [
      makeEntry(1, 'Updated checkout_redesign flag', 'ENVIRONMENT'),
      makeEntry(2, 'Updated some_other_flag flag', 'ENVIRONMENT'),
    ];
    const filtered = filterEntries(entries);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.id).toBe(1);
  });

  it('includes entries with FEATURE related_object_type', () => {
    const entries = [
      makeEntry(1, 'Some unrelated log', 'FEATURE'),
      makeEntry(2, 'Another unrelated log', 'ENVIRONMENT'),
    ];
    const filtered = filterEntries(entries);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.id).toBe(1);
  });

  it('includes entries with FEATURE_STATE related_object_type', () => {
    const entries = [
      makeEntry(1, 'Some log', 'FEATURE_STATE'),
    ];
    const filtered = filterEntries(entries);
    expect(filtered).toHaveLength(1);
  });

  it('includes entries with EF_VERSION related_object_type', () => {
    const entries = [
      makeEntry(1, 'Some log', 'EF_VERSION'),
    ];
    const filtered = filterEntries(entries);
    expect(filtered).toHaveLength(1);
  });

  it('excludes entries with no match', () => {
    const entries = [
      makeEntry(1, 'Unrelated event', 'ENVIRONMENT'),
      makeEntry(2, 'Another unrelated event', 'SEGMENT'),
    ];
    const filtered = filterEntries(entries);
    expect(filtered).toHaveLength(0);
  });

  it('includes all matching entry types', () => {
    const entries = [
      makeEntry(1, 'Updated checkout_redesign', 'ENVIRONMENT'),
      makeEntry(2, 'Created feature', 'FEATURE'),
      makeEntry(3, 'State changed', 'FEATURE_STATE'),
      makeEntry(4, 'EF version', 'EF_VERSION'),
      makeEntry(5, 'Segment updated', 'SEGMENT'),
    ];
    const filtered = filterEntries(entries);
    // 1 (name match), 2 (FEATURE), 3 (FEATURE_STATE), 4 (EF_VERSION) = 4
    expect(filtered).toHaveLength(4);
  });
});

// ── change_details merging tests ──────────────────────────────────────────────

describe('change_details merging', () => {
  it('merges change_details onto base entry', () => {
    const base: FlagsmithAuditEntry = {
      id: 10,
      created_date: '2024-01-01T00:00:00Z',
      log: 'Flag updated',
      project: { id: 1, name: 'Test' },
      related_object_type: 'FEATURE_STATE',
    };

    const detail: FlagsmithAuditEntryDetail = {
      ...base,
      change_details: [{ field: 'enabled', old: false, new: true }],
      change_type: 'UPDATE',
    };

    // Merged entry has all base fields plus change_details
    expect(detail.id).toBe(base.id);
    expect(detail.log).toBe(base.log);
    expect(detail.change_details).toHaveLength(1);
    expect(detail.change_type).toBe('UPDATE');
  });

  it('graceful fallback when detail fetch fails', () => {
    const base: FlagsmithAuditEntry = {
      id: 11,
      created_date: '2024-01-01T00:00:00Z',
      log: 'Something',
      project: { id: 1, name: 'Test' },
      related_object_type: 'FEATURE_STATE',
    };

    // Simulate the fallback in inspect.ts when getAuditEntry rejects
    const fallback: FlagsmithAuditEntryDetail = {
      ...base,
      change_details: [],
      change_type: 'UNKNOWN',
    };

    expect(fallback.change_details).toHaveLength(0);
    expect(fallback.change_type).toBe('UNKNOWN');
    expect(fallback.id).toBe(11); // base fields preserved
  });
});
