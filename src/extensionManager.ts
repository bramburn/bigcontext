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
import { CommandManager } from './commandManager';
import { WebviewManager } from './webviewManager';
import { SearchManager } from './searchManager';
import { ConfigurationManager } from './configurationManager';
import { PerformanceManager } from './performanceManager';
import { StateManager } from './stateManager';
import { XmlFormatterService } from './formatting/XmlFormatterService';

/**
 * ExtensionManager class responsible for managing the lifecycle of all core services
 * and coordinating the initialization and disposal of the extension.
 * 
 * This class serves as the main orchestrator for the extension, handling:
 * - Service initialization with dependency injection
 * - Command registration through CommandManager
 * - Resource cleanup and disposal
 * - Error handling during initialization
 */
export class ExtensionManager {
    private context: vscode.ExtensionContext;
    private disposables: vscode.Disposable[] = [];

    // Core services
    private configService!: ConfigService;
    private qdrantService!: QdrantService;
    private embeddingProvider!: IEmbeddingProvider;
    private contextService!: ContextService;
    private indexingService!: IndexingService;

    // Managers
    private commandManager!: CommandManager;
    private webviewManager!: WebviewManager;
    private searchManager!: SearchManager;
    private configurationManager!: ConfigurationManager;
    private performanceManager!: PerformanceManager;
    private stateManager!: StateManager;
    private xmlFormatterService!: XmlFormatterService;

    /**
     * Creates a new ExtensionManager instance
     * @param context - The VS Code extension context
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Initializes all core services and managers using dependency injection
     * This method sets up the entire extension architecture
     */
    async initialize(): Promise<void> {
        try {
            console.log('ExtensionManager: Starting service initialization...');

            // Step 1: Initialize StateManager first (no dependencies)
            this.stateManager = new StateManager();
            console.log('ExtensionManager: StateManager initialized');

            // Step 2: Initialize ConfigService (no dependencies)
            this.configService = new ConfigService();
            console.log('ExtensionManager: ConfigService initialized');

            // Step 3: Initialize QdrantService with configuration
            this.qdrantService = new QdrantService(this.configService.getQdrantConnectionString());
            console.log('ExtensionManager: QdrantService initialized');

            // Step 4: Initialize EmbeddingProvider using factory and configuration
            this.embeddingProvider = await EmbeddingProviderFactory.createProviderFromConfigService(this.configService);
            console.log('ExtensionManager: EmbeddingProvider initialized');

            // Step 5: Initialize workspace-dependent services
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri.fsPath;

                // Create all dependencies for IndexingService
                const fileWalker = new FileWalker(workspaceRoot);
                const astParser = new AstParser();
                const chunker = new Chunker();
                const lspService = new LSPService(workspaceRoot);

                // Initialize IndexingService with all dependencies including StateManager
                this.indexingService = new IndexingService(
                    workspaceRoot,
                    fileWalker,
                    astParser,
                    chunker,
                    this.qdrantService,
                    this.embeddingProvider,
                    lspService,
                    this.stateManager
                );
                console.log('ExtensionManager: IndexingService initialized');

                // Initialize ContextService with dependencies
                this.contextService = new ContextService(
                    workspaceRoot,
                    this.qdrantService,
                    this.embeddingProvider,
                    this.indexingService
                );
                console.log('ExtensionManager: ContextService initialized');
            } else {
                console.warn('ExtensionManager: No workspace folder found, some services not initialized');
            }

            // Step 6: Initialize PerformanceManager
            this.performanceManager = new PerformanceManager();
            console.log('ExtensionManager: PerformanceManager initialized');

            // Step 7: Initialize ConfigurationManager
            this.configurationManager = new ConfigurationManager(this.configService);
            console.log('ExtensionManager: ConfigurationManager initialized');

            // Step 8: Initialize XmlFormatterService
            this.xmlFormatterService = new XmlFormatterService();
            console.log('ExtensionManager: XmlFormatterService initialized');

            // Step 9: Initialize SearchManager
            this.searchManager = new SearchManager(this.contextService);
            console.log('ExtensionManager: SearchManager initialized');

            // Step 10: Initialize WebviewManager with StateManager
            this.webviewManager = new WebviewManager(this.context, this, this.stateManager);
            console.log('ExtensionManager: WebviewManager initialized');

            // Step 10.1: Register WebviewViewProvider for sidebar integration
            const webviewViewProviderDisposable = vscode.window.registerWebviewViewProvider(
                WebviewManager.viewType,
                this.webviewManager
            );
            this.disposables.push(webviewViewProviderDisposable);
            console.log('ExtensionManager: WebviewViewProvider registered for sidebar');

            // Step 11: Initialize CommandManager and register commands
            this.commandManager = new CommandManager(this.indexingService, this.webviewManager);
            const commandDisposables = this.commandManager.registerCommands();
            this.disposables.push(...commandDisposables);
            console.log('ExtensionManager: CommandManager initialized and commands registered');

            console.log('ExtensionManager: All services initialized successfully');

        } catch (error) {
            console.error('ExtensionManager: Failed to initialize services:', error);
            throw error;
        }
    }

    /**
     * Disposes of all resources and cleans up services
     * This method should be called when the extension is deactivated
     */
    dispose(): void {
        console.log('ExtensionManager: Starting disposal...');

        // Dispose of managers in reverse order
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

        // Dispose of all registered disposables
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

    /**
     * Gets the ConfigService instance
     * @returns The ConfigService instance
     */
    getConfigService(): ConfigService {
        return this.configService;
    }

    /**
     * Gets the QdrantService instance
     * @returns The QdrantService instance
     */
    getQdrantService(): QdrantService {
        return this.qdrantService;
    }

    /**
     * Gets the EmbeddingProvider instance
     * @returns The EmbeddingProvider instance
     */
    getEmbeddingProvider(): IEmbeddingProvider {
        return this.embeddingProvider;
    }

    /**
     * Gets the ContextService instance
     * @returns The ContextService instance
     */
    getContextService(): ContextService {
        return this.contextService;
    }

    /**
     * Gets the IndexingService instance
     * @returns The IndexingService instance
     */
    getIndexingService(): IndexingService {
        return this.indexingService;
    }

    /**
     * Gets the CommandManager instance
     * @returns The CommandManager instance
     */
    getCommandManager(): CommandManager {
        return this.commandManager;
    }

    /**
     * Gets the WebviewManager instance
     * @returns The WebviewManager instance
     */
    getWebviewManager(): WebviewManager {
        return this.webviewManager;
    }

    /**
     * Gets the SearchManager instance
     * @returns The SearchManager instance
     */
    getSearchManager(): SearchManager {
        return this.searchManager;
    }

    /**
     * Gets the ConfigurationManager instance
     * @returns The ConfigurationManager instance
     */
    getConfigurationManager(): ConfigurationManager {
        return this.configurationManager;
    }

    /**
     * Gets the PerformanceManager instance
     * @returns The PerformanceManager instance
     */
    getPerformanceManager(): PerformanceManager {
        return this.performanceManager;
    }

    /**
     * Gets the StateManager instance
     * @returns The StateManager instance
     */
    getStateManager(): StateManager {
        return this.stateManager;
    }

    /**
     * Gets the XmlFormatterService instance
     * @returns The XmlFormatterService instance
     */
    getXmlFormatterService(): XmlFormatterService {
        return this.xmlFormatterService;
    }

    /**
     * Gets the VS Code extension context
     * @returns The extension context
     */
    getContext(): vscode.ExtensionContext {
        return this.context;
    }
}
