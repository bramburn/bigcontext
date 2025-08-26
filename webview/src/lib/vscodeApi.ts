/**
 * VS Code API Wrapper
 * 
 * This module provides a clean, typed interface for communicating with the VS Code extension.
 * It wraps the acquireVsCodeApi() call and provides helper functions for message passing.
 */

// Types for VS Code API communication
export interface VSCodeMessage {
    command: string;
    requestId?: string;
    [key: string]: any;
}

export interface VSCodeResponse {
    command: string;
    requestId?: string;
    success?: boolean;
    data?: any;
    error?: string;
    [key: string]: any;
}

// Message handler type
export type MessageHandler = (message: VSCodeResponse) => void;

// VS Code API instance
let vscodeApi: any = null;

// Message handlers registry
const messageHandlers = new Map<string, MessageHandler[]>();

// Request-response tracking
const pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
}>();

/**
 * Initialize the VS Code API
 * This should be called once when the webview loads
 */
export function initializeVSCodeApi(): void {
    if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
        vscodeApi = (window as any).acquireVsCodeApi();
        
        // Set up the global message listener
        window.addEventListener('message', handleIncomingMessage);
        
        console.log('VS Code API initialized');
    } else {
        console.warn('VS Code API not available - running outside of VS Code webview');
    }
}

/**
 * Handle incoming messages from the extension
 */
function handleIncomingMessage(event: MessageEvent): void {
    const message: VSCodeResponse = event.data;
    
    // Handle request-response pattern
    if (message.requestId && pendingRequests.has(message.requestId)) {
        const request = pendingRequests.get(message.requestId)!;
        clearTimeout(request.timeout);
        pendingRequests.delete(message.requestId);
        
        if (message.error) {
            request.reject(new Error(message.error));
        } else {
            request.resolve(message.data || message);
        }
        return;
    }
    
    // Handle command-based messages
    if (message.command && messageHandlers.has(message.command)) {
        const handlers = messageHandlers.get(message.command)!;
        handlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error(`Error in message handler for command '${message.command}':`, error);
            }
        });
    }
}

/**
 * Send a message to the VS Code extension
 * @param command - The command to send
 * @param data - Additional data to send with the command
 */
export function postMessage(command: string, data: any = {}): void {
    if (!vscodeApi) {
        console.warn('VS Code API not initialized. Call initializeVSCodeApi() first.');
        return;
    }
    
    const message: VSCodeMessage = {
        command,
        ...data
    };
    
    vscodeApi.postMessage(message);
}

/**
 * Send a message and wait for a response
 * @param command - The command to send
 * @param data - Additional data to send with the command
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @returns Promise that resolves with the response
 */
export function sendRequest(command: string, data: any = {}, timeout: number = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!vscodeApi) {
            reject(new Error('VS Code API not initialized'));
            return;
        }
        
        const requestId = generateRequestId();
        
        // Set up timeout
        const timeoutHandle = setTimeout(() => {
            pendingRequests.delete(requestId);
            reject(new Error(`Request timeout for command: ${command}`));
        }, timeout);
        
        // Store the request
        pendingRequests.set(requestId, {
            resolve,
            reject,
            timeout: timeoutHandle
        });
        
        // Send the message
        const message: VSCodeMessage = {
            command,
            requestId,
            ...data
        };
        
        vscodeApi.postMessage(message);
    });
}

/**
 * Register a message handler for a specific command
 * @param command - The command to listen for
 * @param handler - The handler function
 * @returns Unsubscribe function
 */
export function onMessage(command: string, handler: MessageHandler): () => void {
    if (!messageHandlers.has(command)) {
        messageHandlers.set(command, []);
    }
    
    const handlers = messageHandlers.get(command)!;
    handlers.push(handler);
    
    // Return unsubscribe function
    return () => {
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
        
        // Clean up empty handler arrays
        if (handlers.length === 0) {
            messageHandlers.delete(command);
        }
    };
}

/**
 * Remove all message handlers for a command
 * @param command - The command to clear handlers for
 */
export function clearMessageHandlers(command?: string): void {
    if (command) {
        messageHandlers.delete(command);
    } else {
        messageHandlers.clear();
    }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the current state of the VS Code API
 */
export function getState(): any {
    if (!vscodeApi) {
        return null;
    }
    return vscodeApi.getState();
}

/**
 * Set the state in VS Code
 * @param state - The state to save
 */
export function setState(state: any): void {
    if (!vscodeApi) {
        console.warn('VS Code API not initialized');
        return;
    }
    vscodeApi.setState(state);
}

/**
 * Check if the VS Code API is available and initialized
 */
export function isInitialized(): boolean {
    return vscodeApi !== null;
}

// Auto-initialize when the module is loaded
if (typeof window !== 'undefined') {
    // Initialize on next tick to ensure DOM is ready
    setTimeout(initializeVSCodeApi, 0);
}
