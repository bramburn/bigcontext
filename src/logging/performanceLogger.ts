/**
 * Performance Logger
 * 
 * Specialized logging service for tracking performance metrics
 * across critical operations in the extension.
 */

import { CentralizedLoggingService } from './centralizedLoggingService';
import { CorrelationService, OperationMetrics } from './correlationService';

export interface PerformanceMetric {
  operationName: string;
  duration: number;
  timestamp: Date;
  correlationId?: string;
  metadata?: Record<string, any>;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
}

export interface PerformanceThresholds {
  warning: number;
  error: number;
  critical: number;
}

export interface PerformanceAlert {
  operationName: string;
  threshold: keyof PerformanceThresholds;
  actualDuration: number;
  expectedDuration: number;
  timestamp: Date;
  correlationId?: string;
}

export class PerformanceLogger {
  private loggingService: CentralizedLoggingService;
  private correlationService: CorrelationService;
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds = new Map<string, PerformanceThresholds>();
  private maxMetricsHistory = 10000;
  private maxAlertsHistory = 1000;

  constructor(loggingService: CentralizedLoggingService) {
    this.loggingService = loggingService;
    this.correlationService = CorrelationService.getInstance();
    this.setupDefaultThresholds();
  }

  /**
   * Setup default performance thresholds for common operations
   */
  private setupDefaultThresholds(): void {
    this.thresholds.set('embedding_generation', {
      warning: 5000,   // 5 seconds
      error: 15000,    // 15 seconds
      critical: 30000, // 30 seconds
    });

    this.thresholds.set('database_query', {
      warning: 1000,   // 1 second
      error: 5000,     // 5 seconds
      critical: 10000, // 10 seconds
    });

    this.thresholds.set('file_indexing', {
      warning: 2000,   // 2 seconds
      error: 10000,    // 10 seconds
      critical: 30000, // 30 seconds
    });

    this.thresholds.set('search_operation', {
      warning: 500,    // 500ms
      error: 2000,     // 2 seconds
      critical: 5000,  // 5 seconds
    });

    this.thresholds.set('webview_render', {
      warning: 100,    // 100ms
      error: 500,      // 500ms
      critical: 1000,  // 1 second
    });

    this.thresholds.set('sidecar_request', {
      warning: 1000,   // 1 second
      error: 5000,     // 5 seconds
      critical: 15000, // 15 seconds
    });
  }

  /**
   * Log performance metric
   */
  public logPerformance(
    operationName: string,
    duration: number,
    correlationId?: string,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      operationName,
      duration,
      timestamp: new Date(),
      correlationId,
      metadata,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
    };

    // Add to metrics history
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check thresholds and generate alerts
    this.checkThresholds(metric);

    // Log to centralized logging service
    const logLevel = this.getLogLevel(operationName, duration);
    // Use the appropriate public method based on log level
    const message = `Performance: ${operationName}`;
    const logMetadata = {
      duration,
      correlationId,
      memoryUsage: metric.memoryUsage,
      cpuUsage: metric.cpuUsage,
      ...metadata,
    };

    // Use the appropriate logging method based on level
    switch (logLevel) {
      case 'debug':
        this.loggingService.debug(message, logMetadata, 'PerformanceLogger');
        break;
      case 'info':
        this.loggingService.info(message, logMetadata, 'PerformanceLogger');
        break;
      case 'warn':
        this.loggingService.warn(message, logMetadata, 'PerformanceLogger');
        break;
      case 'error':
        this.loggingService.error(message, logMetadata, 'PerformanceLogger');
        break;
      default:
        this.loggingService.info(message, logMetadata, 'PerformanceLogger');
    }
  }

  /**
   * Set custom thresholds for an operation
   */
  public setThresholds(operationName: string, thresholds: PerformanceThresholds): void {
    this.thresholds.set(operationName, thresholds);
    this.loggingService.info('Performance thresholds updated', {
      operationName,
      thresholds,
    }, 'PerformanceLogger');
  }

  /**
   * Get performance metrics for an operation
   */
  public getMetrics(operationName?: string, limit?: number): PerformanceMetric[] {
    let filteredMetrics = operationName 
      ? this.metrics.filter(m => m.operationName === operationName)
      : this.metrics;

    return limit ? filteredMetrics.slice(-limit) : filteredMetrics;
  }

  /**
   * Get performance alerts
   */
  public getAlerts(operationName?: string, limit?: number): PerformanceAlert[] {
    let filteredAlerts = operationName 
      ? this.alerts.filter(a => a.operationName === operationName)
      : this.alerts;

    return limit ? filteredAlerts.slice(-limit) : filteredAlerts;
  }

  /**
   * Get performance statistics for an operation
   */
  public getStatistics(operationName: string): {
    totalOperations: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
    alertCount: number;
    lastOperation?: Date;
  } {
    const metrics = this.getMetrics(operationName);
    
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        alertCount: 0,
      };
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const alertCount = this.alerts.filter(a => a.operationName === operationName).length;

    return {
      totalOperations: metrics.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50Duration: durations[Math.floor(durations.length * 0.5)],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      p99Duration: durations[Math.floor(durations.length * 0.99)],
      alertCount,
      lastOperation: metrics[metrics.length - 1]?.timestamp,
    };
  }

  /**
   * Get overall performance summary
   */
  public getOverallSummary(): {
    totalOperations: number;
    operationTypes: string[];
    averageDuration: number;
    totalAlerts: number;
    topSlowOperations: Array<{ operationName: string; averageDuration: number }>;
    recentAlerts: PerformanceAlert[];
  } {
    const operationTypes = [...new Set(this.metrics.map(m => m.operationName))];
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    
    // Calculate average duration per operation type
    const operationStats = operationTypes.map(opName => {
      const opMetrics = this.getMetrics(opName);
      const avgDuration = opMetrics.reduce((sum, m) => sum + m.duration, 0) / opMetrics.length;
      return { operationName: opName, averageDuration: avgDuration };
    });

    const topSlowOperations = operationStats
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5);

    const recentAlerts = this.alerts.slice(-10);

    return {
      totalOperations: this.metrics.length,
      operationTypes,
      averageDuration: this.metrics.length > 0 ? totalDuration / this.metrics.length : 0,
      totalAlerts: this.alerts.length,
      topSlowOperations,
      recentAlerts,
    };
  }

  /**
   * Clear performance data
   */
  public clear(): void {
    this.metrics = [];
    this.alerts = [];
    this.loggingService.info('Performance data cleared', {}, 'PerformanceLogger');
  }

  /**
   * Export performance data
   */
  public exportData(): {
    metrics: PerformanceMetric[];
    alerts: PerformanceAlert[];
    thresholds: Record<string, PerformanceThresholds>;
    timestamp: string;
  } {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      thresholds: Object.fromEntries(this.thresholds),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const thresholds = this.thresholds.get(metric.operationName);
    if (!thresholds) return;

    let alertThreshold: keyof PerformanceThresholds | null = null;

    if (metric.duration >= thresholds.critical) {
      alertThreshold = 'critical';
    } else if (metric.duration >= thresholds.error) {
      alertThreshold = 'error';
    } else if (metric.duration >= thresholds.warning) {
      alertThreshold = 'warning';
    }

    if (alertThreshold) {
      const alert: PerformanceAlert = {
        operationName: metric.operationName,
        threshold: alertThreshold,
        actualDuration: metric.duration,
        expectedDuration: thresholds[alertThreshold],
        timestamp: metric.timestamp,
        correlationId: metric.correlationId,
      };

      this.alerts.push(alert);
      if (this.alerts.length > this.maxAlertsHistory) {
        this.alerts = this.alerts.slice(-this.maxAlertsHistory);
      }

      // Log alert
      this.loggingService.warn('Performance threshold exceeded', {
        operationName: metric.operationName,
        threshold: alertThreshold,
        actualDuration: metric.duration,
        expectedDuration: thresholds[alertThreshold],
        correlationId: metric.correlationId,
      }, 'PerformanceLogger');
    }
  }

  /**
   * Get appropriate log level based on performance
   */
  private getLogLevel(operationName: string, duration: number): 'debug' | 'info' | 'warn' | 'error' {
    const thresholds = this.thresholds.get(operationName);
    if (!thresholds) return 'debug';

    if (duration >= thresholds.critical) return 'error';
    if (duration >= thresholds.error) return 'error';
    if (duration >= thresholds.warning) return 'warn';
    return 'debug';
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): { heapUsed: number; heapTotal: number; external: number } {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    };
  }

  /**
   * Get current CPU usage (simplified)
   */
  private getCpuUsage(): { user: number; system: number } {
    const cpuUsage = process.cpuUsage();
    return {
      user: Math.round(cpuUsage.user / 1000), // Convert to milliseconds
      system: Math.round(cpuUsage.system / 1000), // Convert to milliseconds
    };
  }
}

/**
 * Decorator for automatic performance logging
 */
export function logPerformance(operationName: string, metadata?: Record<string, any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const correlationService = CorrelationService.getInstance();
      const correlationId = correlationService.startOperation(operationName, undefined, metadata);

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        // Try to get performance logger from the instance
        const performanceLogger = (this as any).getPerformanceLogger?.() ||
                                 (this as any).performanceLogger;

        if (performanceLogger && typeof performanceLogger.logPerformance === 'function') {
          performanceLogger.logPerformance(operationName, duration, correlationId, metadata);
        }
        
        correlationService.endOperation(correlationId, true);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Try to get performance logger from the instance
        const performanceLogger = (this as any).getPerformanceLogger?.() ||
                                 (this as any).performanceLogger;

        if (performanceLogger && typeof performanceLogger.logPerformance === 'function') {
          performanceLogger.logPerformance(operationName, duration, correlationId, {
            ...metadata,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        
        correlationService.endOperation(
          correlationId, 
          false, 
          error instanceof Error ? error.message : String(error)
        );
        throw error;
      }
    };

    return descriptor;
  };
}
