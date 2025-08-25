### Implementation Guide: Sprint 6 - LSP Integration & DevOps

**Objective:** To enrich the index with LSP data and automate the build and test process.

#### **Analysis**

This sprint introduces two significant enhancements: integrating Language Server Protocol (LSP) data into the code context index and establishing a robust CI/CD pipeline using GitHub Actions. LSP integration will make the code context engine more intelligent by understanding semantic relationships within the code, going beyond mere syntactic parsing. The CI/CD pipeline will automate the build, test, and packaging process, ensuring code quality and a streamlined release workflow.

#### **Prerequisites and Setup**

1.  **Completed Indexing Pipeline:** Ensure the indexing, chunking, vectorization, and Qdrant storage (from Sprints 2 and 3) are fully functional.
2.  **GitHub Repository:** Your project must be hosted on GitHub to utilize GitHub Actions.

#### **Implementation Guide**

Here's a step-by-step guide to implementing LSP Integration and DevOps:

**1. LSP Data Integration into `IndexingService`**

To capture LSP data, you'll modify your `IndexingService` to programmatically query the active language server for information like definitions and references for each code chunk.

  *   **File:** `src/indexing/indexingService.ts`
  *   **API Information:**
      *   `vscode.commands.executeCommand()`: This is the key API to interact with VS Code's built-in commands, including those exposed by language servers.
      *   `vscode.executeDefinitionProvider`: Command to get definitions.
      *   `vscode.executeReferenceProvider`: Command to get references.
      *   `vscode.Position`: Represents a position in a text document.
      *   `vscode.Location`, `vscode.DefinitionLink`, `vscode.Reference`: Data structures returned by LSP commands.

  *   **Implementation Example (within `startIndexing` loop, after chunking):**
    ```typescript
    import * as vscode from 'vscode';
    // ... other imports

    export class IndexingService {
        // ... existing code ...

        private async processChunkWithLSP(fileUri: vscode.Uri, chunk: CodeChunk): Promise<void> {
            const position = new vscode.Position(chunk.startLine, 0); // Start of the chunk

            // Get Definitions
            try {
                const definitions = await vscode.commands.executeCommand<
                    vscode.Definition | vscode.DefinitionLink[]
                >('vscode.executeDefinitionProvider', fileUri, position);

                if (definitions) {
                    // Process definitions (e.g., extract URIs, ranges, etc.)
                    // Store relevant info in chunk.payload or a new property
                    // Example: chunk.lspDefinitions = definitions.map(d => ({ uri: d.uri.toString(), range: d.range }));
                }
            } catch (error) {
                console.warn(`LSP Definition Provider failed for ${fileUri.fsPath}:${chunk.startLine}:`, error);
            }

            // Get References
            try {
                const references = await vscode.commands.executeCommand<vscode.Reference[]>( 'vscode.executeReferenceProvider', fileUri, position);

                if (references) {
                    // Process references
                    // Example: chunk.lspReferences = references.map(r => ({ uri: r.uri.toString(), range: r.range }));
                }
            } catch (error) {
                console.warn(`LSP Reference Provider failed for ${fileUri.fsPath}:${chunk.startLine}:`, error);
            }
        }

        public async startIndexing(): Promise<void> {
            // ... existing file walking, parsing, chunking logic ...

            for (const file of files) {
                // ... existing parsing and chunking ...
                const fileUri = vscode.Uri.file(file);
                if (language) {
                    const tree = this.astParser.parse(language, content);
                    const chunks = this.chunker.chunk(file, tree, content);

                    for (const chunk of chunks) {
                        await this.processChunkWithLSP(fileUri, chunk); // Call LSP processing for each chunk
                        allChunks.push(chunk);
                    }
                }
            }
            // ... rest of indexing (embedding, Qdrant upsert) ...
        }
    }
    ```

**2. Extend Qdrant Metadata in `QdrantService`**

Modify your `QdrantService` to accept and store the new LSP-derived metadata as part of the payload when upserting chunks into Qdrant.

  *   **File:** `src/db/qdrantService.ts`
  *   **Key Concept:** Qdrant allows arbitrary JSON payloads to be stored alongside vectors. This is where you'll put your LSP data.

  *   **Implementation Example (modify `upsertChunks` method):**
    ```typescript
    import { QdrantClient } from '@qdrant/js-client-rest';
    import type { CodeChunk } from '../parsing/chunker';

    // Extend CodeChunk interface if not already done to include LSP data
    // declare module '../parsing/chunker' {
    //     interface CodeChunk {
    //         lspDefinitions?: { uri: string; range: any; }[];
    //         lspReferences?: { uri: string; range: any; }[];
    //     }
    // }

    export class QdrantService {
        // ... existing code ...

        public async upsertChunks(collectionName: string, chunks: CodeChunk[], vectors: number[][]): Promise<void> {
            const points = chunks.map((chunk, i) => ({
                id: `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}`,
                vector: vectors[i],
                payload: {
                    filePath: chunk.filePath,
                    content: chunk.content,
                    startLine: chunk.startLine,
                    endLine: chunk.endLine,
                    type: chunk.type,
                    // Add LSP metadata to payload
                    lspDefinitions: chunk.lspDefinitions || [],
                    lspReferences: chunk.lspReferences || [],
                },
            }));

            await this.client.upsert(collectionName, {
                wait: true,
                points,
            });
        }
    }
    ```

**3. Create GitHub Actions Workflow**

Set up a new workflow file in your `.github/workflows/` directory. This file defines the automated steps for your CI/CD pipeline.

  *   **File:** `.github/workflows/ci.yml` (New File)
  *   **Key Concepts:**
      *   `on`: Defines when the workflow runs (e.g., `push`, `pull_request`).
      *   `jobs`: A workflow run is made up of one or more jobs.
      *   `runs-on`: The type of machine to run the job on.
      *   `steps`: A sequence of tasks to be executed.
      *   `actions/checkout`: Action to check out your repository.
      *   `actions/setup-node`: Action to set up Node.js environment.
      *   `npm install`, `npm run lint`, `npm test`, `npm run vscode:prepublish`: Standard commands for VS Code extension development.
      *   `actions/upload-artifact`: To save build artifacts.

  *   **Implementation Example:**
    ```yaml
    name: CI/CD

    on:
      push:
        branches:
          - main
      pull_request:
        branches:
          - main

    jobs:
      build:
        runs-on: ubuntu-latest

        steps:
          - name: Checkout repository
            uses: actions/checkout@v3

          - name: Set up Node.js
            uses: actions/setup-node@v3
            with:
              node-version: '18' # Or your project's Node.js version

          - name: Install dependencies
            run: npm install

          - name: Run lint
            run: npm run lint

          - name: Run tests
            run: npm test

          - name: Build VS Code Extension
            run: npm run vscode:prepublish # This command typically builds the .vsix

          - name: Upload VSIX artifact
            uses: actions/upload-artifact@v3
            with:
              name: vsix-package
              path: '*.vsix' # Adjust if your .vsix is in a different location
    ```

**4. Configure Linting, Testing, and Build Steps**

Ensure your `package.json` has the necessary scripts for linting, testing, and building, which the GitHub Actions workflow will then call.

  *   **File:** `package.json`
  *   **Key Concepts:**
      *   `"lint"`: Script for running your linter (e.g., ESLint).
      *   `"test"`: Script for running your unit tests (e.g., Vitest, Mocha).
      *   `"vscode:prepublish"`: Standard script for preparing your extension for publishing, which typically includes compiling TypeScript and packaging.

  *   **Example `scripts` section in `package.json`:**
    ```json
    "scripts": {
        "vscode:prepublish": "npm run compile",
        "compile": "tsc -p ./",
        "watch": "tsc -watch -p ./",
        "pretest": "npm run compile",
        "test": "node ./out/test/runTest.js",
        "lint": "eslint src --ext ts"
    },
    ```
    *Note: Adjust these scripts based on your actual project setup (e.g., if you use `vitest` directly, your `test` script would be `vitest`).*

This completes the implementation guide for Sprint 6. You now have a more intelligent indexing process leveraging LSP data and an automated CI/CD pipeline to ensure continuous quality and efficient development.