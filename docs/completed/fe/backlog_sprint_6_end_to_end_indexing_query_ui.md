### User Story 1: Real-time Indexing Progress Feedback
**As Devin, I want to** click the "Index Now" button and see a progress bar while my code is being indexed, **so that** I have clear feedback on the process.

**Actions to Undertake:**
1.  **Filepath**: `CodeContext.Core/Services/IndexingService.cs`
    -   **Action**: Implement a mechanism (e.g., `IProgress<T>`) to report progress updates during indexing.
    -   **Implementation**:
        ```csharp
        using System; // For Action
        using System.Collections.Generic;
        using System.Linq;
        using System.Threading.Tasks;
        using CodeContext.Core;

        namespace CodeContext.Core.Services
        {
            public class IndexingService
            {
                // ... (constructor and existing fields) ...

                public async Task IndexRepositoryAsync(string repositoryPath, string collectionName, IProgress<int>? progress = null)
                {
                    // Simulate file discovery
                    var allFiles = new List<string> {
                        Path.Combine(repositoryPath, "src", "Program.cs"),
                        Path.Combine(repositoryPath, "src", "Utils.ts"),
                        Path.Combine(repositoryPath, "src", "AnotherFile.cs")
                    };
                    int totalFiles = allFiles.Count;
                    int processedFiles = 0;

                    foreach (var filePath in allFiles)
                    {
                        // ... (existing parsing, embedding, upserting logic) ...
                        processedFiles++;
                        int percentage = (int)((double)processedFiles / totalFiles * 100);
                        progress?.Report(percentage); // Report progress
                        await Task.Delay(100); // Simulate work
                    }
                }
            }
        }
        ```
    -   **Imports**: `using System;`
2.  **Filepath**: `CodeContext.Api/Program.cs`
    -   **Action**: Create a Server-Sent Events (SSE) endpoint to stream progress updates from the backend to the UI.
    -   **Implementation**:
        ```csharp
        // ... existing imports ...
        using Microsoft.AspNetCore.Http; // For HttpContext
        using System.Threading.Channels; // For Channel

        // ... existing app.MapPost("/index") ...

        // Define a channel for broadcasting progress updates
        var progressChannel = Channel.CreateUnbounded<int>();

        app.MapPost("/index", async (IndexingService indexingService, HttpContext httpContext) =>
        {
            var repositoryPath = "/Users/bramburn/dev/bigcontext";
            var collectionName = "code_context_collection";

            // Create a progress reporter that pushes to the channel
            var progressReporter = new Progress<int>(percentage =>
            {
                progressChannel.Writer.TryWrite(percentage);
            });

            // Run indexing in a background task so the HTTP request can return quickly
            _ = Task.Run(async () =>
            {
                try
                {
                    await indexingService.IndexRepositoryAsync(repositoryPath, collectionName, progressReporter);
                    progressChannel.Writer.TryWrite(100); // Indicate completion
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Indexing error: {ex.Message}");
                    // Optionally send an error message through the channel or a separate mechanism
                }
            });

            return Results.Accepted(); // Return 202 Accepted
        });

        app.MapGet("/index-progress", async (HttpContext httpContext) =>
        {
            httpContext.Response.Headers.Add("Content-Type", "text/event-stream");
            httpContext.Response.Headers.Add("Cache-Control", "no-cache");
            httpContext.Response.Headers.Add("Connection", "keep-alive");

            await foreach (var percentage in progressChannel.Reader.ReadAllAsync(httpContext.RequestAborted))
            {
                await httpContext.Response.WriteAsync($"data: {percentage}\n\n");
                await httpContext.Response.Body.FlushAsync();
            }
        });

        app.Run();
        ```
    -   **Imports**: `using Microsoft.AspNetCore.Http;`, `using System.Threading.Channels;`
3.  **Filepath**: `webview/src/lib/components/IndexingView.svelte` (New File)
    -   **Action**: Create `IndexingView.svelte` with a progress bar and connect it to the SSE endpoint.
    -   **Implementation**:
        ```svelte
        <script lang="ts">
            import { onMount, onDestroy } from 'svelte';
            import { postMessageToVsCode } from '../utils/vscode';
            import { currentView } from '../stores/viewStore';

            let progressPercentage: number = 0;
            let indexingStatus: string = 'Starting indexing...';
            let eventSource: EventSource | null = null;

            onMount(() => {
                // Start indexing process on mount (or when triggered by a button click)
                // For now, we'll assume it's triggered by the extension after config save.
                // In a real scenario, the "Save & Index" button in SetupView would trigger this.
                // postMessageToVsCode('startIndexing'); // Send message to extension to start backend indexing

                // Connect to SSE endpoint for progress updates
                eventSource = new EventSource('http://localhost:5000/index-progress'); // Adjust port if needed

                eventSource.onmessage = (event) => {
                    const percentage = parseInt(event.data, 10);
                    if (!isNaN(percentage)) {
                        progressPercentage = percentage;
                        indexingStatus = `Indexing progress: ${percentage}%`;
                        if (percentage >= 100) {
                            indexingStatus = 'Indexing complete!';
                            setTimeout(() => {
                                currentView.set('query'); // Transition to query view
                            }, 1000); // Give a moment for user to see 100%
                        }
                    }
                };

                eventSource.onerror = (error) => {
                    console.error('EventSource failed:', error);
                    indexingStatus = 'Indexing failed or disconnected.';
                    eventSource?.close();
                };
            });

            onDestroy(() => {
                eventSource?.close(); // Close the connection when component is destroyed
            });
        </script>

        <div class="indexing-container">
            <h1>Indexing Your Codebase</h1>
            <p>{indexingStatus}</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: {progressPercentage}%;"></div>
            </div>
            <p>{progressPercentage}%</p>
        </div>

        <style>
            .indexing-container {
                padding: 20px;
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
            }
            .progress-bar-container {
                width: 100%;
                background-color: var(--vscode-editorGroup-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 5px;
                height: 20px;
                overflow: hidden;
            }
            .progress-bar {
                height: 100%;
                background-color: var(--vscode-progressBar-background);
                width: 0%;
                transition: width 0.3s ease-in-out;
            }
        </style>
        ```
    -   **Imports**: `import { onMount, onDestroy } from 'svelte';`, `import { postMessageToVsCode } from '../utils/vscode';`, `import { currentView } from '../stores/viewStore';`
4.  **Filepath**: `webview/src/App.svelte`
    -   **Action**: Update `App.svelte` to render `IndexingView` when indexing is in progress.
    -   **Implementation**:
        ```svelte
        <script lang="ts">
            import { onMount } from 'svelte';
            import { currentView } from './lib/stores/viewStore';
            import SetupView from './lib/components/SetupView.svelte';
            import QueryView from './lib/components/QueryView.svelte';
            import IndexingView from './lib/components/IndexingView.svelte'; // New import

            onMount(() => {
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'initialView':
                            currentView.set(message.view);
                            break;
                        case 'startIndexingUI': // Message from extension to show indexing view
                            currentView.set('indexing');
                            break;
                        // ... handle other messages
                    }
                });
            });
        </script>

        <main>
            {#if $currentView === 'setup'}
                <SetupView />
            {:else if $currentView === 'indexing'}
                <IndexingView />
            {:else if $currentView === 'query'}
                <QueryView />
            {/if}
        </main>
        ```
    -   **Imports**: `import IndexingView from './lib/components/IndexingView.svelte';`
5.  **Filepath**: `webview/src/lib/stores/viewStore.ts`
    -   **Action**: Update `currentView` store to include `'indexing'` state.
    -   **Implementation**:
        ```typescript
        import { writable } from 'svelte/store';

        export const currentView = writable<'setup' | 'indexing' | 'query'>('setup');
        ```
    -   **Imports**: None.

### User Story 2: Implement Core Query View
**As Devin, after indexing is complete, I want to** see a chat input box where I can type a question to find relevant code.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/QueryView.svelte`
    -   **Action**: Implement the `QueryView.svelte` component with a text input and a submit button, and a display area for results.
    -   **Implementation**:
        ```svelte
        <script lang="ts">
            import { postMessageToVsCode } from '../utils/vscode';

            let query: string = '';
            let searchResults: { filePath: string; snippet: string }[] = [];
            let isLoading: boolean = false;

            async function handleQuerySubmit() {
                if (!query.trim()) return;

                isLoading = true;
                searchResults = []; // Clear previous results

                // Send query to VS Code extension, which will forward to backend
                const response = await postMessageToVsCode('submitQuery', { query });

                // Assuming the extension sends back the results via a message
                // For now, we'll simulate or expect a direct return if possible (less ideal for async)
                // In a real scenario, the extension would send a message back to the webview
                // with the results, and this component would listen for it.
                // For this backlog, let's assume postMessageToVsCode can return a promise with results.
                // (This is a simplification for the backlog, actual implementation needs a message listener)
                if (response && response.type === 'queryResults') {
                    searchResults = response.results;
                } else {
                    // Simulate results for backlog purposes
                    searchResults = [
                        { filePath: "/path/to/file1.cs", snippet: "public class MyClass { /* ... */ }" },
                        { filePath: "/path/to/file2.ts", snippet: "function calculateSum(a: number, b: number) { /* ... */ }" }
                    ];
                }

                isLoading = false;
            }
        </script>

        <div class="query-container">
            <h1>Code Context Query</h1>
            <div class="query-input-area">
                <input
                    type="text"
                    placeholder="Ask a question about your codebase..."
                    bind:value={query}
                    on:keydown={(e) => { if (e.key === 'Enter') handleQuerySubmit(); }}
                />
                <button on:click={handleQuerySubmit} disabled={isLoading}>
                    {#if isLoading}Searching...{:else}Search{/if}
                </button>
            </div>

            {#if searchResults.length > 0}
                <div class="search-results">
                    <h2>Results:</h2>
                    {#each searchResults as result}
                        <div class="result-item">
                            <h3>{result.filePath}</h3>
                            <pre><code>{result.snippet}</code></pre>
                        </div>
                    {/each}
                </div>
            {:else if !isLoading}
                <p>No results yet. Type a query above.</p>
            {/if}
        </div>

        <style>
            .query-container {
                padding: 20px;
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
            }
            .query-input-area {
                display: flex;
                margin-bottom: 20px;
            }
            .query-input-area input {
                flex-grow: 1;
                padding: 10px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 4px;
                margin-right: 10px;
            }
            .query-input-area button {
                padding: 10px 15px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            button:hover:not(:disabled) {
                background-color: var(--vscode-button-hoverBackground);
            }
            button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            .search-results {
                margin-top: 20px;
            }
            .result-item {
                background-color: var(--vscode-editorGroup-background);
                border: 1px solid var(--vscode-panel-border);
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 5px;
            }
            .result-item h3 {
                margin-top: 0;
                color: var(--vscode-textLink-foreground);
            }
            .result-item pre {
                background-color: var(--vscode-editor-background);
                padding: 10px;
                border-radius: 3px;
                overflow-x: auto;
            }
        </style>
        ```
    -   **Imports**: `import { postMessageToVsCode } from '../utils/vscode';`
2.  **Filepath**: `CodeContext.Api/Program.cs`
    -   **Action**: Implement a `POST /query` endpoint that takes a query string, generates an embedding, performs a vector search, and returns relevant file paths.
    -   **Implementation**:
        ```csharp
        // ... existing imports ...
        using CodeContext.Core.Services; // For IndexingService (and now QueryService)

        // ... existing endpoints ...

        app.MapPost("/query", async (QueryRequest request, IndexingService indexingService, IEmbeddingProvider embeddingProvider, IVectorDatabaseClient vectorDatabaseClient) =>
        {
            if (string.IsNullOrWhiteSpace(request.QueryText))
            {
                return Results.BadRequest("Query text cannot be empty.");
            }

            var collectionName = "code_context_collection"; // Must match indexing collection

            try
            {
                // 1. Generate embedding for the query text
                var queryEmbedding = (await embeddingProvider.GenerateEmbeddingsAsync(new List<string> { request.QueryText })).FirstOrDefault();
                if (queryEmbedding == null)
                {
                    return Results.Problem("Failed to generate embedding for query.", statusCode: 500);
                }

                // 2. Perform vector search
                var searchResults = await vectorDatabaseClient.QueryAsync(collectionName, queryEmbedding, topK: 5); // Get top 5 results

                // 3. Format results for UI
                var formattedResults = searchResults.Select(r => new QueryResponseItem
                {
                    FilePath = r.Payload.ContainsKey("filePath") ? r.Payload["filePath"].ToString() : "Unknown Path",
                    Snippet = r.Payload.ContainsKey("snippet") ? r.Payload["snippet"].ToString() : "No snippet available"
                }).ToList();

                return Results.Ok(formattedResults);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Query failed: {ex.Message}", statusCode: 500);
            }
        });

        app.Run();

        // Define request and response models for the query endpoint
        public record QueryRequest(string QueryText);
        public record QueryResponseItem(string FilePath, string Snippet);
        ```
    -   **Imports**: `using CodeContext.Core.Services;`
3.  **Filepath**: `extension.ts`
    -   **Action**: Handle `submitQuery` message from webview, forward to backend, and send results back to webview.
    -   **Implementation**:
        ```typescript
        // ... (inside activate function, in panel.webview.onDidReceiveMessage) ...
        case 'submitQuery':
            try {
                const queryText = message.query;
                const backendUrl = `http://localhost:${backendPort}/query`;
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ queryText })
                });

                if (response.ok) {
                    const results = await response.json();
                    panel.webview.postMessage({ type: 'queryResults', results });
                } else {
                    const errorText = await response.text();
                    vscode.window.showErrorMessage(`Backend query failed: ${response.status} - ${errorText}`);
                    panel.webview.postMessage({ type: 'queryResults', results: [] }); // Send empty results on error
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error sending query to backend: ${error.message}`);
                panel.webview.postMessage({ type: 'queryResults', results: [] });
            }
            return;
        // ...
        ```
    -   **Imports**: None.

**Acceptance Criteria:**
-   Clicking "Save & Index" (from SetupView) or a dedicated "Index Now" button (if added) triggers the indexing process in the backend.
-   The Svelte UI displays a progress bar that updates in real-time based on progress events streamed from the backend.
-   Upon successful completion of indexing (100% progress), the UI automatically transitions from `IndexingView` to `QueryView`.
-   The `QueryView` component features a text input field and a submit button.
-   Typing a query and submitting it sends a `POST` request to the C# backend's `/query` endpoint.
-   The backend successfully generates an embedding for the query, performs a vector search, and returns a list of relevant file paths and snippets.
-   The `QueryView` displays the returned search results in a clear, readable format.

**Testing Plan:**
-   **Test Case 1**: Start the extension with no `code-context.json`. Go through the setup, click "Save & Index". Verify `IndexingView` appears and the progress bar updates.
-   **Test Case 2**: Observe the console logs of the C# backend to confirm indexing progress is being reported.
-   **Test Case 3**: After indexing completes, verify the UI automatically transitions to `QueryView`.
-   **Test Case 4**: In `QueryView`, type a simple query (e.g., "how to calculate sum") and click "Search".
-   **Test Case 5**: Observe the C# backend logs to confirm the query was received, embedding generated, and search performed.
-   **Test Case 6**: Verify that the `QueryView` displays the returned file paths and snippets.
-   **Test Case 7**: (Edge Case) Test with an empty query or a query that yields no results.