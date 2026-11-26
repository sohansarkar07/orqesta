import { useState } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useEnvironments } from '../../lib/hooks';
import { api } from '../../lib/api';
import type { PolicyRunResult } from '../../lib/types';

function SeverityIcon({ severity }: { severity: 'error' | 'warning' | 'info' }) {
  const map = { error: '✗', warning: '⚠', info: 'ℹ' };
  const color = { error: 'var(--status-error)', warning: 'var(--status-warn)', info: 'var(--ink-400)' };
  return <span style={{ fontSize: '14px', color: color[severity] }}>{map[severity]}</span>;
}

export default function Policy() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedEnvName, setSelectedEnvName] = useState<string | null>(null);
  const [customPolicy, setCustomPolicy] = useState('');
  const [useCustomPolicy, setUseCustomPolicy] = useState(false);

  const [result, setResult] = useState<PolicyRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const environments = useEnvironments();

  const projects = environments.status === 'success'
    ? environments.data.flatMap((org) => org.projects.map((p) => ({ orgId: org.id, orgName: org.name, ...p })))
    : [];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const availableEnvs = selectedProject?.environments ?? [];

  async function handleRunPolicy() {
    if (!selectedProjectId || !selectedEnvName) return;

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await api.policyRun(
        selectedProjectId,
        selectedEnvName,
        useCustomPolicy && customPolicy ? customPolicy : undefined,
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Policy run failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadDefault() {
    try {
      const res = await api.policyDefault();
      setCustomPolicy(res.yaml);
      setUseCustomPolicy(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load default policy');
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

  const groups = result ? {
    error:   result.violations.filter((v) => v.severity === 'error'),
    warning: result.violations.filter((v) => v.severity === 'warning'),
    info:    result.violations.filter((v) => v.severity === 'info'),
  } : null;

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Policy Center</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
          Validate feature flag configurations against governance policies
        </p>
      </div>

      {/* Selection form */}
      <Panel style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>Run Policy Check</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Project
            </label>
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedProjectId(id || null);
                setSelectedEnvName(null);
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Environment
            </label>
            <select
              value={selectedEnvName ?? ''}
              onChange={(e) => setSelectedEnvName(e.target.value || null)}
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
              <option value="">Choose an environment</option>
              {availableEnvs.map((e) => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-700)', cursor: 'pointer', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={useCustomPolicy}
              onChange={(e) => setUseCustomPolicy(e.target.checked)}
              style={{ accentColor: 'var(--ink-900)' }}
            />
            Use custom policy (default will be used if unchecked)
          </label>

          {useCustomPolicy && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)' }}>
                  Policy YAML
                </label>
                <Button variant="secondary" size="sm" onClick={handleLoadDefault}>
                  Load default policy
                </Button>
              </div>
              <textarea
                value={customPolicy}
                onChange={(e) => setCustomPolicy(e.target.value)}
                placeholder="version: 1&#10;policies:&#10;  - id: example&#10;    description: Example rule&#10;    severity: warning&#10;    rule: naming_convention&#10;    pattern: '^[a-z_]+$'"
                rows={12}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '12px',
                  fontFamily: '"SF Mono", monospace',
                  border: 'var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--ivory)',
                  color: 'var(--ink-900)',
                  resize: 'vertical',
                }}
              />
            </div>
          )}
        </div>

        <Button
          variant="primary"
          onClick={handleRunPolicy}
          disabled={!selectedProjectId || !selectedEnvName}
          style={{ opacity: selectedProjectId && selectedEnvName ? 1 : 0.5 }}
        >
          Run Policy Check
        </Button>
      </Panel>

      {error && (
        <Panel style={{ padding: '16px 20px', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
          <p style={{ fontSize: '13px', color: 'var(--status-error)' }}>✗ {error}</p>
        </Panel>
      )}

      {/* Loading */}
      {loading && (
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)' }}>Running policy checks...</p>
        </Panel>
      )}

      {/* Results */}
      {result && groups && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--ink-400)' }}>
                Environment: <strong>{selectedEnvName}</strong> · {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
            <Badge variant={result.errors > 0 ? 'error' : result.warnings > 0 ? 'warn' : 'ok'}>
              {result.errors > 0 ? `${result.errors} error${result.errors !== 1 ? 's' : ''}` : result.warnings > 0 ? `${result.warnings} warnings` : 'All passed'}
            </Badge>
          </div>

          {/* Score row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {[
              { label: 'Errors', value: result.errors, variant: 'error' as const, bg: 'var(--status-err-bg)' },
              { label: 'Warnings', value: result.warnings, variant: 'warn' as const, bg: 'var(--status-warn-bg)' },
              { label: 'Passed', value: result.passed, variant: 'ok' as const, bg: 'var(--status-ok-bg)' },
            ].map((s) => (
              <Panel key={s.label} style={{ padding: '20px 24px', background: s.bg, borderColor: 'transparent' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: '8px' }}>{s.label}</p>
                <p style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', fontWeight: 500 }}>{s.value}</p>
              </Panel>
            ))}
          </div>

          {/* Progress bar */}
          <Panel style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-400)', marginBottom: '8px' }}>
              <span>Policy compliance</span>
              <span>{Math.round((result.passed / (result.passed + result.violations.length)) * 100)}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--ivory-mid)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(result.passed / (result.passed + result.violations.length)) * 100}%`,
                background: result.errors > 0 ? 'var(--status-error)' : result.warnings > 0 ? 'var(--status-warn)' : 'var(--status-ok)',
                borderRadius: '3px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </Panel>

          {/* Violations by severity */}
          {(['error', 'warning', 'info'] as const).map((sev) => {
            const items = groups[sev];
            if (items.length === 0) return null;
            return (
              <div key={sev}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <SeverityIcon severity={sev} />
                  <h3 style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>{sev}s</h3>
                  <Badge variant={sev === 'error' ? 'error' : sev === 'warning' ? 'warn' : 'info'}>{items.length}</Badge>
                </div>
                <Panel>
                  {items.map((v, i) => (
                    <div key={v.ruleId + v.feature} style={{
                      padding: '14px 20px',
                      borderBottom: i < items.length - 1 ? 'var(--border-light)' : 'none',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '16px',
                      alignItems: 'start',
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <code style={{ fontSize: '12px', background: 'var(--ivory-mid)', padding: '2px 6px', borderRadius: '3px', color: 'var(--ink-700)', fontFamily: '"SF Mono", monospace' }}>
                            {v.feature}
                          </code>
                          <span style={{ fontSize: '11px', color: 'var(--ink-300)' }}>rule: {v.ruleId}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--ink-700)' }}>{v.message}</p>
                        {v.suggestion && (
                          <p style={{ fontSize: '12px', color: 'var(--ink-400)', marginTop: '3px' }}>
                            <span style={{ fontWeight: 500 }}>Suggestion:</span> {v.suggestion}
                          </p>
                        )}
                      </div>
                      <Badge variant={sev === 'error' ? 'error' : sev === 'warning' ? 'warn' : 'info'}>{sev}</Badge>
                    </div>
                  ))}
                </Panel>
              </div>
            );
          })}
        </>
      )}

      {/* CLI hint */}
      <Panel style={{ padding: '14px 20px', background: 'var(--ivory)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-300)' }}>CLI:</span>
        <code style={{ fontSize: '13px', fontFamily: '"SF Mono", monospace', color: 'var(--ink-700)' }}>
          orqesta lint {selectedEnvName || '<environment>'} --policy ./orqesta-policy.yml
        </code>
      </Panel>
    </div>
  );
}
