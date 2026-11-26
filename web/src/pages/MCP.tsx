import { Link } from 'react-router-dom';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';

function CodeBlock({ code }: { code: string }) {
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

export default function MCP() {
  return (
    <div style={{
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
            Model Context Protocol
          </span>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 500, marginBottom: '16px' }}>
          Get MCP Bundle
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--ink-500)', lineHeight: 1.6, maxWidth: '640px' }}>
          Download the complete Orqesta package with Docker Compose, CLI, and Web Dashboard —
          ready for local deployment.
        </p>
      </div>

      {/* Quick Download */}
      <Panel style={{ padding: '32px', marginBottom: '32px', background: 'linear-gradient(135deg, var(--sage-pale) 0%, var(--ivory) 100%)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Quick Download</h2>
        <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '20px', lineHeight: 1.6 }}>
          Get the full bundle via Git:
        </p>
        <CodeBlock code={`git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install`} />
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <a href="https://github.com/sohansarkar07/orqesta/archive/refs/heads/main.zip" target="_blank" rel="noopener">
            <Button variant="primary" size="md">
              Download ZIP
            </Button>
          </a>
          <a href="https://github.com/sohansarkar07/orqesta" target="_blank" rel="noopener">
            <Button variant="secondary" size="md">
              View on GitHub
            </Button>
          </a>
        </div>
      </Panel>

      {/* What's Included */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>What's Included</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {[
            { icon: '⚙️', title: 'Self-Hosted Flagsmith', desc: 'Full Flagsmith instance with PostgreSQL (docker-compose)' },
            { icon: '💻', title: 'CLI Tool', desc: 'Command-line interface with 5 main commands' },
            { icon: '🌐', title: 'Web Dashboard', desc: 'React-based UI with 6 feature pages' },
            { icon: '🔌', title: 'Express API', desc: 'REST API server (15 endpoints)' },
            { icon: '📦', title: 'Docker Setup', desc: 'One-command deployment with docker-compose' },
            { icon: '📚', title: 'Full Documentation', desc: 'README, Quick Start, API docs' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              padding: '16px',
              background: 'var(--ivory)',
              borderRadius: '8px',
              border: 'var(--border-light)',
            }}>
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px', color: 'var(--ink-900)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--ink-500)', margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Quick Start */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Quick Start</h2>
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '12px', lineHeight: 1.6 }}>
            <strong>Option 1: Docker Compose</strong> (Recommended)
          </p>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '12px' }}>
            Runs self-hosted Flagsmith + Orqesta together:
          </p>
          <CodeBlock code={`docker-compose up -d

# Wait 30s for Flagsmith to initialize
sleep 30

# Open Flagsmith: http://localhost:8000
# Open Orqesta:   http://localhost:3001`} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '12px', lineHeight: 1.6 }}>
            <strong>Option 2: Local Development</strong>
          </p>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '12px' }}>
            Run the web dashboard in dev mode:
          </p>
          <CodeBlock code={`# Terminal 1: Start API server
npm run server

# Terminal 2: Start frontend
cd web
npm run dev

# Open http://localhost:5173`} />
        </div>

        <div>
          <p style={{ fontSize: '15px', color: 'var(--ink-600)', marginBottom: '12px', lineHeight: 1.6 }}>
            <strong>Option 3: CLI Only</strong>
          </p>
          <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '12px' }}>
            Use just the command-line tools:
          </p>
          <CodeBlock code={`export FLAGSMITH_API_KEY="ser.xxxxxxxxxxxxxxxx"
npm run cli -- compare Staging Production`} />
        </div>
      </Panel>

      {/* System Requirements */}
      <Panel style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>System Requirements</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px', color: 'var(--ink-800)' }}>
              For CLI + Web Dashboard
            </h3>
            <ul style={{ fontSize: '14px', color: 'var(--ink-600)', lineHeight: 1.8, paddingLeft: '20px' }}>
              <li>Node.js 18 or later</li>
              <li>npm 9 or later</li>
              <li>2GB RAM minimum</li>
              <li>50MB disk space</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px', color: 'var(--ink-800)' }}>
              For Docker Compose
            </h3>
            <ul style={{ fontSize: '14px', color: 'var(--ink-600)', lineHeight: 1.8, paddingLeft: '20px' }}>
              <li>Docker 20.10+</li>
              <li>Docker Compose 2.0+</li>
              <li>4GB RAM minimum</li>
              <li>500MB disk space</li>
            </ul>
          </div>
        </div>
      </Panel>

      {/* Support */}
      <Panel style={{ padding: '32px', background: 'var(--ivory)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '16px' }}>Need Help?</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'white', borderRadius: '8px', border: 'var(--border-light)' }}>
            <span style={{ fontSize: '14px', color: 'var(--ink-700)' }}>📖 Read the documentation</span>
            <Link to="/docs">
              <Button variant="ghost" size="sm">View Docs</Button>
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'white', borderRadius: '8px', border: 'var(--border-light)' }}>
            <span style={{ fontSize: '14px', color: 'var(--ink-700)' }}>🐛 Report an issue</span>
            <a href="https://github.com/sohansarkar07/orqesta/issues" target="_blank" rel="noopener">
              <Button variant="ghost" size="sm">GitHub Issues</Button>
            </a>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'white', borderRadius: '8px', border: 'var(--border-light)' }}>
            <span style={{ fontSize: '14px', color: 'var(--ink-700)' }}>💬 Join the community</span>
            <a href="https://github.com/sohansarkar07/orqesta/discussions" target="_blank" rel="noopener">
              <Button variant="ghost" size="sm">Discussions</Button>
            </a>
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
          <Link to="/cli">
            <Button variant="secondary" size="sm">Try CLI</Button>
          </Link>
          <Link to="/app">
            <Button variant="secondary" size="sm">Open Dashboard</Button>
          </Link>
        </div>
        <Link to="/">
          <Button variant="ghost" size="sm">← Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
