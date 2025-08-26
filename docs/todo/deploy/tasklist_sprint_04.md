# Task List: Sprint 4 - Communication & State Mgmt

**Goal:** To formalize the webview communication layer with a `MessageRouter` and centralize global state with a `StateManager`.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `StateManager.ts` file:** In the `src/` directory, create a new file named `stateManager.ts`. | `src/stateManager.ts` (New) |
| **4.2** | ☐ To Do | **Implement `StateManager` Class:** In `src/stateManager.ts`, define and export a simple `StateManager` class. Add a private boolean property `private _isIndexing = false;` and corresponding public getter `public isIndexing(): boolean` and setter `public setIndexing(state: boolean)`. | `src/stateManager.ts` |
| **4.3** | ☐ To Do | **Create `MessageRouter.ts` file:** In the `src/` directory, create a new file named `messageRouter.ts`. | `src/messageRouter.ts` (New) |
| **4.4** | ☐ To Do | **Implement `MessageRouter` Class:** In `src/messageRouter.ts`, define and export the `MessageRouter` class. The constructor should accept the `ExtensionManager` and a `vscode.Webview` instance. | `src/messageRouter.ts` |
| **4.5** | ☐ To Do | **Set up Message Listener:** In the `MessageRouter` constructor, set up the message listener: `this.webview.onDidReceiveMessage(message => this.routeMessage(message));`. | `src/messageRouter.ts` |
| **4.6** | ☐ To Do | **Implement `routeMessage` Method:** Create a private `async routeMessage(message: any)` method. Move the entire message-handling `switch` statement from its current location (likely `extension.ts` or `WebviewManager`) into this new method. | `src/messageRouter.ts` |
| **4.7** | ☐ To Do | **Integrate State Check in Router:** In the `routeMessage` method, before the `case 'startIndexing':` block, add a guard clause: `if (this.extensionManager.stateManager.isIndexing()) { /* post error message back to webview */ return; }`. | `src/messageRouter.ts` |
| **4.8** | ☐ To Do | **Update `ExtensionManager.ts`:** Open `src/extensionManager.ts`. Import the `StateManager`. | `src/extensionManager.ts` |
| **4.9** | ☐ To Do | **Instantiate `StateManager`:** In the `ExtensionManager` constructor, create and store a public instance of the `StateManager`: `this.stateManager = new StateManager();`. | `src/extensionManager.ts` |
| **4.10**| ☐ To Do | **Update `IndexingService`:** Open `src/indexing/indexingService.ts`. Modify its constructor to accept the `StateManager`. | `src/indexing/indexingService.ts` |
| **4.11**| ☐ To Do | **Update Indexing State:** In the `startIndexing` method of `IndexingService`, wrap the logic in a `try...finally` block. Call `this.stateManager.setIndexing(true)` at the beginning of the `try` block and `this.stateManager.setIndexing(false)` inside the `finally` block. | `src/indexing/indexingService.ts` |
| **4.12**| ☐ To Do | **Update Service Instantiation:** In `ExtensionManager.ts`, update the line where `IndexingService` is instantiated to pass the `StateManager` instance. | `src/extensionManager.ts` |
| **4.13**| ☐ To Do | **Integrate `MessageRouter`:** Open `src/webviewManager.ts`. In the `showMainPanel` and `showSettingsPanel` methods, where the panel is created, remove the old `onDidReceiveMessage` logic. | `src/webviewManager.ts` |
| **4.14**| ☐ To Do | **Instantiate `MessageRouter`:** In its place, instantiate the new router: `new MessageRouter(this.extensionManager, newPanel.webview);`. | `src/webviewManager.ts` |