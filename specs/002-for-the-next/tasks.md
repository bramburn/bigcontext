# Tasks: Enhanced Indexing and File Monitoring

**Input**: Design documents from `/Users/bramburn/dev/bigcontext/specs/002-for-the-next/`

## Phase 1: Setup and Data Models

- [ ] **T001 [P]**: Define `IndexState` type and `FileMetadata` interface in `src/types/indexing.ts` based on `data-model.md`.

## Phase 2: Tests First (TDD)

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation.**

- [ ] **T002 [P]**: Create contract test for `IIndexingService` in `src/tests/contract/indexingService.test.ts`. This test should check the service's public API.
- [ ] **T003 [P]**: Create contract test for `IFileMonitorService` in `src/tests/contract/fileMonitorService.test.ts`.
- [ ] **T004 [P]**: Write integration test for pausing and resuming indexing in `src/tests/integration/indexingFlow.test.ts`. This test should simulate a user pausing and resuming the indexing process.
- [ ] **T005 [P]**: Write integration test for re-indexing on configuration change in `src/tests/integration/configChange.test.ts`.
- [ ] **T006 [P]**: Write integration test for file monitoring (create, update, delete) in `src/tests/integration/fileMonitoring.test.ts`.

## Phase 3: Core Implementation

- [ ] **T007 [P]**: Create skeleton `IndexingService` in `src/services/indexingService.ts` implementing `IIndexingService`.
- [ ] **T008 [P]**: Create skeleton `FileMonitorService` in `src/services/fileMonitorService.ts` implementing `IFileMonitorService`.
- [ ] **T009**: Implement the state management logic (idle, indexing, paused, error) in `IndexingService`.
- [ ] **T010**: Implement the core logic for `pauseIndexing` and `resumeIndexing` in `IndexingService`.
- [ ] **T011**: Implement the file watching logic in `FileMonitorService` using `vscode.workspace.createFileSystemWatcher`.
- [ ] **T012**: Implement debouncing for file change events in `FileMonitorService`.
- [ ] **T013**: Implement the configuration change listener in `ConfigurationManager` to detect changes to the embedding model and database settings.

## Phase 4: Integration

- [ ] **T014**: Connect `FileMonitorService` to `IndexingService` so that file events trigger the appropriate indexing actions (e.g., `updateFileInIndex`, `removeFileFromIndex`).
- [ ] **T015**: Integrate `.gitignore` parsing into the file discovery process in `IndexingService`.
- [ ] **T016**: Add logic to `IndexingService` to filter out binary and excessively large files.
- [ ] **T017**: Connect the configuration change listener to `IndexingService` to trigger a full re-index.

## Phase 5: Polish

- [ ] **T018 [P]**: Implement a status bar item in `src/statusBarManager.ts` to display the current `IndexState` from `IndexingService`.
- [ ] **T019 [P]**: Register the `pauseIndexing`, `resumeIndexing`, and `startIndexing` commands in `src/commandManager.ts` and connect them to the `IndexingService`.
- [ ] **T020 [P]**: Write unit tests for the debouncing logic in `FileMonitorService` in `src/tests/unit/fileMonitorService.test.ts`.
- [ ] **T021 [P]**: Update `README.md` with information about the new indexing controls and features.
- [ ] **T022**: Perform a full manual test of the feature, following the scenarios in `quickstart.md`.

## Dependencies

-   **T001** must be completed before all other tasks.
-   **T002-T006** (Tests) must be completed before **T007-T017** (Implementation/Integration).
-   **T007** and **T008** are prerequisites for most implementation tasks.
-   **T014** depends on **T011** and **T007**.
-   **T017** depends on **T013** and **T007**.

## Parallel Execution Example

```
# The following tests can be developed in parallel:
Task: "T002 [P] Create contract test for IIndexingService..."
Task: "T003 [P] Create contract test for IFileMonitorService..."
Task: "T004 [P] Write integration test for pausing and resuming..."
Task: "T005 [P] Write integration test for re-indexing on config change..."
Task: "T006 [P] Write integration test for file monitoring..."
```