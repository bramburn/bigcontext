# Task List: Sprint 04 - Communication & State Management

**Goal:** To formalize the webview communication layer with a `MessageRouter` and centralize global application state with a `StateManager`, completing the major architectural refactoring.

**Methodology:** This sprint finalizes the separation of concerns. The `StateManager` introduces a predictable state container, while the `MessageRouter` decouples message handling from the UI lifecycle.

---

### **Part 1: State Management**

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `StateManager.ts` File:** Create the new file and a `StateManager` class. Add a private boolean `_isIndexing` property with a default of `false`. | `src/stateManager.ts` (New) |
| **4.2** | ☐ To Do | **Add State Getters/Setters:** In `StateManager`, create a public getter `isIndexing()` and a public setter `setIndexing(state: boolean)`. | `src/stateManager.ts` |
| **4.3** | ☐ To Do | **Instantiate `StateManager`:** In `ExtensionManager`, create and expose a public, readonly instance of the `StateManager`. | `src/extensionManager.ts` |
| **4.4** | ☐ To Do | **Inject `StateManager` into `IndexingService`:** Update the `IndexingService` constructor to accept the `StateManager`. Update its instantiation in `ExtensionManager` to pass the manager instance. | `src/indexing/indexingService.ts`, `src/extensionManager.ts` |
| **4.5** | ☐ To Do | **Update `IndexingService` Logic:** In `IndexingService`, call `this.stateManager.setIndexing(true)` at the very beginning of the `startIndexing` method and `this.stateManager.setIndexing(false)` inside a `finally` block to ensure it's always reset. | `src/indexing/indexingService.ts` |

---

### **Part 2: Message Routing**

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.6** | ☐ To Do | **Create `MessageRouter.ts` File:** Create the new file and a `MessageRouter` class. The constructor should accept the `ExtensionManager` and the `vscode.Webview` instance. | `src/messageRouter.ts` (New) |
| **4.7** | ☐ To Do | **Implement Message Listener:** In the `MessageRouter` constructor, subscribe to the `webview.onDidReceiveMessage` event and bind it to a private `_routeMessage` method. | `src/messageRouter.ts` |
| **4.8** | ☐ To Do | **Move Message `switch` Statement:** Move the entire `switch` statement for message handling from `extension.ts` into the `_routeMessage` method. | `src/messageRouter.ts`, `src/extension.ts` |
| **4.9** | ☐ To Do | **Integrate `MessageRouter` into `WebviewManager`:** In the `WebviewManager` constructor, remove the old `onDidReceiveMessage` logic and replace it with `new MessageRouter(this.extensionManager, this.mainPanel.webview)`. | `src/webviewManager.ts` |
| **4.10**| ☐ To Do | **Integrate State Check:** In the `MessageRouter`'s `_routeMessage` method, add a guard clause at the top of the `startIndexing` case: `if (this.extensionManager.stateManager.isIndexing()) { ... post error message ...; return; }`. | `src/messageRouter.ts` |
| **4.11**| ☐ To Do | **Verify Full Functionality:** Test all webview interactions. Specifically, start an indexing job and immediately try to start another. Verify the second attempt is gracefully rejected with an error message in the UI. | `(Manual Test)` |
