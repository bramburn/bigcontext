### Implementation Guide: Sub-Sprint 3 - Centralized Webview Management

This guide outlines the steps to consolidate all webview lifecycle logic into the `WebviewManager` class, making it the single source of truth for creating, showing, and disposing of UI panels.

#### 1. Refactor `WebviewManager` Structure

Ensure your `src/webviewManager.ts` is structured to handle multiple panels as singletons. The class should store panel instances and the extension context.

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class WebviewManager {
    private _context: vscode.ExtensionContext;
    private _mainPanel: vscode.WebviewPanel | undefined;
    private _settingsPanel: vscode.WebviewPanel | undefined;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    // ... methods will go here
}
```

#### 2. Implement Panel-Showing Methods

Create public methods to show each panel. The core logic here is to check if a panel already exists. If it does, reveal it. If not, create it.

```typescript
// Inside WebviewManager class

public showMainPanel() {
    if (this._mainPanel) {
        this._mainPanel.reveal(vscode.ViewColumn.One);
        return;
    }

    this._mainPanel = this._createWebviewPanel('codeContextMain', 'Code Context', vscode.ViewColumn.One);

    this._mainPanel.onDidDispose(() => {
        this._mainPanel = undefined;
    });
}

public showSettingsPanel() {
    if (this._settingsPanel) {
        this._settingsPanel.reveal(vscode.ViewColumn.Two);
        return;
    }

    this._settingsPanel = this._createWebviewPanel('codeContextSettings', 'Code Context Settings', vscode.ViewColumn.Two);

    this._settingsPanel.onDidDispose(() => {
        this._settingsPanel = undefined;
    });
    
    // Optional: Post a message to the webview to render the settings view
    this._settingsPanel.webview.postMessage({ command: 'setView', view: 'settings' });
}
```

#### 3. Create a Generic Panel Factory

To avoid duplicating code, create a private helper method that handles the actual creation of a `WebviewPanel`.

```typescript
// Inside WebviewManager class

private _createWebviewPanel(id: string, title: string, column: vscode.ViewColumn): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
        id,
        title,
        column,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'build')]
        }
    );

    panel.webview.html = this._getWebviewContent(panel.webview);
    
    // Setup message handling
    // panel.webview.onDidReceiveMessage(message => { ... });

    return panel;
}
```

#### 4. Implement the Content Loader

This private helper reads the `index.html` from your SvelteKit build output and correctly formats the asset paths for use in a webview.

```typescript
// Inside WebviewManager class

private _getWebviewContent(webview: vscode.Webview): string {
    const htmlPath = vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'build', 'index.html');
    let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

    htmlContent = htmlContent.replace(/(href|src)="\//g, `$1="${webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'build'))}/`);

    return htmlContent;
}
```

#### 5. Refactor `CommandManager`

Finally, update your `commandManager.ts` to use these new, clean methods. The command handlers should now be simple, one-line calls to the `WebviewManager`.

**File**: `src/commandManager.ts`
```typescript
// ... imports

export class CommandManager {
    // ... constructor and other properties

    private handleOpenMainPanel(): void {
        // The command handler is now just a simple delegation
        this.webviewManager.showMainPanel();
    }

    private handleOpenSettings(): void {
        // This now calls the method for the custom webview, not the native one
        this.webviewManager.showSettingsPanel();
    }
    
    // ... other command handlers
}
```

By following these steps, you will successfully centralize all webview-related logic within the `WebviewManager`, making your extension more modular and easier to maintain.
