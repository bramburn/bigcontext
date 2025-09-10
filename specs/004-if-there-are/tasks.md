# Implementation Tasks for Robust Tree-Sitter Parsing and Persistent Configuration

This document outlines the detailed tasks required to implement the "Robust Tree-Sitter Parsing and Persistent Configuration" feature.

## Phase 2: Implementation Tasks

### 1. Tree-Sitter Error Handling (FR-001, FR-002)

-   **Task 2.1.1**: Modify the Tree-sitter parsing logic to identify and handle syntax errors.
    -   **Sub-task 2.1.1.1**: Implement error node detection within the AST.
    -   **Sub-task 2.1.1.2**: Develop a strategy to skip or ignore subtrees rooted at error nodes.
    -   **Sub-task 2.1.1.3**: Ensure that parsing continues for valid code chunks after encountering an error.
-   **Task 2.1.2**: Implement logging for Tree-sitter parsing errors.
    -   **Sub-task 2.1.2.1**: Log the file path and specific error details when a syntax error is encountered.

### 2. Persistent Configuration Management (FR-003, FR-004, FR-005, FR-006)

-   **Task 2.2.1**: Create a `ConfigurationService` (or similar) to manage the `.context/config.json` file.
    -   **Sub-task 2.2.1.1**: Implement `loadConfiguration()` to read settings from `.context/config.json`.
    -   **Sub-task 2.2.1.2**: Implement `saveConfiguration()` to write settings to `.context/config.json`.
    -   **Sub-task 2.2.1.3**: Handle file I/O errors (e.g., file not found, read/write permissions).
    -   **Sub-task 2.2.1.4**: Implement default configuration values if the file does not exist or is empty.
-   **Task 2.2.2**: Integrate configuration loading into the application startup sequence.
-   **Task 2.2.3**: Implement `.gitignore` management.
    -   **Sub-task 2.2.3.1**: Check for the existence of `.gitignore`.
    -   **Sub-task 2.2.3.2**: If `.gitignore` does not exist, create it.
    -   **Sub-task 2.2.3.3**: Add `.context/config.json` to `.gitignore` if it's not already present.
    -   **Sub-task 2.2.3.4**: Ensure this process runs when configuration is saved.

### 3. Qdrant Index Management and Reindexing (FR-007, FR-008, FR-009)

-   **Task 2.3.1**: Extend `ConfigurationService` to manage Qdrant index information.
    -   **Sub-task 2.3.1.1**: Add `indexInfo` field to the configuration schema (as defined in `data-model.md`).
    -   **Sub-task 2.3.1.2**: Implement logic to update `indexInfo` after a successful indexing operation (e.g., store collection name, timestamp, content hash).
-   **Task 2.3.2**: Implement Qdrant index validation logic.
    -   **Sub-task 2.3.2.1**: Check if `indexInfo` exists and is valid (e.g., collection exists in Qdrant, content hash matches).
    -   **Sub-task 2.3.2.2**: Verify Ollama and Qdrant connection settings are valid.
-   **Task 2.3.3**: Integrate reindexing trigger into application startup.
    -   **Sub-task 2.3.3.1**: On startup, after loading configuration, check Qdrant index validity.
    -   **Sub-task 2.3.3.2**: If index is invalid/missing and Ollama/Qdrant settings are valid, initiate the reindexing process.
-   **Task 2.3.4**: Implement redirection to search page.
    -   **Sub-task 2.3.4.1**: If configuration and Qdrant index are valid, present the user with the search interface.

### 4. Testing

-   **Task 2.4.1**: Write unit tests for Tree-sitter error handling.
-   **Task 2.4.2**: Write unit tests for `ConfigurationService` (load, save, default values, error handling).
-   **Task 2.4.3**: Write integration tests for `.gitignore` management (creation, update).
-   **Task 2.4.4**: Write integration tests for Qdrant index management and reindexing trigger.
-   **Task 2.4.5**: Write end-to-end tests covering the primary user story and acceptance scenarios.

### 5. Documentation

-   **Task 2.5.1**: Update developer documentation with details on the new configuration system.
-   **Task 2.5.2**: Update user-facing documentation (if any) regarding persistent settings and reindexing behavior.
