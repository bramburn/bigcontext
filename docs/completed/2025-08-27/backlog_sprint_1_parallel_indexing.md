### User Story 1: Parallel Indexing
**As a** developer with a powerful multi-core machine, **I want to** the extension to use all available resources to index my large repository as quickly as possible, **so that** I can start searching sooner.

**Actions to Undertake:**
1.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Refactor `IndexingService` to use `worker_threads` for parallel parsing and embedding.
    -   **Implementation**: ```// Implementation details will be in the guidance document. This involves creating a worker pool, distributing tasks, and aggregating results.```
    -   **Imports**: ```import { Worker } from 'worker_threads';
import * as os from 'os';```
2.  **Filepath**: `src/indexing/indexingWorker.ts`
    -   **Action**: Create a new worker file to handle parsing and embedding tasks.
    -   **Implementation**: ```// Implementation details will be in the guidance document. This file will contain the logic for a single worker to process file content, parse, and generate embeddings.```
    -   **Imports**: ```import { parentPort } from 'worker_threads';
import { readFileSync } from 'fs';
import { ASTParser } from '../parsing/astParser';
import { EmbeddingProvider } from '../embeddings/embeddingProvider';```

**List of Files to be Created:**
-   `src/indexing/indexingWorker.ts`

**Acceptance Criteria:**
-   The `IndexingService` is refactored to use Node.js `worker_threads`.
-   It creates a pool of workers (e.g., `os.cpus().length - 1`).
-   The list of files to be indexed is distributed among the worker threads for parallel parsing and embedding.
-   The main thread aggregates the results and performs the final database upsert.
-   Initial indexing time on multi-core machines is reduced by at least 40%.

**Testing Plan:**
-   **Test Case 1**: Run indexing on a large repository on a multi-core machine and measure the indexing time before and after the changes. Verify a significant reduction (e.g., >40%).
-   **Test Case 2**: Verify that all files are correctly indexed and searchable after parallel indexing.
-   **Test Case 3**: Test error handling within workers and ensure errors are propagated to the main thread and handled gracefully.
-   **Test Case 4**: Verify that the number of worker threads created is `os.cpus().length - 1`.