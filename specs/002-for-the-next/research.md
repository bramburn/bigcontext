# Research: Enhanced Indexing and File Monitoring

## 1. VS Code File Watcher API

- **Decision**: Utilize `vscode.workspace.createFileSystemWatcher` for monitoring file system events.
- **Rationale**: This is the native and most efficient way to handle file changes within the VS Code environment. It provides events for file creation (`onDidCreate`), modification (`onDidChange`), and deletion (`onDidDelete`). It's deeply integrated into the editor and respects workspace settings.
- **Alternatives Considered**: Manual polling or third-party libraries like `chokidar`. Rejected because the native API is more efficient and avoids introducing external dependencies for a core editor feature.

## 2. Pause/Resume Mechanism for Asynchronous Tasks

- **Decision**: Implement a state-based control flow using a state variable (e.g., `indexingState: 'running' | 'paused' | 'idle'`).
- **Rationale**: A state machine is simple to implement and reason about. When the state is 'paused', the indexing loop checks the state and waits for it to change back to 'running'. This can be achieved with a simple `while (state === 'paused') await sleep(1000);` inside the indexing loop.
- **Alternatives Considered**: Using more complex libraries for async control flow. Rejected as overkill for this requirement.

## 3. Configuration Change Detection

- **Decision**: Use `vscode.workspace.onDidChangeConfiguration`.
- **Rationale**: This event fires whenever a user changes any configuration in the settings. The event provides a helper function `e.affectsConfiguration('myExtension.embeddingModel')` to check if a specific setting was changed. This is the standard way to handle configuration updates.
- **Alternatives Considered**: None, this is the designated API for this purpose.

## 4. `.gitignore` Parsing

- **Decision**: Use the `glob` library, which is already a dependency, and its `ignore` option, or a simple `.gitignore` parser if needed.
- **Rationale**: The `glob` library can accept a list of ignore patterns. We can read the `.gitignore` file, parse its lines, and feed them into the glob utility that we use for discovering files. This avoids adding a new dependency if the existing tools are sufficient. If not, a lightweight library like `ignore` can be used.
- **Alternatives Considered**: Writing a custom parser. Rejected as it's a solved problem and prone to errors.

## 5. File Type and Size Filtering

- **Decision**:
    - **Binary Files**: Use a library like `is-binary-path` or check for the presence of null bytes in the initial buffer of a file.
    - **Large Files**: Use `fs.statSync(filePath).size` to get the file size in bytes and reject files that exceed a configurable threshold (e.g., 2MB).
- **Rationale**: This provides a two-layered defense against processing unsuitable files. Checking the path and extension is fast, and for ambiguous cases, checking the file's content or size is reliable.
- **Alternatives Considered**: Relying only on file extensions. Rejected as it's not reliable.

## 6. Existing Code Review

- **`indexing/`**: The current indexing logic is likely a full, one-time scan. It will need to be refactored to be pausable and to handle single-file updates.
- **`search/`**: The search logic should not need significant changes, as it queries the database. However, it must be resilient to an index that is being updated.
- **`fileSystemWatcherManager.ts`**: This file likely already contains a basic file watcher. It will be the starting point for implementing the more advanced file monitoring logic. We will need to extend it to trigger the re-indexing of individual files.
- **`configService.ts` / `configurationManager.ts`**: These files manage configuration. We will hook into them to listen for configuration changes.
