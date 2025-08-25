# Task List: Sprint 6 - LSP Integration & DevOps

**Goal:** To enrich the index with LSP data and automate the build and test process.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **6.1** | ☐ To Do | **Research LSP Interaction:** Investigate how to programmatically interact with a language server using the `vscode.commands.executeCommand` API for LSP-related commands (e.g., `vscode.executeDefinitionProvider`, `vscode.executeReferenceProvider`). Understand the expected input parameters (URI, Position) and output formats. | `(Documentation)` |
| **6.2** | ☐ To Do | **Update `IndexingService` for LSP:** In `src/indexing/indexingService.ts`, modify the `startIndexing` method (or create a helper method like `processChunkWithLSP`). For each code chunk, call the relevant `vscode.commands.executeCommand` for LSP data (definitions, references) using the chunk's file URI and start position. | `src/indexing/indexingService.ts` |
| **6.3** | ☐ To Do | **Process LSP Results:** Within `IndexingService`, parse the results from the LSP commands. Extract relevant information (e.g., target URIs, ranges, symbol names) and structure it into a suitable format to be stored as metadata. | `src/indexing/indexingService.ts` |
| **6.4** | ☐ To Do | **Extend `CodeChunk` Interface:** If not already done, update the `CodeChunk` interface (e.g., in `src/parsing/chunker.ts`) to include new properties for LSP-derived metadata (e.g., `lspDefinitions`, `lspReferences`). | `src/parsing/chunker.ts` |
| **6.5** | ☐ To Do | **Extend Qdrant Metadata:** In `src/db/qdrantService.ts`, modify the `upsertChunks` method. Ensure that the `payload` object sent to Qdrant includes the newly added LSP metadata from the `CodeChunk` objects. | `src/db/qdrantService.ts` |
| **6.6** | ☐ To Do | **Create GitHub Actions Workflow File:** In your project's root directory, create a new directory `.github/workflows/` if it doesn't exist. Inside this directory, create a new YAML file named `ci.yml`. | `.github/workflows/ci.yml` |
| **6.7** | ☐ To Do | **Configure Workflow Triggers:** In `.github/workflows/ci.yml`, set the `on` section to trigger the workflow on `push` events to the `main` branch and on `pull_request` events targeting the `main` branch. | `.github/workflows/ci.yml` |
| **6.8** | ☐ To Do | **Define Build Job:** In `.github/workflows/ci.yml`, define a `build` job that runs on `ubuntu-latest`. | `.github/workflows/ci.yml` |
| **6.9** | ☐ To Do | **Add Checkout Step:** In the `build` job, add a step to `uses: actions/checkout@v3` to check out the repository code. | `.github/workflows/ci.yml` |
| **6.10** | ☐ To Do | **Add Node.js Setup Step:** In the `build` job, add a step to `uses: actions/setup-node@v3` to set up the Node.js environment (specify your project's Node.js version, e.g., `node-version: '18'`). | `.github/workflows/ci.yml` |
| **6.11** | ☐ To Do | **Add Install Dependencies Step:** In the `build` job, add a step to run `npm install` to install all project dependencies. | `.github/workflows/ci.yml` |
| **6.12** | ☐ To Do | **Add Linting Step:** In the `build` job, add a step to run your project's linting command (e.g., `npm run lint`). | `.github/workflows/ci.yml` |
| **6.13** | ☐ To Do | **Add Testing Step:** In the `build` job, add a step to run your project's test command (e.g., `npm test`). | `.github/workflows/ci.yml` |
| **6.14** | ☐ To Do | **Add Build Extension Step:** In the `build` job, add a step to run the command that builds your VS Code extension package (e.g., `npm run vscode:prepublish` or `vsce package`). | `.github/workflows/ci.yml` |
| **6.15** | ☐ To Do | **Add Upload Artifact Step:** In the `build` job, add a step to `uses: actions/upload-artifact@v3` to upload the generated `.vsix` file as a build artifact (e.g., `name: vsix-package`, `path: '*.vsix'`). | `.github/workflows/ci.yml` |
