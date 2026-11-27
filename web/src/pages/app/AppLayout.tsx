import { Outlet, useLocation } from 'react-router-dom';
import React from 'react';
import { Sidebar } from '../../components/dashboard/Sidebar';

const PAGE_TITLES: Record<string, string> = {
  '/app': 'Overview',
  '/app/compare': 'Compare',
  '/app/sync': 'Sync',
  '/app/forensics': 'Forensics',
  '/app/policy': 'Policy',
  '/app/audience': 'Audience Guard',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard';

  // Close sidebar on route change
  React.useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <div
      className="app-layout"
      style={{
        display: 'flex',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
        background: 'var(--ivory)',
      }}
    >
      {/* Mobile top bar */}
      <div
        className="mobile-topbar"
        style={{
          display: 'none', // shown via CSS on mobile
          position: 'fixed',
          top: '56px',
          left: 0,
          right: 0,
          zIndex: 150,
          height: '48px',
          background: 'var(--white)',
          borderBottom: 'var(--border)',
          alignItems: 'center',
          padding: '0 16px',
          gap: '12px',
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px', borderRadius: '6px',
            display: 'flex', flexDirection: 'column', gap: '5px',
          }}
          aria-label="Open navigation"
        >
          <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--ink-700)' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--ink-700)' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--ink-700)' }} />
        </button>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-900)' }}>{pageTitle}</span>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{
        flexGrow: 1,
        overflowY: 'auto',
        background: 'var(--ivory)',
        // On mobile, push content below the topbar
      }}>
        {/* Spacer for mobile topbar */}
        <div className="mobile-topbar-spacer" style={{ height: '0' }} />
        <Outlet />
      </main>
    </div>
  );
}
