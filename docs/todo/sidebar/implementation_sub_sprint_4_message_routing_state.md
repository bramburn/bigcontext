### Implementation Guide: Sub-Sprint 4 - Message Routing & State

This guide provides the technical details for creating a `StateManager` to prevent conflicting operations and a `MessageRouter` to decouple communication logic from the UI layer.

#### 1. Implement the `StateManager`

Create a new file for the `StateManager`. This class will be a simple state container with public getters and setters.

**File**: `src/stateManager.ts`
```typescript
export class StateManager {
    private _isIndexing: boolean = false;
    private _lastError: string | null = null;

    public isIndexing(): boolean {
        return this._isIndexing;
    }

    public setIndexing(isIndexing: boolean) {
        this._isIndexing = isIndexing;
        if (isIndexing) {
            // Clear previous errors when starting a new operation
            this._lastError = null;
        }
    }

    public getLastError(): string | null {
        return this._lastError;
    }

    public setError(error: string | null) {
        this._lastError = error;
    }
}
```

#### 2. Integrate `StateManager` into Services

Any service performing a state-sensitive operation should use the `StateManager`. Inject the manager via the constructor and use a `try...finally` block to ensure state is always reset.

**File**: `src/indexing/indexingService.ts`
```typescript
import { StateManager } from '../stateManager';

export class IndexingService {
    private stateManager: StateManager;

    constructor(stateManager: StateManager /*, ...other services */) {
        this.stateManager = stateManager;
    }

    public async startIndexing() {
        if (this.stateManager.isIndexing()) {
            console.warn('Indexing is already in progress.');
            throw new Error('An indexing operation is already running.');
        }

        this.stateManager.setIndexing(true);
        try {
            // --- Main indexing logic goes here ---
            console.log('Indexing started...');
            // ...
        } finally {
            // This ensures the state is reset even if an error occurs
            this.stateManager.setIndexing(false);
            console.log('Indexing finished.');
        }
    }
}
```

#### 3. Implement the `MessageRouter`

Create a new file for the `MessageRouter`. This class will take all necessary services as dependencies and contain the central message-handling logic.

**File**: `src/messageRouter.ts`
```typescript
import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';
import { StateManager } from './stateManager';

export class MessageRouter {
    private indexingService: IndexingService;
    private stateManager: StateManager;

    constructor(indexingService: IndexingService, stateManager: StateManager) {
        this.indexingService = indexingService;
        this.stateManager = stateManager;
    }

    public async handleMessage(message: any, webview: vscode.Webview) {
        switch (message.command) {
            case 'startIndexing':
                try {
                    await this.indexingService.startIndexing();
                    webview.postMessage({ command: 'indexingComplete' });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    vscode.window.showErrorMessage(errorMessage);
                    webview.postMessage({ command: 'error', message: errorMessage });
                }
                break;

            case 'getSomeData':
                // const data = await this.someOtherService.getData();
                // webview.postMessage({ command: 'dataResponse', payload: data });
                break;

            default:
                console.warn(`Unknown command received: ${message.command}`);
        }
    }
}
```

#### 4. Integrate `MessageRouter` into `WebviewManager`

Finally, simplify the `WebviewManager` by delegating all message handling to the `MessageRouter`. The `onDidReceiveMessage` listener should become a single, clean line.

**File**: `src/webviewManager.ts`
```typescript
// ... imports
import { MessageRouter } from './messageRouter';

export class WebviewManager {
    private _messageRouter: MessageRouter;

    constructor(context: vscode.ExtensionContext, messageRouter: MessageRouter) {
        // ...
        this._messageRouter = messageRouter;
    }

    private _createWebviewPanel(...) {
        const panel = vscode.window.createWebviewPanel(...);

        // ...

        // All messages are now handled by the router
        panel.webview.onDidReceiveMessage(message => {
            this._messageRouter.handleMessage(message, panel.webview);
        });

        return panel;
    }
}
```

This architecture decouples state, communication, and UI logic, making the extension significantly more robust and maintainable.
