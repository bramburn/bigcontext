# Implementation Plan: Refactor Vitest Tests to Resolve Failures

**Branch**: `006-refactor-vitest-tests` | **Date**: Thursday, September 11, 2025 | **Spec**: /Users/bramburn/dev/bigcontext/specs/006-refactor-vitest-tests/spec.md
**Input**: Feature specification from `/specs/006-refactor-vitest-tests/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
The primary requirement is to resolve widespread Vitest test failures across `src/` extension files and `webview-react/` components. The technical approach will involve configuring Vitest for browser-like environments, ensuring correct test setup/teardown, correcting mocking implementations, and reviewing assertion logic. The goal is to achieve a fully passing test suite, ensuring the stability and reliability of the codebase.

## Technical Context
**Language/Version**: TypeScript (latest compatible with project)  
**Primary Dependencies**: Vitest, React (for webview-react tests), Node.js (test environment)  
**Storage**: N/A (not directly applicable to test refactoring)  
**Testing**: Vitest (primary framework)  
**Target Platform**: Node.js (for extension tests), Browser-like environment (for webview-react tests)  
**Project Type**: Extension (src/), Webview (webview-react/)  
**Performance Goals**: Tests should run efficiently, ideally within a few minutes for the entire suite.  
**Constraints**: Must adhere to existing project structure and coding standards.  
**Scale/Scope**: Affects all existing Vitest tests, particularly those failing in `src/` and `webview-react/`.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 3 (src/, webview-react/, webview-simple/) - This is existing.
- Using framework directly? Yes, Vitest is used directly.
- Single data model? N/A
- Avoiding patterns? N/A

**Architecture**:
- EVERY feature as library? Yes, tests are modular.
- Libraries listed: Vitest (testing), React (webview-react components).
- CLI per library: Vitest has CLI.
- Library docs: llms.txt format planned?

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes, the current state is RED (failing tests), the goal is GREEN.
- Git commits show tests before implementation? This plan focuses on fixing existing tests, so the initial "RED" state is already established. Future changes will follow TDD.
- Order: Contract→Integration→E2E→Unit strictly followed? This is a general guideline. The current task involves fixing existing tests across these categories.
- Real dependencies used? Where appropriate for integration tests, but mocking will be used for unit tests and to isolate external services.
- Integration tests for: new libraries, contract changes, shared schemas? Yes, existing integration tests are failing and need fixing.
- FORBIDDEN: Implementation before test, skipping RED phase. Acknowledged.

**Observability**:
- Structured logging included? N/A (for test refactoring)
- Frontend logs → backend? N/A
- Error context sufficient? Vitest output provides good error context.

**Versioning**:
- Version number assigned? (MAJOR.MINOR.BUILD)
- BUILD increments on every change?
- Breaking changes handled? (parallel tests, migration plan)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 1: Single project (DEFAULT)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - How to configure Vitest for `webview-react/` tests to correctly handle `window` and `document` globals.
   - How to ensure `src/test/suite/` tests correctly use Vitest's global setup/teardown.
   - Best practices for mocking in Vitest, especially for complex services like `QdrantService` and `IndexingService`.
   - How to debug and fix assertion logic errors efficiently.
   - How to handle the `ENOENT` error in `extensionLifecycle.test.ts` related to `extension.js`.

2. **Generate and dispatch research agents**:
   - Task: "Research Vitest `environment` configuration for React components (e.g., `jsdom` or `happy-dom`)."
   - Task: "Research Vitest global setup/teardown best practices and migration from `setup`/`suiteSetup`."
   - Task: "Research advanced mocking techniques in Vitest for TypeScript classes and services."
   - Task: "Research common Vitest assertion pitfalls and debugging strategies."
   - Task: "Research how to correctly test VS Code extension lifecycle and file paths in Vitest."

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - **User Story 1**: As a developer, I want the Vitest test suite to accurately reflect the correctness of the codebase, with all tests passing, so that I can confidently develop and refactor features.
       - **Scenario**: Run `npx vitest` and observe all tests passing.
   - **User Story 2**: As a developer, I want `webview-react/` component tests to run in a browser-like environment without `window is not defined` errors, so that I can reliably test frontend logic.
       - **Scenario**: Execute `webview-react/` tests and confirm no `window is not defined` or `document is not defined` errors.
   - **User Story 3**: As a developer, I want `src/test/suite/` tests to correctly recognize Vitest's global setup/teardown functions, so that test setup is consistent and reliable.
       - **Scenario**: Execute `src/test/suite/` tests and confirm no `setup is not defined` or `suiteSetup is not defined` errors.
   - **User Story 4**: As a developer, I want tests with mocking to correctly apply mocks and pass assertions, so that I can trust the isolation and correctness of unit tests.
       - **Scenario**: Execute tests with mocking (e.g., `qdrantService.test.ts`, `configChange.test.ts`, `fileMonitorService.test.ts`, `indexingService.test.ts`) and confirm correct mock application and passing assertions.

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
-   Tasks will be generated based on the identified categories of failures and the functional requirements.
-   Each functional requirement will translate into one or more implementation tasks.
-   Specific tasks will be created for configuring Vitest, updating test files, and debugging assertion logic.

**Ordering Strategy**:
-   Prioritize environment setup issues (e.g., `window is not defined`, `setup is not defined`) as they affect a large number of tests.
-   Address mocking issues next, as they are fundamental to unit and integration tests.
-   Then, tackle assertion logic errors.
-   Finally, address specific file-related issues like `extensionLifecycle.test.ts`.
-   TDD order: Tests before implementation.

**Estimated Output**: Approximately 15-20 detailed tasks in `tasks.md`.

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [X] Phase 0: Research complete (/plan command)
- [X] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*