# Task List: Sprint 1 - Hotkey & Native Settings Integration

**Goal:** To add keyboard shortcuts for key actions and integrate with the native VS Code settings UI.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Add `keybindings` to `package.json`:** In the `contributes` section of `package.json`, add a new `keybindings` array. | `package.json` |
| **1.2** | ☐ To Do | **Define `openMainPanel` Keybinding:** Inside the `keybindings` array, add an object for the `openMainPanel` command with `key` properties for `win`/`linux` (`ctrl+alt+c`) and `mac` (`cmd+alt+c`). | `package.json` |
| **1.3** | ☐ To Do | **Define `startIndexing` Keybinding:** Add another object to the `keybindings` array for the `startIndexing` command with `key` properties for `win`/`linux` (`ctrl+alt+i`) and `mac` (`cmd+alt+i`). | `package.json` |
| **1.4** | ☐ To Do | **Refactor `handleOpenSettings`:** Open `src/commandManager.ts`. Change the implementation of the `handleOpenSettings` method to execute a built-in VS Code command. | `src/commandManager.ts` |
| **1.5** | ☐ To Do | **Implement Native Settings Command:** The new implementation for `handleOpenSettings` should be: `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');` (replace publisher and extension name as needed). | `src/commandManager.ts` |
| **1.6** | ☐ To Do | **Deprecate Old Webview Method:** In `src/webviewManager.ts`, add a `/** @deprecated */` JSDoc comment above the `showSettingsPanel` method to indicate it should no longer be used for primary settings. | `src/webviewManager.ts` |
| **1.7** | ☐ To Do | **Test Hotkeys:** Reload the extension and test both new keyboard shortcuts to ensure they trigger the correct actions. | `(Manual Test)` |
| **1.8** | ☐ To Do | **Test Settings Command:** Run the "Code Context Engine: Open Settings" command from the command palette and verify it opens the native settings UI, correctly filtered. | `(Manual Test)` |
