# Task List: Sprint 4 - Context Query API

**Goal:** To build and expose the internal API for querying the indexed code context.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `ContextService`:** In the backend, create a new `contextService.ts` file at `src/context/contextService.ts` to house the query logic. | `src/context/contextService.ts` |
| **4.2** | ☐ To Do | **Implement `getFileContent` method:** In `src/context/contextService.ts`, add logic to perform a vector search for the file path (using embedding provider and Qdrant) and then read the content from disk using `vscode.workspace.fs.readFile`. | `src/context/contextService.ts` |
| **4.3** | ☐ To Do | **Implement `findRelatedFiles` method:** In `src/context/contextService.ts`, add logic to perform a similarity search in Qdrant (using embedding provider) and return a list of unique file paths from the results. | `src/context/contextService.ts` |
| **4.4** | ☐ To Do | **Set up Webview Message Handling:** In `src/extension.ts`, add a `panel.webview.onDidReceiveMessage` listener to the webview panel to handle incoming requests from the frontend. | `src/extension.ts` |
| **4.5** | ☐ To Do | **Route API Calls:** In the message handler within `src/extension.ts`, create a `switch` statement to route requests (e.g., `'getFileContent'`, `'findRelatedFiles'`) to the appropriate method in `ContextService`. | `src/extension.ts` |
| **4.6** | ☐ To Do | **Send Results to Frontend:** In `src/extension.ts`, use the `webview.postMessage` method to send the results from the `ContextService` back to the SvelteKit UI. | `src/extension.ts` |
| **4.7** | ☐ To Do | **Create Frontend API Client:** In the SvelteKit app, create a wrapper service (`webview/src/lib/vscodeApi.ts`) that simplifies posting and listening for messages from the extension backend using `acquireVsCodeApi()`. | `webview/src/lib/vscodeApi.ts` |
| **4.8** | ☐ To Do | **Integrate Frontend with API Client:** In your Svelte components (e.g., `webview/src/routes/+page.svelte`), use the `vscodeApi.ts` client to send requests (e.g., for file content or related files) and handle the responses received from the extension backend. | `webview/src/routes/+page.svelte` |
