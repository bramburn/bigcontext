# Task List: Sprint 5 - Index Management & Control

**Goal:** To give users direct control over the indexing process with pause/resume functionality and to provide transparency into the index's state with management tools.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **5.1** | ☐ To Do | **Add `isPaused` to `StateManager`:** Add a new `isPaused` boolean state to the `StateManager` and a new `Paused` state to the application state enum. | `src/stateManager.ts` |
| **5.2** | ☐ To Do | **Add Pause/Resume buttons to UI:** In `webview/src/lib/components/IndexingView.svelte`, add "Pause" and "Resume" buttons. Use `{#if}` blocks to show them based on the `isIndexing` and `isPaused` states from the backend. | `webview/src/lib/components/IndexingView.svelte` |
| **5.3** | ☐ To Do | **Implement `pause()` method:** In `src/indexing/indexingService.ts`, implement a `pause()` method. This method will set a flag that the main indexing loop checks. It should not stop mid-file, but rather between files. | `src/indexing/indexingService.ts` |
| **5.4** | ☐ To Do | **Implement `resume()` method:** In `src/indexing/indexingService.ts`, implement a `resume()` method that sets the `isPaused` flag to false and continues the indexing loop from the saved queue of files. | `src/indexing/indexingService.ts` |
| **5.5** | ☐ To Do | **Add message handlers for pause/resume:** In `src/messageRouter.ts`, add message handlers for `pauseIndexing` and `resumeIndexing` that call the respective methods on the `IndexingService`. | `src/messageRouter.ts` |
| **5.6** | ☐ To Do | **Add index stats and "Clear Index" button to UI:** In `webview/src/lib/components/DiagnosticsView.svelte`, add a section to display index statistics and a "Clear Index" button. | `webview/src/lib/components/DiagnosticsView.svelte` |
| **5.7** | ☐ To Do | **Implement `getCollectionInfo` and `deleteCollection`:** In `src/db/qdrantService.ts`, implement a `getCollectionInfo` method to get stats and a `deleteCollection` method to remove the index. | `src/db/qdrantService.ts` |
| **5.8** | ☐ To Do | **Add message handlers for index info/clear:** In `src/messageRouter.ts`, add handlers for `getCollectionInfo` and `clearIndex`. The `clearIndex` handler should call the `QdrantService` and then likely trigger a state reset. | `src/messageRouter.ts` |
