/**
 * Configuration Schema and Validation
 *
 * This module defines the complete configuration schema for the Code Context Engine,
 * including validation rules, type definitions, and schema versioning for migrations.
 */

export interface ConfigurationSchema {
  version: string;
  metadata: ConfigurationMetadata;
  database: DatabaseConfiguration;
  embedding: EmbeddingConfiguration;
  indexing: IndexingConfiguration;
  search: SearchConfiguration;
  performance: PerformanceConfiguration;
  security: SecurityConfiguration;
}

export interface ConfigurationMetadata {
  name: string;
  description?: string;
  environment: 'development' | 'staging' | 'production' | 'custom';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
  workspace?: string;
}

export interface DatabaseConfiguration {
  provider: 'qdrant' | 'chromadb' | 'pinecone';
  connection: {
    url?: string;
    apiKey?: string;
    environment?: string;
    index?: string;
    namespace?: string;
    port?: number;
    timeout?: number;
  };
  collections: {
    defaultCollection: string;
    collections: Array<{
      name: string;
      vectorSize: number;
      distance: 'cosine' | 'euclidean' | 'dot';
      metadata?: Record<string, any>;
    }>;
  };
  advanced: {
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
    compression?: boolean;
    replication?: {
      enabled: boolean;
      factor: number;
    };
  };
}

export interface EmbeddingConfiguration {
  provider: 'ollama' | 'openai';
  connection: {
    url?: string;
    apiKey?: string;
    organization?: string;
    timeout?: number;
    maxRetries?: number;
  };
  model: {
    name: string;
    dimensions: number;
    maxTokens?: number;
    parameters?: Record<string, any>;
  };
  advanced: {
    batchSize?: number;
    rateLimiting?: {
      requestsPerMinute: number;
      tokensPerMinute: number;
    };
    caching?: {
      enabled: boolean;
      ttl: number;
      maxSize: number;
    };
  };
}

export interface IndexingConfiguration {
  patterns: {
    include: string[];
    exclude: string[];
    fileTypes: string[];
    maxFileSize: number;
  };
  processing: {
    chunkSize: number;
    chunkOverlap: number;
    batchSize: number;
    parallelism: number;
  };
  scheduling: {
    autoIndex: boolean;
    watchFiles: boolean;
    indexInterval?: number;
    incrementalUpdates: boolean;
  };
  advanced: {
    languageDetection: boolean;
    codeAnalysis: boolean;
    semanticChunking: boolean;
    metadataExtraction: string[];
  };
}

export interface SearchConfiguration {
  defaults: {
    maxResults: number;
    minSimilarity: number;
    includeMetadata: boolean;
    includeContent: boolean;
  };
  ranking: {
    algorithm: 'similarity' | 'hybrid' | 'semantic';
    weights: {
      similarity: number;
      recency: number;
      relevance: number;
      popularity: number;
    };
  };
  filters: {
    enabledFilters: string[];
    defaultFilters: Record<string, any>;
  };
  advanced: {
    queryExpansion: boolean;
    semanticSearch: boolean;
    fuzzyMatching: boolean;
    contextWindow: number;
  };
}

export interface PerformanceConfiguration {
  memory: {
    maxHeapSize?: string;
    cacheSize: number;
    gcStrategy?: 'default' | 'aggressive' | 'conservative';
  };
  concurrency: {
    maxConcurrentRequests: number;
    queueSize: number;
    workerThreads: number;
  };
  optimization: {
    enableProfiling: boolean;
    metricsCollection: boolean;
    performanceLogging: boolean;
    autoTuning: boolean;
  };
}

export interface SecurityConfiguration {
  encryption: {
    enabled: boolean;
    algorithm?: string;
    keyRotation?: {
      enabled: boolean;
      interval: number;
    };
  };
  access: {
    authentication: boolean;
    authorization: boolean;
    allowedOrigins?: string[];
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
    };
  };
  audit: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    retentionDays: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export class ConfigurationValidator {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly SUPPORTED_VERSIONS = ['1.0.0'];

  /**
   * Validate a complete configuration object
   */
  static validate(config: Partial<ConfigurationSchema>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Version validation
    if (!config.version) {
      errors.push({
        path: 'version',
        message: 'Configuration version is required',
        code: 'MISSING_VERSION',
        severity: 'error',
      });
    } else if (!this.SUPPORTED_VERSIONS.includes(config.version)) {
      errors.push({
        path: 'version',
        message: `Unsupported configuration version: ${config.version}`,
        code: 'UNSUPPORTED_VERSION',
        severity: 'error',
      });
    }

    // Metadata validation
    if (config.metadata) {
      this.validateMetadata(config.metadata, errors, warnings);
    } else {
      errors.push({
        path: 'metadata',
        message: 'Configuration metadata is required',
        code: 'MISSING_METADATA',
        severity: 'error',
      });
    }

    // Database validation
    if (config.database) {
      this.validateDatabase(config.database, errors, warnings);
    } else {
      errors.push({
        path: 'database',
        message: 'Database configuration is required',
        code: 'MISSING_DATABASE',
        severity: 'error',
      });
    }

    // Embedding validation
    if (config.embedding) {
      this.validateEmbedding(config.embedding, errors, warnings);
    } else {
      errors.push({
        path: 'embedding',
        message: 'Embedding configuration is required',
        code: 'MISSING_EMBEDDING',
        severity: 'error',
      });
    }

    // Optional section validation
    if (config.indexing) {
      this.validateIndexing(config.indexing, errors, warnings);
    }

    if (config.search) {
      this.validateSearch(config.search, errors, warnings);
    }

    if (config.performance) {
      this.validatePerformance(config.performance, errors, warnings);
    }

    if (config.security) {
      this.validateSecurity(config.security, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static validateMetadata(
    metadata: ConfigurationMetadata,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push({
        path: 'metadata.name',
        message: 'Configuration name is required',
        code: 'MISSING_NAME',
        severity: 'error',
      });
    }

    if (!metadata.environment) {
      warnings.push({
        path: 'metadata.environment',
        message: 'Environment not specified, defaulting to development',
        suggestion: 'Specify environment for better configuration management',
      });
    }

    if (!metadata.createdAt) {
      warnings.push({
        path: 'metadata.createdAt',
        message: 'Creation timestamp missing',
        suggestion: 'Add timestamp for better version tracking',
      });
    }
  }

  private static validateDatabase(
    database: DatabaseConfiguration,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!database.provider) {
      errors.push({
        path: 'database.provider',
        message: 'Database provider is required',
        code: 'MISSING_PROVIDER',
        severity: 'error',
      });
    }

    // Provider-specific validation
    switch (database.provider) {
      case 'qdrant':
        this.validateQdrantConfig(database, errors, warnings);
        break;
      case 'chromadb':
        this.validateChromaDBConfig(database, errors, warnings);
        break;
      case 'pinecone':
        this.validatePineconeConfig(database, errors, warnings);
        break;
    }

    // Collections validation
    if (!database.collections?.defaultCollection) {
      errors.push({
        path: 'database.collections.defaultCollection',
        message: 'Default collection name is required',
        code: 'MISSING_DEFAULT_COLLECTION',
        severity: 'error',
      });
    }
  }

  private static validateEmbedding(
    embedding: EmbeddingConfiguration,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!embedding.provider) {
      errors.push({
        path: 'embedding.provider',
        message: 'Embedding provider is required',
        code: 'MISSING_PROVIDER',
        severity: 'error',
      });
    }

    if (!embedding.model?.name) {
      errors.push({
        path: 'embedding.model.name',
        message: 'Embedding model name is required',
        code: 'MISSING_MODEL',
        severity: 'error',
      });
    }

    if (!embedding.model?.dimensions || embedding.model.dimensions <= 0) {
      errors.push({
        path: 'embedding.model.dimensions',
        message: 'Valid embedding dimensions are required',
        code: 'INVALID_DIMENSIONS',
        severity: 'error',
      });
    }

    // Provider-specific validation
    switch (embedding.provider) {
      case 'openai':
        if (!embedding.connection?.apiKey) {
          errors.push({
            path: 'embedding.connection.apiKey',
            message: 'OpenAI API key is required',
            code: 'MISSING_API_KEY',
            severity: 'error',
          });
        }
        break;
      case 'ollama':
        if (!embedding.connection?.url) {
          warnings.push({
            path: 'embedding.connection.url',
            message: 'Ollama URL not specified, using default',
            suggestion: 'Specify custom URL if not using default localhost:11434',
          });
        }
        break;
    }
  }

  private static validateQdrantConfig(
    database: DatabaseConfiguration,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!database.connection?.url) {
      warnings.push({
        path: 'database.connection.url',
        message: 'Qdrant URL not specified, using default',
        suggestion: 'Specify custom URL if not using default localhost:6333',
      });
    }
  }

  private static validateChromaDBConfig(
    database: DatabaseConfiguration,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!database.connection?.url) {
      warnings.push({
        path: 'database.connection.url',
        message: 'ChromaDB URL not specified, using default',
        suggestion: 'Specify custom URL if not using default localhost:8000',
      });
    }
  }

  private static validatePineconeConfig(
    database: DatabaseConfiguration,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!database.connection?.apiKey) {
      errors.push({
        path: 'database.connection.apiKey',
        message: 'Pinecone API key is required',
        code: 'MISSING_API_KEY',
        severity: 'error',
      });
    }

    if (!database.connection?.environment) {
      errors.push({
        path: 'database.connection.environment',
        message: 'Pinecone environment is required',
        code: 'MISSING_ENVIRONMENT',
        severity: 'error',
      });
    }
  }

  private static validateIndexing(
    indexing: IndexingConfiguration,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (indexing.processing?.chunkSize && indexing.processing.chunkSize <= 0) {
      errors.push({
        path: 'indexing.processing.chunkSize',
        message: 'Chunk size must be positive',
        code: 'INVALID_CHUNK_SIZE',
        severity: 'error',
      });
    }

    if (indexing.processing?.parallelism && indexing.processing.parallelism <= 0) {
      errors.push({
        path: 'indexing.processing.parallelism',
        message: 'Parallelism must be positive',
        code: 'INVALID_PARALLELISM',
        severity: 'error',
      });
    }
  }

  private static validateSearch(
    search: SearchConfiguration,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (search.defaults?.maxResults && search.defaults.maxResults <= 0) {
      errors.push({
        path: 'search.defaults.maxResults',
        message: 'Max results must be positive',
        code: 'INVALID_MAX_RESULTS',
        severity: 'error',
      });
    }

    if (
      search.defaults?.minSimilarity &&
      (search.defaults.minSimilarity < 0 || search.defaults.minSimilarity > 1)
    ) {
      errors.push({
        path: 'search.defaults.minSimilarity',
        message: 'Min similarity must be between 0 and 1',
        code: 'INVALID_MIN_SIMILARITY',
        severity: 'error',
      });
    }
  }

  private static validatePerformance(
    performance: PerformanceConfiguration,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (
      performance.concurrency?.maxConcurrentRequests &&
      performance.concurrency.maxConcurrentRequests <= 0
    ) {
      errors.push({
        path: 'performance.concurrency.maxConcurrentRequests',
        message: 'Max concurrent requests must be positive',
        code: 'INVALID_CONCURRENCY',
        severity: 'error',
      });
    }
  }

  private static validateSecurity(
    security: SecurityConfiguration,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (
      security.access?.rateLimiting?.requestsPerMinute &&
      security.access.rateLimiting.requestsPerMinute <= 0
    ) {
      errors.push({
        path: 'security.access.rateLimiting.requestsPerMinute',
        message: 'Rate limiting requests per minute must be positive',
        code: 'INVALID_RATE_LIMIT',
        severity: 'error',
      });
    }
  }

  /**
   * Create a default configuration
   */
  static createDefault(): ConfigurationSchema {
    return {
      version: this.CURRENT_VERSION,
      metadata: {
        name: 'Default Configuration',
        description: 'Default Code Context Engine configuration',
        environment: 'development',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      database: {
        provider: 'qdrant',
        connection: {
          url: 'http://localhost:6333',
          timeout: 30000,
        },
        collections: {
          defaultCollection: 'code_context',
          collections: [
            {
              name: 'code_context',
              vectorSize: 384,
              distance: 'cosine',
            },
          ],
        },
        advanced: {
          batchSize: 100,
          maxRetries: 3,
          retryDelay: 1000,
        },
      },
      embedding: {
        provider: 'ollama',
        connection: {
          url: 'http://localhost:11434',
          timeout: 30000,
        },
        model: {
          name: 'nomic-embed-text',
          dimensions: 384,
        },
        advanced: {
          batchSize: 10,
        },
      },
      indexing: {
        patterns: {
          include: ['**/*.ts', '**/*.js', '**/*.py', '**/*.java', '**/*.cpp', '**/*.c', '**/*.h'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
          fileTypes: ['typescript', 'javascript', 'python', 'java', 'cpp', 'c'],
          maxFileSize: 1048576, // 1MB
        },
        processing: {
          chunkSize: 1000,
          chunkOverlap: 200,
          batchSize: 50,
          parallelism: 4,
        },
        scheduling: {
          autoIndex: true,
          watchFiles: true,
          incrementalUpdates: true,
        },
        advanced: {
          languageDetection: true,
          codeAnalysis: true,
          semanticChunking: false,
          metadataExtraction: ['language', 'functions', 'classes', 'imports'],
        },
      },
      search: {
        defaults: {
          maxResults: 20,
          minSimilarity: 0.7,
          includeMetadata: true,
          includeContent: true,
        },
        ranking: {
          algorithm: 'similarity',
          weights: {
            similarity: 0.7,
            recency: 0.1,
            relevance: 0.15,
            popularity: 0.05,
          },
        },
        filters: {
          enabledFilters: ['fileType', 'language', 'dateRange'],
          defaultFilters: {},
        },
        advanced: {
          queryExpansion: false,
          semanticSearch: true,
          fuzzyMatching: true,
          contextWindow: 5,
        },
      },
      performance: {
        memory: {
          cacheSize: 100,
          gcStrategy: 'default',
        },
        concurrency: {
          maxConcurrentRequests: 10,
          queueSize: 100,
          workerThreads: 4,
        },
        optimization: {
          enableProfiling: false,
          metricsCollection: true,
          performanceLogging: false,
          autoTuning: false,
        },
      },
      security: {
        encryption: {
          enabled: false,
        },
        access: {
          authentication: false,
          authorization: false,
          rateLimiting: {
            enabled: false,
            requestsPerMinute: 100,
          },
        },
        audit: {
          enabled: false,
          logLevel: 'info',
          retentionDays: 30,
        },
      },
    };
  }
}
