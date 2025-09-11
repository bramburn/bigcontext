import axios, { AxiosInstance } from "axios";
import { IEmbeddingProvider, EmbeddingConfig } from "./embeddingProvider";
import { CentralizedLoggingService } from "../logging/centralizedLoggingService";
import { EmbeddingPerformanceMonitor } from "./embeddingPerformanceMonitor";

/**
 * OpenAI embedding provider implementation
 *
 * This class provides an implementation of the IEmbeddingProvider interface for
 * OpenAI's embedding services. It leverages OpenAI's powerful embedding models
 * like text-embedding-ada-002 and text-embedding-3-series to generate high-quality
 * vector representations of text for semantic search, clustering, and other AI tasks.
 *
 * OpenAI embeddings are particularly useful for:
 * - High-quality semantic understanding
 * - Access to state-of-the-art language models
 * - Integration with other OpenAI services
 * - Applications requiring the latest in AI capabilities
 */
export class OpenAIProvider implements IEmbeddingProvider {
  /** HTTP client for making API requests to OpenAI */
  private client: AxiosInstance;

  /** The name of the embedding model to use */
  private model: string;

  /** OpenAI API key for authentication */
  private apiKey: string;

  /** Maximum number of chunks to process in a single batch (default: 100) */
  private maxBatchSize: number;

  /** Request timeout in milliseconds (default: 60000) */
  private timeout: number;

  /** Logging service for performance and error tracking */
  private loggingService?: CentralizedLoggingService;

  /** Performance monitor for tracking metrics */
  private performanceMonitor?: EmbeddingPerformanceMonitor;

  /** Retry configuration for failed requests */
  private retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };

  /**
   * Initialize the OpenAI embedding provider
   *
   * @param config - Configuration object for the OpenAI provider
   * @param loggingService - Optional logging service for performance tracking
   *
   * The constructor validates that an API key is provided and sets up the
   * HTTP client with appropriate authentication headers. It uses sensible
   * defaults for most parameters while allowing customization through the
   * configuration object.
   *
   * @throws Error if API key is not provided
   */
  constructor(config: EmbeddingConfig, loggingService?: CentralizedLoggingService) {
    // Set model with fallback to a popular default
    this.model = config.model || "text-embedding-ada-002";

    // API key is required for OpenAI services
    this.apiKey = config.apiKey || "";

    // Set batch size with larger default since OpenAI supports bigger batches
    this.maxBatchSize = config.maxBatchSize || 100;

    // Set longer timeout for external API calls
    this.timeout = config.timeout || 60000;

    // Validate that API key is provided
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key is required. Please set it in VS Code settings.",
      );
    }

    // Configure HTTP client for OpenAI API communication with authentication
    this.client = axios.create({
      baseURL: "https://api.openai.com/v1",
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    // Initialize logging service and performance monitor
    this.loggingService = loggingService;
    if (this.loggingService) {
      this.performanceMonitor = new EmbeddingPerformanceMonitor(this, this.loggingService);
    }

    // Initialize retry configuration
    this.retryConfig = {
      maxRetries: config.maxRetries || 3,
      backoffMultiplier: config.backoffMultiplier || 2,
      initialDelay: config.initialDelay || 1000,
    };
  }

  /**
   * Generate embeddings for an array of text chunks
   *
   * This method processes text chunks in batches to optimize performance
   * and stay within OpenAI's rate limits. Unlike some other providers,
   * OpenAI's embedding API can process multiple inputs in a single request,
   * making batch processing very efficient.
   *
   * @param chunks - Array of text strings to convert to embeddings
   * @returns Promise resolving to array of embedding vectors
   *
   * The method maintains array alignment even when some chunks fail to process
   * by substituting zero vectors for failed chunks, ensuring that the output
   * array always matches the input array in length.
   */
  async generateEmbeddings(chunks: string[]): Promise<number[][]> {
    // Early return for empty input to avoid unnecessary processing
    if (chunks.length === 0) {
      return [];
    }

    const embeddings: number[][] = [];
    const errors: string[] = [];

    // Process chunks in batches to optimize API usage and avoid rate limits
    for (let i = 0; i < chunks.length; i += this.maxBatchSize) {
      const batch = chunks.slice(i, i + this.maxBatchSize);

      try {
        const batchEmbeddings = await this.processBatch(batch);
        embeddings.push(...batchEmbeddings);
      } catch (error) {
        const errorMessage = `Failed to process batch ${Math.floor(i / this.maxBatchSize) + 1}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMessage);
        console.error(errorMessage);

        // Add zero vectors for failed chunks to maintain array alignment
        // This ensures the output array length matches the input array length
        for (let j = 0; j < batch.length; j++) {
          embeddings.push(new Array(this.getDimensions()).fill(0));
        }
      }
    }

    // Log warnings if there were any processing errors
    if (errors.length > 0) {
      console.warn(
        `OpenAI embedding generation completed with ${errors.length} errors`,
      );
    }

    return embeddings;
  }

  /**
   * Process a batch of text chunks for embedding generation with retry logic
   *
   * This private method handles the actual API communication with OpenAI.
   * Unlike Ollama, OpenAI's embedding API can process multiple inputs
   * in a single request, making it more efficient for batch processing.
   *
   * @param chunks - Array of text chunks to process
   * @returns Promise resolving to array of embedding vectors
   * @throws Error if the API request fails or returns invalid data
   *
   * The method includes comprehensive error handling for common issues
   * like authentication problems, rate limits, invalid requests, and
   * model availability. It also includes retry logic with exponential backoff.
   */
  private async processBatch(chunks: string[]): Promise<number[][]> {
    return this.executeWithRetry(async () => {
      return this.processBatchInternal(chunks);
    });
  }

  /**
   * Internal method for processing a batch without retry logic
   */
  private async processBatchInternal(chunks: string[]): Promise<number[][]> {
    try {
      const response = await this.client.post("/embeddings", {
        model: this.model,
        input: chunks,
        encoding_format: "float",
      });

      // Validate response format and extract embeddings
      if (response.data && response.data.data) {
        // OpenAI returns embeddings in the same order as input
        return response.data.data.map((item: any) => item.embedding);
      } else {
        throw new Error("Invalid response format from OpenAI API");
      }
    } catch (error) {
      // Handle specific error cases with helpful messages
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error(
            "Invalid OpenAI API key. Please check your API key in VS Code settings.",
          );
        } else if (error.response?.status === 429) {
          throw new Error(
            "OpenAI API rate limit exceeded. Please try again later.",
          );
        } else if (error.response?.status === 400) {
          const errorData = error.response.data;
          if (errorData?.error?.code === "invalid_request_error") {
            throw new Error(`OpenAI API error: ${errorData.error.message}`);
          }
          throw new Error("Bad request to OpenAI API. Check your input data.");
        } else if (error.response?.status === 404) {
          throw new Error(
            `Model '${this.model}' not found. Please check the model name.`,
          );
        } else {
          throw new Error(
            `OpenAI API error (${error.response?.status}): ${error.response?.data?.error?.message || error.message}`,
          );
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Get the dimension size of embeddings for the current model
   *
   * Different embedding models produce vectors of different dimensions.
   * This method uses a lookup table for common OpenAI embedding models
   * and falls back to a reasonable default for unknown models.
   *
   * @returns The vector dimension size (e.g., 1536 for ada-002)
   */
  getDimensions(): number {
    // Dimensions for popular OpenAI embedding models
    const modelDimensions: Record<string, number> = {
      "text-embedding-ada-002": 1536,
      "text-embedding-3-small": 1536,
      "text-embedding-3-large": 3072,
    };

    // Return known dimension or default to ada-002 dimensions for unknown models
    return modelDimensions[this.model] || 1536;
  }

  /**
   * Get the provider name identifier
   *
   * This method returns a unique identifier that includes both the
   * provider type and the specific model being used, useful for
   * logging, debugging, and display purposes.
   *
   * @returns Provider name in format "openai:model-name"
   */
  getProviderName(): string {
    return `openai:${this.model}`;
  }

  /**
   * Check if the OpenAI service and model are available
   *
   * This method performs a test request to verify that:
   * 1. The API key is valid and authentication works
   * 2. The specified embedding model is available
   * 3. The service is responding correctly
   *
   * @returns Promise resolving to true if the service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test with a simple embedding request to verify connectivity and auth
      const response = await this.client.post("/embeddings", {
        model: this.model,
        input: "test",
        encoding_format: "float",
      });

      return response.status === 200 && response.data?.data?.length > 0;
    } catch (error) {
      // Provide specific error messages for different failure scenarios
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.error("OpenAI API key is invalid or missing");
        } else if (error.response?.status === 404) {
          console.error(`OpenAI model '${this.model}' not found`);
        } else if (error.response?.status === 429) {
          console.warn(
            "OpenAI API rate limit exceeded, but service is available",
          );
          return true; // Rate limit means the service is available, just busy
        } else {
          console.error(
            "OpenAI API availability check failed:",
            error.response?.data || error.message,
          );
        }
      } else {
        console.error("Failed to check OpenAI availability:", error);
      }
      return false;
    }
  }

  /**
   * Get usage statistics for the last request
   *
   * This method would track token usage from the last API response,
   * which is useful for monitoring API costs and usage limits.
   * Currently returns an empty object as this feature needs implementation.
   *
   * @returns Object with usage statistics (currently empty)
   */
  getLastUsage(): { prompt_tokens?: number; total_tokens?: number } {
    // This would need to be implemented to track usage from the last response
    // For now, return empty object
    return {};
  }

  /**
   * Estimate token count for text (rough approximation)
   *
   * This method provides a rough estimate of how many tokens a piece of text
   * would consume when sent to the OpenAI API. This is useful for:
   * - Pre-validating text before sending to API
   * - Estimating API costs
   * - Implementing usage limits
   *
   * @param text - The text to estimate tokens for
   * @returns Estimated token count (rough approximation)
   *
   * Note: This is a rough approximation. For accurate token counting,
   * use OpenAI's tiktoken library or similar.
   */
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    // This is a simplification - actual tokenization varies by language
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if text is within token limits
   *
   * This method uses the token estimation to check if text would exceed
   * OpenAI's maximum token limit for embedding requests.
   *
   * @param text - The text to check
   * @param maxTokens - Maximum allowed tokens (default: 8191)
   * @returns True if text is within token limits
   */
  isWithinTokenLimit(text: string, maxTokens: number = 8191): boolean {
    return this.estimateTokens(text) <= maxTokens;
  }

  /**
   * Truncate text to fit within token limits
   *
   * This method truncates text to ensure it stays within OpenAI's token
   * limits while preserving as much content as possible.
   *
   * @param text - The text to truncate
   * @param maxTokens - Maximum allowed tokens (default: 8191)
   * @returns Truncated text that fits within token limits
   */
  truncateToTokenLimit(text: string, maxTokens: number = 8191): string {
    const estimatedTokens = this.estimateTokens(text);
    if (estimatedTokens <= maxTokens) {
      return text;
    }

    // Rough truncation based on character count
    // This is a simplification - proper truncation would use actual tokenization
    const maxChars = maxTokens * 4;
    return text.substring(0, maxChars - 3) + "...";
  }

  /**
   * Execute operation with retry logic and performance monitoring
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        const responseTime = Date.now() - startTime;

        // Record success metrics
        if (this.performanceMonitor) {
          this.performanceMonitor.recordSuccess(responseTime);
        }

        if (this.loggingService && attempt > 0) {
          this.loggingService.info('OpenAI request succeeded after retry', {
            attempt,
            responseTime,
            provider: this.getProviderName(),
          }, 'OpenAIProvider');
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const responseTime = Date.now() - startTime;

        // Check if this is a retryable error
        const isRetryable = this.isRetryableError(lastError);

        if (attempt === this.retryConfig.maxRetries || !isRetryable) {
          // Record failure metrics
          if (this.performanceMonitor) {
            this.performanceMonitor.recordFailure(responseTime, lastError.message);
          }

          if (this.loggingService) {
            this.loggingService.error('OpenAI request failed after all retries', {
              attempts: attempt + 1,
              error: lastError.message,
              responseTime,
              provider: this.getProviderName(),
            }, 'OpenAIProvider');
          }

          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);

        if (this.loggingService) {
          this.loggingService.warn('OpenAI request failed, retrying', {
            attempt: attempt + 1,
            maxRetries: this.retryConfig.maxRetries,
            delay,
            error: lastError.message,
            provider: this.getProviderName(),
          }, 'OpenAIProvider');
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Unknown error during retry execution');
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      // Retry on rate limits, server errors, and timeouts
      if (status === 429 || (status && status >= 500) || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        return true;
      }

      // Don't retry on authentication or client errors
      if (status === 401 || status === 403 || (status && status >= 400 && status < 500)) {
        return false;
      }
    }

    // Retry on network errors
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Get performance monitor instance
   */
  getPerformanceMonitor(): EmbeddingPerformanceMonitor | undefined {
    return this.performanceMonitor;
  }
}
