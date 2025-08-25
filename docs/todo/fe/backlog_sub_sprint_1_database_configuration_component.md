# Backlog: Sub-Sprint 1 - Database Configuration Component

**Objective:** To build the Svelte component for the database selection and management part of the setup view.

**Parent Sprint:** Sprint 1: Setup View Implementation

---

### User Story: Manage Database Configuration

**As a** new user (Devin), **I want to** select my vector database, start it if needed, and see its status, **so that** I can prepare my project for indexing.

**Workflow:**
1.  The `DatabaseSetup.svelte` component renders a dropdown for database selection and a button to start the local service.
2.  A status indicator shows the current state of the database (e.g., "Not Running", "Running").
3.  Clicking the "Start" button sends a message to the extension backend.
4.  The backend runs the necessary command and sends a status update back to the webview.

**File Changes:**
*   `webview/src/lib/components/DatabaseSetup.svelte` (New File)
*   `src/extension.ts` (Modification)
*   `webview/src/lib/stores/setupStore.ts` (Modification)

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/DatabaseSetup.svelte` (New File)
    *   **Action**: Build the UI with a Fluent UI `<Select>` component for database choice (initially just "Qdrant") and a `<Button>` to start the service.
    *   **Implementation**:
        ```html
        <script lang="ts">
          import { Button, Select } from '@svelte-fui/core';
          import { setupState } from '$lib/stores/setupStore';
          // ... message handling logic ...
        </script>
        <h2>Database Configuration</h2>
        <Select items={['Qdrant']} placeholder="Select a database" />
        <Button on:click={startDatabase}>Start Local Qdrant</Button>
        <span>Status: {$setupState.databaseReady ? 'Running' : 'Not Running'}</span>
        ```
    *   **Imports**: `@svelte-fui/core`, `../stores/setupStore`
2.  **Filepath**: `webview/src/lib/components/DatabaseSetup.svelte`
    *   **Action**: Implement the `startDatabase` function to send a `startDatabase` message via `postMessage`.
    *   **Implementation**: `const vscode = acquireVsCodeApi(); function startDatabase() { vscode.postMessage({ command: 'startDatabase' }); }`
    *   **Imports**: None.
3.  **Filepath**: `src/extension.ts`
    *   **Action**: Add a case for `startDatabase` in the `onDidReceiveMessage` listener. This should execute the `docker-compose up` command in a new terminal.
    *   **Implementation**: `case 'startDatabase': const terminal = vscode.window.createTerminal('Qdrant'); terminal.sendText('docker-compose up'); terminal.show(); break;`
    *   **Imports**: `vscode`
4.  **Filepath**: `src/extension.ts`
    *   **Action**: Implement a basic health check loop after starting the database. On success, `postMessage` to the webview with the updated status.
    *   **Implementation**: Use `setTimeout` and a fetch-like request to the Qdrant health endpoint. `panel.webview.postMessage({ command: 'databaseStatus', status: 'running' });`
    *   **Imports**: None.
5.  **Filepath**: `webview/src/lib/components/DatabaseSetup.svelte`
    *   **Action**: Add a listener for messages from the extension to update the `setupState` store.
    *   **Implementation**: `window.addEventListener('message', event => { const message = event.data; if (message.command === 'databaseStatus' && message.status === 'running') { setupState.update(s => ({ ...s, databaseReady: true })); } });`
    *   **Imports**: `setupState` from store.

**Acceptance Criteria:**
-   The dropdown displays "Qdrant" as an option.
-   Clicking the button successfully opens a terminal and runs `docker-compose up`.
-   The UI status correctly reflects the health status received from the backend, changing from "Not Running" to "Running".
-   The `databaseReady` state in the Svelte store is updated correctly.

**Dependencies:**
-   VS Code extension boilerplate must be complete.
-   A `docker-compose.yml` file must exist in the project root.
