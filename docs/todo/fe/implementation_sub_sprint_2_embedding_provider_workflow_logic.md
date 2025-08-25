# Implementation Guidance: Sub-Sprint 2 - Embedding Provider & Workflow Logic

**Objective:** To provide instructions for creating the `EmbeddingSetup.svelte` component and managing the application state to control the main indexing workflow.

---

### 1. Component Structure (`EmbeddingSetup.svelte`)

This component allows the user to select their preferred embedding provider. The selection will be stored in our central Svelte store.

**File:** `webview/src/lib/components/EmbeddingSetup.svelte`

```html
<script lang="ts">
  import { Select } from '@svelte-fui/core';
  import { setupState } from '$lib/stores/setupStore';

  const embeddingProviders = [
    { label: 'Ollama (Local)', value: 'ollama' },
    { label: 'OpenAI', value: 'openai' }
  ];

  // This function updates the central store when a selection is made.
  function handleProviderSelect(event: CustomEvent<{ value: string; label: string }>) {
    if (event.detail.value) {
      setupState.update(s => ({ ...s, providerSelected: event.detail.value }));
    }
  }
</script>

<div class="space-y-4 p-4 border rounded-md">
  <h3 class="text-lg font-semibold">Embedding Provider</h3>
  <Select
    items={embeddingProviders}
    placeholder="Select a provider"
    on:change={handleProviderSelect}
    class="w-full"
  />
  {#if $setupState.providerSelected}
    <p class="text-sm text-gray-600">You have selected: {$setupState.providerSelected}</p>
  {/if}
</div>
```

### 2. Finalizing the Workflow (`SetupView.svelte` / `+page.svelte`)

The main view component will now bring everything together. It will use a Svelte "derived store" (`$:` syntax) to automatically compute whether the "Index Now" button should be enabled.

**File:** `webview/src/routes/+page.svelte`

```html
<script lang="ts">
  import { Button } from '@svelte-fui/core';
  import { setupState } from '$lib/stores/setupStore';
  import DatabaseSetup from '$lib/components/DatabaseSetup.svelte';
  import EmbeddingSetup from '$lib/components/EmbeddingSetup.svelte';

  // Acquire the vscode API once at the top level
  const vscode = acquireVsCodeApi();

  // This is a "derived" variable. It will automatically update
  // whenever the values inside $setupState change.
  $: canStartIndex = $setupState.databaseReady && $setupState.providerSelected;

  function startIndexing() {
    if (!canStartIndex) return; // Safety check

    // Send the entire configuration state to the backend
    vscode.postMessage({
      command: 'startIndexing',
      config: $setupState
    });
  }
</script>

<div class="p-8 space-y-6">
  <h1 class="text-2xl font-bold">Code Context Setup</h1>

  <DatabaseSetup />
  <EmbeddingSetup />

  <div class="pt-6 text-center">
    <Button
      variant="accent"
      class="w-full max-w-xs"
      disabled={!canStartIndex}
      on:click={startIndexing}
    >
      Index Now
    </Button>
    {#if !canStartIndex}
      <p class="text-sm text-gray-500 mt-2">
        Please start the database and select an embedding provider to continue.
      </p>
    {/if}
  </div>
</div>
```

### 3. Backend Logic (`src/extension.ts`)

The final step is to handle the `startIndexing` message in the extension. For this sub-sprint, we will simply acknowledge the message and log the configuration. In a future sprint, this is where the logic to write the `code-context.json` file and trigger the backend indexing process would go.

```typescript
// src/extension.ts inside the onDidReceiveMessage handler

case 'startIndexing': {
    const config = message.config; // config is the SetupState object
    console.log('Received configuration:', config);

    // 1. Save the configuration to code-context.json
    // const workspaceFolders = vscode.workspace.workspaceFolders;
    // if (workspaceFolders) {
    //   const configPath = vscode.Uri.joinPath(workspaceFolders[0].uri, 'code-context.json');
    //   const configData = Buffer.from(JSON.stringify(config, null, 2));
    //   await vscode.workspace.fs.writeFile(configPath, configData);
    // }

    // 2. Show a confirmation to the user
    vscode.window.showInformationMessage(
        `Configuration saved! Starting indexing with ${config.providerSelected}.`
    );

    // 3. Close the webview panel
    panel.dispose();

    // 4. (Future) Trigger the actual indexing process in the C# backend.
    return;
}
```

This completes the frontend workflow for the setup view. The UI now captures all necessary user input and sends it to the extension backend when the user is ready to proceed.
