how do i implement the sprints 4 to 4 , undertake a full websearch, determine which content is suitable and then, provide code example, api information and further guidance on using external api/packages to complete the task. Review 'prd', (if available) the existing code inin your analysis. Ensure each guide is produced in their own individual canvas document

**Implementation Guidance for Sprint 4: Type-Safe Communication**

**Objective:** Establish fully type-safe communication between the VS Code extension (backend) and its webview (frontend) to catch errors at compile time and improve developer experience.

**Relevant Files:**
-   `src/types/messaging.ts` (New file for shared interfaces)
-   `src/messageRouter.ts` (Backend message handling)
-   `webview/src/lib/vscodeApi.ts` (Frontend message handling)
-   Any other files that send or receive messages between the extension and webview.

**Web Search/API Information:**
-   **TypeScript Interfaces and Types:** Fundamental for defining the structure of data. Key concepts include `interface`, `type`, `union types`, and `discriminated unions` for handling different message commands.
-   **VS Code Webview Messaging API:**
    -   `webview.postMessage(message: any)`: Used by the extension to send messages to the webview.
    -   `vscode.postMessage(message: any)`: Used by the webview to send messages to the extension (available via the global `vscode` object injected into the webview).
    -   `window.addEventListener('message', event => { ... })`: How the webview listens for messages from the extension.
    -   `webviewPanel.webview.onDidReceiveMessage(e => { ... })`: How the extension listens for messages from the webview.

**Guidance:**

1.  **Create `src/types/messaging.ts`:**
    *   This file will be the single source of truth for all message types exchanged between the extension and the webview.
    *   Define a base interface for messages, e.g., `BaseMessage<TCommand extends string, TPayload = undefined, TResponse = undefined>`. This allows for generic typing of command, payload, and response.
    *   For each distinct command (e.g., `getConfiguration`, `searchCode`, `updateSetting`), create a specific interface that extends `BaseMessage` and specifies the exact `command` string, `payload` type, and `response` type.
    *   Crucially, create `union types` for all messages that can be sent *from* the webview *to* the extension (e.g., `WebviewToExtensionMessage`) and all messages that can be sent *from* the extension *to* the webview (e.g., `ExtensionToWebviewMessage`). This will enable discriminated unions, allowing TypeScript to infer the specific message type based on its `command` property.

2.  **Refactor `src/messageRouter.ts` (Backend):**
    *   Update the `onDidReceiveMessage` listener to explicitly type the incoming `message` as `WebviewToExtensionMessage`.
    *   Use a `switch` statement on `message.command`. Because `WebviewToExtensionMessage` is a discriminated union, TypeScript will automatically narrow the type of `message` within each `case` block, providing type safety and intellisense for `message.payload`.
    *   When sending responses back to the webview, ensure the message object conforms to `ExtensionToWebviewMessage` before calling `webviewPanel.webview.postMessage()`. This will provide compile-time checks for outgoing messages.
    *   Consider creating helper functions or a generic `postMessage` method within `MessageRouter` that takes a typed message object.

3.  **Refactor `webview/src/lib/vscodeApi.ts` (Frontend):**
    *   Update the `window.addEventListener('message')` listener to explicitly type the incoming `event.data` as `ExtensionToWebviewMessage`.
    *   When sending messages to the extension via `vscode.postMessage()`, ensure the message object conforms to `WebviewToExtensionMessage`.
    *   Create typed wrapper functions for each command (e.g., `vscodeApi.getConfiguration(): Promise<any>`). These functions will construct the correctly typed message, send it, and handle the response, providing a clean, type-safe API for the Svelte components.
    *   Implement a mechanism to map responses back to their original requests (e.g., using a `Promise` and a `Map` of callbacks keyed by command or a unique message ID). This is common for request-response patterns over message channels.

**Code Examples:**

**`src/types/messaging.ts` (New File Content - Illustrative):**

```typescript
// Base interface for all messages
export interface BaseMessage<TCommand extends string, TPayload = undefined, TResponse = undefined> {
    command: TCommand;
    payload?: TPayload;
    response?: TResponse;
}

// 1. Messages from Webview to Extension

export interface GetConfigurationMessage extends BaseMessage<'getConfiguration', undefined, { config: any }> {}
export interface UpdateConfigurationMessage extends BaseMessage<'updateConfiguration', { key: string; value: any }, { success: boolean }> {}
export interface SearchCodeMessage extends BaseMessage<'searchCode', { query: string }, { results: any[] }> {}
export interface IndexFileMessage extends BaseMessage<'indexFile', { filePath: string }, { success: boolean }> {}

// Union type for all messages sent from Webview to Extension
export type WebviewToExtensionMessage =
    | GetConfigurationMessage
    | UpdateConfigurationMessage
    | SearchCodeMessage
    | IndexFileMessage;

// 2. Messages from Extension to Webview

export interface ShowErrorMessage extends BaseMessage<'showError', { message: string; error?: any }> {}
export interface ShowInfoMessage extends BaseMessage<'showInfo', { message: string }> {}
export interface SearchResultsMessage extends BaseMessage<'searchResults', { results: any[] }> {}
export interface ConfigurationUpdatedMessage extends BaseMessage<'configurationUpdated', { config: any }> {}

// Union type for all messages sent from Extension to Webview
export type ExtensionToWebviewMessage =
    | ShowErrorMessage
    | ShowInfoMessage
    | SearchResultsMessage
    | ConfigurationUpdatedMessage;

// Helper type for message handlers (optional, but useful for backend router)
export type MessageHandler<T extends BaseMessage<any, any, any>> = (
    message: T['payload']
) => Promise<T['response']> | T['response'];
```

**`src/messageRouter.ts` (Snippets - Illustrative):**

```typescript
import * as vscode from 'vscode';
import { WebviewToExtensionMessage, ExtensionToWebviewMessage } from './types/messaging';
import { LoggingService } from './loggingService'; // Assuming LoggingService exists

export class MessageRouter {
    private webviewPanel: vscode.WebviewPanel;
    private loggingService: LoggingService;

    constructor(webviewPanel: vscode.WebviewPanel, loggingService: LoggingService) {
        this.webviewPanel = webviewPanel;
        this.loggingService = loggingService;

        this.webviewPanel.webview.onDidReceiveMessage(async (message: WebviewToExtensionMessage) => {
            this.loggingService.debug(`Received message from webview: ${message.command}`);
            try {
                let responsePayload: any;
                switch (message.command) {
                    case 'getConfiguration':
                        // message is now type GetConfigurationMessage
                        responsePayload = { config: vscode.workspace.getConfiguration('codeContextEngine').get('someSetting') };
                        break;
                    case 'updateConfiguration':
                        // message is now type UpdateConfigurationMessage
                        const { key, value } = message.payload!;
                        await vscode.workspace.getConfiguration('codeContextEngine').update(key, value, vscode.ConfigurationTarget.Global);
                        responsePayload = { success: true };
                        break;
                    case 'searchCode':
                        // message is now type SearchCodeMessage
                        // const searchResults = await this.searchManager.search(message.payload!.query);
                        // responsePayload = { results: searchResults };
                        responsePayload = { results: [] }; // Placeholder
                        break;
                    case 'indexFile':
                        // message is now type IndexFileMessage
                        // const indexSuccess = await this.indexingService.indexFile(message.payload!.filePath);
                        // responsePayload = { success: indexSuccess };
                        responsePayload = { success: true }; // Placeholder
                        break;
                    default:
                        this.loggingService.warn(`Unknown command received: ${message.command}`);
                        return;
                }
                // Send response back to webview, ensuring type safety
                this.webviewPanel.webview.postMessage({
                    command: message.command, // Use the same command for response mapping
                    response: responsePayload
                } as ExtensionToWebviewMessage); // Cast to the union type
            } catch (error: any) {
                this.loggingService.error(`Error handling command ${message.command}:`, error);
                // Send error response back to webview
                this.webviewPanel.webview.postMessage({
                    command: 'showError', // Specific error command
                    payload: { message: `Error processing command ${message.command}`, error: error.message }
                } as ExtensionToWebviewMessage);
            }
        });
    }

    // Method to send messages from extension to webview with type safety
    public postMessage<T extends ExtensionToWebviewMessage>(message: T): Thenable<boolean> {
        this.loggingService.debug(`Sending message to webview: ${message.command}`);
        return this.webviewPanel.webview.postMessage(message);
    }
}
```

**`webview/src/lib/vscodeApi.ts` (Frontend Snippets - Illustrative):**

```typescript
import { WebviewToExtensionMessage, ExtensionToWebviewMessage } from '../../../src/types/messaging'; // Adjust path as needed

// Declare the VS Code API global object injected into the webview
declare const vscode: {
    postMessage: <T extends WebviewToExtensionMessage>(message: T) => void;
    // Other VS Code API methods available in webview context if any
};

// Map to store pending promises for request-response messages
const pendingPromises = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data as ExtensionToWebviewMessage;

    // Handle general messages (e.g., notifications)
    switch (message.command) {
        case 'showError':
            console.error('Extension Error:', message.payload?.message, message.payload?.error);
            // You might want to display this in the UI
            break;
        case 'showInfo':
            console.info('Extension Info:', message.payload?.message);
            // You might want to display this in the UI
            break;
        // Add other general message handlers here
    }

    // Handle responses to specific requests
    if (message.command && pendingPromises.has(message.command)) {
        const { resolve } = pendingPromises.get(message.command)!;
        resolve((message as any).response); // Resolve with the response payload
        pendingPromises.delete(message.command);
    }
});

export const vscodeApi = {
    // Generic send message function for requests expecting a response
    async sendRequest<T extends WebviewToExtensionMessage>(message: T): Promise<T['response']> {
        return new Promise((resolve, reject) => {
            pendingPromises.set(message.command, { resolve, reject });
            vscode.postMessage(message);
        });
    },

    // Specific API calls for webview to extension communication
    async getConfiguration(): Promise<any> {
        const message: WebviewToExtensionMessage = { command: 'getConfiguration' };
        const response = await this.sendRequest(message) as { config: any };
        return response.config;
    },

    async updateConfiguration(key: string, value: any): Promise<boolean> {
        const message: WebviewToExtensionMessage = { command: 'updateConfiguration', payload: { key, value } };
        const response = await this.sendRequest(message) as { success: boolean };
        return response.success;
    },

    async searchCode(query: string): Promise<any[]> {
        const message: WebviewToExtensionMessage = { command: 'searchCode', payload: { query } };
        const response = await this.sendRequest(message) as { results: any[] };
        return response.results;
    },

    async indexFile(filePath: string): Promise<boolean> {
        const message: WebviewToExtensionMessage = { command: 'indexFile', payload: { filePath } };
        const response = await this.sendRequest(message) as { success: boolean };
        return response.success;
    },

    // Example of how to register a listener for messages from the extension
    onShowError(callback: (message: string, error?: any) => void): () => void {
        const handler = (message: ExtensionToWebviewMessage) => {
            if (message.command === 'showError') {
                callback(message.payload!.message, message.payload!.error);
            }
        };
        // A more robust solution would involve a dedicated event emitter or a map of callbacks per command
        // For simplicity, this example assumes a direct callback registration.
        // In a real app, you'd likely have a central event dispatcher in the webview.
        // For now, we'll just add it to the window listener directly (not ideal for multiple listeners)
        window.addEventListener('message', (event) => handler(event.data as ExtensionToWebviewMessage));
        return () => {
            // Need a way to remove this specific handler from the window listener
            // This is a simplification; a real implementation would use a proper event system.
        };
    },

    onShowInfo(callback: (message: string) => void): () => void {
        const handler = (message: ExtensionToWebviewMessage) => {
            if (message.command === 'showInfo') {
                callback(message.payload!.message);
            }
        };
        window.addEventListener('message', (event) => handler(event.data as ExtensionToWebviewMessage));
        return () => {};
    }
};
```