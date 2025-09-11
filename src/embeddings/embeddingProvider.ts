import { ConfigService } from "../configService";

/**
 * Core interface for embedding providers that can generate vector embeddings from text
 *
 * This interface defines the contract that all embedding providers must implement,
 * ensuring consistent behavior across different embedding services (OpenAI, Ollama, etc.)
 */
export interface IEmbeddingProvider {
  /**
   * Generate vector embeddings for an array of text chunks
   *
   * This is the main method that converts text into numerical vector representations
   * that can be used for semantic search, similarity comparison, and other AI tasks.
   *
   * @param chunks - Array of text strings to convert to embeddings
   * @returns Promise resolving to array of embedding vectors, where each vector
   *          corresponds to the input chunk at the same index
   */
  generateEmbeddings(chunks: string[]): Promise<number[][]>;

  /**
   * Get the dimension size of embeddings produced by this provider
   *
   * Different embedding models produce vectors of different dimensions.
   * This information is crucial for vector database operations and compatibility checks.
   *
   * @returns The vector dimension size (e.g., 768, 1536, 1024)
   */
  getDimensions(): number;

  /**
   * Get the name/identifier of this embedding provider
   *
   * This method returns a unique identifier that includes both the provider type
   * and the specific model being used, useful for logging and debugging.
   *
   * @returns Provider name in format "provider:model" (e.g., "openai:text-embedding-ada-002")
   */
  getProviderName(): string;

  /**
   * Check if the provider is properly configured and available
   *
   * This method validates that the provider service is accessible and properly
   * configured before attempting to use it for embedding generation.
   *
   * @returns Promise resolving to true if provider is ready and available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Configuration interface for embedding providers
 *
 * This interface defines the configuration options needed to initialize
 * different types of embedding providers. The structure is designed to be
 * flexible enough to work with various embedding services while maintaining
 * a consistent interface.
 */
export interface EmbeddingConfig {
  /** The type of embedding provider to use ('ollama' or 'openai') */
  provider: "ollama" | "openai";

  /** The specific model name to use for embeddings (optional, uses default if not specified) */
  model?: string;

  /** API key for authentication (required for OpenAI, not needed for Ollama) */
  apiKey?: string;

  /** API URL for the embedding service (optional, uses default if not specified) */
  apiUrl?: string;

  /** Maximum number of chunks to process in a single batch (optional, uses provider defaults) */
  maxBatchSize?: number;

  /** Timeout for API requests in milliseconds (optional, uses provider defaults) */
  timeout?: number;

  /** Maximum number of retry attempts for failed requests (optional, default: 3) */
  maxRetries?: number;

  /** Backoff multiplier for retry delays (optional, default: 2) */
  backoffMultiplier?: number;

  /** Initial delay in milliseconds for first retry (optional, default: 1000) */
  initialDelay?: number;
}

/**
 * Result interface for embedding generation operations
 *
 * This interface provides detailed information about the embedding generation process,
 * including the actual embeddings, performance metrics, and any errors that occurred.
 */
export interface EmbeddingResult {
  /** The generated embedding vectors, one for each input chunk */
  embeddings: number[][];

  /** Total number of tokens processed (if available from the provider) */
  totalTokens?: number;

  /** Total processing time in milliseconds */
  processingTime: number;

  /** Array of error messages for any chunks that failed to process */
  errors: string[];
}

/**
 * Factory class for creating embedding providers
 *
 * This factory class implements the Factory Design Pattern to provide a clean,
 * centralized way to create different types of embedding providers based on
 * configuration. It supports dynamic imports to avoid loading unnecessary dependencies
 * and integrates with the centralized configuration system.
 */
export class EmbeddingProviderFactory {
  /**
   * Create an embedding provider instance based on configuration
   *
   * This method dynamically imports and instantiates the appropriate embedding provider
   * based on the provider type specified in the configuration. This approach ensures
   * that only the necessary provider code is loaded, improving startup performance.
   *
   * @param config - Configuration object specifying the provider type and its settings
   * @param loggingService - Optional logging service for performance monitoring
   * @returns Promise resolving to a configured embedding provider instance
   * @throws Error if the specified provider type is not supported
   */
  static async createProvider(
    config: EmbeddingConfig,
    loggingService?: any,
  ): Promise<IEmbeddingProvider> {
    switch (config.provider) {
      case "ollama":
        // Dynamically import Ollama provider to avoid loading it when not needed
        const { OllamaProvider } = await import("./ollamaProvider");
        return new OllamaProvider(config, loggingService);
      case "openai":
        // Dynamically import OpenAI provider to avoid loading it when not needed
        const { OpenAIProvider } = await import("./openaiProvider");
        return new OpenAIProvider(config, loggingService);
      default:
        throw new Error(
          `Unsupported embedding provider: ${config.provider}. Supported providers: ${this.getSupportedProviders().join(", ")}`,
        );
    }
  }

  /**
   * Create an embedding provider using the centralized ConfigService
   *
   * This method integrates with the application's centralized configuration system
   * to automatically retrieve the appropriate configuration for the specified
   * embedding provider type. This ensures consistency across the application
   * and reduces configuration duplication.
   *
   * @param configService - The centralized configuration service instance
   * @returns Promise resolving to a configured embedding provider instance
   * @throws Error if the provider type is not supported or configuration is invalid
   */
  static async createProviderFromConfigService(
    configService: ConfigService,
  ): Promise<IEmbeddingProvider> {
    // Get the configured provider type from the central configuration
    const providerType = configService.getEmbeddingProvider();

    let config: EmbeddingConfig;

    // Build configuration based on provider type
    if (providerType === "ollama") {
      const ollamaConfig = configService.getOllamaConfig();
      config = {
        provider: "ollama",
        model: ollamaConfig.model,
        apiUrl: ollamaConfig.apiUrl,
        maxBatchSize: ollamaConfig.maxBatchSize,
        timeout: ollamaConfig.timeout,
      };
    } else if (providerType === "openai") {
      const openaiConfig = configService.getOpenAIConfig();
      config = {
        provider: "openai",
        model: openaiConfig.model,
        apiKey: openaiConfig.apiKey,
        maxBatchSize: openaiConfig.maxBatchSize,
        timeout: openaiConfig.timeout,
      };
    } else {
      throw new Error(
        `Unsupported embedding provider: ${providerType}. Supported providers: ${this.getSupportedProviders().join(", ")}`,
      );
    }

    // Create the provider using the standard factory method
    return this.createProvider(config);
  }

  /**
   * Get list of supported embedding provider types
   *
   * This method returns an array of all supported embedding provider types,
   * which can be useful for UI components, validation, and documentation.
   *
   * @returns Array of supported provider type strings
   */
  static getSupportedProviders(): string[] {
    return ["ollama", "openai"];
  }
}
