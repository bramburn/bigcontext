import { QdrantClient } from "@qdrant/js-client-rest";
import { CodeChunk } from "../parsing/chunker";
import { CentralizedLoggingService } from "../logging/centralizedLoggingService";
import * as fs from "fs/promises";
import * as path from "path";

export interface QdrantPoint {
  id: string | number;
  vector: number[];
  payload: {
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    type: string;
    name?: string;
    signature?: string;
    docstring?: string;
    language: string;
    metadata?: Record<string, any>;
    // New metadata for filtering
    fileType?: string;
    lastModified?: number;
  };
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface QdrantServiceConfig {
  connectionString: string;
  retryConfig?: RetryConfig;
  batchSize?: number;
  healthCheckIntervalMs?: number;
}

export interface SearchResult {
  id: string | number;
  score: number;
  payload: QdrantPoint["payload"];
}

export class QdrantService {
  private client: QdrantClient;
  private connectionString: string;
  private loggingService: CentralizedLoggingService;
  private retryConfig: RetryConfig;
  private batchSize: number;
  private healthCheckIntervalMs: number;
  private isHealthy: boolean = false;
  private lastHealthCheck: number = 0;

  /**
   * Constructor now accepts configuration object for better flexibility
   * This enables dependency injection and removes direct VS Code configuration access
   */
  constructor(
    config: QdrantServiceConfig,
    loggingService: CentralizedLoggingService,
  ) {
    this.connectionString = config.connectionString;
    this.loggingService = loggingService;
    this.retryConfig = config.retryConfig || {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    };
    this.batchSize = config.batchSize || 100;
    this.healthCheckIntervalMs = config.healthCheckIntervalMs || 30000; // 30 seconds

    this.client = new QdrantClient({
      host: this.extractHost(config.connectionString),
      port: this.extractPort(config.connectionString),
    });
  }

  private extractHost(connectionString: string): string {
    try {
      const url = new URL(connectionString);
      return url.hostname;
    } catch {
      return "localhost";
    }
  }

  private extractPort(connectionString: string): number {
    try {
      const url = new URL(connectionString);
      return parseInt(url.port) || 6333;
    } catch {
      return 6333;
    }
  }

  /**
   * Retry wrapper for operations with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.retryConfig.maxRetries) {
          this.loggingService.error(
            `${operationName} failed after ${this.retryConfig.maxRetries} retries`,
            { error: lastError.message, attempt },
            "QdrantService",
          );
          throw lastError;
        }

        const delay = Math.min(
          this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelayMs,
        );

        this.loggingService.warn(
          `${operationName} failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`,
          { error: lastError.message, delay, attempt },
          "QdrantService",
        );

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if Qdrant service is accessible with caching
   */
  async healthCheck(forceCheck: boolean = false): Promise<boolean> {
    const now = Date.now();

    // Use cached result if recent and not forcing check
    if (!forceCheck && this.isHealthy && (now - this.lastHealthCheck) < this.healthCheckIntervalMs) {
      return this.isHealthy;
    }

    try {
      await this.withRetry(
        () => this.client.getCollections(),
        "Health check",
      );
      this.isHealthy = true;
      this.lastHealthCheck = now;
      return true;
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = now;
      this.loggingService.error(
        "Qdrant health check failed",
        { error: error instanceof Error ? error.message : String(error) },
        "QdrantService",
      );
      return false;
    }
  }

  /**
   * Validate collection name according to Qdrant requirements
   */
  private validateCollectionName(collectionName: string): void {
    if (!collectionName || collectionName.length === 0) {
      throw new Error("Collection name cannot be empty");
    }

    if (collectionName.length > 255) {
      throw new Error("Collection name cannot exceed 255 characters");
    }

    // Qdrant collection names should only contain alphanumeric characters, hyphens, and underscores
    const validNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validNameRegex.test(collectionName)) {
      throw new Error("Collection name can only contain alphanumeric characters, hyphens, and underscores");
    }
  }

  /**
   * Create a collection if it doesn't exist with robust error handling
   */
  async createCollectionIfNotExists(
    collectionName: string,
    vectorSize: number = 768,
    distance: "Cosine" | "Dot" | "Euclid" = "Cosine",
  ): Promise<boolean> {
    try {
      // Validate inputs
      this.validateCollectionName(collectionName);

      if (vectorSize <= 0 || vectorSize > 65536) {
        throw new Error(`Invalid vector size: ${vectorSize}. Must be between 1 and 65536`);
      }

      // Check health first
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new Error("Qdrant service is not healthy");
      }

      // Check if collection exists with retry
      const collections = await this.withRetry(
        () => this.client.getCollections(),
        "Get collections",
      );

      const existingCollection = collections.collections?.find(
        (col) => col.name === collectionName,
      );

      if (existingCollection) {
        this.loggingService.info(
          `Collection '${collectionName}' already exists`,
          {},
          "QdrantService",
        );

        // Note: Some Qdrant client types for getCollections may not include config details.
        // We skip vector size validation here to maintain compatibility across versions.
        return true;
      }

      // Create new collection with retry
      await this.withRetry(
        () => this.client.createCollection(collectionName, {
          vectors: {
            size: vectorSize,
            distance: distance,
          },
        }),
        "Create collection",
      );

      this.loggingService.info(
        `Collection '${collectionName}' created successfully`,
        { vectorSize, distance },
        "QdrantService",
      );
      return true;
    } catch (error) {
      this.loggingService.error(
        `Failed to create collection '${collectionName}'`,
        {
          error: error instanceof Error ? error.message : String(error),
          vectorSize,
          distance,
        },
        "QdrantService",
      );
      return false;
    }
  }

  /**
   * Validate vector data
   */
  private validateVector(vector: number[], expectedSize?: number): void {
    if (!Array.isArray(vector)) {
      throw new Error("Vector must be an array");
    }

    if (vector.length === 0) {
      throw new Error("Vector cannot be empty");
    }

    if (expectedSize && vector.length !== expectedSize) {
      throw new Error(`Vector size mismatch: expected ${expectedSize}, got ${vector.length}`);
    }

    // Check for invalid values
    for (let i = 0; i < vector.length; i++) {
      const value = vector[i];
      if (typeof value !== 'number' || !isFinite(value)) {
        throw new Error(`Invalid vector value at index ${i}: ${value}`);
      }
    }
  }

  /**
   * Validate CodeChunk data
   */
  private validateChunk(chunk: CodeChunk): void {
    if (!chunk) {
      throw new Error("Chunk cannot be null or undefined");
    }

    if (!chunk.filePath || typeof chunk.filePath !== 'string') {
      throw new Error("Chunk must have a valid filePath");
    }

    if (!chunk.content || typeof chunk.content !== 'string') {
      throw new Error("Chunk must have valid content");
    }

    if (typeof chunk.startLine !== 'number' || chunk.startLine < 0) {
      throw new Error("Chunk must have a valid startLine");
    }

    if (typeof chunk.endLine !== 'number' || chunk.endLine < chunk.startLine) {
      throw new Error("Chunk must have a valid endLine");
    }

    if (!chunk.type || typeof chunk.type !== 'string') {
      throw new Error("Chunk must have a valid type");
    }

    if (!chunk.language || typeof chunk.language !== 'string') {
      throw new Error("Chunk must have a valid language");
    }
  }

  /**
   * Convert CodeChunk to QdrantPoint format with validation
   */
  private async chunkToPoint(
    chunk: CodeChunk,
    vector: number[],
    index: number,
    fileStats?: { fileType: string; lastModified: number },
  ): Promise<QdrantPoint> {
    this.validateChunk(chunk);
    this.validateVector(vector);

    let payload: QdrantPoint["payload"] = {
      filePath: chunk.filePath,
      content: chunk.content,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      type: chunk.type,
      language: chunk.language,
    };

    if (chunk.name !== undefined) {
      payload.name = chunk.name;
    }
    if (chunk.signature !== undefined) {
      payload.signature = chunk.signature;
    }
    if (chunk.docstring !== undefined) {
      payload.docstring = chunk.docstring;
    }
    if (chunk.metadata !== undefined) {
      payload.metadata = chunk.metadata;
    }

    // Add file metadata for filtering
    if (fileStats) {
      payload.fileType = fileStats.fileType;
      payload.lastModified = fileStats.lastModified;
    }

    return {
      id: `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}:${index}`,
      vector: vector,
      payload: payload,
    };
  }

  /**
   * Upsert chunks with their vectors into the collection with robust error handling
   */
  async upsertChunks(
    collectionName: string,
    chunks: CodeChunk[],
    vectors: number[][],
  ): Promise<boolean> {
    try {
      // Validate inputs
      this.validateCollectionName(collectionName);

      if (!Array.isArray(chunks) || !Array.isArray(vectors)) {
        throw new Error("Chunks and vectors must be arrays");
      }

      if (chunks.length === 0) {
        this.loggingService.info("No chunks to upsert", {}, "QdrantService");
        return true;
      }

      if (chunks.length !== vectors.length) {
        throw new Error(
          `Chunks count (${chunks.length}) doesn't match vectors count (${vectors.length})`,
        );
      }

      // Check health first
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new Error("Qdrant service is not healthy");
      }

      // Gather file statistics for metadata
      const fileStatsMap = new Map<string, { fileType: string; lastModified: number }>();

      for (const chunk of chunks) {
        if (!fileStatsMap.has(chunk.filePath)) {
          try {
            const stats = await fs.stat(chunk.filePath);
            const fileType = path.extname(chunk.filePath);
            fileStatsMap.set(chunk.filePath, {
              fileType,
              lastModified: stats.mtime.getTime(),
            });
          } catch (error) {
            // If we can't get file stats, continue without metadata
            this.loggingService.warn(
              `Could not get file stats for ${chunk.filePath}`,
              { error: error instanceof Error ? error.message : String(error) },
              "QdrantService",
            );
          }
        }
      }

      // Convert chunks to points with validation
      const points = await Promise.all(chunks.map(async (chunk, index) => {
        try {
          const fileStats = fileStatsMap.get(chunk.filePath);
          return await this.chunkToPoint(chunk, vectors[index], index, fileStats);
        } catch (error) {
          throw new Error(`Failed to convert chunk ${index}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }));

      this.loggingService.info(
        `Starting upsert of ${points.length} points to collection '${collectionName}'`,
        { totalPoints: points.length, batchSize: this.batchSize },
        "QdrantService",
      );

      // Upsert points in batches to avoid memory issues
      let successfulBatches = 0;
      const totalBatches = Math.ceil(points.length / this.batchSize);

      for (let i = 0; i < points.length; i += this.batchSize) {
        const batch = points.slice(i, i + this.batchSize);
        const batchNumber = Math.floor(i / this.batchSize) + 1;

        try {
          await this.withRetry(
            () => this.client.upsert(collectionName, {
              wait: true,
              points: batch,
            }),
            `Upsert batch ${batchNumber}`,
          );

          successfulBatches++;
          this.loggingService.debug(
            `Upserted batch ${batchNumber}/${totalBatches} (${batch.length} points)`,
            { batchNumber, totalBatches, batchSize: batch.length },
            "QdrantService",
          );
        } catch (error) {
          this.loggingService.error(
            `Failed to upsert batch ${batchNumber}/${totalBatches}`,
            {
              error: error instanceof Error ? error.message : String(error),
              batchNumber,
              batchSize: batch.length,
            },
            "QdrantService",
          );
          throw error;
        }
      }

      this.loggingService.info(
        `Successfully upserted ${points.length} chunks to collection '${collectionName}'`,
        {
          totalPoints: points.length,
          successfulBatches,
          totalBatches,
        },
        "QdrantService",
      );
      return true;
    } catch (error) {
      this.loggingService.error(
        `Failed to upsert chunks to collection '${collectionName}'`,
        {
          error: error instanceof Error ? error.message : String(error),
          chunksCount: chunks.length,
          vectorsCount: vectors.length,
        },
        "QdrantService",
      );
      return false;
    }
  }

  /**
   * Search for similar vectors in the collection with robust error handling
   */
  async search(
    collectionName: string,
    queryVector: number[],
    limit: number = 10,
    filter?: any,
  ): Promise<SearchResult[]> {
    try {
      // Validate inputs
      this.validateCollectionName(collectionName);

      if (limit <= 0 || limit > 10000) {
        throw new Error(`Invalid limit: ${limit}. Must be between 1 and 10000`);
      }

      // Validate query vector if provided (empty vector is allowed for filter-only searches)
      if (queryVector.length > 0) {
        this.validateVector(queryVector);
      }

      // Check health first
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new Error("Qdrant service is not healthy");
      }

      // Verify collection exists
      const collections = await this.withRetry(
        () => this.client.getCollections(),
        "Get collections for search",
      );

      const collectionExists = collections.collections?.some(
        (col) => col.name === collectionName,
      );

      if (!collectionExists) {
        throw new Error(`Collection '${collectionName}' does not exist`);
      }

      this.loggingService.debug(
        `Searching in collection '${collectionName}'`,
        {
          limit,
          hasFilter: !!filter,
          vectorSize: queryVector.length,
        },
        "QdrantService",
      );

      // Perform search with retry
      const searchResult = await this.withRetry(
        () => this.client.search(collectionName, {
          vector: queryVector,
          limit: limit,
          with_payload: true,
          filter: filter,
        }),
        "Search operation",
      );

      const results = searchResult.map((point) => ({
        id: point.id,
        score: point.score || 0,
        payload: point.payload as QdrantPoint["payload"],
      }));

      this.loggingService.debug(
        `Search completed in collection '${collectionName}'`,
        {
          resultsCount: results.length,
          limit,
          hasFilter: !!filter,
        },
        "QdrantService",
      );

      return results;
    } catch (error) {
      this.loggingService.error(
        `Search failed in collection '${collectionName}'`,
        {
          error: error instanceof Error ? error.message : String(error),
          limit,
          vectorSize: queryVector.length,
          hasFilter: !!filter,
        },
        "QdrantService",
      );
      return [];
    }
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<string[]> {
    try {
      const collections = await this.client.getCollections();
      return collections.collections?.map((col) => col.name) || [];
    } catch (error) {
      console.error("Failed to get collections:", error);
      return [];
    }
  }

  /**
   * Check if a collection exists
   */
  async collectionExists(collectionName: string): Promise<boolean> {
    try {
      const collections = await this.getCollections();
      return collections.includes(collectionName);
    } catch (error) {
      console.error(`Failed to check if collection '${collectionName}' exists:`, error);
      return false;
    }
  }

  /**
   * Delete all vectors associated with a specific file path
   *
   * This method removes all points from the collection that have a matching
   * filePath in their payload. It's used for incremental indexing when files
   * are deleted or updated.
   *
   * @param filePath - The file path to match for deletion
   * @returns Promise resolving to true if deletion was successful
   */
  async deleteVectorsForFile(filePath: string): Promise<boolean> {
    try {
      console.log(`QdrantService: Deleting vectors for file: ${filePath}`);

      // For now, we need to determine which collection to use
      // This is a simplified approach - in a real implementation,
      // we might need to search across collections or maintain collection metadata
      const collections = await this.getCollections();

      if (collections.length === 0) {
        console.warn(
          `QdrantService: No collections found, cannot delete vectors for file: ${filePath}`,
        );
        return false;
      }

      // Try to delete from all collections (in case the file exists in multiple)
      let deletedFromAny = false;

      for (const collectionName of collections) {
        try {
          // Use the delete points API with a filter to match the file path
          await this.client.delete(collectionName, {
            filter: {
              must: [
                {
                  key: "filePath",
                  match: {
                    value: filePath,
                  },
                },
              ],
            },
          });

          console.log(
            `QdrantService: Deleted vectors for file: ${filePath} from collection: ${collectionName}`,
          );
          deletedFromAny = true;
        } catch (error) {
          console.warn(
            `QdrantService: Failed to delete from collection '${collectionName}':`,
            error,
          );
          // Continue with other collections
        }
      }

      if (deletedFromAny) {
        console.log(
          `QdrantService: Successfully deleted vectors for file: ${filePath}`,
        );
        return true;
      } else {
        console.warn(`QdrantService: No vectors found for file: ${filePath}`);
        return false;
      }
    } catch (error) {
      console.error(
        `QdrantService: Failed to delete vectors for file '${filePath}':`,
        error,
      );
      return false;
    }
  }

  /**
   * Get information about a specific collection
   *
   * This method retrieves detailed information about a collection including
   * the number of points, vector dimensions, and other metadata.
   *
   * @param collectionName - The name of the collection to get info for
   * @returns Promise resolving to collection information or null if not found
   */
  async getCollectionInfo(collectionName: string): Promise<any | null> {
    try {
      console.log(
        `QdrantService: Getting collection info for: ${collectionName}`,
      );

      const collectionInfo = await this.client.getCollection(collectionName);

      if (collectionInfo) {
        console.log(
          `QdrantService: Retrieved info for collection: ${collectionName}`,
        );
        return collectionInfo;
      } else {
        console.warn(`QdrantService: Collection not found: ${collectionName}`);
        return null;
      }
    } catch (error) {
      console.error(
        `QdrantService: Failed to get collection info for '${collectionName}':`,
        error,
      );
      return null;
    }
  }

  /**
   * Delete an entire collection
   *
   * This method completely removes a collection and all its data from Qdrant.
   * This operation is irreversible and should be used with caution.
   *
   * @param collectionName - The name of the collection to delete
   * @returns Promise resolving to true if deletion was successful
   */
  async deleteCollection(collectionName: string): Promise<boolean> {
    try {
      console.log(`QdrantService: Deleting collection: ${collectionName}`);

      // Check if collection exists first
      const collections = await this.getCollections();
      if (!collections.includes(collectionName)) {
        console.warn(
          `QdrantService: Collection '${collectionName}' does not exist`,
        );
        return false;
      }

      // Delete the collection
      await this.client.deleteCollection(collectionName);

      console.log(
        `QdrantService: Successfully deleted collection: ${collectionName}`,
      );
      return true;
    } catch (error) {
      console.error(
        `QdrantService: Failed to delete collection '${collectionName}':`,
        error,
      );
      return false;
    }
  }

  /**
   * Get statistics for all collections
   *
   * This method retrieves summary statistics for all collections in the database,
   * useful for providing an overview of the index state.
   *
   * @returns Promise resolving to an array of collection statistics
   */
  async getAllCollectionStats(): Promise<
    Array<{ name: string; pointCount: number; vectorSize: number }>
  > {
    try {
      console.log("QdrantService: Getting statistics for all collections");

      const collections = await this.getCollections();
      const stats = [];

      for (const collectionName of collections) {
        try {
          const info = await this.getCollectionInfo(collectionName);
          if (info) {
            stats.push({
              name: collectionName,
              pointCount: info.points_count || 0,
              vectorSize: info.config?.params?.vectors?.size || 0,
            });
          }
        } catch (error) {
          console.warn(
            `QdrantService: Failed to get stats for collection '${collectionName}':`,
            error,
          );
        }
      }

      console.log(
        `QdrantService: Retrieved stats for ${stats.length} collections`,
      );
      return stats;
    } catch (error) {
      console.error(
        "QdrantService: Failed to get collection statistics:",
        error,
      );
      return [];
    }
  }
}
