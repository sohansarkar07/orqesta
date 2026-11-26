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
      gridTemplateColumns: '1fr 1fr',
      overflow: 'hidden',
    }}>
      {/* Left — text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px 80px 80px',
        gap: '32px',
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--sage-pale)',
          border: '1px solid #C2D9BC',
          borderRadius: '100px',
          padding: '5px 14px',
          width: 'fit-content',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sage)', display: 'block' }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--olive)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Flagsmith Configuration Safety
          </span>
        </div>

        {/* Heading */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: 'var(--ink-900)',
          }}>
            Ship flags with<br />
            <em style={{ fontStyle: 'italic', color: 'var(--olive)' }}>confidence.</em>
          </h1>
          <p style={{
            marginTop: '20px',
            fontSize: '17px',
            lineHeight: 1.65,
            color: 'var(--ink-500)',
            maxWidth: '400px',
            fontWeight: 300,
          }}>
            Orqesta detects configuration drift, investigates changes with structured
            before-and-after history, and enforces your team's policies — before
            anything reaches production.
          </p>
        </div>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/app">
            <Button variant="primary" size="lg">Open Dashboard</Button>
          </Link>
          <a href="https://github.com/sohansarkar07/orqesta" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg">
              <GitHubIcon />
              View on GitHub
            </Button>
          </a>
        </div>

        {/* Social proof line */}
        <p style={{ fontSize: '12px', color: 'var(--ink-300)', letterSpacing: '0.02em' }}>
          Open-source · Self-hosted compatible · 76 unit tests
        </p>
      </div>

      {/* Right — illustration */}
      <div style={{
        background: 'var(--ivory-mid)',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: 'var(--border)',
      }}>
        <LandscapeIllustration />
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
      <Footer />
    </>
  );
}
