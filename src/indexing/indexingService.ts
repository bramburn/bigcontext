/**
 * Code indexing and search service for the VS Code extension.
 *
 * This module provides the core functionality for indexing code files in a workspace,
 * generating embeddings, and storing them in a vector database for semantic search.
 * It orchestrates the entire indexing pipeline from file discovery to vector storage.
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import { FileWalker } from './fileWalker';
import { AstParser, SupportedLanguage } from '../parsing/astParser';
import { Chunker, CodeChunk, ChunkType } from '../parsing/chunker';
import { QdrantService } from '../db/qdrantService';
import { IEmbeddingProvider, EmbeddingProviderFactory, EmbeddingConfig } from '../embeddings/embeddingProvider';
import { LSPService } from '../lsp/lspService';
import { StateManager } from '../stateManager';

/**
 * Progress tracking interface for the indexing process.
 *
 * This interface provides real-time updates about the indexing progress,
 * allowing the UI to show the current status and progress to the user.
 */
export interface IndexingProgress {
    /** Currently being processed file path */
    currentFile: string;
    /** Number of files that have been processed so far */
    processedFiles: number;
    /** Total number of files to be processed */
    totalFiles: number;
    /** Current phase of the indexing process */
    currentPhase: 'discovering' | 'parsing' | 'chunking' | 'embedding' | 'storing' | 'complete';
    /** Array of chunks generated so far */
    chunks: CodeChunk[];
    /** Array of error messages encountered during indexing */
    errors: string[];
    /** Optional progress information for embedding generation */
    embeddingProgress?: {
        /** Number of chunks that have been embedded */
        processedChunks: number;
        /** Total number of chunks to be embedded */
        totalChunks: number;
    };
}

/**
 * Result interface for the indexing operation.
 *
 * This interface contains comprehensive information about the indexing operation,
 * including success status, generated chunks, statistics, and any errors encountered.
 */
export interface IndexingResult {
    /** Whether the indexing operation completed successfully */
    success: boolean;
    /** Array of code chunks generated during indexing */
    chunks: CodeChunk[];
    /** Total number of files in the workspace */
    totalFiles: number;
    /** Number of files that were successfully processed */
    processedFiles: number;
    /** Array of error messages encountered during indexing */
    errors: string[];
    /** Duration of the indexing operation in milliseconds */
    duration: number;
    /** Name of the Qdrant collection where chunks were stored */
    collectionName?: string;
    /** Name of the embedding provider used */
    embeddingProvider?: string;
    /** Comprehensive statistics about the indexing operation */
    stats: {
        /** Count of files processed by programming language */
        filesByLanguage: Record<string, number>;
        /** Count of chunks by their type */
        chunksByType: Record<ChunkType, number>;
        /** Total number of lines of code processed */
        totalLines: number;
        /** Total number of bytes processed */
        totalBytes: number;
        /** Total number of embeddings generated */
        totalEmbeddings: number;
        /** Dimensionality of the vector embeddings */
        vectorDimensions: number;
    };
}

/**
 * Main indexing service that orchestrates the entire code indexing pipeline.
 *
 * The IndexingService coordinates all aspects of the indexing process:
 * - File discovery using FileWalker
 * - AST parsing using AstParser
 * - Code chunking using Chunker
 * - Embedding generation using embedding providers
 * - Vector storage using QdrantService
 *
 * It provides a high-level API for starting indexing operations and retrieving
 * workspace statistics, as well as searching through indexed code.
 */
export class IndexingService {
    /** Root directory of the workspace being indexed */
    private workspaceRoot: string;
    /** File walker for discovering and filtering files in the workspace */
    private fileWalker: FileWalker;
    /** AST parser for analyzing code structure and semantics */
    private astParser: AstParser;
    /** Chunker for breaking down code into manageable pieces */
    private chunker: Chunker;
    /** Service for interacting with the Qdrant vector database */
    private qdrantService: QdrantService;
    /** Embedding provider for generating vector representations of code */
    private embeddingProvider: IEmbeddingProvider;
    /** Service for interacting with Language Server Protocol */
    private lspService: LSPService;
    /** State manager for tracking application state and preventing concurrent operations */
    private stateManager: StateManager;

    /**
     * Creates a new IndexingService instance using dependency injection
     * @param workspaceRoot - The absolute path to the workspace root directory
     * @param fileWalker - Injected FileWalker instance
     * @param astParser - Injected AstParser instance
     * @param chunker - Injected Chunker instance
     * @param qdrantService - Injected QdrantService instance
     * @param embeddingProvider - Injected embedding provider instance
     * @param lspService - Injected LSPService instance
     * @param stateManager - Injected StateManager instance
     */
    constructor(
        workspaceRoot: string,
        fileWalker: FileWalker,
        astParser: AstParser,
        chunker: Chunker,
        qdrantService: QdrantService,
        embeddingProvider: IEmbeddingProvider,
        lspService: LSPService,
        stateManager: StateManager
    ) {
        this.workspaceRoot = workspaceRoot;
        this.fileWalker = fileWalker;
        this.astParser = astParser;
        this.chunker = chunker;
        this.qdrantService = qdrantService;
        this.embeddingProvider = embeddingProvider;
        this.lspService = lspService;
        this.stateManager = stateManager;
    }



    /**
     * Starts the indexing process for the entire workspace.
     *
     * This method orchestrates the complete indexing pipeline:
     * 1. Initialize embedding provider
     * 2. Discover all relevant files in the workspace
     * 3. Process each file (parse AST, create chunks)
     * 4. Generate embeddings for all chunks
     * 5. Store chunks and embeddings in Qdrant
     *
     * The method provides progress updates through the callback function,
     * allowing the UI to show real-time progress to the user.
     *
     * @param progressCallback - Optional callback function for progress updates
     * @returns Promise resolving to an IndexingResult with comprehensive statistics
     */
    public async startIndexing(
        progressCallback?: (progress: IndexingProgress) => void
    ): Promise<IndexingResult> {
        // Check if indexing is already in progress
        if (this.stateManager.isIndexing()) {
            console.warn('IndexingService: Indexing already in progress, skipping new request');
            throw new Error('Indexing is already in progress');
        }

        const startTime = Date.now();
        const result: IndexingResult = {
            success: false,
            chunks: [],
            totalFiles: 0,
            processedFiles: 0,
            errors: [],
            duration: 0,
            stats: {
                filesByLanguage: {},
                chunksByType: {} as Record<ChunkType, number>,
                totalLines: 0,
                totalBytes: 0,
                totalEmbeddings: 0,
                vectorDimensions: 0
            }
        };

        // Set indexing state to true
        this.stateManager.setIndexing(true, 'Starting indexing process');

        try {
            // Phase 1: Initialize embedding provider
            // This must be done first as it's required for the rest of the pipeline
            progressCallback?.({
                currentFile: '',
                processedFiles: 0,
                totalFiles: 0,
                currentPhase: 'discovering',
                chunks: [],
                errors: []
            });



            // Phase 2: Discover files
            // Find all relevant files in the workspace that match our patterns
            progressCallback?.({
                currentFile: '',
                processedFiles: 0,
                totalFiles: 0,
                currentPhase: 'discovering',
                chunks: [],
                errors: []
            });

            const files = await this.fileWalker.findAllFiles();
            const codeFiles = files.filter(file => this.fileWalker.isCodeFile(file));
            
            result.totalFiles = codeFiles.length;

            // If no code files found, return early with success status
            if (codeFiles.length === 0) {
                result.success = true;
                result.duration = Date.now() - startTime;
                return result;
            }

            // Phase 3: Process files
            // For each file, parse the AST and create code chunks
            for (let i = 0; i < codeFiles.length; i++) {
                const filePath = codeFiles[i];
                
                try {
                    progressCallback?.({
                        currentFile: filePath,
                        processedFiles: i,
                        totalFiles: codeFiles.length,
                        currentPhase: 'parsing',
                        chunks: result.chunks,
                        errors: result.errors
                    });

                    const fileResult = await this.processFile(filePath);
                    
                    if (fileResult.success) {
                        result.chunks.push(...fileResult.chunks);
                        
                        // Update stats
                        if (fileResult.language) {
                            result.stats.filesByLanguage[fileResult.language] =
                                (result.stats.filesByLanguage[fileResult.language] || 0) + 1;
                        }
                        
                        result.stats.totalLines += fileResult.lineCount;
                        result.stats.totalBytes += fileResult.byteCount;
                        
                        // Update chunk stats
                        for (const chunk of fileResult.chunks) {
                            result.stats.chunksByType[chunk.type] =
                                (result.stats.chunksByType[chunk.type] || 0) + 1;
                        }
                    } else {
                        result.errors.push(...fileResult.errors);
                    }
                    
                    result.processedFiles++;
                    
                } catch (error) {
                    const errorMessage = `Error processing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
                    result.errors.push(errorMessage);
                    console.error(errorMessage);
                }
            }

            // Phase 4: Generate embeddings
            // If we have chunks and an embedding provider, generate vector embeddings
            if (result.chunks.length > 0 && this.embeddingProvider) {
                progressCallback?.({
                    currentFile: '',
                    processedFiles: result.processedFiles,
                    totalFiles: result.totalFiles,
                    currentPhase: 'embedding',
                    chunks: result.chunks,
                    errors: result.errors,
                    embeddingProgress: {
                        processedChunks: 0,
                        totalChunks: result.chunks.length
                    }
                });

                const chunkContents = result.chunks.map(chunk => chunk.content);
                const embeddings = await this.embeddingProvider.generateEmbeddings(chunkContents);

                result.stats.totalEmbeddings = embeddings.length;
                result.stats.vectorDimensions = this.embeddingProvider.getDimensions();
                result.embeddingProvider = this.embeddingProvider.getProviderName();

                // Phase 5: Store in Qdrant
                // Store the chunks and their embeddings in the vector database
                progressCallback?.({
                    currentFile: '',
                    processedFiles: result.processedFiles,
                    totalFiles: result.totalFiles,
                    currentPhase: 'storing',
                    chunks: result.chunks,
                    errors: result.errors
                });

                const collectionName = this.generateCollectionName();
                result.collectionName = collectionName;

                // Create collection if it doesn't exist
                const collectionCreated = await this.qdrantService.createCollectionIfNotExists(
                    collectionName,
                    this.embeddingProvider.getDimensions()
                );

                if (!collectionCreated) {
                    result.errors.push('Failed to create Qdrant collection');
                } else {
                    // Store chunks with embeddings
                    const stored = await this.qdrantService.upsertChunks(
                        collectionName,
                        result.chunks,
                        embeddings
                    );

                    if (!stored) {
                        result.errors.push('Failed to store chunks in Qdrant');
                    }
                }
            }

            // Phase 6: Complete
            // Mark the indexing process as complete
            progressCallback?.({
                currentFile: '',
                processedFiles: result.processedFiles,
                totalFiles: result.totalFiles,
                currentPhase: 'complete',
                chunks: result.chunks,
                errors: result.errors
            });

            result.success = true;
            result.duration = Date.now() - startTime;

        } catch (error) {
            const errorMessage = `Indexing failed: ${error instanceof Error ? error.message : String(error)}`;
            result.errors.push(errorMessage);
            console.error(errorMessage);
            this.stateManager.setError(errorMessage);
        } finally {
            // Always reset the indexing state, regardless of success or failure
            this.stateManager.setIndexing(false);
        }

        result.duration = Date.now() - startTime;
        return result;
    }

    /**
     * Processes a single file by reading its content, parsing its AST,
     * and creating code chunks.
     *
     * This method handles the complete processing pipeline for a single file:
     * 1. Read the file content
     * 2. Determine the programming language
     * 3. Parse the Abstract Syntax Tree (AST)
     * 4. Create code chunks from the parsed tree
     *
     * The method includes error recovery and handles various failure scenarios
     * gracefully, returning appropriate error messages when issues occur.
     *
     * @param filePath - The path to the file to process
     * @returns Promise resolving to a processing result with chunks and metadata
     */
    private async processFile(filePath: string): Promise<{
        success: boolean;
        chunks: CodeChunk[];
        language?: SupportedLanguage;
        lineCount: number;
        byteCount: number;
        errors: string[];
    }> {
        const errors: string[] = [];
        
        try {
            // Read file content
            // This is the first step in processing any file
            const content = await fs.promises.readFile(filePath, 'utf8');
            const lineCount = content.split('\n').length;
            const byteCount = Buffer.byteLength(content, 'utf8');
            
            // Determine language
            // We need to know the language to use the correct parser
            const language = this.getLanguage(filePath);
            if (!language) {
                return {
                    success: false,
                    chunks: [],
                    lineCount,
                    byteCount,
                    errors: [`Unsupported file type: ${filePath}`]
                };
            }

            // Parse AST
            // This creates a structured representation of the code
            const parseResult = this.astParser.parseWithErrorRecovery(language, content);
            if (parseResult.errors.length > 0) {
                errors.push(...parseResult.errors.map(err => `${filePath}: ${err}`));
            }

            if (!parseResult.tree) {
                return {
                    success: false,
                    chunks: [],
                    language,
                    lineCount,
                    byteCount,
                    errors: [`Failed to parse AST for ${filePath}`, ...errors]
                };
            }

            // Create chunks
            // Break down the code into manageable pieces for embedding
            const chunks = this.chunker.chunk(filePath, parseResult.tree, content, language);

            // Enhance chunks with LSP metadata
            // This adds semantic information like symbols, definitions, and references
            const enhancedChunks = await this.enhanceChunksWithLSP(chunks, filePath, content, language);

            return {
                success: true,
                chunks: enhancedChunks,
                language,
                lineCount,
                byteCount,
                errors
            };

        } catch (error) {
            return {
                success: false,
                chunks: [],
                lineCount: 0,
                byteCount: 0,
                errors: [`Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`]
            };
        }
    }

    /**
     * Enhance code chunks with LSP metadata
     *
     * This method adds semantic information from the Language Server Protocol
     * to each code chunk, including symbols, definitions, references, and hover info.
     *
     * @param chunks - The code chunks to enhance
     * @param filePath - The path to the source file
     * @param content - The full file content
     * @param language - The programming language
     * @returns Promise resolving to enhanced chunks with LSP metadata
     */
    private async enhanceChunksWithLSP(
        chunks: CodeChunk[],
        filePath: string,
        content: string,
        language: SupportedLanguage
    ): Promise<CodeChunk[]> {
        try {
            // Check if LSP is available for this language
            const isLSPAvailable = await this.lspService.isLSPAvailable(language);
            if (!isLSPAvailable) {
                console.log(`LSP not available for ${language}, skipping LSP enhancement`);
                return chunks;
            }

            // Enhance each chunk with LSP metadata
            const enhancedChunks: CodeChunk[] = [];
            for (const chunk of chunks) {
                try {
                    const lspMetadata = await this.lspService.getMetadataForChunk(
                        filePath,
                        chunk.content,
                        chunk.startLine,
                        chunk.endLine,
                        language
                    );

                    enhancedChunks.push({
                        ...chunk,
                        lspMetadata
                    });
                } catch (error) {
                    console.warn(`Failed to get LSP metadata for chunk in ${filePath}:`, error);
                    // Add chunk without LSP metadata
                    enhancedChunks.push(chunk);
                }
            }

            return enhancedChunks;
        } catch (error) {
            console.warn(`Failed to enhance chunks with LSP for ${filePath}:`, error);
            return chunks; // Return original chunks if LSP enhancement fails
        }
    }

    /**
     * Determines the programming language of a file based on its extension.
     *
     * This method delegates to the AST parser to identify the language,
     * which ensures consistency with the parsing capabilities.
     *
     * @param filePath - The path to the file to analyze
     * @returns The supported language or null if the language is not supported
     */
    private getLanguage(filePath: string): SupportedLanguage | null {
        return this.astParser.getLanguageFromFilePath(filePath);
    }

    /**
     * Generates a unique collection name for the Qdrant database.
     *
     * This method creates a sanitized version of the workspace name to use
     * as the collection name. This ensures that the collection name is
     * valid for Qdrant and unique per workspace.
     *
     * @returns A sanitized collection name string
     */
    private generateCollectionName(): string {
        // Generate a collection name based on workspace root
        // This helps organize collections by workspace
        const workspaceName = this.workspaceRoot.split('/').pop() || 'workspace';
        const sanitizedName = workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        return `code_context_${sanitizedName}`;
    }

    /**
     * Gets statistics about the workspace for planning purposes.
     *
     * This method provides useful information about the workspace composition,
     * including the total number of files, distribution by file extension,
     * and an estimated indexing time based on the number of code files.
     *
     * @returns Promise resolving to workspace statistics
     */
    public async getWorkspaceStats(): Promise<{
        totalFiles: number;
        filesByExtension: Record<string, number>;
        estimatedIndexingTime: number;
    }> {
        const stats = await this.fileWalker.getFileStats();
        const codeFileCount = Object.entries(stats.filesByExtension)
            .filter(([ext]) => this.fileWalker.isCodeFile(`dummy${ext}`))
            .reduce((sum, [, count]) => sum + count, 0);
        
        // Rough estimate: 50ms per file
        // This is a heuristic that can be refined based on actual performance
        const estimatedIndexingTime = codeFileCount * 50;

        return {
            totalFiles: stats.totalFiles,
            filesByExtension: stats.filesByExtension,
            estimatedIndexingTime
        };
    }

    /**
     * Gets the list of supported programming languages.
     *
     * This method returns all languages that the AST parser can handle,
     * which is useful for UI components that need to show supported languages
     * or filter files by language.
     *
     * @returns Array of supported language identifiers
     */
    public getSupportedLanguages(): SupportedLanguage[] {
        return this.astParser.getSupportedLanguages();
    }

    /**
     * Performs semantic search through the indexed code.
     *
     * This method takes a natural language query, generates an embedding for it,
     * and searches the Qdrant vector database for similar code chunks. The search
     * is based on semantic similarity rather than keyword matching.
     *
     * @param query - The search query in natural language
     * @param limit - Maximum number of results to return (default: 10)
     * @returns Promise resolving to search results
     */
    public async searchCode(query: string, limit: number = 10): Promise<any[]> {
        // Ensure embedding provider is available
        if (!this.embeddingProvider) {
            throw new Error('Embedding provider not available');
        }

        if (!this.embeddingProvider) {
            throw new Error('Embedding provider not available');
        }

        try {
            // Generate embedding for the query
            // This converts the natural language query into a vector representation
            const queryEmbeddings = await this.embeddingProvider.generateEmbeddings([query]);
            if (queryEmbeddings.length === 0) {
                return [];
            }

            const collectionName = this.generateCollectionName();

            // Search in Qdrant
            // This finds the most similar code chunks based on vector similarity
            const results = await this.qdrantService.search(
                collectionName,
                queryEmbeddings[0],
                limit
            );

            return results;
        } catch (error) {
            console.error('Search failed:', error);
            return [];
        }
    }

    /**
     * Gets information about the Qdrant collection used for storing embeddings.
     *
     * This method retrieves metadata about the collection, such as the number
     * of vectors, vector dimensions, and other collection properties. This is
     * useful for debugging and monitoring purposes.
     *
     * @returns Promise resolving to collection information
     */
    public async getCollectionInfo(): Promise<any> {
        const collectionName = this.generateCollectionName();
        return await this.qdrantService.getCollectionInfo(collectionName);
    }

    /**
     * Checks if the Qdrant service is available and responsive.
     *
     * This method performs a health check on the Qdrant service to ensure
     * that the vector database is running and accessible. This is useful
     * for determining if indexing and search operations can proceed.
     *
     * @returns Promise resolving to true if Qdrant is available, false otherwise
     */
    public async isQdrantAvailable(): Promise<boolean> {
        return await this.qdrantService.healthCheck();
    }

    /**
     * Updates a single file in the index by re-parsing and re-indexing it
     *
     * This method is used for incremental indexing when files are modified.
     * It removes the old vectors for the file and adds new ones based on
     * the current file content.
     *
     * @param uri - The URI of the file to update in the index
     * @returns Promise that resolves when the file has been updated
     */
    public async updateFileInIndex(uri: vscode.Uri): Promise<void> {
        try {
            console.log(`IndexingService: Updating file in index: ${uri.fsPath}`);

            // First, remove any existing vectors for this file
            await this.removeFileFromIndex(uri);

            // Read the file content
            const fileContent = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(fileContent).toString('utf8');

            // Process the file to get chunks
            const fileResult = await this.processFile(uri.fsPath);

            if (!fileResult.success || fileResult.chunks.length === 0) {
                console.warn(`IndexingService: Failed to process file or no chunks generated: ${uri.fsPath}`);
                return;
            }

            // Generate embeddings for the chunks
            const chunkContents = fileResult.chunks.map(chunk => chunk.content);
            const embeddings = await this.embeddingProvider.generateEmbeddings(chunkContents);

            if (embeddings.length !== fileResult.chunks.length) {
                console.error(`IndexingService: Embedding count mismatch for ${uri.fsPath}: ${embeddings.length} embeddings for ${fileResult.chunks.length} chunks`);
                return;
            }

            // Store the chunks and embeddings in Qdrant
            const collectionName = this.generateCollectionName();
            const success = await this.qdrantService.upsertChunks(collectionName, fileResult.chunks, embeddings);

            if (success) {
                console.log(`IndexingService: Successfully updated ${fileResult.chunks.length} chunks for file: ${uri.fsPath}`);
            } else {
                console.error(`IndexingService: Failed to upsert chunks for file: ${uri.fsPath}`);
            }

        } catch (error) {
            console.error(`IndexingService: Error updating file in index ${uri.fsPath}:`, error);
            throw error;
        }
    }

    /**
     * Removes a file from the index by deleting all associated vectors
     *
     * This method is used when files are deleted or when updating files
     * (as part of the delete-then-add strategy).
     *
     * @param uri - The URI of the file to remove from the index
     * @returns Promise that resolves when the file has been removed
     */
    public async removeFileFromIndex(uri: vscode.Uri): Promise<void> {
        try {
            console.log(`IndexingService: Removing file from index: ${uri.fsPath}`);

            // Use the relative path for consistency with how files are stored
            const relativePath = vscode.workspace.asRelativePath(uri);

            // Delete all vectors associated with this file
            await this.qdrantService.deleteVectorsForFile(relativePath);

            console.log(`IndexingService: Successfully removed file from index: ${relativePath}`);

        } catch (error) {
            console.error(`IndexingService: Error removing file from index ${uri.fsPath}:`, error);
            throw error;
        }
    }

}
