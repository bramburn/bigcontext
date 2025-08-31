<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    provideFluentDesignSystem,
    fluentButton,
    fluentTextField,
    fluentCard
  } from '@fluentui/web-components';
  import { connectionMonitor } from '../../src/shared/connectionMonitor.ts';

  // Register Fluent UI components
  provideFluentDesignSystem().register(fluentButton(), fluentTextField(), fluentCard());

  let status = 'Initializing...';
  let logs: string[] = [];
  let vscode: any = null;
  let message = '';
  let connectionState = connectionMonitor.getState();
  let reconnectProgress: { attempt: number; delay: number } | null = null;
  let adaptiveMode: 'full' | 'reduced' | 'minimal' = 'full';

  // Unsubscribe functions for cleanup
  let unsubscribeConnected: (() => void) | null = null;
  let unsubscribeDisconnected: (() => void) | null = null;
  let unsubscribeReconnecting: (() => void) | null = null;
  let unsubscribeError: (() => void) | null = null;
  let unsubscribeHeartbeat: (() => void) | null = null;

  function log(msg: string) {
    const timestamp = new Date().toISOString();
    logs = [...logs, `${timestamp} - ${msg}`];
  }

  function sendMessage() {
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
      message = '';
    }
  }

  function updateAdaptiveMode(state) {
    if (!state.isConnected) {
      adaptiveMode = 'minimal';
      return;
    }

    if (state.bandwidth === 'low' || state.connectionQuality === 'poor') {
      adaptiveMode = 'minimal';
    } else if (state.bandwidth === 'medium' || state.connectionQuality === 'good') {
      adaptiveMode = 'reduced';
    } else {
      adaptiveMode = 'full';
    }
  }

  onMount(() => {
    log('App mounted');

    let retries = 0;
    const maxRetries = 10;

    // Set up connection monitor event handlers
    unsubscribeConnected = connectionMonitor.on('connected', (event) => {
      connectionState = connectionMonitor.getState();
      status = 'Connected to VS Code';
      log(`Connected - Latency: ${event.data?.latency || 0}ms`);
      reconnectProgress = null;
    });

    unsubscribeDisconnected = connectionMonitor.on('disconnected', (_event) => {
      connectionState = connectionMonitor.getState();
      status = 'Disconnected from VS Code';
      log('Connection lost - attempting to reconnect...');
    });

    unsubscribeReconnecting = connectionMonitor.on('reconnecting', (event) => {
      connectionState = connectionMonitor.getState();
      reconnectProgress = { attempt: event.data.attempt, delay: event.data.delay };
      status = `Reconnecting... (attempt ${event.data.attempt})`;
      log(`Reconnecting in ${event.data.delay}ms (attempt ${event.data.attempt})`);
    });

    unsubscribeError = connectionMonitor.on('error', (event) => {
      connectionState = connectionMonitor.getState();
      log(`Connection error: ${event.data.message}`);
    });

    unsubscribeHeartbeat = connectionMonitor.on('heartbeat', (_event) => {
      connectionState = connectionMonitor.getState();
      updateAdaptiveMode(connectionState);
    });

    function initVSCode() {
      if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
        try {
          vscode = (window as any).acquireVsCodeApi();
          status = 'VS Code API acquired successfully';
          log('VS Code API acquired');

          // Register service worker for offline support
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
              .then((registration) => {
                log('Service Worker registered successfully');
                console.log('SW registered:', registration);
              })
              .catch((error) => {
                log('Service Worker registration failed: ' + error.message);
                console.error('SW registration failed:', error);
              });
          }

          // Initialize connection monitor
          connectionMonitor.initialize(vscode);

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

            // Handle heartbeat responses
            if (msg.command === 'heartbeatResponse') {
              connectionMonitor.handleHeartbeatResponse(msg.timestamp);
              return;
            }

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

  onDestroy(() => {
    connectionMonitor.destroy();
    unsubscribeConnected?.();
    unsubscribeDisconnected?.();
    unsubscribeReconnecting?.();
    unsubscribeError?.();
    unsubscribeHeartbeat?.();
  });
</script>

<main>
  <fluent-card>
    <h2>Simple Svelte Webview Test</h2>
    
    <div class="status" class:success={status.includes('successfully')} class:error={status.includes('Error')}>
      Status: {status}
    </div>

    <!-- Adaptive Mode Indicator -->
    <div class="adaptive-mode" class:full={adaptiveMode === 'full'} class:reduced={adaptiveMode === 'reduced'} class:minimal={adaptiveMode === 'minimal'}>
      UI Mode: {adaptiveMode} (optimized for {connectionState.bandwidth} bandwidth)
    </div>

    <!-- Connection Status -->
    <div class="connection-status">
      <div class="connection-indicator" class:connected={connectionState.isConnected} class:disconnected={!connectionState.isConnected}>
        {connectionState.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {#if connectionState.isConnected && adaptiveMode !== 'minimal'}
        <div class="quality-indicator" class:excellent={connectionState.connectionQuality === 'excellent'} class:good={connectionState.connectionQuality === 'good'} class:poor={connectionState.connectionQuality === 'poor'}>
          Quality: {connectionState.connectionQuality}
        </div>

        {#if adaptiveMode === 'full'}
          <div class="latency-indicator">
            Latency: {connectionState.latency}ms
          </div>
        {/if}

        <div class="bandwidth-indicator" class:high={connectionState.bandwidth === 'high'} class:medium={connectionState.bandwidth === 'medium'} class:low={connectionState.bandwidth === 'low'}>
          Bandwidth: {connectionState.bandwidth}
        </div>
      {/if}

      {#if reconnectProgress}
        <div class="reconnect-indicator">
          Reconnecting... ({reconnectProgress.attempt})
        </div>
      {/if}
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

  .connection-status {
    display: flex;
    gap: 12px;
    margin: 8px 0;
    flex-wrap: wrap;
  }

  .connection-indicator, .quality-indicator, .latency-indicator, .reconnect-indicator {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    border: 1px solid;
  }

  .connection-indicator.connected {
    background: var(--vscode-inputValidation-infoBackground, #063b49);
    border-color: var(--vscode-inputValidation-infoBorder, #007acc);
  }

  .connection-indicator.disconnected {
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    border-color: var(--vscode-inputValidation-errorBorder, #be1100);
  }

  .quality-indicator.excellent {
    background: var(--vscode-inputValidation-infoBackground, #063b49);
    border-color: var(--vscode-inputValidation-infoBorder, #007acc);
  }

  .quality-indicator.good {
    background: var(--vscode-inputValidation-warningBackground, #664d00);
    border-color: var(--vscode-inputValidation-warningBorder, #ffcc00);
  }

  .quality-indicator.poor {
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    border-color: var(--vscode-inputValidation-errorBorder, #be1100);
  }

  .latency-indicator, .reconnect-indicator, .bandwidth-indicator {
    background: var(--vscode-inputValidation-warningBackground, #664d00);
    border-color: var(--vscode-inputValidation-warningBorder, #ffcc00);
  }

  .bandwidth-indicator.high {
    background: var(--vscode-inputValidation-infoBackground, #063b49);
    border-color: var(--vscode-inputValidation-infoBorder, #007acc);
  }

  .bandwidth-indicator.medium {
    background: var(--vscode-inputValidation-warningBackground, #664d00);
    border-color: var(--vscode-inputValidation-warningBorder, #ffcc00);
  }

  .bandwidth-indicator.low {
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    border-color: var(--vscode-inputValidation-errorBorder, #be1100);
  }

  .adaptive-mode {
    padding: 8px 12px;
    border-radius: 4px;
    margin: 8px 0;
    border: 1px solid;
    font-size: 14px;
  }

  .adaptive-mode.full {
    background: var(--vscode-inputValidation-infoBackground, #063b49);
    border-color: var(--vscode-inputValidation-infoBorder, #007acc);
  }

  .adaptive-mode.reduced {
    background: var(--vscode-inputValidation-warningBackground, #664d00);
    border-color: var(--vscode-inputValidation-warningBorder, #ffcc00);
  }

  .adaptive-mode.minimal {
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
