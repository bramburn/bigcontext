## Implementation Guidance: Sub-Sprint 4 - Message Routing & State

This guide focuses on formalizing the communication layer between the webview and the extension's backend, and centralizing the extension's global state. This involves creating `StateManager` and `MessageRouter` classes.

### 1. `StateManager` (`src/stateManager.ts` - New File)

**Purpose:** To provide a centralized, simple mechanism for tracking the global state of the extension. This prevents services from needing to directly query each other for status updates and allows for consistent state checks (e.g., preventing duplicate operations).

**Key Responsibilities:**
-   **State Storage:** Holds simple boolean flags or other primitive state variables.
-   **State Access:** Provides public getter and setter methods for each state property.

**Code Example (`src/stateManager.ts`):**
```typescript
// src/stateManager.ts

export class StateManager {
    private _isIndexing: boolean = false; // Example state: is an indexing operation currently running?
    private _isProcessingQuery: boolean = false; // Example state: is a query being processed?

    /**
     * Checks if an indexing operation is currently in progress.
     */
    public isIndexing(): boolean {
        return this._isIndexing;
    }

    /**
     * Sets the status of the indexing operation.
     * @param state True if indexing is in progress, false otherwise.
     */
    public setIndexing(state: boolean): void {
        this._isIndexing = state;
    }

    /**
     * Checks if a query is currently being processed.
     */
    public isProcessingQuery(): boolean {
        return this._isProcessingQuery;
    }

    /**
     * Sets the status of the query processing operation.
     * @param state True if a query is being processed, false otherwise.
     */
    public setProcessingQuery(state: boolean): void {
        this._isProcessingQuery = state;
    }

    // Add more state properties and their corresponding getters/setters as your extension grows
}
```

### 2. `MessageRouter` (`src/messageRouter.ts` - New File)

**Purpose:** To centralize the handling of messages received from the webview. It acts as a dispatcher, routing messages to the appropriate backend services and sending responses back to the webview. This replaces large `switch` statements in the webview's `onDidReceiveMessage` listener.

**Key Responsibilities:**
-   **Message Listening:** Sets up the `onDidReceiveMessage` listener for a given webview.
-   **Command Routing:** Parses incoming messages and delegates the execution to the correct service method.
-   **Response Handling:** Sends structured responses (including results or errors) back to the webview.
-   **State Integration:** Uses the `StateManager` to check conditions before executing commands.

**API Information:**
-   `webview.onDidReceiveMessage(callback, thisArgs?, disposables?)`: Event fired when the webview posts a message to the extension.
-   `webview.postMessage(message)`: Sends a message from the extension to the webview.

**Code Example (`src/messageRouter.ts`):**
```typescript
// src/messageRouter.ts
import * as vscode from 'vscode';
import { ExtensionManager } from './extensionManager'; // Import the ExtensionManager

export class MessageRouter {
    constructor(
        private extensionManager: ExtensionManager, // Access to all services and managers
        private webview: vscode.Webview
    ) {
        // Set up the listener for messages from the webview
        this.webview.onDidReceiveMessage(async message => {
            await this.routeMessage(message);
        }, undefined, this.extensionManager.context.subscriptions); // Ensure proper disposal
    }

    /**
     * Routes incoming messages from the webview to the appropriate handler.
     * Messages are expected to have a 'command' and optionally 'requestId' and 'payload'.
     */
    private async routeMessage(message: any): Promise<void> {
        const { command, requestId, payload } = message;

        let result: any; // To store the result of the command execution
        let error: string | undefined; // To store any error messages

        try {
            switch (command) {
                case 'startIndexing':
                    // Check state before starting indexing
                    if (this.extensionManager.stateManager.isIndexing()) {
                        throw new Error('Indexing is already in progress. Please wait.');
                    }
                    // Delegate to IndexingService
                    await this.extensionManager.indexingService.startIndexing();
                    result = { success: true, message: 'Indexing initiated.' };
                    break;

                case 'getSettings':
                    // Example: Assuming ConfigService has a method to return settings
                    result = this.extensionManager.configService.getSettings(); 
                    break;

                // Add more cases for other commands from the webview
                // case 'queryContext':
                //     result = await this.extensionManager.contextService.queryContext(payload.query);
                //     break;

                default:
                    throw new Error(`Unknown command: ${command}`);
            }
        } catch (e: any) {
            // Catch any errors during command execution and store the message
            error = e.message;
        }

        // Send a response back to the webview
        this.webview.postMessage({
            command: `${command}Response`, // Convention: commandName + 'Response'
            requestId, // Include requestId to match responses with requests on the webview side
            result,    // The result of the operation
            error      // Any error message
        });
    }
}
```

### 3. Integrate `StateManager` into `ExtensionManager` and Services

**Purpose:** To make the `StateManager` available throughout the extension and ensure services update the state as their operations begin and end.

**a) Update `ExtensionManager` (`src/extensionManager.ts` - Partial Update):**

Instantiate `StateManager` and pass it to services that need to interact with the global state.
```typescript
// src/extensionManager.ts
import * as vscode from 'vscode';
// ... other imports ...
import { StateManager } from './stateManager'; // New import

export class ExtensionManager implements vscode.Disposable {
    // ... existing private members ...
    public stateManager: StateManager; // Make StateManager public for access by MessageRouter and other services

    constructor(private context: vscode.ExtensionContext) {
        // ... existing instantiations ...

        // Instantiate StateManager
        this.stateManager = new StateManager();

        // Pass StateManager to services that need to update or read global state
        this.indexingService = new IndexingService(
            fileWalker,
            astParser,
            chunker,
            this.qdrantService,
            this.embeddingProvider,
            lspService,
            this.stateManager // Pass stateManager here
        );

        // ... other instantiations ...
    }

    // ... initialize and dispose methods ...
}
```

**b) Update `IndexingService` (`src/indexing/indexingService.ts` - Partial Update):**

Modify `IndexingService` to accept `StateManager` in its constructor and update the `isIndexing` state during its `startIndexing` method.
```typescript
// src/indexing/indexingService.ts
import { StateManager } from '../stateManager'; // New import
// ... other imports ...

export class IndexingService {
    constructor(
        private fileWalker: FileWalker,
        private astParser: AstParser,
        private chunker: Chunker,
        private qdrantService: QdrantService,
        private embeddingProvider: IEmbeddingProvider,
        private lspService: LspService,
        private stateManager: StateManager // New dependency
    ) {
        // ...
    }

    public async startIndexing(): Promise<void> {
        this.stateManager.setIndexing(true); // Set state to true when indexing starts
        try {
            console.log('Indexing started...');
            // Simulate actual indexing work
            await new Promise(resolve => setTimeout(resolve, 3000)); 
            console.log('Indexing complete.');
        } catch (error) {
            console.error('Indexing failed:', error);
            throw error; // Re-throw to propagate the error
        } finally {
            this.stateManager.setIndexing(false); // Always set state to false when indexing finishes (success or failure)
        }
    }

    // ... other methods ...
}
```

### 4. Integrate `MessageRouter` into `WebviewManager`

**Purpose:** To replace the direct `onDidReceiveMessage` listener in `WebviewManager` with an instantiation of `MessageRouter`, making the webview communication cleaner and more modular.

**a) Update `WebviewManager` (`src/webviewManager.ts` - Partial Update):**

Modify the `showMainPanel` and `showSettingsPanel` methods to instantiate `MessageRouter` and pass it the `ExtensionManager` and the webview instance.
```typescript
// src/webviewManager.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ExtensionManager } from './extensionManager'; // Import ExtensionManager
import { MessageRouter } from './messageRouter'; // New import

export class WebviewManager implements vscode.Disposable {
    // ... existing properties ...

    // WebviewManager now needs ExtensionManager to pass to MessageRouter
    constructor(private context: vscode.ExtensionContext, private extensionManager: ExtensionManager) {}

    // ... getWebviewContent method ...

    public showMainPanel(): void {
        if (this.mainPanel) {
            this.mainPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.mainPanel = vscode.window.createWebviewPanel(
            'codeContextEngineMain',
            'Code Context Engine',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))]
            }
        );

        this.mainPanel.webview.html = this.getWebviewContent(this.mainPanel.webview, 'main');

        // Instantiate MessageRouter for this panel
        new MessageRouter(this.extensionManager, this.mainPanel.webview);

        this.mainPanel.onDidDispose(() => {
            this.mainPanel = undefined;
        }, null, this.context.subscriptions);
    }

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

        // Instantiate MessageRouter for this panel
        new MessageRouter(this.extensionManager, this.settingsPanel.webview);

        this.settingsPanel.onDidDispose(() => {
            this.settingsPanel = undefined;
        }, null, this.context.subscriptions);
    }

    // ... dispose method ...
}
```

**b) Update `ExtensionManager` (`src/extensionManager.ts` - Partial Update):**

Modify `ExtensionManager`'s constructor to pass itself to `WebviewManager`.
```typescript
// src/extensionManager.ts
import * as vscode from 'vscode';
// ... other imports ...
import { WebviewManager } from './webviewManager';

export class ExtensionManager implements vscode.Disposable {
    // ... existing private members ...

    constructor(private context: vscode.ExtensionContext) {
        // ... existing instantiations ...

        // Instantiate WebviewManager, passing the extension context AND itself (this)
        this.webviewManager = new WebviewManager(this.context, this);

        // ... existing commandManager instantiation ...
    }

    // ... initialize and dispose methods ...
}
```

### Further Guidance:

*   **Webview-Side Communication:** On the webview (frontend) side, you'll need to use `vscode.postMessage` to send messages to the extension and listen for responses. A common pattern is to have a utility function that wraps `postMessage` and returns a Promise that resolves when a corresponding response is received (matching `requestId`).
*   **Error Handling:** Implement robust error handling in `MessageRouter` and ensure that errors are clearly communicated back to the webview. Consider different error types (e.g., validation errors, service errors).
*   **Message Structure:** Define a clear message structure for communication between the webview and extension (e.g., `{ command: string, requestId?: string, payload?: any }` for requests and `{ command: string, requestId?: string, result?: any, error?: string }` for responses).
*   **State Granularity:** The `StateManager` is kept simple here. For more complex state management, consider libraries like Redux or MobX, but for most VS Code extensions, a simple custom `StateManager` is sufficient.
*   **Disposables:** Ensure that any `onDidReceiveMessage` listeners are properly disposed of when the webview panel is closed to prevent memory leaks. The `MessageRouter` handles this by adding its listener to `extensionManager.context.subscriptions`.
