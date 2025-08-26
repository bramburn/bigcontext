# Task List: Sub-Sprint 3 - Diagnostics View Refactoring

**Goal:** To refactor the Svelte settings webview into a dedicated "Status & Diagnostics" panel.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Add `openDiagnostics` Command Definition:** In `package.json`, add a new command to the `contributes.commands` array: `code-context-engine.openDiagnostics`. | `package.json` |
| **3.2** | ☐ To Do | **Register `openDiagnostics` Command Handler:** In `src/commandManager.ts`, register the new command and point it to a new handler, `handleOpenDiagnostics`. | `src/commandManager.ts` |
| **3.3** | ☐ To Do | **Implement `handleOpenDiagnostics`:** The new handler in `CommandManager` should simply call `this.webviewManager.showDiagnosticsPanel()`. | `src/commandManager.ts` |
| **3.4** | ☐ To Do | **Implement `showDiagnosticsPanel` Method:** In `src/webviewManager.ts`, create the new method `showDiagnosticsPanel`. It should manage a new `diagnosticsPanel` instance using the same singleton pattern as `showMainPanel`. | `src/webviewManager.ts` |
| **3.5** | ☐ To Do | **Rename Svelte Component File:** In the `webview` project, rename the Svelte settings component file to `DiagnosticsView.svelte`. Update any import paths that reference it. | `webview/src/lib/views/SettingsView.svelte` -> `DiagnosticsView.svelte` |
| **3.6** | ☐ To Do | **Remove Configuration Inputs from Component:** In `DiagnosticsView.svelte`, delete all `<select>` and `<input>` elements used for setting configuration values. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **3.7** | ☐ To Do | **Display Read-Only Settings:** Add logic to the component to fetch the current settings on mount (e.g., from the `setupStore`) and display them as plain text. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **3.8** | ☐ To Do | **Add "Edit Configuration" Button:** Add a new Fluent UI button to `DiagnosticsView.svelte` labeled "Edit Configuration". | `webview/src/lib/views/DiagnosticsView.svelte` |
| **3.9** | ☐ To Do | **Implement `openSettings` Message:** The new button's `on:click` handler should call `vscode.postMessage({ command: 'openSettings' })`. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **3.10** | ☐ To Do | **Handle `openSettings` Message in `MessageRouter`:** In `src/messageRouter.ts`, add a new `case` for `openSettings` that calls `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');`. | `src/messageRouter.ts` |
| **3.11** | ☐ To Do | **Verify Action Buttons Remain:** Ensure the "Test Connection" buttons are still present in `DiagnosticsView.svelte` and their message-passing logic is still functional. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **3.12** | ☐ To Do | **Test Full Flow:** Manually test opening the new Diagnostics panel via the command palette. Verify settings are read-only. Confirm the "Edit Configuration" button opens the native VS Code settings UI. | `(Manual Test)` |
