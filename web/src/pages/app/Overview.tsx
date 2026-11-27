import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useConnectionStatus, useEnvironments } from '../../lib/hooks';
import { Link } from 'react-router-dom';

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
  const connectionStatus = useConnectionStatus();
  const environments = useEnvironments();

  if (connectionStatus.status === 'loading' || environments.status === 'loading') {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)' }}>Loading...</p>
        </Panel>
      </div>
    );
  }

  if (connectionStatus.status === 'error') {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Panel style={{ padding: '48px', textAlign: 'center', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--status-error)' }}>✗</div>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--status-error)', marginBottom: '8px' }}>Connection error</p>
          <p style={{ fontSize: '13px', color: 'var(--ink-500)', marginBottom: '20px' }}>{connectionStatus.error}</p>
          <Link to="/app/settings">
            <Button variant="primary" size="sm">Go to Settings</Button>
          </Link>
        </Panel>
      </div>
    );
  }

  if (connectionStatus.status === 'success' && !connectionStatus.data.connected) {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚙</div>
          <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Connect to Flagsmith</h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Orqesta is not connected to a Flagsmith instance. Set your Organisation API Token in Settings to get started.
          </p>
          <Link to="/app/settings">
            <Button variant="primary" size="md">Open Settings</Button>
          </Link>
        </Panel>
      </div>
    );
  }

  if (environments.status === 'error') {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Panel style={{ padding: '48px', textAlign: 'center', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--status-error)' }}>✗</div>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--status-error)', marginBottom: '8px' }}>Failed to load environments</p>
          <p style={{ fontSize: '13px', color: 'var(--ink-500)' }}>{environments.error}</p>
        </Panel>
      </div>
    );
  }

  if (environments.status === 'success' && connectionStatus.status === 'success') {
    const envCount = environments.data.reduce((sum, org) => sum + org.projects.reduce((s, p) => s + p.environments.length, 0), 0);
    const projectCount = environments.data.reduce((sum, org) => sum + org.projects.length, 0);

    if (envCount === 0) {
      return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Panel style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📦</div>
            <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>No environments found</h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginBottom: '24px' }}>
              Create a project and environments in your Flagsmith dashboard first.
            </p>
            <a href="https://app.flagsmith.com" target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="sm">Open Flagsmith Dashboard</Button>
            </a>
          </Panel>
        </div>
      );
    }

    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }} className="app-page">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 500, color: 'var(--ink-900)' }}>Overview</h1>
          <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
            {connectionStatus.data.organisations?.[0]?.name ?? 'Connected'} · {projectCount} project{projectCount !== 1 ? 's' : ''}, {envCount} environment{envCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="stat-grid">
          <StatCard label="Projects" value={projectCount} sub="accessible" accent="var(--ink-700)" />
          <StatCard label="Environments" value={envCount} sub="across all projects" accent="var(--status-ok)" />
          <StatCard label="Organisations" value={connectionStatus.data.organisations?.length ?? 0} sub="connected" accent="var(--sage)" />
        </div>

        <Panel style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }} className="quick-actions-grid">
            <Link to="/app/compare">
              <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                ⇄ Compare Environments
              </Button>
            </Link>
            <Link to="/app/sync">
              <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                ↑ Create Sync Plan
              </Button>
            </Link>
            <Link to="/app/forensics">
              <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                ⌕ View Audit Log
              </Button>
            </Link>
            <Link to="/app/policy">
              <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                ✦ Run Policy Checks
              </Button>
            </Link>
          </div>
        </Panel>

        <Panel style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>Your Projects</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {environments.data.flatMap((org) => org.projects).map((project) => (
              <div key={project.id} style={{
                padding: '12px 16px',
                background: 'var(--ivory)',
                border: 'var(--border)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-900)' }}>{project.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-300)', marginTop: '3px' }}>
                  {project.environments.length} environment{project.environments.length !== 1 ? 's' : ''}: {project.environments.map((e) => e.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  return null;
}
