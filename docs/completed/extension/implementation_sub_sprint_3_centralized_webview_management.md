## Implementation Guidance: Sub-Sprint 3 - Centralized Webview Management

This guide focuses on creating the `WebviewManager` class to centralize all webview panel creation, display, and lifecycle management. This refactoring will clean up command handlers and `extension.ts` by abstracting webview-related logic.

### 1. `WebviewManager` (`src/webviewManager.ts` - New File)

**Purpose:** To encapsulate all logic related to creating, showing, and disposing of webview panels. It ensures that only one instance of a specific panel type (e.g., main panel, settings panel) exists at a time and handles the loading of webview content.

**Key Responsibilities:**
-   **Panel Creation:** Uses `vscode.window.createWebviewPanel` to create new webview instances.
-   **Panel Management:** Keeps track of active panels and brings them to focus if they already exist.
-   **Content Loading:** Reads the `index.html` file from the `webview/dist` directory and correctly resolves local resource URIs for scripts and stylesheets.
-   **Lifecycle:** Handles panel disposal events to clean up references.

**API Information:**
-   `vscode.window.createWebviewPanel(viewType, title, showOptions, options)`: Creates and shows a new webview panel.
-   `panel.reveal(viewColumn)`: Brings the panel to the foreground.
-   `panel.webview.html = content`: Sets the HTML content of the webview.
-   `panel.webview.asWebviewUri(uri)`: Converts a local file URI into a URI that can be loaded by the webview. Essential for loading local scripts, styles, and images.
-   `panel.onDidDispose(() => { ... })`: Event fired when the webview panel is closed by the user or programmatically.
-   `vscode.Uri.file(path)`: Creates a URI from a file system path.
-   `path.join(...)`: Node.js `path` module for joining path segments.
-   `fs.readFileSync(...)`: Node.js `fs` module for reading file content synchronously.

**Code Example (`src/webviewManager.ts`):**
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs'; // Node.js file system module

export class WebviewManager implements vscode.Disposable {
    private mainPanel: vscode.WebviewPanel | undefined; // Stores the main webview panel instance
    private settingsPanel: vscode.WebviewPanel | undefined; // Stores the settings webview panel instance

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Generates the HTML content for the webview, resolving local resource URIs.
     * @param webview The webview instance.
     * @param panelName A name to identify the panel type (e.g., 'main', 'settings').
     * @returns The complete HTML string for the webview.
     */
    private getWebviewContent(webview: vscode.Webview, panelName: string): string {
        // Path to the webview's HTML file in the bundled extension
        const htmlPath = path.join(this.context.extensionPath, 'webview', 'dist', 'index.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Resolve URIs for local webview resources (JS, CSS)
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'webview', 'dist', 'index.js')
        ));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'webview', 'dist', 'styles.css')
        ));

        // Replace placeholders in the HTML with the actual URIs
        // Ensure your index.html has these placeholders, e.g., <script src="{{scriptUri}}"></script>
        htmlContent = htmlContent.replace('{{scriptUri}}', scriptUri.toString());
        htmlContent = htmlContent.replace('{{styleUri}}', styleUri.toString());

        // You can also pass initial data to the webview here, e.g., a global variable
        htmlContent = htmlContent.replace('{{panelName}}', panelName); // Example: pass panel type

        return htmlContent;
    }

    /**
     * Shows or reveals the main webview panel.
     */
    public showMainPanel(): void {
        if (this.mainPanel) {
            // If panel already exists, just reveal it
            this.mainPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Create a new webview panel
        this.mainPanel = vscode.window.createWebviewPanel(
            'codeContextEngineMain', // Unique ID for the panel type
            'Code Context Engine',   // Title displayed to the user
            vscode.ViewColumn.One,   // Column to show the panel in
            {
                enableScripts: true, // Enable JavaScript in the webview
                // Restrict the webview to only load resources from the 'webview/dist' directory
                localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))]
            }
        );

        // Set the HTML content for the webview
        this.mainPanel.webview.html = this.getWebviewContent(this.mainPanel.webview, 'main');

        // Handle panel disposal: clear the reference when the panel is closed
        this.mainPanel.onDidDispose(() => {
            this.mainPanel = undefined;
        }, null, this.context.subscriptions); // Add to context subscriptions for automatic disposal
    }

    /**
     * Shows or reveals the settings webview panel.
     */
    public showSettingsPanel(): void {
        if (this.settingsPanel) {
            this.settingsPanel.reveal(vscode.ViewColumn.Two);
            return;
        }

        this.settingsPanel = vscode.window.createWebviewPanel(
            'codeContextEngineSettings',
            'Code Context Settings',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))]
            }
        );

        this.settingsPanel.webview.html = this.getWebviewContent(this.settingsPanel.webview, 'settings');

        this.settingsPanel.onDidDispose(() => {
            this.settingsPanel = undefined;
        }, null, this.context.subscriptions);
    }

    /**
     * Disposes of all active webview panels.
     */
    public dispose(): void {
        this.mainPanel?.dispose();
        this.settingsPanel?.dispose();
    }
}
```

### 2. Update `ExtensionManager` (`src/extensionManager.ts`)

**Purpose:** To instantiate the `WebviewManager` and make it accessible to other parts of the extension, particularly the `CommandManager`.

**Code Example (`src/extensionManager.ts` - Partial Update):**
```typescript
// src/extensionManager.ts
import * as vscode from 'vscode';
// ... other imports ...
import { WebviewManager } from './webviewManager'; // New import

export class ExtensionManager implements vscode.Disposable {
    // ... existing private members for services ...
    public webviewManager: WebviewManager; // Make webviewManager public for access by CommandManager
    private commandManager: CommandManager;

    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        // ... existing service instantiations ...

        // Instantiate WebviewManager, passing the extension context
        this.webviewManager = new WebviewManager(this.context);

        // Instantiate CommandManager, passing the services it needs, including webviewManager
        this.commandManager = new CommandManager(this.indexingService, this.webviewManager);

        // Add webviewManager to disposables if it needs explicit disposal
        this.disposables.push(this.webviewManager);
    }

    // ... initialize and dispose methods ...
}
```

### 3. Update `CommandManager` (`src/commandManager.ts`)

**Purpose:** To delegate the `openMainPanel` and `openSettings` commands to the newly created `WebviewManager`.

**Code Example (`src/commandManager.ts` - Partial Update):**
```typescript
// src/commandManager.ts
import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';
import { WebviewManager } from './webviewManager'; // New import

export class CommandManager {
    constructor(private indexingService: IndexingService, private webviewManager: WebviewManager) {}

    public registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        disposables.push(
            vscode.commands.registerCommand('code-context-engine.openMainPanel', () => {
                this.webviewManager.showMainPanel(); // Delegate to WebviewManager
            }),
            vscode.commands.registerCommand('code-context-engine.startIndexing', () => {
                this.indexingService.startIndexing();
                vscode.window.showInformationMessage('Indexing started!');
            }),
            vscode.commands.registerCommand('code-context-engine.openSettings', () => {
                this.webviewManager.showSettingsPanel(); // Delegate to WebviewManager
            })
        );

        return disposables;
    }
}
```

### Further Guidance:

*   **`index.html` Placeholders:** Ensure your `webview/dist/index.html` file has the `{{scriptUri}}` and `{{styleUri}}` placeholders where the JavaScript and CSS files should be linked. For example:
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Context Engine</title>
        <link rel="stylesheet" href="{{styleUri}}">
    </head>
    <body>
        <div id="root"></div>
        <script src="{{scriptUri}}"></script>
    </body>
    </html>
    ```
*   **Webview Security:** The `localResourceRoots` option in `createWebviewPanel` is crucial for security. It restricts the webview from loading arbitrary local files. Only allow access to the `webview/dist` directory where your bundled webview assets reside.
*   **Message Passing:** While this sub-sprint focuses on webview management, the next sub-sprint will cover communication between the webview and the extension. Be mindful that `WebviewManager` will eventually need to set up `onDidReceiveMessage` listeners and potentially `postMessage` calls.
*   **Error Handling:** Add error handling for `fs.readFileSync` in `getWebviewContent` to gracefully manage cases where the HTML file might not be found.
