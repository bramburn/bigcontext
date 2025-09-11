/**
 * Centralized Logging Service
 *
 * This service provides a unified logging interface for the entire extension.
 * It supports different log levels, structured logging, file output, and
 * integration with VS Code's output channels.
 *
 * Features:
 * - Multiple log levels (error, warn, info, debug, trace)
 * - Structured logging with metadata
 * - File-based logging with rotation
 * - VS Code output channel integration
 * - Performance metrics logging
 * - Configurable log formatting
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as winston from "winston";
import Transport from "winston-transport";
import { ConfigService } from "../configService";
import { LogAggregator, LogEntry as AggregatorLogEntry } from './logAggregator';
import { PerformanceLogger } from './performanceLogger';
import { LogExporter } from './logExporter';
import { CorrelationService } from './correlationService';

/**
 * Custom Winston transport for VSCode Output Channel
 */
class VSCodeOutputTransport extends Transport {
  private channel: vscode.OutputChannel | undefined;

  constructor(options: any) {
    super(options);
    this.channel = options.channel;
  }

  log(info: any, callback: (err?: any) => void): void {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const timestamp = new Date().toISOString();
    const level = info.level ? info.level.toUpperCase() : 'UNKNOWN';
    let formattedMsg = `[${timestamp}] [${level}] ${info.message || ''}`;

    // Add source if present
    if (info.source) {
      formattedMsg += ` [${info.source}]`;
    }

    // Add correlationId if present
    if (info.correlationId) {
      formattedMsg += ` [${info.correlationId}]`;
    }

    // Handle structured metadata readably
    const meta = { ...info };
    // Remove standard fields
    delete meta.level;
    delete meta.message;
    delete meta.timestamp;
    delete meta.source;
    delete meta.correlationId;

    if (Object.keys(meta).length > 0) {
      try {
        const metaStr = JSON.stringify(meta, null, 2);
        formattedMsg += `\n${metaStr}`;
      } catch (e) {
        formattedMsg += `\n[meta: ${JSON.stringify(meta)}]`;
      }
    }

    if (this.channel) {
      this.channel.appendLine(formattedMsg);
    } else {
      // Fallback to console if channel undefined
      console.log(formattedMsg);
    }

    callback();
  }
}

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

/**
 * Interface for log entries
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  source?: string;
  correlationId?: string;
}

/**
 * Configuration for the logging service
 */
export interface LoggingConfig {
  /** Current log level */
  level: LogLevel;
  /** Whether to enable file logging */
  enableFileLogging: boolean;
  /** Directory for log files */
  logDirectory: string;
  /** Maximum log file size in bytes */
  maxFileSize: number;
  /** Number of log files to keep */
  maxFiles: number;
  /** Whether to enable console logging */
  enableConsoleLogging: boolean;
  /** Whether to enable VS Code output channel */
  enableOutputChannel: boolean;
  /** Log format template */
  logFormat: string;
}

/**
 * Centralized logging service for the extension
 */
export class CentralizedLoggingService implements vscode.Disposable {
  private config: LoggingConfig;
  private configService: ConfigService;
  private outputChannel: vscode.OutputChannel;
  private logDirectory: string;
  private currentLogFile: string;
  private logFileStream?: fs.WriteStream;
  private logger?: winston.Logger;

  // Enhanced logging components
  private logAggregator: LogAggregator;
  private performanceLogger: PerformanceLogger;
  private logExporter: LogExporter;
  private correlationService: CorrelationService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.config = this.loadConfig();
    this.outputChannel = vscode.window.createOutputChannel(
      "BigContext Logs",
    );
    this.logDirectory = this.config.logDirectory;
    this.currentLogFile = this.generateLogFileName();

    // Initialize enhanced logging components
    this.correlationService = CorrelationService.getInstance();
    this.logAggregator = new LogAggregator();
    this.performanceLogger = new PerformanceLogger(this);
    this.logExporter = new LogExporter(this.logAggregator, this.performanceLogger);

    this.initializeLogging();

    // Listen for configuration changes to update log level dynamically
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("code-context-engine.logging.level")) {
        this.updateLogLevel();
      }
    });
  }

  /**
   * Load logging configuration
   */
  private loadConfig(): LoggingConfig {
    const baseConfig = this.configService.getFullConfig();

    return {
      level: this.parseLogLevel(baseConfig.logging?.level) ?? LogLevel.INFO,
      enableFileLogging: baseConfig.logging?.enableFileLogging ?? true,
      logDirectory:
        baseConfig.logging?.logDirectory ?? this.getDefaultLogDirectory(),
      maxFileSize: baseConfig.logging?.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      maxFiles: baseConfig.logging?.maxFiles ?? 5,
      enableConsoleLogging: baseConfig.logging?.enableConsoleLogging ?? true,
      enableOutputChannel: baseConfig.logging?.enableOutputChannel ?? true,
      logFormat:
        baseConfig.logging?.logFormat ??
        "[{timestamp}] [{level}] {source}: {message}",
    };
  }

  /**
   * Parse log level from string
   */
  private parseLogLevel(level?: string): LogLevel | undefined {
    if (!level) return undefined;

    switch (level.toLowerCase()) {
      case "error":
        return LogLevel.ERROR;
      case "warn":
        return LogLevel.WARN;
      case "info":
        return LogLevel.INFO;
      case "debug":
        return LogLevel.DEBUG;
      case "trace":
        return LogLevel.TRACE;
      default:
        return undefined;
    }
  }

  /**
   * Update log level from current configuration
   */
  private updateLogLevel(): void {
    this.configService.refresh();
    const newConfig = this.loadConfig();
    const oldLevel = this.config.level;
    this.config.level = newConfig.level;

    if (oldLevel !== this.config.level) {
      this.info(
        `Log level changed from ${LogLevel[oldLevel]} to ${LogLevel[this.config.level]}`,
      );
    }
  }

  /**
   * Get default log directory
   */
  private getDefaultLogDirectory(): string {
    return './logs';
  }

  /**
   * Initialize logging system
   */
  private initializeLogging(): void {
    try {
      if (this.config.enableFileLogging) {
        this.ensureLogDirectory();
      }

      const transportsArray: winston.transport[] = [];

      if (this.config.enableConsoleLogging) {
        transportsArray.push(
          new winston.transports.Console({
            format: winston.format.simple()
          })
        );
      }

      if (this.config.enableFileLogging) {
        transportsArray.push(
          new winston.transports.File({
            filename: path.join(this.logDirectory, 'extension.log'),
            format: winston.format.json()
          })
        );
      }

      if (this.config.enableOutputChannel) {
        transportsArray.push(
          new VSCodeOutputTransport({ channel: this.outputChannel })
        );
      }

      this.logger = winston.createLogger({
        level: LogLevel[this.config.level].toLowerCase(),
        transports: transportsArray
      });

      this.info("CentralizedLoggingService initialized", {
        config: {
          level: LogLevel[this.config.level],
          fileLogging: this.config.enableFileLogging,
          consoleLogging: this.config.enableConsoleLogging,
          outputChannel: this.config.enableOutputChannel,
        },
      });
    } catch (error) {
      console.error("Failed to initialize logging service:", error);
    }
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  /**
   * Initialize log file stream
   */
  private initializeLogFile(): void {
    const logFilePath = path.join(this.logDirectory, this.currentLogFile);
    this.logFileStream = fs.createWriteStream(logFilePath, { flags: "a" });

    this.logFileStream.on("error", (error) => {
      console.error("Log file stream error:", error);
    });
  }

  /**
   * Generate log file name with timestamp
   */
  private generateLogFileName(): string {
    const now = new Date();
    const timestamp = now.toISOString().split("T")[0]; // YYYY-MM-DD
    return `code-context-engine-${timestamp}.log`;
  }

  /**
   * Clean up old log files
   */
  private cleanupOldLogFiles(): void {
    try {
      const files = fs
        .readdirSync(this.logDirectory)
        .filter(
          (file) =>
            file.startsWith("code-context-engine-") && file.endsWith(".log"),
        )
        .map((file) => ({
          name: file,
          path: path.join(this.logDirectory, file),
          stats: fs.statSync(path.join(this.logDirectory, file)),
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Keep only the most recent files
      const filesToDelete = files.slice(this.config.maxFiles);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error("Error cleaning up log files:", error);
    }
  }

  /**
   * Check if log file needs rotation
   */
  private checkLogRotation(): void {
    if (!this.config.enableFileLogging || !this.logFileStream) return;

    try {
      const logFilePath = path.join(this.logDirectory, this.currentLogFile);
      const stats = fs.statSync(logFilePath);

      if (stats.size >= this.config.maxFileSize) {
        this.rotateLogFile();
      }
    } catch (error) {
      console.error("Error checking log rotation:", error);
    }
  }

  /**
   * Rotate log file
   */
  private rotateLogFile(): void {
    try {
      if (this.logFileStream) {
        this.logFileStream.end();
      }

      this.currentLogFile = this.generateLogFileName();
      this.initializeLogFile();
      this.cleanupOldLogFiles();
    } catch (error) {
      console.error("Error rotating log file:", error);
    }
  }

  /**
   * Log an entry
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    source?: string,
  ): void {
    // Check if this log level should be processed
    if (level > this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      metadata,
      source: source || "Unknown",
      correlationId: this.generateCorrelationId(),
    };

    // Add to log aggregator
    const aggregatorEntry: AggregatorLogEntry = {
      timestamp: entry.timestamp,
      level: LogLevel[level].toLowerCase() as 'debug' | 'info' | 'warn' | 'error',
      message,
      source: entry.source || 'Unknown',
      correlationId: entry.correlationId,
      metadata,
    };
    this.logAggregator.addLog(aggregatorEntry);

    // Since Winston handles formatting now, just pass to logger
    // Remove manual output channel append as transport handles it
    if (this.logger) {
      const logMeta = {
        source,
        correlationId: entry.correlationId,
        ...metadata
      };
      this.logger.log(LogLevel[level].toLowerCase(), message, logMeta);
    }
  }

  /**
   * Format log entry according to configuration
   */
  private formatLogEntry(entry: LogEntry): string {
    let formatted = this.config.logFormat
      .replace("{timestamp}", entry.timestamp.toISOString())
      .replace("{level}", LogLevel[entry.level] ? LogLevel[entry.level] : entry.level.toString())
      .replace("{source}", entry.source || "Unknown")
      .replace("{message}", entry.message);

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formatted += ` | ${JSON.stringify(entry.metadata)}`;
    }

    if (entry.correlationId) {
      formatted += ` [${entry.correlationId}]`;
    }

    return formatted;
  }

  /**
   * Log to file
   */
  private logToFile(message: string): void {
    if (this.logFileStream) {
      this.logFileStream.write(message + "\n");
      this.checkLogRotation();
    }
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Public logging methods
  public error(
    message: string,
    metadata?: Record<string, any>,
    source?: string,
  ): void {
    this.log(LogLevel.ERROR, message, metadata, source);
  }

  public warn(
    message: string,
    metadata?: Record<string, any>,
    source?: string,
  ): void {
    this.log(LogLevel.WARN, message, metadata, source);
  }

  public info(
    message: string,
    metadata?: Record<string, any>,
    source?: string,
  ): void {
    this.log(LogLevel.INFO, message, metadata, source);
  }

  public debug(
    message: string,
    metadata?: Record<string, any>,
    source?: string,
  ): void {
    this.log(LogLevel.DEBUG, message, metadata, source);
  }

  public trace(
    message: string,
    metadata?: Record<string, any>,
    source?: string,
  ): void {
    this.log(LogLevel.TRACE, message, metadata, source);
  }

  /**
   * Log performance metrics
   */
  public logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    this.info(
      `Performance: ${operation} completed in ${duration}ms`,
      {
        operation,
        duration,
        ...metadata,
      },
      "Performance",
    );
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.enableFileLogging !== undefined) {
      if (newConfig.enableFileLogging && !this.logFileStream) {
        this.initializeLogFile();
      } else if (!newConfig.enableFileLogging && this.logFileStream) {
        this.logFileStream.end();
        this.logFileStream = undefined;
      }
    }

    // Reinitialize logger if transports need to change
    if (newConfig.enableConsoleLogging !== undefined || 
        newConfig.enableFileLogging !== undefined || 
        newConfig.enableOutputChannel !== undefined) {
      this.initializeLogging();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Show output channel
   */
  public showOutputChannel(): void {
    this.outputChannel.show();
  }

  /**
   * Get log aggregator instance
   */
  public getLogAggregator(): LogAggregator {
    return this.logAggregator;
  }

  /**
   * Get performance logger instance
   */
  public getPerformanceLogger(): PerformanceLogger {
    return this.performanceLogger;
  }

  /**
   * Get log exporter instance
   */
  public getLogExporter(): LogExporter {
    return this.logExporter;
  }

  /**
   * Get correlation service instance
   */
  public getCorrelationService(): CorrelationService {
    return this.correlationService;
  }

  /**
   * Log with correlation tracking
   */
  public logWithCorrelation(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    metadata: Record<string, any> = {},
    source: string = 'Extension',
    correlationId?: string
  ): void {
    // Add to aggregator
    this.logAggregator.addLog({
      timestamp: new Date(),
      level,
      message,
      source,
      correlationId,
      metadata,
    });

    // Log normally - convert string level to LogLevel enum
    const logLevel = level === 'debug' ? LogLevel.DEBUG :
                    level === 'info' ? LogLevel.INFO :
                    level === 'warn' ? LogLevel.WARN :
                    level === 'error' ? LogLevel.ERROR : LogLevel.INFO;
    this.log(logLevel, message, metadata, source);
  }

  /**
   * Start performance tracking for an operation
   */
  public startPerformanceTracking(
    operationName: string,
    metadata?: Record<string, any>
  ): string {
    return this.correlationService.startOperation(operationName, undefined, metadata);
  }

  /**
   * End performance tracking for an operation
   */
  public endPerformanceTracking(
    correlationId: string,
    success: boolean = true,
    error?: string,
    additionalMetadata?: Record<string, any>
  ): void {
    const metrics = this.correlationService.endOperation(correlationId, success, error, additionalMetadata);

    if (metrics) {
      this.performanceLogger.logPerformance(
        metrics.operationName,
        metrics.duration,
        correlationId,
        metrics.metadata
      );
    }
  }

  /**
   * Export logs with options
   */
  public async exportLogs(options: {
    format?: 'json' | 'csv' | 'txt' | 'html';
    includePerformanceData?: boolean;
    maxEntries?: number;
  } = {}): Promise<void> {
    const exportOptions = {
      format: options.format || 'json' as const,
      includeMetadata: true,
      includePerformanceData: options.includePerformanceData || true,
      includeCorrelationData: true,
      maxEntries: options.maxEntries,
    };

    const result = await this.logExporter.exportWithPicker(exportOptions);

    if (result.success) {
      vscode.window.showInformationMessage(
        `Logs exported successfully to ${result.filePath}. ${result.entriesExported} entries exported.`
      );
    } else {
      vscode.window.showErrorMessage(`Failed to export logs: ${result.error}`);
    }
  }

  /**
   * Create diagnostic package
   */
  public async createDiagnosticPackage(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const defaultPath = workspaceFolder ? workspaceFolder.uri.fsPath : require('os').homedir();

    const uri = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: vscode.Uri.file(defaultPath),
      openLabel: 'Select Output Directory',
    });

    if (!uri || uri.length === 0) {
      return;
    }

    const result = await this.logExporter.createDiagnosticPackage(uri[0].fsPath);

    if (result.success) {
      vscode.window.showInformationMessage(
        `Diagnostic package created at ${result.filePath}`,
        'Open Folder'
      ).then(selection => {
        if (selection === 'Open Folder') {
          vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(result.filePath!));
        }
      });
    } else {
      vscode.window.showErrorMessage(`Failed to create diagnostic package: ${result.error}`);
    }
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.logFileStream) {
      this.logFileStream.end();
    }
    this.outputChannel.dispose();
    this.logAggregator.clear();
    this.performanceLogger.clear();
  }
}
