# Task List: Sprint 3 - Search History & Pagination

**Goal:** To improve the usability of search by providing access to previous queries and gracefully handling large result sets with pagination.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Create `historyManager.ts`:** Create a manager to handle saving, retrieving, and clearing search history using `ExtensionContext.globalState`. | `src/historyManager.ts` (New) |
| **3.2** | ☐ To Do | **Create `HistoryView.svelte`:** Create a component to display the list of history items. | `webview/src/lib/components/HistoryView.svelte` (New) |
| **3.3** | ☐ To Do | **Conditionally render `HistoryView`:** In `webview/src/routes/+page.svelte`, conditionally render the `HistoryView` when the search input is empty and there are no active results. | `webview/src/routes/+page.svelte` |
| **3.4** | ☐ To Do | **Modify `queryContext` for pagination:** In `src/context/contextService.ts`, modify the `queryContext` method to accept pagination parameters (e.g., `page`, `pageSize`). | `src/context/contextService.ts` |
| **3.5** | ☐ To Do | **Add state for pagination:** In `webview/src/routes/+page.svelte`, add state to manage the current page and total results. | `webview/src/routes/+page.svelte` |
| **3.6** | ☐ To Do | **Implement "Load More" button:** In `webview/src/routes/+page.svelte`, implement a "Load More" button and the function to fetch the next page. | `webview/src/routes/+page.svelte` |
| **3.7** | ☐ To Do | **Update message handler for pagination:** In `webview/src/routes/+page.svelte`, update the message handler to append new results to the existing list instead of replacing them when paginating. | `webview/src/routes/+page.svelte` |
