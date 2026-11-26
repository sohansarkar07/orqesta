import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { LandscapeIllustration } from '../components/landing/Illustration';

/* ─── Token strip ─────────────────────────────────────────────────────────── */
function TokenStrip() {
  const tokens = [
    'Environment Drift Detection',
    'Selective Synchronisation',
    'Stale-Plan Protection',
    'Configuration Forensics',
    'Policy Linting',
    'CI-Ready Exit Codes',
  ];
  return (
    <div style={{
      borderTop: 'var(--border)',
      borderBottom: 'var(--border)',
      background: 'var(--ivory-mid)',
      padding: '12px 0',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        gap: '48px',
        animation: 'scroll 28s linear infinite',
        whiteSpace: 'nowrap',
        width: 'max-content',
      }}>
        {[...tokens, ...tokens].map((t, i) => (
          <span key={i} style={{
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-500)',
          }}>
            <span style={{ color: 'var(--sage)', marginRight: '12px' }}>◆</span>
            {t}
          </span>
        ))}
      </div>
      <style>{`@keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      overflow: 'hidden',
    }}>
      {/* Left — text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 72px 80px 96px',
        gap: '28px',
        maxWidth: '660px',
      }}>
        {/* Heading */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(48px, 6vw, 72px)',
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: 'var(--ink-900)',
            marginBottom: '24px',
          }}>
            Detect drift.<br />
            Sync safely.<br />
            Ship with <em style={{ fontStyle: 'italic', color: 'var(--olive)' }}>confidence.</em>
          </h1>
          <p style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: 'var(--ink-500)',
            maxWidth: '480px',
            fontWeight: 300,
          }}>
            Orqesta brings configuration safety to Flagsmith. Compare environments,
            investigate changes with forensics, and enforce policies — all before
            production deploys.
          </p>
        </div>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
          <Link to="/app">
            <Button variant="primary" size="lg" style={{ fontSize: '15px', padding: '14px 32px' }}>
              Launch Dashboard
            </Button>
          </Link>
          <a href="https://github.com/sohansarkar07/orqesta" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg" style={{ fontSize: '15px', padding: '14px 24px', gap: '10px' }}>
              <GitHubIcon />
              GitHub
            </Button>
          </a>
        </div>

        {/* Meta tags */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          {['Open Source', 'Self-Hosted Ready', '95 Tests'].map((tag) => (
            <span key={tag} style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-300)',
              padding: '6px 12px',
              background: 'var(--ivory)',
              borderRadius: '100px',
              border: 'var(--border-light)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right — interactive demo panel */}
      <div style={{
        background: 'linear-gradient(135deg, #E8E4DC 0%, #D6D2CA 100%)',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: 'var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 48px',
      }}>
        {/* Background texture */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }} />

        {/* Demo card — drift comparison */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(26,25,22,0.15), 0 4px 12px rgba(26,25,22,0.08)',
          overflow: 'hidden',
        }}>
          {/* Card header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: 'var(--border-light)',
            background: 'var(--ivory)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5B8A4A' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-700)', fontFamily: '"SF Mono", monospace' }}>
                COMPARE RESULTS
              </span>
            </div>
            <div style={{
              padding: '4px 10px',
              background: 'var(--status-warn-bg)',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--status-warn)',
            }}>
              4 DIFFERENCES
            </div>
          </div>

          {/* Environment labels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            padding: '16px 24px 12px',
            alignItems: 'center',
            gap: '12px',
            borderBottom: 'var(--border-light)',
            background: 'var(--ivory)',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staging</span>
            <span style={{ fontSize: '14px', color: 'var(--ink-300)' }}>→</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--olive)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Production</span>
          </div>

          {/* Drift rows */}
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { flag: 'checkout_redesign', type: 'Enabled state', color: '#D9C88C' },
              { flag: 'dark_mode', type: 'Value change', color: '#A8C49A' },
              { flag: 'new_onboarding', type: 'Missing in target', color: '#D9BCBC' },
              { flag: 'api_rate_limit', type: 'Value change', color: '#A8C49A' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '12px',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--ivory)',
                borderRadius: '8px',
                border: 'var(--border-light)',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: '"SF Mono", monospace', color: 'var(--ink-900)' }}>
                    {item.flag}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-400)', marginTop: '3px' }}>
                    {item.type}
                  </div>
                </div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: item.color,
                }} />
              </div>
            ))}
          </div>

          {/* Footer action */}
          <div style={{
            padding: '14px 24px',
            borderTop: 'var(--border-light)',
            background: 'var(--ivory)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <button style={{
              padding: '8px 16px',
              background: 'var(--ink-900)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}>
              Generate Sync Plan →
            </button>
          </div>
        </div>

        {/* Floating label */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          right: '32px',
          padding: '8px 14px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '100px',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-500)',
          boxShadow: '0 2px 8px rgba(26,25,22,0.1)',
        }}>
          Live Demo
        </div>
      </div>
    </section>
  );
}

/* ─── Feature cards ───────────────────────────────────────────────────────── */
interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
  command: string;
  accent: string;
}

function FeatureCard({ number, title, description, command, accent }: FeatureCardProps) {
  return (
    <Panel style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '11px',
          color: 'var(--ink-300)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {number}
        </span>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: accent, border: '2px solid white',
          boxShadow: `0 0 0 1px ${accent}`,
        }} />
      </div>
      <h3 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--ink-900)' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--ink-500)', lineHeight: 1.65, flexGrow: 1 }}>{description}</p>
      <code style={{
        display: 'block',
        fontFamily: '"SF Mono", "Fira Code", monospace',
        fontSize: '12px',
        background: 'var(--ivory)',
        border: 'var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        color: 'var(--ink-700)',
      }}>
        {command}
      </code>
    </Panel>
  );
}

function Features() {
  return (
    <section id="features" style={{ padding: '100px 0', background: 'var(--ivory)' }}>
      <div className="container">
        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '12px' }}>
            What it does
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500 }}>
            Three connected capabilities
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <FeatureCard
            number="01"
            title="Drift Detection & Selective Sync"
            description="Compare any two Flagsmith environments. See exactly what differs — enabled state, remote config values, multivariate allocations. Generate a typed plan, preview it, then apply with a stale-plan safety check."
            command="orqesta compare Staging Production"
            accent="var(--sage)"
          />
          <FeatureCard
            number="02"
            title="Configuration Forensics"
            description="Inspect the full audit history for any feature flag. Fetches structured before/after field-level diffs from the Flagsmith API when available. Actor, timestamp, environment and change type always shown."
            command="orqesta inspect checkout_redesign --with-changes"
            accent="var(--olive)"
          />
          <FeatureCard
            number="03"
            title="Policy Engine & Linting"
            description="Define configuration standards in a YAML policy file. Five built-in rules: naming, descriptions, archived flags, MV allocations, cross-environment parity. CI-safe exit codes."
            command="orqesta lint Production --policy ./orqesta-policy.yml"
            accent="var(--forest)"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Safety callout ──────────────────────────────────────────────────────── */
function SafetySection() {
  const checks = [
    'Stale-plan detection: target state snapshot compared before every apply',
    'Dry-run never writes to Flagsmith',
    'Interactive y/N gate on production changes',
    'API keys masked in all output, never logged',
    'Post-apply verification re-fetches and re-diffs',
    'Partial failures reported individually — never silently swallowed',
  ];

  return (
    <section style={{
      background: 'var(--forest)',
      padding: '80px 0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle background rings */}
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(168,196,154,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '280px', height: '280px', borderRadius: '50%', border: '1px solid rgba(168,196,154,0.08)', pointerEvents: 'none' }} />

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage-light)', marginBottom: '12px' }}>
              Safe by default
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 500, color: 'var(--ivory)', lineHeight: 1.1 }}>
              Production changes<br />
              <em style={{ fontStyle: 'italic', color: 'var(--sage-light)' }}>never happen by accident.</em>
            </h2>
            <p style={{ marginTop: '20px', fontSize: '15px', color: '#A09C94', lineHeight: 1.65, maxWidth: '360px' }}>
              Orqesta was designed around one rule: if you are not sure, do less and ask first.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {checks.map((check, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(168,196,154,0.07)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(168,196,154,0.12)',
              }}>
                <span style={{ color: 'var(--sage-light)', fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '13px', color: '#C8C4BC', lineHeight: 1.5 }}>{check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Architecture section ────────────────────────────────────────────────── */
function Architecture() {
  const modules = [
    { label: 'CLI', desc: '11 commands', color: 'var(--ink-900)' },
    { label: 'Drift Engine', desc: 'comparator + normaliser', color: 'var(--sage)' },
    { label: 'Sync Engine', desc: 'planner + executor', color: 'var(--olive)' },
    { label: 'Forensics', desc: 'audit + change_details', color: 'var(--forest)' },
    { label: 'Policy Engine', desc: '5 rules + loader', color: '#7A6B4A' },
    { label: 'Flagsmith API', desc: 'Management API client', color: 'var(--ink-500)' },
  ];

  return (
    <section id="architecture" style={{ padding: '100px 0', background: 'var(--ivory-mid)' }}>
      <div className="container">
        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '12px' }}>
            How it's built
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500 }}>
            Modular TypeScript architecture
          </h2>
          <p style={{ marginTop: '12px', fontSize: '15px', color: 'var(--ink-500)', maxWidth: '480px', lineHeight: 1.65 }}>
            Every module is independently tested. The CLI consumes the same core logic as the web dashboard.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {modules.map((m) => (
            <Panel key={m.label} style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '8px', height: '44px', borderRadius: '4px', background: m.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-900)' }}>{m.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-300)', marginTop: '2px' }}>{m.desc}</div>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Install section ─────────────────────────────────────────────────────── */
function Install() {
  return (
    <section id="docs" style={{ padding: '100px 0', background: 'var(--ivory)' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '12px' }}>
          Get started
        </p>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, marginBottom: '40px' }}>
          Up and running in two minutes
        </h2>

        {[
          { label: '1. Install', code: 'npm install -g orqesta' },
          { label: '2. Set your Flagsmith API token', code: 'export FLAGSMITH_API_KEY="your_organisation_api_token"' },
          { label: '3. Verify connectivity', code: 'orqesta doctor' },
          { label: '4. Detect drift', code: 'orqesta compare Staging Production' },
          { label: '5. Run policy checks', code: 'orqesta lint Production' },
        ].map((step) => (
          <div key={step.label} style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              {step.label}
            </p>
            <Panel style={{ padding: '14px 20px' }}>
              <code style={{
                fontFamily: '"SF Mono", "Fira Code", monospace',
                fontSize: '13px',
                color: 'var(--ink-700)',
                display: 'block',
              }}>
                <span style={{ color: 'var(--ink-300)', userSelect: 'none' }}>$ </span>{step.code}
              </code>
            </Panel>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── FAQ ─────────────────────────────────────────────────────────────────── */
function FAQ() {
  const faqs = [
    {
      q: 'What is Orqesta?',
      a: 'Orqesta is an open-source CLI and web dashboard that extends Flagsmith with drift detection, selective sync, audit forensics, and policy enforcement.',
    },
    {
      q: 'Does it work with self-hosted Flagsmith?',
      a: 'Yes. Set FLAGSMITH_API_URL to your self-hosted instance URL. The included docker-compose.yml also spins up a full self-hosted Flagsmith stack alongside Orqesta.',
    },
    {
      q: 'What is stale-plan protection?',
      a: 'When you generate a sync plan, Orqesta snapshots the target environment state. Before applying, it re-checks for concurrent changes. If another user modified the target in the meantime, those operations are skipped — no silent overwrites.',
    },
    {
      q: 'Can I use Orqesta in CI/CD pipelines?',
      a: 'Yes. The lint command exits with code 1 on policy errors, making it ideal as a CI gate. Use --yes to skip interactive prompts in automated pipelines.',
    },
    {
      q: 'Is my Flagsmith API token safe?',
      a: 'Yes. API tokens are stored server-side only and never sent to the browser. All responses mask the token (e.g. ser.***abc123). The browser only ever sees the masked version.',
    },
    {
      q: 'What is the MCP bundle?',
      a: 'The MCP (Model Context Protocol) bundle lets you connect AI clients like Claude Desktop, Cursor, Kiro, or VS Code directly to Orqesta. Your AI agent can then compare environments, run policy checks, and inspect audit logs as part of a conversation.',
    },
  ];

  return (
    <section id="faq" style={{ padding: '100px 0', background: 'var(--ivory)' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '12px' }}>
            FAQ
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500 }}>
            Frequently asked questions
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div style={{
      padding: '28px 0',
      borderBottom: 'var(--border-light)',
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '48px',
      alignItems: 'start',
    }}>
      <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-900)', lineHeight: 1.4 }}>
        {q}
      </p>
      <p style={{ fontSize: '15px', color: 'var(--ink-500)', lineHeight: 1.7 }}>
        {a}
      </p>
    </div>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      borderTop: 'var(--border)',
      padding: '40px 0',
      background: 'var(--ivory-mid)',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--ink-900)' }}>Orqesta</span>
          <span style={{ color: 'var(--ink-300)', fontSize: '12px' }}>v0.1.0</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: 'GitHub', href: 'https://github.com/sohansarkar07/orqesta' },
            { label: 'MIT License', href: 'https://github.com/sohansarkar07/orqesta/blob/main/LICENSE' },
          ].map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '13px', color: 'var(--ink-400)', transition: 'color 0.15s' }}>
              {link.label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink-300)' }}>
          Built for Toggle Wars · Track 03
        </p>
      </div>
    </footer>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <>
      <TokenStrip />
      <Hero />
      <Features />
      <SafetySection />
      <Architecture />
      <Install />
      <FAQ />
      <Footer />
    </>
  );
}
