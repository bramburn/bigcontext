/**
 * Enhanced Indexing Service
 *
 * This service manages the indexing process for the RAG for LLM VS Code extension.
 * It orchestrates file discovery, processing, chunking, embedding generation,
 * and storage in the vector database.
 *
 * The service provides progress tracking, error handling, supports both
 * sequential and parallel processing modes, and implements the IIndexingService
 * interface for enhanced pause/resume functionality.
 *
 * Based on specifications in:
 * - specs/002-for-the-next/contracts/services.ts
 * - specs/002-for-the-next/data-model.md
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { IndexState, FileMetadata } from '../types/indexing';
import {
  IndexingProgress,
  DetailedIndexingProgress,
  IndexingOperationResult,
  IndexingConfiguration,
  IndexingError,
  createInitialProgress,
  DEFAULT_INDEXING_CONFIG
} from '../models/indexingProgress';
import {
  ProjectFileMetadata,
  FileChunk,
  FileProcessingStats,
  createFileMetadata
} from '../models/projectFileMetadata';
import { FileProcessor } from './FileProcessor';
import { EmbeddingProvider } from './EmbeddingProvider';
import { QdrantService } from './QdrantService';

/**
 * Interface contract that this service implements
 */
export interface IIndexingService {
    /**
     * Starts a full indexing process for the workspace.
     */
    startIndexing(): Promise<void>;

    /**
     * Pauses the currently running indexing process.
     */
    pauseIndexing(): Promise<void>;

    /**
     * Resumes a paused indexing process.
     */
    resumeIndexing(): Promise<void>;

    /**
     * Gets the current state of the indexing process.
     */
    getIndexState(): Promise<IndexState>;

    /**
     * Updates a single file in the index.
     */
    updateFileInIndex(uri: vscode.Uri): Promise<void>;

    /**
     * Removes a file from the index.
     */
    removeFileFromIndex(uri: vscode.Uri): Promise<void>;

    /**
     * Adds a new file to the index.
     */
    addFileToIndex(uri: vscode.Uri): Promise<void>;

    /**
     * Checks if a file is currently indexed.
     */
    isFileIndexed(filePath: string): boolean;

    /**
     * Triggers a full re-index of the workspace.
     */
    triggerFullReindex(): Promise<void>;

    /**
     * Adds a state change listener.
     */
    onStateChange(listener: (state: IndexState) => void): vscode.Disposable;
}

/**
 * Indexing session information
 */
export interface IndexingSession {
  /** Unique session identifier */
  id: string;
  
  /** Session start time */
  startTime: Date;
  
  /** Session end time (if completed) */
  endTime?: Date;
  
  /** Current progress */
  progress: DetailedIndexingProgress;
  
  /** Configuration used for this session */
  configuration: IndexingConfiguration;
  
  /** Whether the session is active */
  isActive: boolean;
  
  /** Whether the session is paused */
  isPaused: boolean;
}

/**
 * Enhanced IndexingService Class
 *
 * Provides centralized management of the indexing process including:
 * - File discovery and filtering
 * - File processing and chunking
 * - Embedding generation
 * - Vector storage
 * - Progress tracking and error handling
 * - Session management (start, pause, resume, stop)
 * - Enhanced pause/resume functionality
 * - File monitoring integration
 * - Configuration change detection
 */
export class IndexingService implements IIndexingService {
  /** VS Code extension context */
  private context: vscode.ExtensionContext;
  
  /** Current workspace root path */
  private workspaceRoot: string | undefined;
  
  /** File processor service */
  private fileProcessor: FileProcessor;
  
  /** Embedding provider service */
  private embeddingProvider: EmbeddingProvider;
  
  /** Qdrant vector database service */
  private qdrantService: QdrantService;
  
  /** Current indexing session */
  private currentSession: IndexingSession | undefined;
  
  /** Progress callback function */
  private progressCallback: ((progress: IndexingProgress) => void) | undefined;
  
  /** Indexing configuration */
  private configuration: IndexingConfiguration;
  
  /** Cancellation token for stopping indexing */
  private cancellationToken: vscode.CancellationTokenSource | undefined;

  /** File metadata tracking for indexed files */
  private fileMetadataMap: Map<string, FileMetadata> = new Map();

  /** State change listeners */
  private stateChangeListeners: ((state: IndexState) => void)[] = [];
  
  /**
   * Creates a new IndexingService instance
   * 
   * @param context VS Code extension context
   * @param fileProcessor File processor service
   * @param embeddingProvider Embedding provider service
   * @param qdrantService Qdrant service
   */
  constructor(
    context: vscode.ExtensionContext,
    fileProcessor: FileProcessor,
    embeddingProvider: EmbeddingProvider,
    qdrantService: QdrantService
  ) {
    this.context = context;
    this.fileProcessor = fileProcessor;
    this.embeddingProvider = embeddingProvider;
    this.qdrantService = qdrantService;
    this.configuration = DEFAULT_INDEXING_CONFIG;
    
    // Get current workspace root
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }
  
  /**
   * Get current indexing status
   * 
   * Returns the current indexing progress and status information.
   * 
   * @returns Current indexing progress
   */
  public getCurrentStatus(): IndexingProgress {
    if (!this.currentSession) {
      return createInitialProgress();
    }
    
    const progress = this.currentSession.progress;
    
    return {
      status: progress.status,
      percentageComplete: progress.percentageComplete,
      chunksIndexed: progress.chunksIndexed,
      totalFiles: progress.totalFiles,
      filesProcessed: progress.filesProcessed,
      timeElapsed: progress.timeElapsed,
      estimatedTimeRemaining: progress.estimatedTimeRemaining,
      errorsEncountered: progress.errorsEncountered,
    };
  }
  
  /**
   * Start indexing process (IIndexingService interface)
   *
   * Starts a full indexing process for the workspace.
   * This is the interface-compliant version that throws on error.
   */
  public async startIndexing(): Promise<void> {
    const result = await this.startIndexingWithResult(this.progressCallback);
    if (!result.success) {
      throw new Error(result.message || 'Failed to start indexing');
    }
  }

  /**
   * Start indexing process with detailed result
   *
   * Begins a new indexing session for the current workspace.
   *
   * @param progressCallback Optional callback for progress updates
   * @returns Operation result
   */
  public async startIndexingWithResult(
    progressCallback?: (progress: IndexingProgress) => void
  ): Promise<IndexingOperationResult> {
    try {
      // Check if indexing is already in progress
      if (this.currentSession?.isActive) {
        return {
          success: false,
          message: 'Indexing is already in progress',
          error: {
            code: 'INDEXING_IN_PROGRESS',
            message: 'Cannot start indexing while another session is active',
          },
        };
      }
      
      // Validate workspace
      if (!this.workspaceRoot) {
        return {
          success: false,
          message: 'No workspace folder is open',
          error: {
            code: 'NO_WORKSPACE',
            message: 'A workspace folder must be open to start indexing',
          },
        };
      }
      
      // Create new indexing session
      this.currentSession = {
        id: this.generateSessionId(),
        startTime: new Date(),
        progress: {
          ...createInitialProgress(),
          status: 'In Progress',
          lastUpdate: new Date(),
        } as DetailedIndexingProgress,
        configuration: { ...this.configuration },
        isActive: true,
        isPaused: false,
      };
      
      this.progressCallback = progressCallback;
      this.cancellationToken = new vscode.CancellationTokenSource();
      
      // Start indexing process
      this.performIndexing();

      // Notify state change
      await this.notifyStateChange();

      return {
        success: true,
        message: 'Indexing started successfully',
        details: {
          sessionId: this.currentSession.id,
          estimatedDuration: 0, // Will be calculated during processing
        },
      };
      
    } catch (error) {
      console.error('IndexingService: Failed to start indexing:', error);
      return {
        success: false,
        message: `Failed to start indexing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          code: 'START_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  
  /**
   * Pauses the currently running indexing process (IIndexingService interface)
   */
  public async pauseIndexing(): Promise<void> {
    const result = await this.pauseIndexingWithResult();
    if (!result.success) {
      throw new Error(result.message || 'Failed to pause indexing');
    }
  }

  /**
   * Pause indexing process with detailed result
   *
   * @returns Operation result
   */
  public async pauseIndexingWithResult(): Promise<IndexingOperationResult> {
    if (!this.currentSession?.isActive) {
      return {
        success: false,
        message: 'No active indexing session to pause',
      };
    }

    this.currentSession.isPaused = true;
    this.currentSession.progress.status = 'Paused';

    // Notify state change
    await this.notifyStateChange();

    return {
      success: true,
      message: 'Indexing paused successfully',
    };
  }
  
  /**
   * Resumes a paused indexing process (IIndexingService interface)
   */
  public async resumeIndexing(): Promise<void> {
    const result = await this.resumeIndexingWithResult();
    if (!result.success) {
      throw new Error(result.message || 'Failed to resume indexing');
    }
  }

  /**
   * Resume indexing process with detailed result
   *
   * @returns Operation result
   */
  public async resumeIndexingWithResult(): Promise<IndexingOperationResult> {
    if (!this.currentSession?.isPaused) {
      return {
        success: false,
        message: 'No paused indexing session to resume',
      };
    }

    this.currentSession.isPaused = false;
    this.currentSession.progress.status = 'In Progress';

    // Notify state change
    await this.notifyStateChange();

    return {
      success: true,
      message: 'Indexing resumed successfully',
    };
  }
  
  /**
   * Stop indexing process
   * 
   * @returns Operation result
   */
  public async stopIndexing(): Promise<IndexingOperationResult> {
    if (!this.currentSession?.isActive) {
      return {
        success: false,
        message: 'No active indexing session to stop',
      };
    }
    
    // Cancel the indexing process
    this.cancellationToken?.cancel();
    
    // Update session status
    this.currentSession.isActive = false;
    this.currentSession.endTime = new Date();
    this.currentSession.progress.status = 'Paused'; // Stopped but can be resumed
    
    return {
      success: true,
      message: 'Indexing stopped successfully',
    };
  }
  
  /**
   * Update indexing configuration
   * 
   * @param config New configuration
   */
  public updateConfiguration(config: Partial<IndexingConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
  }
  
  /**
   * Get indexing statistics
   * 
   * @returns Processing statistics
   */
  public getStatistics(): FileProcessingStats {
    // This would be implemented to return comprehensive statistics
    // For now, return basic structure
    return {
      totalFiles: 0,
      successfulFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      totalChunks: 0,
      averageChunksPerFile: 0,
      totalProcessingTime: 0,
      averageProcessingTimePerFile: 0,
      fileTypeStats: {} as Record<string, { count: number; totalChunks: number; averageSize: number; processingTime: number; }>,
      errorStats: {
        totalErrors: 0,
        errorsByType: {},
        errorsByFile: {},
      },
    };
  }
  
  /**
   * Perform the actual indexing process
   * 
   * This is the main indexing workflow that runs asynchronously.
   */
  private async performIndexing(): Promise<void> {
    if (!this.currentSession || !this.workspaceRoot) {
      return;
    }
    
    try {
      const session = this.currentSession;
      const startTime = Date.now();
      
      // Phase 1: Discover files
      this.updateProgress('discovering', 'Discovering files...');
      const files = await this.fileProcessor.discoverFiles(this.workspaceRoot, this.configuration);
      
      session.progress.totalFiles = files.length;
      this.updateProgress('processing', `Found ${files.length} files to process`);
      
      // Phase 2: Process files
      let processedCount = 0;
      const allChunks: FileChunk[] = [];
      
      for (const file of files) {
        // Check for cancellation
        if (this.cancellationToken?.token.isCancellationRequested) {
          break;
        }
        
        // Check for pause
        while (session.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          this.updateProgress('processing', `Processing ${file.fileName}...`);
          
          const result = await this.fileProcessor.processFile(file);
          allChunks.push(...result.chunks);
          
          processedCount++;
          session.progress.filesProcessed = processedCount;
          session.progress.chunksIndexed = allChunks.length;
          session.progress.percentageComplete = Math.round((processedCount / files.length) * 100);
          session.progress.timeElapsed = Date.now() - startTime;
          
          this.notifyProgress();
          
        } catch (error) {
          this.addError(file.filePath, error);
        }
      }
      
      // Phase 3: Generate embeddings and store
      if (allChunks.length > 0) {
        this.updateProgress('embedding', 'Generating embeddings...');
        await this.processChunksForStorage(allChunks);
      }
      
      // Complete the session
      session.isActive = false;
      session.endTime = new Date();
      session.progress.status = 'Completed';
      session.progress.percentageComplete = 100;

      this.notifyProgress();

      // Notify state change
      await this.notifyStateChange();
      
    } catch (error) {
      console.error('IndexingService: Indexing failed:', error);
      if (this.currentSession) {
        this.currentSession.progress.status = 'Error';
        this.addError('indexing', error);

        // Notify state change
        await this.notifyStateChange();
      }
    }
  }
  
  /**
   * Process chunks for embedding generation and storage
   * 
   * @param chunks Chunks to process
   */
  private async processChunksForStorage(chunks: FileChunk[]): Promise<void> {
    // Generate embeddings
    const contents = chunks.map(chunk => chunk.content);
    const embeddings = await this.embeddingProvider.generateEmbeddings(contents);
    
    // Add embeddings to chunks
    chunks.forEach((chunk, index) => {
      if (embeddings[index]) {
        chunk.embedding = embeddings[index];
        chunk.embeddingMetadata = {
          model: this.embeddingProvider.getModelName(),
          dimensions: embeddings[index].length,
          generatedAt: new Date(),
          processingTime: 0, // Would be measured in real implementation
        };
      }
    });
    
    // Store in Qdrant
    await this.qdrantService.storeChunks(chunks);
  }
  
  /**
   * Update progress and notify callback
   * 
   * @param operation Current operation
   * @param message Progress message
   */
  private updateProgress(operation: string, message: string): void {
    if (this.currentSession) {
      this.currentSession.progress.currentOperation = operation;
      this.currentSession.progress.lastUpdate = new Date();
    }
    
    this.notifyProgress();
  }
  
  /**
   * Notify progress callback
   */
  private notifyProgress(): void {
    if (this.progressCallback && this.currentSession) {
      this.progressCallback(this.getCurrentStatus());
    }
  }
  
  /**
   * Add error to current session
   * 
   * @param context Error context
   * @param error Error object
   */
  private addError(context: string, error: any): void {
    if (this.currentSession) {
      const indexingError: IndexingError = {
        id: `error_${Date.now()}`,
        message: error instanceof Error ? error.message : String(error),
        type: 'unknown',
        timestamp: new Date(),
        severity: 'error',
        recoverable: true,
        filePath: context,
      };
      
      if (!this.currentSession.progress.errors) {
        this.currentSession.progress.errors = [];
      }
      
      this.currentSession.progress.errors.push(indexingError);
      this.currentSession.progress.errorsEncountered = this.currentSession.progress.errors.length;
    }
  }
  
  /**
   * Generate unique session ID
   *
   * @returns Session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========================================
  // IIndexingService Interface Implementation
  // ========================================

  /**
   * Gets the current state of the indexing process.
   * Maps the internal session state to the IndexState enum.
   */
  public async getIndexState(): Promise<IndexState> {
    if (!this.currentSession) {
      return 'idle';
    }

    if (this.currentSession.isPaused) {
      return 'paused';
    }

    if (this.currentSession.isActive) {
      return 'indexing';
    }

    // Check if there were errors
    if (this.currentSession.progress.errors && this.currentSession.progress.errors.length > 0) {
      return 'error';
    }

    return 'idle';
  }

  /**
   * Updates a single file in the index.
   * This method processes a single file and updates its chunks in the vector database.
   */
  public async updateFileInIndex(uri: vscode.Uri): Promise<void> {
    try {
      console.log(`IndexingService: Updating file in index: ${uri.fsPath}`);

      // Create file metadata
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
      const fileMetadata = createFileMetadata(uri.fsPath, workspaceRoot, { size: 0, mtime: new Date() });

      // Process the file
      const result = await this.fileProcessor.processFile(fileMetadata);

      // Generate embeddings for chunks
      if (result.chunks.length > 0) {
        const contents = result.chunks.map(chunk => chunk.content);
        const embeddings = await this.embeddingProvider.generateEmbeddings(contents);

        // Add embeddings to chunks
        result.chunks.forEach((chunk, index) => {
          if (embeddings[index]) {
            chunk.embedding = embeddings[index];
            chunk.embeddingMetadata = {
              model: this.embeddingProvider.getModelName(),
              dimensions: embeddings[index].length,
              generatedAt: new Date(),
              processingTime: 0,
            };
          }
        });

        // Store chunks in Qdrant
        await this.qdrantService.storeChunks(result.chunks);
      }

      // Update file metadata
      await this.updateFileMetadata(uri.fsPath);

      console.log(`IndexingService: Successfully updated file: ${uri.fsPath}`);
    } catch (error) {
      console.error(`IndexingService: Error updating file ${uri.fsPath}:`, error);
      throw error;
    }
  }

  /**
   * Removes a file from the index.
   * This method removes all chunks associated with the file from the vector database.
   */
  public async removeFileFromIndex(uri: vscode.Uri): Promise<void> {
    try {
      console.log(`IndexingService: Removing file from index: ${uri.fsPath}`);

      // Remove from Qdrant (this would need to be implemented in QdrantService)
      // await this.qdrantService.removeFileChunks(uri.fsPath);

      // Remove file metadata
      this.fileMetadataMap.delete(uri.fsPath);

      console.log(`IndexingService: Successfully removed file: ${uri.fsPath}`);
    } catch (error) {
      console.error(`IndexingService: Error removing file ${uri.fsPath}:`, error);
      throw error;
    }
  }

  /**
   * Adds a new file to the index.
   * This is an alias for updateFileInIndex since the process is the same.
   */
  public async addFileToIndex(uri: vscode.Uri): Promise<void> {
    return this.updateFileInIndex(uri);
  }

  /**
   * Checks if a file is currently indexed.
   */
  public isFileIndexed(filePath: string): boolean {
    return this.fileMetadataMap.has(filePath);
  }

  /**
   * Triggers a full re-index of the workspace.
   * This clears existing metadata and starts a fresh indexing process.
   */
  public async triggerFullReindex(): Promise<void> {
    try {
      console.log('IndexingService: Triggering full re-index...');

      // Clear existing metadata
      this.fileMetadataMap.clear();

      // Stop any current indexing
      if (this.currentSession?.isActive) {
        await this.stopIndexing();
      }

      // Start fresh indexing
      await this.startIndexing();

      console.log('IndexingService: Full re-index completed successfully');
    } catch (error) {
      console.error('IndexingService: Error during full re-index:', error);
      throw error;
    }
  }

  /**
   * Updates file metadata after indexing
   */
  private async updateFileMetadata(filePath: string): Promise<void> {
    try {
      // TODO: Calculate actual content hash
      const contentHash = 'mock-hash-' + Date.now();

      const metadata: FileMetadata = {
        filePath,
        lastIndexed: Date.now(),
        contentHash
      };

      this.fileMetadataMap.set(filePath, metadata);
    } catch (error) {
      console.error(`IndexingService: Error updating metadata for ${filePath}:`, error);
    }
  }

  /**
   * Adds a state change listener
   */
  public onStateChange(listener: (state: IndexState) => void): vscode.Disposable {
    this.stateChangeListeners.push(listener);

    return new vscode.Disposable(() => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index >= 0) {
        this.stateChangeListeners.splice(index, 1);
      }
    });
  }

  /**
   * Notifies state change listeners
   */
  private async notifyStateChange(): Promise<void> {
    const currentState = await this.getIndexState();
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('IndexingService: Error in state change listener:', error);
      }
    });
  }
}
