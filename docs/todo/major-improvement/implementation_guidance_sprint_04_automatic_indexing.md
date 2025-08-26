# Implementation Guidance: Sprint 4 - Automatic & Incremental Indexing

**Objective:** To implement a file watcher that automatically keeps the search index synchronized with the workspace by handling file creation, modification, and deletion.

---

### **High-Level Plan:**
1.  **Create a Watcher Manager:** Develop a `FileSystemWatcherManager.ts` class to encapsulate all file-watching logic. This keeps the concerns separate from other managers.
2.  **Use VS Code API:** Leverage `vscode.workspace.createFileSystemWatcher` to monitor the workspace for changes. A glob pattern will specify which files to watch (e.g., `**/*.{ts,js,py,md}`).
3.  **Implement Debouncing:** File change events can fire rapidly (e.g., during a large git operation or find-and-replace). A debouncing mechanism is critical to prevent overwhelming the indexing service. This is typically done with `setTimeout` and `clearTimeout`.
4.  **Update Indexing Service:** The `IndexingService` needs new methods to handle incremental changes:
    -   `updateFileInIndex(uri)`: For file creation and modification. A simple and robust strategy is to first delete all existing vectors for that file, then re-parse and add the new vectors.
    -   `removeFileFromIndex(uri)`: For file deletion.
5.  **Update Vector DB Service:** The `QdrantService` (or equivalent) needs a method to delete points/vectors based on metadata, specifically the file path.

### **VS Code API Information:**
*   **`vscode.workspace.createFileSystemWatcher`**:
    *   **Syntax**: `vscode.workspace.createFileSystemWatcher(globPattern, ignoreCreateEvents?, ignoreChangeEvents?, ignoreDeleteEvents?): FileSystemWatcher`
    *   **`globPattern`**: A standard glob pattern. To watch multiple file types across the entire workspace, use a pattern like `**/*.{ts,js,py,md,html}`.
    *   **Events**: The returned `FileSystemWatcher` object has three main events to subscribe to:
        -   `.onDidChange: Event<Uri>`
        -   `.onDidCreate: Event<Uri>`
        -   `.onDidDelete: Event<Uri>`
    *   **Disposal**: The watcher is a `Disposable`, so it should be added to the extension's `context.subscriptions` to be cleaned up automatically.
    *   **Reference**: [VS Code API Docs: createFileSystemWatcher](https://code.visualstudio.com/api/references/vscode-api#workspace.createFileSystemWatcher)

### **Debouncing Implementation:**
Debouncing ensures that a function is not called again until a certain amount of time has passed without it being called. This is perfect for handling file save events.

**Code Example (`FileSystemWatcherManager.ts`):**
```typescript
import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';

export class FileSystemWatcherManager implements vscode.Disposable {
    private watcher: vscode.FileSystemWatcher;
    private debounceMap = new Map<string, NodeJS.Timeout>();
    private readonly DEBOUNCE_DELAY_MS = 1500; // 1.5 seconds

    constructor(private indexingService: IndexingService) {
        // Use a comprehensive glob pattern from configuration
        const globPattern = '**/*.{ts,tsx,js,jsx,py,go,java,c,cpp,h,hpp,md,json,svelte}';
        this.watcher = vscode.workspace.createFileSystemWatcher(globPattern);

        this.watcher.onDidChange(uri => this.debouncedHandleUpdate(uri));
        this.watcher.onDidCreate(uri => this.debouncedHandleUpdate(uri));
        this.watcher.onDidDelete(uri => this.handleDelete(uri));
    }

    private debouncedHandleUpdate(uri: vscode.Uri): void {
        const uriString = uri.toString();
        if (this.debounceMap.has(uriString)) {
            clearTimeout(this.debounceMap.get(uriString)!);
        }

        const timeout = setTimeout(() => {
            console.log(`[Watcher] Processing update for ${uri.fsPath}`);
            this.indexingService.updateFileInIndex(uri);
            this.debounceMap.delete(uriString);
        }, this.DEBOUNCE_DELAY_MS);

        this.debounceMap.set(uriString, timeout);
    }

    private handleDelete(uri: vscode.Uri): void {
        const uriString = uri.toString();
        // If a file is deleted, cancel any pending update for it
        if (this.debounceMap.has(uriString)) {
            clearTimeout(this.debounceMap.get(uriString)!);
            this.debounceMap.delete(uriString);
        }
        console.log(`[Watcher] Processing deletion for ${uri.fsPath}`);
        this.indexingService.removeFileFromIndex(uri);
    }

    public dispose(): void {
        this.watcher.dispose();
        this.debounceMap.forEach(timeout => clearTimeout(timeout));
    }
}
```

### **Qdrant API for Deletion:**
To remove vectors associated with a file, you need to use a `filter` when calling the delete points method. You must have stored the file path in the metadata (payload) of each point when you indexed it.

**Code Example (`QdrantService.ts`):**
```typescript
// Assuming you have a Qdrant client instance
import { QdrantClient } from '@qdrant/js-client-rest';

// ...

public async deleteVectorsForFile(collectionName: string, filePath: string): Promise<void> {
    try {
        await this.client.deletePoints(collectionName, {
            filter: {
                must: [
                    {
                        key: 'metadata.source', // Or whatever you named the field
                        match: {
                            value: filePath,
                        },
                    },
                ],
            },
        });
        console.log(`[Qdrant] Deleted vectors for file: ${filePath}`);
    } catch (error) {
        console.error(`[Qdrant] Failed to delete vectors for ${filePath}:`, error);
    }
}
```
This assumes your vector payload looks something like this: `{ metadata: { source: '/path/to/file.ts', ... } }`.
