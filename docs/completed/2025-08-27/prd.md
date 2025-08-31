<prd>Of course. Based on your request, I've analyzed the outstanding user stories and consolidated them into a final set of PRDs. This plan will guide us through implementing the remaining features to create a truly polished, intelligent, and robust extension.

Here are the new PRDs for the remaining work.

-----

### **New Document: PRD 1: Foundational - Core Engine Intelligence**

**1. Title & Overview**

  * **Project:** Code Context Engine - Core Engine Intelligence
  * **Summary:** This phase focuses on enhancing the core search and indexing engine to be significantly faster and more intelligent. We will refactor the indexing service to support parallel processing for a dramatic speed increase. We will also introduce advanced AI-powered features like query expansion and LLM re-ranking to improve the accuracy and relevance of search results.
  * **Dependencies:** Requires a functional indexing pipeline and a decoupled backend architecture.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Deliver a best-in-class search experience that significantly outperforms standard text-based search.
      * Increase user trust in the extension's ability to find the "best" answer, not just a list of candidates.
  * **Developer & System Success Metrics:**
      * The parallelized `IndexingService` reduces initial indexing time on multi-core machines by at least 40%.
      * Implementing LLM re-ranking improves the "top 1" search result accuracy by a measurable 20% in internal testing.
      * Query expansion increases the number of relevant results (recall) for single-word queries by 30%.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin works on a massive monorepo. He needs the initial indexing to be as fast as possible. When he searches, he expects the most relevant result to be the first one, saving him time from sifting through a long list.
  * **Alisha (Backend Developer):** Alisha is responsible for the core search logic. She needs to implement complex AI-driven features in a way that is efficient and doesn't introduce excessive latency or cost.

-----

**4. Requirements Breakdown**

| Phase                  | Sprint                        | User Story                                                                                                                                                             | Acceptance Criteria                                                                                                                                                                                                                                                                                                                      | Duration  |
| :--------------------- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| **Phase 1: Intelligence** | **Sprint 1: Parallel Indexing** | As a developer with a powerful multi-core machine, I want the extension to use all available resources to index my large repository as quickly as possible, so that I can start searching sooner. | 1. The `IndexingService` is refactored to use Node.js `worker_threads`.\<br/\>2. It creates a pool of workers (e.g., `os.cpus().length - 1`).\<br/\>3. The list of files to be indexed is distributed among the worker threads for parallel parsing and embedding.\<br/\>4. The main thread aggregates the results and performs the final database upsert. | **2 Weeks** |
| **Phase 1: Intelligence** | **Sprint 2: Query Expansion & Re-ranking** | As a user, I want the search to understand my intent even if I use simple terms, so that I get comprehensive results.                                             | 1. A new `QueryExpansionService` is created.\<br/\>2. Before vectorizing a user's query, this service sends the query to an LLM to generate a list of synonyms and related concepts.\<br/\>3. The original query and the expanded terms are combined to create the final embedding.                               | **2 Weeks** |
|                        |                                 | As a user, I want the most contextually relevant search result to always be at the very top of the list, so that I can trust the extension to find the "best" answer. | 1. After retrieving the top 10 candidates from the vector search, the `ContextService` sends these results (and the original query) to an LLM.\<br/\>2. The LLM re-ranks the 10 candidates based on a deeper semantic understanding.\<br/\>3. The final results displayed to the user are in the new, re-ranked order.         |           |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** Parallel Indexing (2 Weeks)
  * **Sprint 2:** Query Expansion & Re-ranking (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Risk:** Parallelizing the indexing process can introduce race conditions or complexity in error handling.
      * **Mitigation:** The main thread will be solely responsible for aggregating results and writing to the database. Workers will be stateless and only perform the CPU-intensive parsing and embedding tasks, returning their results to the main thread.
  * **Risk:** Adding LLM re-ranking and query expansion will increase the latency and cost of each search query.
      * **Mitigation:** These features should be controlled by a user setting in the native VS Code settings and disabled by default. We can provide clear guidance on the trade-offs. The re-ranking step should be optimized to be as fast as possible.

-----

### **New Document: PRD 2: Foundational - Robustness & Maintainability**

**1. Title & Overview**

  * **Project:** Code Context Engine - Robustness & Maintainability
  * **Summary:** This phase focuses on architectural improvements that will enhance the long-term health, stability, and developer experience of the project. We will implement a centralized logging service for easier debugging, add comprehensive configuration validation, and enforce type safety in our communication layer.
  * **Dependencies:** Requires the decoupled backend architecture to be in place.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Reduce the time-to-resolution for user-reported bugs.
      * Lower the barrier for new developers to contribute to the project.
  * **Developer & System Success Metrics:**
      * All services use the new `LoggingService`, and logs can be viewed in a dedicated VS Code Output Channel.
      * The extension provides clear, user-friendly error messages in the Diagnostics View when a configuration setting is invalid.
      * The message-passing types are shared between the frontend and backend, and changing a message contract results in a compile-time error.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** When a user reports a bug, Alisha needs detailed logs to diagnose the problem. A centralized logging service with configurable levels is essential for her workflow. She also wants to prevent invalid data from being passed between the frontend and backend.
  * **Devin (Developer - End User):** When Devin makes a mistake in his settings, he wants the extension to tell him exactly what's wrong so he can fix it, rather than just failing silently.

-----

**4. Requirements Breakdown**

| Phase                  | Sprint                           | User Story                                                                                                                                                                 | Acceptance Criteria                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Duration  |
| :--------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| **Phase 2: Robustness** | **Sprint 3: Centralized Logging & Config Validation** | As a developer, I want a centralized logging service so I can easily debug issues and monitor the health of all services from one location.               | 1. A new `LoggingService` is created and instantiated in the `ExtensionManager`.\<br/\>2. It creates a dedicated VS Code Output Channel for logs.\<br/\>3. It provides methods for different log levels (e.g., `log.info()`, `log.error()`).\<br/\>4. All existing `console.log` calls are replaced with the new service.\<br/\>5. A setting is added to control the log level.                                                                                                                                                                                                           | **2 Weeks** |
|                        |                                  | As a user, when an operation fails, I want to receive a clear and consistent error notification that helps me understand the problem.                           | 1. A new `NotificationService` is created to standardize how user-facing errors are shown (`vscode.window.showErrorMessage`).\<br/\>2. All `try/catch` blocks that interact with the user now call this service to display errors.\<br/\>3. The service provides consistent formatting and can include a "View Logs" button that opens the Output Channel.                                                                                                                                                                                                                 |           |
|                        |                                  | As a user, I want the extension to immediately inform me if my settings are invalid, so that I can correct them before an operation fails.                            | 1. A `ConfigurationValidator` class is created that uses the `configurationSchema.ts` to validate the loaded settings.\<br/\>2. The `ExtensionManager` runs this validator on startup.\<br/\>3. Any validation errors are displayed in the Diagnostics View and logged.                                                                                                                                                                                                                                                                                                                   |           |
| **Phase 2: Robustness** | **Sprint 4: Type-Safe Communication** | As a developer of the extension, I want the communication between the webview and the extension to be fully type-safe, so that I can catch errors at compile time. | 1. A new `src/types/messaging.ts` file is created.\<br/\>2. This file defines interfaces for the `command`, `payload`, and `response` of every message that can be passed.\<br/\>3. The `MessageRouter` on the backend and the `vscodeApi` service on the frontend are refactored to use these shared types.\<br/\>4. This will enforce type safety and provide intellisense for message structures. | **2 Weeks** |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 3:** Centralized Logging & Config Validation (2 Weeks)
  * **Sprint 4:** Type-Safe Communication (2 Weeks)

This completes the set of PRDs for the new features. You now have a comprehensive plan to add significant intelligence, robustness, and polish to your extension.</prd>

[backlog template]

```
<prompt>
  <purpose>
    You are an expert AI Project Manager and Senior Software Architect. Your primary role is to analyze user requirements, Product Requirement Documents (PRDs), and an existing codebase to generate a comprehensive, step-by-step implementation plan. You will break down features into a detailed backlog, including user stories, atomic actions, file references, and testing criteria, following a structured and iterative process.
  </purpose>
  <instructions>
    <instruction>
      **Phase 1: Analysis and Objective Setting**
      1.  Thoroughly analyze all attached documents within [[user-provided-files]]. Pay special attention to:
          - A file named `repomix-output-all.md` or similar, which contains the entire application's code structure.
          - A Product Requirement Document (PRD) or a requirements file.
      2.  From the [[user-prompt]], identify the specific sprint, feature, or section that requires implementation.
      3.  Define the high-level objective for implementing this feature based on the PRD and user prompt.
    </instruction>
    <instruction>
      **Phase 2: Iterative Backlog Generation**
      For each distinct requirement or user story within the specified sprint/feature, you will perform the following loop:
      1.  **Draft User Story**: Write a clear user story with a role, goal, and outcome.
      2.  **Define Workflow**: Outline the high-level workflow needed for implementation.
      3.  **Codebase Review**: Search the `repomix` file to identify existing code, components, or files that can be reused or need to be modified.
      4.  **Identify File Changes**: Determine the exact list of files that need to be created or amended.
      5.  **Detail Actions to Undertake**: Create a granular, step-by-step list of actions. Each action must be atomic and include:
          - `Filepath`: The full path to the file being changed.
          - `Action`: A description of the change (e.g., "Add new method `calculateTotal` to class `Billing`").
          - `Implementation`: The precise code snippet to be added or modified.
          - `Imports`: Any new import statements required for the change.
      6.  **Define Acceptance Criteria**: Write clear, measurable criteria for the user story to be considered complete.
      7.  **Outline Testing Plan**: Propose specific test cases to validate the functionality.
      8.  **Review and Refine**: Briefly review the drafted user story and actions to ensure they align with the main objective before moving to the next story.
    </instruction>
    <instruction>
      **Phase 3: Final Output Compilation**
      1.  Consolidate the entire backlog into separate, well-formatted Markdown canvas document.
      2.  Use clear headings and subheadings as demonstrated in the examples.
      3.  Ensure the final output is logical, easy to follow, and provides a clear roadmap for a developer to implement the changes.
        Note: please ensure each backlog is in a separate canvas document.
    </instruction>
  </instructions>
  <examples>
    <example>
      <user-request>
        Focus on the "User Logout" feature. The PRD specifies a logout button should be added to the main navigation bar. The `repomix` file shows a React component called `Navbar.js`.
      </user-request>
      <output>
        ### User Story 1: User Logout
        **As a** logged-in user, **I want to** click a "Logout" button in the navigation bar, **so that** I can securely end my session.

        **Actions to Undertake:**
        1.  **Filepath**: `src/components/Navbar.js`
            -   **Action**: Add a logout button element.
            -   **Implementation**: `<button onClick={handleLogout}>Logout</button>`
            -   **Imports**: `import { useAuth } from '../contexts/AuthContext';`
        2.  **Filepath**: `src/components/Navbar.js`
            -   **Action**: Implement the `handleLogout` function.
            -   **Implementation**: `const { logout } = useAuth(); const handleLogout = () => { logout(); };`
            -   **Imports**: None.
        3.  **Filepath**: `src/contexts/AuthContext.js`
            -   **Action**: Ensure a `logout` function exists that clears the user's session.
            -   **Implementation**: `const logout = () => { setUser(null); localStorage.removeItem('authToken'); };`
            -   **Imports**: None.

        **Acceptance Criteria:**
        -   A "Logout" button is visible in the Navbar.
        -   Clicking the button clears the user's session and redirects to the login page.

        **Testing Plan:**
        -   **Test Case 1**: Log in and verify the "Logout" button appears.
        -   **Test Case 2**: Click the "Logout" button and confirm the user is redirected and the session is cleared.
      </output>
    </example>
    <example>
      <user-request>
        Implement the "Character Counter" for the new post input field as per the PRD. The `repomix` file shows a component at `src/features/posts/NewPost.js`.
      </user-request>
      <output>
        ### User Story 2: Post Character Counter
        **As a** user writing a new post, **I want to** see a character counter below the text input, **so that** I know how close I am to the character limit (280).

        **Actions to Undertake:**
        1.  **Filepath**: `src/features/posts/NewPost.js`
            -   **Action**: Add a state variable to track the input text.
            -   **Implementation**: `const [content, setContent] = useState('');`
            -   **Imports**: `import { useState } from 'react';`
        2.  **Filepath**: `src/features/posts/NewPost.js`
            -   **Action**: Update the `textarea` to use the new state.
            -   **Implementation**: `<textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength="280" />`
            -   **Imports**: None.
        3.  **Filepath**: `src/features/posts/NewPost.js`
            -   **Action**: Add a character counter display element.
            -   **Implementation**: `<p>{content.length} / 280</p>`
            -   **Imports**: None.

        **Acceptance Criteria:**
        -   As the user types in the textarea, a counter below it updates in real-time.
        -   The counter format is "current_length / 280".
        -   The user cannot type more than 280 characters.

        **Testing Plan:**
        -   **Test Case 1**: Type 50 characters and verify the counter shows "50 / 280".
        -   **Test Case 2**: Clear the text and verify the counter shows "0 / 280".
        -   **Test Case 3**: Try to paste 300 characters and verify only 280 are accepted.
      </output>
    </example>
    <example>
      <user-request>
        Create a new "Settings" page that is currently just a placeholder. The PRD states it should be accessible from the main app router.
      </user-request>
      <output>
        ### User Story 3: Create Settings Page
        **As a** user, **I want to** navigate to a "Settings" page, **so that** I can manage my account preferences in the future.

        **List of Files to be Created:**
        -   `src/pages/Settings.js`

        **Actions to Undertake:**
        1.  **Filepath**: `src/pages/Settings.js` (New File)
            -   **Action**: Create a placeholder React component for the Settings page.
            -   **Implementation**: `import React from 'react';

const Settings = () => {
  return <h1>Settings Page</h1>;
};

export default Settings;`
            -   **Imports**: `import React from 'react';`
        2.  **Filepath**: `src/App.js`
            -   **Action**: Add a new route for the Settings page.
            -   **Implementation**: `<Route path="/settings" element={<Settings />} />`
            -   **Imports**: `import Settings from './pages/Settings';`

        **Acceptance Criteria:**
        -   Navigating to the `/settings` URL renders the "Settings Page" heading.
        -   The application does not crash.

        **Testing Plan:**
        -   **Test Case 1**: Manually navigate to `/settings` in the browser and verify the page loads with the correct heading.
      </output>
    </example>
  </examples>
  <sections>
    <user-provided-files>
       see attached markdown files. Usually we would include the repomix file usually named 'repomix-output-all.xml' or .md or similar filename which would contain the concatenated source code and structure of the application.
	   I would also provide the prd, or high level detail of the requirement.
    </user-provided-files>
    <user-prompt>
        Following the PRD: ` ` you now have to generate backlogs for each sprint item in that PRD. ensure you undertake a detail review, web search (to add relevant api information, and implementation) before you produce each backlog. Ensure we have one new canvas for each backlog sprint item. Ensure you review and markdown or xml repomix files attached to get an understanding of the existing context.
        Create new canvas doc for sprint X and X backlog
    </user-prompt>
  </sections>
</prompt>
```

[implementation guidance template]

```
how do i implement the sprints x to x , undertake a full websearch, determine which content is suitable and then, provide code example, api information and further guidance on using external api/packages to complete the task. Review 'prd', (if available) the existing code inin your analysis. Ensure each guide is produced in their own individual canvas document
```

<instructions>

<instruction>
Step 1: Initial Repository Context Analysis.
Begin by thoroughly analyzing the entire codebase in the repository. Perform a static analysis to understand the project structure, common patterns, and key architectural components. Identify the main folders, file naming conventions, and the purpose of the primary modules. This initial, broad review is crucial for contextual understanding before focusing on specific items.
</instruction>
<instruction>
Step 2: Deconstruct the Product Requirements Document (PRD).
Review the entire PRD and identify each distinct feature, task, or user story. Create a list of these individual "sprint items". This list will serve as your master checklist for the documents you need to create.
</instruction>
<instruction>
Step 3: Begin Processing the First Sprint Item.
Select the first sprint item from the list you created in Step 2. All subsequent steps until the final instruction will be performed for this single item.
</instruction>
<instruction>
Step 4: Conduct a Detailed Review of the Sprint Item.
Focus exclusively on the selected sprint item. Read its description, acceptance criteria, and any associated notes in the PRD. Clearly define the scope and objectives of this specific item.
</instruction>
<instruction>
Step 5: Perform Targeted Web and Repository Searches.
Based on the sprint item's requirements, conduct a web search to find relevant API documentation, libraries, best practices, or potential implementation examples. Simultaneously, search within the existing codebase for any files, functions, or modules that are related to the item. This connects external research with internal context.
</instruction>
<instruction>
Step 6: Create the Backlog Markdown File.
Locate the file named [backlog template]. Create a new markdown file for the sprint item. Name it appropriately (e.g., backlog_sprint_item_name.md). Populate this new file by filling out the template using the information gathered from the PRD review (Step 4) and your research (Step 5).
</instruction>
<instruction>
Step 7: Create the Implementation Guidance Markdown File.
Locate the file named [implementation guidance template]. Create another new markdown file. Name it to correspond with the backlog item (e.g., implementation_sprint_item_name.md). Populate this file by filling out the template, focusing on the technical details, code-level suggestions, relevant API endpoints, and file paths you discovered during your searches (Step 5).
</instruction>
<instruction>
Step 8: Save the New Files.
Ensure both newly created markdown files (the backlog and the implementation guidance) are saved in the same folder where this prompt file is located.
</instruction>
<instruction>
Step 9: Repeat for All Remaining Sprint Items.
If there are more sprint items on your list from Step 2, return to Step 3 and repeat the entire process (Steps 3 through 8) for the next item. Continue this loop until a backlog and an implementation guidance file have been created for every single item on your list.
</instruction>
<instruction>
Step 10: Final Verification.
Once all sprint items have been processed, perform a final check. Verify that for every item identified in the PRD, there are exactly two corresponding markdown files (one backlog, one implementation guidance) located in the correct folder.
</instruction>

</instructions>

<notes>
<note>
Note 1: Template Adherence.
You must strictly use the provided [backlog template] and [implementation guidance template] for all generated files. Do not deviate from their structure.
</note>
<note>
Note 2: One-to-One File-to-Item Ratio.
For every single sprint item identified in the PRD, you must produce exactly one backlog markdown file and one implementation guidance markdown file.
</note>
<note>
Note 3: Naming Conventions.
All new files must follow a consistent naming convention that clearly links them to the sprint item, for example: backlog_sprint_item_name.md and implementation_sprint_item_name.md.
</note>
<note>
Note 4: File Location.
All generated markdown files must be created and saved in the exact same folder as the prompt file.
</note>
<note>
Note 5: Atomic Processing.
Each sprint item must be processed individually and completely (from detailed review to file creation) before moving to the next item. Do not batch-process steps.
</note>
<note>
Note 6: Foundational Analysis.
The initial repository context analysis (Step 1) is mandatory and must be completed before processing any sprint items. This step is critical for providing relevant and accurate guidance.
</note>
</notes>