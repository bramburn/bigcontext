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
