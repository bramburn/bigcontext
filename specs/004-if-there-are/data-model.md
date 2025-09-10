# Data Model for Persistent Configuration

## `config.json` Structure

The `.context/config.json` file will be a JSON object with the following structure:

```json
{
  "treeSitter": {
    "skipSyntaxErrors": true
  },
  "qdrant": {
    "host": "localhost",
    "port": 6333,
    "indexInfo": {
      "collectionName": "my_collection",
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

### Field Descriptions:

-   **`treeSitter.skipSyntaxErrors`**:
    -   Type: `boolean`
    -   Description: If `true`, the Tree-sitter parser will attempt to skip files or code chunks with syntax errors and continue processing.
    -   Default: `true`

-   **`qdrant.host`**:
    -   Type: `string`
    -   Description: The hostname or IP address of the Qdrant instance.
    -   Default: `localhost`

-   **`qdrant.port`**:
    -   Type: `number`
    -   Description: The port number of the Qdrant instance.
    -   Default: `6333`

-   **`qdrant.indexInfo`**:
    -   Type: `object`
    -   Description: Information about the Qdrant index (collection) used by the application.
    -   Optional: This object may be absent if no index has been created or if it's invalid.
    -   **`qdrant.indexInfo.collectionName`**:
        -   Type: `string`
        -   Description: The name of the Qdrant collection (index) being used.
    -   **`qdrant.indexInfo.lastIndexedTimestamp`**:
        -   Type: `string` (ISO 8601 format)
        -   Description: Timestamp of the last successful indexing operation. Used to determine if reindexing is needed due to data staleness.
    -   **`qdrant.indexInfo.contentHash`**:
        -   Type: `string`
        -   Description: A hash representing the content that was last indexed. Used to detect changes in source content that would necessitate reindexing.

-   **`ollama.model`**:
    -   Type: `string`
    -   Description: The name of the Ollama model to use for embeddings.
    -   Default: `llama2`

-   **`ollama.endpoint`**:
    -   Type: `string`
    -   Description: The URL of the Ollama API endpoint.
    -   Default: `http://localhost:11434`

-   **`git.ignoreConfig`**:
    -   Type: `boolean`
    -   Description: If `true`, the system will ensure `.context/config.json` is added to `.gitignore`.
    -   Default: `true`

## Relationships

-   The `Configuration` object is a singleton, representing the application's global settings.
-   `qdrant.indexInfo` is directly tied to the state of the Qdrant database and the indexed content. Its absence or invalidity triggers reindexing.
