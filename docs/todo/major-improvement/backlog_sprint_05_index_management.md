# Backlog: Sprint 5 - Index Management & Control

**Objective:** To give users direct control over the indexing process with pause/resume functionality and to provide transparency into the index's state with management tools.

---

### User Story 1: Pause and Resume Indexing
**As a** developer, **I want to** be able to pause and resume a long-running indexing process, **so that** I can free up system resources for a CPU-intensive task without losing my progress.

**Acceptance Criteria:**
- The `IndexingView.svelte` component has "Pause" and "Resume" buttons that are visible during indexing.
- Clicking "Pause" gracefully stops the indexing pipeline and persists its current state (e.g., list of remaining files).
- The `StateManager` reflects the "paused" state.
- Clicking "Resume" successfully continues the indexing process from where it left off.

**Actions to Undertake:**
1.  **Filepath**: `src/stateManager.ts`
    -   **Action**: Add a new `isPaused` boolean state to the `StateManager` and a new `Paused` state to the application state enum.
    -   **Implementation**:
        ```typescript
        export enum AppState {
            //...
            Indexing,
            Paused,
            //...
        }
        
        // Add a setter method for the new state
        public setPaused(isPaused: boolean): void {
            this.setState(isPaused ? AppState.Paused : AppState.Indexing);
        }
        ```
    -   **Imports**: None.
2.  **Filepath**: `webview/src/lib/components/IndexingView.svelte`
    -   **Action**: Add "Pause" and "Resume" buttons. Use `{#if}` blocks to show them based on the `isIndexing` and `isPaused` states from the backend.
    -   **Implementation**:
        ```svelte
        {#if isIndexing && !isPaused}
            <button on:click={pauseIndexing}>Pause</button>
        {/if}
        {#if isPaused}
            <button on:click={resumeIndexing}>Resume</button>
        {/if}
        ```
    -   **Imports**: None.
3.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Implement a `pause()` method. This method will set a flag that the main indexing loop checks. It should not stop mid-file, but rather between files.
    -   **Implementation**:
        ```typescript
        private isPaused = false;

        public pause(): void {
            this.isPaused = true;
            this.stateManager.setPaused(true);
        }

        // In the main indexing loop:
        for (const file of files) {
            if (this.isPaused) {
                // Save remaining files and break
                this.saveQueue(remainingFiles);
                return;
            }
            // ... process file
        }
        ```
    -   **Imports**: None.
4.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Implement a `resume()` method that sets the `isPaused` flag to false and continues the indexing loop from the saved queue of files.
    -   **Implementation**:
        ```typescript
        public resume(): void {
            this.isPaused = false;
            this.stateManager.setPaused(false);
            const remainingFiles = this.loadQueue();
            this.startIndexing(remainingFiles); // Or similar method
        }
        ```
    -   **Imports**: None.
5.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Add message handlers for `pauseIndexing` and `resumeIndexing` that call the respective methods on the `IndexingService`.
    -   **Implementation**:
        ```typescript
        case 'pauseIndexing':
            this.indexingService.pause();
            break;
        case 'resumeIndexing':
            this.indexingService.resume();
            break;
        ```
    -   **Imports**: None.

---

### User Story 2: Index Status and Management
**As a** developer, **I want to** see the status and size of my current index and have the option to clear it, **so that** I can manage my disk space and troubleshoot issues.

**Acceptance Criteria:**
- The `DiagnosticsView.svelte` panel displays the total number of indexed files and vectors.
- A "Clear Index" button is added to the Diagnostics panel.
- Clicking the button completely removes the Qdrant collection for the current workspace and resets the local configuration state.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/DiagnosticsView.svelte` (or similar settings view)
    -   **Action**: Add a section to display index statistics and a "Clear Index" button.
    -   **Implementation**:
        ```svelte
        <script>
            export let indexStats = { fileCount: 0, vectorCount: 0 };
        </script>
        <h4>Index Info</h4>
        <p>Indexed Files: {indexStats.fileCount}</p>
        <p>Total Vectors: {indexStats.vectorCount}</p>
        <button on:click={clearIndex}>Clear Index</button>
        ```
    -   **Imports**: None.
2.  **Filepath**: `src/db/qdrantService.ts`
    -   **Action**: Implement a `getCollectionInfo` method to get stats and a `deleteCollection` method to remove the index.
    -   **Implementation**:
        ```typescript
        public async getCollectionInfo(collectionName: string) {
            return await this.client.getCollection(collectionName);
        }

        public async deleteCollection(collectionName: string) {
            return await this.client.deleteCollection(collectionName);
        }
        ```
    -   **Imports**: None.
3.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Add handlers for `getCollectionInfo` and `clearIndex`. The `clearIndex` handler should call the `QdrantService` and then likely trigger a state reset.
    -   **Implementation**:
        ```typescript
        case 'getCollectionInfo':
            const info = await this.qdrantService.getCollectionInfo(this.workspace.collectionName);
            // Send info back to webview
            break;
        case 'clearIndex':
            await this.indexingService.clearIndex();
            // Notify webview of success
            break;
        ```
    -   **Imports**: None.

**Testing Plan:**
-   **Test Case 1**: Start a large indexing job. Click "Pause". Verify the process stops and the UI shows "Paused".
-   **Test Case 2**: Click "Resume". Verify the process continues from where it left off.
-   **Test Case 3**: Navigate to the diagnostics/settings view. Verify it displays stats about the index.
-   **Test Case 4**: Click "Clear Index". Verify the stats reset to zero and a new search finds no results.
