# Implementation Guidance: Sprint 1 - Status Bar & Guided Tour

**Objective:** To implement the status bar indicator and the first-run guided tour.

---

### **Part 1: Status Bar Indicator**

**High-Level Plan:**
1.  Create a dedicated `StatusBarManager.ts` class to encapsulate all logic related to the VS Code Status Bar.
2.  The manager will create a `vscode.StatusBarItem` instance.
3.  It will subscribe to the central `StateManager` to react to changes in the extension's state.
4.  Based on the state, it will update the status bar's text, icon, tooltip, and associated command.

**VS Code API Information:**
*   **`vscode.window.createStatusBarItem`**: This is the core function to create the UI element.
    *   **Syntax**: `vscode.window.createStatusBarItem(alignment?: StatusBarAlignment, priority?: number): StatusBarItem`
    *   **`alignment`**: Use `vscode.StatusBarAlignment.Left` to place it on the left side.
    *   **`priority`**: A higher number means it will be placed further to the left. A value of `100` is a good starting point.
    *   **Reference**: [VS Code API Docs: createStatusBarItem](https://code.visualstudio.com/api/references/vscode-api#window.createStatusBarItem)

*   **`vscode.StatusBarItem` Properties**:
    *   `.text`: The text to display. You can embed icons using the `$(icon-name)` syntax (e.g., `$(zap)`). For spinning icons, use the `~spin` modifier (e.g., `$(sync~spin)`).
    *   `.tooltip`: The text that appears on hover.
    *   `.command`: The command ID to execute when the item is clicked. This should be the command that opens your extension's main panel.
    *   `.show()`: Makes the item visible.
    *   `.dispose()`: Removes the item. Remember to call this when your extension deactivates.

**Code Example (`StatusBarManager.ts`):**
```typescript
import * as vscode from 'vscode';
import { StateManager, AppState } from './stateManager'; // Assuming AppState enum/type

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext, stateManager: StateManager) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        context.subscriptions.push(this.statusBarItem);

        // Subscribe to state changes
        stateManager.onStateChange((newState) => this.updateStatus(newState));

        // Set initial state and show
        this.updateStatus(stateManager.getState());
        this.statusBarItem.show();
    }

    private updateStatus(state: AppState): void {
        switch (state) {
            case AppState.Ready:
                this.statusBarItem.text = `$(zap) Ready`;
                this.statusBarItem.tooltip = 'Code Context Engine is ready';
                this.statusBarItem.command = 'bigcontext.showPanel';
                break;
            case AppState.Indexing:
                this.statusBarItem.text = `$(sync~spin) Indexing`;
                this.statusBarItem.tooltip = 'Indexing workspace...';
                this.statusBarItem.command = 'bigcontext.showPanel';
                break;
            // ... other states
        }
    }
}
```

---

### **Part 2: First-Run Guided Tour**

**High-Level Plan:**
1.  Use VS Code's global state to persist a flag (`hasCompletedFirstRun`) indicating if the tour has been shown.
2.  When the webview loads, it should query the extension backend for this flag's value.
3.  The backend will listen for the "indexing complete" event. If it's the first time, it will notify the webview to start the tour.
4.  Create a Svelte component (`GuidedTour.svelte`) for the tour's UI and logic.
5.  When the tour is dismissed or completed, the webview will send a message to the backend to set the `hasCompletedFirstRun` flag to `true`.

**VS Code API Information:**
*   **`vscode.ExtensionContext.globalState`**: This is a memento object for storing and retrieving key-value pairs that are persisted across VS Code sessions.
    *   **Syntax**:
        *   `context.globalState.get<T>(key: string, defaultValue?: T): T | undefined`
        *   `context.globalState.update(key: string, value: any): Thenable<void>`
    *   **Usage**: This is the ideal place to store the `hasCompletedFirstRun` flag. The extension backend (in `extension.ts` or a manager) will handle reading and writing to it.
    *   **Reference**: [VS Code API Docs: ExtensionContext.globalState](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext.globalState)

**Implementation Strategy:**
1.  **Backend (`extension.ts` / `messageRouter.ts`):**
    -   On activation, check `context.globalState.get('hasCompletedFirstRun')`.
    -   When the webview requests the state, send it.
    -   When the webview sends a `tourCompleted` message, call `context.globalState.update('hasCompletedFirstRun', true)`.
    -   After a successful index, check the flag. If `false`, send a `startTour` message to the webview.

2.  **Frontend (`+page.svelte` / `IndexingView.svelte`):**
    -   On mount, request the `hasCompletedFirstRun` flag from the backend.
    -   Store the result in a Svelte store or component state.
    -   Listen for the `startTour` message from the backend.
    -   If `startTour` is received, render the `GuidedTour.svelte` component.
    -   The `GuidedTour` component will have its own internal logic for steps. When it closes, it should dispatch an event that triggers a `tourCompleted` message to be sent to the backend.

**Recommended Library for Tour UI:**
*   **`shepherd.js`**: A popular and powerful library for creating guided tours. It's framework-agnostic but works well with Svelte. You would install it in your `webview` project.
*   **Website**: [Shepherd.js](https://shepherdjs.dev/)
*   **Example Usage**:
    ```javascript
    // In GuidedTour.svelte
    import Shepherd from 'shepherd.js';
    import 'shepherd.js/dist/css/shepherd.css';

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-arrows',
        scrollTo: true
      }
    });

    tour.addStep({
      title: 'Query Input',
      text: 'Type your code questions here!',
      attachTo: {
        element: '#query-input-element', // Use a CSS selector
        on: 'bottom'
      },
      buttons: [{ text: 'Next', action: tour.next }]
    });
    // ... more steps

    tour.start();
    ```
