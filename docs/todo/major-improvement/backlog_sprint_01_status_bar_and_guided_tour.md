# Backlog: Sprint 1 - Status Bar & Guided Tour

**Objective:** To implement a persistent status bar indicator for at-a-glance feedback and create an interactive guided tour for first-time users to improve initial user experience.

---

### User Story 1: Status Bar Indicator
**As a** developer (Devin), **I want to** see the current status of the Code Context Engine in the VS Code status bar, **so that** I know if it's ready, indexing, or has an error without opening the sidebar.

**Acceptance Criteria:**
- A new status bar item is added to the VS Code UI.
- The item displays an icon and text for current states (e.g., `$(zap) Ready`, `$(sync~spin) Indexing`, `$(error) Error`).
- Clicking the status bar item opens the main webview panel.

**Actions to Undertake:**
1.  **Filepath**: `src/statusBarManager.ts` (New File)
    -   **Action**: Create the new file and a `StatusBarManager` class. Implement a method to create and initialize the `vscode.StatusBarItem`.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { StateManager } from './stateManager'; // Assuming StateManager exists

        export class StatusBarManager {
            private statusBarItem: vscode.StatusBarItem;

            constructor(private stateManager: StateManager) {
                this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
                this.stateManager.onStateChange(this.updateStatus.bind(this));
                this.statusBarItem.show();
            }

            public updateStatus(state: string): void {
                // Implementation in next step
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
2.  **Filepath**: `src/statusBarManager.ts`
    -   **Action**: Implement the `updateStatus` method to change the status bar item's text, icon, tooltip, and command based on the extension's state.
    -   **Implementation**:
        ```typescript
        public updateStatus(state: string): void {
            switch (state) {
                case 'Ready':
                    this.statusBarItem.text = `$(zap) Ready`;
                    this.statusBarItem.tooltip = 'Code Context Engine is ready';
                    this.statusBarItem.command = 'bigcontext.showPanel'; // Command to open webview
                    break;
                case 'Indexing':
                    this.statusBarItem.text = `$(sync~spin) Indexing`;
                    this.statusBarItem.tooltip = 'Code Context Engine is indexing...';
                    this.statusBarItem.command = 'bigcontext.showPanel';
                    break;
                case 'Error':
                    this.statusBarItem.text = `$(error) Error`;
                    this.statusBarItem.tooltip = 'An error occurred. Click for details.';
                    this.statusBarItem.command = 'bigcontext.showPanel';
                    break;
                default:
                    this.statusBarItem.text = `$(question) Unknown`;
                    this.statusBarItem.tooltip = 'Unknown state';
                    break;
            }
        }
        ```
    -   **Imports**: None.
3.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Instantiate `StatusBarManager` and link it to the `StateManager` to receive state updates.
    -   **Implementation**:
        ```typescript
        // In ExtensionManager's activation logic
        const stateManager = new StateManager(); // Assuming instantiation
        const statusBarManager = new StatusBarManager(stateManager);
        // Add to disposables
        context.subscriptions.push(statusBarManager);
        ```
    -   **Imports**: `import { StatusBarManager } from './statusBarManager';`

**Testing Plan:**
-   **Test Case 1**: Launch the extension and verify the status bar item shows `$(zap) Ready`.
-   **Test Case 2**: Trigger an indexing process and verify the item changes to `$(sync~spin) Indexing`.
-   **Test Case 3**: Simulate an error and verify the item shows `$(error) Error`.
-   **Test Case 4**: Click the status bar item in any state and confirm the extension's main panel opens.

---

### User Story 2: First-Run Guided Tour
**As a** first-time user, **I want** a brief, interactive tour of the UI after my first successful index, **so that** I can quickly learn how to use the core features.

**Acceptance Criteria:**
- After the first indexing completes, a guided tour overlay is shown.
- The tour highlights the query input box, the results area, and the settings icon.
- The user can easily dismiss the tour or step through it.
- The tour does not appear on subsequent runs.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/GuidedTour.svelte` (New File)
    -   **Action**: Build the Svelte component with slots for content and logic to control visibility and steps.
    -   **Implementation**:
        ```svelte
        <script>
          import { onMount } from 'svelte';
          let showTour = false;
          // Logic to control steps and visibility
        </script>

        {#if showTour}
          <div class="tour-overlay">
            <!-- Tour UI -->
          </div>
        {/if}
        ```
    -   **Imports**: `import { onMount } from 'svelte';`
2.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: Use `vscodeApi` to check a global state flag on mount to determine if the tour should ever be shown.
    -   **Implementation**:
        ```javascript
        // In onMount
        vscodeApi.postMessage({ command: 'getGlobalState', key: 'hasCompletedFirstRun' });
        // Listen for response
        ```
    -   **Imports**: None.
3.  **Filepath**: `webview/src/lib/components/IndexingView.svelte`
    -   **Action**: When the `indexingCompleted` message is received, and the first-run flag is not set, activate the guided tour.
    -   **Implementation**:
        ```javascript
        // In message handler for indexingCompleted
        if (!hasCompletedFirstRun) {
            // dispatch event to show tour
        }
        ```
    -   **Imports**: None.
4.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Add a handler for a message from the webview to set the `hasCompletedFirstRun` flag to true in the global state.
    -   **Implementation**:
        ```typescript
        case 'setGlobalState':
            await this.extensionContext.globalState.update(message.key, message.value);
            break;
        ```
    -   **Imports**: None.

**Testing Plan:**
-   **Test Case 1**: On a fresh installation, complete an index and verify the guided tour appears.
-   **Test case 2**: Complete or dismiss the tour. Restart the extension, run another index, and verify the tour does *not* appear again.
