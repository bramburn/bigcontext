/**
 * Type-Safe Communication Service
 *
 * This service provides type-safe communication between the VS Code extension
 * and the webview. It handles message serialization, validation, and routing
 * with full TypeScript type safety.
 *
 * Features:
 * - Type-safe message passing
 * - Request/response pattern with promises
 * - Event-based communication
 * - Message validation and error handling
 * - Automatic message routing
 * - Timeout handling for requests
 */

import * as vscode from "vscode";
import {
  BaseMessage,
  RequestMessage,
  ResponseMessage,
  EventMessage,
  ErrorInfo,
  ExtensionToWebviewMessageType,
  WebviewToExtensionMessageType,
  MessageTypeGuards,
  MessageFactory,
} from "../shared/communicationTypes";
import { CentralizedLoggingService } from "../logging/centralizedLoggingService";

/**
 * Message handler interface
 */
export interface MessageHandler<TRequest = any, TResponse = any> {
  (payload: TRequest): Promise<TResponse> | TResponse;
}

/**
 * Event handler interface
 */
export interface EventHandler<TPayload = any> {
  (payload: TPayload): void | Promise<void>;
}

/**
 * Pending request interface
 */
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  timestamp: number;
  retryCount: number;
  originalMessage: RequestMessage;
}

/**
 * Communication service configuration
 */
export interface CommunicationConfig {
  /** Default timeout for requests (in milliseconds) */
  defaultTimeout: number;
  /** Maximum number of pending requests */
  maxPendingRequests: number;
  /** Whether to enable message validation */
  enableValidation: boolean;
  /** Whether to log all messages */
  enableMessageLogging: boolean;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retry attempts (in milliseconds) */
  retryDelay: number;
  /** Whether to enable communication metrics */
  enableMetrics: boolean;
}

/**
 * Event subscription information
 */
interface EventSubscription {
  event: string;
  handler: (payload: any) => void;
  once: boolean;
}

/**
 * Communication metrics
 */
interface CommunicationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalEvents: number;
  retryCount: number;
  lastResetTime: number;
}

/**
 * Type-safe communication service
 */
export class TypeSafeCommunicationService {
  private webviewPanel?: vscode.WebviewPanel;
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private eventSubscriptions: Map<string, Set<EventSubscription>> = new Map();
  private config: CommunicationConfig;
  private loggingService?: CentralizedLoggingService;
  private isDisposed: boolean = false;
  private metrics: CommunicationMetrics;

  constructor(
    config?: Partial<CommunicationConfig>,
    loggingService?: CentralizedLoggingService,
  ) {
    this.config = {
      defaultTimeout: 30000, // 30 seconds
      maxPendingRequests: 100,
      enableValidation: true,
      enableMessageLogging: false,
      maxRetries: 3,
      retryDelay: 1000,
      enableMetrics: true,
      ...config,
    };
    this.loggingService = loggingService;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): CommunicationMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalEvents: 0,
      retryCount: 0,
      lastResetTime: Date.now(),
    };
  }

  /**
   * Initialize the communication service with a webview panel
   */
  public initialize(webviewPanel: vscode.WebviewPanel): void {
    if (this.isDisposed) {
      throw new Error("Communication service has been disposed");
    }

    this.webviewPanel = webviewPanel;

    // Set up message listener
    this.webviewPanel.webview.onDidReceiveMessage(
      (message) => this.handleIncomingMessage(message),
      undefined,
      [],
    );

    // Clean up on panel disposal
    this.webviewPanel.onDidDispose(() => {
      this.cleanup();
    });

    this.loggingService?.info(
      "TypeSafeCommunicationService initialized",
      {
        config: this.config,
      },
      "TypeSafeCommunicationService",
    );
  }

  /**
   * Register a message handler
   */
  public registerMessageHandler<TRequest, TResponse>(
    messageType: string,
    handler: MessageHandler<TRequest, TResponse>,
  ): void {
    this.messageHandlers.set(messageType, handler);
    this.loggingService?.debug(
      `Message handler registered for type: ${messageType}`,
      {},
      "TypeSafeCommunicationService",
    );
  }

  /**
   * Unregister a message handler
   */
  public unregisterMessageHandler(messageType: string): void {
    this.messageHandlers.delete(messageType);
    this.loggingService?.debug(
      `Message handler unregistered for type: ${messageType}`,
      {},
      "TypeSafeCommunicationService",
    );
  }

  /**
   * Register an event handler
   */
  public registerEventHandler<TPayload>(
    eventName: string,
    handler: EventHandler<TPayload>,
  ): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName)!.add(handler);
    this.loggingService?.debug(
      `Event handler registered for event: ${eventName}`,
      {},
      "TypeSafeCommunicationService",
    );
  }

  /**
   * Unregister an event handler
   */
  public unregisterEventHandler<TPayload>(
    eventName: string,
    handler: EventHandler<TPayload>,
  ): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventName);
      }
    }
    this.loggingService?.debug(
      `Event handler unregistered for event: ${eventName}`,
      {},
      "TypeSafeCommunicationService",
    );
  }

  /**
   * Send a request to the webview and wait for a response
   */
  public async sendRequest<TRequest, TResponse>(
    messageType: ExtensionToWebviewMessageType,
    payload: TRequest,
    timeout?: number,
  ): Promise<TResponse> {
    if (!this.webviewPanel) {
      throw new Error("Communication service not initialized");
    }

    if (this.pendingRequests.size >= this.config.maxPendingRequests) {
      throw new Error("Too many pending requests");
    }

    const request = MessageFactory.createRequest(messageType, payload, true);
    const requestTimeout = timeout || this.config.defaultTimeout;

    return new Promise<TResponse>((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(request.id);
        reject(new Error(`Request timeout after ${requestTimeout}ms`));
      }, requestTimeout);

      // Store pending request
      this.pendingRequests.set(request.id, {
        resolve,
        reject,
        timeout: timeoutHandle,
        timestamp: Date.now(),
        retryCount: 0,
        originalMessage: request as RequestMessage,
      });

      // Send the message
      this.sendMessage(request);
    });
  }

  /**
   * Send a message to the webview without expecting a response
   */
  public sendMessage<TPayload>(
    messageType:
      | ExtensionToWebviewMessageType
      | RequestMessage<TPayload>
      | ResponseMessage<TPayload>
      | EventMessage<TPayload>,
    payload?: TPayload,
  ): void {
    if (!this.webviewPanel) {
      throw new Error("Communication service not initialized");
    }

    let message: BaseMessage;

    if (typeof messageType === "string") {
      message = MessageFactory.createRequest(messageType, payload, false);
    } else {
      message = messageType;
    }

    if (this.config.enableValidation) {
      this._validateMessageInternal(message);
    }

    if (this.config.enableMessageLogging) {
      this.loggingService?.debug(
        "Sending message to webview",
        {
          type: message.type,
          id: message.id,
        },
        "TypeSafeCommunicationService",
      );
    }

    this.webviewPanel.webview.postMessage(message);
  }

  /**
   * Send an event to the webview
   */
  public sendEvent<TPayload>(eventName: string, payload: TPayload): void {
    const event = MessageFactory.createEvent(
      ExtensionToWebviewMessageType.STATE_UPDATE,
      eventName,
      payload,
    );
    this.sendMessage(event);
  }

  /**
   * Handle incoming messages from the webview
   */
  private async handleIncomingMessage(message: any): Promise<void> {
    try {
      if (this.config.enableValidation) {
        this._validateMessageInternal(message);
      }

      if (this.config.enableMessageLogging) {
        this.loggingService?.debug(
          "Received message from webview",
          {
            type: message.type,
            id: message.id,
          },
          "TypeSafeCommunicationService",
        );
      }

      if (MessageTypeGuards.isResponseMessage(message)) {
        await this.handleResponse(message);
      } else if (MessageTypeGuards.isRequestMessage(message)) {
        await this.handleRequest(message);
      } else if (MessageTypeGuards.isEventMessage(message)) {
        await this.handleEvent(message);
      } else {
        this.loggingService?.warn(
          "Unknown message type received",
          {
            message,
          },
          "TypeSafeCommunicationService",
        );
      }
    } catch (error) {
      this.loggingService?.error(
        "Error handling incoming message",
        {
          error: error instanceof Error ? error.message : String(error),
          message,
        },
        "TypeSafeCommunicationService",
      );
    }
  }

  /**
   * Handle response messages
   */
  private async handleResponse(response: ResponseMessage): Promise<void> {
    const pendingRequest = this.pendingRequests.get(response.requestId);
    if (!pendingRequest) {
      this.loggingService?.warn(
        "Received response for unknown request",
        {
          requestId: response.requestId,
        },
        "TypeSafeCommunicationService",
      );
      return;
    }

    // Clear timeout and remove from pending requests
    clearTimeout(pendingRequest.timeout);
    this.pendingRequests.delete(response.requestId);

    if (response.success) {
      pendingRequest.resolve(response.payload);
    } else {
      const error = new Error(response.error?.message || "Request failed");
      if (response.error) {
        (error as any).code = response.error.code;
        (error as any).details = response.error.details;
      }
      pendingRequest.reject(error);
    }
  }

  /**
   * Handle request messages
   */
  private async handleRequest(request: RequestMessage): Promise<void> {
    const handler = this.messageHandlers.get(request.type);
    if (!handler) {
      if (request.expectsResponse) {
        const errorResponse = MessageFactory.createResponse(
          request.id,
          request.type,
          false,
          undefined,
          {
            code: "HANDLER_NOT_FOUND",
            message: `No handler registered for message type: ${request.type}`,
          },
        );
        this.sendMessage(errorResponse);
      }
      return;
    }

    try {
      const result = await handler(request.payload);

      if (request.expectsResponse) {
        const response = MessageFactory.createResponse(
          request.id,
          request.type,
          true,
          result,
        );
        this.sendMessage(response);
      }
    } catch (error) {
      if (request.expectsResponse) {
        const errorResponse = MessageFactory.createResponse(
          request.id,
          request.type,
          false,
          undefined,
          {
            code: "HANDLER_ERROR",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        );
        this.sendMessage(errorResponse);
      }
    }
  }

  /**
   * Handle event messages
   */
  private async handleEvent(event: EventMessage): Promise<void> {
    const handlers = this.eventHandlers.get(event.event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Execute all handlers for this event
    const promises = Array.from(handlers).map((handler) => {
      try {
        return handler(event.payload);
      } catch (error) {
        this.loggingService?.error(
          "Event handler error",
          {
            event: event.event,
            error: error instanceof Error ? error.message : String(error),
          },
          "TypeSafeCommunicationService",
        );
        return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Validate a message
   */
  private validateMessage(message: any): void {
    if (!message || typeof message !== "object") {
      throw new Error("Invalid message format");
    }

    if (!message.id || typeof message.id !== "string") {
      throw new Error("Message must have a valid id");
    }

    if (!message.type || typeof message.type !== "string") {
      throw new Error("Message must have a valid type");
    }

    if (typeof message.timestamp !== "number") {
      throw new Error("Message must have a valid timestamp");
    }
  }

  /**
   * Clean up pending requests and handlers
   */
  private cleanup(): void {
    // Clear all pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error("Communication service disposed"));
    }
    this.pendingRequests.clear();

    // Clear handlers
    this.messageHandlers.clear();
    this.eventHandlers.clear();

    this.webviewPanel = undefined;
    this.isDisposed = true;

    this.loggingService?.info(
      "TypeSafeCommunicationService cleaned up",
      {},
      "TypeSafeCommunicationService",
    );
  }

  /**
   * Get communication statistics
   */
  public getStatistics(): {
    pendingRequests: number;
    registeredHandlers: number;
    registeredEvents: number;
    isInitialized: boolean;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      registeredHandlers: this.messageHandlers.size,
      registeredEvents: this.eventHandlers.size,
      isInitialized: !!this.webviewPanel,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CommunicationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.loggingService?.debug(
      "Communication configuration updated",
      {
        config: this.config,
      },
  /**
   * Expose current configuration for testing/inspection
   */
  public getConfiguration(): CommunicationConfig {
    return { ...this.config };
  }

  /**
   * Expose metrics when enabled
   */
  public getMetrics(): CommunicationMetrics | null {
    return this.config.enableMetrics ? { ...this.metrics } : null;
  }

  /**
   * Public wrapper for validateMessage for test usage
   */
  public validateMessage(message: any): boolean {
    try {
      this._validateMessageInternal(message);
      return true;
    } catch {
      return false;
    }
  }

  private _validateMessageInternal(message: any): void {
    if (!message || typeof message !== "object") {
      throw new Error("Invalid message format");
    }

    if (!message.id || typeof message.id !== "string") {
      throw new Error("Message must have a valid id");
    }

    if (!message.type || typeof message.type !== "string") {
      throw new Error("Message must have a valid type");
    }

    if (typeof message.timestamp !== "number") {
      throw new Error("Message must have a valid timestamp");
    }
  }
      "TypeSafeCommunicationService",
    );
  }

  /**
   * Dispose of the service
   */
  public dispose(): void {
    this.cleanup();
  }
}
