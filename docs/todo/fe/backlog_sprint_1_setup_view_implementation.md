# Backlog: Sprint 1 - Setup View Implementation

**Objective:** To build the complete user onboarding and setup UI within the VS Code extension's webview. This view is the user's first interaction and must clearly guide them through configuring the necessary database and embedding providers for a new, un-indexed repository.

---

### User Story 1: Display Initial Setup Screen

**As a** new user (Devin), **I want to** see a clear setup screen when I open an un-indexed project, **so that** I know what I need to do to get started.

**Workflow:**
1.  The extension's activation logic checks if a `code-context.json` file exists in the root of the opened workspace.
2.  If the file does not exist, the extension opens a new Webview panel displaying the `SetupView`.
3.  The `SetupView` component renders the primary UI structure.

**Codebase Review:**
*   `src/extension.ts`: Will need modification to add the file check and the command to launch the webview.
*   `webview/`: This directory is currently empty. The entire SvelteKit application will be created here.

**File Changes:**
*   `src/extension.ts`: Modify `activate` function.
*   `webview/src/+page.svelte` (New File): To be created as the main `SetupView` component.

**Actions to Undertake:**
1.  **Filepath**: `src/extension.ts`
    *   **Action**: On activation, check for the existence of `code-context.json` in the workspace root.
    *   **Implementation**: Use `vscode.workspace.findFiles('code-context.json')` to check for the file. If the result is empty, set a context key like `code-context.isConfigured: false`.
    *   **Imports**: `import * as vscode from 'vscode';`
2.  **Filepath**: `package.json`
    *   **Action**: Add a `when` clause to the `viewsWelcome` contribution point to show a welcome view with a "Setup Project" button only when `!code-context.isConfigured`.
    *   **Implementation**:
        ```json
        "contributes": {
          "viewsWelcome": [
            {
              "view": "explorer",
              "contents": "Welcome to Code Context! [Setup Project](command:code-context.setup)\n",
              "when": "!code-context.isConfigured"
            }
          ]
        }
        ```
3.  **Filepath**: `src/extension.ts`
    *   **Action**: Register a command `code-context.setup` that creates and shows a new webview panel.
    *   **Implementation**: Use `vscode.window.createWebviewPanel` to create the panel. The panel should load the SvelteKit build output.
    *   **Imports**: `import * as path from 'path';`, `import * as fs from 'fs';`
4.  **Filepath**: `webview/src/+page.svelte` (New File)
    *   **Action**: Create the main Svelte component for the setup view.
    *   **Implementation**:
        ```html
        <script>
          import DatabaseSetup from '$lib/components/DatabaseSetup.svelte';
          import EmbeddingSetup from '$lib/components/EmbeddingSetup.svelte';
        </script>
        <h1>Code Context Setup</h1>
        <DatabaseSetup />
        <EmbeddingSetup />
        ```
    *   **Imports**: None.

**Acceptance Criteria:**
-   When a project without `code-context.json` is opened, a welcome view in the explorer prompts the user to set up the project.
-   Running the setup command opens a webview titled "Code Context Setup".
-   The view contains distinct sections for "Database Configuration" and "Embedding Provider".
-   The primary call-to-action button ("Index Now") is initially disabled.

---

### User Story 2: Configure Vector Database

**As a** new user (Devin), **I want to** select my desired vector database and get help starting it if it's not running, **so that** my code can be indexed.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/DatabaseSetup.svelte` (New File)
    *   **Action**: Create a Svelte component for database configuration.
    *   **Implementation**: Include a Fluent UI `<Select>` for "Qdrant" and a `<Button>` labeled "Start Local Qdrant".
    *   **Imports**: `import { Select, Button } from '@svelte-fui/core';`
2.  **Filepath**: `webview/src/lib/components/DatabaseSetup.svelte`
    *   **Action**: Implement the button's `on:click` handler to send a message to the VS Code extension host.
    *   **Implementation**: `vscode.postMessage({ command: 'startDatabase' });`
    *   **Imports**: None.
3.  **Filepath**: `src/extension.ts`
    *   **Action**: Add a message listener to the webview panel to handle the `startDatabase` command.
    *   **Implementation**: The listener will execute `docker-compose up` in a new VS Code terminal.
    *   **Implementation**: `const terminal = vscode.window.createTerminal('Qdrant'); terminal.sendText('docker-compose up'); terminal.show();`
    *   **Imports**: `import * as vscode from 'vscode';`
4.  **Filepath**: `webview/src/lib/components/DatabaseSetup.svelte`
    *   **Action**: Display a status icon that changes from "Not Running" to "Running" based on a message from the backend.
    *   **Implementation**: The extension backend will perform a health check and `postMessage` to the webview with the status.
    *   **Imports**: None.

**Acceptance Criteria:**
-   A dropdown allows selecting "Qdrant".
-   Clicking "Start Local Qdrant" opens a new terminal and runs `docker-compose up`.
-   A status indicator correctly reflects the database's running status after a health check from the backend.

---

### User Story 3: Configure Embedding Provider

**As a** new user (Devin), **I want to** choose which embedding model to use for indexing my code, **so that** the context is generated accurately.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/EmbeddingSetup.svelte` (New File)
    *   **Action**: Create a Svelte component for embedding provider selection.
    *   **Implementation**: Use a Fluent UI `<Select>` with options "Ollama" and "OpenAI".
    *   **Imports**: `import { Select } from '@svelte-fui/core';`
2.  **Filepath**: `webview/src/lib/stores/setupStore.ts` (New File)
    *   **Action**: Create a Svelte writable store to manage the setup state.
    *   **Implementation**: `export const setupState = writable({ databaseReady: false, providerSelected: null });`
    *   **Imports**: `import { writable } from 'svelte/store';`
3.  **Filepath**: `webview/src/+page.svelte`
    *   **Action**: Create the main "Index Now" button. Its `disabled` attribute should be reactively bound to the store's state.
    *   **Implementation**: `<Button disabled={!$setupState.databaseReady || !$setupState.providerSelected}>Index Now</Button>`
    *   **Imports**: `import { Button } from '@svelte-fui/core';`, `import { setupState } from '$lib/stores/setupStore';`
4.  **Filepath**: `webview/src/+page.svelte`
    *   **Action**: When clicked, the "Index Now" button sends the selected configuration to the extension backend.
    *   **Implementation**: `vscode.postMessage({ command: 'startIndexing', config: $setupState });`
    *   **Imports**: None.

**Acceptance Criteria:**
-   A dropdown allows selecting "Ollama" or "OpenAI".
-   The "Index Now" button is enabled only after the database is running and an embedding provider is selected.
-   Clicking the button sends the chosen configuration to the extension backend.

**Testing Plan:**
-   **Manual Test Case 1**: Open a project without `code-context.json`. Verify the welcome view appears.
-   **Manual Test Case 2**: Click the setup button. Verify the webview opens.
-   **Manual Test Case 3**: Click "Start Local Qdrant". Verify a terminal opens and runs the command.
-   **Manual Test Case 4**: Select an embedding provider. Verify the "Index Now" button becomes enabled once the DB is "running".
-   **Manual Test Case 5**: Click "Index Now" and verify the configuration is sent to the extension (check debugger).
