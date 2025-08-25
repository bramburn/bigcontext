### User Story 1: Retrieve File Content via API

**As a** developer, **I want to** query the extension's backend to retrieve the content of a specific file, **so that** the frontend can display it to the user.

**Actions to Undertake:**
1.  **Filepath**: `src/context/contextService.ts` (New File)
    -   **Action**: Create a new `ContextService` class to encapsulate context retrieval logic.
    -   **Implementation**: 
        ```typescript
        import * as vscode from 'vscode';
        import { QdrantService } from '../db/qdrantService';
        import { IEmbeddingProvider } from '../embeddings/embeddingProvider';
        import { OllamaProvider } from '../embeddings/ollamaProvider'; // Example provider

        export class ContextService {
            private qdrantService: QdrantService;
            private embeddingProvider: IEmbeddingProvider;

            constructor() {
                this.qdrantService = new QdrantService();
                this.embeddingProvider = new OllamaProvider(); // This will be configurable later
            }

            public async getFileContent(filePathQuery: string): Promise<string | null> {
                // Placeholder: In a real scenario, you'd use embedding and Qdrant search
                // to find the most relevant file path based on the query.
                // For now, assume filePathQuery is an exact path for demonstration.
                try {
                    const uri = vscode.Uri.file(filePathQuery);
                    const contentBuffer = await vscode.workspace.fs.readFile(uri);
                    return contentBuffer.toString();
                } catch (error) {
                    console.error(`Error reading file ${filePathQuery}:`, error);
                    return null;
                }
            }

            public async findRelatedFiles(conceptOrFilePath: string, limit: number = 5): Promise<string[]> {
                // Placeholder: Implement actual vector search using embeddingProvider and QdrantService
                console.log(`Finding related files for: ${conceptOrFilePath}`);
                // Example: return dummy data
                return ["/path/to/related/file1.ts", "/path/to/related/file2.ts"];
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`, `import { QdrantService } from '../db/qdrantService';`, `import { IEmbeddingProvider } from '../embeddings/embeddingProvider';`, `import { OllamaProvider } from '../embeddings/ollamaProvider';`
2.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Implement the `getFileContent` method to read the content of a specified file from disk.
    -   **Implementation**: (See `getFileContent` in the `ContextService` implementation above)
    -   **Imports**: None.

### User Story 2: Find Related Files via API

**As a** developer, **I want to** query the extension's backend to find files related to a given concept or file path, **so that** the frontend can display relevant code context to the user.

**Actions to Undertake:**
1.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Implement the `findRelatedFiles` method to perform a vector similarity search in Qdrant and return a list of relevant file paths.
    -   **Implementation**: (See `findRelatedFiles` in the `ContextService` implementation above. This will require actual integration with `embeddingProvider` and `qdrantService`.)
    -   **Imports**: None.

### User Story 3: Expose Backend API via Webview Message Passing

**As a** developer, **I want to** expose the `ContextService` methods to the SvelteKit frontend using VS Code's webview message passing, **so that** the frontend can interact with the backend API.

**Actions to Undertake:**
1.  **Filepath**: `src/extension.ts`
    -   **Action**: Set up a message listener on the webview panel to handle incoming requests from the frontend.
    -   **Implementation**: (Add `panel.webview.onDidReceiveMessage` handler)
        ```typescript
        // Inside activate function, after panel creation:
        panel.webview.onDidReceiveMessage(
            async message => {
                const contextService = new ContextService(); // Or pass an instance if already created
                switch (message.command) {
                    case 'getFileContent':
                        const fileContent = await contextService.getFileContent(message.filePath);
                        panel.webview.postMessage({ command: 'fileContentResult', content: fileContent });
                        return;
                    case 'findRelatedFiles':
                        const relatedFiles = await contextService.findRelatedFiles(message.query);
                        panel.webview.postMessage({ command: 'relatedFilesResult', files: relatedFiles });
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
        ```
    -   **Imports**: `import { ContextService } from './context/contextService';`
2.  **Filepath**: `src/extension.ts`
    -   **Action**: Route incoming messages to the appropriate `ContextService` method and send results back to the frontend.
    -   **Implementation**: (See `switch` statement and `panel.webview.postMessage` in the `onDidReceiveMessage` handler above)
    -   **Imports**: None.
3.  **Filepath**: `webview/src/lib/vscodeApi.ts` (New File)
    -   **Action**: Create a wrapper service in the SvelteKit app to simplify posting and listening for messages from the extension backend.
    -   **Implementation**: 
        ```typescript
        // webview/src/lib/vscodeApi.ts
        declare const acquireVsCodeApi: any;
        const vscode = acquireVsCodeApi();

        export function postMessage(message: any) {
            vscode.postMessage(message);
        }

        export function onMessage(callback: (message: any) => void) {
            window.addEventListener('message', event => {
                callback(event.data);
            });
        }
        ```
    -   **Imports**: None.
4.  **Filepath**: `webview/src/routes/+page.svelte` (or relevant Svelte component)
    -   **Action**: Modify the frontend to send messages to the backend and handle responses.
    -   **Implementation**: 
        ```html
        <script lang="ts">
          import { postMessage, onMessage } from '../lib/vscodeApi';
          import { onMount } from 'svelte';

          let fileContent: string | null = null;
          let relatedFiles: string[] = [];

          onMount(() => {
            onMessage(message => {
              switch (message.command) {
                case 'fileContentResult':
                  fileContent = message.content;
                  break;
                case 'relatedFilesResult':
                  relatedFiles = message.files;
                  break;
              }
            });
          });

          function requestFileContent(filePath: string) {
            postMessage({ command: 'getFileContent', filePath });
          }

          function requestRelatedFiles(query: string) {
            postMessage({ command: 'findRelatedFiles', query });
          }
        </script>

        <button on:click={() => requestFileContent('/path/to/your/file.ts')}>Get File Content</button>
        {#if fileContent}
          <pre>{fileContent}</pre>
        {/if}

        <button on:click={() => requestRelatedFiles('authentication logic')}>Find Related Files</button>
        {#if relatedFiles.length > 0}
          <ul>
            {#each relatedFiles as file}
              <li>{file}</li>
            {/each}
          </ul>
        {/if}
        ```
    -   **Imports**: `import { postMessage, onMessage } from '../lib/vscodeApi';`, `import { onMount } from 'svelte';`

**Acceptance Criteria:**
-   When the frontend sends a `getFileContent` message with a valid file path, the backend responds with the correct file content.
-   When the frontend sends a `findRelatedFiles` message with a query, the backend responds with an array of relevant file paths.
-   The backend API gracefully handles cases where files are not found or no related files are identified, returning `null` or an empty array respectively.

**Testing Plan:**
-   **Test Case 1**: Manually trigger a `getFileContent` request from the frontend (e.g., via a button click). Verify that the correct file content is displayed in the webview.
-   **Test Case 2**: Manually trigger a `findRelatedFiles` request from the frontend. Verify that a list of related files is displayed.
-   **Test Case 3**: Test with a non-existent file path for `getFileContent` and verify the frontend handles the `null` response gracefully (e.g., displays an error message).
-   **Test Case 4**: Test with a query that yields no related files for `findRelatedFiles` and verify the frontend handles the empty array gracefully.
