**Objective:**
To create the `WebviewManager` class and move all webview panel creation and lifecycle logic into it, cleaning up the command handlers and `extension.ts`.

**Parent Sprint:**
PRD 2, Sprint 3: Webview Management

**Tasks:**

1.  **Create `WebviewManager.ts`:** Develop the new class with a constructor that accepts the `vscode.ExtensionContext`.
2.  **Implement `showMainPanel`:** Create a method that contains the logic for creating and showing the main webview panel. It should ensure only one instance of the main panel can exist.
3.  **Implement `showSettingsPanel`:** Create a method that contains the logic for creating and showing the settings webview panel.
4.  **Implement `getWebviewContent`:** Create a private helper method that reads the `index.html`, prepares it with the correct URIs for webview assets, and returns the HTML string.
5.  **Refactor `CommandManager`:** Update the callbacks for the `openMainPanel` and `openSettings` commands to simply call the appropriate methods on the `WebviewManager` instance.

**Acceptance Criteria:**

  * All `vscode.window.createWebviewPanel` calls are located exclusively within `WebviewManager.ts`.
  * The `openMainPanel` and `openSettings` commands correctly open their respective UIs.
  * Attempting to open a panel that is already open simply brings the existing panel into focus.

**Dependencies:**

  * `CommandManager` from PRD 1 must be implemented.

**Timeline:**

  * **Start Date:** 2025-09-22
  * **End Date:** 2025-10-03
