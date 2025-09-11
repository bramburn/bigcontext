import { useEffect, useState } from 'react';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';
import { logger, LogEntry, PerformanceMetric } from '../utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';

interface SystemStatus {
  database: 'unknown' | 'connected' | 'error';
  provider: 'unknown' | 'connected' | 'error';
  sidecar: 'unknown' | 'connected' | 'error';
  lastIndexed: Date | null;
  totalChunks: number;
  lastError: string | null;
  uptime: number;
  memoryUsage: number;
  errorCount: number;
  performanceMetrics: PerformanceMetric[];
  logs: LogEntry[];
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
    sidecar: 'unknown',
    lastIndexed: null,
    totalChunks: 0,
    lastError: null,
    uptime: 0,
    memoryUsage: 0,
    errorCount: 0,
    performanceMetrics: [],
    logs: [],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [healthResults, setHealthResults] = useState<Array<{ service: string; status: string; details: string }>>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');

  // Utility functions
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const loadLocalData = () => {
    const localLogs = logger.getLocalLogs();
    const localMetrics = logger.getPerformanceMetrics();

    setSystemStatus(prev => ({
      ...prev,
      logs: localLogs,
      performanceMetrics: localMetrics,
      errorCount: localLogs.filter(log => log.level === 'error').length,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      uptime: Date.now() - (performance.timeOrigin || 0),
    }));
  };

  useEffect(() => {
    const unsubscribeStatus = onMessageCommand('serviceStatusResponse', (message) => {
      const status = message.data || message.status || message;
      setSystemStatus(prev => ({ ...prev, ...status }));
      setIsRefreshing(false);
    });

    const unsubscribeHealth = onMessageCommand('healthCheckResponse', (message) => {
      const results = message.data || [];
      setHealthResults(results);
      setIsHealthChecking(false);
    });

    // Load initial data
    loadLocalData();
    postMessage('getServiceStatus');

    // Auto-refresh setup
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLocalData();
        postMessage('getServiceStatus');
      }, 5000);
      return () => clearInterval(interval);
    }

    return () => {
      unsubscribeStatus();
      unsubscribeHealth();
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLocalData();
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

  const exportDiagnostics = () => {
    postMessage('exportDiagnostics');
  };

  const clearLogs = () => {
    logger.clear();
    loadLocalData();
  };

  const createDiagnosticPackage = () => {
    postMessage('createDiagnosticPackage');
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const filteredLogs = systemStatus.logs.filter(log =>
    selectedLogLevel === 'all' || log.level === selectedLogLevel
  );

  return (
    <div className="w-full p-4 space-y-4 ultrawide:max-w-[2400px] ultrawide:mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">🛡️ System Diagnostics</h1>
          <p className="text-sm opacity-80">Monitor system health and troubleshoot connection issues.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Stop Auto-refresh' : 'Auto-refresh'}
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={exportDiagnostics}>Export</Button>
          <Button onClick={createDiagnosticPackage}>Create Package</Button>
        </div>
      </div>

      {/* Enhanced System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatBytes(systemStatus.memoryUsage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Error Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-red-500">
              {systemStatus.errorCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatDuration(systemStatus.uptime)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {systemStatus.performanceMetrics.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Log Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {systemStatus.logs.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        {/* Sidecar Status */}
        <div className="rounded border p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <span className="font-medium">Sidecar</span>
            </div>
            {getStatusBadge(systemStatus.sidecar)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Status:</span>
              <span>{systemStatus.sidecar === 'connected' ? 'Running' : 'Not Available'}</span>
            </div>
          </div>
          <button
            className="mt-3 rounded border px-3 py-1.5 text-sm hover:bg-white/5"
            onClick={() => postMessage('testSidecarConnection')}
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

      {/* Enhanced Diagnostic Information */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <select
                value={selectedLogLevel}
                onChange={(e) => setSelectedLogLevel(e.target.value)}
                className="px-3 py-1 border rounded bg-background"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <Button onClick={clearLogs} variant="outline">Clear Logs</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <p className="p-4 text-center text-gray-500">No logs found</p>
                ) : (
                  <div className="space-y-1">
                    {filteredLogs.slice(-50).map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 border-l-4 text-sm font-mono ${
                          log.level === 'error' ? 'border-red-500 bg-red-50/10' :
                          log.level === 'warn' ? 'border-yellow-500 bg-yellow-50/10' :
                          log.level === 'info' ? 'border-blue-500 bg-blue-50/10' :
                          'border-gray-500 bg-gray-50/10'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge variant={log.level === 'error' ? 'destructive' : 'default'} className="ml-2">
                              {log.level.toUpperCase()}
                            </Badge>
                            <span className="ml-2 text-gray-600">[{log.source}]</span>
                          </div>
                        </div>
                        <div className="mt-1">{log.message}</div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-gray-500">Metadata</summary>
                            <pre className="mt-1 text-xs bg-gray-100/10 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {systemStatus.performanceMetrics.length === 0 ? (
                <p className="text-center text-gray-500">No performance metrics available</p>
              ) : (
                <div className="space-y-2">
                  {systemStatus.performanceMetrics.slice(-20).map((metric, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <span className="font-medium">{metric.operationName}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <Badge variant={metric.duration > 1000 ? "destructive" : "default"}>
                        {formatDuration(metric.duration)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Browser</h4>
                  <p className="text-sm text-gray-600">{navigator.userAgent}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Screen Resolution</h4>
                  <p className="text-sm text-gray-600">
                    {window.screen.width} × {window.screen.height}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Viewport</h4>
                  <p className="text-sm text-gray-600">
                    {window.innerWidth} × {window.innerHeight}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Language</h4>
                  <p className="text-sm text-gray-600">{navigator.language}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
