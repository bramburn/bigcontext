### User Story 1: Robust State Management
**As a** backend developer (Alisha), **I want to** implement a `StateManager` to prevent concurrent operations, like running two indexing jobs at once, **so that** the extension is more robust and less prone to errors.

**Actions to Undertake:**
1.  **Filepath**: `src/stateManager.ts` (New File)
    -   **Action**: Create a new service to hold the global state of the extension.
    -   **Implementation**:
        ```typescript
        export class StateManager {
          private _isIndexing: boolean = false;

          public get isIndexing(): boolean {
            return this._isIndexing;
          }

          public setIndexing(status: boolean): void {
            this._isIndexing = status;
            // In the future, this could emit an event to the webview
          }
        }
        ```
    -   **Imports**: N/A
2.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Create a single instance of `StateManager` and inject it into the services that require it.
    -   **Implementation**: Instantiate `StateManager` in the `ExtensionManager` constructor and pass the instance to the constructors of `IndexingService` and `MessageRouter`.
    -   **Imports**: `import { StateManager } from './stateManager';`
3.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Modify the `startIndexing` method to update the shared state.
    -   **Implementation**:
        ```typescript
        public async startIndexing() {
          if (this.stateManager.isIndexing) { return; }
          try {
            this.stateManager.setIndexing(true);
            // ... existing indexing logic
          } finally {
            this.stateManager.setIndexing(false);
          }
        }
        ```
    -   **Imports**: `import { StateManager } from '../stateManager';`
4.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Add a guard clause to the `startIndexing` message handler to prevent new jobs from starting if one is already running.
    -   **Implementation**:
        ```typescript
        case 'startIndexing':
          if (this.stateManager.isIndexing()) {
            webview.postMessage({ command: 'error', message: 'An indexing process is already running.' });
            return;
          }
          await this.indexingService.startIndexing();
          break;
        ```
    -   **Imports**: `import { StateManager } from '../stateManager';`

**Acceptance Criteria:**
-   The `IndexingService` correctly sets an `isIndexing` flag to `true` when it starts and `false` when it finishes or errors.
-   If an indexing job is running, any subsequent requests to start indexing (from the UI or a command) are rejected.
-   The UI receives and displays a notification when a concurrent indexing request is blocked.

**Testing Plan:**
-   **Manual Test**: Start an indexing process on a large folder. While it is running, attempt to start another indexing process from the command palette or UI. Verify that the second process does not start and that an error message is shown in the webview.

---

### User Story 2: Keyboard Shortcuts (Hotkeys)
**As a** developer (Devin), **I want to** use keyboard shortcuts to open the main panel and start indexing, **so that** I can work more efficiently without using the mouse.

**Actions to Undertake:**
1.  **Filepath**: `package.json`
    -   **Action**: Add a `contributes.keybindings` section to define default keyboard shortcuts for key commands.
    -   **Implementation**:
        ```json
        "contributes": {
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
        ```
    -   **Imports**: N/A
2.  **Filepath**: `README.md`
    -   **Action**: Document the new default shortcuts so users are aware of them.
    -   **Implementation**: Add a "Shortcuts" section to the `README.md` file listing the new keybindings.
    -   **Imports**: N/A

**Acceptance Criteria:**
-   The `package.json` file contains definitions for at least two keyboard shortcuts.
-   Pressing the defined key combination for `openMainPanel` opens the webview panel.
-   Pressing the defined key combination for `startIndexing` triggers the indexing process (subject to the state manager guard clause).
-   The shortcuts are documented for users.

**Testing Plan:**
-   **Manual Test 1**: Close the webview panel. Press `Cmd+Alt+C` (or `Ctrl+Alt+C`) and verify the panel opens.
-   **Manual Test 2**: With the extension active, press `Cmd+Alt+I` (or `Ctrl+Alt+I`) and verify the indexing process begins (or is blocked if already running).
