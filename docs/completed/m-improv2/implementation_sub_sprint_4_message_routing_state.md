### Implementation Guidance: Sub-Sprint 4 - Message Routing & State Management

This guide provides detailed steps and code examples for implementing the `StateManager` and `MessageRouter` classes, integrating them into the extension's architecture, and ensuring proper communication and state management.

**1. Create `src/stateManager.ts`**

*   **Purpose**: To centralize and manage the global state of the extension, particularly for long-running operations like indexing.
*   **Implementation Details**: Create a simple TypeScript class with private properties to hold state (e.g., `_isIndexing`, `_isPaused`, `_indexingMessage`, `_error`). Provide public getter and setter methods for each state property. This class should be lightweight and not contain complex business logic.

```typescript
// src/stateManager.ts
export class StateManager {
    private _isIndexing: boolean = false;
    private _isPaused: boolean = false;
    private _indexingMessage: string | null = null;
    private _error: string | null = null;

    public isIndexing(): boolean {
        return this._isIndexing;
    }

    public setIndexing(state: boolean, message: string | null = null): void {
        this._isIndexing = state;
        this._indexingMessage = message;
    }

    public isPaused(): boolean {
        return this._isPaused;
    }

    public setPaused(state: boolean): void {
        this._isPaused = state;
    }

    public getIndexingMessage(): string | null {
        return this._indexingMessage;
    }

    public setError(error: string | null): void {
        this._error = error;
    }

    public getError(): string | null {
        return this._error;
    }

    public clearError(): void {
        this._error = null;
    }

    public dispose(): void {
        // No resources to dispose for a simple state manager
        console.log('StateManager: Disposed');
    }
}
```

**2. Create `src/messageRouter.ts`**

*   **Purpose**: To act as a central hub for all messages coming from the webview, routing them to the appropriate services and handling responses.
*   **Implementation Details**: 
    *   The constructor should accept an instance of `ExtensionManager` (to access all services) and `vscode.Webview` (to post messages back to the webview).
    *   Set up the `webview.onDidReceiveMessage` listener within the constructor to call a private `routeMessage` method.
    *   The `routeMessage` method will contain a `switch` statement (or similar logic) to identify the command from the webview message and delegate to the relevant service method (e.g., `indexingService.startIndexing()`).
    *   Ensure responses are sent back to the webview using `this.webview.postMessage()`.
    *   Implement error handling to catch exceptions during command execution and send error messages back to the webview.

```typescript
// src/messageRouter.ts
import * as vscode from 'vscode';
import { ExtensionManager } from './extensionManager'; 

export class MessageRouter {
    private extensionManager: ExtensionManager;
    private webview: vscode.Webview;

    constructor(extensionManager: ExtensionManager, webview: vscode.Webview) {
        this.extensionManager = extensionManager;
        this.webview = webview;

        this.webview.onDidReceiveMessage(
            message => this.routeMessage(message),
            undefined,
            this.extensionManager.getContext().subscriptions 
        );
    }

    private async routeMessage(message: any): Promise<void> {
        console.log('MessageRouter: Received message from webview:', message);

        const stateManager = this.extensionManager.getStateManager();
        const indexingService = this.extensionManager.getIndexingService();
        const contextService = this.extensionManager.getContextService();
        // Access other services via this.extensionManager.getSomeService()

        try {
            let response: any;
            switch (message.command) {
                case 'startIndexing':
                    if (stateManager.isIndexing()) {
                        response = {
                            command: message.command,
                            requestId: message.requestId,
                            error: 'Indexing is already in progress.'
                        };
                    } else {
                        await indexingService.startIndexing();
                        response = {
                            command: message.command,
                            requestId: message.requestId,
                            result: 'Indexing started successfully.'
                        };
                    }
                    break;
                case 'searchCode':
                    const query = message.data.query;
                    const searchResults = await contextService.queryContext({ query: query });
                    response = {
                        command: message.command,
                        requestId: message.requestId,
                        result: searchResults
                    };
                    break;
                // Add more cases for other commands as needed
                default:
                    response = {
                        command: message.command,
                        requestId: message.requestId,
                        error: `Unknown command: ${message.command}`
                    };
                    break;
            }
            this.webview.postMessage(response);
        } catch (error: any) {
            console.error('MessageRouter: Error routing message:', error);
            this.webview.postMessage({
                command: message.command,
                requestId: message.requestId,
                error: error.message || 'An unknown error occurred.'
            });
        }
    }
}
```

**3. Update `src/webviewManager.ts`**

*   **Purpose**: To integrate the `MessageRouter` for handling incoming webview messages, replacing the previous `onDidReceiveMessage` logic.
*   **Implementation Details**: 
    *   Modify the `WebviewManager` constructor to accept `extensionManager: ExtensionManager` as a dependency.
    *   In the `createPanel` method, replace the existing `panel.webview.onDidReceiveMessage` setup with a new `MessageRouter` instance, passing `this.extensionManager` and `panel.webview` to its constructor.

```typescript
// src/webviewManager.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MessageRouter } from './messageRouter'; 
import { ExtensionManager } from './extensionManager'; 

// ... (WebviewConfig, WebviewPanel, WebviewMessage interfaces)

export class WebviewManager {
    private context: vscode.ExtensionContext;
    private extensionManager: ExtensionManager; 
    private panels: Map<string, WebviewPanel> = new Map();
    private disposables: vscode.Disposable[] = [];
    private messageQueue: Map<string, WebviewMessage[]> = new Map();
    private updateTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly updateDebounceMs = 100;

    private mainPanel: vscode.WebviewPanel | undefined;
    private settingsPanel: vscode.WebviewPanel | undefined;

    constructor(context: vscode.ExtensionContext, extensionManager: ExtensionManager) { 
        this.context = context;
        this.extensionManager = extensionManager; 
        this.setupEventListeners();
    }

    createPanel(config: WebviewConfig): string {
        try {
            console.log('WebviewManager: Creating webview panel:', config.id);

            if (this.panels.has(config.id)) {
                console.warn(`WebviewManager: Panel with ID '${config.id}' already exists`);
                return config.id;
            }

            const panel = vscode.window.createWebviewPanel(
                config.id,
                config.title,
                config.viewColumn || vscode.ViewColumn.One,
                {
                    enableScripts: config.enableScripts || true,
                    enableCommandUris: config.enableCommandUris || false,
                    localResourceRoots: config.localResourceRoots || [vscode.Uri.joinPath(vscode.Uri.file(__dirname), 'resources')],
                    portMapping: config.portMapping
                }
            );

            // Integrate MessageRouter here
            new MessageRouter(this.extensionManager, panel.webview); 

            panel.onDidDispose(
                () => this.handlePanelDispose(config.id),
                undefined,
                this.disposables
            );

            const webviewPanel: WebviewPanel = {
                id: config.id,
                panel,
                config,
                visible: true,
                lastUpdated: new Date(),
                messageHandlers: new Map() // Message handlers will now be managed by MessageRouter
            };

            this.panels.set(config.id, webviewPanel);
            
            console.log(`WebviewManager: Created webview panel '${config.id}'`);
            return config.id;

        } catch (error) {
            console.error('WebviewManager: Failed to create webview panel:', error);
            throw error;
        }
    }

    // ... (other methods like showMainPanel, showSettingsPanel, dispose, etc.)
}
```

**4. Update `src/indexing/indexingService.ts`**

*   **Purpose**: To ensure the `IndexingService` correctly updates the `StateManager` during indexing operations.
*   **Implementation Details**: Based on previous analysis, the `IndexingService` already correctly uses `this.stateManager.setIndexing(true)` at the beginning of `startIndexing` and `this.stateManager.setIndexing(false)` in a `finally` block. No further changes are required in this file for this sub-sprint.

**5. Update `src/extensionManager.ts`**

*   **Purpose**: To ensure `StateManager` is instantiated and accessible, and to pass the `ExtensionManager` instance to the `WebviewManager`.
*   **Implementation Details**: 
    *   The `StateManager` is already instantiated in `ExtensionManager.initialize()`. Ensure it is assigned to a public property (e.g., `this.stateManager`) so it can be accessed by other services (like `MessageRouter`).
    *   Modify the instantiation of `WebviewManager` in `ExtensionManager.initialize()` to pass `this` (the `ExtensionManager` instance itself) as the second argument to the `WebviewManager` constructor.

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
            console.log('ExtensionManager: Starting service initialization...');

            // Step 1: Initialize StateManager first (no dependencies)
            this.stateManager = new StateManager(); 
            console.log('ExtensionManager: StateManager initialized');

            // ... (other initializations)

            // Step 10: Initialize WebviewManager
            this.webviewManager = new WebviewManager(this.context, this); // Pass this (ExtensionManager) here
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
