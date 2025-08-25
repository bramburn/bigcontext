## Implementation Guide: Sprint 1 - Hotkey & Native Settings Integration

This guide provides the technical details, code examples, and API information needed to complete Sprint 1.

### **Objective**
To add keyboard shortcuts for key actions and integrate with the native VS Code settings UI.

---

### **Part 1: Adding Keybindings**

To add keyboard shortcuts, you will use the `keybindings` contribution point in the `package.json` file. This allows you to declare keybindings that are active when your extension is enabled.

**Relevant API/Documentation:**
*   **VS Code Keybindings Contribution:** [https://code.visualstudio.com/api/references/contribution-points#contributes.keybindings](https://code.visualstudio.com/api/references/contribution-points#contributes.keybindings)

**Implementation Steps:**

1.  **Modify `package.json`:**
    Open your `package.json` file and locate the `contributes` section. Add the `keybindings` array as shown below. The `when` clause can be used to control when the keybinding is active; `editorTextFocus` is a common choice.

    **Filepath**: `package.json`

    ```json
    {
      "name": "code-context-engine",
      "contributes": {
        "commands": [
          // ... your existing commands
        ],
        "keybindings": [
          {
            "command": "code-context-engine.openMainPanel",
            "key": "ctrl+alt+c",
            "mac": "cmd+alt+c",
            "when": "editorTextFocus"
          },
          {
            "command": "code-context-engine.startIndexing",
            "key": "ctrl+alt+i",
            "mac": "cmd+alt+i",
            "when": "editorTextFocus"
          }
        ]
      }
    }
    ```

---

### **Part 2: Integrating with Native Settings UI**

To provide a more native user experience, the "Open Settings" command will be changed to open the built-in VS Code settings window, pre-filtered for your extension.

**Relevant API/Documentation:**
*   **VS Code Commands API:** [https://code.visualstudio.com/api/references/vscode-api#commands](https://code.visualstudio.com/api/references/vscode-api#commands)
*   **Built-in Commands:** [https://code.visualstudio.com/api/references/commands](https://code.visualstudio.com/api/references/commands) (search for `workbench.action.openSettings`)

**Implementation Steps:**

1.  **Refactor `handleOpenSettings`:**
    In `src/commandManager.ts`, you will replace the logic that shows your custom webview with a call to `vscode.commands.executeCommand`.

    **Filepath**: `src/commandManager.ts`

    ```typescript
    import * as vscode from 'vscode';
    // ... other imports

    export class CommandManager {
        // ... other methods

        private handleOpenSettings() {
            // The string argument filters the settings UI for your extension's settings.
            // Ensure the extension ID 'bramburn.code-context-engine' matches your package.json publisher and name.
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');
        }

        // ... other methods
    }
    ```

2.  **Deprecate the Old Webview Method:**
    To prevent accidental use of the old settings panel, add a JSDoc `@deprecated` tag to the `showSettingsPanel` method in `src/webviewManager.ts`.

    **Filepath**: `src/webviewManager.ts`

    ```typescript
    // ... other imports

    export class WebviewManager {
        // ... other properties

        /**
         * @deprecated The settings are now managed in the native VS Code Settings UI.
         * This method will be repurposed or removed in a future sprint.
         */
        public showSettingsPanel() {
            // The existing implementation remains for now.
        }

        // ... other methods
    }
    ```

By following this guide, you will successfully implement the user stories for Sprint 1, creating a more seamless and efficient experience for your users.