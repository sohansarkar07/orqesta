import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';

type Client = 'claude-desktop' | 'cursor' | 'claude-code' | 'vscode' | 'kiro' | 'antigravity';

const clientConfigs = {
  'claude-desktop': {
    label: 'Claude Desktop',
    saveTo: {
      macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
      windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
    },
    config: `{
  "mcpServers": {
    "orqesta": {
      "command": "npx",
      "args": ["-y", "@orqesta/mcp-server"],
      "env": {
        "FLAGSMITH_API_KEY": "ser.xxxxxxxxxxxxxxxx",
        "FLAGSMITH_API_URL": "https://api.flagsmith.com/api/v1"
      }
    }
  }
}`,
  },
  'cursor': {
    label: 'Cursor',
    saveTo: {
      macos: '~/.cursor/mcp_config.json',
      windows: '%USERPROFILE%\\.cursor\\mcp_config.json',
    },
    config: `{
  "mcpServers": {
    "orqesta": {
      "command": "npx",
      "args": ["-y", "@orqesta/mcp-server"],
      "env": {
        "FLAGSMITH_API_KEY": "ser.xxxxxxxxxxxxxxxx"
      }
    }
  }
}`,
  },
  'claude-code': {
    label: 'Claude Code',
    saveTo: {
      macos: '~/.claude-code/mcp_settings.json',
      windows: '%APPDATA%\\ClaudeCode\\mcp_settings.json',
    },
    config: `{
  "servers": {
    "orqesta": {
      "command": "npx",
      "args": ["-y", "@orqesta/mcp-server"]
    }
  }
}`,
  },
  'vscode': {
    label: 'VS Code',
    saveTo: {
      macos: '~/.vscode/mcp.json',
      windows: '%APPDATA%\\Code\\User\\mcp.json',
    },
    config: `{
  "servers": {
    "orqesta": {
      "command": "npx",
      "args": ["-y", "@orqesta/mcp-server"],
      "env": {
        "FLAGSMITH_API_KEY": "your_api_key_here"
      }
    }
  }
}`,
  },
  'kiro': {
    label: 'Kiro',
    saveTo: {
      macos: '~/.kiro/settings/mcp.json',
      windows: '%USERPROFILE%\\.kiro\\settings\\mcp.json',
    },
    config: `{
  "mcpServers": {
    "orqesta": {
      "command": "npx",
      "args": ["-y", "@orqesta/mcp-server"],
      "env": {
        "FLAGSMITH_API_KEY": "ser.xxxxxxxxxxxxxxxx",
        "FLAGSMITH_API_URL": "https://api.flagsmith.com/api/v1"
      }
    }
  }
}`,
  },
  'antigravity': {
    label: 'Antigravity',
    saveTo: {
      macos: '~/.config/antigravity/mcp.json',
      windows: '%APPDATA%\\Antigravity\\mcp.json',
    },
    config: `{
  "mcp": {
    "servers": {
      "orqesta": {
        "command": "npx",
        "args": ["-y", "@orqesta/mcp-server"],
        "environment": {
          "FLAGSMITH_API_KEY": "ser.xxxxxxxxxxxxxxxx"
        }
      }
    }
  }
}`,
  },
};

export default function MCP() {
  const [selectedClient, setSelectedClient] = useState<Client>('claude-desktop');
  const [copied, setCopied] = useState(false);

  const currentConfig = clientConfigs[selectedClient];

  function handleCopy() {
    navigator.clipboard.writeText(currentConfig.config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2D5F3F 0%, #1A3D2A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px',
    }}>
      {/* Modal Card */}
      <div style={{
        maxWidth: '920px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2D5F3F 0%, #1E4D30 100%)',
          padding: '40px 48px',
          position: 'relative',
        }}>
          {/* Close button */}
          <Link to="/" style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            ×
          </Link>

          {/* Logo */}
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="2" />
              <circle cx="16" cy="16" r="2" fill="white" />
              <line x1="16" y1="6" x2="16" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="22" x2="16" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="6" y1="16" x2="10" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="16" x2="26" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Orqesta MCP
            </span>
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 500,
            color: 'white',
            lineHeight: 1.2,
            marginBottom: '12px',
          }}>
            Put feature flags in your agent's hands.
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.5,
            maxWidth: '540px',
          }}>
            Connect your AI client to Orqesta via Model Context Protocol.
            Compare, sync, and manage Flagsmith configurations directly from Claude, Cursor, or VS Code.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '40px 48px 48px' }}>
          {/* Choose client */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>
              Choose your client
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-500)', marginBottom: '20px' }}>
              Copy a ready-to-use configuration for your setup.
            </p>

            {/* Tabs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '6px',
              background: 'var(--ivory-mid)',
              borderRadius: '10px',
            }}>
              {(Object.keys(clientConfigs) as Client[]).map((client) => (
                <button
                  key={client}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: selectedClient === client ? 'var(--ink-900)' : 'var(--ink-500)',
                    background: selectedClient === client ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    boxShadow: selectedClient === client ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  {clientConfigs[client].label}
                </button>
              ))}
            </div>

            {/* Local indicator */}
            <div style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#5B8A4A',
              }} />
              <span style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
                Runs locally via npx
              </span>
            </div>
          </div>

          {/* Save to */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '10px' }}>
              Save to
            </h3>
            <div style={{ fontSize: '13px', fontFamily: '"SF Mono", monospace', color: 'var(--ink-600)' }}>
              <div>macOS: <code style={{ color: 'var(--ink-900)' }}>{currentConfig.saveTo.macos}</code></div>
              <div style={{ marginTop: '4px' }}>Windows: <code style={{ color: 'var(--ink-900)' }}>{currentConfig.saveTo.windows}</code></div>
            </div>
          </div>

          {/* Config code block */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              background: '#1A1A1A',
              borderRadius: '10px',
              overflow: 'hidden',
            }}>
              {/* Code header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#5B8A4A',
                  }} />
                  <span style={{
                    fontSize: '13px',
                    fontFamily: '"SF Mono", monospace',
                    color: 'rgba(255,255,255,0.7)',
                  }}>
                    {selectedClient}_config.json
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: copied ? '#5B8A4A' : 'white',
                    background: copied ? 'rgba(91,138,74,0.15)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy config'}
                </button>
              </div>

              {/* Code content */}
              <pre style={{
                padding: '20px',
                margin: 0,
                fontSize: '13px',
                fontFamily: '"SF Mono", "Fira Code", monospace',
                color: '#E8E4DC',
                lineHeight: 1.6,
                overflow: 'auto',
                maxHeight: '320px',
              }}>
                {currentConfig.config}
              </pre>
            </div>
          </div>

          {/* Footer buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '24px',
            borderTop: '1px solid var(--ivory)',
          }}>
            <a
              href="https://github.com/sohansarkar07/orqesta/blob/main/docs/mcp-setup.md"
              target="_blank"
              rel="noopener"
              style={{
                fontSize: '14px',
                color: 'var(--sage)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Read setup guide →
            </a>
            <Link to="/">
              <button style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                background: '#2D5F3F',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1E4D30';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2D5F3F';
              }}
              >
                Done
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
