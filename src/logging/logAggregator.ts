/**
 * Log Aggregator
 * 
 * Aggregates, filters, and manages log entries from various sources
 * throughout the extension for better analysis and debugging.
 */

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface LogFilter {
  levels?: Array<'debug' | 'info' | 'warn' | 'error'>;
  sources?: string[];
  correlationId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  messagePattern?: RegExp;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface LogAggregation {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsBySource: Record<string, number>;
  timeRange: {
    earliest: Date;
    latest: Date;
  };
  topSources: Array<{ source: string; count: number }>;
  recentErrors: LogEntry[];
  correlationGroups: Record<string, LogEntry[]>;
}

export class LogAggregator {
  private logs: LogEntry[] = [];
  private maxLogSize = 50000; // Maximum number of logs to keep in memory
  private listeners: Array<(entry: LogEntry) => void> = [];

  /**
   * Add a log entry
   */
  public addLog(entry: Omit<LogEntry, 'id'>): void {
    const logEntry: LogEntry = {
      ...entry,
      id: this.generateLogId(),
    };

    this.logs.push(logEntry);

    // Maintain size limit
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (error) {
        console.error('Error in log listener:', error);
      }
    });
  }

  /**
   * Get logs with optional filtering
   */
  public getLogs(filter?: LogFilter, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (filter) {
      filteredLogs = this.applyFilter(filteredLogs, filter);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? filteredLogs.slice(0, limit) : filteredLogs;
  }

  /**
   * Get log aggregation statistics
   */
  public getAggregation(filter?: LogFilter): LogAggregation {
    const logs = filter ? this.applyFilter(this.logs, filter) : this.logs;

    if (logs.length === 0) {
      return {
        totalLogs: 0,
        logsByLevel: {},
        logsBySource: {},
        timeRange: {
          earliest: new Date(),
          latest: new Date(),
        },
        topSources: [],
        recentErrors: [],
        correlationGroups: {},
      };
    }

    // Count by level
    const logsByLevel: Record<string, number> = {};
    logs.forEach(log => {
      logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
    });

    // Count by source
    const logsBySource: Record<string, number> = {};
    logs.forEach(log => {
      logsBySource[log.source] = (logsBySource[log.source] || 0) + 1;
    });

    // Get top sources
    const topSources = Object.entries(logsBySource)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get time range
    const timestamps = logs.map(log => log.timestamp.getTime());
    const timeRange = {
      earliest: new Date(Math.min(...timestamps)),
      latest: new Date(Math.max(...timestamps)),
    };

    // Get recent errors
    const recentErrors = logs
      .filter(log => log.level === 'error')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    // Group by correlation ID
    const correlationGroups: Record<string, LogEntry[]> = {};
    logs.forEach(log => {
      if (log.correlationId) {
        if (!correlationGroups[log.correlationId]) {
          correlationGroups[log.correlationId] = [];
        }
        correlationGroups[log.correlationId].push(log);
      }
    });

    return {
      totalLogs: logs.length,
      logsByLevel,
      logsBySource,
      timeRange,
      topSources,
      recentErrors,
      correlationGroups,
    };
  }

  /**
   * Search logs by text
   */
  public searchLogs(query: string, limit?: number): LogEntry[] {
    const regex = new RegExp(query, 'i');
    const matchingLogs = this.logs.filter(log => 
      regex.test(log.message) || 
      regex.test(log.source) ||
      (log.metadata && regex.test(JSON.stringify(log.metadata)))
    );

    matchingLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? matchingLogs.slice(0, limit) : matchingLogs;
  }

  /**
   * Get logs by correlation ID
   */
  public getLogsByCorrelation(correlationId: string): LogEntry[] {
    return this.logs
      .filter(log => log.correlationId === correlationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get error patterns
   */
  public getErrorPatterns(): Array<{
    pattern: string;
    count: number;
    lastOccurrence: Date;
    sources: string[];
  }> {
    const errorLogs = this.logs.filter(log => log.level === 'error');
    const patterns = new Map<string, {
      count: number;
      lastOccurrence: Date;
      sources: Set<string>;
    }>();

    errorLogs.forEach(log => {
      // Extract error pattern (simplified)
      const pattern = this.extractErrorPattern(log.message);
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, {
          count: 0,
          lastOccurrence: log.timestamp,
          sources: new Set(),
        });
      }

      const patternData = patterns.get(pattern)!;
      patternData.count++;
      patternData.sources.add(log.source);
      
      if (log.timestamp > patternData.lastOccurrence) {
        patternData.lastOccurrence = log.timestamp;
      }
    });

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        lastOccurrence: data.lastOccurrence,
        sources: Array.from(data.sources),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Add log listener
   */
  public addListener(listener: (entry: LogEntry) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all logs
   */
  public clear(): void {
    this.logs = [];
  }

  /**
   * Export logs
   */
  public exportLogs(filter?: LogFilter): {
    logs: LogEntry[];
    aggregation: LogAggregation;
    exportTime: string;
  } {
    const logs = this.getLogs(filter);
    const aggregation = this.getAggregation(filter);

    return {
      logs,
      aggregation,
      exportTime: new Date().toISOString(),
    };
  }

  /**
   * Get log statistics for a time period
   */
  public getTimeSeriesData(
    timeRange: { start: Date; end: Date },
    intervalMinutes: number = 5
  ): Array<{
    timestamp: Date;
    logCount: number;
    errorCount: number;
    warnCount: number;
  }> {
    const logs = this.logs.filter(log => 
      log.timestamp >= timeRange.start && log.timestamp <= timeRange.end
    );

    const intervalMs = intervalMinutes * 60 * 1000;
    const intervals = new Map<number, {
      logCount: number;
      errorCount: number;
      warnCount: number;
    }>();

    logs.forEach(log => {
      const intervalKey = Math.floor(log.timestamp.getTime() / intervalMs) * intervalMs;
      
      if (!intervals.has(intervalKey)) {
        intervals.set(intervalKey, { logCount: 0, errorCount: 0, warnCount: 0 });
      }

      const interval = intervals.get(intervalKey)!;
      interval.logCount++;
      
      if (log.level === 'error') {
        interval.errorCount++;
      } else if (log.level === 'warn') {
        interval.warnCount++;
      }
    });

    return Array.from(intervals.entries())
      .map(([timestamp, data]) => ({
        timestamp: new Date(timestamp),
        ...data,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Apply filter to logs
   */
  private applyFilter(logs: LogEntry[], filter: LogFilter): LogEntry[] {
    return logs.filter(log => {
      // Level filter
      if (filter.levels && !filter.levels.includes(log.level)) {
        return false;
      }

      // Source filter
      if (filter.sources && !filter.sources.includes(log.source)) {
        return false;
      }

      // Correlation ID filter
      if (filter.correlationId && log.correlationId !== filter.correlationId) {
        return false;
      }

      // Time range filter
      if (filter.timeRange) {
        if (log.timestamp < filter.timeRange.start || log.timestamp > filter.timeRange.end) {
          return false;
        }
      }

      // Message pattern filter
      if (filter.messagePattern && !filter.messagePattern.test(log.message)) {
        return false;
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        if (!log.tags || !filter.tags.some(tag => log.tags!.includes(tag))) {
          return false;
        }
      }

      // Metadata filter
      if (filter.metadata) {
        if (!log.metadata) {
          return false;
        }
        
        for (const [key, value] of Object.entries(filter.metadata)) {
          if (log.metadata[key] !== value) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract error pattern from message
   */
  private extractErrorPattern(message: string): string {
    // Remove specific details like file paths, line numbers, IDs, etc.
    return message
      .replace(/\/[^\s]+/g, '/PATH') // File paths
      .replace(/\d+/g, 'NUM') // Numbers
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // UUIDs
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'EMAIL') // Emails
      .replace(/https?:\/\/[^\s]+/g, 'URL') // URLs
      .trim();
  }
}
