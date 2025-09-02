import { QdrantClient } from "@qdrant/js-client-rest";
import { CodeChunk } from "../parsing/chunker";
import { CentralizedLoggingService } from "../logging/centralizedLoggingService";

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
  };
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

  /**
   * Constructor now accepts connectionString and loggingService as required parameters
   * This enables dependency injection and removes direct VS Code configuration access
   */
  constructor(
    connectionString: string,
    loggingService: CentralizedLoggingService,
  ) {
    this.connectionString = connectionString;
    this.loggingService = loggingService;
    this.client = new QdrantClient({
      host: this.extractHost(connectionString),
      port: this.extractPort(connectionString),
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
   * Check if Qdrant service is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      this.loggingService.error(
        "Qdrant health check failed",
        { error: error instanceof Error ? error.message : String(error) },
        "QdrantService",
      );
      return false;
    }
  }

  /**
   * Create a collection if it doesn't exist
   */
  async createCollectionIfNotExists(
    collectionName: string,
    vectorSize: number = 768,
    distance: "Cosine" | "Dot" | "Euclid" = "Cosine",
  ): Promise<boolean> {
    try {
      console.log(`QdrantService: Checking if collection '${collectionName}' exists...`);

      // Check if collection exists
      const collections = await this.client.getCollections();
      console.log(`QdrantService: Found ${collections.collections?.length || 0} existing collections`);

      const existingCollection = collections.collections?.find(
        (col) => col.name === collectionName,
      );

      if (existingCollection) {
        this.loggingService.info(
          `Collection '${collectionName}' already exists`,
          { vectorSize: existingCollection.config?.params?.vectors },
          "QdrantService",
        );
        console.log(`QdrantService: Collection '${collectionName}' already exists`);
        return true;
      }

      console.log(`QdrantService: Creating collection '${collectionName}' with vector size ${vectorSize} and distance ${distance}`);

      // Create new collection
      const createResult = await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: distance,
        },
      });

      console.log(`QdrantService: Collection creation result:`, createResult);

      this.loggingService.info(
        `Collection '${collectionName}' created successfully`,
        { vectorSize, distance },
        "QdrantService",
      );
      return true;
    } catch (error) {
      console.error(`QdrantService: Failed to create collection '${collectionName}':`, error);
      this.loggingService.error(
        `Failed to create collection '${collectionName}'`,
        {
          error: error instanceof Error ? error.message : String(error),
          vectorSize,
          distance,
          stack: error instanceof Error ? error.stack : undefined
        },
        "QdrantService",
      );
      return false;
    }
  }

  /**
   * Convert CodeChunk to QdrantPoint format
   */
  private chunkToPoint(
    chunk: CodeChunk,
    vector: number[],
    index: number,
  ): QdrantPoint {
    // Validate vector data
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error(`Invalid vector for chunk ${chunk.filePath}:${chunk.startLine}-${chunk.endLine}`);
    }

    // Check for NaN or infinite values
    if (vector.some(v => !isFinite(v))) {
      throw new Error(`Vector contains NaN or infinite values for chunk ${chunk.filePath}:${chunk.startLine}-${chunk.endLine}`);
    }

    // Create payload with only defined values to avoid undefined in JSON
    const payload: any = {
      filePath: chunk.filePath,
      content: chunk.content,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      type: chunk.type,
      language: chunk.language,
    };

    // Only add optional fields if they are defined
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

    return {
      id: `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}:${index}`,
      vector: vector,
      payload: payload,
    };
  }

  /**
   * Upsert chunks with their vectors into the collection
   */
  async upsertChunks(
    collectionName: string,
    chunks: CodeChunk[],
    vectors: number[][],
  ): Promise<boolean> {
    try {
      if (chunks.length !== vectors.length) {
        throw new Error(
          `Chunks count (${chunks.length}) doesn't match vectors count (${vectors.length})`,
        );
      }

      // Convert chunks to points
      const points = chunks.map((chunk, index) =>
        this.chunkToPoint(chunk, vectors[index], index),
      );

      // Upsert points in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);

        try {
          // Log the first point for debugging
          if (i === 0) {
            console.log("First point structure:", JSON.stringify(batch[0], null, 2));
            console.log("Vector length:", batch[0].vector.length);
            console.log("Vector sample:", batch[0].vector.slice(0, 5));
          }

          await this.client.upsert(collectionName, {
            wait: true,
            points: batch,
          });

          console.log(
            `Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)} (${batch.length} points)`,
          );
        } catch (error) {
          console.error(
            `Failed to upsert batch ${Math.floor(i / batchSize) + 1}:`,
            error,
          );
          console.error("Sample point from failed batch:", JSON.stringify(batch[0], null, 2));
          console.error("Vector details:", {
            length: batch[0].vector.length,
            sample: batch[0].vector.slice(0, 10),
            hasNaN: batch[0].vector.some(v => isNaN(v)),
            hasInfinity: batch[0].vector.some(v => !isFinite(v))
          });
          throw error;
        }
      }

      console.log(
        `Successfully upserted ${points.length} chunks to collection '${collectionName}'`,
      );
      return true;
    } catch (error) {
      console.error(
        `Failed to upsert chunks to collection '${collectionName}':`,
        error,
      );
      return false;
    }
  }

  /**
   * Search for similar vectors in the collection
   */
  async search(
    collectionName: string,
    queryVector: number[],
    limit: number = 10,
    filter?: any,
  ): Promise<SearchResult[]> {
    try {
      const searchResult = await this.client.search(collectionName, {
        vector: queryVector,
        limit: limit,
        with_payload: true,
        filter: filter,
      });

      return searchResult.map((point) => ({
        id: point.id,
        score: point.score || 0,
        payload: point.payload as QdrantPoint["payload"],
      }));
    } catch (error) {
      console.error(`Search failed in collection '${collectionName}':`, error);
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
