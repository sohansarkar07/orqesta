import { Routes, Route, Navigate } from 'react-router-dom';
import { Nav } from './components/ui/Nav';
import Landing from './pages/Landing';
import Docs from './pages/Docs';
import CLI from './pages/CLI';
import MCP from './pages/MCP';
import AppLayout from './pages/app/AppLayout';
import Overview from './pages/app/Overview';
import Compare from './pages/app/Compare';
import Sync from './pages/app/Sync';
import Forensics from './pages/app/Forensics';
import Policy from './pages/app/Policy';
import Settings from './pages/app/Settings';

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/cli" element={<CLI />} />
        <Route path="/mcp" element={<MCP />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="compare"   element={<Compare />} />
          <Route path="sync"      element={<Sync />} />
          <Route path="forensics" element={<Forensics />} />
          <Route path="policy"    element={<Policy />} />
          <Route path="settings"  element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
