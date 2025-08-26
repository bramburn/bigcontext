"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vscodeApi = exports.VSCodeApiClient = void 0;
/**
 * VS Code API wrapper for webview communication
 */
class VSCodeApiClient {
    constructor() {
        this.messageListeners = new Map();
        this.pendingRequests = new Map();
        this.vscode = acquireVsCodeApi();
        this.setupMessageListener();
    }
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            const message = event.data;
            // Handle responses with request IDs
            if (message.requestId && this.pendingRequests.has(message.requestId)) {
                const request = this.pendingRequests.get(message.requestId);
                clearTimeout(request.timeout);
                this.pendingRequests.delete(message.requestId);
                if (message.error) {
                    request.reject(new Error(message.error));
                }
                else {
                    request.resolve(message.result);
                }
                return;
            }
            // Handle general messages
            const listeners = this.messageListeners.get(message.command) || [];
            listeners.forEach(listener => listener(event));
        });
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    sendRequestWithResponse(message, timeoutMs = 30000) {
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
    postMessage(message) {
        this.vscode.postMessage(message);
    }
    /**
     * Listen for messages from the extension
     */
    onMessage(command, listener) {
        if (!this.messageListeners.has(command)) {
            this.messageListeners.set(command, []);
        }
        this.messageListeners.get(command).push(listener);
    }
    /**
     * Remove message listener
     */
    offMessage(command, listener) {
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
    async search(query) {
        return new Promise((resolve) => {
            const listener = (event) => {
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
    async getFileContent(filePath, includeRelatedChunks = false) {
        return this.sendRequestWithResponse({
            command: 'getFileContent',
            filePath,
            includeRelatedChunks
        });
    }
    /**
     * Find related files
     */
    async findRelatedFiles(query, currentFilePath, maxResults = 10, minSimilarity = 0.5) {
        return this.sendRequestWithResponse({
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
    async queryContext(contextQuery) {
        return this.sendRequestWithResponse({
            command: 'queryContext',
            contextQuery
        });
    }
    /**
     * Get service status
     */
    async getServiceStatus() {
        return this.sendRequestWithResponse({
            command: 'getServiceStatus'
        });
    }
    /**
     * Check setup status
     */
    async checkSetupStatus() {
        return this.sendRequestWithResponse({
            command: 'checkSetupStatus'
        });
    }
    /**
     * Send ping to test communication
     */
    async ping() {
        return this.sendRequestWithResponse({
            command: 'ping'
        });
    }
    /**
     * Start indexing
     */
    startIndexing() {
        this.postMessage({ command: 'startIndexing' });
    }
    /**
     * Open settings
     */
    openSettings() {
        this.postMessage({ command: 'openSettings' });
    }
    /**
     * Get webview state
     */
    getState() {
        return this.vscode.getState();
    }
    /**
     * Set webview state
     */
    setState(state) {
        this.vscode.setState(state);
    }
}
exports.VSCodeApiClient = VSCodeApiClient;
// Create and export a singleton instance
exports.vscodeApi = new VSCodeApiClient();
//# sourceMappingURL=vscodeApi.js.map