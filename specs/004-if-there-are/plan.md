# Implementation Plan: Robust Tree-Sitter Parsing and Persistent Configuration

**Feature Branch**: `004-if-there-are`
**Feature Specification**: `/Users/bramburn/dev/bigcontext/specs/004-if-there-are/spec.md`
**Created**: September 10, 2025
**Status**: Completed

## Technical Context

The core of this feature involves two main areas:
1.  **Robust Tree-Sitter Parsing**: Handling syntax errors during file parsing to ensure the indexing process continues without interruption.
2.  **Persistent Configuration Management**: Saving and loading application settings, including Qdrant index information, to a local `.context/config.json` file, and managing its inclusion in `.gitignore`.

Specifically, the `config.json` will store the Qdrant index. Upon application load, if this index is not found or is invalid, but Ollama and Qdrant settings are otherwise valid, a reindexing process will be initiated. If the `config.json` is valid and the Qdrant index is present and valid, the user will be directed to the database search page.

## User Stories

*   **Primary User Story**: As a user, I want the system to gracefully handle syntax errors in files during tree-sitter parsing so that the indexing process doesn't halt and other valid code can still be processed. I also want my configuration settings to be saved persistently in a local file and automatically ignored by Git, so I don't have to reset them every time and avoid committing personal settings. Furthermore, this config file should include the index of the Qdrant we'll be using so that we can refer to it when we load the app. If the index cannot be found but the settings for Ollama and Qdrant are valid, I expect reindexing to be done. Otherwise, if the config.json is all good and the index is found, I should be presented with the page to search the database.

## Execution Flow (main)

```
1. Parse Input (IMPL_PLAN path, FEATURE_SPEC path, SPECS_DIR path, BRANCH name)
   → If any input missing: ERROR "Missing required input for plan generation"
2. Read FEATURE_SPEC
   → If read fails: ERROR "Failed to read feature specification"
3. Read /memory/constitution.md
   → If read fails: WARN "Could not read constitution.md. Proceeding without constitutional context."
4. Initialize Progress Tracking
5. Execute Phase 0: Research
   → Generate research.md in $SPECS_DIR
   → Update Progress Tracking
6. Execute Phase 1: Design
   → Generate data-model.md in $SPECS_DIR
   → Generate contracts/ in $SPECS_DIR
   → Generate quickstart.md in $SPECS_DIR
   → Update Progress Tracking
7. Execute Phase 2: Tasks
   → Generate tasks.md in $SPECS_DIR
   → Update Progress Tracking
8. Final Review & Verification
   → Check all artifacts generated
   → Check Progress Tracking for completion
   → Check for any ERROR states
9. Report Completion
```

## Progress Tracking

- [x] Phase 0: Research
- [x] Phase 1: Design
- [x] Phase 2: Tasks

---

## Phase 0: Research

### research.md

```markdown
# Research for Robust Tree-Sitter Parsing and Persistent Configuration

## 1. Tree-Sitter Error Handling

### Problem
Current parsing fails on syntax errors, preventing further processing.

### Research Questions
- How does Tree-sitter report syntax errors? (e.g., error nodes, null nodes)
- What are the best practices for error recovery in Tree-sitter?
- Can we skip erroneous parts of the AST and continue parsing valid sections?
- Are there existing libraries or patterns for robust Tree-sitter parsing in TypeScript/JavaScript?

### Proposed Approach
- Identify error nodes in the AST.
- Implement a strategy to skip or ignore subtrees rooted at error nodes.
- Ensure that valid code chunks outside of the erroneous sections are still processed.
- Consider logging errors for debugging without halting the main process.

## 2. Persistent Configuration Management

### Problem
Configuration settings are not persistently saved, requiring frequent resets. The `.context/config.json` is not ignored by Git.

### Research Questions
- What's the best way to store local, user-specific configuration in a VS Code extension/Node.js application? (e.g., JSON file, VS Code's Memento API)
- How to ensure atomic writes to the configuration file to prevent corruption?
- How to programmatically read/write to `.gitignore`?
- How to create a `.gitignore` file if it doesn't exist?
- What are the security implications of storing sensitive information (if any) in `config.json`? (Though the current spec doesn't mention sensitive data, it's good to consider).

### Proposed Approach
- Use a JSON file (`.context/config.json`) for storing configuration.
- Implement a dedicated service for reading, writing, and managing this configuration file.
- Ensure proper error handling for file I/O operations.
- Implement logic to check for and update `.gitignore` to include `.context/config.json`.
- Implement logic to create `.gitignore` if it doesn't exist.

## 3. Qdrant Index Management

### Problem
The application needs to know the state of the Qdrant index to determine if reindexing is required or if search can proceed directly.

### Research Questions
- How can we represent the Qdrant index state in `config.json`? (e.g., index ID, last updated timestamp, hash of indexed content)
- How to verify the validity of the Qdrant index from the application?
- What triggers reindexing? (e.g., missing index, invalid index, configuration changes)
- How to integrate the reindexing trigger with the application's startup flow?

### Proposed Approach
- Store a unique identifier or a hash of the indexed content in `config.json` to represent the Qdrant index.
- On startup, compare the stored index information with the actual Qdrant state.
- If a mismatch or absence, and Ollama/Qdrant settings are valid, trigger the reindexing process.
- If valid, proceed to the search interface.
```
