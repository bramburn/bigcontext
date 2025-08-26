### Objective
To refactor and centralize all webview panel creation and lifecycle logic into the `WebviewManager` class, ensuring it is the single source of truth for managing UI panels and cleaning up command handlers.

**Parent Sprint:** PRD 2, Sprint 3: Webview Management

### User Story: Centralized Webview Control
**As a** developer, **I want to** have a dedicated `WebviewManager` that handles the lifecycle of all webview panels, **so that** UI creation logic is centralized, reusable, and decoupled from command definitions.

**Actions to Undertake:**
1.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Review and verify the `WebviewManager` class structure. It should have a constructor, a dispose method, and private properties to hold the single instances of each webview panel (e.g., `mainPanel`, `settingsPanel`).
    -   **Implementation**: `private mainPanel: vscode.WebviewPanel | undefined;`
    -   **Imports**: `import * as vscode from 'vscode';`
2.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Implement a public `showMainPanel` method. This method should check if a panel instance already exists. If not, it creates a new `WebviewPanel`; otherwise, it reveals the existing one.
    -   **Implementation**: `if (this.mainPanel) { this.mainPanel.reveal(); return; } ...`
    -   **Imports**: N/A.
3.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Implement a public `showSettingsPanel` method with the same singleton logic as `showMainPanel`. This method will create and show a dedicated webview for settings, not open the native VS Code settings.
    -   **Implementation**: `if (this.settingsPanel) { this.settingsPanel.reveal(); return; } ...`
    -   **Imports**: N/A.
4.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Implement a private `_getWebviewContent` helper method. This method should read the `index.html` from the `webview/build` directory, replace asset paths with `webview.asWebviewUri`, and return the final HTML string.
    -   **Implementation**: `const htmlPath = path.join(this._context.extensionPath, 'webview', 'build', 'index.html'); ...`
    -   **Imports**: `import * as fs from 'fs';`, `import * as path from 'path';`
5.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Ensure each created panel has an `onDidDispose` listener that nullifies the stored instance variable (e.g., `this.mainPanel = undefined;`) to allow for garbage collection and recreation.
    -   **Implementation**: `this.mainPanel.onDidDispose(() => { this.mainPanel = undefined; });`
    -   **Imports**: N/A.
6.  **Filepath**: `src/commandManager.ts`
    -   **Action**: Refactor the command callbacks for `openMainPanel` and `openSettings` to call the corresponding methods on the `WebviewManager` instance.
    -   **Implementation**: `handleOpenMainPanel() { this.webviewManager.showMainPanel(); }` and `handleOpenSettings() { this.webviewManager.showSettingsPanel(); }`
    -   **Imports**: N/A.

**Acceptance Criteria:**
-   All `vscode.window.createWebviewPanel` calls are located exclusively within `WebviewManager.ts`.
-   The `openMainPanel` and `openSettings` commands correctly open their respective webview UIs.
-   The `openSettings` command opens a custom webview panel, not the native VS Code settings UI.
-   Attempting to open a panel that is already open simply brings the existing panel into focus without creating a new one.
-   Closing a panel and re-running the open command creates a new panel successfully.

**Dependencies:**
-   `CommandManager` is implemented and available.
