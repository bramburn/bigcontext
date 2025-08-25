# Backlog: Sub-Sprint 4 - Message Routing & State

**Objective:** To create the `MessageRouter` and `StateManager` classes to formalize the communication layer and centralize the extension's global state.

**Parent Sprint:** PRD 2, Sprint 4: Communication & State Mgmt

---

### User Story 1: Centralize Global State
**As a** Developer (Alisha), **I want to** create a `StateManager` class, **so that** I have a single, reliable source of truth for the global state of the extension (e.g., whether indexing is in progress).

**Actions to Undertake:**
1.  **Filepath**: `src/stateManager.ts` (New File)
    -   **Action**: **Create StateManager Class**: Define a new `StateManager` class. It should contain private properties for state flags (e.g., `private _isIndexing = false;`).
    -   **Implementation**: See implementation guide.
    -   **Imports**: N/A.
2.  **Filepath**: `src/stateManager.ts`
    -   **Action**: **Implement Getters and Setters**: For each state property, create public getter (e.g., `public isIndexing()`) and setter (e.g., `public setIndexing(state: boolean)`) methods.
    -   **Implementation**: `public isIndexing() { return this._isIndexing; }`
    -   **Imports**: N/A.
3.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: **Instantiate StateManager**: In the `ExtensionManager` constructor, create a public instance of the `StateManager` so it can be injected into other services.
    -   **Implementation**: `this.stateManager = new StateManager();`
    -   **Imports**: `import { StateManager } from './stateManager';`

**Acceptance Criteria:**
-   A new `StateManager.ts` file exists with a class that encapsulates state properties.
-   The `ExtensionManager` creates and holds a single instance of the `StateManager`.
-   Other services can access state via the manager (e.g., `this.extensionManager.stateManager.isIndexing()`).

**Testing Plan:**
-   **Test Case 1**: Verify that services requiring state can be instantiated correctly with the `StateManager` passed into their constructors.

---

### User Story 2: Decouple Message Handling
**As a** Developer, **I want to** create a `MessageRouter` class to handle all incoming messages from the webview, **so that** communication logic is cleanly separated from webview lifecycle management.

**Actions to Undertake:**
1.  **Filepath**: `src/messageRouter.ts` (New File)
    -   **Action**: **Create MessageRouter Class**: Define a new `MessageRouter` class. Its constructor should accept the `ExtensionManager` and the `vscode.Webview` instance.
    -   **Implementation**: See implementation guide.
    -   **Imports**: `import * as vscode from 'vscode';`, `import { ExtensionManager } from './extensionManager';`
2.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: **Implement Message Listener**: In the constructor, set up the `webview.onDidReceiveMessage` listener to call a private `_routeMessage` method.
    -   **Implementation**: `this._webview.onDidReceiveMessage(this._routeMessage, this, this._disposables);`
    -   **Imports**: N/A.
3.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: **Implement `_routeMessage` Method**: Move the large `switch` statement for handling messages from its current location (`extension.ts` or `webviewManager.ts`) into the `_routeMessage` method.
    -   **Implementation**: `private async _routeMessage(message: any) { switch (message.command) { ... } }`
    -   **Imports**: N/A.
4.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: **Integrate MessageRouter**: In the `WebviewManager` constructor, instead of handling messages directly, instantiate the new `MessageRouter`.
    -   **Implementation**: `new MessageRouter(this._extensionManager, this._panel.webview);`
    -   **Imports**: `import { MessageRouter } from './messageRouter';`
5.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: **Update Service to Use StateManager**: Inject the `StateManager` into the `IndexingService`. Call `this.stateManager.setIndexing(true)` at the beginning of the `startIndexing` method and `this.stateManager.setIndexing(false)` in a `finally` block to ensure it is always reset.
    -   **Implementation**: `startIndexing() { this.stateManager.setIndexing(true); try { ... } finally { this.stateManager.setIndexing(false); } }`
    -   **Imports**: `import { StateManager } from '../stateManager';`

**Acceptance Criteria:**
-   The `onDidReceiveMessage` listener in `WebviewManager` is now a single line that instantiates the `MessageRouter`.
-   The `MessageRouter` correctly routes commands from the webview to the appropriate services.
-   The `IndexingService` correctly updates the `StateManager` before and after indexing.
-   Attempting to start a new indexing job while one is already running is gracefully handled by checking the state in the `MessageRouter`, and an appropriate error is sent to the UI.

**Testing Plan:**
-   **Test Case 1**: Verify that all previous UI interactions (e.g., starting a search) still work correctly, confirming the router is delegating properly.
-   **Test Case 2**: Start an indexing process. While it is running, try to start it again. Verify that the second request is rejected and a message is sent to the webview indicating that indexing is already in progress.
