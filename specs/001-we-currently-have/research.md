# Research for RAG for LLM VS Code Extension with Initial Setup and Indexing UI

## Unresolved NEEDS CLARIFICATION from Technical Context and Feature Specification



### 2. Performance Goals

*   **Research Task**: Define realistic performance goals for the VS Code extension, specifically concerning indexing speed and UI responsiveness.
    *   **Context**: Indexing large projects and maintaining a responsive UI are critical for user experience.
    *   **Expected Outcome**: Specific metrics (e.g., indexing rate per LOC, UI refresh rates, memory footprint) and acceptable thresholds.

### 3. Constraints

*   **Research Task**: Identify any implicit or explicit constraints that might impact the implementation, such as VS Code API limitations, resource usage, or compatibility requirements.
    *   **Context**: Operating within the VS Code extension environment imposes certain limitations.
    *   **Expected Outcome**: A list of identified constraints and their potential impact on design decisions.

### 4. Scale/Scope

*   **Research Task**: Determine the expected scale of projects (e.g., lines of code, number of files) the extension should handle efficiently.
    *   **Context**: The extension needs to chunk and index "the whole project".
    *   **Expected Outcome**: Definition of "small", "medium", and "large" projects in terms of file count/LOC, and the target performance for each.

### 5. Embedding Model Configuration Details (FR-003)

*   **Research Task**: Determine the specific configuration parameters required for Mimic Embed and OpenAI embedding models.
    *   **Context**: The extension needs to capture and store these details.
    *   **Expected Outcome**: For each provider, a list of necessary fields (e.g., API key, endpoint URL, model name, authentication method).

### 6. Qdrant Database Configuration Details (FR-004)

*   **Research Task**: Determine the specific configuration parameters required for connecting to a Qdrant database.
    *   **Context**: The extension needs to capture and store these details.
    *   **Expected Outcome**: A list of necessary fields (e.g., host, port, API key, collection name, TLS/SSL options).

### 7. Basic Indexing Statistics (FR-009)

*   **Research Task**: Identify additional "basic statistics" that would be valuable to display to the user beyond just the chunk count.
    *   **Context**: The UI should provide informative feedback on the indexing process.
    *   **Expected Outcome**: A list of suggested statistics (e.g., total files processed, time elapsed, estimated time remaining, number of errors/skipped files).

### 8. Project File Reshuffling (FR-018)

*   **Research Task**: Clarify the desired specific reshuffling of project files to support the new workflows and improved UX.
    *   **Context**: The user requested "reshuffle the project and files for this VS code extension".
    *   **Expected Outcome**: Concrete suggestions for directory structure changes, module organization, or separation of concerns within the codebase.

### 9. Third Workflow (FR-019)

*   **Research Task**: Clarify if there is a third workflow the user wants to focus on, beyond initial setup and indexing.
    *   **Context**: The prompt mentioned "two or 3 workflow".
    *   **Expected Outcome**: Identification of the third workflow or confirmation that only two are currently in scope.
