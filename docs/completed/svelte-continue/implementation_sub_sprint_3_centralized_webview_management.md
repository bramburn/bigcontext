# Implementation Guidance: Sub-Sprint 3 - Centralized Webview Management

**Objective:** To create the `WebviewManager` class and move all webview panel creation and lifecycle logic into it, centralizing control and cleaning up the extension's entry point.

---

### 1. Overview

This guide provides a step-by-step walkthrough for creating a `WebviewManager` class. This class will act as a singleton manager for our main webview panel, ensuring that only one instance of the panel exists at any time. This pattern is a best practice for managing resource-intensive webviews in VS Code extensions.

We will follow the singleton pattern where the class manages its own instance via a static property and a static creation method.

### 2. Step-by-Step Implementation

#### Step 2.1: Create the `WebviewManager.ts` File

First, create the new file that will house our manager class.

**File:** `src/webviewManager.ts` (New File)

#### Step 2.2: Implement the WebviewManager Class

Populate the new file with the following class structure. This code is adapted from VS Code extension best practices for singleton webview management.

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class WebviewManager {
    // Static property to hold the single instance of the panel
    public static currentPanel: WebviewManager | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    /**
     * Creates or shows a webview panel.
     * @param extensionUri The URI of the extension.
     */
    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (WebviewManager.currentPanel) {
            WebviewManager.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'codeContextEngine', // Internal ID for the webview type
            'Code Context Engine', // Title of the panel displayed to the user
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'webview', 'build')
                ]
            }
        );

        WebviewManager.currentPanel = new WebviewManager(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial HTML content
        this._update();

        // Listen for when the panel is disposed (i.e., when the user closes it)
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // TODO: In Sprint 4, the message handler will be moved here.
        // this._panel.webview.onDidReceiveMessage(...);
    }

    /**
     * Cleans up all disposables and resets the current panel instance.
     */
    public dispose() {
        WebviewManager.currentPanel = undefined;

        // Dispose of the panel
        this._panel.dispose();

        // Dispose of all disposables
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    /**
     * Sets the HTML content for the webview panel.
     */
    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    /**
     * Reads the SvelteKit build output and prepares it for the webview.
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        const buildPath = path.join(this._extensionUri.fsPath, 'webview', 'build');
        const indexPath = path.join(buildPath, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');

        // Replace asset paths with webview-compatible URIs
        html = html.replace(/<(script|link).*?(src|href)="(.*?)"/g,
            (match, tag, attribute, src) => {
                const resourcePath = path.join(buildPath, src);
                const resourceUri = webview.asWebviewUri(vscode.Uri.file(resourcePath));
                return `<${tag} ${attribute}="${resourceUri}"`;
            });

        return html;
    }
}
```

#### Step 2.3: Refactor the `openMainPanel` Command

Now, go back to `src/extension.ts` (or `src/commandManager.ts` if you have it) and replace the old `createWebviewPanel` logic with a simple call to your new manager.

**File:** `src/extension.ts` (or `src/commandManager.ts`)
```typescript
// At the top of the file
import { WebviewManager } from './webviewManager';

// Inside the activate function or command registration
// ...

const openPanelDisposable = vscode.commands.registerCommand('code-context-engine.openMainPanel', () => {
    // This single line replaces all the previous panel creation logic
    WebviewManager.createOrShow(context.extensionUri);
});

// ...
```

### 3. Key Concepts in this Implementation

-   **Singleton Pattern**: The `currentPanel` static property ensures only one `WebviewManager` instance exists. The `createOrShow` static method is the single entry point for creating or revealing the panel.
-   **Lifecycle Management**: The `onDidDispose` event is critical. When the user closes the panel, we clean up by calling `dispose()` and, most importantly, setting `WebviewManager.currentPanel = undefined`. This allows a new panel to be created next time the command is run.
-   **Asset Path Rewriting**: The `_getHtmlForWebview` method is now the single source of truth for loading the UI. It reads the `index.html` from the SvelteKit build output and uses a regular expression to find all `src` and `href` attributes. It then uses `webview.asWebviewUri` to convert the file paths into special URIs that the webview can securely access. This is the standard and required way to load local resources.

### 4. Verification

1.  Run the extension from the debug panel.
2.  Execute the `Code Context Engine: Open Main Panel` command from the command palette.
3.  The webview should open and display your SvelteKit application.
4.  Run the command again. A new panel should **not** be created; the existing one should just regain focus.
5.  Close the panel and run the command one more time. A new panel should be created successfully.
6.  Check the webview developer tools (`Developer: Open Webview Developer Tools`) to ensure there are no errors related to loading scripts or stylesheets.
