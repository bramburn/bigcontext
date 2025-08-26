# Task List: Sprint 3 - Webview Management

**Goal:** To centralize all webview creation and lifecycle logic into a dedicated `WebviewManager` class.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Create `WebviewManager.ts` file:** In the `src/` directory, create a new file named `webviewManager.ts`. | `src/webviewManager.ts` (New) |
| **3.2** | ☐ To Do | **Define `WebviewManager` Class:** In `src/webviewManager.ts`, define and export the `WebviewManager` class. It should have a constructor that accepts `context: vscode.ExtensionContext` and a `dispose` method. | `src/webviewManager.ts` |
| **3.3** | ☐ To Do | **Implement `getWebviewContent`:** Inside `WebviewManager`, create a private helper method `private getWebviewContent(webview: vscode.Webview): string`. This method will read the `webview/build/index.html` file, replace asset paths (like `_app/`) with `webview.asWebviewUri`, and return the final HTML string. | `src/webviewManager.ts` |
| **3.4** | ☐ To Do | **Implement `showMainPanel`:** Create a public method `showMainPanel()`. It should check if a main panel instance already exists. If not, it calls `vscode.window.createWebviewPanel`, sets its HTML using the helper, and stores the panel instance. If it already exists, it should simply call `.reveal()` on the existing panel. | `src/webviewManager.ts` |
| **3.5** | ☐ To Do | **Implement `showSettingsPanel`:** Create a public method `showSettingsPanel()` with the same logic as `showMainPanel`, but for the settings UI. Use a different panel ID (e.g., `cody.settings`) and title. | `src/webviewManager.ts` |
| **3.6** | ☐ To Do | **Handle Panel Disposal:** In the `showMainPanel` and `showSettingsPanel` methods, when a new panel is created, add an `onDidDispose` listener. This listener should set the stored panel instance variable (e.g., `this.mainPanel = undefined;`) to clean up the reference. | `src/webviewManager.ts` |
| **3.7** | ☐ To Do | **Update `ExtensionManager.ts`:** Open `src/extensionManager.ts`. Import the `WebviewManager`. | `src/extensionManager.ts` |
| **3.8** | ☐ To Do | **Instantiate `WebviewManager`:** In the `ExtensionManager`'s constructor, create and store a public instance of the `WebviewManager`: `this.webviewManager = new WebviewManager(context);`. | `src/extensionManager.ts` |
| **3.9** | ☐ To Do | **Refactor `CommandManager.ts`:** Open `src/commandManager.ts`. | `src/commandManager.ts` |
| **3.10**| ☐ To Do | **Update Command Callbacks:** Find the command callbacks for `openMainPanel` and `openSettings`. Replace their entire implementation with simple calls to the new manager: `this.extensionManager.webviewManager.showMainPanel()` and `this.extensionManager.webviewManager.showSettingsPanel()`. | `src/commandManager.ts` |