/**
 * Webview Logger
 *
 * Provides logging functionality for the React webview that integrates
 * with the extension's centralized logging system.
 */

import React from 'react';

declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  metadata?: Record<string, any>;
  correlationId?: string;
}

export interface PerformanceMetric {
  operationName: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class WebviewLogger {
  private static instance: WebviewLogger;
  private vscode: any;
  private localLogs: LogEntry[] = [];
  private maxLocalLogs = 1000;
  private performanceMetrics: PerformanceMetric[] = [];
  private activeOperations = new Map<string, { name: string; startTime: number; metadata?: any }>();

  private constructor() {
    this.vscode = window.acquireVsCodeApi?.();
    this.setupErrorHandling();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WebviewLogger {
    if (!WebviewLogger.instance) {
      WebviewLogger.instance = new WebviewLogger();
    }
    return WebviewLogger.instance;
  }

  /**
   * Log a message
   */
  public log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    source: string = 'Webview'
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      metadata,
    };

    // Store locally
    this.localLogs.push(entry);
    if (this.localLogs.length > this.maxLocalLogs) {
      this.localLogs = this.localLogs.slice(-this.maxLocalLogs);
    }

    // Send to extension if VS Code API is available
    if (this.vscode) {
      this.vscode.postMessage({
        command: 'log',
        data: entry,
      });
    }

    // Also log to console for development
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 
                         level === 'info' ? 'info' : 'log';
    
    console[consoleMethod](`[${source}] ${message}`, metadata || '');
  }

  /**
   * Debug log
   */
  public debug(message: string, metadata?: Record<string, any>, source?: string): void {
    this.log('debug', message, metadata, source);
  }

  /**
   * Info log
   */
  public info(message: string, metadata?: Record<string, any>, source?: string): void {
    this.log('info', message, metadata, source);
  }

  /**
   * Warning log
   */
  public warn(message: string, metadata?: Record<string, any>, source?: string): void {
    this.log('warn', message, metadata, source);
  }

  /**
   * Error log
   */
  public error(message: string, metadata?: Record<string, any>, source?: string): void {
    this.log('error', message, metadata, source);
  }

  /**
   * Start performance tracking
   */
  public startPerformanceTracking(
    operationName: string,
    metadata?: Record<string, any>
  ): string {
    const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeOperations.set(operationId, {
      name: operationName,
      startTime: performance.now(),
      metadata,
    });

    this.debug(`Started performance tracking: ${operationName}`, { operationId, ...metadata });
    return operationId;
  }

  /**
   * End performance tracking
   */
  public endPerformanceTracking(
    operationId: string,
    additionalMetadata?: Record<string, any>
  ): PerformanceMetric | null {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      this.warn(`Performance tracking operation not found: ${operationId}`);
      return null;
    }

    const duration = performance.now() - operation.startTime;
    const metric: PerformanceMetric = {
      operationName: operation.name,
      duration,
      timestamp: new Date().toISOString(),
      metadata: {
        ...operation.metadata,
        ...additionalMetadata,
      },
    };

    // Store locally
    this.performanceMetrics.push(metric);
    if (this.performanceMetrics.length > 500) {
      this.performanceMetrics = this.performanceMetrics.slice(-500);
    }

    // Remove from active operations
    this.activeOperations.delete(operationId);

    // Send to extension
    if (this.vscode) {
      this.vscode.postMessage({
        command: 'performance',
        data: metric,
      });
    }

    this.debug(`Completed performance tracking: ${operation.name}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...metric.metadata,
    });

    return metric;
  }

  /**
   * Log component render performance
   */
  public logComponentRender(componentName: string, renderTime: number, props?: any): void {
    const metric: PerformanceMetric = {
      operationName: `component_render_${componentName}`,
      duration: renderTime,
      timestamp: new Date().toISOString(),
      metadata: {
        componentName,
        propsCount: props ? Object.keys(props).length : 0,
      },
    };

    this.performanceMetrics.push(metric);
    
    if (this.vscode) {
      this.vscode.postMessage({
        command: 'performance',
        data: metric,
      });
    }

    // Only log slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      this.warn(`Slow component render: ${componentName}`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        propsCount: props ? Object.keys(props).length : 0,
      });
    }
  }

  /**
   * Log user interaction
   */
  public logUserInteraction(
    action: string,
    element: string,
    metadata?: Record<string, any>
  ): void {
    this.info(`User interaction: ${action}`, {
      element,
      timestamp: new Date().toISOString(),
      ...metadata,
    }, 'UserInteraction');
  }

  /**
   * Log API call
   */
  public logApiCall(
    method: string,
    url: string,
    duration: number,
    status: number,
    metadata?: Record<string, any>
  ): void {
    const level: LogLevel = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    
    this.log(level, `API ${method} ${url}`, {
      method,
      url,
      duration,
      status,
      ...metadata,
    }, 'ApiCall');
  }

  /**
   * Get local logs
   */
  public getLocalLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let logs = level ? this.localLogs.filter(log => log.level === level) : this.localLogs;
    return limit ? logs.slice(-limit) : logs;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(operationName?: string, limit?: number): PerformanceMetric[] {
    let metrics = operationName 
      ? this.performanceMetrics.filter(m => m.operationName === operationName)
      : this.performanceMetrics;
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Clear local data
   */
  public clear(): void {
    this.localLogs = [];
    this.performanceMetrics = [];
    this.activeOperations.clear();
    this.info('Local logs and metrics cleared');
  }

  /**
   * Export local data
   */
  public exportData(): {
    logs: LogEntry[];
    performanceMetrics: PerformanceMetric[];
    timestamp: string;
  } {
    return {
      logs: this.localLogs,
      performanceMetrics: this.performanceMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      }, 'ErrorHandler');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack,
      }, 'ErrorHandler');
    });

    // Handle console errors (override console.error)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.error('Console error', {
        arguments: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)),
      }, 'Console');
      originalConsoleError.apply(console, args);
    };
  }
}

/**
 * Performance tracking decorator for React components
 */
export function withPerformanceTracking<T extends React.ComponentType<any>>(
  Component: T,
  componentName?: string
): T {
  const logger = WebviewLogger.getInstance();
  const name = componentName || Component.displayName || Component.name || 'UnknownComponent';

  const WrappedComponent = (props: any) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      logger.logComponentRender(name, renderTime, props);
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceTracking(${name})`;
  return WrappedComponent as T;
}

/**
 * Hook for performance tracking
 */
export function usePerformanceTracking(operationName: string, dependencies?: any[]) {
  const logger = WebviewLogger.getInstance();
  const [operationId, setOperationId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = logger.startPerformanceTracking(operationName);
    setOperationId(id);

    return () => {
      if (id) {
        logger.endPerformanceTracking(id);
      }
    };
  }, dependencies || []);

  return operationId;
}

// Export singleton instance
export const logger = WebviewLogger.getInstance();
