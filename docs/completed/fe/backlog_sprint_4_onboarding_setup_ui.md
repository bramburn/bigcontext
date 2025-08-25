### User Story 1: Display Setup/Query UI Based on Index Status
**As Devin, when I open a new project, I want the** extension to check if it's been indexed and show me a setup screen if it hasn't.

**Actions to Undertake:**
1.  **Filepath**: `extension.ts`
    -   **Action**: Check for the existence of `.vscode/code-context.json` on extension activation.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import * as path from 'path';
        import * as fs from 'fs';

        // ... (existing imports and backend process management logic) ...

        export function activate(context: vscode.ExtensionContext) {
            // ... (existing backend process spawning and health check setup) ...

            // Create and show the webview panel
            const panel = vscode.window.createWebviewPanel(
                'codeContext', // Identifies the type of the webview
                'Code Context', // Title of the panel displayed to the user
                vscode.ViewColumn.One, // Editor column to show the new webview panel in
                {
                    enableScripts: true, // Enable JavaScript in the webview
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))]
                }
            );

            // Get path to SvelteKit build output
            const svelteAppPath = path.join(context.extensionPath, 'webview', 'dist', 'index.html');
            panel.webview.html = fs.readFileSync(svelteAppPath, 'utf8');

            // Check for code-context.json
            const workspaceFolders = vscode.workspace.workspaceFolders;
            let configFilePath: string | undefined;
            if (workspaceFolders && workspaceFolders.length > 0) {
                configFilePath = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'code-context.json');
            }

            let initialView: 'setup' | 'query' = 'setup';
            if (configFilePath && fs.existsSync(configFilePath)) {
                initialView = 'query';
            }

            // Send initial view state to webview
            panel.webview.postMessage({ type: 'initialView', view: initialView });

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'alert':
                            vscode.window.showInformationMessage(message.text);
                            return;
                        case 'startDocker':
                            // Handle Docker command execution
                            handleStartDockerCommand(message.service, context);
                            return;
                        // ... other commands
                    }
                },
                undefined,
                context.subscriptions
            );

            // Add panel to disposables
            context.subscriptions.push(panel);
        }

        // ... (deactivate function) ...
        ```
    -   **Imports**: `import * as fs from 'fs';`
2.  **Filepath**: `webview/src/lib/stores/viewStore.ts` (New File)
    -   **Action**: Create a Svelte store to manage the current view state (`'setup'` or `'query'`).
    -   **Implementation**:
        ```typescript
        import { writable } from 'svelte/store';

        export const currentView = writable<'setup' | 'query'>('setup'); // Default to setup
        ```
    -   **Imports**: `import { writable } from 'svelte/store';`
3.  **Filepath**: `webview/src/App.svelte` (Main Svelte component)
    -   **Action**: Render `SetupView.svelte` or `QueryView.svelte` based on the `currentView` store.
    -   **Implementation**:
        ```svelte
        <script lang="ts">
            import { onMount } from 'svelte';
            import { currentView } from './lib/stores/viewStore';
            import SetupView from './lib/components/SetupView.svelte';
            import QueryView from './lib/components/QueryView.svelte';

            onMount(() => {
                // Listen for messages from the VS Code extension
                window.addEventListener('message', event => {
                    const message = event.data; // The JSON data that the extension sent
                    switch (message.type) {
                        case 'initialView':
                            currentView.set(message.view);
                            break;
                        // ... handle other messages like backend status
                    }
                });
            });
        </script>

        {#if $currentView === 'setup'}
            <SetupView />
        {:else if $currentView === 'query'}
            <QueryView />
        {/if}
        ```
    -   **Imports**: `import { onMount } from 'svelte';`, `import { currentView } from './lib/stores/viewStore';`, `import SetupView from './lib/components/SetupView.svelte';`, `import QueryView from './lib/components/QueryView.svelte';`

### User Story 2: Implement Setup UI with Docker Helper
**As Devin, I want the** setup screen to let me choose my database and embedding provider, with helper buttons to start any required local services.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/SetupView.svelte` (New File)
    -   **Action**: Create the Svelte component for the setup view with dropdowns for database/embedding provider and a "Start Local" button.
    -   **Implementation**:
        ```svelte
        <script lang="ts">
            import { createEventDispatcher } from 'svelte';
            import { postMessageToVsCode } from '../utils/vscode'; // Helper to send messages to extension

            const dispatch = createEventDispatcher();

            let selectedDatabase: string = 'qdrant'; // Default
            let selectedEmbeddingProvider: string = 'ollama'; // Default

            function handleStartLocalService(service: string) {
                postMessageToVsCode('startDocker', { service });
            }

            function handleSaveAndIndex() {
                // Send configuration to extension to save and trigger indexing
                postMessageToVsCode('saveConfigAndIndex', {
                    database: selectedDatabase,
                    embeddingProvider: selectedEmbeddingProvider
                });
            }
        </script>

        <div class="setup-container">
            <h1>Setup Code Context</h1>

            <section>
                <h2>Database Configuration</h2>
                <label for="database-select">Select Database:</label>
                <select id="database-select" bind:value={selectedDatabase}>
                    <option value="qdrant">Qdrant (Local)</option>
                    <!-- Add other options later -->
                </select>
                <button on:click={() => handleStartLocalService('qdrant')}>Start Local Qdrant</button>
                <!-- Add status indicator here -->
            </section>

            <section>
                <h2>Embedding Provider Configuration</h2>
                <label for="embedding-select">Select Embedding Provider:</label>
                <select id="embedding-select" bind:value={selectedEmbeddingProvider}>
                    <option value="ollama">Ollama (Local)</option>
                    <!-- Add other options later -->
                </select>
                <button on:click={() => handleStartLocalService('ollama')}>Start Local Ollama</button>
                <!-- Add status indicator here -->
            </section>

            <button on:click={handleSaveAndIndex}>Save & Index</button>
        </div>

        <style>
            /* Basic styling for layout */
            .setup-container {
                padding: 20px;
                font-family: sans-serif;
            }
            section {
                margin-bottom: 20px;
                border: 1px solid #ccc;
                padding: 15px;
                border-radius: 5px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            select, button {
                margin-right: 10px;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid #ddd;
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                cursor: pointer;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
        </style>
        ```
    -   **Imports**: `import { createEventDispatcher } from 'svelte';`, `import { postMessageToVsCode } from '../utils/vscode';`
2.  **Filepath**: `webview/src/lib/utils/vscode.ts` (New File)
    -   **Action**: Create a utility function to send messages from the Svelte webview to the VS Code extension.
    -   **Implementation**:
        ```typescript
        // This is how you send messages from the webview to the extension
        declare const acquireVsCodeApi: any;
        const vscode = acquireVsCodeApi();

        export function postMessageToVsCode(command: string, data: any) {
            vscode.postMessage({ command, ...data });
        }
        ```
    -   **Imports**: None (uses `declare const acquireVsCodeApi: any;` for VS Code API)
3.  **Filepath**: `extension.ts`
    -   **Action**: Implement `handleStartDockerCommand` to open a new VS Code terminal and run `docker-compose` commands.
    -   **Implementation**:
        ```typescript
        // ... (inside extension.ts, after activate/deactivate) ...

        function handleStartDockerCommand(service: string, context: vscode.ExtensionContext) {
            let command: string;
            let terminalName: string;

            switch (service) {
                case 'qdrant':
                    command = 'docker-compose -f docker-compose.qdrant.yml up -d'; // Assuming a docker-compose file
                    terminalName = 'Qdrant Docker';
                    break;
                case 'ollama':
                    command = 'docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama'; // Example Ollama command
                    terminalName = 'Ollama Docker';
                    break;
                default:
                    vscode.window.showErrorMessage(`Unknown service to start: ${service}`);
                    return;
            }

            const terminal = vscode.window.createTerminal(terminalName);
            terminal.show();
            terminal.sendText(command);

            // Optional: You might want to poll for service health after starting Docker
            // and send a message back to the webview to update status.
            // For this backlog, we'll assume the command execution is sufficient.
        }
        ```
    -   **Imports**: None.
4.  **Filepath**: `webview/src/lib/components/QueryView.svelte` (New File)
    -   **Action**: Create a placeholder Svelte component for the query view.
    -   **Implementation**:
        ```svelte
        <script lang="ts">
            // Placeholder for future query functionality
        </script>

        <div class="query-container">
            <h1>Code Context Query</h1>
            <p>Your code is indexed. Query functionality will be available here soon!</p>
            <!-- Future: input box, results display -->
        </div>

        <style>
            .query-container {
                padding: 20px;
                font-family: sans-serif;
            }
        </style>
        ```
    -   **Imports**: None.

**Acceptance Criteria:**
-   On extension activation, the webview panel is displayed.
-   If `.vscode/code-context.json` does not exist in the workspace root, the `SetupView` component is rendered.
-   If `.vscode/code-context.json` exists, the `QueryView` component is rendered.
-   The `SetupView` contains dropdowns for selecting database and embedding provider.
-   "Start Local" buttons are present next to the selections.
-   Clicking a "Start Local" button opens a new VS Code terminal and executes the corresponding Docker command.
-   (Implicit) The UI can receive and display status updates (e.g., "Running") for the Docker services.

**Testing Plan:**
-   **Test Case 1**: Start VS Code with an empty workspace (no `.vscode/code-context.json`). Verify the `SetupView` is displayed.
-   **Test Case 2**: Create an empty `.vscode/code-context.json` file in the workspace root. Restart VS Code. Verify the `QueryView` is displayed.
-   **Test Case 3**: In `SetupView`, click the "Start Local Qdrant" button. Verify a new terminal opens and the `docker-compose` command is executed.
-   **Test Case 4**: In `SetupView`, click the "Start Local Ollama" button. Verify a new terminal opens and the `docker run` command is executed.
-   **Test Case 5**: (Manual) Verify that the dropdowns in `SetupView` are functional.
