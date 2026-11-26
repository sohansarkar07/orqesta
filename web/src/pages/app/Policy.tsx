import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { DEMO_POLICY } from '../../lib/demo-data';

function SeverityIcon({ severity }: { severity: 'error' | 'warning' | 'info' }) {
  const map = { error: '✗', warning: '⚠', info: 'ℹ' };
  const color = { error: 'var(--status-error)', warning: 'var(--status-warn)', info: 'var(--ink-400)' };
  return <span style={{ fontSize: '14px', color: color[severity] }}>{map[severity]}</span>;
}

export default function Policy() {
  const { violations, errors, warnings, passed, environment } = DEMO_POLICY;

  const groups: Record<'error' | 'warning' | 'info', typeof violations> = {
    error:   violations.filter((v) => v.severity === 'error'),
    warning: violations.filter((v) => v.severity === 'warning'),
    info:    violations.filter((v) => v.severity === 'info'),
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Policy Center</h1>
          <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
            Environment: <strong>{environment}</strong> · {new Date(DEMO_POLICY.timestamp).toLocaleString()}
          </p>
        </div>
        <Badge variant={errors > 0 ? 'error' : warnings > 0 ? 'warn' : 'ok'}>
          {errors > 0 ? `${errors} error${errors !== 1 ? 's' : ''}` : warnings > 0 ? `${warnings} warnings` : 'All passed'}
        </Badge>
      </div>

      {/* Score row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Errors', value: errors, variant: 'error' as const, bg: 'var(--status-err-bg)' },
          { label: 'Warnings', value: warnings, variant: 'warn' as const, bg: 'var(--status-warn-bg)' },
          { label: 'Passed', value: passed, variant: 'ok' as const, bg: 'var(--status-ok-bg)' },
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
          <span>{Math.round((passed / (passed + violations.length)) * 100)}%</span>
        </div>
        <div style={{ height: '6px', background: 'var(--ivory-mid)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(passed / (passed + violations.length)) * 100}%`,
            background: errors > 0 ? 'var(--status-error)' : warnings > 0 ? 'var(--status-warn)' : 'var(--status-ok)',
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

      {/* Policy example */}
      <Panel style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-400)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Example policy file <code style={{ fontFamily: '"SF Mono", monospace', textTransform: 'none', letterSpacing: 0 }}>.orqesta-policy.yml</code>
        </p>
        <pre style={{
          fontFamily: '"SF Mono", "Fira Code", monospace',
          fontSize: '12px',
          color: 'var(--ink-700)',
          lineHeight: 1.7,
          overflowX: 'auto',
          background: 'var(--ivory)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: 'var(--border)',
          margin: 0,
        }}>
{`version: 1

policies:
  - id: naming-convention
    description: Flag names must be snake_case.
    severity: warning
    rule: naming_convention
    pattern: "^[a-z][a-z0-9_]*$"

  - id: production-descriptions
    description: Production flags must have descriptions.
    severity: error
    rule: require_description
    environments:
      - Production

  - id: no-archived-enabled
    description: Archived flags must not be enabled.
    severity: error
    rule: no_archived_flags_enabled`}
        </pre>
      </Panel>

      {/* CLI hint */}
      <Panel style={{ padding: '14px 20px', background: 'var(--ivory)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-300)' }}>CLI:</span>
        <code style={{ fontSize: '13px', fontFamily: '"SF Mono", monospace', color: 'var(--ink-700)' }}>
          orqesta lint {environment} --policy ./orqesta-policy.yml
        </code>
      </Panel>
    </div>
  );
}
