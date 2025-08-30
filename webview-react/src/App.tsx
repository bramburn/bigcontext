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

  const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `${timestamp} - ${msg}`]);
  };

  const sendMessage = () => {
    if (vscode && message.trim()) {
      vscode.postMessage({
        command: 'testMessage',
        data: message.trim(),
        timestamp: Date.now()
      });
      log(`Sent: ${message.trim()}`);
      setMessage('');
    }
  };

  useEffect(() => {
    log('React app mounted');
    
    let retries = 0;
    const maxRetries = 10;
    
    const initVSCode = () => {
      if (typeof window !== 'undefined' && window.acquireVsCodeApi) {
        try {
          const api = window.acquireVsCodeApi();
          setVscode(api);
          setStatus('VS Code API acquired successfully');
          log('VS Code API acquired');
          
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
            log(`Received from extension: ${JSON.stringify(msg)}`);
          };
          
          window.addEventListener('message', handleMessage);
          
          return () => {
            window.removeEventListener('message', handleMessage);
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
