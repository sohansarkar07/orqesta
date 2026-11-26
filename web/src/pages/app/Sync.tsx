import { useState } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DEMO_PLAN } from '../../lib/demo-data';

const OP_LABELS: Record<string, string> = {
  enable: 'Enable',
  disable: 'Disable',
  set_value: 'Set value',
  set_multivariate_allocations: 'Set allocations',
};

type StepId = 'plan' | 'review' | 'applying' | 'done';

export default function Sync() {
  const [step, setStep] = useState<StepId>('plan');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(DEMO_PLAN.operations.map((op) => op.id))
  );
  const [dryRun, setDryRun] = useState(false);

  function toggleOp(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleApply() {
    setStep('applying');
    setTimeout(() => setStep('done'), 1800);
  }

  const selectedOps = DEMO_PLAN.operations.filter((op) => selected.has(op.id));

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Synchronisation Plan</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
          {DEMO_PLAN.source.environment} → {DEMO_PLAN.target.environment}
          <span style={{ marginLeft: '12px', fontFamily: '"SF Mono", monospace', fontSize: '11px', color: 'var(--ink-300)', background: 'var(--ivory-mid)', padding: '2px 6px', borderRadius: '4px' }}>
            {DEMO_PLAN.checksum}
          </span>
        </p>
      </div>

      {/* Stale-plan notice */}
      <Panel style={{ padding: '14px 20px', background: 'var(--status-ok-bg)', border: '1px solid #C2D9BC', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: 'var(--status-ok)', fontSize: '14px' }}>✓</span>
        <span style={{ fontSize: '13px', color: 'var(--olive)' }}>
          Target state snapshot verified — no concurrent changes detected since plan was created.
        </span>
      </Panel>

      {step === 'done' ? (
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--status-ok)' }}>
            {dryRun ? 'Dry-run complete — no changes made' : 'Synchronisation complete'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '8px' }}>
            {dryRun ? 'All operations previewed successfully.' : `${selectedOps.length} operation${selectedOps.length !== 1 ? 's' : ''} applied. Verification passed.`}
          </p>
          <Button variant="secondary" size="sm" style={{ marginTop: '24px' }} onClick={() => { setStep('plan'); setSelected(new Set(DEMO_PLAN.operations.map((op) => op.id))); }}>
            Reset
          </Button>
        </Panel>
      ) : step === 'applying' ? (
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)' }}>
            {dryRun ? 'Previewing changes...' : 'Applying changes to Production...'}
          </p>
        </Panel>
      ) : (
        <>
          {/* Operations table */}
          <Panel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 110px 160px 160px',
              padding: '10px 20px',
              borderBottom: 'var(--border)',
              background: 'var(--ivory)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            }}>
              {['', 'Feature', 'Operation', 'Current value', 'Proposed value'].map((h) => (
                <span key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-300)' }}>{h}</span>
              ))}
            </div>

            {DEMO_PLAN.operations.map((op, i) => {
              const isSelected = selected.has(op.id);
              return (
                <div key={op.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 110px 160px 160px',
                  padding: '14px 20px',
                  alignItems: 'center',
                  borderBottom: i < DEMO_PLAN.operations.length - 1 ? 'var(--border-light)' : 'none',
                  background: isSelected ? 'var(--white)' : 'var(--ivory-mid)',
                  opacity: isSelected ? 1 : 0.5,
                  transition: 'all 0.15s',
                }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleOp(op.id)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--ink-900)', cursor: 'pointer' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: '"SF Mono", monospace', color: 'var(--ink-900)' }}>{op.feature}</span>
                  <Badge variant={op.type === 'enable' ? 'ok' : op.type === 'disable' ? 'error' : 'info'}>
                    {OP_LABELS[op.type]}
                  </Badge>
                  <span style={{ fontSize: '12px', color: 'var(--status-error)', background: 'var(--status-err-bg)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', display: 'inline-block', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(op.currentValue)}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--status-ok)', background: 'var(--status-ok-bg)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', display: 'inline-block', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(op.proposedValue)}
                  </span>
                </div>
              );
            })}
          </Panel>

          {/* Action bar */}
          <Panel style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
                {selected.size} of {DEMO_PLAN.operations.length} operations selected
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink-500)', cursor: 'pointer' }}>
                <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} style={{ accentColor: 'var(--ink-900)' }} />
                Dry-run (preview only)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" size="sm" onClick={() => setSelected(new Set())}>Deselect all</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selected.size === 0}
                style={{ opacity: selected.size === 0 ? 0.5 : 1 }}
                onClick={handleApply}
              >
                {dryRun ? 'Preview changes' : `Apply ${selected.size} operation${selected.size !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
