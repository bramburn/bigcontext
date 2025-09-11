/**
 * Qdrant Connection Pool Manager
 * 
 * Manages a pool of Qdrant client connections for improved performance
 * and resource utilization. Provides connection reuse, health monitoring,
 * and automatic cleanup of stale connections.
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  connectionTimeoutMs: number;
  idleTimeoutMs: number;
  healthCheckIntervalMs: number;
  maxRetries: number;
}

export interface PooledConnection {
  client: QdrantClient;
  id: string;
  createdAt: number;
  lastUsed: number;
  isHealthy: boolean;
  inUse: boolean;
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  unhealthyConnections: number;
  totalRequests: number;
  failedRequests: number;
  averageWaitTime: number;
}

export class QdrantConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private waitingQueue: Array<{
    resolve: (connection: PooledConnection) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  
  private config: ConnectionPoolConfig;
  private loggingService: CentralizedLoggingService;
  private host: string;
  private port: number;
  private healthCheckInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  
  // Statistics
  private stats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    unhealthyConnections: 0,
    totalRequests: 0,
    failedRequests: 0,
    averageWaitTime: 0,
  };
  
  private waitTimes: number[] = [];

  constructor(
    host: string,
    port: number,
    config: ConnectionPoolConfig,
    loggingService: CentralizedLoggingService
  ) {
    this.host = host;
    this.port = port;
    this.config = config;
    this.loggingService = loggingService;
    
    this.initializePool();
    this.startHealthChecks();
    this.startCleanupTask();
  }

  /**
   * Initialize the connection pool with minimum connections
   */
  private async initializePool(): Promise<void> {
    this.loggingService.info(
      'Initializing Qdrant connection pool',
      {
        host: this.host,
        port: this.port,
        minConnections: this.config.minConnections,
        maxConnections: this.config.maxConnections,
      },
      'QdrantConnectionPool'
    );

    try {
      // Create minimum number of connections
      const promises = Array.from({ length: this.config.minConnections }, () =>
        this.createConnection()
      );
      
      await Promise.all(promises);
      
      this.loggingService.info(
        'Connection pool initialized successfully',
        { connectionCount: this.connections.size },
        'QdrantConnectionPool'
      );
    } catch (error) {
      this.loggingService.error(
        'Failed to initialize connection pool',
        { error: error instanceof Error ? error.message : String(error) },
        'QdrantConnectionPool'
      );
      throw error;
    }
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<PooledConnection> {
    const connectionId = this.generateConnectionId();
    
    try {
      const client = new QdrantClient({
        host: this.host,
        port: this.port,
      });

      // Test the connection
      await client.getCollections();

      const connection: PooledConnection = {
        client,
        id: connectionId,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isHealthy: true,
        inUse: false,
      };

      this.connections.set(connectionId, connection);
      this.updateStats();

      this.loggingService.debug(
        'Created new Qdrant connection',
        { connectionId, totalConnections: this.connections.size },
        'QdrantConnectionPool'
      );

      return connection;
    } catch (error) {
      this.loggingService.error(
        'Failed to create Qdrant connection',
        {
          connectionId,
          error: error instanceof Error ? error.message : String(error),
        },
        'QdrantConnectionPool'
      );
      throw error;
    }
  }

  /**
   * Get a connection from the pool
   */
  public async getConnection(): Promise<PooledConnection> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Try to find an available healthy connection
      const availableConnection = this.findAvailableConnection();
      if (availableConnection) {
        availableConnection.inUse = true;
        availableConnection.lastUsed = Date.now();
        this.updateStats();
        this.recordWaitTime(Date.now() - startTime);
        return availableConnection;
      }

      // If we can create more connections, do so
      if (this.connections.size < this.config.maxConnections) {
        const newConnection = await this.createConnection();
        newConnection.inUse = true;
        this.updateStats();
        this.recordWaitTime(Date.now() - startTime);
        return newConnection;
      }

      // Wait for a connection to become available
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.waitingQueue.splice(index, 1);
          }
          this.stats.failedRequests++;
          reject(new Error('Connection timeout: no available connections'));
        }, this.config.connectionTimeoutMs);

        this.waitingQueue.push({
          resolve: (connection) => {
            clearTimeout(timeout);
            this.recordWaitTime(Date.now() - startTime);
            resolve(connection);
          },
          reject: (error) => {
            clearTimeout(timeout);
            this.stats.failedRequests++;
            reject(error);
          },
          timestamp: startTime,
        });
      });
    } catch (error) {
      this.stats.failedRequests++;
      throw error;
    }
  }

  /**
   * Release a connection back to the pool
   */
  public releaseConnection(connection: PooledConnection): void {
    connection.inUse = false;
    connection.lastUsed = Date.now();
    this.updateStats();

    // Process waiting queue
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift();
      if (waiter) {
        connection.inUse = true;
        waiter.resolve(connection);
        return;
      }
    }

    this.loggingService.debug(
      'Released connection back to pool',
      { connectionId: connection.id },
      'QdrantConnectionPool'
    );
  }

  /**
   * Find an available healthy connection
   */
  private findAvailableConnection(): PooledConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.inUse && connection.isHealthy) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Perform health checks on all connections
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.connections.values())
      .filter(conn => !conn.inUse)
      .map(conn => this.checkConnectionHealth(conn));

    await Promise.allSettled(healthCheckPromises);
    this.updateStats();
  }

  /**
   * Check health of a single connection
   */
  private async checkConnectionHealth(connection: PooledConnection): Promise<void> {
    try {
      await connection.client.getCollections();
      connection.isHealthy = true;
    } catch (error) {
      connection.isHealthy = false;
      this.loggingService.warn(
        'Connection health check failed',
        {
          connectionId: connection.id,
          error: error instanceof Error ? error.message : String(error),
        },
        'QdrantConnectionPool'
      );
    }
  }

  /**
   * Start cleanup task for idle connections
   */
  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.idleTimeoutMs);
  }

  /**
   * Clean up idle connections
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    for (const [id, connection] of this.connections.entries()) {
      const isIdle = !connection.inUse && 
                    (now - connection.lastUsed) > this.config.idleTimeoutMs;
      const isUnhealthy = !connection.isHealthy;
      const shouldKeepMinimum = this.connections.size <= this.config.minConnections;

      if ((isIdle || isUnhealthy) && !shouldKeepMinimum) {
        connectionsToRemove.push(id);
      }
    }

    for (const id of connectionsToRemove) {
      this.connections.delete(id);
      this.loggingService.debug(
        'Removed idle/unhealthy connection',
        { connectionId: id },
        'QdrantConnectionPool'
      );
    }

    if (connectionsToRemove.length > 0) {
      this.updateStats();
    }
  }

  /**
   * Update pool statistics
   */
  private updateStats(): void {
    this.stats.totalConnections = this.connections.size;
    this.stats.activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.inUse).length;
    this.stats.idleConnections = Array.from(this.connections.values())
      .filter(conn => !conn.inUse && conn.isHealthy).length;
    this.stats.unhealthyConnections = Array.from(this.connections.values())
      .filter(conn => !conn.isHealthy).length;
    
    // Calculate average wait time
    if (this.waitTimes.length > 0) {
      this.stats.averageWaitTime = this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length;
    }
  }

  /**
   * Record wait time for statistics
   */
  private recordWaitTime(waitTime: number): void {
    this.waitTimes.push(waitTime);
    // Keep only last 100 wait times for rolling average
    if (this.waitTimes.length > 100) {
      this.waitTimes.shift();
    }
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get pool statistics
   */
  public getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * Close all connections and cleanup
   */
  public async close(): Promise<void> {
    this.loggingService.info(
      'Closing Qdrant connection pool',
      { connectionCount: this.connections.size },
      'QdrantConnectionPool'
    );

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Reject all waiting requests
    for (const waiter of this.waitingQueue) {
      waiter.reject(new Error('Connection pool is closing'));
    }
    this.waitingQueue.length = 0;

    // Close all connections
    this.connections.clear();
    this.updateStats();

    this.loggingService.info(
      'Connection pool closed successfully',
      {},
      'QdrantConnectionPool'
    );
  }
}
