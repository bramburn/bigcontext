## Implementation Guide: Sprint 2 - Diagnostics View Refactoring

This guide provides the technical details for refactoring the Svelte settings page into a read-only diagnostics and status view.

### **Objective**
To create a dedicated "Status & Diagnostics" panel that displays read-only configuration and provides action buttons for testing connections, accessible via a new VS Code command.

---

### **Part 1: Creating the Diagnostics Command and Panel**

First, you'll register a new command and create the `WebviewManager` logic to show the panel.

**Relevant API/Documentation:**
*   **VS Code Commands:** [https://code.visualstudio.com/api/references/contribution-points#contributes.commands](https://code.visualstudio.com/api/references/contribution-points#contributes.commands)
*   **Webview Panel API:** [https://code.visualstudio.com/api/extension-guides/webview](https://code.visualstudio.com/api/extension-guides/webview)

**Implementation Steps:**

1.  **Add Command in `package.json`**
    **Filepath**: `package.json`
    ```json
    "commands": [
        // ... other commands
        {
            "command": "code-context-engine.openDiagnostics",
            "title": "Code Context Engine: Open Diagnostics"
        }
    ]
    ```

2.  **Register Command in `commandManager.ts`**
    **Filepath**: `src/commandManager.ts`
    ```typescript
    // In constructor or registration method
    this.registerCommand('code-context-engine.openDiagnostics', this.handleOpenDiagnostics.bind(this));

    // New handler method
    private handleOpenDiagnostics() {
        this.webviewManager.showDiagnosticsPanel();
    }
    ```

3.  **Implement `showDiagnosticsPanel` in `webviewManager.ts`**
    Use a singleton pattern to ensure only one diagnostics panel exists at a time.
    **Filepath**: `src/webviewManager.ts`
    ```typescript
    export class WebviewManager {
        private diagnosticsPanel: vscode.WebviewPanel | undefined;
        // ... other properties

        public showDiagnosticsPanel() {
            if (this.diagnosticsPanel) {
                this.diagnosticsPanel.reveal(vscode.ViewColumn.One);
            } else {
                this.diagnosticsPanel = vscode.window.createWebviewPanel(
                    'diagnosticsView', // Identifies the type of the webview. Used internally
                    'Status & Diagnostics', // Title of the panel displayed to the user
                    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
                    { enableScripts: true, localResourceRoots: [/*...*/] } // Webview options.
                );

                this.diagnosticsPanel.webview.html = this.getWebviewContent('diagnostics'); // You will need a way to get specific HTML content
                this.diagnosticsPanel.onDidDispose(() => {
                    this.diagnosticsPanel = undefined;
                }, null, this.context.subscriptions);

                // Handle messages from the webview
                this.diagnosticsPanel.webview.onDidReceiveMessage(
                    message => this.messageRouter.handleMessage(message),
                    undefined,
                    this.context.subscriptions
                );
            }
        }
        // ...
    }
    ```

---

### **Part 2: Refactoring the Svelte Component**

Next, you'll modify the Svelte component to serve its new purpose.

**Relevant API/Documentation:**
*   **Svelte Lifecycle:** [https://svelte.dev/docs#onMount](https://svelte.dev/docs#onMount)
*   **Webview Message Passing:** [https://code.visualstudio.com/api/extension-guides/webview#scripts-and-message-passing](https://code.visualstudio.com/api/extension-guides/webview#scripts-and-message-passing)

**Implementation Steps:**

1.  **Rename the File:**
    -   From: `webview/src/lib/views/SettingsView.svelte`
    -   To: `webview/src/lib/views/DiagnosticsView.svelte`
    -   Remember to update any `import` statements that refer to the old filename.

2.  **Refactor `DiagnosticsView.svelte`**
    Remove input elements and display data from your `setupStore`. Add a button to message the extension.
    **Filepath**: `webview/src/lib/views/DiagnosticsView.svelte`
    ```html
    <script lang="ts">
        import { onMount } from 'svelte';
        import { setupStore, type Settings } from '../stores/setupStore';
        import { vscode } from '../lib/vscodeApi';
        // Assuming you have a Button component
        // import { Button as FluentButton } from "@fluentui/web-components";

        let settings: Settings;
        const unsubscribe = setupStore.subscribe(value => {
            settings = value;
        });

        onMount(() => {
            // Request initial settings from the extension
            vscode.postMessage({ command: 'getSettings' });
        });

        function openSettings() {
            vscode.postMessage({ command: 'MapToSettings' });
        }

        function testDatabase() {
            vscode.postMessage({ command: 'testDatabaseConnection' });
        }
    </script>

    <h1>Status & Diagnostics</h1>

    <div>
        <h2>Current Configuration</h2>
        <p>Provider: {settings?.embeddingProvider || 'Not set'}</p>
        <p>Model: {settings?.embeddingModel || 'Not set'}</p>
        <p>Database: {settings?.databaseType || 'Not set'}</p>
        <button on:click={openSettings}>Edit Configuration</button>
    </div>

    <div>
        <h2>Actions</h2>
        <button on:click={testDatabase}>Test Database Connection</button>
        <!-- Add other test buttons here -->
    </div>
    ```

3.  **Handle `MapToSettings` Message in `messageRouter.ts`**
    Add a case to your message handler to trigger the native settings UI.
    **Filepath**: `src/messageRouter.ts`
    ```typescript
    public handleMessage(message: any) {
        switch (message.command) {
            // ... other cases
            case 'MapToSettings':
                vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');
                break;
            // ... other cases
        }
    }
    ```