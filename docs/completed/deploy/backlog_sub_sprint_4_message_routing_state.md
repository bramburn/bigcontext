**Objective:**
To create the `MessageRouter` and `StateManager` classes to formalize the communication layer and centralize the extension's global state.

**Parent Sprint:**
PRD 2, Sprint 4: Communication & State Mgmt

**Tasks:**

1.  **Create `StateManager.ts`:** Develop a simple class with private properties (e.g., `_isIndexing = false`) and public getter/setter methods.
2.  **Create `MessageRouter.ts`:** Develop the class with a constructor that accepts the `ExtensionManager` (to access all services and managers) and the `vscode.Webview`. The constructor will set up the `onDidReceiveMessage` listener.
3.  **Implement `routeMessage` method:** Move the message-handling `switch` statement from `extension.ts` into this private method within the `MessageRouter`.
4.  **Integrate `StateManager`:** In the `MessageRouter`, check the state before delegating actions. For example: `if (this.stateManager.isIndexing) { /* return error */ }`.
5.  **Update Services:** Modify services like `IndexingService` to update the central state (e.g., `this.stateManager.setIndexing(true)` at the start and `false` at the end).
6.  **Integrate `MessageRouter`:** In `WebviewManager`, when a panel is created, instantiate a `MessageRouter` for it, passing in the necessary dependencies.

**Acceptance Criteria:**

  * The `onDidReceiveMessage` listener in `WebviewManager` is a single line that instantiates and uses the `MessageRouter`.
  * The `MessageRouter` correctly routes commands to the appropriate services.
  * Attempting to start a new indexing job while one is already running is gracefully rejected with an error message sent back to the UI.

**Dependencies:**

  * Sub-Sprint 3 must be complete.

**Timeline:**

  * **Start Date:** 2025-10-06
  * **End Date:** 2025-10-17
