/**
 * Message Router Integration
 * 
 * This module provides integration instructions and helper functions for
 * integrating the RAG for LLM message handler with the existing message
 * router system in the VS Code extension.
 * 
 * This file demonstrates how to extend the existing MessageRouter class
 * to handle RAG-specific messages while maintaining compatibility with
 * the existing codebase.
 */

import * as vscode from 'vscode';
import { RagMessageHandler } from './RagMessageHandler';

/**
 * Integration helper class for extending the existing MessageRouter
 * 
 * This class provides methods to integrate RAG message handling into
 * the existing message router without breaking existing functionality.
 */
export class MessageRouterIntegration {
  /** RAG message handler instance */
  private ragHandler: RagMessageHandler;
  
  /**
   * Creates a new MessageRouterIntegration instance
   * 
   * @param context VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this.ragHandler = new RagMessageHandler(context);
  }
  
  /**
   * Initialize the integration
   * 
   * This method should be called during extension activation.
   */
  public async initialize(): Promise<void> {
    await this.ragHandler.initialize();
  }
  
  /**
   * Handle RAG messages
   * 
   * This method should be called from the existing MessageRouter.handleMessage
   * method to handle RAG-specific messages.
   * 
   * @param message Message from webview
   * @param webview VS Code webview instance
   * @returns True if message was handled, false if it should be passed to existing handlers
   */
  public async handleRagMessage(message: any, webview: vscode.Webview): Promise<boolean> {
    return await this.ragHandler.handleMessage(message, webview);
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.ragHandler.dispose();
  }
}

/**
 * Integration Instructions
 * 
 * To integrate the RAG message handler with the existing MessageRouter,
 * follow these steps:
 * 
 * 1. In src/messageRouter.ts, add the following import at the top:
 *    ```typescript
 *    import { MessageRouterIntegration } from './communication/MessageRouterIntegration';
 *    ```
 * 
 * 2. In the MessageRouter class constructor, add:
 *    ```typescript
 *    private ragIntegration: MessageRouterIntegration;
 *    
 *    constructor(context: vscode.ExtensionContext, ...) {
 *        // ... existing constructor code ...
 *        this.ragIntegration = new MessageRouterIntegration(context);
 *    }
 *    ```
 * 
 * 3. In the MessageRouter.initialize() method, add:
 *    ```typescript
 *    await this.ragIntegration.initialize();
 *    ```
 * 
 * 4. In the MessageRouter.handleMessage() method, add this at the beginning
 *    of the switch statement (before the first case):
 *    ```typescript
 *    // Try RAG message handler first
 *    const ragHandled = await this.ragIntegration.handleRagMessage(message, webview);
 *    if (ragHandled) {
 *        return;
 *    }
 *    ```
 * 
 * 5. In the MessageRouter.dispose() method, add:
 *    ```typescript
 *    this.ragIntegration.dispose();
 *    ```
 * 
 * Example integration in MessageRouter.handleMessage():
 * ```typescript
 * async handleMessage(message: any, webview: vscode.Webview): Promise<void> {
 *     try {
 *         console.log('MessageRouter: Handling message:', message.command);
 * 
 *         // Try RAG message handler first
 *         const ragHandled = await this.ragIntegration.handleRagMessage(message, webview);
 *         if (ragHandled) {
 *             return;
 *         }
 * 
 *         // Route message to appropriate handler based on command type
 *         switch (message.command) {
 *             case 'ping':
 *                 await this.handlePing(message, webview);
 *                 break;
 *             // ... existing cases ...
 *             default:
 *                 console.warn('MessageRouter: Unknown command:', message.command);
 *                 await this.sendErrorResponse(webview, `Unknown command: ${message.command}`, message.requestId);
 *                 break;
 *         }
 *     } catch (error) {
 *         console.error('MessageRouter: Error handling message:', error);
 *         await this.sendErrorResponse(webview, error instanceof Error ? error.message : String(error), message.requestId);
 *     }
 * }
 * ```
 */

/**
 * Alternative: Standalone Message Handler
 * 
 * If you prefer not to modify the existing MessageRouter, you can use
 * the RAG message handler as a standalone component. Here's how:
 * 
 * 1. In your webview creation code (e.g., in WebviewManager), set up
 *    a separate message listener for RAG messages:
 * 
 * ```typescript
 * // In WebviewManager or similar
 * import { RagMessageHandler } from './communication/RagMessageHandler';
 * 
 * class WebviewManager {
 *     private ragHandler: RagMessageHandler;
 * 
 *     constructor(context: vscode.ExtensionContext) {
 *         this.ragHandler = new RagMessageHandler(context);
 *     }
 * 
 *     async initialize() {
 *         await this.ragHandler.initialize();
 *     }
 * 
 *     private setupWebviewMessageHandling(webview: vscode.Webview) {
 *         webview.onDidReceiveMessage(async (message) => {
 *             // Try RAG handler first
 *             const ragHandled = await this.ragHandler.handleMessage(message, webview);
 *             
 *             if (!ragHandled) {
 *                 // Pass to existing message router
 *                 await this.messageRouter.handleMessage(message, webview);
 *             }
 *         });
 *     }
 * }
 * ```
 */

/**
 * Testing the Integration
 * 
 * To test that the integration is working correctly:
 * 
 * 1. Open the VS Code extension
 * 2. Open the webview
 * 3. Check the console for "RagMessageHandler: Initializing..." message
 * 4. Try sending a 'getSettings' message from the webview
 * 5. Verify that you receive a 'getSettingsResponse' message back
 * 
 * Example test from webview:
 * ```javascript
 * // In webview JavaScript
 * const vscode = acquireVsCodeApi();
 * 
 * // Test getting settings
 * vscode.postMessage({
 *     command: 'getSettings',
 *     requestId: 'test_' + Date.now()
 * });
 * 
 * // Listen for response
 * window.addEventListener('message', event => {
 *     const message = event.data;
 *     if (message.command === 'getSettingsResponse') {
 *         console.log('Settings received:', message.settings);
 *     }
 * });
 * ```
 */

export default MessageRouterIntegration;
