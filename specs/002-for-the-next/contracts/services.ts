# API Contracts

## IIndexingService

Defines the contract for controlling the indexing process.

```typescript
export type IndexState = 'idle' | 'indexing' | 'paused' | 'error';

export interface IIndexingService {
    /**
     * Starts a full indexing process for the workspace.
     */
    startIndexing(): Promise<void>;

    /**
     * Pauses the currently running indexing process.
     */
    pauseIndexing(): Promise<void>;

    /**
     * Resumes a paused indexing process.
     */
    resumeIndexing(): Promise<void>;

    /**
     * Gets the current state of the indexing process.
     */
    getIndexState(): Promise<IndexState>;
}
```

## IFileMonitorService

Defines the contract for the file monitoring service.

```typescript
export interface IFileMonitorService {
    /**
     * Starts monitoring the workspace for file changes.
     */
    startMonitoring(): void;

    /**
     * Stops monitoring the workspace for file changes.
     */
    stopMonitoring(): void;
}
```
