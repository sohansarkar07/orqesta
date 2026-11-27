import { Link, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { Button } from './Button';

export function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isApp = pathname.startsWith('/app');
  const isLanding = pathname === '/';
  const [menuOpen, setMenuOpen] = React.useState(false);

  function handleSectionLink(sectionId: string) {
    setMenuOpen(false);
    if (isLanding) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  // Close menu on route change
  React.useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(26,25,22,0.06)',
    }}>
      <div
        className="nav-inner"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img
            src="/orqesta-logo.jpg"
            alt="Orqesta"
            style={{ height: '42px', width: 'auto', borderRadius: '6px', display: 'block' }}
          />
        </Link>

        {/* Desktop nav links */}
        {!isApp && (
          <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {[
              { label: 'How it works', sectionId: 'features' },
              { label: 'FAQ', sectionId: 'faq' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleSectionLink(item.sectionId)}
                style={{
                  fontSize: '13px', color: 'rgba(26,25,22,0.65)', fontWeight: 400,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'inherit', transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-900)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(26,25,22,0.65)'; }}
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/docs"
              style={{ fontSize: '13px', color: 'rgba(26,25,22,0.65)', fontWeight: 400, textDecoration: 'none', transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-900)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(26,25,22,0.65)'; }}
            >
              Docs
            </Link>
          </nav>
        )}

        {/* Desktop CTA */}
        <div className="nav-cta-full" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isApp ? (
            <Link to="/"><Button variant="ghost" size="sm" style={{ fontSize: '13px' }}>← Back</Button></Link>
          ) : (
            <>
              <Link to="/cli">
                <button style={{
                  padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                  color: 'rgba(26,25,22,0.75)', background: 'transparent',
                  border: '1px solid rgba(26,25,22,0.1)', borderRadius: '6px',
                  cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(26,25,22,0.2)'; e.currentTarget.style.background = 'rgba(26,25,22,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,25,22,0.1)'; e.currentTarget.style.background = 'transparent'; }}
                >Try CLI</button>
              </Link>
              <Link to="/mcp">
                <button style={{
                  padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                  color: '#4A7C59', background: 'rgba(76,175,80,0.08)',
                  border: '1px solid rgba(76,175,80,0.15)', borderRadius: '6px',
                  cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(76,175,80,0.14)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(76,175,80,0.08)'; }}
                >Get MCP Bundle</button>
              </Link>
              <Link to="/app">
                <button style={{
                  padding: '6px 14px', fontSize: '12px', fontWeight: 500,
                  color: 'white', background: 'var(--ink-900)', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-0.5px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,25,22,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >Open Dashboard</button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: hamburger */}
        <button
          className="nav-cta-mobile"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none', // shown via CSS
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px', borderRadius: '6px',
            flexDirection: 'column', gap: '5px', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--ink-700)', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
          <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--ink-700)', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--ink-700)', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          borderTop: '1px solid rgba(26,25,22,0.06)',
          background: 'rgba(255,255,255,0.97)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {!isApp && (
            <>
              {[
                { label: 'How it works', sectionId: 'features' },
                { label: 'FAQ', sectionId: 'faq' },
              ].map((item) => (
                <button key={item.label} onClick={() => handleSectionLink(item.sectionId)}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 8px', fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink-700)', borderRadius: '6px' }}>
                  {item.label}
                </button>
              ))}
              <Link to="/docs" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 8px', fontSize: '15px', color: 'var(--ink-700)', borderRadius: '6px', display: 'block' }}>
                Docs
              </Link>
              <div style={{ height: '1px', background: 'rgba(26,25,22,0.06)', margin: '8px 0' }} />
              <Link to="/cli" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 8px', fontSize: '15px', color: 'var(--ink-700)', borderRadius: '6px', display: 'block' }}>
                Try CLI
              </Link>
              <Link to="/mcp" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 8px', fontSize: '15px', color: '#4A7C59', borderRadius: '6px', display: 'block' }}>
                Get MCP Bundle
              </Link>
              <Link to="/app" onClick={() => setMenuOpen(false)}>
                <button style={{ width: '100%', marginTop: '8px', padding: '12px', fontSize: '14px', fontWeight: 500, color: 'white', background: 'var(--ink-900)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Open Dashboard
                </button>
              </Link>
            </>
          )}
          {isApp && (
            <Link to="/" onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 8px', fontSize: '15px', color: 'var(--ink-700)', borderRadius: '6px', display: 'block' }}>
              ← Back to home
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
