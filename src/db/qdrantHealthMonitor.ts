import { QdrantService } from './qdrantService';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

export interface HealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  lastError?: string;
  responseTime?: number;
  collections?: string[];
}

export interface HealthMonitorConfig {
  checkIntervalMs: number;
  maxConsecutiveFailures: number;
  alertThresholdMs: number;
  enableAutoRecovery: boolean;
}

/**
 * Health monitoring service for QdrantService
 * 
 * This service continuously monitors the health of the Qdrant database
 * and provides alerts when issues are detected. It can also attempt
 * automatic recovery in some scenarios.
 */
export class QdrantHealthMonitor {
  private qdrantService: QdrantService;
  private loggingService: CentralizedLoggingService;
  private config: HealthMonitorConfig;
  private status: HealthStatus;
  private monitoringInterval?: NodeJS.Timeout;
  private healthChangeListeners: Array<(status: HealthStatus) => void> = [];

  constructor(
    qdrantService: QdrantService,
    loggingService: CentralizedLoggingService,
    config?: Partial<HealthMonitorConfig>
  ) {
    this.qdrantService = qdrantService;
    this.loggingService = loggingService;
    this.config = {
      checkIntervalMs: config?.checkIntervalMs || 30000, // 30 seconds
      maxConsecutiveFailures: config?.maxConsecutiveFailures || 3,
      alertThresholdMs: config?.alertThresholdMs || 5000, // 5 seconds
      enableAutoRecovery: config?.enableAutoRecovery || true,
    };

    this.status = {
      isHealthy: false,
      lastCheck: 0,
      consecutiveFailures: 0,
    };
  }

  /**
   * Start health monitoring
   */
  public startMonitoring(): void {
    if (this.monitoringInterval) {
      this.loggingService.warn(
        'Health monitoring is already running',
        {},
        'QdrantHealthMonitor'
      );
      return;
    }

    this.loggingService.info(
      'Starting Qdrant health monitoring',
      { intervalMs: this.config.checkIntervalMs },
      'QdrantHealthMonitor'
    );

    // Perform initial health check
    this.performHealthCheck();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      
      this.loggingService.info(
        'Stopped Qdrant health monitoring',
        {},
        'QdrantHealthMonitor'
      );
    }
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): HealthStatus {
    return { ...this.status };
  }

  /**
   * Add a listener for health status changes
   */
  public onHealthChange(listener: (status: HealthStatus) => void): () => void {
    this.healthChangeListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.healthChangeListeners.indexOf(listener);
      if (index >= 0) {
        this.healthChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Perform a health check
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.loggingService.debug(
        'Performing Qdrant health check',
        {},
        'QdrantHealthMonitor'
      );

      // Perform health check with collection listing
      const isHealthy = await this.qdrantService.healthCheck(true);
      const responseTime = Date.now() - startTime;

      let collections: string[] = [];
      if (isHealthy) {
        try {
          collections = await this.qdrantService.getCollections();
        } catch (error) {
          this.loggingService.warn(
            'Failed to get collections during health check',
            { error: error instanceof Error ? error.message : String(error) },
            'QdrantHealthMonitor'
          );
        }
      }

      const previousStatus = { ...this.status };
      
      this.status = {
        isHealthy,
        lastCheck: Date.now(),
        consecutiveFailures: isHealthy ? 0 : this.status.consecutiveFailures + 1,
        responseTime,
        collections,
      };

      // Log health status changes
      if (previousStatus.isHealthy !== isHealthy) {
        if (isHealthy) {
          this.loggingService.info(
            'Qdrant service recovered',
            { 
              responseTime,
              collectionsCount: collections.length,
              previousFailures: previousStatus.consecutiveFailures,
            },
            'QdrantHealthMonitor'
          );
        } else {
          this.loggingService.error(
            'Qdrant service became unhealthy',
            { 
              consecutiveFailures: this.status.consecutiveFailures,
              responseTime,
            },
            'QdrantHealthMonitor'
          );
        }
      }

      // Check for slow responses
      if (isHealthy && responseTime > this.config.alertThresholdMs) {
        this.loggingService.warn(
          'Qdrant service responding slowly',
          { responseTime, threshold: this.config.alertThresholdMs },
          'QdrantHealthMonitor'
        );
      }

      // Check for consecutive failures
      if (this.status.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        this.loggingService.error(
          'Qdrant service has exceeded maximum consecutive failures',
          { 
            consecutiveFailures: this.status.consecutiveFailures,
            maxFailures: this.config.maxConsecutiveFailures,
          },
          'QdrantHealthMonitor'
        );

        if (this.config.enableAutoRecovery) {
          await this.attemptRecovery();
        }
      }

      // Notify listeners of status change
      if (previousStatus.isHealthy !== isHealthy || 
          previousStatus.consecutiveFailures !== this.status.consecutiveFailures) {
        this.notifyHealthChangeListeners();
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.status = {
        isHealthy: false,
        lastCheck: Date.now(),
        consecutiveFailures: this.status.consecutiveFailures + 1,
        lastError: errorMessage,
        responseTime,
      };

      this.loggingService.error(
        'Health check failed with exception',
        { 
          error: errorMessage,
          consecutiveFailures: this.status.consecutiveFailures,
          responseTime,
        },
        'QdrantHealthMonitor'
      );

      this.notifyHealthChangeListeners();
    }
  }

  /**
   * Attempt automatic recovery
   */
  private async attemptRecovery(): Promise<void> {
    this.loggingService.info(
      'Attempting automatic recovery for Qdrant service',
      {},
      'QdrantHealthMonitor'
    );

    try {
      // Simple recovery attempt - force a new health check
      // In a more sophisticated implementation, this could include:
      // - Reconnecting to the database
      // - Clearing connection pools
      // - Restarting services
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const isHealthy = await this.qdrantService.healthCheck(true);
      
      if (isHealthy) {
        this.loggingService.info(
          'Automatic recovery successful',
          {},
          'QdrantHealthMonitor'
        );
        
        // Reset consecutive failures on successful recovery
        this.status.consecutiveFailures = 0;
      } else {
        this.loggingService.warn(
          'Automatic recovery failed',
          {},
          'QdrantHealthMonitor'
        );
      }
    } catch (error) {
      this.loggingService.error(
        'Automatic recovery attempt failed',
        { error: error instanceof Error ? error.message : String(error) },
        'QdrantHealthMonitor'
      );
    }
  }

  /**
   * Notify all health change listeners
   */
  private notifyHealthChangeListeners(): void {
    const status = this.getHealthStatus();
    
    this.healthChangeListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        this.loggingService.error(
          'Error in health change listener',
          { error: error instanceof Error ? error.message : String(error) },
          'QdrantHealthMonitor'
        );
      }
    });
  }

  /**
   * Get health statistics
   */
  public getHealthStats(): {
    uptime: number;
    averageResponseTime?: number;
    totalFailures: number;
    lastFailureTime?: number;
  } {
    return {
      uptime: this.status.isHealthy ? Date.now() - this.status.lastCheck : 0,
      averageResponseTime: this.status.responseTime,
      totalFailures: this.status.consecutiveFailures,
      lastFailureTime: this.status.lastError ? this.status.lastCheck : undefined,
    };
  }

  /**
   * Dispose of the health monitor
   */
  public dispose(): void {
    this.stopMonitoring();
    this.healthChangeListeners = [];
    
    this.loggingService.info(
      'QdrantHealthMonitor disposed',
      {},
      'QdrantHealthMonitor'
    );
  }
}
