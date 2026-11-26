import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/dashboard/Sidebar';

export default function AppLayout() {
  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 60px)',
      overflow: 'hidden',
      background: 'var(--ivory)',
    }}>
      <Sidebar />
      <main style={{
        flexGrow: 1,
        overflowY: 'auto',
        background: 'var(--ivory)',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
