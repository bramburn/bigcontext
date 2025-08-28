### Implementation Guidance: Sub-Sprint 2 - Extension & Command Managers

This guide provides detailed steps and code examples for verifying and refining the existing `ExtensionManager` and `CommandManager` classes, ensuring they fully align with the PRD requirements and integrate seamlessly with the `ConfigService` from Sub-Sprint 1.

**1. Verify `src/commandManager.ts`**

*   **Purpose**: To confirm that the `CommandManager` correctly centralizes command registration and delegates execution to the appropriate services.
*   **Implementation Details**: The `CommandManager` should already contain the logic for registering all extension commands and their respective handlers. Review the `registerCommands` method and each `handle...` method to ensure they correctly interact with `IndexingService` and `WebviewManager`.

```typescript
// src/commandManager.ts
import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';
import { WebviewManager } from './webviewManager';

export class CommandManager {
    private indexingService: IndexingService;
    private webviewManager: WebviewManager;

    constructor(indexingService: IndexingService, webviewManager: WebviewManager) {
        this.indexingService = indexingService;
        this.webviewManager = webviewManager;
    }

    registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        disposables.push(vscode.commands.registerCommand(
            'code-context-engine.openMainPanel',
            this.handleOpenMainPanel.bind(this)
        ));
        disposables.push(vscode.commands.registerCommand(
            'code-context-engine.startIndexing',
            this.handleStartIndexing.bind(this)
        ));
        disposables.push(vscode.commands.registerCommand(
            'code-context-engine.openSettings',
            this.handleOpenSettings.bind(this)
        ));
        disposables.push(vscode.commands.registerCommand(
            'code-context-engine.setupProject',
            this.handleSetupProject.bind(this)
        ));
        disposables.push(vscode.commands.registerCommand(
            'code-context-engine.openDiagnostics',
            this.handleOpenDiagnostics.bind(this)
        ));

        console.log('CommandManager: All commands registered successfully');
        return disposables;
    }

    private async handleOpenMainPanel(): Promise<void> {
        try {
            console.log('CommandManager: Opening main panel...');
            this.webviewManager.showMainPanel();
            console.log('CommandManager: Main panel opened successfully');
        } catch (error) {
            console.error('CommandManager: Failed to open main panel:', error);
            vscode.window.showErrorMessage('Failed to open Code Context Engine panel');
        }
    }

    private async handleStartIndexing(): Promise<void> {
        try {
            console.log('CommandManager: Starting indexing...');
            if (!this.indexingService) {
                throw new Error('IndexingService not available');
            }
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace folder is open. Please open a folder to index.');
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Code Context Engine',
                cancellable: false
            }, async (progress) => {
                progress.report({ message: 'Starting indexing process...' });
                const result = await this.indexingService.startIndexing((progressInfo) => {
                    const progressPercentage = (progressInfo.processedFiles / progressInfo.totalFiles) * 100;
                    progress.report({ 
                        message: `${progressInfo.currentPhase}: ${progressInfo.currentFile}`,
                        increment: progressPercentage
                    });
                });
                if (result.success) {
                    progress.report({ message: 'Indexing completed successfully!' });
                    vscode.window.showInformationMessage(
                        `Indexing completed! Processed ${result.processedFiles} files with ${result.chunks.length} code chunks.`
                    );
                } else {
                    throw new Error(`Indexing failed with ${result.errors.length} errors`);
                }
            });
            console.log('CommandManager: Indexing completed successfully');
        } catch (error) {
            console.error('CommandManager: Failed to start indexing:', error);
            vscode.window.showErrorMessage(`Failed to start indexing: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async handleOpenSettings(): Promise<void> {
        try {
            console.log('CommandManager: Opening native settings...');
            await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');
            console.log('CommandManager: Native settings opened successfully');
        } catch (error) {
            console.error('CommandManager: Failed to open settings:', error);
            vscode.window.showErrorMessage('Failed to open Code Context Engine settings');
        }
    }

    private async handleSetupProject(): Promise<void> {
        try {
            console.log('CommandManager: Starting project setup...');
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace folder is open. Please open a folder to setup.');
                return;
            }
            const setupChoice = await vscode.window.showInformationMessage(
                'Welcome to Code Context Engine! Would you like to start indexing your project?',
                'Start Indexing',
                'Configure Settings',
                'Cancel'
            );
            switch (setupChoice) {
                case 'Start Indexing':
                    await this.handleStartIndexing();
                    break;
                case 'Configure Settings':
                    await this.handleOpenSettings();
                    break;
                default:
                    console.log('CommandManager: Project setup cancelled');
                    break;
            }
            console.log('CommandManager: Project setup completed');
        } catch (error) {
            console.error('CommandManager: Failed to setup project:', error);
            vscode.window.showErrorMessage('Failed to setup Code Context Engine project');
        }
    }

    private async handleOpenDiagnostics(): Promise<void> {
        try {
            console.log('CommandManager: Opening diagnostics panel...');
            this.webviewManager.showDiagnosticsPanel();
            console.log('CommandManager: Diagnostics panel opened successfully');
        } catch (error) {
            console.error('CommandManager: Failed to open diagnostics panel:', error);
            vscode.window.showErrorMessage('Failed to open Code Context Engine diagnostics');
        }
    }
}
```

**2. Verify `src/extension.ts`**

*   **Purpose**: To confirm that `extension.ts` acts solely as the entry and exit point for the extension, delegating all core logic to `ExtensionManager`.
*   **Implementation Details**: Ensure the `activate` function primarily instantiates and initializes `ExtensionManager`, and the `deactivate` function handles its disposal. The file should remain concise (under 50 lines of code).

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { ExtensionManager } from './extensionManager';

class ExtensionStateManager {
    private static instance: ExtensionStateManager;
    private extensionManager: ExtensionManager | null = null;

    private constructor() {}

    static getInstance(): ExtensionStateManager {
        if (!ExtensionStateManager.instance) {
            ExtensionStateManager.instance = new ExtensionStateManager();
        }
        return ExtensionStateManager.instance;
    }

    setExtensionManager(manager: ExtensionManager): void {
        this.extensionManager = manager;
    }

    dispose(): void {
        if (this.extensionManager) {
            this.extensionManager.dispose();
            this.extensionManager = null;
        }
    }
}

const extensionState = ExtensionStateManager.getInstance();

export async function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "code-context-engine" is now active!');

    try {
        const manager = new ExtensionManager(context);
        await manager.initialize();
        extensionState.setExtensionManager(manager);
        console.log('ExtensionManager initialized successfully');
    } catch (error) {
        console.error('Failed to initialize ExtensionManager:', error);
        vscode.window.showErrorMessage('Code Context Engine failed to initialize. Please check the logs.');
        throw error;
    }
}

export function deactivate() {
    extensionState.dispose();
}
```

**3. Verify/Modify `src/extensionManager.ts`**

*   **Purpose**: To ensure `ExtensionManager` correctly instantiates all services with their dependencies, specifically passing the `ConfigService` instance to `ContextService` and `IndexingService`.
*   **Implementation Details**: Review the `initialize()` method. The key modification from Sub-Sprint 1 is to ensure that `this.configService` is passed as an argument to the constructors of `ContextService` and `IndexingService` when they are instantiated.

```typescript
// src/extensionManager.ts
import * as vscode from 'vscode';
import { ConfigService } from './configService';
import { QdrantService } from './db/qdrantService';
import { EmbeddingProviderFactory, IEmbeddingProvider } from './embeddings/embeddingProvider';
import { ContextService } from './context/contextService';
import { IndexingService } from './indexing/indexingService';
import { FileWalker } from './indexing/fileWalker';
import { AstParser } from './parsing/astParser';
import { Chunker } from './parsing/chunker';
import { LSPService } from './lsp/lspService';
import { FileSystemWatcherManager } from './fileSystemWatcherManager';
import { CommandManager } from './commandManager';
import { WebviewManager } from './webviewManager';
import { SearchManager } from './searchManager';
import { ConfigurationManager } from './configurationManager';
import { PerformanceManager } from './performanceManager';
import { StateManager } from './stateManager';
import { XmlFormatterService } from './formatting/XmlFormatterService';
import { StatusBarManager } from './statusBarManager';
import { HistoryManager } from './historyManager';

export class ExtensionManager {
    private context: vscode.ExtensionContext;
    private disposables: vscode.Disposable[] = [];

    private configService!: ConfigService;
    private qdrantService!: QdrantService;
    private embeddingProvider!: IEmbeddingProvider;
    private contextService!: ContextService;
    private indexingService!: IndexingService;
    private fileSystemWatcherManager!: FileSystemWatcherManager;

    private commandManager!: CommandManager;
    private webviewManager!: WebviewManager;
    private searchManager!: SearchManager;
    private configurationManager!: ConfigurationManager;
    private performanceManager!: PerformanceManager;
    private stateManager!: StateManager;
    private xmlFormatterService!: XmlFormatterService;
    private statusBarManager!: StatusBarManager;
    private historyManager!: HistoryManager;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async initialize(): Promise<void> {
        try {
            console.log('ExtensionManager: Starting service initialization...');

            this.stateManager = new StateManager();
            this.configService = new ConfigService();
            this.qdrantService = new QdrantService(this.configService.getQdrantConnectionString());
            this.embeddingProvider = await EmbeddingProviderFactory.createProviderFromConfigService(this.configService);

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri.fsPath;

                const fileWalker = new FileWalker(workspaceRoot);
                const astParser = new AstParser();
                const chunker = new Chunker();
                const lspService = new LSPService(workspaceRoot);

                // Pass configService to IndexingService
                this.indexingService = new IndexingService(
                    workspaceRoot,
                    fileWalker,
                    astParser,
                    chunker,
                    this.qdrantService,
                    this.embeddingProvider,
                    lspService,
                    this.stateManager,
                    this.configService // Pass configService here
                );

                // Pass configService to ContextService
                this.contextService = new ContextService(
                    workspaceRoot,
                    this.qdrantService,
                    this.embeddingProvider,
                    this.indexingService,
                    this.configService // Pass configService here
                );

                this.fileSystemWatcherManager = new FileSystemWatcherManager(this.indexingService);
                await this.fileSystemWatcherManager.initialize();
                this.disposables.push(this.fileSystemWatcherManager);
            } else {
                console.warn('ExtensionManager: No workspace folder found, some services not initialized');
            }

            this.performanceManager = new PerformanceManager();
            this.configurationManager = new ConfigurationManager(this.configService);
            this.xmlFormatterService = new XmlFormatterService();
            this.searchManager = new SearchManager(this.contextService);
            this.webviewManager = new WebviewManager(); 

            this.commandManager = new CommandManager(this.indexingService, this.webviewManager);
            const commandDisposables = this.commandManager.registerCommands();
            this.disposables.push(...commandDisposables);

            this.statusBarManager = new StatusBarManager(this.context, this.stateManager);
            this.disposables.push(this.statusBarManager);

            this.historyManager = new HistoryManager(this.context);
            this.disposables.push(this.historyManager);

            console.log('ExtensionManager: All services initialized successfully');

        } catch (error) {
            console.error('ExtensionManager: Failed to initialize services:', error);
            throw error;
        }
    }

    dispose(): void {
        console.log('ExtensionManager: Starting disposal...');

        if (this.statusBarManager) {
            this.statusBarManager.dispose();
        }

        if (this.webviewManager) {
            this.webviewManager.dispose();
        }

        if (this.searchManager) {
            this.searchManager.dispose();
        }

        if (this.configurationManager) {
            this.configurationManager.dispose();
        }

        if (this.performanceManager) {
            this.performanceManager.dispose();
        }

        if (this.stateManager) {
            this.stateManager.dispose();
        }

        this.disposables.forEach(disposable => {
            try {
                disposable.dispose();
            } catch (error) {
                console.error('ExtensionManager: Error disposing resource:', error);
            }
        });

        this.disposables = [];
        console.log('ExtensionManager: Disposal completed');
    }

    getConfigService(): ConfigService {
        return this.configService;
    }

    getQdrantService(): QdrantService {
        return this.qdrantService;
    }

    getEmbeddingProvider(): IEmbeddingProvider {
        return this.embeddingProvider;
    }

    getContextService(): ContextService {
        return this.contextService;
    }

    getIndexingService(): IndexingService {
        return this.indexingService;
    }

    getCommandManager(): CommandManager {
        return this.commandManager;
    }

    getWebviewManager(): WebviewManager {
        return this.webviewManager;
    }

    getSearchManager(): SearchManager {
        return this.searchManager;
    }

    getConfigurationManager(): ConfigurationManager {
        return this.configurationManager;
    }

    getPerformanceManager(): PerformanceManager {
        return this.performanceManager;
    }

    getStateManager(): StateManager {
        return this.stateManager;
    }

    getXmlFormatterService(): XmlFormatterService {
        return this.xmlFormatterService;
    }

    getHistoryManager(): HistoryManager {
        return this.historyManager;
    }

    getFileSystemWatcherManager(): FileSystemWatcherManager {
        return this.fileSystemWatcherManager;
    }

    getContext(): vscode.ExtensionContext {
        return this.context;
    }
}
```
