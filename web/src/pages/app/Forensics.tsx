import { useState } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useEnvironments, useAuditLog } from '../../lib/hooks';
import { api } from '../../lib/api';
import type { AuditEntry } from '../../lib/types';

function ChangeDetailRow({ field, oldVal, newVal }: { field: string; oldVal: unknown; newVal: unknown }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '6px 10px',
      background: 'var(--ivory)',
      borderRadius: 'var(--radius-sm)',
      fontSize: '12px',
      border: 'var(--border-light)',
      marginTop: '6px',
    }}>
      <span style={{ color: 'var(--ink-400)', fontFamily: '"SF Mono", monospace', minWidth: '120px' }}>{field}</span>
      <span style={{ color: 'var(--status-error)', background: 'var(--status-err-bg)', padding: '2px 6px', borderRadius: '3px', fontFamily: '"SF Mono", monospace' }}>
        {JSON.stringify(oldVal)}
      </span>
      <span style={{ color: 'var(--ink-300)' }}>→</span>
      <span style={{ color: 'var(--status-ok)', background: 'var(--status-ok-bg)', padding: '2px 6px', borderRadius: '3px', fontFamily: '"SF Mono", monospace' }}>
        {JSON.stringify(newVal)}
      </span>
    </div>
  );
}

function EntryCard({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullEntry, setFullEntry] = useState<AuditEntry | null>(null);

  const hasDetails = (entry.change_details?.length ?? 0) > 0;
  const displayEntry = fullEntry ?? entry;

  async function handleExpand() {
    if (!expanded) {
      setExpanded(true);
      if (!entry.change_details && entry.id) {
        setLoading(true);
        try {
          const full = await api.auditEntry(entry.id);
          setFullEntry(full);
        } catch {
          // already have partial entry, just show it
        } finally {
          setLoading(false);
        }
      }
    } else {
      setExpanded(false);
    }
  }

  return (
    <div style={{
      borderBottom: 'var(--border-light)',
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Avatar */}
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '50%',
          background: 'var(--ivory-mid)',
          border: 'var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 600, color: 'var(--ink-500)',
          flexShrink: 0,
        }}>
          {entry.author?.first_name?.[0] ?? '?'}{entry.author?.last_name?.[0] ?? ''}
        </div>

        <div style={{ flexGrow: 1 }}>
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-900)' }}>{entry.log}</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {entry.change_type && (
                <Badge variant={entry.change_type === 'CREATE' ? 'ok' : entry.change_type === 'DELETE' ? 'error' : 'neutral'}>
                  {entry.change_type}
                </Badge>
              )}
              <Badge variant="info">{entry.related_object_type}</Badge>
            </div>
          </div>

          {/* Meta */}
          <p style={{ fontSize: '11px', color: 'var(--ink-300)', marginTop: '4px' }}>
            {entry.author ? `${entry.author.first_name} ${entry.author.last_name}` : 'Unknown user'}
            {entry.environment?.name && (
              <>
                {' · '}
                <span style={{ color: 'var(--ink-400)' }}>{entry.environment.name}</span>
              </>
            )}
            {' · '}
            {new Date(entry.created_date).toLocaleString()}
          </p>

          {/* Change details */}
          <button
            onClick={handleExpand}
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            }}
          >
            {loading
              ? 'Loading...'
              : expanded
                ? '▲ Hide changes'
                : displayEntry.change_details && displayEntry.change_details.length > 0
                  ? `▼ Show ${displayEntry.change_details.length} field change${displayEntry.change_details.length !== 1 ? 's' : ''}`
                  : '▼ Show details'}
          </button>

          {expanded && displayEntry.change_details && displayEntry.change_details.length > 0 && (
            displayEntry.change_details.map((cd, i) => (
              <ChangeDetailRow key={i} field={cd.field} oldVal={cd.old} newVal={cd.new} />
            ))
          )}

          {expanded && (!displayEntry.change_details || displayEntry.change_details.length === 0) && (
            <p style={{ fontSize: '11px', color: 'var(--ink-300)', marginTop: '6px', fontStyle: 'italic' }}>
              No structured change details available for this event type.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Forensics() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [featureFilter, setFeatureFilter] = useState('');
  const [hasRun, setHasRun] = useState(false);

  const environments = useEnvironments();
  const auditLog = useAuditLog({
    projectId: hasRun ? selectedProjectId : null,
    environmentId: selectedEnvId ?? undefined,
    featureName: featureFilter || undefined,
    pageSize: 50,
  });

  const projects = environments.status === 'success'
    ? environments.data.flatMap((org) => org.projects.map((p) => ({ orgId: org.id, orgName: org.name, ...p })))
    : [];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const availableEnvs = selectedProject?.environments ?? [];

  function handleRunQuery() {
    if (selectedProjectId) {
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
        <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Configuration Forensics</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
          Structured audit history with before/after field values
        </p>
      </div>

      {/* Selection form */}
      <Panel style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>Audit Log Query</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Project (required)
            </label>
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedProjectId(id || null);
                setSelectedEnvId(null);
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
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Environment (optional)
            </label>
            <select
              value={selectedEnvId ?? ''}
              onChange={(e) => {
                setSelectedEnvId(Number(e.target.value) || null);
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
              <option value="">All environments</option>
              {availableEnvs.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Feature (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. dark_mode"
              value={featureFilter}
              onChange={(e) => {
                setFeatureFilter(e.target.value);
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
                fontFamily: '"SF Mono", monospace',
              }}
            />
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleRunQuery}
          disabled={!selectedProjectId}
          style={{ opacity: selectedProjectId ? 1 : 0.5 }}
        >
          Fetch Audit Log
        </Button>
      </Panel>

      {/* Results */}
      {auditLog.status === 'loading' && (
        <Panel style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</div>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)' }}>Loading audit log...</p>
        </Panel>
      )}

      {auditLog.status === 'error' && (
        <Panel style={{ padding: '48px', textAlign: 'center', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--status-error)' }}>✗</div>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--status-error)', marginBottom: '8px' }}>Query failed</p>
          <p style={{ fontSize: '13px', color: 'var(--ink-500)' }}>{auditLog.error}</p>
        </Panel>
      )}

      {auditLog.status === 'success' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
              Showing {auditLog.data.results.length} of {auditLog.data.count} events
            </p>
          </div>

          {auditLog.data.results.length > 0 ? (
            <Panel>
              {auditLog.data.results.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
            </Panel>
          ) : (
            <Panel style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--ink-300)' }}>No audit events found</p>
            </Panel>
          )}
        </>
      )}

      {/* CLI hint */}
      <Panel style={{ padding: '14px 20px', background: 'var(--ivory)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-300)' }}>CLI:</span>
        <code style={{ fontSize: '13px', fontFamily: '"SF Mono", monospace', color: 'var(--ink-700)' }}>
          orqesta inspect &lt;feature&gt; --with-changes
        </code>
      </Panel>
    </div>
  );
}
