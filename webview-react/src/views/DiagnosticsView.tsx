import { useEffect, useState } from 'react';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';

interface SystemStatus {
  database: 'unknown' | 'connected' | 'error';
  provider: 'unknown' | 'connected' | 'error';
  lastIndexed: Date | null;
  totalChunks: number;
  lastError: string | null;
}

const getStatusBadge = (status: 'unknown' | 'connected' | 'error') => {
  switch (status) {
    case 'connected':
      return <span className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-400">✓ Connected</span>;
    case 'error':
      return <span className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400">✗ Error</span>;
    default:
      return <span className="rounded bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">⚠ Unknown</span>;
  }
};

export default function DiagnosticsView() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'unknown',
    provider: 'unknown',
    lastIndexed: null,
    totalChunks: 0,
    lastError: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [healthResults, setHealthResults] = useState<Array<{ service: string; status: string; details: string }>>([]);

  useEffect(() => {
    const unsubscribeStatus = onMessageCommand('serviceStatusResponse', (message) => {
      const status = message.data || message.status || message;
      setSystemStatus(status);
      setIsRefreshing(false);
    });

    const unsubscribeHealth = onMessageCommand('healthCheckResponse', (message) => {
      const results = message.data || [];
      setHealthResults(results);
      setIsHealthChecking(false);
    });

    postMessage('getServiceStatus');

    return () => {
      unsubscribeStatus();
      unsubscribeHealth();
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    postMessage('getServiceStatus');
  };

  const handleTestDatabase = () => postMessage('testDatabaseConnection');
  const handleTestProvider = () => postMessage('testProviderConnection');
  const handleRunHealthChecks = () => {
    setIsHealthChecking(true);
    postMessage('runHealthChecks');
  };
  const handleReindex = () => postMessage('startReindexing');
  const handleClearIndex = () => postMessage('clearIndex');

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="w-full p-4 space-y-4 ultrawide:max-w-[2400px] ultrawide:mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">🛡️ System Diagnostics</h1>
        <p className="text-sm opacity-80">Monitor system health and troubleshoot connection issues.</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Database Status */}
        <div className="rounded border p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗄️</span>
              <span className="font-medium">Database</span>
            </div>
            {getStatusBadge(systemStatus.database)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Total Chunks:</span>
              <span>{systemStatus.totalChunks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Last Indexed:</span>
              <span>{formatDate(systemStatus.lastIndexed)}</span>
            </div>
          </div>
          <button
            className="mt-3 rounded border px-3 py-1.5 text-sm hover:bg-white/5"
            onClick={handleTestDatabase}
          >
            Test Connection
          </button>
        </div>

        {/* AI Provider Status */}
        <div className="rounded border p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-medium">AI Provider</span>
            </div>
            {getStatusBadge(systemStatus.provider)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Status:</span>
              <span>{systemStatus.provider === 'connected' ? 'Ready' : 'Not Available'}</span>
            </div>
          </div>
          <button
            className="mt-3 rounded border px-3 py-1.5 text-sm hover:bg-white/5"
            onClick={handleTestProvider}
          >
            Test Connection
          </button>
        </div>
      </div>

      {/* System Statistics */}
      <div className="rounded border p-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <span className="font-medium">System Statistics</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded bg-black/20 p-3 text-center">
            <div className="text-lg font-semibold">{systemStatus.totalChunks.toLocaleString()}</div>
            <div className="text-xs opacity-70">Total Chunks</div>
          </div>
          <div className="rounded bg-black/20 p-3 text-center">
            <div className="text-lg font-semibold">{systemStatus.database === 'connected' ? '✓' : '✗'}</div>
            <div className="text-xs opacity-70">Database Status</div>
          </div>
          <div className="rounded bg-black/20 p-3 text-center">
            <div className="text-lg font-semibold">{systemStatus.provider === 'connected' ? '✓' : '✗'}</div>
            <div className="text-xs opacity-70">Provider Status</div>
          </div>
          <div className="rounded bg-black/20 p-3 text-center">
            <div className="text-lg font-semibold">{systemStatus.lastIndexed ? '✓' : '✗'}</div>
            <div className="text-xs opacity-70">Index Status</div>
          </div>
        </div>
      </div>

      {/* Error Information */}
      {systemStatus.lastError && (
        <div className="rounded border border-red-600/40 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg text-red-400">❌</span>
            <span className="font-medium text-red-400">Last Error</span>
          </div>
          <div className="text-sm text-red-400">{systemStatus.lastError}</div>
        </div>
      )}

      {/* Health Checks */}
      <div className="rounded border p-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔍</span>
          <span className="font-medium">Health Checks</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium">Run Health Checks</div>
            <div className="text-xs opacity-70">Validate database and embedding provider connectivity</div>
          </div>
          <button
            className="rounded border px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
            onClick={handleRunHealthChecks}
            disabled={isHealthChecking}
          >
            {isHealthChecking ? 'Running...' : 'Run'}
          </button>
        </div>
        {healthResults.length > 0 && (
          <div className="space-y-2">
            {healthResults.map((r, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm">{r.service}</span>
                <span className={`rounded px-2 py-1 text-xs ${r.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Troubleshooting Tools */}
      <div className="rounded border p-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔧</span>
          <span className="font-medium">Troubleshooting Tools</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <div className="font-medium">Refresh System Status</div>
              <div className="text-xs opacity-70">Update all connection and system status information</div>
            </div>
            <button
              className="rounded border px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
              disabled={isRefreshing}
              onClick={handleRefresh}
            >
              {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <div className="font-medium">Reindex Workspace</div>
              <div className="text-xs opacity-70">Rebuild the search index from scratch</div>
            </div>
            <button
              className="rounded border px-3 py-1.5 text-sm hover:bg-white/5"
              onClick={handleReindex}
            >
              Reindex
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Clear Index</div>
              <div className="text-xs opacity-70">Remove all indexed data (requires reindexing)</div>
            </div>
            <button
              className="rounded border px-3 py-1.5 text-sm hover:bg-white/5"
              onClick={handleClearIndex}
            >
              Clear Index
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
