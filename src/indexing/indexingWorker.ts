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

import { parentPort, workerData } from 'worker_threads';
import { readFileSync } from 'fs';
import { AstParser, SupportedLanguage } from '../parsing/astParser';
import { Chunker, CodeChunk } from '../parsing/chunker';
import { IEmbeddingProvider, EmbeddingProviderFactory } from '../embeddings/embeddingProvider';
// LSPService is not available in worker threads due to vscode API dependency
// import { LSPService } from '../lsp/lspService';
import * as path from 'path';

// Ensure this file is run as a worker thread
if (!parentPort) {
    throw new Error('This file must be run as a worker thread.');
}

/**
 * Interface for messages sent from main thread to worker
 */
interface WorkerMessage {
    type: 'processFile' | 'shutdown';
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
    type: 'processed' | 'error' | 'ready';
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
        console.log('IndexingWorker: Initializing worker services...');
        
        // Initialize AST parser
        astParser = new AstParser();
        
        // Initialize chunker
        chunker = new Chunker();
        
        // Initialize embedding provider from configuration
        if (workerData?.embeddingConfig) {
            embeddingProvider = await EmbeddingProviderFactory.createProvider(workerData.embeddingConfig);
        } else {
            throw new Error('No embedding configuration provided to worker');
        }
        
        // LSP service is not available in worker threads due to vscode API dependency
        // Workers will process files without LSP semantic information
        
        isInitialized = true;
        console.log('IndexingWorker: Worker services initialized successfully');
        
        // Notify main thread that worker is ready
        parentPort?.postMessage({ type: 'ready' } as WorkerResponse);
        
    } catch (error) {
        console.error('IndexingWorker: Failed to initialize worker:', error);
        parentPort?.postMessage({
            type: 'error',
            error: `Worker initialization failed: ${error instanceof Error ? error.message : String(error)}`
        } as WorkerResponse);
    }
}

/**
 * Determine the programming language from file path
 * Only returns languages that are actually supported by the AST parser
 */
function getLanguage(filePath: string): SupportedLanguage | null {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.ts':
        case '.tsx':
            return 'typescript';
        case '.js':
        case '.jsx':
            return 'javascript';
        case '.py':
            return 'python';
        case '.cs':
            return 'csharp';
        default:
            return null;
    }
}

/**
 * Process a single file: read, parse, chunk, and generate embeddings
 */
async function processFile(filePath: string, workspaceRoot?: string): Promise<ProcessedFileData> {
    const errors: string[] = [];
    
    try {
        // Read file content
        const content = readFileSync(filePath, 'utf-8');
        const lineCount = content.split('\n').length;
        const byteCount = Buffer.byteLength(content, 'utf8');
        
        // Determine language
        const language = getLanguage(filePath);
        if (!language) {
            throw new Error(`Unsupported file type: ${filePath}`);
        }
        
        // Parse AST
        const parseResult = astParser.parseWithErrorRecovery(language, content);
        if (parseResult.errors.length > 0) {
            errors.push(...parseResult.errors.map(err => `${filePath}: ${err}`));
        }
        
        if (!parseResult.tree) {
            throw new Error(`Failed to parse AST for ${filePath}`);
        }
        
        // Create chunks
        const chunks = chunker.chunk(filePath, parseResult.tree, content, language);
        
        // Generate embeddings for chunks
        const chunkContents = chunks.map(chunk => chunk.content);
        const embeddings = await embeddingProvider.generateEmbeddings(chunkContents);
        
        if (embeddings.length !== chunks.length) {
            throw new Error(`Embedding count mismatch: ${embeddings.length} embeddings for ${chunks.length} chunks`);
        }
        
        return {
            filePath,
            chunks,
            embeddings,
            language,
            lineCount,
            byteCount,
            errors
        };
        
    } catch (error) {
        throw new Error(`Failed to process ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Message handler for communication with main thread
parentPort.on('message', async (message: WorkerMessage) => {
    try {
        switch (message.type) {
            case 'processFile':
                if (!isInitialized) {
                    parentPort?.postMessage({
                        type: 'error',
                        error: 'Worker not initialized'
                    } as WorkerResponse);
                    return;
                }
                
                if (!message.filePath) {
                    parentPort?.postMessage({
                        type: 'error',
                        error: 'No file path provided'
                    } as WorkerResponse);
                    return;
                }
                
                const processedData = await processFile(message.filePath, message.workspaceRoot);
                parentPort?.postMessage({
                    type: 'processed',
                    data: processedData
                } as WorkerResponse);
                break;
                
            case 'shutdown':
                console.log('IndexingWorker: Received shutdown signal');
                process.exit(0);
                break;
                
            default:
                parentPort?.postMessage({
                    type: 'error',
                    error: `Unknown message type: ${(message as any).type}`
                } as WorkerResponse);
        }
        
    } catch (error) {
        console.error('IndexingWorker: Error processing message:', error);
        parentPort?.postMessage({
            type: 'error',
            error: `Worker error: ${error instanceof Error ? error.message : String(error)}`
        } as WorkerResponse);
    }
});

// Handle worker shutdown and termination signals
process.on('SIGTERM', () => {
    console.log('IndexingWorker: Received SIGTERM, exiting gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('IndexingWorker: Received SIGINT, exiting gracefully');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('IndexingWorker: Uncaught exception:', err);
    parentPort?.postMessage({
        type: 'error',
        error: `Worker uncaught exception: ${err.message}`
    } as WorkerResponse);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('IndexingWorker: Unhandled rejection at:', promise, 'reason:', reason);
    parentPort?.postMessage({
        type: 'error',
        error: `Worker unhandled rejection: ${reason}`
    } as WorkerResponse);
    process.exit(1);
});

// Initialize the worker when the module loads
initializeWorker().catch(error => {
    console.error('IndexingWorker: Failed to initialize:', error);
    process.exit(1);
});
