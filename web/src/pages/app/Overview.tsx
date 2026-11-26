import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { DEMO_DRIFT, DEMO_POLICY, DEMO_AUDIT } from '../../lib/demo-data';

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent: string }) {
  return (
    <Panel style={{ padding: '24px 28px' }}>
      <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: '10px' }}>
        {label}
      </p>
      <p style={{ fontSize: '36px', fontFamily: 'var(--font-serif)', fontWeight: 500, color: accent, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: '12px', color: 'var(--ink-400)', marginTop: '8px' }}>{sub}</p>
    </Panel>
  );
}

export default function Overview() {
  const recentAudit = DEMO_AUDIT.slice(0, 3);

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 500, color: 'var(--ink-900)' }}>Overview</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
          Staging → Production · Last checked just now
        </p>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Drift items" value={DEMO_DRIFT.summary.total} sub="across 2 environments" accent="var(--status-warn)" />
        <StatCard label="Policy violations" value={DEMO_POLICY.errors} sub={`${DEMO_POLICY.warnings} warnings`} accent="var(--status-error)" />
        <StatCard label="Flags passing policy" value={DEMO_POLICY.passed} sub="of 21 checked" accent="var(--status-ok)" />
        <StatCard label="Recent changes" value={DEMO_AUDIT.length} sub="last 48 hours" accent="var(--ink-700)" />
      </div>

      {/* Two-column lower section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Drift summary */}
        <Panel style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 500 }}>Drift Summary</h2>
            <Badge variant="warn">{DEMO_DRIFT.summary.total} differences</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEMO_DRIFT.drifts.map((d) => (
              <div key={d.feature} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'var(--ivory)',
                borderRadius: 'var(--radius-sm)',
                border: 'var(--border-light)',
              }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-800)' }}>{d.feature}</span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-400)', marginLeft: '8px' }}>{d.description}</span>
                </div>
                <Badge variant={
                  d.category === 'enabled_state' ? 'warn' :
                  d.category === 'missing_in_target' ? 'error' : 'info'
                }>
                  {d.category.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>

        {/* Recent activity */}
        <Panel style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 500 }}>Recent Changes</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {recentAudit.map((entry, i) => (
              <div key={entry.id} style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 0',
                borderBottom: i < recentAudit.length - 1 ? 'var(--border-light)' : 'none',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: 'var(--ivory-mid)',
                  border: 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 600,
                  color: 'var(--ink-500)',
                  flexShrink: 0,
                }}>
                  {entry.author?.first_name[0]}{entry.author?.last_name[0]}
                </div>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: 'var(--ink-700)', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.log}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--ink-300)', marginTop: '3px' }}>
                    {entry.author?.first_name} {entry.author?.last_name} · {entry.environment?.name} · {new Date(entry.created_date).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant={entry.change_type === 'CREATE' ? 'ok' : entry.change_type === 'DELETE' ? 'error' : 'neutral'}>
                  {entry.change_type ?? 'unknown'}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
