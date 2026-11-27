import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/app',           label: 'Overview',   icon: '◎' },
  { to: '/app/compare',   label: 'Compare',    icon: '⇄' },
  { to: '/app/sync',      label: 'Sync',       icon: '↑' },
  { to: '/app/forensics', label: 'Forensics',  icon: '⌕' },
  { to: '/app/policy',    label: 'Policy',     icon: '✦' },
  { to: '/app/audience',  label: 'Audience',   icon: '⚑' },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay — mobile only */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 199,
            background: 'rgba(26,25,22,0.4)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        className={`sidebar${open ? ' open' : ''}`}
        style={{
          width: '220px',
          flexShrink: 0,
          background: 'var(--white)',
          borderRight: 'var(--border)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '24px',
        }}
      >
        <nav style={{ padding: '0 8px', flexGrow: 1 }}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              onClick={onClose}
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
      </aside>
    </>
  );
}
