### User Story 1: Advanced Search Controls
**As a** developer (Devin), **I want** UI controls to specify the number of search results and to choose whether to include file content, **so that** I can fine-tune my queries to get the most relevant information.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/QueryView.svelte`
    -   **Action**: Add a number input for "Max Results" and a checkbox for "Include file content" to the search form.
    -   **Implementation**:
        ```html
        <script lang="ts">
          let maxResults = 20;
          let includeContent = false;
          // ... existing script
        </script>

        <form on:submit|preventDefault={runQuery}>
          <!-- existing query input -->
          <div class="controls">
            <label>Max Results: <input type="number" bind:value={maxResults} min="1" max="100" /></label>
            <label><input type="checkbox" bind:checked={includeContent} /> Include file content</label>
          </div>
          <button type="submit">Query</button>
        </form>
        ```
    -   **Imports**: N/A
2.  **Filepath**: `webview/src/lib/components/QueryView.svelte`
    -   **Action**: Update the `runQuery` function to include the new control values in the message sent to the backend.
    -   **Implementation**:
        ```typescript
        function runQuery() {
          vscode.postMessage({
            command: 'queryContext',
            payload: {
              query: searchQuery,
              maxResults: maxResults,
              includeContent: includeContent
            }
          });
        }
        ```
    -   **Imports**: N/A

**Acceptance Criteria:**
-   The search UI has a number input to limit results and a checkbox to include file content.
-   The values from these controls are successfully sent to the backend when a query is executed.
-   The backend respects these values when returning results.

**Testing Plan:**
-   **Test Case 1**: Set "Max Results" to 5, run a query, and verify that no more than 5 file results are returned.
-   **Test Case 2**: Uncheck "Include file content", run a query, and verify the XML output contains `<file>` tags with no content inside.
-   **Test Case 3**: Check "Include file content", run a query, and verify the XML output contains file content wrapped in CDATA sections.

---

### User Story 2: Backend Result Deduplication
**As a** backend developer (Alisha), **I want** the backend to process search results to return only unique file paths, **so that** the user isn't shown duplicate entries for the same file.

**Actions to Undertake:**
1.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Modify the `queryContext` method signature to accept `maxResults` and `includeContent` parameters.
    -   **Implementation**: `public async queryContext(query: string, maxResults: number, includeContent: boolean): Promise<QueryResult[]>`
    -   **Imports**: N/A
2.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Implement the core deduplication logic within `queryContext`.
    -   **Implementation**:
        ```typescript
        const rawResults = await this.qdrantService.search(query, { limit: maxResults * 5 }); // Fetch more to have enough for deduplication
        const uniqueFiles = new Map<string, QueryResult>();

        for (const result of rawResults) {
          const existing = uniqueFiles.get(result.filePath);
          if (!existing || result.score > existing.score) {
            uniqueFiles.set(result.filePath, result);
          }
        }
        ```
    -   **Imports**: `QueryResult` type if not already imported.
3.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Sort the unique results by score, limit them, and conditionally read file content.
    -   **Implementation**:
        ```typescript
        let finalResults = Array.from(uniqueFiles.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, maxResults);

        if (includeContent) {
          for (const result of finalResults) {
            result.content = await fs.promises.readFile(result.filePath, 'utf-8');
          }
        }
        return finalResults;
        ```
    -   **Imports**: `import * as fs from 'fs';`
4.  **Filepath**: `src/test/suite/contextService.test.ts` (New or Existing)
    -   **Action**: Write a unit test to verify the deduplication logic.
    -   **Implementation**: Create a test case that provides a mock response from the Qdrant service containing multiple chunks from the same file. Assert that the final result from `queryContext` contains only one entry for that file, and that it has the highest score.
    -   **Imports**: Mocking library (e.g., `sinon`), `assert`.

**Acceptance Criteria:**
-   The `queryContext` method correctly deduplicates results from the vector database.
-   The final list of results contains only one entry per unique file path.
-   The entry for a given file path corresponds to the chunk with the highest similarity score.
-   The number of returned results does not exceed the `maxResults` parameter.

**Testing Plan:**
-   **Unit Test**: Create a test for `queryContext` with a mock Qdrant response containing 3 results for `fileA.ts` (scores 0.8, 0.9, 0.85) and 2 for `fileB.ts` (scores 0.7, 0.75). Verify the output contains one result for `fileA.ts` with score 0.9 and one for `fileB.ts` with score 0.75.
-   **Integration Test**: Run a real query known to match multiple chunks in a single file. Verify the UI displays only one result for that file.
