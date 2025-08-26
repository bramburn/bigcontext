This guide provides implementation details for Sprint 5: State Management & Hotkeys.

### 1. Implementing the `StateManager`

The `StateManager` is a simple class that acts as a single source of truth for global states, such as whether an indexing process is active. It should be instantiated once and shared across services.

**Location**: `src/stateManager.ts`

**Full `StateManager.ts` Implementation**:
```typescript
/**
 * Manages the global state of the extension.
 * This class is intended to be a singleton, instantiated once in ExtensionManager.
 */
export class StateManager {
  // Use a private property with a public getter to control write access.
  private _isIndexing: boolean = false;

  public get isIndexing(): boolean {
    return this._isIndexing;
  }

  /**
   * Sets the indexing status and can be extended to notify the webview.
   * @param status The new indexing status.
   */
  public setIndexing(status: boolean): void {
    if (this._isIndexing !== status) {
      this._isIndexing = status;
      // FUTURE: Post a message to the webview to update UI state, e.g.,
      // this.webviewManager.getPanel()?.webview.postMessage({ command: 'indexingStatusChanged', status });
    }
  }
}
```

### 2. Dependency Injection via `ExtensionManager`

To ensure all services share the *same* state, the `StateManager` instance must be created in a central location (`ExtensionManager`) and passed to the constructors of other services.

**Location**: `src/extensionManager.ts`

**Example of `ExtensionManager` modifications**:
```typescript
// ... other imports
import { StateManager } from './stateManager';
import { IndexingService } from './indexing/indexingService';
import { MessageRouter } from './messageRouter';

export class ExtensionManager {
  private stateManager: StateManager;
  private indexingService: IndexingService;
  private messageRouter: MessageRouter;
  // ... other services

  constructor(context: vscode.ExtensionContext) {
    // 1. Create the single instance of the StateManager.
    this.stateManager = new StateManager();

    // 2. Inject the instance into the constructors of dependent services.
    // Note: The constructors for these services must be updated to accept the StateManager.
    this.indexingService = new IndexingService(context, this.stateManager);
    this.messageRouter = new MessageRouter(context, this.indexingService, this.stateManager);
    // ... initialize other services
  }
  // ... other methods
}
```

### 3. Safe State Updates in `IndexingService`

It is critical that the `isIndexing` state is reset correctly, even if an error occurs during indexing. A `try...finally` block is the perfect tool for this.

**Location**: `src/indexing/indexingService.ts`

**Updated `startIndexing` method**:
```typescript
// In IndexingService class

private stateManager: StateManager;

constructor(context: vscode.ExtensionContext, stateManager: StateManager) {
  this.context = context;
  this.stateManager = stateManager;
}

public async startIndexing(): Promise<void> {
  // Optional: Check state here as well for internal calls
  if (this.stateManager.isIndexing) {
    console.warn('Indexing already in progress. Aborting.');
    return;
  }

  try {
    // Set state to true at the very beginning
    this.stateManager.setIndexing(true);
    console.log('Indexing started...');
    
    // ... all existing indexing logic goes here ...

    console.log('Indexing finished successfully.');

  } catch (error) {
    console.error('An error occurred during indexing:', error);
    // Optionally, post an error message to the UI
  } finally {
    // ALWAYS set state to false when the process is complete, success or fail.
    this.stateManager.setIndexing(false);
    console.log('Indexing process ended.');
  }
}
```

### 4. Adding Keybindings to `package.json`

VS Code commands can be mapped to keyboard shortcuts via the `contributes.keybindings` section in `package.json`.

**Analysis**: The `package.json` file provided in the initial context already contains the required keybindings. This task is a matter of **verification**.

**Location**: `package.json`

**Verification Snippet**:
```json
{
  "contributes": {
    "commands": [
      // ... commands
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

**Guidance**:
-   Confirm the `command` IDs match those registered in the extension.
-   The `when` clause (`editorTextFocus`) ensures the shortcut is only active when the user is in a text editor, which is a good default to avoid conflicts.
-   Ensure these shortcuts are documented in the `README.md` for user visibility.
