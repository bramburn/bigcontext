# Implementation Plan: Indexing Error Fix and Enhanced Search Webview

**Branch**: `001-in-this-feature` | **Date**: 2025-09-10 | **Spec**: /Users/bramburn/dev/bigcontext/specs/001-in-this-feature/spec.md
**Input**: Feature specification from `/specs/001-in-this-feature/spec.md`

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
This plan outlines the implementation for fixing the "Indexing failed: Parallel processing timeout" error and enhancing the repository search webview. The enhancement includes a search bar, a button to search Qdrant, a progress bar and status updates for background indexing, display of unique relevant files with relevance percentage, truncated paths in a visually appealing format, and a button to copy listed file paths in a specified format.

## Technical Context
**Language/Version**: TypeScript
**Primary Dependencies**: Qdrant, React, Node.js
**Storage**: Qdrant
**Testing**: Vitest
**Target Platform**: Web
**Project Type**: Web
**Performance Goals**: [NEEDS CLARIFICATION]
**Constraints**: [NEEDS CLARIFICATION]
**Scale/Scope**: Indexing and searching a repository of varying size.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: src/, webview-react/, tests/
- Using framework directly? (no wrapper classes) - To be determined during design.
- Single data model? (no DTOs unless serialization differs) - To be determined during design.
- Avoiding patterns? (no Repository/UoW without proven need) - To be determined during design.

**Architecture**:
- EVERY feature as library? (no direct app code) - Yes.
- Libraries listed: src/ (core logic), webview-react/ (UI components).
- CLI per library: Backend components might expose CLI for indexing/search.
- Library docs: llms.txt format planned? - Not explicitly, but considered.

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (test MUST fail first) - Yes.
- Git commits show tests before implementation? - Yes.
- Order: Contract→Integration→E2E→Unit strictly followed? - Yes.
- Real dependencies used? (actual DBs, not mocks) - Yes, for integration tests with Qdrant.
- Integration tests for: new libraries, contract changes, shared schemas? - Yes.
- FORBIDDEN: Implementation before test, skipping RED phase - Yes.

**Observability**:
- Structured logging included? - Yes.
- Frontend logs → backend? (unified stream) - To be considered during design.
- Error context sufficient? - Yes.

**Versioning**:
- Version number assigned? (MAJOR.MINOR.BUILD) - Project-level.
- BUILD increments on every change? - Project-level.
- Breaking changes handled? (parallel tests, migration plan) - Considered if applicable.

## Project Structure

### Documentation (this feature)
```
specs/001-in-this-feature/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
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
```

**Structure Decision**: Option 2: Web application (frontend + backend)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Performance Goals: NEEDS CLARIFICATION
   - Constraints: NEEDS CLARIFICATION

2. **Generate and dispatch research agents**:
   - Task: "Research common performance goals for repository indexing and search features."
   - Task: "Research common constraints for repository indexing and search features, especially related to large codebases and real-time updates."
   - Task: "Research best practices for handling 'Parallel processing timeout' errors in indexing systems."

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
   - Each story → integration test scenario
   - Quickstart test = story validation steps

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
- Load `/templates/tasks-template.md` as base.
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart).
- Each contract → contract test task [P].
- Each entity → model creation task [P].
- Each user story → integration test task.
- Implementation tasks to make tests pass.
- Specific tasks for fixing the "Parallel processing timeout" error.
- Specific tasks for implementing the webview UI (search bar, search button, progress bar, status update, file list display, copy button).
- Task to ensure Vitest tests are created.
- Task to allow the user to go to the search page right after the first full index.

**Ordering Strategy**:
- TDD order: Tests before implementation.
- Dependency order: Models before services before UI.
- Mark [P] for parallel execution (independent files).

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

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
- [x] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*