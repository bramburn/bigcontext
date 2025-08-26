# Implementation Guidance: Sprint 5 - Index Management & Control

**Objective:** To provide users with robust control over the indexing lifecycle, including pausing, resuming, and clearing the index, and to offer transparency through index statistics.

---

### **Part 1: Pause and Resume Indexing**

**High-Level Plan:**
1.  **State Management:** Introduce a new `Paused` state into the `StateManager`. This provides a clear, centralized signal that the entire extension can react to.
2.  **Indexing Service Logic:** The `IndexingService` will be the orchestrator.
    -   It will contain a private flag, e.g., `private isPaused = false;`.
    -   The main indexing loop (e.g., `for (const file of files)`) must be modified. Inside the loop, *before* processing a file, it will check `if (this.isPaused)`.
    -   If paused, the loop will break. Crucially, the list of *remaining* files must be saved to a temporary variable or persisted to disk/state to be picked up later.
    -   The `pause()` method will set `this.isPaused = true` and update the `StateManager`.
    -   The `resume()` method will set `this.isPaused = false`, load the queue of remaining files, and restart the indexing loop with that queue.
3.  **UI Integration:**
    -   The `IndexingView.svelte` component will subscribe to the application state.
    -   It will use `{#if}` blocks to conditionally show "Pause" (when `state === 'Indexing'`) and "Resume" (when `state === 'Paused'`) buttons.
    -   Clicking these buttons will send messages (`pauseIndexing`, `resumeIndexing`) to the backend via the `MessageRouter`.

**Code Example (`IndexingService.ts`):**
```typescript
import { StateManager, AppState } from './stateManager';

export class IndexingService {
    private isPaused = false;
    private fileQueue: vscode.Uri[] = [];

    constructor(private stateManager: StateManager) {}

    public pause(): void {
        if (this.stateManager.getState() === AppState.Indexing) {
            this.isPaused = true;
            this.stateManager.setState(AppState.Paused);
            console.log(`[Indexing] Paused. ${this.fileQueue.length} files remaining.`);
        }
    }

    public resume(): void {
        if (this.stateManager.getState() === AppState.Paused) {
            this.isPaused = false;
            this.stateManager.setState(AppState.Indexing);
            console.log('[Indexing] Resuming...');
            this.processFileQueue(); // Continue processing
        }
    }

    public async startIndexing(files: vscode.Uri[]): Promise<void> {
        this.fileQueue = files;
        this.stateManager.setState(AppState.Indexing);
        this.processFileQueue();
    }

    private async processFileQueue(): Promise<void> {
        while (this.fileQueue.length > 0) {
            if (this.isPaused) {
                console.log('[Indexing] Halting due to pause flag.');
                return; // Exit the loop but preserve the queue
            }

            const file = this.fileQueue.shift()!; // Get the next file
            
            // ... process the single file ...
            
            // Update progress
            this.stateManager.updateProgress(...);
        }

        if (!this.isPaused) {
            this.stateManager.setState(AppState.Ready);
            console.log('[Indexing] Completed.');
        }
    }
}
```

---

### **Part 2: Index Status and Management**

**High-Level Plan:**
1.  **Qdrant Service:** Enhance `QdrantService` with two new methods:
    -   `getCollectionInfo()`: This will use the Qdrant client's `getCollection` method, which returns information including the number of vectors (`vectors_count`) and indexed fields.
    -   `deleteCollection()`: This will use the client's `deleteCollection` method to completely wipe the index for the workspace.
2.  **UI:** The `DiagnosticsView.svelte` (or a similar settings/management panel) will be responsible for displaying the data and providing the "Clear Index" button.
3.  **Data Flow:**
    -   When the diagnostics view is opened, it sends a `getCollectionInfo` message to the backend.
    -   The backend calls the `QdrantService`, gets the stats, and sends them back to the webview in a `collectionInfoResult` message.
    -   The webview updates its state with the new stats, causing the UI to re-render.
    -   Clicking "Clear Index" sends a `clearIndex` message. The backend calls `indexingService.clearIndex()`, which in turn calls `qdrantService.deleteCollection()`. After success, it should probably send a confirmation back to the UI and request a refresh of the stats.

**Qdrant API Information:**
*   **`qdrantClient.getCollection(collectionName)`**:
    *   **Returns**: A promise that resolves to an object containing details about the collection.
    *   **Example Response Snippet**:
        ```json
        {
          "result": {
            "vectors_count": 12345,
            "indexed_vectors_count": 12345,
            "points_count": 12345,
            "segments_count": 3
          },
          "status": "ok"
        }
        ```
    *   You will primarily be interested in `result.vectors_count` or `result.points_count`.

*   **`qdrantClient.deleteCollection(collectionName)`**:
    *   **Returns**: A promise that resolves to `true` on success.
    *   This is a destructive operation and should be used with care. Always ask the user for confirmation in the UI.

**UI Confirmation for Destructive Actions:**
It is best practice to confirm a destructive action like clearing the index.

**Code Example (`DiagnosticsView.svelte`):**
```svelte
<script>
    function confirmClearIndex() {
        const confirmed = confirm("Are you sure you want to permanently delete the index for this workspace?");
        if (confirmed) {
            vscode.postMessage({ command: 'clearIndex' });
        }
    }
</script>

<button on:click={confirmClearIndex} class="destructive-button">
    Clear Index
</button>
```
