### User Story: Message Routing & State Management

**As a** developer,
**I want to** create a `MessageRouter` and a `StateManager` classes to formalize the communication layer and centralize the extension's global state,
**so that** message handling is decoupled, state is consistently managed, and conflicting actions are prevented.

**Objective:** To create the `MessageRouter` and `StateManager` classes to formalize the communication layer and centralize the extension's global state.

**Workflow:**
1.  Create a `StateManager` to hold and manage global extension state (e.g., `isIndexing`).
2.  Create a `MessageRouter` to handle all incoming messages from webviews, delegating to appropriate services.
3.  Integrate `StateManager` into `MessageRouter` to enable state-based conditional logic.
4.  Refactor `WebviewManager` to instantiate and use `MessageRouter` for message handling.
5.  Ensure `IndexingService` updates the `StateManager` during indexing operations.

**List of Files to be Created/Modified:**
-   `src/stateManager.ts` (New)
-   `src/messageRouter.ts` (New)
-   `src/webviewManager.ts` (Modify)
-   `src/indexing/indexingService.ts` (Verify/Modify)
-   `src/extensionManager.ts` (Verify/Modify)

**Actions to Undertake:**

1.  **Filepath**: `src/stateManager.ts` (New File)
    -   **Action**: Create a simple `StateManager` class. Add a private boolean property `_isIndexing` initialized to `false`. Implement public getter `isIndexing(): boolean` and setter `setIndexing(state: boolean): void` methods.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None.

2.  **Filepath**: `src/messageRouter.ts` (New File)
    -   **Action**: Create the `MessageRouter` class. Its constructor will accept `extensionManager: ExtensionManager` and `webview: vscode.Webview`. The constructor will set up the `webview.onDidReceiveMessage` listener to call a private `routeMessage` method.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: `import * as vscode from 'vscode'; import { ExtensionManager } from './extensionManager';`

3.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Implement the private `async routeMessage(message: any): Promise<void>` method. This method will contain the `switch` statement (or similar logic) to handle different message types (e.g., 'startIndexing', 'searchCode'). It will delegate calls to the appropriate services obtained from `this.extensionManager`.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None.

4.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Integrate `StateManager` into `routeMessage`. Before handling commands that modify state (like 'startIndexing'), check `this.extensionManager.getStateManager().isIndexing()`. If `true`, send an error message back to the webview (e.g., `{ command: message.command, error: 'Indexing already in progress' }`).
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None.

5.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Verify that the `startIndexing` method already uses `this.stateManager.setIndexing(true)` at the beginning and `this.stateManager.setIndexing(false)` in a `finally` block. (This was confirmed in previous analysis).
    -   **Implementation**: No new implementation; verification of existing code.
    -   **Imports**: None.

6.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: In the `createPanel` method, modify the `panel.webview.onDidReceiveMessage` setup. Instead of `message => this.handleMessage(config.id, message)`, instantiate `MessageRouter` and pass the message to it: `new MessageRouter(this.extensionManager, panel.webview).routeMessage(message)`. This implies `WebviewManager` will need `ExtensionManager` injected.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: `import { MessageRouter } from './messageRouter'; import { ExtensionManager } from './extensionManager';`

7.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Verify that `StateManager` is instantiated in `ExtensionManager.initialize()` and is accessible publicly via `getStateManager()`.
    -   **Implementation**: No new implementation; verification of existing code.
    -   **Imports**: None.

8.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Modify `ExtensionManager` constructor to accept `context: vscode.ExtensionContext` and pass it to `WebviewManager`.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None.

**Acceptance Criteria:**
-   The `onDidReceiveMessage` listener in `WebviewManager` is a single line that instantiates and uses the `MessageRouter`.
-   The `MessageRouter` correctly routes commands to the appropriate services.
-   Attempting to start a new indexing job while one is already running is gracefully rejected with an error message sent back to the UI.
-   `StateManager` accurately reflects the `isIndexing` status.

**Testing Plan:**
-   **Test Case 1**: Send a message from the webview to trigger an action (e.g., start indexing) and verify `MessageRouter` correctly routes it.
-   **Test Case 2**: Attempt to start indexing while it's already in progress and verify an error message is returned to the UI.
-   **Test Case 3**: Verify `StateManager.isIndexing()` accurately reflects the indexing status during and after an indexing operation.
-   **Test Case 4**: Send various types of messages from the webview and verify `MessageRouter` handles them gracefully (even if no specific handler is defined).
