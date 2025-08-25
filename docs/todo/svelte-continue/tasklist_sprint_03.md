# Task List: Sprint 03 - Webview Management

**Goal:** To centralize all webview creation and lifecycle logic into a dedicated `WebviewManager` class, fully decoupling panel management from command handlers and the main extension file.

**Methodology:** This sprint is a pure refactoring effort. The external behavior of the extension should not change, but the internal architecture will be significantly cleaner. Each step builds on the previous one.

---

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Create `WebviewManager.ts` File:** Create the new file and a `WebviewManager` class shell with a private constructor, a `dispose` method, and a public static `currentPanel` property. | `src/webviewManager.ts` (New) |
| **3.2** | ☐ To Do | **Implement `createOrShow` Static Method:** Add a public static `createOrShow` method. This method will contain the singleton logic: if `currentPanel` exists, call `.reveal()` on it; otherwise, create a new `WebviewPanel` and a new `WebviewManager` instance. | `src/webviewManager.ts` |
| **3.3** | ☐ To Do | **Move `getWebviewContent` Logic:** Move the `getWebviewContent` function (created in Sprint 2) into `WebviewManager` as a private helper method (`_getHtmlForWebview`). | `src/webviewManager.ts`, `src/extension.ts` |
| **3.4** | ☐ To Do | **Implement Panel Disposal:** In the `WebviewManager` constructor, add an `onDidDispose` listener to the panel. This listener must call the manager's `dispose` method, which should nullify the static `currentPanel` reference and clean up any other disposables. | `src/webviewManager.ts` |
| **3.5** | ☐ To Do | **Instantiate in `ExtensionManager`:** In `src/extensionManager.ts`, add a new public property `webviewManager` and instantiate your new `WebviewManager` in the constructor. | `src/extensionManager.ts` |
| **3.6** | ☐ To Do | **Refactor `openMainPanel` Command:** In `src/commandManager.ts` (or `extension.ts`), find the `openMainPanel` command registration. Replace its entire body with a single call to `this.extensionManager.webviewManager.createOrShow()`. | `src/commandManager.ts` |
| **3.7** | ☐ To Do | **Refactor `openSettingsPanel` Command:** Do the same for the `openSettingsPanel` command, creating a corresponding `createOrShowSettings` method in the `WebviewManager` if necessary to handle a separate settings panel singleton. | `src/commandManager.ts`, `src/webviewManager.ts` |
| **3.8** | ☐ To Do | **Verify Functionality:** Thoroughly test opening, closing, and re-opening both the main and settings panels. Confirm that the singleton pattern is working correctly and that no new panels are created when one is already open. | `(Manual Test)` |
