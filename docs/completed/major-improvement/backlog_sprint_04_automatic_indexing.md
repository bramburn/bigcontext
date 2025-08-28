# Backlog: Sprint 4 - Automatic & Incremental Indexing

**Objective:** To make the extension's index "live" by automatically detecting and processing file changes in the background, ensuring search results are always up-to-date.

---

### User Story 1: Automatic Indexing on File Changes
**As a** developer, **I want** the extension to automatically detect when I save changes to a file and update the index in the background, **so that** my search results are always up-to-date.

**Acceptance Criteria:**
- The extension uses `vscode.workspace.createFileSystemWatcher` to monitor file changes for supported file types.
- On file save (`onDidChange`), the specific file is re-parsed and its vectors are updated in the database.
- On file deletion (`onDidDelete`), the corresponding vectors are removed from the database.
- On file creation (`onDidCreate`), the new file is parsed and its vectors are added to the database.
- The process is debounced to prevent excessive updates during operations like branch switching.

**Actions to Undertake:**
1.  **Filepath**: `src/fileSystemWatcherManager.ts` (New File)
    -   **Action**: Create a new manager class to encapsulate the `FileSystemWatcher` logic.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { IndexingService } from './indexing/indexingService';

        export class FileSystemWatcherManager {
            private watcher: vscode.FileSystemWatcher;

            constructor(private indexingService: IndexingService) {
                // Initialize watcher in a separate method
            }

            public initialize() {
                this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js,py,md}'); // Configure supported types
                this.watcher.onDidChange(uri => this.handleFileChange(uri));
                this.watcher.onDidCreate(uri => this.handleFileChange(uri));
                this.watcher.onDidDelete(uri => this.handleFileDelete(uri));
            }
            // ... handler methods
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
2.  **Filepath**: `src/fileSystemWatcherManager.ts`
    -   **Action**: Implement a debounced handler for file events to batch rapid changes.
    -   **Implementation**:
        ```typescript
        private debounceTimeout: NodeJS.Timeout | undefined;

        private handleFileChange(uri: vscode.Uri) {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }
            this.debounceTimeout = setTimeout(() => {
                console.log(`Processing change for: ${uri.fsPath}`);
                this.indexingService.updateFileInIndex(uri);
            }, 1000); // 1 second debounce
        }

        private handleFileDelete(uri: vscode.Uri) {
            // Deletes can be handled more immediately
            this.indexingService.removeFileFromIndex(uri);
        }
        ```
    -   **Imports**: None.
3.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Create a new public method `updateFileInIndex` that takes a file URI, re-parses it, and updates its vectors in Qdrant. This involves deleting old vectors for that file and adding the new ones.
    -   **Implementation**:
        ```typescript
        public async updateFileInIndex(uri: vscode.Uri): Promise<void> {
            await this.removeFileFromIndex(uri); // Simple approach: delete then add
            const fileContent = await vscode.workspace.fs.readFile(uri);
            // ... parse content and add new vectors to Qdrant
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
4.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Create a `removeFileFromIndex` method that takes a file URI and calls the `QdrantService` to delete all vectors associated with that file path.
    -   **Implementation**:
        ```typescript
        public async removeFileFromIndex(uri: vscode.Uri): Promise<void> {
            const filePath = uri.fsPath;
            await this.qdrantService.deleteVectorsForFile(filePath);
        }
        ```
    -   **Imports**: None.
5.  **Filepath**: `src/db/qdrantService.ts`
    -   **Action**: Implement the `deleteVectorsForFile` method. This requires searching for points with metadata matching the file path and deleting them.
    -   **Implementation**:
        ```typescript
        public async deleteVectorsForFile(filePath: string): Promise<void> {
            await this.client.deletePoints(this.collectionName, {
                filter: {
                    must: [
                        {
                            key: 'metadata.filePath',
                            match: {
                                value: filePath
                            }
                        }
                    ]
                }
            });
        }
        ```
    -   **Imports**: None.
6.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Instantiate and initialize the `FileSystemWatcherManager` during extension activation.
    -   **Implementation**:
        ```typescript
        // In activation logic
        const watcherManager = new FileSystemWatcherManager(this.indexingService);
        watcherManager.initialize();
        context.subscriptions.push(watcherManager);
        ```
    -   **Imports**: `import { FileSystemWatcherManager } from './fileSystemWatcherManager';`

**Testing Plan:**
-   **Test Case 1**: Save a change to a tracked file. Verify via logs that `updateFileInIndex` is called after the debounce period.
-   **Test Case 2**: Run a search for content that was just added. Verify it is found.
-   **Test Case 3**: Delete a tracked file. Verify via logs that `removeFileFromIndex` is called.
-   **Test Case 4**: Run a search for content from the deleted file. Verify it is no longer found.
-   **Test Case 5**: Create a new file with trackable content. Save it. Verify it gets indexed and its content is searchable.
-   **Test Case 6**: Quickly save a file multiple times. Verify the indexing operation is only triggered once after the last save.
