### User Story 1: LSP Data Integration into Index

**As a** developer, **I want to** capture data from the Language Server Protocol (LSP) during indexing, **so that** the code context index includes rich relationship information (e.g., definitions, references).

**Actions to Undertake:**
1.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Modify the `IndexingService` to interact with the active LSP for supported languages.
    -   **Implementation**: (Add logic to query LSP for definitions and references for each code chunk)
        ```typescript
        // Inside IndexingService.startIndexing loop, after chunking:
        // For each chunk, query LSP for definitions/references
        const definitions = await vscode.commands.executeCommand(
            'vscode.executeDefinitionProvider',
            vscode.Uri.file(file),
            new vscode.Position(chunk.startLine, 0) // Adjust position as needed
        );
        // Process definitions and add to chunk metadata

        const references = await vscode.commands.executeCommand(
            'vscode.executeReferenceProvider',
            vscode.Uri.file(file),
            new vscode.Position(chunk.startLine, 0) // Adjust position as needed
        );
        // Process references and add to chunk metadata
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
2.  **Filepath**: `src/db/qdrantService.ts`
    -   **Action**: Update the `QdrantService` to store the new LSP-derived relationship metadata alongside the vectors.
    -   **Implementation**: (Modify `upsertChunks` to accept and store additional payload fields for LSP data)
        ```typescript
        // In QdrantService.upsertChunks, modify payload:
        payload: {
            filePath: chunk.filePath,
            content: chunk.content,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            type: chunk.type,
            // New LSP metadata fields
            definitions: chunk.definitions, // Example
            references: chunk.references,   // Example
        },
        ```
    -   **Imports**: None.

### User Story 2: CI/CD Pipeline with GitHub Actions

**As a** developer, **I want to** set up a CI/CD pipeline using GitHub Actions, **so that** the build, test, and packaging process for the extension is automated.

**Actions to Undertake:**
1.  **Filepath**: `.github/workflows/ci.yml` (New File)
    -   **Action**: Create a new GitHub Actions workflow file.
    -   **Implementation**: (Initial workflow structure)
        ```yaml
        name: CI/CD

        on: [push, pull_request]

        jobs:
          build:
            runs-on: ubuntu-latest
            steps:
              - uses: actions/checkout@v3
              - name: Use Node.js
                uses: actions/setup-node@v3
                with:
                  node-version: '18'
              - name: Install dependencies
                run: npm install
              - name: Run lint
                run: npm run lint
              - name: Run tests
                run: npm test
              - name: Build VS Code Extension
                run: npm run vscode:prepublish
              - name: Upload artifact
                uses: actions/upload-artifact@v3
                with:
                  name: vsix-package
                  path: ./*.vsix
        ```
    -   **Imports**: None.
2.  **Filepath**: `.github/workflows/ci.yml`
    -   **Action**: Configure the workflow to be triggered on `push` and `pull_request` events.
    -   **Implementation**: (See `on` section in the YAML above)
    -   **Imports**: None.
3.  **Filepath**: `.github/workflows/ci.yml`
    -   **Action**: Add steps for installing dependencies, running linting, executing unit tests, and building the `.vsix` package.
    -   **Implementation**: (See `steps` section in the YAML above)
    -   **Imports**: None.

**Acceptance Criteria:**
-   The `IndexingService` successfully queries the LSP for definition and reference information for code chunks.
-   The `QdrantService` stores the LSP-derived metadata in Qdrant alongside the code chunk vectors.
-   A GitHub Actions workflow file (`.github/workflows/ci.yml`) is created and correctly configured.
-   Every push and pull request to the repository triggers the CI/CD workflow.
-   The workflow successfully installs dependencies, runs linting checks, executes unit tests, and builds the `.vsix` extension package.
-   The `.vsix` package is uploaded as a build artifact.

**Testing Plan:**
-   **Test Case 1**: Make a small code change that triggers the LSP (e.g., add a new function). Run the indexing process. Verify that the LSP data (definitions, references) is captured and stored in Qdrant (requires inspecting Qdrant data).
-   **Test Case 2**: Push a commit to a branch. Verify that a GitHub Actions workflow run is triggered.
-   **Test Case 3**: Create a pull request. Verify that a GitHub Actions workflow run is triggered for the pull request.
-   **Test Case 4**: Review the GitHub Actions workflow run logs to ensure all steps (install, lint, test, build) pass successfully.
-   **Test Case 5**: Verify that the `.vsix` package is available as a build artifact in the GitHub Actions run summary.
