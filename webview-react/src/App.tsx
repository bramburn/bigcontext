import React, { useState, useEffect } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Button,
  Input,
  Card,
  CardHeader,
  Text,
  Body1,
  Caption1
} from '@fluentui/react-components';
import { connectionMonitor, ConnectionState, ConnectionEvent } from '../../src/shared/connectionMonitor';

interface VSCodeAPI {
  postMessage: (message: any) => void;
  setState: (state: any) => void;
  getState: () => any;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VSCodeAPI;
  }
}

function App() {
  const [status, setStatus] = useState('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [vscode, setVscode] = useState<VSCodeAPI | null>(null);
  const [message, setMessage] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>(connectionMonitor.getState());
  const [reconnectProgress, setReconnectProgress] = useState<{ attempt: number; delay: number } | null>(null);

  const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `${timestamp} - ${msg}`]);
  };

  const sendMessage = () => {
    if (message.trim()) {
      const messageData = {
        command: 'testMessage',
        data: message.trim(),
        timestamp: Date.now()
      };

      const sent = connectionMonitor.sendMessage(messageData);
      if (sent) {
        log(`Sent: ${message.trim()}`);
      } else {
        log(`Queued: ${message.trim()} (will send when connected)`);
      }
      setMessage('');
    }
  };

  useEffect(() => {
    log('React app mounted');

    let retries = 0;
    const maxRetries = 10;

    // Set up connection monitor event handlers
    const unsubscribeConnected = connectionMonitor.on('connected', (event: ConnectionEvent) => {
      setConnectionState(connectionMonitor.getState());
      setStatus('Connected to VS Code');
      log(`Connected - Latency: ${event.data?.latency || 0}ms`);
      setReconnectProgress(null);
    });

    const unsubscribeDisconnected = connectionMonitor.on('disconnected', (_event: ConnectionEvent) => {
      setConnectionState(connectionMonitor.getState());
      setStatus('Disconnected from VS Code');
      log('Connection lost - attempting to reconnect...');
    });

    const unsubscribeReconnecting = connectionMonitor.on('reconnecting', (event: ConnectionEvent) => {
      setConnectionState(connectionMonitor.getState());
      setReconnectProgress({ attempt: event.data.attempt, delay: event.data.delay });
      setStatus(`Reconnecting... (attempt ${event.data.attempt})`);
      log(`Reconnecting in ${event.data.delay}ms (attempt ${event.data.attempt})`);
    });

    const unsubscribeError = connectionMonitor.on('error', (event: ConnectionEvent) => {
      setConnectionState(connectionMonitor.getState());
      log(`Connection error: ${event.data.message}`);
    });

    const unsubscribeHeartbeat = connectionMonitor.on('heartbeat', (_event: ConnectionEvent) => {
      setConnectionState(connectionMonitor.getState());
    });

    const initVSCode = () => {
      if (typeof window !== 'undefined' && window.acquireVsCodeApi) {
        try {
          const api = window.acquireVsCodeApi();
          setVscode(api);
          setStatus('VS Code API acquired successfully');
          log('VS Code API acquired');

          // Initialize connection monitor
          connectionMonitor.initialize(api);

          // Send ready message
          api.postMessage({
            command: 'webviewReady',
            source: 'react-app',
            timestamp: Date.now()
          });
          log('Sent webviewReady message');

          // Listen for messages from extension
          const handleMessage = (event: MessageEvent) => {
            const msg = event.data;

            // Handle heartbeat responses
            if (msg.command === 'heartbeatResponse') {
              connectionMonitor.handleHeartbeatResponse(msg.timestamp);
              return;
            }

            log(`Received from extension: ${JSON.stringify(msg)}`);
          };

          window.addEventListener('message', handleMessage);

          return () => {
            window.removeEventListener('message', handleMessage);
            connectionMonitor.destroy();
            unsubscribeConnected();
            unsubscribeDisconnected();
            unsubscribeReconnecting();
            unsubscribeError();
            unsubscribeHeartbeat();
          };
          
        } catch (error) {
          setStatus(`Error acquiring VS Code API: ${error}`);
          log(`Error: ${error}`);
        }
      } else if (retries < maxRetries) {
        retries++;
        setStatus(`VS Code API not ready, retry ${retries}/${maxRetries}`);
        log(`Retry ${retries}/${maxRetries}`);
        setTimeout(initVSCode, 100);
      } else {
        setStatus('VS Code API unavailable after retries');
        log('Failed to acquire VS Code API after retries');
      }
    };
    
    initVSCode();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <FluentProvider theme={isDark ? webDarkTheme : webLightTheme}>
      <div style={{ padding: '16px', height: '100vh', overflow: 'auto' }}>
        <Card>
          <CardHeader
            header={<Text weight="semibold">React Webview Test</Text>}
            action={
              <Button
                size="small"
                onClick={() => setIsDark(!isDark)}
              >
                {isDark ? 'Light' : 'Dark'}
              </Button>
            }
          />
          
          <div style={{ padding: '16px' }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: '4px',
              margin: '8px 0',
              backgroundColor: status.includes('successfully') ? '#063b49' :
                             status.includes('Error') ? '#5a1d1d' : '#664d00',
              border: `1px solid ${status.includes('successfully') ? '#007acc' :
                                 status.includes('Error') ? '#be1100' : '#ffcc00'}`
            }}>
              <Body1>Status: {status}</Body1>
            </div>

            {/* Connection Status */}
            <div style={{ display: 'flex', gap: '12px', margin: '8px 0', flexWrap: 'wrap' }}>
              <div style={{
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: connectionState.isConnected ? '#063b49' : '#5a1d1d',
                border: `1px solid ${connectionState.isConnected ? '#007acc' : '#be1100'}`
              }}>
                <Caption1>{connectionState.isConnected ? '🟢 Connected' : '🔴 Disconnected'}</Caption1>
              </div>

              {connectionState.isConnected && (
                <>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: connectionState.connectionQuality === 'excellent' ? '#063b49' :
                                   connectionState.connectionQuality === 'good' ? '#664d00' : '#5a1d1d',
                    border: `1px solid ${connectionState.connectionQuality === 'excellent' ? '#007acc' :
                                       connectionState.connectionQuality === 'good' ? '#ffcc00' : '#be1100'}`
                  }}>
                    <Caption1>Quality: {connectionState.connectionQuality}</Caption1>
                  </div>

                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#664d00',
                    border: '1px solid #ffcc00'
                  }}>
                    <Caption1>Latency: {connectionState.latency}ms</Caption1>
                  </div>
                </>
              )}

              {reconnectProgress && (
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#664d00',
                  border: '1px solid #ffcc00'
                }}>
                  <Caption1>Reconnecting... ({reconnectProgress.attempt})</Caption1>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', margin: '16px 0', alignItems: 'center' }}>
              <Input
                value={message}
                onChange={(_, data) => setMessage(data.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a test message"
                style={{ flex: 1 }}
              />
              
              <Button
                appearance="primary"
                disabled={!vscode || !message.trim()}
                onClick={sendMessage}
              >
                Send Message
              </Button>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <Text weight="semibold">Logs:</Text>
              <div style={{
                backgroundColor: '#0f0f0f',
                border: '1px solid #3c3c3c',
                borderRadius: '4px',
                padding: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                marginTop: '8px'
              }}>
                <Caption1 style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {logs.join('\n')}
                </Caption1>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </FluentProvider>
  );
}

export default App;
