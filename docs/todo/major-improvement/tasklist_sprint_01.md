# Task List: Sprint 1 - Status Bar & Guided Tour

**Goal:** To implement the status bar indicator and the first-run guided tour.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Create `StatusBarManager.ts`:** Create the new file and a `StatusBarManager` class. Implement a method to create and initialize the `vscode.StatusBarItem`. | `src/statusBarManager.ts` (New) |
| **1.2** | ☐ To Do | **Implement `updateStatus` method:** In `StatusBarManager`, create a method that takes the extension state and updates the `text`, `tooltip`, and `command` of the status bar item. | `src/statusBarManager.ts` |
| **1.3** | ☐ To Do | **Instantiate `StatusBarManager`:** In `ExtensionManager`, instantiate `StatusBarManager` and link it to the `StateManager` to receive state updates. | `src/extensionManager.ts` |
| **1.4** | ☐ To Do | **Create `GuidedTour.svelte`:** Build the Svelte component with slots for content and logic to control visibility and steps. | `webview/src/lib/components/GuidedTour.svelte` (New) |
| **1.5** | ☐ To Do | **Implement First-Run Check:** In the main Svelte view, use `vscodeApi` to check a global state flag on mount to determine if the tour should ever be shown. | `webview/src/routes/+page.svelte` |
| **1.6** | ☐ To Do | **Trigger Tour on Index Completion:** When the `indexingCompleted` message is received, and the first-run flag is not set, activate the guided tour. | `webview/src/lib/components/IndexingView.svelte` |
| **1.7** | ☐ To Do | **Persist Tour Dismissal:** Add a handler for a message from the webview to set the `hasCompletedFirstRun` flag to true in the global state. | `src/messageRouter.ts` |
