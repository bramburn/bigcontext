# Quickstart: Enhanced Indexing and File Monitoring

This guide explains how to use the new dynamic indexing features.

## Indexing Status

You can see the current status of the index in the status bar. The status will be one of the following:
-   **Idle**: The index is up-to-date and the indexer is not running.
-   **Indexing**: The indexer is currently processing files.
-   **Paused**: The indexing process has been paused.
-   **Error**: An error occurred during indexing.

## Controlling Indexing

You can control the indexing process using the following commands (accessible from the command palette):

-   `> BigContext: Start Indexing`: Initiates a full scan of your workspace.
-   `> BigContext: Pause Indexing`: Pauses the current indexing process.
-   `> BigContext: Resume Indexing`: Resumes a paused indexing process.

## Automatic Updates

The extension will automatically keep your index up-to-date:

-   **File Changes**: When you create, modify, or delete files, the index will be updated automatically.
-   **Configuration Changes**: If you change the embedding model or database configuration, the extension will prompt you to re-index your project.
