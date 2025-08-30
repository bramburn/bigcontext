<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    provideFluentDesignSystem, 
    fluentButton, 
    fluentTextField,
    fluentCard
  } from '@fluentui/web-components';

  // Register Fluent UI components
  provideFluentDesignSystem().register(fluentButton(), fluentTextField(), fluentCard());

  let status = 'Initializing...';
  let logs: string[] = [];
  let vscode: any = null;
  let message = '';

  function log(msg: string) {
    const timestamp = new Date().toISOString();
    logs = [...logs, `${timestamp} - ${msg}`];
  }

  function sendMessage() {
    if (vscode && message.trim()) {
      vscode.postMessage({ 
        command: 'testMessage', 
        data: message.trim(),
        timestamp: Date.now() 
      });
      log(`Sent: ${message.trim()}`);
      message = '';
    }
  }

  onMount(() => {
    log('App mounted');
    
    let retries = 0;
    const maxRetries = 10;
    
    function initVSCode() {
      if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
        try {
          vscode = (window as any).acquireVsCodeApi();
          status = 'VS Code API acquired successfully';
          log('VS Code API acquired');
          
          // Send ready message
          vscode.postMessage({ 
            command: 'webviewReady', 
            source: 'simple-svelte',
            timestamp: Date.now() 
          });
          log('Sent webviewReady message');
          
          // Listen for messages from extension
          window.addEventListener('message', (event) => {
            const msg = event.data;
            log(`Received from extension: ${JSON.stringify(msg)}`);
          });
          
        } catch (error) {
          status = `Error acquiring VS Code API: ${error}`;
          log(`Error: ${error}`);
        }
      } else if (retries < maxRetries) {
        retries++;
        status = `VS Code API not ready, retry ${retries}/${maxRetries}`;
        log(`Retry ${retries}/${maxRetries}`);
        setTimeout(initVSCode, 100);
      } else {
        status = 'VS Code API unavailable after retries';
        log('Failed to acquire VS Code API after retries');
      }
    }
    
    initVSCode();
  });
</script>

<main>
  <fluent-card>
    <h2>Simple Svelte Webview Test</h2>
    
    <div class="status" class:success={status.includes('successfully')} class:error={status.includes('Error')}>
      Status: {status}
    </div>
    
    <div class="controls">
      <fluent-text-field
        value={message}
        placeholder="Type a test message"
        role="textbox"
        tabindex="0"
        on:input={(e) => message = e.target.value}
        on:keydown={(e) => e.key === 'Enter' && sendMessage()}
      ></fluent-text-field>

      <fluent-button
        appearance="accent"
        disabled={!vscode || !message.trim()}
        role="button"
        tabindex="0"
        on:click={sendMessage}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && sendMessage()}
      >
        Send Message
      </fluent-button>
    </div>
    
    <div class="logs">
      <h3>Logs:</h3>
      <pre>{logs.join('\n')}</pre>
    </div>
  </fluent-card>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 8px;
    font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
    background: var(--vscode-editor-background, #1e1e1e);
    color: var(--vscode-foreground, #cccccc);
  }

  main {
    max-width: 100%;
  }

  fluent-card {
    padding: 16px;
    display: block;
  }

  .status {
    padding: 8px 12px;
    border-radius: 4px;
    margin: 8px 0;
    background: var(--vscode-inputValidation-warningBackground, #664d00);
    border: 1px solid var(--vscode-inputValidation-warningBorder, #ffcc00);
  }

  .status.success {
    background: var(--vscode-inputValidation-infoBackground, #063b49);
    border-color: var(--vscode-inputValidation-infoBorder, #007acc);
  }

  .status.error {
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    border-color: var(--vscode-inputValidation-errorBorder, #be1100);
  }

  .controls {
    display: flex;
    gap: 8px;
    margin: 16px 0;
    align-items: center;
  }

  fluent-text-field {
    flex: 1;
  }

  .logs {
    margin-top: 16px;
  }

  .logs pre {
    background: var(--vscode-textCodeBlock-background, #0f0f0f);
    border: 1px solid var(--vscode-panel-border, #3c3c3c);
    border-radius: 4px;
    padding: 8px;
    max-height: 200px;
    overflow-y: auto;
    font-size: 12px;
    white-space: pre-wrap;
  }
</style>
