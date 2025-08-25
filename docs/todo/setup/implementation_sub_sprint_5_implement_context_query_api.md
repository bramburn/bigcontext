### Implementation Guide: Sub-Sprint 5 - Implement Context Query API

**Objective:** To build the internal backend API that will allow the frontend to query the indexed codebase.

#### **Analysis**

This sub-sprint is critical for enabling the core functionality of the extension: allowing users to query their codebase for contextual information. It involves creating a backend service (`ContextService`) that orchestrates interactions with the Qdrant vector database and an embedding provider. Communication between the SvelteKit frontend and this backend service will occur via VS Code's webview message passing API. The design emphasizes modularity, with clear separation of concerns between file system operations, embedding generation, and vector database interactions.

#### **Prerequisites and Setup**

1.  **Sub-Sprint 3 Completion:** Ensure that the Qdrant service and embedding providers (Ollama/OpenAI) are set up and functional, as this sprint relies heavily on them.
2.  **VS Code Extension Project:** A working VS Code extension project with a SvelteKit webview integrated (from previous sprints).

#### **Implementation Guide**

Here's a step-by-step guide to implementing the Context Query API:

**1. Create `ContextService`**

This service will act as the orchestrator for all context-related queries. It will depend on the `QdrantService` (for database interactions) and an `IEmbeddingProvider` (for generating embeddings).

  *   **File:** `src/context/contextService.ts` (New File)
  *   **Key Concepts:**
      *   **Dependency Injection (Basic):** The `ContextService` will instantiate `QdrantService` and an `IEmbeddingProvider`. In a more complex application, these might be passed in via a dependency injection framework.
      *   **Orchestration:** This service will coordinate calls to the embedding provider and Qdrant to fulfill queries.

  *   **Implementation Example:**
    ```typescript
    import * as vscode from 'vscode';
    import { QdrantService } from '../db/qdrantService';
    import { IEmbeddingProvider } from '../embeddings/embeddingProvider';
    import { OllamaProvider } from '../embeddings/ollamaProvider'; // Default or configurable provider
    import { CodeChunk } from '../parsing/chunker'; // Assuming CodeChunk interface is available

    export class ContextService {
        private qdrantService: QdrantService;
        private embeddingProvider: IEmbeddingProvider;
        private collectionName: string; // Qdrant collection name, typically workspace-specific

        constructor(workspaceRoot: string) {
            this.qdrantService = new QdrantService();
            this.embeddingProvider = new OllamaProvider(); // TODO: Make this configurable via settings
            this.collectionName = vscode.workspace.name || 'default_collection'; // Use workspace name as collection
        }

        /**
         * Retrieves the content of a specific file based on a query.
         * In a real scenario, this would involve vector search to find the most relevant file.
         * For now, it directly reads the file if the path is exact.
         */
        public async getFileContent(filePath: string): Promise<string | null> {
            try {
                const uri = vscode.Uri.file(filePath);
                const contentBuffer = await vscode.workspace.fs.readFile(uri);
                return contentBuffer.toString();
            } catch (error) {
                vscode.window.showErrorMessage(`Error reading file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
                console.error(`Error reading file ${filePath}:`, error);
                return null;
            }
        }

        /**
         * Finds files related to a given concept or file path using vector similarity search.
         */
        public async findRelatedFiles(query: string, limit: number = 5): Promise<string[]> {
            try {
                // 1. Generate embedding for the query
                const queryEmbedding = (await this.embeddingProvider.generateEmbeddings([query]))[0];
                if (!queryEmbedding) {
                    vscode.window.showWarningMessage("Could not generate embedding for the query.");
                    return [];
                }

                // 2. Perform similarity search in Qdrant
                const searchResult = await this.qdrantService.search(this.collectionName, queryEmbedding, limit);

                // 3. Extract unique file paths from the search results
                const relatedFilePaths = new Set<string>();
                for (const hit of searchResult) {
                    if (hit.payload && hit.payload.filePath) {
                        relatedFilePaths.add(hit.payload.filePath as string);
                    }
                }
                return Array.from(relatedFilePaths);

            } catch (error) {
                vscode.window.showErrorMessage(`Error finding related files: ${error instanceof Error ? error.message : String(error)}`);
                console.error("Error in findRelatedFiles:", error);
                return [];
            }
        }
    }
    ```

**2. Implement `getFileContent` and `findRelatedFiles`**

These methods are the core of your context API. `getFileContent` will directly read from the file system (or eventually use vector search to resolve a path), while `findRelatedFiles` will leverage your embedding provider and Qdrant.

  *   **File:** `src/context/contextService.ts`
  *   **API Information:**
      *   `vscode.workspace.fs.readFile()`: VS Code API for reading file content.
      *   `this.embeddingProvider.generateEmbeddings()`: Your custom method from Sub-Sprint 3 to get vector representations of text.
      *   `this.qdrantService.search()`: Your custom method from Sub-Sprint 3 to query the Qdrant database.

  *   **Implementation:** (See `ContextService` example above. Ensure `QdrantService` has a `search` method and `IEmbeddingProvider` has `generateEmbeddings`.)

**3. Expose via Message Passing in `extension.ts`**

Your `extension.ts` will act as the bridge between the webview (frontend) and your backend `ContextService`. It will listen for messages from the webview, call the appropriate `ContextService` method, and send the results back.

  *   **File:** `src/extension.ts`
  *   **Key Concepts:**
      *   `panel.webview.onDidReceiveMessage()`: Event listener for messages from the webview.
      *   `panel.webview.postMessage()`: Sends messages back to the webview.
      *   **Message Structure:** Define a clear message structure (e.g., `{ command: string, payload: any }`) for both incoming and outgoing messages.

  *   **Implementation Example (within `activate` function, after `panel` creation):**
    ```typescript
    // Assuming `currentPanel` is your WebviewPanel instance
    const contextService = new ContextService(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');

    currentPanel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'getFileContent':
                    const fileContent = await contextService.getFileContent(message.filePath);
                    currentPanel?.webview.postMessage({ command: 'fileContentResult', content: fileContent });
                    return;
                case 'findRelatedFiles':
                    const relatedFiles = await contextService.findRelatedFiles(message.query);
                    currentPanel?.webview.postMessage({ command: 'relatedFilesResult', files: relatedFiles });
                    return;
                // Add other commands as needed
            }
        },
        undefined,
        context.subscriptions
    );
    ```

**4. Create Frontend API Client (`webview/src/lib/vscodeApi.ts`)**

To simplify communication from the SvelteKit frontend, create a small wrapper that abstracts the `acquireVsCodeApi()` and message posting/listening.

  *   **File:** `webview/src/lib/vscodeApi.ts` (New File)
  *   **Key Concepts:**
      *   `acquireVsCodeApi()`: Global function provided by VS Code to webviews to get a reference to the VS Code API.
      *   `vscode.postMessage()`: Sends a message from the webview to the extension.
      *   `window.addEventListener('message', ...)`: Listens for messages sent from the extension to the webview.

  *   **Implementation Example:**
    ```typescript
    // webview/src/lib/vscodeApi.ts
    declare const acquireVsCodeApi: any; // Declare to avoid TypeScript errors
    const vscode = acquireVsCodeApi();

    /**
     * Sends a message from the webview to the VS Code extension backend.
     * @param message The message payload.
     */
    export function postMessage(message: any) {
        vscode.postMessage(message);
    }

    /**
     * Registers a callback to listen for messages from the VS Code extension backend.
     * @param callback The function to call when a message is received.
     */
    export function onMessage(callback: (message: any) => void) {
        window.addEventListener('message', event => {
            callback(event.data);
        });
    }
    ```

**5. Integrate Frontend with API Client**

Modify your Svelte components to use the `vscodeApi.ts` client to send requests and handle responses.

  *   **File:** `webview/src/routes/+page.svelte` (or other relevant Svelte components)
  *   **Key Concepts:**
      *   `onMount`: Svelte lifecycle hook to run code when the component is first mounted.
      *   Reactive variables: Svelte's way of updating the UI when data changes.

  *   **Implementation Example (simplified):**
    ```html
    <script lang="ts">
      import { onMount } from 'svelte';
      import { postMessage, onMessage } from '../lib/vscodeApi';

      let fileContent: string | null = null;
      let relatedFiles: string[] = [];
      let queryInput: string = '';
      let filePathInput: string = '';

      onMount(() => {
        onMessage(message => {
          switch (message.command) {
            case 'fileContentResult':
              fileContent = message.content;
              if (fileContent === null) {
                alert("File not found or could not be read.");
              }
              break;
            case 'relatedFilesResult':
              relatedFiles = message.files;
              if (relatedFiles.length === 0) {
                alert("No related files found.");
              }
              break;
            // Handle other message types
          }
        });
      });

      function handleGetFileContent() {
        if (filePathInput) {
          postMessage({ command: 'getFileContent', filePath: filePathInput });
        }
      }

      function handleFindRelatedFiles() {
        if (queryInput) {
          postMessage({ command: 'findRelatedFiles', query: queryInput });
        }
      }
    </script>

    <main>
      <h1>Context Query API Demo</h1>

      <h2>Get File Content</h2>
      <input type="text" bind:value={filePathInput} placeholder="Enter file path (e.g., /src/extension.ts)" style="width: 300px;" />
      <button on:click={handleGetFileContent}>Get Content</button>
      {#if fileContent !== null}
        <h3>File Content:</h3>
        <pre style="white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow-y: auto; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 10px; border: 1px solid var(--vscode-editorWidget-border);">{fileContent}</pre>
      {/if}

      <h2>Find Related Files</h2>
      <input type="text" bind:value={queryInput} placeholder="Enter concept or file path (e.g., authentication logic)" style="width: 300px;" />
      <button on:click={handleFindRelatedFiles}>Find Related</button>
      {#if relatedFiles.length > 0}
        <h3>Related Files:</h3>
        <ul>
          {#each relatedFiles as file}
            <li>{file}</li>
          {/each}
        </ul>
      {/if}
    </main>

    <style>
      /* Add basic styling for inputs and buttons to match VS Code theme */
      input[type="text"] {
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        padding: 5px;
        margin-right: 10px;
      }
      button {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 8px 12px;
        cursor: pointer;
      }
      button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
    </style>
    ```

This completes the implementation guide for Sub-Sprint 5. You now have a functional backend API for querying code context and a frontend capable of interacting with it.