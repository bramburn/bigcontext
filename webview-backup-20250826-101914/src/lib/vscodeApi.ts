// VS Code API types
interface VSCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

// Declare the global vscode API
declare const acquireVsCodeApi: () => VSCodeApi;

// Message types for type safety
export interface SearchRequest {
    command: 'search';
    query: string;
}

export interface FileContentRequest {
    command: 'getFileContent';
    requestId: string;
    filePath: string;
    includeRelatedChunks?: boolean;
}

export interface RelatedFilesRequest {
    command: 'findRelatedFiles';
    requestId: string;
    query: string;
    currentFilePath?: string;
    maxResults?: number;
    minSimilarity?: number;
}

export interface ContextQueryRequest {
    command: 'queryContext';
    requestId: string;
    contextQuery: {
        query: string;
        filePath?: string;
        includeRelated?: boolean;
        maxResults?: number;
        minSimilarity?: number;
        fileTypes?: string[];
    };
}

export interface ServiceStatusRequest {
    command: 'getServiceStatus';
}

// Response types
export interface SearchResult {
    file: string;
    snippet: string;
    line: number;
    score?: number;
    type?: string;
    name?: string;
    language?: string;
}

export interface FileContentResult {
    filePath: string;
    content: string;
    language?: string;
    size: number;
    lastModified: string;
    relatedChunks?: any[];
}

export interface RelatedFile {
    filePath: string;
    similarity: number;
    reason: string;
    chunkCount: number;
    language?: string;
}

export interface ContextResult {
    query: string;
    results: any[];
    relatedFiles: RelatedFile[];
    totalResults: number;
    processingTime: number;
}

export interface ServiceStatus {
    qdrantConnected: boolean;
    embeddingProvider: string | null;
    collectionExists: boolean;
    collectionInfo?: any;
}

export interface SetupStatus {
    isConfigured: boolean;
    hasConfigFile: boolean;
    databaseConfigured?: boolean;
    embeddingConfigured?: boolean;
}

// Event listener type
type MessageListener = (event: MessageEvent) => void;

/**
 * VS Code API wrapper for webview communication
 */
export class VSCodeApiClient {
    private vscode: VSCodeApi;
    private messageListeners: Map<string, MessageListener[]> = new Map();
    private pendingRequests: Map<string, {
        resolve: (value: any) => void;
        reject: (error: any) => void;
        timeout: NodeJS.Timeout;
    }> = new Map();

    constructor() {
        this.vscode = acquireVsCodeApi();
        this.setupMessageListener();
    }

    private setupMessageListener() {
        window.addEventListener('message', (event) => {
            const message = event.data;
            
            // Handle responses with request IDs
            if (message.requestId && this.pendingRequests.has(message.requestId)) {
                const request = this.pendingRequests.get(message.requestId)!;
                clearTimeout(request.timeout);
                this.pendingRequests.delete(message.requestId);
                
                if (message.error) {
                    request.reject(new Error(message.error));
                } else {
                    request.resolve(message.result);
                }
                return;
            }

            // Handle general messages
            const listeners = this.messageListeners.get(message.command) || [];
            listeners.forEach(listener => listener(event));
        });
    }

    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private sendRequestWithResponse<T>(message: any, timeoutMs: number = 30000): Promise<T> {
        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();
            message.requestId = requestId;

            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Request timeout'));
            }, timeoutMs);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });
            this.vscode.postMessage(message);
        });
    }

    /**
     * Send a message to the extension
     */
    postMessage(message: any): void {
        this.vscode.postMessage(message);
    }

    /**
     * Listen for messages from the extension
     */
    onMessage(command: string, listener: MessageListener): void {
        if (!this.messageListeners.has(command)) {
            this.messageListeners.set(command, []);
        }
        this.messageListeners.get(command)!.push(listener);
    }

    /**
     * Remove message listener
     */
    offMessage(command: string, listener: MessageListener): void {
        const listeners = this.messageListeners.get(command);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Perform a search
     */
    async search(query: string): Promise<SearchResult[]> {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent) => {
                if (event.data.command === 'searchResults') {
                    this.offMessage('searchResults', listener);
                    resolve(event.data.results || []);
                }
            };
            
            this.onMessage('searchResults', listener);
            this.postMessage({ command: 'search', query });
        });
    }

    /**
     * Get file content
     */
    async getFileContent(filePath: string, includeRelatedChunks: boolean = false): Promise<FileContentResult> {
        return this.sendRequestWithResponse<FileContentResult>({
            command: 'getFileContent',
            filePath,
            includeRelatedChunks
        });
    }

    /**
     * Find related files
     */
    async findRelatedFiles(
        query: string, 
        currentFilePath?: string, 
        maxResults: number = 10, 
        minSimilarity: number = 0.5
    ): Promise<RelatedFile[]> {
        return this.sendRequestWithResponse<RelatedFile[]>({
            command: 'findRelatedFiles',
            query,
            currentFilePath,
            maxResults,
            minSimilarity
        });
    }

    /**
     * Perform context query
     */
    async queryContext(contextQuery: {
        query: string;
        filePath?: string;
        includeRelated?: boolean;
        maxResults?: number;
        minSimilarity?: number;
        fileTypes?: string[];
    }): Promise<ContextResult> {
        return this.sendRequestWithResponse<ContextResult>({
            command: 'queryContext',
            contextQuery
        });
    }

    /**
     * Get service status
     */
    async getServiceStatus(): Promise<ServiceStatus> {
        return this.sendRequestWithResponse<ServiceStatus>({
            command: 'getServiceStatus'
        });
    }

    /**
     * Check setup status
     */
    async checkSetupStatus(): Promise<{ isConfigured: boolean; status?: any; error?: string }> {
        return this.sendRequestWithResponse<{ isConfigured: boolean; status?: any; error?: string }>({
            command: 'checkSetupStatus'
        });
    }

    /**
     * Send ping to test communication
     */
    async ping(): Promise<any> {
        return this.sendRequestWithResponse<any>({
            command: 'ping'
        });
    }

    /**
     * Start indexing
     */
    startIndexing(): void {
        this.postMessage({ command: 'startIndexing' });
    }

    /**
     * Open settings
     */
    openSettings(): void {
        this.postMessage({ command: 'openSettings' });
    }

    /**
     * Get webview state
     */
    getState(): any {
        return this.vscode.getState();
    }

    /**
     * Set webview state
     */
    setState(state: any): void {
        this.vscode.setState(state);
    }
}

// Create and export a singleton instance
export const vscodeApi = new VSCodeApiClient();
