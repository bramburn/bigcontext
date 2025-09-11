import * as vscode from 'vscode';

/**
 * Configuration interfaces for different providers
 */

/**
 * Configuration interface for Ollama embedding provider
 *
 * Defines the required and optional settings for connecting to an Ollama instance
 * to generate embeddings for code context.
 */
export interface OllamaConfig {
  /** The base URL of the Ollama API endpoint */
  apiUrl: string;
  /** The name of the Ollama model to use for embeddings */
  model: string;
  /** Optional timeout in milliseconds for API requests (default: 30000) */
  timeout?: number;
  /** Optional maximum number of items to process in a single batch (default: 10) */
  maxBatchSize?: number;
}

/**
 * Configuration interface for OpenAI embedding provider
 *
 * Defines the required and optional settings for connecting to OpenAI's API
 * to generate embeddings for code context.
 */
export interface OpenAIConfig {
  /** The API key for authenticating with OpenAI's services */
  apiKey: string;
  /** The name of the OpenAI embedding model to use */
  model: string;
  /** Optional timeout in milliseconds for API requests (default: 30000) */
  timeout?: number;
  /** Optional maximum number of items to process in a single batch (default: 100) */
  maxBatchSize?: number;
}

/**
 * Configuration interface for the vector database
 *
 * Defines settings for connecting to the vector database that stores
 * and retrieves code embeddings for context search.
 */
export interface DatabaseConfig {
  /** The type of vector database (currently only supports 'qdrant') */
  type: 'qdrant';
  /** The connection string for the database instance */
  connectionString: string;
}

/**
 * Configuration interface for code indexing settings
 *
 * Defines how code files are processed, chunked, and indexed for
 * efficient context retrieval.
 */
export interface IndexingConfig {
  /** Array of glob patterns to exclude from indexing */
  excludePatterns: string[];
  /** Array of programming languages supported for indexing */
  supportedLanguages: string[];
  /** Optional maximum file size in bytes to process (default: 1MB) */
  maxFileSize?: number;
  /** Optional size of text chunks for embedding (default: 1000 characters) */
  chunkSize?: number;
  /** Optional overlap between consecutive chunks (default: 200 characters) */
  chunkOverlap?: number;
}

/**
 * Configuration interface for query expansion settings
 */
export interface QueryExpansionConfig {
  /** Whether query expansion is enabled */
  enabled: boolean;
  /** Maximum number of expanded terms to generate */
  maxExpandedTerms: number;
  /** Minimum confidence threshold for including expanded terms */
  confidenceThreshold: number;
  /** LLM provider to use for expansion */
  llmProvider: 'openai' | 'ollama';
  /** Model to use for expansion */
  model: string;
  /** API key for LLM provider (if required) */
  apiKey?: string;
  /** API URL for LLM provider */
  apiUrl?: string;
  /** Timeout for LLM requests in milliseconds */
  timeout: number;
}

/**
 * Configuration interface for LLM re-ranking settings
 */
export interface LLMReRankingConfig {
  /** Whether re-ranking is enabled */
  enabled: boolean;
  /** Maximum number of results to re-rank */
  maxResultsToReRank: number;
  /** Weight for original vector score (0-1) */
  vectorScoreWeight: number;
  /** Weight for LLM score (0-1) */
  llmScoreWeight: number;
  /** LLM provider to use for re-ranking */
  llmProvider: 'openai' | 'ollama';
  /** Model to use for re-ranking */
  model: string;
  /** API key for LLM provider (if required) */
  apiKey?: string;
  /** API URL for LLM provider */
  apiUrl?: string;
  /** Timeout for LLM requests in milliseconds */
  timeout: number;
  /** Whether to include explanations in results */
  includeExplanations: boolean;
}

/**
 * Configuration interface for logging settings
 */
export interface LoggingConfig {
  /** Current log level */
  level?: string;
  /** Whether to enable file logging */
  enableFileLogging?: boolean;
  /** Directory for log files */
  logDirectory?: string;
  /** Maximum log file size in bytes */
  maxFileSize?: number;
  /** Number of log files to keep */
  maxFiles?: number;
  /** Whether to enable console logging */
  enableConsoleLogging?: boolean;
  /** Whether to enable VS Code output channel */
  enableOutputChannel?: boolean;
  /** Log format template */
  logFormat?: string;
}

/**
 * Main extension configuration interface
 *
 * Aggregates all configuration sections into a single type that represents
 * the complete configuration for the Code Context Engine extension.
 */
export interface ExtensionConfig {
  /** Database configuration settings */
  database: DatabaseConfig;
  /** Selected embedding provider ('ollama' or 'openai') */
  embeddingProvider: 'ollama' | 'openai';
  /** Ollama-specific configuration */
  ollama: OllamaConfig;
  /** OpenAI-specific configuration */
  openai: OpenAIConfig;
  /** Code indexing configuration */
  indexing: IndexingConfig;
  /** Query expansion configuration */
  queryExpansion?: QueryExpansionConfig;
  /** LLM re-ranking configuration */
  llmReRanking?: LLMReRankingConfig;
  /** Logging configuration */
  logging?: LoggingConfig;
}

/**
 * Centralized configuration service for the Code Context Engine extension.
 *
 * This service encapsulates all extension settings, providing a single source of truth
 * and preventing direct vscode.workspace.getConfiguration() calls throughout the codebase.
 * It improves testability by centralizing configuration access and makes it easier to
 * manage configuration changes.
 *
 * The service follows the singleton pattern and should be instantiated once per extension
 * lifecycle. It provides type-safe access to all configuration values with sensible defaults.
 */
export class ConfigService {
  /** Internal reference to VS Code's workspace configuration */
  private config: vscode.WorkspaceConfiguration;
  /** The configuration section name in package.json and settings */
  private readonly configSection = 'code-context-engine';

  /**
   * Creates a new ConfigService instance
   *
   * Loads the configuration from VS Code settings during instantiation.
   * The configuration is cached internally to avoid repeated calls to
   * vscode.workspace.getConfiguration().
   */
  constructor() {
    // Load the configuration once during instantiation
    this.config = vscode.workspace.getConfiguration(this.configSection);
  }

  /**
   * Refresh configuration from VS Code settings
   *
   * Call this method when configuration might have changed (e.g., after
   * a settings update event) to ensure the service has the latest values.
   * This is important for maintaining consistency between the extension
   * and the user's current settings.
   */
  public refresh(): void {
    this.config = vscode.workspace.getConfiguration(this.configSection);
  }

  /**
   * Get the Qdrant database connection string
   *
   * @returns The connection string for the Qdrant database, defaulting to 'http://localhost:6333'
   */
  public getQdrantConnectionString(): string {
    return this.config.get<string>('databaseConnectionString') || 'http://localhost:6333';
  }

  /**
   * Get the database configuration
   *
   * Constructs and returns a DatabaseConfig object with the current settings.
   * Currently only supports Qdrant as the database type.
   *
   * @returns A DatabaseConfig object with type and connection string
   */
  public getDatabaseConfig(): DatabaseConfig {
    return {
      type: 'qdrant',
      connectionString: this.getQdrantConnectionString(),
    };
  }

  /**
   * Get the current embedding provider type
   *
   * Determines which embedding provider is currently active based on user settings.
   * This setting controls which provider configuration will be used for generating embeddings.
   *
   * @returns The current embedding provider ('ollama' or 'openai'), defaulting to 'ollama'
   */
  public getEmbeddingProvider(): 'ollama' | 'openai' {
    return this.config.get<'ollama' | 'openai'>('embeddingProvider') || 'ollama';
  }

  /**
   * Get Ollama configuration
   *
   * Constructs and returns an OllamaConfig object with all necessary settings
   * for connecting to and using an Ollama instance for embeddings.
   *
   * @returns An OllamaConfig object with API URL, model, timeout, and batch size settings
   */
  public getOllamaConfig(): OllamaConfig {
    return {
      apiUrl: this.config.get<string>('ollamaApiUrl') || 'http://localhost:11434',
      model: this.config.get<string>('ollamaModel') || 'nomic-embed-text',
      timeout: this.config.get<number>('ollamaTimeout') || 30000,
      maxBatchSize: this.config.get<number>('ollamaMaxBatchSize') || 10,
    };
  }

  /**
   * Get OpenAI configuration
   *
   * Constructs and returns an OpenAIConfig object with all necessary settings
   * for connecting to OpenAI's API and using their embedding models.
   *
   * @returns An OpenAIConfig object with API key, model, timeout, and batch size settings
   */
  public getOpenAIConfig(): OpenAIConfig {
    return {
      apiKey: this.config.get<string>('openaiApiKey') || '',
      model: this.config.get<string>('openaiModel') || 'text-embedding-ada-002',
      timeout: this.config.get<number>('openaiTimeout') || 30000,
      maxBatchSize: this.config.get<number>('openaiMaxBatchSize') || 100,
    };
  }

  /**
   * Get indexing configuration
   *
   * Constructs and returns an IndexingConfig object with settings that control
   * how code files are processed and indexed. This includes patterns to exclude,
   * supported languages, and text chunking parameters.
   *
   * @returns An IndexingConfig object with all indexing-related settings
   */
  public getIndexingConfig(): IndexingConfig {
    return {
      excludePatterns: this.config.get<string[]>('excludePatterns') || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
      ],
      supportedLanguages: this.config.get<string[]>('supportedLanguages') || [
        'typescript',
        'javascript',
        'python',
        'csharp',
      ],
      maxFileSize: this.config.get<number>('maxFileSize') || 1024 * 1024, // 1MB
      chunkSize: this.config.get<number>('indexingChunkSize') || 1000,
      chunkOverlap: this.config.get<number>('indexingChunkOverlap') || 200,
    };
  }

  /**
   * Get query expansion configuration
   *
   * @returns QueryExpansionConfig object with all query expansion settings
   */
  public getQueryExpansionConfig(): QueryExpansionConfig {
    const embeddingProvider = this.getEmbeddingProvider();
    return {
      enabled: this.config.get<boolean>('queryExpansion.enabled') ?? false,
      maxExpandedTerms: this.config.get<number>('queryExpansion.maxExpandedTerms') ?? 5,
      confidenceThreshold: this.config.get<number>('queryExpansion.confidenceThreshold') ?? 0.7,
      llmProvider:
        this.config.get<'openai' | 'ollama'>('queryExpansion.llmProvider') ?? embeddingProvider,
      model:
        this.config.get<string>('queryExpansion.model') ??
        (embeddingProvider === 'openai' ? 'gpt-3.5-turbo' : 'llama2'),
      apiKey: this.config.get<string>('queryExpansion.apiKey') ?? this.getOpenAIConfig().apiKey,
      apiUrl:
        this.config.get<string>('queryExpansion.apiUrl') ??
        (embeddingProvider === 'ollama'
          ? this.getOllamaConfig().apiUrl
          : 'https://api.openai.com/v1'),
      timeout: this.config.get<number>('queryExpansion.timeout') ?? 5000,
    };
  }

  /**
   * Get LLM re-ranking configuration
   *
   * @returns LLMReRankingConfig object with all re-ranking settings
   */
  public getLLMReRankingConfig(): LLMReRankingConfig {
    const embeddingProvider = this.getEmbeddingProvider();
    return {
      enabled: this.config.get<boolean>('llmReRanking.enabled') ?? false,
      maxResultsToReRank: this.config.get<number>('llmReRanking.maxResultsToReRank') ?? 10,
      vectorScoreWeight: this.config.get<number>('llmReRanking.vectorScoreWeight') ?? 0.3,
      llmScoreWeight: this.config.get<number>('llmReRanking.llmScoreWeight') ?? 0.7,
      llmProvider:
        this.config.get<'openai' | 'ollama'>('llmReRanking.llmProvider') ?? embeddingProvider,
      model:
        this.config.get<string>('llmReRanking.model') ??
        (embeddingProvider === 'openai' ? 'gpt-3.5-turbo' : 'llama2'),
      apiKey: this.config.get<string>('llmReRanking.apiKey') ?? this.getOpenAIConfig().apiKey,
      apiUrl:
        this.config.get<string>('llmReRanking.apiUrl') ??
        (embeddingProvider === 'ollama'
          ? this.getOllamaConfig().apiUrl
          : 'https://api.openai.com/v1'),
      timeout: this.config.get<number>('llmReRanking.timeout') ?? 10000,
      includeExplanations: this.config.get<boolean>('llmReRanking.includeExplanations') ?? false,
    };
  }

  /**
   * Get logging configuration
   *
   * @returns LoggingConfig object with all logging settings
   */
  public getLoggingConfig(): LoggingConfig {
    return {
      level: this.config.get<string>('logging.level') ?? 'Info',
      enableFileLogging: this.config.get<boolean>('logging.enableFileLogging') ?? true,
      logDirectory: this.config.get<string>('logging.logDirectory'),
      maxFileSize: this.config.get<number>('logging.maxFileSize') ?? 10 * 1024 * 1024,
      maxFiles: this.config.get<number>('logging.maxFiles') ?? 5,
      enableConsoleLogging: this.config.get<boolean>('logging.enableConsoleLogging') ?? true,
      enableOutputChannel: this.config.get<boolean>('logging.enableOutputChannel') ?? true,
      logFormat:
        this.config.get<string>('logging.logFormat') ??
        '[{timestamp}] [{level}] {source}: {message}',
    };
  }

  /**
   * Get the complete extension configuration
   *
   * Aggregates all configuration sections into a single ExtensionConfig object.
   * This is useful for components that need access to the entire configuration
   * or for passing configuration to external services.
   *
   * @returns A complete ExtensionConfig object with all settings
   */
  public getFullConfig(): ExtensionConfig {
    return {
      database: this.getDatabaseConfig(),
      embeddingProvider: this.getEmbeddingProvider(),
      ollama: this.getOllamaConfig(),
      openai: this.getOpenAIConfig(),
      indexing: this.getIndexingConfig(),
      queryExpansion: this.getQueryExpansionConfig(),
      llmReRanking: this.getLLMReRankingConfig(),
      logging: this.getLoggingConfig(),
    };
  }

  /**
   * Get the maximum number of search results to return
   *
   * @returns The maximum number of search results, defaulting to 20
   */
  public getMaxSearchResults(): number {
    return this.config.get<number>('maxSearchResults') || 20;
  }

  /**
   * Get the minimum similarity threshold for search results
   *
   * @returns The minimum similarity threshold (0.0 to 1.0), defaulting to 0.5
   */
  public getMinSimilarityThreshold(): number {
    return this.config.get<number>('minSimilarityThreshold') || 0.5;
  }

  /**
   * Get whether auto-indexing on startup is enabled
   *
   * @returns True if auto-indexing is enabled, false otherwise
   */
  public getAutoIndexOnStartup(): boolean {
    return this.config.get<boolean>('autoIndexOnStartup') || false;
  }

  /**
   * Get the indexing batch size
   *
   * @returns The number of chunks to process in each batch, defaulting to 100
   */
  public getIndexingBatchSize(): number {
    return this.config.get<number>('indexingBatchSize') || 100;
  }

  /**
   * Get whether debug logging is enabled
   *
   * @returns True if debug logging is enabled, false otherwise
   */
  public getEnableDebugLogging(): boolean {
    return this.config.get<boolean>('enableDebugLogging') || false;
  }

  /**
   * Check if a specific provider is properly configured
   *
   * Validates that all required configuration fields for the specified provider
   * are present and non-empty. This is useful for checking if the extension
   * can function with the current settings before attempting to use a provider.
   *
   * @param provider - The provider to validate ('ollama' or 'openai')
   * @returns True if the provider is properly configured, false otherwise
   */
  public isProviderConfigured(provider: 'ollama' | 'openai'): boolean {
    switch (provider) {
      case 'ollama':
        const ollamaConfig = this.getOllamaConfig();
        // Double negation converts truthy values to boolean
        return !!(ollamaConfig.apiUrl && ollamaConfig.model);
      case 'openai':
        const openaiConfig = this.getOpenAIConfig();
        // Double negation converts truthy values to boolean
        return !!(openaiConfig.apiKey && openaiConfig.model);
      default:
        return false;
    }
  }

  /**
   * Get configuration for the currently selected embedding provider
   *
   * Returns the configuration object for the active embedding provider as determined
   * by the embeddingProvider setting. This abstracts away the need for components
   * to check which provider is active and fetch the appropriate configuration.
   *
   * @returns The configuration object for the current provider (OllamaConfig or OpenAIConfig)
   */
  public getCurrentProviderConfig(): OllamaConfig | OpenAIConfig {
    const provider = this.getEmbeddingProvider();
    return provider === 'ollama' ? this.getOllamaConfig() : this.getOpenAIConfig();
  }

  /**
   * Get the indexing intensity setting
   *
   * Controls the CPU intensity of the indexing process by determining how much
   * delay is added between processing files. This helps users manage resource
   * consumption, especially on battery-powered devices.
   *
   * @returns The indexing intensity level ('High', 'Medium', or 'Low'), defaulting to 'High'
   */
  public getIndexingIntensity(): 'High' | 'Medium' | 'Low' {
    return this.config.get<'High' | 'Medium' | 'Low'>('indexingIntensity') || 'High';
  }

  /**
   * Get telemetry enabled setting
   *
   * Determines whether anonymous usage telemetry is enabled. This setting
   * controls whether the extension collects anonymous usage data to help
   * improve the product. Users can opt-out at any time.
   *
   * @returns Whether telemetry is enabled, defaulting to true (opt-out model)
   */
  public getTelemetryEnabled(): boolean {
    return this.config.get<boolean>('enableTelemetry') ?? true;
  }

  /**
   * Update telemetry enabled setting
   *
   * Updates the telemetry preference in VS Code settings. This method
   * provides a programmatic way to change the telemetry setting.
   *
   * @param enabled - Whether to enable telemetry
   * @returns Promise that resolves when the setting is updated
   */
  public async setTelemetryEnabled(enabled: boolean): Promise<void> {
    await this.config.update('enableTelemetry', enabled, vscode.ConfigurationTarget.Global);
    this.refresh(); // Refresh cached configuration
  }
}
