# Implementation Guide: Sprint 2 - Diagnostics View Refactoring

**Goal:** To refactor the Svelte settings webview into a dedicated "Status & Diagnostics" panel.

This guide provides the technical steps to create the new diagnostics panel, refactor the Svelte component, and establish communication between the webview and the extension.

---

### **Part 1: Command and Panel Creation**

This follows the established pattern in the extension for adding new commands and webview panels.

1.  **Add Command in `package.json`**: Define the new `openDiagnostics` command.

    ```json
    // package.json -> contributes.commands
    {
        "command": "code-context-engine.openDiagnostics",
        "title": "Code Context Engine: Open Diagnostics"
    }
    ```

2.  **Register Command in `commandManager.ts`**: The handler will call a new method on the `WebviewManager`.

    ```typescript
    // src/commandManager.ts
    // In registerCommands method
    this.registerCommand('code-context-engine.openDiagnostics', this.handleOpenDiagnostics.bind(this));

    // New handler method
    private handleOpenDiagnostics() {
        this.webviewManager.showDiagnosticsPanel();
    }
    ```

3.  **Implement `showDiagnosticsPanel` in `webviewManager.ts`**: This method should create and manage a singleton `WebviewPanel` for the diagnostics view, just like `showMainPanel`.

    ```typescript
    // src/webviewManager.ts
    private diagnosticsPanel: vscode.WebviewPanel | undefined;

    public showDiagnosticsPanel() {
        if (this.diagnosticsPanel) {
            this.diagnosticsPanel.reveal(vscode.ViewColumn.One);
        } else {
            this.diagnosticsPanel = vscode.window.createWebviewPanel(
                'diagnosticsView', 
                'Code Context Diagnostics', 
                vscode.ViewColumn.One, 
                { /* ... webview options ... */ }
            );
            this.diagnosticsPanel.webview.html = this.getWebviewContent(this.diagnosticsPanel);
            this.diagnosticsPanel.onDidDispose(() => { this.diagnosticsPanel = undefined; }, null, this.context.subscriptions);
        }
    }
    ```

---

### **Part 2: Refactoring the Svelte Component**

This involves turning the existing settings component into a read-only view.

1.  **Rename Component**: Rename `SettingsView.svelte` to `DiagnosticsView.svelte`.
2.  **Remove Inputs**: Delete all interactive form elements like `<select>` and `<input>` that were used for *setting* values.
3.  **Display Read-Only Settings**: Use the existing `setupStore` or a new message from the extension to fetch the current configuration and display it as text.

    ```html
    <!-- webview/src/lib/views/DiagnosticsView.svelte -->
    <script lang="ts">
        import { setupStore } from '../stores/setupStore';
    </script>

    <h2>Configuration</h2>
    <div>Provider: {$setupStore.embeddingProvider}</div>
    <div>Database: {$setupStore.database}</div>
    <!-- ... other read-only settings ... -->
    ```

4.  **Preserve Action Buttons**: Keep existing buttons like "Test Connection" and ensure their message-passing logic remains functional.

---

### **Part 3: Webview-to-Extension Communication**

This is the key to making the "Edit Configuration" button work. We will send a message from the Svelte component to the extension, which will then execute a VS Code command.

#### **3.1: Add the Button and Send Message**

In the Svelte component, use the `acquireVsCodeApi` to get a communication object and call `postMessage` when the button is clicked.

**File to Modify:** `webview/src/lib/views/DiagnosticsView.svelte`

```html
<script lang="ts">
    import { onMount } from 'svelte';

    // It's best practice to get the vscode api object once.
    // A good place for this is in a separate vscodeApi.ts file.
    import { vscode } from '../vscodeApi'; // Assuming vscodeApi.ts exports it

    function handleEditSettings() {
        vscode.postMessage({
            command: 'openSettings'
        });
    }
</script>

<h2>Configuration</h2>
<!-- ... read-only settings ... -->

<button on:click={handleEditSettings}>Edit Configuration</button>

<!-- ... other buttons like Test Connection ... -->
```

**New Helper File:** `webview/src/lib/vscodeApi.ts`

```typescript
// webview/src/lib/vscodeApi.ts
declare const acquireVsCodeApi: any;
export const vscode = acquireVsCodeApi();
```

#### **3.2: Handle the Message in `messageRouter.ts`**

The `MessageRouter` will listen for the `openSettings` command from the webview and execute the native VS Code command to open the settings UI.

**File to Modify:** `src/messageRouter.ts`

```typescript
// src/messageRouter.ts
// ... inside handleMessage method ...

public handleMessage(panel: vscode.WebviewPanel, message: any) {
    switch (message.command) {
        // ... other cases
        case 'openSettings':
            vscode.commands.executeCommand(
                'workbench.action.openSettings', 
                '@ext:bramburn.code-context-engine'
            );
            break;
    }
}
```

This creates a seamless flow: the user clicks a button in the webview, which tells the extension to open the native settings UI, providing a much more integrated and familiar user experience.
