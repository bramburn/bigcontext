### User Story 1: Efficient Keyboard Navigation
**As a** developer (Devin), **I want to** use keyboard shortcuts to open the main panel and start indexing, **so that** I can work more efficiently without using the mouse.

**Actions to Undertake:**
1.  **Filepath**: `package.json`
    -   **Action**: Add the `keybindings` contribution to the `contributes` section.
    -   **Implementation**:
        ```json
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
        ```
    -   **Imports**: None.
2.  **Filepath**: `src/commandManager.ts`
    -   **Action**: Ensure the commands `code-context-engine.openMainPanel` and `code-context-engine.startIndexing` are properly registered and handled.
    -   **Implementation**: (No change, assuming commands are already registered).
    -   **Imports**: None.

**Acceptance Criteria:**
-   A `keybindings` contribution is added to `package.json`.
-   Pressing `Ctrl+Alt+C` (or `Cmd+Alt+C` on macOS) opens the main webview panel.
-   Pressing `Ctrl+Alt+I` (or `Cmd+Alt+I` on macOS) starts the indexing process.
-   The keybindings are functional and do not conflict with common VS Code shortcuts.

**Testing Plan:**
-   **Test Case 1**: Reload the extension. Press the keybinding for opening the main panel and verify it appears.
-   **Test Case 2**: Press the keybinding for starting indexing and verify the process begins (e.g., check for logs or UI updates).

---

### User Story 2: Familiar Configuration Experience
**As a** developer (Devin), **I want** the "Open Settings" command to take me directly to the native VS Code settings UI for the extension, **so that** I can manage configuration in a familiar way.

**Actions to Undertake:**
1.  **Filepath**: `src/commandManager.ts`
    -   **Action**: Refactor the `handleOpenSettings` method to use the built-in `workbench.action.openSettings` command.
    -   **Implementation**:
        ```typescript
        private handleOpenSettings() {
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';` (should already exist).
2.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Mark the old `showSettingsPanel` method as deprecated.
    -   **Implementation**:
        ```typescript
        /**
         * @deprecated The settings are now managed in the native VS Code Settings UI.
         * This webview will be repurposed for diagnostics.
         */
        public showSettingsPanel() {
            // ... existing implementation
        }
        ```
    -   **Imports**: None.

**Acceptance Criteria:**
-   The `handleOpenSettings` method in `CommandManager` is refactored.
-   Executing the `code-context-engine.openSettings` command opens the native VS Code Settings UI, filtered to show only settings for this extension.
-   The old Svelte-based settings panel is no longer shown by this command.
-   The `showSettingsPanel` method in `WebviewManager` is marked with a `@deprecated` JSDoc comment.

**Testing Plan:**
-   **Test Case 1**: Run the "Code Context Engine: Open Settings" command from the Command Palette.
-   **Test Case 2**: Verify that the native VS Code Settings tab opens and the search bar is pre-filled with `@ext:bramburn.code-context-engine`.
-   **Test Case 3**: Check the source code to confirm the JSDoc comment is present on `showSettingsPanel`.
