# Task List: Sprint 7 - Multi-Workspace Support

**Goal:** To refactor the extension to correctly handle multi-root workspaces by creating, managing, and querying a separate, isolated index for each workspace folder.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **7.1** | ☐ To Do | **Update collection naming logic:** In `src/indexing/indexingService.ts` (or a shared utility file), update the collection naming logic to be deterministic based on a workspace folder's path. | `src/indexing/indexingService.ts` |
| **7.2** | ☐ To Do | **Refactor `startIndexing` command handler:** In `src/commandManager.ts`, refactor the `startIndexing` command handler to iterate over all workspace folders and trigger a queued indexing job for each. | `src/commandManager.ts` |
| **7.3** | ☐ To Do | **Create `indexWorkspace` method:** In `src/indexing/indexingService.ts`, create a new main method `indexWorkspace(folder: vscode.WorkspaceFolder)` that performs all indexing logic within the context of a single folder, using the unique collection name. | `src/indexing/indexingService.ts` |
| **7.4** | ☐ To Do | **Update `queryContext` method:** In `src/context/contextService.ts`, update the `queryContext` method to determine the correct workspace context for the query. It should accept the URI of the active document as an argument. | `src/context/contextService.ts` |
| **7.5** | ☐ To Do | **Use `getWorkspaceFolder`:** In `src/context/contextService.ts`, use `vscode.workspace.getWorkspaceFolder(uri)` to find the correct `WorkspaceFolder` for the query context. | `src/context/contextService.ts` |
| **7.6** | ☐ To Do | **Generate and pass collection name:** In `src/context/contextService.ts`, generate the correct collection name for the identified workspace and pass it to the search service. | `src/context/contextService.ts` |
