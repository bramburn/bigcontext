# PRD 12: Foundational - Incremental Indexing

**1\. Title & Overview**

- **Project:** Code Context Engine - Incremental Indexing
    
- **Summary:** This is a critical foundational improvement to move away from full, manual re-indexing. This phase will implement a file watcher that automatically detects changes, additions, and deletions in the workspace. The system will then update the Qdrant index in real-time, ensuring search results are always fresh while dramatically reducing resource consumption.
    
- **Dependencies:** This builds upon the core `IndexingService` and requires a stable connection to the Qdrant database.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Significantly improve the user experience by providing an always-up-to-date search index.
        
    - Reduce the system resources (CPU, network) required to maintain the index.
        
- **Developer & System Success Metrics:**
    
    - Saving a file triggers an update to the index for that file within 5 seconds.
        
    - Deleting a file removes its corresponding vectors from the Qdrant index.
        
    - The need for a user to manually trigger a full re-index is reduced by over 95% during normal development workflows.
        

**3\. User Personas**

- **Devin (Developer - End User):** Devin is actively coding and refactoring. He expects that when he saves a change to a function, his search results reflect that change almost immediately without him having to take any action.
    

**4\. Requirements Breakdown**

| 
Phase

 | 

Sprint

 | 

User Story

 | 

Acceptance Criteria

 | 

Duration

 |
| --- | --- | --- | --- | --- |
| 

**Phase 5: Performance**

 | 

**Sprint 12: Incremental Indexing**

 | 

As Devin, I want the extension to automatically index a file as soon as I save it, so my search results are always current.

 | 

1\. A file system watcher is implemented using the VS Code API (`createFileSystemWatcher`).<br>2. On `onDidChange`, the specific file is re-parsed and its vectors are upserted into Qdrant, overwriting previous versions.<br>3. On `onDidCreate`, the new file is parsed and its vectors are added to the index.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As Devin, I want the extension to automatically remove a file's data from the index when I delete it, so I don't see stale results.

 | 

1\. The file watcher's `onDidDelete` event is handled.<br>2. A new method in `QdrantService` allows deleting points by a filter on the `filePath` payload field.<br>3. Deleting a file successfully triggers the removal of all its associated points from the database.

 | 

  


 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 2 Weeks
    
- **Sprint 12:** Incremental Indexing (2 Weeks)
    

**6\. Risks & Assumptions**

- **Assumption:** We can efficiently delete points from Qdrant using a metadata filter without performance degradation.
    
- **Risk:** A large number of file changes in a short period (e.g., switching branches in Git) could trigger a storm of indexing events.
    
    - **Mitigation:** Implement a debouncing mechanism on the file watcher event handlers. Group rapid changes into a single, slightly delayed batch update.


# Task List: Sprint 12 - Incremental Indexing

**Goal:** To implement a file watcher that automatically updates the search index for created, changed, and deleted files.

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

**12.1**

 | 

☐ To Do

 | 

**Create `FileWatcherService.ts`:** Create a new file `src/indexing/fileWatcherService.ts`. This service will be responsible for setting up and managing the VS Code file watcher.

 | 

`src/indexing/fileWatcherService.ts` (New)

 |
| 

**12.2**

 | 

☐ To Do

 | 

**Initialize Watcher:** In the `FileWatcherService` constructor, use `vscode.workspace.createFileSystemWatcher('**/*')` to create the watcher.

 | 

`src/indexing/fileWatcherService.ts`

 |
| 

**12.3**

 | 

☐ To Do

 | 

**Implement `onDidChange` Handler:** Register a handler for the watcher's `onDidChange` event. This handler should call a new method on `IndexingService`, e.g., `indexFile(uri)`.

 | 

`src/indexing/fileWatcherService.ts`, `src/indexing/indexingService.ts`

 |
| 

**12.4**

 | 

☐ To Do

 | 

**Implement `onDidCreate` Handler:** Register a handler for the `onDidCreate` event that also calls `indexingService.indexFile(uri)`.

 | 

`src/indexing/fileWatcherService.ts`

 |
| 

**12.5**

 | 

☐ To Do

 | 

**Implement `deletePointsForFile`:** In `src/db/qdrantService.ts`, create a new method `deletePointsByFilePath(filePath: string)` that uses the Qdrant client's `delete` method with a filter targeting the `filePath` payload.

 | 

`src/db/qdrantService.ts`

 |
| 

**12.6**

 | 

☐ To Do

 | 

**Implement `onDidDelete` Handler:** Register a handler for the `onDidDelete` event. This handler should call a new method on `IndexingService`, e.g., `removeFileFromIndex(uri)`, which in turn calls the new Qdrant service method.

 | 

`src/indexing/fileWatcherService.ts`, `src/indexing/indexingService.ts`

 |
| 

**12.7**

 | 

☐ To Do

 | 

**Integrate Debouncing:** Wrap the logic inside the `onDidChange` and `onDidCreate` handlers with a debounce function to prevent event storms during operations like a git checkout.

 | 

`src/indexing/fileWatcherService.ts`

 |
| 

**12.8**

 | 

☐ To Do

 | 

**Activate the Service:** In `src/extension.ts`, instantiate the `FileWatcherService` within the `activate` function to start listening for file changes.

 | 

`src/extension.ts`

 |

# PRD 13: Enhanced Indexing Dashboard & Controls

**1\. Title & Overview**

- **Project:** Code Context Engine - Enhanced Indexing Dashboard & Controls
    
- **Summary:** This phase expands the basic diagnostic views into a dedicated **Indexing Status Dashboard**. This will provide users with a clear, real-time overview of indexing progress, detailed error logs, and crucial new controls to **pause and resume** the indexing process, giving them more control over system resource usage.
    
- **Dependencies:** Builds upon the core `IndexingService` (PRD 1) and the Incremental Indexing capabilities (PRD 12).
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Increase user trust and transparency by providing detailed insight into the indexing process.
        
    - Improve the user experience for developers on resource-constrained machines.
        
- **Developer & System Success Metrics:**
    
    - The UI accurately reflects the current indexing status (e.g., Idle, Indexing, Paused, Error).
        
    - The "Pause" functionality successfully stops the indexing queue within 5 seconds of being triggered.
        
    - The "Resume" functionality successfully restarts the indexing process from where it left off.
        
    - Indexing errors are displayed in the dashboard with the relevant file path and error message.
        

**3\. User Personas**

- **Devin (Developer - End User):** Devin is about to start a video call and notices his fan is spinning up. He wants to temporarily pause the code indexing to free up CPU cycles without having to disable the extension entirely.
    
- **Alisha (Backend Developer):** Alisha notices that a specific repository is generating indexing errors. She wants a central place to view these errors to quickly identify and fix problematic files.
    

**4\. Requirements Breakdown**

| 
Phase

 | 

Sprint

 | 

User Story

 | 

Acceptance Criteria

 | 

Duration

 |
| --- | --- | --- | --- | --- |
| 

**Phase 5: Performance**

 | 

**Sprint 13: Indexing Controls**

 | 

As Devin, I want to pause indexing temporarily so that I can conserve system resources when needed.

 | 

1\. An `IndexingDashboard.tsx` view is created with a "Pause" button.<br>2. The `IndexingService` is updated with a state machine (e.g., `running`, `paused`).<br>3. Clicking "Pause" transitions the state and stops the processing of new files.<br>4. A "Resume" button appears, which transitions the state back to `running`.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As Alisha, I want to see a detailed list of any indexing errors so that I can fix problematic files.

 | 

1\. The `IndexingService` catches and logs errors during file parsing or embedding, including file path.<br>2. These errors are stored and exposed via a new API endpoint.<br>3. The `IndexingDashboard.tsx` displays these errors in a clear, scrollable list.

 | 

  


 |
| 

  


 | 

  


 | 

As Devin, I want to see the indexing progress so that I know when I can start searching with up-to-date information.

 | 

1\. The `IndexingService` emits progress events (e.g., files indexed / total files).<br>2. The dashboard displays a progress bar and text indicating the current status (e.g., "Indexing file 52 of 1234...").<br>3. The dashboard clearly shows an "Idle" or "Up to date" status when complete.

 | 

  


 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 2 Weeks
    
- **Sprint 13:** Enhanced Indexing Dashboard & Controls (2 Weeks)
    

**6\. Risks & Assumptions**

- **Assumption:** The current `IndexingService` can be refactored to support a state machine without a complete rewrite.
    
- **Risk:** Pausing while a file is in the middle of a network-intensive embedding operation could be complex to handle gracefully.
    
    - **Mitigation:** The pause action should apply to the queue. The service should finish processing the _current_ file it's working on and then pause before picking up the next one.

# Task List: Sprint 13 - Enhanced Indexing Dashboard & Controls

**Goal:** To build a dedicated UI for monitoring indexing progress and providing users with pause/resume controls.

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

**13.1**

 | 

☐ To Do

 | 

**Refactor `IndexingService` State:** In `src/indexing/indexingService.ts`, introduce a state property (e.g., `private status: 'idle' | 'indexing' | 'paused'`).

 | 

`src/indexing/indexingService.ts`

 |
| 

**13.2**

 | 

☐ To Do

 | 

**Implement Pause/Resume Methods:** Add public methods `pause()` and `resume()` to the `IndexingService` that change the `status` property.

 | 

`src/indexing/indexingService.ts`

 |
| 

**13.3**

 | 

☐ To Do

 | 

**Respect Paused State:** In the main processing loop of the `IndexingService`, add a check at the beginning of each iteration. If `status` is `'paused'`, wait until it changes.

 | 

`src/indexing/indexingService.ts`

 |
| 

**13.4**

 | 

☐ To Do

 | 

**Expose Controls via Router:** Add `pauseIndexing` and `resumeIndexing` commands to `src/communication/messageRouter.ts`.

 | 

`src/communication/messageRouter.ts`

 |
| 

**13.5**

 | 

☐ To Do

 | 

**Track Progress and Errors:** Modify the `IndexingService` to store a list of errors and the current progress count. Create a new router command `getIndexingStatus` to expose this data.

 | 

`src/indexing/indexingService.ts`, `src/communication/messageRouter.ts`

 |
| 

**13.6**

 | 

☐ To Do

 | 

**Create `IndexingDashboard.tsx`:** Create a new component `webview-react/src/components/IndexingDashboard.tsx`.

 | 

`webview-react/src/components/IndexingDashboard.tsx` (New)

 |
| 

**13.7**

 | 

☐ To Do

 | 

**Display Status and Progress:** In the new dashboard, periodically call `getIndexingStatus`. Display the status, a progress bar, and the list of errors.

 | 

`webview-react/src/components/IndexingDashboard.tsx`

 |
| 

**13.8**

 | 

☐ To Do

 | 

**Implement UI Controls:** Add "Pause" and "Resume" buttons to the dashboard that are shown/hidden based on the current status. Wire them to the appropriate `postMessage` commands.

 | 

`webview-react/src/components/IndexingDashboard.tsx`

 |
| 

**13.9**

 | 

☐ To Do

 | 

**Add Navigation:** In `webview-react/src/App.tsx`, add a new primary navigation item (e.g., in the sidebar or as a tab) that links to the `IndexingDashboard`.

 | 

`webview-react/src/App.tsx`

 |

# PRD 14: Advanced Search Configuration

**1\. Title & Overview**

- **Project:** Code Context Engine - Advanced Search Configuration
    
- **Summary:** This phase enhances the existing settings page with advanced, power-user features. It introduces controls for **Query Expansion** (broadening search terms to include synonyms), the ability to set **Result Limits**, and the option to **Select Different AI Models** for embeddings or re-ranking, allowing users to balance search speed, cost, and accuracy.
    
- **Dependencies:** Requires the `SettingsView.tsx` component and the core `SearchManager`.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Cater to power users who want fine-grained control over search behavior.
        
    - Provide flexibility to adapt to different project sizes and performance requirements.
        
- **Developer & System Success Metrics:**
    
    - Changing the "Result Limit" setting is immediately reflected in the number of results returned by the next search.
        
    - Enabling "Query Expansion" results in a broader set of search results for ambiguous queries.
        
    - The system can be configured to use a different (mocked or real) embedding model via the new settings UI.
        

**3\. User Personas**

- **Alisha (Power User / Developer):** Alisha is working on a massive monorepo. A standard search for "database connection" returns hundreds of results. She wants to limit the results to the top 10 to avoid information overload.
    
- **Devin (Developer - End User):** Devin is searching for "serialize object". He wants the search to also find results for "marshal object" or "convert object to string", so he enables query expansion.
    

**4\. Requirements Breakdown**

| 
Phase

 | 

Sprint

 | 

User Story

 | 

Acceptance Criteria

 | 

Duration

 |
| --- | --- | --- | --- | --- |
| 

**Phase 6: Intelligence**

 | 

**Sprint 14: Advanced Config**

 | 

As a power user, I want to configure query expansion settings so that I can balance between result breadth and search speed.

 | 

1\. A "Query Expansion" toggle is added to `SettingsView.tsx`.<br>2. When enabled, `SearchManager` sends the user's query to an LLM to generate 2-3 synonymous queries.<br>3. The `SearchManager` then performs a multi-vector search in Qdrant and merges the results.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As Alisha, I want to set the maximum number of search results so that I can control the amount of information displayed.

 | 

1\. A number input field for "Result Limit" is added to `SettingsView.tsx`.<br>2. This value is saved to the configuration.<br>3. The `SearchManager` uses this value for the `limit` parameter in its call to the Qdrant service.

 | 

  


 |
| 

  


 | 

  


 | 

As a developer, I want to select different AI models so that I can optimize for speed or accuracy.

 | 

1\. A dropdown for "AI Model" is added to `SettingsView.tsx`, populated with available model names.<br>2. The `EmbeddingProvider` (or `LLMService`) is updated to use the model specified in the configuration.<br>3. Changing the model successfully directs subsequent API calls to the new model endpoint.

 | 

  


 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 2 Weeks
    
- **Sprint 14:** Advanced Search Configuration (2 Weeks)
    

**6\. Risks & Assumptions**

- **Risk:** Query expansion via an LLM call will add latency to every search.
    
    - **Mitigation:** This must be an opt-in feature. The additional latency should be benchmarked and communicated. The LLM call for synonyms should be very fast and use a smaller, quicker model if possible.


# Task List: Sprint 14 - Advanced Search Configuration

**Goal:** To implement advanced search settings for query expansion, result limits, and AI model selection.

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

**14.1**

 | 

☐ To Do

 | 

**Add Settings to UI:** In `webview-react/src/components/SettingsView.tsx`, add a `Switch` for "Query Expansion", a `TextField` with `type="number"` for "Result Limit", and a `Dropdown` for "AI Model".

 | 

`webview-react/src/components/SettingsView.tsx`

 |
| 

**14.2**

 | 

☐ To Do

 | 

**Connect Settings to Config:** Wire up the new UI components to load from and save to the extension's configuration via the existing `getConfiguration`/`setConfiguration` message handlers.

 | 

`webview-react/src/components/SettingsView.tsx`

 |
| 

**14.3**

 | 

☐ To Do

 | 

**Use Result Limit:** In `src/searchManager.ts`, read the `resultLimit` from the configuration and pass it as the `limit` parameter to the `qdrantService.search` method.

 | 

`src/searchManager.ts`

 |
| 

**14.4**

 | 

☐ To Do

 | 

**Implement Query Expansion Logic:** In `src/searchManager.ts`, check if query expansion is enabled. If so, call a new `llmService.generateSynonyms(query)` method.

 | 

`src/searchManager.ts`, `src/llm/llmService.ts`

 |
| 

**14.5**

 | 

☐ To Do

 | 

**Perform Multi-Vector Search:** Take the original query and the new synonyms, generate vectors for all of them, and perform multiple parallel searches against Qdrant.

 | 

`src/searchManager.ts`

 |
| 

**14.6**

 | 

☐ To Do

 | 

**Merge and De-duplicate Results:** After the multi-vector searches complete, merge the result lists and remove any duplicate points before returning the final list.

 | 

`src/searchManager.ts`

 |
| 

**14.7**

 | 

☐ To Do

 | 

**Abstract Model Selection:** In `src/embeddings/embeddingProvider.ts` and `src/llm/llmService.ts`, modify the constructors or methods to read the "AI Model" name from the configuration.

 | 

`src/embeddings/embeddingProvider.ts`, `src/llm/llmService.ts`

 |
| 

**14.8**

 | 

☐ To Do

 | 

**Use Selected Model:** Ensure all API calls to the AI provider (for both embeddings and generation) use the model name specified in the configuration.

 | 

`src/embeddings/embeddingProvider.ts`, `src/llm/llmService.ts`

 |


 