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
      background: 'rgba(247,245,240,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: 'var(--border-light)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <OrquestaLogo />
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '20px',
            fontWeight: 500,
            color: 'var(--ink-900)',
            letterSpacing: '-0.01em',
          }}>
            Orqesta
          </span>
        </Link>

        {/* Nav links */}
        {!isApp && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {['Features', 'Architecture', 'Docs'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{
                fontSize: '14px',
                color: 'var(--ink-500)',
                fontWeight: 400,
                transition: 'color 0.15s',
              }}>
                {item}
              </a>
            ))}
          </nav>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isApp ? (
            <Link to="/">
              <Button variant="ghost" size="sm">← Landing</Button>
            </Link>
          ) : (
            <>
              <a href="https://github.com/sohansarkar07/orqesta" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">GitHub</Button>
              </a>
              <Link to="/app">
                <Button variant="primary" size="sm">Open Dashboard</Button>
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
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="var(--ink-900)" />
      <circle cx="14" cy="14" r="5" stroke="#A8C49A" strokeWidth="1.5" fill="none" />
      <circle cx="14" cy="14" r="2" fill="#A8C49A" />
      <line x1="14" y1="6" x2="14" y2="9" stroke="#A8C49A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="19" x2="14" y2="22" stroke="#A8C49A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="14" x2="9" y2="14" stroke="#A8C49A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="14" x2="22" y2="14" stroke="#A8C49A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
