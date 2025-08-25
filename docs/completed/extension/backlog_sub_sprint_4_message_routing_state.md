### User Story 1: Create StateManager
**As Alisha, I want to** introduce a basic `StateManager` to track the global state of the extension, **so that** services don't need to communicate directly with each other for status updates.

**Actions to Undertake:**
1.  **Filepath**: `src/stateManager.ts` (New File)
    -   **Action**: Create a simple `StateManager` class with private properties (e.g., `_isIndexing = false`) and public getter/setter methods.
    -   **Implementation**:
        ```typescript
        export class StateManager {
            private _isIndexing: boolean = false;

            public isIndexing(): boolean {
                return this._isIndexing;
            }

            public setIndexing(state: boolean): void {
                this._isIndexing = state;
            }

            // Add more state properties and their getters/setters as needed
            // private _isProcessingQuery: boolean = false;
            // public isProcessingQuery(): boolean { return this._isProcessingQuery; }
            // public setProcessingQuery(state: boolean): void { this._isProcessingQuery = state; }
        }
        ```
    -   **Imports**: None.

### User Story 2: Create MessageRouter
**As a** developer, **I want to** create a `MessageRouter` to handle all incoming messages from the webview, **so that** communication logic is decoupled and clean.

**Actions to Undertake:**
1.  **Filepath**: `src/messageRouter.ts` (New File)
    -   **Action**: Develop the class with a constructor that accepts the `ExtensionManager` (to access all services and managers) and the `vscode.Webview`. The constructor will set up the `onDidReceiveMessage` listener.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { ExtensionManager } from './extensionManager';

        export class MessageRouter {
            constructor(
                private extensionManager: ExtensionManager,
                private webview: vscode.Webview
            ) {
                this.webview.onDidReceiveMessage(async message => {
                    await this.routeMessage(message);
                }, undefined, this.extensionManager.context.subscriptions);
            }

            private async routeMessage(message: any): Promise<void> {
                const { command, requestId, payload } = message;

                let result: any;
                let error: string | undefined;

                try {
                    switch (command) {
                        case 'startIndexing':
                            if (this.extensionManager.stateManager.isIndexing()) {
                                throw new Error('Indexing is already in progress.');
                            }
                            this.extensionManager.indexingService.startIndexing();
                            result = { success: true };
                            break;
                        // Add more cases for other commands
                        case 'getSettings':
                            result = this.extensionManager.configService.getSettings(); // Assuming ConfigService has a getSettings method
                            break;
                        default:
                            throw new Error(`Unknown command: ${command}`);
                    }
                } catch (e: any) {
                    error = e.message;
                }

                // Send response back to webview
                this.webview.postMessage({
                    command: `${command}Response`,
                    requestId,
                    result,
                    error
                });
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode'; import { ExtensionManager } from './extensionManager';`

### User Story 3: Integrate StateManager
**As Alisha, I want to** update services to use the `StateManager`, **so that** the `MessageRouter` can query the state to prevent conflicting actions.

**Actions to Undertake:**
1.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Instantiate the `StateManager` in `ExtensionManager` and make it accessible to other services.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        // ... other imports ...
        import { StateManager } from './stateManager';

        export class ExtensionManager implements vscode.Disposable {
            // ... existing private members ...
            public stateManager: StateManager;

            constructor(private context: vscode.ExtensionContext) {
                // ... existing instantiations ...

                // Instantiate StateManager
                this.stateManager = new StateManager();

                // Pass StateManager to services that need it
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

            // ... rest of the class ...
        }
        ```
    -   **Imports**: `import { StateManager } from './stateManager';`
2.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Inject the `StateManager` instance into the `IndexingService`. Call `this.stateManager.setIndexing(true)` at the beginning of `startIndexing` and `false` in a `finally` block at the end.
    -   **Implementation**:
        ```typescript
        import { StateManager } from '../stateManager';
        // ... other imports ...

        export class IndexingService {
            constructor(
                // ... existing dependencies ...
                private stateManager: StateManager
            ) {}

            public async startIndexing(): Promise<void> {
                this.stateManager.setIndexing(true);
                try {
                    // ... existing indexing logic ...
                    console.log('Indexing started...');
                    // Simulate async work
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    console.log('Indexing complete.');
                } finally {
                    this.stateManager.setIndexing(false);
                }
            }
        }
        ```
    -   **Imports**: `import { StateManager } from '../stateManager';`
3.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: In `WebviewManager`, when a panel is created, remove the old `onDidReceiveMessage` logic and replace it with `new MessageRouter(this.extensionManager, this.mainPanel.webview)`.
    -   **Implementation**:
        ```typescript
        import { MessageRouter } from './messageRouter';
        // ... other imports ...

        export class WebviewManager implements vscode.Disposable {
            // ... existing properties ...

            constructor(private context: vscode.ExtensionContext, private extensionManager: ExtensionManager) {}

            public showMainPanel(): void {
                // ... existing panel creation logic ...

                // Replace old onDidReceiveMessage with MessageRouter
                new MessageRouter(this.extensionManager, this.mainPanel.webview);

                // ... existing onDidDispose ...
            }

            public showSettingsPanel(): void {
                // ... existing panel creation logic ...

                // Replace old onDidReceiveMessage with MessageRouter
                new MessageRouter(this.extensionManager, this.settingsPanel.webview);

                // ... existing onDidDispose ...
            }

            // ... dispose method ...
        }
        ```
    -   **Imports**: `import { MessageRouter } from './messageRouter';`

**Acceptance Criteria:**
- The `onDidReceiveMessage` listener in `WebviewManager` is a single line that instantiates and uses the `MessageRouter`.
- The `MessageRouter` correctly routes commands to the appropriate services.
- Attempting to start a new indexing job while one is already running is gracefully rejected with an error message sent back to the UI.

**Testing Plan:**
- **Test Case 1**: Open the main webview panel. Send a `startIndexing` message from the webview. Verify that indexing starts and the `isIndexing` state is set to `true`.
- **Test Case 2**: While indexing is in progress (from Test Case 1), send another `startIndexing` message. Verify that the `MessageRouter` rejects the command and sends an error message back to the webview.
- **Test Case 3**: After indexing completes, send another `startIndexing` message. Verify that it starts successfully.
- **Test Case 4**: Implement a simple message from the webview (e.g., `getSettings`) and verify that the `MessageRouter` correctly routes it to the `ConfigService` and sends a response back.
- **Test Case 5**: Verify that the `extension.ts` file remains clean and its line count is minimal.
