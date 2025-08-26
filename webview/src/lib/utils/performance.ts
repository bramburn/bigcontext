/**
 * Performance Monitoring Utilities
 * 
 * Provides tools for monitoring and optimizing application performance,
 * including component loading times, render performance, and user interactions.
 */

// Performance metrics interface
export interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

// Performance tracker class
class PerformanceTracker {
    private metrics: Map<string, PerformanceMetric> = new Map();
    private observers: PerformanceObserver[] = [];
    private isEnabled: boolean = true;

    constructor() {
        this.setupObservers();
    }

    /**
     * Start tracking a performance metric
     */
    start(name: string, metadata?: Record<string, any>): void {
        if (!this.isEnabled) return;

        const metric: PerformanceMetric = {
            name,
            startTime: performance.now(),
            metadata
        };

        this.metrics.set(name, metric);
        
        // Mark the start in the browser's performance timeline
        if (performance.mark) {
            performance.mark(`${name}-start`);
        }
    }

    /**
     * End tracking a performance metric
     */
    end(name: string): PerformanceMetric | null {
        if (!this.isEnabled) return null;

        const metric = this.metrics.get(name);
        if (!metric) {
            console.warn(`Performance metric '${name}' was not started`);
            return null;
        }

        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;

        // Mark the end and measure in the browser's performance timeline
        if (performance.mark && performance.measure) {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
        }

        // Log slow operations
        if (metric.duration > 1000) {
            console.warn(`Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
        }

        return metric;
    }

    /**
     * Get a performance metric
     */
    get(name: string): PerformanceMetric | undefined {
        return this.metrics.get(name);
    }

    /**
     * Get all performance metrics
     */
    getAll(): PerformanceMetric[] {
        return Array.from(this.metrics.values());
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics.clear();
        
        if (performance.clearMarks) {
            performance.clearMarks();
        }
        if (performance.clearMeasures) {
            performance.clearMeasures();
        }
    }

    /**
     * Get performance summary
     */
    getSummary(): {
        totalMetrics: number;
        averageDuration: number;
        slowestOperation: PerformanceMetric | null;
        fastestOperation: PerformanceMetric | null;
    } {
        const completedMetrics = Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
        
        if (completedMetrics.length === 0) {
            return {
                totalMetrics: 0,
                averageDuration: 0,
                slowestOperation: null,
                fastestOperation: null
            };
        }

        const durations = completedMetrics.map(m => m.duration!);
        const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
        
        const slowestOperation = completedMetrics.reduce((slowest, current) => 
            (current.duration! > slowest.duration!) ? current : slowest
        );
        
        const fastestOperation = completedMetrics.reduce((fastest, current) => 
            (current.duration! < fastest.duration!) ? current : fastest
        );

        return {
            totalMetrics: completedMetrics.length,
            averageDuration,
            slowestOperation,
            fastestOperation
        };
    }

    /**
     * Setup performance observers
     */
    private setupObservers(): void {
        if (typeof PerformanceObserver === 'undefined') return;

        try {
            // Observe navigation timing
            const navigationObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'navigation') {
                        this.logNavigationTiming(entry as PerformanceNavigationTiming);
                    }
                }
            });
            navigationObserver.observe({ entryTypes: ['navigation'] });
            this.observers.push(navigationObserver);

            // Observe resource loading
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'resource') {
                        this.logResourceTiming(entry as PerformanceResourceTiming);
                    }
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.push(resourceObserver);

            // Observe long tasks
            if ('longtask' in PerformanceObserver.supportedEntryTypes) {
                const longTaskObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
                    }
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.push(longTaskObserver);
            }
        } catch (error) {
            console.warn('Failed to setup performance observers:', error);
        }
    }

    /**
     * Log navigation timing
     */
    private logNavigationTiming(entry: PerformanceNavigationTiming): void {
        const metrics = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            firstPaint: 0,
            firstContentfulPaint: 0
        };

        // Get paint timings if available
        const paintEntries = performance.getEntriesByType('paint');
        for (const paintEntry of paintEntries) {
            if (paintEntry.name === 'first-paint') {
                metrics.firstPaint = paintEntry.startTime;
            } else if (paintEntry.name === 'first-contentful-paint') {
                metrics.firstContentfulPaint = paintEntry.startTime;
            }
        }

        console.log('Navigation Performance:', metrics);
    }

    /**
     * Log resource timing
     */
    private logResourceTiming(entry: PerformanceResourceTiming): void {
        // Only log slow resources
        if (entry.duration > 500) {
            console.warn(`Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
    }

    /**
     * Enable or disable performance tracking
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    /**
     * Cleanup observers
     */
    destroy(): void {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.clear();
    }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const metricName = name || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = function (...args: any[]) {
            performanceTracker.start(metricName);
            
            try {
                const result = originalMethod.apply(this, args);
                
                // Handle async functions
                if (result && typeof result.then === 'function') {
                    return result.finally(() => {
                        performanceTracker.end(metricName);
                    });
                } else {
                    performanceTracker.end(metricName);
                    return result;
                }
            } catch (error) {
                performanceTracker.end(metricName);
                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * Measure component loading time
 */
export function measureComponentLoad(componentName: string): {
    start: () => void;
    end: () => void;
} {
    const metricName = `component-load-${componentName}`;
    
    return {
        start: () => performanceTracker.start(metricName, { type: 'component-load', component: componentName }),
        end: () => performanceTracker.end(metricName)
    };
}

/**
 * Measure user interaction performance
 */
export function measureInteraction(interactionName: string, callback: () => void | Promise<void>): void {
    const metricName = `interaction-${interactionName}`;
    
    performanceTracker.start(metricName, { type: 'user-interaction', interaction: interactionName });
    
    try {
        const result = callback();
        
        if (result && typeof result.then === 'function') {
            result.finally(() => {
                performanceTracker.end(metricName);
            });
        } else {
            performanceTracker.end(metricName);
        }
    } catch (error) {
        performanceTracker.end(metricName);
        throw error;
    }
}

/**
 * Get performance insights
 */
export function getPerformanceInsights(): {
    summary: ReturnType<PerformanceTracker['getSummary']>;
    recommendations: string[];
} {
    const summary = performanceTracker.getSummary();
    const recommendations: string[] = [];

    // Analyze performance and provide recommendations
    if (summary.averageDuration > 100) {
        recommendations.push('Consider optimizing slow operations or implementing lazy loading');
    }

    if (summary.slowestOperation && summary.slowestOperation.duration! > 1000) {
        recommendations.push(`Optimize ${summary.slowestOperation.name} - it's taking ${summary.slowestOperation.duration!.toFixed(2)}ms`);
    }

    // Check for memory usage
    if (performance.memory) {
        const memoryUsage = (performance.memory as any).usedJSHeapSize / 1024 / 1024;
        if (memoryUsage > 50) {
            recommendations.push(`High memory usage detected: ${memoryUsage.toFixed(2)}MB`);
        }
    }

    return {
        summary,
        recommendations
    };
}

/**
 * Export performance data for analysis
 */
export function exportPerformanceData(): string {
    const data = {
        timestamp: new Date().toISOString(),
        metrics: performanceTracker.getAll(),
        summary: performanceTracker.getSummary(),
        insights: getPerformanceInsights(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };

    return JSON.stringify(data, null, 2);
}
