/**
 * Sidecar Health Monitor Service
 * 
 * Monitors the health and performance of the FastAPI sidecar service,
 * providing detailed health metrics, alerting, and automatic recovery.
 */

import * as vscode from 'vscode';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';
import { SidecarManager } from './SidecarManager';

export interface HealthMetrics {
  responseTime: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
}

export interface HealthCheckResult {
  isHealthy: boolean;
  timestamp: Date;
  metrics: HealthMetrics;
  issues: HealthIssue[];
  recommendations: string[];
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'performance' | 'connectivity' | 'resource' | 'error';
  message: string;
  details?: any;
}

export interface HealthThresholds {
  maxResponseTime: number;
  maxMemoryUsage: number;
  maxCpuUsage: number;
  maxErrorRate: number;
  minUptime: number;
}

export interface HealthMonitorConfig {
  checkInterval: number;
  thresholds: HealthThresholds;
  alertOnIssues: boolean;
  autoRestart: boolean;
  maxConsecutiveFailures: number;
  enableDetailedMetrics: boolean;
}

export class SidecarHealthMonitor implements vscode.Disposable {
  private sidecarManager: SidecarManager;
  private loggingService: CentralizedLoggingService;
  private config: HealthMonitorConfig;
  private monitorTimer?: NodeJS.Timeout;
  private healthHistory: HealthCheckResult[] = [];
  private consecutiveFailures = 0;
  private isMonitoring = false;
  private disposables: vscode.Disposable[] = [];

  constructor(
    sidecarManager: SidecarManager,
    loggingService: CentralizedLoggingService,
    config?: Partial<HealthMonitorConfig>
  ) {
    this.sidecarManager = sidecarManager;
    this.loggingService = loggingService;
    this.config = {
      checkInterval: 30000, // 30 seconds
      thresholds: {
        maxResponseTime: 5000, // 5 seconds
        maxMemoryUsage: 512, // 512 MB
        maxCpuUsage: 80, // 80%
        maxErrorRate: 0.1, // 10%
        minUptime: 60, // 1 minute
      },
      alertOnIssues: true,
      autoRestart: true,
      maxConsecutiveFailures: 3,
      enableDetailedMetrics: true,
      ...config,
    };
  }

  /**
   * Start health monitoring
   */
  public start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.loggingService.info('Starting sidecar health monitoring', {
      interval: this.config.checkInterval,
    }, 'SidecarHealthMonitor');

    this.monitorTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.checkInterval);

    // Perform initial health check
    setTimeout(() => this.performHealthCheck(), 1000);
  }

  /**
   * Stop health monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = undefined;
    }

    this.loggingService.info('Stopped sidecar health monitoring', {}, 'SidecarHealthMonitor');
  }

  /**
   * Get current health status
   */
  public async getCurrentHealth(): Promise<HealthCheckResult | null> {
    if (!this.sidecarManager.getStatus().isRunning) {
      return null;
    }

    return await this.performHealthCheck();
  }

  /**
   * Get health history
   */
  public getHealthHistory(limit?: number): HealthCheckResult[] {
    const history = [...this.healthHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get health summary
   */
  public getHealthSummary(): {
    isCurrentlyHealthy: boolean;
    averageResponseTime: number;
    uptimePercentage: number;
    totalChecks: number;
    failedChecks: number;
    lastCheck?: Date;
  } {
    const recentHistory = this.healthHistory.slice(-100); // Last 100 checks
    const totalChecks = recentHistory.length;
    const failedChecks = recentHistory.filter(h => !h.isHealthy).length;
    const healthyChecks = totalChecks - failedChecks;

    const averageResponseTime = totalChecks > 0
      ? recentHistory.reduce((sum, h) => sum + h.metrics.responseTime, 0) / totalChecks
      : 0;

    const uptimePercentage = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;

    return {
      isCurrentlyHealthy: this.healthHistory.length > 0 ? this.healthHistory[this.healthHistory.length - 1].isHealthy : false,
      averageResponseTime,
      uptimePercentage,
      totalChecks,
      failedChecks,
      lastCheck: this.healthHistory.length > 0 ? this.healthHistory[this.healthHistory.length - 1].timestamp : undefined,
    };
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const sidecarStatus = this.sidecarManager.getStatus();

    try {
      if (!sidecarStatus.isRunning) {
        const result: HealthCheckResult = {
          isHealthy: false,
          timestamp: new Date(),
          metrics: this.getEmptyMetrics(),
          issues: [{
            severity: 'critical',
            type: 'connectivity',
            message: 'Sidecar is not running',
          }],
          recommendations: ['Start the sidecar service'],
        };

        this.handleHealthCheckResult(result);
        return result;
      }

      // Get basic health
      const baseUrl = this.sidecarManager.getBaseUrl();
      if (!baseUrl) {
        throw new Error('Sidecar base URL not available');
      }

      const healthResponse = await fetch(`${baseUrl}/health/detailed`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      const healthData = await healthResponse.json();
      const responseTime = Date.now() - startTime;

      // Extract metrics
      const metrics: HealthMetrics = {
        responseTime,
        uptime: healthData.uptime_seconds || 0,
        memoryUsage: healthData.process_info?.memory_usage_mb || 0,
        cpuUsage: healthData.process_info?.cpu_percent || 0,
        requestCount: healthData.request_count || 0,
        errorCount: healthData.error_count || 0,
        errorRate: healthData.request_count > 0 
          ? (healthData.error_count || 0) / healthData.request_count 
          : 0,
      };

      // Analyze health
      const issues = this.analyzeHealth(metrics);
      const isHealthy = issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0;
      const recommendations = this.generateRecommendations(issues, metrics);

      const result: HealthCheckResult = {
        isHealthy,
        timestamp: new Date(),
        metrics,
        issues,
        recommendations,
      };

      this.handleHealthCheckResult(result);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        isHealthy: false,
        timestamp: new Date(),
        metrics: {
          ...this.getEmptyMetrics(),
          responseTime,
        },
        issues: [{
          severity: 'critical',
          type: 'connectivity',
          message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { error },
        }],
        recommendations: ['Check sidecar connectivity', 'Restart sidecar if necessary'],
      };

      this.handleHealthCheckResult(result);
      return result;
    }
  }

  /**
   * Analyze health metrics for issues
   */
  private analyzeHealth(metrics: HealthMetrics): HealthIssue[] {
    const issues: HealthIssue[] = [];

    // Response time check
    if (metrics.responseTime > this.config.thresholds.maxResponseTime) {
      issues.push({
        severity: metrics.responseTime > this.config.thresholds.maxResponseTime * 2 ? 'high' : 'medium',
        type: 'performance',
        message: `High response time: ${metrics.responseTime}ms`,
        details: { responseTime: metrics.responseTime, threshold: this.config.thresholds.maxResponseTime },
      });
    }

    // Memory usage check
    if (metrics.memoryUsage > this.config.thresholds.maxMemoryUsage) {
      issues.push({
        severity: metrics.memoryUsage > this.config.thresholds.maxMemoryUsage * 1.5 ? 'high' : 'medium',
        type: 'resource',
        message: `High memory usage: ${metrics.memoryUsage}MB`,
        details: { memoryUsage: metrics.memoryUsage, threshold: this.config.thresholds.maxMemoryUsage },
      });
    }

    // CPU usage check
    if (metrics.cpuUsage > this.config.thresholds.maxCpuUsage) {
      issues.push({
        severity: metrics.cpuUsage > 95 ? 'high' : 'medium',
        type: 'resource',
        message: `High CPU usage: ${metrics.cpuUsage}%`,
        details: { cpuUsage: metrics.cpuUsage, threshold: this.config.thresholds.maxCpuUsage },
      });
    }

    // Error rate check
    if (metrics.errorRate > this.config.thresholds.maxErrorRate) {
      issues.push({
        severity: metrics.errorRate > 0.25 ? 'high' : 'medium',
        type: 'error',
        message: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        details: { errorRate: metrics.errorRate, threshold: this.config.thresholds.maxErrorRate },
      });
    }

    // Uptime check
    if (metrics.uptime < this.config.thresholds.minUptime) {
      issues.push({
        severity: 'low',
        type: 'connectivity',
        message: `Low uptime: ${metrics.uptime}s`,
        details: { uptime: metrics.uptime, threshold: this.config.thresholds.minUptime },
      });
    }

    return issues;
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: HealthIssue[], metrics: HealthMetrics): string[] {
    const recommendations: string[] = [];

    for (const issue of issues) {
      switch (issue.type) {
        case 'performance':
          recommendations.push('Consider optimizing sidecar performance or increasing timeout thresholds');
          break;
        case 'resource':
          if (issue.message.includes('memory')) {
            recommendations.push('Monitor memory usage and consider increasing available memory');
          } else if (issue.message.includes('CPU')) {
            recommendations.push('Monitor CPU usage and consider optimizing processing or scaling');
          }
          break;
        case 'error':
          recommendations.push('Investigate error logs and fix underlying issues');
          break;
        case 'connectivity':
          recommendations.push('Check network connectivity and sidecar availability');
          break;
      }
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Handle health check result
   */
  private handleHealthCheckResult(result: HealthCheckResult): void {
    // Store in history
    this.healthHistory.push(result);
    
    // Keep only last 1000 results
    if (this.healthHistory.length > 1000) {
      this.healthHistory = this.healthHistory.slice(-1000);
    }

    // Update consecutive failures
    if (result.isHealthy) {
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
    }

    // Log health status
    if (result.isHealthy) {
      this.loggingService.debug('Sidecar health check passed', {
        responseTime: result.metrics.responseTime,
        uptime: result.metrics.uptime,
      }, 'SidecarHealthMonitor');
    } else {
      this.loggingService.warn('Sidecar health check failed', {
        issues: result.issues.length,
        consecutiveFailures: this.consecutiveFailures,
      }, 'SidecarHealthMonitor');
    }

    // Handle alerts
    if (this.config.alertOnIssues && !result.isHealthy) {
      this.handleHealthAlert(result);
    }

    // Handle auto-restart
    if (this.config.autoRestart && this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      this.handleAutoRestart();
    }
  }

  /**
   * Handle health alerts
   */
  private handleHealthAlert(result: HealthCheckResult): void {
    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
    const highIssues = result.issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) {
      vscode.window.showErrorMessage(
        `Sidecar Critical Issues: ${criticalIssues.map(i => i.message).join(', ')}`
      );
    } else if (highIssues.length > 0) {
      vscode.window.showWarningMessage(
        `Sidecar Health Issues: ${highIssues.map(i => i.message).join(', ')}`
      );
    }
  }

  /**
   * Handle auto-restart
   */
  private async handleAutoRestart(): Promise<void> {
    this.loggingService.warn('Triggering auto-restart due to consecutive health failures', {
      consecutiveFailures: this.consecutiveFailures,
      maxFailures: this.config.maxConsecutiveFailures,
    }, 'SidecarHealthMonitor');

    try {
      await this.sidecarManager.restart();
      this.consecutiveFailures = 0;
      
      vscode.window.showInformationMessage('Sidecar service restarted due to health issues');
    } catch (error) {
      this.loggingService.error('Auto-restart failed', {
        error: error instanceof Error ? error.message : String(error),
      }, 'SidecarHealthMonitor');
      
      vscode.window.showErrorMessage('Failed to restart sidecar service');
    }
  }

  /**
   * Get empty metrics
   */
  private getEmptyMetrics(): HealthMetrics {
    return {
      responseTime: 0,
      uptime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      requestCount: 0,
      errorCount: 0,
      errorRate: 0,
    };
  }

  /**
   * Dispose of the health monitor
   */
  public dispose(): void {
    this.stop();
    this.disposables.forEach(d => d.dispose());
  }
}
