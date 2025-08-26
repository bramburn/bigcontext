# Backlog: Sprint 7 - Multi-Workspace Support

**Objective:** To refactor the extension to correctly handle multi-root workspaces by creating, managing, and querying a separate, isolated index for each workspace folder.

---

### User Story 1: Per-Folder Indexing and Querying
**As a** developer who works with multiple projects at once (multi-root workspace), **I want** the extension to manage a separate index for each of my workspaces, **so that** search results are always relevant to the project I'm currently focused on.

**Acceptance Criteria:**
- The extension generates a unique Qdrant collection name for each folder in a VS Code workspace (e.g., by hashing the folder's path).
- The `IndexingService` correctly indexes each folder into its own separate collection.
- When a query is made, the `ContextService` identifies the active file's workspace folder.
- The query is routed to search only the specific Qdrant collection associated with that folder.
- Search results from one folder do not include results from other, unrelated folders.

**Actions to Undertake:**
1.  **Filepath**: `src/indexing/indexingService.ts` (or a shared utility file)
    -   **Action**: Update the collection naming logic to be deterministic based on a workspace folder's path.
    -   **Implementation**: Use a hashing function on the `folder.uri.fsPath`.
        ```typescript
        import * as crypto from 'crypto';

        function generateCollectionName(folder: vscode.WorkspaceFolder): string {
            const hash = crypto.createHash('sha256').update(folder.uri.fsPath).digest('hex');
            return `collection_${hash.substring(0, 16)}`;
        }
        ```
    -   **Imports**: `import * as crypto from 'crypto';`
2.  **Filepath**: `src/commandManager.ts`
    -   **Action**: Refactor the `startIndexing` command handler to iterate over all workspace folders and trigger a queued indexing job for each.
    -   **Implementation**:
        ```typescript
        const folders = vscode.workspace.workspaceFolders;
        if (folders) {
            for (const folder of folders) {
                // Don't run in parallel, queue them up
                await this.indexingService.indexWorkspace(folder);
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
3.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Create a new main method `indexWorkspace(folder: vscode.WorkspaceFolder)` that performs all indexing logic within the context of a single folder, using the unique collection name.
    -   **Implementation**:
        ```typescript
        public async indexWorkspace(folder: vscode.WorkspaceFolder): Promise<void> {
            const collectionName = generateCollectionName(folder);
            // ... find all files within this folder
            // ... process and index them into the specific collection
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
4.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: The `queryContext` method must be updated to determine the correct workspace context for the query.
    -   **Implementation**: It should accept the URI of the active document as an argument.
        ```typescript
        public async queryContext(query: string, activeFileUri: vscode.Uri): Promise<any> {
            // ...
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
5.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Use `vscode.workspace.getWorkspaceFolder(uri)` to find the correct `WorkspaceFolder` for the query context.
    -   **Implementation**:
        ```typescript
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeFileUri);
        if (!workspaceFolder) {
            // Handle case where file is not in a workspace
            return [];
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
6.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Generate the correct collection name for the identified workspace and pass it to the search service.
    -   **Implementation**:
        ```typescript
        const collectionName = generateCollectionName(workspaceFolder);
        const results = await this.qdrantService.search(query, collectionName);
        return results;
        ```
    -   **Imports**: None.

**Testing Plan:**
-   **Test Case 1**: Create a new VS Code workspace with two separate, unrelated project folders.
-   **Test Case 2**: Run the "Index Workspace" command. Verify via logs or Qdrant UI that two distinct collections are created with different names.
-   **Test Case 3**: Open a file in the first folder and run a query for content unique to that folder. Verify results are returned.
-   **Test Case 4**: While still in the file from the first folder, run a query for content unique to the *second* folder. Verify **no** results are returned.
-   **Test Case 5**: Open a file in the second folder and run a query for content unique to it. Verify results are returned correctly.
