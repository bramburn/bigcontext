import { QdrantClient } from '@qdrant/js-client-rest';
import { CodeChunk } from '../parsing/chunker';

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
    payload: QdrantPoint['payload'];
}

export class QdrantService {
    private client: QdrantClient;
    private connectionString: string;

    /**
     * Constructor now accepts connectionString as a required parameter
     * This enables dependency injection and removes direct VS Code configuration access
     */
    constructor(connectionString: string) {
        this.connectionString = connectionString;
        this.client = new QdrantClient({
            host: this.extractHost(connectionString),
            port: this.extractPort(connectionString)
        });
    }

    private extractHost(connectionString: string): string {
        try {
            const url = new URL(connectionString);
            return url.hostname;
        } catch {
            return 'localhost';
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
            console.error('Qdrant health check failed:', error);
            return false;
        }
    }

    /**
     * Create a collection if it doesn't exist
     */
    async createCollectionIfNotExists(
        collectionName: string, 
        vectorSize: number = 768, 
        distance: 'Cosine' | 'Dot' | 'Euclid' = 'Cosine'
    ): Promise<boolean> {
        try {
            // Check if collection exists
            const collections = await this.client.getCollections();
            const existingCollection = collections.collections?.find(
                col => col.name === collectionName
            );

            if (existingCollection) {
                console.log(`Collection '${collectionName}' already exists`);
                return true;
            }

            // Create new collection
            await this.client.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: distance
                }
            });

            console.log(`Collection '${collectionName}' created successfully`);
            return true;
        } catch (error) {
            console.error(`Failed to create collection '${collectionName}':`, error);
            return false;
        }
    }

    /**
     * Convert CodeChunk to QdrantPoint format
     */
    private chunkToPoint(chunk: CodeChunk, vector: number[], index: number): QdrantPoint {
        return {
            id: `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}:${index}`,
            vector: vector,
            payload: {
                filePath: chunk.filePath,
                content: chunk.content,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                type: chunk.type,
                name: chunk.name,
                signature: chunk.signature,
                docstring: chunk.docstring,
                language: chunk.language,
                metadata: chunk.metadata
            }
        };
    }

    /**
     * Upsert chunks with their vectors into the collection
     */
    async upsertChunks(
        collectionName: string, 
        chunks: CodeChunk[], 
        vectors: number[][]
    ): Promise<boolean> {
        try {
            if (chunks.length !== vectors.length) {
                throw new Error(`Chunks count (${chunks.length}) doesn't match vectors count (${vectors.length})`);
            }

            // Convert chunks to points
            const points = chunks.map((chunk, index) => 
                this.chunkToPoint(chunk, vectors[index], index)
            );

            // Upsert points in batches to avoid memory issues
            const batchSize = 100;
            for (let i = 0; i < points.length; i += batchSize) {
                const batch = points.slice(i, i + batchSize);
                
                await this.client.upsert(collectionName, {
                    wait: true,
                    points: batch
                });

                console.log(`Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)} (${batch.length} points)`);
            }

            console.log(`Successfully upserted ${points.length} chunks to collection '${collectionName}'`);
            return true;
        } catch (error) {
            console.error(`Failed to upsert chunks to collection '${collectionName}':`, error);
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
        filter?: any
    ): Promise<SearchResult[]> {
        try {
            const searchResult = await this.client.search(collectionName, {
                vector: queryVector,
                limit: limit,
                with_payload: true,
                filter: filter
            });

            return searchResult.map(point => ({
                id: point.id,
                score: point.score || 0,
                payload: point.payload as QdrantPoint['payload']
            }));
        } catch (error) {
            console.error(`Search failed in collection '${collectionName}':`, error);
            return [];
        }
    }

    /**
     * Get collection info
     */
    async getCollectionInfo(collectionName: string): Promise<any> {
        try {
            return await this.client.getCollection(collectionName);
        } catch (error) {
            console.error(`Failed to get collection info for '${collectionName}':`, error);
            return null;
        }
    }

    /**
     * Delete collection
     */
    async deleteCollection(collectionName: string): Promise<boolean> {
        try {
            await this.client.deleteCollection(collectionName);
            console.log(`Collection '${collectionName}' deleted successfully`);
            return true;
        } catch (error) {
            console.error(`Failed to delete collection '${collectionName}':`, error);
            return false;
        }
    }

    /**
     * Get all collections
     */
    async getCollections(): Promise<string[]> {
        try {
            const collections = await this.client.getCollections();
            return collections.collections?.map(col => col.name) || [];
        } catch (error) {
            console.error('Failed to get collections:', error);
            return [];
        }
    }
}
