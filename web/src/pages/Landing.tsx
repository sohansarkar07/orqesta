import { Link } from 'react-router-dom';
import React from 'react';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { LandscapeIllustration } from '../components/landing/Illustration';

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 1200 1227" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.828Z"/>
    </svg>
  );
}

/* â”€â”€â”€ Token strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
            <span style={{ color: 'var(--sage)', marginRight: '12px' }}>â—†</span>
            {t}
          </span>
        ))}
      </div>
      <style>{`@keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* â”€â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Hero() {
  return (
    <section style={{
      minHeight: 'calc(100vh - 56px)',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      overflow: 'hidden',
    }}
    className="hero-grid"
    >
      {/* Left â€” text */}
      <div
        className="hero-left"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 72px 80px 96px',
          gap: '28px',
        }}
      >
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
            investigate changes with forensics, and enforce policies â€” all before
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
          <a href="https://x.com/orqesta_flag" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg" style={{ fontSize: '15px', padding: '14px 20px', gap: '10px' }}>
              <XIcon />
              Follow
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

      {/* Right â€” demo video */}
      <div
        className="hero-right"
        style={{
          background: 'linear-gradient(135deg, #E8E4DC 0%, #D6D2CA 100%)',
          position: 'relative',
          overflow: 'hidden',
          borderLeft: 'var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 40px',
        }}>
        {/* Background texture */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }} />

        {/* Video */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(26,25,22,0.18), 0 4px 12px rgba(26,25,22,0.1)',
        }}>
          <video
            src="/orqesta-demo.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </div>
      </div>
    </section>
  );
}
/* â”€â”€â”€ Feature cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
    <section id="features" style={{ padding: '100px 0', background: 'var(--ivory)' }} className="section-pad">
      <div className="container">
        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '12px' }}>
            What it does
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500 }}>
            Three connected capabilities
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }} className="feature-grid">
          <FeatureCard
            number="01"
            title="Drift Detection & Selective Sync"
            description="Compare any two Flagsmith environments. See exactly what differs â€” enabled state, remote config values, multivariate allocations. Generate a typed plan, preview it, then apply with a stale-plan safety check."
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

/* â”€â”€â”€ Safety callout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SafetySection() {
  const checks = [
    'Stale-plan detection: target state snapshot compared before every apply',
    'Dry-run never writes to Flagsmith',
    'Interactive y/N gate on production changes',
    'API keys masked in all output, never logged',
    'Post-apply verification re-fetches and re-diffs',
    'Partial failures reported individually â€” never silently swallowed',
  ];

  return (
    <section style={{
      background: 'var(--forest)',
      padding: '80px 0',
      position: 'relative',
      overflow: 'hidden',
    }} className="safety-section">
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(168,196,154,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '280px', height: '280px', borderRadius: '50%', border: '1px solid rgba(168,196,154,0.08)', pointerEvents: 'none' }} />

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }} className="safety-grid">
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
                <span style={{ color: 'var(--sage-light)', fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>âœ“</span>
                <span style={{ fontSize: '13px', color: '#C8C4BC', lineHeight: 1.5 }}>{check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€ Architecture section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Architecture() {
  React.useEffect(() => {
    // Dynamically load and initialize mermaid
    const loadMermaid = async () => {
      if (typeof window !== 'undefined') {
        // Remove existing script if any
        const existingScript = document.querySelector('script[src*="mermaid"]');
        if (existingScript) {
          existingScript.remove();
        }

        // Load mermaid
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        script.async = true;
        script.onload = () => {
          if ((window as any).mermaid) {
            (window as any).mermaid.initialize({ 
              startOnLoad: true,
              theme: 'base',
              themeVariables: {
                primaryColor: '#E8F3E3',
                primaryTextColor: '#1A1916',
                primaryBorderColor: '#6B9E78',
                lineColor: '#A8C49A',
                secondaryColor: '#F7F5F2',
                tertiaryColor: '#fff',
                fontSize: '16px',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
              flowchart: {
                htmlLabels: true,
                curve: 'basis',
                padding: 30,
                nodeSpacing: 100,
                rankSpacing: 120,
              }
            });
            // Force render
            setTimeout(() => {
              (window as any).mermaid.run({
                querySelector: '.mermaid',
              });
            }, 100);
          }
        };
        document.head.appendChild(script);
      }
    };

    loadMermaid();
  }, []);

  return (
    <section id="architecture" style={{ padding: '100px 0', background: 'var(--ivory-mid)' }} className="section-pad">
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

        <div style={{ 
          background: 'white', 
          borderRadius: 'var(--radius-lg)', 
          border: 'var(--border)',
          padding: '64px 48px',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '500px',
          overflow: 'auto',
        }} className="arch-box">
          <div className="mermaid" style={{ width: '100%', maxWidth: '1100px' }}>
{`graph LR
    CLI["<b>CLI</b><br/><span style='font-size:13px;opacity:0.65'>11 commands</span>"]
    
    Drift["<b>Drift Engine</b><br/><span style='font-size:13px;opacity:0.65'>comparator + normaliser</span>"]
    Sync["<b>Sync Engine</b><br/><span style='font-size:13px;opacity:0.65'>planner + executor</span>"]
    Forensics["<b>Forensics</b><br/><span style='font-size:13px;opacity:0.65'>audit + change_details</span>"]
    Policy["<b>Policy Engine</b><br/><span style='font-size:13px;opacity:0.65'>5 rules + loader</span>"]
    
    API["<b>Flagsmith API</b><br/><span style='font-size:13px;opacity:0.65'>Management API client</span>"]
    
    CLI --> Drift
    CLI --> Sync
    CLI --> Forensics
    CLI --> Policy
    
    Drift --> API
    Sync --> API
    Forensics --> API
    Policy --> API
    
    style CLI fill:#1A1916,stroke:#1A1916,color:#fff,stroke-width:2px,padding:20px
    style Drift fill:#E8F3E3,stroke:#6B9E78,color:#1A1916,stroke-width:2px,padding:20px
    style Sync fill:#E8F3E3,stroke:#6B9E78,color:#1A1916,stroke-width:2px,padding:20px
    style Forensics fill:#E8F3E3,stroke:#6B9E78,color:#1A1916,stroke-width:2px,padding:20px
    style Policy fill:#F5F0E6,stroke:#7A6B4A,color:#1A1916,stroke-width:2px,padding:20px
    style API fill:#F7F5F2,stroke:#999,color:#1A1916,stroke-width:2px,padding:20px`}
          </div>
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€ Install section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Install() {
  return (
    <section id="docs" style={{ padding: '100px 0', background: 'var(--ivory)' }} className="section-pad">
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

/* â”€â”€â”€ FAQ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
      a: 'When you generate a sync plan, Orqesta snapshots the target environment state. Before applying, it re-checks for concurrent changes. If another user modified the target in the meantime, those operations are skipped â€” no silent overwrites.',
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
    <section id="faq" style={{ padding: '100px 0', background: 'var(--white)' }} className="section-pad">
      <div className="container" style={{ maxWidth: '920px' }}>
        <div style={{ marginBottom: '48px' }}>
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
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{
      borderBottom: '1px solid rgba(26,25,22,0.08)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '28px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 500, 
          color: 'var(--ink-900)', 
          lineHeight: 1.4,
          paddingRight: '24px',
        }}>
          {q}
        </span>
        <span style={{
          fontSize: '24px',
          color: open ? 'var(--sage)' : '#6B9E78',
          transition: 'all 0.2s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          flexShrink: 0,
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          +
        </span>
      </button>
      <div style={{
        maxHeight: open ? '400px' : '0',
        opacity: open ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}>
        <p style={{ 
          fontSize: '15px', 
          color: 'var(--ink-500)', 
          lineHeight: 1.7,
          paddingBottom: '28px',
        }}>
          {a}
        </p>
      </div>
    </div>
  );
}

/* â”€â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Footer() {
  const cols = [
    {
      heading: 'Product',
      links: [
        { label: 'Dashboard', href: '/app' },
        { label: 'CLI Reference', href: '/cli' },
        { label: 'MCP Bundle', href: '/mcp' },
        { label: 'Documentation', href: '/docs' },
        { label: 'FAQ', href: '/#faq' },
      ],
    },
    {
      heading: 'Features',
      links: [
        { label: 'Environment Compare', href: '/#features' },
        { label: 'Selective Sync', href: '/#features' },
        { label: 'Configuration Forensics', href: '/#features' },
        { label: 'Policy Linting', href: '/#features' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'GitHub Repository', href: 'https://github.com/sohansarkar07/orqesta', external: true },
        { label: 'MIT License', href: 'https://github.com/sohansarkar07/orqesta/blob/main/LICENSE', external: true },
        { label: 'Report Issue', href: 'https://github.com/sohansarkar07/orqesta/issues', external: true },
        { label: 'Flagsmith Docs', href: 'https://docs.flagsmith.com', external: true },
      ],
    },
  ];

  return (
    <footer style={{
      background: 'var(--ivory-mid)',
      borderTop: 'var(--border)',
      padding: '64px 0 32px',
    }}>
      <div className="container">
        {/* Top row: brand + columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '48px',
          marginBottom: '48px',
        }} className="footer-grid">

          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/orqesta-logo.jpg" alt="Orqesta" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-500)', lineHeight: 1.65, maxWidth: '220px' }}>
              Configuration safety for Flagsmith. Detect drift, sync safely, enforce policy.
            </p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <a
                href="https://x.com/orqesta_flag"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px',
                  border: 'var(--border)', borderRadius: '6px',
                  color: 'var(--ink-500)', background: 'var(--white)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink-900)'; e.currentTarget.style.color = 'var(--ink-900)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = 'var(--ink-500)'; }}
                aria-label="X (Twitter)"
              >
                <XIcon />
              </a>
              <a
                href="https://github.com/sohansarkar07/orqesta"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px',
                  border: 'var(--border)', borderRadius: '6px',
                  color: 'var(--ink-500)', background: 'var(--white)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink-900)'; e.currentTarget.style.color = 'var(--ink-900)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = 'var(--ink-500)'; }}
                aria-label="GitHub"
              >
                <GitHubIcon />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--ink-300)', margin: 0,
              }}>
                {col.heading}
              </p>
              {col.links.map((link) => (
                <a key={link.label}
                  href={link.href}
                  {...('external' in link && link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  style={{ fontSize: '14px', color: 'var(--ink-500)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-900)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-500)'; }}
                >{link.label}</a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: 'var(--border-light)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-400)' }}>
            Â© 2026 Orqesta. Open source under MIT.
          </span>
        </div>
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

/* â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
