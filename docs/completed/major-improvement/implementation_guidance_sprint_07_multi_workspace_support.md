# Implementation Guidance: Sprint 7 - Multi-Workspace Support

**Objective:** To architect the extension to be fully compatible with VS Code's multi-root workspace feature, ensuring data isolation and contextual relevance for each project folder.

---

### **Core Architectural Shift**

The fundamental change is moving from a single, global index to a dictionary or map of indexes, where the key is the workspace folder path and the value is the corresponding Qdrant collection name. All core services (`IndexingService`, `ContextService`, `QdrantService`) must be refactored to be "workspace-aware."

### **High-Level Plan:**
1.  **Collection Naming Strategy:** A deterministic method is needed to generate a unique but stable collection name for each workspace folder. Hashing the folder's absolute path (`folder.uri.fsPath`) is a robust solution. This ensures that the same folder always maps to the same collection, even across sessions.
2.  **Indexing Refactor:** The main indexing command should no longer just index "the workspace." It must now:
    a.  Get the list of all folders using `vscode.workspace.workspaceFolders`.
    b.  Iterate through this list. For each folder, it will perform a full indexing process, but all operations (finding files, creating vectors, writing to Qdrant) will be scoped to that folder and its corresponding collection name.
    c.  It's best to process folders sequentially to avoid overwhelming the system, creating a queue of indexing jobs.
3.  **Querying Refactor:** The query logic must become context-aware.
    a.  The entry point for a query (e.g., in `ContextService`) must know which file is currently active. The URI of the active text editor's document is the key piece of context.
    b.  Use `vscode.workspace.getWorkspaceFolder(uri)` to get the `WorkspaceFolder` object that contains the active file. This is the most critical API call in this sprint.
    c.  If a folder is found, generate its unique collection name using the same hashing logic from the indexing step.
    d.  Pass this specific collection name down to the `QdrantService` for the search operation.

---

### **VS Code API for Multi-Root Workspaces:**
*   **`vscode.workspace.workspaceFolders`**:
    *   **Syntax**: `vscode.workspace.workspaceFolders: readonly WorkspaceFolder[] | undefined`
    *   This property provides an array of all top-level folders opened in the current VS Code instance. If no folder is open, it's `undefined`.
    *   This is your entry point for iterating through all projects that need to be indexed.
    *   **Reference**: [VS Code API Docs: workspaceFolders](https://code.visualstudio.com/api/references/vscode-api#workspace.workspaceFolders)

*   **`vscode.workspace.getWorkspaceFolder(uri)`**:
    *   **Syntax**: `vscode.workspace.getWorkspaceFolder(uri: Uri): WorkspaceFolder | undefined`
    *   This is the cornerstone of contextual querying. Given the URI of any file, this function will return the `WorkspaceFolder` object that contains it.
    *   If the file is not part of any open workspace folder, it returns `undefined`.
    *   **Reference**: [VS Code API Docs: getWorkspaceFolder](https://code.visualstudio.com/api/references/vscode-api#workspace.getWorkspaceFolder)

*   **`vscode.WorkspaceFolder` Interface**:
    *   Contains two key properties:
        -   `uri: Uri`: The URI of the folder itself. Use `uri.fsPath` to get the string path for hashing or file system operations.
        -   `name: string`: The display name of the folder.

---

### **Implementation Examples:**

**1. Generating a Stable Collection Name:**
A shared utility function is a good approach.

```typescript
// src/utils/workspaceUtils.ts
import * as crypto from 'crypto';
import * as vscode from 'vscode';

export function generateCollectionNameForWorkspace(folder: vscode.WorkspaceFolder): string {
    // Using a cryptographic hash ensures uniqueness and a fixed-length name.
    const pathHash = crypto.createHash('sha256').update(folder.uri.fsPath).digest('hex');
    // Prefix to avoid collisions and add clarity. Truncate hash for brevity.
    return `vsc_ws_${pathHash.substring(0, 24)}`;
}
```

**2. Refactored Indexing Command:**

```typescript
// In a command handler within CommandManager.ts or ExtensionManager.ts
async function startIndexingCommand() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showInformationMessage('No folder open to index.');
        return;
    }

    console.log(`[Indexing] Found ${folders.length} workspace folders.`);
    
    // Process sequentially to manage load
    for (const folder of folders) {
        try {
            console.log(`[Indexing] Starting for folder: ${folder.name}`);
            await indexingService.indexWorkspace(folder); // A new, folder-scoped method
            console.log(`[Indexing] Finished for folder: ${folder.name}`);
        } catch (error) {
            console.error(`[Indexing] Failed for folder ${folder.name}:`, error);
            vscode.window.showErrorMessage(`Failed to index ${folder.name}.`);
        }
    }
    vscode.window.showInformationMessage('All workspaces indexed successfully.');
}
```

**3. Refactored Query Service:**

```typescript
// src/context/contextService.ts
import { generateCollectionNameForWorkspace } from '../utils/workspaceUtils';

export class ContextService {
    public async query(queryText: string, activeDocUri: vscode.Uri): Promise<SearchResult[]> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeDocUri);

        if (!workspaceFolder) {
            // The active file is not part of an indexed workspace.
            // Decide how to handle this: show an error, or do nothing.
            console.warn(`Query attempt on a file outside of any workspace: ${activeDocUri.fsPath}`);
            return [];
        }

        // We have our context, now generate the name and search.
        const collectionName = generateCollectionNameForWorkspace(workspaceFolder);
        console.log(`[Query] Searching in context of folder "${workspaceFolder.name}" (Collection: ${collectionName})`);

        const results = await this.qdrantService.search(queryText, collectionName);
        return results;
    }
}
```
