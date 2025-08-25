# Backlog: Sub-Sprint 3 - Centralized Webview Management

**Objective:** To create the `WebviewManager` class and move all webview panel creation and lifecycle logic into it, cleaning up the command handlers and `extension.ts`.

**Parent Sprint:** PRD 2, Sprint 3: Webview Management

---

### User Story 1: Centralize Webview Creation
**As a** Developer, **I want to** create a `WebviewManager` class that handles the creation and lifecycle of webview panels, **so that** webview logic is centralized, reusable, and decoupled from command handlers.

**Actions to Undertake:**
1.  **Filepath**: `src/webviewManager.ts` (New File)
    -   **Action**: **Create WebviewManager Class**: Define a new class named `WebviewManager`. It should have a private constructor, a static property to hold the panel instance (e.g., `public static currentPanel`), and a static `createOrShow` method.
    -   **Implementation**: See implementation guide for the full class structure.
    -   **Imports**: `import * as vscode from 'vscode';`
2.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: **Implement Singleton Pattern**: The `createOrShow` method should check if `currentPanel` already exists. If it does, it should call `.reveal()` on the existing panel. If not, it should create a new `vscode.WebviewPanel` and instantiate `WebviewManager`.
    -   **Implementation**: `if (WebviewManager.currentPanel) { WebviewManager.currentPanel._panel.reveal(); return; }`
    -   **Imports**: N/A.
3.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: **Handle Panel Disposal**: In the private constructor, set up an `onDidDispose` listener for the webview panel. This listener must clean up resources and set the static `currentPanel` reference back to `undefined`.
    -   **Implementation**: `this._panel.onDidDispose(() => this.dispose(), null, this._disposables);`
    -   **Imports**: N/A.

**Acceptance Criteria:**
-   A new `WebviewManager.ts` file exists with a class that properly implements the singleton pattern for a `WebviewPanel`.
-   Calling the `createOrShow` method multiple times results in only one panel being created, with subsequent calls bringing the existing panel to the front.
-   Closing the webview panel correctly disposes of the panel object and allows a new one to be created on the next call.

**Testing Plan:**
-   **Test Case 1**: Trigger the command to open the webview. Verify the panel appears.
-   **Test Case 2**: Trigger the command again. Verify that a new panel does *not* appear, but the existing one remains or regains focus.
-   **Test Case 3**: Close the panel and trigger the command again. Verify a new panel appears successfully.

---

### User Story 2: Refactor Commands to Use WebviewManager
**As a** Developer, **I want to** refactor the existing command handlers to use the new `WebviewManager`, **so that** `extension.ts` and `commandManager.ts` are no longer directly responsible for creating webviews.

**Actions to Undertake:**
1.  **Filepath**: `src/extension.ts` or `src/commandManager.ts`
    -   **Action**: **Update `openMainPanel` Command**: Locate the command registration for `code-context-engine.openMainPanel`. Replace the entire `vscode.window.createWebviewPanel` logic with a single call to `WebviewManager.createOrShow(context.extensionUri)`.
    -   **Implementation**: `vscode.commands.registerCommand('code-context-engine.openMainPanel', () => { WebviewManager.createOrShow(context.extensionUri); });`
    -   **Imports**: `import { WebviewManager } from './webviewManager';`
2.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: **Implement HTML Content Loading**: Create a private method within `WebviewManager` (e.g., `_getHtmlForWebview`) that is responsible for reading the `index.html` from the SvelteKit build output (`webview/build/index.html`).
    -   **Implementation**: Use `fs.readFileSync` to get the HTML content.
    -   **Imports**: `import * as fs from 'fs';`, `import * as path from 'path';`
3.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: **Implement Asset Path Rewriting**: Within the `_getHtmlForWebview` method, use `webview.asWebviewUri` to correctly transform the paths for CSS and JS files referenced in the `index.html` (e.g., paths starting with `/_app/`).
    -   **Implementation**: Use string replacement or a regular expression to find and replace asset URIs.
    -   **Imports**: N/A.

**Acceptance Criteria:**
-   The `createWebviewPanel` logic is completely removed from `extension.ts` and/or `commandManager.ts`.
-   The `openMainPanel` command successfully opens the webview using the `WebviewManager`.
-   The SvelteKit application loads correctly inside the webview, including all its CSS and JavaScript assets, proving the path rewriting is working.

**Testing Plan:**
-   **Test Case 1**: Run the extension and trigger the `openMainPanel` command. Verify the SvelteKit UI renders correctly.
-   **Test Case 2**: Check the developer tools console for the webview to ensure there are no 404 errors for CSS or JS files.
