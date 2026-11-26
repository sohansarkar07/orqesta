import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './Button';

export function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isApp = pathname.startsWith('/app');
  const isLanding = pathname === '/';

  function handleSectionLink(sectionId: string) {
    if (isLanding) {
      // already on landing — just scroll
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // navigate to landing then scroll after render
      navigate('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

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
        >
          <img
            src="/orqesta-logo.jpg"
            alt="Orqesta"
            style={{
              height: '36px',
              width: 'auto',
              borderRadius: '6px',
              display: 'block',
            }}
          />
        </Link>

        {/* Nav links */}
        {!isApp && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {[
              { label: 'How it works', sectionId: 'features' },
              { label: 'FAQ', sectionId: 'faq' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleSectionLink(item.sectionId)}
                style={{
                  fontSize: '15px',
                  color: 'var(--ink-600)',
                  fontWeight: 400,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-900)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-600)'; }}
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/docs"
              style={{
                fontSize: '15px',
                color: 'var(--ink-600)',
                fontWeight: 400,
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-900)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-600)'; }}
            >
              Docs
            </Link>
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


