import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

function App() {
  const [status, setStatus] = useState('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [vscode, setVscode] = useState<any>(null);
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

          // Tailwind class check - log computed styles
          setTimeout(() => {
            const flexElement = document.querySelector('.flex');
            if (flexElement) {
              const computedStyle = window.getComputedStyle(flexElement);
              log(`Tailwind class check: .flex element display = ${computedStyle.display} (expected: flex)`);
            } else {
              log('Tailwind class check: .flex element not found');
            }
          }, 100);

          // Post asset loading information
          setTimeout(() => {
            const cssLink = document.querySelector('link[href*=".css"]') as HTMLLinkElement;
            if (cssLink) {
              api.postMessage({
                command: 'assetLoad',
                data: {
                  css: cssLink.href,
                  status: 'loaded'
                },
                timestamp: Date.now()
              });
              log(`Posted asset load info: ${cssLink.href}`);
            }
          }, 200);

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
    <div className={`min-h-screen w-full ${isDark ? 'bg-[#1e1e1e] text-[#cccccc]' : 'bg-white text-black'} p-4`}>
      <div className="p-4 h-screen overflow-auto">
        <div className="border border-[var(--vscode-panel-border,#3c3c3c)] rounded-md overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-[var(--vscode-panel-border,#3c3c3c)]">
            <h2 className="font-semibold">React Webview Test</h2>
            <button 
              className="px-3 py-1 text-sm rounded-md bg-[var(--vscode-button-background,#0e639c)] hover:bg-[var(--vscode-button-hoverBackground,#1177bb)] text-[var(--vscode-button-foreground,white)]"
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>
          
          <div className="p-4">
            <div className={`p-2 rounded-md my-2 ${
              status.includes('successfully') 
                ? 'bg-[#063b49] border border-[#007acc]' 
                : status.includes('Error') 
                  ? 'bg-[#5a1d1d] border border-[#be1100]' 
                  : 'bg-[#664d00] border border-[#ffcc00]'
            }`}>
              <p>Status: {status}</p>
            </div>
            
            <div className="flex gap-2 my-4 items-center">
              <input 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                onKeyDown={handleKeyPress} 
                placeholder="Type a test message" 
                className="flex-1 p-2 rounded-md bg-[var(--vscode-input-background,#3c3c3c)] text-[var(--vscode-input-foreground,#cccccc)] border border-[var(--vscode-input-border,#3c3c3c)]"
              />
              
              <button 
                className={`px-3 py-2 rounded-md ${
                  !vscode || !message.trim() 
                    ? 'bg-[#3c3c3c] text-[#888888] cursor-not-allowed' 
                    : 'bg-[var(--vscode-button-background,#0e639c)] hover:bg-[var(--vscode-button-hoverBackground,#1177bb)] text-[var(--vscode-button-foreground,white)]'
                }`}
                disabled={!vscode || !message.trim()} 
                onClick={sendMessage}
              >
                Send Message
              </button>
            </div>
            
            <div className="mt-4">
              <p className="font-semibold">Logs:</p>
              <div className="bg-[#0f0f0f] border border-[#3c3c3c] rounded-md p-2 max-h-[200px] overflow-y-auto mt-2">
                <pre className="font-mono text-xs whitespace-pre-wrap">
                  {logs.join('\n')}
                </pre>
              </div>
            </div>

            {/* Test Radix component in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 border border-yellow-500 rounded">
                <p className="text-yellow-400 mb-2">Development Mode: Radix Test</p>
                <Dialog.Root>
                  <Dialog.Trigger asChild>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded">
                      Test Radix Dialog
                    </button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg">
                      <Dialog.Title className="text-lg font-semibold mb-4">Test Dialog</Dialog.Title>
                      <p>This is a test Radix UI Dialog component.</p>
                      <Dialog.Close asChild>
                        <button className="mt-4 px-3 py-1 bg-gray-600 text-white rounded">
                          Close
                        </button>
                      </Dialog.Close>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;