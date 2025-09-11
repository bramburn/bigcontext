# Tasks: Refactor Vitest Tests to Resolve Failures

**Feature Branch**: `006-refactor-vitest-tests`

This document outlines the executable tasks to refactor Vitest tests and resolve widespread failures.

## Setup Tasks

- **T001**: Configure Vitest to use `jsdom` environment for `webview-react/` tests.
  - **Action**: Modify `vitest.config.ts` to set `environment: 'jsdom'` for `webview-react` test files.
  - **File**: `/Users/bramburn/dev/bigcontext/vitest.config.ts`
- **T002**: Update `tsconfig.json` to include `vitest/jsdom` types.
  - **Action**: Add `"vitest/jsdom"` to `compilerOptions.types` in `tsconfig.json` and `webview-react/tsconfig.json`.
  - **File**: `/Users/bramburn/dev/bigcontext/tsconfig.json`, `/Users/bramburn/dev/bigcontext/webview-react/tsconfig.json`

## Core Refactoring Tasks (Addressing `setup`/`suiteSetup` errors)

- **T003 [P]**: Migrate `setup` and `suiteSetup` in `src/test/suite/configService.test.ts` to Vitest's native hooks (`beforeEach`, `beforeAll`, etc.).
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/configService.test.ts`
- **T004 [P]**: Migrate `setup` and `suiteSetup` in `src/test/suite/contextService.test.ts` to Vitest's native hooks.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/contextService.test.ts`
- **T005 [P]**: Migrate `setup` and `suiteSetup` in `src/test/suite/dependencyInjection.test.ts` to Vitest's native hooks.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/dependencyInjection.test.ts`
- **T006 [P]**: Migrate `setup` and `suiteSetup` in `src/test/suite/messageRouter.test.ts` to Vitest's native hooks.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/messageRouter.test.ts`
- **T007 [P]**: Migrate `setup` and `suiteSetup` in `src/test/suite/parallelIndexing.test.ts` to Vitest's native hooks.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/parallelIndexing.test.ts`
- **T008 [P]**: Migrate `setup` and `suiteSetup` in `src/test/suite/queryExpansionReRanking.test.ts` to Vitest's native hooks.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/queryExpansionReRanking.test.ts`
- **T009 [P]**: Migrate `setup` and `suiteSetup` in `src/test/suite/webviewManager.test.ts` to Vitest's native hooks.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/webviewManager.test.ts`
- **T010 [P]**: Migrate `setup` and `suiteSetup` in `src/test/suite/xmlFormatterService.test.ts` to Vitest's native hooks.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/xmlFormatterService.test.ts`

## Core Refactoring Tasks (Addressing Mocking Issues)

- **T011**: Correct mocking implementation in `src/tests/db/qdrantService.test.ts`.
  - **Action**: Use `vi.mock` for `@qdrant/js-client-rest` and ensure `mockReturnValue` is correctly applied.
  - **File**: `/Users/bramburn/dev/bigcontext/src/tests/db/qdrantService.test.ts`
- **T012**: Correct mocking implementation in `src/tests/integration/configChange.test.ts`.
  - **Action**: Ensure spies are correctly applied and assertions are valid.
  - **File**: `/Users/bramburn/dev/bigcontext/src/tests/integration/configChange.test.ts`
- **T013**: Correct mocking implementation in `src/tests/contract/fileMonitorService.test.ts`.
  - **Action**: Address `mockReturnValue is not a function` and `is not a spy or a call to a spy!` errors.
  - **File**: `/Users/bramburn/dev/bigcontext/src/tests/contract/fileMonitorService.test.ts`
- **T014**: Correct mocking implementation in `src/tests/contract/indexingService.test.ts`.
  - **Action**: Address `mockResolvedValueOnce is not a function` and `mockRejectedValueOnce is not a function` errors.
  - **File**: `/Users/bramburn/dev/bigcontext/src/tests/contract/indexingService.test.ts`

## Core Refactoring Tasks (Addressing Assertion Errors / Unexpected Behavior)

- **T015**: Review and correct assertion logic in `src/tests/integration/fileMonitoring.test.ts`.
  - **Action**: Fix debouncing assertion and `FileMonitorService` implementation check.
  - **File**: `/Users/bramburn/dev/bigcontext/src/tests/integration/fileMonitoring.test.ts`
- **T016**: Review and correct assertion logic in `src/test/suite/astParserErrorHandling.test.ts`.
  - **Action**: Fix assertion related to `filePath`.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/astParserErrorHandling.test.ts`
- **T017**: Review and correct assertion logic in `src/test/suite/configurationService.test.ts`.
  - **Action**: Fix assertion related to `generateContentHash`.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/configurationService.test.ts`
- **T018**: Review and correct assertion logic in `src/test/suite/startupFlow.integration.test.ts`.
  - **Action**: Fix various `AssertionError: Expected values to be strictly equal:` errors.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/startupFlow.integration.test.ts`
- **T019**: Review and correct assertion logic in `src/test/suite/startupService.test.ts`.
  - **Action**: Fix various `AssertionError: Expected values to be strictly equal:` and `this.configurationService.configurationFileExists is not a function` errors.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/startupService.test.ts`
- **T020**: Address `ENOENT` error in `src/test/suite/extensionLifecycle.test.ts`.
  - **Action**: Modify test to correctly reference `extension.ts` or mock file system access.
  - **File**: `/Users/bramburn/dev/bigcontext/src/test/suite/extensionLifecycle.test.ts`

## Polish Tasks (Addressing Intentional TDD Failures)

- **T021 [P]**: Update `specs/001-we-currently-have/tests/contracts/get-indexing-status.test.ts` to pass.
  - **Action**: Remove `expect(true).toBe(false)` and implement correct assertions based on actual implementation.
  - **File**: `/Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/get-indexing-status.test.ts`
- **T022 [P]**: Update `specs/001-we-currently-have/tests/contracts/post-indexing-start.test.ts` to pass.
  - **Action**: Remove `expect(true).toBe(false)` and implement correct assertions based on actual implementation.
  - **File**: `/Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/post-indexing-start.test.ts`
- **T023 [P]**: Update `specs/001-we-currently-have/tests/contracts/post-settings.test.ts` to pass.
  - **Action**: Remove `expect(true).toBe(false)` and implement correct assertions based on actual implementation.
  - **File**: `/Users/bramburn/dev/bigcontext/specs/001-we-currently-have/tests/contracts/post-settings.test.ts`
