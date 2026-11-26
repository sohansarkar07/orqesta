import { useState } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { DEMO_AUDIT } from '../../lib/demo-data';
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
  const hasDetails = (entry.change_details?.length ?? 0) > 0;

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
          {entry.author?.first_name[0]}{entry.author?.last_name[0]}
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
            {entry.author?.first_name} {entry.author?.last_name}
            {' · '}
            <span style={{ color: 'var(--ink-400)' }}>{entry.environment?.name}</span>
            {' · '}
            {new Date(entry.created_date).toLocaleString()}
          </p>

          {/* Change details */}
          {hasDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
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
              {expanded ? '▲ Hide changes' : `▼ Show ${entry.change_details!.length} field change${entry.change_details!.length !== 1 ? 's' : ''}`}
            </button>
          )}

          {expanded && entry.change_details?.map((cd, i) => (
            <ChangeDetailRow key={i} field={cd.field} oldVal={cd.old} newVal={cd.new} />
          ))}

          {!hasDetails && (
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
  const [filter, setFilter] = useState('');

  const filtered = DEMO_AUDIT.filter((e) =>
    !filter ||
    e.log.toLowerCase().includes(filter.toLowerCase()) ||
    e.author?.first_name.toLowerCase().includes(filter.toLowerCase()) ||
    e.environment?.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Configuration Forensics</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
          Structured audit history with before/after field values
        </p>
      </div>

      {/* Filter bar */}
      <Panel style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', color: 'var(--ink-300)' }}>⌕</span>
        <input
          type="text"
          placeholder="Filter by flag name, actor or environment…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flexGrow: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '13px',
            color: 'var(--ink-700)',
            fontFamily: 'var(--font-sans)',
          }}
        />
        {filter && (
          <button onClick={() => setFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--ink-300)' }}>
            ✕
          </button>
        )}
      </Panel>

      {/* Entries */}
      <Panel>
        {filtered.length > 0 ? (
          filtered.map((entry) => <EntryCard key={entry.id} entry={entry} />)
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-300)' }}>
            <p style={{ fontSize: '14px' }}>No matching events</p>
          </div>
        )}
      </Panel>

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
