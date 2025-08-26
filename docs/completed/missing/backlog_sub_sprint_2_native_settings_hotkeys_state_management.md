# Task List: Sprint 2 - Native Settings & Hotkeys

**Goal:** To improve UX by adding keyboard shortcuts, using the native VS Code settings UI, and implementing a robust state manager.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Add `keybindings` to `package.json`:** Add a `contributes.keybindings` section and define shortcuts for `openMainPanel` and `startIndexing`. | `package.json` |
| **2.2** | ☐ To Do | **Refactor `handleOpenSettings` Command:** In `src/commandManager.ts`, change the handler to call `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine')`. | `src/commandManager.ts` |
| **2.3** | ☐ To Do | **Create `openDiagnostics` Command:** Add a new command `code-context-engine.openDiagnostics` in `package.json` and `commandManager.ts`. | `package.json`, `src/commandManager.ts` |
| **2.4** | ☐ To Do | **Create `showDiagnosticsPanel` Method:** In `src/webviewManager.ts`, add a method to show a panel that will render the diagnostics view. | `src/webviewManager.ts` |
| **2.5** | ☐ To Do | **Create `DiagnosticsView.svelte`:** Repurpose the old Svelte settings page. Remove configuration inputs and add a button that calls the `openSettings` command. | `webview/src/lib/views/DiagnosticsView.svelte` (New) |
| **2.6** | ☐ To Do | **Create `StateManager.ts`:** Create the new file and implement the `StateManager` class with an `isIndexing` flag. | `src/stateManager.ts` (New) |
| **2.7** | ☐ To Do | **Integrate `StateManager`:** Instantiate the manager in `ExtensionManager` and inject it into `IndexingService` and `MessageRouter`. | `src/extensionManager.ts`, `src/indexing/indexingService.ts`, `src/messageRouter.ts` |
| **2.8** | ☐ To Do | **Add Guard Clause:** In `MessageRouter`, add a check for `stateManager.isIndexing()` before starting a new indexing job. | `src/messageRouter.ts` |
