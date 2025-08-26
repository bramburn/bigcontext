# Implementation Guide: Sprint 2 - Native Settings, Hotkeys & State Management

**Goal:** To improve UX by adding keyboard shortcuts, using the native VS Code settings UI, and implementing a robust state manager.

This guide provides the technical steps to integrate the extension more deeply with VS Code.

---

### **Part 1: Keybindings and Native Settings**

#### **1.1: Add Keybindings to `package.json`**

To add keyboard shortcuts, you need to add a `contributes.keybindings` section to the `package.json` file. This allows users to trigger commands without using the command palette.

**File to Modify:** `package.json`

```json
// package.json
{
  "name": "code-context-engine",
  "contributes": {
    "commands": [
      {
        "command": "code-context-engine.openMainPanel",
        "title": "Code Context Engine: Open Main Panel"
      },
      {
        "command": "code-context-engine.startIndexing",
        "title": "Code Context Engine: Start Indexing"
      }
      // ... other commands
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

*   **`command`**: The ID of the command to execute.
*   **`key` / `mac`**: The key combination for Windows/Linux and macOS.
*   **`when`**: A [when clause](https://code.visualstudio.com/api/references/when-clause-contexts) that determines when the keybinding is active. `editorTextFocus` is a common choice.

#### **1.2: Refactor "Open Settings" Command**

To provide a native experience, we will change the `openSettings` command to open the standard VS Code Settings UI, filtered to show only our extension's settings.

**File to Modify:** `src/commandManager.ts`

```typescript
// src/commandManager.ts
import * as vscode from 'vscode';

// ... inside CommandManager class ...

private handleOpenSettings() {
    // The extension ID is defined in package.json (e.g., "bramburn.code-context-engine")
    vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');
}

// Make sure this handler is registered to the correct command ID.
```

--- 

### **Part 2: Diagnostics View and State Management**

#### **2.1: Create `openDiagnostics` Command and Panel**

This involves creating a new command and a `WebviewManager` method to show the new diagnostics panel. This will follow the same pattern as the existing `showMainPanel`.

1.  **`package.json`**: Add the new `code-context-engine.openDiagnostics` command.
2.  **`src/commandManager.ts`**: Register the new command and have it call `this.webviewManager.showDiagnosticsPanel()`.
3.  **`src/webviewManager.ts`**: Implement `showDiagnosticsPanel`, which will create and manage a new `WebviewPanel` instance for the diagnostics view.

#### **2.2: Create `StateManager.ts`**

A simple, centralized state manager will help prevent race conditions and manage the extension's state, such as whether indexing is in progress.

**New File:** `src/stateManager.ts`

```typescript
// src/stateManager.ts

interface ExtensionState {
    isIndexing: boolean;
}

export class StateManager {
    private state: ExtensionState;

    constructor() {
        this.state = {
            isIndexing: false,
        };
    }

    public getState(): Readonly<ExtensionState> {
        return this.state;
    }

    public setIndexing(isIndexing: boolean): void {
        this.state.isIndexing = isIndexing;
        // Here you could add listeners/event emitters if other parts
        // of the extension need to react to state changes.
    }
}
```

#### **2.3: Integrate `StateManager`**

The `StateManager` should be instantiated once and shared across the extension. The `ExtensionManager` is the ideal place to create and inject it.

**File to Modify:** `src/extensionManager.ts`

```typescript
// src/extensionManager.ts
import { StateManager } from './stateManager';
// ... other imports

export class ExtensionManager {
    private stateManager: StateManager;
    // ... other services

    constructor(context: vscode.ExtensionContext) {
        this.stateManager = new StateManager();
        // Pass the stateManager instance to the services that need it.
        this.indexingService = new IndexingService(this.stateManager);
        this.messageRouter = new MessageRouter(this.stateManager, this.indexingService);
        // ... initialize other managers
    }
}
```

#### **2.4: Add Guard Clause in `MessageRouter`**

Finally, use the `StateManager` in the `MessageRouter` to prevent starting a new indexing job if one is already running.

**File to Modify:** `src/messageRouter.ts`

```typescript
// src/messageRouter.ts
// ... imports

export class MessageRouter {
    private stateManager: StateManager;
    private indexingService: IndexingService;

    constructor(stateManager: StateManager, indexingService: IndexingService) {
        this.stateManager = stateManager;
        this.indexingService = indexingService;
    }

    private handleMessage(message: any) {
        switch (message.command) {
            case 'startIndexing':
                if (this.stateManager.getState().isIndexing) {
                    vscode.window.showInformationMessage('An indexing process is already running.');
                    return; // Guard clause
                }
                // Set state to true before starting
                this.stateManager.setIndexing(true);
                this.indexingService.startIndexing().finally(() => {
                    // Set state to false when finished
                    this.stateManager.setIndexing(false);
                });
                break;
            // ... other cases
        }
    }
}
```

And in the `IndexingService`, you would also set the state.

**File to Modify:** `src/indexing/indexingService.ts`

```typescript
// src/indexing/indexingService.ts
// ... imports

export class IndexingService {
    private stateManager: StateManager;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    public async startIndexing() {
        this.stateManager.setIndexing(true);
        try {
            // ... your indexing logic ...
        } catch (error) {
            // ... error handling ...
        } finally {
            this.stateManager.setIndexing(false);
        }
    }
}
```
