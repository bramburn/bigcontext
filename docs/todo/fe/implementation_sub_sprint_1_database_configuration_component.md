# Implementation Guidance: Sub-Sprint 1 - Database Configuration Component

**Objective:** To provide detailed instructions for creating the `DatabaseSetup.svelte` component, handling user interaction, and communicating with the extension backend to manage the database service.

---

### 1. Component Structure (`DatabaseSetup.svelte`)

This component is responsible for the database section of the UI. It will contain a selector, a button, and a status indicator.

**File:** `webview/src/lib/components/DatabaseSetup.svelte`

```html
<script lang="ts">
  import { Button, Select } from '@svelte-fui/core';
  import { setupState } from '$lib/stores/setupStore';
  import { onMount } from 'svelte';

  // Acquire the vscode API only once
  const vscode = acquireVsCodeApi();

  function startDatabase() {
    // Disable button to prevent multiple clicks
    // You can add a 'loading' state here
    vscode.postMessage({ command: 'startDatabase' });
  }

  onMount(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data; // The JSON data from the extension
      if (message.command === 'databaseStatus') {
        console.log(`Received status: ${message.status}`);
        setupState.update(s => ({ ...s, databaseReady: message.status === 'running' }));
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup listener when component is destroyed
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  });
</script>

<div class="space-y-4 p-4 border rounded-md">
  <h3 class="text-lg font-semibold">Database Configuration</h3>
  <div class="flex items-center space-x-4">
    <Select items={['Qdrant']} placeholder="Select Database" class="flex-grow" />
    <Button variant="primary" on:click={startDatabase}>Start Local Qdrant</Button>
  </div>
  <div>
    <span>Status:</span>
    {#if $setupState.databaseReady}
      <span class="text-green-500">🟢 Running</span>
    {:else}
      <span class="text-gray-500">⚫ Not Running</span>
    {/if}
  </div>
</div>
```

### 2. Backend Logic (`src/extension.ts`)

The extension needs to listen for the `startDatabase` message and then perform two key actions:
1.  Run the Docker command.
2.  Poll a health check endpoint to verify the service is running.

```typescript
// src/extension.ts inside the onDidReceiveMessage handler

case 'startDatabase': {
    const terminal = vscode.window.createTerminal('Qdrant');
    // Assumes docker-compose.yml is in the root of the workspace
    terminal.sendText('docker-compose up');
    terminal.show();

    // Start polling for Qdrant health
    pollQdrantHealth(panel);
    return;
}

// ...

function pollQdrantHealth(panel: vscode.WebviewPanel) {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 30 seconds (30 * 1000ms)
    const interval = 1000; // 1 second

    const intervalId = setInterval(async () => {
        if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            vscode.window.showErrorMessage('Qdrant health check timed out.');
            // Optionally send a 'failed' status to the webview
            panel.webview.postMessage({ command: 'databaseStatus', status: 'failed' });
            return;
        }

        try {
            // Qdrant's default health check endpoint
            const response = await fetch('http://localhost:6333/healthz');
            if (response.ok) {
                clearInterval(intervalId);
                vscode.window.showInformationMessage('Qdrant is running!');
                panel.webview.postMessage({ command: 'databaseStatus', status: 'running' });
            }
        } catch (error) {
            // Ignore errors until timeout
            attempts++;
        }
    }, interval);
}
```

**Important Considerations:**
*   **Error Handling:** The `pollQdrantHealth` function should handle timeouts and fetch errors gracefully. It's crucial to inform the user if the database fails to start, perhaps with an error notification in VS Code.
*   **Hardcoded URL:** The URL `http://localhost:6333` is the default for Qdrant. For a more robust solution, this should be configurable.
*   **User Experience:** Provide feedback to the user that a health check is in progress (e.g., a "Checking..." status in the UI).

### 3. State Management (`setupStore.ts`)

The Svelte store remains simple for this sub-sprint. The `databaseReady` flag is the key piece of state managed here, which will be updated based on messages from the extension backend.

**File:** `webview/src/lib/stores/setupStore.ts`
```typescript
import { writable } from 'svelte/store';

export interface SetupState {
  databaseReady: boolean;
  providerSelected: string | null;
}

export const setupState = writable<SetupState>({
  databaseReady: false,
  providerSelected: null,
});
```
This typed store will help prevent errors and improve autocompletion in the Svelte components.
