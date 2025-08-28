### Implementation Guidance: Sub-Sprint 3 - Centralized Webview Management

This guide provides detailed steps and code examples for centralizing webview management within the `WebviewManager`, including handling panel lifecycle, content loading, and integrating with `ExtensionManager` and `CommandManager`.

**1. Refactor `src/webviewManager.ts`**

*   **Purpose**: To consolidate all webview panel creation, management, and HTML content loading into a single, dedicated class.
*   **Implementation Details**: 
    *   Modify the `WebviewManager` constructor to accept `context: vscode.ExtensionContext`. This context is crucial for resolving webview URIs.
    *   Add private properties (`mainPanel`, `settingsPanel`) to store references to the specific webview panels, allowing for single-instance management.
    *   Implement a `private getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string` helper method. This method will read the `index.html` file from the `webview/dist` directory and use `webview.asWebviewUri` to correctly resolve paths for CSS, JavaScript, and other assets. You will need to inspect your SvelteKit build output (`webview/dist/index.html`) to identify the exact placeholders or patterns for asset paths that need to be replaced.
    *   Refactor `showMainPanel()` and implement `showSettingsPanel()` to utilize the `getWebviewContent` helper. These methods should check if their respective panel instances already exist; if so, they should `reveal()` the existing panel. Otherwise, they create a new panel, store its reference, and attach an `onDidDispose` listener to nullify the reference when the panel is closed.
    *   Ensure the `dispose()` method correctly clears these specific panel references in addition to the general `panels` map.

```typescript
// src/webviewManager.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs'; 

// ... (WebviewConfig, WebviewPanel, WebviewMessage interfaces)

export class WebviewManager {
    private context: vscode.ExtensionContext; 
    private panels: Map<string, WebviewPanel> = new Map();
    private disposables: vscode.Disposable[] = [];
    private messageQueue: Map<string, WebviewMessage[]> = new Map();
    private updateTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly updateDebounceMs = 100;

    private mainPanel: vscode.WebviewPanel | undefined; 
    private settingsPanel: vscode.WebviewPanel | undefined; 

    constructor(context: vscode.ExtensionContext) { 
        this.context = context;
        this.setupEventListeners();
    }

    // ... (createPanel, showPanel, hidePanel, togglePanel, getPanel, getAllPanels, getVisiblePanels, deletePanel, setHtml, postMessage, registerMessageHandler, unregisterMessageHandler, getLocalResourceUri, handleMessage, handlePanelDispose, scheduleMessageUpdate, processMessageQueue, setupEventListeners methods)

    private getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        const htmlPath = path.join(extensionUri.fsPath, 'webview', 'dist', 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // IMPORTANT: These placeholders depend on your SvelteKit build output.
        // You MUST inspect the generated index.html in webview/dist to find 
        // the correct patterns to replace. The example below is illustrative.
        // Example: Replace relative paths with webview-compatible URIs
        html = html.replace(/(src|href)="(\/_app\/[^"]+)"/g, (match, attr, src) => {
            const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'webview', 'dist', src));
            return `${attr}="${resourceUri}"`;
        });

        return html;
    }

    showMainPanel(): void {
        const panelId = 'codeContextMain';
        const panelTitle = 'Code Context';

        if (this.mainPanel) {
            this.mainPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.mainPanel = vscode.window.createWebviewPanel(
            panelId,
            panelTitle,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview', 'dist')]
            }
        );

        this.mainPanel.webview.html = this.getWebviewContent(this.mainPanel.webview, this.context.extensionUri);

        this.mainPanel.onDidDispose(() => {
            this.mainPanel = undefined;
            this.deletePanel(panelId); 
        }, null, this.disposables);

        // Add to general panels map for consistent management
        this.panels.set(panelId, {
            id: panelId,
            panel: this.mainPanel,
            config: { id: panelId, title: panelTitle, enableScripts: true },
            visible: true,
            lastUpdated: new Date(),
            messageHandlers: new Map()
        });
    }

    showSettingsPanel(): void {
        const panelId = 'codeContextSettings';
        const panelTitle = 'Code Context Settings';

        if (this.settingsPanel) {
            this.settingsPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.settingsPanel = vscode.window.createWebviewPanel(
            panelId,
            panelTitle,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview', 'dist')]
            }
        );

        this.settingsPanel.webview.html = this.getWebviewContent(this.settingsPanel.webview, this.context.extensionUri);

        this.settingsPanel.onDidDispose(() => {
            this.settingsPanel = undefined;
            this.deletePanel(panelId); 
        }, null, this.disposables);

        // Add to general panels map for consistent management
        this.panels.set(panelId, {
            id: panelId,
            panel: this.settingsPanel,
            config: { id: panelId, title: panelTitle, enableScripts: true },
            visible: true,
            lastUpdated: new Date(),
            messageHandlers: new Map()
        });
    }

    // Ensure showDiagnosticsPanel also uses getWebviewContent
    showDiagnosticsPanel(): void {
        const diagnosticsPanelId = 'codeContextDiagnostics';
        const diagnosticsPanelTitle = 'Code Context Diagnostics';

        if (this.panels.has(diagnosticsPanelId)) {
            this.showPanel(diagnosticsPanelId);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            diagnosticsPanelId,
            diagnosticsPanelTitle,
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview', 'dist')]
            }
        );

        panel.webview.html = this.getWebviewContent(panel.webview, this.context.extensionUri);

        panel.onDidDispose(() => {
            this.deletePanel(diagnosticsPanelId);
        }, null, this.disposables);

        this.panels.set(diagnosticsPanelId, {
            id: diagnosticsPanelId,
            panel: panel,
            config: { id: diagnosticsPanelId, title: diagnosticsPanelTitle, enableScripts: true },
            visible: true,
            lastUpdated: new Date(),
            messageHandlers: new Map()
        });
    }

    dispose(): void {
        try {
            this.updateTimers.forEach(timer => clearTimeout(timer));
            this.updateTimers.clear();

            this.panels.forEach(webviewPanel => {
                webviewPanel.panel.dispose();
            });
            this.panels.clear();

            // Clear specific panel references
            this.mainPanel = undefined;
            this.settingsPanel = undefined;

            this.messageQueue.clear();

            this.disposables.forEach(disposable => disposable.dispose());
            this.disposables = [];

            console.log('WebviewManager: Disposed');

        } catch (error) {
            console.error('WebviewManager: Error during disposal:', error);
        }
    }
}
```

**2. Update `src/extensionManager.ts`**

*   **Purpose**: To pass the `vscode.ExtensionContext` to the `WebviewManager` constructor during its instantiation.
*   **Implementation Details**: Locate the line where `WebviewManager` is instantiated in `ExtensionManager.initialize()` and pass `this.context` as an argument.

```typescript
// src/extensionManager.ts
// ... (imports)

export class ExtensionManager {
    // ... (properties)

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async initialize(): Promise<void> {
        try {
            // ... (other initializations)

            // Step 10: Initialize WebviewManager
            this.webviewManager = new WebviewManager(this.context); // Pass context here
            console.log('ExtensionManager: WebviewManager initialized');

            // ... (rest of initializations)

        } catch (error) {
            console.error('ExtensionManager: Failed to initialize services:', error);
            throw error;
        }
    }

    // ... (dispose and getter methods)
}
```

**3. Refactor `src/commandManager.ts`**

*   **Purpose**: To delegate the `openSettings` command to the `WebviewManager`'s new `showSettingsPanel()` method.
*   **Implementation Details**: Modify the `handleOpenSettings()` method to call `this.webviewManager.showSettingsPanel()` instead of executing the native VS Code command. This centralizes UI management within the `WebviewManager`.

```typescript
// src/commandManager.ts
import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';
import { WebviewManager } from './webviewManager';

export class CommandManager {
    private indexingService: IndexingService;
    private webviewManager: WebviewManager;

    constructor(indexingService: IndexingService, webviewManager: WebviewManager) {
        this.indexingService = indexingService;
        this.webviewManager = webviewManager;
    }

    // ... (registerCommands, handleOpenMainPanel, handleStartIndexing methods)

    private async handleOpenSettings(): Promise<void> {
        try {
            console.log('CommandManager: Opening settings panel...');
            // Delegate to WebviewManager to handle the settings panel creation and display
            this.webviewManager.showSettingsPanel(); // Call showSettingsPanel
            console.log('CommandManager: Settings panel opened successfully');
        } catch (error) {
            console.error('CommandManager: Failed to open settings:', error);
            vscode.window.showErrorMessage('Failed to open Code Context Engine settings');
        }
    }

    // ... (handleSetupProject, handleOpenDiagnostics methods)
}
```
