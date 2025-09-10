# Quickstart Guide: Robust Tree-Sitter Parsing and Persistent Configuration

This guide provides a quick overview of how to get started with the new robust Tree-sitter parsing and persistent configuration features.

## 1. Configuration File (`.context/config.json`)

The application now uses a local configuration file located at the project root: `.context/config.json`.

### Example `config.json`:

```json
{
  "treeSitter": {
    "skipSyntaxErrors": true
  },
  "qdrant": {
    "host": "localhost",
    "port": 6333,
    "indexInfo": {
      "collectionName": "my_indexed_code",
      "lastIndexedTimestamp": "2025-09-10T10:00:00Z",
      "contentHash": "abcdef1234567890"
    }
  },
  "ollama": {
    "model": "llama2",
    "endpoint": "http://localhost:11434"
  },
  "git": {
    "ignoreConfig": true
  }
}
```

### Key Configuration Settings:

-   **`treeSitter.skipSyntaxErrors`**: Set to `true` (default) to enable skipping of files with syntax errors during parsing.
-   **`qdrant.indexInfo`**: This section will be automatically managed by the application. It stores details about your Qdrant index. If this information is missing or invalid, and your Ollama/Qdrant settings are otherwise correct, the application will trigger a reindexing process on startup.

## 2. Git Integration (`.gitignore`)

The application will automatically add `.context/config.json` to your project's `.gitignore` file to prevent it from being committed to version control. If `.gitignore` does not exist, it will be created.

## 3. Reindexing Behavior

-   **Automatic Reindexing**: If the application starts and detects that the Qdrant index information in `.context/config.json` is missing or invalid (e.g., the collection doesn't exist or the content hash doesn't match), and your Ollama and Qdrant connection settings are valid, it will automatically initiate a reindexing of your codebase.
-   **Search Page**: Once a valid Qdrant index is confirmed (either loaded from `config.json` or after a successful reindexing), the application will present the user with the search interface.

## 4. Tree-Sitter Error Handling

-   The Tree-sitter parser is now more robust. If it encounters syntax errors in a file, it will attempt to skip the problematic sections and continue processing other valid parts of the code. Errors will be logged, but the overall indexing process will not halt.

## Getting Started:

1.  Ensure your Ollama and Qdrant instances are running and accessible.
2.  Start the application.
3.  The application will attempt to load `config.json`.
    -   If `config.json` is missing or the Qdrant index is invalid, and Ollama/Qdrant settings are valid, reindexing will begin automatically.
    -   If `config.json` and the Qdrant index are valid, you will be directed to the search page.
4.  Verify that `.context/config.json` has been added to your your `.gitignore` file.
