# Task List: Sprint 1 - Semantic Search Engine

**Goal:** To replace the existing keyword-based search with a more intelligent semantic vector search, providing users with contextually relevant results.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**1.1**

 | 

☐ To Do

 | 

**Refactor `SearchManager` Method Signature:** Open `src/searchManager.ts`. Rename the existing `search` method to `performKeywordSearch` to preserve it. Create a new public async method `performSemanticSearch(query: string, limit: number = 20): Promise<SearchResult[]>`.

 | 

`src/searchManager.ts`

 |
| 

**1.2**

 | 

☐ To Do

 | 

**Implement Query Vectorization:** Inside `performSemanticSearch`, call `this.embeddingProvider.generateEmbeddings([query])` to get the query vector. Add robust error handling in case the embedding generation fails.

 | 

`src/searchManager.ts`

 |
| 

**1.3**

 | 

☐ To Do

 | 

**Define Collection Naming Logic:** Inside `SearchManager`, create a private helper method `getCollectionNameForWorkspace()` that generates a consistent, safe collection name from the workspace root path (e.g., hashing the path).

 | 

`src/searchManager.ts`

 |
| 

**1.4**

 | 

☐ To Do

 | 

**Implement Vector Search Call:** Call `this.qdrantService.search()`, passing the collection name from the new helper method and the query vector. Return the results.

 | 

`src/searchManager.ts`

 |
| 

**1.5**

 | 

☐ To Do

 | 

**Update Message Router:** In `src/communication/messageRouter.ts`, find the `search` case. Update it to call the new `searchManager.performSemanticSearch` method instead of the old one.

 | 

`src/communication/messageRouter.ts`

 |
| 

**1.6**

 | 

☐ To Do

 | 

**Update Frontend State:** In `webview-react/src/stores/appStore.ts`, ensure the `SearchResult` type definition includes `score: number`.

 | 

`webview-react/src/stores/appStore.ts`

 |
| 

**1.7**

 | 

☐ To Do

 | 

**Display Similarity Score:** In `webview-react/src/components/QueryView.tsx`, locate the `ResultCard` sub-component. Add a `<Badge>` from Fluent UI to the card's actions area.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**1.8**

 | 

☐ To Do

 | 

**Format Score Display:** Inside the new `<Badge>`, calculate and display the similarity score as a percentage (e.g., `Math.round(result.score * 100) + '% match'`).

 | 

`webview-react/src/components/QueryView.tsx`

 |



 # Task List: Sprint 2 - System Resilience

**Goal:** To build a proactive Health Check System and integrate a resilient Error Recovery Service, making the extension more stable and reliable.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**2.1**

 | 

☐ To Do

 | 

**Create Health Check Service File:** Create a new file `src/validation/healthCheckService.ts`.

 | 

`src/validation/healthCheckService.ts` (New)

 |
| 

**2.2**

 | 

☐ To Do

 | 

**Define `HealthCheckResult` Interface:** In the new file, define an interface `HealthCheckResult` with fields: `service: string`, `status: 'healthy' | 'unhealthy'`, and `details: string`.

 | 

`src/validation/healthCheckService.ts`

 |
| 

**2.3**

 | 

☐ To Do

 | 

**Implement `HealthCheckService` Class:** Create the `HealthCheckService` class with a constructor that accepts `qdrantService` and `embeddingProvider`.

 | 

`src/validation/healthCheckService.ts`

 |
| 

**2.4**

 | 

☐ To Do

 | 

**Implement `checkQdrant` Method:** Create a private async method `checkQdrant()` that calls a new `healthCheck()` method on the `QdrantService` and returns a `HealthCheckResult`. The `QdrantService.healthCheck()` should perform a lightweight operation, like listing collections.

 | 

`src/validation/healthCheckService.ts`, `src/db/qdrantService.ts`

 |
| 

**2.5**

 | 

☐ To Do

 | 

**Implement `checkEmbeddingProvider` Method:** Create a private async method `checkEmbeddingProvider()` that calls a new `isAvailable()` method on the `EmbeddingProvider` and returns a `HealthCheckResult`.

 | 

`src/validation/healthCheckService.ts`, `src/embeddings/embeddingProvider.ts`

 |
| 

**2.6**

 | 

☐ To Do

 | 

**Implement `runAllChecks` Method:** Create a public async method `runAllChecks()` that uses `Promise.all` to run all individual check methods.

 | 

`src/validation/healthCheckService.ts`

 |
| 

**2.7**

 | 

☐ To Do

 | 

**Expose Health Checks via Router:** In `src/communication/messageRouter.ts`, add a new case `runHealthChecks` that calls the service and posts a `healthCheckResult` message back to the webview.

 | 

`src/communication/messageRouter.ts`

 |
| 

**2.8**

 | 

☐ To Do

 | 

**Update `DiagnosticsView` for Health Checks:** In `webview-react/src/components/DiagnosticsView.tsx`, add state for `results` and `isLoading`. Add a button that calls `postMessage('runHealthChecks')`.

 | 

`webview-react/src/components/DiagnosticsView.tsx`

 |
| 

**2.9**

 | 

☐ To Do

 | 

**Render Health Check Results:** In `DiagnosticsView.tsx`, use `useEffect` to listen for the `healthCheckResult` message. Render the results in a Fluent UI `<Table>`.

 | 

`webview-react/src/components/DiagnosticsView.tsx`

 |
| 

**2.10**

 | 

☐ To Do

 | 

**Add `async-retry` Dependency:** Run `npm install async-retry` and `npm install @types/async-retry --save-dev`.

 | 

`package.json`

 |
| 

**2.11**

 | 

☐ To Do

 | 

**Implement Retry Logic:** In `src/indexing/indexingService.ts`, import `retry`. Wrap the call to `this.embeddingProvider.generateEmbeddings` within a `retry()` block.

 | 

`src/indexing/indexingService.ts`

 |
| 

**2.12**

 | 

☐ To Do

 | 

**Configure Retry Behavior:** Configure the `retry` call with `retries: 3`, an exponential `factor`, and an `onRetry` callback that logs a warning message using the `CentralizedLoggingService`.

 | 

`src/indexing/indexingService.ts`

 |
 # Task List: Sprint 3 - Security & UX

**Goal:** To secure all indexed data at rest and improve the user experience by adding an inline search result preview.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**3.1**

 | 

☐ To Do

 | 

**Generate TLS Certificates:** Use a tool like OpenSSL to generate a self-signed `cert.pem` and `key.pem` for local development.

 | 

(Local machine)

 |
| 

**3.2**

 | 

☐ To Do

 | 

**Configure Docker for TLS:** Create a `certs` directory in the project root and place the generated certificates there.

 | 

(Project root)

 |
| 

**3.3**

 | 

☐ To Do

 | 

**Update `docker-compose.yml`:** Modify the `qdrant` service definition to mount the `./certs:/qdrant/certs` volume.

 | 

`docker-compose.yml`

 |
| 

**3.4**

 | 

☐ To Do

 | 

**Enable TLS in Qdrant:** Add the required environment variables to the `qdrant` service in `docker-compose.yml` to enable TLS and point to the certificate files.

 | 

`docker-compose.yml`

 |
| 

**3.5**

 | 

☐ To Do

 | 

**Update Qdrant Client:** In `src/db/qdrantService.ts`, modify the `QdrantClient` instantiation to use `https` in the URL if TLS is enabled via configuration.

 | 

`src/db/qdrantService.ts`

 |
| 

**3.6**

 | 

☐ To Do

 | 

**Add `react-syntax-highlighter`:** Run `npm install react-syntax-highlighter` and `npm install @types/react-syntax-highlighter --save-dev` in the `webview-react` directory.

 | 

`webview-react/package.json`

 |
| 

**3.7**

 | 

☐ To Do

 | 

**Add Preview State:** In `webview-react/src/components/QueryView.tsx`, inside the `ResultCard` component, add two state variables: `isExpanded` (boolean) and `snippetContent` (string).

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**3.8**

 | 

☐ To Do

 | 

**Implement Toggle Logic:** Create a `togglePreview` function in `ResultCard` that flips the `isExpanded` state. If expanding for the first time, it should `postMessage('getSnippetContent', { ... })`.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**3.9**

 | 

☐ To Do

 | 

**Listen for Snippet Content:** In `ResultCard`, create a `useEffect` hook that listens for the `snippetContentResult` message and updates the `snippetContent` state if the filePath matches.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**3.10**

 | 

☐ To Do

 | 

**Render Preview:** Below the `ResultCard` header, add a "Show Preview" `<Button>` with the `onClick` handler. Conditionally render a `<CardPreview>` section if `isExpanded` is true, containing the `SyntaxHighlighter` component.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**3.11**

 | 

☐ To Do

 | 

**Implement Backend Snippet Handler:** In `src/communication/messageRouter.ts`, add a case for `getSnippetContent`. It should read the file specified in the payload, slice the correct lines, and post the content back with the `snippetContentResult` command.

 | 

`src/communication/messageRouter.ts`

 |
 # Task List: Sprint 4 - Monitoring & Configuration

**Goal:** To provide administrators with performance insights and users with an easy-to-use configuration interface.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**4.1**

 | 

☐ To Do

 | 

**Create `PerformanceService.ts`:** Create the file `src/monitoring/performanceService.ts`. Implement a class `PerformanceService` to track metrics like indexing time and search latency using `performance.now()`.

 | 

`src/monitoring/performanceService.ts` (New)

 |
| 

**4.2**

 | 

☐ To Do

 | 

**Integrate Performance Tracking:** In `src/indexing/indexingService.ts`, call the `PerformanceService` to start a timer before indexing and stop it after. In `src/searchManager.ts`, do the same for `performSemanticSearch`.

 | 

`src/indexing/indexingService.ts`, `src/searchManager.ts`

 |
| 

**4.3**

 | 

☐ To Do

 | 

**Expose Performance Metrics:** Add a `getPerformanceMetrics` command to `src/communication/messageRouter.ts` that returns the collected data.

 | 

`src/communication/messageRouter.ts`

 |
| 

**4.4**

 | 

☐ To Do

 | 

**Add Charting Libraries:** In `webview-react`, run `npm install chart.js react-chartjs-2`.

 | 

`webview-react/package.json`

 |
| 

**4.5**

 | 

☐ To Do

 | 

**Display Performance Charts:** In `webview-react/src/components/DiagnosticsView.tsx`, add a new "Performance" section. Fetch metrics on component mount and display them using components from `react-chartjs-2`.

 | 

`webview-react/src/components/DiagnosticsView.tsx`

 |
| 

**4.6**

 | 

☐ To Do

 | 

**Create `SettingsView.tsx`:** Create a new file `webview-react/src/components/SettingsView.tsx`. This component will render a form for extension settings.

 | 

`webview-react/src/components/SettingsView.tsx` (New)

 |
| 

**4.7**

 | 

☐ To Do

 | 

**Implement Configuration Handlers:** In `src/communication/messageRouter.ts`, create two new commands: `getConfiguration` (reads from `vscode.workspace.getConfiguration`) and `setConfiguration` (updates a configuration value).

 | 

`src/communication/messageRouter.ts`

 |
| 

**4.8**

 | 

☐ To Do

 | 

**Connect UI to Configuration:** In `SettingsView.tsx`, use a `useEffect` to call `getConfiguration` on load. Use `useState` for form fields. On "Save", call `setConfiguration`.

 | 

`webview-react/src/components/SettingsView.tsx`

 |
| 

**4.9**

 | 

☐ To Do

 | 

**Add Navigation to Settings:** In `webview-react/src/App.tsx`, add a tab or button that allows the user to navigate to the new `SettingsView` component.

 | 

`webview-react/src/App.tsx`

 |

 
 # Task List: Sprint 6 - Code Intelligence

**Goal:** To provide deep code insights through dependency visualization and expanded language support.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**6.1**

 | 

☐ To Do

 | 

**Install Tree-sitter:** Run `npm install tree-sitter tree-sitter-typescript`.

 | 

`package.json`

 |
| 

**6.2**

 | 

☐ To Do

 | 

**Create `ASTService.ts`:** Create `src/analysis/astService.ts`. Implement a service to load the TypeScript grammar, parse code into an AST, and traverse the tree to find relationships (e.g., function calls, imports).

 | 

`src/analysis/astService.ts` (New)

 |
| 

**6.3**

 | 

☐ To Do

 | 

**Expose AST Analysis:** Add a `getCodeRelationships` command to `src/communication/messageRouter.ts`.

 | 

`src/communication/messageRouter.ts`

 |
| 

**6.4**

 | 

☐ To Do

 | 

**Add Graph Library:** In `webview-react`, run `npm install react-flow`.

 | 

`webview-react/package.json`

 |
| 

**6.5**

 | 

☐ To Do

 | 

**Create `GraphView.tsx`:** Create a new component `webview-react/src/components/GraphView.tsx`. Use `react-flow` to render nodes and edges passed as props.

 | 

`webview-react/src/components/GraphView.tsx` (New)

 |
| 

**6.6**

 | 

☐ To Do

 | 

**Integrate Graph View:** Add a "Show Dependencies" button to the `ResultCard` preview. On click, it should call `getCodeRelationships` and display the `GraphView` component in a modal or new tab.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**6.7**

 | 

☐ To Do

 | 

**Install Java Grammar:** Run `npm install tree-sitter-java`.

 | 

`package.json`

 |
| 

**6.8**

 | 

☐ To Do

 | 

**Create `JavaFileParser.ts`:** Create `src/parsing/javaFileParser.ts`. It should implement the `IFileParser` interface, using tree-sitter with the Java grammar to chunk Java files into methods/classes.

 | 

`src/parsing/javaFileParser.ts` (New)

 |
| 

**6.9**

 | 

☐ To Do

 | 

**Update `FileParserFactory`:** In `src/parsing/fileParserFactory.ts`, add a case to the factory that returns an instance of `JavaFileParser` when the file extension is `.java`.

 | 

`src/parsing/fileParserFactory.ts`

 |# Task List: Sprint 4 - Monitoring & Configuration

**Goal:** To provide administrators with performance insights and users with an easy-to-use configuration interface.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**4.1**

 | 

☐ To Do

 | 

**Create `PerformanceService.ts`:** Create the file `src/monitoring/performanceService.ts`. Implement a class `PerformanceService` to track metrics like indexing time and search latency using `performance.now()`.

 | 

`src/monitoring/performanceService.ts` (New)

 |
| 

**4.2**

 | 

☐ To Do

 | 

**Integrate Performance Tracking:** In `src/indexing/indexingService.ts`, call the `PerformanceService` to start a timer before indexing and stop it after. In `src/searchManager.ts`, do the same for `performSemanticSearch`.

 | 

`src/indexing/indexingService.ts`, `src/searchManager.ts`

 |
| 

**4.3**

 | 

☐ To Do

 | 

**Expose Performance Metrics:** Add a `getPerformanceMetrics` command to `src/communication/messageRouter.ts` that returns the collected data.

 | 

`src/communication/messageRouter.ts`

 |
| 

**4.4**

 | 

☐ To Do

 | 

**Add Charting Libraries:** In `webview-react`, run `npm install chart.js react-chartjs-2`.

 | 

`webview-react/package.json`

 |
| 

**4.5**

 | 

☐ To Do

 | 

**Display Performance Charts:** In `webview-react/src/components/DiagnosticsView.tsx`, add a new "Performance" section. Fetch metrics on component mount and display them using components from `react-chartjs-2`.

 | 

`webview-react/src/components/DiagnosticsView.tsx`

 |
| 

**4.6**

 | 

☐ To Do

 | 

**Create `SettingsView.tsx`:** Create a new file `webview-react/src/components/SettingsView.tsx`. This component will render a form for extension settings.

 | 

`webview-react/src/components/SettingsView.tsx` (New)

 |
| 

**4.7**

 | 

☐ To Do

 | 

**Implement Configuration Handlers:** In `src/communication/messageRouter.ts`, create two new commands: `getConfiguration` (reads from `vscode.workspace.getConfiguration`) and `setConfiguration` (updates a configuration value).

 | 

`src/communication/messageRouter.ts`

 |
| 

**4.8**

 | 

☐ To Do

 | 

**Connect UI to Configuration:** In `SettingsView.tsx`, use a `useEffect` to call `getConfiguration` on load. Use `useState` for form fields. On "Save", call `setConfiguration`.

 | 

`webview-react/src/components/SettingsView.tsx`

 |
| 

**4.9**

 | 

☐ To Do

 | 

**Add Navigation to Settings:** In `webview-react/src/App.tsx`, add a tab or button that allows the user to navigate to the new `SettingsView` component.

 | 

`webview-react/src/App.tsx`

 |

 # Task List: Sprint 7 - Developer Assistance

**Goal:** To assist developers with code quality by providing refactoring suggestions and test coverage insights.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**7.1**

 | 

☐ To Do

 | 

**Create `RefactoringService.ts`:** Create `src/analysis/refactoringService.ts`. This service will analyze code snippets to find potential improvements. For now, it can use a simple heuristic (e.g., function length > 50 lines).

 | 

`src/analysis/refactoringService.ts` (New)

 |
| 

**7.2**

 | 

☐ To Do

 | 

**Create Diagnostic Provider:** Create `src/diagnostics/refactoringProvider.ts`. This class will use the `vscode.languages.createDiagnosticCollection` API.

 | 

`src/diagnostics/refactoringProvider.ts` (New)

 |
| 

**7.3**

 | 

☐ To Do

 | 

**Implement Diagnostic Logic:** The provider should listen to `onDidOpen` and `onDidChange` text document events. It will call the `RefactoringService` and convert its suggestions into `vscode.Diagnostic` objects, displaying them as squiggles in the editor.

 | 

`src/diagnostics/refactoringProvider.ts`

 |
| 

**7.4**

 | 

☐ To Do

 | 

**Register Provider:** In `src/extension.ts`, instantiate and register the `refactoringProvider` in the `activate` function.

 | 

`src/extension.ts`

 |
| 

**7.5**

 | 

☐ To Do

 | 

**Add LCOV Parser:** Run `npm install lcov-parse`.

 | 

`package.json`

 |
| 

**7.6**

 | 

☐ To Do

 | 

**Create `TestCoverageService.ts`:** Create `src/analysis/testCoverageService.ts`. Implement a method to parse an `lcov.info` file (path from config) and store the coverage data in a map.

 | 

`src/analysis/testCoverageService.ts` (New)

 |
| 

**7.7**

 | 

☐ To Do

 | 

**Load Coverage Data:** In `src/extension.ts`, call the `TestCoverageService` on activation to load the report.

 | 

`src/extension.ts`

 |
| 

**7.8**

 | 

☐ To Do

 | 

**Expose Coverage Info:** Add a `getCoverageForFile` command to `src/communication/messageRouter.ts` that queries the `TestCoverageService`.

 | 

`src/communication/messageRouter.ts`

 |
| 

**7.9**

 | 

☐ To Do

 | 

**Display Coverage Icon:** In `webview-react/src/components/QueryView.tsx`, when results are received, call `getCoverageForFile` for each result.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**7.10**

 | 

☐ To Do

 | 

**Render Conditional Icon:** In the `ResultCard`, display a different colored icon (e.g., from Fluent UI) next to the line number based on whether the coverage service reports the line as hit or missed.

 | 

`webview-react/src/components/QueryView.tsx`

 |