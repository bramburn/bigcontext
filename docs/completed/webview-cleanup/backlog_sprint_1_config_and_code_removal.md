# Backlog: Sprint 1 - Configuration & Code Removal

**Objective:** To remove deprecated debugging settings and associated code to streamline the webview loading process and improve user experience by simplifying configuration.

---

### User Story 1: Remove Deprecated Webview Settings

**As a** developer (Frank),
**I want to** remove the `routeOverride` and `basicTestMode` settings from `package.json`,
**So that** users are not exposed to confusing or irrelevant debugging options.

**Actions to Undertake:**

1.  **Filepath**: `package.json`
    *   **Action**: Locate and delete the `code-context-engine.webview.routeOverride` property from the `contributes.configuration.properties` object.
    *   **Implementation**: Remove the JSON block for `code-context-engine.webview.routeOverride`.

2.  **Filepath**: `package.json`
    *   **Action**: Locate and delete the `code-context-engine.webview.basicTestMode` property from the `contributes.configuration.properties` object.
    *   **Implementation**: Remove the JSON block for `code-context-engine.webview.basicTestMode`.

**Acceptance Criteria:**

*   The `code-context-engine.webview.routeOverride` setting is removed from the `contributes.configuration.properties` section in `package.json`.
*   The `code-context-engine.webview.basicTestMode` setting is also removed from `package.json`.
*   The settings no longer appear in the VS Code Settings UI.

**Testing Plan:**

*   **Test Case 1**: Open the VS Code Settings UI and search for "routeOverride". Verify that the setting is not found.
*   **Test Case 2**: Open the VS Code Settings UI and search for "basicTestMode". Verify that the setting is not found.

---

### User Story 2: Simplify WebviewManager Logic

**As a** developer (Frank),
**I want to** remove the logic in the `WebviewManager` that handles the deprecated settings,
**So that** the code is cleaner, easier to maintain, and free of dead code paths.

**Actions to Undertake:**

1.  **Filepath**: `src/webviewManager.ts`
    *   **Action**: Delete the entire `getBasicTestHtml` method.
    *   **Implementation**: Remove the function block for `private getBasicTestHtml(...): string`.

2.  **Filepath**: `src/webviewManager.ts`
    *   **Action**: In the `getWebviewContent` method, remove the conditional block that checks for `basicTestMode` and calls `getBasicTestHtml`.
    *   **Implementation**: Remove the `if (basicTestMode) { ... }` block.

3.  **Filepath**: `src/webviewManager.ts`
    *   **Action**: In the `getWebviewContent` method, remove the code block that reads the `webview.routeOverride` setting and injects the corresponding navigation script into the HTML.
    *   **Implementation**: Remove the logic that retrieves `routeOverride` from the configuration and the subsequent `html.replace` call that injects the script.

**Acceptance Criteria:**

*   All code that reads `webview.routeOverride` and `webview.basicTestMode` from the configuration is removed from `src/webviewManager.ts`.
*   The `getBasicTestHtml` method is removed from `src/webviewManager.ts`.
*   The logic for injecting the route override script into the webview's HTML is removed.
*   The extension compiles successfully without errors related to the removed code.

**Testing Plan:**

*   **Test Case 1**: Run the extension in debug mode (`F5`).
*   **Verification**: Confirm that the main application view loads directly by default.
*   **Verification**: Confirm that the old "React Webview Test" page no longer appears.
*   **Code Review**: Verify that the specified methods and logic blocks have been removed from `src/webviewManager.ts`.
