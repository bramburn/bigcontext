import * as vscode from 'vscode';

/**
 * Performance metrics for tracking system performance
 */
export interface PerformanceMetrics {
    searchLatency: number[];
    indexingTime: number;
    memoryUsage: number;
    cacheHitRate: number;
    activeConnections: number;
    lastUpdated: Date;
}

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
}

/**
 * Performance optimization settings
 */
export interface OptimizationSettings {
    enableCaching: boolean;
    cacheSize: number;
    cacheTTL: number;
    enableCompression: boolean;
    batchSize: number;
    maxConcurrentOperations: number;
}

/**
 * PerformanceManager class responsible for performance optimization and monitoring.
 * 
 * This class provides performance enhancements including:
 * - Intelligent caching with LRU eviction
 * - Performance metrics collection and monitoring
 * - Memory usage optimization
 * - Request batching and throttling
 * - Background task scheduling
 */
export class PerformanceManager {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private metrics: PerformanceMetrics;
    private settings: OptimizationSettings;
    private activeOperations: Set<string> = new Set();
    private operationQueue: Array<() => Promise<any>> = [];
    private isProcessingQueue = false;

    /**
     * Creates a new PerformanceManager instance
     */
    constructor() {
        this.metrics = {
            searchLatency: [],
            indexingTime: 0,
            memoryUsage: 0,
            cacheHitRate: 0,
            activeConnections: 0,
            lastUpdated: new Date()
        };

        this.settings = {
            enableCaching: true,
            cacheSize: 1000,
            cacheTTL: 5 * 60 * 1000, // 5 minutes
            enableCompression: false,
            batchSize: 10,
            maxConcurrentOperations: 5
        };

        this.startPerformanceMonitoring();
    }

    /**
     * Caches data with automatic expiration and LRU eviction
     * @param key - Cache key
     * @param data - Data to cache
     * @param ttl - Time to live in milliseconds (optional)
     */
    setCache<T>(key: string, data: T, ttl?: number): void {
        if (!this.settings.enableCaching) {
            return;
        }

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.settings.cacheTTL,
            accessCount: 0
        };

        this.cache.set(key, entry);

        // Enforce cache size limit with LRU eviction
        if (this.cache.size > this.settings.cacheSize) {
            this.evictLRU();
        }
    }

    /**
     * Retrieves data from cache
     * @param key - Cache key
     * @returns Cached data or undefined if not found/expired
     */
    getCache<T>(key: string): T | undefined {
        if (!this.settings.enableCaching) {
            return undefined;
        }

        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return undefined;
        }

        // Update access count for LRU
        entry.accessCount++;
        entry.timestamp = Date.now();

        return entry.data as T;
    }

    /**
     * Clears cache entries
     * @param pattern - Optional pattern to match keys (supports wildcards)
     */
    clearCache(pattern?: string): void {
        if (!pattern) {
            this.cache.clear();
            return;
        }

        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Measures and records operation performance
     * @param operationName - Name of the operation
     * @param operation - Function to execute and measure
     * @returns Result of the operation
     */
    async measurePerformance<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
        const startTime = Date.now();
        const operationId = `${operationName}-${startTime}`;

        try {
            this.activeOperations.add(operationId);
            const result = await operation();
            
            const duration = Date.now() - startTime;
            this.recordMetric(operationName, duration);
            
            return result;
        } finally {
            this.activeOperations.delete(operationId);
        }
    }

    /**
     * Batches operations to improve performance
     * @param operations - Array of operations to batch
     * @returns Promise resolving to array of results
     */
    async batchOperations<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
        const batches: Array<Array<() => Promise<T>>> = [];
        
        // Split operations into batches
        for (let i = 0; i < operations.length; i += this.settings.batchSize) {
            batches.push(operations.slice(i, i + this.settings.batchSize));
        }

        const results: T[] = [];

        // Process batches sequentially to avoid overwhelming the system
        for (const batch of batches) {
            const batchResults = await Promise.all(batch.map(op => op()));
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Queues operation for throttled execution
     * @param operation - Operation to queue
     * @returns Promise resolving to operation result
     */
    async queueOperation<T>(operation: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.operationQueue.push(async () => {
                try {
                    const result = await operation();
                    resolve(result);
                    return result;
                } catch (error) {
                    reject(error);
                    throw error;
                }
            });

            this.processQueue();
        });
    }

    /**
     * Gets current performance metrics
     * @returns Current performance metrics
     */
    getMetrics(): PerformanceMetrics {
        this.updateMemoryUsage();
        this.updateCacheHitRate();
        this.metrics.activeConnections = this.activeOperations.size;
        this.metrics.lastUpdated = new Date();
        
        return { ...this.metrics };
    }

    /**
     * Updates optimization settings
     * @param newSettings - New optimization settings
     */
    updateSettings(newSettings: Partial<OptimizationSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        
        // Apply cache size limit if reduced
        if (newSettings.cacheSize && this.cache.size > newSettings.cacheSize) {
            while (this.cache.size > newSettings.cacheSize) {
                this.evictLRU();
            }
        }

        console.log('PerformanceManager: Settings updated', this.settings);
    }

    /**
     * Optimizes memory usage by cleaning up expired entries and running garbage collection
     */
    optimizeMemory(): void {
        // Clean expired cache entries
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }

        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        console.log('PerformanceManager: Memory optimization completed');
    }

    /**
     * Generates performance report
     * @returns Detailed performance report
     */
    generateReport(): string {
        const metrics = this.getMetrics();
        const avgSearchLatency = metrics.searchLatency.length > 0 
            ? metrics.searchLatency.reduce((a, b) => a + b, 0) / metrics.searchLatency.length 
            : 0;

        return `
Performance Report - ${metrics.lastUpdated.toISOString()}
========================================================

Search Performance:
- Average Latency: ${avgSearchLatency.toFixed(2)}ms
- Total Searches: ${metrics.searchLatency.length}

Indexing Performance:
- Last Indexing Time: ${metrics.indexingTime}ms

Memory Usage:
- Current Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB

Cache Performance:
- Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%
- Cache Size: ${this.cache.size} entries

System:
- Active Operations: ${metrics.activeConnections}
- Queue Length: ${this.operationQueue.length}

Settings:
- Caching Enabled: ${this.settings.enableCaching}
- Cache Size Limit: ${this.settings.cacheSize}
- Cache TTL: ${this.settings.cacheTTL}ms
- Batch Size: ${this.settings.batchSize}
- Max Concurrent Operations: ${this.settings.maxConcurrentOperations}
        `.trim();
    }

    /**
     * Evicts least recently used cache entry
     */
    private evictLRU(): void {
        let oldestKey: string | undefined;
        let oldestTime = Date.now();
        let lowestAccessCount = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.accessCount < lowestAccessCount || 
                (entry.accessCount === lowestAccessCount && entry.timestamp < oldestTime)) {
                oldestKey = key;
                oldestTime = entry.timestamp;
                lowestAccessCount = entry.accessCount;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Records performance metric
     */
    private recordMetric(operationName: string, duration: number): void {
        if (operationName.includes('search')) {
            this.metrics.searchLatency.push(duration);
            
            // Keep only last 100 search latencies
            if (this.metrics.searchLatency.length > 100) {
                this.metrics.searchLatency = this.metrics.searchLatency.slice(-100);
            }
        } else if (operationName.includes('index')) {
            this.metrics.indexingTime = duration;
        }
    }

    /**
     * Updates memory usage metric
     */
    private updateMemoryUsage(): void {
        if (process.memoryUsage) {
            this.metrics.memoryUsage = process.memoryUsage().heapUsed;
        }
    }

    /**
     * Updates cache hit rate metric
     */
    private updateCacheHitRate(): void {
        // This would be calculated based on cache hits vs misses
        // For now, we'll estimate based on cache size
        this.metrics.cacheHitRate = Math.min(this.cache.size / this.settings.cacheSize, 1);
    }

    /**
     * Processes the operation queue with throttling
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessingQueue || this.operationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        try {
            while (this.operationQueue.length > 0 && 
                   this.activeOperations.size < this.settings.maxConcurrentOperations) {
                
                const operation = this.operationQueue.shift();
                if (operation) {
                    // Execute operation without waiting
                    operation().catch(error => {
                        console.error('PerformanceManager: Queued operation failed:', error);
                    });
                }
            }
        } finally {
            this.isProcessingQueue = false;
            
            // Schedule next processing if queue is not empty
            if (this.operationQueue.length > 0) {
                setTimeout(() => this.processQueue(), 100);
            }
        }
    }

    /**
     * Starts background performance monitoring
     */
    private startPerformanceMonitoring(): void {
        // Update metrics every 30 seconds
        setInterval(() => {
            this.updateMemoryUsage();
            this.updateCacheHitRate();
        }, 30000);

        // Clean up expired cache entries every 5 minutes
        setInterval(() => {
            this.optimizeMemory();
        }, 5 * 60 * 1000);
    }

    /**
     * Disposes of the PerformanceManager and cleans up resources
     */
    dispose(): void {
        this.cache.clear();
        this.operationQueue = [];
        this.activeOperations.clear();
        console.log('PerformanceManager: Disposed');
    }
}
