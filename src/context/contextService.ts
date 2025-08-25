/**
 * Context Service Module
 * 
 * This module provides a service for managing and querying code context within a VS Code workspace.
 * It leverages vector embeddings and similarity search to find related code chunks and files,
 * enabling semantic code navigation and contextual understanding of codebases.
 * 
 * The service integrates with:
 * - QdrantService for vector database operations
 * - EmbeddingProvider for generating semantic embeddings
 * - IndexingService for processing and indexing code files
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { IndexingService } from '../indexing/indexingService';
import { QdrantService, SearchResult } from '../db/qdrantService';
import { IEmbeddingProvider } from '../embeddings/embeddingProvider';

/**
 * Represents the result of a file content retrieval operation
 * 
 * @property filePath - Path to the file that was retrieved
 * @property content - The text content of the file
 * @property language - Programming language of the file (derived from extension)
 * @property size - File size in bytes
 * @property lastModified - Last modification timestamp
 * @property relatedChunks - Optional array of semantically related code chunks from the same file
 */
export interface FileContentResult {
    filePath: string;
    content: string;
    language?: string;
    size: number;
    lastModified: Date;
    relatedChunks?: SearchResult[];
}

/**
 * Represents a file that is semantically related to a query or another file
 * 
 * @property filePath - Path to the related file
 * @property similarity - Similarity score (0-1) indicating relevance
 * @property reason - Human-readable explanation of why this file is related
 * @property chunkCount - Number of code chunks that matched the query
 * @property language - Programming language of the file
 */
export interface RelatedFile {
    filePath: string;
    similarity: number;
    reason: string;
    chunkCount: number;
    language?: string;
}

/**
 * Parameters for performing a context query
 * 
 * @property query - The search query text
 * @property filePath - Optional current file path for context
 * @property includeRelated - Whether to include related files in results
 * @property maxResults - Maximum number of results to return
 * @property minSimilarity - Minimum similarity threshold (0-1)
 * @property fileTypes - Optional array of file types to filter by
 */
export interface ContextQuery {
    query: string;
    filePath?: string;
    includeRelated?: boolean;
    maxResults?: number;
    minSimilarity?: number;
    fileTypes?: string[];
}

/**
 * Results of a context query operation
 * 
 * @property query - The original search query
 * @property results - Array of matching code chunks
 * @property relatedFiles - Array of related files
 * @property totalResults - Total number of results found
 * @property processingTime - Time taken to process the query in milliseconds
 */
export interface ContextResult {
    query: string;
    results: SearchResult[];
    relatedFiles: RelatedFile[];
    totalResults: number;
    processingTime: number;
}

/**
 * Core service for managing and querying code context
 * 
 * This service provides methods for:
 * - Retrieving file content with related chunks
 * - Finding files related to a query or current file
 * - Performing semantic searches across the codebase
 * - Checking service status and readiness
 */
export class ContextService {
    private workspaceRoot: string;
    private indexingService: IndexingService;
    private qdrantService: QdrantService;
    private embeddingProvider: IEmbeddingProvider;
    
    // Configuration constants
    private readonly DEFAULT_CHUNK_LIMIT = 50;
    private readonly DEFAULT_RELATED_FILES_LIMIT = 10;
    
    /**
     * Creates an empty context result object
     * Helper method to reduce code duplication
     * 
     * @param query - The original query string
     * @param startTime - Optional start time for calculating processing time
     * @returns An empty ContextResult object
     */
    private createEmptyResult(query: string, startTime?: number): ContextResult {
        return {
            query: query,
            results: [],
            relatedFiles: [],
            totalResults: 0,
            processingTime: startTime ? Date.now() - startTime : 0
        };
    }

    /**
     * Constructor now uses dependency injection for better testability and decoupling
     * 
     * @param workspaceRoot - The workspace root path
     * @param qdrantService - Injected QdrantService instance
     * @param embeddingProvider - Injected embedding provider instance
     * @param indexingService - Injected IndexingService instance
     */
    constructor(
        workspaceRoot: string,
        qdrantService: QdrantService,
        embeddingProvider: IEmbeddingProvider,
        indexingService: IndexingService
    ) {
        this.workspaceRoot = workspaceRoot;
        this.qdrantService = qdrantService;
        this.embeddingProvider = embeddingProvider;
        this.indexingService = indexingService;
    }

    /**
     * Generates a unique collection name for the current workspace
     * 
     * The collection name is derived from the workspace folder name,
     * sanitized to ensure compatibility with Qdrant naming requirements.
     * 
     * @returns A sanitized collection name string
     */
    /**
     * Generates a unique collection name for the current workspace
     * 
     * The collection name is derived from the workspace folder name,
     * sanitized to ensure compatibility with Qdrant naming requirements.
     * Uses path module for cross-platform compatibility.
     * 
     * @returns A sanitized collection name string
     */
    private generateCollectionName(): string {
        const workspaceName = path.basename(this.workspaceRoot) || 'workspace';
        const sanitizedName = workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        return `code_context_${sanitizedName}`;
    }

    /**
     * Retrieves file content with optional related chunks
     * 
     * @param filePath - Path to the file to retrieve
     * @param includeRelatedChunks - Whether to include semantically related chunks from the same file
     * @returns Promise resolving to file content and metadata
     * @throws Error if file cannot be read or processed
     */
    async getFileContent(filePath: string, includeRelatedChunks: boolean = false): Promise<FileContentResult> {
        try {
            // Resolve absolute path
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);
            const uri = vscode.Uri.file(absolutePath);

            // Read file content
            const fileData = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(fileData).toString('utf8');

            // Get file stats
            const stats = await vscode.workspace.fs.stat(uri);
            
            // Check file size to prevent memory issues with very large files
            const MAX_SAFE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            if (stats.size > MAX_SAFE_FILE_SIZE) {
                console.warn(`Large file detected (${(stats.size / 1024 / 1024).toFixed(2)}MB): ${filePath}`);
            }
            
            // Determine language from file extension
            const language = this.getLanguageFromPath(filePath);

            const result: FileContentResult = {
                filePath: filePath,
                content: content,
                language: language,
                size: stats.size,
                lastModified: new Date(stats.mtime)
            };

            // Optionally include related chunks
            if (includeRelatedChunks) {
                if (!this.embeddingProvider) {
                    console.warn('Embedding provider not available, cannot include related chunks');
                } else {
                    // Search for chunks from this file
                    const collectionName = this.generateCollectionName();
                    const searchResults = await this.qdrantService.search(
                        collectionName,
                        [], // Empty vector, we'll use filter instead
                        this.DEFAULT_CHUNK_LIMIT,
                        {
                            must: [
                                {
                                    key: 'filePath',
                                    match: { value: filePath }
                                }
                            ]
                        }
                    );
                    result.relatedChunks = searchResults;
                }
            }

            return result;
        } catch (error) {
            console.error(`Failed to get file content for ${filePath}:`, error);
            throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Finds files related to a query or current file
     * 
     * This method performs semantic search to find files that are conceptually
     * related to the provided query. It groups results by file and calculates
     * file-level similarity scores.
     * 
     * @param query - The search query text
     * @param currentFilePath - Optional current file path to exclude from results
     * @param maxResults - Maximum number of related files to return
     * @param minSimilarity - Minimum similarity threshold (0-1)
     * @returns Promise resolving to array of related files
     */
    async findRelatedFiles(
        query: string,
        currentFilePath?: string,
        maxResults?: number,
        minSimilarity?: number
    ): Promise<RelatedFile[]> {
        // Get configuration values with fallbacks
        const config = vscode.workspace.getConfiguration('code-context-engine');
        maxResults = maxResults ?? config.get<number>('maxSearchResults') ?? 10;
        minSimilarity = minSimilarity ?? config.get<number>('minSimilarityThreshold') ?? 0.5;
        try {
            if (!this.embeddingProvider) {
                throw new Error('Embedding provider not available');
            }

            // Generate embedding for the query
            const queryEmbeddings = await this.embeddingProvider.generateEmbeddings([query]);
            if (queryEmbeddings.length === 0) {
                return [];
            }

            const collectionName = this.generateCollectionName();
            
            // Search for similar chunks - get 3x results to ensure good file coverage
            const searchResults = await this.qdrantService.search(
                collectionName,
                queryEmbeddings[0],
                maxResults * 3 // Get more results to group by file
            );

            // Group results by file and calculate file-level similarity
            const fileGroups = new Map<string, {
                chunks: SearchResult[];
                maxScore: number;
                avgScore: number;
                language?: string;
            }>();

            // Process search results and group by file path
            for (const result of searchResults) {
                // Skip results below similarity threshold
                if (result.score < minSimilarity) continue;
                // Skip current file if provided
                if (currentFilePath && result.payload.filePath === currentFilePath) continue;

                const filePath = result.payload.filePath;
                // Initialize group if this is the first chunk for this file
                if (!fileGroups.has(filePath)) {
                    fileGroups.set(filePath, {
                        chunks: [],
                        maxScore: 0,
                        avgScore: 0,
                        language: result.payload.language
                    });
                }

                // Add chunk to file group and update max score
                const group = fileGroups.get(filePath)!;
                group.chunks.push(result);
                group.maxScore = Math.max(group.maxScore, result.score);
            }

            // Calculate average scores and create RelatedFile objects
            const relatedFiles: RelatedFile[] = [];
            for (const [filePath, group] of fileGroups) {
                // Calculate average similarity score across all chunks
                group.avgScore = group.chunks.reduce((sum, chunk) => sum + chunk.score, 0) / group.chunks.length;
                
                // Generate human-readable reason for the relation
                const topChunk = group.chunks[0];
                const reason = this.generateRelationReason(topChunk, group.chunks.length);

                relatedFiles.push({
                    filePath: filePath,
                    similarity: group.maxScore, // Use max score as the file similarity
                    reason: reason,
                    chunkCount: group.chunks.length,
                    language: group.language
                });
            }

            // Sort by similarity (descending) and return top results
            return relatedFiles
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, maxResults);

        } catch (error) {
            console.error('Failed to find related files:', error);
            return [];
        }
    }

    /**
     * Performs an advanced context query
     * 
     * This is the main entry point for semantic code search. It supports:
     * - Filtering by file type
     * - Including related files
     * - Minimum similarity thresholds
     * - Performance tracking
     * 
     * @param contextQuery - Query parameters
     * @returns Promise resolving to query results
     */
    async queryContext(contextQuery: ContextQuery): Promise<ContextResult> {
        const startTime = Date.now();
        
        try {
            if (!this.embeddingProvider) {
                throw new Error('Embedding provider not available');
            }

            // Generate embedding for the query
            const queryEmbeddings = await this.embeddingProvider.generateEmbeddings([contextQuery.query]);
            if (queryEmbeddings.length === 0) {
                return this.createEmptyResult(contextQuery.query, startTime);
            }

            const collectionName = this.generateCollectionName();

            // Get configuration values with fallbacks
            const config = vscode.workspace.getConfiguration('code-context-engine');
            const maxResults = contextQuery.maxResults ?? config.get<number>('maxSearchResults') ?? 20;
            const defaultMinSimilarity = config.get<number>('minSimilarityThreshold') ?? 0.5;
            
            // Build filter for file types if specified
            let filter: { should: Array<{ key: string, match: { value: string } }> } | undefined = undefined;
            if (contextQuery.fileTypes && contextQuery.fileTypes.length > 0) {
                // Create a filter that matches any of the specified languages
                filter = {
                    should: contextQuery.fileTypes.map(lang => ({
                        key: 'language',
                        match: { value: lang }
                    }))
                };
            }

            // Search for similar chunks
            const searchResults = await this.qdrantService.search(
                collectionName,
                queryEmbeddings[0],
                maxResults,
                filter
            );

            // Filter by minimum similarity if specified
            const minSimilarity = contextQuery.minSimilarity ?? defaultMinSimilarity;
            const filteredResults = searchResults.filter(r => r.score >= minSimilarity);

            // Find related files if requested
            let relatedFiles: RelatedFile[] = [];
            if (contextQuery.includeRelated) {
                relatedFiles = await this.findRelatedFiles(
                    contextQuery.query,
                    contextQuery.filePath,
                    this.DEFAULT_RELATED_FILES_LIMIT, // Use configurable constant
                    minSimilarity
                );
            }

            // Return complete result object with timing information
            return {
                query: contextQuery.query,
                results: filteredResults,
                relatedFiles: relatedFiles,
                totalResults: filteredResults.length,
                processingTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('Context query failed:', error);
            // Return empty results with timing information on error
            return this.createEmptyResult(contextQuery.query, startTime);
        }
    }

    /**
     * Maps file extensions to programming language identifiers
     * 
     * @param filePath - Path to the file
     * @returns Language identifier or undefined if not recognized
     */
    /**
     * Maps file extensions to programming language identifiers
     * Supports common file types and can be extended as needed
     * 
     * @param filePath - Path to the file
     * @returns Language identifier or undefined if not recognized
     */
    private getLanguageFromPath(filePath: string): string | undefined {
        const ext = path.extname(filePath).toLowerCase();
        const languageMap: Record<string, string> = {
            // JavaScript family
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.mjs': 'javascript',
            '.cjs': 'javascript',
            
            // Web technologies
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.less': 'less',
            '.vue': 'vue',
            '.svelte': 'svelte',
            
            // Backend languages
            '.py': 'python',
            '.rb': 'ruby',
            '.php': 'php',
            '.java': 'java',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            
            // Data formats
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.xml': 'xml',
            '.md': 'markdown',
            
            // Shell scripts
            '.sh': 'shell',
            '.bash': 'shell',
            '.zsh': 'shell',
            '.ps1': 'powershell'
        };
        
        return languageMap[ext];
    }

    /**
     * Generates a human-readable reason for why a file is related
     * 
     * @param topChunk - The highest-scoring chunk from the file
     * @param chunkCount - Total number of matching chunks in the file
     * @returns A descriptive string explaining the relation
     */
    private generateRelationReason(topChunk: SearchResult, chunkCount: number): string {
        const type = topChunk.payload.type;
        const name = topChunk.payload.name;
        
        if (chunkCount > 1) {
            return `Contains ${chunkCount} related ${type}s${name ? ` including "${name}"` : ''}`;
        } else {
            return `Contains related ${type}${name ? ` "${name}"` : ''}`;
        }
    }

    /**
     * Checks if the context service is ready for use
     * 
     * Verifies that both the vector database and embedding provider are available.
     * 
     * @returns Promise resolving to boolean indicating readiness
     */
    /**
     * Checks if the context service is ready for use
     * 
     * Verifies that both the vector database and embedding provider are available.
     * Logs any errors encountered during the check.
     * 
     * @returns Promise resolving to boolean indicating readiness
     */
    async isReady(): Promise<boolean> {
        try {
            // Check if Qdrant is available
            const qdrantReady = await this.qdrantService.healthCheck();
            if (!qdrantReady) {
                console.warn('Qdrant service health check failed');
                return false;
            }

            // Check if embedding provider is available
            if (!this.embeddingProvider) {
                console.warn('Embedding provider not available');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking service readiness:', error);
            return false;
        }
    }

    /**
     * Gets detailed status information about the service
     * 
     * Provides information about:
     * - Vector database connection
     * - Embedding provider availability
     * - Collection existence and metadata
     * 
     * @returns Promise resolving to status object
     */
    async getStatus(): Promise<{
        qdrantConnected: boolean;
        embeddingProvider: string | null;
        collectionExists: boolean;
        collectionInfo?: any;
    }> {
        // Check Qdrant connection
        const qdrantConnected = await this.qdrantService.healthCheck();
        
        // Get embedding provider name if available
        let embeddingProvider: string | null = null;
        try {
            embeddingProvider = this.embeddingProvider?.getProviderName() || null;
        } catch {
            // Provider not available
        }

        // Check if collection exists and get its info
        const collectionName = this.generateCollectionName();
        const collectionInfo = await this.qdrantService.getCollectionInfo(collectionName);
        const collectionExists = collectionInfo !== null;

        // Return comprehensive status object
        return {
            qdrantConnected,
            embeddingProvider,
            collectionExists,
            collectionInfo: collectionExists ? collectionInfo : undefined
        };
    }
}