# Task List: Sprint 4 - Automatic & Incremental Indexing

**Goal:** To make the extension's index "live" by automatically detecting and processing file changes in the background, ensuring search results are always up-to-date.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `fileSystemWatcherManager.ts`:** Create a new manager class to encapsulate the `FileSystemWatcher` logic. | `src/fileSystemWatcherManager.ts` (New) |
| **4.2** | ☐ To Do | **Implement debounced handler:** In `src/fileSystemWatcherManager.ts`, implement a debounced handler for file events to batch rapid changes. | `src/fileSystemWatcherManager.ts` |
| **4.3** | ☐ To Do | **Create `updateFileInIndex` method:** In `src/indexing/indexingService.ts`, create a new public method `updateFileInIndex` that takes a file URI, re-parses it, and updates its vectors in Qdrant. | `src/indexing/indexingService.ts` |
| **4.4** | ☐ To Do | **Create `removeFileFromIndex` method:** In `src/indexing/indexingService.ts`, create a `removeFileFromIndex` method that takes a file URI and calls the `QdrantService` to delete all vectors associated with that file path. | `src/indexing/indexingService.ts` |
| **4.5** | ☐ To Do | **Implement `deleteVectorsForFile` method:** In `src/db/qdrantService.ts`, implement the `deleteVectorsForFile` method. This requires searching for points with metadata matching the file path and deleting them. | `src/db/qdrantService.ts` |
| **4.6** | ☐ To Do | **Instantiate and initialize `FileSystemWatcherManager`:** In `src/extensionManager.ts`, instantiate and initialize the `FileSystemWatcherManager` during extension activation. | `src/extensionManager.ts` |
