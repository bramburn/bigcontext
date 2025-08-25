# Implementation Guidance: Sub-Sprint 4 - Message Routing & State

**Objective:** To create the `MessageRouter` and `StateManager` classes to formalize the communication layer and centralize the extension's global state.

---

### 1. Overview

This guide covers the final refactoring steps to fully decouple the extension's components. We will create two classes:
1.  `StateManager`: A simple, centralized store for global extension state, such as whether an indexing operation is currently active.
2.  `MessageRouter`: A dedicated class whose sole responsibility is to listen for messages from a webview and route them to the appropriate service.

This separation of concerns makes the codebase cleaner, more testable, and easier to maintain.

### 2. Step-by-Step Implementation

#### Step 2.1: Create the `StateManager`

This class will be a simple property bag with getters and setters to prevent direct modification of state properties from outside the class.

**File:** `src/stateManager.ts` (New File)
```typescript
/**
 * Manages the global state of the extension.
 */
export class StateManager {
    private _isIndexing = false;
    private _isBackendHealthy = true; // Example of another potential state

    // --- isIndexing State ---

    public isIndexing(): boolean {
        return this._isIndexing;
    }

    public setIndexing(state: boolean): void {
        this._isIndexing = state;
        // In the future, we could add an event emitter here to notify other parts
        // of the extension about state changes.
    }

    // --- isBackendHealthy State ---

    public isBackendHealthy(): boolean {
        return this._isBackendHealthy;
    }

    public setBackendHealthy(state: boolean): void {
        this._isBackendHealthy = state;
    }
}
```

#### Step 2.2: Instantiate `StateManager` in `ExtensionManager`

The `ExtensionManager` should create and hold the single instance of the `StateManager`.

**File:** `src/extensionManager.ts` (Modify)
```typescript
// Add the import
import { StateManager } from './stateManager';

export class ExtensionManager {
    public readonly stateManager: StateManager;
    // ... other properties

    constructor(context: vscode.ExtensionContext) {
        this.stateManager = new StateManager();
        // ... other initializations
    }

    // ...
}
```

#### Step 2.3: Create the `MessageRouter`

This class will listen for webview messages and delegate them. It requires access to the `ExtensionManager` to get to all the services and managers.

**File:** `src/messageRouter.ts` (New File)
```typescript
import * as vscode from 'vscode';
import { ExtensionManager } from './extensionManager';

/**
 * Handles all incoming messages from a webview and routes them to the appropriate service.
 */
export class MessageRouter {
    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly _extensionManager: ExtensionManager,
        private readonly _webview: vscode.Webview
    ) {
        this._webview.onDidReceiveMessage(
            this._routeMessage, 
            this, 
            this._disposables
        );
    }

    private async _routeMessage(message: { command: string; [key: string]: any }) {
        const { command, ...rest } = message;

        // Example of using the StateManager as a guard
        if (command === 'startIndexing' && this._extensionManager.stateManager.isIndexing()) {
            this._webview.postMessage({
                command: 'indexingError',
                error: 'An indexing process is already running.'
            });
            return;
        }

        // The main switch statement for routing commands
        switch (command) {
            case 'startIndexing':
                // Delegate to the command manager or directly to the service
                vscode.commands.executeCommand('code-context-engine.startIndexing');
                break;

            case 'search':
                const searchManager = this._extensionManager.getSearchManager();
                await searchManager.performSearch(rest.query, this._webview);
                break;

            // ... add all other cases from the old switch statement

            default:
                console.warn(`Unknown command received: ${command}`);
        }
    }

    public dispose() {
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
```

#### Step 2.4: Integrate `MessageRouter` into `WebviewManager`

Now, simplify the `WebviewManager` by removing the message handling logic and replacing it with an instantiation of the `MessageRouter`.

**File:** `src/webviewManager.ts` (Modify)
```typescript
// Add the new imports
import { MessageRouter } from './messageRouter';
import { ExtensionManager } from './extensionManager'; // Assuming you pass this in

export class WebviewManager {
    // ... (currentPanel, _panel, _extensionUri, _disposables)

    // The constructor should now accept the ExtensionManager
    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, extensionManager: ExtensionManager) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // This is the key change: instantiate the router and let it handle messages.
        // The router will add its own disposables to this._disposables.
        const router = new MessageRouter(extensionManager, this._panel.webview);
        this._disposables.push(router);
    }

    // The createOrShow method will also need to accept the ExtensionManager
    public static createOrShow(extensionUri: vscode.Uri, extensionManager: ExtensionManager) {
        // ... (existing singleton logic)

        // Pass extensionManager to the constructor
        WebviewManager.currentPanel = new WebviewManager(panel, extensionUri, extensionManager);
    }
    
    // ... (rest of the class)
}
```

#### Step 2.5: Update a Service to Use the `StateManager`

Finally, update a service like `IndexingService` to report its status.

**File:** `src/indexing/indexingService.ts` (Modify)
```typescript
import { StateManager } from '../stateManager';

export class IndexingService {
    // The constructor now needs the StateManager
    constructor(private readonly stateManager: StateManager) {}

    public async startIndexing(/*...args...*/) {
        if (this.stateManager.isIndexing()) {
            console.warn("Indexing already in progress.");
            return;
        }

        this.stateManager.setIndexing(true);
        try {
            // ... your existing indexing logic ...
        } catch (error) {
            console.error("Indexing failed", error);
        } finally {
            // This `finally` block ensures the state is always reset, even if an error occurs.
            this.stateManager.setIndexing(false);
        }
    }
}
```

### 3. Verification

After this refactoring, run the extension and test all the webview functionality. The primary test is to confirm that a user cannot start a second indexing process while one is already running. The UI should receive and display the error message sent from the `MessageRouter`'s guard clause.
