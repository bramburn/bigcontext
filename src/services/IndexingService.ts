/**
 * Indexing Service
 * 
 * This service manages the indexing process for the RAG for LLM VS Code extension.
 * It orchestrates file discovery, processing, chunking, embedding generation,
 * and storage in the vector database.
 * 
 * The service provides progress tracking, error handling, and supports both
 * sequential and parallel processing modes.
 */

import * as vscode from 'vscode';
import * as path from 'path';
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
 * IndexingService Class
 * 
 * Provides centralized management of the indexing process including:
 * - File discovery and filtering
 * - File processing and chunking
 * - Embedding generation
 * - Vector storage
 * - Progress tracking and error handling
 * - Session management (start, pause, resume, stop)
 */
export class IndexingService {
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
   * Start indexing process
   * 
   * Begins a new indexing session for the current workspace.
   * 
   * @param progressCallback Optional callback for progress updates
   * @returns Operation result
   */
  public async startIndexing(
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
   * Pause indexing process
   * 
   * @returns Operation result
   */
  public async pauseIndexing(): Promise<IndexingOperationResult> {
    if (!this.currentSession?.isActive) {
      return {
        success: false,
        message: 'No active indexing session to pause',
      };
    }
    
    this.currentSession.isPaused = true;
    this.currentSession.progress.status = 'Paused';
    
    return {
      success: true,
      message: 'Indexing paused successfully',
    };
  }
  
  /**
   * Resume indexing process
   * 
   * @returns Operation result
   */
  public async resumeIndexing(): Promise<IndexingOperationResult> {
    if (!this.currentSession?.isPaused) {
      return {
        success: false,
        message: 'No paused indexing session to resume',
      };
    }
    
    this.currentSession.isPaused = false;
    this.currentSession.progress.status = 'In Progress';
    
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
      fileTypeStats: {},
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
          
          const chunks = await this.fileProcessor.processFile(file);
          allChunks.push(...chunks);
          
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
      
    } catch (error) {
      console.error('IndexingService: Indexing failed:', error);
      if (this.currentSession) {
        this.currentSession.progress.status = 'Error';
        this.addError('indexing', error);
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
}
