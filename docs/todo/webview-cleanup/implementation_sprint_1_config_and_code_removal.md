# Implementation Guide: Sprint 1 - Configuration & Code Removal

This guide provides technical details for removing deprecated webview settings and associated code logic. The goal is to simplify the configuration and codebase.

---

### **Task 1: Remove Configuration Properties from `package.json`**

You will need to edit the `package.json` file to remove two configuration properties that are no longer needed.

**File to Modify**: `package.json`

**1.1. Remove `routeOverride` Setting**

*   **Action**: In the `contributes.configuration.properties` object, find and delete the entire `code-context-engine.webview.routeOverride` key and its associated object value.

*   **Code to Remove (Example)**:
    ```json
    "code-context-engine.webview.routeOverride": {
      "type": "string",
      "default": "",
      "description": "For debugging: overrides the default webview route. Example: '/login'."
    },
    ```

**1.2. Remove `basicTestMode` Setting**

*   **Action**: Similarly, find and delete the `code-context-engine.webview.basicTestMode` key and its object value.

*   **Code to Remove (Example)**:
    ```json
    "code-context-engine.webview.basicTestMode": {
      "type": "boolean",
      "default": false,
      "description": "For debugging: enables a basic HTML webview for testing in remote environments."
    },
    ```

---

### **Task 2: Simplify `WebviewManager` in `src/webviewManager.ts`**

You will need to edit `src/webviewManager.ts` to remove the code that handles the deprecated settings.

**File to Modify**: `src/webviewManager.ts`

**2.1. Remove `getBasicTestHtml` Method**

*   **Action**: Find and delete the entire `getBasicTestHtml` method. This method was used to generate a simple HTML page for remote connection testing and is no longer required.

*   **Code to Remove**:
    ```typescript
    private getBasicTestHtml(cspSource: string, nonce: string): string {
      // ... entire method body ...
    }
    ```

**2.2. Remove Logic from `getWebviewContent`**

*   **Action**: In the `getWebviewContent` method, you will remove two blocks of code.

*   **Step 1: Remove Test Mode Logic**
    *   Find the `if` block that checks the `basicTestMode` configuration setting and calls `getBasicTestHtml`. Delete this entire block.

    *   **Code to Remove**:
        ```typescript
        const basicTestMode = vscode.workspace.getConfiguration('code-context-engine').get('webview.basicTestMode', false);
        if (basicTestMode) {
            return this.getBasicTestHtml(cspSource, nonce);
        }
        ```

*   **Step 2: Remove Route Override Logic**
    *   Find the code that retrieves the `routeOverride` setting and then uses `html.replace` to inject a script. Delete this logic.

    *   **Code to Remove**:
        ```typescript
        const routeOverride = vscode.workspace.getConfiguration('code-context-engine').get('webview.routeOverride', '');
        if (routeOverride) {
            const scriptInjection = `<script nonce="${nonce}">window.location.hash = "#${routeOverride}";</script>`;
            html = html.replace('</body>', `${scriptInjection}</body>`);
        }
        ```

---

### **Verification**

After completing these steps, run the extension and verify:
1.  The main React application loads directly in the webview.
2.  The old settings do not appear in the VS Code settings panel.
3.  The project builds successfully.
