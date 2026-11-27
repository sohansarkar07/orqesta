import { Link } from 'react-router-dom';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <Panel style={{
      padding: '16px 20px',
      background: 'var(--ink-900)',
      border: 'none',
      marginTop: '12px',
      marginBottom: '20px',
    }}>
      <code style={{
        fontFamily: '"SF Mono", "Fira Code", monospace',
        fontSize: '13px',
        color: '#E8E4DC',
        display: 'block',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        {code}
      </code>
    </Panel>
  );
}

export default function CLI() {
  return (
    <div className="page-single-col" style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '48px 48px 80px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--sage-pale)',
          border: '1px solid #C2D9BC',
          borderRadius: '100px',
          padding: '5px 14px',
          marginBottom: '20px',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--olive)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Command Line Interface
          </span>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 500, marginBottom: '16px' }}>
          Try the CLI
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--ink-500)', lineHeight: 1.6, maxWidth: '640px' }}>
          Get started with Orqesta's command-line interface in under 5 minutes.
          No configuration required — just install and run.
        </p>
      </div>

      {/* Quick Install */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Quick Install</h2>
        <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '16px', lineHeight: 1.6 }}>
          Install globally via npm (requires Node.js 18+):
        </p>
        <CodeBlock code="npm install -g orqesta" />
        <p style={{ fontSize: '14px', color: 'var(--ink-400)', marginTop: '-8px' }}>
          ✓ Installs the <code>orqesta</code> command globally on your system
        </p>
      </Panel>

      {/* Setup */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Configure Your API Token</h2>
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '12px', lineHeight: 1.6 }}>
            <strong>Step 1:</strong> Get your Organisation API Token from Flagsmith
          </p>
          <ol style={{ paddingLeft: '24px', fontSize: '14px', color: 'var(--ink-500)', lineHeight: 1.8 }}>
            <li>Go to <a href="https://app.flagsmith.com" target="_blank" rel="noopener" style={{ color: 'var(--sage)' }}>app.flagsmith.com</a></li>
            <li>Navigate to: <strong>Organisation Settings → API Keys</strong></li>
            <li>Copy the token (starts with <code>ser.</code>)</li>
          </ol>
        </div>
        <div>
          <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '12px', lineHeight: 1.6 }}>
            <strong>Step 2:</strong> Set the environment variable
          </p>
          <CodeBlock code={`export FLAGSMITH_API_KEY="ser.xxxxxxxxxxxxxxxx"

# Optional: set custom API URL (for self-hosted Flagsmith)
export FLAGSMITH_API_URL="https://api.flagsmith.com/api/v1"`} />
        </div>
        <div style={{
          padding: '14px 18px',
          background: 'var(--status-ok-bg)',
          border: '1px solid #C2D9BC',
          borderRadius: '8px',
          marginTop: '16px',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--olive)', margin: 0, lineHeight: 1.6 }}>
            <strong>💡 Tip:</strong> Add these to your <code>~/.bashrc</code> or <code>~/.zshrc</code> to make them permanent.
          </p>
        </div>
      </Panel>

      {/* Verify */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Verify Installation</h2>
        <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '16px', lineHeight: 1.6 }}>
          Check your connection and configuration:
        </p>
        <CodeBlock code="orqesta status" />
        <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginTop: '-8px', lineHeight: 1.6 }}>
          This command checks if your API token is valid and displays connected organisations.
        </p>
      </Panel>

      {/* Commands */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>Try These Commands</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            {
              title: 'Compare Environments',
              desc: 'Detect configuration drift between two environments',
              code: 'orqesta compare Staging Production',
            },
            {
              title: 'Sync Configuration',
              desc: 'Generate a sync plan (dry-run by default)',
              code: 'orqesta sync Staging Production',
            },
            {
              title: 'Inspect Audit History',
              desc: 'View change history for a specific feature flag',
              code: 'orqesta inspect dark_mode --with-changes',
            },
            {
              title: 'Run Policy Checks',
              desc: 'Validate configuration against governance rules',
              code: 'orqesta lint Production --policy ./policy.yml',
            },
          ].map((item, i) => (
            <div key={i}>
              <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px', color: 'var(--ink-900)' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '12px' }}>
                {item.desc}
              </p>
              <CodeBlock code={item.code} />
            </div>
          ))}
        </div>
      </Panel>

      {/* Alternative Install Methods */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>Alternative Installation</h2>
        
        <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '12px' }}>Docker</h3>
        <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '12px' }}>
          Run without installing Node.js:
        </p>
        <CodeBlock code={`docker run -e FLAGSMITH_API_KEY=your_key \\
  ghcr.io/sohansarkar07/orqesta compare Staging Production`} />

        <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '12px', marginTop: '32px' }}>From Source</h3>
        <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '12px' }}>
          Build from the GitHub repository:
        </p>
        <CodeBlock code={`git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install
npm run build
npm link

# Now 'orqesta' command is available globally`} />
      </Panel>

      {/* Help */}
      <Panel style={{ padding: '32px', background: 'var(--ivory)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Need Help?</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--ink-600)', marginBottom: '8px' }}>
              <strong>View all commands:</strong>
            </p>
            <CodeBlock code="orqesta --help" />
          </div>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--ink-600)', marginBottom: '8px' }}>
              <strong>Get help for a specific command:</strong>
            </p>
            <CodeBlock code="orqesta compare --help" />
          </div>
        </div>
      </Panel>

      {/* Footer */}
      <div style={{
        marginTop: '48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/docs">
            <Button variant="secondary" size="sm">View Full Docs</Button>
          </Link>
          <Link to="/mcp">
            <Button variant="secondary" size="sm">Get MCP Bundle</Button>
          </Link>
        </div>
        <Link to="/">
          <Button variant="ghost" size="sm">← Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
