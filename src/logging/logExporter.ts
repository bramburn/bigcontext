/**
 * Log Exporter
 * 
 * Exports logs in various formats for analysis, debugging, and support.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { LogEntry, LogFilter, LogAggregator } from './logAggregator';
import { PerformanceLogger } from './performanceLogger';
import { CorrelationService } from './correlationService';

export interface ExportOptions {
  format: 'json' | 'csv' | 'txt' | 'html';
  includeMetadata: boolean;
  includePerformanceData: boolean;
  includeCorrelationData: boolean;
  filter?: LogFilter;
  maxEntries?: number;
  anonymize?: boolean;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  entriesExported: number;
  fileSize: number;
}

export class LogExporter {
  private logAggregator: LogAggregator;
  private performanceLogger?: PerformanceLogger;
  private correlationService: CorrelationService;

  constructor(
    logAggregator: LogAggregator,
    performanceLogger?: PerformanceLogger
  ) {
    this.logAggregator = logAggregator;
    this.performanceLogger = performanceLogger;
    this.correlationService = CorrelationService.getInstance();
  }

  /**
   * Export logs to file
   */
  public async exportToFile(
    filePath: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const logs = this.logAggregator.getLogs(options.filter, options.maxEntries);
      
      if (options.anonymize) {
        logs.forEach(log => this.anonymizeLog(log));
      }

      let content: string;
      
      switch (options.format) {
        case 'json':
          content = await this.exportAsJson(logs, options);
          break;
        case 'csv':
          content = await this.exportAsCsv(logs, options);
          break;
        case 'txt':
          content = await this.exportAsText(logs, options);
          break;
        case 'html':
          content = await this.exportAsHtml(logs, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, content, 'utf8');
      
      const stats = fs.statSync(filePath);
      
      return {
        success: true,
        filePath,
        entriesExported: logs.length,
        fileSize: stats.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        entriesExported: 0,
        fileSize: 0,
      };
    }
  }

  /**
   * Export logs with user file picker
   */
  public async exportWithPicker(options: ExportOptions): Promise<ExportResult> {
    const defaultFileName = `extension-logs-${new Date().toISOString().split('T')[0]}.${options.format}`;

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultFileName),
      filters: this.getFileFilters(),
    });

    if (!uri) {
      return {
        success: false,
        error: 'Export cancelled by user',
        entriesExported: 0,
        fileSize: 0,
      };
    }

    return this.exportToFile(uri.fsPath, options);
  }

  /**
   * Export logs and return as string
   */
  public async exportLogs(options: {
    format?: 'json' | 'csv' | 'txt';
    includeMetadata?: boolean;
    dateRange?: { start: Date; end: Date };
    level?: string;
    source?: string;
  } = {}): Promise<string> {
    const filter: LogFilter = {};

    if (options.dateRange) {
      filter.timeRange = {
        start: options.dateRange.start,
        end: options.dateRange.end,
      };
    }

    if (options.level) {
      filter.levels = [options.level as 'debug' | 'info' | 'warn' | 'error'];
    }

    if (options.source) {
      filter.sources = [options.source];
    }

    const logs = this.logAggregator.getLogs(filter);

    const exportOptions: ExportOptions = {
      format: options.format || 'json',
      includeMetadata: options.includeMetadata ?? true,
      includePerformanceData: false,
      includeCorrelationData: false,
      filter,
    };

    switch (exportOptions.format) {
      case 'json':
        return this.exportAsJson(logs, exportOptions);
      case 'csv':
        return this.exportAsCsv(logs, exportOptions);
      case 'txt':
        return this.exportAsText(logs, exportOptions);
      default:
        return this.exportAsJson(logs, exportOptions);
    }
  }

  /**
   * Create diagnostic package
   */
  public async createDiagnosticPackage(outputDir: string): Promise<ExportResult> {
    try {
      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const packageDir = path.join(outputDir, `diagnostic-package-${timestamp}`);
      fs.mkdirSync(packageDir);

      let totalSize = 0;
      let totalEntries = 0;

      // Export logs in multiple formats
      const logFormats: Array<{ format: ExportOptions['format']; filename: string }> = [
        { format: 'json', filename: 'logs.json' },
        { format: 'csv', filename: 'logs.csv' },
        { format: 'txt', filename: 'logs.txt' },
        { format: 'html', filename: 'logs.html' },
      ];

      for (const { format, filename } of logFormats) {
        const result = await this.exportToFile(
          path.join(packageDir, filename),
          {
            format,
            includeMetadata: true,
            includePerformanceData: true,
            includeCorrelationData: true,
          }
        );
        
        if (result.success) {
          totalSize += result.fileSize;
          totalEntries = Math.max(totalEntries, result.entriesExported);
        }
      }

      // Export performance data
      if (this.performanceLogger) {
        const perfData = this.performanceLogger.exportData();
        fs.writeFileSync(
          path.join(packageDir, 'performance.json'),
          JSON.stringify(perfData, null, 2),
          'utf8'
        );
      }

      // Export correlation data
      const correlationData = this.correlationService.exportData();
      fs.writeFileSync(
        path.join(packageDir, 'correlation.json'),
        JSON.stringify(correlationData, null, 2),
        'utf8'
      );

      // Create summary file
      const summary = {
        packageCreated: new Date().toISOString(),
        totalLogEntries: totalEntries,
        logAggregation: this.logAggregator.getAggregation(),
        performanceSummary: this.performanceLogger?.getOverallSummary(),
        correlationStats: this.correlationService.getStatistics(),
        systemInfo: this.getSystemInfo(),
      };

      fs.writeFileSync(
        path.join(packageDir, 'summary.json'),
        JSON.stringify(summary, null, 2),
        'utf8'
      );

      // Calculate total package size
      const packageStats = this.getDirectorySize(packageDir);

      return {
        success: true,
        filePath: packageDir,
        entriesExported: totalEntries,
        fileSize: packageStats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        entriesExported: 0,
        fileSize: 0,
      };
    }
  }

  /**
   * Export as JSON
   */
  private async exportAsJson(logs: LogEntry[], options: ExportOptions): Promise<string> {
    const exportData: any = {
      exportTime: new Date().toISOString(),
      totalEntries: logs.length,
      logs,
    };

    if (options.includePerformanceData && this.performanceLogger) {
      exportData.performance = this.performanceLogger.exportData();
    }

    if (options.includeCorrelationData) {
      exportData.correlation = this.correlationService.exportData();
    }

    if (options.includeMetadata) {
      exportData.aggregation = this.logAggregator.getAggregation(options.filter);
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export as CSV
   */
  private async exportAsCsv(logs: LogEntry[], options: ExportOptions): Promise<string> {
    const headers = ['timestamp', 'level', 'source', 'message', 'correlationId'];
    
    if (options.includeMetadata) {
      headers.push('metadata');
    }

    const csvLines = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.timestamp.toISOString(),
        log.level,
        this.escapeCsvValue(log.source),
        this.escapeCsvValue(log.message),
        log.correlationId || '',
      ];

      if (options.includeMetadata) {
        row.push(this.escapeCsvValue(JSON.stringify(log.metadata || {})));
      }

      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  }

  /**
   * Export as plain text
   */
  private async exportAsText(logs: LogEntry[], options: ExportOptions): Promise<string> {
    const lines = [`Extension Logs Export - ${new Date().toISOString()}`, ''];

    logs.forEach(log => {
      lines.push(`[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} [${log.source}] ${log.message}`);
      
      if (options.includeMetadata && log.metadata) {
        lines.push(`  Metadata: ${JSON.stringify(log.metadata)}`);
      }
      
      if (log.correlationId) {
        lines.push(`  Correlation ID: ${log.correlationId}`);
      }
      
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Export as HTML
   */
  private async exportAsHtml(logs: LogEntry[], options: ExportOptions): Promise<string> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Extension Logs</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        .log-entry { margin-bottom: 10px; padding: 5px; border-left: 3px solid #ccc; }
        .debug { border-left-color: #999; }
        .info { border-left-color: #007acc; }
        .warn { border-left-color: #ff8c00; }
        .error { border-left-color: #e74c3c; }
        .timestamp { color: #666; }
        .level { font-weight: bold; }
        .source { color: #007acc; }
        .metadata { color: #666; font-size: 0.9em; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>Extension Logs Export</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    <p>Total Entries: ${logs.length}</p>
    
    <div class="logs">
        ${logs.map(log => `
            <div class="log-entry ${log.level}">
                <span class="timestamp">${log.timestamp.toISOString()}</span>
                <span class="level">[${log.level.toUpperCase()}]</span>
                <span class="source">[${log.source}]</span>
                <span class="message">${this.escapeHtml(log.message)}</span>
                ${log.correlationId ? `<br><small>Correlation ID: ${log.correlationId}</small>` : ''}
                ${options.includeMetadata && log.metadata ? 
                  `<div class="metadata">Metadata: ${this.escapeHtml(JSON.stringify(log.metadata))}</div>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Anonymize sensitive data in log entry
   */
  private anonymizeLog(log: LogEntry): void {
    // Anonymize message
    log.message = log.message
      .replace(/\/[^\s]+/g, '/PATH')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'EMAIL')
      .replace(/https?:\/\/[^\s]+/g, 'URL')
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, 'IP_ADDRESS');

    // Anonymize metadata
    if (log.metadata) {
      log.metadata = this.anonymizeObject(log.metadata);
    }
  }

  /**
   * Anonymize object recursively
   */
  private anonymizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const anonymized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        anonymized[key] = value
          .replace(/\/[^\s]+/g, '/PATH')
          .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'EMAIL')
          .replace(/https?:\/\/[^\s]+/g, 'URL');
      } else if (typeof value === 'object') {
        anonymized[key] = this.anonymizeObject(value);
      } else {
        anonymized[key] = value;
      }
    }
    return anonymized;
  }

  /**
   * Escape CSV value
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Get file filters for save dialog
   */
  private getFileFilters(): Record<string, string[]> {
    return {
      'JSON Files': ['json'],
      'CSV Files': ['csv'],
      'Text Files': ['txt'],
      'HTML Files': ['html'],
      'All Files': ['*'],
    };
  }

  /**
   * Get directory size recursively
   */
  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  /**
   * Get system information
   */
  private getSystemInfo(): any {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      vscodeVersion: vscode.version,
      extensionVersion: vscode.extensions.getExtension('your-extension-id')?.packageJSON?.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }
}
