import axios, { AxiosInstance } from "axios";
import { IEmbeddingProvider, EmbeddingConfig } from "./embeddingProvider";

/**
 * Ollama embedding provider implementation
 *
 * This class provides an implementation of the IEmbeddingProvider interface for
 * Ollama, a local open-source large language model runner. It allows users to
 * generate embeddings locally without relying on external APIs, providing better
 * privacy and potentially lower latency for local development workflows.
 *
 * Ollama embeddings are particularly useful for:
 * - Local development environments without internet access
 * - Privacy-sensitive applications where data shouldn't leave the local machine
 * - Applications requiring offline capabilities
 * - Cost-sensitive projects where API costs are a concern
 */
export class OllamaProvider implements IEmbeddingProvider {
  /** HTTP client for making API requests to Ollama */
  private client: AxiosInstance;

  /** The name of the embedding model to use */
  private model: string;

  /** Base URL of the Ollama service (default: localhost:11434) */
  private baseUrl: string;

  /** Maximum number of chunks to process in a single batch (default: 10) */
  private maxBatchSize: number;

  /** Request timeout in milliseconds (default: 30000) */
  private timeout: number;

  /**
   * Initialize the Ollama embedding provider
   *
   * @param config - Configuration object for the Ollama provider
   *
   * The constructor sets up the HTTP client with appropriate configuration
   * and validates that the necessary parameters are provided. It uses
   * sensible defaults for most parameters while allowing customization
   * through the configuration object.
   */
  constructor(config: EmbeddingConfig) {
    // Set model with fallback to a popular default
    this.model = config.model || "nomic-embed-text";

    // Set base URL with fallback to local Ollama default
    this.baseUrl = config.apiUrl || "http://localhost:11434";

    // Set batch size with conservative default to avoid overwhelming local service
    this.maxBatchSize = config.maxBatchSize || 10;

    // Set timeout with reasonable default for local operations
    this.timeout = config.timeout || 30000;

    // Configure HTTP client for Ollama API communication
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Generate embeddings for an array of text chunks
   *
   * This method processes text chunks in batches to optimize performance
   * and avoid overwhelming the local Ollama service. It implements robust
   * error handling to ensure that partial failures don't break the entire
   * embedding generation process.
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

    // Process chunks in batches to avoid overwhelming the local API
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
        `Ollama embedding generation completed with ${errors.length} errors`,
      );
    }

    return embeddings;
  }

  /**
   * Process a batch of text chunks for embedding generation
   *
   * This private method handles the actual API communication with Ollama.
   * Unlike some other providers, Ollama typically processes one embedding
   * at a time, so this method loops through each chunk in the batch.
   *
   * @param chunks - Array of text chunks to process
   * @returns Promise resolving to array of embedding vectors
   * @throws Error if the API request fails or returns invalid data
   *
   * The method includes comprehensive error handling for common issues
   * like connection problems, missing models, and API errors.
   */
  private async processBatch(chunks: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Ollama API typically processes one embedding at a time
    // Loop through each chunk and make individual API calls
    for (const chunk of chunks) {
      try {
        const response = await this.client.post("/api/embeddings", {
          model: this.model,
          prompt: chunk,
        });

        // Validate response format and extract embedding
        if (response.data && response.data.embedding) {
          embeddings.push(response.data.embedding);
        } else {
          throw new Error("Invalid response format from Ollama API");
        }
      } catch (error) {
        // Handle specific error cases with helpful messages
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new Error(
              `Model '${this.model}' not found. Please pull the model first: ollama pull ${this.model}`,
            );
          } else if (error.code === "ECONNREFUSED") {
            throw new Error(
              "Cannot connect to Ollama. Please ensure Ollama is running on " +
                this.baseUrl,
            );
          } else {
            throw new Error(
              `Ollama API error: ${error.response?.data?.error || error.message}`,
            );
          }
        } else {
          throw error;
        }
      }
    }

    return embeddings;
  }

  /**
   * Get the dimension size of embeddings for the current model
   *
   * Different embedding models produce vectors of different dimensions.
   * This method uses a lookup table for common Ollama models and falls
   * back to a reasonable default for unknown models.
   *
   * @returns The vector dimension size (e.g., 768 for nomic-embed-text)
   */
  getDimensions(): number {
    // Common dimensions for popular Ollama embedding models
    const modelDimensions: Record<string, number> = {
      "nomic-embed-text": 768,
      "all-minilm": 384,
      "sentence-transformers/all-MiniLM-L6-v2": 384,
      "mxbai-embed-large": 1024,
    };

    // Return known dimension or default to 768 for unknown models
    return modelDimensions[this.model] || 768;
  }

  /**
   * Get the provider name identifier
   *
   * This method returns a unique identifier that includes both the
   * provider type and the specific model being used, useful for
   * logging, debugging, and display purposes.
   *
   * @returns Provider name in format "ollama:model-name"
   */
  getProviderName(): string {
    return `ollama:${this.model}`;
  }

  /**
   * Check if the Ollama service and model are available
   *
   * This method performs two checks:
   * 1. Verifies that the Ollama service is running and accessible
   * 2. Confirms that the specified embedding model is available
   *
   * @returns Promise resolving to true if both service and model are available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // First check: Verify Ollama service is running
      const response = await this.client.get("/api/tags");

      // Second check: Verify the specific model is available
      if (response.data && response.data.models) {
        const modelExists = response.data.models.some(
          (model: any) =>
            model.name === this.model ||
            model.name.startsWith(this.model + ":"),
        );

        if (!modelExists) {
          console.warn(
            `Model '${this.model}' not found in Ollama. Available models:`,
            response.data.models.map((m: any) => m.name),
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      // Provide specific error messages for common connection issues
      if (axios.isAxiosError(error) && error.code === "ECONNREFUSED") {
        console.error("Ollama is not running. Please start Ollama service.");
      } else {
        console.error("Failed to check Ollama availability:", error);
      }
      return false;
    }
  }

  /**
   * Get list of available models from the Ollama service
   *
   * This method queries the Ollama service to get a list of all
   * currently available models. This can be useful for UI components
   * that need to show users what models they can use.
   *
   * @returns Promise resolving to array of available model names
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get("/api/tags");
      if (response.data && response.data.models) {
        return response.data.models.map((model: any) => model.name);
      }
      return [];
    } catch (error) {
      console.error("Failed to get available models:", error);
      return [];
    }
  }

  /**
   * Pull a model from the Ollama registry
   *
   * This method allows the application to automatically download and
   * install models from the Ollama registry if they're not already
   * available locally. This provides a better user experience by
   * handling model management automatically.
   *
   * @param modelName - The name of the model to pull
   * @returns Promise resolving to true if the model was successfully pulled
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      console.log(`Pulling model '${modelName}' from Ollama...`);
      await this.client.post("/api/pull", {
        name: modelName,
      });
      console.log(`Model '${modelName}' pulled successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to pull model '${modelName}':`, error);
      return false;
    }
  }
}
