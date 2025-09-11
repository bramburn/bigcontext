/**
 * Shared Communication Types
 *
 * This module defines type-safe interfaces for communication between the
 * VS Code extension and the webview. These types ensure consistency and
 * prevent runtime errors due to message format mismatches.
 *
 * Features:
 * - Type-safe message definitions
 * - Request/response patterns
 * - Event-based communication
 * - Error handling types
 * - State synchronization types
 */

/**
 * Base message interface for all communication
 */
export interface BaseMessage {
  /** Unique identifier for the message */
  id: string;
  /** Timestamp when the message was created */
  timestamp: number;
  /** Type of the message */
  type: string;
}

/**
 * Request message interface
 */
export interface RequestMessage<T = any> extends BaseMessage {
  /** Request payload */
  payload: T;
  /** Whether this request expects a response */
  expectsResponse: boolean;
}

/**
 * Response message interface
 */
export interface ResponseMessage<T = any> extends BaseMessage {
  /** ID of the original request */
  requestId: string;
  /** Whether the request was successful */
  success: boolean;
  /** Response payload (if successful) */
  payload?: T;
  /** Error information (if failed) */
  error?: ErrorInfo;
}

/**
 * Event message interface
 */
export interface EventMessage<T = any> extends BaseMessage {
  /** Event name */
  event: string;
  /** Event payload */
  payload: T;
}

/**
 * Error information interface
 */
export interface ErrorInfo {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, any>;
  /** Stack trace (for debugging) */
  stack?: string;
}

/**
 * Message types for extension to webview communication
 */
export enum ExtensionToWebviewMessageType {
  // Configuration messages
  CONFIG_UPDATE = 'config_update',
  CONFIG_VALIDATION_RESULT = 'config_validation_result',

  // Search messages
  SEARCH_RESULTS = 'search_results',
  SEARCH_ERROR = 'search_error',
  SEARCH_PROGRESS = 'search_progress',

  // Indexing messages
  INDEXING_STATUS = 'indexing_status',
  INDEXING_PROGRESS = 'indexing_progress',
  INDEXING_COMPLETE = 'indexing_complete',
  INDEXING_ERROR = 'indexing_error',

  // File scanning progress messages
  SCAN_START = 'scanStart',
  SCAN_PROGRESS = 'scanProgress',
  SCAN_COMPLETE = 'scanComplete',

  // State messages
  STATE_UPDATE = 'state_update',
  THEME_UPDATE = 'theme_update',

  // Notification messages
  NOTIFICATION = 'notification',

  // Error messages
  ERROR = 'error',
}

/**
 * Message types for webview to extension communication
 */
export enum WebviewToExtensionMessageType {
  // Configuration requests
  GET_CONFIG = 'get_config',
  UPDATE_CONFIG = 'update_config',
  VALIDATE_CONFIG = 'validate_config',

  // Search requests
  SEARCH = 'search',
  CANCEL_SEARCH = 'cancel_search',
  GET_SEARCH_HISTORY = 'get_search_history',

  // Indexing requests
  START_INDEXING = 'start_indexing',
  STOP_INDEXING = 'stop_indexing',
  GET_INDEXING_STATUS = 'get_indexing_status',

  // File scanning requests
  START_FILE_SCAN = 'start_file_scan',

  // File operations
  OPEN_FILE = 'open_file',
  SHOW_FILE_IN_EXPLORER = 'show_file_in_explorer',
  REQUEST_OPEN_FOLDER = 'request_open_folder',

  // State requests
  GET_STATE = 'get_state',

  // Ready signal
  WEBVIEW_READY = 'webview_ready',
}

/**
 * Configuration update payload
 */
export interface ConfigUpdatePayload {
  /** Configuration section that was updated */
  section: string;
  /** New configuration values */
  config: Record<string, any>;
  /** Whether the update was successful */
  success: boolean;
  /** Validation errors (if any) */
  errors?: string[];
}

/**
 * Search request payload
 */
export interface SearchRequestPayload {
  /** Search query */
  query: string;
  /** Search filters */
  filters?: {
    fileTypes?: string[];
    languages?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    maxResults?: number;
    minSimilarity?: number;
  };
  /** Search options */
  options?: {
    useQueryExpansion?: boolean;
    useLLMReRanking?: boolean;
    includeMetadata?: boolean;
  };
}

/**
 * Search result item
 */
export interface SearchResultItem {
  /** Unique identifier */
  id: string;
  /** File path */
  filePath: string;
  /** Line number */
  lineNumber: number;
  /** Content preview */
  preview: string;
  /** Similarity score */
  similarity: number;
  /** Chunk type */
  chunkType: string;
  /** Programming language */
  language: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** LLM re-ranking information */
  llmScore?: number;
  finalScore?: number;
  explanation?: string;
  wasReRanked?: boolean;
}

/**
 * Search results payload
 */
export interface SearchResultsPayload {
  /** Search query */
  query: string;
  /** Search results */
  results: SearchResultItem[];
  /** Total number of results found */
  totalResults: number;
  /** Time taken for the search (in milliseconds) */
  searchTime: number;
  /** Whether query expansion was used */
  usedQueryExpansion?: boolean;
  /** Expanded terms (if query expansion was used) */
  expandedTerms?: string[];
  /** Whether LLM re-ranking was used */
  usedLLMReRanking?: boolean;
  /** Number of results that were re-ranked */
  reRankedCount?: number;
}

/**
 * Indexing status payload
 */
export interface IndexingStatusPayload {
  /** Whether indexing is currently running */
  isRunning: boolean;
  /** Current progress (0-100) */
  progress: number;
  /** Current status message */
  status: string;
  /** Number of files processed */
  filesProcessed: number;
  /** Total number of files to process */
  totalFiles: number;
  /** Number of chunks created */
  chunksCreated: number;
  /** Indexing start time */
  startTime?: number;
  /** Estimated time remaining (in milliseconds) */
  estimatedTimeRemaining?: number;
  /** Any errors encountered */
  errors?: string[];
}

/**
 * File scanning progress payloads
 */
export interface ScanStartPayload {
  /** Human-readable message indicating the start of the scan */
  message: string;
}

export interface ScanProgressPayload {
  /** Number of files processed so far */
  scannedFiles: number;
  /** Number of files identified as ignored so far */
  ignoredFiles: number;
  /** Human-readable progress message */
  message: string;
}

export interface ScanCompletePayload {
  /** Total number of files found in the repository */
  totalFiles: number;
  /** Total number of files identified as ignored */
  ignoredFiles: number;
  /** Final human-readable message */
  message: string;
}

/**
 * File operation payload
 */
export interface FileOperationPayload {
  /** File path */
  filePath: string;
  /** Line number (optional) */
  lineNumber?: number;
  /** Column number (optional) */
  columnNumber?: number;
  /** Whether to reveal the file in explorer */
  reveal?: boolean;
}

/**
 * Extension state payload
 */
export interface ExtensionStatePayload {
  /** Current configuration */
  config: Record<string, any>;
  /** Indexing status */
  indexingStatus: IndexingStatusPayload;
  /** Search history */
  searchHistory: Array<{
    query: string;
    timestamp: number;
    resultCount: number;
  }>;
  /** Extension version */
  version: string;
  /** Current theme */
  theme: 'light' | 'dark' | 'high-contrast';
  /** Available providers */
  availableProviders: {
    embedding: string[];
    llm: string[];
  };
}

/**
 * Notification payload
 */
export interface NotificationPayload {
  /** Notification type */
  type: 'info' | 'warning' | 'error' | 'success';
  /** Notification message */
  message: string;
  /** Optional title */
  title?: string;
  /** Actions available for the notification */
  actions?: Array<{
    title: string;
    action: string;
  }>;
  /** Whether the notification should auto-dismiss */
  autoDismiss?: boolean;
  /** Auto-dismiss timeout (in milliseconds) */
  timeout?: number;
}

/**
 * Progress update payload
 */
export interface ProgressUpdatePayload {
  /** Operation identifier */
  operationId: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current status message */
  message: string;
  /** Whether the operation can be cancelled */
  cancellable: boolean;
  /** Whether the operation is complete */
  complete: boolean;
  /** Any errors encountered */
  error?: ErrorInfo;
}

/**
 * Type guards for message validation
 */
export class MessageTypeGuards {
  static isRequestMessage(message: any): message is RequestMessage {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.timestamp === 'number' &&
      typeof message.type === 'string' &&
      message.payload !== undefined &&
      typeof message.expectsResponse === 'boolean'
    );
  }

  static isResponseMessage(message: any): message is ResponseMessage {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.timestamp === 'number' &&
      typeof message.type === 'string' &&
      typeof message.requestId === 'string' &&
      typeof message.success === 'boolean'
    );
  }

  static isEventMessage(message: any): message is EventMessage {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.timestamp === 'number' &&
      typeof message.type === 'string' &&
      typeof message.event === 'string' &&
      message.payload !== undefined
    );
  }

  static isSearchRequestPayload(payload: any): payload is SearchRequestPayload {
    return payload && typeof payload.query === 'string';
  }

  static isFileOperationPayload(payload: any): payload is FileOperationPayload {
    return payload && typeof payload.filePath === 'string';
  }
}

/**
 * Message factory for creating type-safe messages
 */
export class MessageFactory {
  private static generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  static createRequest<T>(type: string, payload: T, expectsResponse = true): RequestMessage<T> {
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      payload,
      expectsResponse,
    };
  }

  static createResponse<T>(
    requestId: string,
    type: string,
    success: boolean,
    payload?: T,
    error?: ErrorInfo
  ): ResponseMessage<T> {
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      requestId,
      success,
      payload,
      error,
    };
  }

  static createEvent<T>(type: string, event: string, payload: T): EventMessage<T> {
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      event,
      payload,
    };
  }
}
