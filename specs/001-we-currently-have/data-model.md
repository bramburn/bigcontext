# Data Model for RAG for LLM VS Code Extension

## Entities

### 1. Embedding Model Settings

*   **Description**: Stores the configuration details for the selected embedding model provider (Mimic Embed or OpenAI).
*   **Attributes**:
    *   `provider`: String (Enum: "Mimic Embed", "OpenAI") - The chosen embedding service provider.
    *   `apiKey`: String (Sensitive) - API key for authentication with the embedding service.
    *   `endpoint`: String (Optional) - Custom endpoint URL for the embedding service.
    *   `modelName`: String (Optional) - Specific model name to use (e.g., "text-embedding-ada-002").
    *   `[NEEDS CLARIFICATION]`: Additional provider-specific attributes as identified during research.

### 2. Qdrant Database Settings

*   **Description**: Stores the connection details for the Qdrant vector database.
*   **Attributes**:
    *   `host`: String - Hostname or IP address of the Qdrant instance.
    *   `port`: Number (Optional) - Port number for the Qdrant instance (default 6333).
    *   `apiKey`: String (Sensitive, Optional) - API key for authentication with Qdrant.
    *   `collectionName`: String - Name of the collection in Qdrant to store embeddings.
    *   `[NEEDS CLARIFICATION]`: Additional Qdrant-specific attributes (e.g., TLS/SSL settings, gRPC options) as identified during research.

### 3. Indexing Progress Data

*   **Description**: Represents the current state and statistics of the project indexing process.
*   **Attributes**:
    *   `status`: String (Enum: "Not Started", "In Progress", "Completed", "Paused", "Error") - Current status of the indexing.
    *   `percentageComplete`: Number (0-100) - Percentage of the project indexed.
    *   `chunksIndexed`: Number - Total number of chunks successfully processed and stored.
    *   `totalFiles`: Number (Optional) - Total number of files considered for indexing.
    *   `filesProcessed`: Number (Optional) - Number of files already processed.
    *   `timeElapsed`: Number (Optional) - Time in seconds since indexing started.
    *   `estimatedTimeRemaining`: Number (Optional) - Estimated time in seconds until indexing completion.
    *   `errorsEncountered`: Number (Optional) - Count of errors during indexing.
    *   `[NEEDS CLARIFICATION]`: Other basic statistics as identified during research.

### 4. Project File Metadata

*   **Description**: Stores metadata about each file in the project that is relevant for chunking and indexing.
*   **Attributes**:
    *   `filePath`: String - Absolute path to the file.
    *   `lastModified`: Date/Timestamp - Last modification time of the file.
    *   `createdAt`: Date/Timestamp - Creation time of the file.
    *   `lineCount`: Number - Total number of lines in the file.
    *   `isChunked`: Boolean - Indicates if the file has been processed into chunks.
    *   `chunkHashes`: Array of Strings (Optional) - Hashes of the chunks derived from this file, for integrity checking.
    *   `excludedByGitignore`: Boolean - True if the file is excluded by .gitignore.
    *   `isBinary`: Boolean - True if the file is identified as a binary file.

## Relationships

*   `Embedding Model Settings` and `Qdrant Database Settings` are independent configuration entities.
*   `Indexing Progress Data` is updated based on the processing of `Project Files`.
*   `Project Files` are the source for chunks that are then embedded and stored in Qdrant (using `Embedding Model Settings` and `Qdrant Database Settings`).
