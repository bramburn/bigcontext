# Task List: Sprint 2 - Sidebar View Integration

**Goal:** To add a persistent icon to the VS Code Activity Bar that opens the extension's UI in the sidebar.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create Icon:** Create an SVG icon for the extension (e.g., `media/icon.svg`). The icon should be monochrome (white) to adapt to VS Code themes. | `media/icon.svg` (New) |
| **2.2** | ☐ To Do | **Add `viewsContainers`:** In `package.json`, add the `contributes.viewsContainers` section to define a new container in the `activitybar`. | `package.json` |
| **2.3** | ☐ To Do | **Add `views`:** In `package.json`, add the `contributes.views` section to associate a new `webviewView` with the container created in the previous step. | `package.json` |
| **2.4** | ☐ To Do | **Implement `WebviewViewProvider`:** In `webviewManager.ts`, implement the `vscode.WebviewViewProvider` interface. | `src/webviewManager.ts` |
| **2.5** | ☐ To Do | **Implement `resolveWebviewView`:** The required method for the provider. This method will be responsible for setting the webview's HTML content by calling your existing `getWebviewContent` helper. | `src/webviewManager.ts` |
| **2.6** | ☐ To Do | **Register the Provider:** In `extension.ts` (or `ExtensionManager`), use `vscode.window.registerWebviewViewProvider` to register your `WebviewManager` as the provider for the new view. | `src/extension.ts` |
| **2.7** | ☐ To Do | **Adapt UI for Sidebar:** Review and adjust the CSS of the SvelteKit components to ensure they are responsive and look good in a narrow sidebar view. | `webview/src/lib/components/*.svelte` |
