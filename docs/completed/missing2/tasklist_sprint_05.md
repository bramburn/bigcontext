# Task List: Sprint 5 - State Management & Hotkeys

**Goal:** To make the extension more robust by implementing a central state manager and to improve UX by adding keyboard shortcuts.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **5.1** | ☐ To Do | **Create `StateManager.ts` File:** Create a new file at `src/stateManager.ts`. | `src/stateManager.ts` |
| **5.2** | ☐ To Do | **Implement `StateManager` Class:** In the new file, define the `StateManager` class. Add a private boolean property `_isIndexing` and a public getter `isIndexing`. Add a public method `setIndexing(status: boolean)` to modify the state. | `src/stateManager.ts` |
| **5.3** | ☐ To Do | **Instantiate `StateManager`:** In `src/extensionManager.ts`, import the `StateManager` class. In the constructor, create a single instance: `this.stateManager = new StateManager();`. | `src/extensionManager.ts` |
| **5.4** | ☐ To Do | **Inject `StateManager` into `IndexingService`:** Modify the `IndexingService` constructor to accept a `StateManager` instance. Pass `this.stateManager` when creating the `IndexingService` in `ExtensionManager`. | `src/indexing/indexingService.ts`, `src/extensionManager.ts` |
| **5.5** | ☐ To Do | **Inject `StateManager` into `MessageRouter`:** Modify the `MessageRouter` constructor to accept a `StateManager` instance. Pass `this.stateManager` when creating the `MessageRouter` in `ExtensionManager`. | `src/messageRouter.ts`, `src/extensionManager.ts` |
| **5.6** | ☐ To Do | **Update `IndexingService` State:** In `indexingService.ts`, wrap the logic inside the `startIndexing` method in a `try...finally` block. | `src/indexing/indexingService.ts` |
| **5.7** | ☐ To Do | **Set State Before Indexing:** At the beginning of the `try` block in `startIndexing`, call `this.stateManager.setIndexing(true);`. | `src/indexing/indexingService.ts` |
| **5.8** | ☐ To Do | **Reset State After Indexing:** In the `finally` block, call `this.stateManager.setIndexing(false);` to ensure the state is always reset, even if an error occurs. | `src/indexing/indexingService.ts` |
| **5.9** | ☐ To Do | **Add Guard Clause to `MessageRouter`:** In `messageRouter.ts`, at the beginning of the `case 'startIndexing'` handler, add an `if` statement to check `this.stateManager.isIndexing`. | `src/messageRouter.ts` |
| **5.10**| ☐ To Do | **Block Concurrent Indexing:** If `isIndexing` is true, post an error message back to the webview and `return` immediately to stop further execution. | `src/messageRouter.ts` |
| **5.11**| ☐ To Do | **Verify Keybindings in `package.json`:** Open `package.json` and locate the `contributes.keybindings` section. Verify that shortcuts for `openMainPanel` and `startIndexing` exist and are correct. This task is a verification, not an addition. | `package.json` |
| **5.12**| ☐ To Do | **Document Shortcuts:** Open `README.md` and add a "Keyboard Shortcuts" section, documenting the default hotkeys for users. | `README.md` |
| **5.13**| ☐ To Do | **Test Concurrent Indexing:** Launch the extension. Start an indexing process on a large folder. While it is running, immediately try to trigger the `Start Indexing` command again. | `(Manual Test)` |
| **5.14**| ☐ To Do | **Verify Concurrent Indexing Block:** Confirm that the second indexing process does not start and that an error message (e.g., "An indexing process is already running.") is displayed in the webview. | `(Manual Test)` |
| **5.15**| ☐ To Do | **Test Hotkeys:** With the extension running, press the key combination for `openMainPanel` (e.g., `Cmd+Alt+C`) and verify the panel opens. Press the combination for `startIndexing` and verify the process starts. | `(Manual Test)` |
