# Tasks: Enhanced File Scanning Progress Messages

**Input**: Design documents from `/specs/003-when-we-go/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `src/` (backend), `webview-react/` (frontend)

## Phase 3.1: Setup & Dependencies
- [ ] T001 Install `fast-glob` and `ignore` npm packages in the `src/` directory.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T002 [P] Run contract tests for `/Users/bramburn/dev/bigcontext/tests/contracts/progress-messages.test.ts` and ensure they fail.

## Phase 3.3: Core Implementation - Backend (`src/`)
- [ ] T003 Implement file scanning logic in `src/` to traverse the repository, identify files, and count them. (e.g., `src/indexing/fileScanner.ts`)
- [ ] T004 Integrate `.gitignore` and `.geminiignore` parsing using `ignore` or `fast-glob` to identify "not considered" files within the file scanning logic. (e.g., `src/indexing/fileScanner.ts`)
- [ ] T005 Implement logic to send `scanStart`, `scanProgress`, and `scanComplete` messages from `src/` to the webview using `postMessage`. (e.g., `src/communication/messageSender.ts` and `src/extension.ts` for integration)
- [ ] T006 Implement logic to handle empty repositories (send `scanComplete` immediately) within the file scanning process. (e.g., `src/indexing/fileScanner.ts`)

## Phase 3.4: Core Implementation - Frontend (`webview-react/`)
- [ ] T007 Implement a new React component in `webview-react/src/components/ProgressDisplay.tsx` to display progress messages.
- [ ] T008 Implement logic in `webview-react/src/hooks/useProgressMessages.ts` to listen for `postMessage` events from the extension backend.
- [ ] T009 Update the React component's state and UI (`webview-react/src/components/ProgressDisplay.tsx`) based on received `scanStart`, `scanProgress`, and `scanComplete` messages.
- [ ] T010 Integrate the new progress display component into the relevant page in `webview-react/src/pages/SubsequentPage.tsx` (the "subsequent page" after configuration).

## Phase 3.5: Integration & Error Handling
- [ ] T011 Connect the backend file scanning initiation to the navigation event on the "subsequent page" in the VS Code extension. (e.g., `src/extension.ts` and `src/webviewManager.ts`)
- [ ] T012 Ensure proper error handling and logging for file scanning and communication. (e.g., `src/logging/logger.ts` and relevant modules)

## Phase 3.6: Polish & Verification
- [ ] T013 [P] Write unit tests for the file scanning and counting logic in `src/indexing/fileScanner.test.ts`.
- [ ] T014 [P] Write unit tests for the progress message handling in `webview-react/src/hooks/useProgressMessages.test.ts`.
- [ ] T015 Verify the quickstart guide steps by manually testing the feature.

## Dependencies
- T001 before T003, T004
- T002 before T003, T004, T005, T006, T007, T008, T009, T010, T011, T012
- T003, T004, T005, T006 before T011
- T007, T008, T009, T010 before T011
- T011 before T015
- T012 can be integrated throughout
- T013, T014 can be done in parallel with other tasks once the core logic is in place, but after T002.

## Parallel Example
```bash
# After T001 and T002 are complete, T003-T010 can be worked on.
# T003, T004, T005, T006 are backend tasks and can be worked on by one agent.
# T007, T008, T009, T010 are frontend tasks and can be worked on by another agent.

# Example of parallel execution for unit tests (after core implementation):
Task: "Write unit tests for the file scanning and counting logic in src/indexing/fileScanner.test.ts"
Task: "Write unit tests for the progress message handling in webview-react/src/hooks/useProgressMessages.test.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Validation Checklist
- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
