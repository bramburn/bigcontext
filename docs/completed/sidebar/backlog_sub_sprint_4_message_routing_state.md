### Objective
To create a `MessageRouter` and a `StateManager` to formalize the webview communication layer and centralize the extension's global state, preventing conflicting operations.

**Parent Sprint:** PRD 2, Sprint 4: Communication & State Mgmt

### User Story 1: Centralized State
**As a** developer (Alisha), **I want to** introduce a `StateManager` to track the global state of the extension, **so that** services don't need to communicate directly with each other for status updates and can prevent conflicting actions.

**Actions to Undertake:**
1.  **Filepath**: `src/stateManager.ts` (New File)
    -   **Action**: Create a `StateManager` class to hold simple boolean flags and state information.
    -   **Implementation**: The class should include private properties like `_isIndexing` and public getter/setter methods like `isIndexing()` and `setIndexing(state: boolean)`.
    -   **Imports**: N/A.
2.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Instantiate the `StateManager` in the `ExtensionManager` so it can be passed as a dependency to other services.
    -   **Implementation**: `this.stateManager = new StateManager();`
    -   **Imports**: `import { StateManager } from './stateManager';`
3.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Inject the `StateManager` into services that perform long-running or state-sensitive tasks.
    -   **Implementation**: Update the `IndexingService` constructor to accept the `StateManager`. Before starting the indexing logic, check `if (this.stateManager.isIndexing()) { ... }`. Use a `try...finally` block to ensure `this.stateManager.setIndexing(false)` is always called.
    -   **Imports**: `import { StateManager } from '../stateManager';`

### User Story 2: Decoupled Communication
**As a** developer, **I want to** create a `MessageRouter` to handle all incoming messages from the webview, **so that** communication logic is decoupled from the `WebviewManager` and is clean and maintainable.

**Actions to Undertake:**
1.  **Filepath**: `src/messageRouter.ts` (New File)
    -   **Action**: Create a `MessageRouter` class. Its constructor should accept the necessary services (like `IndexingService`, `ContextService`, etc.) that it will delegate to.
    -   **Implementation**: `constructor(contextService: ContextService, indexingService: IndexingService) { ... }`
    -   **Imports**: `import { ContextService } from './context/contextService';`, `import { IndexingService } from './indexing/indexingService';`
2.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Implement a public `handleMessage` method that contains the main `switch` statement for routing commands.
    -   **Implementation**: `async handleMessage(message: any, webview: vscode.Webview) { switch (message.command) { ... } }`
    -   **Imports**: `import * as vscode from 'vscode';`
3.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: In the `handleMessage` method, integrate the `StateManager` to prevent conflicting actions. For example, for the `startIndexing` command, check the state before calling the service.
    -   **Implementation**: `case 'startIndexing': if (this.stateManager.isIndexing()) { /* post error */ return; } await this.indexingService.startIndexing(...); break;`
    -   **Imports**: N/A.
4.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: In `WebviewManager`, when a panel is created, its `onDidReceiveMessage` listener should be a single line that instantiates or calls the `MessageRouter`.
    -   **Implementation**: `panel.webview.onDidReceiveMessage(message => { this.messageRouter.handleMessage(message, panel.webview); });`
    -   **Imports**: `import { MessageRouter } from './messageRouter';`

**Acceptance Criteria:**
-   The `onDidReceiveMessage` listener in `WebviewManager` is a simple delegation to the `MessageRouter`.
-   The `MessageRouter` correctly routes commands to the appropriate services based on the message command.
-   Attempting to start a new indexing job while one is already running is gracefully rejected with an error message sent back to the UI.
-   The `StateManager` accurately tracks the `isIndexing` state.

**Dependencies:**
-   Sub-Sprint 3 (Centralized Webview Management) must be complete.
