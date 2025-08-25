import * as vscode from 'vscode';
import * as path from 'path';
import { IndexingService } from '../indexing/indexingService';
import { QdrantService, SearchResult } from '../db/qdrantService';
import { IEmbeddingProvider, EmbeddingProviderFactory, EmbeddingConfig } from '../embeddings/embeddingProvider';

export interface FileContentResult {
    filePath: string;
    content: string;
    language?: string;
    size: number;
    lastModified: Date;
    relatedChunks?: SearchResult[];
}

export interface RelatedFile {
    filePath: string;
    similarity: number;
    reason: string;
    chunkCount: number;
    language?: string;
}

export interface ContextQuery {
    query: string;
    filePath?: string;
    includeRelated?: boolean;
    maxResults?: number;
    minSimilarity?: number;
    fileTypes?: string[];
}

export interface ContextResult {
    query: string;
    results: SearchResult[];
    relatedFiles: RelatedFile[];
    totalResults: number;
    processingTime: number;
}

export class ContextService {
    private workspaceRoot: string;
    private indexingService: IndexingService;
    private qdrantService: QdrantService;
    private embeddingProvider: IEmbeddingProvider | null = null;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.indexingService = new IndexingService(workspaceRoot);
        
        // Initialize Qdrant service
        const qdrantUrl = vscode.workspace.getConfiguration('code-context-engine').get<string>('databaseConnectionString') || 'http://localhost:6333';
        this.qdrantService = new QdrantService(qdrantUrl);
    }

    private async initializeEmbeddingProvider(): Promise<void> {
        if (this.embeddingProvider) {
            return; // Already initialized
        }

        const config = vscode.workspace.getConfiguration('code-context-engine');
        const provider = config.get<string>('embeddingProvider') || 'ollama';
        const openaiApiKey = config.get<string>('openaiApiKey') || '';
        const ollamaModel = config.get<string>('ollamaModel') || 'nomic-embed-text';
        const openaiModel = config.get<string>('openaiModel') || 'text-embedding-ada-002';
        const batchSize = config.get<number>('indexingBatchSize') || 100;

        const embeddingConfig: EmbeddingConfig = {
            provider: provider as 'ollama' | 'openai',
            model: provider === 'ollama' ? ollamaModel : openaiModel,
            apiKey: openaiApiKey,
            baseUrl: provider === 'ollama' ? 'http://localhost:11434' : undefined,
            maxBatchSize: batchSize,
            timeout: 30000
        };

        try {
            this.embeddingProvider = await EmbeddingProviderFactory.createProvider(embeddingConfig);
            
            const isAvailable = await this.embeddingProvider.isAvailable();
            if (!isAvailable) {
                throw new Error(`Embedding provider '${provider}' is not available`);
            }
        } catch (error) {
            console.error('Failed to initialize embedding provider:', error);
            throw error;
        }
    }

    private generateCollectionName(): string {
        const workspaceName = this.workspaceRoot.split('/').pop() || 'workspace';
        const sanitizedName = workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        return `code_context_${sanitizedName}`;
    }

    /**
     * Get file content with optional related chunks
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
                await this.initializeEmbeddingProvider();
                if (this.embeddingProvider) {
                    // Search for chunks from this file
                    const collectionName = this.generateCollectionName();
                    const searchResults = await this.qdrantService.search(
                        collectionName,
                        [], // Empty vector, we'll use filter instead
                        50,
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
     * Find files related to a query or file
     */
    async findRelatedFiles(
        query: string,
        currentFilePath?: string,
        maxResults?: number,
        minSimilarity?: number
    ): Promise<RelatedFile[]> {
        // Get configuration values
        const config = vscode.workspace.getConfiguration('code-context-engine');
        maxResults = maxResults ?? config.get<number>('maxSearchResults') ?? 10;
        minSimilarity = minSimilarity ?? config.get<number>('minSimilarityThreshold') ?? 0.5;
        try {
            await this.initializeEmbeddingProvider();
            if (!this.embeddingProvider) {
                throw new Error('Embedding provider not available');
            }

            // Generate embedding for the query
            const queryEmbeddings = await this.embeddingProvider.generateEmbeddings([query]);
            if (queryEmbeddings.length === 0) {
                return [];
            }

            const collectionName = this.generateCollectionName();
            
            // Search for similar chunks
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

            for (const result of searchResults) {
                if (result.score < minSimilarity) continue;
                if (currentFilePath && result.payload.filePath === currentFilePath) continue;

                const filePath = result.payload.filePath;
                if (!fileGroups.has(filePath)) {
                    fileGroups.set(filePath, {
                        chunks: [],
                        maxScore: 0,
                        avgScore: 0,
                        language: result.payload.language
                    });
                }

                const group = fileGroups.get(filePath)!;
                group.chunks.push(result);
                group.maxScore = Math.max(group.maxScore, result.score);
            }

            // Calculate average scores and create RelatedFile objects
            const relatedFiles: RelatedFile[] = [];
            for (const [filePath, group] of fileGroups) {
                group.avgScore = group.chunks.reduce((sum, chunk) => sum + chunk.score, 0) / group.chunks.length;
                
                // Determine reason for relation
                const topChunk = group.chunks[0];
                const reason = this.generateRelationReason(topChunk, group.chunks.length);

                relatedFiles.push({
                    filePath: filePath,
                    similarity: group.maxScore,
                    reason: reason,
                    chunkCount: group.chunks.length,
                    language: group.language
                });
            }

            // Sort by similarity and return top results
            return relatedFiles
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, maxResults);

        } catch (error) {
            console.error('Failed to find related files:', error);
            return [];
        }
    }

    /**
     * Perform advanced context query
     */
    async queryContext(contextQuery: ContextQuery): Promise<ContextResult> {
        const startTime = Date.now();
        
        try {
            await this.initializeEmbeddingProvider();
            if (!this.embeddingProvider) {
                throw new Error('Embedding provider not available');
            }

            // Generate embedding for the query
            const queryEmbeddings = await this.embeddingProvider.generateEmbeddings([contextQuery.query]);
            if (queryEmbeddings.length === 0) {
                return {
                    query: contextQuery.query,
                    results: [],
                    relatedFiles: [],
                    totalResults: 0,
                    processingTime: Date.now() - startTime
                };
            }

            const collectionName = this.generateCollectionName();

            // Get configuration values
            const config = vscode.workspace.getConfiguration('code-context-engine');
            const maxResults = contextQuery.maxResults ?? config.get<number>('maxSearchResults') ?? 20;
            const defaultMinSimilarity = config.get<number>('minSimilarityThreshold') ?? 0.5;
            
            // Build filter for file types if specified
            let filter: any = undefined;
            if (contextQuery.fileTypes && contextQuery.fileTypes.length > 0) {
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
                    10,
                    minSimilarity
                );
            }

            return {
                query: contextQuery.query,
                results: filteredResults,
                relatedFiles: relatedFiles,
                totalResults: filteredResults.length,
                processingTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('Context query failed:', error);
            return {
                query: contextQuery.query,
                results: [],
                relatedFiles: [],
                totalResults: 0,
                processingTime: Date.now() - startTime
            };
        }
    }

    private getLanguageFromPath(filePath: string): string | undefined {
        const ext = path.extname(filePath).toLowerCase();
        const languageMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.cs': 'csharp'
        };
        return languageMap[ext];
    }

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
     * Check if the context service is ready
     */
    async isReady(): Promise<boolean> {
        try {
            const qdrantReady = await this.qdrantService.healthCheck();
            if (!qdrantReady) return false;

            await this.initializeEmbeddingProvider();
            return this.embeddingProvider !== null;
        } catch {
            return false;
        }
    }

    /**
     * Get service status information
     */
    async getStatus(): Promise<{
        qdrantConnected: boolean;
        embeddingProvider: string | null;
        collectionExists: boolean;
        collectionInfo?: any;
    }> {
        const qdrantConnected = await this.qdrantService.healthCheck();
        
        let embeddingProvider: string | null = null;
        try {
            await this.initializeEmbeddingProvider();
            embeddingProvider = this.embeddingProvider?.getProviderName() || null;
        } catch {
            // Provider not available
        }

        const collectionName = this.generateCollectionName();
        const collectionInfo = await this.qdrantService.getCollectionInfo(collectionName);
        const collectionExists = collectionInfo !== null;

        return {
            qdrantConnected,
            embeddingProvider,
            collectionExists,
            collectionInfo: collectionExists ? collectionInfo : undefined
        };
    }
}
