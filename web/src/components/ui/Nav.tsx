import { Link, useLocation } from 'react-router-dom';
import { Button } from './Button';

export function Nav() {
  const { pathname } = useLocation();
  const isApp = pathname.startsWith('/app');

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(26,25,22,0.08)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
      }}>
        {/* Logo */}
        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            const logo = e.currentTarget.querySelector('svg');
            if (logo) (logo as HTMLElement).style.transform = 'rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            const logo = e.currentTarget.querySelector('svg');
            if (logo) (logo as HTMLElement).style.transform = 'rotate(0deg)';
          }}
        >
          <OrquestaLogo />
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '21px',
            fontWeight: 500,
            color: 'var(--ink-900)',
            letterSpacing: '-0.02em',
          }}>
            Orqesta
          </span>
        </Link>

        {/* Nav links */}
        {!isApp && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {[
              { label: 'How it works', href: '#features' },
              { label: 'FAQ', href: '#architecture' },
              { label: 'Docs', href: '/docs', isRoute: true },
            ].map((item) => (
              item.isRoute ? (
                <Link
                  key={item.label}
                  to={item.href}
                  style={{
                    fontSize: '15px',
                    color: 'var(--ink-600)',
                    fontWeight: 400,
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--ink-900)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--ink-600)';
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <a 
                  key={item.label} 
                  href={item.href} 
                  style={{
                    fontSize: '15px',
                    color: 'var(--ink-600)',
                    fontWeight: 400,
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--ink-900)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--ink-600)';
                  }}
                >
                  {item.label}
                </a>
              )
            ))}
          </nav>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isApp ? (
            <Link to="/">
              <Button variant="ghost" size="sm" style={{ fontSize: '14px' }}>
                ← Back
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/cli">
                <button style={{
                  padding: '9px 18px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--ink-700)',
                  background: 'white',
                  border: '1px solid rgba(26,25,22,0.12)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(26,25,22,0.24)';
                  e.currentTarget.style.background = 'var(--ivory)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(26,25,22,0.12)';
                  e.currentTarget.style.background = 'white';
                }}
                >
                  Try CLI
                </button>
              </Link>
              <Link to="/mcp">
                <button style={{
                  padding: '9px 18px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--olive)',
                  background: 'var(--sage-pale)',
                  border: '1px solid #C2D9BC',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#C2D9BC';
                  e.currentTarget.style.borderColor = '#A8C49A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--sage-pale)';
                  e.currentTarget.style.borderColor = '#C2D9BC';
                }}
                >
                  Get MCP Bundle
                </button>
              </Link>
              <Link to="/app">
                <button style={{
                  padding: '9px 22px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'white',
                  background: 'var(--ink-900)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,25,22,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  Open Dashboard
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function OrquestaLogo() {
  return (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
      }}
    >
      <rect width="32" height="32" rx="8" fill="var(--ink-900)" />
      <circle cx="16" cy="16" r="6" stroke="#A8C49A" strokeWidth="1.8" fill="none" />
      <circle cx="16" cy="16" r="2.5" fill="#A8C49A" />
      <line x1="16" y1="6" x2="16" y2="10" stroke="#A8C49A" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="26" stroke="#A8C49A" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="6" y1="16" x2="10" y2="16" stroke="#A8C49A" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="22" y1="16" x2="26" y2="16" stroke="#A8C49A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
