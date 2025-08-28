# Implementation Guidance: Sprint 3 - Search History & Pagination

**Objective:** To manage search history persistence and implement result pagination for a smoother user experience.

---

### **Part 1: Contextual Search History**

**High-Level Plan:**
1.  **Backend:** Create a `HistoryManager` class to abstract the logic of interacting with `vscode.ExtensionContext.globalState`. This manager will be responsible for adding new items and retrieving the list.
2.  **Persistence:** The history, an array of objects (`{query, resultsCount, timestamp}`), will be stored as a single entry in the global state. This state is automatically persisted by VS Code.
3.  **Frontend:**
    -   When the webview loads, it requests the history from the backend.
    -   A new `HistoryView.svelte` component will be created to render the list of history items.
    -   This view will be shown conditionally, only when the main search input is empty.
    -   Clicking an item in the `HistoryView` will dispatch an event, causing the main view to re-run the query.
    -   After a search is completed, the main view will send the query, result count, and timestamp to the backend to be saved.

**Backend `HistoryManager` Example:**
```typescript
import * as vscode from 'vscode';

export interface HistoryItem {
    query: string;
    resultsCount: number;
    timestamp: number;
    id: string; // Use a unique ID for Svelte keying
}

export class HistoryManager {
    private readonly HISTORY_KEY = 'bigcontext.searchHistory';
    private readonly MAX_HISTORY_ITEMS = 100;

    constructor(private context: vscode.ExtensionContext) {}

    public getHistory(): HistoryItem[] {
        return this.context.globalState.get<HistoryItem[]>(this.HISTORY_KEY, []);
    }

    public async addHistoryItem(query: string, resultsCount: number): Promise<void> {
        const history = this.getHistory();
        
        const newItem: HistoryItem = {
            query,
            resultsCount,
            timestamp: Date.now(),
            id: crypto.randomUUID(),
        };

        // Remove existing entry for the same query to move it to the top
        const filteredHistory = history.filter(item => item.query !== query);
        
        const newHistory = [newItem, ...filteredHistory].slice(0, this.MAX_HISTORY_ITEMS);

        await this.context.globalState.update(this.HISTORY_KEY, newHistory);
    }
}
```

**Frontend `HistoryView.svelte` Example:**
```svelte
<script>
    import { createEventDispatcher } from 'svelte';
    export let historyItems = [];

    const dispatch = createEventDispatcher();

    function handleRerun(query) {
        dispatch('rerun', query);
    }
</script>

<div class="history-container">
    <h4>Search History</h4>
    {#each historyItems as item (item.id)}
        <div class="history-item" on:click={() => handleRerun(item.query)}>
            <div class="query-text">{item.query}</div>
            <div class="meta-data">
                {item.resultsCount} results - {new Date(item.timestamp).toLocaleDateString()}
            </div>
        </div>
    {/each}
</div>

<style>
/* Add styles for history items */
</style>
```

---

### **Part 2: Results Pagination**

**High-Level Plan:**
1.  **Backend API Change:** The backend service responsible for searching (`ContextService` or `QdrantService`) must be updated. Instead of returning all results, it should accept pagination parameters (e.g., `page` and `pageSize`) and return a slice of the results, along with the `total` number of hits.
2.  **Frontend State:** The main Svelte view needs to manage more state:
    -   `results`: The array of currently displayed results.
    -   `currentQuery`: The query string for the current search.
    -   `currentPage`: The last page number fetched.
    -   `totalResults`: The total number of results available on the backend for `currentQuery`.
3.  **UI:** A "Load More" button is displayed conditionally using a reactive check: `$: hasMore = results.length < totalResults;`.
4.  **Data Flow:**
    -   **Initial Search:** The frontend sends the query with `page: 1`. The backend returns the first page of results and the total count. The frontend *replaces* its `results` array with the new data.
    -   **"Load More" Click:** The frontend increments `currentPage` and sends the *same query* but with the new page number.
    -   **Appending Data:** The backend returns the next page of results. The frontend *appends* this new data to its existing `results` array (`results = [...results, ...newResults]`).

**Backend Search Method Example:**
```typescript
// In your search service (e.g., QdrantService)
async search(query: string, collectionName: string, page: number = 1, pageSize: number = 20) {
    // Assume `allHits` is the full array of results from the vector DB
    const allHits = await this.performFullSearch(query, collectionName);

    const total = allHits.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedHits = allHits.slice(start, end);

    return {
        results: paginatedHits, // The data for the current page
        total: total,           // The total number of results available
        page: page,             // Echo back the current page
    };
}
```

**Frontend Logic (`+page.svelte`):**
```svelte
<script>
    let results = [];
    let currentQuery = '';
    let currentPage = 1;
    let totalResults = 0;

    $: hasMore = results.length < totalResults;

    // Called when user submits a new search
    function newSearch(query) {
        currentQuery = query;
        currentPage = 1;
        results = [];
        totalResults = 0;
        vscode.postMessage({ command: 'query', query: currentQuery, page: currentPage });
    }

    // Called by the "Load More" button
    function loadMore() {
        if (!hasMore) return;
        currentPage++;
        vscode.postMessage({ command: 'query', query: currentQuery, page: currentPage });
    }

    // In the window message listener from the backend
    function handleBackendMessage(message) {
        const { command, data } = message;
        if (command === 'queryResult') {
            // If it's the first page, replace the results. Otherwise, append.
            if (data.page === 1) {
                results = data.results;
            } else {
                results = [...results, ...data.results];
            }
            totalResults = data.total;
        }
    }
</script>

<!-- ... UI ... -->
{#if hasMore}
    <button on:click={loadMore}>Load More ({results.length} / {totalResults})</button>
{/if}
```
