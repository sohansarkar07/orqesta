import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../components/ui/Panel';

type Client = 'claude-desktop' | 'cursor' | 'claude-code' | 'vscode' | 'kiro' | 'antigravity';

// All configs use the actual built MCP server — not an npm package that doesn't exist.
// Users must clone the repo and build first (npm install && npm run build).
// The command is: node /path/to/orqesta/dist/src/mcp/server.js

function makeConfig(client: Client): string {
  const serverPath = '/path/to/orqesta/dist/src/mcp/server.js';

  const envBlock = `"env": {
        "ORQUESTA_API_TOKEN": "your_flagsmith_org_token",
        "ORQUESTA_API_URL": "https://api.flagsmith.com/api/v1"
      }`;

  const configs: Record<Client, string> = {
    'claude-desktop': `{
  "mcpServers": {
    "orqesta": {
      "command": "node",
      "args": ["${serverPath}"],
      ${envBlock}
    }
  }
}`,
    'cursor': `{
  "mcpServers": {
    "orqesta": {
      "command": "node",
      "args": ["${serverPath}"],
      ${envBlock}
    }
  }
}`,
    'claude-code': `{
  "servers": {
    "orqesta": {
      "command": "node",
      "args": ["${serverPath}"],
      ${envBlock}
    }
  }
}`,
    'vscode': `{
  "servers": {
    "orqesta": {
      "command": "node",
      "args": ["${serverPath}"],
      ${envBlock}
    }
  }
}`,
    'kiro': `{
  "mcpServers": {
    "orqesta": {
      "command": "node",
      "args": ["${serverPath}"],
      ${envBlock}
    }
  }
}`,
    'antigravity': `{
  "mcp": {
    "servers": {
      "orqesta": {
        "command": "node",
        "args": ["${serverPath}"],
        "environment": {
          "ORQUESTA_API_TOKEN": "your_flagsmith_org_token",
          "ORQUESTA_API_URL": "https://api.flagsmith.com/api/v1"
        }
      }
    }
  }
}`,
  };

  return configs[client];
}

const clientMeta: Record<Client, { label: string; saveTo: { macos: string; windows: string } }> = {
  'claude-desktop': {
    label: 'Claude Desktop',
    saveTo: { macos: '~/Library/Application Support/Claude/claude_desktop_config.json', windows: '%APPDATA%\\Claude\\claude_desktop_config.json' },
  },
  'cursor': {
    label: 'Cursor',
    saveTo: { macos: '~/.cursor/mcp_config.json', windows: '%USERPROFILE%\\.cursor\\mcp_config.json' },
  },
  'claude-code': {
    label: 'Claude Code',
    saveTo: { macos: '~/.claude-code/mcp_settings.json', windows: '%APPDATA%\\ClaudeCode\\mcp_settings.json' },
  },
  'vscode': {
    label: 'VS Code',
    saveTo: { macos: '~/.vscode/mcp.json', windows: '%APPDATA%\\Code\\User\\mcp.json' },
  },
  'kiro': {
    label: 'Kiro',
    saveTo: { macos: '~/.kiro/settings/mcp.json', windows: '%USERPROFILE%\\.kiro\\settings\\mcp.json' },
  },
  'antigravity': {
    label: 'Antigravity',
    saveTo: { macos: '~/.config/antigravity/mcp.json', windows: '%APPDATA%\\Antigravity\\mcp.json' },
  },
};

const TOOLS = [
  { name: 'get_environments',      desc: 'List all projects and environments' },
  { name: 'compare_environments',  desc: 'Detect drift between two environments' },
  { name: 'run_policy_check',      desc: 'Run governance rules against an environment' },
  { name: 'run_audience_guard',    desc: 'Compare MV allocation shifts' },
  { name: 'eval_identities',       desc: 'Identity-level evaluation across two environments' },
];

export default function MCP() {
  const [selectedClient, setSelectedClient] = useState<Client>('claude-desktop');
  const [copied, setCopied] = useState(false);
  const [copiedSetup, setCopiedSetup] = useState(false);

  const config = makeConfig(selectedClient);
  const meta   = clientMeta[selectedClient];

  const setupCode = `git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install
npm run build
# Server is now at: dist/src/mcp/server.js`;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2D5F3F 0%, #1A3D2A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
    }}>
      <div style={{
        maxWidth: '960px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* ─── Header ─────────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #2D5F3F 0%, #1E4D30 100%)',
          padding: '40px 48px',
          position: 'relative',
        }}>
          <Link to="/" style={{
            position: 'absolute', top: '24px', right: '24px',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '20px', textDecoration: 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
            ×
          </Link>

          <div style={{ marginBottom: '20px' }}>
            <img src="/orqesta-logo.jpg" alt="Orqesta" style={{ height: '48px', width: 'auto', borderRadius: '8px', display: 'block' }} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Orqesta MCP
            </span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 500, color: 'white', lineHeight: 1.2, marginBottom: '12px' }}>
            Put feature flags in your agent's hands.
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, maxWidth: '580px' }}>
            Connect your AI client to Orqesta via Model Context Protocol.
            Compare environments, run policy checks, and evaluate user identity regression — directly from Claude, Cursor, or VS Code.
          </p>

          {/* Tools row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '24px' }}>
            {TOOLS.map((t) => (
              <span key={t.name} style={{
                padding: '4px 12px', borderRadius: '100px',
                background: 'rgba(255,255,255,0.12)',
                fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.85)',
                fontFamily: '"SF Mono", monospace',
              }}>
                {t.name}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Content ─────────────────────────────────────────────────────────── */}
        <div style={{ padding: '40px 48px 48px' }}>

          {/* Step 1 — Build */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>
              Step 1 — Build Orqesta
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '12px' }}>
              The MCP server runs locally from the built repository.
            </p>
            <div style={{ background: '#1A1A1A', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '12px', fontFamily: '"SF Mono", monospace', color: 'rgba(255,255,255,0.5)' }}>terminal</span>
                <button onClick={() => { navigator.clipboard.writeText(setupCode); setCopiedSetup(true); setTimeout(() => setCopiedSetup(false), 2000); }}
                  style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 500, color: copiedSetup ? '#5B8A4A' : 'white', background: copiedSetup ? 'rgba(91,138,74,0.15)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  {copiedSetup ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre style={{ padding: '16px 20px', margin: 0, fontSize: '13px', fontFamily: '"SF Mono", monospace', color: '#E8E4DC', lineHeight: 1.6 }}>
                {setupCode}
              </pre>
            </div>
          </div>

          {/* Step 2 — Configure */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>
              Step 2 — Add to your MCP client
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '20px' }}>
              Replace <code style={{ background: 'var(--ivory-mid)', padding: '2px 6px', borderRadius: '3px' }}>/path/to/orqesta</code> with your actual clone path.
            </p>

            {/* Client tabs */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
              padding: '6px', background: 'var(--ivory-mid)', borderRadius: '10px', marginBottom: '20px',
            }}>
              {(Object.keys(clientMeta) as Client[]).map((c) => (
                <button key={c} onClick={() => setSelectedClient(c)} style={{
                  padding: '10px 16px', fontSize: '13px', fontWeight: 500,
                  color: selectedClient === c ? 'var(--ink-900)' : 'var(--ink-500)',
                  background: selectedClient === c ? 'white' : 'transparent',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                  boxShadow: selectedClient === c ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                }}>
                  {clientMeta[c].label}
                </button>
              ))}
            </div>

            {/* Save path */}
            <div style={{ fontSize: '13px', fontFamily: '"SF Mono", monospace', color: 'var(--ink-600)', marginBottom: '16px' }}>
              <div>macOS: <code style={{ color: 'var(--ink-900)' }}>{meta.saveTo.macos}</code></div>
              <div style={{ marginTop: '4px' }}>Windows: <code style={{ color: 'var(--ink-900)' }}>{meta.saveTo.windows}</code></div>
            </div>

            {/* Config block */}
            <div style={{ background: '#1A1A1A', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5B8A4A' }} />
                  <span style={{ fontSize: '13px', fontFamily: '"SF Mono", monospace', color: 'rgba(255,255,255,0.7)' }}>
                    {selectedClient}_config.json
                  </span>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(config); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 500, color: copied ? '#5B8A4A' : 'white', background: copied ? 'rgba(91,138,74,0.15)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                  onMouseLeave={(e) => { if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
                  {copied ? '✓ Copied' : 'Copy config'}
                </button>
              </div>
              <pre style={{ padding: '20px', margin: 0, fontSize: '13px', fontFamily: '"SF Mono", monospace', color: '#E8E4DC', lineHeight: 1.6, overflow: 'auto', maxHeight: '340px' }}>
                {config}
              </pre>
            </div>
          </div>

          {/* Step 3 — Env var */}
          <div style={{ marginBottom: '36px', padding: '20px 24px', background: 'var(--sage-pale)', border: '1px solid #C2D9BC', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--olive)', marginBottom: '8px' }}>
              Step 3 — Set your credentials
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-600)', lineHeight: 1.6, marginBottom: '10px' }}>
              Replace <code>your_flagsmith_org_token</code> with your Flagsmith Organisation API token.<br />
              Get it from: <strong>Flagsmith dashboard → Organisation name → API Access → Create API Key</strong>
            </p>
            <p style={{ fontSize: '13px', color: 'var(--ink-500)', lineHeight: 1.6 }}>
              For self-hosted Flagsmith, also update <code>ORQUESTA_API_URL</code> to your instance URL, e.g. <code>http://localhost:8000/api/v1</code>
            </p>
          </div>

          {/* Available tools */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Available tools</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {TOOLS.map((t) => (
                <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px', padding: '12px 16px', background: 'var(--ivory)', borderRadius: '8px', alignItems: 'center' }}>
                  <code style={{ fontSize: '12px', fontFamily: '"SF Mono", monospace', color: 'var(--ink-900)', fontWeight: 600 }}>{t.name}</code>
                  <span style={{ fontSize: '13px', color: 'var(--ink-500)' }}>{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid var(--ivory)' }}>
            <a href="https://github.com/sohansarkar07/orqesta" target="_blank" rel="noopener" style={{ fontSize: '14px', color: 'var(--sage)', textDecoration: 'none' }}>
              View on GitHub →
            </a>
            <Link to="/">
              <button style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#2D5F3F', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1E4D30'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2D5F3F'}>
                Done
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
