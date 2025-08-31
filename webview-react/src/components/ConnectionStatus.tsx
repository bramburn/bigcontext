import React, { useEffect, useState } from 'react';
import { Caption1, MessageBar, MessageBarBody, MessageBarTitle } from '@fluentui/react-components';
import { connectionMonitor, ConnectionStatus } from '../utils/connectionMonitor';

const statusText: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting to extension...',
  disconnected: 'Disconnected from extension. Trying to reconnect...'
};

export const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(connectionMonitor.getStatus());
  const [latency, setLatency] = useState<number>(0);

  useEffect(() => {
    const offStatus = connectionMonitor.on('statusChange', (next: ConnectionStatus) => setStatus(next));
    const offHeartbeat = connectionMonitor.on('heartbeat', (e: any) => setLatency(e?.latency ?? 0));
    return () => { offStatus(); offHeartbeat(); };
  }, []);

  if (status === 'connected') {
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

export default ConnectionStatus;

