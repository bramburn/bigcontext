# Task List: Sprint 2 - Repurpose Settings Page to Diagnostics View

**Goal:** To refactor the Svelte settings webview into a dedicated "Status & Diagnostics" panel.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Add `openDiagnostics` Command:** In `package.json`, add a new command definition for `code-context-engine.openDiagnostics` with the title "Code Context Engine: Open Diagnostics". | `package.json` |
| **2.2** | ☐ To Do | **Register `openDiagnostics` Command:** In `src/commandManager.ts`, register the new command. The handler should call a new method on the `WebviewManager`, e.g., `this.webviewManager.showDiagnosticsPanel()`. | `src/commandManager.ts` |
| **2.3** | ☐ To Do | **Implement `showDiagnosticsPanel`:** In `src/webviewManager.ts`, create the new method `showDiagnosticsPanel`. It should manage a new panel instance (`diagnosticsPanel`) using the same singleton pattern as `showMainPanel`. | `src/webviewManager.ts` |
| **2.4** | ☐ To Do | **Rename Svelte Component:** Rename the Svelte settings component file to `DiagnosticsView.svelte`. Update any import paths that reference it. | `webview/src/lib/views/SettingsView.svelte` -> `DiagnosticsView.svelte` |
| **2.5** | ☐ To Do | **Remove Configuration Inputs:** In `DiagnosticsView.svelte`, delete all `<select>` and `<input>` elements used for setting configuration values. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.6** | ☐ To Do | **Display Read-Only Settings:** Add logic to fetch the current settings on mount and display them as plain text (e.g., `<div>Provider: {$settings.embeddingProvider}</div>`). | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.7** | ☐ To Do | **Add "Edit Settings" Button:** Add a new Fluent UI button to `DiagnosticsView.svelte` labeled "Edit Configuration". | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.8** | ☐ To Do | **Implement "Edit Settings" Action:** The new button's `on:click` handler should send a `openSettings` message to the extension. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.9** | ☐ To Do | **Handle `openSettings` Message:** In `src/messageRouter.ts`, add a case for `openSettings` that calls `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');`. | `src/messageRouter.ts` |
| **2.10** | ☐ To Do | **Verify Action Buttons:** Ensure the "Test Connection" buttons remain in `DiagnosticsView.svelte` and their message-passing logic is still functional. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.11** | ☐ To Do | **Test Full Flow:** Manually test opening the new Diagnostics panel, verifying settings are read-only, and confirming the "Edit Configuration" button opens the correct native UI. | `(Manual Test)` |
