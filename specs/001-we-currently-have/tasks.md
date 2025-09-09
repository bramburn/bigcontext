# Tasks: RAG for LLM VS Code Extension with Initial Setup and Indexing UI

**Input**: Design documents from `/Users/bramburn/dev/bigcontext/specs/001-we-currently-have/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- Backend (Extension): `src/`
- Frontend (Webview): `webview-react/src/`

## Phase 3.1: Setup
- [ ] T001 Initialize project dependencies for backend (TypeScript, Node.js) and frontend (React, Fluent UI) in `package.json` and `webview-react/package.json`.
- [ ] T002 Configure ESLint and Prettier for TypeScript and React in `.eslintrc.json` and `webview-react/.eslintrc.json`.
- [ ] T003 Setup Vitest for testing both backend (`src/`) and frontend (`webview-react/src/`) components.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Write contract test for `GET /settings` in `/Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/get-settings.test.ts`.
- [ ] T005 [P] Write contract test for `POST /settings` in `/Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/post-settings.test.ts`.
- [ ] T006 [P] Write contract test for `GET /indexing-status` in `/Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/get-indexing-status.test.ts`.
- [ ] T007 [P] Write contract test for `POST /indexing-start` in `/Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/post-indexing-start.test.ts`.
- [ ] T008 [P] Write integration test for "Initial Extension Setup" scenario in `webview-react/src/tests/integration/initialSetup.test.ts`.
- [ ] T009 [P] Write integration test for "Starting and Monitoring Indexing" scenario in `webview-react/src/tests/integration/indexingFlow.test.ts`.
- [ ] T010 [P] Write integration test for "Re-opening the Extension View" scenario in `webview-react/src/tests/integration/reopenView.test.ts`.
- [ ] T011 [P] Write integration test for "Reindexing an Existing Project" scenario in `webview-react/src/tests/integration/reindexing.test.ts`.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T012 [P] Implement `Embedding Model Settings` data model in `src/models/embeddingSettings.ts`.
- [ ] T013 [P] Implement `Qdrant Database Settings` data model in `src/models/qdrantSettings.ts`.
- [ ] T014 [P] Implement `Indexing Progress Data` data model in `src/models/indexingProgress.ts`.
- [ ] T015 [P] Implement `Project File Metadata` data model in `src/models/projectFileMetadata.ts`.
- [ ] T016 Implement `SettingsService` to handle persistence of embedding and Qdrant settings using VS Code Memento API in `src/services/settingsService.ts`.
- [ ] T017 Implement `IndexingService` to manage project chunking, embedding generation, and Qdrant storage in `src/services/indexingService.ts`.
- [ ] T018 Implement `FileProcessor` to handle file reading, binary/gitignore exclusion, and chunking logic in `src/services/fileProcessor.ts`.
- [ ] T019 Implement `EmbeddingProvider` interface and concrete implementations for Nomic Embed and OpenAI in `src/embeddings/`.
- [ ] T020 Implement `QdrantService` for interaction with the Qdrant database in `src/db/qdrantService.ts`.
- [ ] T021 Implement backend API for `GET /settings` using `SettingsService` in `src/api/settingsApi.ts`.
- [ ] T022 Implement backend API for `POST /settings` using `SettingsService` in `src/api/settingsApi.ts`.
- [ ] T023 Implement backend API for `GET /indexing-status` using `IndexingService` in `src/api/indexingApi.ts`.
- [ ] T024 Implement backend API for `POST /indexing-start` using `IndexingService` in `src/api/indexingApi.ts`.
- [ ] T025 Implement `SettingsForm` React component using Fluent UI in `webview-react/src/components/SettingsForm.tsx`.
- [ ] T026 Implement `IndexingProgress` React component using Fluent UI to display progress bar and statistics in `webview-react/src/components/IndexingProgress.tsx`.
- [ ] T027 Implement main webview page logic to switch between `SettingsForm` and `IndexingProgress` based on settings presence in `webview-react/src/App.tsx`.
- [ ] T028 Establish communication channel between webview frontend and extension backend.

## Phase 3.4: Integration
- [ ] T029 Connect `SettingsForm` to backend `GET /settings` and `POST /settings` APIs.
- [ ] T030 Connect `IndexingProgress` to backend `GET /indexing-status` and `POST /indexing-start` APIs.
- [ ] T031 Integrate `FileProcessor` with `IndexingService` for chunking and filtering.
- [ ] T032 Integrate `EmbeddingProvider` with `IndexingService` for embedding generation.
- [ ] T033 Integrate `QdrantService` with `IndexingService` for storing embeddings.
- [ ] T034 Implement logic to exclude binary files and files in `.gitignore` during file processing.

## Phase 3.5: Polish
- [ ] T035 Research and resolve `NEEDS CLARIFICATION` for "Performance Goals" from `research.md`.
- [ ] T036 Research and resolve `NEEDS CLARIFICATION` for "Constraints" from `research.md`.
- [ ] T037 Research and resolve `NEEDS CLARIFICATION` for "Scale/Scope" from `research.md`.
- [ ] T038 Research and resolve `NEEDS CLARIFICATION` for "Embedding Model Configuration Details (FR-003)" from `research.md`.
- [ ] T039 Research and resolve `NEEDS CLARIFICATION` for "Qdrant Database Configuration Details (FR-004)" from `research.md`.
- [ ] T040 Research and resolve `NEEDS CLARIFICATION` for "Basic Indexing Statistics (FR-009)" from `research.md`.
- [ ] T041 Research and resolve `NEEDS CLARIFICATION` for "Project File Reshuffling (FR-018)" from `research.md`.
- [ ] T042 Research and resolve `NEEDS CLARIFICATION` for "Third Workflow (FR-019)" from `research.md`.
- [ ] T043 Write unit tests for `SettingsService`, `IndexingService`, `FileProcessor`, `EmbeddingProvider` implementations, and `QdrantService`.
- [ ] T044 Optimize performance of file processing and embedding generation.
- [ ] T045 Update user documentation (`docs/USER_GUIDE.md`) with new features.
- [ ] T046 Run manual validation using `quickstart.md`.

## Dependencies
- T004-T011 (Tests) before T012-T028 (Core Implementation)
- T012-T015 (Data Models) before T016-T020 (Services)
- T016-T020 (Services) before T021-T024 (Backend APIs)
- T025-T027 (Frontend UI) depends on T021-T024 (Backend APIs) for data.
- T028 (Communication Channel) is a prerequisite for T029-T030.
- T029-T034 (Integration) after T012-T028 (Core Implementation).
- T035-T042 (Research/Resolution) can be done in parallel with other tasks, but their findings might influence other tasks.
- T043-T046 (Polish) after T029-T034 (Integration).

## Parallel Example
```
# Launch contract tests in parallel:
Task: "Write contract test for GET /settings in /Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/get-settings.test.ts"
Task: "Write contract test for POST /settings in /Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/post-settings.test.ts"
Task: "Write contract test for GET /indexing-status in /Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/get-indexing-status.test.ts"
Task: "Write contract test for POST /indexing-start in /Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/post-indexing-start.test.ts"

# Launch data model implementations in parallel:
Task: "Implement Embedding Model Settings data model in src/models/embeddingSettings.ts"
Task: "Implement Qdrant Database Settings data model in src/models/qdrantSettings.ts"
Task: "Implement Indexing Progress Data data model in src/models/indexingProgress.ts"
Task: "Implement Project File Metadata data model in src/models/projectFileMetadata.ts"
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
