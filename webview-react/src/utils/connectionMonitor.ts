/**
 * Lightweight Connection Monitor for the React webview
 * - Heartbeat ping/response to detect connectivity
 * - Exponential backoff reconnection
 * - Simple metrics and message queue
 */
import { initializeVSCodeApi, onMessageCommand } from './vscodeApi';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface HealthMetrics {
  latency: number;
  reconnectAttempts: number;
  totalMessages: number;
  failedMessages: number;
  lastHeartbeat: number;
}

type EventName = 'statusChange' | 'heartbeat' | 'qualityChange';

type EventHandler = (data?: any) => void;

class ConnectionMonitor {
  private vscodeApi: any | null = null;
  private status: ConnectionStatus = 'disconnected';
  private heartbeatInterval: number | null = null;
  private heartbeatTimeout: number | null = null;
  private reconnectTimer: number | null = null;
  private readonly HEARTBEAT_INTERVAL = 5000; // 5s
  private readonly HEARTBEAT_TIMEOUT = 10000; // 10s
  private readonly RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];
  private reconnectAttempts = 0;
  private connectionId = '';
  private metrics: HealthMetrics = {
    latency: 0,
    reconnectAttempts: 0,
    totalMessages: 0,
    failedMessages: 0,
    lastHeartbeat: 0,
  };
  private queue: any[] = [];
  private readonly MAX_QUEUE_SIZE = 100;
  private handlers: Map<EventName, Set<EventHandler>> = new Map();

  initialize(vscodeApi?: any) {
    if (!this.vscodeApi) {
      this.vscodeApi = vscodeApi || initializeVSCodeApi();
    }
    if (!this.vscodeApi) return;

    this.connectionId = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Listen for heartbeat response
    onMessageCommand('heartbeatResponse', (msg) => {
      const sentTs = (msg as any)?.timestamp ?? Date.now();
      const now = Date.now();
      this.metrics.latency = Math.max(0, now - sentTs);
      this.metrics.lastHeartbeat = now;
      this.setStatus('connected');
      this.emit('heartbeat', { latency: this.metrics.latency, timestamp: now });
      // Check network quality after successful heartbeat
      this.checkNetworkQuality();
      // Clear heartbeat timeout since we got a response
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = null;
      }
      // On (re)connect, try draining queued messages
      this.drainQueue();
    });

    // Respond to health status requests from the extension (optional)
    onMessageCommand('getHealthStatus', () => {
      this.postRaw({
        command: 'healthStatusResponse',
        payload: { ...this.metrics },
      });
    });

    this.startHeartbeat();
    this.setStatus('connected');
  }

  destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.heartbeatInterval = this.heartbeatTimeout = this.reconnectTimer = null;
    this.handlers.clear();
  }

  on(event: EventName, handler: EventHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: EventName, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Check network quality and emit qualityChange event
   */
  private checkNetworkQuality(): void {
    let quality: 'good' | 'poor' = 'good';

    // Try to use navigator.connection API first
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        // Consider 'slow-2g' and '2g' as poor quality
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          quality = 'poor';
        }
      }
    } else {
      // Fallback to latency-based detection
      if (this.metrics.latency > 1000) { // Consider >1s latency as poor
        quality = 'poor';
      }
    }

    // Emit quality change event
    this.emit('qualityChange', { quality, timestamp: Date.now() });
  }

  postMessage(command: string, data?: any): boolean {
    const message = { command, ...(data || {}) };
    return this.postRaw(message);
  }

  private postRaw(message: any): boolean {
    if (!this.vscodeApi) return false;
    try {
      if (this.status !== 'connected') {
        this.enqueue(message);
        return false;
      }
      this.vscodeApi.postMessage(message);
      this.metrics.totalMessages++;
      return true;
    } catch {
      this.metrics.failedMessages++;
      this.enqueue(message);
      return false;
    }
  }

  private enqueue(message: any) {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) this.queue.shift();
    this.queue.push(message);
  }

  private drainQueue() {
    while (this.queue.length && this.status === 'connected' && this.vscodeApi) {
      const msg = this.queue.shift();
      try {
        this.vscodeApi.postMessage(msg);
        this.metrics.totalMessages++;
      } catch {
        this.metrics.failedMessages++;
        // push back and stop to retry later
        this.queue.unshift(msg);
        break;
      }
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = window.setInterval(() => this.sendHeartbeat(), this.HEARTBEAT_INTERVAL);
    // send one immediately
    this.sendHeartbeat();
  }

  private sendHeartbeat() {
    if (!this.vscodeApi) return;
    const timestamp = Date.now();
    // Set timeout guard
    if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
    this.heartbeatTimeout = window.setTimeout(() => this.onHeartbeatTimeout(), this.HEARTBEAT_TIMEOUT);
    this.vscodeApi.postMessage({ command: 'heartbeat', timestamp, connectionId: this.connectionId });
  }

  private onHeartbeatTimeout() {
    // Missed response
    if (this.status !== 'connected') return; // already handling
    this.setStatus('disconnected');
    this.startReconnection();
  }

  private startReconnection() {
    // Begin exponential backoff attempts
    const attempt = () => {
      if (this.status === 'connected') return;
      this.setStatus('reconnecting');
      this.reconnectAttempts++;
      this.metrics.reconnectAttempts = this.reconnectAttempts;
      // Try a heartbeat probe
      this.sendHeartbeat();
      const delay = this.RECONNECT_DELAYS[Math.min(this.reconnectAttempts - 1, this.RECONNECT_DELAYS.length - 1)];
      this.reconnectTimer = window.setTimeout(attempt, delay);
    };
    attempt();
  }

  private setStatus(next: ConnectionStatus) {
    if (this.status === next) return;
    this.status = next;
    this.emit('statusChange', next);
    if (next === 'connected') {
      this.reconnectAttempts = 0;
      this.metrics.reconnectAttempts = 0;
    }
  }

  private emit(event: EventName, data?: any) {
    const set = this.handlers.get(event);
    if (!set) return;
    set.forEach((h) => {
      try { h(data); } catch (e) { console.error('ConnectionMonitor handler error', e); }
    });
  }
}

export const connectionMonitor = new ConnectionMonitor();

