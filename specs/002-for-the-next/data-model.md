# Data Model: Enhanced Indexing and File Monitoring

## IndexState

Represents the current status of the indexing process.

**Type Definition**:
```typescript
type IndexState = 'idle' | 'indexing' | 'paused' | 'error';
```

**States**:
-   `idle`: The indexer is not running.
-   `indexing`: The indexer is actively processing files.
-   `paused`: The indexer is paused and can be resumed.
-   `error`: The indexer has encountered an error.

## FileMetadata

Represents an indexed file, used to track its state and determine if it needs to be re-indexed.

**Interface Definition**:
```typescript
interface FileMetadata {
    filePath: string;
    lastIndexed: number; // Unix timestamp
    contentHash: string; // SHA-256 hash of the file content
}
```

**Attributes**:
-   `filePath`: The absolute path to the file.
-   `lastIndexed`: The timestamp when the file was last successfully indexed.
-   `contentHash`: A hash of the file's content at the time of indexing. This is used to detect changes in the file content, even if the modification timestamp is not reliable.
