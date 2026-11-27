import React from 'react';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';

/* â”€â”€â”€ Sidebar Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function DocsSidebar({ activeSection }: { activeSection: string }) {
  const [navOpen, setNavOpen] = React.useState(false);

  const sections = [
    { id: 'introduction',  label: 'Introduction' },
    { id: 'quick-start',   label: 'Quick Start' },
    { id: 'installation',  label: 'Installation' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'commands',      label: 'CLI Commands' },
    { id: 'compare',       label: 'Compare' },
    { id: 'sync',          label: 'Sync' },
    { id: 'forensics',     label: 'Forensics' },
    { id: 'policy',        label: 'Policy Engine' },
    { id: 'audience',      label: 'Audience Guard' },
    { id: 'mcp',           label: 'MCP Server' },
    { id: 'web-dashboard', label: 'Web Dashboard' },
    { id: 'docker',        label: 'Docker Deployment' },
    { id: 'api',           label: 'API Reference' },
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
        {/* Mobile toggle â€” shown via CSS */}
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
          {navOpen ? 'Hide â–²' : 'Show sections â–¼'}
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

/* â”€â”€â”€ Code Block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Section Heading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Main Docs Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function DocsContent() {
  return (
    <article className="docs-content" style={{ maxWidth: '740px', flexGrow: 1, minWidth: 0 }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 500, marginBottom: '16px' }}>Documentation</h1>
        <p style={{ fontSize: '18px', color: 'var(--ink-500)', lineHeight: 1.6 }}>
          Everything you need to know about Orqesta â€” from quick start to advanced usage.
        </p>
      </div>

      {/* â”€â”€â”€ Introduction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="introduction">Introduction</SectionHeading>
      <Paragraph>
        Orqesta is a configuration safety tool built on top of <a href="https://flagsmith.com" target="_blank" rel="noopener" style={{ color: 'var(--sage)' }}>Flagsmith</a>.
        It detects drift between environments, provides structured audit history, enforces policy rules, and
        evaluates whether individual users receive consistent feature flag results across environments.
      </Paragraph>
      <Paragraph>
        It ships as a TypeScript CLI, an Express API server, a React dashboard, and an MCP server for AI clients.
      </Paragraph>

      {/* â”€â”€â”€ Quick Start â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="quick-start">Quick Start</SectionHeading>
      <Paragraph>Run self-hosted Flagsmith + Orqesta together in one command:</Paragraph>
      <CodeBlock code={`git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
docker compose up -d
# Flagsmith: http://localhost:8000
# Orqesta:   http://localhost:3001`} />
      <Paragraph>
        After the containers start, open Flagsmith at <code>http://localhost:8000</code>, create an account,
        create a project with two environments, then get your Organisation API token from
        <strong> Organisation â†’ API Access â†’ Create API Key</strong>.
        Open Orqesta at <code>http://localhost:3001</code>, go to Settings, and paste the token.
      </Paragraph>

      {/* â”€â”€â”€ Installation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="installation">Installation</SectionHeading>

      <SubHeading>From source (recommended)</SubHeading>
      <CodeBlock code={`git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install
npm run build
npm link          # links 'orqesta' globally`} />

      <SubHeading>Start the web dashboard</SubHeading>
      <CodeBlock code={`# Terminal 1 â€” API server
npm run server     # http://localhost:3001

# Terminal 2 â€” web frontend
cd web && npm run dev  # http://localhost:5173`} />

      {/* â”€â”€â”€ Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="configuration">Configuration</SectionHeading>
      <Paragraph>
        Orqesta reads credentials from environment variables. The key variable is <code>ORQUESTA_API_TOKEN</code> â€”
        a Flagsmith <strong>Organisation API Token</strong>, obtained from Organisation â†’ API Access â†’ Create API Key.
      </Paragraph>

      <CodeBlock code={`# Required
export ORQUESTA_API_TOKEN="your_org_api_token"

# Optional â€” defaults to Flagsmith Cloud
export ORQUESTA_API_URL="https://api.flagsmith.com/api/v1"

# Self-hosted example
export ORQUESTA_API_URL="http://localhost:8000/api/v1"
export ORQUESTA_FLAGS_API_URL="http://localhost:8000/api/v1"

# Optional â€” improves performance for compare/lint
export ORQUESTA_ENVIRONMENT_KEY="ser.xxxxxxxxxxxxxxxx"`} />

      <Panel style={{ padding: '14px 18px', background: 'var(--ivory)', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-600)', margin: 0, lineHeight: 1.6 }}>
          The legacy <code>FLAGSMITH_API_KEY</code> and <code>FLAGSMITH_API_URL</code> variables are still accepted as
          fallbacks. Copy <code>.env.example</code> to <code>.env</code> for a full reference.
        </p>
      </Panel>

      <SubHeading>Stored config (interactive use)</SubHeading>
      <CodeBlock code={`orqesta config set-key your_token   # store token
orqesta config set-url https://...  # set API URL
orqesta config set-project 42       # set default project
orqesta config show                 # view config (key masked)`} />

      {/* â”€â”€â”€ Commands â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="commands">CLI Commands</SectionHeading>
      <CodeBlock code={`orqesta doctor                               # health check
orqesta environments                         # list environments
orqesta compare <source> <target>            # drift detection
orqesta plan <source> <target>               # generate sync plan
orqesta apply [--dry-run] [--yes]            # apply plan
orqesta verify <source> <target>             # post-sync check
orqesta inspect <feature> [--with-changes]   # audit history
orqesta history <feature>                    # full change history
orqesta lint <environment> [--policy <path>] # policy checks
orqesta guard <source> <target>              # audience guard (MV allocations)
orqesta eval <source> <target> [--init]      # identity evaluation
orqesta report <source> <target>             # export report`} />

      {/* â”€â”€â”€ Compare â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="compare">Compare</SectionHeading>
      <Paragraph>Detect configuration drift. Exits 0 if in sync, 1 if drift found â€” CI-safe.</Paragraph>
      <CodeBlock code={`orqesta compare Staging Production
orqesta compare Staging Production --project "My App"
orqesta compare Staging Production --json > drift.json`} />
      <ul style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-600)', marginBottom: '24px' }}>
        <li><strong>enabled_state</strong> â€” Flag enabled in one env but not the other</li>
        <li><strong>value_change</strong> â€” Remote config value differs</li>
        <li><strong>multivariate_allocation</strong> â€” MV percentage allocation differs</li>
        <li><strong>missing_in_target</strong> â€” Flag exists in source but not target</li>
        <li><strong>missing_in_source</strong> â€” Flag exists in target but not source</li>
      </ul>

      {/* â”€â”€â”€ Sync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="sync">Sync</SectionHeading>
      <Paragraph>Generate a typed sync plan, preview it, then apply only the operations you choose.</Paragraph>
      <CodeBlock code={`orqesta plan Staging Production      # generate plan
orqesta apply --dry-run              # preview â€” no writes to Flagsmith
orqesta apply                        # interactive y/N gate
orqesta apply --yes                  # skip prompt (CI)
orqesta verify Staging Production    # confirm environments are now in sync`} />
      <Panel style={{ padding: '14px 18px', background: 'var(--status-ok-bg)', border: '1px solid #C2D9BC', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--olive)', margin: 0, lineHeight: 1.6 }}>
          <strong>Stale-plan protection:</strong> A snapshot of the target state is taken at plan creation time.
          Before applying, Orqesta re-fetches the target and skips any operation where the target has changed since â€”
          no silent overwrites.
        </p>
      </Panel>

      {/* â”€â”€â”€ Forensics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="forensics">Forensics</SectionHeading>
      <Paragraph>Inspect the full audit history for any feature flag with structured before/after field values.</Paragraph>
      <CodeBlock code={`orqesta inspect dark_mode
orqesta inspect dark_mode --with-changes
orqesta inspect dark_mode --environment Production --limit 50`} />
      <Panel style={{ padding: '14px 18px', background: 'var(--status-warn-bg)', border: '1px solid #D9C88C', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-700)', margin: 0, lineHeight: 1.6 }}>
          <strong>Free-tier note:</strong> The Flagsmith audit API requires a paid plan. On free-tier Cloud,
          Orqesta shows a clear message with a link to Flagsmith's pricing. The dashboard Forensics page handles
          this gracefully with an inline explanation.
        </p>
      </Panel>

      {/* â”€â”€â”€ Policy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="policy">Policy Engine</SectionHeading>
      <Paragraph>Define governance rules as YAML, run them against any environment, enforce in CI.</Paragraph>
      <CodeBlock code={`orqesta lint Production
orqesta lint Production --policy ./examples/policy.yml
# exits 0 if no errors, 1 on violations`} />

      <SubHeading>Example policy file</SubHeading>
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
    rule: no_archived_flags_enabled

  - id: mv-allocations
    description: Multivariate allocations must sum to 100%
    severity: error
    rule: multivariate_allocations_sum

  - id: staging-prod-parity
    description: Features enabled in Staging must also be enabled in Production
    severity: warning
    rule: environment_parity
    parity_source: Staging
    environments:
      - Production`} />

      <ul style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-600)', marginBottom: '24px' }}>
        <li><code>naming_convention</code> â€” Enforce regex on flag names</li>
        <li><code>require_description</code> â€” Flags must have descriptions</li>
        <li><code>no_archived_flags_enabled</code> â€” Archived flags cannot be enabled</li>
        <li><code>multivariate_allocations_sum</code> â€” MV percentages must sum to 100%</li>
        <li><code>environment_parity</code> â€” Features enabled in source must exist in target</li>
      </ul>

      {/* â”€â”€â”€ Audience Guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="audience">Audience Guard</SectionHeading>
      <Paragraph>
        Two tools detect when multivariate flag changes could affect user exposure.
      </Paragraph>

      <SubHeading>Allocation comparison (orqesta guard)</SubHeading>
      <Paragraph>Compares the percentage allocations configured in Flagsmith between two environments.</Paragraph>
      <CodeBlock code={`orqesta guard Staging Production
# critical: shift â‰¥10pp  â†’ exits 1
# warning:  shift 1â€“9pp`} />

      <SubHeading>Identity evaluation (orqesta eval)</SubHeading>
      <Paragraph>
        Evaluates synthetic user identities against both environments via the Flagsmith Flags API and classifies
        any differences in the actual evaluation results.
      </Paragraph>
      <CodeBlock code={`# Create a starter fixture file
orqesta eval Development Production --init

# Edit orqesta-identities.yml, then:
orqesta eval Development Production

# Output example:
#   user_standard
#     [ENABLEMENT_REGRESSION] dark_mode â€” user loses access`} />

      <SubHeading>Fixture file format</SubHeading>
      <CodeBlock language="yaml" code={`version: 1
identities:
  - identifier: user_standard
    traits: []
  - identifier: user_premium
    traits:
      - key: plan
        value: premium
      - key: country
        value: India`} />

      <Paragraph>
        Supported regression types: <code>ENABLEMENT_REGRESSION</code>, <code>ENABLEMENT_CHANGE</code>,{' '}
        <code>VARIANT_CHANGE</code>, <code>VALUE_CHANGE</code>, <code>MISSING_FEATURE</code>.
      </Paragraph>

      {/* â”€â”€â”€ MCP Server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="mcp">MCP Server</SectionHeading>
      <Paragraph>
        Orqesta ships an MCP (Model Context Protocol) server that exposes its core tools to AI clients
        (Claude Desktop, Cursor, Kiro, VS Code, etc.).
      </Paragraph>

      <SubHeading>Setup</SubHeading>
      <CodeBlock code={`# Build the server first
npm install && npm run build

# Add to your MCP client config (replace /path/to/orqesta):
{
  "mcpServers": {
    "orqesta": {
      "command": "node",
      "args": ["/path/to/orqesta/dist/src/mcp/server.js"],
      "env": {
        "ORQUESTA_API_TOKEN": "your_flagsmith_org_token"
      }
    }
  }
}`} />

      <SubHeading>Available tools</SubHeading>
      <ul style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-600)', marginBottom: '24px' }}>
        <li><code>get_environments</code> â€” List all projects and environments</li>
        <li><code>compare_environments</code> â€” Detect drift between two environments</li>
        <li><code>run_policy_check</code> â€” Run policy rules against an environment</li>
        <li><code>run_audience_guard</code> â€” Compare MV allocation shifts</li>
        <li><code>eval_identities</code> â€” Identity-level evaluation across two environments</li>
      </ul>

      {/* â”€â”€â”€ Web Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="web-dashboard">Web Dashboard</SectionHeading>
      <Paragraph>Visual interface for all Orqesta capabilities.</Paragraph>
      <CodeBlock code={`# Development
export ORQUESTA_API_TOKEN="your_token"
npm run server      # API: http://localhost:3001
cd web && npm run dev  # UI:  http://localhost:5173

# Production (single port)
npm run build
npm run server:prod  # http://localhost:3001`} />
      <ul style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-600)', marginBottom: '24px' }}>
        <li><strong>Settings</strong> â€” Connect/disconnect, masked key display</li>
        <li><strong>Overview</strong> â€” Org, project, environment summary</li>
        <li><strong>Compare</strong> â€” Visual drift report</li>
        <li><strong>Sync</strong> â€” Interactive plan review and selective apply</li>
        <li><strong>Forensics</strong> â€” Audit log (requires paid Flagsmith plan)</li>
        <li><strong>Policy</strong> â€” Run checks with custom YAML editor</li>
        <li><strong>Audience</strong> â€” Allocation shift visualisation</li>
      </ul>

      {/* â”€â”€â”€ Docker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="docker">Docker Deployment</SectionHeading>
      <CodeBlock code={`docker compose up -d                # start Flagsmith + Orqesta
docker compose ps                   # check status
docker compose logs -f flagsmith    # view Flagsmith logs
docker compose down                 # stop all`} />
      <Paragraph>
        The included <code>docker-compose.yml</code> runs Flagsmith (port 8000), PostgreSQL (port 5432),
        and Orqesta (port 3001). After starting, open Flagsmith at <code>http://localhost:8000</code>,
        create your account and API key, then set it in Orqesta Settings
        with API URL <code>http://localhost:8000/api/v1</code>.
      </Paragraph>

      {/* â”€â”€â”€ API Reference â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="api">API Reference</SectionHeading>
      <Panel style={{ padding: '20px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', fontFamily: '"SF Mono", monospace' }}>
          {[
            ['POST', '/api/settings/connect'],
            ['GET',  '/api/settings/status'],
            ['POST', '/api/compare'],
            ['POST', '/api/sync/plan'],
            ['POST', '/api/sync/apply'],
            ['GET',  '/api/forensics/audit'],
            ['POST', '/api/policy/run'],
            ['POST', '/api/audience/check'],
            ['POST', '/api/audience/eval'],
          ].map(([method, path]) => (
            <div key={path}>
              <strong style={{ color: method === 'GET' ? 'var(--olive)' : 'var(--sage)' }}>{method}</strong>{' '}
              <code>{path}</code>
            </div>
          ))}
        </div>
      </Panel>

      <CodeBlock code={`curl -X POST http://localhost:3001/api/compare \\
  -H "Content-Type: application/json" \\
  -d '{"projectId": 10, "sourceEnvName": "Staging", "targetEnvName": "Production"}'`} />

      {/* â”€â”€â”€ Troubleshooting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionHeading id="troubleshooting">Troubleshooting</SectionHeading>

      <SubHeading>Cannot connect to Flagsmith</SubHeading>
      <Panel style={{ padding: '14px 18px', background: 'var(--ivory)', marginBottom: '16px' }}>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--ink-600)', lineHeight: 1.8 }}>
          <li>Run <code>orqesta doctor</code> â€” it shows exactly which check fails</li>
          <li>Token must be an Organisation API Token (from Organisation â†’ API Access), not an environment SDK key</li>
          <li>For self-hosted, confirm <code>ORQUESTA_API_URL</code> matches your instance</li>
        </ul>
      </Panel>

      <SubHeading>Policy shows "0 features checked"</SubHeading>
      <Panel style={{ padding: '14px 18px', background: 'var(--ivory)', marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--ink-600)', margin: 0, lineHeight: 1.6 }}>
          This was a known bug (fixed). Update to the latest version. If still occurring,
          ensure your API token can access <code>GET /projects/&#123;id&#125;/features/</code>.
        </p>
      </Panel>

      <SubHeading>Stale plan on apply</SubHeading>
      <Panel style={{ padding: '14px 18px', background: 'var(--status-warn-bg)', border: '1px solid #D9C88C', marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--ink-700)', margin: 0, lineHeight: 1.6 }}>
          <strong>This is a safety feature.</strong> The target environment changed after your plan was created.
          Re-run <code>orqesta plan</code> to generate a fresh plan.
        </p>
      </Panel>

      <SubHeading>Forensics returns server error</SubHeading>
      <Panel style={{ padding: '14px 18px', background: 'var(--ivory)', marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--ink-600)', margin: 0, lineHeight: 1.6 }}>
          The Flagsmith audit API requires a paid plan. This is a Flagsmith tier restriction, not an Orqesta bug.
          See <a href="https://docs.flagsmith.com/advanced-use/audit-trail" target="_blank" rel="noopener" style={{ color: 'var(--sage)' }}>Flagsmith Audit Trail docs</a>.
        </p>
      </Panel>

      {/* Footer */}
      <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: 'var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="https://github.com/sohansarkar07/orqesta" target="_blank" rel="noopener" style={{ fontSize: '14px', color: 'var(--ink-500)', textDecoration: 'none' }}>GitHub â†’</a>
          <a href="https://github.com/sohansarkar07/orqesta/issues" target="_blank" rel="noopener" style={{ fontSize: '14px', color: 'var(--ink-500)', textDecoration: 'none' }}>Report Issue â†’</a>
        </div>
        <Button variant="secondary" size="sm" onClick={() => window.history.back()}>â† Back</Button>
      </div>
    </article>
  );
}

/* â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
