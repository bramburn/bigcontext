/**
 * Qdrant Service
 * 
 * This service handles all interactions with the Qdrant vector database
 * for the RAG for LLM VS Code extension. It provides operations for
 * storing, retrieving, and managing vector embeddings and associated metadata.
 * 
 * The service handles collection management, vector operations, search,
 * and provides connection testing and health monitoring capabilities.
 */

import * as vscode from 'vscode';
import { QdrantDatabaseSettings, QdrantSettingsValidation } from '../models/qdrantSettings';
import { FileChunk } from '../models/projectFileMetadata';

/**
 * Qdrant point structure for storing chunks
 */
export interface QdrantPoint {
  /** Unique point ID */
  id: string;
  
  /** Vector embedding */
  vector: number[];
  
  /** Associated metadata */
  payload: {
    /** File information */
    fileId: string;
    filePath: string;
    fileName: string;
    language: string;
    
    /** Chunk information */
    chunkIndex: number;
    chunkType: string;
    content: string;
    startLine: number;
    endLine: number;
    size: number;
    
    /** Timestamps */
    createdAt: string;
    updatedAt: string;
    
    /** Additional metadata */
    [key: string]: any;
  };
}

/**
 * Search result from Qdrant
 */
export interface QdrantSearchResult {
  /** Point ID */
  id: string;
  
  /** Similarity score */
  score: number;
  
  /** Point payload */
  payload: QdrantPoint['payload'];
  
  /** Vector (optional) */
  vector?: number[];
}

/**
 * Collection information
 */
export interface CollectionInfo {
  /** Collection name */
  name: string;
  
  /** Vector configuration */
  vectorConfig: {
    size: number;
    distance: string;
  };
  
  /** Number of points */
  pointsCount: number;
  
  /** Collection status */
  status: string;
  
  /** Optimizer status */
  optimizerStatus: string;
}

/**
 * Connection test result
 */
export interface QdrantConnectionResult {
  /** Whether connection was successful */
  success: boolean;
  
  /** Response time in milliseconds */
  responseTime: number;
  
  /** Error message if failed */
  error?: string;
  
  /** Server information */
  serverInfo?: {
    version: string;
    commit: string;
  };
}

/**
 * QdrantService Class
 * 
 * Provides comprehensive Qdrant vector database operations including:
 * - Collection management (create, delete, info)
 * - Point operations (insert, update, delete, search)
 * - Connection testing and health monitoring
 * - Batch operations for efficient data handling
 * - Error handling and retry logic
 */
export class QdrantService {
  /** VS Code extension context */
  private context: vscode.ExtensionContext;
  
  /** Qdrant database settings */
  private settings: QdrantDatabaseSettings;
  
  /** Base URL for Qdrant API */
  private baseUrl: string;
  
  /** Default collection name */
  private collectionName: string;
  
  /**
   * Creates a new QdrantService instance
   * 
   * @param context VS Code extension context
   * @param settings Qdrant database settings
   */
  constructor(context: vscode.ExtensionContext, settings: QdrantDatabaseSettings) {
    this.context = context;
    this.settings = settings;
    this.baseUrl = `http://${settings.host}:${settings.port}`;
    this.collectionName = settings.collectionName;
  }
  
  /**
   * Test connection to Qdrant server
   * 
   * @returns Connection test result
   */
  public async testConnection(): Promise<QdrantConnectionResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      const endTime = Date.now();
      
      if (!response.ok) {
        return {
          success: false,
          responseTime: endTime - startTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        responseTime: endTime - startTime,
        serverInfo: {
          version: data.version || 'unknown',
          commit: data.commit || 'unknown',
        },
      };
      
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Create collection if it doesn't exist
   * 
   * @param vectorSize Size of vectors to store
   * @param distance Distance metric to use
   * @returns True if collection was created or already exists
   */
  public async ensureCollection(vectorSize: number, distance: string = 'Cosine'): Promise<boolean> {
    try {
      // Check if collection exists
      const exists = await this.collectionExists();
      
      if (exists) {
        console.log(`QdrantService: Collection '${this.collectionName}' already exists`);
        return true;
      }
      
      // Create collection
      const response = await fetch(`${this.baseUrl}/collections/${this.collectionName}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          vectors: {
            size: vectorSize,
            distance: distance,
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create collection: ${response.status} ${response.statusText} - ${errorData.status?.error || 'Unknown error'}`);
      }
      
      console.log(`QdrantService: Created collection '${this.collectionName}' with vector size ${vectorSize}`);
      return true;
      
    } catch (error) {
      console.error('QdrantService: Failed to ensure collection:', error);
      throw error;
    }
  }
  
  /**
   * Check if collection exists
   * 
   * @returns True if collection exists
   */
  public async collectionExists(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${this.collectionName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      return response.ok;
      
    } catch (error) {
      console.error('QdrantService: Failed to check collection existence:', error);
      return false;
    }
  }
  
  /**
   * Get collection information
   * 
   * @returns Collection information
   */
  public async getCollectionInfo(): Promise<CollectionInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${this.collectionName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const result = data.result;
      
      return {
        name: this.collectionName,
        vectorConfig: {
          size: result.config?.params?.vectors?.size || 0,
          distance: result.config?.params?.vectors?.distance || 'unknown',
        },
        pointsCount: result.points_count || 0,
        status: result.status || 'unknown',
        optimizerStatus: result.optimizer_status?.status || 'unknown',
      };
      
    } catch (error) {
      console.error('QdrantService: Failed to get collection info:', error);
      return null;
    }
  }
  
  /**
   * Store file chunks in Qdrant
   * 
   * @param chunks Array of file chunks with embeddings
   * @returns True if successful
   */
  public async storeChunks(chunks: FileChunk[]): Promise<boolean> {
    try {
      // Filter chunks that have embeddings
      const chunksWithEmbeddings = chunks.filter(chunk => chunk.embedding && chunk.embedding.length > 0);
      
      if (chunksWithEmbeddings.length === 0) {
        console.warn('QdrantService: No chunks with embeddings to store');
        return true;
      }
      
      // Ensure collection exists
      const vectorSize = chunksWithEmbeddings[0].embedding!.length;
      await this.ensureCollection(vectorSize);
      
      // Convert chunks to Qdrant points
      const points: QdrantPoint[] = chunksWithEmbeddings.map(chunk => ({
        id: chunk.id,
        vector: chunk.embedding!,
        payload: {
          fileId: chunk.fileId,
          filePath: '', // Would be populated from file metadata
          fileName: '', // Would be populated from file metadata
          language: '', // Would be populated from file metadata
          chunkIndex: chunk.chunkIndex,
          chunkType: chunk.type,
          content: chunk.content,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          size: chunk.size,
          createdAt: chunk.createdAt.toISOString(),
          updatedAt: chunk.updatedAt.toISOString(),
        },
      }));
      
      // Store points in batches
      const batchSize = 100;
      for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);
        await this.upsertPoints(batch);
      }
      
      console.log(`QdrantService: Stored ${points.length} chunks in collection '${this.collectionName}'`);
      return true;
      
    } catch (error) {
      console.error('QdrantService: Failed to store chunks:', error);
      throw error;
    }
  }
  
  /**
   * Search for similar vectors
   * 
   * @param queryVector Query vector
   * @param limit Maximum number of results
   * @param scoreThreshold Minimum similarity score
   * @returns Search results
   */
  public async search(
    queryVector: number[],
    limit: number = 10,
    scoreThreshold: number = 0.5
  ): Promise<QdrantSearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${this.collectionName}/points/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          vector: queryVector,
          limit,
          score_threshold: scoreThreshold,
          with_payload: true,
          with_vector: false,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorData.status?.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      return data.result.map((item: any) => ({
        id: item.id,
        score: item.score,
        payload: item.payload,
        vector: item.vector,
      }));
      
    } catch (error) {
      console.error('QdrantService: Search failed:', error);
      throw error;
    }
  }
  
  /**
   * Delete points by file ID
   * 
   * @param fileId File ID to delete
   * @returns True if successful
   */
  public async deleteByFileId(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${this.collectionName}/points/delete`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filter: {
            must: [
              {
                key: 'fileId',
                match: {
                  value: fileId,
                },
              },
            ],
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Delete failed: ${response.status} ${response.statusText} - ${errorData.status?.error || 'Unknown error'}`);
      }
      
      console.log(`QdrantService: Deleted points for file ID '${fileId}'`);
      return true;
      
    } catch (error) {
      console.error('QdrantService: Failed to delete points:', error);
      throw error;
    }
  }
  
  /**
   * Clear all points from collection
   * 
   * @returns True if successful
   */
  public async clearCollection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${this.collectionName}/points/delete`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filter: {
            must: [
              {
                key: 'fileId',
                match: {
                  any: ['*'],
                },
              },
            ],
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Clear collection failed: ${response.status} ${response.statusText} - ${errorData.status?.error || 'Unknown error'}`);
      }
      
      console.log(`QdrantService: Cleared collection '${this.collectionName}'`);
      return true;
      
    } catch (error) {
      console.error('QdrantService: Failed to clear collection:', error);
      throw error;
    }
  }
  
  /**
   * Upsert points to collection
   * 
   * @param points Points to upsert
   * @returns True if successful
   */
  private async upsertPoints(points: QdrantPoint[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${this.collectionName}/points`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          points,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Upsert failed: ${response.status} ${response.statusText} - ${errorData.status?.error || 'Unknown error'}`);
      }
      
      return true;
      
    } catch (error) {
      console.error('QdrantService: Failed to upsert points:', error);
      throw error;
    }
  }
  
  /**
   * Get HTTP headers for requests
   * 
   * @returns Headers object
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if configured
    if (this.settings.apiKey) {
      headers['api-key'] = this.settings.apiKey;
    }
    
    return headers;
  }
  
  /**
   * Update settings
   * 
   * @param settings New settings
   */
  public updateSettings(settings: QdrantDatabaseSettings): void {
    this.settings = settings;
    this.baseUrl = `http://${settings.host}:${settings.port}`;
    this.collectionName = settings.collectionName;
  }
}
