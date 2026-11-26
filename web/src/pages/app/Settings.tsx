import { useState, FormEvent } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { useConnectionStatus } from '../../lib/hooks';
import { api } from '../../lib/api';

export default function Settings() {
  const connectionStatus = useConnectionStatus();
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('https://api.flagsmith.com/api/v1');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState(false);

  async function handleConnect(e: FormEvent) {
    e.preventDefault();
    setConnectError(null);
    setConnectSuccess(false);
    setConnecting(true);

    try {
      await api.connect(apiKey, apiUrl);
      setConnectSuccess(true);
      setApiKey('');
      window.location.reload(); // refresh to update status
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    try {
      await api.disconnect();
      window.location.reload();
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Disconnect failed');
    }
  }

  const isConnected = connectionStatus.status === 'success' && connectionStatus.data.connected;

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 500 }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-400)', marginTop: '4px' }}>
          Configure Orqesta's connection to Flagsmith
        </p>
      </div>

      {/* Connection status */}
      {connectionStatus.status === 'loading' && (
        <Panel style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--ink-500)' }}>Checking connection...</p>
        </Panel>
      )}

      {connectionStatus.status === 'error' && (
        <Panel style={{ padding: '16px 20px', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC' }}>
          <p style={{ fontSize: '13px', color: 'var(--status-error)' }}>✗ {connectionStatus.error}</p>
        </Panel>
      )}

      {connectionStatus.status === 'success' && (
        <Panel style={{ padding: '20px 24px' }}>
          {isConnected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--status-ok)' }}>✓</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-900)' }}>Connected to Flagsmith</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--ink-500)' }}>
                <div>API Key: <code style={{ background: 'var(--ivory)', padding: '2px 6px', borderRadius: '3px', fontFamily: '"SF Mono", monospace' }}>{connectionStatus.data.maskedKey}</code></div>
                <div>API URL: <code style={{ background: 'var(--ivory)', padding: '2px 6px', borderRadius: '3px', fontFamily: '"SF Mono", monospace' }}>{connectionStatus.data.apiUrl}</code></div>
                {connectionStatus.data.organisations && connectionStatus.data.organisations.length > 0 && (
                  <div>Organisations: {connectionStatus.data.organisations.map((o) => o.name).join(', ')}</div>
                )}
              </div>
              <Button variant="secondary" size="sm" style={{ marginTop: '16px' }} onClick={handleDisconnect}>
                Disconnect
              </Button>
            </>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
              Not connected. Enter your Flagsmith API key below.
            </div>
          )}
        </Panel>
      )}

      {/* Connect form */}
      <Panel style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>
          {isConnected ? 'Update connection' : 'Connect to Flagsmith'}
        </h2>
        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="apiKey" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              Organisation API Token
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ser.xxxxxxxxxxxxxxxx"
              style={{
                width: '100%',
                padding: '9px 14px',
                fontSize: '13px',
                fontFamily: '"SF Mono", monospace',
                border: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--ivory)',
                color: 'var(--ink-900)',
              }}
            />
            <p style={{ fontSize: '11px', color: 'var(--ink-300)', marginTop: '4px' }}>
              Get this from: Flagsmith dashboard → Organisation Settings → API Keys
            </p>
          </div>

          <div>
            <label htmlFor="apiUrl" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--ink-700)', marginBottom: '6px' }}>
              API URL (optional)
            </label>
            <input
              id="apiUrl"
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.flagsmith.com/api/v1"
              style={{
                width: '100%',
                padding: '9px 14px',
                fontSize: '13px',
                fontFamily: '"SF Mono", monospace',
                border: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--ivory)',
                color: 'var(--ink-900)',
              }}
            />
            <p style={{ fontSize: '11px', color: 'var(--ink-300)', marginTop: '4px' }}>
              For self-hosted Flagsmith instances
            </p>
          </div>

          {connectError && (
            <div style={{ padding: '10px 14px', background: 'var(--status-err-bg)', border: '1px solid #D9BCBC', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--status-error)' }}>
              ✗ {connectError}
            </div>
          )}

          {connectSuccess && (
            <div style={{ padding: '10px 14px', background: 'var(--status-ok-bg)', border: '1px solid #C2D9BC', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--status-ok)' }}>
              ✓ Connected successfully
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={connecting || !apiKey.trim()}
            style={{ opacity: connecting || !apiKey.trim() ? 0.5 : 1 }}
          >
            {connecting ? 'Connecting...' : isConnected ? 'Update connection' : 'Connect'}
          </Button>
        </form>
      </Panel>

      {/* Help */}
      <Panel style={{ padding: '16px 20px', background: 'var(--ivory)' }}>
        <p style={{ fontSize: '12px', color: 'var(--ink-500)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--ink-700)' }}>Note:</strong> The API token is stored server-side in memory.
          It will be cleared when the Orqesta server restarts. For persistent storage, set the{' '}
          <code style={{ background: 'var(--ivory-mid)', padding: '2px 4px', borderRadius: '3px', fontFamily: '"SF Mono", monospace' }}>FLAGSMITH_API_KEY</code> environment variable.
        </p>
      </Panel>
    </div>
  );
}
