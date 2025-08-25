## Implementation Guidance: Sub-Sprint 2 - Extension & Command Managers

This guide details the creation of `ExtensionManager` and `CommandManager` classes to centralize extension lifecycle management and command registration, significantly simplifying `extension.ts`.

### 1. `ExtensionManager` (`src/extensionManager.ts` - New File)

**Purpose:** To act as the main orchestrator for the extension, responsible for instantiating all services and managers, initializing them, and handling their disposal. It becomes the single entry point for the extension's core logic.

**Key Responsibilities:**
-   **Composition Root:** Instantiates all top-level services and managers (e.g., `ConfigService`, `QdrantService`, `IndexingService`, `CommandManager`).
-   **Initialization:** Calls `initialize` methods on its managed components.
-   **Lifecycle Management:** Manages the `vscode.Disposable` objects for all components, ensuring proper cleanup during deactivation.

**Code Example (`src/extensionManager.ts`):**
```typescript
import * as vscode from 'vscode';
import { ConfigService } from './configService';
import { QdrantService } from './db/qdrantService';
import { createEmbeddingProvider, IEmbeddingProvider } from './embeddings/embeddingProvider';
import { ContextService } from './context/contextService';
import { IndexingService } from './indexing/indexingService';
import { FileWalker } from './indexing/fileWalker';
import { AstParser } from './parsing/astParser';
import { Chunker } from './parsing/chunker';
import { LspService } from './lsp/lspService';
import { CommandManager } from './commandManager';

export class ExtensionManager implements vscode.Disposable {
    private configService: ConfigService;
    private qdrantService: QdrantService;
    private embeddingProvider: IEmbeddingProvider;
    private contextService: ContextService;
    private indexingService: IndexingService;
    private commandManager: CommandManager;

    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        // Instantiate ConfigService (from Sub-Sprint 1)
        this.configService = new ConfigService();

        // Instantiate QdrantService (from Sub-Sprint 1)
        this.qdrantService = new QdrantService(this.configService.getQdrantConnectionString());

        // Instantiate EmbeddingProvider (from Sub-Sprint 1)
        // The choice of provider (ollama/openai) can be made based on configService
        this.embeddingProvider = createEmbeddingProvider('ollama', this.configService); 

        // Instantiate ContextService (from Sub-Sprint 1)
        this.contextService = new ContextService(this.qdrantService, this.embeddingProvider);

        // Instantiate other core dependencies that IndexingService needs
        const fileWalker = new FileWalker();
        const astParser = new AstParser();
        const chunker = new Chunker();
        const lspService = new LspService();

        // Instantiate IndexingService (from Sub-Sprint 1)
        this.indexingService = new IndexingService(
            fileWalker,
            astParser,
            chunker,
            this.qdrantService,
            this.embeddingProvider,
            lspService
        );

        // Instantiate CommandManager, passing the services it needs to execute commands
        this.commandManager = new CommandManager(this.indexingService /*, other services as they are created */);
    }

    public initialize(): void {
        // Register all commands and collect their disposables
        this.disposables.push(...this.commandManager.registerCommands());

        // Add all collected disposables to the extension's context subscriptions
        // This ensures they are disposed of when the extension deactivates
        this.context.subscriptions.push(...this.disposables);

        console.log('ExtensionManager initialized.');
    }

    public dispose(): void {
        // Dispose of all managed disposables
        this.disposables.forEach(d => d.dispose());
        console.log('ExtensionManager disposed.');
    }
}
```

### 2. `CommandManager` (`src/commandManager.ts` - New File)

**Purpose:** To centralize the registration of all VS Code commands, decoupling this logic from `extension.ts`. It acts as a dispatcher, delegating command execution to the appropriate service.

**Key Responsibilities:**
-   **Command Registration:** Uses `vscode.commands.registerCommand` to register all commands defined by the extension.
-   **Delegation:** Calls methods on the relevant services (e.g., `IndexingService`) to perform the actual command logic.
-   **Disposable Management:** Returns an array of `vscode.Disposable` objects for the registered commands, which `ExtensionManager` will manage.

**Code Example (`src/commandManager.ts`):**
```typescript
import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';

export class CommandManager {
    // The constructor receives instances of services that will handle command logic
    constructor(private indexingService: IndexingService) {}

    public registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Register the 'openMainPanel' command
        disposables.push(
            vscode.commands.registerCommand('code-context-engine.openMainPanel', () => {
                // In Sub-Sprint 3, this will call a method on WebviewManager
                vscode.window.showInformationMessage('Main Panel command executed (placeholder).');
            })
        );

        // Register the 'startIndexing' command
        disposables.push(
            vscode.commands.registerCommand('code-context-engine.startIndexing', () => {
                this.indexingService.startIndexing();
                vscode.window.showInformationMessage('Indexing started via command!');
            })
        );

        // Register the 'openSettings' command
        disposables.push(
            vscode.commands.registerCommand('code-context-engine.openSettings', () => {
                // In Sub-Sprint 3, this will call a method on WebviewManager
                vscode.window.showInformationMessage('Settings command executed (placeholder).');
            })
        );

        // Add more commands as needed

        return disposables;
    }
}
```

### 3. Refactoring `extension.ts`

**Purpose:** To transform `extension.ts` into a lean entry point that primarily instantiates and initializes the `ExtensionManager`, and handles its disposal. This significantly reduces its complexity and improves maintainability.

**Key Changes:**
-   Remove all direct service instantiations.
-   Remove all direct `vscode.commands.registerCommand` calls.
-   The `activate` function will create an instance of `ExtensionManager` and call its `initialize` method.
-   The `deactivate` function will call the `dispose` method on the `ExtensionManager` instance.

**Code Example (`src/extension.ts`):**
```typescript
import * as vscode from 'vscode';
import { ExtensionManager } from './extensionManager';

// Declare extensionManager outside activate/deactivate to maintain its state
let extensionManager: ExtensionManager;

export function activate(context: vscode.ExtensionContext) {
    // Instantiate the main ExtensionManager
    extensionManager = new ExtensionManager(context);

    // Initialize the ExtensionManager, which in turn sets up all services and commands
    extensionManager.initialize();

    console.log('Code Context Engine extension activated successfully.');
}

export function deactivate() {
    // Dispose of the ExtensionManager and all its managed resources
    if (extensionManager) {
        extensionManager.dispose();
    }
    console.log('Code Context Engine extension deactivated.');
}
```

### Further Guidance:

*   **Error Handling:** Consider adding `try-catch` blocks in `ExtensionManager`'s constructor and `initialize` method to gracefully handle errors during service instantiation or command registration.
*   **Logging:** Implement a consistent logging mechanism (e.g., using `vscode.window.showInformationMessage` for user-facing messages, and `console.log` or a dedicated logger for internal debugging) across your managers and services.
*   **Testability:** With `ExtensionManager` and `CommandManager` in place, you can now write unit tests for `CommandManager` by passing mocked service instances to its constructor, verifying that commands are registered correctly and delegate to the right methods.
*   **Dependency Order:** Pay close attention to the order of instantiation in `ExtensionManager`. Services that are dependencies of others must be instantiated first. The current example follows a logical order based on the previous sub-sprint.
*   **`vscode.Disposable`:** Ensure that any objects that implement `vscode.Disposable` (like `WebviewPanel`s, `EventEmitter`s, `FileSystemWatcher`s, etc.) are properly disposed of by adding them to `context.subscriptions` or managing them within your `ExtensionManager`'s `disposables` array.
