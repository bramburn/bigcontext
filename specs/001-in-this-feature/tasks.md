# Tasks: Indexing Error Fix and Enhanced Search Webview

**Input**: Design documents from `/specs/001-in-this-feature/`
**Prerequisites**: plan.md (required), research.md, spec.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `backend/src/`, `frontend/src/`, `backend/tests/`, `frontend/tests/`

## Phase 3.1: Setup
- [ ] T001 Create project structure: `backend/`, `frontend/` at repository root.
- [ ] T002 Initialize TypeScript project with React and Node.js dependencies.
- [ ] T003 [P] Configure linting and formatting tools (Vitest for testing).

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Integration test for `IndexingService` to reproduce and verify fix for "Parallel processing timeout" error in `backend/tests/integration/test_indexing_timeout.ts`.
- [ ] T005 [P] Integration test for webview search bar and button in `frontend/tests/integration/test_search_ui.ts`.
- [ ] T006 [P] Integration test for displaying unique relevant files with relevance percentage in `frontend/tests/integration/test_file_display.ts`.
- [ ] T007 [P] Integration test for copying file paths in specified format in `frontend/tests/integration/test_copy_paths.ts`.
- [ ] T008 [P] Integration test for background indexing and progress bar updates in `backend/tests/integration/test_indexing_progress.ts`.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 Implement fix for "Parallel processing timeout" error in `backend/src/indexing/indexingService.ts`.
- [ ] T010 [P] Implement background processing of new, deleted, updated files into Qdrant in `backend/src/indexing/fileScanner.ts` and `backend/src/indexing/indexingWorker.ts`.
- [ ] T011 [P] Define `File` entity/interface in `backend/src/models/projectFileMetadata.ts`.
- [ ] T012 [P] Implement `QdrantService` for interacting with Qdrant in `backend/src/db/qdrantService.ts`.
- [ ] T013 [P] Implement `SearchService` to handle search queries against Qdrant in `backend/src/search/searchManager.ts`.
- [ ] T014 [P] Implement search bar and search button in `frontend/src/components/SearchBar.tsx`.
- [ ] T015 [P] Implement progress bar and status updates for indexing in `frontend/src/components/IndexingStatus.tsx`.
- [ ] T016 [P] Implement display of unique relevant files with relevance percentage in `frontend/src/components/FileList.tsx`.
- [ ] T017 [P] Implement truncation and visual styling for file paths in `frontend/src/components/FileItem.tsx`.
- [ ] T018 [P] Implement copy button and logic for file paths in `frontend/src/components/CopyPathsButton.tsx`.

## Phase 3.4: Integration
- [ ] T019 Integrate `QdrantService` with `IndexingService` and `SearchService` in `backend/src/extension.ts`.
- [ ] T020 Integrate webview UI components with backend services for search and indexing updates in `frontend/src/App.tsx`.
- [ ] T021 Implement communication between frontend and backend for search queries and indexing progress updates (e.g., using `backend/src/communication/typeSafeCommunicationService.ts`).

## Phase 3.5: Polish
- [ ] T022 [P] Unit tests for `QdrantService` in `backend/tests/unit/qdrantService.test.ts`.
- [ ] T023 [P] Unit tests for `SearchService` in `backend/tests/unit/searchManager.test.ts`.
- [ ] T024 [P] Unit tests for webview components (e.g., `frontend/tests/unit/SearchBar.test.tsx`, `frontend/tests/unit/FileList.test.tsx`).
- [ ] T025 Performance testing for indexing and search operations.
- [ ] T026 Update documentation (e.g., `docs/features/001-in-this-feature.md`) with details on the fix and new search functionality.

## Dependencies
- T004-T008 (Tests) block T009-T018 (Core Implementation).
- T009-T013 (Backend Core) block T019 (Backend Integration).
- T014-T018 (Frontend Core) block T020 (Frontend Integration).
- T019-T021 (Integration) block T025 (Performance Tests).

## Parallel Example
```
# Launch T004-T008 together:
Task: "Integration test for IndexingService to reproduce and verify fix for "Parallel processing timeout" error in backend/tests/integration/test_indexing_timeout.ts"
Task: "Integration test for webview search bar and button in frontend/tests/integration/test_search_ui.ts"
Task: "Integration test for displaying unique relevant files with relevance percentage in frontend/tests/integration/test_file_display.ts"
Task: "Integration test for copying file paths in specified format in frontend/tests/integration/test_copy_paths.ts"
Task: "Integration test for background indexing and progress bar updates in backend/tests/integration/test_indexing_progress.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
