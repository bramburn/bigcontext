import { useEffect, useState } from 'react';
import { connectionMonitor } from '../utils/connectionMonitor';
import type { ConnectionStatus as ConnectionStatusType } from '../utils/connectionMonitor';

const statusText: Record<ConnectionStatusType, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting to extension...',
  disconnected: 'Disconnected from extension. Trying to reconnect...'
};

export default function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatusType>(connectionMonitor.getStatus());
  const [latency, setLatency] = useState<number>(0);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'poor'>('good');

  useEffect(() => {
    const offStatus = connectionMonitor.on('statusChange', (next: ConnectionStatusType) => setStatus(next));
    const offHeartbeat = connectionMonitor.on('heartbeat', (e: any) => setLatency(e?.latency ?? 0));
    const offQuality = connectionMonitor.on('qualityChange', (e: any) => setNetworkQuality(e?.quality ?? 'good'));
    return () => { offStatus(); offHeartbeat(); offQuality(); };
  }, []);

  if (status === 'connected') {
    // Show poor connection warning if network quality is poor
    if (networkQuality === 'poor') {
      return (
        <div className="fixed top-2 left-3 right-3 z-50">
          <div className="rounded border border-yellow-600/40 bg-yellow-500/10 p-3">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⚠️</span>
              <div>
                <div className="font-medium text-yellow-400">Poor Connection</div>
                <div className="text-xs text-yellow-400/80">
                  Network quality is poor. Some features may be slower than usual. (Latency: {latency}ms)
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed bottom-2 right-3 opacity-70">
        <div className="text-xs">Latency: {latency}ms</div>
      </div>
    );
  }

  return (
    <div className="fixed top-2 left-3 right-3 z-50">
      <div className={`rounded border p-3 ${
        status === 'reconnecting' 
          ? 'border-yellow-600/40 bg-yellow-500/10' 
          : 'border-red-600/40 bg-red-500/10'
      }`}>
        <div className="flex items-center gap-2">
          <span className={status === 'reconnecting' ? 'text-yellow-400' : 'text-red-400'}>
            {status === 'reconnecting' ? '🔄' : '❌'}
          </span>
          <div>
            <div className={`font-medium ${status === 'reconnecting' ? 'text-yellow-400' : 'text-red-400'}`}>
              Connection
            </div>
            <div className={`text-xs ${status === 'reconnecting' ? 'text-yellow-400/80' : 'text-red-400/80'}`}>
              {statusText[status]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
