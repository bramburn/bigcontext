### User Story 1: Create ExtensionManager
**As Alisha, I want to** introduce an `ExtensionManager` to handle the extension's lifecycle, **so that** `extension.ts` becomes a simple entry point.

**Actions to Undertake:**
1.  **Filepath**: `src/extensionManager.ts` (New File)
    -   **Action**: Create a new `ExtensionManager` class. Its constructor will instantiate all services (using the DI pattern from Sub-Sprint 1) and managers. It will also have an `initialize` method and a `dispose` method.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { ConfigService } from './configService';
        import { QdrantService } from './db/qdrantService';
        import { createEmbeddingProvider } from './embeddings/embeddingProvider';
        import { ContextService } from './context/contextService';
        import { IndexingService } from './indexing/indexingService';
        import { FileWalker } from './indexing/fileWalker';
        import { AstParser } from './parsing/astParser';
        import { Chunker } from './parsing/chunker';
        import { LspService } from './lsp/lspService';
        import { CommandManager } from './commandManager'; // Will be created in next step

        export class ExtensionManager implements vscode.Disposable {
            private configService: ConfigService;
            private qdrantService: QdrantService;
            private embeddingProvider: IEmbeddingProvider;
            private contextService: ContextService;
            private indexingService: IndexingService;
            private commandManager: CommandManager;

            private disposables: vscode.Disposable[] = [];

            constructor(private context: vscode.ExtensionContext) {
                // Instantiate ConfigService
                this.configService = new ConfigService();

                // Instantiate QdrantService
                this.qdrantService = new QdrantService(this.configService.getQdrantConnectionString());

                // Instantiate EmbeddingProvider
                this.embeddingProvider = createEmbeddingProvider('ollama', this.configService); // Example, choose based on config

                // Instantiate ContextService
                this.contextService = new ContextService(this.qdrantService, this.embeddingProvider);

                // Instantiate other core dependencies
                const fileWalker = new FileWalker();
                const astParser = new AstParser();
                const chunker = new Chunker();
                const lspService = new LspService();

                // Instantiate IndexingService
                this.indexingService = new IndexingService(
                    fileWalker,
                    astParser,
                    chunker,
                    this.qdrantService,
                    this.embeddingProvider,
                    lspService
                );

                // Instantiate CommandManager (pass services it needs)
                this.commandManager = new CommandManager(this.indexingService /*, other services as needed */);
            }

            public initialize(): void {
                // Register commands
                this.disposables.push(...this.commandManager.registerCommands());

                // Add all disposables to the extension context
                this.context.subscriptions.push(...this.disposables);
            }

            public dispose(): void {
                this.disposables.forEach(d => d.dispose());
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode'; import { ConfigService } from './configService'; import { QdrantService } from './db/qdrantService'; import { createEmbeddingProvider, IEmbeddingProvider } from './embeddings/embeddingProvider'; import { ContextService } from './context/contextService'; import { IndexingService } from './indexing/indexingService'; import { FileWalker } from './indexing/fileWalker'; import { AstParser } from './parsing/astParser'; import { Chunker } from './parsing/chunker'; import { LspService } from './lsp/lspService'; import { CommandManager } from './commandManager';`

### User Story 2: Create CommandManager
**As Alisha, I want to** create a `CommandManager` to handle all command registrations, **so that** this logic is decoupled from the main activation file.

**Actions to Undertake:**
1.  **Filepath**: `src/commandManager.ts` (New File)
    -   **Action**: Create a new `CommandManager` class. It should have a constructor that accepts the necessary services (e.g., `IndexingService`) and a `registerCommands` method that returns an array of `vscode.Disposable`.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { IndexingService } from './indexing/indexingService';

        export class CommandManager {
            constructor(private indexingService: IndexingService) {}

            public registerCommands(): vscode.Disposable[] {
                const disposables: vscode.Disposable[] = [];

                disposables.push(
                    vscode.commands.registerCommand('code-context-engine.openMainPanel', () => {
                        // This will be handled by WebviewManager in Sub-Sprint 3
                        vscode.window.showInformationMessage('Open Main Panel (placeholder)');
                    }),
                    vscode.commands.registerCommand('code-context-engine.startIndexing', () => {
                        this.indexingService.startIndexing();
                        vscode.window.showInformationMessage('Indexing started!');
                    }),
                    vscode.commands.registerCommand('code-context-engine.openSettings', () => {
                        // This will be handled by WebviewManager in Sub-Sprint 3
                        vscode.window.showInformationMessage('Open Settings (placeholder)');
                    })
                );

                return disposables;
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode'; import { IndexingService } from './indexing/indexingService';`
2.  **Filepath**: `src/extension.ts`
    -   **Action**: Refactor `extension.ts` to simplify `activate` to only create and initialize an `ExtensionManager`. The `deactivate` function should call `extensionManager.dispose()`.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { ExtensionManager } from './extensionManager';

        let extensionManager: ExtensionManager;

        export function activate(context: vscode.ExtensionContext) {
            extensionManager = new ExtensionManager(context);
            extensionManager.initialize();
            console.log('Code Context Engine extension activated.');
        }

        export function deactivate() {
            if (extensionManager) {
                extensionManager.dispose();
            }
            console.log('Code Context Engine extension deactivated.');
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode'; import { ExtensionManager } from './extensionManager';`

**Acceptance Criteria:**
- The `extension.ts` file is less than 50 lines of code.
- All previously functional commands are still registered and work correctly.
- The extension activates and deactivates cleanly without errors.

**Testing Plan:**
- **Test Case 1**: Install and activate the extension. Verify that the `activate` and `deactivate` console logs appear correctly.
- **Test Case 2**: Execute each of the registered commands (`code-context-engine.openMainPanel`, `code-context-engine.startIndexing`, `code-context-engine.openSettings`) from the VS Code Command Palette. Verify that the corresponding placeholder messages or actions are triggered.
- **Test Case 3**: Reload the VS Code window multiple times to ensure clean activation and deactivation without memory leaks or errors.
- **Test Case 4**: Verify that `extension.ts` contains only the `activate` and `deactivate` functions and the `ExtensionManager` instantiation, and its line count is below 50 lines.
