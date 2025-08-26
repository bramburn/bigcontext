### Implementation Guide: Sprint 2 - Sidebar View Integration

This guide details how to add a dedicated view for the extension in the VS Code Activity Bar.

#### 1. Create the Icon

First, create a new folder named `media` in the root of your project. Inside this folder, create an SVG file for your icon. VS Code prefers monochrome icons (white on a transparent background) as it can recolor them to match the user's theme.

**File**: `media/icon.svg` (Example: a simple code-related icon)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
  <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
</svg>
```

#### 2. Update `package.json` Contributions

You need to add two contribution points to your `package.json`: `viewsContainers` and `views`.

```json
{
  "contributes": {
    // ... other contributions like commands
    "viewsContainers": {
      "activitybar": [
        {
          "id": "code-context-engine-sidebar",
          "title": "Code Context Engine",
          "icon": "media/icon.svg"
        }
      ]
    },
    "views": {
      "code-context-engine-sidebar": [
        {
          "id": "code-context-engine-view",
          "name": "Code Context",
          "type": "webview",
          "contextualTitle": "Code Context Engine"
        }
      ]
    }
  }
}
```

-   `viewsContainers` defines the new icon and container that appears in the Activity Bar.
-   `views` links the container (`code-context-engine-sidebar`) to a new `webviewView`.

#### 3. Implement the `WebviewViewProvider`

Next, update `WebviewManager` to implement the `vscode.WebviewViewProvider` interface. This involves adding a new method, `resolveWebviewView`, which VS Code will call when it's time to render your view.

**File**: `src/webviewManager.ts`
```typescript
import * as vscode from 'vscode';
// Make sure other necessary imports (like for getWebviewContent) are present

export class WebviewManager implements vscode.WebviewViewProvider {
  public static readonly viewType = 'code-context-engine-view';

  // ... existing properties like _context, _panels, etc.

  constructor(private readonly _context: vscode.ExtensionContext) { }

  // This is the new method you need to implement
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri],
    };

    // Reuse your existing logic for getting the webview HTML
    // Note: You might need to adapt your existing getWebviewContent method
    // to accept a webview object directly.
    webviewView.webview.html = this._getWebviewContent(webviewView.webview);

    // You can also set up message handling here if it's not already centralized
    // webviewView.webview.onDidReceiveMessage(data => { ... });
  }

  // You likely already have a method like this. 
  // It reads the SvelteKit build output and prepares it for VS Code.
  private _getWebviewContent(webview: vscode.Webview): string {
    // This logic should already exist in your project for the command-based panel.
    // Ensure it correctly replaces placeholder URIs with webview.asWebviewUri(...)
    // for all your assets (CSS, JS, etc.).
    // ...
    return '...'; // Return the full HTML content as a string
  }

  // ... other existing methods like showMainPanel, etc.
}
```

#### 4. Register the Provider

Finally, in your main `extension.ts` file, you need to register your `WebviewManager` as the provider for the new view.

**File**: `src/extension.ts`
```typescript
import * as vscode from 'vscode';
import { WebviewManager } from './webviewManager'; // Adjust path if needed

export function activate(context: vscode.ExtensionContext) {
  // ... your existing activation logic (command registration, etc.)

  // Assuming you have an instance of WebviewManager
  const webviewManager = new WebviewManager(context);

  // Register the provider for the sidebar view
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WebviewManager.viewType, webviewManager)
  );

  // ... rest of your activation logic
}
```

After these changes, when you launch the extension, the new icon will appear in the Activity Bar, and clicking it will render your SvelteKit application in the sidebar.
