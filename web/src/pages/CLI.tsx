import { Link } from 'react-router-dom';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';

function CodeBlock({ code }: { code: string }) {
  return (
    <Panel style={{ padding: '16px 20px', background: 'var(--ink-900)', border: 'none', marginTop: '12px', marginBottom: '20px' }}>
      <code style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: '13px', color: '#E8E4DC', display: 'block', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {code}
      </code>
    </Panel>
  );
}

export default function CLI() {
  return (
    <div className="page-single-col" style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 48px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--sage-pale)', border: '1px solid #C2D9BC', borderRadius: '100px', padding: '5px 14px', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--olive)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Command Line Interface
          </span>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 500, marginBottom: '16px' }}>Try the CLI</h1>
        <p style={{ fontSize: '18px', color: 'var(--ink-500)', lineHeight: 1.6, maxWidth: '640px' }}>
          Orqesta's CLI gives you full control over Flagsmith configuration safety from your terminal or CI pipeline.
        </p>
      </div>

      {/* Install */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Install</h2>
        <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '12px', lineHeight: 1.6 }}>
          Requires Node.js 18+. Install from source (npm publish pending):
        </p>
        <CodeBlock code={`git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install
npm run build
npm link          # links 'orqesta' command globally`} />
        <p style={{ fontSize: '14px', color: 'var(--ink-400)', marginTop: '-8px' }}>
          ✓ The <code>orqesta</code> command is now available globally on your system.
        </p>
      </Panel>

      {/* Configure */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Configure</h2>

        <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '12px', lineHeight: 1.6 }}>
          <strong>Get your Organisation API Token:</strong>
        </p>
        <ol style={{ paddingLeft: '24px', fontSize: '14px', color: 'var(--ink-500)', lineHeight: 1.9, marginBottom: '20px' }}>
          <li>Go to <a href="https://app.flagsmith.com" target="_blank" rel="noopener" style={{ color: 'var(--sage)' }}>app.flagsmith.com</a></li>
          <li>Click your organisation name in the top nav</li>
          <li>Go to <strong>API Access</strong> tab → <strong>Create API Key</strong></li>
          <li>Copy the token</li>
        </ol>

        <CodeBlock code={`# Set your credentials
export ORQUESTA_API_TOKEN="your_flagsmith_org_token"

# Optional: self-hosted Flagsmith
export ORQUESTA_API_URL="http://localhost:8000/api/v1"

# Optional: environment key (improves compare/lint performance)
export ORQUESTA_ENVIRONMENT_KEY="ser.xxxxxxxxxxxxxxxx"`} />

        <div style={{ padding: '14px 18px', background: 'var(--status-ok-bg)', border: '1px solid #C2D9BC', borderRadius: '8px', marginTop: '8px' }}>
          <p style={{ fontSize: '13px', color: 'var(--olive)', margin: 0, lineHeight: 1.6 }}>
            <strong>Tip:</strong> The legacy <code>FLAGSMITH_API_KEY</code> variable is still accepted as a fallback. Add env vars to <code>~/.zshrc</code> or <code>~/.bashrc</code> to persist them.
          </p>
        </div>
      </Panel>

      {/* Health check */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Verify connection</h2>
        <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '12px', lineHeight: 1.6 }}>
          Run the health check to confirm connectivity and authentication:
        </p>
        <CodeBlock code="orqesta doctor" />
        <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginTop: '-8px', lineHeight: 1.6 }}>
          Checks your API token, URL, and connectivity. Run this first if anything doesn't work.
        </p>
      </Panel>

      {/* Commands */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>Commands</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {[
            {
              title: 'List environments',
              desc: 'Show all accessible projects and environments.',
              code: 'orqesta environments',
            },
            {
              title: 'Compare environments',
              desc: 'Detect configuration drift. Exits 0 if in sync, 1 if drift found — CI-safe.',
              code: 'orqesta compare Staging Production',
            },
            {
              title: 'Generate a sync plan',
              desc: 'Create a typed plan from drift. Preview with dry-run before applying anything.',
              code: `orqesta plan Staging Production
orqesta apply --dry-run          # preview — no writes
orqesta apply                    # interactive y/N gate`,
            },
            {
              title: 'Run policy checks',
              desc: 'Validate configuration against governance rules. Exits 1 on violations.',
              code: `orqesta lint Production
orqesta lint Production --policy ./examples/policy.yml`,
            },
            {
              title: 'Identity evaluation',
              desc: 'Evaluate synthetic users against two environments and detect evaluation regressions.',
              code: `orqesta eval Development Production --init   # create fixture file
# edit orqesta-identities.yml, then:
orqesta eval Development Production`,
            },
            {
              title: 'Audience Regression Guard',
              desc: 'Detect multivariate flag allocation shifts that could change user segment exposure.',
              code: 'orqesta guard Staging Production',
            },
            {
              title: 'Inspect audit history',
              desc: 'View structured before/after change history for a specific flag.',
              code: 'orqesta inspect dark_mode --with-changes',
            },
          ].map((item, i) => (
            <div key={i}>
              <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink-900)' }}>{item.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '4px' }}>{item.desc}</p>
              <CodeBlock code={item.code} />
            </div>
          ))}
        </div>
      </Panel>

      {/* All commands reference */}
      <Panel style={{ padding: '32px', marginBottom: '32px', background: 'var(--ivory)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>Full command reference</h2>
        <CodeBlock code={`orqesta doctor                               # health check
orqesta environments                         # list environments
orqesta compare <source> <target>            # drift detection
orqesta plan <source> <target>               # generate sync plan
orqesta apply [--dry-run] [--yes]            # apply plan
orqesta verify <source> <target>             # post-sync check
orqesta inspect <feature> [--with-changes]   # audit history
orqesta history <feature>                    # full change history
orqesta lint <environment> [--policy <path>] # policy checks
orqesta guard <source> <target>              # audience guard
orqesta eval <source> <target> [--init]      # identity evaluation
orqesta report <source> <target>             # export report
orqesta config show                          # view config
orqesta config set-key <token>               # store token
orqesta config set-url <url>                 # set API URL
orqesta config clear                         # remove all config`} />
      </Panel>

      {/* From Source / Docker */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>Self-hosted Flagsmith</h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '12px' }}>
          Run Flagsmith and Orqesta together with Docker Compose:
        </p>
        <CodeBlock code={`git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
docker compose up -d
# Flagsmith:  http://localhost:8000
# Orqesta:    http://localhost:3001`} />
        <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginTop: '-8px' }}>
          After creating your org and API key in the Flagsmith UI, set <code>ORQUESTA_API_URL=http://localhost:8000/api/v1</code>.
        </p>
      </Panel>

      {/* Help */}
      <Panel style={{ padding: '32px', background: 'var(--ivory)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>Need help?</h2>
        <CodeBlock code={`orqesta --help
orqesta <command> --help`} />
      </Panel>

      {/* Footer */}
      <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/docs"><Button variant="secondary" size="sm">View Full Docs</Button></Link>
          <Link to="/mcp"><Button variant="secondary" size="sm">Get MCP Bundle</Button></Link>
        </div>
        <Link to="/"><Button variant="ghost" size="sm">← Back to Home</Button></Link>
      </div>
    </div>
  );
}
