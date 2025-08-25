### How to Implement Sprint 4: Onboarding & Setup UI

This sprint focuses on building the initial user interface within the VS Code extension, specifically for onboarding new users and allowing them to configure their database and embedding provider. This involves creating a VS Code Webview and integrating a Svelte frontend.

**Key Technologies and Concepts:**

*   **VS Code Webviews:** Allow you to create custom UI within VS Code using HTML, CSS, and JavaScript (or frameworks like Svelte, React, Vue).
*   **Svelte:** A reactive JavaScript framework for building user interfaces.
*   **`vscode.workspace.workspaceFolders`:** API to get information about open workspace folders.
*   **`fs` module (Node.js):** For file system operations like checking file existence.
*   **`vscode.window.createTerminal()`:** API to create and interact with VS Code integrated terminals.
*   **Message Passing (Extension <-> Webview):** Communication between the VS Code extension (Node.js/TypeScript) and the webview (Svelte/JavaScript) is done via `postMessage` and `onDidReceiveMessage`.

**Detailed Implementation Steps and Code Examples:**

1.  **Create and Manage VS Code Webview:**
    The `extension.ts` file will be responsible for creating the webview panel and loading your Svelte application into it. It will also handle communication between the extension and the webview.
    *   **File:** `extension.ts`
    *   **Code Example (within `activate` function):**
        ```typescript
        import * as vscode from 'vscode';
        import * as path from 'path';
        import * as fs from 'fs';
        // ... (other imports like child_process, fetch) ...

        export function activate(context: vscode.ExtensionContext) {
            // ... (backend process management setup) ...

            // Create and show the webview panel
            const panel = vscode.window.createWebviewPanel(
                'codeContext', // Unique ID for the webview
                'Code Context', // Title shown in VS Code tab
                vscode.ViewColumn.One, // Where to open the panel (e.g., in the first editor column)
                {
                    enableScripts: true, // VERY IMPORTANT: Allows JavaScript to run in the webview
                    // Restrict the webview to only load resources from our extension's 'webview/dist' directory
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))]
                }
            );

            // Get the path to the SvelteKit build output (index.html)
            const svelteAppPath = path.join(context.extensionPath, 'webview', 'dist', 'index.html');
            if (!fs.existsSync(svelteAppPath)) {
                vscode.window.showErrorMessage('Svelte webview build not found. Please run `npm run build` in the webview directory.');
                return;
            }
            panel.webview.html = fs.readFileSync(svelteAppPath, 'utf8');

            // Check for existing configuration file
            const workspaceFolders = vscode.workspace.workspaceFolders;
            let configFilePath: string | undefined;
            if (workspaceFolders && workspaceFolders.length > 0) {
                // Assuming config file is in .vscode/code-context.json relative to workspace root
                configFilePath = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'code-context.json');
            }

            let initialView: 'setup' | 'query' = 'setup';
            if (configFilePath && fs.existsSync(configFilePath)) {
                initialView = 'query'; // If config exists, show query view
            }

            // Send initial view state to the Svelte webview
            panel.webview.postMessage({ type: 'initialView', view: initialView });

            // Handle messages received from the webview (e.g., user clicks a button)
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'alert':
                            vscode.window.showInformationMessage(message.text);
                            return;
                        case 'startDocker':
                            handleStartDockerCommand(message.service, context);
                            return;
                        case 'saveConfigAndIndex':
                            // Implement saving config and triggering indexing in a later sprint
                            vscode.window.showInformationMessage('Configuration saved (not yet implemented) and indexing will start!');
                            return;
                    }
                },
                undefined,
                context.subscriptions // Ensure the message listener is disposed
            );

            // Add the panel to the extension's disposables so it's cleaned up when the extension deactivates
            context.subscriptions.push(panel);
        }
        ```
    *   **Guidance:**
        *   `enableScripts: true` is crucial for your Svelte app to run.
        *   `localResourceRoots` is a security measure to prevent the webview from loading arbitrary content.
        *   `panel.webview.html = fs.readFileSync(...)` loads your Svelte app's `index.html`.
        *   `panel.webview.postMessage` sends data to the webview.
        *   `panel.webview.onDidReceiveMessage` listens for data from the webview.

2.  **Svelte App Structure and View Management:**
    Your Svelte application will have a main `App.svelte` component that conditionally renders `SetupView.svelte` or `QueryView.svelte` based on a Svelte store.
    *   **File:** `webview/src/lib/stores/viewStore.ts` (New File)
    *   **Code Example:**
        ```typescript
        import { writable } from 'svelte/store';

        // Defines the current view of the webview: 'setup' or 'query'
        export const currentView = writable<'setup' | 'query'>('setup');
        ```
    *   **File:** `webview/src/App.svelte` (Main Svelte component)
    *   **Code Example:**
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
                        // Add cases for other messages from extension (e.g., backend status updates)
                    }
                });
            });
        </script>

        <main>
            {#if $currentView === 'setup'}
                <SetupView />
            {:else if $currentView === 'query'}
                <QueryView />
            {/if}
        </main>

        <style>
            /* Global styles for your Svelte app */
            body {
                margin: 0;
                padding: 0;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            /* You can use VS Code CSS variables for theming */
        </style>
        ```
    *   **Guidance:** The `onMount` lifecycle hook is used to set up the message listener. The `{#if}` block conditionally renders components.

3.  **Implement `SetupView.svelte`:**
    This component will contain the UI elements for selecting database/embedding providers and the "Start Local" buttons.
    *   **File:** `webview/src/lib/components/SetupView.svelte` (New File)
    *   **Code Example:**
        ```svelte
        <script lang="ts">
            import { postMessageToVsCode } from '../utils/vscode'; // Utility to send messages to extension

            let selectedDatabase: string = 'qdrant'; // Default selection
            let selectedEmbeddingProvider: string = 'ollama'; // Default selection

            function handleStartLocalService(service: string) {
                // Send a message to the VS Code extension to execute the Docker command
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
            <h1>Code Context Setup</h1>

            <section>
                <h2>Database Configuration</h2>
                <label for="database-select">Select Database:</label>
                <select id="database-select" bind:value={selectedDatabase}>
                    <option value="qdrant">Qdrant (Local)</option>
                    <!-- Add more database options here as they are supported -->
                </select>
                <button on:click={() => handleStartLocalService('qdrant')}>Start Local Qdrant</button>
                <!-- Future: Add status indicator (e.g., "Running", "Stopped") -->
            </section>

            <section>
                <h2>Embedding Provider Configuration</h2>
                <label for="embedding-select">Select Embedding Provider:</label>
                <select id="embedding-select" bind:value={selectedEmbeddingProvider}>
                    <option value="ollama">Ollama (Local)</option>
                    <!-- Add more embedding provider options here -->
                </select>
                <button on:click={() => handleStartLocalService('ollama')}>Start Local Ollama</button>
                <!-- Future: Add status indicator -->
            </section>

            <button on:click={handleSaveAndIndex}>Save & Index</button>
        </div>

        <style>
            /* Basic styling for the setup view */
            .setup-container {
                padding: 20px;
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
            }
            section {
                margin-bottom: 20px;
                border: 1px solid var(--vscode-panel-border);
                padding: 15px;
                border-radius: 5px;
                background-color: var(--vscode-editorGroup-background);
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
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
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
    *   **Guidance:** `bind:value` creates two-way data binding for select elements. `postMessageToVsCode` is a custom utility.

4.  **Create `postMessageToVsCode` Utility:**
    This simple utility abstracts the `acquireVsCodeApi()` call, making it easier to send messages from Svelte to the extension.
    *   **File:** `webview/src/lib/utils/vscode.ts` (New File)
    *   **Code Example:**
        ```typescript
        // This function is provided by VS Code to webviews to communicate back to the extension.
        // It must be called exactly once per webview panel.
        declare const acquireVsCodeApi: any;
        const vscode = acquireVsCodeApi();

        /**
         * Sends a message from the Svelte webview to the VS Code extension.
         * @param command The command string (e.g., 'startDocker', 'saveConfig').
         * @param data Any additional data to send with the command.
         */
        export function postMessageToVsCode(command: string, data: any) {
            vscode.postMessage({ command, ...data });
        }
        ```
    *   **Guidance:** `acquireVsCodeApi()` is a global function available in webview contexts.

5.  **Implement `handleStartDockerCommand` in Extension:**
    This function in `extension.ts` will receive messages from the webview and execute the appropriate Docker commands in a new VS Code terminal.
    *   **File:** `extension.ts`
    *   **Code Example (add as a new function):**
        ```typescript
        // ... (inside extension.ts, after activate/deactivate) ...

        function handleStartDockerCommand(service: string, context: vscode.ExtensionContext) {
            let command: string;
            let terminalName: string;
            let cwd: string | undefined; // Current working directory for the terminal

            // Assuming docker-compose files are in a 'docker' sub-directory of the extension
            const dockerComposeDir = path.join(context.extensionPath, 'docker');

            switch (service) {
                case 'qdrant':
                    command = 'docker-compose -f docker-compose.qdrant.yml up -d';
                    terminalName = 'Code Context: Qdrant';
                    cwd = dockerComposeDir; // Run docker-compose from its directory
                    break;
                case 'ollama':
                    // Example Ollama command to run it as a detached container
                    command = 'docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama';
                    terminalName = 'Code Context: Ollama';
                    // Ollama command can be run from any directory, no specific cwd needed
                    break;
                default:
                    vscode.window.showErrorMessage(`Unknown service to start: ${service}`);
                    return;
            }

            const terminal = vscode.window.createTerminal({
                name: terminalName,
                cwd: cwd // Set the working directory for the terminal
            });
            terminal.show(); // Show the terminal panel
            terminal.sendText(command); // Send the command to the terminal

            vscode.window.showInformationMessage(`Attempting to start ${service} via Docker. Check '${terminalName}' terminal for status.`);
            // In a real scenario, you'd also want to poll the health of these services
            // and update the UI status in SetupView.svelte.
        }
        ```
    *   **Guidance:**
        *   `vscode.window.createTerminal()` creates a new integrated terminal.
        *   `terminal.show()` brings the terminal into focus.
        *   `terminal.sendText()` sends the command to be executed in the terminal.
        *   Consider adding a `docker-compose.qdrant.yml` file in a `docker` directory within your extension for Qdrant.

6.  **Create Placeholder `QueryView.svelte`:**
    This component will be displayed when a `code-context.json` file is found, indicating the project is already set up.
    *   **File:** `webview/src/lib/components/QueryView.svelte` (New File)
    *   **Code Example:**
        ```svelte
        <script lang="ts">
            // This component will be developed in a later sprint for querying functionality.
        </script>

        <div class="query-container">
            <h1>Code Context Query</h1>
            <p>Your project is configured. Query functionality will be available here soon!</p>
            <!-- Future: Input box for queries, display area for results -->
        </div>

        <style>
            .query-container {
                padding: 20px;
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
            }
        </style>
        ```
    *   **Guidance:** This is a minimal placeholder for now.

**Verification:**

*   **Build Svelte App:** Before testing, navigate to your `webview` directory and run `npm install` and then `npm run build` to compile your Svelte app into the `dist` folder.
*   **VS Code Testing:**
    1.  Open VS Code with an empty folder (no `.vscode/code-context.json`). Activate your extension. Verify that the "Code Context" webview panel appears and displays the `SetupView` with dropdowns and buttons.
    2.  Create an empty file at `.vscode/code-context.json` in your workspace root. Reload the VS Code window (Ctrl+R or Cmd+R). Verify that the webview now displays the `QueryView` placeholder.
    3.  Go back to the `SetupView` (by deleting `.vscode/code-context.json` and reloading). Click the "Start Local Qdrant" button. Verify a new VS Code terminal opens and the `docker-compose` command is executed. Repeat for "Start Local Ollama".
