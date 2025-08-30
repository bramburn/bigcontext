<script>
  import { onMount } from 'svelte';
  let status = 'initializing...';
  let logs = [];

  function log(msg) {
    const line = `${new Date().toISOString()} - ${msg}`;
    logs = [...logs, line];
  }

  onMount(() => {
    let retries = 0; const maxRetries = 10;
    function init(){
      if (window.acquireVsCodeApi) {
        try {
          const vscode = window.acquireVsCodeApi();
          status = 'VS Code API acquired';
          log('Posting webviewReady (test-basic)');
          vscode.postMessage({ command: 'webviewReady', view: 'test-basic', ts: Date.now() });
          window.addEventListener('message', (e) => log('From extension: '+JSON.stringify(e.data)));
        } catch (e) {
          status = 'Error acquiring VS Code API';
          log(e.message);
        }
      } else if (retries < maxRetries) {
        retries++; status = `VS Code API not ready, retry ${retries}/${maxRetries}`;
        setTimeout(init, 150);
      } else {
        status = 'VS Code API unavailable after retries';
        log('Giving up');
      }
    }
    init();
  });
</script>

<svelte:head>
  <title>Test Basic View</title>
</svelte:head>

<h2>Test Basic View</h2>
<p>{status}</p>
<pre>{logs.join('\n')}</pre>

