import React, { useEffect, useState } from 'react';
import { Caption1, MessageBar, MessageBarBody, MessageBarTitle } from '@fluentui/react-components';
import { connectionMonitor } from '../utils/connectionMonitor';
import type { ConnectionStatus as ConnStatus } from '../utils/connectionMonitor';

const statusText: Record<ConnStatus, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting to extension...',
  disconnected: 'Disconnected from extension. Trying to reconnect...'
};

export const ConnectionIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnStatus>(connectionMonitor.getStatus());
  const [latency, setLatency] = useState<number>(0);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'poor'>('good');

  useEffect(() => {
    const offStatus = connectionMonitor.on('statusChange', (next: ConnStatus) => setStatus(next));
    const offHeartbeat = connectionMonitor.on('heartbeat', (e: any) => setLatency(e?.latency ?? 0));
    const offQuality = connectionMonitor.on('qualityChange', (e: any) => setNetworkQuality(e?.quality ?? 'good'));
    return () => { offStatus(); offHeartbeat(); offQuality(); };
  }, []);

  if (status === 'connected') {
    // Show poor connection warning if network quality is poor
    if (networkQuality === 'poor') {
      return (
        <div style={{ position: 'fixed', top: 8, right: 12, left: 12, zIndex: 1000 }}>
          <MessageBar intent="warning">
            <MessageBarBody>
              <MessageBarTitle>Poor Connection</MessageBarTitle>
              Network quality is poor. Some features may be slower than usual. (Latency: {latency}ms)
            </MessageBarBody>
          </MessageBar>
        </div>
      );
    }

    return (
      <div style={{ position: 'fixed', bottom: 8, right: 12, opacity: 0.7 }}>
        <Caption1>Latency: {latency}ms</Caption1>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 8, right: 12, left: 12, zIndex: 1000 }}>
      <MessageBar intent={status === 'reconnecting' ? 'warning' : 'error'}>
        <MessageBarBody>
          <MessageBarTitle>Connection</MessageBarTitle>
          {statusText[status]}
        </MessageBarBody>
      </MessageBar>
    </div>
  );
};

export default ConnectionIndicator;

