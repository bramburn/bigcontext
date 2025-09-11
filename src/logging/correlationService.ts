/**
 * Correlation Service
 * 
 * Provides correlation ID management for tracking requests and operations
 * across the entire extension lifecycle, enabling better debugging and
 * performance analysis.
 */

import { v4 as uuidv4 } from 'uuid';

export interface CorrelationContext {
  correlationId: string;
  operationName: string;
  startTime: number;
  parentId?: string;
  metadata?: Record<string, any>;
}

export interface OperationMetrics {
  correlationId: string;
  operationName: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class CorrelationService {
  private static instance: CorrelationService;
  private activeContexts = new Map<string, CorrelationContext>();
  private operationHistory: OperationMetrics[] = [];
  private maxHistorySize = 1000;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): CorrelationService {
    if (!CorrelationService.instance) {
      CorrelationService.instance = new CorrelationService();
    }
    return CorrelationService.instance;
  }

  /**
   * Start a new operation with correlation tracking
   */
  public startOperation(
    operationName: string,
    parentId?: string,
    metadata?: Record<string, any>
  ): string {
    const correlationId = uuidv4();
    const context: CorrelationContext = {
      correlationId,
      operationName,
      startTime: Date.now(),
      parentId,
      metadata,
    };

    this.activeContexts.set(correlationId, context);
    return correlationId;
  }

  /**
   * End an operation and record metrics
   */
  public endOperation(
    correlationId: string,
    success: boolean = true,
    error?: string,
    additionalMetadata?: Record<string, any>
  ): OperationMetrics | null {
    const context = this.activeContexts.get(correlationId);
    if (!context) {
      return null;
    }

    const duration = Date.now() - context.startTime;
    const metrics: OperationMetrics = {
      correlationId,
      operationName: context.operationName,
      duration,
      success,
      error,
      metadata: {
        ...context.metadata,
        ...additionalMetadata,
        parentId: context.parentId,
      },
    };

    // Remove from active contexts
    this.activeContexts.delete(correlationId);

    // Add to history
    this.operationHistory.push(metrics);

    // Maintain history size limit
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory = this.operationHistory.slice(-this.maxHistorySize);
    }

    return metrics;
  }

  /**
   * Get current correlation context
   */
  public getContext(correlationId: string): CorrelationContext | undefined {
    return this.activeContexts.get(correlationId);
  }

  /**
   * Get all active contexts
   */
  public getActiveContexts(): CorrelationContext[] {
    return Array.from(this.activeContexts.values());
  }

  /**
   * Get operation history
   */
  public getOperationHistory(limit?: number): OperationMetrics[] {
    const history = [...this.operationHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get operation metrics by name
   */
  public getOperationMetrics(operationName: string): OperationMetrics[] {
    return this.operationHistory.filter(m => m.operationName === operationName);
  }

  /**
   * Get operation chain (parent-child relationships)
   */
  public getOperationChain(correlationId: string): OperationMetrics[] {
    const chain: OperationMetrics[] = [];
    const visited = new Set<string>();

    const findChain = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const operation = this.operationHistory.find(op => op.correlationId === id);
      if (operation) {
        chain.push(operation);
        
        // Find parent
        if (operation.metadata?.parentId) {
          findChain(operation.metadata.parentId);
        }

        // Find children
        const children = this.operationHistory.filter(
          op => op.metadata?.parentId === id
        );
        children.forEach(child => findChain(child.correlationId));
      }
    };

    findChain(correlationId);
    return chain.sort((a, b) => a.correlationId.localeCompare(b.correlationId));
  }

  /**
   * Get performance summary for an operation type
   */
  public getPerformanceSummary(operationName: string): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
  } {
    const operations = this.getOperationMetrics(operationName);
    
    if (operations.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
      };
    }

    const successful = operations.filter(op => op.success);
    const durations = operations.map(op => op.duration);

    return {
      totalOperations: operations.length,
      successfulOperations: successful.length,
      failedOperations: operations.length - successful.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: successful.length / operations.length,
    };
  }

  /**
   * Clear operation history
   */
  public clearHistory(): void {
    this.operationHistory = [];
  }

  /**
   * Clear active contexts (useful for cleanup)
   */
  public clearActiveContexts(): void {
    this.activeContexts.clear();
  }

  /**
   * Export operation data for analysis
   */
  public exportData(): {
    activeContexts: CorrelationContext[];
    operationHistory: OperationMetrics[];
    timestamp: string;
  } {
    return {
      activeContexts: this.getActiveContexts(),
      operationHistory: this.getOperationHistory(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get correlation statistics
   */
  public getStatistics(): {
    activeOperations: number;
    totalOperationsRecorded: number;
    operationTypes: string[];
    averageOperationDuration: number;
    overallSuccessRate: number;
  } {
    const operationTypes = [...new Set(this.operationHistory.map(op => op.operationName))];
    const totalDuration = this.operationHistory.reduce((sum, op) => sum + op.duration, 0);
    const successfulOps = this.operationHistory.filter(op => op.success).length;

    return {
      activeOperations: this.activeContexts.size,
      totalOperationsRecorded: this.operationHistory.length,
      operationTypes,
      averageOperationDuration: this.operationHistory.length > 0 
        ? totalDuration / this.operationHistory.length 
        : 0,
      overallSuccessRate: this.operationHistory.length > 0 
        ? successfulOps / this.operationHistory.length 
        : 0,
    };
  }
}

/**
 * Decorator for automatic correlation tracking
 */
export function withCorrelation(operationName: string, metadata?: Record<string, any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const correlationService = CorrelationService.getInstance();
      const correlationId = correlationService.startOperation(operationName, undefined, metadata);

      try {
        const result = await originalMethod.apply(this, args);
        correlationService.endOperation(correlationId, true);
        return result;
      } catch (error) {
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

/**
 * Utility function to execute operation with correlation tracking
 */
export async function executeWithCorrelation<T>(
  operationName: string,
  operation: (correlationId: string) => Promise<T>,
  parentId?: string,
  metadata?: Record<string, any>
): Promise<T> {
  const correlationService = CorrelationService.getInstance();
  const correlationId = correlationService.startOperation(operationName, parentId, metadata);

  try {
    const result = await operation(correlationId);
    correlationService.endOperation(correlationId, true);
    return result;
  } catch (error) {
    correlationService.endOperation(
      correlationId, 
      false, 
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}
