# Task List: Sub-Sprint 2 - Native Settings, Hotkeys & State Management

**Goal:** To improve UX by adding keyboard shortcuts, using the native VS Code settings UI, and implementing a robust state manager.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Define Keybinding Contribution Point:** In `package.json`, add the `contributes.keybindings` section. | `package.json` |
| **2.2** | ☐ To Do | **Add `openMainPanel` Keybinding:** Within `contributes.keybindings`, define a keybinding for the `code-context-engine.openMainPanel` command (e.g., `cmd+alt+c`). | `package.json` |
| **2.3** | ☐ To Do | **Add `startIndexing` Keybinding:** Define a second keybinding for the `code-context-engine.startIndexing` command (e.g., `cmd+alt+i`). | `package.json` |
| **2.4** | ☐ To Do | **Refactor `handleOpenSettings` Command:** In `src/commandManager.ts`, locate the `handleOpenSettings` method (or the command registration for it). | `src/commandManager.ts` |
| **2.5** | ☐ To Do | **Implement Native Settings UI Call:** Change the body of the `handleOpenSettings` handler to `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine')`. | `src/commandManager.ts` |
| **2.6** | ☐ To Do | **Create `StateManager.ts` File:** Create a new file `src/stateManager.ts` and define the `StateManager` class. | `src/stateManager.ts` (New) |
| **2.7** | ☐ To Do | **Implement `isIndexing` State:** Inside `StateManager`, add a private boolean property `isIndexing` and public methods `getState()` and `setIndexing(boolean)`. | `src/stateManager.ts` |
| **2.8** | ☐ To Do | **Instantiate `StateManager` in `ExtensionManager`:** In `src/extensionManager.ts`, import and create a single instance of `StateManager`. | `src/extensionManager.ts` |
| **2.9** | ☐ To Do | **Inject `StateManager` into Services:** Pass the `StateManager` instance to the constructors of `IndexingService` and `MessageRouter`. | `src/extensionManager.ts`, `src/indexing/indexingService.ts`, `src/messageRouter.ts` |
| **2.10** | ☐ To Do | **Set Indexing State in `IndexingService`:** In `startIndexing`, call `this.stateManager.setIndexing(true)` at the beginning of the method and `this.stateManager.setIndexing(false)` in a `finally` block. | `src/indexing/indexingService.ts` |
| **2.11** | ☐ To Do | **Add Guard Clause in `MessageRouter`:** In the `handleMessage` case for `startIndexing`, add a guard clause: `if (this.stateManager.getState().isIndexing) { return; }`. | `src/messageRouter.ts` |
| **2.12** | ☐ To Do | **Test: Hotkeys and Concurrent Indexing:** Launch the extension. Verify the new hotkeys work. Trigger indexing and immediately try to trigger it again; verify the second attempt is blocked. | `(Manual Test)` |
