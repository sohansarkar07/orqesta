import { useState } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useEnvironments, useDrift } from '../../lib/hooks';
import type { DriftCategory } from '../../lib/types';

const CATEGORY_LABEL: Record<DriftCategory, string> = {
  enabled_state:         'Enabled state',
  value_change:          'Value',
  multivariate_allocation: 'Multivariate',
  missing_in_target:     'Missing in target',
  missing_in_source:     'Extra in target',
};

const CATEGORY_VARIANT: Record<DriftCategory, 'ok' | 'warn' | 'error' | 'info' | 'neutral'> = {
  enabled_state:         'warn',
  value_change:          'info',
  multivariate_allocation: 'info',
  missing_in_target:     'error',
  missing_in_source:     'neutral',
};

export default function Compare() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sourceEnvName, setSourceEnvName] = useState<string | null>(null);
  const [targetEnvName, setTargetEnvName] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const environments = useEnvironments();
  const drift = useDrift(hasRun ? selectedProjectId : null, hasRun ? sourceEnvName : null, hasRun ? targetEnvName : null);

  // Flatten projects for picker
  const projects = environments.status === 'success'
    ? environments.data.flatMap((org) => org.projects.map((p) => ({ orgId: org.id, orgName: org.name, ...p })))
    : [];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const availableEnvs = selectedProject?.environments ?? [];

  function handleRunComparison() {
    if (selectedProjectId && sourceEnvName && targetEnvName) {
      setHasRun(true);
    }
  }

  if (environments.status === 'loading') {
    return (
      <div style={{ padding: '32px' }}>
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)' }}>Loading projects...</p>
        </Panel>
      </div>
    );
  }

  if (environments.status === 'error') {
    return (
      <div style={{ padding: '32px' }}>
        <Panel style={{ padding: '48px', textAlign: 'center', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--status-error)' }}>✗</div>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--status-error)', marginBottom: '8px' }}>Failed to load projects</p>
          <p style={{ fontSize: '13px', color: 'var(--ink-500)' }}>{environments.error}</p>
        </Panel>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Environment Comparison</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
          Detect drift between feature flag configurations
        </p>
      </div>

      {/* Selection form */}
      <Panel style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>Select Environments</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }}>
          {/* Project */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Project
            </label>
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedProjectId(id || null);
                setSourceEnvName(null);
                setTargetEnvName(null);
                setHasRun(false);
              }}
              style={{
                width: '100%',
                padding: '9px 14px',
                fontSize: '13px',
                border: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--ivory)',
                color: 'var(--ink-900)',
              }}
            >
              <option value="">Choose a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Source (reference)
            </label>
            <select
              value={sourceEnvName ?? ''}
              onChange={(e) => {
                setSourceEnvName(e.target.value || null);
                setHasRun(false);
              }}
              disabled={!selectedProjectId}
              style={{
                width: '100%',
                padding: '9px 14px',
                fontSize: '13px',
                border: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--ivory)',
                color: 'var(--ink-900)',
                opacity: selectedProjectId ? 1 : 0.5,
              }}
            >
              <option value="">Choose source</option>
              {availableEnvs.map((e) => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>

          {/* Target */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Target (compare to)
            </label>
            <select
              value={targetEnvName ?? ''}
              onChange={(e) => {
                setTargetEnvName(e.target.value || null);
                setHasRun(false);
              }}
              disabled={!selectedProjectId}
              style={{
                width: '100%',
                padding: '9px 14px',
                fontSize: '13px',
                border: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--ivory)',
                color: 'var(--ink-900)',
                opacity: selectedProjectId ? 1 : 0.5,
              }}
            >
              <option value="">Choose target</option>
              {availableEnvs.filter((e) => e.name !== sourceEnvName).map((e) => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleRunComparison}
          disabled={!selectedProjectId || !sourceEnvName || !targetEnvName}
          style={{ opacity: selectedProjectId && sourceEnvName && targetEnvName ? 1 : 0.5 }}
        >
          Compare Environments
        </Button>
      </Panel>

      {/* Results */}
      {drift.status === 'loading' && (
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</div>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)' }}>Comparing feature flags...</p>
        </Panel>
      )}

      {drift.status === 'error' && (
        <Panel style={{ padding: '48px', textAlign: 'center', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--status-error)' }}>✗</div>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--status-error)', marginBottom: '8px' }}>Comparison failed</p>
          <p style={{ fontSize: '13px', color: 'var(--ink-500)' }}>{drift.error}</p>
        </Panel>
      )}

      {drift.status === 'success' && (() => {
        const { drifts, source, target, summary } = drift.data;

        return (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-700)' }}>{source.environment}</span>
                  <span style={{ fontSize: '14px', color: 'var(--ink-300)' }}>→</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-700)' }}>{target.environment}</span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-300)', marginLeft: '4px' }}>· {new Date(drift.data.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <Badge variant={summary.total > 0 ? 'warn' : 'ok'}>
                {summary.total > 0 ? `${summary.total} differences` : 'In sync'}
              </Badge>
            </div>

            {/* Summary pills */}
            {summary.total > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(Object.entries(summary.byCategory) as [DriftCategory, number][])
                  .filter(([, count]) => count > 0)
                  .map(([cat, count]) => (
                    <div key={cat} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      background: 'var(--white)',
                      border: 'var(--border)',
                      borderRadius: '100px',
                      fontSize: '12px',
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{count}</span>
                      <span style={{ color: 'var(--ink-500)' }}>{CATEGORY_LABEL[cat]}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Diff table */}
            {summary.total > 0 ? (
              <Panel>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 160px 160px 140px',
                  padding: '10px 20px',
                  borderBottom: 'var(--border)',
                  background: 'var(--ivory)',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                }}>
                  {['Feature', source.environment, target.environment, 'Category'].map((h) => (
                    <span key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-300)' }}>
                      {h}
                    </span>
                  ))}
                </div>

                {drifts.map((d, i) => (
                  <div key={d.feature} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 160px 140px',
                    padding: '14px 20px',
                    alignItems: 'center',
                    borderBottom: i < drifts.length - 1 ? 'var(--border-light)' : 'none',
                    background: 'var(--white)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ivory)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--white)')}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-900)', fontFamily: '"SF Mono", monospace' }}>
                      {d.feature}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--status-ok)', background: 'var(--status-ok-bg)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', display: 'inline-block', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {JSON.stringify(d.sourceValue)}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--status-error)', background: 'var(--status-err-bg)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', display: 'inline-block', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.targetValue === null ? 'missing' : JSON.stringify(d.targetValue)}
                    </span>
                    <Badge variant={CATEGORY_VARIANT[d.category]}>
                      {CATEGORY_LABEL[d.category]}
                    </Badge>
                  </div>
                ))}
              </Panel>
            ) : (
              <Panel style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--status-ok)' }}>✓</div>
                <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--status-ok)', marginBottom: '8px' }}>Environments in sync</p>
                <p style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
                  No differences detected between {source.environment} and {target.environment}.
                </p>
              </Panel>
            )}

            {/* CLI hint */}
            <Panel style={{ padding: '14px 20px', background: 'var(--ivory)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-300)' }}>CLI equivalent:</span>
              <code style={{ fontSize: '13px', fontFamily: '"SF Mono", monospace', color: 'var(--ink-700)' }}>
                orqesta compare {source.environment} {target.environment} --project {selectedProjectId}
              </code>
            </Panel>
          </>
        );
      })()}
    </div>
  );
}
