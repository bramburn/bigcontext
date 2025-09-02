/**
 * Telemetry Service
 * 
 * Privacy-conscious telemetry system for collecting anonymous usage data.
 * This service ensures that no personally identifiable information or code content
 * is ever transmitted. All data collection respects user privacy preferences.
 */

import * as vscode from 'vscode';
import { ConfigService } from '../configService';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

/**
 * Telemetry event data structure
 */
export interface TelemetryEvent {
  /** Event name (must be from allowed list) */
  eventName: string;
  /** Anonymous metadata (no PII or code content) */
  metadata?: Record<string, string | number | boolean>;
  /** Timestamp when event occurred */
  timestamp: number;
  /** Session ID for grouping related events */
  sessionId: string;
  /** Anonymous machine identifier */
  machineId: string;
  /** Extension version */
  version: string;
}

/**
 * Allowed telemetry events - strict allowlist for privacy
 */
export const ALLOWED_EVENTS = [
  'search_performed',
  'indexing_started',
  'indexing_completed',
  'filter_applied',
  'search_saved',
  'extension_activated',
  'extension_deactivated',
  'settings_opened',
  'setup_completed',
  'error_occurred'
] as const;

export type AllowedEventName = typeof ALLOWED_EVENTS[number];

/**
 * Telemetry configuration
 */
interface TelemetryConfig {
  /** Analytics endpoint URL */
  endpoint: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum events to queue before dropping */
  maxQueueSize: number;
  /** Batch size for sending events */
  batchSize: number;
  /** Interval for sending batched events (ms) */
  batchInterval: number;
}

/**
 * Privacy-conscious telemetry service
 * 
 * This service provides anonymous usage analytics while strictly protecting user privacy.
 * Key privacy features:
 * - Respects user opt-out preferences
 * - Only collects predefined, anonymous events
 * - Never transmits code content or PII
 * - Uses VS Code's machine ID for anonymization
 * - Provides transparent data collection
 */
export class TelemetryService {
  private configService: ConfigService;
  private loggingService?: CentralizedLoggingService;
  private sessionId: string;
  private machineId: string;
  private version: string;
  private eventQueue: TelemetryEvent[] = [];
  private batchTimer?: NodeJS.Timeout;
  private isEnabled: boolean = true;

  private readonly config: TelemetryConfig = {
    endpoint: 'https://analytics.example.com/events', // Replace with actual endpoint
    timeout: 5000,
    maxQueueSize: 1000,
    batchSize: 10,
    batchInterval: 30000 // 30 seconds
  };

  constructor(
    configService: ConfigService,
    context: vscode.ExtensionContext,
    loggingService?: CentralizedLoggingService
  ) {
    this.configService = configService;
    this.loggingService = loggingService;
    
    // Generate session ID for this extension session
    this.sessionId = this.generateSessionId();
    
    // Use VS Code's anonymous machine ID
    this.machineId = vscode.env.machineId;
    
    // Get extension version from package.json
    this.version = context.extension.packageJSON.version || '1.0.0';
    
    // Check initial telemetry preference
    this.updateTelemetryPreference();
    
    // Start batch processing
    this.startBatchProcessing();
    
    this.loggingService?.info('TelemetryService initialized', {
      sessionId: this.sessionId,
      isEnabled: this.isEnabled,
      version: this.version
    }, 'TelemetryService');
  }

  /**
   * Track a telemetry event
   * 
   * @param eventName - Name of the event (must be in allowed list)
   * @param metadata - Anonymous metadata (no PII or code content)
   */
  public trackEvent(eventName: AllowedEventName, metadata?: Record<string, string | number | boolean>): void {
    // Check if telemetry is enabled
    if (!this.isEnabled) {
      return;
    }

    // Validate event name is in allowed list
    if (!ALLOWED_EVENTS.includes(eventName)) {
      this.loggingService?.warn('Attempted to track disallowed event', {
        eventName,
        allowedEvents: ALLOWED_EVENTS
      }, 'TelemetryService');
      return;
    }

    // Sanitize metadata to ensure no PII
    const sanitizedMetadata = this.sanitizeMetadata(metadata);

    const event: TelemetryEvent = {
      eventName,
      metadata: sanitizedMetadata,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      machineId: this.machineId,
      version: this.version
    };

    // Add to queue
    this.queueEvent(event);

    this.loggingService?.debug('Telemetry event tracked', {
      eventName,
      hasMetadata: !!metadata,
      queueSize: this.eventQueue.length
    }, 'TelemetryService');
  }

  /**
   * Update telemetry preference from configuration
   */
  public updateTelemetryPreference(): void {
    // Check configuration for telemetry setting
    this.isEnabled = this.configService.getTelemetryEnabled();
    
    this.loggingService?.info('Telemetry preference updated', {
      isEnabled: this.isEnabled
    }, 'TelemetryService');

    // If disabled, clear the queue
    if (!this.isEnabled) {
      this.eventQueue = [];
    }
  }

  /**
   * Dispose of the service and clean up resources
   */
  public dispose(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    // Send any remaining events if enabled
    if (this.isEnabled && this.eventQueue.length > 0) {
      this.sendBatch();
    }
    
    this.loggingService?.info('TelemetryService disposed', {
      remainingEvents: this.eventQueue.length
    }, 'TelemetryService');
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize metadata to remove any potential PII
   */
  private sanitizeMetadata(metadata?: Record<string, string | number | boolean>): Record<string, string | number | boolean> | undefined {
    if (!metadata) {
      return undefined;
    }

    const sanitized: Record<string, string | number | boolean> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Only allow specific types and sanitize strings
      if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (typeof value === 'string') {
        // Remove any potential file paths, URLs, or sensitive data
        const sanitizedValue = this.sanitizeString(value);
        if (sanitizedValue) {
          sanitized[key] = sanitizedValue;
        }
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  /**
   * Sanitize string values to remove potential PII
   */
  private sanitizeString(value: string): string | null {
    // Remove file paths, URLs, email addresses, etc.
    const sanitized = value
      .replace(/[a-zA-Z]:[\\\/].*/g, '[PATH]') // Windows paths
      .replace(/\/[^\/\s]*/g, '[PATH]') // Unix paths
      .replace(/https?:\/\/[^\s]*/g, '[URL]') // URLs
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') // Emails
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]'); // IP addresses

    // If the string is too long or contains suspicious patterns, reject it
    if (sanitized.length > 100 || sanitized.includes('\\') || sanitized.includes('/')) {
      return null;
    }

    return sanitized;
  }

  /**
   * Add event to queue
   */
  private queueEvent(event: TelemetryEvent): void {
    // Check queue size limit
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      // Remove oldest event
      this.eventQueue.shift();
      this.loggingService?.warn('Telemetry queue full, dropping oldest event', {
        queueSize: this.eventQueue.length
      }, 'TelemetryService');
    }

    this.eventQueue.push(event);
  }

  /**
   * Start batch processing timer
   */
  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      if (this.isEnabled && this.eventQueue.length > 0) {
        this.sendBatch();
      }
    }, this.config.batchInterval);
  }

  /**
   * Send a batch of events
   */
  private async sendBatch(): Promise<void> {
    if (!this.isEnabled || this.eventQueue.length === 0) {
      return;
    }

    // Take a batch of events
    const batch = this.eventQueue.splice(0, this.config.batchSize);

    try {
      await this.sendEvents(batch);
      this.loggingService?.debug('Telemetry batch sent successfully', {
        eventCount: batch.length
      }, 'TelemetryService');
    } catch (error) {
      this.loggingService?.error('Failed to send telemetry batch', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventCount: batch.length
      }, 'TelemetryService');
      
      // Re-queue events on failure (up to a limit)
      if (this.eventQueue.length < this.config.maxQueueSize - batch.length) {
        this.eventQueue.unshift(...batch);
      }
    }
  }

  /**
   * Send events to analytics endpoint
   */
  private async sendEvents(events: TelemetryEvent[]): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `CodeContextEngine/${this.version}`
        },
        body: JSON.stringify({
          events,
          timestamp: Date.now()
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
