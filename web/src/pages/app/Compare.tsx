import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { DEMO_DRIFT } from '../../lib/demo-data';
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
  const { drifts, source, target, summary } = DEMO_DRIFT;

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Environment Comparison</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-700)' }}>{source.environment}</span>
            <span style={{ fontSize: '14px', color: 'var(--ink-300)' }}>→</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-700)' }}>{target.environment}</span>
            <span style={{ fontSize: '11px', color: 'var(--ink-300)', marginLeft: '4px' }}>· {new Date(DEMO_DRIFT.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <Badge variant={summary.total > 0 ? 'warn' : 'ok'}>
          {summary.total > 0 ? `${summary.total} differences` : 'In sync'}
        </Badge>
      </div>

      {/* Summary pills */}
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

      {/* Diff table */}
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

      {/* CLI hint */}
      <Panel style={{ padding: '14px 20px', background: 'var(--ivory)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-300)' }}>CLI equivalent:</span>
        <code style={{ fontSize: '13px', fontFamily: '"SF Mono", monospace', color: 'var(--ink-700)' }}>
          orqesta compare {source.environment} {target.environment}
        </code>
      </Panel>
    </div>
  );
}
