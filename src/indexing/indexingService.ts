/**
 * Code indexing and search service for the VS Code extension.
 *
 * This module provides the core functionality for indexing code files in a workspace,
 * generating embeddings, and storing them in a vector database for semantic search.
 * It orchestrates the entire indexing pipeline from file discovery to vector storage.
 *
 * The indexing process follows these main steps:
 * 1. File discovery - Find all relevant code files in the workspace
 * 2. AST parsing - Parse each file to understand its structure
 * 3. Chunking - Break down code into semantic units (functions, classes, etc.)
 * 4. Embedding generation - Create vector representations of each chunk
 * 5. Vector storage - Store embeddings in Qdrant for efficient semantic search
 *
 * The service supports both parallel processing using worker threads and sequential
 * processing as a fallback. It also provides progress tracking, pause/resume functionality,
 * and comprehensive error handling throughout the pipeline.
 */
import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Worker, isMainThread } from "worker_threads";
import { FileWalker } from "./fileWalker";
import { AstParser, SupportedLanguage } from "../parsing/astParser";
import { Chunker, CodeChunk, ChunkType } from "../parsing/chunker";
import { QdrantService } from "../db/qdrantService";
import {
  IEmbeddingProvider,
  EmbeddingProviderFactory,
  EmbeddingConfig,
} from "../embeddings/embeddingProvider";
import { LSPService } from "../lsp/lspService";
import { StateManager } from "../stateManager";
import { WorkspaceManager } from "../workspaceManager";
import { ConfigService } from "../configService";
import { CentralizedLoggingService } from "../logging/centralizedLoggingService";
import { TelemetryService } from "../telemetry/telemetryService";

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
  currentPhase:
    | "discovering"
    | "parsing"
    | "chunking"
    | "embedding"
    | "storing"
    | "complete";
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
  /** Workspace manager for handling multi-workspace support */
  private workspaceManager: WorkspaceManager;
  /** Configuration service for accessing extension settings */
  private configService: ConfigService;
  /** Centralized logging service for unified logging */
  private loggingService: CentralizedLoggingService;
  /** Telemetry service for anonymous usage analytics */
  private telemetryService?: TelemetryService;
  /** Flag to track if indexing is currently paused */
  private isPaused: boolean = false;
  /** Flag to track if indexing should be cancelled */
  private isCancelled: boolean = false;
  /** Flag to track if indexing should be stopped */
  private isStopped: boolean = false;
  /** Queue of remaining files to process (used for pause/resume functionality) */
  private remainingFiles: string[] = [];
  /** Current indexing progress callback */
  private currentProgressCallback?: (progress: IndexingProgress) => void;
  /** Abort controller for cancelling operations */
  private abortController?: AbortController;
  /** Worker pool for parallel processing */
  private workerPool: Worker[] = [];
  /** Queue of files waiting to be processed */
  private fileQueue: string[] = [];
  /** Number of currently active workers */
  private activeWorkers: number = 0;
  /** Map to track worker states and assignments */
  private workerStates: Map<Worker, { busy: boolean; currentFile?: string }> =
    new Map();
  /** Aggregated results from workers */
  private aggregatedResults: {
    chunks: CodeChunk[];
    embeddings: number[][];
    stats: {
      filesByLanguage: Record<string, number>;
      chunksByType: Record<ChunkType, number>;
      totalLines: number;
      totalBytes: number;
    };
    errors: string[];
  } = {
    chunks: [],
    embeddings: [],
    stats: {
      filesByLanguage: {},
      chunksByType: {} as Record<ChunkType, number>,
      totalLines: 0,
      totalBytes: 0,
    },
    errors: [],
  };
  /** Flag to track if parallel processing is enabled */
  private useParallelProcessing: boolean = true;

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
   * @param workspaceManager - Injected WorkspaceManager instance
   * @param configService - Injected ConfigService instance
   * @param loggingService - Injected CentralizedLoggingService instance
   * @param telemetryService - Optional TelemetryService instance for analytics
   */
  constructor(
    workspaceRoot: string,
    fileWalker: FileWalker,
    astParser: AstParser,
    chunker: Chunker,
    qdrantService: QdrantService,
    embeddingProvider: IEmbeddingProvider,
    lspService: LSPService,
    stateManager: StateManager,
    workspaceManager: WorkspaceManager,
    configService: ConfigService,
    loggingService: CentralizedLoggingService,
    telemetryService?: TelemetryService,
  ) {
    this.workspaceRoot = workspaceRoot;
    this.fileWalker = fileWalker;
    this.astParser = astParser;
    this.chunker = chunker;
    this.qdrantService = qdrantService;
    this.embeddingProvider = embeddingProvider;
    this.lspService = lspService;
    this.stateManager = stateManager;
    this.workspaceManager = workspaceManager;
    this.configService = configService;
    this.loggingService = loggingService;
    this.telemetryService = telemetryService;

    // Initialize worker pool if we're in the main thread
    if (isMainThread) {
      this.initializeWorkerPool();
    }
  }

  /**
   * Initialize the worker pool for parallel processing.
   * Creates a pool of worker threads based on available CPU cores.
   *
   * This method:
   * 1. Determines the optimal number of worker threads based on CPU cores
   * 2. Creates worker threads with appropriate configuration
   * 3. Sets up event handlers for each worker
   * 4. Initializes worker state tracking
   *
   * The worker pool enables parallel processing of files, significantly
   * improving indexing performance on multi-core systems.
   */
  private initializeWorkerPool(): void {
    try {
      const numCpus = os.cpus().length;
      const numWorkers = Math.max(1, numCpus - 1); // Use at least 1 worker, leave one CPU for main thread

      this.loggingService.info(
        `Initializing worker pool with ${numWorkers} workers (${numCpus} CPUs available)`,
        {},
        "IndexingService",
      );

      for (let i = 0; i < numWorkers; i++) {
        const workerPath = path.join(__dirname, "indexingWorker.js");

        // Create embedding configuration for worker
        const providerType = this.configService.getEmbeddingProvider();
        const embeddingConfig = {
          provider: providerType,
          model:
            providerType === "ollama"
              ? this.configService.getOllamaConfig().model
              : this.configService.getOpenAIConfig().model,
          apiKey:
            providerType === "openai"
              ? this.configService.getOpenAIConfig().apiKey
              : undefined,
          apiUrl:
            providerType === "ollama"
              ? this.configService.getOllamaConfig().apiUrl
              : undefined,
        };

        const worker = new Worker(workerPath, {
          workerData: {
            workspaceRoot: this.workspaceRoot,
            embeddingConfig,
          },
        });

        // Set up worker event handlers
        this.setupWorkerEventHandlers(worker);

        // Initialize worker state
        this.workerStates.set(worker, { busy: false });
        this.workerPool.push(worker);
      }

      this.loggingService.info(
        `Worker pool initialized with ${this.workerPool.length} workers`,
        {},
        "IndexingService",
      );
    } catch (error) {
      this.loggingService.error(
        "Failed to initialize worker pool",
        { error: error instanceof Error ? error.message : String(error) },
        "IndexingService",
      );
      this.useParallelProcessing = false;
      this.loggingService.info(
        "Falling back to sequential processing",
        {},
        "IndexingService",
      );
    }
  }

  /**
   * Set up event handlers for a worker thread.
   *
   * Configures the necessary event listeners for worker thread communication:
   * - 'message' event: Handles messages sent from the worker thread
   * - 'error' event: Handles errors that occur in the worker thread
   * - 'exit' event: Handles worker thread termination
   *
   * @param worker - The worker thread instance to configure
   */
  private setupWorkerEventHandlers(worker: Worker): void {
    worker.on("message", (message) => {
      this.handleWorkerMessage(worker, message);
    });

    worker.on("error", (error) => {
      this.loggingService.error(
        "Worker error",
        { error: error.message },
        "IndexingService",
      );
      this.handleWorkerError(worker, error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        this.loggingService.error(
          `Worker exited with code ${code}`,
          { exitCode: code },
          "IndexingService",
        );
      }
      this.handleWorkerExit(worker, code);
    });
  }

  /**
   * Handle messages from worker threads.
   *
   * Processes different types of messages sent from worker threads:
   * - 'ready': Worker initialization complete
   * - 'processed': Worker has finished processing a file
   * - 'error': Worker encountered an error during processing
   *
   * This method routes each message type to the appropriate handler
   * and maintains the overall state of the worker pool.
   *
   * @param worker - The worker thread that sent the message
   * @param message - The message object received from the worker
   */
  private handleWorkerMessage(worker: Worker, message: any): void {
    const workerState = this.workerStates.get(worker);
    if (!workerState) return;

    switch (message.type) {
      case "ready":
        this.loggingService.debug("Worker ready", {}, "IndexingService");
        break;

      case "processed":
        this.handleProcessedFile(worker, message.data);
        break;

      case "error":
        this.loggingService.error(
          "Worker processing error",
          { error: message.error },
          "IndexingService",
        );
        this.aggregatedResults.errors.push(message.error);
        this.markWorkerIdle(worker);
        this.processNextFile();
        break;

      default:
        this.loggingService.warn(
          "Unknown worker message type",
          { messageType: message.type },
          "IndexingService",
        );
    }
  }

  /**
   * Handle processed file data from worker.
   *
   * This method:
   * 1. Aggregates chunks and embeddings from the worker
   * 2. Updates statistics (file counts by language, line counts, etc.)
   * 3. Updates chunk type statistics
   * 4. Collects any errors reported by the worker
   * 5. Marks the worker as idle and processes the next file
   *
   * This is a critical part of the parallel processing pipeline as it
   * consolidates results from multiple workers into a single dataset.
   *
   * @param worker - The worker thread that processed the file
   * @param data - The processing results including chunks and embeddings
   */
  private handleProcessedFile(worker: Worker, data: any): void {
    try {
      // Aggregate chunks and embeddings
      this.aggregatedResults.chunks.push(...data.chunks);
      this.aggregatedResults.embeddings.push(...data.embeddings);

      // Update statistics
      if (data.language) {
        this.aggregatedResults.stats.filesByLanguage[data.language] =
          (this.aggregatedResults.stats.filesByLanguage[data.language] || 0) +
          1;
      }

      this.aggregatedResults.stats.totalLines += data.lineCount;
      this.aggregatedResults.stats.totalBytes += data.byteCount;

      // Update chunk type statistics
      for (const chunk of data.chunks) {
        const chunkType = chunk.type as ChunkType;
        this.aggregatedResults.stats.chunksByType[chunkType] =
          (this.aggregatedResults.stats.chunksByType[chunkType] || 0) + 1;
      }

      // Add any errors
      if (data.errors && data.errors.length > 0) {
        this.aggregatedResults.errors.push(...data.errors);
      }

      console.log(
        `IndexingService: Processed ${data.filePath} - ${data.chunks.length} chunks, ${data.embeddings.length} embeddings`,
      );

      // Mark worker as idle and process next file
      this.markWorkerIdle(worker);
      this.processNextFile();
    } catch (error) {
      console.error("IndexingService: Error handling processed file:", error);
      this.aggregatedResults.errors.push(
        `Error handling processed file: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.markWorkerIdle(worker);
      this.processNextFile();
    }
  }

  /**
   * Handle worker errors.
   *
   * Processes errors that occur in worker threads:
   * 1. Logs the error to the console
   * 2. Adds the error to the aggregated results
   * 3. Marks the worker as idle so it can process other files
   * 4. Triggers processing of the next file in the queue
   *
   * This error handling ensures that a single file failure doesn't
   * stop the entire indexing process.
   *
   * @param worker - The worker thread that encountered the error
   * @param error - The error object from the worker
   */
  private handleWorkerError(worker: Worker, error: Error): void {
    console.error("IndexingService: Worker error:", error);
    this.aggregatedResults.errors.push(`Worker error: ${error.message}`);
    this.markWorkerIdle(worker);
    this.processNextFile();
  }

  /**
   * Handle worker exit.
   *
   * Manages worker thread termination:
   * 1. Logs the exit code
   * 2. Removes the worker from the pool and state tracking
   * 3. If the worker exited unexpectedly during processing,
   *    adjusts the active worker count and processes the next file
   *
   * This method ensures proper cleanup of worker resources and
   * maintains the integrity of the worker pool.
   *
   * @param worker - The worker thread that exited
   * @param code - The exit code (0 for normal exit, non-zero for error)
   */
  private handleWorkerExit(worker: Worker, code: number): void {
    console.log(`IndexingService: Worker exited with code ${code}`);

    // Remove worker from pool and state tracking
    const index = this.workerPool.indexOf(worker);
    if (index > -1) {
      this.workerPool.splice(index, 1);
    }
    this.workerStates.delete(worker);

    // If worker exited unexpectedly during processing, handle it
    if (code !== 0) {
      this.activeWorkers = Math.max(0, this.activeWorkers - 1);
      this.processNextFile();
    }
  }

  /**
   * Mark a worker as idle and available for new tasks.
   *
   * Updates the worker's state in the tracking map:
   * 1. Sets the busy flag to false
   * 2. Clears the currentFile reference
   * 3. Decrements the active worker count
   *
   * This method is essential for the worker pool management system
   * as it makes workers available for processing new files.
   *
   * @param worker - The worker thread to mark as idle
   */
  private markWorkerIdle(worker: Worker): void {
    const workerState = this.workerStates.get(worker);
    if (workerState) {
      workerState.busy = false;
      workerState.currentFile = undefined;
    }
    this.activeWorkers = Math.max(0, this.activeWorkers - 1);
  }

  /**
   * Process the next file in the queue using available workers.
   *
   * This method is the core of the worker scheduling system:
   * 1. Checks if there are files remaining in the queue
   * 2. If the queue is empty and all workers are idle, triggers completion
   * 3. Finds an idle worker if available
   * 4. Assigns the next file from the queue to the idle worker
   *
   * The method is called recursively after each file is processed,
   * ensuring continuous utilization of all available workers.
   */
  private processNextFile(): void {
    // Do not dispatch new work when paused
    if (this.isPaused) {
      console.log("IndexingService: Paused - not dispatching new files");
      return;
    }

    if (this.fileQueue.length === 0) {
      // Check if all workers are idle
      if (this.activeWorkers === 0) {
        console.log("IndexingService: All files processed, workers idle");
        this.onAllFilesProcessed();
      }
      return;
    }

    // Find an idle worker
    const idleWorker = this.workerPool.find((worker) => {
      const state = this.workerStates.get(worker);
      return state && !state.busy;
    });

    if (idleWorker && this.fileQueue.length > 0) {
      const filePath = this.fileQueue.shift();
      if (filePath) {
        this.assignFileToWorker(idleWorker, filePath);
      }
    }
  }

  /**
   * Assign a file to a specific worker for processing.
   *
   * This method:
   * 1. Updates the worker's state to busy and sets its current file
   * 2. Increments the active worker count
   * 3. Sends a message to the worker with the file to process
   * 4. Logs the assignment for debugging purposes
   *
   * This is the key method that distributes work among the worker threads.
   *
   * @param worker - The worker thread to assign the file to
   * @param filePath - The path of the file to be processed
   */
  private assignFileToWorker(worker: Worker, filePath: string): void {
    const workerState = this.workerStates.get(worker);
    if (!workerState) return;

    workerState.busy = true;
    workerState.currentFile = filePath;
    this.activeWorkers++;

    // Send file to worker for processing
    worker.postMessage({
      type: "processFile",
      filePath,
      workspaceRoot: this.workspaceRoot,
    });

    console.log(
      `IndexingService: Assigned ${filePath} to worker (${this.activeWorkers} active workers)`,
    );
  }

  /**
   * Called when all files have been processed by workers.
   *
   * This is a placeholder method that gets overridden during parallel processing.
   * The actual implementation is set dynamically in processFilesInParallel()
   * to resolve the promise when all files are processed.
   *
   * In the default implementation, it simply logs a message indicating
   * that all files have been processed.
   */
  private onAllFilesProcessed(): void {
    console.log("IndexingService: All files processed by workers");
    // This will be called by the modified startIndexing method
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
    progressCallback?: (progress: IndexingProgress) => void,
  ): Promise<IndexingResult> {
    // Check if indexing is already in progress
    if (this.stateManager.isIndexing()) {
      this.loggingService.warn(
        "Indexing already in progress, skipping new request",
        {},
        "IndexingService",
      );
      throw new Error("Indexing is already in progress");
    }

    const startTime = Date.now();

    // Track indexing start
    this.telemetryService?.trackEvent('indexing_started', {
      timestamp: startTime
    });
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
        vectorDimensions: 0,
      },
    };

    // Set indexing state to true and reset cancellation flags
    this.isCancelled = false;
    this.isStopped = false;
    this.isPaused = false;
    this.abortController = new AbortController();
    this.stateManager.setIndexing(true, "Starting indexing process");

    try {
      // Phase 1: Initialize embedding provider
      // This must be done first as it's required for the rest of the pipeline
      progressCallback?.({
        currentFile: "",
        processedFiles: 0,
        totalFiles: 0,
        currentPhase: "discovering",
        chunks: [],
        errors: [],
      });

      // Phase 2: Discover files
      // Find all relevant files in the workspace that match our patterns
      progressCallback?.({
        currentFile: "",
        processedFiles: 0,
        totalFiles: 0,
        currentPhase: "discovering",
        chunks: [],
        errors: [],
      });

      const files = await this.fileWalker.findAllFiles();
      const codeFiles = files.filter((file) =>
        this.fileWalker.isCodeFile(file),
      );

      result.totalFiles = codeFiles.length;

      // If no code files found, return early with success status
      if (codeFiles.length === 0) {
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Phase 3: Process files
      // Use parallel processing if available, otherwise fall back to sequential
      this.currentProgressCallback = progressCallback;

      if (this.useParallelProcessing && this.workerPool.length > 0) {
        console.log(
          `IndexingService: Starting parallel processing with ${this.workerPool.length} workers`,
        );
        await this.processFilesInParallel(codeFiles, progressCallback);

        // Copy aggregated results to main result object
        result.chunks = this.aggregatedResults.chunks;
        result.stats.filesByLanguage =
          this.aggregatedResults.stats.filesByLanguage;
        result.stats.chunksByType = this.aggregatedResults.stats.chunksByType;
        result.stats.totalLines = this.aggregatedResults.stats.totalLines;
        result.stats.totalBytes = this.aggregatedResults.stats.totalBytes;
        result.errors.push(...this.aggregatedResults.errors);
        result.processedFiles = codeFiles.length;
      } else {
        console.log(
          "IndexingService: Using sequential processing (parallel processing disabled or unavailable)",
        );
        await this.processFilesSequentially(
          codeFiles,
          result,
          progressCallback,
        );

        // If paused during sequential processing, wait for resume and continue
        if (this.isPaused) {
          console.log("IndexingService: Sequential processing paused, waiting to resume...");
          await new Promise<void>((resolve) => {
            const check = () => {
              if (!this.isPaused) {
                resolve();
              } else {
                setTimeout(check, 250);
              }
            };
            check();
          });

          if (this.remainingFiles.length > 0) {
            const remaining = [...this.remainingFiles];
            this.remainingFiles = [];
            console.log(`IndexingService: Resuming sequential processing of ${remaining.length} files`);
            await this.processFilesSequentially(remaining, result, progressCallback);
          }
        }
      }

      // Phase 4: Handle embeddings and storage
      // For parallel processing, embeddings are already generated by workers
      // For sequential processing, we need to generate them here
      let embeddings: number[][] = [];

      if (result.chunks.length > 0 && this.embeddingProvider) {
        if (
          this.useParallelProcessing &&
          this.aggregatedResults.embeddings.length > 0
        ) {
          // Use embeddings from parallel processing
          embeddings = this.aggregatedResults.embeddings;
          console.log(
            `IndexingService: Using ${embeddings.length} embeddings from parallel processing`,
          );
        } else {
          // Generate embeddings for sequential processing
          progressCallback?.({
            currentFile: "",
            processedFiles: result.processedFiles,
            totalFiles: result.totalFiles,
            currentPhase: "embedding",
            chunks: result.chunks,
            errors: result.errors,
            embeddingProgress: {
              processedChunks: 0,
              totalChunks: result.chunks.length,
            },
          });

          const chunkContents = result.chunks.map((chunk) => chunk.content);
          embeddings =
            await this.embeddingProvider.generateEmbeddings(chunkContents);
        }

        result.stats.totalEmbeddings = embeddings.length;
        result.stats.vectorDimensions = this.embeddingProvider.getDimensions();
        result.embeddingProvider = this.embeddingProvider.getProviderName();

        // Phase 5: Store in Qdrant
        // Store the chunks and their embeddings in the vector database
        progressCallback?.({
          currentFile: "",
          processedFiles: result.processedFiles,
          totalFiles: result.totalFiles,
          currentPhase: "storing",
          chunks: result.chunks,
          errors: result.errors,
        });

        const collectionName = this.generateCollectionName();
        result.collectionName = collectionName;

        // Create collection if it doesn't exist
        const collectionCreated =
          await this.qdrantService.createCollectionIfNotExists(
            collectionName,
            this.embeddingProvider.getDimensions(),
          );

        if (!collectionCreated) {
          result.errors.push("Failed to create Qdrant collection");
        } else {
          // Store chunks with embeddings
          const stored = await this.qdrantService.upsertChunks(
            collectionName,
            result.chunks,
            embeddings,
          );

          if (!stored) {
            result.errors.push("Failed to store chunks in Qdrant");
          }
        }
      }

      // Phase 6: Complete
      // Mark the indexing process as complete
      progressCallback?.({
        currentFile: "",
        processedFiles: result.processedFiles,
        totalFiles: result.totalFiles,
        currentPhase: "complete",
        chunks: result.chunks,
        errors: result.errors,
      });

      result.success = true;
      result.duration = Date.now() - startTime;

      // Track successful indexing completion
      this.telemetryService?.trackEvent('indexing_completed', {
        duration: result.duration,
        fileCount: result.processedFiles,
        chunkCount: result.chunks.length,
        errorCount: result.errors.length,
        success: true
      });

    } catch (error) {
      const errorMessage = `Indexing failed: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMessage);
      console.error(errorMessage);
      this.stateManager.setError(errorMessage);

      // Track failed indexing
      const duration = Date.now() - startTime;
      this.telemetryService?.trackEvent('indexing_completed', {
        duration,
        fileCount: result.processedFiles,
        chunkCount: result.chunks.length,
        errorCount: result.errors.length,
        success: false
      });

    } finally {
      // Only clear indexing flag if not paused
      if (!this.isPaused) {
        this.stateManager.setIndexing(false);
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Process files in parallel using worker threads.
   *
   * This method implements a sophisticated parallel processing system:
   * 1. Resets aggregated results to collect new data
   * 2. Initializes the file queue with all code files
   * 3. Sets up a completion handler to resolve the promise when done
   * 4. Configures progress tracking and reporting
   * 5. Overrides the handleProcessedFile method to track progress
   * 6. Starts processing by filling the worker pool
   * 7. Sets a safety timeout to prevent infinite waiting
   *
   * The parallel processing significantly improves indexing performance
   * on multi-core systems by distributing work across worker threads.
   *
   * @param codeFiles - Array of file paths to process
   * @param progressCallback - Optional callback for reporting progress
   * @returns Promise that resolves when all files are processed
   */
  private async processFilesInParallel(
    codeFiles: string[],
    progressCallback?: (progress: IndexingProgress) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Reset aggregated results
      this.aggregatedResults = {
        chunks: [],
        embeddings: [],
        stats: {
          filesByLanguage: {},
          chunksByType: {} as Record<ChunkType, number>,
          totalLines: 0,
          totalBytes: 0,
        },
        errors: [],
      };

      // Initialize file queue and counters
      this.fileQueue = [...codeFiles];
      this.activeWorkers = 0;
      let processedFiles = 0;

      // Set up completion handler
      const originalOnAllFilesProcessed = this.onAllFilesProcessed;
      this.onAllFilesProcessed = () => {
        console.log(
          `IndexingService: Parallel processing complete. Processed ${processedFiles} files.`,
        );
        this.onAllFilesProcessed = originalOnAllFilesProcessed; // Restore original handler
        resolve();
      };

      // Set up progress tracking
      const updateProgress = () => {
        progressCallback?.({
          currentFile: "",
          processedFiles,
          totalFiles: codeFiles.length,
          currentPhase: "parsing",
          chunks: this.aggregatedResults.chunks,
          errors: this.aggregatedResults.errors,
        });
      };

      // Override handleProcessedFile to track progress
      const originalHandleProcessedFile = this.handleProcessedFile.bind(this);
      this.handleProcessedFile = (worker: Worker, data: any) => {
        originalHandleProcessedFile(worker, data);
        processedFiles++;
        updateProgress();
      };

      // Start processing by filling the worker pool
      const initialBatch = Math.min(
        this.workerPool.length,
        this.fileQueue.length,
      );
      for (let i = 0; i < initialBatch; i++) {
        this.processNextFile();
      }

      // Initial progress update
      updateProgress();

      // Set timeout as safety net
      const timeout = setTimeout(() => {
        console.error("IndexingService: Parallel processing timeout");
        reject(new Error("Parallel processing timeout"));
      }, 300000); // 5 minutes timeout

      // Clear timeout when processing completes
      const originalResolve = resolve;
      resolve = () => {
        clearTimeout(timeout);
        originalResolve();
      };
    });
  }

  /**
   * Process files sequentially (fallback method).
   *
   * This method provides a sequential processing alternative when parallel
   * processing is unavailable or disabled:
   * 1. Processes each file one at a time
   * 2. Checks for pause flag before each file
   * 3. Updates progress after each file
   * 4. Collects results and statistics
   * 5. Applies throttling based on indexing intensity setting
   *
   * While slower than parallel processing, this method ensures compatibility
   * with all environments and provides more predictable resource usage.
   *
   * @param codeFiles - Array of file paths to process
   * @param result - Result object to populate with data
   * @param progressCallback - Optional callback for reporting progress
   * @returns Promise that resolves when all files are processed
   */
  private async processFilesSequentially(
    codeFiles: string[],
    result: IndexingResult,
    progressCallback?: (progress: IndexingProgress) => void,
  ): Promise<void> {
    for (let i = 0; i < codeFiles.length; i++) {
      // Check for pause, cancel, or stop flags before processing each file
      if (this.isPaused) {
        console.log(
          "IndexingService: Indexing paused, saving remaining files...",
        );
        this.remainingFiles = codeFiles.slice(i); // Save remaining files for later resumption
        result.success = false; // Mark as incomplete due to pause
        return;
      }

      if (this.isCancelled || this.isStopped) {
        console.log(
          `IndexingService: Indexing ${this.isCancelled ? 'cancelled' : 'stopped'}, aborting...`,
        );
        result.success = false;
        result.errors.push(`Indexing ${this.isCancelled ? 'cancelled' : 'stopped'} by user`);
        return;
      }

      const filePath = codeFiles[i];

      try {
        progressCallback?.({
          currentFile: filePath,
          processedFiles: i,
          totalFiles: codeFiles.length,
          currentPhase: "parsing",
          chunks: result.chunks,
          errors: result.errors,
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

      // Apply throttling based on indexing intensity setting
      // This helps manage CPU usage and battery consumption by introducing
      // controlled delays between file processing operations
      const delayMs = this.getDelayForIntensity();
      if (delayMs > 0) {
        await this.delay(delayMs); // Pause briefly to reduce resource usage
      }
    }
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
      // This is the first step in processing any file - we need the raw content
      // before we can do any parsing or analysis
      const content = await fs.promises.readFile(filePath, "utf8");
      const lineCount = content.split("\n").length; // Count lines for statistics
      const byteCount = Buffer.byteLength(content, "utf8"); // Get file size for statistics

      // Determine language based on file extension
      // We need to know the language to use the correct parser implementation
      // as each language has its own AST structure and parsing rules
      const language = this.getLanguage(filePath);
      if (!language) {
        // If we can't determine the language, we can't parse the file
        // so we return early with an error
        return {
          success: false,
          chunks: [],
          lineCount,
          byteCount,
          errors: [`Unsupported file type: ${filePath}`],
        };
      }

      // Parse AST (Abstract Syntax Tree)
      // This creates a structured representation of the code that captures
      // its semantic structure (functions, classes, variables, etc.)
      // We use error recovery to handle partial parsing even when there are syntax errors
      const parseResult = this.astParser.parseWithErrorRecovery(
        language,
        content,
      );
      if (parseResult.errors.length > 0) {
        // Collect parsing errors but continue if possible
        errors.push(...parseResult.errors.map((err) => `${filePath}: ${err}`));
      }

      if (!parseResult.tree) {
        // If parsing completely failed and we couldn't get a tree,
        // we can't proceed with chunking, so return with error
        return {
          success: false,
          chunks: [],
          language,
          lineCount,
          byteCount,
          errors: [`Failed to parse AST for ${filePath}`, ...errors],
        };
      }

      // Create chunks from the AST
      // Break down the code into manageable semantic pieces (functions, classes, methods)
      // that will be used for embedding generation and semantic search
      const chunks = this.chunker.chunk(
        filePath,
        parseResult.tree,
        content,
        language,
      );

      // Enhance chunks with LSP (Language Server Protocol) metadata
      // This adds rich semantic information like symbols, definitions, references, and hover info
      // which improves the quality of embeddings and search results
      const enhancedChunks = await this.enhanceChunksWithLSP(
        chunks,
        filePath,
        content,
        language,
      );

      return {
        success: true,
        chunks: enhancedChunks,
        language,
        lineCount,
        byteCount,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        chunks: [],
        lineCount: 0,
        byteCount: 0,
        errors: [
          `Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        ],
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
    language: SupportedLanguage,
  ): Promise<CodeChunk[]> {
    try {
      // Check if LSP is available for this language
      const isLSPAvailable = await this.lspService.isLSPAvailable(language);
      if (!isLSPAvailable) {
        console.log(
          `LSP not available for ${language}, skipping LSP enhancement`,
        );
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
            language,
          );

          enhancedChunks.push({
            ...chunk,
            lspMetadata,
          });
        } catch (error) {
          console.warn(
            `Failed to get LSP metadata for chunk in ${filePath}:`,
            error,
          );
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
   * Simple delay helper function for throttling indexing operations
   *
   * This function creates a promise that resolves after the specified number
   * of milliseconds, allowing the indexing process to yield CPU time to other
   * operations and reduce resource consumption.
   *
   * @param ms - Number of milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Gets the appropriate delay based on the current indexing intensity setting
   *
   * This method reads the indexing intensity from configuration and returns
   * the corresponding delay in milliseconds to throttle the indexing process.
   *
   * @returns Number of milliseconds to delay between file processing
   */
  private getDelayForIntensity(): number {
    const intensity = this.configService.getIndexingIntensity();

    switch (intensity) {
      case "Low":
        return 500; // 500ms delay - battery friendly
      case "Medium":
        return 100; // 100ms delay - moderate speed
      case "High":
      default:
        return 0; // No delay - maximum speed
    }
  }

  /**
   * Generates a unique collection name for the Qdrant database.
   *
   * This method uses the WorkspaceManager to create a workspace-specific
   * collection name. This ensures that each workspace has its own isolated
   * index and collections don't interfere with each other.
   *
   * @returns A unique collection name string for the current workspace
   */
  private generateCollectionName(): string {
    // Use the WorkspaceManager to generate a workspace-specific collection name
    // This ensures proper isolation between different workspaces
    return this.workspaceManager.generateCollectionName();
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
      estimatedIndexingTime,
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
      throw new Error("Embedding provider not available");
    }

    if (!this.embeddingProvider) {
      throw new Error("Embedding provider not available");
    }

    try {
      // Generate embedding for the query
      // This converts the natural language query into a vector representation
      const queryEmbeddings = await this.embeddingProvider.generateEmbeddings([
        query,
      ]);
      if (queryEmbeddings.length === 0) {
        return [];
      }

      const collectionName = this.generateCollectionName();

      // Search in Qdrant
      // This finds the most similar code chunks based on vector similarity
      const results = await this.qdrantService.search(
        collectionName,
        queryEmbeddings[0],
        limit,
      );

      return results;
    } catch (error) {
      console.error("Search failed:", error);
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
      const content = Buffer.from(fileContent).toString("utf8");

      // Process the file to get chunks
      const fileResult = await this.processFile(uri.fsPath);

      if (!fileResult.success || fileResult.chunks.length === 0) {
        console.warn(
          `IndexingService: Failed to process file or no chunks generated: ${uri.fsPath}`,
        );
        return;
      }

      // Generate embeddings for the chunks
      const chunkContents = fileResult.chunks.map((chunk) => chunk.content);
      const embeddings =
        await this.embeddingProvider.generateEmbeddings(chunkContents);

      if (embeddings.length !== fileResult.chunks.length) {
        console.error(
          `IndexingService: Embedding count mismatch for ${uri.fsPath}: ${embeddings.length} embeddings for ${fileResult.chunks.length} chunks`,
        );
        return;
      }

      // Store the chunks and embeddings in Qdrant
      const collectionName = this.generateCollectionName();
      const success = await this.qdrantService.upsertChunks(
        collectionName,
        fileResult.chunks,
        embeddings,
      );

      if (success) {
        console.log(
          `IndexingService: Successfully updated ${fileResult.chunks.length} chunks for file: ${uri.fsPath}`,
        );
      } else {
        console.error(
          `IndexingService: Failed to upsert chunks for file: ${uri.fsPath}`,
        );
      }
    } catch (error) {
      console.error(
        `IndexingService: Error updating file in index ${uri.fsPath}:`,
        error,
      );
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

      console.log(
        `IndexingService: Successfully removed file from index: ${relativePath}`,
      );
    } catch (error) {
      console.error(
        `IndexingService: Error removing file from index ${uri.fsPath}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Pauses the current indexing operation
   *
   * This method gracefully pauses the indexing process between files,
   * preserving the current state and remaining files to be processed.
   * The indexing can be resumed later from where it left off.
   */
  public pause(): void {
    if (!this.stateManager.isIndexing()) {
      console.warn(
        "IndexingService: Cannot pause - no indexing operation in progress",
      );
      return;
    }

    console.log("IndexingService: Pausing indexing operation...");
    this.isPaused = true;
    this.stateManager.setPaused(true);
    this.stateManager.setIndexingMessage("Indexing paused");

    console.log(
      `IndexingService: Indexing paused. ${this.remainingFiles.length} files remaining.`,
    );
  }

  /**
   * Resumes a paused indexing operation
   *
   * This method continues the indexing process from where it was paused,
   * using the saved state and remaining files queue.
   */
  public async resume(): Promise<void> {
    if (!this.stateManager.isPaused()) {
      console.warn("IndexingService: Cannot resume - indexing is not paused");
      return;
    }

    console.log("IndexingService: Resuming indexing operation...");
    this.isPaused = false;
    this.stateManager.setPaused(false);
    this.stateManager.setIndexingMessage("Resuming indexing...");

    // Continue processing from where we left off
    if (this.useParallelProcessing && this.workerPool.length > 0) {
      await this.continueIndexing();
    } else {
      // In sequential mode, startIndexing's control flow will continue after pause
      if (this.remainingFiles.length === 0) {
        console.log("IndexingService: No remaining files to process");
        this.stateManager.setIndexing(false);
        this.stateManager.setIndexingMessage(null);
      }
    }
  }

  /**
   * Continues indexing from a paused state
   *
   * This private method handles the continuation of indexing after a resume,
   * processing the remaining files in the queue.
   */
  private async continueIndexing(): Promise<void> {
    console.log(
      `IndexingService: Continuing indexing. Parallel=${this.useParallelProcessing && this.workerPool.length > 0}, queue=${this.fileQueue.length}, remainingFiles=${this.remainingFiles.length}`,
    );

    // Parallel mode: resume scheduling files to idle workers
    if (this.useParallelProcessing && this.workerPool.length > 0) {
      // Kick the scheduler to fill idle workers
      const idleCount = this.workerPool.filter((w) => {
        const s = this.workerStates.get(w);
        return s && !s.busy;
      }).length;
      const dispatchCount = Math.min(idleCount, this.fileQueue.length);
      for (let i = 0; i < dispatchCount; i++) {
        this.processNextFile();
      }
      return;
    }

    // Sequential fallback (basic): process remaining files sequentially
    if (this.remainingFiles.length > 0) {
      try {
        // Reuse current progress callback if available
        const dummyResult: IndexingResult = {
          success: false,
          chunks: [],
          totalFiles: this.remainingFiles.length,
          processedFiles: 0,
          errors: [],
          duration: 0,
          stats: {
            filesByLanguage: {},
            chunksByType: {} as Record<ChunkType, number>,
            totalLines: 0,
            totalBytes: 0,
            totalEmbeddings: 0,
            vectorDimensions: 0,
          },
        };
        await this.processFilesSequentially(
          this.remainingFiles,
          dummyResult,
          this.currentProgressCallback,
        );
      } finally {
        this.remainingFiles = [];
      }
    }

    // Note: embeddings and storage will be handled by the original startIndexing flow
  }

  /**
   * Stops the current indexing operation gracefully
   *
   * This method stops the indexing process, allowing current operations to complete
   * but preventing new files from being processed. Unlike cancel, this preserves
   * any work that has been completed.
   */
  public stop(): void {
    if (!this.stateManager.isIndexing()) {
      console.warn(
        "IndexingService: Cannot stop - no indexing operation in progress",
      );
      return;
    }

    console.log("IndexingService: Stopping indexing operation...");
    this.isStopped = true;
    this.isPaused = false;
    this.stateManager.setIndexingMessage("Stopping indexing...");

    // Signal abort to any ongoing operations
    if (this.abortController) {
      this.abortController.abort();
    }

    // Terminate worker threads gracefully
    this.terminateWorkers();

    console.log("IndexingService: Indexing stop requested");
  }

  /**
   * Cancels the current indexing operation immediately
   *
   * This method immediately cancels the indexing process, discarding any
   * work in progress and cleaning up resources. This is more aggressive
   * than stop() and should be used when immediate termination is required.
   */
  public cancel(): void {
    if (!this.stateManager.isIndexing()) {
      console.warn(
        "IndexingService: Cannot cancel - no indexing operation in progress",
      );
      return;
    }

    console.log("IndexingService: Cancelling indexing operation...");
    this.isCancelled = true;
    this.isPaused = false;
    this.isStopped = false;
    this.stateManager.setIndexingMessage("Cancelling indexing...");

    // Signal abort to any ongoing operations
    if (this.abortController) {
      this.abortController.abort();
    }

    // Terminate worker threads immediately
    this.terminateWorkers();

    // Clear any remaining work
    this.remainingFiles = [];

    // Reset state
    this.stateManager.setIndexing(false);
    this.stateManager.setPaused(false);
    this.stateManager.setIndexingMessage(null);

    console.log("IndexingService: Indexing cancelled");
  }

  /**
   * Terminate all worker threads
   */
  private terminateWorkers(): void {
    if (this.workerPool.length > 0) {
      console.log(`IndexingService: Terminating ${this.workerPool.length} worker threads...`);

      this.workerPool.forEach(worker => {
        try {
          worker.terminate();
        } catch (error) {
          console.warn("IndexingService: Error terminating worker:", error);
        }
      });

      this.workerPool = [];
      this.workerStates.clear();
      this.fileQueue = [];

      console.log("IndexingService: All worker threads terminated");
    }
  }

  /**
   * Check if indexing is in a cancellable state
   */
  public isCancellable(): boolean {
    return this.stateManager.isIndexing() && !this.isCancelled && !this.isStopped;
  }

  /**
   * Check if indexing is in a stoppable state
   */
  public isStoppable(): boolean {
    return this.stateManager.isIndexing() && !this.isCancelled && !this.isStopped;
  }

  /**
   * Get current indexing operation status
   */
  public getIndexingStatus(): {
    isIndexing: boolean;
    isPaused: boolean;
    isCancelled: boolean;
    isStopped: boolean;
    remainingFiles: number;
  } {
    return {
      isIndexing: this.stateManager.isIndexing(),
      isPaused: this.isPaused,
      isCancelled: this.isCancelled,
      isStopped: this.isStopped,
      remainingFiles: this.remainingFiles.length,
    };
  }

  /**
   * Clears the entire index for the current workspace
   *
   * This method removes all indexed data from the vector database
   * and resets the indexing state.
   */
  public async clearIndex(): Promise<boolean> {
    try {
      console.log("IndexingService: Clearing index...");

      const collectionName = this.generateCollectionName();
      const success = await this.qdrantService.deleteCollection(collectionName);

      if (success) {
        // Reset any indexing state
        this.remainingFiles = [];
        this.isPaused = false;
        this.isCancelled = false;
        this.isStopped = false;
        this.stateManager.setIndexing(false);
        this.stateManager.setPaused(false);
        this.stateManager.setIndexingMessage(null);
        this.stateManager.clearError();

        console.log("IndexingService: Index cleared successfully");
        return true;
      } else {
        console.error("IndexingService: Failed to clear index");
        return false;
      }
    } catch (error) {
      console.error("IndexingService: Error clearing index:", error);
      return false;
    }
  }

  /**
   * Gets information about the current index
   *
   * @returns Promise resolving to index statistics
   */
  public async getIndexInfo(): Promise<{
    fileCount: number;
    vectorCount: number;
    collectionName: string;
  } | null> {
    try {
      const collectionName = this.generateCollectionName();
      const info = await this.qdrantService.getCollectionInfo(collectionName);

      if (info) {
        return {
          fileCount: info.points_count || 0, // Approximate file count based on points
          vectorCount: info.points_count || 0,
          collectionName: collectionName,
        };
      }

      return null;
    } catch (error) {
      console.error("IndexingService: Error getting index info:", error);
      return null;
    }
  }

  /**
   * Cleanup method to terminate worker threads and free resources
   * Should be called when the extension is deactivated
   */
  public async cleanup(): Promise<void> {
    try {
      console.log("IndexingService: Cleaning up worker pool...");

      // Terminate all workers
      for (const worker of this.workerPool) {
        try {
          // Send shutdown message first
          worker.postMessage({ type: "shutdown" });

          // Wait a bit for graceful shutdown
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Force terminate if still running
          await worker.terminate();
        } catch (error) {
          console.error("IndexingService: Error terminating worker:", error);
        }
      }

      // Clear worker pool and state
      this.workerPool = [];
      this.workerStates.clear();
      this.fileQueue = [];
      this.activeWorkers = 0;

      // Reset aggregated results
      this.aggregatedResults = {
        chunks: [],
        embeddings: [],
        stats: {
          filesByLanguage: {},
          chunksByType: {} as Record<ChunkType, number>,
          totalLines: 0,
          totalBytes: 0,
        },
        errors: [],
      };

      console.log("IndexingService: Worker pool cleanup completed");
    } catch (error) {
      console.error("IndexingService: Error during cleanup:", error);
    }
  }
}
