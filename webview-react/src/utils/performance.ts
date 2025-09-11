/**
 * Performance monitoring utilities for the webview
 */

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  props?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep only last 100 metrics
  private slowRenderThreshold = 16; // 16ms for 60fps

  /**
   * Start timing a component render
   */
  startRender(componentName: string, props?: Record<string, any>): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      this.recordMetric({
        renderTime,
        componentName,
        timestamp: Date.now(),
        props: props ? this.sanitizeProps(props) : undefined
      });
      
      if (renderTime > this.slowRenderThreshold) {
        console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const renderTimes = this.metrics.map(m => m.renderTime);
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);
    
    const slowRenders = this.metrics.filter(m => m.renderTime > this.slowRenderThreshold);
    
    return {
      totalRenders: this.metrics.length,
      avgRenderTime: Number(avgRenderTime.toFixed(2)),
      maxRenderTime: Number(maxRenderTime.toFixed(2)),
      minRenderTime: Number(minRenderTime.toFixed(2)),
      slowRenders: slowRenders.length,
      slowRenderPercentage: Number(((slowRenders.length / this.metrics.length) * 100).toFixed(2))
    };
  }

  /**
   * Get metrics for a specific component
   */
  getComponentStats(componentName: string) {
    const componentMetrics = this.metrics.filter(m => m.componentName === componentName);
    
    if (componentMetrics.length === 0) {
      return null;
    }

    const renderTimes = componentMetrics.map(m => m.renderTime);
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    
    return {
      componentName,
      renders: componentMetrics.length,
      avgRenderTime: Number(avgRenderTime.toFixed(2)),
      maxRenderTime: Number(Math.max(...renderTimes).toFixed(2)),
      lastRender: componentMetrics[componentMetrics.length - 1]?.timestamp
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Sanitize props to avoid circular references and large objects
   */
  private sanitizeProps(props: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[key] = `[Array(${value.length})]`;
        } else {
          sanitized[key] = '[Object]';
        }
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Bundle size analyzer
 */
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return null;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  const scriptSizes = scripts.map(script => ({
    src: (script as HTMLScriptElement).src,
    type: 'script'
  }));
  
  const stylesheetSizes = stylesheets.map(link => ({
    href: (link as HTMLLinkElement).href,
    type: 'stylesheet'
  }));
  
  return {
    scripts: scriptSizes,
    stylesheets: stylesheetSizes,
    totalAssets: scriptSizes.length + stylesheetSizes.length
  };
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: Number(((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2))
    };
  }
  
  return null;
}

/**
 * Network performance monitoring
 */
export function getNetworkTiming() {
  if ('getEntriesByType' in performance) {
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    
    if (navigationEntries.length > 0) {
      const entry = navigationEntries[0];
      return {
        domContentLoaded: Number((entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart).toFixed(2)),
        loadComplete: Number((entry.loadEventEnd - entry.loadEventStart).toFixed(2)),
        domInteractive: Number((entry.domInteractive - entry.fetchStart).toFixed(2)),
        firstPaint: Number((entry.responseEnd - entry.requestStart).toFixed(2))
      };
    }
  }
  
  return null;
}

/**
 * Performance report generator
 */
export function generatePerformanceReport() {
  return {
    timestamp: new Date().toISOString(),
    renderStats: performanceMonitor.getStats(),
    memoryUsage: getMemoryUsage(),
    networkTiming: getNetworkTiming(),
    bundleInfo: analyzeBundleSize()
  };
}
