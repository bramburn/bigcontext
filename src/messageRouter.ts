import * as vscode from 'vscode';
import { ContextService, ContextQuery, FileContentResult, RelatedFile } from './context/contextService';
import { IndexingService } from './indexing/indexingService';

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

    /**
     * Creates a new MessageRouter instance
     * @param contextService - The ContextService instance for context operations
     * @param indexingService - The IndexingService instance for indexing operations
     */
    constructor(contextService: ContextService, indexingService: IndexingService) {
        this.contextService = contextService;
        this.indexingService = indexingService;
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
                case 'getFileContent':
                    await this.handleGetFileContent(message, webview);
                    break;
                case 'findRelatedFiles':
                    await this.handleFindRelatedFiles(message, webview);
                    break;
                case 'queryContext':
                    await this.handleQueryContext(message, webview);
                    break;
                case 'getServiceStatus':
                    await this.handleGetServiceStatus(webview);
                    break;
                case 'startIndexing':
                    await this.handleStartIndexing(webview);
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
}
