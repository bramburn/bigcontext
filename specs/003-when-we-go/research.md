# Research for Enhanced File Scanning Progress Messages

## 1. What criteria define "files not considered"?
**Decision**: "Files not considered" will primarily refer to files and directories ignored by `.gitignore` rules. Additionally, it may include files explicitly excluded by the VS Code extension's configuration (e.g., `files.exclude` settings) or internal extension-specific ignore patterns (e.g., `.geminiignore`).
**Rationale**: `.gitignore` is a standard and widely understood mechanism for excluding files from version control, which often aligns with files that should not be processed or indexed. VS Code's `files.exclude` provides user-specific exclusion. Internal `.geminiignore` allows for extension-specific exclusions.
**Alternatives considered**: Only `.gitignore` (too restrictive), manual exclusion lists (too cumbersome for users).

## 2. What is the frequency/granularity of updates for progress messages?
**Decision**: Progress messages will be updated at key milestones during the file scanning process. This includes:
    - Start of scan: "Scanning full file structure..."
    - Completion of initial file enumeration: "Enumerated X files..."
    - Periodic updates during processing (e.g., every 1000 files or every 1-2 seconds, whichever comes first) to show current progress.
    - Final count: "Scanned X files in the repository, Y files not considered."
**Rationale**: Providing updates at key stages and periodically ensures the user is informed without overwhelming them with too frequent messages, which can impact performance. The exact interval for periodic updates can be fine-tuned during implementation.
**Alternatives considered**: Real-time (too chatty, performance overhead), only start/end (not enough feedback).

## 3. How to efficiently scan large file structures in Node.js (backend)?
**Decision**: Utilize Node.js's built-in `fs` module with asynchronous methods (`fs.readdir`, `fs.stat`) for directory traversal. For large repositories, implement a streaming or chunking approach to avoid memory exhaustion and process files in batches. Consider using `fast-glob` or similar libraries for efficient glob pattern matching and `.gitignore` parsing.
**Rationale**: Asynchronous `fs` operations prevent blocking the event loop. Streaming/chunking handles large datasets. Libraries like `fast-glob` are optimized for file system traversal and pattern matching, including `.gitignore` rules.
**Alternatives considered**: Synchronous `fs` (blocks event loop), custom recursive functions without optimization (potential performance issues).

## 4. How to communicate progress from backend (src/) to frontend (webview-react/) in a VS Code extension context?
**Decision**: Use VS Code's `postMessage` mechanism for communication between the extension (backend) and the webview (frontend). The backend will send messages containing progress updates (e.g., current status, file counts) to the webview. The webview will listen for these messages and update its UI accordingly.
**Rationale**: `postMessage` is the standard and secure way for extensions to communicate with their webviews. It allows for asynchronous, event-driven communication.
**Alternatives considered**: Polling (inefficient), shared memory (not directly supported/secure in this context).

## 5. How to ensure `.gitignore` compliance during file scanning?
**Decision**: Integrate a library like `ignore` or `fast-glob` (which often includes ignore pattern support) into the backend file scanning logic. This library will parse `.gitignore` files found in the repository and apply their rules to exclude matching files and directories from the scan and count them as "not considered". The solution should also consider `.geminiignore` if it exists.
**Rationale**: Re-using existing, well-tested libraries for `.gitignore` parsing is more robust and efficient than implementing custom logic. This ensures accurate compliance with exclusion rules.
**Alternatives considered**: Manual parsing of `.gitignore` (error-prone, complex), relying solely on VS Code's internal file exclusion (may not cover all `.gitignore` scenarios).

## Phase 0: Outline & Research - Complete

