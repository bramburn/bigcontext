import * as vscode from 'vscode';
import { ContextService, ContextQuery, RelatedFile } from './context/contextService';
import { IndexingService } from './indexing/indexingService';
import { SearchManager, SearchFilters } from './searchManager';
import { ConfigurationManager as LegacyConfigurationManager } from './configurationManager';
import { PerformanceManager } from './performanceManager';
import { SystemValidator } from './validation/systemValidator';
import { TroubleshootingSystem } from './validation/troubleshootingGuide';
import { ConfigurationManager } from './configuration/configurationManager';
import { StateManager } from './stateManager';
import { XmlFormatterService } from './formatting/XmlFormatterService';
import { WorkspaceManager } from './workspaceManager';

/**
 * MessageRouter - Central message handling system for VS Code extension webview communication
 *
 * This file implements the core message routing logic that facilitates communication between
 * the extension's webview UI and the backend services. It acts as the central hub for all
 * webview-to-extension communication, providing a clean separation of concerns and ensuring
 * type-safe message handling.
 *
 * Key responsibilities:
 * - Route incoming webview messages to appropriate handlers
 * - Integrate with various backend services (ContextService, IndexingService, etc.)
 * - Handle database operations (Qdrant, ChromaDB, Pinecone)
 * - Manage configuration and state operations
 * - Provide search and context query functionality
 * - Handle error responses and logging
 *
 * Architecture:
 * The MessageRouter follows a command pattern where each message type has a dedicated handler
 * method. This approach ensures maintainability and makes it easy to add new message types
 * without modifying the core routing logic.
 */
export class MessageRouter {
    private contextService: ContextService;
    private indexingService: IndexingService;
    private searchManager?: SearchManager;
    private legacyConfigurationManager?: LegacyConfigurationManager;
    private performanceManager?: PerformanceManager;
    private context: vscode.ExtensionContext;
    private systemValidator: SystemValidator;
    private troubleshootingSystem: TroubleshootingSystem;
    private configurationManager: ConfigurationManager;
    private stateManager: StateManager;
    private xmlFormatterService?: XmlFormatterService;
    private workspaceManager?: WorkspaceManager;

    /**
     * Constructs a new MessageRouter instance with core services
     *
     * @param contextService - Service for handling context-related operations (file content, related files, etc.)
     * @param indexingService - Service for managing document indexing operations
     * @param context - VS Code extension context providing access to extension APIs and storage
     * @param stateManager - Service for managing extension state and persistence
     */
    constructor(contextService: ContextService, indexingService: IndexingService, context: vscode.ExtensionContext, stateManager: StateManager) {
        this.contextService = contextService;
        this.indexingService = indexingService;
        this.context = context;
        this.stateManager = stateManager;
        this.systemValidator = new SystemValidator(context);
        this.troubleshootingSystem = new TroubleshootingSystem();
        this.configurationManager = new ConfigurationManager(context);
    }

    /**
     * Sets up advanced managers for enhanced functionality
     *
     * This method is called after initial construction to provide access to optional
     * advanced services that may not be available during initial startup or may require
     * additional initialization.
     *
     * @param searchManager - Advanced search management service with filtering and suggestions
     * @param legacyConfigurationManager - Legacy configuration management service
     * @param performanceManager - Performance monitoring and metrics collection service
     * @param xmlFormatterService - XML formatting and processing service
     */
    setAdvancedManagers(
        searchManager: SearchManager,
        legacyConfigurationManager: LegacyConfigurationManager,
        performanceManager: PerformanceManager,
        xmlFormatterService: XmlFormatterService
    ): void {
        this.searchManager = searchManager;
        this.legacyConfigurationManager = legacyConfigurationManager;
        this.performanceManager = performanceManager;
        this.xmlFormatterService = xmlFormatterService;
        console.log('MessageRouter: Advanced managers set');
    }

    /**
     * Main message entry point - routes incoming webview messages to appropriate handlers
     *
     * This method serves as the central dispatcher for all webview communications. It implements
     * a try-catch pattern to ensure that errors in individual handlers don't crash the entire
     * message processing system.
     *
     * @param message - The incoming message object from the webview, must contain a 'command' property
     * @param webview - The VS Code webview instance that sent the message, used for responses
     */
    async handleMessage(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling message:', message.command);

            // Route message to appropriate handler based on command type
            switch (message.command) {
                case 'ping':
                    await this.handlePing(message, webview);
                    break;
                case 'checkSetupStatus':
                    await this.handleCheckSetupStatus(message, webview);
                    break;
                case 'startDatabase':
                    await this.handleStartDatabase(message, webview);
                    break;
                case 'validateDatabase':
                    await this.handleValidateDatabase(message, webview);
                    break;
                case 'saveSecretValue':
                    await this.handleSaveSecretValue(message, webview);
                    break;
                case 'getSecretValue':
                    await this.handleGetSecretValue(message, webview);
                    break;
                case 'runSystemValidation':
                    await this.handleRunSystemValidation(message, webview);
                    break;
                case 'getTroubleshootingGuides':
                    await this.handleGetTroubleshootingGuides(message, webview);
                    break;
                case 'runAutoFix':
                    await this.handleRunAutoFix(message, webview);
                    break;
                case 'openTroubleshootingGuide':
                    await this.handleOpenTroubleshootingGuide(message, webview);
                    break;
                case 'exportConfiguration':
                    await this.handleExportConfiguration(message, webview);
                    break;
                case 'importConfiguration':
                    await this.handleImportConfiguration(message, webview);
                    break;
                case 'getConfigurationTemplates':
                    await this.handleGetConfigurationTemplates(message, webview);
                    break;
                case 'getConfigurationBackups':
                    await this.handleGetConfigurationBackups(message, webview);
                    break;
                case 'validateConfiguration':
                    await this.handleValidateConfiguration(message, webview);
                    break;
                case 'applyConfigurationTemplate':
                    await this.handleApplyConfigurationTemplate(message, webview);
                    break;
                case 'createConfigurationBackup':
                    await this.handleCreateConfigurationBackup(message, webview);
                    break;
                case 'restoreConfigurationBackup':
                    await this.handleRestoreConfigurationBackup(message, webview);
                    break;
                case 'getFileContent':
                    await this.handleGetFileContent(message, webview);
                    break;
                case 'findRelatedFiles':
                    await this.handleFindRelatedFiles(message, webview);
                    break;
                case 'queryContext':
                    await this.handleQueryContext(message, webview);
                    break;
                case 'search':
                    await this.handleSearch(message, webview);
                    break;
                case 'getServiceStatus':
                    await this.handleGetServiceStatus(webview);
                    break;
                case 'startIndexing':
                    await this.handleStartIndexing(webview);
                    break;
                case 'retryIndexing':
                    await this.handleStartIndexing(webview);
                    break;
                case 'openFile':
                    await this.handleOpenFile(message, webview);
                    break;
                case 'pauseIndexing':
                    await this.handlePauseIndexing(webview);
                    break;
                case 'resumeIndexing':
                    await this.handleResumeIndexing(webview);
                    break;
                case 'getIndexInfo':
                    await this.handleGetIndexInfo(webview);
                    break;
                case 'clearIndex':
                    await this.handleClearIndex(webview);
                    break;
                case 'getWorkspaceList':
                    await this.handleGetWorkspaceList(webview);
                    break;
                case 'switchWorkspace':
                    await this.handleSwitchWorkspace(message, webview);
                    break;
                case 'getWorkspaceStats':
                    await this.handleGetWorkspaceStats(webview);
                    break;
                case 'advancedSearch':
                    await this.handleAdvancedSearch(message, webview);
                    break;
                case 'getSearchSuggestions':
                    await this.handleGetSearchSuggestions(message, webview);
                    break;
                case 'getSearchHistory':
                    await this.handleGetSearchHistory(webview);
                    break;
                // Note: Duplicate 'validateConfiguration' case - intentional for backward compatibility
                case 'validateConfiguration':
                    await this.handleValidateConfiguration(message, webview);
                    break;
                case 'getConfigurationPresets':
                    await this.handleGetConfigurationPresets(webview);
                    break;
                case 'applyConfigurationPreset':
                    await this.handleApplyConfigurationPreset(message, webview);
                    break;
                case 'getPerformanceMetrics':
                    await this.handleGetPerformanceMetrics(webview);
                    break;
                case 'getFilePreview':
                    await this.handleGetFilePreview(message, webview);
                    break;
                // Note: 'MapToSettings' and 'openSettings' both handle the same action
                case 'MapToSettings':
                    await this.handleMapToSettings(webview);
                    break;
                case 'openSettings':
                    await this.handleMapToSettings(webview);
                    break;
                case 'getGlobalState':
                    await this.handleGetGlobalState(message, webview);
                    break;
                case 'setGlobalState':
                    await this.handleSetGlobalState(message, webview);
                    break;
                case 'checkFirstRunAndStartTour':
                    await this.handleCheckFirstRunAndStartTour(webview);
                    break;
                case 'requestOpenFolder':
                    await this.handleRequestOpenFolder(message, webview);
                    break;
                case 'heartbeat':
                    await this.handleHeartbeat(message, webview);
                    break;
                case 'getHealthStatus':
                    await this.handleGetHealthStatus(message, webview);
                    break;
                case 'getInitialState':
                    await this.handleGetInitialState(message, webview);
                    break;
                case 'getState':
                    await this.handleGetState(message, webview);
                    break;
                case 'testDatabaseConnection':
                    await this.handleTestDatabaseConnection(message, webview);
                    break;
                case 'testProviderConnection':
                    await this.handleTestProviderConnection(message, webview);
                    break;
                case 'openExternalLink':
                    await this.handleOpenExternalLink(message, webview);
                    break;
                case 'startSetup':
                    await this.handleStartSetup(message, webview);
                    break;
                default:
                    // Handle unknown commands with a warning and error response
                    console.warn('MessageRouter: Unknown command:', message.command);
                    await this.sendErrorResponse(webview, `Unknown command: ${message.command}`);
                    break;
            }
        } catch (error) {
            // Global error handling to prevent uncaught exceptions from crashing the message router
            console.error('MessageRouter: Error handling message:', error);
            await this.sendErrorResponse(webview, error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Handles ping messages for connection testing
     *
     * Simple ping-pong implementation used to verify that the webview-to-extension
     * communication channel is working properly. This is often used during initial
     * connection setup or as a heartbeat mechanism.
     *
     * @param message - The ping message, should contain requestId for correlation
     * @param webview - The webview to send the pong response to
     */
    private async handlePing(message: any, webview: vscode.Webview): Promise<void> {
        console.log('MessageRouter: Received ping from webview', message.requestId);

        // Respond with pong including the same requestId for correlation and current timestamp
        await webview.postMessage({
            command: 'pong',
            requestId: message.requestId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Checks if the workspace is properly configured for first-time setup
     *
     * This handler determines if the extension has been properly configured by checking:
     * 1. If a workspace folder is open
     * 2. If required services are connected and configured
     *
     * @param message - The check setup status message, should contain requestId
     * @param webview - The webview to send the response to
     */
    private async handleCheckSetupStatus(message: any, webview: vscode.Webview): Promise<void> {
        try {
            // First check if there's an open workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                await webview.postMessage({
                    command: 'response',
                    requestId: message.requestId,
                    data: {
                        isConfigured: false,
                        reason: 'No workspace folder'
                    }
                });
                return;
            }

            // Check if core services are properly configured and running
            const status = await this.contextService.getStatus();
            const isConfigured = status.qdrantConnected && status.embeddingProvider !== null;

            await webview.postMessage({
                command: 'response',
                requestId: message.requestId,
                data: {
                    isConfigured,
                    status: status
                }
            });

        } catch (error) {
            console.error('MessageRouter: Error checking setup status:', error);
            await webview.postMessage({
                command: 'response',
                requestId: message.requestId,
                error: error instanceof Error ? error.message : String(error),
                data: {
                    isConfigured: false
                }
            });
        }
    }

    /**
     * Handles requests to start local database services
     *
     * This handler supports starting different types of local databases via Docker:
     * - Qdrant: Vector database for semantic search
     * - ChromaDB: Alternative vector database
     *
     * @param message - The start database message, should contain database type and config
     * @param webview - The webview to send status updates to
     */
    private async handleStartDatabase(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { database, config } = message;
            console.log('MessageRouter: Starting database:', database, config);

            // Route to appropriate database startup method based on type
            switch (database) {
                case 'qdrant':
                    await this.startQdrant(webview);
                    break;
                case 'chromadb':
                    await this.startChromaDB(webview, config);
                    break;
                default:
                    throw new Error(`Unsupported database type for starting: ${database}`);
            }

        } catch (error) {
            console.error('MessageRouter: Error starting database:', error);
            await webview.postMessage({
                command: 'databaseStatus',
                data: {
                    status: 'error',
                    error: error instanceof Error ? error.message : String(error)
                }
            });
        }
    }

    /**
     * Handles requests to validate cloud database connections
     *
     * This handler validates connections to cloud-based database services:
     * - Pinecone: Cloud vector database service
     *
     * @param message - The validate database message, should contain database type and config
     * @param webview - The webview to send validation results to
     */
    private async handleValidateDatabase(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { database, config } = message;
            console.log('MessageRouter: Validating database:', database);

            // Route to appropriate database validation method based on type
            switch (database) {
                case 'pinecone':
                    await this.validatePinecone(webview, config);
                    break;
                default:
                    throw new Error(`Unsupported database type for validation: ${database}`);
            }

        } catch (error) {
            console.error('MessageRouter: Error validating database:', error);
            await webview.postMessage({
                command: 'databaseStatus',
                data: {
                    status: 'error',
                    error: error instanceof Error ? error.message : String(error)
                }
            });
        }
    }

    /**
     * Starts Qdrant vector database using Docker
     *
     * This method creates a new VS Code terminal and runs the Qdrant Docker container.
     * After starting the container, it initiates health checking to determine when
     * the database is ready to accept connections.
     *
     * @param webview - The webview to send status updates to
     */
    private async startQdrant(webview: vscode.Webview): Promise<void> {
        // Create a dedicated terminal for Qdrant to keep it separate from other terminals
        const terminal = vscode.window.createTerminal('Qdrant Database');
        terminal.sendText('docker run -p 6333:6333 qdrant/qdrant');
        terminal.show();

        // Notify webview that database startup has been initiated
        await webview.postMessage({
            command: 'databaseStarted',
            data: { database: 'qdrant', status: 'starting' }
        });

        // Begin polling to check when the database is healthy and ready
        this.pollDatabaseHealth(webview, 'qdrant');
    }

    /**
     * Starts ChromaDB vector database using Docker
     *
     * This method creates a new VS Code terminal and runs the ChromaDB Docker container
     * with a configurable port. After starting the container, it initiates health checking.
     *
     * @param webview - The webview to send status updates to
     * @param config - Configuration object that may contain custom port settings
     */
    private async startChromaDB(webview: vscode.Webview, config: any): Promise<void> {
        // Use provided port or default to 8000
        const port = config?.port || 8000;
        const terminal = vscode.window.createTerminal('ChromaDB Database');
        terminal.sendText(`docker run -p ${port}:8000 chromadb/chroma`);
        terminal.show();

        // Notify webview that database startup has been initiated
        await webview.postMessage({
            command: 'databaseStarted',
            data: { database: 'chromadb', status: 'starting' }
        });

        // Begin polling to check when the database is healthy and ready
        this.pollDatabaseHealth(webview, 'chromadb', config);
    }

    /**
     * Validates Pinecone cloud database connection
     *
     * This method tests the connection to Pinecone by attempting to list databases.
     * It handles various error scenarios including invalid API keys, permission issues,
     * and network timeouts.
     *
     * @param webview - The webview to send validation results to
     * @param config - Configuration object containing API key and environment settings
     * @throws Error if validation fails or connection times out
     */
    private async validatePinecone(webview: vscode.Webview, config: any): Promise<void> {
        // Validate required configuration parameters
        if (!config?.apiKey || !config?.environment) {
            throw new Error('Pinecone API key and environment are required');
        }

        try {
            // Test Pinecone connection by listing databases via their API
            const response = await fetch(`https://controller.${config.environment}.pinecone.io/databases`, {
                method: 'GET',
                headers: {
                    'Api-Key': config.apiKey,
                    'Content-Type': 'application/json'
                },
                // Set timeout to prevent hanging on slow connections
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                // Connection successful
                await webview.postMessage({
                    command: 'databaseStatus',
                    data: { status: 'running' }
                });
            } else if (response.status === 401) {
                // Authentication failed
                throw new Error('Invalid Pinecone API key');
            } else if (response.status === 403) {
                // Authorization failed
                throw new Error('Access denied - check your API key permissions');
            } else {
                // Other HTTP errors
                throw new Error(`Pinecone connection failed: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            // Handle network timeouts specifically
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Pinecone connection timeout - check your environment');
            }
            throw error;
        }
    }

    /**
     * Polls database health endpoint to determine when service is ready
     *
     * This method implements a polling mechanism to check if a database service
     * has started successfully and is ready to accept connections. It will poll
     * for a maximum of 30 seconds before timing out.
     *
     * @param webview - The webview to send health status updates to
     * @param database - The type of database being checked ('qdrant' or 'chromadb')
     * @param config - Optional configuration for database-specific settings (like port)
     */
    private async pollDatabaseHealth(webview: vscode.Webview, database: string, config?: any): Promise<void> {
        const maxAttempts = 30; // 30 seconds total timeout
        let attempts = 0;

        const checkHealth = async (): Promise<void> => {
            try {
                attempts++;
                let healthUrl: string;

                // Determine the appropriate health endpoint URL based on database type
                switch (database) {
                    case 'qdrant':
                        healthUrl = 'http://localhost:6333/health';
                        break;
                    case 'chromadb':
                        const port = config?.port || 8000;
                        healthUrl = `http://localhost:${port}/api/v1/heartbeat`;
                        break;
                    default:
                        throw new Error(`Unsupported database for health check: ${database}`);
                }

                // Make HTTP request to health endpoint
                const response = await fetch(healthUrl);
                if (response.ok) {
                    // Database is healthy and ready
                    await webview.postMessage({
                        command: 'databaseStatus',
                        data: { status: 'running' }
                    });
                    return;
                }

                // If not ready yet and we haven't exceeded max attempts, schedule another check
                if (attempts < maxAttempts) {
                    setTimeout(checkHealth, 1000); // Check again in 1 second
                } else {
                    // Max attempts reached without success
                    await webview.postMessage({
                        command: 'databaseStatus',
                        data: {
                            status: 'error',
                            error: `${database} failed to start within 30 seconds`
                        }
                    });
                }

            } catch (error) {
                // Handle connection errors (likely database not ready yet)
                if (attempts < maxAttempts) {
                    setTimeout(checkHealth, 1000); // Check again in 1 second
                } else {
                    // Max attempts reached with persistent errors
                    await webview.postMessage({
                        command: 'databaseStatus',
                        data: {
                            status: 'error',
                            error: `${database} health check failed`
                        }
                    });
                }
            }
        };

        // Start health checking after a short delay to allow database initialization
        setTimeout(checkHealth, 2000); // Wait 2 seconds before first check
    }

    /**
     * Retrieves content of a specified file with optional related chunks
     *
     * This handler fetches the content of a file and can optionally include
     * semantically related code chunks for enhanced context understanding.
     *
     * @param message - The get file content message, should contain filePath and includeRelatedChunks flag
     * @param webview - The webview to send the file content response to
     */
    private async handleGetFileContent(message: any, webview: vscode.Webview): Promise<void> {
        const { filePath, includeRelatedChunks = false } = message;

        // Validate required parameters
        if (!filePath) {
            await this.sendErrorResponse(webview, 'File path is required');
            return;
        }

        // Retrieve file content from context service
        const result = await this.contextService.getFileContent(filePath, includeRelatedChunks);

        // Send result back to webview
        await webview.postMessage({
            command: 'fileContentResponse',
            requestId: message.requestId,
            data: result
        });
    }
    /**
     * Opens a file in the editor at the specified location
     * @param message - expects { filePath: string, lineNumber?: number, columnNumber?: number }
     */
    private async handleOpenFile(message: any, webview: vscode.Webview): Promise<void> {
        const { filePath, lineNumber, columnNumber } = message;
        try {
            if (!filePath) {
                await this.sendErrorResponse(webview, 'File path is required');
                return;
            }
            const uri = vscode.Uri.file(filePath);
            const options: vscode.TextDocumentShowOptions = {};
            if (typeof lineNumber === 'number') {
                const pos = new vscode.Position(Math.max(0, lineNumber - 1), Math.max(0, (columnNumber || 1) - 1));
                const range = new vscode.Range(pos, pos);
                options.selection = range;
            }
            await vscode.window.showTextDocument(uri, options);
        } catch (err) {
            console.error('MessageRouter: Failed to open file', err);
            await this.sendErrorResponse(webview, err instanceof Error ? err.message : String(err));
        }
    }


    /**
     * Finds files related to a given query using semantic search
     *
     * This handler uses the context service to perform semantic search and find
     * files that are related to the provided query, with configurable similarity
     * thresholds and result limits.
     *
     * @param message - The find related files message, should contain query and optional parameters
     * @param webview - The webview to send the related files response to
     */
    private async handleFindRelatedFiles(message: any, webview: vscode.Webview): Promise<void> {
        const { query, currentFilePath, maxResults = 10, minSimilarity = 0.5 } = message;

        // Validate required parameters
        if (!query) {
            await this.sendErrorResponse(webview, 'Query is required');
            return;
        }

        // Perform semantic search for related files
        const result = await this.contextService.findRelatedFiles(
            query,
            currentFilePath,
            maxResults,
            minSimilarity
        );

        // Send results back to webview
        await webview.postMessage({
            command: 'relatedFilesResponse',
            requestId: message.requestId,
            data: result
        });
    }

    /**
     * Performs advanced context queries with customizable parameters
     *
     * This handler allows for complex context queries with various filtering
     * and configuration options through the ContextQuery object.
     *
     * @param message - The query context message, should contain a ContextQuery object
     * @param webview - The webview to send the context query response to
     */
    private async handleQueryContext(message: any, webview: vscode.Webview): Promise<void> {
        const contextQuery: ContextQuery = message.contextQuery;

        // Validate required parameters
        if (!contextQuery.query) {
            await this.sendErrorResponse(webview, 'Query is required');
            return;
        }

        // Execute advanced context query
        const result = await this.contextService.queryContext(contextQuery);

        // Send results back to webview
        await webview.postMessage({
            command: 'contextQueryResponse',
            requestId: message.requestId,
            data: result
        });
    }

    /**
     * Performs basic search operations with default parameters
     *
     * This handler provides a simplified search interface that uses default
     * parameters for max results and similarity threshold. It internally
     * delegates to the context service's queryContext method.
     *
     * @param message - The search message, should contain the query string
     * @param webview - The webview to send the search response to
     */
    private async handleSearch(message: any, webview: vscode.Webview): Promise<void> {
        const { query } = message;

        // Validate required parameters
        if (!query) {
            await this.sendErrorResponse(webview, 'Query is required');
            return;
        }

        // Perform search with default parameters
        const result = await this.contextService.queryContext({
            query,
            maxResults: 20,
            minSimilarity: 0.5
        });

        // Send results back to webview
        await webview.postMessage({
            command: 'searchResponse',
            requestId: message.requestId,
            data: result
        });
    }

    /**
     * Retrieves the current status of all core services
     *
     * This handler provides a comprehensive status overview of all services
     * managed by the context service, including database connections and
     * embedding provider status.
     *
     * @param webview - The webview to send the service status response to
     */
    private async handleGetServiceStatus(webview: vscode.Webview): Promise<void> {
        // Get current status from context service
        const status = await this.contextService.getStatus();

        // Send status back to webview
        await webview.postMessage({
            command: 'serviceStatusResponse',
            data: status
        });
    }

    /**
     * Handles the setup completion and configuration from the startup form
     *
     * This handler processes the setup configuration submitted from the startup form,
     * saves the configuration, and initiates the indexing process. It acts as the
     * bridge between the setup form and the indexing workflow.
     *
     * @param message - The setup message containing database and provider configuration
     * @param webview - The webview to send responses to
     */
    private async handleStartSetup(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling start setup request', message);

            const { database, provider, databaseConfig, providerConfig } = message;

            // Validate required configuration
            if (!database || !provider) {
                await webview.postMessage({
                    command: 'setupError',
                    error: 'Database and provider selection are required'
                });
                return;
            }

            // Log the configuration for now - in a full implementation,
            // this would save to VS Code settings or a configuration file
            console.log('MessageRouter: Setup configuration received:', {
                database,
                provider,
                databaseConfig,
                providerConfig
            });

            // Notify webview that setup is complete and indexing will start
            await webview.postMessage({
                command: 'setupComplete',
                data: {
                    database,
                    provider,
                    message: 'Setup completed successfully. Starting indexing...'
                }
            });

            // Start indexing automatically after setup
            await this.handleStartIndexing(webview);

        } catch (error) {
            console.error('MessageRouter: Error during setup:', error);
            await webview.postMessage({
                command: 'setupError',
                error: error instanceof Error ? error.message : 'An unknown error occurred during setup.'
            });
        }
    }

    /**
     * Initiates the document indexing process
     *
     * This handler triggers the indexing of workspace documents to make them
     * searchable. It includes state validation to prevent concurrent indexing
     * operations and provides appropriate error responses.
     *
     * @param webview - The webview to send the response to
     */
    private async handleStartIndexing(webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling start indexing request');

            // Check if indexing is already in progress
            if (this.stateManager.isIndexing()) {
                await webview.postMessage({
                    command: 'indexingError',
                    error: 'Indexing is already in progress.'
                });
                console.log('MessageRouter: Indexing already in progress, request rejected');
                return;
            }

            // Start indexing with progress callback to stream updates to the webview
            const indexingPromise = this.indexingService.startIndexing((progress) => {
                const percent = progress.totalFiles > 0 ? Math.round((progress.processedFiles / progress.totalFiles) * 100) : 0;
                webview.postMessage({
                    command: 'indexingProgress',
                    progress: percent,
                    message: `Phase: ${progress.currentPhase} - ${progress.currentFile || ''}`,
                    filesProcessed: progress.processedFiles,
                    totalFiles: progress.totalFiles,
                    currentFile: progress.currentFile,
                });
            });

            const result = await indexingPromise;

            await webview.postMessage({
                command: 'indexingComplete',
                chunksCreated: result.chunks.length,
                duration: result.duration,
                errors: result.errors
            });
            console.log('MessageRouter: Indexing completed');

        } catch (error) {
            console.error('MessageRouter: Error during indexing:', error);
            await webview.postMessage({
                command: 'indexingError',
                error: error instanceof Error ? error.message : 'An unknown error occurred while indexing.'
            });
        }
    }

    /**
     * Pauses the current indexing operation
     *
     * This handler pauses an ongoing indexing process, allowing it to be resumed later.
     * The indexing state is preserved so it can continue from where it left off.
     *
     * @param webview - The webview to send the response to
     */
    private async handlePauseIndexing(webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling pause indexing request');

            // Check if indexing is currently running
            if (!this.stateManager.isIndexing()) {
                await webview.postMessage({
                    command: 'pauseIndexingResponse',
                    success: false,
                    error: 'No indexing operation is currently running'
                });
                return;
            }

            // Check if already paused
            if (this.stateManager.isPaused()) {
                await webview.postMessage({
                    command: 'pauseIndexingResponse',
                    success: false,
                    error: 'Indexing is already paused'
                });
                return;
            }

            // Pause the indexing operation
            this.indexingService.pause();

            await webview.postMessage({
                command: 'pauseIndexingResponse',
                success: true,
                message: 'Indexing paused successfully'
            });

        } catch (error) {
            console.error('MessageRouter: Error pausing indexing:', error);
            await this.sendErrorResponse(webview, `Failed to pause indexing: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Resumes a paused indexing operation
     *
     * This handler resumes a previously paused indexing process, continuing
     * from where it left off using the saved state.
     *
     * @param webview - The webview to send the response to
     */
    private async handleResumeIndexing(webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling resume indexing request');

            // Check if indexing is paused
            if (!this.stateManager.isPaused()) {
                await webview.postMessage({
                    command: 'resumeIndexingResponse',
                    success: false,
                    error: 'No paused indexing operation to resume'
                });
                return;
            }

            // Resume the indexing operation
            await this.indexingService.resume();

            await webview.postMessage({
                command: 'resumeIndexingResponse',
                success: true,
                message: 'Indexing resumed successfully'
            });

        } catch (error) {
            console.error('MessageRouter: Error resuming indexing:', error);
            await this.sendErrorResponse(webview, `Failed to resume indexing: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Gets information about the current index
     *
     * This handler retrieves statistics about the current workspace index,
     * including the number of indexed files and vectors.
     *
     * @param webview - The webview to send the response to
     */
    private async handleGetIndexInfo(webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling get index info request');

            // Get index information from the indexing service
            const indexInfo = await this.indexingService.getIndexInfo();

            if (indexInfo) {
                await webview.postMessage({
                    command: 'getIndexInfoResponse',
                    success: true,
                    data: {
                        fileCount: indexInfo.fileCount,
                        vectorCount: indexInfo.vectorCount,
                        collectionName: indexInfo.collectionName
                    }
                });
            } else {
                await webview.postMessage({
                    command: 'getIndexInfoResponse',
                    success: true,
                    data: {
                        fileCount: 0,
                        vectorCount: 0,
                        collectionName: 'No collection found'
                    }
                });
            }

        } catch (error) {
            console.error('MessageRouter: Error getting index info:', error);
            await this.sendErrorResponse(webview, `Failed to get index info: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Clears the entire index for the current workspace
     *
     * This handler removes all indexed data from the vector database,
     * effectively resetting the index to an empty state.
     *
     * @param webview - The webview to send the response to
     */
    private async handleClearIndex(webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling clear index request');

            // Clear the index using the indexing service
            const success = await this.indexingService.clearIndex();

            if (success) {
                await webview.postMessage({
                    command: 'clearIndexResponse',
                    success: true,
                    message: 'Index cleared successfully'
                });
            } else {
                await webview.postMessage({
                    command: 'clearIndexResponse',
                    success: false,
                    error: 'Failed to clear index'
                });
            }

        } catch (error) {
            console.error('MessageRouter: Error clearing index:', error);
            await this.sendErrorResponse(webview, `Failed to clear index: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Performs advanced search with customizable filters
     *
     * This handler provides enhanced search capabilities with filtering options
     * such as file types, date ranges, and other search criteria. It requires
     * the SearchManager to be available.
     *
     * @param message - The advanced search message, should contain query and optional filters
     * @param webview - The webview to send the advanced search response to
     */
    private async handleAdvancedSearch(message: any, webview: vscode.Webview): Promise<void> {
        // Check if SearchManager is available
        if (!this.searchManager) {
            await this.sendErrorResponse(webview, 'SearchManager not available');
            return;
        }

        const { query, filters } = message;

        // Validate required parameters
        if (!query) {
            await this.sendErrorResponse(webview, 'Query is required');
            return;
        }

        // Perform advanced search with filters
        const result = await this.searchManager.search(query, filters);

        // Send results back to webview
        await webview.postMessage({
            command: 'advancedSearchResponse',
            requestId: message.requestId,
            data: result
        });
    }

    /**
     * Retrieves search suggestions based on partial query input
     *
     * This handler provides autocomplete suggestions as the user types
     * their search query. It requires the SearchManager to be available.
     *
     * @param message - The get search suggestions message, should contain partialQuery
     * @param webview - The webview to send the search suggestions response to
     */
    private async handleGetSearchSuggestions(message: any, webview: vscode.Webview): Promise<void> {
        // Check if SearchManager is available
        if (!this.searchManager) {
            await this.sendErrorResponse(webview, 'SearchManager not available');
            return;
        }

        const { partialQuery } = message;
        // Get suggestions based on partial query
        const suggestions = this.searchManager.getSuggestions(partialQuery);

        // Send suggestions back to webview
        await webview.postMessage({
            command: 'searchSuggestionsResponse',
            requestId: message.requestId,
            data: suggestions
        });
    }

    /**
     * Retrieves the user's search history
     *
     * This handler returns a list of recent searches performed by the user,
     * enabling quick access to previous queries. It requires the SearchManager
     * to be available.
     *
     * @param webview - The webview to send the search history response to
     */
    private async handleGetSearchHistory(webview: vscode.Webview): Promise<void> {
        // Check if SearchManager is available
        if (!this.searchManager) {
            await this.sendErrorResponse(webview, 'SearchManager not available');
            return;
        }

        // Get search history from SearchManager
        const history = this.searchManager.getSearchHistory();

        // Send history back to webview
        await webview.postMessage({
            command: 'searchHistoryResponse',
            data: history
        });
    }

    /**
     * Retrieves available configuration presets
     *
     * This handler returns a list of predefined configuration presets that
     * users can apply to quickly configure the extension for different use cases.
     *
     * @param webview - The webview to send the configuration presets response to
     */
    private async handleGetConfigurationPresets(webview: vscode.Webview): Promise<void> {
        // Get configuration presets from legacy configuration manager
        const presets = this.legacyConfigurationManager?.getConfigurationPresets() || [];

        // Send presets back to webview
        await webview.postMessage({
            command: 'configurationPresetsResponse',
            data: presets
        });
    }

    /**
     * Applies a configuration preset by name
     *
     * This handler applies a predefined configuration preset to quickly set up
     * the extension for a specific use case. It requires the legacy
     * ConfigurationManager to be available.
     *
     * @param message - The apply configuration preset message, should contain presetName
     * @param webview - The webview to send the application result to
     */
    private async handleApplyConfigurationPreset(message: any, webview: vscode.Webview): Promise<void> {
        // Check if ConfigurationManager is available
        if (!this.legacyConfigurationManager) {
            await this.sendErrorResponse(webview, 'ConfigurationManager not available');
            return;
        }

        const { presetName } = message;

        try {
            // Apply the specified preset
            await this.legacyConfigurationManager.applyPreset(presetName);

            // Send success response
            await webview.postMessage({
                command: 'configurationPresetAppliedResponse',
                requestId: message.requestId,
                data: { success: true }
            });
        } catch (error) {
            // Forward error to webview
            await this.sendErrorResponse(webview, error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Retrieves current performance metrics
     *
     * This handler returns performance metrics collected by the PerformanceManager,
     * such as memory usage, response times, and other performance indicators.
     * It requires the PerformanceManager to be available.
     *
     * @param webview - The webview to send the performance metrics response to
     */
    private async handleGetPerformanceMetrics(webview: vscode.Webview): Promise<void> {
        // Check if PerformanceManager is available
        if (!this.performanceManager) {
            await this.sendErrorResponse(webview, 'PerformanceManager not available');
            return;
        }

        // Get current metrics from PerformanceManager
        const metrics = this.performanceManager.getMetrics();

        // Send metrics back to webview
        await webview.postMessage({
            command: 'performanceMetricsResponse',
            data: metrics
        });
    }

    /**
     * Retrieves a preview of a file with surrounding context
     *
     * This handler provides a preview of a specific file at a given line number,
     * with optional surrounding context lines. It's useful for showing search results
     * or code references with context. It requires the SearchManager to be available.
     *
     * @param message - The get file preview message, should contain filePath, lineNumber, and optional contextLines
     * @param webview - The webview to send the file preview response to
     */
    private async handleGetFilePreview(message: any, webview: vscode.Webview): Promise<void> {
        // Check if SearchManager is available
        if (!this.searchManager) {
            await this.sendErrorResponse(webview, 'SearchManager not available');
            return;
        }

        const { filePath, lineNumber, contextLines } = message;

        // Validate required parameters
        if (!filePath || lineNumber === undefined) {
            await this.sendErrorResponse(webview, 'File path and line number are required');
            return;
        }

        // Get file preview with context
        const preview = await this.searchManager.getFilePreview(filePath, lineNumber, contextLines);

        // Send preview back to webview
        await webview.postMessage({
            command: 'filePreviewResponse',
            requestId: message.requestId,
            data: preview
        });
    }

    /**
     * Opens the VS Code settings UI filtered to this extension
     *
     * This handler opens the VS Code settings interface and filters it to show
     * only settings related to this extension, making it easy for users to
     * configure extension-specific options.
     *
     * @param webview - The webview (not used in this implementation but kept for consistency)
     */
    private async handleMapToSettings(webview: vscode.Webview): Promise<void> {
        // Open VS Code settings filtered to this extension
        await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');
    }

    /**
     * Retrieves a value from the extension's global state
     *
     * This handler fetches a value stored in the extension's global state
     * using the provided key. Global state persists across VS Code sessions.
     *
     * @param message - The get global state message, should contain the key to retrieve
     * @param webview - The webview to send the global state response to
     */
    private async handleGetGlobalState(message: any, webview: vscode.Webview): Promise<void> {
        const { key } = message;

        // Validate required parameters
        if (!key) {
            await this.sendErrorResponse(webview, 'Key is required');
            return;
        }

        // Get value from global state
        const value = this.context.globalState.get(key);

        // Send value back to webview
        await webview.postMessage({
            command: 'globalStateResponse',
            requestId: message.requestId,
            data: { key, value }
        });
    }

    /**
     * Sets a value in the extension's global state
     *
     * This handler stores a value in the extension's global state using the
     * provided key. Global state persists across VS Code sessions.
     *
     * @param message - The set global state message, should contain key and value
     * @param webview - The webview to send the update confirmation to
     */
    private async handleSetGlobalState(message: any, webview: vscode.Webview): Promise<void> {
        const { key, value } = message;

        // Validate required parameters
        if (!key) {
            await this.sendErrorResponse(webview, 'Key is required');
            return;
        }

        // Update global state with new value
        await this.context.globalState.update(key, value);

        // Send confirmation back to webview
        await webview.postMessage({
            command: 'globalStateUpdatedResponse',
            requestId: message.requestId,
            data: { key, success: true }
        });
    }

    /**
     * Checks if this is the first run of the extension and starts tour if needed
     *
     * This handler determines if the extension is being run for the first time
     * by checking a global state flag. If it's the first run, it sets the flag
     * and would typically trigger an onboarding tour or setup wizard.
     *
     * @param webview - The webview to send the first run check response to
     */
    private async handleCheckFirstRunAndStartTour(webview: vscode.Webview): Promise<void> {
        // Check if this is the first run by looking for the 'hasRunBefore' flag
        const isFirstRun = !this.context.globalState.get('hasRunBefore');

        if (isFirstRun) {
            // Mark that the extension has been run before
            await this.context.globalState.update('hasRunBefore', true);
            // TODO: Implement tour start logic here
            // This would typically trigger an onboarding experience or guided tour
        }

        // Send first run status back to webview
        await webview.postMessage({
            command: 'firstRunCheckResponse',
            data: { isFirstRun }
        });
    }

    /**
     * Handles heartbeat messages from webviews for connection monitoring
     */
    private async handleHeartbeat(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const timestamp = message.timestamp || Date.now();
            const connectionId = message.connectionId;

            // Send heartbeat response back to webview
            await webview.postMessage({
                command: 'heartbeatResponse',
                timestamp: timestamp,
                serverTime: Date.now(),
                connectionId: connectionId
            });

            console.log('MessageRouter: Heartbeat response sent', { timestamp, connectionId });
        } catch (error) {
            console.error('MessageRouter: Error handling heartbeat:', error);
        }
    }

    /**
     * Handles health status requests from webviews
     */
    private async handleGetHealthStatus(message: any, webview: vscode.Webview): Promise<void> {
        try {
            // Get basic health metrics - in a real implementation this would be more comprehensive
            const healthStatus = {
                timestamp: Date.now(),
                status: 'healthy',
                uptime: process.uptime() * 1000, // Convert to milliseconds
                memoryUsage: process.memoryUsage(),
                // Add more health metrics as needed
            };

            await webview.postMessage({
                command: 'healthStatusResponse',
                requestId: message.requestId,
                data: healthStatus
            });

            console.log('MessageRouter: Health status response sent');
        } catch (error) {
            console.error('MessageRouter: Error handling health status request:', error);
            await this.sendErrorResponse(webview, `Failed to get health status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Sends a standardized error response to the webview
     *
     * This utility method provides a consistent way to send error messages
     * back to the webview, ensuring proper error handling and user feedback.
     *
     * @param webview - The webview to send the error response to
     * @param errorMessage - The error message to send
     */
    private async sendErrorResponse(webview: vscode.Webview, errorMessage: string): Promise<void> {
        await webview.postMessage({
            command: 'error',
            message: errorMessage
        });
    }

    // ===== Placeholder methods for handlers that are not yet implemented =====
    // These methods provide basic error responses until their full implementation
    // is completed. Each follows the same pattern of sending a "not implemented yet"
    // error response to maintain consistency in the API.

    /**
     * Placeholder handler for saving secret values
     *
     * This method is not yet implemented. When completed, it should use
     * VS Code's secret storage API to securely store sensitive information.
     *
     * @param message - The save secret value message
     * @param webview - The webview to send the response to
     */
    private async handleSaveSecretValue(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would use VS Code's secret storage API
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for retrieving secret values
     *
     * This method is not yet implemented. When completed, it should use
     * VS Code's secret storage API to securely retrieve sensitive information.
     *
     * @param message - The get secret value message
     * @param webview - The webview to send the response to
     */
    private async handleGetSecretValue(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would use VS Code's secret storage API
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for running system validation
     *
     * This method is not yet implemented. When completed, it should run
     * comprehensive system validation checks to ensure all dependencies
     * and requirements are met.
     *
     * @param message - The run system validation message
     * @param webview - The webview to send the response to
     */
    private async handleRunSystemValidation(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would run system validation checks
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for retrieving troubleshooting guides
     *
     * This method is not yet implemented. When completed, it should return
     * available troubleshooting guides to help users resolve common issues.
     *
     * @param message - The get troubleshooting guides message
     * @param webview - The webview to send the response to
     */
    private async handleGetTroubleshootingGuides(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would return troubleshooting guides
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for running automatic fixes
     *
     * This method is not yet implemented. When completed, it should automatically
     * detect and fix common configuration or setup issues.
     *
     * @param message - The run auto fix message
     * @param webview - The webview to send the response to
     */
    private async handleRunAutoFix(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would run automatic fixes
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for opening troubleshooting guides
     *
     * This method is not yet implemented. When completed, it should open
     * specific troubleshooting guides in the webview or external browser.
     *
     * @param message - The open troubleshooting guide message
     * @param webview - The webview to send the response to
     */
    private async handleOpenTroubleshootingGuide(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would open troubleshooting guide
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Handle request to open folder dialog
     *
     * This method triggers the VS Code "Open Folder" dialog to allow users
     * to select a workspace folder when none is currently open.
     *
     * @param message - The request open folder message
     * @param webview - The webview to send the response to
     */
    private async handleRequestOpenFolder(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling request to open folder', message);

            // Execute the VS Code command to open folder dialog
            console.log('MessageRouter: Executing vscode.openFolder command...');
            await vscode.commands.executeCommand('vscode.openFolder');

            // Send success response
            const response = {
                command: 'response',
                requestId: message.requestId,
                data: { success: true }
            };

            console.log('MessageRouter: Sending success response:', response);
            await webview.postMessage(response);

            console.log('MessageRouter: Open folder dialog triggered successfully');
        } catch (error) {
            console.error('MessageRouter: Failed to open folder dialog:', error);
            console.error('MessageRouter: Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            await this.sendErrorResponse(webview, error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Handle request for initial state
     *
     * This method sends the current workspace state and other initial
     * application state to the webview when requested.
     *
     * @param message - The get initial state message
     * @param webview - The webview to send the response to
     */
    private async handleGetInitialState(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling get initial state request', message);

            // Check workspace state with detailed logging
            const workspaceFolders = vscode.workspace.workspaceFolders;
            const isWorkspaceOpen = !!workspaceFolders && workspaceFolders.length > 0;

            console.log('MessageRouter: Workspace detection details:');
            console.log('  - workspaceFolders:', workspaceFolders);
            console.log('  - folders length:', workspaceFolders?.length || 0);
            console.log('  - isWorkspaceOpen:', isWorkspaceOpen);

            // Send initial state response
            const response = {
                type: 'initialState',
                command: 'response',
                requestId: message.requestId,
                data: {
                    isWorkspaceOpen,
                    workspaceFolders: workspaceFolders?.map(folder => ({
                        name: folder.name,
                        uri: folder.uri.toString()
                    })) || []
                }
            };

            console.log('MessageRouter: Sending response:', response);
            await webview.postMessage(response);

            console.log(`MessageRouter: Successfully sent initial state - workspace open: ${isWorkspaceOpen}`);
        } catch (error) {
            console.error('MessageRouter: Failed to get initial state:', error);
            await this.sendErrorResponse(webview, error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Handle legacy state request
     *
     * This method provides backward compatibility for legacy state requests.
     * It delegates to the handleGetInitialState method.
     *
     * @param message - The get state message
     * @param webview - The webview to send the response to
     */
    private async handleGetState(message: any, webview: vscode.Webview): Promise<void> {
        // Delegate to the new initial state handler for consistency
        await this.handleGetInitialState(message, webview);
    }

    /**
     * Placeholder handler for exporting configuration
     *
     * This method is not yet implemented. When completed, it should export
     * the current configuration to a file for backup or sharing purposes.
     *
     * @param message - The export configuration message
     * @param webview - The webview to send the response to
     */
    private async handleExportConfiguration(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would export configuration
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for importing configuration
     *
     * This method is not yet implemented. When completed, it should import
     * configuration from a file, allowing users to restore or share settings.
     *
     * @param message - The import configuration message
     * @param webview - The webview to send the response to
     */
    private async handleImportConfiguration(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would import configuration
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for retrieving configuration templates
     *
     * This method is not yet implemented. When completed, it should return
     * available configuration templates that users can use as starting points.
     *
     * @param message - The get configuration templates message
     * @param webview - The webview to send the response to
     */
    private async handleGetConfigurationTemplates(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would return configuration templates
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for retrieving configuration backups
     *
     * This method is not yet implemented. When completed, it should return
     * a list of available configuration backups that users can restore from.
     *
     * @param message - The get configuration backups message
     * @param webview - The webview to send the response to
     */
    private async handleGetConfigurationBackups(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would return configuration backups
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for validating configuration
     *
     * This method is not yet implemented. When completed, it should validate
     * the current configuration to ensure all settings are correct and compatible.
     *
     * @param message - The validate configuration message
     * @param webview - The webview to send the response to
     */
    private async handleValidateConfiguration(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would validate configuration
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for applying configuration templates
     *
     * This method is not yet implemented. When completed, it should apply
     * a selected configuration template to set up the extension for a specific use case.
     *
     * @param message - The apply configuration template message
     * @param webview - The webview to send the response to
     */
    private async handleApplyConfigurationTemplate(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would apply configuration template
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for creating configuration backups
     *
     * This method is not yet implemented. When completed, it should create
     * a backup of the current configuration that can be restored later.
     *
     * @param message - The create configuration backup message
     * @param webview - The webview to send the response to
     */
    private async handleCreateConfigurationBackup(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would create configuration backup
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Placeholder handler for restoring configuration backups
     *
     * This method is not yet implemented. When completed, it should restore
     * the extension configuration from a previously created backup.
     *
     * @param message - The restore configuration backup message
     * @param webview - The webview to send the response to
     */
    private async handleRestoreConfigurationBackup(message: any, webview: vscode.Webview): Promise<void> {
        // Implementation would restore configuration backup
        await this.sendErrorResponse(webview, 'Not implemented yet');
    }

    /**
     * Gets the list of available workspaces
     *
     * This handler retrieves all available workspace folders and their information,
     * including the currently active workspace.
     *
     * @param webview - The webview to send the response to
     */
    private async handleGetWorkspaceList(webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling get workspace list request');

            if (!this.workspaceManager) {
                await webview.postMessage({
                    command: 'workspaceListResponse',
                    success: false,
                    error: 'Workspace manager not available'
                });
                return;
            }

            const workspaces = this.workspaceManager.getAllWorkspaces();
            const currentWorkspace = this.workspaceManager.getCurrentWorkspace();

            await webview.postMessage({
                command: 'workspaceListResponse',
                success: true,
                data: {
                    workspaces: workspaces,
                    current: currentWorkspace?.id || null
                }
            });

        } catch (error) {
            console.error('MessageRouter: Error getting workspace list:', error);
            await this.sendErrorResponse(webview, `Failed to get workspace list: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Switches to a different workspace
     *
     * This handler changes the active workspace and notifies the UI of the change.
     *
     * @param message - The switch workspace message containing the workspace ID
     * @param webview - The webview to send the response to
     */
    private async handleSwitchWorkspace(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling switch workspace request');

            if (!this.workspaceManager) {
                await webview.postMessage({
                    command: 'workspaceSwitchResponse',
                    success: false,
                    error: 'Workspace manager not available'
                });
                return;
            }

            const workspaceId = message.data?.workspaceId;
            if (!workspaceId) {
                await webview.postMessage({
                    command: 'workspaceSwitchResponse',
                    success: false,
                    error: 'Workspace ID is required'
                });
                return;
            }

            const success = this.workspaceManager.switchToWorkspace(workspaceId);

            if (success) {
                await webview.postMessage({
                    command: 'workspaceSwitchResponse',
                    success: true,
                    data: {
                        workspaceId: workspaceId
                    }
                });
            } else {
                await webview.postMessage({
                    command: 'workspaceSwitchResponse',
                    success: false,
                    error: 'Workspace not found'
                });
            }

        } catch (error) {
            console.error('MessageRouter: Error switching workspace:', error);
            await this.sendErrorResponse(webview, `Failed to switch workspace: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Gets workspace statistics
     *
     * This handler retrieves statistics about the current workspace setup,
     * including the total number of workspaces and current workspace info.
     *
     * @param webview - The webview to send the response to
     */
    private async handleGetWorkspaceStats(webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling get workspace stats request');

            if (!this.workspaceManager) {
                await webview.postMessage({
                    command: 'workspaceStatsResponse',
                    success: false,
                    error: 'Workspace manager not available'
                });
                return;
            }

            const stats = this.workspaceManager.getWorkspaceStats();

            await webview.postMessage({
                command: 'workspaceStatsResponse',
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('MessageRouter: Error getting workspace stats:', error);
            await this.sendErrorResponse(webview, `Failed to get workspace stats: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handles database connection testing requests
     */
    private async handleTestDatabaseConnection(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { database, config } = message;
            console.log('MessageRouter: Testing database connection:', database, config);

            let testResult;
            const startTime = Date.now();

            // Route to appropriate database test method based on type
            switch (database) {
                case 'qdrant':
                    testResult = await this.testQdrantConnection(config);
                    break;
                case 'pinecone':
                    testResult = await this.testPineconeConnection(config);
                    break;
                case 'chroma':
                    testResult = await this.testChromaConnection(config);
                    break;
                default:
                    throw new Error(`Unsupported database type for testing: ${database}`);
            }

            const latency = Date.now() - startTime;

            await webview.postMessage({
                command: 'databaseConnectionTestResult',
                success: testResult.success,
                data: {
                    ...testResult,
                    latency,
                    database
                }
            });

        } catch (error) {
            console.error('MessageRouter: Error testing database connection:', error);
            await webview.postMessage({
                command: 'databaseConnectionTestResult',
                success: false,
                data: {
                    success: false,
                    message: error instanceof Error ? error.message : 'Connection test failed',
                    database: message.database
                }
            });
        }
    }

    /**
     * Handles AI provider connection testing requests
     */
    private async handleTestProviderConnection(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { provider, config } = message;
            console.log('MessageRouter: Testing provider connection:', provider, config);

            let testResult;
            const startTime = Date.now();

            // Route to appropriate provider test method based on type
            switch (provider) {
                case 'ollama':
                    testResult = await this.testOllamaConnection(config);
                    break;
                case 'openai':
                    testResult = await this.testOpenAIConnection(config);
                    break;
                case 'anthropic':
                    testResult = await this.testAnthropicConnection(config);
                    break;
                default:
                    throw new Error(`Unsupported provider type for testing: ${provider}`);
            }

            const latency = Date.now() - startTime;

            await webview.postMessage({
                command: 'providerConnectionTestResult',
                success: testResult.success,
                data: {
                    ...testResult,
                    latency,
                    provider
                }
            });

        } catch (error) {
            console.error('MessageRouter: Error testing provider connection:', error);
            await webview.postMessage({
                command: 'providerConnectionTestResult',
                success: false,
                data: {
                    success: false,
                    message: error instanceof Error ? error.message : 'Connection test failed',
                    provider: message.provider
                }
            });
        }
    }

    /**
     * Test Qdrant database connection
     */
    private async testQdrantConnection(config: any): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            const url = config.url || 'http://localhost:6333';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (config.apiKey) {
                headers['api-key'] = config.apiKey;
            }

            const response = await fetch(`${url}/collections`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                return {
                    success: false,
                    message: `Qdrant connection failed: ${response.status} ${response.statusText}`
                };
            }

            const data = await response.json();

            return {
                success: true,
                message: 'Successfully connected to Qdrant',
                details: {
                    collections: data.result?.collections || [],
                    version: response.headers.get('server') || 'unknown'
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed'
            };
        }
    }

    /**
     * Test Pinecone database connection
     */
    private async testPineconeConnection(config: any): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            const response = await fetch(`https://${config.indexName}-${config.environment}.svc.pinecone.io/describe_index_stats`, {
                method: 'POST',
                headers: {
                    'Api-Key': config.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                return {
                    success: false,
                    message: `Pinecone connection failed: ${response.status} ${response.statusText}`
                };
            }

            const data = await response.json();

            return {
                success: true,
                message: 'Successfully connected to Pinecone',
                details: {
                    indexStats: data,
                    environment: config.environment,
                    indexName: config.indexName
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed'
            };
        }
    }

    /**
     * Test ChromaDB connection
     */
    private async testChromaConnection(config: any): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            const protocol = config.ssl ? 'https' : 'http';
            const port = config.port ? `:${config.port}` : '';
            const baseUrl = `${protocol}://${config.host}${port}`;

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (config.apiKey) {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }

            const response = await fetch(`${baseUrl}/api/v1/heartbeat`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                return {
                    success: false,
                    message: `ChromaDB connection failed: ${response.status} ${response.statusText}`
                };
            }

            const data = await response.json();

            return {
                success: true,
                message: 'Successfully connected to ChromaDB',
                details: {
                    heartbeat: data,
                    endpoint: baseUrl
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed'
            };
        }
    }

    /**
     * Test Ollama provider connection
     */
    private async testOllamaConnection(config: any): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            const baseUrl = config.baseUrl || 'http://localhost:11434';

            // First check if Ollama is running
            const healthResponse = await fetch(`${baseUrl}/api/version`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000),
            });

            if (!healthResponse.ok) {
                return {
                    success: false,
                    message: `Ollama is not running or not accessible at ${baseUrl}`
                };
            }

            // Test embedding generation with the configured model
            const embeddingResponse = await fetch(`${baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.model,
                    prompt: 'test',
                }),
                signal: AbortSignal.timeout(30000),
            });

            if (!embeddingResponse.ok) {
                const errorText = await embeddingResponse.text();
                return {
                    success: false,
                    message: `Failed to generate embedding: ${embeddingResponse.status} ${embeddingResponse.statusText}`,
                    details: { error: errorText, model: config.model }
                };
            }

            const data = await embeddingResponse.json();

            return {
                success: true,
                message: `Successfully generated embedding with ${config.model}`,
                details: {
                    model: config.model,
                    embeddingLength: data.embedding?.length || 0
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed'
            };
        }
    }

    /**
     * Test OpenAI provider connection
     */
    private async testOpenAIConnection(config: any): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                return {
                    success: false,
                    message: `OpenAI API error: ${response.status} ${response.statusText}`
                };
            }

            return {
                success: true,
                message: 'Successfully connected to OpenAI API',
                details: { provider: 'openai', model: config.model }
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed'
            };
        }
    }

    /**
     * Test Anthropic provider connection
     */
    private async testAnthropicConnection(config: any): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            // Anthropic doesn't have a simple health check endpoint, so we'll just validate the API key format
            if (!config.apiKey.startsWith('sk-ant-')) {
                return {
                    success: false,
                    message: 'Invalid Anthropic API key format (should start with sk-ant-)'
                };
            }

            return {
                success: true,
                message: 'Anthropic API key format is valid',
                details: { provider: 'anthropic', model: config.model }
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }

    /**
     * Handles requests to open external links
     */
    private async handleOpenExternalLink(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { url } = message;
            console.log('MessageRouter: Opening external link:', url);

            if (!url || typeof url !== 'string') {
                throw new Error('Invalid URL provided');
            }

            // Use VS Code's built-in command to open external links
            await vscode.env.openExternal(vscode.Uri.parse(url));

        } catch (error) {
            console.error('MessageRouter: Error opening external link:', error);
            await webview.postMessage({
                command: 'linkOpenError',
                success: false,
                data: {
                    message: error instanceof Error ? error.message : 'Failed to open link'
                }
            });
        }
    }
}
