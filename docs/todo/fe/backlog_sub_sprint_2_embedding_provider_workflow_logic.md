# Backlog: Sub-Sprint 2 - Embedding Provider & Workflow Logic

**Objective:** To build the embedding provider selection component and the final workflow logic to enable indexing.

**Parent Sprint:** Sprint 1: Setup View Implementation

---

### User Story: Select Embedding Provider and Start Indexing

**As a** new user (Devin), **I want to** choose my embedding provider and trigger the indexing process, **so that** my code context can be generated.

**Workflow:**
1.  The `EmbeddingSetup.svelte` component renders a dropdown for selecting an embedding provider.
2.  The main `SetupView` component contains the "Index Now" button, which is disabled by default.
3.  The button's state is reactively bound to the `setupState` store. It becomes enabled only when the database is ready AND an embedding provider has been selected.
4.  Clicking the button sends the complete configuration to the extension backend to begin the indexing process.

**File Changes:**
*   `webview/src/lib/components/EmbeddingSetup.svelte` (New File)
*   `webview/src/lib/stores/setupStore.ts` (Modification)
*   `webview/src/routes/+page.svelte` (Modification)
*   `src/extension.ts` (Modification)

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/EmbeddingSetup.svelte` (New File)
    *   **Action**: Build the UI with a Fluent UI `<Select>` component to choose between "Ollama" and "OpenAI".
    *   **Implementation**:
        ```html
        <script lang="ts">
          import { Select } from '@svelte-fui/core';
          import { setupState } from '$lib/stores/setupStore';
          const providers = ['Ollama', 'OpenAI'];
          function handleSelect(event) {
            setupState.update(s => ({ ...s, providerSelected: event.detail.value }));
          }
        </script>
        <h2>Embedding Provider</h2>
        <Select items={providers} placeholder="Select a provider" on:change={handleSelect} />
        ```
    *   **Imports**: `@svelte-fui/core`, `../stores/setupStore`
2.  **Filepath**: `webview/src/lib/stores/setupStore.ts`
    *   **Action**: Ensure the store can hold the selected provider's name.
    *   **Implementation**: The existing `providerSelected: string | null;` in the `SetupState` interface is sufficient.
    *   **Imports**: None.
3.  **Filepath**: `webview/src/routes/+page.svelte`
    *   **Action**: Add the "Index Now" button and bind its `disabled` property to a derived state from the store.
    *   **Implementation**:
        ```html
        <script lang="ts">
          import { setupState } from '$lib/stores/setupStore';
          import { Button } from '@svelte-fui/core';
          $: canStartIndex = $setupState.databaseReady && $setupState.providerSelected;
          function startIndexing() {
            vscode.postMessage({ command: 'startIndexing', config: $setupState });
          }
        </script>
        <Button variant="accent" disabled={!canStartIndex} on:click={startIndexing}>Index Now</Button>
        ```
    *   **Imports**: `setupState`, `Button`
4.  **Filepath**: `src/extension.ts`
    *   **Action**: Add a case for `startIndexing` in the `onDidReceiveMessage` listener.
    *   **Implementation**: `case 'startIndexing': const config = message.config; vscode.window.showInformationMessage(`Starting indexing with provider: ${config.providerSelected}`); // Future logic to save config and start backend process goes here. break;`
    *   **Imports**: `vscode`

**Acceptance Criteria:**
-   The dropdown displays "Ollama" and "OpenAI" as options.
-   Selecting a provider updates the `providerSelected` field in the Svelte store.
-   The "Index Now" button is disabled by default.
-   The button becomes enabled only after the database is running AND a provider is selected.
-   Clicking the button successfully sends the full configuration details to the extension backend.

**Dependencies:**
-   Sub-Sprint 1 must be complete.
