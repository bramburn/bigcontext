# Quickstart Guide for RAG for LLM VS Code Extension

This guide provides steps to quickly set up and validate the core functionalities of the RAG for LLM VS Code Extension, focusing on initial configuration and project indexing.

## Prerequisites

*   VS Code installed.
*   The RAG for LLM VS Code Extension installed (from source or VSIX).
*   Access to an OpenAI API key or a Mimic Embed instance.
*   Access to a running Qdrant database instance.

## Scenarios to Validate

### Scenario 1: Initial Extension Setup

1.  **Action**: Open VS Code.
2.  **Action**: Activate the RAG for LLM extension (e.g., by opening its main view or running a command).
3.  **Expected Result**: A visual configuration page is displayed, prompting for embedding model and Qdrant database settings.
4.  **Action**: Provide valid configuration details for your chosen embedding model (e.g., OpenAI API key) and Qdrant database (host, port, collection name).
5.  **Action**: Save the provided settings.
6.  **Expected Result**: The settings are successfully stored, and the view transitions to display the indexing progress. The progress bar should indicate 0% indexed, and a "Start Indexing" button should be visible.

### Scenario 2: Starting and Monitoring Indexing

1.  **Precondition**: Extension settings are saved (from Scenario 1).
2.  **Action**: On the indexing progress view, click the "Start Indexing" button.
3.  **Expected Result**: The indexing process begins. The progress bar updates in real-time, showing the percentage of the project indexed. The "chunks indexed" count and other basic statistics (if implemented) should update dynamically.
4.  **Action**: Observe the indexing process until it completes or pauses.
5.  **Expected Result**: Upon completion, the progress bar shows 100%, and the status indicates "Completed". The "Start Indexing" button should change to "Start Reindexing".

### Scenario 3: Re-opening the Extension View

1.  **Precondition**: Extension settings are saved and indexing has occurred (from Scenario 1 and 2).
2.  **Action**: Close the RAG for LLM extension view.
3.  **Action**: Re-open the RAG for LLM extension view.
4.  **Expected Result**: The indexing progress view is displayed directly, showing the last known indexing status (e.g., "Completed" with 100% and chunk count, or "In Progress" with current percentage). The appropriate button ("Start Indexing" or "Start Reindexing") is displayed based on the indexing status.

### Scenario 4: Reindexing an Existing Project

1.  **Precondition**: Project has been previously indexed (from Scenario 2).
2.  **Action**: On the indexing progress view, click the "Start Reindexing" button.
3.  **Expected Result**: The reindexing process begins, similar to initial indexing, with the progress bar and statistics updating.

## Troubleshooting

*   If the configuration page does not appear, ensure the extension is correctly installed and activated.
*   If indexing does not start or fails, check the VS Code output logs for the extension for error messages. Verify your embedding model and Qdrant database settings are correct and accessible.
