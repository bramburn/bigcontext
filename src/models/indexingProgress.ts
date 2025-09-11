/**
 * Indexing Progress Data Models
 *
 * This module defines the data models for indexing progress tracking
 * based on the API contract specifications and existing codebase patterns.
 *
 * These models align with:
 * - API contracts in specs/001-we-currently-have/contracts/
 * - Existing IndexingState interfaces in the codebase
 * - Frontend types in webview-react/src/types/
 */

/**
 * Indexing status enumeration
 *
 * Represents the current state of the indexing process as defined
 * in the API contract specification.
 */
export type IndexingStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Paused' | 'Error';

/**
 * Core indexing progress information
 *
 * This interface matches the API contract for GET /indexing-status
 * and provides essential progress tracking data.
 */
export interface IndexingProgress {
  /** Current status of the indexing process */
  status: IndexingStatus;

  /** Percentage of indexing completed (0-100) */
  percentageComplete: number;

  /** Total number of chunks that have been indexed */
  chunksIndexed: number;

  /** Total number of files to be processed (optional) */
  totalFiles?: number;

  /** Number of files that have been processed (optional) */
  filesProcessed?: number;

  /** Time elapsed since indexing started in milliseconds (optional) */
  timeElapsed?: number;

  /** Estimated time remaining in milliseconds (optional) */
  estimatedTimeRemaining?: number;

  /** Number of errors encountered during indexing (optional) */
  errorsEncountered?: number;
}

/**
 * Extended indexing progress with additional details
 *
 * This interface provides more comprehensive progress information
 * for internal use and detailed monitoring.
 */
export interface DetailedIndexingProgress extends IndexingProgress {
  /** Current file being processed */
  currentFile?: string;

  /** Current operation being performed */
  currentOperation?: string;

  /** Start time of the indexing process */
  startTime?: Date;

  /** End time of the indexing process (if completed) */
  endTime?: Date;

  /** Last update timestamp */
  lastUpdate: Date;

  /** Processing rate (files per second) */
  processingRate?: number;

  /** Average chunk size in characters */
  averageChunkSize?: number;

  /** Memory usage statistics */
  memoryUsage?: {
    used: number; // MB
    peak: number; // MB
    available: number; // MB
  };

  /** Error details */
  errors?: IndexingError[];

  /** Performance metrics */
  performance?: {
    embeddingGenerationTime: number; // milliseconds
    vectorStorageTime: number; // milliseconds
    fileProcessingTime: number; // milliseconds
    totalProcessingTime: number; // milliseconds
  };
}

/**
 * Indexing error information
 */
export interface IndexingError {
  /** Error identifier */
  id: string;

  /** Error message */
  message: string;

  /** File path where error occurred */
  filePath?: string;

  /** Error type/category */
  type: 'file_read' | 'parsing' | 'embedding' | 'storage' | 'network' | 'unknown';

  /** Timestamp when error occurred */
  timestamp: Date;

  /** Error severity */
  severity: 'warning' | 'error' | 'critical';

  /** Whether the error is recoverable */
  recoverable: boolean;

  /** Additional error details */
  details?: any;

  /** Stack trace (for debugging) */
  stackTrace?: string;
}

/**
 * Indexing statistics summary
 */
export interface IndexingStatistics {
  /** Total indexing sessions */
  totalSessions: number;

  /** Total files indexed across all sessions */
  totalFilesIndexed: number;

  /** Total chunks created across all sessions */
  totalChunksCreated: number;

  /** Total time spent indexing (milliseconds) */
  totalIndexingTime: number;

  /** Average files per session */
  averageFilesPerSession: number;

  /** Average chunks per file */
  averageChunksPerFile: number;

  /** Success rate (percentage) */
  successRate: number;

  /** Most recent indexing session */
  lastIndexingSession?: {
    startTime: Date;
    endTime?: Date;
    filesProcessed: number;
    chunksCreated: number;
    status: IndexingStatus;
  };

  /** File type breakdown */
  fileTypeBreakdown: Record<
    string,
    {
      count: number;
      totalChunks: number;
      averageChunksPerFile: number;
    }
  >;

  /** Error summary */
  errorSummary: {
    totalErrors: number;
    errorsByType: Record<string, number>;
    mostCommonError?: string;
  };
}

/**
 * Indexing configuration for a session
 */
export interface IndexingConfiguration {
  /** Files to include in indexing */
  includePatterns: string[];

  /** Files to exclude from indexing */
  excludePatterns: string[];

  /** Maximum file size to process (bytes) */
  maxFileSize: number;

  /** Chunk size configuration */
  chunkSize: {
    target: number; // characters
    overlap: number; // characters
    minSize: number; // characters
    maxSize: number; // characters
  };

  /** Supported file extensions */
  supportedExtensions: string[];

  /** Whether to process binary files */
  processBinaryFiles: boolean;

  /** Batch processing configuration */
  batchProcessing: {
    enabled: boolean;
    batchSize: number;
    parallelism: number;
  };

  /** Error handling configuration */
  errorHandling: {
    continueOnError: boolean;
    maxErrorsPerFile: number;
    maxTotalErrors: number;
  };
}

/**
 * Indexing operation result
 */
export interface IndexingOperationResult {
  /** Whether the operation was successful */
  success: boolean;

  /** Operation result message */
  message: string;

  /** Operation details */
  details?: {
    filesQueued?: number;
    estimatedDuration?: number; // milliseconds
    sessionId?: string;
  };

  /** Error information if operation failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Default indexing configuration
 */
export const DEFAULT_INDEXING_CONFIG: IndexingConfiguration = {
  includePatterns: [
    '**/*.ts',
    '**/*.js',
    '**/*.tsx',
    '**/*.jsx',
    '**/*.py',
    '**/*.java',
    '**/*.cpp',
    '**/*.c',
    '**/*.h',
  ],
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
  ],
  maxFileSize: 1024 * 1024, // 1 MB
  chunkSize: {
    target: 1000,
    overlap: 200,
    minSize: 100,
    maxSize: 2000,
  },
  supportedExtensions: [
    '.ts',
    '.js',
    '.tsx',
    '.jsx',
    '.py',
    '.java',
    '.cpp',
    '.c',
    '.h',
    '.cs',
    '.go',
    '.rs',
    '.php',
  ],
  processBinaryFiles: false,
  batchProcessing: {
    enabled: true,
    batchSize: 50,
    parallelism: 4,
  },
  errorHandling: {
    continueOnError: true,
    maxErrorsPerFile: 5,
    maxTotalErrors: 100,
  },
};

/**
 * Create initial indexing progress state
 */
export function createInitialProgress(): IndexingProgress {
  return {
    status: 'Not Started',
    percentageComplete: 0,
    chunksIndexed: 0,
    totalFiles: 0,
    filesProcessed: 0,
    timeElapsed: 0,
    estimatedTimeRemaining: 0,
    errorsEncountered: 0,
  };
}

/**
 * Calculate estimated time remaining
 */
export function calculateEstimatedTimeRemaining(progress: IndexingProgress): number {
  if (progress.percentageComplete <= 0 || !progress.timeElapsed) {
    return 0;
  }

  const timePerPercent = progress.timeElapsed / progress.percentageComplete;
  const remainingPercent = 100 - progress.percentageComplete;

  return Math.round(timePerPercent * remainingPercent);
}

/**
 * Calculate processing rate
 */
export function calculateProcessingRate(filesProcessed: number, timeElapsed: number): number {
  if (timeElapsed <= 0) {
    return 0;
  }

  return filesProcessed / (timeElapsed / 1000); // files per second
}
