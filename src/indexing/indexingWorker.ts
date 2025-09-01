/**
 * Worker thread for parallel file processing in the indexing pipeline.
 *
 * This worker handles CPU-intensive operations including:
 * - File reading and content processing
 * - AST parsing and code analysis
 * - Code chunking and structure extraction
 * - Embedding generation for code chunks
 *
 * The worker communicates with the main thread via message passing,
 * receiving file paths to process and returning processed chunks with embeddings.
 */

import { parentPort, workerData } from "worker_threads";
import { readFileSync } from "fs";
import { AstParser, SupportedLanguage } from "../parsing/astParser";
import { Chunker, CodeChunk } from "../parsing/chunker";
import {
  IEmbeddingProvider,
  EmbeddingProviderFactory,
} from "../embeddings/embeddingProvider";
// LSPService is not available in worker threads due to vscode API dependency
// import { LSPService } from '../lsp/lspService';
import * as path from "path";

// Ensure this file is run as a worker thread
if (!parentPort) {
  throw new Error("This file must be run as a worker thread.");
}

/**
 * Interface for messages sent from main thread to worker
 */
interface WorkerMessage {
  type: "processFile" | "shutdown";
  filePath?: string;
  workspaceRoot?: string;
  embeddingConfig?: any;
}

/**
 * Interface for processed file data sent back to main thread
 */
interface ProcessedFileData {
  filePath: string;
  chunks: CodeChunk[];
  embeddings: number[][];
  language?: SupportedLanguage;
  lineCount: number;
  byteCount: number;
  errors: string[];
}

/**
 * Interface for worker response messages
 */
interface WorkerResponse {
  type: "processed" | "error" | "ready";
  data?: ProcessedFileData;
  error?: string;
}

// Initialize services that are stateless and can be reused per worker
let astParser: AstParser;
let chunker: Chunker;
let embeddingProvider: IEmbeddingProvider;
// LSP service not available in worker threads
// let lspService: LSPService;
let isInitialized = false;

/**
 * Initialize worker services with configuration from workerData
 */
async function initializeWorker(): Promise<void> {
  try {
    console.log("IndexingWorker: Initializing worker services...");

    // Initialize AST parser
    astParser = new AstParser();

    // Initialize chunker
    chunker = new Chunker();

    // Initialize embedding provider from configuration
    if (workerData?.embeddingConfig) {
      embeddingProvider = await EmbeddingProviderFactory.createProvider(
        workerData.embeddingConfig,
      );
    } else {
      throw new Error("No embedding configuration provided to worker");
    }

    // LSP service is not available in worker threads due to vscode API dependency
    // Workers will process files without LSP semantic information

    isInitialized = true;
    console.log("IndexingWorker: Worker services initialized successfully");

    // Notify main thread that worker is ready
    parentPort?.postMessage({ type: "ready" } as WorkerResponse);
  } catch (error) {
    console.error("IndexingWorker: Failed to initialize worker:", error);
    parentPort?.postMessage({
      type: "error",
      error: `Worker initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    } as WorkerResponse);
  }
}

/**
 * Create simple text chunks for large files that can't be AST parsed
 * This is a fallback method that splits files into manageable text chunks
 */
function createSimpleTextChunks(filePath: string, content: string, language: SupportedLanguage): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  const lines = content.split('\n');
  const LINES_PER_CHUNK = 500; // Process 500 lines at a time for large files
  const MAX_CHUNKS = 20; // Limit to 20 chunks maximum to prevent excessive embedding generation

  for (let i = 0; i < lines.length && chunks.length < MAX_CHUNKS; i += LINES_PER_CHUNK) {
    const chunkLines = lines.slice(i, Math.min(i + LINES_PER_CHUNK, lines.length));
    const chunkContent = chunkLines.join('\n');

    if (chunkContent.trim().length > 0) { // Skip empty chunks
      chunks.push({
        filePath,
        content: chunkContent,
        startLine: i + 1,
        endLine: Math.min(i + LINES_PER_CHUNK, lines.length),
        type: 'text' as any, // Simple text chunk type
        name: `chunk_${i + 1}_${Math.min(i + LINES_PER_CHUNK, lines.length)}`,
        language,
        metadata: {
          nodeType: 'text_chunk',
          hasError: false,
          byteLength: Buffer.byteLength(chunkContent, 'utf8'),
        },
      });
    }
  }

  return chunks;
}

/**
 * Determine the programming language from file path
 * Only returns languages that are actually supported by the AST parser
 */
function getLanguage(filePath: string): SupportedLanguage | null {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".jsx":
      return "javascript";
    case ".py":
      return "python";
    case ".cs":
      return "csharp";
    default:
      return null;
  }
}

/**
 * Process a single file: read, parse, chunk, and generate embeddings
 */
async function processFile(
  filePath: string,
  workspaceRoot?: string,
): Promise<ProcessedFileData> {
  const errors: string[] = [];

  try {
    console.log(`IndexingWorker: Processing file: ${filePath}`);

    // Check if file exists first
    try {
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
    } catch (fsError) {
      throw new Error(`File access error for ${filePath}: ${fsError instanceof Error ? fsError.message : String(fsError)}`);
    }

    // Read file content with encoding fallback
    let content: string;
    try {
      content = readFileSync(filePath, "utf-8");
    } catch (encodingError) {
      console.warn(`IndexingWorker: UTF-8 encoding failed for ${filePath}, trying latin1...`);
      try {
        // Try latin1 encoding as fallback
        const buffer = readFileSync(filePath);
        content = buffer.toString('latin1');
        // Convert back to UTF-8 if possible
        content = Buffer.from(content, 'latin1').toString('utf-8');
      } catch (fallbackError) {
        throw new Error(`Failed to read file with any encoding: ${filePath}. UTF-8 error: ${encodingError instanceof Error ? encodingError.message : String(encodingError)}, Latin1 error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
      }
    }

    // Validate file content
    if (content === null || content === undefined) {
      throw new Error(`File content is null or undefined for ${filePath}`);
    }

    if (typeof content !== 'string') {
      throw new Error(`File content is not a string for ${filePath}, got ${typeof content}`);
    }

    // Check for binary files that might have been read as text
    if (content.includes('\0')) {
      throw new Error(`File appears to be binary (contains null bytes): ${filePath}`);
    }

    // Calculate file metrics
    const lineCount = content.split("\n").length;
    const byteCount = Buffer.byteLength(content, "utf8");
    console.log(`IndexingWorker: File read successfully, ${lineCount} lines, ${byteCount} bytes`);
    console.log(`IndexingWorker: Content type: ${typeof content}, first 50 chars: "${content.substring(0, 50).replace(/\n/g, '\\n')}..."`);

    // Determine language
    const language = getLanguage(filePath);
    if (!language) {
      throw new Error(`Unsupported file type: ${filePath}`);
    }
    console.log(`IndexingWorker: Detected language: ${language}`);

    // Check for extremely large files that might cause issues with tree-sitter
    // Tree-sitter can have issues with very large files, so we use a conservative limit
    const MAX_FILE_SIZE = 100 * 1024; // 100KB limit for tree-sitter parsing
    if (content.length > MAX_FILE_SIZE) {
      console.warn(`IndexingWorker: File too large for AST parsing: ${filePath} (${content.length} characters, max: ${MAX_FILE_SIZE})`);

      // For very large files, we'll skip AST parsing and create simple text chunks
      const simpleChunks = createSimpleTextChunks(filePath, content, language);

      // Generate embeddings for simple chunks
      const chunkContents = simpleChunks.map((chunk) => chunk.content);
      console.log(`IndexingWorker: Generating embeddings for ${chunkContents.length} simple text chunks`);

      const embeddings = await embeddingProvider.generateEmbeddings(chunkContents);
      console.log(`IndexingWorker: Generated ${embeddings.length} embeddings`);

      if (embeddings.length !== simpleChunks.length) {
        throw new Error(
          `Embedding count mismatch: ${embeddings.length} embeddings for ${simpleChunks.length} chunks`,
        );
      }

      return {
        filePath,
        chunks: simpleChunks,
        embeddings,
        language,
        lineCount,
        byteCount,
        errors: [`File too large for AST parsing (${content.length} chars), used simple text chunking`],
      };
    }

    // Check if AST parser is initialized
    if (!astParser) {
      throw new Error(`AST parser not initialized`);
    }

    // Parse AST
    console.log(`IndexingWorker: Starting AST parsing for ${language}`);
    const parseResult = astParser.parseWithErrorRecovery(language, content);
    if (parseResult.errors.length > 0) {
      console.log(`IndexingWorker: AST parsing had ${parseResult.errors.length} errors`);
      errors.push(...parseResult.errors.map((err) => `${filePath}: ${err}`));
    }

    if (!parseResult.tree) {
      throw new Error(`Failed to parse AST for ${filePath} - parser returned null tree`);
    }
    console.log(`IndexingWorker: AST parsing successful`);

    // Check if chunker is initialized
    if (!chunker) {
      throw new Error(`Chunker not initialized`);
    }

    // Create chunks
    console.log(`IndexingWorker: Starting chunking process`);
    const chunks = chunker.chunk(filePath, parseResult.tree, content, language);
    console.log(`IndexingWorker: Created ${chunks.length} chunks`);

    // Check if embedding provider is initialized
    if (!embeddingProvider) {
      throw new Error(`Embedding provider not initialized`);
    }

    // Generate embeddings for chunks
    const chunkContents = chunks.map((chunk) => chunk.content);
    console.log(`IndexingWorker: Generating embeddings for ${chunkContents.length} chunks`);

    const embeddings =
      await embeddingProvider.generateEmbeddings(chunkContents);
    console.log(`IndexingWorker: Generated ${embeddings.length} embeddings`);

    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: ${embeddings.length} embeddings for ${chunks.length} chunks`,
      );
    }

    return {
      filePath,
      chunks,
      embeddings,
      language,
      lineCount,
      byteCount,
      errors,
    };
  } catch (error) {
    console.error(`IndexingWorker: Error processing ${filePath}:`, error);

    // Provide more specific error information
    let errorMessage = `Failed to process ${filePath}`;
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
      if (error.stack) {
        console.error(`IndexingWorker: Error stack:`, error.stack);
      }
    } else {
      errorMessage += `: ${String(error)}`;
    }

    throw new Error(errorMessage);
  }
}

// Message handler for communication with main thread
parentPort.on("message", async (message: WorkerMessage) => {
  try {
    switch (message.type) {
      case "processFile":
        if (!isInitialized) {
          parentPort?.postMessage({
            type: "error",
            error: "Worker not initialized",
          } as WorkerResponse);
          return;
        }

        if (!message.filePath) {
          parentPort?.postMessage({
            type: "error",
            error: "No file path provided",
          } as WorkerResponse);
          return;
        }

        const processedData = await processFile(
          message.filePath,
          message.workspaceRoot,
        );
        parentPort?.postMessage({
          type: "processed",
          data: processedData,
        } as WorkerResponse);
        break;

      case "shutdown":
        console.log("IndexingWorker: Received shutdown signal");
        process.exit(0);
        break;

      default:
        parentPort?.postMessage({
          type: "error",
          error: `Unknown message type: ${(message as any).type}`,
        } as WorkerResponse);
    }
  } catch (error) {
    console.error("IndexingWorker: Error processing message:", error);
    parentPort?.postMessage({
      type: "error",
      error: `Worker error: ${error instanceof Error ? error.message : String(error)}`,
    } as WorkerResponse);
  }
});

// Handle worker shutdown and termination signals
process.on("SIGTERM", () => {
  console.log("IndexingWorker: Received SIGTERM, exiting gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("IndexingWorker: Received SIGINT, exiting gracefully");
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("IndexingWorker: Uncaught exception:", err);
  parentPort?.postMessage({
    type: "error",
    error: `Worker uncaught exception: ${err.message}`,
  } as WorkerResponse);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "IndexingWorker: Unhandled rejection at:",
    promise,
    "reason:",
    reason,
  );
  parentPort?.postMessage({
    type: "error",
    error: `Worker unhandled rejection: ${reason}`,
  } as WorkerResponse);
  process.exit(1);
});

// Initialize the worker when the module loads
initializeWorker().catch((error) => {
  console.error("IndexingWorker: Failed to initialize:", error);
  process.exit(1);
});
