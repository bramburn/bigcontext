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

/**
 * MessageRouter class responsible for routing and handling messages from webview panels.
 * 
 * This class centralizes all webview message handling logic, providing a clean separation
 * between webview communication and service logic. It handles:
 * - Message routing based on command types
 * - Service integration for handling requests
 * - Response formatting and error handling
 * - Type-safe message handling
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

    /**
     * Creates a new MessageRouter instance
     * @param contextService - The ContextService instance for context operations
     * @param indexingService - The IndexingService instance for indexing operations
     * @param context - The VS Code extension context for accessing secrets and other APIs
     * @param stateManager - The StateManager instance for state management
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
     * Sets the advanced managers for enhanced functionality
     * @param searchManager - The SearchManager instance
     * @param legacyConfigurationManager - The legacy ConfigurationManager instance
     * @param performanceManager - The PerformanceManager instance
     * @param xmlFormatterService - The XmlFormatterService instance
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
     * Routes and handles a message from a webview
     * @param message - The message object from the webview
     * @param webview - The webview that sent the message
     */
    async handleMessage(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Handling message:', message.command);

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
                case 'advancedSearch':
                    await this.handleAdvancedSearch(message, webview);
                    break;
                case 'getSearchSuggestions':
                    await this.handleGetSearchSuggestions(message, webview);
                    break;
                case 'getSearchHistory':
                    await this.handleGetSearchHistory(webview);
                    break;
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
                case 'MapToSettings':
                    await this.handleMapToSettings(webview);
                    break;
                case 'openSettings':
                    await this.handleMapToSettings(webview);
                    break;
                default:
                    console.warn('MessageRouter: Unknown command:', message.command);
                    await this.sendErrorResponse(webview, `Unknown command: ${message.command}`);
                    break;
            }
        } catch (error) {
            console.error('MessageRouter: Error handling message:', error);
            await this.sendErrorResponse(webview, error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Handles the 'ping' message
     * Simple ping-pong test for communication verification
     */
    private async handlePing(message: any, webview: vscode.Webview): Promise<void> {
        console.log('MessageRouter: Received ping from webview', message.requestId);

        await webview.postMessage({
            command: 'pong',
            requestId: message.requestId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handles the 'checkSetupStatus' message
     * Checks if the workspace is configured for first-time setup
     */
    private async handleCheckSetupStatus(message: any, webview: vscode.Webview): Promise<void> {
        try {
            // Check if workspace has configuration
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

            // Check if services are configured and running
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
     * Handles the 'startDatabase' message
     * Starts the local database (Qdrant, ChromaDB via Docker)
     */
    private async handleStartDatabase(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { database, config } = message;
            console.log('MessageRouter: Starting database:', database, config);

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
     * Handles the 'validateDatabase' message
     * Validates cloud database connections (e.g., Pinecone)
     */
    private async handleValidateDatabase(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { database, config } = message;
            console.log('MessageRouter: Validating database:', database);

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
     * Start Qdrant database
     */
    private async startQdrant(webview: vscode.Webview): Promise<void> {
        const terminal = vscode.window.createTerminal('Qdrant Database');
        terminal.sendText('docker run -p 6333:6333 qdrant/qdrant');
        terminal.show();

        await webview.postMessage({
            command: 'databaseStarted',
            data: { database: 'qdrant', status: 'starting' }
        });

        this.pollDatabaseHealth(webview, 'qdrant');
    }

    /**
     * Start ChromaDB database
     */
    private async startChromaDB(webview: vscode.Webview, config: any): Promise<void> {
        const port = config?.port || 8000;
        const terminal = vscode.window.createTerminal('ChromaDB Database');
        terminal.sendText(`docker run -p ${port}:8000 chromadb/chroma`);
        terminal.show();

        await webview.postMessage({
            command: 'databaseStarted',
            data: { database: 'chromadb', status: 'starting' }
        });

        this.pollDatabaseHealth(webview, 'chromadb', config);
    }

    /**
     * Validate Pinecone connection
     */
    private async validatePinecone(webview: vscode.Webview, config: any): Promise<void> {
        if (!config?.apiKey || !config?.environment) {
            throw new Error('Pinecone API key and environment are required');
        }

        try {
            // Test Pinecone connection by listing indexes
            const response = await fetch(`https://controller.${config.environment}.pinecone.io/databases`, {
                method: 'GET',
                headers: {
                    'Api-Key': config.apiKey,
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                await webview.postMessage({
                    command: 'databaseStatus',
                    data: { status: 'running' }
                });
            } else if (response.status === 401) {
                throw new Error('Invalid Pinecone API key');
            } else if (response.status === 403) {
                throw new Error('Access denied - check your API key permissions');
            } else {
                throw new Error(`Pinecone connection failed: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Pinecone connection timeout - check your environment');
            }
            throw error;
        }
    }

    /**
     * Poll database health and update webview
     */
    private async pollDatabaseHealth(webview: vscode.Webview, database: string, config?: any): Promise<void> {
        const maxAttempts = 30; // 30 seconds
        let attempts = 0;

        const checkHealth = async (): Promise<void> => {
            try {
                attempts++;
                let healthUrl: string;

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

                const response = await fetch(healthUrl);
                if (response.ok) {
                    await webview.postMessage({
                        command: 'databaseStatus',
                        data: { status: 'running' }
                    });
                    return;
                }

                if (attempts < maxAttempts) {
                    setTimeout(checkHealth, 1000); // Check again in 1 second
                } else {
                    await webview.postMessage({
                        command: 'databaseStatus',
                        data: {
                            status: 'error',
                            error: `${database} failed to start within 30 seconds`
                        }
                    });
                }

            } catch (error) {
                if (attempts < maxAttempts) {
                    setTimeout(checkHealth, 1000); // Check again in 1 second
                } else {
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

        // Start health checking
        setTimeout(checkHealth, 2000); // Wait 2 seconds before first check
    }

    /**
     * Handles the 'getFileContent' message
     * Retrieves file content with optional related chunks
     */
    private async handleGetFileContent(message: any, webview: vscode.Webview): Promise<void> {
        const { filePath, includeRelatedChunks = false } = message;
        
        if (!filePath) {
            await this.sendErrorResponse(webview, 'File path is required');
            return;
        }

        const result = await this.contextService.getFileContent(filePath, includeRelatedChunks);
        
        await webview.postMessage({
            command: 'fileContentResponse',
            requestId: message.requestId,
            data: result
        });
    }

    /**
     * Handles the 'findRelatedFiles' message
     * Finds files related to a query
     */
    private async handleFindRelatedFiles(message: any, webview: vscode.Webview): Promise<void> {
        const { query, currentFilePath, maxResults = 10, minSimilarity = 0.5 } = message;
        
        if (!query) {
            await this.sendErrorResponse(webview, 'Query is required');
            return;
        }

        const result = await this.contextService.findRelatedFiles(
            query, 
            currentFilePath, 
            maxResults, 
            minSimilarity
        );
        
        await webview.postMessage({
            command: 'relatedFilesResponse',
            requestId: message.requestId,
            data: result
        });
    }

    /**
     * Handles the 'queryContext' message
     * Performs advanced context queries
     */
    private async handleQueryContext(message: any, webview: vscode.Webview): Promise<void> {
        const { contextQuery } = message;

        if (!contextQuery) {
            await this.sendErrorResponse(webview, 'Context query is required');
            return;
        }

        const result = await this.contextService.queryContext(contextQuery as ContextQuery);

        await webview.postMessage({
            command: 'contextQueryResponse',
            requestId: message.requestId,
            data: result
        });
    }

    /**
     * Handles the 'search' message
     * Performs a search with the new advanced parameters
     */
    private async handleSearch(message: any, webview: vscode.Webview): Promise<void> {
        const { query, maxResults = 20, includeContent = false } = message;

        if (!query) {
            await this.sendErrorResponse(webview, 'Search query is required');
            return;
        }

        try {
            // Create a ContextQuery object with the new parameters
            const contextQuery: ContextQuery = {
                query: query,
                maxResults: maxResults,
                includeContent: includeContent,
                includeRelated: false // Default to false for basic search
            };

            const result = await this.contextService.queryContext(contextQuery);

            // Check if XML formatting is requested and service is available
            if (this.xmlFormatterService && includeContent) {
                // Format results as XML when content is included
                const xmlResults = this.xmlFormatterService.formatResults(result.results, {
                    prettyPrint: true,
                    includeMetadata: true
                });

                await webview.postMessage({
                    command: 'searchResults',
                    results: xmlResults, // Send XML string instead of array
                    totalResults: result.totalResults,
                    searchTime: result.processingTime,
                    query: result.query,
                    format: 'xml'
                });
            } else {
                // Transform the results to match the expected format for the UI
                const searchResults = result.results.map((r, index) => ({
                    id: `${r.payload.filePath}-${r.payload.startLine}-${index}`,
                    file: r.payload.filePath,
                    content: r.payload.content || '',
                    score: r.score,
                    lineNumber: r.payload.startLine,
                    context: r.payload.content
                }));

                await webview.postMessage({
                    command: 'searchResults',
                    results: searchResults,
                    totalResults: result.totalResults,
                    searchTime: result.processingTime,
                    query: result.query,
                    format: 'json'
                });
            }
        } catch (error) {
            console.error('Search failed:', error);
            await webview.postMessage({
                command: 'searchError',
                message: `Search failed: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    /**
     * Handles the 'getServiceStatus' message
     * Retrieves the current status of all services
     */
    private async handleGetServiceStatus(webview: vscode.Webview): Promise<void> {
        const status = await this.contextService.getStatus();
        
        await webview.postMessage({
            command: 'serviceStatusResponse',
            data: status
        });
    }

    /**
     * Handles the 'startIndexing' message
     * Starts the indexing process with progress updates
     */
    private async handleStartIndexing(webview: vscode.Webview): Promise<void> {
        try {
            // Check if indexing is already in progress
            if (this.stateManager.isIndexing()) {
                await this.sendErrorResponse(webview, 'Indexing is already in progress. Please wait for the current operation to complete.');
                return;
            }

            // Check if workspace is available
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                await this.sendErrorResponse(webview, 'No workspace folder is open');
                return;
            }

            // Send initial response
            await webview.postMessage({
                command: 'indexingStarted',
                message: 'Indexing process started'
            });

            // Start indexing with progress callback
            const result = await this.indexingService.startIndexing((progressInfo) => {
                webview.postMessage({
                    command: 'indexingProgress',
                    data: {
                        phase: progressInfo.currentPhase,
                        currentFile: progressInfo.currentFile,
                        processedFiles: progressInfo.processedFiles,
                        totalFiles: progressInfo.totalFiles,
                        percentage: Math.round((progressInfo.processedFiles / progressInfo.totalFiles) * 100)
                    }
                });
            });

            // Send completion response
            await webview.postMessage({
                command: 'indexingCompleted',
                data: {
                    success: result.success,
                    processedFiles: result.processedFiles,
                    chunksCreated: result.chunks.length,
                    errors: result.errors
                }
            });

        } catch (error) {
            await this.sendErrorResponse(webview, `Indexing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handles the 'advancedSearch' message
     * Performs advanced search with filters
     */
    private async handleAdvancedSearch(message: any, webview: vscode.Webview): Promise<void> {
        if (!this.searchManager) {
            await this.sendErrorResponse(webview, 'Advanced search not available');
            return;
        }

        const { query, filters } = message;

        if (!query) {
            await this.sendErrorResponse(webview, 'Search query is required');
            return;
        }

        const results = await this.performanceManager?.measurePerformance('advancedSearch', async () => {
            return this.searchManager!.search(query, filters as SearchFilters);
        }) || await this.searchManager.search(query, filters as SearchFilters);

        await webview.postMessage({
            command: 'advancedSearchResponse',
            requestId: message.requestId,
            data: results
        });
    }

    /**
     * Handles the 'getSearchSuggestions' message
     * Gets search suggestions based on partial query
     */
    private async handleGetSearchSuggestions(message: any, webview: vscode.Webview): Promise<void> {
        if (!this.searchManager) {
            await this.sendErrorResponse(webview, 'Search suggestions not available');
            return;
        }

        const { partialQuery } = message;
        const suggestions = this.searchManager.getSuggestions(partialQuery || '');

        await webview.postMessage({
            command: 'searchSuggestionsResponse',
            requestId: message.requestId,
            data: suggestions
        });
    }

    /**
     * Handles the 'getSearchHistory' message
     * Gets recent search history
     */
    private async handleGetSearchHistory(webview: vscode.Webview): Promise<void> {
        if (!this.searchManager) {
            await this.sendErrorResponse(webview, 'Search history not available');
            return;
        }

        const history = this.searchManager.getSearchHistory();

        await webview.postMessage({
            command: 'searchHistoryResponse',
            data: history
        });
    }



    /**
     * Handles the 'getConfigurationPresets' message
     * Gets available configuration presets
     */
    private async handleGetConfigurationPresets(webview: vscode.Webview): Promise<void> {
        if (!this.configurationManager) {
            await this.sendErrorResponse(webview, 'Configuration presets not available');
            return;
        }

        const presets = this.configurationManager.getConfigurationPresets();

        await webview.postMessage({
            command: 'configurationPresetsResponse',
            data: presets
        });
    }

    /**
     * Handles the 'applyConfigurationPreset' message
     * Applies a configuration preset
     */
    private async handleApplyConfigurationPreset(message: any, webview: vscode.Webview): Promise<void> {
        if (!this.configurationManager) {
            await this.sendErrorResponse(webview, 'Configuration presets not available');
            return;
        }

        const { presetName } = message;

        if (!presetName) {
            await this.sendErrorResponse(webview, 'Preset name is required');
            return;
        }

        try {
            await this.configurationManager.applyPreset(presetName);

            await webview.postMessage({
                command: 'configurationPresetAppliedResponse',
                requestId: message.requestId,
                data: { success: true, presetName }
            });
        } catch (error) {
            await this.sendErrorResponse(webview, `Failed to apply preset: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handles the 'getPerformanceMetrics' message
     * Gets current performance metrics
     */
    private async handleGetPerformanceMetrics(webview: vscode.Webview): Promise<void> {
        if (!this.performanceManager) {
            await this.sendErrorResponse(webview, 'Performance metrics not available');
            return;
        }

        const metrics = this.performanceManager.getMetrics();

        await webview.postMessage({
            command: 'performanceMetricsResponse',
            data: metrics
        });
    }

    /**
     * Handles the 'getFilePreview' message
     * Gets file preview for a specific location
     */
    private async handleGetFilePreview(message: any, webview: vscode.Webview): Promise<void> {
        if (!this.searchManager) {
            await this.sendErrorResponse(webview, 'File preview not available');
            return;
        }

        const { filePath, lineNumber, contextLines } = message;

        if (!filePath || !lineNumber) {
            await this.sendErrorResponse(webview, 'File path and line number are required');
            return;
        }

        try {
            const preview = await this.searchManager.getFilePreview(filePath, lineNumber, contextLines);

            await webview.postMessage({
                command: 'filePreviewResponse',
                requestId: message.requestId,
                data: { preview, filePath, lineNumber }
            });
        } catch (error) {
            await this.sendErrorResponse(webview, `Failed to get file preview: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Sends an error response to the webview
     * @param webview - The webview to send the error to
     * @param message - The error message
     */
    private async sendErrorResponse(webview: vscode.Webview, message: string): Promise<void> {
        await webview.postMessage({
            command: 'error',
            message: message
        });
    }

    /**
     * Handles the 'saveSecretValue' message
     * Saves sensitive data securely using VS Code's SecretStorage API
     */
    private async handleSaveSecretValue(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { key, value } = message;

            if (!key || !value) {
                throw new Error('Key and value are required for saving secrets');
            }

            // Use VS Code's SecretStorage API to store the value securely
            await this.context.secrets.store(key, value);

            await webview.postMessage({
                command: 'response',
                requestId: message.requestId,
                data: { success: true }
            });

            console.log(`MessageRouter: Secret value saved for key: ${key}`);

        } catch (error) {
            console.error('MessageRouter: Error saving secret value:', error);
            await webview.postMessage({
                command: 'response',
                requestId: message.requestId,
                error: error instanceof Error ? error.message : String(error),
                data: { success: false }
            });
        }
    }

    /**
     * Handles the 'getSecretValue' message
     * Retrieves sensitive data securely using VS Code's SecretStorage API
     */
    private async handleGetSecretValue(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { key } = message;

            if (!key) {
                throw new Error('Key is required for retrieving secrets');
            }

            // Use VS Code's SecretStorage API to retrieve the value securely
            const value = await this.context.secrets.get(key);

            await webview.postMessage({
                command: 'response',
                requestId: message.requestId,
                data: { value: value || null }
            });

            console.log(`MessageRouter: Secret value retrieved for key: ${key} (${value ? 'found' : 'not found'})`);

        } catch (error) {
            console.error('MessageRouter: Error retrieving secret value:', error);
            await webview.postMessage({
                command: 'response',
                requestId: message.requestId,
                error: error instanceof Error ? error.message : String(error),
                data: { value: null }
            });
        }
    }

    /**
     * Handles the 'runSystemValidation' message
     * Runs comprehensive system validation checks
     */
    private async handleRunSystemValidation(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Running system validation');

            const validationReport = await this.systemValidator.validateSystem();

            await webview.postMessage({
                command: 'validationResults',
                data: validationReport
            });

            console.log(`MessageRouter: System validation completed - ${validationReport.overallStatus}`);

        } catch (error) {
            console.error('MessageRouter: Error running system validation:', error);
            await webview.postMessage({
                command: 'validationResults',
                data: {
                    overallStatus: 'fail',
                    results: [{
                        isValid: false,
                        category: 'system',
                        check: 'System Validation',
                        status: 'fail',
                        message: 'Failed to run system validation',
                        details: error instanceof Error ? error.message : String(error)
                    }],
                    summary: { passed: 0, warnings: 0, failed: 1 }
                }
            });
        }
    }

    /**
     * Handles the 'getTroubleshootingGuides' message
     * Gets relevant troubleshooting guides based on validation results
     */
    private async handleGetTroubleshootingGuides(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { validationResults } = message;
            console.log('MessageRouter: Getting troubleshooting guides');

            const suggestedGuides = this.troubleshootingSystem.getSuggestedGuides(validationResults);

            await webview.postMessage({
                command: 'troubleshootingGuides',
                data: suggestedGuides
            });

            console.log(`MessageRouter: Found ${suggestedGuides.length} troubleshooting guides`);

        } catch (error) {
            console.error('MessageRouter: Error getting troubleshooting guides:', error);
            await webview.postMessage({
                command: 'troubleshootingGuides',
                data: []
            });
        }
    }

    /**
     * Handles the 'runAutoFix' message
     * Attempts to automatically fix common issues
     */
    private async handleRunAutoFix(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { check } = message;
            console.log(`MessageRouter: Running auto-fix for: ${check}`);

            const result = await this.systemValidator.autoFix(check);

            await webview.postMessage({
                command: 'autoFixResult',
                data: result
            });

            console.log(`MessageRouter: Auto-fix result: ${result.success ? 'success' : 'failed'}`);

        } catch (error) {
            console.error('MessageRouter: Error running auto-fix:', error);
            await webview.postMessage({
                command: 'autoFixResult',
                data: {
                    success: false,
                    message: `Auto-fix failed: ${error instanceof Error ? error.message : String(error)}`
                }
            });
        }
    }

    /**
     * Handles the 'openTroubleshootingGuide' message
     * Opens a specific troubleshooting guide in a new webview
     */
    private async handleOpenTroubleshootingGuide(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { guideId } = message;
            console.log(`MessageRouter: Opening troubleshooting guide: ${guideId}`);

            const guide = this.troubleshootingSystem.getGuide(guideId);

            if (guide) {
                // For now, we'll send the guide data back to the webview
                // In a full implementation, you might open a new webview panel
                await webview.postMessage({
                    command: 'troubleshootingGuideOpened',
                    data: guide
                });
            } else {
                await webview.postMessage({
                    command: 'error',
                    data: { message: `Troubleshooting guide not found: ${guideId}` }
                });
            }

        } catch (error) {
            console.error('MessageRouter: Error opening troubleshooting guide:', error);
            await webview.postMessage({
                command: 'error',
                data: { message: `Failed to open troubleshooting guide: ${error}` }
            });
        }
    }

    /**
     * Handles the 'exportConfiguration' message
     * Exports current configuration to a file
     */
    private async handleExportConfiguration(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { options } = message;
            console.log('MessageRouter: Exporting configuration');

            // Get current configuration (this would be implemented based on your current config storage)
            const currentConfig = this.configurationManager.createDefaultConfiguration();

            const result = await this.configurationManager.exportConfiguration(currentConfig, undefined, options);

            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: result.success,
                    message: result.success ? `Configuration exported to ${result.filePath}` : result.error,
                    type: 'export'
                }
            });

        } catch (error) {
            console.error('MessageRouter: Error exporting configuration:', error);
            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: false,
                    message: `Export failed: ${error instanceof Error ? error.message : String(error)}`,
                    type: 'export'
                }
            });
        }
    }

    /**
     * Handles the 'importConfiguration' message
     * Imports configuration from provided data
     */
    private async handleImportConfiguration(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { configData, options } = message;
            console.log('MessageRouter: Importing configuration');

            // Validate the imported configuration
            const validation = this.configurationManager.validateConfiguration(configData);

            if (!validation.isValid) {
                await webview.postMessage({
                    command: 'configurationOperationResult',
                    data: {
                        success: false,
                        message: `Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`,
                        type: 'import'
                    }
                });
                return;
            }

            // Here you would apply the configuration to your system
            // For now, we'll just report success
            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: true,
                    message: 'Configuration imported successfully',
                    type: 'import'
                }
            });

        } catch (error) {
            console.error('MessageRouter: Error importing configuration:', error);
            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: false,
                    message: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
                    type: 'import'
                }
            });
        }
    }

    /**
     * Handles the 'getConfigurationTemplates' message
     * Gets available configuration templates
     */
    private async handleGetConfigurationTemplates(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Getting configuration templates');

            const templates = await this.configurationManager.listTemplates();
            const presets = this.configurationManager.getConfigurationPresets();

            // Combine templates and presets
            const allTemplates = [...templates, ...presets];

            await webview.postMessage({
                command: 'configurationTemplates',
                data: allTemplates
            });

        } catch (error) {
            console.error('MessageRouter: Error getting configuration templates:', error);
            await webview.postMessage({
                command: 'configurationTemplates',
                data: []
            });
        }
    }

    /**
     * Handles the 'getConfigurationBackups' message
     * Gets available configuration backups
     */
    private async handleGetConfigurationBackups(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Getting configuration backups');

            const backups = await this.configurationManager.listBackups();

            await webview.postMessage({
                command: 'configurationBackups',
                data: backups
            });

        } catch (error) {
            console.error('MessageRouter: Error getting configuration backups:', error);
            await webview.postMessage({
                command: 'configurationBackups',
                data: []
            });
        }
    }

    /**
     * Handles the 'validateConfiguration' message
     * Validates current configuration
     */
    private async handleValidateConfiguration(message: any, webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Validating configuration');

            // Get current configuration (this would be implemented based on your current config storage)
            const currentConfig = this.configurationManager.createDefaultConfiguration();

            const validation = this.configurationManager.validateConfiguration(currentConfig);

            await webview.postMessage({
                command: 'validationResult',
                data: validation
            });

        } catch (error) {
            console.error('MessageRouter: Error validating configuration:', error);
            await webview.postMessage({
                command: 'validationResult',
                data: {
                    isValid: false,
                    errors: [{
                        path: 'system',
                        message: 'Failed to validate configuration',
                        severity: 'error'
                    }],
                    warnings: []
                }
            });
        }
    }

    /**
     * Handles the 'applyConfigurationTemplate' message
     * Applies a configuration template
     */
    private async handleApplyConfigurationTemplate(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { templateId } = message;
            console.log(`MessageRouter: Applying configuration template: ${templateId}`);

            const result = await this.configurationManager.applyPreset(templateId);

            if (!result.success) {
                // Try loading as custom template
                const templateResult = await this.configurationManager.loadTemplate(templateId);
                if (templateResult.success && templateResult.template) {
                    await webview.postMessage({
                        command: 'configurationOperationResult',
                        data: {
                            success: true,
                            message: `Template "${templateResult.template.name}" applied successfully`,
                            type: 'template'
                        }
                    });
                    return;
                }
            }

            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: result.success,
                    message: result.success ? 'Template applied successfully' : result.error,
                    type: 'template'
                }
            });

        } catch (error) {
            console.error('MessageRouter: Error applying configuration template:', error);
            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: false,
                    message: `Failed to apply template: ${error instanceof Error ? error.message : String(error)}`,
                    type: 'template'
                }
            });
        }
    }

    /**
     * Handles the 'createConfigurationBackup' message
     * Creates a new configuration backup
     */
    private async handleCreateConfigurationBackup(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { reason, description } = message;
            console.log('MessageRouter: Creating configuration backup');

            // Get current configuration (this would be implemented based on your current config storage)
            const currentConfig = this.configurationManager.createDefaultConfiguration();

            const result = await this.configurationManager.createBackup(currentConfig, reason, description);

            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: result.success,
                    message: result.success ? 'Backup created successfully' : result.error,
                    type: 'backup'
                }
            });

        } catch (error) {
            console.error('MessageRouter: Error creating configuration backup:', error);
            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: false,
                    message: `Failed to create backup: ${error instanceof Error ? error.message : String(error)}`,
                    type: 'backup'
                }
            });
        }
    }

    /**
     * Handles the 'restoreConfigurationBackup' message
     * Restores configuration from a backup
     */
    private async handleRestoreConfigurationBackup(message: any, webview: vscode.Webview): Promise<void> {
        try {
            const { backupId } = message;
            console.log(`MessageRouter: Restoring configuration backup: ${backupId}`);

            const result = await this.configurationManager.restoreBackup(backupId);

            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: result.success,
                    message: result.success ? 'Configuration restored successfully' : result.error,
                    type: 'restore'
                }
            });

        } catch (error) {
            console.error('MessageRouter: Error restoring configuration backup:', error);
            await webview.postMessage({
                command: 'configurationOperationResult',
                data: {
                    success: false,
                    message: `Failed to restore backup: ${error instanceof Error ? error.message : String(error)}`,
                    type: 'restore'
                }
            });
        }
    }

    /**
     * Updates the services used by the message router
     * This allows for dynamic service updates if needed
     * @param contextService - New ContextService instance
     * @param indexingService - New IndexingService instance
     */
    public updateServices(contextService: ContextService, indexingService: IndexingService): void {
        this.contextService = contextService;
        this.indexingService = indexingService;
        console.log('MessageRouter: Services updated');
    }

    /**
     * Handles the 'MapToSettings' message
     * Opens the native VS Code settings UI filtered for this extension
     */
    private async handleMapToSettings(webview: vscode.Webview): Promise<void> {
        try {
            console.log('MessageRouter: Opening native settings from diagnostics panel...');

            // Open the native VS Code settings UI, filtered for this extension
            await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');

            console.log('MessageRouter: Native settings opened successfully from diagnostics panel');
        } catch (error) {
            console.error('MessageRouter: Failed to open settings from diagnostics panel:', error);
            await this.sendErrorResponse(webview, 'Failed to open settings');
        }
    }
}
