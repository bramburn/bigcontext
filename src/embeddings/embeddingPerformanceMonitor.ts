/**
 * Embedding Performance Monitor
 * 
 * Monitors the performance and health of embedding providers,
 * providing detailed metrics, alerting, and optimization recommendations.
 */

import { CentralizedLoggingService } from '../logging/centralizedLoggingService';
import { IEmbeddingProvider } from './embeddingProvider';

export interface EmbeddingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalTokensProcessed: number;
  averageTokensPerRequest: number;
  requestsPerMinute: number;
  errorRate: number;
  lastRequestTime?: Date;
  lastSuccessTime?: Date;
  lastErrorTime?: Date;
  lastError?: string;
}

export interface EmbeddingPerformanceReport {
  provider: string;
  model: string;
  isHealthy: boolean;
  metrics: EmbeddingMetrics;
  issues: PerformanceIssue[];
  recommendations: string[];
  timestamp: Date;
}

export interface PerformanceIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'performance' | 'reliability' | 'cost' | 'configuration';
  message: string;
  details?: any;
}

export interface PerformanceThresholds {
  maxResponseTime: number;
  maxErrorRate: number;
  minRequestsPerMinute: number;
  maxTokensPerRequest: number;
}

export class EmbeddingPerformanceMonitor {
  private provider: IEmbeddingProvider;
  private loggingService: CentralizedLoggingService;
  private metrics: EmbeddingMetrics;
  private responseTimes: number[] = [];
  private requestTimestamps: number[] = [];
  private thresholds: PerformanceThresholds;

  constructor(
    provider: IEmbeddingProvider,
    loggingService: CentralizedLoggingService,
    thresholds?: Partial<PerformanceThresholds>
  ) {
    this.provider = provider;
    this.loggingService = loggingService;
    this.thresholds = {
      maxResponseTime: 10000, // 10 seconds
      maxErrorRate: 0.05, // 5%
      minRequestsPerMinute: 1,
      maxTokensPerRequest: 8000,
      ...thresholds,
    };

    this.metrics = this.initializeMetrics();
  }

  /**
   * Record a successful embedding request
   */
  public recordSuccess(responseTime: number, tokenCount?: number): void {
    const now = Date.now();
    
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.metrics.lastRequestTime = new Date(now);
    this.metrics.lastSuccessTime = new Date(now);

    // Update response time metrics
    this.responseTimes.push(responseTime);
    this.updateResponseTimeMetrics();

    // Update token metrics
    if (tokenCount) {
      this.metrics.totalTokensProcessed += tokenCount;
      this.metrics.averageTokensPerRequest = 
        this.metrics.totalTokensProcessed / this.metrics.totalRequests;
    }

    // Update request rate
    this.requestTimestamps.push(now);
    this.updateRequestRate();

    // Update error rate
    this.updateErrorRate();

    this.loggingService.debug('Embedding request success recorded', {
      provider: this.provider.getProviderName(),
      responseTime,
      tokenCount,
      totalRequests: this.metrics.totalRequests,
    }, 'EmbeddingPerformanceMonitor');
  }

  /**
   * Record a failed embedding request
   */
  public recordFailure(responseTime: number, error: string): void {
    const now = Date.now();
    
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.metrics.lastRequestTime = new Date(now);
    this.metrics.lastErrorTime = new Date(now);
    this.metrics.lastError = error;

    // Update response time metrics (even for failures)
    this.responseTimes.push(responseTime);
    this.updateResponseTimeMetrics();

    // Update request rate
    this.requestTimestamps.push(now);
    this.updateRequestRate();

    // Update error rate
    this.updateErrorRate();

    this.loggingService.warn('Embedding request failure recorded', {
      provider: this.provider.getProviderName(),
      responseTime,
      error,
      errorRate: this.metrics.errorRate,
    }, 'EmbeddingPerformanceMonitor');
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): EmbeddingMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate performance report
   */
  public generateReport(): EmbeddingPerformanceReport {
    const issues = this.analyzePerformance();
    const recommendations = this.generateRecommendations(issues);
    const isHealthy = issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0;

    return {
      provider: this.provider.getProviderName(),
      model: this.extractModelName(),
      isHealthy,
      metrics: this.getMetrics(),
      issues,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Reset metrics
   */
  public reset(): void {
    this.metrics = this.initializeMetrics();
    this.responseTimes = [];
    this.requestTimestamps = [];
    
    this.loggingService.info('Embedding performance metrics reset', {
      provider: this.provider.getProviderName(),
    }, 'EmbeddingPerformanceMonitor');
  }

  /**
   * Initialize metrics with default values
   */
  private initializeMetrics(): EmbeddingMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      totalTokensProcessed: 0,
      averageTokensPerRequest: 0,
      requestsPerMinute: 0,
      errorRate: 0,
    };
  }

  /**
   * Update response time metrics
   */
  private updateResponseTimeMetrics(): void {
    if (this.responseTimes.length === 0) return;

    // Keep only last 1000 response times for rolling metrics
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    this.metrics.minResponseTime = Math.min(...this.responseTimes);
    this.metrics.maxResponseTime = Math.max(...this.responseTimes);
  }

  /**
   * Update request rate metrics
   */
  private updateRequestRate(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // 1 minute in milliseconds

    // Keep only timestamps from the last minute
    this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    this.metrics.requestsPerMinute = this.requestTimestamps.length;
  }

  /**
   * Update error rate
   */
  private updateErrorRate(): void {
    if (this.metrics.totalRequests === 0) {
      this.metrics.errorRate = 0;
    } else {
      this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
    }
  }

  /**
   * Analyze performance for issues
   */
  private analyzePerformance(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Response time analysis
    if (this.metrics.averageResponseTime > this.thresholds.maxResponseTime) {
      issues.push({
        severity: this.metrics.averageResponseTime > this.thresholds.maxResponseTime * 2 ? 'high' : 'medium',
        type: 'performance',
        message: `High average response time: ${this.metrics.averageResponseTime.toFixed(0)}ms`,
        details: {
          averageResponseTime: this.metrics.averageResponseTime,
          threshold: this.thresholds.maxResponseTime,
        },
      });
    }

    // Error rate analysis
    if (this.metrics.errorRate > this.thresholds.maxErrorRate) {
      issues.push({
        severity: this.metrics.errorRate > 0.2 ? 'critical' : 'high',
        type: 'reliability',
        message: `High error rate: ${(this.metrics.errorRate * 100).toFixed(1)}%`,
        details: {
          errorRate: this.metrics.errorRate,
          threshold: this.thresholds.maxErrorRate,
          failedRequests: this.metrics.failedRequests,
          totalRequests: this.metrics.totalRequests,
        },
      });
    }

    // Request rate analysis
    if (this.metrics.requestsPerMinute < this.thresholds.minRequestsPerMinute && this.metrics.totalRequests > 10) {
      issues.push({
        severity: 'low',
        type: 'performance',
        message: `Low request rate: ${this.metrics.requestsPerMinute} requests/minute`,
        details: {
          requestsPerMinute: this.metrics.requestsPerMinute,
          threshold: this.thresholds.minRequestsPerMinute,
        },
      });
    }

    // Token usage analysis
    if (this.metrics.averageTokensPerRequest > this.thresholds.maxTokensPerRequest) {
      issues.push({
        severity: 'medium',
        type: 'cost',
        message: `High token usage: ${this.metrics.averageTokensPerRequest.toFixed(0)} tokens/request`,
        details: {
          averageTokensPerRequest: this.metrics.averageTokensPerRequest,
          threshold: this.thresholds.maxTokensPerRequest,
        },
      });
    }

    // Recent errors analysis
    if (this.metrics.lastErrorTime && this.metrics.lastError) {
      const timeSinceLastError = Date.now() - this.metrics.lastErrorTime.getTime();
      if (timeSinceLastError < 300000) { // 5 minutes
        issues.push({
          severity: 'medium',
          type: 'reliability',
          message: `Recent error: ${this.metrics.lastError}`,
          details: {
            lastError: this.metrics.lastError,
            timeSinceLastError,
          },
        });
      }
    }

    return issues;
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: PerformanceIssue[]): string[] {
    const recommendations: string[] = [];

    for (const issue of issues) {
      switch (issue.type) {
        case 'performance':
          if (issue.message.includes('response time')) {
            recommendations.push('Consider optimizing text chunk sizes or switching to a faster model');
            recommendations.push('Check network connectivity and API endpoint performance');
          } else if (issue.message.includes('request rate')) {
            recommendations.push('Consider implementing request batching for better throughput');
          }
          break;
        case 'reliability':
          if (issue.message.includes('error rate')) {
            recommendations.push('Investigate error patterns and implement retry logic');
            recommendations.push('Check API key validity and rate limits');
          } else if (issue.message.includes('Recent error')) {
            recommendations.push('Monitor for recurring errors and implement error handling');
          }
          break;
        case 'cost':
          recommendations.push('Consider reducing text chunk sizes to lower token usage');
          recommendations.push('Implement text preprocessing to remove unnecessary content');
          break;
        case 'configuration':
          recommendations.push('Review provider configuration and model settings');
          break;
      }
    }

    // General recommendations
    if (issues.length === 0) {
      recommendations.push('Performance is within acceptable thresholds');
    } else {
      recommendations.push('Monitor performance trends and adjust thresholds as needed');
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Extract model name from provider
   */
  private extractModelName(): string {
    const providerName = this.provider.getProviderName();
    const parts = providerName.split(':');
    return parts.length > 1 ? parts[1] : 'unknown';
  }
}
