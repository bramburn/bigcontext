### User Story: Centralized Webview Management

**As a** developer,
**I want to** create a `WebviewManager` to handle the lifecycle of all webview panels and standardize HTML content loading,
**so that** UI creation logic is centralized, reusable, and decoupled from command handlers.

**Objective:** To create the `WebviewManager` class and move all webview panel creation and lifecycle logic into it, cleaning up the command handlers and `extension.ts`.

**Workflow:**
1.  Modify `WebviewManager` to accept `vscode.ExtensionContext` and manage specific panel instances.
2.  Implement a helper method within `WebviewManager` to load and prepare webview HTML content.
3.  Refactor `showMainPanel` and implement `showSettingsPanel` to use the new HTML loading logic and ensure single panel instances.
4.  Update `CommandManager` to delegate `openSettings` to `WebviewManager`.
5.  Ensure proper disposal of webview panels.

**List of Files to be Modified:**
-   `src/webviewManager.ts`
-   `src/extensionManager.ts`
-   `src/commandManager.ts`

**Actions to Undertake:**

1.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Modify the `WebviewManager` constructor to accept `context: vscode.ExtensionContext`. Add private properties to store references to the main and settings webview panels (e.g., `private mainPanel: vscode.WebviewPanel | undefined;`, `private settingsPanel: vscode.WebviewPanel | undefined;`).
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: `import * as vscode from 'vscode'; import * as path from 'path'; import * as fs from 'fs';`

2.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Implement a private helper method `getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string` that reads `webview/dist/index.html`, replaces asset paths using `webview.asWebviewUri`, and returns the final HTML string.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None (already added in previous action).

3.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Refactor `showMainPanel()` to use the new `getWebviewContent` helper. Ensure it checks if `this.mainPanel` already exists; if so, `reveal()` it. Otherwise, create a new panel, store it in `this.mainPanel`, and set up its `onDidDispose` listener to nullify `this.mainPanel`.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None.

4.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Implement `showSettingsPanel()` with similar logic to `showMainPanel()`, managing `this.settingsPanel` and using `getWebviewContent`.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None.

5.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Modify the `ExtensionManager` constructor to pass `this.context` to the `WebviewManager` constructor during instantiation.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None.

6.  **Filepath**: `src/commandManager.ts`
    -   **Action**: Refactor `handleOpenSettings()` to call `this.webviewManager.showSettingsPanel()` instead of `vscode.commands.executeCommand('workbench.action.openSettings')`.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None.

**Acceptance Criteria:**
-   All `vscode.window.createWebviewPanel` calls are located exclusively within `WebviewManager.ts`.
-   The `openMainPanel` and `openSettings` commands correctly open their respective UIs.
-   Attempting to open a panel that is already open simply brings the existing panel into focus.
-   The `WebviewManager` correctly loads HTML content from `webview/dist/index.html` and resolves asset URIs.

**Testing Plan:**
-   **Test Case 1**: Execute `code-context-engine.openMainPanel` and verify the main webview panel opens.
-   **Test Case 2**: Execute `code-context-engine.openMainPanel` again and verify the existing panel is revealed, not a new one.
-   **Test Case 3**: Execute `code-context-engine.openSettings` and verify the settings webview panel opens.
-   **Test Case 4**: Execute `code-context-engine.openSettings` again and verify the existing settings panel is revealed.
-   **Test Case 5**: Verify that the webview content (HTML, CSS, JS) loads correctly within the panels.
-   **Test Case 6**: Close a webview panel and then try to open it again, verifying it re-opens correctly.
