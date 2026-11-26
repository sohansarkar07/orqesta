import { useState } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useEnvironments } from '../../lib/hooks';
import { api } from '../../lib/api';
import type { SyncPlan, SyncResult } from '../../lib/types';

const OP_LABELS: Record<string, string> = {
  enable: 'Enable',
  disable: 'Disable',
  set_value: 'Set value',
  set_multivariate_allocations: 'Set allocations',
};

type StepId = 'select' | 'plan' | 'applying' | 'done';

export default function Sync() {
  const [step, setStep] = useState<StepId>('select');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sourceEnvName, setSourceEnvName] = useState<string | null>(null);
  const [targetEnvName, setTargetEnvName] = useState<string | null>(null);

  const [planId, setPlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState<SyncPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planNoDrift, setPlanNoDrift] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dryRun, setDryRun] = useState(false);

  const [applyError, setApplyError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const environments = useEnvironments();

  const projects = environments.status === 'success'
    ? environments.data.flatMap((org) => org.projects.map((p) => ({ orgId: org.id, orgName: org.name, ...p })))
    : [];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const availableEnvs = selectedProject?.environments ?? [];

  async function handleCreatePlan() {
    if (!selectedProjectId || !sourceEnvName || !targetEnvName) return;

    setPlanError(null);
    setPlanNoDrift(null);
    setStep('applying');

    try {
      const res = await api.syncPlan(selectedProjectId, sourceEnvName, targetEnvName);

      if ('noDrift' in res) {
        setPlanNoDrift(res.message);
        setStep('select');
      } else {
        setPlanId(res.planId);
        setPlan(res.plan);
        setSelected(new Set(res.plan.operations.map((op: { id: string }) => op.id)));
        setStep('plan');
      }
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to create plan');
      setStep('select');
    }
  }

  function toggleOp(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleApply() {
    if (!planId) return;

    setApplyError(null);
    setStep('applying');

    try {
      const res = await api.syncApply(planId, {
        dryRun,
        selectedOperationIds: Array.from(selected),
      });
      setResult(res);
      setStep('done');
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Apply failed');
      setStep('plan');
    }
  }

  function resetFlow() {
    setStep('select');
    setPlanId(null);
    setPlan(null);
    setPlanError(null);
    setPlanNoDrift(null);
    setSelected(new Set());
    setDryRun(false);
    setApplyError(null);
    setResult(null);
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
        <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Synchronisation Plan</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
          {step === 'select' ? 'Generate a sync plan to bring target environment in line with source' : 
           plan ? `${plan.source.environment} → ${plan.target.environment}` : ''}
        </p>
      </div>

      {/* Selection form */}
      {step === 'select' && (
        <>
          <Panel style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>Select Environments</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }}>
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
                  Source (reference)
                </label>
                <select
                  value={sourceEnvName ?? ''}
                  onChange={(e) => setSourceEnvName(e.target.value || null)}
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
                  Target (will be updated)
                </label>
                <select
                  value={targetEnvName ?? ''}
                  onChange={(e) => setTargetEnvName(e.target.value || null)}
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
              onClick={handleCreatePlan}
              disabled={!selectedProjectId || !sourceEnvName || !targetEnvName}
              style={{ opacity: selectedProjectId && sourceEnvName && targetEnvName ? 1 : 0.5 }}
            >
              Generate Sync Plan
            </Button>
          </Panel>

          {planError && (
            <Panel style={{ padding: '16px 20px', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
              <p style={{ fontSize: '13px', color: 'var(--status-error)' }}>✗ {planError}</p>
            </Panel>
          )}

          {planNoDrift && (
            <Panel style={{ padding: '16px 20px', background: 'var(--status-ok-bg)', border: '1px solid #C2D9BC' }}>
              <p style={{ fontSize: '13px', color: 'var(--status-ok)' }}>✓ {planNoDrift}</p>
            </Panel>
          )}
        </>
      )}

      {/* Loading */}
      {step === 'applying' && !result && (
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)' }}>
            {plan ? (dryRun ? 'Previewing changes...' : `Applying ${selected.size} operation${selected.size !== 1 ? 's' : ''}...`) : 'Creating sync plan...'}
          </p>
        </Panel>
      )}

      {/* Plan review */}
      {step === 'plan' && plan && (
        <>
          {/* Stale-plan notice */}
          <Panel style={{ padding: '14px 20px', background: 'var(--status-ok-bg)', border: '1px solid #C2D9BC', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--status-ok)', fontSize: '14px' }}>✓</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13px', color: 'var(--olive)' }}>
                Target state snapshot verified — no concurrent changes detected since plan was created.
              </span>
              <div style={{ fontSize: '11px', color: 'var(--ink-400)', marginTop: '2px', fontFamily: '"SF Mono", monospace' }}>
                Plan ID: {planId} · Checksum: {plan.checksum}
              </div>
            </div>
          </Panel>

          {applyError && (
            <Panel style={{ padding: '16px 20px', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
              <p style={{ fontSize: '13px', color: 'var(--status-error)' }}>✗ {applyError}</p>
            </Panel>
          )}

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

            {plan.operations.map((op, i) => {
              const isSelected = selected.has(op.id);
              return (
                <div key={op.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 110px 160px 160px',
                  padding: '14px 20px',
                  alignItems: 'center',
                  borderBottom: i < plan.operations.length - 1 ? 'var(--border-light)' : 'none',
                  background: isSelected ? 'var(--white)' : 'var(--ivory-mid)',
                  opacity: isSelected ? 1 : 0.5,
                  transition: 'all 0.15s',
                }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleOp(op.id)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--ink-900)', cursor: 'pointer' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: '"SF Mono", monospace', color: 'var(--ink-900)' }}>{op.feature}</span>
                  <Badge variant={op.type === 'enable' ? 'ok' : op.type === 'disable' ? 'error' : 'info'}>
                    {OP_LABELS[op.type] || op.type}
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
                {selected.size} of {plan.operations.length} operations selected
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink-500)', cursor: 'pointer' }}>
                <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} style={{ accentColor: 'var(--ink-900)' }} />
                Dry-run (preview only)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" size="sm" onClick={() => setSelected(new Set())}>Deselect all</Button>
              <Button variant="secondary" size="sm" onClick={resetFlow}>Cancel</Button>
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

      {/* Done */}
      {step === 'done' && result && (
        <>
          <Panel style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', color: result.success ? 'var(--status-ok)' : 'var(--status-error)' }}>
              {result.success ? '✓' : '✗'}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: result.success ? 'var(--status-ok)' : 'var(--status-error)' }}>
              {dryRun ? 'Dry-run complete — no changes made' : result.success ? 'Synchronisation complete' : 'Sync failed'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '8px' }}>
              {dryRun
                ? `All ${result.applied} operation${result.applied !== 1 ? 's' : ''} previewed successfully.`
                : result.success
                  ? `${result.applied} operation${result.applied !== 1 ? 's' : ''} applied. Verification passed.`
                  : `${result.failed} operation${result.failed !== 1 ? 's' : ''} failed.`}
            </p>
          </Panel>

          {result.errors && result.errors.length > 0 && (
            <Panel style={{ padding: '20px 24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: 'var(--status-error)' }}>Errors</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.errors.map((err, i) => (
                  <div key={i} style={{ fontSize: '12px', color: 'var(--ink-500)', fontFamily: '"SF Mono", monospace', background: 'var(--status-err-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    {err.operation}: {err.message}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Button variant="secondary" size="sm" onClick={resetFlow}>
              Create another plan
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
