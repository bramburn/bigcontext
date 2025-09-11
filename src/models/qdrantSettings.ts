/**
 * Qdrant Database Settings Data Models
 *
 * This module defines the data models for Qdrant vector database settings
 * based on the API contract specifications and existing codebase patterns.
 *
 * These models align with:
 * - API contracts in specs/001-we-currently-have/contracts/
 * - Existing DatabaseConfig interfaces in the codebase
 * - Frontend types in webview-react/src/types/
 */

/**
 * Core Qdrant database configuration
 *
 * This interface defines the essential properties required to connect
 * to a Qdrant vector database instance as specified in the API contracts.
 */
export interface QdrantDatabaseSettings {
  /** Qdrant server hostname or IP address */
  host: string;

  /** Qdrant server port (optional, defaults to 6333) */
  port?: number;

  /** API key for authentication (optional for local instances) */
  apiKey?: string;

  /** Collection name for storing embeddings */
  collectionName: string;

  /** Whether to use HTTPS (optional, defaults to false for local) */
  useHttps?: boolean;

  /** Connection timeout in milliseconds (optional) */
  timeout?: number;
}

/**
 * Advanced Qdrant configuration options
 */
export interface QdrantAdvancedSettings {
  /** Connection pool settings */
  connectionPool?: {
    maxConnections: number;
    idleTimeout: number; // milliseconds
    connectionTimeout: number; // milliseconds
  };

  /** Retry configuration for failed operations */
  retry?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number; // milliseconds
  };

  /** Collection configuration */
  collection?: {
    /** Vector size (dimensions) */
    vectorSize?: number;

    /** Distance metric for similarity search */
    distance?: 'Cosine' | 'Euclidean' | 'Dot';

    /** Indexing configuration */
    indexing?: {
      /** Number of vectors per segment */
      vectorsPerSegment?: number;

      /** Memory mapping threshold */
      memoryMappingThreshold?: number;

      /** Payload indexing configuration */
      payloadIndexing?: boolean;
    };

    /** Replication factor */
    replicationFactor?: number;

    /** Write consistency factor */
    writeConsistencyFactor?: number;
  };

  /** Performance tuning */
  performance?: {
    /** Batch size for bulk operations */
    batchSize?: number;

    /** Parallel processing settings */
    parallelism?: number;

    /** Memory optimization */
    memoryOptimization?: {
      enabled: boolean;
      maxMemoryUsage: number; // MB
    };
  };

  /** Logging configuration */
  logging?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    includeRequestBodies: boolean;
  };
}

/**
 * Complete Qdrant settings configuration
 */
export interface QdrantSettings {
  /** Core database settings */
  qdrantDatabase: QdrantDatabaseSettings;

  /** Advanced configuration options */
  advanced?: QdrantAdvancedSettings;
}

/**
 * Qdrant connection test result
 */
export interface QdrantConnectionTest {
  /** Whether the connection test was successful */
  success: boolean;

  /** Test result message */
  message: string;

  /** Response time in milliseconds */
  latency?: number;

  /** Server information */
  serverInfo?: {
    version?: string;
    uptime?: number;
    collections?: string[];
  };

  /** Collection information (if collection exists) */
  collectionInfo?: {
    exists: boolean;
    vectorCount?: number;
    vectorSize?: number;
    distance?: string;
    status?: string;
  };

  /** Error details if connection failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Qdrant collection statistics
 */
export interface QdrantCollectionStats {
  /** Collection name */
  name: string;

  /** Total number of vectors */
  vectorCount: number;

  /** Vector dimensions */
  vectorSize: number;

  /** Distance metric used */
  distance: string;

  /** Collection status */
  status: 'green' | 'yellow' | 'red';

  /** Index status */
  indexedVectorCount: number;

  /** Storage information */
  storage: {
    totalSize: number; // bytes
    vectorsSize: number; // bytes
    payloadSize: number; // bytes
  };

  /** Performance metrics */
  performance?: {
    averageSearchTime: number; // milliseconds
    indexingRate: number; // vectors per second
    lastOptimization?: Date;
  };
}

/**
 * Validation result for Qdrant settings
 */
export interface QdrantSettingsValidation {
  /** Whether the settings are valid */
  isValid: boolean;

  /** Validation error messages */
  errors: string[];

  /** Warning messages (non-blocking) */
  warnings: string[];

  /** Suggested improvements */
  suggestions: string[];
}

/**
 * Qdrant operation result
 */
export interface QdrantOperationResult<T = any> {
  /** Whether the operation was successful */
  success: boolean;

  /** Operation result data */
  data?: T;

  /** Error information if operation failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  /** Operation metadata */
  metadata?: {
    duration: number; // milliseconds
    vectorsProcessed?: number;
    timestamp: Date;
  };
}

/**
 * Default Qdrant settings
 */
export const DEFAULT_QDRANT_SETTINGS: Partial<QdrantSettings> = {
  qdrantDatabase: {
    host: 'localhost',
    port: 6333,
    collectionName: 'code-embeddings',
    useHttps: false,
    timeout: 30000, // 30 seconds
  },
  advanced: {
    connectionPool: {
      maxConnections: 10,
      idleTimeout: 30000, // 30 seconds
      connectionTimeout: 5000, // 5 seconds
    },
    retry: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000, // 1 second
    },
    collection: {
      vectorSize: 1536, // Default for OpenAI ada-002
      distance: 'Cosine',
      indexing: {
        vectorsPerSegment: 100000,
        memoryMappingThreshold: 1000000,
        payloadIndexing: true,
      },
      replicationFactor: 1,
      writeConsistencyFactor: 1,
    },
    performance: {
      batchSize: 100,
      parallelism: 4,
      memoryOptimization: {
        enabled: true,
        maxMemoryUsage: 512, // 512 MB
      },
    },
    logging: {
      enabled: true,
      level: 'info',
      includeRequestBodies: false,
    },
  },
};

/**
 * Qdrant URL builder utility
 */
export function buildQdrantUrl(settings: QdrantDatabaseSettings): string {
  const protocol = settings.useHttps ? 'https' : 'http';
  const port = settings.port || 6333;
  return `${protocol}://${settings.host}:${port}`;
}

/**
 * Validate Qdrant collection name
 */
export function validateCollectionName(name: string): QdrantSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Collection name is required');
  } else {
    // Check for valid characters (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      errors.push('Collection name can only contain letters, numbers, hyphens, and underscores');
    }

    // Check length
    if (name.length > 255) {
      errors.push('Collection name must be 255 characters or less');
    }

    // Check for reserved names
    const reservedNames = ['_system', '_internal', 'admin'];
    if (reservedNames.includes(name.toLowerCase())) {
      errors.push(`Collection name "${name}" is reserved`);
    }

    // Suggestions
    if (name.includes(' ')) {
      suggestions.push('Consider using hyphens or underscores instead of spaces');
    }

    if (name !== name.toLowerCase()) {
      suggestions.push('Consider using lowercase for collection names');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}
