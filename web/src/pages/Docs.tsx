import { Link } from 'react-router-dom';
import React from 'react';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';

/* ─── Sidebar Navigation ───────────────────────────────────────────────────── */
function DocsSidebar({ activeSection }: { activeSection: string }) {
  const [navOpen, setNavOpen] = React.useState(false);

  const sections = [
    { id: 'introduction', label: 'Introduction' },
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'installation', label: 'Installation' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'commands', label: 'CLI Commands' },
    { id: 'compare', label: 'Compare' },
    { id: 'sync', label: 'Sync' },
    { id: 'forensics', label: 'Forensics' },
    { id: 'policy', label: 'Policy Engine' },
    { id: 'web-dashboard', label: 'Web Dashboard' },
    { id: 'docker', label: 'Docker Deployment' },
    { id: 'api', label: 'API Reference' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
  ];

  return (
    <aside className="docs-sidebar" style={{
      position: 'sticky',
      top: '90px',
      width: '240px',
      height: 'calc(100vh - 120px)',
      overflowY: 'auto',
      paddingRight: '24px',
      flexShrink: 0,
    }}>
      {/* Label + mobile toggle */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--ink-300)', margin: 0,
        }}>
          Documentation
        </p>
        {/* Mobile toggle — shown via CSS */}
        <button
          className="docs-sidebar-toggle"
          onClick={() => setNavOpen(!navOpen)}
          style={{
            display: 'none', // shown via CSS on mobile
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', color: 'var(--ink-500)', fontFamily: 'inherit',
            padding: '4px 8px', borderRadius: '4px',
            alignItems: 'center', gap: '4px',
          }}
        >
          {navOpen ? 'Hide ▲' : 'Show sections ▼'}
        </button>
      </div>

      <nav
        className={`docs-sidebar-nav${navOpen ? ' open' : ''}`}
        style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={() => setNavOpen(false)}
            style={{
              padding: '8px 12px', fontSize: '14px',
              color: activeSection === section.id ? 'var(--ink-900)' : 'var(--ink-500)',
              background: activeSection === section.id ? 'var(--ivory)' : 'transparent',
              borderRadius: '6px', textDecoration: 'none',
              fontWeight: activeSection === section.id ? 500 : 400,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { if (activeSection !== section.id) e.currentTarget.style.background = 'var(--ivory-mid)'; }}
            onMouseLeave={(e) => { if (activeSection !== section.id) e.currentTarget.style.background = 'transparent'; }}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

/* ─── Code Block ───────────────────────────────────────────────────────────── */
function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <Panel className="docs-code" style={{
      padding: '16px 20px',
      background: 'var(--ink-900)',
      border: 'none',
      marginTop: '12px',
      marginBottom: '20px',
      overflow: 'auto',
    }}>
      <code style={{
        fontFamily: '"SF Mono", "Fira Code", monospace',
        fontSize: '13px',
        color: '#E8E4DC',
        display: 'block',
        lineHeight: 1.6,
        whiteSpace: 'pre',
      }}>
        {code}
      </code>
    </Panel>
  );
}

/* ─── Section Heading ──────────────────────────────────────────────────────── */
function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      style={{
        fontSize: '28px',
        fontWeight: 500,
        color: 'var(--ink-900)',
        marginTop: '48px',
        marginBottom: '16px',
        scrollMarginTop: '100px',
      }}
    >
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: '20px',
      fontWeight: 500,
      color: 'var(--ink-800)',
      marginTop: '32px',
      marginBottom: '12px',
    }}>
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '15px',
      lineHeight: 1.7,
      color: 'var(--ink-600)',
      marginBottom: '16px',
    }}>
      {children}
    </p>
  );
}

/* ─── Main Docs Content ────────────────────────────────────────────────────── */
function DocsContent() {
  return (
    <article className="docs-content" style={{ maxWidth: '740px', flexGrow: 1, minWidth: 0 }}>
      {/* Introduction */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 500, marginBottom: '16px' }}>
          Documentation
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--ink-500)', lineHeight: 1.6 }}>
          Everything you need to know about Orqesta — from quick start to advanced usage.
        </p>
      </div>

      <SectionHeading id="introduction">Introduction</SectionHeading>
      <Paragraph>
        Orqesta is a configuration safety tool for Flagsmith. It detects drift between environments,
        provides structured audit history, and enforces policies through linting.
      </Paragraph>
      <Paragraph>
        Built for teams who need visibility and control over feature flag configurations across
        multiple environments (Staging, Production, etc.).
      </Paragraph>

      <SectionHeading id="quick-start">Quick Start</SectionHeading>
      <Paragraph>
        Get Orqesta running in under 5 minutes with Docker Compose (includes self-hosted Flagsmith):
      </Paragraph>
      <CodeBlock code={`git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
docker-compose up -d

# Wait 30s for Flagsmith to initialize
sleep 30

# Open Flagsmith: http://localhost:8000
# Open Orqesta:   http://localhost:3001`} />

      <SectionHeading id="installation">Installation</SectionHeading>
      
      <SubHeading>Option 1: npm (Global CLI)</SubHeading>
      <CodeBlock code={`npm install -g orqesta
orqesta --version`} />

      <SubHeading>Option 2: Docker</SubHeading>
      <CodeBlock code={`docker pull ghcr.io/sohansarkar07/orqesta:latest
docker run -e FLAGSMITH_API_KEY=your_key orqesta compare Staging Production`} />

      <SubHeading>Option 3: From Source</SubHeading>
      <CodeBlock code={`git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install
npm run build
npm link`} />

      <SectionHeading id="configuration">Configuration</SectionHeading>
      <Paragraph>
        Orqesta requires a Flagsmith <strong>Organisation API Token</strong> (not an environment SDK key).
      </Paragraph>

      <SubHeading>Get Your API Token</SubHeading>
      <Panel style={{ padding: '16px 20px', background: 'var(--sage-pale)', border: '1px solid #C2D9BC', marginBottom: '20px' }}>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--olive)', lineHeight: 1.8 }}>
          <li>Go to Flagsmith dashboard</li>
          <li>Navigate to: <strong>Organisation Settings → API Keys</strong></li>
          <li>Copy the token (starts with <code>ser.</code>)</li>
        </ol>
      </Panel>

      <SubHeading>Set Environment Variables</SubHeading>
      <CodeBlock code={`export FLAGSMITH_API_KEY="ser.xxxxxxxxxxxxxxxx"
export FLAGSMITH_API_URL="https://api.flagsmith.com/api/v1"  # optional

# Verify connection
orqesta status`} />

      <SectionHeading id="commands">CLI Commands</SectionHeading>
      <Paragraph>
        Orqesta provides 5 main commands:
      </Paragraph>

      <div style={{ display: 'grid', gap: '12px', marginTop: '20px', marginBottom: '32px' }}>
        {[
          { cmd: 'compare', desc: 'Detect drift between two environments' },
          { cmd: 'sync', desc: 'Generate and apply sync plans' },
          { cmd: 'inspect', desc: 'View audit history for a feature' },
          { cmd: 'lint', desc: 'Run policy checks against an environment' },
          { cmd: 'status', desc: 'Verify API connection and config' },
        ].map((item) => (
          <Panel key={item.cmd} style={{ padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <code style={{ fontFamily: '"SF Mono", monospace', fontSize: '13px', color: 'var(--ink-900)', fontWeight: 600 }}>
              {item.cmd}
            </code>
            <span style={{ fontSize: '13px', color: 'var(--ink-500)' }}>— {item.desc}</span>
          </Panel>
        ))}
      </div>

      <SectionHeading id="compare">Compare</SectionHeading>
      <Paragraph>
        Detect configuration drift between two environments. Returns a categorised diff showing what's different.
      </Paragraph>
      <CodeBlock code={`# Basic usage
orqesta compare Staging Production

# With project filter
orqesta compare Staging Production --project "My App"

# JSON output
orqesta compare Staging Production --json > drift-report.json`} />

      <SubHeading>Output Categories</SubHeading>
      <ul style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-600)', marginBottom: '24px' }}>
        <li><strong>enabled_state</strong> — Flag enabled in one env but not the other</li>
        <li><strong>value_change</strong> — Remote config value differs</li>
        <li><strong>multivariate_allocation</strong> — MV percentage allocation differs</li>
        <li><strong>missing_in_target</strong> — Flag exists in source but not target</li>
        <li><strong>missing_in_source</strong> — Flag exists in target but not source</li>
      </ul>

      <SectionHeading id="sync">Sync</SectionHeading>
      <Paragraph>
        Generate a typed sync plan from drift, then selectively apply operations to bring target in line with source.
      </Paragraph>
      <CodeBlock code={`# Generate plan (dry-run by default)
orqesta sync Staging Production

# Apply all operations
orqesta sync Staging Production --apply --yes

# Apply with interactive selection
orqesta sync Staging Production --apply

# Preview only (no changes)
orqesta sync Staging Production --dry-run`} />

      <SubHeading>Stale-Plan Protection</SubHeading>
      <Panel style={{ padding: '16px 20px', background: 'var(--status-ok-bg)', border: '1px solid #C2D9BC', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: 'var(--olive)', lineHeight: 1.6, margin: 0 }}>
          <strong>✓ Safety guarantee:</strong> Orqesta takes a snapshot of the target environment when creating a plan.
          Before applying, it re-fetches the target state and compares checksums. If another user changed the target
          in the meantime, those operations are skipped (no silent overwrites).
        </p>
      </Panel>

      <SectionHeading id="forensics">Forensics</SectionHeading>
      <Paragraph>
        Inspect the full audit history for any feature flag. Shows who changed what, when, and displays before/after values when available.
      </Paragraph>
      <CodeBlock code={`# Basic audit log
orqesta inspect checkout_redesign

# With structured change details
orqesta inspect checkout_redesign --with-changes

# Filter by environment
orqesta inspect dark_mode --environment Production

# Last 50 events
orqesta inspect api_rate_limit --limit 50`} />

      <SectionHeading id="policy">Policy Engine</SectionHeading>
      <Paragraph>
        Define configuration standards in a YAML policy file. Orqesta runs checks against live feature states
        and reports violations with severity (error, warning, info).
      </Paragraph>
      <CodeBlock code={`# Run with default policy
orqesta lint Production

# Custom policy file
orqesta lint Production --policy ./orqesta-policy.yml

# CI mode (exit 1 on errors)
orqesta lint Production --policy ./policy.yml || exit 1`} />

      <SubHeading>Example Policy File</SubHeading>
      <CodeBlock language="yaml" code={`version: 1

policies:
  - id: naming-convention
    description: Flag names must be snake_case
    severity: warning
    rule: naming_convention
    pattern: "^[a-z][a-z0-9_]*$"

  - id: production-descriptions
    description: Production flags must have descriptions
    severity: error
    rule: require_description
    environments:
      - Production

  - id: no-archived-enabled
    description: Archived flags must not be enabled
    severity: error
    rule: no_archived_flags_enabled`} />

      <SubHeading>Built-in Rules</SubHeading>
      <ul style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-600)', marginBottom: '24px' }}>
        <li><code>naming_convention</code> — Enforce regex pattern on flag names</li>
        <li><code>require_description</code> — Flags must have descriptions</li>
        <li><code>no_archived_flags_enabled</code> — Archived flags cannot be enabled</li>
        <li><code>validate_multivariate_allocations</code> — MV percentages must sum to 100</li>
        <li><code>cross_environment_parity</code> — Same flags must exist across envs</li>
      </ul>

      <SectionHeading id="web-dashboard">Web Dashboard</SectionHeading>
      <Paragraph>
        Orqesta includes a React-based web UI for teams who prefer visual workflows.
      </Paragraph>
      <CodeBlock code={`# Start dev server
npm run dev
# Frontend: http://localhost:5173
# API:      http://localhost:3001

# Production build
npm run build
npm run server
# Single port: http://localhost:3001`} />

      <SubHeading>Dashboard Features</SubHeading>
      <ul style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-600)', marginBottom: '24px' }}>
        <li><strong>Settings</strong> — Connect/disconnect API tokens</li>
        <li><strong>Overview</strong> — Project summary and quick actions</li>
        <li><strong>Compare</strong> — Visual drift report with filtering</li>
        <li><strong>Sync</strong> — Interactive plan review and approval</li>
        <li><strong>Forensics</strong> — Searchable audit log timeline</li>
        <li><strong>Policy</strong> — Run checks with custom YAML editor</li>
      </ul>

      <SectionHeading id="docker">Docker Deployment</SectionHeading>
      <Paragraph>
        Deploy Orqesta + self-hosted Flagsmith together with Docker Compose.
      </Paragraph>
      <CodeBlock code={`# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f orqesta

# Stop
docker-compose down`} />

      <SubHeading>docker-compose.yml</SubHeading>
      <Paragraph>
        The included <code>docker-compose.yml</code> runs:
      </Paragraph>
      <ul style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-600)', marginBottom: '24px' }}>
        <li><strong>Flagsmith</strong> (port 8000) — Self-hosted feature flag API</li>
        <li><strong>PostgreSQL</strong> (port 5432) — Flagsmith database</li>
        <li><strong>Orqesta</strong> (port 3001) — API + Web UI</li>
      </ul>

      <SectionHeading id="api">API Reference</SectionHeading>
      <Paragraph>
        Orqesta exposes a REST API (Express) that the web dashboard consumes. You can call it directly:
      </Paragraph>

      <SubHeading>Endpoints</SubHeading>
      <Panel style={{ padding: '20px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', fontFamily: '"SF Mono", monospace' }}>
          <div><strong style={{ color: 'var(--sage)' }}>POST</strong> <code>/api/settings/connect</code></div>
          <div><strong style={{ color: 'var(--olive)' }}>GET</strong> <code>/api/settings/status</code></div>
          <div><strong style={{ color: 'var(--sage)' }}>POST</strong> <code>/api/compare</code></div>
          <div><strong style={{ color: 'var(--sage)' }}>POST</strong> <code>/api/sync/plan</code></div>
          <div><strong style={{ color: 'var(--sage)' }}>POST</strong> <code>/api/sync/apply</code></div>
          <div><strong style={{ color: 'var(--olive)' }}>GET</strong> <code>/api/forensics/audit</code></div>
          <div><strong style={{ color: 'var(--sage)' }}>POST</strong> <code>/api/policy/run</code></div>
        </div>
      </Panel>

      <SubHeading>Example: Compare API</SubHeading>
      <CodeBlock code={`curl -X POST http://localhost:3001/api/compare \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": 10,
    "sourceEnvName": "Staging",
    "targetEnvName": "Production"
  }'`} />

      <SectionHeading id="troubleshooting">Troubleshooting</SectionHeading>
      
      <SubHeading>Cannot connect to Flagsmith</SubHeading>
      <Panel style={{ padding: '16px 20px', background: 'var(--ivory)', marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--ink-600)', margin: '0 0 8px' }}>
          <strong>Check:</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--ink-600)', lineHeight: 1.8 }}>
          <li>API token is valid and starts with <code>ser.</code></li>
          <li>Token has <strong>Organisation</strong> scope (not Environment)</li>
          <li>API URL is correct (default: <code>https://api.flagsmith.com/api/v1</code>)</li>
          <li>Run <code>orqesta status</code> to verify connection</li>
        </ul>
      </Panel>

      <SubHeading>No drift detected but I see differences</SubHeading>
      <Panel style={{ padding: '16px 20px', background: 'var(--ivory)', marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--ink-600)', lineHeight: 1.6, margin: 0 }}>
          Orqesta only compares feature-level config (enabled state, remote config values, MV allocations).
          It does <strong>not</strong> compare segment overrides, identity overrides, or change requests.
        </p>
      </Panel>

      <SubHeading>Stale plan error when applying sync</SubHeading>
      <Panel style={{ padding: '16px 20px', background: 'var(--status-warn-bg)', border: '1px solid #D9C88C', marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--ink-700)', lineHeight: 1.6, margin: 0 }}>
          <strong>⚠ This is a safety feature.</strong> Another user modified the target environment between
          when you created the plan and when you tried to apply it. Re-run <code>orqesta sync</code> to generate
          a fresh plan with the latest state.
        </p>
      </Panel>

      {/* Footer links */}
      <div style={{
        marginTop: '64px',
        paddingTop: '32px',
        borderTop: 'var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="https://github.com/sohansarkar07/orqesta" target="_blank" rel="noopener noreferrer" style={{
            fontSize: '14px',
            color: 'var(--ink-500)',
            textDecoration: 'none',
          }}>
            GitHub →
          </a>
          <a href="https://github.com/sohansarkar07/orqesta/issues" target="_blank" rel="noopener noreferrer" style={{
            fontSize: '14px',
            color: 'var(--ink-500)',
            textDecoration: 'none',
          }}>
            Report Issue →
          </a>
        </div>
        <Link to="/">
          <Button variant="secondary" size="sm">← Back to Home</Button>
        </Link>
      </div>
    </article>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function Docs() {
  return (
    <div className="docs-layout" style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '48px 48px 80px',
      display: 'flex',
      gap: '64px',
    }}>
      <DocsSidebar activeSection="introduction" />
      <DocsContent />
    </div>
  );
}
