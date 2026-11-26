import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/app',           label: 'Overview',    icon: '◎' },
  { to: '/app/compare',   label: 'Compare',     icon: '⇄' },
  { to: '/app/sync',      label: 'Sync',        icon: '↑' },
  { to: '/app/forensics', label: 'Forensics',   icon: '⌕' },
  { to: '/app/policy',    label: 'Policy',      icon: '✦' },
];

export function Sidebar() {
  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      background: 'var(--white)',
      borderRight: 'var(--border)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '24px',
    }}>
      {/* Demo banner */}
      <div style={{
        margin: '0 16px 20px',
        padding: '8px 12px',
        background: 'var(--sage-pale)',
        border: '1px solid #C2D9BC',
        borderRadius: 'var(--radius-sm)',
      }}>
        <p style={{ fontSize: '11px', color: 'var(--olive)', fontWeight: 500, letterSpacing: '0.03em' }}>
          DEMO MODE
        </p>
        <p style={{ fontSize: '11px', color: 'var(--ink-500)', marginTop: '2px', lineHeight: 1.4 }}>
          Showing sample data
        </p>
      </div>

      <nav style={{ padding: '0 8px', flexGrow: 1 }}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '2px',
              fontSize: '13px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--ink-900)' : 'var(--ink-500)',
              background: isActive ? 'var(--ivory)' : 'transparent',
              transition: 'all 0.12s',
              textDecoration: 'none',
            })}
          >
            <span style={{ fontSize: '15px', width: '18px', textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom env selector */}
      <div style={{
        margin: '16px',
        padding: '12px',
        background: 'var(--ivory)',
        border: 'var(--border)',
        borderRadius: 'var(--radius-md)',
      }}>
        <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: '6px' }}>
          Project
        </p>
        <div style={{ fontSize: '13px', color: 'var(--ink-700)', fontWeight: 500 }}>FlagGuard Demo</div>
        <div style={{ fontSize: '11px', color: 'var(--ink-300)', marginTop: '2px' }}>Flagsmith Cloud</div>
      </div>
    </aside>
  );
}
