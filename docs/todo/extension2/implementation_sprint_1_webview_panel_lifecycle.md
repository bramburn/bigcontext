## Implementation Guidance: Sprint 1 - Webview Panel Lifecycle

This guide provides detailed instructions and API information for implementing the Webview Panel Lifecycle sprint, focusing on creating a robust and decoupled webview management system within a VS Code extension.

### 1. Centralized Webview Panel Management (`WebviewManager`)

**Objective:** Create a `WebviewManager` class to encapsulate all logic related to the creation, display, and disposal of VS Code webview panels, thereby decoupling UI management from the main `extension.ts` file.

**Key VS Code APIs & Concepts:**

*   **`vscode.WebviewPanel`**: The core class representing a webview panel. It allows you to display HTML content within VS Code.
    *   **`vscode.window.createWebviewPanel(viewType, title, showOptions, options)`**: This static method is used to create a new webview panel.
        *   `viewType` (string): An identifier for the type of webview. Used internally by VS Code.
        *   `title` (string): The title displayed in the webview's tab.
        *   `showOptions` (`vscode.ViewColumn` or `{ viewColumn: vscode.ViewColumn, preserveFocus?: boolean }`): Specifies where the panel should be shown (e.g., `vscode.ViewColumn.One` for the first editor column).
        *   `options` (`vscode.WebviewOptions`): Configuration for the webview, including `enableScripts` (crucial for SvelteKit apps) and `localResourceRoots` (to allow loading local files).
*   **`panel.reveal(viewColumn?: vscode.ViewColumn, preserveFocus?: boolean)`**: If a panel already exists, this method brings it to the foreground.
*   **`panel.onDidDispose`**: An event that fires when the webview panel is disposed (e.g., when the user closes it). This is critical for cleaning up resources and setting the internal panel reference to `undefined` to prevent memory leaks and ensure correct behavior when the panel is reopened.
*   **`vscode.ExtensionContext`**: Provides access to the extension's environment, including `extensionPath` (the absolute path to your extension's root directory) and `subscriptions` (an array to which disposables are added for automatic cleanup on extension deactivation).

**Implementation Details:**

1.  **Singleton Pattern for `WebviewManager`**: Implement `WebviewManager` as a singleton to ensure only one instance manages the main webview panel. This is achieved by a private constructor and a static `getInstance` method.
2.  **Panel Instance Management**: The `WebviewManager` should hold a private reference to the `vscode.WebviewPanel` instance. Before creating a new panel, check if this reference exists. If it does, call `panel.reveal()` instead of creating a new one.
3.  **Disposal Handling**: Attach an `onDidDispose` listener to the created panel. Inside this listener, set the internal panel reference to `undefined`.
4.  **`localResourceRoots`**: When creating the webview panel, set `localResourceRoots` in the `WebviewOptions` to include the `webview/dist` directory. This is essential for the webview to be able to load local assets (JS, CSS, images) from your SvelteKit build output.
    *   Example: `localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))]`

**File Reference:**
*   `src/webviewManager.ts` (New File)
*   `src/extension.ts` (Modification)

### 2. Load SvelteKit Build Output

**Objective:** Ensure the `WebviewManager` correctly reads the SvelteKit `index.html` and transforms its relative asset paths into VS Code webview-compatible URIs.

**Key VS Code APIs & Concepts:**

*   **`panel.webview.html`**: This property of `vscode.WebviewPanel` is where you set the HTML content to be displayed in the webview. It expects a string containing the full HTML document.
*   **`panel.webview.asWebviewUri(localResource)`**: This is a crucial method for security and functionality. It takes a `vscode.Uri` pointing to a local file (e.g., a JavaScript file, CSS file, image) and returns a special `vscode-resource:` URI that the webview can safely load. Without this, the webview cannot access local files due to security restrictions.
*   **`path` module (Node.js built-in)**: Useful for constructing file paths in a platform-independent way (e.g., `path.join`).
*   **`fs` module (Node.js built-in)**: Used for reading file content (e.g., `fs.readFileSync`).

**Implementation Details:**

1.  **Read `index.html`**: Use `fs.readFileSync` to read the content of `webview/dist/index.html`.
2.  **Path Transformation**: The SvelteKit build process typically generates `index.html` with relative paths for its assets (e.g., `<script src="/_app/immutable/start-XXXX.js">`). These paths need to be converted.
    *   Use a regular expression to find all `src` and `href` attributes that point to relative paths within your `webview/dist` directory.
    *   For each matched relative path, construct an absolute file URI using `vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist', relativePath))`.
    *   Then, convert this absolute URI to a webview-compatible URI using `this.panel.webview.asWebviewUri(absoluteUri)`.
    *   Replace the original relative path in the HTML string with the new `vscode-resource:` URI.

**Example Regex for Path Replacement:**
```javascript
htmlContent = htmlContent.replace(
    /(<script src="|\ssrc="|<link href=")(?!https?:\/\/)([^"]*)"/g,
    (match, p1, p2) => {
        const resourcePath = path.join(this.context.extensionPath, 'webview', 'dist', p2);
        const uri = this.panel!.webview.asWebviewUri(vscode.Uri.file(resourcePath));
        return `${p1}${uri}"`;
    }
);
```

**File Reference:**
*   `src/webviewManager.ts` (Modification)

### 3. Command Delegation to `CommandManager`

**Objective:** Refactor the command registration logic from `extension.ts` into a dedicated `CommandManager` class, promoting a cleaner and more modular architecture.

**Key VS Code APIs & Concepts:**

*   **`vscode.commands.registerCommand(command, callback)`**: Registers a command that can be invoked by users (e.g., via the Command Palette) or programmatically.
*   **`context.subscriptions.push(disposable)`**: All disposables (like the return value of `registerCommand`) should be added to the `context.subscriptions` array. This ensures they are automatically cleaned up when the extension is deactivated.

**Implementation Details:**

1.  **`CommandManager` Class**: Create a new class `CommandManager` that takes `vscode.ExtensionContext` and an instance of `WebviewManager` in its constructor.
2.  **`registerCommands` Method**: This method will contain all the `vscode.commands.registerCommand` calls. Instead of directly calling `webviewManager.showMainPanel()`, it will call `this.webviewManager.showMainPanel()`.
3.  **`extension.ts` Refactor**: In `activate`, instantiate `WebviewManager` first, then pass its instance to the `CommandManager` constructor. Call `commandManager.registerCommands()`.
4.  **Remove Direct Registration**: Ensure that the direct `vscode.commands.registerCommand` call for `code-context-engine.openMainPanel` is removed from `extension.ts`.

**File Reference:**
*   `src/commandManager.ts` (New File)
*   `src/extension.ts` (Modification)

