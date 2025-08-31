how do i implement the sprints 1 to 1 , undertake a full websearch, determine which content is suitable and then, provide code example, api information and further guidance on using external api/packages to complete the task. Review 'prd', (if available) the existing code inin your analysis. Ensure each guide is produced in their own individual canvas document

**Implementation Guidance for Sprint 1: Parallel Indexing**

**Objective:** Refactor the `IndexingService` to leverage Node.js `worker_threads` for parallel processing of file parsing and embedding generation, significantly reducing indexing time on multi-core machines.

**Relevant Files:**
-   `src/indexing/indexingService.ts` (Main thread logic)
-   `src/indexing/indexingWorker.ts` (New file for worker thread logic)
-   `src/parsing/astParser.ts` (Used by worker)
-   `src/embeddings/embeddingProvider.ts` (Interface, used by worker)
-   `src/embeddings/ollamaProvider.ts` or `src/embeddings/openaiProvider.ts` (Concrete implementation, used by worker)
-   `src/db/qdrantService.ts` (Used by main thread for final upsert)

**Web Search/API Information:**
-   **Node.js `worker_threads` module:** [https://nodejs.org/api/worker_threads.html](https://nodejs.org/api/worker_threads.html)
    -   Key classes/functions: `Worker`, `isMainThread`, `parentPort`, `workerData`, `postMessage`, `on('message')`, `on('error')`, `on('exit')`.
    -   `Worker`: Constructor takes a path to the worker script and an options object (e.g., `workerData`).
    -   `parentPort`: Available in worker threads to communicate with the main thread.
    -   `postMessage`: Used for sending messages between main and worker threads.
    -   `on('message')`: Event listener for receiving messages.

**Guidance:**

1.  **Refactor `src/indexing/indexingService.ts` (Main Thread Logic):**
    *   **Worker Pool Management:**
        *   Import `Worker` and `os` modules.
        *   In the `IndexingService` constructor or an initialization method, create a pool of `Worker` instances. The recommended number of workers is `os.cpus().length - 1` to leave one CPU core free for the main thread and other system processes.
        *   Store these worker instances in an array or similar structure.
    *   **Task Distribution:**
        *   Implement a mechanism to distribute file paths to the available workers. A simple round-robin approach or a queue-based system where workers pull tasks when idle can be used.
        *   When a worker is ready, send a message containing the file path to process using `worker.postMessage({ type: 'processFile', filePath: 'path/to/file.ts' })`.
    *   **Result Aggregation:**
        *   Set up an `on('message')` listener for each worker to receive processed data (e.g., embeddings, metadata) back from the worker.
        *   Upon receiving data, aggregate it. The main thread is responsible for interacting with the `QdrantService` to perform the final upsert of the vectors.
    *   **Error Handling and Lifecycle:**
        *   Implement `on('error')` and `on('exit')` listeners for each worker to handle potential errors or unexpected termination. This is crucial for robustness.
        *   Consider how to re-spawn workers if they crash or how to gracefully shut down the worker pool when the extension is deactivated.

2.  **Create `src/indexing/indexingWorker.ts` (Worker Thread Logic):**
    *   This new file will contain the code that runs in each worker thread.
    *   **Initialization:**
        *   Import `parentPort` from `worker_threads`.
        *   Import necessary modules for file reading (`fs`), parsing (`ASTParser`), and embedding generation (`EmbeddingProvider`, `OpenAIProvider`/`OllamaProvider`).
        *   Instantiate `ASTParser` and the chosen `EmbeddingProvider` within the worker thread. These instances will be local to each worker.
    *   **Message Handling:**
        *   Set up an `parentPort.on('message')` listener to receive tasks (e.g., `filePath`) from the main thread.
        *   Inside the message handler, perform the CPU-intensive operations:
            *   Read the file content using `readFileSync`.
            *   Parse the content into chunks using `astParser.parseAndChunk()`.
            *   Generate embeddings for these chunks using `embeddingProvider.createEmbeddings()`.
    *   **Sending Results Back:**
        *   Once processing is complete, send the results (e.g., `filePath`, generated vectors, and any relevant metadata like chunk text, start/end lines) back to the main thread using `parentPort.postMessage({ type: 'processed', data: { ... } })`.
        *   Include error handling within the worker to catch exceptions during file processing and send an error message back to the main thread.

**Code Examples:**

**`src/indexing/indexingService.ts` (Main Thread Snippets - Illustrative):**

```typescript
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as os from 'os';
import { QdrantService } from '../db/qdrantService';
import { EmbeddingProvider } from '../embeddings/embeddingProvider';
import { ASTParser } from '../parsing/astParser';
// Assuming FileWalker exists for file discovery
// import { FileWalker } from './fileWalker';

// ... other imports and class definition

export class IndexingService {
    private workerPool: Worker[] = [];
    private fileQueue: string[] = [];
    private activeWorkers: number = 0;
    private qdrantService: QdrantService;
    private isIndexing: boolean = false;

    constructor(qdrantService: QdrantService) {
        this.qdrantService = qdrantService;
        if (isMainThread) {
            this.initializeWorkerPool();
        }
    }

    private initializeWorkerPool() {
        const numCpus = os.cpus().length;
        const numWorkers = Math.max(1, numCpus - 1); // Use at least 1 worker, leave one CPU for main thread

        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker(
                // Path to the worker script. Use __filename or a relative path from dist/out
                // For development, you might use a direct path like './src/indexing/indexingWorker.ts'
                // For production, ensure the path is correct relative to the compiled output
                require.resolve('./indexingWorker'), // Assumes indexingWorker.ts is compiled to .js in the same dir
                {
                    workerData: {
                        // Pass any necessary initial data to the worker, e.g., config paths, API keys (carefully)
                    }
                }
            );

            worker.on('message', (message) => {
                // Handle messages from workers (e.g., processed embeddings)
                if (message.type === 'processed') {
                    // Aggregate results and upsert to Qdrant
                    // Ensure batching for Qdrant upserts for efficiency
                    this.qdrantService.upsertVectors(message.data.vectors);
                    this.activeWorkers--;
                    this.processNextFile();
                } else if (message.type === 'error') {
                    console.error(`Worker error: ${message.error}`);
                    this.activeWorkers--;
                    this.processNextFile();
                }
            });

            worker.on('error', (err) => {
                console.error(`Worker thread error: ${err}`);
                this.activeWorkers--;
                this.processNextFile();
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`Worker exited with code ${code}`);
                }
                // Potentially re-spawn worker if needed, or handle gracefully
                // For simplicity, this example doesn't re-spawn
            });

            this.workerPool.push(worker);
        }
    }

    public async startIndexing(filesToIndex: string[]) {
        if (this.isIndexing) {
            console.log('Indexing already in progress.');
            return;
        }
        this.isIndexing = true;
        this.fileQueue = [...filesToIndex];
        console.log(`Starting indexing for ${this.fileQueue.length} files with ${this.workerPool.length} workers.`);

        // Initial dispatch to fill up the worker pool
        for (let i = 0; i < this.workerPool.length && this.fileQueue.length > 0; i++) {
            this.dispatchFileToWorker();
        }
    }

    private dispatchFileToWorker() {
        if (this.fileQueue.length > 0) {
            const filePath = this.fileQueue.shift();
            if (filePath) {
                // Find an idle worker or use a round-robin approach
                // For simplicity, this example uses a basic round-robin
                const worker = this.workerPool[this.activeWorkers % this.workerPool.length];
                worker.postMessage({ type: 'processFile', filePath });
                this.activeWorkers++;
            }
        } else if (this.activeWorkers === 0) {
            // All files processed and all workers are idle
            console.log('Indexing complete.');
            this.isIndexing = false;
        }
    }

    private processNextFile() {
        if (this.fileQueue.length > 0) {
            this.dispatchFileToWorker();
        } else if (this.activeWorkers === 0) {
            console.log('Indexing complete.');
            this.isIndexing = false;
        }
    }

    public async stopIndexing() {
        for (const worker of this.workerPool) {
            worker.terminate(); // Forcefully terminate workers
        }
        this.workerPool = [];
        this.isIndexing = false;
        this.fileQueue = [];
        this.activeWorkers = 0;
        console.log('Indexing stopped and workers terminated.');
    }
}
```

**`src/indexing/indexingWorker.ts` (New File Content - Illustrative):**

```typescript
import { parentPort, workerData } from 'worker_threads';
import { readFileSync } from 'fs';
import { ASTParser } from '../parsing/astParser';
import { OpenAIProvider } from '../embeddings/openaiProvider'; // Example provider
import { EmbeddingProvider } from '../embeddings/embeddingProvider'; // Interface

// Ensure this file is run as a worker thread
if (!parentPort) {
    throw new Error('This file must be run as a worker thread.');
}

// Initialize services that are stateless and can be reused per worker
// These should ideally be passed via workerData or configured via environment variables
// For simplicity, instantiating directly here.
const astParser = new ASTParser();
// You might need to pass API keys or configuration for the embedding provider via workerData
const embeddingProvider: EmbeddingProvider = new OpenAIProvider(); // Or new OllamaProvider();

parentPort.on('message', async (message) => {
    if (message.type === 'processFile') {
        const filePath = message.filePath;
        try {
            const fileContent = readFileSync(filePath, 'utf-8');
            // Assuming parseAndChunk method exists and returns an array of objects with text, startLine, endLine
            const chunks = astParser.parseAndChunk(fileContent, filePath);

            // Create embeddings for each chunk
            const vectors = await embeddingProvider.createEmbeddings(chunks.map(c => c.text));

            // Prepare data to send back to the main thread
            const processedData = vectors.map((vector, index) => ({
                vector,
                payload: {
                    filePath,
                    chunkText: chunks[index].text,
                    startLine: chunks[index].startLine,
                    endLine: chunks[index].endLine,
                    // Add any other relevant metadata from the chunk
                }
            }));

            // Send processed data back to the main thread
            parentPort?.postMessage({
                type: 'processed',
                data: { vectors: processedData }
            });
        } catch (error: any) {
            console.error(`Error processing file ${filePath}:`, error);
            parentPort?.postMessage({
                type: 'error',
                error: `Failed to process ${filePath}: ${error.message}`
            });
        }
    }
});

// Optional: Handle worker shutdown or termination signals
process.on('SIGTERM', () => {
    console.log('Worker received SIGTERM, exiting.');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Worker uncaught exception:', err);
    parentPort?.postMessage({ type: 'error', error: `Worker uncaught exception: ${err.message}` });
    process.exit(1); // Exit with a non-zero code to indicate an error
});
```