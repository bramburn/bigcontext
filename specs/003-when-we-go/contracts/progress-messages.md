# API Contracts: File Scanning Progress Messages

This document defines the messages exchanged between the VS Code extension backend (`src/`) and the webview frontend (`webview-react/`) for communicating file scanning progress. These messages will be sent via VS Code's `postMessage` mechanism.

## Message Types

### 1. `scanStart`

Sent when the file scanning process begins.

**Purpose**: To inform the frontend that a new file scan has been initiated.

**Payload Structure (JSON)**:
```json
{
  "type": "scanStart",
  "payload": {
    "message": "Scanning full file structure..."
  }
}
```

**Fields**:
- `type` (string): Always "scanStart".
- `payload` (object):
  - `message` (string): A human-readable message indicating the start of the scan.

### 2. `scanProgress`

Sent periodically during the file scanning process to provide updates on the current progress.

**Purpose**: To inform the frontend about the number of files scanned and ignored so far.

**Payload Structure (JSON)**:
```json
{
  "type": "scanProgress",
  "payload": {
    "scannedFiles": 1234,  // Number of files processed so far
    "ignoredFiles": 56,    // Number of files identified as ignored so far
    "message": "Scanned 1234 files, 56 ignored..." // Human-readable progress message
  }
}
```

**Fields**:
- `type` (string): Always "scanProgress".
- `payload` (object):
  - `scannedFiles` (number): The count of files processed by the scanner up to this point.
  - `ignoredFiles` (number): The count of files identified as ignored (e.g., by `.gitignore`) up to this point.
  - `message` (string): A human-readable message summarizing the current progress.

### 3. `scanComplete`

Sent when the file scanning process has finished.

**Purpose**: To inform the frontend that the file scan is complete and provide the final counts.

**Payload Structure (JSON)**:
```json
{
  "type": "scanComplete",
  "payload": {
    "totalFiles": 5000,    // Total number of files found in the repository
    "ignoredFiles": 200,   // Total number of files identified as ignored
    "message": "Scan complete: 5000 files in repo, 200 files not considered." // Final human-readable message
  }
}
```

**Fields**:
- `type` (string): Always "scanComplete".
- `payload` (object):
  - `totalFiles` (number): The final count of all files found in the repository.
  - `ignoredFiles` (number): The final count of all files identified as ignored.
  - `message` (string): A human-readable message indicating the completion of the scan and summarizing the results.
