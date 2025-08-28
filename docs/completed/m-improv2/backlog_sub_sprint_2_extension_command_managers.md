### User Story: Extension & Command Managers

**As a** backend developer (Alisha),
**I want to** introduce an `ExtensionManager` to handle the extension's lifecycle and a `CommandManager` to handle all command registrations,
**so that** `extension.ts` becomes a simple entry point and command logic is decoupled from the main activation file, improving modularity and maintainability.

**Objective:** To create the initial `ExtensionManager` and `CommandManager` classes, moving the core lifecycle and command registration logic out of `extension.ts`.

**Workflow:**
1.  Verify the existing `ExtensionManager` correctly orchestrates service instantiation and disposal.
2.  Verify the existing `CommandManager` centralizes command registration and delegates execution.
3.  Ensure `extension.ts` remains a minimal entry and exit point for the extension.

**List of Files to be Verified/Modified:**
-   `src/commandManager.ts` (Verify)
-   `src/extension.ts` (Verify)
-   `src/extensionManager.ts` (Verify/Modify for DI from Sub-Sprint 1)

**Actions to Undertake:**

1.  **Filepath**: `src/commandManager.ts`
    -   **Action**: Verify `CommandManager` class exists with a constructor that accepts `IndexingService` and `WebviewManager`, and a `registerCommands` method that registers all commands (`openMainPanel`, `startIndexing`, `openSettings`, `setupProject`, `openDiagnostics`).
    -   **Implementation**: No new implementation; verification of existing code.
    -   **Imports**: `import * as vscode from 'vscode'; import { IndexingService } from './indexing/indexingService'; import { WebviewManager } from './webviewManager';`

2.  **Filepath**: `src/extension.ts`
    -   **Action**: Verify `activate` function only creates and initializes `ExtensionManager`. Verify `deactivate` function only calls `extensionManager.dispose()`. Confirm the file is less than 50 lines of code.
    -   **Implementation**: No new implementation; verification of existing code.
    -   **Imports**: `import * as vscode from 'vscode'; import { ExtensionManager } from './extensionManager';`

3.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Verify `ExtensionManager` class exists with an `initialize` method that instantiates all services (ensuring `ConfigService` is passed to `ContextService` and `IndexingService` during instantiation) and managers, and a `dispose` method that handles cleanup.
    -   **Implementation**: Ensure the constructor of `ContextService` and `IndexingService` receive the `ConfigService` instance. (This is a direct follow-up from Sub-Sprint 1).
    -   **Imports**: `import { ConfigService } from './configService';` (already present)

**Acceptance Criteria:**
-   The `extension.ts` file is less than 50 lines of code.
-   All previously functional commands are still registered and work correctly.
-   The extension activates and deactivates cleanly without errors.

**Testing Plan:**
-   **Test Case 1**: Activate the extension and verify that all commands (`openMainPanel`, `startIndexing`, `openSettings`, `setupProject`, `openDiagnostics`) are registered and callable.
-   **Test Case 2**: Execute each command and verify it performs its intended action (e.g., `openMainPanel` opens the webview, `startIndexing` initiates indexing).
-   **Test Case 3**: Deactivate the extension and verify no errors or memory leaks occur.
-   **Test Case 4**: Inspect `src/extension.ts` to confirm it meets the line count requirement.
-   **Test Case 5**: (Integration with Sub-Sprint 1) Verify that services instantiated by `ExtensionManager` correctly receive and use the `ConfigService` instance.
