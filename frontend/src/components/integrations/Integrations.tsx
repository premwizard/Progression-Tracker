import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './Integrations.css';

interface Integration {
  name: string;
  description: string;
  connected: boolean;
}

interface IntegrationLog {
  id: string;
  timestamp: string;
  service: string;
  message: string;
}

export const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Webhook simulator state
  const [commitMessage, setCommitMessage] = useState('');
  const [simulating, setSimulating] = useState(false);

  const fetchIntegrationsData = async () => {
    try {
      const [integrationsData, logsData] = await Promise.all([
        api.get<Integration[]>('/integrations'),
        api.get<IntegrationLog[]>('/integrations/logs')
      ]);
      setIntegrations(integrationsData);
      setLogs(logsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load integrations settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationsData();
  }, []);

  const handleToggleConnection = async (name: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setIntegrations(prev =>
        prev.map(i => (i.name === name ? { ...i, connected: !currentStatus } : i))
      );
      await api.post(`/integrations/${name}/toggle`, { connected: !currentStatus });
      fetchIntegrationsData();
    } catch (err: any) {
      setError(err.message || 'Failed to update integration connection');
      fetchIntegrationsData();
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    setSimulating(true);
    setError(null);
    try {
      await api.post('/integrations/webhooks/github', {
        commit_message: commitMessage.trim()
      });
      setCommitMessage('');
      fetchIntegrationsData();
    } catch (err: any) {
      setError(err.message || 'Webhook simulation failed. Make sure GitHub integration is connected.');
    } finally {
      setSimulating(false);
    }
  };

  const getServiceLogo = (name: string) => {
    switch (name) {
      case 'github':
        return '🐙';
      case 'calendar':
        return '📅';
      case 'slack':
        return '💬';
      default:
        return '🔌';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading integration modules...</p>
      </div>
    );
  }

  const isGitHubConnected = integrations.find(i => i.name === 'github')?.connected || false;

  return (
    <div className="integrations-layout animate-fade-in">
      <div className="integrations-header">
        <h2>External Connections</h2>
        <p>Link external productivity services and trigger webhook listeners.</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {/* Grid of Connections */}
      <div className="integrations-grid">
        {integrations.map(integration => (
          <div key={integration.name} className="integration-card">
            <div className="integration-card-header">
              <div className="integration-name-row">
                <span className="integration-logo">{getServiceLogo(integration.name)}</span>
                <h3>{integration.name}</h3>
              </div>
              <span className={`status-badge ${integration.connected ? 'completed' : 'todo'}`}>
                {integration.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <p className="integration-desc">{integration.description}</p>
            
            <button
              className={`btn ${integration.connected ? 'secondary' : ''}`}
              onClick={() => handleToggleConnection(integration.name, integration.connected)}
            >
              {integration.connected ? 'Disconnect' : 'Connect Link'}
            </button>
          </div>
        ))}
      </div>

      {/* Webhook Simulator Section */}
      <div className="webhook-simulator-section">
        {/* Simulator controls */}
        <div className="simulator-card">
          <h3>GitHub Webhook Simulator</h3>
          <p className="integration-desc" style={{ fontSize: '0.85rem' }}>
            Simulate a GitHub push commit event payload. When the webhook triggers, it creates a subtask
            under your first active goal, updating the progression metrics dynamically.
            <br />
            <strong style={{ color: 'var(--text-primary)' }}>* Note: GitHub integration must be 'Connected' above.</strong>
          </p>

          <form onSubmit={handleSimulateWebhook} className="auth-form" style={{ marginTop: '0.5rem' }}>
            <div className="form-group">
              <label htmlFor="commit-msg">Commit Message</label>
              <input
                id="commit-msg"
                type="text"
                className="form-input"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="e.g. feat: add oauth authentication"
                disabled={!isGitHubConnected || simulating}
                required
              />
            </div>
            <button
              type="submit"
              className="btn"
              disabled={!isGitHubConnected || simulating || !commitMessage.trim()}
            >
              {simulating ? 'Processing Webhook...' : 'Simulate GitHub Push'}
            </button>
          </form>
        </div>

        {/* Console logs terminal */}
        <div className="simulator-card">
          <h3>Webhook Execution Console</h3>
          <div className="terminal-console">
            {logs.length === 0 ? (
              <span className="terminal-line empty">Console is idle. Trigger a webhook push or toggle connections...</span>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                  <span className="terminal-line timestamp">
                    [{new Date(log.timestamp).toLocaleTimeString()}] [{log.service.toUpperCase()}]
                  </span>
                  <span className={`terminal-line ${log.message.includes('created task') ? 'success' : 'info'}`}>
                    &gt; {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Integrations;

