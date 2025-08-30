"use strict";
/**
 * Connection Monitor - Shared module for webview connection state tracking
 *
 * This module provides connection monitoring, heartbeat functionality, and auto-recovery
 * capabilities that can be used across all webview implementations (React, Svelte, SvelteKit).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionMonitor = exports.ConnectionMonitor = void 0;
class ConnectionMonitor {
    constructor() {
        this.heartbeatInterval = null;
        this.reconnectTimeout = null;
        this.messageQueue = [];
        this.vscodeApi = null;
        this.isInitialized = false;
        // Configuration
        this.HEARTBEAT_INTERVAL = 5000; // 5 seconds
        this.HEARTBEAT_TIMEOUT = 10000; // 10 seconds
        this.MAX_RECONNECT_ATTEMPTS = 10;
        this.RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]; // Exponential backoff
        this.MAX_QUEUE_SIZE = 100;
        this.state = {
            isConnected: false,
            lastHeartbeat: 0,
            latency: 0,
            reconnectAttempts: 0,
            connectionQuality: 'disconnected'
        };
        this.metrics = {
            totalMessages: 0,
            failedMessages: 0,
            averageLatency: 0,
            connectionUptime: 0,
            lastConnected: 0
        };
        this.performance = {
            loadTime: 0,
            memoryUsage: 0,
            messageLatency: [],
            errorCount: 0,
            lastUpdate: Date.now()
        };
        this.eventHandlers = new Map();
    }
    /**
     * Initialize the connection monitor with VS Code API
     */
    initialize(vscodeApi) {
        this.vscodeApi = vscodeApi;
        this.isInitialized = true;
        this.startHeartbeat();
        this.updateConnectionState(true);
        this.emit('connected', { timestamp: Date.now() });
    }
    /**
     * Start the heartbeat mechanism
     */
    startHeartbeat() {
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
    sendHeartbeat() {
        if (!this.vscodeApi || !this.isInitialized)
            return;
        const startTime = Date.now();
        try {
            this.vscodeApi.postMessage({
                command: 'heartbeat',
                timestamp: startTime,
                connectionId: this.generateConnectionId()
            });
            // Set timeout to detect if heartbeat response is not received
            setTimeout(() => {
                const now = Date.now();
                if (now - this.state.lastHeartbeat > this.HEARTBEAT_TIMEOUT) {
                    this.handleConnectionLoss();
                }
            }, this.HEARTBEAT_TIMEOUT);
        }
        catch (error) {
            this.handleError('Heartbeat failed', error);
        }
    }
    /**
     * Handle heartbeat response from extension
     */
    handleHeartbeatResponse(timestamp) {
        const now = Date.now();
        const latency = now - timestamp;
        this.state.lastHeartbeat = now;
        this.state.latency = latency;
        this.updateConnectionQuality(latency);
        if (!this.state.isConnected) {
            this.updateConnectionState(true);
            this.emit('connected', { latency, timestamp: now });
        }
        this.emit('heartbeat', { latency, timestamp: now });
    }
    /**
     * Update connection quality based on latency
     */
    updateConnectionQuality(latency) {
        if (latency < 100) {
            this.state.connectionQuality = 'excellent';
        }
        else if (latency < 300) {
            this.state.connectionQuality = 'good';
        }
        else if (latency < 1000) {
            this.state.connectionQuality = 'poor';
        }
        else {
            this.state.connectionQuality = 'disconnected';
        }
    }
    /**
     * Handle connection loss
     */
    handleConnectionLoss() {
        if (this.state.isConnected) {
            this.updateConnectionState(false);
            this.emit('disconnected', { timestamp: Date.now() });
            this.startReconnection();
        }
    }
    /**
     * Start reconnection process with exponential backoff
     */
    startReconnection() {
        if (this.state.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            this.handleError('Max reconnection attempts reached', null);
            return;
        }
        const delayIndex = Math.min(this.state.reconnectAttempts, this.RECONNECT_DELAYS.length - 1);
        const delay = this.RECONNECT_DELAYS[delayIndex];
        this.emit('reconnecting', {
            attempt: this.state.reconnectAttempts + 1,
            delay,
            timestamp: Date.now()
        });
        this.reconnectTimeout = window.setTimeout(() => {
            this.state.reconnectAttempts++;
            this.attemptReconnection();
        }, delay);
    }
    /**
     * Attempt to reconnect
     */
    attemptReconnection() {
        try {
            if (this.vscodeApi) {
                this.sendHeartbeat();
            }
        }
        catch (error) {
            this.handleError('Reconnection attempt failed', error);
            this.startReconnection();
        }
    }
    /**
     * Update connection state
     */
    updateConnectionState(connected) {
        const wasConnected = this.state.isConnected;
        this.state.isConnected = connected;
        if (connected && !wasConnected) {
            this.state.reconnectAttempts = 0;
            this.metrics.lastConnected = Date.now();
            this.processMessageQueue();
        }
        if (!connected && wasConnected) {
            this.state.connectionQuality = 'disconnected';
        }
    }
    /**
     * Queue a message for sending when connection is restored
     */
    queueMessage(message) {
        if (this.messageQueue.length >= this.MAX_QUEUE_SIZE) {
            this.messageQueue.shift(); // Remove oldest message
        }
        this.messageQueue.push({
            message,
            timestamp: Date.now(),
            retries: 0
        });
    }
    /**
     * Process queued messages when connection is restored
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.state.isConnected) {
            const queuedMessage = this.messageQueue.shift();
            if (queuedMessage) {
                try {
                    this.vscodeApi.postMessage(queuedMessage.message);
                    this.metrics.totalMessages++;
                }
                catch (error) {
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
    sendMessage(message) {
        if (!this.vscodeApi)
            return false;
        if (this.state.isConnected) {
            try {
                this.vscodeApi.postMessage(message);
                this.metrics.totalMessages++;
                return true;
            }
            catch (error) {
                this.metrics.failedMessages++;
                this.queueMessage(message);
                return false;
            }
        }
        else {
            this.queueMessage(message);
            return false;
        }
    }
    /**
     * Handle errors
     */
    handleError(message, error) {
        this.state.lastError = message;
        this.performance.errorCount++;
        this.emit('error', { message, error, timestamp: Date.now() });
    }
    /**
     * Emit an event to registered handlers
     */
    emit(type, data) {
        const handlers = this.eventHandlers.get(type) || [];
        const event = { type, timestamp: Date.now(), data };
        handlers.forEach(handler => {
            try {
                handler(event);
            }
            catch (error) {
                console.error(`Error in connection event handler for ${type}:`, error);
            }
        });
    }
    /**
     * Register an event handler
     */
    on(type, handler) {
        if (!this.eventHandlers.has(type)) {
            this.eventHandlers.set(type, []);
        }
        this.eventHandlers.get(type).push(handler);
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
    getState() {
        return { ...this.state };
    }
    /**
     * Get connection metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performance };
    }
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(metrics) {
        Object.assign(this.performance, metrics);
        this.performance.lastUpdate = Date.now();
    }
    /**
     * Generate a unique connection ID
     */
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
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
exports.ConnectionMonitor = ConnectionMonitor;
// Export a singleton instance
exports.connectionMonitor = new ConnectionMonitor();
//# sourceMappingURL=connectionMonitor.js.map