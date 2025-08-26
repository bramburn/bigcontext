# Task List: Sprint 3 - Advanced Search UI & Logic

**Goal:** To enhance the search UI with advanced controls and implement the backend logic for deduplicating results.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Add UI Controls to `QueryView`:** In `webview/src/lib/components/QueryView.svelte`, add an `<input type="number">` for "Max Results" and an `<input type="checkbox">` for "Include file content". | `webview/src/lib/components/QueryView.svelte` |
| **3.2** | ☐ To Do | **Bind UI Controls to State:** In the `<script>` section of `QueryView.svelte`, create two state variables, `maxResults` and `includeContent`, and bind them to the new input fields using `bind:value` and `bind:checked`. | `webview/src/lib/components/QueryView.svelte` |
| **3.3** | ☐ To Do | **Update Message Payload:** In the `runQuery` function within `QueryView.svelte`, modify the `vscode.postMessage` call to include `maxResults` and `includeContent` in the `payload` object sent to the backend. | `webview/src/lib/components/QueryView.svelte` |
| **3.4** | ☐ To Do | **Update `ContextService` Method Signature:** In `src/context/contextService.ts`, modify the `queryContext` method signature to accept the new `maxResults: number` and `includeContent: boolean` parameters, providing default values. | `src/context/contextService.ts` |
| **3.5** | ☐ To Do | **Fetch Extra Results:** In `queryContext`, when calling the Qdrant search method, fetch more results than `maxResults` (e.g., `limit: maxResults * 5`) to ensure a sufficient pool for deduplication. | `src/context/contextService.ts` |
| **3.6** | ☐ To Do | **Implement Deduplication `Map`:** In `queryContext`, after getting the raw results, initialize a `new Map<string, QueryResult>()`. Loop through the raw results and populate the map, ensuring only the result with the highest score for each unique `filePath` is kept. | `src/context/contextService.ts` |
| **3.7** | ☐ To Do | **Aggregate and Limit Results:** Convert the map's values to an array using `Array.from(uniqueFiles.values())`. Sort this array by score in descending order. | `src/context/contextService.ts` |
| **3.8** | ☐ To Do | **Slice Final Results:** On the sorted array, use `.slice(0, maxResults)` to truncate the list to the user-specified length. | `src/context/contextService.ts` |
| **3.9** | ☐ To Do | **Conditionally Read Content:** After slicing, add an `if (includeContent)` block. Inside, loop through the final results and use `fs.promises.readFile` to read the file content for each result, assigning it to the `content` property. | `src/context/contextService.ts` |
| **3.10**| ☐ To Do | **Create Test File:** Create a new test file at `src/test/suite/contextService.test.ts`. | `src/test/suite/contextService.test.ts` |
| **3.11**| ☐ To Do | **Write Deduplication Unit Test:** In the new test file, write a test case for `queryContext`. Mock the Qdrant service to return a list of results with duplicate file paths. Assert that the final result is unique and contains only the highest-scoring entry for each file. | `src/test/suite/contextService.test.ts` |
| **3.12**| ☐ To Do | **Test UI Functionality:** Launch the extension. Go to the Query view, set "Max Results" to 5, and run a query. Verify that no more than 5 results are returned. | `(Manual Test)` |
