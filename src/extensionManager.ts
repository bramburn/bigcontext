// VS Code API imports
import * as vscode from 'vscode';

// Core service imports
import { ConfigService } from './configService';
import { CentralizedLoggingService } from './logging/centralizedLoggingService';
import { NotificationService } from './notifications/notificationService';
import { QdrantService } from './db/qdrantService';
import { EmbeddingProviderFactory, IEmbeddingProvider } from './embeddings/embeddingProvider';
import { ContextService } from './context/contextService';
import { IndexingService } from './indexing/indexingService';

// Supporting service imports for indexing
import { FileWalker } from './indexing/fileWalker';
import { AstParser } from './parsing/astParser';
import { Chunker } from './parsing/chunker';
import { LSPService } from './lsp/lspService';
import { FileSystemWatcherManager } from './fileSystemWatcherManager';
import { WorkspaceManager } from './workspaceManager';

// Manager imports
import { CommandManager } from './commandManager';
import { WebviewManager } from './webviewManager';
import { SearchManager } from './searchManager';
import { ConfigurationManager } from './configurationManager';
import { PerformanceManager } from './performanceManager';
import { StateManager } from './stateManager';
import { XmlFormatterService } from './formatting/XmlFormatterService';
import { StatusBarManager } from './statusBarManager';
import { HistoryManager } from './historyManager';

/**
 * ExtensionManager class responsible for managing the lifecycle of all core services
 * and coordinating the initialization and disposal of the extension.
 * 
 * This class serves as the main orchestrator for the extension, handling:
 * - Service initialization with dependency injection
 * - Command registration through CommandManager
 * - Resource cleanup and disposal
 * - Error handling during initialization
 * 
 * The ExtensionManager follows a dependency injection pattern, ensuring that services
 * are initialized in the correct order based on their dependencies. It acts as the
 * central point of access to all core services and managers throughout the extension.
 */
export class ExtensionManager {
    private context: vscode.ExtensionContext;
    private disposables: vscode.Disposable[] = [];

    // Core services - fundamental services that provide core functionality
    private configService!: ConfigService;
    private loggingService!: CentralizedLoggingService;
    private notificationService!: NotificationService;
    private qdrantService!: QdrantService;
    private embeddingProvider!: IEmbeddingProvider;
    private contextService!: ContextService;
    private indexingService!: IndexingService;
    private fileSystemWatcherManager!: FileSystemWatcherManager;
    private workspaceManager!: WorkspaceManager;

    // Managers - services that manage specific aspects of the extension
    private commandManager!: CommandManager;
    private webviewManager!: WebviewManager;
    private searchManager!: SearchManager;
    private configurationManager!: ConfigurationManager;
    private performanceManager!: PerformanceManager;
    private stateManager!: StateManager;
    private xmlFormatterService!: XmlFormatterService;
    private statusBarManager!: StatusBarManager;
    private historyManager!: HistoryManager;

    /**
     * Creates a new ExtensionManager instance
     * @param context - The VS Code extension context providing access to extension APIs
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        // Note: All services are initialized in the initialize() method to allow for async initialization
    }

    /**
     * Initializes all core services and managers using dependency injection
     * This method sets up the entire extension architecture in a specific order
     * to ensure dependencies are available when needed.
     * 
     * The initialization follows a specific order:
     * 1. Services with no dependencies (StateManager, ConfigService)
     * 2. Services that depend on basic configuration (QdrantService, EmbeddingProvider)
     * 3. Workspace-dependent services (IndexingService, ContextService)
     * 4. UI and management services (PerformanceManager, ConfigurationManager, etc.)
     * 5. User interface services (WebviewManager, CommandManager, StatusBarManager)
     * 
     * @throws Error if any service fails to initialize
     */
    async initialize(): Promise<void> {
        try {
            console.log('ExtensionManager: Starting service initialization...');

            // Step 1: Initialize StateManager first (no dependencies)
            // StateManager must be initialized first as it manages the extension's state
            // and may be needed by other services during their initialization
            this.stateManager = new StateManager();
            console.log('ExtensionManager: StateManager initialized');

            // Step 1.1: Initialize WorkspaceManager (no dependencies)
            // WorkspaceManager handles multi-workspace support and workspace switching
            this.workspaceManager = new WorkspaceManager(this.loggingService);

            // Set up workspace change listener to handle workspace switching
            const workspaceChangeDisposable = this.workspaceManager.onWorkspaceChanged((workspace) => {
                console.log(`ExtensionManager: Workspace changed to: ${workspace?.name || 'none'}`);
                // Notify other services about workspace change if needed
                // The IndexingService will automatically use the new workspace for collection naming
                
                // Notify webview about workspace change
                if (this.webviewManager) {
                    this.webviewManager.updateWorkspaceState(!!workspace);
                }
            });
            this.disposables.push(workspaceChangeDisposable);

            console.log('ExtensionManager: WorkspaceManager initialized');

            // Step 2: Initialize ConfigService (no dependencies)
            // ConfigService provides configuration settings needed by other services
            this.configService = new ConfigService();
            console.log('ExtensionManager: ConfigService initialized');

            // Step 2.1: Initialize CentralizedLoggingService (depends on ConfigService)
            // CentralizedLoggingService provides unified logging for all other services
            this.loggingService = new CentralizedLoggingService(this.configService);
            this.disposables.push(this.loggingService);
            this.loggingService.info('CentralizedLoggingService initialized', {}, 'ExtensionManager');

            // Step 2.2: Initialize NotificationService (depends on CentralizedLoggingService)
            // NotificationService provides standardized user notifications with logging integration
            this.notificationService = new NotificationService(this.loggingService);
            this.loggingService.info('NotificationService initialized', {}, 'ExtensionManager');

            // Step 3: Initialize QdrantService with configuration
            // QdrantService requires the database connection string from ConfigService and logging service
            this.qdrantService = new QdrantService(this.configService.getQdrantConnectionString(), this.loggingService);
            this.loggingService.info('QdrantService initialized', {}, 'ExtensionManager');

            // Step 4: Initialize EmbeddingProvider using factory and configuration
            // EmbeddingProvider is created asynchronously using the factory pattern
            // and depends on configuration settings from ConfigService
            this.embeddingProvider = await EmbeddingProviderFactory.createProviderFromConfigService(this.configService);
            this.loggingService.info('EmbeddingProvider initialized', {}, 'ExtensionManager');

            // Step 5: Initialize workspace-dependent services
            // These services require a workspace folder to function properly
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri.fsPath;

                // Create all dependencies for IndexingService
                // These services are used internally by IndexingService and don't need to be stored as class properties
                const fileWalker = new FileWalker(workspaceRoot);
                const astParser = new AstParser();
                const chunker = new Chunker();
                const lspService = new LSPService(workspaceRoot, this.loggingService);

                // Initialize IndexingService with all dependencies including StateManager, WorkspaceManager, ConfigService, and LoggingService
                // IndexingService coordinates file indexing, parsing, and storage in the vector database
                this.indexingService = new IndexingService(
                    workspaceRoot,
                    fileWalker,
                    astParser,
                    chunker,
                    this.qdrantService,
                    this.embeddingProvider,
                    lspService,
                    this.stateManager,
                    this.workspaceManager,
                    this.configService,
                    this.loggingService
                );
                this.loggingService.info('ExtensionManager: IndexingService initialized');

                // Initialize ContextService with dependencies including LoggingService
                // ContextService provides context-aware functionality and search capabilities
                this.contextService = new ContextService(
                    workspaceRoot,
                    this.qdrantService,
                    this.embeddingProvider,
                    this.indexingService,
                    this.configService,
                    this.loggingService
                );
                this.loggingService.info('ExtensionManager: ContextService initialized');

                // Initialize FileSystemWatcherManager for automatic indexing
                // FileSystemWatcherManager monitors file changes and keeps the index up-to-date
                // It depends on IndexingService for performing incremental updates
                this.fileSystemWatcherManager = new FileSystemWatcherManager(this.indexingService);
                await this.fileSystemWatcherManager.initialize();
                this.disposables.push(this.fileSystemWatcherManager);
                this.loggingService.info('FileSystemWatcherManager initialized', {}, 'ExtensionManager');
            } else {
                this.loggingService.warn('No workspace folder found, some services not initialized', {}, 'ExtensionManager');
            }

            // Step 6: Initialize PerformanceManager
            // PerformanceManager tracks and monitors extension performance metrics
            this.performanceManager = new PerformanceManager();
            console.log('ExtensionManager: PerformanceManager initialized');

            // Step 7: Initialize ConfigurationManager
            // ConfigurationManager handles dynamic configuration changes and updates
            this.configurationManager = new ConfigurationManager(this.configService);
            console.log('ExtensionManager: ConfigurationManager initialized');

            // Step 8: Initialize XmlFormatterService
            // XmlFormatterService provides XML formatting capabilities for search results
            this.xmlFormatterService = new XmlFormatterService();
            console.log('ExtensionManager: XmlFormatterService initialized');

            // Step 9: Initialize SearchManager
            // SearchManager coordinates search operations across the codebase
            // Depends on ContextService, ConfigService, LoggingService, and NotificationService
            this.searchManager = new SearchManager(this.contextService, this.configService, this.loggingService, this.notificationService);
            this.loggingService.info('SearchManager initialized', {}, 'ExtensionManager');

            // Step 10: Initialize WebviewManager
            // WebviewManager handles the UI webview and user interactions
            // Pass the extension context, ExtensionManager, and required services
            this.webviewManager = new WebviewManager(this.context, this, this.loggingService, this.notificationService);
            this.loggingService.info('WebviewManager initialized', {}, 'ExtensionManager');

            // Step 11: Initialize CommandManager and register commands
            // CommandManager handles all extension commands and their execution
            // Depends on IndexingService, WebviewManager, and NotificationService for command functionality
            this.commandManager = new CommandManager(this.indexingService, this.webviewManager, this.notificationService);
            const commandDisposables = this.commandManager.registerCommands();
            this.disposables.push(...commandDisposables);
            this.loggingService.info('CommandManager initialized and commands registered', {}, 'ExtensionManager');

            // Step 12: Initialize StatusBarManager
            // StatusBarManager manages the status bar items and their visibility
            // Requires logging and notification services, with optional context and StateManager
            this.statusBarManager = new StatusBarManager(this.loggingService, this.notificationService, this.context, this.stateManager);
            this.disposables.push(this.statusBarManager);
            this.loggingService.info('StatusBarManager initialized', {}, 'ExtensionManager');

            // Step 13: Initialize HistoryManager
            // HistoryManager tracks user search history and interactions
            // Requires the extension context for persistent storage
            this.historyManager = new HistoryManager(this.context);
            this.disposables.push(this.historyManager);
            console.log('ExtensionManager: HistoryManager initialized');

            this.loggingService.info('All services initialized successfully', {}, 'ExtensionManager');

        } catch (error) {
            // Use console.error here since logging service might not be available if initialization failed
            console.error('ExtensionManager: Failed to initialize services:', error);
            throw error;
        }
    }

    /**
     * Disposes of all resources and cleans up services
     * This method should be called when the extension is deactivated
     *
     * The disposal follows the reverse order of initialization to ensure
     * that services are properly cleaned up and no dangling references remain.
     * Each service is checked for existence before disposal to handle cases
     * where initialization may have failed partially.
     */
    dispose(): void {
        console.log('ExtensionManager: Starting disposal...');

        // Dispose of managers in reverse order of initialization
        // This ensures that services with dependencies are disposed first

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

        // Cleanup IndexingService worker threads before disposing StateManager
        if (this.indexingService) {
            this.indexingService.cleanup().catch(error => {
                console.error('ExtensionManager: Error cleaning up IndexingService:', error);
            });
        }

        if (this.stateManager) {
            this.stateManager.dispose();
        }

        // Dispose of all registered disposables
        // This includes command registrations, event listeners, and other VS Code resources
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
     * @returns The ConfigService instance that manages extension configuration
     */
    getConfigService(): ConfigService {
        return this.configService;
    }

    /**
     * Gets the QdrantService instance
     * @returns The QdrantService instance that handles vector database operations
     */
    getQdrantService(): QdrantService {
        return this.qdrantService;
    }

    /**
     * Gets the EmbeddingProvider instance
     * @returns The EmbeddingProvider instance that generates text embeddings
     */
    getEmbeddingProvider(): IEmbeddingProvider {
        return this.embeddingProvider;
    }

    /**
     * Gets the ContextService instance
     * @returns The ContextService instance that provides context-aware functionality
     */
    getContextService(): ContextService {
        return this.contextService;
    }

    /**
     * Gets the IndexingService instance
     * @returns The IndexingService instance that handles file indexing and processing
     */
    getIndexingService(): IndexingService {
        return this.indexingService;
    }

    /**
     * Gets the CommandManager instance
     * @returns The CommandManager instance that manages extension commands
     */
    getCommandManager(): CommandManager {
        return this.commandManager;
    }

    /**
     * Gets the WebviewManager instance
     * @returns The WebviewManager instance that handles the UI webview
     */
    getWebviewManager(): WebviewManager {
        return this.webviewManager;
    }

    /**
     * Gets the SearchManager instance
     * @returns The SearchManager instance that coordinates search operations
     */
    getSearchManager(): SearchManager {
        return this.searchManager;
    }

    /**
     * Gets the ConfigurationManager instance
     * @returns The ConfigurationManager instance that handles dynamic configuration
     */
    getConfigurationManager(): ConfigurationManager {
        return this.configurationManager;
    }

    /**
     * Gets the PerformanceManager instance
     * @returns The PerformanceManager instance that tracks performance metrics
     */
    getPerformanceManager(): PerformanceManager {
        return this.performanceManager;
    }

    /**
     * Gets the StateManager instance
     * @returns The StateManager instance that manages extension state
     */
    getStateManager(): StateManager {
        return this.stateManager;
    }

    /**
     * Gets the XmlFormatterService instance
     * @returns The XmlFormatterService instance that formats XML output
     */
    getXmlFormatterService(): XmlFormatterService {
        return this.xmlFormatterService;
    }

    /**
     * Gets the HistoryManager instance
     * @returns The HistoryManager instance that tracks user history
     */
    getHistoryManager(): HistoryManager {
        return this.historyManager;
    }

    /**
     * Gets the FileSystemWatcherManager instance
     * @returns The FileSystemWatcherManager instance that monitors file changes
     */
    getFileSystemWatcherManager(): FileSystemWatcherManager {
        return this.fileSystemWatcherManager;
    }

    /**
     * Gets the VS Code extension context
     * @returns The extension context providing access to VS Code APIs
     */
    getContext(): vscode.ExtensionContext {
        return this.context;
    }

    /**
     * Gets the WorkspaceManager instance
     * @returns The WorkspaceManager instance that handles multi-workspace support
     */
    getWorkspaceManager(): WorkspaceManager {
        return this.workspaceManager;
    }
}
