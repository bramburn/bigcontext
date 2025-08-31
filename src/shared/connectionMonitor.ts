/**
 * Connection Monitor - Shared module for webview connection state tracking
 *
 * This module provides connection monitoring, heartbeat functionality, and auto-recovery
 * capabilities that can be used across all webview implementations (React, Svelte, SvelteKit).
 */

export interface ConnectionState {
  isConnected: boolean;
  lastHeartbeat: number;
  latency: number;
  reconnectAttempts: number;
  connectionQuality: "excellent" | "good" | "poor" | "disconnected";
  bandwidth: "high" | "medium" | "low" | "unknown";
  lastError?: string;
}

export interface ConnectionMetrics {
  totalMessages: number;
  failedMessages: number;
  averageLatency: number;
  connectionUptime: number;
  lastConnected: number;
}

export interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  messageLatency: number[];
  errorCount: number;
  lastUpdate: number;
}

export type ConnectionEventType =
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error"
  | "heartbeat";

export interface ConnectionEvent {
  type: ConnectionEventType;
  timestamp: number;
  data?: any;
}

export type ConnectionEventHandler = (event: ConnectionEvent) => void;

export class ConnectionMonitor {
  private state: ConnectionState;
  private metrics: ConnectionMetrics;
  private performance: PerformanceMetrics;
  private eventHandlers: Map<ConnectionEventType, ConnectionEventHandler[]>;
  private heartbeatInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private messageQueue: Array<{
    message: any;
    timestamp: number;
    retries: number;
  }> = [];
  private vscodeApi: any = null;
  private isInitialized = false;

  // Configuration
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 seconds
  private readonly HEARTBEAT_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]; // Exponential backoff
  private readonly MAX_QUEUE_SIZE = 100;

  constructor() {
    this.state = {
      isConnected: false,
      lastHeartbeat: 0,
      latency: 0,
      reconnectAttempts: 0,
      connectionQuality: "disconnected",
      bandwidth: "unknown",
    };

    this.metrics = {
      totalMessages: 0,
      failedMessages: 0,
      averageLatency: 0,
      connectionUptime: 0,
      lastConnected: 0,
    };

    this.performance = {
      loadTime: 0,
      memoryUsage: 0,
      messageLatency: [],
      errorCount: 0,
      lastUpdate: Date.now(),
    };

    this.eventHandlers = new Map();
  }

  /**
   * Initialize the connection monitor with VS Code API
   */
  public initialize(vscodeApi: any): void {
    this.vscodeApi = vscodeApi;
    this.isInitialized = true;
    this.startHeartbeat();
    this.updateConnectionState(true);

    // Perform initial bandwidth test
    this.performBandwidthTest();

    this.emit("connected", { timestamp: Date.now() });
  }

  /**
   * Start the heartbeat mechanism
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Send a heartbeat message to the extension
   */
  private sendHeartbeat(): void {
    if (!this.vscodeApi || !this.isInitialized) return;

    const startTime = Date.now();

    try {
      this.vscodeApi.postMessage({
        command: "heartbeat",
        timestamp: startTime,
        connectionId: this.generateConnectionId(),
      });

      // Set timeout to detect if heartbeat response is not received
      setTimeout(() => {
        const now = Date.now();
        if (now - this.state.lastHeartbeat > this.HEARTBEAT_TIMEOUT) {
          this.handleConnectionLoss();
        }
      }, this.HEARTBEAT_TIMEOUT);
    } catch (error) {
      this.handleError("Heartbeat failed", error);
    }
  }

  /**
   * Handle heartbeat response from extension
   */
  public handleHeartbeatResponse(timestamp: number): void {
    const now = Date.now();
    const latency = now - timestamp;

    this.state.lastHeartbeat = now;
    this.state.latency = latency;
    this.updateConnectionQuality(latency);

    if (!this.state.isConnected) {
      this.updateConnectionState(true);
      this.emit("connected", { latency, timestamp: now });
    }

    this.emit("heartbeat", { latency, timestamp: now });
  }

  /**
   * Update connection quality based on latency
   */
  private updateConnectionQuality(latency: number): void {
    if (latency < 100) {
      this.state.connectionQuality = "excellent";
    } else if (latency < 300) {
      this.state.connectionQuality = "good";
    } else if (latency < 1000) {
      this.state.connectionQuality = "poor";
    } else {
      this.state.connectionQuality = "disconnected";
    }

    // Update bandwidth estimation based on latency and other factors
    this.updateBandwidthEstimation(latency);
  }

  /**
   * Update bandwidth estimation based on connection metrics
   */
  private updateBandwidthEstimation(latency: number): void {
    // Use Network Information API if available
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        switch (connection.effectiveType) {
          case "4g":
            this.state.bandwidth = "high";
            break;
          case "3g":
            this.state.bandwidth = "medium";
            break;
          case "2g":
          case "slow-2g":
            this.state.bandwidth = "low";
            break;
          default:
            this.state.bandwidth = "medium";
        }
        return;
      }
    }

    // Fallback to latency-based estimation
    if (latency < 100) {
      this.state.bandwidth = "high";
    } else if (latency < 500) {
      this.state.bandwidth = "medium";
    } else {
      this.state.bandwidth = "low";
    }
  }

  /**
   * Perform bandwidth test by measuring download speed
   */
  public async performBandwidthTest(): Promise<void> {
    try {
      const testSize = 1024; // 1KB test
      const testData = new Uint8Array(testSize);
      const blob = new Blob([testData]);
      const url = URL.createObjectURL(blob);

      const startTime = performance.now();
      const response = await fetch(url);
      await response.blob();
      const endTime = performance.now();

      URL.revokeObjectURL(url);

      const duration = endTime - startTime;
      const speedKbps = (testSize * 8) / duration; // bits per millisecond to Kbps

      if (speedKbps > 1000) {
        this.state.bandwidth = "high";
      } else if (speedKbps > 100) {
        this.state.bandwidth = "medium";
      } else {
        this.state.bandwidth = "low";
      }
    } catch (error) {
      console.warn("Bandwidth test failed:", error);
      this.state.bandwidth = "unknown";
    }
  }

  /**
   * Handle connection loss
   */
  private handleConnectionLoss(): void {
    if (this.state.isConnected) {
      this.updateConnectionState(false);
      this.emit("disconnected", { timestamp: Date.now() });
      this.startReconnection();
    }
  }

  /**
   * Start reconnection process with exponential backoff
   */
  private startReconnection(): void {
    if (this.state.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.handleError("Max reconnection attempts reached", null);
      return;
    }

    const delayIndex = Math.min(
      this.state.reconnectAttempts,
      this.RECONNECT_DELAYS.length - 1,
    );
    const delay = this.RECONNECT_DELAYS[delayIndex];

    this.emit("reconnecting", {
      attempt: this.state.reconnectAttempts + 1,
      delay,
      timestamp: Date.now(),
    });

    this.reconnectTimeout = window.setTimeout(() => {
      this.state.reconnectAttempts++;
      this.attemptReconnection();
    }, delay);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnection(): void {
    try {
      if (this.vscodeApi) {
        this.sendHeartbeat();
      }
    } catch (error) {
      this.handleError("Reconnection attempt failed", error);
      this.startReconnection();
    }
  }

  /**
   * Update connection state
   */
  private updateConnectionState(connected: boolean): void {
    const wasConnected = this.state.isConnected;
    this.state.isConnected = connected;

    if (connected && !wasConnected) {
      this.state.reconnectAttempts = 0;
      this.metrics.lastConnected = Date.now();
      this.processMessageQueue();
    }

    if (!connected && wasConnected) {
      this.state.connectionQuality = "disconnected";
    }
  }

  /**
   * Queue a message for sending when connection is restored
   */
  public queueMessage(message: any): void {
    if (this.messageQueue.length >= this.MAX_QUEUE_SIZE) {
      this.messageQueue.shift(); // Remove oldest message
    }

    this.messageQueue.push({
      message,
      timestamp: Date.now(),
      retries: 0,
    });
  }

  /**
   * Process queued messages when connection is restored
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.state.isConnected) {
      const queuedMessage = this.messageQueue.shift();
      if (queuedMessage) {
        try {
          this.vscodeApi.postMessage(queuedMessage.message);
          this.metrics.totalMessages++;
        } catch (error) {
          this.metrics.failedMessages++;
          if (queuedMessage.retries < 3) {
            queuedMessage.retries++;
            this.messageQueue.unshift(queuedMessage);
          }
        }
      }
    }
  }

  /**
   * Send a message with automatic queuing if disconnected
   */
  public sendMessage(message: any): boolean {
    if (!this.vscodeApi) return false;

    if (this.state.isConnected) {
      try {
        this.vscodeApi.postMessage(message);
        this.metrics.totalMessages++;
        return true;
      } catch (error) {
        this.metrics.failedMessages++;
        this.queueMessage(message);
        return false;
      }
    } else {
      this.queueMessage(message);
      return false;
    }
  }

  /**
   * Handle errors
   */
  private handleError(message: string, error: any): void {
    this.state.lastError = message;
    this.performance.errorCount++;
    this.emit("error", { message, error, timestamp: Date.now() });
  }

  /**
   * Emit an event to registered handlers
   */
  private emit(type: ConnectionEventType, data: any): void {
    const handlers = this.eventHandlers.get(type) || [];
    const event: ConnectionEvent = { type, timestamp: Date.now(), data };

    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in connection event handler for ${type}:`, error);
      }
    });
  }

  /**
   * Register an event handler
   */
  public on(
    type: ConnectionEventType,
    handler: ConnectionEventHandler,
  ): () => void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }

    this.eventHandlers.get(type)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Get connection metrics
   */
  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performance };
  }

  /**
   * Update performance metrics
   */
  public updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    Object.assign(this.performance, metrics);
    this.performance.lastUpdate = Date.now();
  }

  /**
   * Generate a unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.eventHandlers.clear();
    this.messageQueue = [];
    this.isInitialized = false;
  }
}

// Export a singleton instance
export const connectionMonitor = new ConnectionMonitor();
