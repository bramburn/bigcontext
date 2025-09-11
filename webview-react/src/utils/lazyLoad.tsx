import React, { Suspense, ComponentType } from 'react';

interface LazyLoadOptions {
  fallback?: React.ComponentType;
  delay?: number;
}

/**
 * Creates a lazy-loaded component with optional loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFn);
  
  const { fallback: Fallback, delay = 0 } = options;
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    const [showFallback, setShowFallback] = React.useState(delay > 0);
    
    React.useEffect(() => {
      if (delay > 0) {
        const timer = setTimeout(() => setShowFallback(false), delay);
        return () => clearTimeout(timer);
      }
    }, []);
    
    if (showFallback && Fallback) {
      return <Fallback />;
    }
    
    return (
      <Suspense fallback={Fallback ? <Fallback /> : <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Simple loading spinner component
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--vscode-progressBar-background)] border-t-transparent"></div>
    </div>
  );
}

/**
 * Loading skeleton for form components
 */
export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-[var(--vscode-panel-border)] rounded w-1/4"></div>
      <div className="h-9 bg-[var(--vscode-panel-border)] rounded"></div>
      <div className="h-4 bg-[var(--vscode-panel-border)] rounded w-1/3"></div>
      <div className="h-9 bg-[var(--vscode-panel-border)] rounded"></div>
      <div className="h-9 bg-[var(--vscode-button-background)] rounded w-24"></div>
    </div>
  );
}

/**
 * Loading skeleton for search results
 */
export function SearchSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-[var(--vscode-panel-border)] rounded p-3 space-y-2">
          <div className="h-4 bg-[var(--vscode-panel-border)] rounded w-3/4"></div>
          <div className="h-3 bg-[var(--vscode-panel-border)] rounded w-1/2"></div>
          <div className="h-3 bg-[var(--vscode-panel-border)] rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 100) { // Log slow renders
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

/**
 * Debounced value hook for performance optimization
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Memoized component wrapper for expensive renders
 */
export function withMemo<T extends ComponentType<any>>(
  Component: T,
  areEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
): React.MemoExoticComponent<T> {
  return React.memo(Component as any, areEqual as any) as React.MemoExoticComponent<T>;
}
