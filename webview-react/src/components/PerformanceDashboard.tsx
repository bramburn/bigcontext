import { useState, useEffect } from 'react';
import { performanceMonitor, generatePerformanceReport } from '../utils/performance';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function PerformanceDashboard({ isVisible, onClose }: PerformanceDashboardProps) {
  const [report, setReport] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (isVisible) {
      updateReport();
    }
  }, [isVisible]);

  useEffect(() => {
    if (autoRefresh && isVisible) {
      const interval = setInterval(updateReport, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isVisible]);

  const updateReport = () => {
    setReport(generatePerformanceReport());
  };

  const clearMetrics = () => {
    performanceMonitor.clear();
    updateReport();
  };

  if (!isVisible || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Performance Dashboard</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Stop Auto-refresh' : 'Auto-refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={updateReport}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={clearMetrics}>
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {report && (
          <div className="space-y-6">
            {/* Render Performance */}
            {report.renderStats && (
              <div className="space-y-2">
                <h3 className="font-medium">Render Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">Total Renders</div>
                    <div className="text-lg font-mono">{report.renderStats.totalRenders}</div>
                  </div>
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">Avg Render Time</div>
                    <div className="text-lg font-mono">{report.renderStats.avgRenderTime}ms</div>
                  </div>
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">Max Render Time</div>
                    <div className="text-lg font-mono">{report.renderStats.maxRenderTime}ms</div>
                  </div>
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">Slow Renders</div>
                    <div className="text-lg font-mono">
                      {report.renderStats.slowRenders} ({report.renderStats.slowRenderPercentage}%)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Memory Usage */}
            {report.memoryUsage && (
              <div className="space-y-2">
                <h3 className="font-medium">Memory Usage</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Heap Usage</span>
                    <span>{report.memoryUsage.usagePercentage}%</span>
                  </div>
                  <Progress value={report.memoryUsage.usagePercentage} />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                      <div className="text-xs opacity-70">Used</div>
                      <div className="font-mono">{(report.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                      <div className="text-xs opacity-70">Total</div>
                      <div className="font-mono">{(report.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                      <div className="text-xs opacity-70">Limit</div>
                      <div className="font-mono">{(report.memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Network Timing */}
            {report.networkTiming && (
              <div className="space-y-2">
                <h3 className="font-medium">Network Timing</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">DOM Content Loaded</div>
                    <div className="text-lg font-mono">{report.networkTiming.domContentLoaded}ms</div>
                  </div>
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">Load Complete</div>
                    <div className="text-lg font-mono">{report.networkTiming.loadComplete}ms</div>
                  </div>
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">DOM Interactive</div>
                    <div className="text-lg font-mono">{report.networkTiming.domInteractive}ms</div>
                  </div>
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">First Paint</div>
                    <div className="text-lg font-mono">{report.networkTiming.firstPaint}ms</div>
                  </div>
                </div>
              </div>
            )}

            {/* Bundle Info */}
            {report.bundleInfo && (
              <div className="space-y-2">
                <h3 className="font-medium">Bundle Information</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">Scripts</div>
                    <div className="text-lg font-mono">{report.bundleInfo.scripts.length}</div>
                  </div>
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">Stylesheets</div>
                    <div className="text-lg font-mono">{report.bundleInfo.stylesheets.length}</div>
                  </div>
                  <div className="bg-[var(--vscode-panel-border)]/20 p-3 rounded">
                    <div className="text-xs opacity-70">Total Assets</div>
                    <div className="text-lg font-mono">{report.bundleInfo.totalAssets}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Raw Data */}
            <details className="space-y-2">
              <summary className="font-medium cursor-pointer">Raw Performance Data</summary>
              <pre className="bg-[var(--vscode-panel-border)]/20 p-4 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(report, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

// Performance monitoring hook for development
export function usePerformanceDashboard() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P to toggle performance dashboard
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(prev => !prev)
  };
}
