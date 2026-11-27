/**
 * Audience Regression Guard — dashboard page.
 * Compares multivariate flag allocations between two environments and
 * reports allocation shifts that could affect user segment exposure.
 */

import { useState } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useEnvironments } from '../../lib/hooks';
import { api } from '../../lib/api';
import type { AudienceGuardReport, AudienceRegressionResult, VariantShift } from '../../lib/types';

type Severity = AudienceRegressionResult['severity'];

const SEV_COLOR: Record<Severity, string> = {
  critical: 'var(--status-error)',
  warning:  'var(--status-warn)',
  info:     'var(--ink-400)',
};

const SEV_BG: Record<Severity, string> = {
  critical: 'var(--status-err-bg)',
  warning:  'var(--status-warn-bg)',
  info:     'var(--ivory)',
};

const SEV_ICON: Record<Severity, string> = {
  critical: '✗',
  warning:  '⚠',
  info:     'ℹ',
};

function ShiftBar({ shift }: { shift: VariantShift }) {
  const isPositive = shift.delta > 0;
  const isNeutral  = shift.delta === 0;
  const color      = isNeutral ? 'var(--ink-300)' : isPositive ? 'var(--status-warn)' : 'var(--sage)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '100px 60px 1fr 60px',
      gap: '10px',
      alignItems: 'center',
      padding: '6px 0',
      fontSize: '12px',
    }}>
      <span style={{ color: 'var(--ink-500)', fontFamily: '"SF Mono", monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {shift.label}
      </span>
      <span style={{ color: 'var(--ink-400)', textAlign: 'right' }}>{shift.before}%</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, height: '6px', background: 'var(--ivory-mid)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${shift.before}%`, background: 'var(--ink-200)', borderRadius: '3px' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${shift.after}%`, background: color, borderRadius: '3px', opacity: 0.7 }} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color, minWidth: '48px', textAlign: 'center' }}>
          {isNeutral ? '—' : (isPositive ? '+' : '') + shift.delta + 'pp'}
        </span>
      </div>
      <span style={{ color: 'var(--ink-700)', textAlign: 'right', fontWeight: 500 }}>{shift.after}%</span>
    </div>
  );
}

function RegressionCard({ reg }: { reg: AudienceRegressionResult }) {
  const [expanded, setExpanded] = useState(reg.severity === 'critical');

  return (
    <div style={{
      borderBottom: 'var(--border-light)',
      background: 'var(--white)',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 20px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '14px', color: SEV_COLOR[reg.severity], flexShrink: 0 }}>
          {SEV_ICON[reg.severity]}
        </span>
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--ink-900)', fontFamily: '"SF Mono", monospace' }}>
          {reg.feature}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--ink-500)', flex: 2 }}>{reg.summary}</span>
        {!reg.allocationsSumValid && (
          <Badge variant="error">Invalid sum</Badge>
        )}
        <Badge variant={reg.severity === 'critical' ? 'error' : reg.severity === 'warning' ? 'warn' : 'neutral'}>
          {reg.severity}
        </Badge>
        <span style={{ fontSize: '11px', color: 'var(--ink-300)', marginLeft: '4px' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded shift bars */}
      {expanded && (
        <div style={{ padding: '0 20px 16px', background: SEV_BG[reg.severity] }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '100px 60px 1fr 60px',
            gap: '10px',
            padding: '6px 0 4px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--ink-300)',
          }}>
            <span>Variant</span>
            <span style={{ textAlign: 'right' }}>Before</span>
            <span style={{ paddingLeft: '8px' }}>Shift</span>
            <span style={{ textAlign: 'right' }}>After</span>
          </div>
          <ShiftBar shift={reg.controlShift} />
          {reg.shifts.map((s) => <ShiftBar key={s.optionId} shift={s} />)}
          {!reg.allocationsSumValid && (
            <p style={{ fontSize: '12px', color: 'var(--status-error)', marginTop: '8px', fontWeight: 500 }}>
              ⚠ Variant allocations sum to more than 100% — this is an invalid configuration.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Audience() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sourceEnvName, setSourceEnvName] = useState<string | null>(null);
  const [targetEnvName, setTargetEnvName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AudienceGuardReport | null>(null);

  const environments = useEnvironments();

  const projects = environments.status === 'success'
    ? environments.data.flatMap((org) => org.projects.map((p) => ({ ...p })))
    : [];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const availableEnvs = selectedProject?.environments ?? [];

  async function handleRun() {
    if (!selectedProjectId || !sourceEnvName || !targetEnvName) return;
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const res = await api.audienceCheck(selectedProjectId, sourceEnvName, targetEnvName);
      setReport(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guard check failed');
    } finally {
      setLoading(false);
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
          <p style={{ fontSize: '14px', color: 'var(--status-error)' }}>✗ {environments.error}</p>
        </Panel>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="app-page">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Audience Regression Guard</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
          Detect multivariate flag allocation shifts that could change user segment exposure
        </p>
      </div>

      {/* Explainer */}
      <Panel style={{ padding: '16px 20px', background: 'var(--ivory)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>⚑</span>
        <div>
          <p style={{ fontSize: '13px', color: 'var(--ink-700)', fontWeight: 500, marginBottom: '4px' }}>
            What this checks
          </p>
          <p style={{ fontSize: '12px', color: 'var(--ink-500)', lineHeight: 1.6 }}>
            When you sync multivariate flags between environments, variant percentage allocations can silently shift —
            meaning a different proportion of users sees each variant. This guard compares the source
            allocations against the target and flags any shifts, graded by impact.
          </p>
        </div>
      </Panel>

      {/* Selection form */}
      <Panel style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>Configure Check</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }} className="compare-form-grid">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Project
            </label>
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => { setSelectedProjectId(Number(e.target.value) || null); setSourceEnvName(null); setTargetEnvName(null); setReport(null); }}
              style={{ width: '100%', padding: '9px 14px', fontSize: '13px', border: 'var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--ivory)', color: 'var(--ink-900)' }}
            >
              <option value="">Choose a project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Source (reference)
            </label>
            <select
              value={sourceEnvName ?? ''}
              onChange={(e) => { setSourceEnvName(e.target.value || null); setReport(null); }}
              disabled={!selectedProjectId}
              style={{ width: '100%', padding: '9px 14px', fontSize: '13px', border: 'var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--ivory)', color: 'var(--ink-900)', opacity: selectedProjectId ? 1 : 0.5 }}
            >
              <option value="">Choose source</option>
              {availableEnvs.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Target (check against)
            </label>
            <select
              value={targetEnvName ?? ''}
              onChange={(e) => { setTargetEnvName(e.target.value || null); setReport(null); }}
              disabled={!selectedProjectId}
              style={{ width: '100%', padding: '9px 14px', fontSize: '13px', border: 'var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--ivory)', color: 'var(--ink-900)', opacity: selectedProjectId ? 1 : 0.5 }}
            >
              <option value="">Choose target</option>
              {availableEnvs.filter((e) => e.name !== sourceEnvName).map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleRun}
          disabled={!selectedProjectId || !sourceEnvName || !targetEnvName || loading}
          style={{ opacity: selectedProjectId && sourceEnvName && targetEnvName ? 1 : 0.5 }}
        >
          {loading ? 'Checking...' : 'Run Audience Guard'}
        </Button>
      </Panel>

      {error && (
        <Panel style={{ padding: '16px 20px', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
          <p style={{ fontSize: '13px', color: 'var(--status-error)' }}>✗ {error}</p>
        </Panel>
      )}

      {loading && (
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</div>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)' }}>Analysing multivariate allocations...</p>
        </Panel>
      )}

      {report && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }} className="stat-grid">
            {[
              { label: 'MV Flags Checked', value: report.flagsChecked, color: 'var(--ink-700)' },
              { label: 'Unchanged',         value: report.flagsUnchanged, color: 'var(--status-ok)' },
              { label: 'Warnings',          value: report.summary.warning, color: 'var(--status-warn)' },
              { label: 'Critical',          value: report.summary.critical, color: 'var(--status-error)' },
            ].map((s) => (
              <Panel key={s.label} style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: '8px' }}>{s.label}</p>
                <p style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', fontWeight: 500, color: s.color }}>{s.value}</p>
              </Panel>
            ))}
          </div>

          {/* Route header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-700)' }}>{report.sourceEnvironment}</span>
              <span style={{ color: 'var(--ink-300)' }}>→</span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-700)' }}>{report.environment}</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-300)' }}>· {new Date(report.timestamp).toLocaleString()}</span>
            </div>
            <Badge variant={report.summary.critical > 0 ? 'error' : report.summary.warning > 0 ? 'warn' : 'ok'}>
              {report.summary.total === 0 ? 'No regressions' : `${report.summary.total} regression${report.summary.total !== 1 ? 's' : ''}`}
            </Badge>
          </div>

          {/* Results */}
          {report.flagsChecked === 0 ? (
            <Panel style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-500)', marginBottom: '8px' }}>No multivariate flags found</p>
              <p style={{ fontSize: '13px', color: 'var(--ink-300)' }}>
                The Audience Guard only checks MULTIVARIATE type flags. Create MV flags in Flagsmith to use this feature.
              </p>
            </Panel>
          ) : report.regressions.length === 0 ? (
            <Panel style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', color: 'var(--status-ok)' }}>✓</div>
              <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--status-ok)', marginBottom: '8px' }}>No audience regressions</p>
              <p style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
                All {report.flagsChecked} multivariate flag{report.flagsChecked !== 1 ? 's' : ''} have stable allocations across both environments.
              </p>
            </Panel>
          ) : (
            <Panel>
              {report.regressions.map((reg) => <RegressionCard key={reg.feature} reg={reg} />)}
            </Panel>
          )}

          {/* CLI hint */}
          <Panel style={{ padding: '14px 20px', background: 'var(--ivory)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-300)' }}>CLI:</span>
            <code style={{ fontSize: '13px', fontFamily: '"SF Mono", monospace', color: 'var(--ink-700)' }}>
              orqesta guard {report.sourceEnvironment} {report.environment}
            </code>
          </Panel>
        </>
      )}
    </div>
  );
}
