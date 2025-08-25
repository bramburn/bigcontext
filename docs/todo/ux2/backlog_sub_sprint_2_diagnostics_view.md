### User Story 1: Centralized Diagnostics View
**As a** developer (Alisha), **I want to** repurpose the existing Svelte settings page into a "Status & Diagnostics" panel, **so that** we can provide users with useful actions like connection testing without managing configuration in a custom UI.

**Actions to Undertake:**
1.  **Filepath**: `package.json`
    -   **Action**: Add a new command `code-context-engine.openDiagnostics` to the `contributes.commands` array.
    -   **Implementation**:
        ```json
        {
          "command": "code-context-engine.openDiagnostics",
          "title": "Code Context Engine: Open Diagnostics"
        }
        ```
    -   **Imports**: None.
2.  **Filepath**: `src/commandManager.ts`
    -   **Action**: Register the new `openDiagnostics` command and add a handler that calls a new method in `WebviewManager`.
    -   **Implementation**:
        ```typescript
        // In the constructor or registration method:
        this.registerCommand('code-context-engine.openDiagnostics', this.handleOpenDiagnostics.bind(this));

        // New handler method:
        private handleOpenDiagnostics() {
            this.webviewManager.showDiagnosticsPanel();
        }
        ```
    -   **Imports**: None.
3.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Implement the `showDiagnosticsPanel` method, using a singleton pattern to manage the webview panel.
    -   **Implementation**: (See implementation guide for full example).
    -   **Imports**: `import * as vscode from 'vscode';`
4.  **Filepath**: `webview/src/lib/views/SettingsView.svelte` -> `webview/src/lib/views/DiagnosticsView.svelte`
    -   **Action**: Rename the file and update all imports that reference it.
    -   **Implementation**: (File rename operation).
    -   **Imports**: N/A.
5.  **Filepath**: `webview/src/lib/views/DiagnosticsView.svelte`
    -   **Action**: Remove all configuration input elements (`<select>`, `<input>`). Refactor the component to display settings in a read-only format.
    -   **Implementation**: (Svelte code refactoring).
    -   **Imports**: `import { setupStore } from '../stores/setupStore';`

**Acceptance Criteria:**
-   The Svelte settings component is renamed to `DiagnosticsView.svelte`.
-   All configuration input fields are removed from the component.
-   Action buttons like "Test Database Connection" remain functional.
-   The view displays current configuration values in a read-only format.

**Testing Plan:**
-   **Test Case 1**: Open the `DiagnosticsView.svelte` file and verify no input elements for configuration exist.
-   **Test Case 2**: Run the extension, open the diagnostics panel, and confirm the "Test..." buttons are present and functional.
-   **Test Case 3**: Verify that current settings are displayed as text.

---

### User Story 2: Easy Access to Diagnostics
**As a** developer (Devin), **I want to** be able to open the new "Status & Diagnostics" panel from a command, **so that** I can easily test my connections and view system status.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/views/DiagnosticsView.svelte`
    -   **Action**: Add a new button labeled "Edit Configuration".
    -   **Implementation**: `<FluentButton on:click={openSettings}>Edit Configuration</FluentButton>`
    -   **Imports**: `import { Button as FluentButton } from "@fluentui/web-components";`
2.  **Filepath**: `webview/src/lib/views/DiagnosticsView.svelte`
    -   **Action**: Implement the `on:click` handler to send a `MapToSettings` message to the extension.
    -   **Implementation**:
        ```javascript
        import { vscode } from '../lib/vscodeApi';

        function openSettings() {
            vscode.postMessage({ command: 'MapToSettings' });
        }
        ```
    -   **Imports**: `import { vscode } from '../lib/vscodeApi';`
3.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Add a case to the message handler to process the `MapToSettings` message.
    -   **Implementation**:
        ```typescript
        case 'MapToSettings':
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');
            break;
        ```
    -   **Imports**: `import * as vscode from 'vscode';`

**Acceptance Criteria:**
-   A new command, `code-context-engine.openDiagnostics`, is available in the Command Palette.
-   The command opens a new webview panel titled "Status & Diagnostics".
-   The panel contains a button that, when clicked, opens the native VS Code Settings UI filtered for the extension.

**Testing Plan:**
-   **Test Case 1**: Run the "Code Context Engine: Open Diagnostics" command and verify the panel opens.
-   **Test Case 2**: Click the "Edit Configuration" button in the webview.
-   **Test Case 3**: Confirm that the native VS Code Settings UI opens, filtered correctly.