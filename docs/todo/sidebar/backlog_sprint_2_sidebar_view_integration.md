### User Story 1: Sidebar Icon
**As a** developer (Devin), **I want to** see an icon for the Code Context Engine in the VS Code Activity Bar, **so that** I have a consistent and easy-to-find entry point to the extension.

**Actions to Undertake:**
1.  **Filepath**: `media/icon.svg` (New File)
    -   **Action**: Create a new SVG icon for the extension. The icon should be a simple, monochrome shape that represents code or context.
    -   **Implementation**: Design a new SVG file. It should be white on a transparent background to adapt to VS Code themes.
    -   **Imports**: N/A.
2.  **Filepath**: `package.json`
    -   **Action**: Add a `viewsContainers` contribution point to define a new container in the Activity Bar.
    -   **Implementation**: Add a `viewsContainers.activitybar` array with an object containing an `id`, `title`, and `icon` path (`media/icon.svg`).
    -   **Imports**: N/A.

**Acceptance Criteria:**
-   A new folder `media` exists containing `icon.svg`.
-   The `package.json` file includes a `contributes.viewsContainers` section.
-   Upon launching the extension, a new icon for the "Code Context Engine" appears in the Activity Bar.

### User Story 2: Open UI from Icon
**As a** developer (Devin), **I want to** click the sidebar icon to open the extension's main UI, **so that** I can start interacting with it immediately.

**Actions to Undertake:**
1.  **Filepath**: `package.json`
    -   **Action**: Add a `views` contribution point to link a `webviewView` to the new container.
    -   **Implementation**: Add a `views` object that maps the `viewsContainers` ID to an array containing a view with an `id`, `name`, and `type: 'webview'`.
    -   **Imports**: N/A.
2.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Implement the `vscode.WebviewViewProvider` interface on the `WebviewManager` class.
    -   **Implementation**: Add `implements vscode.WebviewViewProvider` to the class definition.
    -   **Imports**: `import * as vscode from 'vscode';`
3.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Implement the `resolveWebviewView` method required by the interface. This method will be responsible for setting the webview's HTML content.
    -   **Implementation**: Create the `resolveWebviewView` method. Inside it, set the webview's options and call the existing `getWebviewContent` helper (or a similar method) to set the `webviewView.webview.html` property.
    -   **Imports**: N/A.
4.  **Filepath**: `src/extension.ts`
    -   **Action**: Register the `WebviewManager` as the provider for the new view.
    -   **Implementation**: In the `activate` function, use `vscode.window.registerWebviewViewProvider` with the view ID from `package.json` and the `WebviewManager` instance.
    -   **Imports**: N/A.

**Acceptance Criteria:**
-   The `package.json` file includes a `contributes.views` section.
-   The `WebviewManager` class implements `vscode.WebviewViewProvider` and the `resolveWebviewView` method.
-   The provider is registered in `extension.ts`.
-   Clicking the new Activity Bar icon opens the SvelteKit UI inside the sidebar.
-   All existing UI functionality (indexing, searching) works correctly within the sidebar view.

**Testing Plan:**
-   **Test Case 1**: Launch the extension and verify the new icon appears in the Activity Bar.
-   **Test Case 2**: Click the icon and verify the main webview UI loads within the sidebar.
-   **Test Case 3**: Test a core feature, like running a search, from the sidebar UI to ensure it communicates with the extension backend correctly.
-   **Test Case 4**: Ensure the UI is responsive and usable in the narrower sidebar format.
