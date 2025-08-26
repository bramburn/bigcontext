# Backlog: Sprint 3 - Search History & Pagination

**Objective:** To improve the usability of search by providing access to previous queries and gracefully handling large result sets with pagination.

---

### User Story 1: Contextual Search History
**As a** user, **I want to** see my search history with more context, **so that** I can easily re-run previous queries.

**Acceptance Criteria:**
- The search history is displayed when the query input is empty.
- Each history item shows the query string, the number of results found, and a timestamp.
- Clicking a history item re-runs that query.
- Search history is persisted across VS Code sessions.

**Actions to Undertake:**
1.  **Filepath**: `src/historyManager.ts` (New File)
    -   **Action**: Create a manager to handle saving, retrieving, and clearing search history using `ExtensionContext.globalState`.
    -   **Implementation**:
        ```typescript
        export interface HistoryItem {
            query: string;
            resultsCount: number;
            timestamp: number;
        }

        export class HistoryManager {
            constructor(private context: vscode.ExtensionContext) {}

            getHistory(): HistoryItem[] {
                return this.context.globalState.get('searchHistory', []);
            }

            addHistoryItem(item: HistoryItem): void {
                const history = this.getHistory();
                // Avoid duplicates, add to top
                const newHistory = [item, ...history.filter(h => h.query !== item.query)];
                this.context.globalState.update('searchHistory', newHistory.slice(0, 50)); // Limit history size
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
2.  **Filepath**: `webview/src/lib/components/HistoryView.svelte` (New File)
    -   **Action**: Create a component to display the list of history items.
    -   **Implementation**:
        ```svelte
        <script>
            export let historyItems = [];
            // Dispatch event on click
        </script>

        <div class="history-list">
            {#each historyItems as item}
                <div class="history-item" on:click={() => dispatch('rerun', item.query)}>
                    <span class="query">{item.query}</span>
                    <span class="meta">{item.resultsCount} results - {new Date(item.timestamp).toLocaleString()}</span>
                </div>
            {/each}
        </div>
        ```
    -   **Imports**: `import { createEventDispatcher } from 'svelte'; const dispatch = createEventDispatcher();`
3.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: Conditionally render the `HistoryView` when the search input is empty and there are no active results.
    -   **Implementation**:
        ```svelte
        {#if query.trim() === '' && results.length === 0}
            <HistoryView {historyItems} on:rerun={handleRerun} />
        {/if}
        ```
    -   **Imports**: `import HistoryView from '$lib/components/HistoryView.svelte';`

---

### User Story 2: Results Pagination
**As a** user, **I want** the results to be paginated if there are too many, **so that** the UI remains fast and I'm not overwhelmed.

**Acceptance Criteria:**
- If a query returns more than a set number of results (e.g., 20), only the first page is displayed.
- A "Load More" button is shown at the end of the results list.
- Clicking "Load More" fetches and appends the next page of results to the list.
- The button is hidden when all results have been loaded.

**Actions to Undertake:**
1.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Modify the `queryContext` method to accept pagination parameters (e.g., `page`, `pageSize`).
    -   **Implementation**: The backend search logic must be updated to slice the results array based on the pagination parameters before returning it.
        ```typescript
        // In QdrantService or wherever search happens
        public async search(query: string, collectionName: string, page: number = 1, pageSize: number = 20) {
            // ... perform search
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const paginatedResults = allResults.slice(start, end);
            return {
                results: paginatedResults,
                total: allResults.length
            };
        }
        ```
    -   **Imports**: None.
2.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: Add state to manage the current page and total results.
    -   **Implementation**:
        ```svelte
        <script>
            let currentPage = 1;
            let totalResults = 0;
            let results = [];
            let hasMore = false;

            $: hasMore = results.length < totalResults;
        </script>
        ```
    -   **Imports**: None.
3.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: Implement a "Load More" button and the function to fetch the next page.
    -   **Implementation**:
        ```svelte
        <script>
            function loadMore() {
                currentPage++;
                // Send message to backend to get next page of results for the current query
                vscode.postMessage({ command: 'query', query: currentQuery, page: currentPage });
            }
        </script>

        {#if hasMore}
            <button on:click={loadMore}>Load More</button>
        {/if}
        ```
    -   **Imports**: None.
4.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: Update the message handler to append new results to the existing list instead of replacing them when paginating.
    -   **Implementation**:
        ```javascript
        // in message handler
        if (message.data.page > 1) {
            results = [...results, ...message.data.results];
        } else {
            results = message.data.results;
        }
        totalResults = message.data.total;
        ```
    -   **Imports**: None.

**Testing Plan:**
-   **Test Case 1**: Run several searches. Clear the input and verify the history appears correctly.
-   **Test Case 2**: Click a history item and verify the search is re-run.
-   **Test Case 3**: Restart VS Code and verify the history is still present.
-   **Test Case 4**: Run a search that returns more than 20 results. Verify only 20 are shown and a "Load More" button appears.
-   **Test Case 5**: Click "Load More" and verify the next set of results is appended to the list.
-   **Test Case 6**: Continue clicking "Load More" until all results are loaded and verify the button disappears.
