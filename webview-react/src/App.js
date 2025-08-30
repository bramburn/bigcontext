"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_components_1 = require("@fluentui/react-components");
function App() {
    const [status, setStatus] = (0, react_1.useState)('Initializing...');
    const [logs, setLogs] = (0, react_1.useState)([]);
    const [vscode, setVscode] = (0, react_1.useState)(null);
    const [message, setMessage] = (0, react_1.useState)('');
    const [isDark, setIsDark] = (0, react_1.useState)(true);
    const log = (msg) => {
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
    (0, react_1.useEffect)(() => {
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
                    const handleMessage = (event) => {
                        const msg = event.data;
                        log(`Received from extension: ${JSON.stringify(msg)}`);
                    };
                    window.addEventListener('message', handleMessage);
                    return () => {
                        window.removeEventListener('message', handleMessage);
                    };
                }
                catch (error) {
                    setStatus(`Error acquiring VS Code API: ${error}`);
                    log(`Error: ${error}`);
                }
            }
            else if (retries < maxRetries) {
                retries++;
                setStatus(`VS Code API not ready, retry ${retries}/${maxRetries}`);
                log(`Retry ${retries}/${maxRetries}`);
                setTimeout(initVSCode, 100);
            }
            else {
                setStatus('VS Code API unavailable after retries');
                log('Failed to acquire VS Code API after retries');
            }
        };
        initVSCode();
    }, []);
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };
    return (<react_components_1.FluentProvider theme={isDark ? react_components_1.webDarkTheme : react_components_1.webLightTheme}>
      <div style={{ padding: '16px', height: '100vh', overflow: 'auto' }}>
        <react_components_1.Card>
          <react_components_1.CardHeader header={<react_components_1.Text weight="semibold">React Webview Test</react_components_1.Text>} action={<react_components_1.Button size="small" onClick={() => setIsDark(!isDark)}>
                {isDark ? 'Light' : 'Dark'}
              </react_components_1.Button>}/>
          
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
              <react_components_1.Body1>Status: {status}</react_components_1.Body1>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', margin: '16px 0', alignItems: 'center' }}>
              <react_components_1.Input value={message} onChange={(_, data) => setMessage(data.value)} onKeyDown={handleKeyPress} placeholder="Type a test message" style={{ flex: 1 }}/>
              
              <react_components_1.Button appearance="primary" disabled={!vscode || !message.trim()} onClick={sendMessage}>
                Send Message
              </react_components_1.Button>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <react_components_1.Text weight="semibold">Logs:</react_components_1.Text>
              <div style={{
            backgroundColor: '#0f0f0f',
            border: '1px solid #3c3c3c',
            borderRadius: '4px',
            padding: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            marginTop: '8px'
        }}>
                <react_components_1.Caption1 style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {logs.join('\n')}
                </react_components_1.Caption1>
              </div>
            </div>
          </div>
        </react_components_1.Card>
      </div>
    </react_components_1.FluentProvider>);
}
exports.default = App;
//# sourceMappingURL=App.js.map