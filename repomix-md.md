This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: docs/**/prd.md
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
docs/
  completed/
    2025-08-27/
      prd.md
    deploy/
      prd.md
    extension/
      prd.md
    extension2/
      prd.md
    fe/
      prd.md
    logging/
      prd.md
    m-improv2/
      prd.md
    major-improvement/
      prd.md
    missing/
      prd.md
    missing2/
      prd.md
    noworkspace/
      prd.md
    react2/
      prd.md
    setup/
      prd.md
    sidebar/
      prd.md
    svelte-continue/
      prd.md
    ux/
      prd.md
    ux2/
      prd.md
  todo/
    fix-settings/
      prd.md
```

# Files

## File: docs/completed/2025-08-27/prd.md
````markdown
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
````

## File: docs/completed/deploy/prd.md
````markdown
<prd>Of course. I've reviewed your codebase and the previous planning documents. The current architecture is well-decoupled, but the build, packaging, and deployment processes are not yet unified or automated. This is a critical step to ensure stability and enable rapid, reliable releases.

To address this, I have created a new PRD focused entirely on stabilizing the monorepo and establishing a professional CI/CD pipeline for automated publishing.

-----

### **New Document: PRD 1: Foundational - Monorepo Stabilization & CI/CD Pipeline**

**1. Title & Overview**

  * **Project:** Code Context Engine - Monorepo Stabilization & CI/CD
  * **Summary:** This phase focuses on creating a stable, unified build process for the entire monorepo, which includes the TypeScript extension, the SvelteKit webview, and the C\# backend. We will then automate the testing, packaging, and publishing of the VS Code extension to the Visual Studio Marketplace using GitHub Actions.
  * **Dependencies:** The individual sub-packages (extension, webview, C\# backend) must be buildable on their own.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Increase development velocity by enabling a one-command build and deployment process.
      * Improve extension quality and reliability by automating testing and ensuring consistent builds.
      * Establish a professional release workflow that can support future growth.
  * **Developer & System Success Metrics:**
      * A single command (e.g., `npm run build:all`) can successfully build all parts of the monorepo.
      * A single command (e.g., `npm run package`) creates a `.vsix` file containing all necessary artifacts (JS, Svelte build, C\# binaries).
      * The CI pipeline in GitHub Actions automatically builds and tests every pull request.
      * A manually triggered "Release" workflow in GitHub Actions successfully publishes the extension to the VS Code Marketplace.
      * The local publishing script works correctly.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** Alisha needs to be confident that her changes to the C\# or TypeScript backend won't break the build. An automated CI pipeline gives her instant feedback on her pull requests.
  * **Devin (Developer - End User):** Devin benefits from more frequent and reliable updates to the extension, as the automated pipeline removes the friction and risk of manual releases.

-----

**4. Requirements Breakdown**

| Phase                  | Sprint                             | User Story                                                                                                                                                    | Acceptance Criteria                                                                                                                                                                                                                                                                                                                               | Duration  |
| :--------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| **Phase 1: Stabilization** | **Sprint 1: Unified Build & Local Packaging** | As Alisha, I want a single command to build all parts of the monorepo (TypeScript, Svelte, C\#), so I can create a complete build artifact easily.     | 1. `npm run build:all` script is added to the root `package.json`.\<br/\>2. The script successfully compiles the TypeScript extension, builds the SvelteKit webview, and publishes the C\# backend to a `dist` folder.\<br/\>3. The build completes without errors.                                                                       | **2 Weeks** |
|                        |                                    | As a developer, I want to update the packaging script to correctly bundle all necessary artifacts into a single `.vsix` file for distribution.          | 1. The `.vscodeignore` file is configured to include the `webview/build` and C\# `publish` directories.\<br/\>2. The `vsce package` command correctly bundles all necessary files.\<br/\>3. The generated `.vsix` file can be installed manually in VS Code and is fully functional.                                                  |           |
|                        |                                    | As a developer, I want a local script to publish the extension to the marketplace, so I can perform manual releases if needed.                              | 1. A new script, `npm run publish:vsce`, is created.\<br/\>2. The script uses the `vsce publish` command with a Personal Access Token (PAT) provided via an environment variable (`VSCE_PAT`).\<br/\>3. Running the script with a valid PAT successfully publishes the extension.                                                     |           |
| **Phase 1: Stabilization** | **Sprint 2: CI/CD Automation** | As Alisha, I want a GitHub Actions workflow that automatically builds and tests the extension on every pull request, so we can maintain code quality. | 1. A `.github/workflows/ci.yml` file is created.\<br/\>2. The workflow is triggered on `pull_request` to the `main` branch.\<br/\>3. The workflow runs the unified build command (`npm run build:all`) and all tests.\<br/\>4. The workflow fails if the build or tests fail.                                                               | **2 Weeks** |
|                        |                                    | As a project owner, I want a reusable "Release" workflow in GitHub Actions to package the extension and create a draft release.                             | 1. A `.github/workflows/release.yml` file is created with a `workflow_dispatch` trigger.\<br/\>2. The workflow checks out the code, builds all artifacts, and packages the `.vsix` file.\<br/\>3. The workflow creates a new Draft GitHub Release and attaches the `.vsix` file as a release asset.                                   |           |
|                        |                                    | As a project owner, I want to automate publishing to the VS Code Marketplace when I publish a GitHub Release.                                                 | 1. The `release.yml` workflow is updated to trigger on `release: { types: [published] }`.\<br/\>2. A new job is added that downloads the `.vsix` asset from the release.\<br/\>3. The job uses `vsce publish` with the PAT (stored as a GitHub Secret `VSCE_PAT`) to publish the extension to the marketplace. |           |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** Unified Build & Local Packaging (2 Weeks)
  * **Sprint 2:** CI/CD Automation (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The C\# backend can be built and published as a self-contained executable that works across multiple platforms (Windows, macOS, Linux).
  * **Risk:** The Personal Access Token (PAT) is a highly sensitive secret. If exposed, it could allow anyone to publish to your marketplace account.
      * **Mitigation:** The PAT must **only** be stored as a GitHub Secret and never be committed to the repository. The local publishing script must read it from an environment variable and never from a file.
  * **Risk:** Cross-platform builds for the C\# backend can be complex to manage within a single GitHub Actions workflow.
      * **Mitigation:** Use a matrix build strategy in GitHub Actions to create separate builds for each target platform (Windows, macOS, Linux) and package them accordingly.

-----

### **New Document: Sub-Sprint 1: Unified Build System**

**Objective:**
To create a set of npm scripts that build all parts of the monorepo (TypeScript, Svelte, C\#) and correctly package them into a single `.vsix` file.

**Parent Sprint:**
PRD 1, Sprint 1: Unified Build & Local Packaging

**Tasks:**

1.  **Create C\# Build Script:** Add a `build:csharp` script to the root `package.json` that runs `dotnet publish` on the C\# API project, outputting to a known directory (e.g., `dist/backend`).
2.  **Update Webview Build Script:** Ensure the `build:webview` script correctly places its output in a known directory (e.g., `webview/build`).
3.  **Create Unified Build Script:** Create a `build:all` script that runs the TypeScript compilation (`tsc`), the webview build, and the C\# build in sequence.
4.  **Configure `.vscodeignore`:** Update the `.vscodeignore` file to ensure the `webview/build` and `dist/backend` directories are *included* in the final package.
5.  **Create Packaging Script:** Create a `package` script that first runs `build:all` and then runs `vsce package`.
6.  **Create Local Publish Script:** Create a `publish:vsce` script that runs `vsce publish --pat $VSCE_PAT`.

**Acceptance Criteria:**

  * Running `npm run build:all` from the root directory successfully builds all parts of the project.
  * Running `npm run package` creates a `.vsix` file.
  * The generated `.vsix` can be manually installed and runs correctly.
  * Running `export VSCE_PAT='...' && npm run publish:vsce` successfully publishes the extension.

**Dependencies:**

  * .NET SDK, Node.js, and `vsce` must be installed on the local machine.

**Timeline:**

  * **Start Date:** 2025-08-27
  * **End Date:** 2025-09-02

-----

### **New Document: Sub-Sprint 2: CI/CD Automation with GitHub Actions**

**Objective:**
To create a GitHub Actions workflow that automates the build, test, and release process, including publishing to the VS Code Marketplace.

**Parent Sprint:**
PRD 1, Sprint 2: CI/CD Automation

**Tasks:**

1.  **Create CI Workflow:** Create a `.github/workflows/ci.yml` file that triggers on pull requests. The workflow should set up Node.js and .NET, install all dependencies, and run the `npm run build:all` and `npm test` commands.
2.  **Create Release Workflow:** Create a `.github/workflows/release.yml` file that triggers on `workflow_dispatch` (manual trigger) and `release` (when a GitHub release is published).
3.  **Implement Packaging in Release Workflow:** The release workflow will run the `npm run package` command and then upload the generated `.vsix` file as a release asset.
4.  **Add PAT as GitHub Secret:** Add the VS Code Marketplace PAT to the GitHub repository's secrets with the name `VSCE_PAT`.
5.  **Implement Automated Publishing:** Add a job to the `release.yml` workflow that runs `vsce publish` using the `VSCE_PAT` secret. This job should only run when a release is published, not on the manual trigger.

**Acceptance Criteria:**

  * Opening a pull request successfully triggers the `ci.yml` workflow, which builds and tests the extension.
  * Manually triggering the `release.yml` workflow creates a draft GitHub release with the `.vsix` file attached.
  * Creating and publishing a new release on GitHub successfully triggers the `release.yml` workflow, which then publishes the extension to the marketplace.

**Dependencies:**

  * Sub-Sprint 1 must be complete.
  * The VS Code Marketplace PAT must be available.

**Timeline:**

  * **Start Date:** 2025-09-03
  * **End Date:** 2025-09-09

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - Unified Build & Local Packaging

**Goal:** To create a stable, unified build process and local publishing script for the monorepo.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Add C\# Build Script:** In the root `package.json`, add a script `"build:csharp": "dotnet publish ./CodeContext.Api -c Release -o ./dist/backend"`. | `package.json` |
| **1.2** | ☐ To Do | **Add Webview Build Script:** In the root `package.json`, add a script `"build:webview": "npm run build --workspace=webview"`. | `package.json` |
| **1.3** | ☐ To Do | **Add TypeScript Compile Script:** In the root `package.json`, ensure a script like `"compile": "tsc -p ./"` exists. | `package.json` |
| **1.4** | ☐ To Do | **Create Unified Build Script:** In `package.json`, add a script `"build:all": "npm run compile && npm run build:webview && npm run build:csharp"`. | `package.json` |
| **1.5** | ☐ To Do | **Update `.vscodeignore`:** Remove any lines that would ignore the `webview/build` or `dist/backend` directories. Add `!webview/build/**` and `!dist/backend/**` to ensure they are included. | `.vscodeignore` |
| **1.6** | ☐ To Do | **Update `package` Script:** In `package.json`, modify the `"package"` script to be `"package": "npm run build:all && vsce package --no-dependencies"`. | `package.json` |
| **1.7** | ☐ To Do | **Create Local Publish Script:** In `package.json`, add a script `"publish:vsce": "vsce publish --pat $VSCE_PAT"`. | `package.json` |
| **1.8** | ☐ To Do | **Document Local Publish Process:** In `README.md`, add a section explaining how to publish locally by setting the `VSCE_PAT` environment variable and running the script. | `README.md` |

-----

### **New Document: tasklist\_sprint\_02.md**

# Task List: Sprint 2 - CI/CD Automation

**Goal:** To automate the build, test, and release process using GitHub Actions.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create `ci.yml` Workflow:** Create the file `.github/workflows/ci.yml`. Configure it to trigger on `pull_request`. | `.github/workflows/ci.yml` (New) |
| **2.2** | ☐ To Do | **Add Setup Steps to `ci.yml`:** Add steps to check out the code, set up Node.js, and set up the .NET SDK. | `.github/workflows/ci.yml` |
| **2.3** | ☐ To Do | **Add Build & Test Steps to `ci.yml`:** Add steps to install dependencies (`npm install` and `npm install --workspace=webview`), run the unified build (`npm run build:all`), and run tests (`npm test`). | `.github/workflows/ci.yml` |
| **2.4** | ☐ To Do | **Create `release.yml` Workflow:** Create the file `.github/workflows/release.yml`. Configure it to trigger on `workflow_dispatch` and `release: { types: [published] }`. | `.github/workflows/release.yml` (New) |
| **2.5** | ☐ To Do | **Add Packaging Job to `release.yml`:** Create a `package` job that builds everything and runs `vsce package`. It should then upload the `.vsix` file as a workflow artifact. | `.github/workflows/release.yml` |
| **2.6** | ☐ To Do | **Create Draft Release Step:** Modify the `package` job to use a GitHub Action (e.g., `actions/create-release`) to create a draft GitHub release and another action (`actions/upload-release-asset`) to attach the `.vsix` artifact. This part should only run on `workflow_dispatch`. | `.github/workflows/release.yml` |
| **2.7** | ☐ To Do | **Add `VSCE_PAT` Secret:** In the GitHub repository settings, add the VS Code Marketplace PAT as a secret named `VSCE_PAT`. | `(GitHub Settings)` |
| **2.8** | ☐ To Do | **Add Publish Job to `release.yml`:** Create a `publish` job that `needs: package` and runs only on the `release:published` trigger. This job will download the `.vsix` artifact and run `vsce publish` using the `VSCE_PAT` secret. | `.github/workflows/release.yml` |
Of course. Here is the final PRD to complete the technical debt and refactoring initiative.

-----

### **New Document: PRD 2: Advanced Refactoring - Webview & Communication**

**1. Title & Overview**

  * **Project:** Code Context Engine - Webview & Communication Refactoring
  * **Summary:** This phase completes the decoupling of `extension.ts` by creating dedicated managers for webview lifecycle and message routing. A `WebviewManager` will centralize the logic for creating, showing, and disposing of all webview panels. A `MessageRouter` will handle all communication between the webview and the extension's backend services, creating a clean and robust communication layer.
  * **Dependencies:** PRD 1 (Backend Decoupling & Refactoring) must be complete. The `ExtensionManager` and `CommandManager` should be in place.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Finalize the architectural refactoring to create a fully modular, scalable, and maintainable codebase.
      * Improve the reliability of the UI and its communication with the backend, leading to a better user experience.
  * **Developer & System Success Metrics:**
      * `extension.ts` is purely an activator and contains no direct webview or message handling logic.
      * All webview panel creation and management logic is consolidated within the `WebviewManager`.
      * The large `switch` statement for message handling is replaced by the `MessageRouter`, which cleanly delegates tasks to the appropriate services.
      * Adding a new webview or a new message command is a simple, low-risk operation that requires changes in only one or two focused files.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** Alisha can now add new commands and backend logic without ever needing to touch the UI or communication layers. Her work is isolated to the services she owns.
  * **Frank (Frontend Developer):** Frank works on the SvelteKit UI. He now has a single, predictable `MessageRouter` to interact with. He doesn't need to know which backend service implements a feature; he just sends a command, and the router handles the rest.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Refactoring** | **Sprint 3: Webview Management** | As a developer, I want to create a `WebviewManager` to handle the lifecycle of all webview panels so that UI creation logic is centralized and reusable. | 1. A new `WebviewManager` class is created. \<br/\> 2. All `vscode.window.createWebviewPanel` logic is moved from `extension.ts` (or `CommandManager`) into the `WebviewManager`. \<br/\> 3. The manager handles showing the main panel and the settings panel, ensuring only one of each can exist at a time. \<br/\> 4. The manager is responsible for panel disposal and is properly disposed of by the `ExtensionManager`. | **2 Weeks** |
| | | As Frank, I want the `WebviewManager` to be responsible for providing the correct HTML content so that the webview loading process is standardized. | 1. The logic for reading the `index.html` file from the `webview/dist` directory is moved into a private method in `WebviewManager`. \<br/\> 2. The method correctly replaces asset paths with `webview.asWebviewUri` to ensure CSS and JS files load correctly. \<br/\> 3. The `showMainPanel` and `showSettingsPanel` methods use this helper to set the panel's HTML. | |
| **Phase 2: Refactoring** | **Sprint 4: Communication & State Mgmt** | As a developer, I want to create a `MessageRouter` to handle all incoming messages from the webview so that communication logic is decoupled and clean. | 1. A new `MessageRouter` class is created. \<br/\> 2. The `onDidReceiveMessage` listener for each webview is set up to delegate to an instance of the `MessageRouter`. \<br/\> 3. The `MessageRouter`'s `routeMessage` method contains the `switch` statement that calls the appropriate service based on the message command. \<br/\> 4. The router sends results back to the webview with a consistent response format (e.g., `{ command, requestId, result, error }`). | **2 Weeks** |
| | | As Alisha, I want to introduce a basic `StateManager` to track the global state of the extension so that services don't need to communicate directly with each other for status updates. | 1. A new `StateManager` class is created to hold simple boolean flags (e.g., `isIndexing`, `isBackendHealthy`). \<br/\> 2. Services can update the state via the manager (e.g., `stateManager.setIndexing(true)`). \<br/\> 3. The `MessageRouter` can query the state to prevent conflicting actions (e.g., don't start a new index if `isIndexing` is true). | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 3:** Webview Management (2 Weeks)
  * **Sprint 4:** Communication & State Management (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The message-passing API between the webview and the extension is stable and performant enough for all communication needs.
  * **Risk:** Incorrectly managing panel/webview lifecycles in the `WebviewManager` could lead to memory leaks or "ghost" panels that are not properly disposed of.
      * **Mitigation:** Ensure that the `onDidDispose` event for every created panel is correctly handled and that all disposables are added to the extension's context subscriptions.
  * **Risk:** The `StateManager` could become a complex bottleneck if too much logic is added to it.
      * **Mitigation:** Keep the initial `StateManager` extremely simple, holding only essential, global boolean flags. Avoid putting business logic into the state manager itself; its only job is to store and retrieve state.

-----

### **New Document: Sub-Sprint 3: Centralized Webview Management**

**Objective:**
To create the `WebviewManager` class and move all webview panel creation and lifecycle logic into it, cleaning up the command handlers and `extension.ts`.

**Parent Sprint:**
PRD 2, Sprint 3: Webview Management

**Tasks:**

1.  **Create `WebviewManager.ts`:** Develop the new class with a constructor that accepts the `vscode.ExtensionContext`.
2.  **Implement `showMainPanel`:** Create a method that contains the logic for creating and showing the main webview panel. It should ensure only one instance of the main panel can exist.
3.  **Implement `showSettingsPanel`:** Create a method that contains the logic for creating and showing the settings webview panel.
4.  **Implement `getWebviewContent`:** Create a private helper method that reads the `index.html`, prepares it with the correct URIs for webview assets, and returns the HTML string.
5.  **Refactor `CommandManager`:** Update the callbacks for the `openMainPanel` and `openSettings` commands to simply call the appropriate methods on the `WebviewManager` instance.

**Acceptance Criteria:**

  * All `vscode.window.createWebviewPanel` calls are located exclusively within `WebviewManager.ts`.
  * The `openMainPanel` and `openSettings` commands correctly open their respective UIs.
  * Attempting to open a panel that is already open simply brings the existing panel into focus.

**Dependencies:**

  * `CommandManager` from PRD 1 must be implemented.

**Timeline:**

  * **Start Date:** 2025-09-22
  * **End Date:** 2025-10-03

-----

### **New Document: Sub-Sprint 4: Message Routing & State**

**Objective:**
To create the `MessageRouter` and `StateManager` classes to formalize the communication layer and centralize the extension's global state.

**Parent Sprint:**
PRD 2, Sprint 4: Communication & State Mgmt

**Tasks:**

1.  **Create `StateManager.ts`:** Develop a simple class with private properties (e.g., `_isIndexing = false`) and public getter/setter methods.
2.  **Create `MessageRouter.ts`:** Develop the class with a constructor that accepts the `ExtensionManager` (to access all services and managers) and the `vscode.Webview`. The constructor will set up the `onDidReceiveMessage` listener.
3.  **Implement `routeMessage` method:** Move the message-handling `switch` statement from `extension.ts` into this private method within the `MessageRouter`.
4.  **Integrate `StateManager`:** In the `MessageRouter`, check the state before delegating actions. For example: `if (this.stateManager.isIndexing) { /* return error */ }`.
5.  **Update Services:** Modify services like `IndexingService` to update the central state (e.g., `this.stateManager.setIndexing(true)` at the start and `false` at the end).
6.  **Integrate `MessageRouter`:** In `WebviewManager`, when a panel is created, instantiate a `MessageRouter` for it, passing in the necessary dependencies.

**Acceptance Criteria:**

  * The `onDidReceiveMessage` listener in `WebviewManager` is a single line that instantiates and uses the `MessageRouter`.
  * The `MessageRouter` correctly routes commands to the appropriate services.
  * Attempting to start a new indexing job while one is already running is gracefully rejected with an error message sent back to the UI.

**Dependencies:**

  * Sub-Sprint 3 must be complete.

**Timeline:**

  * **Start Date:** 2025-10-06
  * **End Date:** 2025-10-17

-----

### **New Document: tasklist\_sprint\_03.md**

# Task List: Sprint 3 - Webview Management

**Goal:** To centralize all webview creation and lifecycle logic into a dedicated `WebviewManager` class.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Create `WebviewManager.ts`:** Create the new file and the `WebviewManager` class structure with a constructor and a `dispose` method. | `src/webviewManager.ts` (New) |
| **3.2** | ☐ To Do | **Implement `getWebviewContent`:** Create a private helper method that takes a webview instance, reads `webview/dist/index.html`, replaces asset paths using `webview.asWebviewUri`, and returns the final HTML string. | `src/webviewManager.ts` |
| **3.3** | ☐ To Do | **Implement `showMainPanel`:** Create a public method that checks if a main panel instance already exists. If not, it calls `vscode.window.createWebviewPanel`, sets its HTML using the helper, and stores the instance. If it exists, it calls `.reveal()`. | `src/webviewManager.ts` |
| **3.4** | ☐ To Do | **Implement `showSettingsPanel`:** Create a public method with the same logic as `showMainPanel`, but for the settings UI, using a different panel ID and title. | `src/webviewManager.ts` |
| **3.5** | ☐ To Do | **Handle Panel Disposal:** In the `show...` methods, add the `onDidDispose` listener to the created panel to nullify the stored instance variable (e.g., `this.mainPanel = undefined`). | `src/webviewManager.ts` |
| **3.6** | ☐ To Do | **Update `ExtensionManager`:** Instantiate the `WebviewManager` in the `ExtensionManager`'s constructor. | `src/extensionManager.ts` |
| **3.7** | ☐ To Do | **Refactor `CommandManager`:** Change the `openMainPanel` and `openSettings` command callbacks to call `extensionManager.webviewManager.showMainPanel()` and `showSettingsPanel()` respectively. | `src/commandManager.ts` |

-----

### **New Document: tasklist\_sprint\_04.md**

# Task List: Sprint 4 - Communication & State Mgmt

**Goal:** To formalize the webview communication layer with a `MessageRouter` and centralize global state with a `StateManager`.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `StateManager.ts`:** Create the new file and a simple `StateManager` class. Add a private boolean `_isIndexing` and public `isIndexing()` getter and `setIndexing(state: boolean)` setter. | `src/stateManager.ts` (New) |
| **4.2** | ☐ To Do | **Create `MessageRouter.ts`:** Create the new file and the `MessageRouter` class. Its constructor will accept the `ExtensionManager` and `vscode.Webview`. | `src/messageRouter.ts` (New) |
| **4.3** | ☐ To Do | **Implement `routeMessage`:** Move the message handling `switch` statement into a private `async routeMessage` method in `MessageRouter`. | `src/messageRouter.ts` |
| **4.4** | ☐ To Do | **Integrate State Check:** In `routeMessage`, before the `startIndexing` case, add a check: `if (this.extensionManager.stateManager.isIndexing()) { ... post error message ... }`. | `src/messageRouter.ts` |
| **4.5** | ☐ To Do | **Update `IndexingService`:** Inject the `StateManager` instance into the `IndexingService`. Call `this.stateManager.setIndexing(true)` at the beginning of `startIndexing` and `false` in a `finally` block at the end. | `src/indexing/indexingService.ts` |
| **4.6** | ☐ To Do | **Instantiate `MessageRouter`:** In `WebviewManager`, when a panel is created, remove the old `onDidReceiveMessage` logic and replace it with `new MessageRouter(this.extensionManager, this.mainPanel.webview)`. | `src/webviewManager.ts` |
| **4.7** | ☐ To Do | **Instantiate `StateManager`:** In `ExtensionManager`, create a public instance of the `StateManager` so it can be accessed by other services. | `src/extensionManager.ts` |
| **4.8** | ☐ To Do | **Update Service Constructors:** Update the constructors of services (like `IndexingService`) that now need the `StateManager`, and update the instantiation logic in `ExtensionManager`. | `src/extensionManager.ts`, `src/indexing/indexingService.ts` |

This completes the full set of PRDs for the refactoring initiative. You now have a comprehensive plan to transform your extension's architecture into a more robust, maintainable, and scalable system.

</prd>
````

## File: docs/completed/extension/prd.md
````markdown
<prd>Of course. Based on the technical debt analysis and the goal of making the extension more robust, I've broken down the refactoring effort into two distinct, sequential phases. The first phase will focus on foundational backend decoupling, and the second will address the webview and communication layers.

Here are the PRDs for this initiative.

-----

### **New Document: PRD 1: Foundational - Backend Decoupling & Refactoring**

**1. Title & Overview**

  * **Project:** Code Context Engine - Backend Refactoring
  * **Summary:** This phase addresses critical technical debt in the extension's backend. We will refactor the core services to use Dependency Injection (DI) for managing dependencies and centralize configuration handling. We will also begin decoupling the monolithic `extension.ts` file by creating dedicated managers for commands and overall extension lifecycle, establishing a more scalable and testable architecture.
  * **Dependencies:** Requires the existing codebase to be stable and all current features to be functional.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Increase development velocity for future features by creating a more maintainable and understandable codebase.
      * Improve the overall stability and reliability of the extension by reducing tight coupling and side effects.
  * **Developer & System Success Metrics:**
      * Core services (`IndexingService`, `ContextService`, etc.) no longer instantiate their own dependencies.
      * Configuration is read from a single, centralized source and passed to services.
      * Unit test coverage for core services increases by at least 50%, as they can now be tested in isolation with mocked dependencies.
      * The `extension.ts` file is significantly smaller, with its primary responsibilities delegated to new manager classes.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** Alisha needs to add new features and fix bugs efficiently. A decoupled architecture allows her to work on individual components without understanding the entire system and to write reliable unit tests for her changes.
  * **Devin (Developer - End User):** While this is a backend refactor, Devin will benefit from the increased stability and faster feature development that results from a cleaner codebase.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Refactoring** | **Sprint 1: Dependency & Config Mgmt** | As Alisha, I want to refactor services to receive dependencies via their constructor so I can unit test them with mocks. | 1. `IndexingService` and `ContextService` constructors are updated to accept dependencies like `QdrantService` and `IEmbeddingProvider`.\<br/\>2. The services no longer use the `new` keyword to create their own dependencies.\<br/\>3. Existing unit tests are updated, and new tests are added to verify service logic with mocked dependencies. | **2 Weeks** |
| | | As Alisha, I want to create a central configuration service so that settings are managed in one place. | 1. A new `ConfigService` is created that reads all settings from `vscode.workspace.getConfiguration()` on startup.\<br/\>2. Services that require configuration (e.g., `QdrantService`) receive the necessary values (like a connection string) via their constructor.\<br/\>3. Services no longer call `vscode.workspace.getConfiguration()` directly. | |
| **Phase 1: Refactoring** | **Sprint 2: Lifecycle & Command Mgmt** | As Alisha, I want to introduce an `ExtensionManager` to handle the extension's lifecycle so that `extension.ts` becomes a simple entry point. | 1. A new `ExtensionManager` class is created to manage the initialization and disposal of all services and managers.\<br/\>2. The `activate` function in `extension.ts` is reduced to creating and initializing the `ExtensionManager`.\<br/\>3. The `deactivate` function calls a `dispose` method on the `ExtensionManager`. | **2 Weeks** |
| | | As Alisha, I want to create a `CommandManager` to handle all command registrations so that this logic is decoupled from the main activation file. | 1. A new `CommandManager` class is created.\<br/\>2. All `vscode.commands.registerCommand` calls are moved from `extension.ts` into the `CommandManager`.\<br/\>3. The `CommandManager` delegates the command's execution logic to the appropriate service (e.g., `IndexingService.startIndexing`).\<br/\>4. The `ExtensionManager` is responsible for creating and initializing the `CommandManager`. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** Dependency & Configuration Management (2 Weeks)
  * **Sprint 2:** Lifecycle & Command Management (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The current feature set is well-understood, allowing for a safe refactoring process without introducing regressions.
  * **Risk:** The refactoring effort might take longer than estimated if unforeseen complexities arise in the existing code.
      * **Mitigation:** Prioritize a "lift and shift" approach initially. Move existing logic into new classes without significantly altering the logic itself. Deeper refactoring of the logic can be a separate, future task.
  * **Risk:** Improperly managing the lifecycle of services and disposables in the new manager classes could lead to memory leaks.
      * **Mitigation:** Implement a clear `dispose` pattern in all manager classes and ensure the top-level `ExtensionManager` correctly calls `dispose` on all its managed components.

-----

### **New Document: Sub-Sprint 1: Dependency Injection & Centralized Config**

**Objective:**
To refactor all core services to use constructor-based dependency injection and to receive configuration from a centralized source.

**Parent Sprint:**
PRD 1, Sprint 1: Dependency & Config Mgmt

**Tasks:**

1.  **Create `ConfigService.ts`:** Develop a service that loads all extension settings from `vscode.workspace.getConfiguration()` once and provides them via getter methods.
2.  **Refactor `QdrantService`:** Update its constructor to accept the database connection string directly.
3.  **Refactor `EmbeddingProvider` implementations:** Update their constructors to accept necessary parameters (e.g., API keys, model names).
4.  **Refactor `IndexingService` & `ContextService`:** Update their constructors to accept instances of their dependencies (e.g., `qdrantService`, `embeddingProvider`, `configService`).
5.  **Update Unit Tests:** Modify existing tests to pass mocked dependencies to the service constructors, improving test isolation.

**Acceptance Criteria:**

  * No service uses the `new` keyword to create its long-lived dependencies.
  * No service directly calls `vscode.workspace.getConfiguration()`.
  * Unit tests for services can run without needing the VS Code API.

**Dependencies:**

  * A clear understanding of the existing service dependencies.

**Timeline:**

  * **Start Date:** 2025-08-25
  * **End Date:** 2025-09-05

-----

### **New Document: Sub-Sprint 2: Extension & Command Managers**

**Objective:**
To create the initial `ExtensionManager` and `CommandManager` classes, moving the core lifecycle and command registration logic out of `extension.ts`.

**Parent Sprint:**
PRD 1, Sprint 2: Lifecycle & Command Mgmt

**Tasks:**

1.  **Create `ExtensionManager.ts`:** This class will have an `initialize` method where it instantiates all services (using the DI pattern from Sub-Sprint 1) and managers. It will also have a `dispose` method.
2.  **Create `CommandManager.ts`:** This class will have a constructor that accepts the `ExtensionManager` instance (to access services) and a `registerCommands` method.
3.  **Move Command Logic:** Transfer all `vscode.commands.registerCommand` calls from `extension.ts` to `CommandManager.registerCommands`.
4.  **Refactor `extension.ts`:** Simplify `activate` to only `new ExtensionManager(context).initialize()`. Simplify `deactivate` to call `extensionManager.dispose()`.

**Acceptance Criteria:**

  * The `extension.ts` file is less than 50 lines of code.
  * All previously functional commands are still registered and work correctly.
  * The extension activates and deactivates cleanly without errors.

**Dependencies:**

  * Sub-Sprint 1 must be complete.

**Timeline:**

  * **Start Date:** 2025-09-08
  * **End Date:** 2025-09-19

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - Dependency & Config Mgmt

**Goal:** To refactor core services to eliminate tight coupling and centralize configuration management, improving testability and maintainability.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Create `ConfigService.ts`:** Create the file and implement a class that reads all settings from `vscode.workspace.getConfiguration('code-context-engine')` in its constructor and stores them in private properties with public getters. | `src/configService.ts` (New) |
| **1.2** | ☐ To Do | **Refactor `QdrantService`:** Modify the constructor to accept `connectionString: string`. Remove the `getConfiguration` call. | `src/db/qdrantService.ts` |
| **1.3** | ☐ To Do | **Refactor `OllamaProvider`:** Modify the constructor to accept `config: OllamaConfig` object. Remove the `getConfiguration` call. | `src/embeddings/ollamaProvider.ts` |
| **1.4** | ☐ To Do | **Refactor `OpenAIProvider`:** Modify the constructor to accept `config: OpenAIConfig` object. Remove the `getConfiguration` call. | `src/embeddings/openaiProvider.ts` |
| **1.5** | ☐ To Do | **Refactor `EmbeddingProviderFactory`:** Update the factory to accept the `ConfigService` and pass the correct configuration down to the provider it creates. | `src/embeddings/embeddingProvider.ts` |
| **1.6** | ☐ To Do | **Refactor `ContextService`:** Modify the constructor to accept `qdrantService: QdrantService` and `embeddingProvider: IEmbeddingProvider` as arguments. Remove the `new` keywords. | `src/context/contextService.ts` |
| **1.7** | ☐ To Do | **Refactor `IndexingService`:** Modify the constructor to accept its dependencies (`fileWalker`, `astParser`, `chunker`, `qdrantService`, `embeddingProvider`, `lspService`) as arguments. Remove the `new` keywords. | `src/indexing/indexingService.ts` |
| **1.8** | ☐ To Do | **Create Test Mocks:** Create mock implementations for `QdrantService` and `IEmbeddingProvider` for use in unit tests. | `src/test/mocks.ts` (New) |
| **1.9** | ☐ To Do | **Update `ContextService` Tests:** Write/update unit tests for `ContextService`, passing in the mocked dependencies to its constructor. | `src/test/contextService.test.ts` |

-----

### **New Document: tasklist\_sprint\_02.md**

# Task List: Sprint 2 - Lifecycle & Command Mgmt

**Goal:** To decouple the main `extension.ts` file by creating dedicated managers for the extension's lifecycle and command registration.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create `CommandManager.ts`:** Create the new file and `CommandManager` class. It should have a constructor that accepts the `ExtensionManager` and a `registerCommands` method. | `src/commandManager.ts` (New) |
| **2.2** | ☐ To Do | **Move `openMainPanel` Command:** Move the `registerCommand` logic for `code-context-engine.openMainPanel` from `extension.ts` to `CommandManager`. The callback will call a method on the `WebviewManager` (to be created in the next PRD). | `src/commandManager.ts`, `src/extension.ts` |
| **2.3** | ☐ To Do | **Move `startIndexing` Command:** Move the `registerCommand` logic for `code-context-engine.startIndexing` to `CommandManager`. The callback will call `indexingService.startIndexing()`. | `src/commandManager.ts`, `src/extension.ts` |
| **2.4** | ☐ To Do | **Move `openSettings` Command:** Move the `registerCommand` logic for `code-context-engine.openSettings` to `CommandManager`. The callback will call a method on the `WebviewManager`. | `src/commandManager.ts`, `src/extension.ts` |
| **2.5** | ☐ To Do | **Create `ExtensionManager.ts`:** Create the new file and `ExtensionManager` class. Its constructor will instantiate all services (using DI) and managers. | `src/extensionManager.ts` (New) |
| **2.6** | ☐ To Do | **Implement `initialize` Method:** In `ExtensionManager`, the `initialize` method will call `commandManager.registerCommands()`. | `src/extensionManager.ts` |
| **2.7** | ☐ To Do | **Implement `dispose` Method:** In `ExtensionManager`, the `dispose` method will call `dispose` on any disposable managers (like `CommandManager`). | `src/extensionManager.ts` |
| **2.8** | ☐ To Do | **Refactor `extension.ts`:** Remove all command registration and service instantiation logic. The `activate` function should now only create and initialize an `ExtensionManager`. | `src/extension.ts` |
| **2.9** | ☐ To Do | **Refactor `deactivate`:** The `deactivate` function in `extension.ts` should now only call `extensionManager.dispose()`. | `src/extension.ts` |
Of course. Here is the final PRD to complete the technical debt and refactoring initiative.

-----

### **New Document: PRD 2: Advanced Refactoring - Webview & Communication**

**1. Title & Overview**

  * **Project:** Code Context Engine - Webview & Communication Refactoring
  * **Summary:** This phase completes the decoupling of `extension.ts` by creating dedicated managers for webview lifecycle and message routing. A `WebviewManager` will centralize the logic for creating, showing, and disposing of all webview panels. A `MessageRouter` will handle all communication between the webview and the extension's backend services, creating a clean and robust communication layer.
  * **Dependencies:** PRD 1 (Backend Decoupling & Refactoring) must be complete. The `ExtensionManager` and `CommandManager` should be in place.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Finalize the architectural refactoring to create a fully modular, scalable, and maintainable codebase.
      * Improve the reliability of the UI and its communication with the backend, leading to a better user experience.
  * **Developer & System Success Metrics:**
      * `extension.ts` is purely an activator and contains no direct webview or message handling logic.
      * All webview panel creation and management logic is consolidated within the `WebviewManager`.
      * The large `switch` statement for message handling is replaced by the `MessageRouter`, which cleanly delegates tasks to the appropriate services.
      * Adding a new webview or a new message command is a simple, low-risk operation that requires changes in only one or two focused files.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** Alisha can now add new commands and backend logic without ever needing to touch the UI or communication layers. Her work is isolated to the services she owns.
  * **Frank (Frontend Developer):** Frank works on the SvelteKit UI. He now has a single, predictable `MessageRouter` to interact with. He doesn't need to know which backend service implements a feature; he just sends a command, and the router handles the rest.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Refactoring** | **Sprint 3: Webview Management** | As a developer, I want to create a `WebviewManager` to handle the lifecycle of all webview panels so that UI creation logic is centralized and reusable. | 1. A new `WebviewManager` class is created. \<br/\> 2. All `vscode.window.createWebviewPanel` logic is moved from `extension.ts` (or `CommandManager`) into the `WebviewManager`. \<br/\> 3. The manager handles showing the main panel and the settings panel, ensuring only one of each can exist at a time. \<br/\> 4. The manager is responsible for panel disposal and is properly disposed of by the `ExtensionManager`. | **2 Weeks** |
| | | As Frank, I want the `WebviewManager` to be responsible for providing the correct HTML content so that the webview loading process is standardized. | 1. The logic for reading the `index.html` file from the `webview/dist` directory is moved into a private method in `WebviewManager`. \<br/\> 2. The method correctly replaces asset paths with `webview.asWebviewUri` to ensure CSS and JS files load correctly. \<br/\> 3. The `showMainPanel` and `showSettingsPanel` methods use this helper to set the panel's HTML. | |
| **Phase 2: Refactoring** | **Sprint 4: Communication & State Mgmt** | As a developer, I want to create a `MessageRouter` to handle all incoming messages from the webview so that communication logic is decoupled and clean. | 1. A new `MessageRouter` class is created. \<br/\> 2. The `onDidReceiveMessage` listener for each webview is set up to delegate to an instance of the `MessageRouter`. \<br/\> 3. The `MessageRouter`'s `routeMessage` method contains the `switch` statement that calls the appropriate service based on the message command. \<br/\> 4. The router sends results back to the webview with a consistent response format (e.g., `{ command, requestId, result, error }`). | **2 Weeks** |
| | | As Alisha, I want to introduce a basic `StateManager` to track the global state of the extension so that services don't need to communicate directly with each other for status updates. | 1. A new `StateManager` class is created to hold simple boolean flags (e.g., `isIndexing`, `isBackendHealthy`). \<br/\> 2. Services can update the state via the manager (e.g., `stateManager.setIndexing(true)`). \<br/\> 3. The `MessageRouter` can query the state to prevent conflicting actions (e.g., don't start a new index if `isIndexing` is true). | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 3:** Webview Management (2 Weeks)
  * **Sprint 4:** Communication & State Management (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The message-passing API between the webview and the extension is stable and performant enough for all communication needs.
  * **Risk:** Incorrectly managing panel/webview lifecycles in the `WebviewManager` could lead to memory leaks or "ghost" panels that are not properly disposed of.
      * **Mitigation:** Ensure that the `onDidDispose` event for every created panel is correctly handled and that all disposables are added to the extension's context subscriptions.
  * **Risk:** The `StateManager` could become a complex bottleneck if too much logic is added to it.
      * **Mitigation:** Keep the initial `StateManager` extremely simple, holding only essential, global boolean flags. Avoid putting business logic into the state manager itself; its only job is to store and retrieve state.

-----

### **New Document: Sub-Sprint 3: Centralized Webview Management**

**Objective:**
To create the `WebviewManager` class and move all webview panel creation and lifecycle logic into it, cleaning up the command handlers and `extension.ts`.

**Parent Sprint:**
PRD 2, Sprint 3: Webview Management

**Tasks:**

1.  **Create `WebviewManager.ts`:** Develop the new class with a constructor that accepts the `vscode.ExtensionContext`.
2.  **Implement `showMainPanel`:** Create a method that contains the logic for creating and showing the main webview panel. It should ensure only one instance of the main panel can exist.
3.  **Implement `showSettingsPanel`:** Create a method that contains the logic for creating and showing the settings webview panel.
4.  **Implement `getWebviewContent`:** Create a private helper method that reads the `index.html`, prepares it with the correct URIs for webview assets, and returns the HTML string.
5.  **Refactor `CommandManager`:** Update the callbacks for the `openMainPanel` and `openSettings` commands to simply call the appropriate methods on the `WebviewManager` instance.

**Acceptance Criteria:**

  * All `vscode.window.createWebviewPanel` calls are located exclusively within `WebviewManager.ts`.
  * The `openMainPanel` and `openSettings` commands correctly open their respective UIs.
  * Attempting to open a panel that is already open simply brings the existing panel into focus.

**Dependencies:**

  * `CommandManager` from PRD 1 must be implemented.

**Timeline:**

  * **Start Date:** 2025-09-22
  * **End Date:** 2025-10-03

-----

### **New Document: Sub-Sprint 4: Message Routing & State**

**Objective:**
To create the `MessageRouter` and `StateManager` classes to formalize the communication layer and centralize the extension's global state.

**Parent Sprint:**
PRD 2, Sprint 4: Communication & State Mgmt

**Tasks:**

1.  **Create `StateManager.ts`:** Develop a simple class with private properties (e.g., `_isIndexing = false`) and public getter/setter methods.
2.  **Create `MessageRouter.ts`:** Develop the class with a constructor that accepts the `ExtensionManager` (to access all services and managers) and the `vscode.Webview`. The constructor will set up the `onDidReceiveMessage` listener.
3.  **Implement `routeMessage` method:** Move the message-handling `switch` statement from `extension.ts` into this private method within the `MessageRouter`.
4.  **Integrate `StateManager`:** In the `MessageRouter`, check the state before delegating actions. For example: `if (this.stateManager.isIndexing) { /* return error */ }`.
5.  **Update Services:** Modify services like `IndexingService` to update the central state (e.g., `this.stateManager.setIndexing(true)` at the start and `false` at the end).
6.  **Integrate `MessageRouter`:** In `WebviewManager`, when a panel is created, instantiate a `MessageRouter` for it, passing in the necessary dependencies.

**Acceptance Criteria:**

  * The `onDidReceiveMessage` listener in `WebviewManager` is a single line that instantiates and uses the `MessageRouter`.
  * The `MessageRouter` correctly routes commands to the appropriate services.
  * Attempting to start a new indexing job while one is already running is gracefully rejected with an error message sent back to the UI.

**Dependencies:**

  * Sub-Sprint 3 must be complete.

**Timeline:**

  * **Start Date:** 2025-10-06
  * **End Date:** 2025-10-17

-----

### **New Document: tasklist\_sprint\_03.md**

# Task List: Sprint 3 - Webview Management

**Goal:** To centralize all webview creation and lifecycle logic into a dedicated `WebviewManager` class.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Create `WebviewManager.ts`:** Create the new file and the `WebviewManager` class structure with a constructor and a `dispose` method. | `src/webviewManager.ts` (New) |
| **3.2** | ☐ To Do | **Implement `getWebviewContent`:** Create a private helper method that takes a webview instance, reads `webview/dist/index.html`, replaces asset paths using `webview.asWebviewUri`, and returns the final HTML string. | `src/webviewManager.ts` |
| **3.3** | ☐ To Do | **Implement `showMainPanel`:** Create a public method that checks if a main panel instance already exists. If not, it calls `vscode.window.createWebviewPanel`, sets its HTML using the helper, and stores the instance. If it exists, it calls `.reveal()`. | `src/webviewManager.ts` |
| **3.4** | ☐ To Do | **Implement `showSettingsPanel`:** Create a public method with the same logic as `showMainPanel`, but for the settings UI, using a different panel ID and title. | `src/webviewManager.ts` |
| **3.5** | ☐ To Do | **Handle Panel Disposal:** In the `show...` methods, add the `onDidDispose` listener to the created panel to nullify the stored instance variable (e.g., `this.mainPanel = undefined`). | `src/webviewManager.ts` |
| **3.6** | ☐ To Do | **Update `ExtensionManager`:** Instantiate the `WebviewManager` in the `ExtensionManager`'s constructor. | `src/extensionManager.ts` |
| **3.7** | ☐ To Do | **Refactor `CommandManager`:** Change the `openMainPanel` and `openSettings` command callbacks to call `extensionManager.webviewManager.showMainPanel()` and `showSettingsPanel()` respectively. | `src/commandManager.ts` |

-----

### **New Document: tasklist\_sprint\_04.md**

# Task List: Sprint 4 - Communication & State Mgmt

**Goal:** To formalize the webview communication layer with a `MessageRouter` and centralize global state with a `StateManager`.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `StateManager.ts`:** Create the new file and a simple `StateManager` class. Add a private boolean `_isIndexing` and public `isIndexing()` getter and `setIndexing(state: boolean)` setter. | `src/stateManager.ts` (New) |
| **4.2** | ☐ To Do | **Create `MessageRouter.ts`:** Create the new file and the `MessageRouter` class. Its constructor will accept the `ExtensionManager` and `vscode.Webview`. | `src/messageRouter.ts` (New) |
| **4.3** | ☐ To Do | **Implement `routeMessage`:** Move the message handling `switch` statement into a private `async routeMessage` method in `MessageRouter`. | `src/messageRouter.ts` |
| **4.4** | ☐ To Do | **Integrate State Check:** In `routeMessage`, before the `startIndexing` case, add a check: `if (this.extensionManager.stateManager.isIndexing()) { ... post error message ... }`. | `src/messageRouter.ts` |
| **4.5** | ☐ To Do | **Update `IndexingService`:** Inject the `StateManager` instance into the `IndexingService`. Call `this.stateManager.setIndexing(true)` at the beginning of `startIndexing` and `false` in a `finally` block at the end. | `src/indexing/indexingService.ts` |
| **4.6** | ☐ To Do | **Instantiate `MessageRouter`:** In `WebviewManager`, when a panel is created, remove the old `onDidReceiveMessage` logic and replace it with `new MessageRouter(this.extensionManager, this.mainPanel.webview)`. | `src/webviewManager.ts` |
| **4.7** | ☐ To Do | **Instantiate `StateManager`:** In `ExtensionManager`, create a public instance of the `StateManager` so it can be accessed by other services. | `src/extensionManager.ts` |
| **4.8** | ☐ To Do | **Update Service Constructors:** Update the constructors of services (like `IndexingService`) that now need the `StateManager`, and update the instantiation logic in `ExtensionManager`. | `src/extensionManager.ts`, `src/indexing/indexingService.ts` |

This completes the full set of PRDs for the refactoring initiative. You now have a comprehensive plan to transform your extension's architecture into a more robust, maintainable, and scalable system.

</prd>

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
````

## File: docs/completed/extension2/prd.md
````markdown
<prd>Of course. Connecting the webview frontend to the main extension is a critical step. Based on your request and the existing codebase, I've created a series of PRDs to establish this communication layer robustly.

This plan focuses on creating a clean, decoupled architecture where `extension.ts` acts as an orchestrator, delegating specific responsibilities like webview management and message handling to dedicated classes.

-----

### **New Document: PRD 1: Foundational - Webview Panel Management**

**1. Title & Overview**

  * **Project:** Code Context Engine - Webview Management
  * **Summary:** This phase focuses on creating a centralized and reusable system for managing the lifecycle of the extension's webview panels. We will create a `WebviewManager` class responsible for creating, showing, and disposing of the main panel and any future panels (like settings). This will decouple all UI panel logic from the main `extension.ts` file.
  * **Dependencies:** The SvelteKit project must have a build process that outputs to the `webview/dist` directory.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Establish a stable and reliable foundation for the extension's user interface.
      * Improve developer efficiency by making the process of adding or managing UI panels predictable and straightforward.
  * **Developer & System Success Metrics:**
      * The `WebviewManager` successfully creates and displays the SvelteKit application within a VS Code panel.
      * All logic for reading `index.html` and rewriting asset paths with `asWebviewUri` is contained within the `WebviewManager`.
      * The extension can open the main panel via a command, and attempting to open it again simply reveals the existing panel.
      * The panel and its resources are properly disposed of when closed by the user or when the extension is deactivated.

-----

**3. User Personas**

  * **Frank (Frontend Developer):** Frank needs a consistent way for the extension to load his SvelteKit application. He shouldn't have to worry about the complexities of the VS Code API; he just needs his built application to be displayed correctly.
  * **Alisha (Backend Developer):** Alisha needs to trigger UI panels from commands. She wants a simple API call (e.g., `webviewManager.showMainPanel()`) to show the UI without needing to manage the panel's state or creation logic herself.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Webview** | **Sprint 1: Webview Panel Lifecycle** | As Alisha, I want a `WebviewManager` class to handle the creation and disposal of webview panels, so that UI logic is centralized and decoupled from `extension.ts`. | 1. A new `WebviewManager.ts` file and class are created.\<br/\>2. The class has a method `showMainPanel()` that creates a `vscode.WebviewPanel`.\<br/\>3. The manager ensures only one instance of the main panel can exist at a time.\<br/\>4. The manager correctly handles the `onDidDispose` event to clean up its reference to the panel. | **2 Weeks** |
| | | As Frank, I want the `WebviewManager` to correctly load the SvelteKit build output, so my application renders properly inside VS Code. | 1. The `WebviewManager` contains a private method to read the `index.html` from `webview/dist`.\<br/\>2. This method correctly replaces relative asset paths (e.g., `/_app/`) with the special `webview.asWebviewUri` format.\<br/\>3. The `showMainPanel()` method uses this helper to set the panel's HTML content. | |
| | | As a developer, I want the main panel command to be handled by the `CommandManager`, which delegates to the `WebviewManager`. | 1. The `CommandManager` has a command for `code-context-engine.openMainPanel`.\<br/\>2. The command's callback invokes `extensionManager.webviewManager.showMainPanel()`.\<br/\>3. The `extension.ts` file no longer contains any direct panel creation logic. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 2 Weeks
  * **Sprint 1:** Webview Panel Lifecycle & Content Loading (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The SvelteKit build output path (`webview/dist`) is stable and predictable.
  * **Risk:** Incorrectly rewriting the asset paths in `index.html` will cause the SvelteKit app to fail to load its CSS or JavaScript, resulting in a blank panel.
      * **Mitigation:** Create a robust regular expression to handle the path replacement and thoroughly test that all assets load correctly in the webview's developer tools.
  * **Risk:** Forgetting to handle the `onDidDispose` event will lead to memory leaks and buggy behavior where the extension thinks a panel is open when it isn't.
      * **Mitigation:** Ensure that the panel reference within the `WebviewManager` is set to `undefined` within the `onDidDispose` callback.

-----

### **New Document: PRD 2: Core - Bidirectional Message Passing**

**1. Title & Overview**

  * **Project:** Code Context Engine - Webview Communication Bridge
  * **Summary:** This phase focuses on establishing a robust, type-safe, and decoupled communication channel between the SvelteKit webview (frontend) and the extension host (backend). We will create a `MessageRouter` class on the backend and a `vscodeApi` client on the frontend to standardize how messages are sent and received.
  * **Dependencies:** PRD 1 must be complete. The `WebviewManager` must be able to successfully display the SvelteKit application.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Enable core application functionality by creating a reliable data channel between the UI and the backend logic.
      * Improve developer experience by providing a simple and predictable API for frontend-backend communication.
  * **Developer & System Success Metrics:**
      * A `MessageRouter` class successfully replaces the `switch` statement for message handling.
      * The frontend `vscodeApi` client can successfully send a message to the extension and receive a response.
      * A defined message structure (e.g., with `command`, `requestId`, `payload`) is used for all communication.
      * An end-to-end "ping-pong" test (UI sends "ping", backend responds with "pong") works correctly, validating the entire communication pipeline.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Comms** | **Sprint 2: Message Routing & API** | As a developer, I want a `MessageRouter` class in the backend to handle all incoming webview messages, so that communication logic is centralized and testable. | 1. A new `MessageRouter.ts` file and class are created.\<br/\>2. The `WebviewManager` instantiates the `MessageRouter` for each panel it creates, passing it the webview instance.\<br/\>3. The `onDidReceiveMessage` listener in `WebviewManager` delegates directly to the `MessageRouter`.\<br/\>4. The `MessageRouter` contains the `switch` logic to route commands to the appropriate services. | **2 Weeks** |
| | | As Frank, I want a `vscodeApi` client in my SvelteKit app to abstract away the `postMessage` API, so I can easily communicate with the extension. | 1. A `vscodeApi.ts` file is created in the `webview` project.\<br/\>2. It exports functions like `postMessage` and `onMessage` that wrap the native `acquireVsCodeApi()` methods.\<br/\>3. The client includes logic to handle request-response pairs using a `requestId`.\<br/\>4. Svelte components import and use this client instead of the global `vscode` API directly. | |
| | | As a developer, I want to implement a "ping" command to verify the communication bridge, so we can confirm the connection is working end-to-end. | 1. The Svelte UI has a test button that, when clicked, sends a `{ command: 'ping' }` message via the `vscodeApi` client.\<br/\>2. The `MessageRouter` has a `case` for "ping" that immediately sends back a `{ command: 'pong' }` message.\<br/\>3. The Svelte UI listens for the "pong" message and displays a success notification to the user. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 2 Weeks
  * **Sprint 2:** Message Routing & API Implementation (2 Weeks)

This completes the PRDs for establishing the connection between the webview and `extension.ts`. You now have a clear plan to build a robust and maintainable foundation for all UI-to-backend communication.</prd>

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
````

## File: docs/completed/fe/prd.md
````markdown
<prd>Here is the software engineering roadmap based on your detailed project description.

| # | Theme | Milestone & Description | Timeframe | Assigned Team | Status |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Backend Architecture** | **Develop C# Web API Foundation:** Build the initial ASP.NET Core Web API project, establishing the core service for the extension to communicate with. | Q1 2026 | Backend (C#) | Planned |
| 2 | **Backend Architecture** | **Implement Extensible Client Framework:** Use dependency injection and strategy patterns in C# to create abstract interfaces for various database clients and embedding providers. | Q1 2026 | Backend (C#) | Planned |
| 3 | **Extension Integration** | **Establish Extension-to-Backend Communication:** Implement logic in the TypeScript extension to manage (start/monitor) the C# backend process and communicate via local HTTP requests. | Q2 2026 | Frontend (TS/Svelte) | Not Started |
| 4 | **Onboarding & UI** | **Build Initial Setup & Indexing UI:** Create the Svelte UI that detects an un-indexed repository and presents the setup screen for database and embedding provider selection. | Q2 2026 | Frontend (TS/Svelte) | Not Started |
| 5 | **Core Functionality** | **Implement Qdrant & Ollama Clients:** Build the first concrete client implementations for the database (Qdrant) and embedding provider (Ollama) within the C# backend. | Q3 2026 | Backend (C#) | Not Started |
| 6 | **Onboarding & UI** | **Integrate Docker Helper Commands:** Connect the UI buttons to open a VS Code terminal and execute the required Docker commands for spinning up local databases. | Q3 2026 | Frontend (TS/Svelte) | Not Started |
| 7 | **Core Functionality** | **Develop End-to-End Indexing Workflow:** Connect the UI "Index" button to the C# API to trigger the full AST parsing, embedding, and vector storage process, showing progress in the UI. | Q4 2026 | Full Team | Not Started |
| 8 | **Core Functionality** | **Implement Core Query View:** Create the post-indexing UI with a simple input box for users to submit natural language queries to the C# backend for a response. | Q4 2026 | Full Team | Not Started |
| 9 | **Feature Enhancement** | **Build Settings Management & Re-Indexing:** Implement the settings (cog) icon functionality and the logic to trigger a full re-index when a user saves configuration changes. | Q1 2027 | Full Team | Not Started |

Of course. Let's continue with the detailed PRDs for the C\# backend and the UI onboarding, following the established roadmap.

-----

### **New Document: PRD 2: Backend Foundation - C\# Web API & Extensible Clients**

**1. Title & Overview**

  * **Project:** Code Context Engine - C\# Backend Foundation
  * **Summary:** This phase covers the creation of a robust, standalone C\# ASP.NET Core Web API. This backend service will handle all heavy lifting, including code parsing, vectorization, and database communication. The architecture will be designed for extensibility from day one, using dependency injection and abstract client interfaces to easily support various databases and embedding providers in the future.
  * **Dependencies:** Requires the .NET SDK and a C\# development environment (like VS Code with the C\# Dev Kit or Visual Studio).

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Decouple the core processing logic from the VS Code extension frontend, allowing for more robust and scalable development.
      * Create a flexible architecture that can adapt to new technologies (databases, embedding models) without significant refactoring.
  * **Developer & System Success Metrics:**
      * The C\# Web API project is successfully created and can be run locally.
      * A basic `/health` endpoint returns a `200 OK` status.
      * The service architecture correctly implements the strategy or factory pattern for database and embedding clients.
      * The solution includes separate class library projects for core logic, infrastructure, and the API, promoting clean architecture.
      * Unit tests are in place for the client abstraction layer.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** Alisha is responsible for building and maintaining the core indexing engine. She needs a well-structured, testable, and maintainable codebase that follows best practices for C\# development, such as dependency injection and clear separation of concerns.
  * **Devin (Developer - End User):** While Devin doesn't interact with this backend directly, he will benefit from its stability and performance. A well-architected backend ensures the indexing process is fast, reliable, and less prone to crashing.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Backend** | **Sprint 1: C\# Web API Boilerplate** | As Alisha, I want to create a new ASP.NET Core Web API project so we have the foundational service for our backend logic. | 1. A new .NET solution is created containing a Web API project.\<br/\>2. The API is configured to use minimal API syntax for endpoints.\<br/\>3. A basic `/health` endpoint is implemented that returns a success status.\<br/\>4. The project includes Swagger/OpenAPI support for API documentation and testing. | **2 Weeks** |
| | | As Alisha, I want to establish a clean architecture with separate projects for Core, Infrastructure, and API so that our codebase is organized and maintainable. | 1. The solution is organized into `CodeContext.Api`, `CodeContext.Core` (for domain logic/interfaces), and `CodeContext.Infrastructure` (for external clients).\<br/\>2. Project references are set up correctly (e.g., API depends on Core and Infrastructure).\<br/\>3. Basic folders and classes are created in each project to establish the structure. | |
| **Phase 2: Backend** | **Sprint 2: Extensible Client Framework** | As Alisha, I want to define abstract interfaces for database clients and embedding providers so we can easily add new implementations in the future. | 1. An `IEmbeddingProvider` interface with a `GenerateEmbeddingsAsync` method is created in `CodeContext.Core`.\<br/\>2. An `IVectorDatabaseClient` interface with `UpsertAsync` and `QueryAsync` methods is created in `CodeContext.Core`.\<br/\>3. These interfaces are agnostic of any specific technology (e.g., they use generic data types). | **2 Weeks** |
| | | As Alisha, I want to use dependency injection to register and resolve these clients so that the application is loosely coupled and testable. | 1. .NET's built-in dependency injection container is configured in `Program.cs`.\<br/\>2. A "factory" or "strategy" service is created that can resolve the correct client implementation based on a configuration string (e.g., "qdrant", "ollama").\<br/\>3. Unit tests are written to verify that the correct client is returned for a given configuration. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** C\# Web API Boilerplate (2 Weeks)
  * **Sprint 2:** Extensible Client Framework (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The development team is proficient in C\# and the .NET ecosystem.
  * **Risk:** Over-engineering the client framework. The initial design for the abstractions might be too complex for the immediate need.
      * **Mitigation:** Start with a simple interface and concrete implementation first (e.g., for Qdrant). Refactor to a more abstract factory pattern only when adding the second client (e.g., ChromaDB), following the rule of three.
  * **Risk:** Communication between the TypeScript extension and a C\# process can be complex to manage (e.g., starting, stopping, and handling errors).
      * **Mitigation:** This risk is primarily addressed in PRD 3, but in this phase, ensure the C\# API is simple and stateless (standard HTTP requests) to minimize integration complexity.

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - C\# Web API Boilerplate

**Goal:** To establish the foundational C\# ASP.NET Core Web API project with a clean architecture.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Create .NET Solution & Projects:** Use the `dotnet new` CLI to create a solution file (`CodeContext.sln`) and three projects: `webapi`, `classlib` (for Core), and `classlib` (for Infrastructure). | `(Project Root)` |
| **1.2** | ☐ To Do | **Set Project References:** Configure the `.csproj` files so that the API project references the Core and Infrastructure projects. | `CodeContext.Api/CodeContext.Api.csproj` |
| **1.3** | ☐ To Do | **Implement Health Check Endpoint:** In the `Program.cs` of the API project, add a minimal API endpoint for `/health` that returns `Results.Ok()`. | `CodeContext.Api/Program.cs` |
| **1.4** | ☐ To Do | **Add Swagger/OpenAPI:** Configure the API to use Swashbuckle for generating an OpenAPI specification and a Swagger UI. | `CodeContext.Api/Program.cs` |
| **1.5** | ☐ To Do | **Define Core Interfaces:** In the Core project, create initial placeholder interfaces (`IEmbeddingProvider.cs`, `IVectorDatabaseClient.cs`). | `CodeContext.Core/` |
| **1.6** | ☐ To Do | **Define Infrastructure Placeholders:** In the Infrastructure project, create initial placeholder folders for `DatabaseClients` and `EmbeddingProviders`. | `CodeContext.Infrastructure/` |
| **1.7** | ☐ To Do | **Test API Launch:** Run the API project and ensure it starts correctly, and that you can access the `/health` endpoint and the `/swagger` UI in a browser. | `(Local Environment)` |

-----

### **New Document: PRD 3: VS Code Integration & UI Onboarding**

**1. Title & Overview**

  * **Project:** Code Context Engine - VS Code Integration & Onboarding
  * **Summary:** This phase focuses on the user's first experience. It involves building the Svelte UI for the initial setup and creating the TypeScript logic within the VS Code extension to manage the C\# backend process. This includes detecting when a repository hasn't been indexed, guiding the user through database and embedding model selection, and providing helper buttons to run Docker commands.
  * **Dependencies:** PRD 1 and PRD 2 must be complete. The C\# backend must be buildable and runnable from the command line.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Create a smooth and intuitive onboarding experience to maximize user activation.
      * Abstract away technical complexity (like running Docker) to make the tool accessible to a wider range of developers.
  * **Developer & System Success Metrics:**
      * The TypeScript extension can successfully spawn the C\# backend as a child process.
      * The extension can reliably check the health of the C\# backend by polling the `/health` endpoint.
      * The Svelte UI correctly displays the setup screen when no index configuration is found.
      * Clicking the "Start Database" button in the UI successfully opens a new VS Code terminal and runs the `docker-compose up` command.
      * The UI state updates correctly to show that the database is "running" after a successful health check.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 3: Integration & UI** | **Sprint 3: Backend Process Management** | As a developer, I want the VS Code extension to automatically start the C\# backend service when the extension is activated, so I don't have to run it manually. | 1. The extension uses Node.js's `child_process.spawn` to launch the compiled C\# executable.\<br/\>2. The extension correctly captures `stdout` and `stderr` from the C\# process for logging.\<br/\>3. The child process is automatically terminated when the extension is deactivated or VS Code is closed. | **2 Weeks** |
| | | As a developer, I want the extension to monitor the health of the C\# backend service so it can reliably send API requests. | 1. The extension periodically sends an HTTP GET request to the backend's `/health` endpoint.\<br/\>2. The UI state reflects whether the backend is "Starting", "Running", or "Error".\<br/\>3. If the health check fails multiple times, the process is restarted. | |
| **Phase 3: Integration & UI** | **Sprint 4: Onboarding & Setup UI** | As Devin, when I open a new project, I want the extension to check if it's been indexed and show me a setup screen if it hasn't. | 1. On activation, the extension looks for the `code-context.json` file in the `.vscode` directory.\<br/\>2. If the file is not found, the main webview panel displays the "Setup" component.\<br/\>3. If the file is found, the main webview panel displays the "Query" component (to be built later). | **2 Weeks** |
| | | As Devin, I want the setup screen to let me choose my database and embedding provider, with helper buttons to start any required local services. | 1. The UI presents dropdowns for selecting a database (Qdrant, etc.) and embedding provider (Ollama, etc.).\<br/\>2. A button next to the database selection ("Start Local Qdrant") is present.\<br/\>3. Clicking the button creates a new VS Code terminal and runs the appropriate `docker-compose` command.\<br/\>4. The UI shows a success indicator once the service is confirmed to be running via a health check. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 3:** Backend Process Management (2 Weeks)
  * **Sprint 4:** Onboarding & Setup UI (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The C\# backend executable can be reliably located and run from the TypeScript extension across different operating systems (Windows, macOS, Linux).
  * **Risk:** Managing the lifecycle of the child C\# process could be buggy, leading to orphaned processes that consume system resources.
      * **Mitigation:** Implement robust error handling and ensure the process is always killed in the `deactivate` function of the extension. Use libraries like `tree-kill` if necessary to ensure the entire process tree is terminated.
  * **Risk:** The user may not have Docker installed or running, causing the helper commands to fail.
      * **Mitigation:** Provide clear error messages in the UI and terminal. The UI should check for the `docker` command on the system's PATH and disable the button with a helpful tooltip if it's not found.

Of course. Here are the final PRDs and their associated task lists, completing the project roadmap.

-----

### **New Document: PRD 4: Core Functionality - End-to-End Indexing & Querying**

**1. Title & Overview**

  * **Project:** Code Context Engine - Core Functionality Implementation
  * **Summary:** This phase is about bringing the core user journey to life. It involves implementing the first concrete clients for Qdrant and Ollama within the C\# backend. We will then connect the UI to the backend to create a seamless, end-to-end indexing workflow. Finally, we will build the initial chat/query interface, allowing users to ask their first questions and receive contextually relevant answers from their indexed codebase.
  * **Dependencies:** PRD 3 must be complete. The extension must be able to manage the C\# backend process and display the initial setup UI.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Deliver the "Aha\!" moment for the user by providing the first tangible results from their indexed code.
      * Validate the end-to-end architecture, from UI interaction to backend processing and back.
  * **Developer & System Success Metrics:**
      * The C\# backend can successfully generate embeddings using a local Ollama instance and store them in a local Qdrant database.
      * The `IndexingService` in the C\# backend correctly orchestrates the full pipeline: AST parsing, embedding, and database upserting.
      * The UI's "Index Now" button successfully triggers the indexing process via an API call to the C\# backend.
      * The UI displays a real-time progress bar that accurately reflects the status sent from the backend.
      * A user can type a query into the main chat box, and the extension will return a list of relevant file paths based on a vector search.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin has just completed the initial setup. He now wants to see the extension in action. He needs a simple interface to start the indexing, see that it's working, and then ask a basic question to see if the tool can find relevant code for him.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 4: Core Functionality** | **Sprint 5: Concrete Client Implementation (C\#)** | As Alisha, I want to implement the concrete client for Qdrant so that the backend can communicate with the vector database. | 1. A `QdrantClient` class is created in the Infrastructure project that implements `IVectorDatabaseClient`.\<br/\>2. The client correctly connects to the Qdrant instance specified in the configuration.\<br/\>3. The `UpsertAsync` method successfully saves vectors and their payloads to the database. | **2 Weeks** |
| | | As Alisha, I want to implement the concrete client for Ollama so that the backend can generate embeddings. | 1. An `OllamaProvider` class is created that implements `IEmbeddingProvider`.\<br/\>2. The provider makes successful HTTP POST requests to a local Ollama `/api/embeddings` endpoint.\<br/\>3. The class correctly parses the response to extract the embedding vectors.\<br/\>4. The implementation is registered with the dependency injection container. | |
| **Phase 4: Core Functionality** | **Sprint 6: End-to-End Indexing & Query UI** | As Devin, I want to click the "Index Now" button and see a progress bar while my code is being indexed so I have clear feedback on the process. | 1. Clicking the "Index Now" button in the Svelte UI sends a `POST /index` request to the C\# backend.\<br/\>2. The backend streams progress updates (e.g., via Server-Sent Events or WebSockets) back to the UI.\<br/\>3. The Fluent UI progress bar in the Svelte component updates based on the events received from the backend.\<br/\>4. The UI transitions to the "Query" view upon receiving a "completed" event. | **2 Weeks** |
| | | As Devin, after indexing is complete, I want to see a chat input box where I can type a question to find relevant code. | 1. A new "Query" Svelte component is created, featuring a text input and a submit button.\<br/\>2. Typing a query and hitting Enter sends a `POST /query` request to the C\# backend with the query text.\<br/\>3. The backend performs a vector search using the query and returns a list of file paths.\<br/\>4. The UI displays the returned file paths as a simple list. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 5:** Concrete Client Implementation (C\#) (2 Weeks)
  * **Sprint 6:** End-to-End Indexing & Query UI (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The selected Ollama embedding model provides sufficiently accurate embeddings for code to yield relevant search results.
  * **Risk:** The real-time progress update mechanism (e.g., SSE or WebSockets) could be complex to implement between the C\# backend and the VS Code webview.
      * **Mitigation:** Start with a simpler polling mechanism if a streaming approach proves too difficult. The frontend can poll a `/index/status` endpoint on the backend every few seconds to get the progress.
  * **Risk:** The performance of the end-to-end indexing on a large repository might be slow, leading to a poor user experience.
      * **Mitigation:** Focus on optimizing the "hot path" in the C\# backend—specifically, batching requests to the embedding provider and the database client to improve throughput.

-----

### **New Document: tasklist\_sprint\_05.md**

# Task List: Sprint 5 - Concrete Client Implementation (C\#)

**Goal:** To build the first concrete implementations for the database and embedding provider clients in the C\# backend.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **5.1** | ☐ To Do | **Add Qdrant.Client NuGet Package:** Install the official Qdrant .NET client library into the `CodeContext.Infrastructure` project. | `CodeContext.Infrastructure/CodeContext.Infrastructure.csproj` |
| **5.2** | ☐ To Do | **Implement `QdrantClient` Class:** Create the class that implements `IVectorDatabaseClient`. Implement the `UpsertAsync` method using the NuGet package's API. | `CodeContext.Infrastructure/DatabaseClients/QdrantClient.cs` |
| **5.3** | ☐ To Do | **Implement `OllamaProvider` Class:** Create the class that implements `IEmbeddingProvider`. Use `HttpClient` to send requests to the Ollama API. | `CodeContext.Infrastructure/EmbeddingProviders/OllamaProvider.cs` |
| **5.4** | ☐ To Do | **Add AST Parsing Logic:** Integrate a C\# AST parsing library (e.g., Roslyn for C\#, a community library for others) into a new `ParsingService`. | `CodeContext.Core/Services/ParsingService.cs` |
| **5.5** | ☐ To Do | **Create `IndexingService`:** Build the main service in `CodeContext.Core` that orchestrates the workflow: takes file paths, calls the `ParsingService`, the `IEmbeddingProvider`, and the `IVectorDatabaseClient`. | `CodeContext.Core/Services/IndexingService.cs` |
| **5.6** | ☐ To Do | **Register Services with DI:** In the API project's `Program.cs`, register all new services and clients with the dependency injection container. | `CodeContext.Api/Program.cs` |
| **5.7** | ☐ To Do | **Create `/index` Endpoint:** Create the initial API endpoint that will trigger the `IndexingService`. | `CodeContext.Api/Program.cs` |

-----

### **New Document: PRD 5: Feature Enhancement & Polish**

**1. Title & Overview**

  * **Project:** Code Context Engine - Settings & Release Readiness
  * **Summary:** This final phase focuses on polishing the user experience and preparing the extension for its first public release. It involves building the settings management UI, enabling users to change their configuration and trigger a re-index. It also includes creating essential user and contributor documentation and establishing a CI/CD pipeline to automate builds and deployments to the marketplace.
  * **Dependencies:** PRD 4 must be complete. The core indexing and querying loop must be functional.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Increase user trust and adoption through a professional and polished user experience.
      * Ensure the long-term maintainability and scalability of the project by automating the release process.
  * **Developer & System Success Metrics:**
      * The settings UI correctly reads from and writes to the extension's configuration.
      * Saving a new configuration (e.g., changing the embedding model) successfully triggers the re-indexing workflow.
      * A GitHub Actions workflow is in place that automatically builds and tests the extension on every pull request.
      * The extension is successfully published to the VS Code Marketplace via an automated pipeline.
      * The project's `README.md` provides clear instructions for installation and use.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 5: Polish** | **Sprint 7: Settings Management & Re-Indexing** | As Devin, I want a settings icon in the UI so I can go back and change my database or embedding provider at any time. | 1. A "cog" icon is added to the main UI panel.\<br/\>2. Clicking the icon navigates the webview to the "Setup" component, pre-filled with the current configuration.\<br/\>3. The current configuration is read from the `code-context.json` file. | **2 Weeks** |
| | | As Devin, when I save a change in the settings, I want the extension to automatically re-index my project so that my changes take effect. | 1. The "Save" button in the settings UI is relabeled "Save & Re-Index".\<br/\>2. Clicking the button first saves the new configuration to `code-context.json`.\<br/\>3. After saving, the extension automatically triggers the end-to-end indexing process.\<br/\>4. The UI displays the progress bar, and transitions back to the query view on completion. | |
| **Phase 5: Polish** | **Sprint 8: Documentation & Publishing** | As a project owner, I want a CI/CD pipeline to automate builds and testing so we can ensure code quality and release reliability. | 1. A GitHub Actions workflow is created to run on every pull request.\<br/\>2. The workflow includes steps to build the C\# backend and the SvelteKit frontend.\<br/\>3. The workflow runs all unit tests for both the backend and frontend.\<br/\>4. A separate, manually triggered "release" workflow is created to publish the extension. | **2 Weeks** |
| | | As Devin, I want clear documentation in the `README.md` file so I can easily understand how to install and use the extension. | 1. The `README.md` is updated with sections for "Features", "Installation", "Configuration", and a "Quick Start" guide.\<br/\>2. A short animated GIF is created to demonstrate the primary user workflow.\<br/\>3. A `CONTRIBUTING.md` file is added to guide potential contributors. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 7:** Settings Management & Re-Indexing (2 Weeks)
  * **Sprint 8:** Documentation & Publishing (2 Weeks)

-----

### **New Document: tasklist\_sprint\_06.md**

# Task List: Sprint 6 - End-to-End Indexing & Query UI

**Goal:** To connect the frontend and backend to create the core indexing and querying user workflows.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **6.1** | ☐ To Do | **Implement Progress Reporting:** In the C\# `IndexingService`, implement a mechanism (e.g., a callback or event bus) to report progress updates. | `CodeContext.Core/Services/IndexingService.cs` |
| **6.2** | ☐ To Do | **Create Progress Endpoint:** Expose progress updates via a WebSocket or Server-Sent Events (SSE) endpoint in the C\# API. | `CodeContext.Api/Program.cs` |
| **6.3** | ☐ To Do | **Connect UI to Progress Endpoint:** In the SvelteKit UI, connect to the progress endpoint after triggering an index and update the progress bar component. | `webview/src/lib/components/IndexingView.svelte` |
| **6.4** | ☐ To Do | **Create Query View Component:** Build the `QueryView.svelte` component with a text input for questions and an area to display results. | `webview/src/lib/components/QueryView.svelte` |
| **6.5** | ☐ To Do | **Implement `/query` Endpoint in C\#:** Create the API endpoint that takes a query string, generates an embedding for it, and uses the `IVectorDatabaseClient` to perform a similarity search. | `CodeContext.Api/Program.cs` |
| **6.6** | ☐ To Do | **Connect UI to `/query` Endpoint:** When the user submits a query in the UI, make a `POST` request to the `/query` endpoint and display the returned file paths. | `webview/src/lib/components/QueryView.svelte` |
| **6.7** | ☐ To Do | **Implement UI State Transition:** Manage the application's state to correctly switch from the `IndexingView` to the `QueryView` upon successful completion. | `webview/src/lib/stores/viewStore.ts` |

This completes the full set of Product Requirements Documents and their associated task lists for your project. You now have a comprehensive, strategic plan that takes you from the initial architectural decisions all the way to a polished, publishable VS Code extension.

Of course. Let's continue with the remaining PRDs and task lists to complete the UI/UX development plan for your extension.

-----

### **New Document: PRD 2: UI/UX - Indexing Progress View**

**1. Title & Overview**

  * **Project:** Code Context Engine - Indexing Progress UI
  * **Summary:** This phase is dedicated to building the UI that provides users with clear, real-time feedback while their repository is being indexed. A well-executed progress view is crucial for user trust, as it communicates that the extension is working and prevents the perception of it being frozen or broken during a potentially long-running task.
  * **Dependencies:** PRD 1 (Onboarding & Setup UI) must be complete. The C\# backend must provide an endpoint (either WebSocket or SSE) that streams progress updates.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Improve user retention during the initial, critical indexing phase by providing a transparent and informative experience.
      * Reduce user friction and prevent premature cancellation of the indexing process.
  * **User Success Metrics:**
      * The progress bar accurately reflects the real-world progress of the indexing job with less than a 5% margin of error.
      * The status text updates clearly, informing the user of the current stage (e.g., "Parsing files", "Generating embeddings").
      * User-initiated cancellations of the indexing process are below 10%.

-----

**3. User Personas**

  * **Devin (Developer - End User):** After clicking "Index Now," Devin expects immediate feedback. He wants to see that the process has started and get a reasonable estimate of how long it might take. Clear progress indicators give him the confidence to let the extension run while he works on other things.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Progress UI** | **Sprint 2: Progress View Implementation** | As Devin, after starting the indexing, I want to see a dedicated view with a progress bar so I know that the process is running. | 1. After the "startIndexing" message is sent, the webview immediately transitions to the `IndexingProgressView` component.\<br/\>2. A Fluent UI `<ProgressBar>` is prominently displayed.\<br/\>3. A text label below the bar shows the current percentage and a status message (e.g., "0% - Initializing..."). | **2 Weeks** |
| | | As Devin, I want the progress bar and status text to update in real-time as the indexing proceeds through different stages. | 1. The SvelteKit frontend successfully establishes a connection to the backend's progress streaming endpoint.\<br/\>2. The progress bar's value is reactively bound to the percentage received from the backend.\<br/\>3. The status text updates to reflect the messages sent from the backend (e.g., file names, current stage).\<br/\>4. The UI gracefully handles a dropped connection and attempts to reconnect. | |
| | | As Devin, I want the view to automatically switch to the main query interface once the indexing is complete. | 1. Upon receiving a "completed" event from the backend, the progress bar fills to 100%.\<br/\>2. A "Complete" message is briefly displayed.\<br/\>3. After a short delay (e.g., 1-2 seconds), the application state changes, and the `QueryView` component is rendered. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 2 Weeks
  * **Sprint 2:** Progress View Implementation (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The backend can provide reasonably accurate progress percentages. If the backend can only provide status messages, the progress bar might need to be an indeterminate one.
  * **Risk:** A WebSocket or SSE connection between the VS Code webview and a local C\# process might be blocked by local firewall or security software.
      * **Mitigation:** Provide a fallback mechanism where the UI polls a standard HTTP endpoint (`GET /index/status`) every few seconds. This is less efficient but more reliable.
  * **Risk:** The UI might become unresponsive if it receives a very high frequency of progress updates from the backend.
      * **Mitigation:** Implement throttling or debouncing on the frontend to ensure the UI only re-renders at a reasonable interval (e.g., every 100-200ms).

-----

### **New Document: Sub-Sprint 3: Backend Connection for Progress Updates**

**Objective:**
To establish the communication channel from the SvelteKit frontend to the C\# backend to receive real-time progress events.

**Parent Sprint:**
PRD 2, Sprint 2: Progress View Implementation

**Tasks:**

1.  **Choose Streaming Technology:** Decide on the technology for real-time updates (WebSockets are a good choice for this).
2.  **Implement WebSocket Client:** In the SvelteKit app, create a service that connects to the C\# backend's WebSocket endpoint when the indexing view is loaded.
3.  **Create Progress Store:** Implement a new Svelte store (`progressStore.ts`) to hold the current percentage and status message.
4.  **Update Store on Message:** The WebSocket client, upon receiving a message from the backend, will parse the data and update the `progressStore`.

**Acceptance Criteria:**

  * The frontend successfully connects to the backend's WebSocket server.
  * Messages sent from the backend are correctly received and logged in the frontend's developer console.
  * The `progressStore` is accurately updated with the received data.

**Dependencies:**

  * The C\# backend must have a WebSocket or SSE endpoint that broadcasts progress.

**Timeline:**

  * **Start Date:** 2026-01-19
  * **End Date:** 2026-01-23

-----

### **New Document: Sub-Sprint 4: Svelte Progress UI Component**

**Objective:**
To build the user-facing Svelte component that displays the indexing progress.

**Parent Sprint:**
PRD 2, Sprint 2: Progress View Implementation

**Tasks:**

1.  **Create `IndexingProgressView.svelte`:** Build the main component for this view.
2.  **Add Fluent UI ProgressBar:** Integrate and style the `<ProgressBar>` component.
3.  **Subscribe to Progress Store:** In the component's script, subscribe to the `progressStore` to get live updates.
4.  **Bind UI to Store:** Reactively bind the `value` of the progress bar and the content of the status text label to the data from the store.
5.  **Implement Completion Logic:** Use a reactive statement (`$:`) to watch for when the progress percentage reaches 100, then trigger a state change to navigate to the query view.

**Acceptance Criteria:**

  * The progress bar visually updates as the value in the store changes.
  * The status text correctly displays the message from the store.
  * When progress hits 100, the UI automatically transitions to the next view.

**Dependencies:**

  * Sub-Sprint 3 must be complete.

**Timeline:**

  * **Start Date:** 2026-01-26
  * **End Date:** 2026-01-30

-----

### **New Document: tasklist\_sprint\_02.md**

# Task List: Sprint 2 - Progress View Implementation

**Goal:** To build the UI for displaying real-time indexing progress to the user.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Install WebSocket client library:** Add a library like `socket.io-client` or use the native browser `WebSocket` API. | `webview/package.json` |
| **2.2** | ☐ To Do | **Create `progressStore.ts`:** Define a new Svelte store with `percentage` and `message` properties. | `webview/src/lib/stores/progressStore.ts` |
| **2.3** | ☐ To Do | **Create `ProgressService.ts`:** Implement the client-side logic to connect to the backend WebSocket and update the `progressStore`. | `webview/src/lib/services/ProgressService.ts` |
| **2.4** | ☐ To Do | **Build `IndexingProgressView.svelte` component:** Add the Fluent UI progress bar and text labels. | `webview/src/lib/views/IndexingProgressView.svelte` |
| **2.5** | ☐ To Do | **Connect Component to Store:** In the Svelte component, import and subscribe to the `progressStore`. | `webview/src/lib/views/IndexingProgressView.svelte` |
| **2.6** | ☐ To Do | **Implement UI Bindings:** Bind the `value` of the progress bar and the text content of the label to the store's reactive variables. | `webview/src/lib/views/IndexingProgressView.svelte` |
| **2.7** | ☐ To Do | **Implement View Transition Logic:** In the main view manager, listen for the "completion" state and switch the visible component to the `QueryView`. | `webview/src/lib/ViewManager.svelte` |
| **2.8** | ☐ To Do | **Test with Mock Backend:** Create a mock backend service that sends simulated progress updates to test the UI in isolation. | `webview/src/lib/mocks/mockProgressService.ts` |

-----

### **New Document: PRD 3: UI/UX - Main Query & Results View**

**1. Title & Overview**

  * **Project:** Code Context Engine - Main Query Interface
  * **Summary:** This phase covers the development of the primary user interface where developers will interact with the indexed codebase. The design will focus on simplicity and efficiency, providing a clean, chat-like experience for asking questions and receiving results. This view is the core of the product's day-to-day value.
  * **Dependencies:** The indexing process must be complete, and the C\# backend must expose a `/query` endpoint.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Drive daily active usage by providing a powerful and easy-to-use interface for code discovery.
      * Clearly demonstrate the value of the indexing process by providing fast, relevant search results.
  * **User Success Metrics:**
      * The time from submitting a query to seeing the first result is less than 2 seconds.
      * The UI for displaying results is clear and allows users to easily identify and navigate to the relevant files.
      * The settings icon is easily discoverable, allowing users to return to the configuration view when needed.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 3: Query UI** | **Sprint 3: Query & Results Implementation** | As Devin, after my project is indexed, I want to see a simple text box where I can type my question, so I can start searching immediately. | 1. The `QueryView` component is displayed after indexing is complete.\<br/\>2. A Fluent UI `<TextField>` is shown at the bottom of the view, styled like a chat input.\<br/\>3. A "Submit" button or icon is present, and pressing "Enter" also triggers a submission. | **2 Weeks** |
| | | As Devin, when I submit a query, I want to see the list of relevant files returned by the engine, so I can find the code I'm looking for. | 1. Submitting a query sends a `POST` request to the C\# backend's `/query` endpoint.\<br/\>2. While waiting for a response, a loading indicator is displayed.\<br/\>3. The returned list of file paths is displayed in a clean, scrollable list in the main view area.\<br/\>4. Each file path is a clickable link that opens the corresponding file in a new VS Code editor tab. | |
| | | As Devin, I want to be able to easily access the settings to re-configure my project, so I can change the embedding model or database later. | 1. A "cog" icon is displayed in the top-right corner of the view.\<br/\>2. Clicking the icon navigates the user back to the `SetupView` component.\<br/\>3. The `SetupView` is pre-populated with the project's current, saved configuration. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 2 Weeks
  * **Sprint 3:** Query & Results Implementation (2 Weeks)

This completes the full set of Product Requirements Documents and associated task lists for the UI/UX of your extension. You now have a comprehensive plan covering the entire frontend user journey, from initial setup to actively querying the codebase.
</prd>
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
````

## File: docs/completed/logging/prd.md
````markdown
<prd>### PRD 1: Foundational - Centralized Logging & Notifications

**1\. Title & Overview**

- **Project:** Code Context Engine - Centralized Logging & Notifications
    
- **Summary:** This foundational phase focuses on implementing a robust, centralized logging service and a standardized user notification system. The goal is to capture all application events, errors, and warnings in a single, accessible location (a dedicated VS Code Output Channel and log files) and to present user-facing errors in a consistent, helpful manner. This will replace all scattered `console.log` and direct `vscode.window.showErrorMessage` calls.
    
- **Dependencies:** This project will modify most existing services (`IndexingService`, `ContextService`, `MessageRouter`, etc.) to integrate with the new logging and notification services.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Drastically reduce the time required to diagnose user-reported issues.
        
    - Improve user trust by providing clear, actionable error messages.
        
    - Establish a stable foundation for future monitoring and diagnostics features.
        
- **Developer & System Success Metrics:**
    
    - All backend service logs (info, warn, error) are successfully routed to a single "Code Context Engine" Output Channel.
        
    - Critical errors are automatically written to a log file in the workspace's `.vscode` directory.
        
    - All user-facing error messages are displayed through the new `NotificationService` and include a "View Logs" button.
        
    - The extension's log level can be controlled via a new setting in `package.json`.
        

**3\. User Personas**

- **Alisha (Backend Developer):** When a user reports a bug, Alisha currently has no centralized place to look for logs. She needs a single Output Channel and persistent log files to trace the execution flow and identify the root cause of an error quickly.
    
- **Devin (Developer - End User):** When an operation like indexing fails, Devin sees a generic error message with no context. He needs a clear notification that tells him what went wrong and gives him an easy way to access detailed logs to either fix the issue himself or report it effectively.
    

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

**Phase 1: Foundation**

 | 

**Sprint 1: Centralized Logging Service**

 | 

As Alisha, I want a `CentralizedLoggingService` so that all backend logs are routed to a single, consistent location.

 | 

1\. A new `CentralizedLoggingService.ts` is created. <br> 2. The service creates a dedicated "Code Context Engine" Output Channel in VS Code. <br> 3. The service provides methods for different log levels (`info`, `warn`, `error`, `debug`). <br> 4. All existing `console.log` and `console.error` calls in the backend are replaced with calls to the new service. <br> 5. A new setting in `package.json` allows users to control the log verbosity (e.g., "Info", "Debug").

 | 

**2 Weeks**

 |
| 

**Phase 1: Foundation**

 | 

**Sprint 2: User Notification Service**

 | 

As Devin, I want to receive clear, consistent, and actionable error notifications so that I can understand and resolve problems.

 | 

1\. A new `NotificationService.ts` is created. <br> 2. The service provides standardized methods for showing info, warning, and error messages. <br> 3. The `showError` method automatically includes a "View Logs" action button. <br> 4. Clicking "View Logs" opens the "Code Context Engine" Output Channel. <br> 5. All direct `vscode.window.show...Message` calls are replaced with calls to the new service.

 | 

**2 Weeks**

 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 4 Weeks
    
- **Sprint 1:** Centralized Logging Service (2 Weeks)
    
- **Sprint 2:** User Notification Service (2 Weeks)
    

**6\. Risks & Assumptions**

- **Assumption:** The performance impact of routing all logs through a central service will be negligible.
    
- **Risk:** Improperly replacing existing logging calls could lead to loss of important debug information.
    
    - **Mitigation:** Conduct a thorough search-and-replace across the entire codebase. Initially set the default log level to "Debug" to ensure no information is lost during the transition.
        
- **Risk:** Writing log files to the workspace could be problematic in restricted environments or conflict with workspace settings.
    
    - **Mitigation:** The log file path will be configurable. The feature will gracefully handle file-writing errors by falling back to only using the Output Channel.
    
    
    
    ### Sub-Sprint 1: Implement Centralized Logging Service

**Objective:** To create the `CentralizedLoggingService`, integrate it into the `ExtensionManager`, and replace all existing `console.log` calls with the new service.

**Parent Sprint:** PRD 1, Sprint 1: Centralized Logging Service

**Tasks:**

1. **Create `CentralizedLoggingService.ts`:** Develop the new class with a constructor that creates a `vscode.OutputChannel`.
    
2. **Implement Log Levels:** Create public methods (`info`, `warn`, `error`, `debug`) that format messages with a timestamp and log level before writing to the output channel.
    
3. **Add Log Level Setting:** In `package.json`, add a new configuration property `code-context-engine.logging.level` with an `enum` for the different levels.
    
4. **Read Log Level:** The `CentralizedLoggingService` should read this setting to determine which log messages to display.
    
5. **Integrate with `ExtensionManager`:** Instantiate the `CentralizedLoggingService` in the `ExtensionManager` and pass its instance to all other services that require logging.
    
6. **Refactor Existing Logs:** Systematically search the codebase for `console.log`, `console.warn`, and `console.error` and replace them with calls to the new logging service.
    

**Acceptance Criteria:**

- Logs from all backend services appear in the "Code Context Engine" Output Channel.
    
- Changing the log level in the settings correctly filters the visible logs.
    
- No `console.log` calls remain in the extension's backend TypeScript files.
    

**Dependencies:**

- A functional `ExtensionManager` for service instantiation.
    

**Timeline:**

- **Start Date:** 2025-08-27
    
- **End Date:** 2025-09-02
    

### Sub-Sprint 2: Implement User Notification Service

**Objective:** To create a standardized `NotificationService` for displaying user-facing messages and refactor all existing notifications to use it.

**Parent Sprint:** PRD 1, Sprint 2: User Notification Service

**Tasks:**

1. **Create `NotificationService.ts`:** Develop the new class. It should depend on the `CentralizedLoggingService` to automatically log any message it displays.
    
2. **Implement Notification Methods:** Create public methods like `showInfo`, `showWarning`, and `showError` that wrap the corresponding `vscode.window.show...Message` functions.
    
3. **Add "View Logs" Action:** The `showError` method must be implemented to always include a "View Logs" action item in the notification.
    
4. **Implement Action Handler:** When the "View Logs" button is clicked, the service should call the `show()` method on the `CentralizedLoggingService`'s output channel.
    
5. **Integrate with `ExtensionManager`:** Instantiate the `NotificationService` in the `ExtensionManager` and pass its instance to any service that needs to show notifications.
    
6. **Refactor Existing Notifications:** Systematically search the codebase for `vscode.window.show...Message` and replace these calls with the new `NotificationService`.
    

**Acceptance Criteria:**

- All user-facing notifications are displayed via the `NotificationService`.
    
- All error notifications consistently display a "View Logs" button.
    
- Clicking the "View Logs" button successfully opens the correct Output Channel.
    

**Dependencies:**

- Sub-Sprint 1 must be complete.
    

**Timeline:**

- **Start Date:** 2025-09-03
    
- **End Date:** 2025-09-09</prd>
````

## File: docs/completed/m-improv2/prd.md
````markdown
<prd>Excellent. This is a clear and well-defined set of remaining tasks. Based on this, I've consolidated the work into a series of sequential PRDs designed to first stabilize the architecture and then build the remaining user-facing features on that solid foundation.

Here is the first PRD, which focuses on the critical backend refactoring.

-----

### **New Document: PRD 1: Foundational - Backend Decoupling & Refactoring**

**1. Title & Overview**

  * **Project:** Code Context Engine - Backend Refactoring
  * **Summary:** This phase addresses critical technical debt in the extension's backend. We will refactor the core services to use Dependency Injection (DI) for managing dependencies and centralize configuration handling. We will also begin decoupling the monolithic `extension.ts` file by creating dedicated managers for commands and overall extension lifecycle, establishing a more scalable and testable architecture.
  * **Dependencies:** Requires the existing codebase to be stable and all current features to be functional.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Increase development velocity for future features by creating a more maintainable and understandable codebase.
      * Improve the overall stability and reliability of the extension by reducing tight coupling and side effects.
  * **Developer & System Success Metrics:**
      * Core services (`IndexingService`, `ContextService`, etc.) no longer instantiate their own dependencies.
      * Configuration is read from a single, centralized source and passed to services.
      * Unit test coverage for core services increases by at least 50%, as they can now be tested in isolation with mocked dependencies.
      * The `extension.ts` file is significantly smaller, with its primary responsibilities delegated to new manager classes.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** Alisha needs to add new features and fix bugs efficiently. A decoupled architecture allows her to work on individual components without understanding the entire system and to write reliable unit tests for her changes.
  * **Devin (Developer - End User):** While this is a backend refactor, Devin will benefit from the increased stability and faster feature development that results from a cleaner codebase.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Refactoring** | **Sprint 1: Dependency & Config Mgmt** | As Alisha, I want to refactor services to receive dependencies via their constructor so I can unit test them with mocks. | 1. `IndexingService` and `ContextService` constructors are updated to accept dependencies like `QdrantService` and `IEmbeddingProvider`.\<br/\>2. The services no longer use the `new` keyword to create their own dependencies.\<br/\>3. Existing unit tests are updated, and new tests are added to verify service logic with mocked dependencies. | **2 Weeks** |
| | | As Alisha, I want to create a central configuration service so that settings are managed in one place. | 1. A new `ConfigService` is created that reads all settings from `vscode.workspace.getConfiguration()` on startup.\<br/\>2. Services that require configuration (e.g., `QdrantService`) receive the necessary values (like a connection string) via their constructor.\<br/\>3. Services no longer call `vscode.workspace.getConfiguration()` directly. | |
| **Phase 1: Refactoring** | **Sprint 2: Lifecycle & Command Mgmt** | As Alisha, I want to introduce an `ExtensionManager` to handle the extension's lifecycle so that `extension.ts` becomes a simple entry point. | 1. A new `ExtensionManager` class is created to manage the initialization and disposal of all services and managers.\<br/\>2. The `activate` function in `extension.ts` is reduced to creating and initializing the `ExtensionManager`.\<br/\>3. The `deactivate` function calls a `dispose` method on the `ExtensionManager`. | **2 Weeks** |
| | | As Alisha, I want to create a `CommandManager` to handle all command registrations so that this logic is decoupled from the main activation file. | 1. A new `CommandManager` class is created.\<br/\>2. All `vscode.commands.registerCommand` calls are moved from `extension.ts` into the `CommandManager`.\<br/\>3. The `CommandManager` delegates the command's execution logic to the appropriate service (e.g., `IndexingService.startIndexing`).\<br/\>4. The `ExtensionManager` is responsible for creating and initializing the `CommandManager`. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** Dependency & Configuration Management (2 Weeks)
  * **Sprint 2:** Lifecycle & Command Management (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The current feature set is well-understood, allowing for a safe refactoring process without introducing regressions.
  * **Risk:** The refactoring effort might take longer than estimated if unforeseen complexities arise in the existing code.
      * **Mitigation:** Prioritize a "lift and shift" approach initially. Move existing logic into new classes without significantly altering the logic itself. Deeper refactoring of the logic can be a separate, future task.
  * **Risk:** Improperly managing the lifecycle of services and disposables in the new manager classes could lead to memory leaks.
      * **Mitigation:** Implement a clear `dispose` pattern in all manager classes and ensure the top-level `ExtensionManager` correctly calls `dispose` on all its managed components.

-----

### **New Document: Sub-Sprint 1: Dependency Injection & Centralized Config**

**Objective:**
To refactor all core services to use constructor-based dependency injection and to receive configuration from a centralized source.

**Parent Sprint:**
PRD 1, Sprint 1: Dependency & Config Mgmt

**Tasks:**

1.  **Create `ConfigService.ts`:** Develop a service that loads all extension settings from `vscode.workspace.getConfiguration()` once and provides them via getter methods.
2.  **Refactor `QdrantService`:** Update its constructor to accept the database connection string directly.
3.  **Refactor `EmbeddingProvider` implementations:** Update their constructors to accept necessary parameters (e.g., API keys, model names).
4.  **Refactor `IndexingService` & `ContextService`:** Update their constructors to accept instances of their dependencies (e.g., `qdrantService`, `embeddingProvider`, `configService`).
5.  **Update Unit Tests:** Modify existing tests to pass mocked dependencies to the service constructors, improving test isolation.

**Acceptance Criteria:**

  * No service uses the `new` keyword to create its long-lived dependencies.
  * No service directly calls `vscode.workspace.getConfiguration()`.
  * Unit tests for services can run without needing the VS Code API.

**Dependencies:**

  * A clear understanding of the existing service dependencies.

**Timeline:**

  * **Start Date:** 2025-08-27
  * **End Date:** 2025-09-09

-----

### **New Document: Sub-Sprint 2: Extension & Command Managers**

**Objective:**
To create the initial `ExtensionManager` and `CommandManager` classes, moving the core lifecycle and command registration logic out of `extension.ts`.

**Parent Sprint:**
PRD 1, Sprint 2: Lifecycle & Command Mgmt

**Tasks:**

1.  **Create `ExtensionManager.ts`:** This class will have an `initialize` method where it instantiates all services (using the DI pattern from Sub-Sprint 1) and managers. It will also have a `dispose` method.
2.  **Create `CommandManager.ts`:** This class will have a constructor that accepts the `ExtensionManager` instance (to access services) and a `registerCommands` method.
3.  **Move Command Logic:** Transfer all `vscode.commands.registerCommand` calls from `extension.ts` to `CommandManager.registerCommands`.
4.  **Refactor `extension.ts`:** Simplify `activate` to only `new ExtensionManager(context).initialize()`. Simplify `deactivate` to call `extensionManager.dispose()`.

**Acceptance Criteria:**

  * The `extension.ts` file is less than 50 lines of code.
  * All previously functional commands are still registered and work correctly.
  * The extension activates and deactivates cleanly without errors.

**Dependencies:**

  * Sub-Sprint 1 must be complete.

**Timeline:**

  * **Start Date:** 2025-09-10
  * **End Date:** 2025-09-23

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - Dependency & Config Mgmt

**Goal:** To refactor core services to eliminate tight coupling and centralize configuration management, improving testability and maintainability.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Create `ConfigService.ts`:** Create the file and implement a class that reads all settings from `vscode.workspace.getConfiguration('code-context-engine')` in its constructor and stores them in private properties with public getters. | `src/configService.ts` (New) |
| **1.2** | ☐ To Do | **Refactor `QdrantService`:** Modify the constructor to accept `connectionString: string`. Remove the `getConfiguration` call. | `src/db/qdrantService.ts` |
| **1.3** | ☐ To Do | **Refactor `OllamaProvider`:** Modify the constructor to accept `config: OllamaConfig` object. Remove the `getConfiguration` call. | `src/embeddings/ollamaProvider.ts` |
| **1.4** | ☐ To Do | **Refactor `OpenAIProvider`:** Modify the constructor to accept `config: OpenAIConfig` object. Remove the `getConfiguration` call. | `src/embeddings/openaiProvider.ts` |
| **1.5** | ☐ To Do | **Refactor `EmbeddingProviderFactory`:** Update the factory to accept the `ConfigService` and pass the correct configuration down to the provider it creates. | `src/embeddings/embeddingProvider.ts` |
| **1.6** | ☐ To Do | **Refactor `ContextService`:** Modify the constructor to accept `qdrantService: QdrantService` and `embeddingProvider: IEmbeddingProvider` as arguments. Remove the `new` keywords. | `src/context/contextService.ts` |
| **1.7** | ☐ To Do | **Refactor `IndexingService`:** Modify the constructor to accept its dependencies (`fileWalker`, `astParser`, `chunker`, `qdrantService`, `embeddingProvider`, `lspService`) as arguments. Remove the `new` keywords. | `src/indexing/indexingService.ts` |
| **1.8** | ☐ To Do | **Create Test Mocks:** Create mock implementations for `QdrantService` and `IEmbeddingProvider` for use in unit tests. | `src/test/mocks.ts` (New) |
| **1.9** | ☐ To Do | **Update `ContextService` Tests:** Write/update unit tests for `ContextService`, passing in the mocked dependencies to its constructor. | `src/test/contextService.test.ts` |

-----

### **New Document: tasklist\_sprint\_02.md**

# Task List: Sprint 2 - Lifecycle & Command Mgmt

**Goal:** To decouple the main `extension.ts` file by creating dedicated managers for the extension's lifecycle and command registration.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create `CommandManager.ts`:** Create the new file and `CommandManager` class. It should have a constructor that accepts the `ExtensionManager` and a `registerCommands` method. | `src/commandManager.ts` (New) |
| **2.2** | ☐ To Do | **Move `openMainPanel` Command:** Move the `registerCommand` logic for `code-context-engine.openMainPanel` from `extension.ts` to `CommandManager`. The callback will call a method on the `WebviewManager` (to be created in the next PRD). | `src/commandManager.ts`, `src/extension.ts` |
| **2.3** | ☐ To Do | **Move `startIndexing` Command:** Move the `registerCommand` logic for `code-context-engine.startIndexing` to `CommandManager`. The callback will call `indexingService.startIndexing()`. | `src/commandManager.ts`, `src/extension.ts` |
| **2.4** | ☐ To Do | **Move `openSettings` Command:** Move the `registerCommand` logic for `code-context-engine.openSettings` to `CommandManager`. The callback will call a method on the `WebviewManager`. | `src/commandManager.ts`, `src/extension.ts` |
| **2.5** | ☐ To Do | **Create `ExtensionManager.ts`:** Create the new file and `ExtensionManager` class. Its constructor will instantiate all services (using DI) and managers. | `src/extensionManager.ts` (New) |
| **2.6** | ☐ To Do | **Implement `initialize` Method:** In `ExtensionManager`, the `initialize` method will call `commandManager.registerCommands()`. | `src/extensionManager.ts` |
| **2.7** | ☐ To Do | **Implement `dispose` Method:** In `ExtensionManager`, the `dispose` method will call `dispose` on any disposable managers (like `CommandManager`). | `src/extensionManager.ts` |
| **2.8** | ☐ To Do | **Refactor `extension.ts`:** Remove all command registration and service instantiation logic. The `activate` function should now only create and initialize an `ExtensionManager`. | `src/extension.ts` |
| **2.9** | ☐ To Do | **Refactor `deactivate`:** The `deactivate` function in `extension.ts` should now only call `extensionManager.dispose()`. | `src/extension.ts` |



Of course. Here is the final PRD to complete the technical debt and refactoring initiative.

-----

### **New Document: PRD 2: Advanced Refactoring - Webview & Communication**

**1. Title & Overview**

  * **Project:** Code Context Engine - Webview & Communication Refactoring
  * **Summary:** This phase completes the decoupling of `extension.ts` by creating dedicated managers for webview lifecycle and message routing. A `WebviewManager` will centralize the logic for creating, showing, and disposing of all webview panels. A `MessageRouter` will handle all communication between the webview and the extension's backend services, creating a clean and robust communication layer.
  * **Dependencies:** PRD 1 (Backend Decoupling & Refactoring) must be complete. The `ExtensionManager` and `CommandManager` should be in place.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Finalize the architectural refactoring to create a fully modular, scalable, and maintainable codebase.
      * Improve the reliability of the UI and its communication with the backend, leading to a better user experience.
  * **Developer & System Success Metrics:**
      * `extension.ts` is purely an activator and contains no direct webview or message handling logic.
      * All webview panel creation and management logic is consolidated within the `WebviewManager`.
      * The large `switch` statement for message handling is replaced by the `MessageRouter`, which cleanly delegates tasks to the appropriate services.
      * Adding a new webview or a new message command is a simple, low-risk operation that requires changes in only one or two focused files.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** Alisha can now add new commands and backend logic without ever needing to touch the UI or communication layers. Her work is isolated to the services she owns.
  * **Frank (Frontend Developer):** Frank works on the SvelteKit UI. He now has a single, predictable `MessageRouter` to interact with. He doesn't need to know which backend service implements a feature; he just sends a command, and the router handles the rest.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Refactoring** | **Sprint 3: Webview Management** | As a developer, I want to create a `WebviewManager` to handle the lifecycle of all webview panels so that UI creation logic is centralized and reusable. | 1. A new `WebviewManager` class is created. \<br/\> 2. All `vscode.window.createWebviewPanel` logic is moved from `extension.ts` (or `CommandManager`) into the `WebviewManager`. \<br/\> 3. The manager handles showing the main panel and the settings panel, ensuring only one of each can exist at a time. \<br/\> 4. The manager is responsible for panel disposal and is properly disposed of by the `ExtensionManager`. | **2 Weeks** |
| | | As Frank, I want the `WebviewManager` to be responsible for providing the correct HTML content so that the webview loading process is standardized. | 1. The logic for reading the `index.html` file from the `webview/dist` directory is moved into a private method in `WebviewManager`. \<br/\> 2. The method correctly replaces asset paths with `webview.asWebviewUri` to ensure CSS and JS files load correctly. \<br/\> 3. The `showMainPanel` and `showSettingsPanel` methods use this helper to set the panel's HTML. | |
| **Phase 2: Refactoring** | **Sprint 4: Communication & State Mgmt** | As a developer, I want to create a `MessageRouter` to handle all incoming messages from the webview so that communication logic is decoupled and clean. | 1. A new `MessageRouter` class is created. \<br/\> 2. The `onDidReceiveMessage` listener for each webview is set up to delegate to an instance of the `MessageRouter`. \<br/\> 3. The `MessageRouter`'s `routeMessage` method contains the `switch` statement that calls the appropriate service based on the message command. \<br/\> 4. The router sends results back to the webview with a consistent response format (e.g., `{ command, requestId, result, error }`). | **2 Weeks** |
| | | As Alisha, I want to introduce a basic `StateManager` to track the global state of the extension so that services don't need to communicate directly with each other for status updates. | 1. A new `StateManager` class is created to hold simple boolean flags (e.g., `isIndexing`, `isBackendHealthy`). \<br/\> 2. Services can update the state via the manager (e.g., `stateManager.setIndexing(true)`). \<br/\> 3. The `MessageRouter` can query the state to prevent conflicting actions (e.g., don't start a new index if `isIndexing` is true). | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 3:** Webview Management (2 Weeks)
  * **Sprint 4:** Communication & State Management (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The message-passing API between the webview and the extension is stable and performant enough for all communication needs.
  * **Risk:** Incorrectly managing panel/webview lifecycles in the `WebviewManager` could lead to memory leaks or "ghost" panels that are not properly disposed of.
      * **Mitigation:** Ensure that the `onDidDispose` event for every created panel is correctly handled and that all disposables are added to the extension's context subscriptions.
  * **Risk:** The `StateManager` could become a complex bottleneck if too much logic is added to it.
      * **Mitigation:** Keep the initial `StateManager` extremely simple, holding only essential, global boolean flags. Avoid putting business logic into the state manager itself; its only job is to store and retrieve state.

-----

### **New Document: Sub-Sprint 3: Centralized Webview Management**

**Objective:**
To create the `WebviewManager` class and move all webview panel creation and lifecycle logic into it, cleaning up the command handlers and `extension.ts`.

**Parent Sprint:**
PRD 2, Sprint 3: Webview Management

**Tasks:**

1.  **Create `WebviewManager.ts`:** Develop the new class with a constructor that accepts the `vscode.ExtensionContext`.
2.  **Implement `showMainPanel`:** Create a method that contains the logic for creating and showing the main webview panel. It should ensure only one instance of the main panel can exist.
3.  **Implement `showSettingsPanel`:** Create a method that contains the logic for creating and showing the settings webview panel.
4.  **Implement `getWebviewContent`:** Create a private helper method that reads the `index.html`, prepares it with the correct URIs for webview assets, and returns the HTML string.
5.  **Refactor `CommandManager`:** Update the callbacks for the `openMainPanel` and `openSettings` commands to simply call the appropriate methods on the `WebviewManager` instance.

**Acceptance Criteria:**

  * All `vscode.window.createWebviewPanel` calls are located exclusively within `WebviewManager.ts`.
  * The `openMainPanel` and `openSettings` commands correctly open their respective UIs.
  * Attempting to open a panel that is already open simply brings the existing panel into focus.

**Dependencies:**

  * `CommandManager` from PRD 1 must be implemented.

**Timeline:**

  * **Start Date:** 2025-09-24
  * **End Date:** 2025-10-07

-----

### **New Document: Sub-Sprint 4: Message Routing & State**

**Objective:**
To create the `MessageRouter` and `StateManager` classes to formalize the communication layer and centralize the extension's global state.

**Parent Sprint:**
PRD 2, Sprint 4: Communication & State Mgmt

**Tasks:**

1.  **Create `StateManager.ts`:** Develop a simple class with private properties (e.g., `_isIndexing = false`) and public getter/setter methods.
2.  **Create `MessageRouter.ts`:** Develop the class with a constructor that accepts the `ExtensionManager` (to access all services and managers) and the `vscode.Webview`. The constructor will set up the `onDidReceiveMessage` listener.
3.  **Implement `routeMessage` method:** Move the message-handling `switch` statement from `extension.ts` into this private method within the `MessageRouter`.
4.  **Integrate `StateManager`:** In the `MessageRouter`, check the state before delegating actions. For example: `if (this.stateManager.isIndexing) { /* return error */ }`.
5.  **Update Services:** Modify services like `IndexingService` to update the central state (e.g., `this.stateManager.setIndexing(true)` at the start and `false` at the end).
6.  **Integrate `MessageRouter`:** In `WebviewManager`, when a panel is created, instantiate a `MessageRouter` for it, passing in the necessary dependencies.

**Acceptance Criteria:**

  * The `onDidReceiveMessage` listener in `WebviewManager` is a single line that instantiates and uses the `MessageRouter`.
  * The `MessageRouter` correctly routes commands to the appropriate services.
  * Attempting to start a new indexing job while one is already running is gracefully rejected with an error message sent back to the UI.

**Dependencies:**

  * Sub-Sprint 3 must be complete.

**Timeline:**

  * **Start Date:** 2025-10-08
  * **End Date:** 2025-10-21

-----

### **New Document: tasklist\_sprint\_03.md**

# Task List: Sprint 3 - Webview Management

**Goal:** To centralize all webview creation and lifecycle logic into a dedicated `WebviewManager` class.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Create `WebviewManager.ts`:** Create the new file and the `WebviewManager` class structure with a constructor and a `dispose` method. | `src/webviewManager.ts` (New) |
| **3.2** | ☐ To Do | **Implement `getWebviewContent`:** Create a private helper method that takes a webview instance, reads `webview/dist/index.html`, replaces asset paths using `webview.asWebviewUri`, and returns the final HTML string. | `src/webviewManager.ts` |
| **3.3** | ☐ To Do | **Implement `showMainPanel`:** Create a public method that checks if a main panel instance already exists. If not, it calls `vscode.window.createWebviewPanel`, sets its HTML using the helper, and stores the instance. If it exists, it calls `.reveal()`. | `src/webviewManager.ts` |
| **3.4** | ☐ To Do | **Implement `showSettingsPanel`:** Create a public method with the same logic as `showMainPanel`, but for the settings UI, using a different panel ID and title. | `src/webviewManager.ts` |
| **3.5** | ☐ To Do | **Handle Panel Disposal:** In the `show...` methods, add the `onDidDispose` listener to the created panel to nullify the stored instance variable (e.g., `this.mainPanel = undefined`). | `src/webviewManager.ts` |
| **3.6** | ☐ To Do | **Update `ExtensionManager`:** Instantiate the `WebviewManager` in the `ExtensionManager`'s constructor. | `src/extensionManager.ts` |
| **3.7** | ☐ To Do | **Refactor `CommandManager`:** Change the `openMainPanel` and `openSettings` command callbacks to call `extensionManager.webviewManager.showMainPanel()` and `showSettingsPanel()` respectively. | `src/commandManager.ts` |

-----

### **New Document: tasklist\_sprint\_04.md**

# Task List: Sprint 4 - Communication & State Mgmt

**Goal:** To formalize the webview communication layer with a `MessageRouter` and centralize global state with a `StateManager`.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `StateManager.ts`:** Create the new file and a simple `StateManager` class. Add a private boolean `_isIndexing` and public `isIndexing()` getter and `setIndexing(state: boolean)` setter. | `src/stateManager.ts` (New) |
| **4.2** | ☐ To Do | **Create `MessageRouter.ts`:** Create the new file and the `MessageRouter` class. Its constructor will accept the `ExtensionManager` and `vscode.Webview`. | `src/messageRouter.ts` (New) |
| **4.3** | ☐ To Do | **Implement `routeMessage`:** Move the message handling `switch` statement into a private `async routeMessage` method in `MessageRouter`. | `src/messageRouter.ts` |
| **4.4** | ☐ To Do | **Integrate State Check:** In `routeMessage`, before the `startIndexing` case, add a check: `if (this.extensionManager.stateManager.isIndexing()) { ... post error message ... }`. | `src/messageRouter.ts` |
| **4.5** | ☐ To Do | **Update `IndexingService`:** Inject the `StateManager` instance into the `IndexingService`. Call `this.stateManager.setIndexing(true)` at the beginning of `startIndexing` and `false` in a `finally` block at the end. | `src/indexing/indexingService.ts` |
| **4.6** | ☐ To Do | **Instantiate `MessageRouter`:** In `WebviewManager`, when a panel is created, remove the old `onDidReceiveMessage` logic and replace it with `new MessageRouter(this.extensionManager, this.mainPanel.webview)`. | `src/webviewManager.ts` |
| **4.7** | ☐ To Do | **Instantiate `StateManager`:** In `ExtensionManager`, create a public instance of the `StateManager` so it can be accessed by other services. | `src/extensionManager.ts` |
| **4.8** | ☐ To Do | **Update Service Constructors:** Update the constructors of services (like `IndexingService`) that now need the `StateManager`, and update the instantiation logic in `ExtensionManager`. | `src/extensionManager.ts`, `src/indexing/indexingService.ts` |

This completes the full set of PRDs for the refactoring initiative. You now have a comprehensive plan to transform your extension's architecture into a more robust, maintainable, and scalable system.

</prd>


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
````

## File: docs/completed/major-improvement/prd.md
````markdown
<prd>Of course. I've analyzed the extensive list of user stories and have grouped them into three logical, sequential themes. This approach will allow us to incrementally deliver high-value features, starting with the most impactful user experience improvements.

Here is the first set of PRDs for the **Core UX Enhancements**.

-----

### **New Document: PRD 1: Foundational - Core UX Enhancements**

**1. Title & Overview**

  * **Project:** Code Context Engine - Core UX Enhancements
  * **Summary:** This phase focuses on significantly improving the day-to-day user experience of the extension. We will introduce a persistent status bar indicator for at-a-glance feedback, create an interactive and human-friendly search results view, and add advanced features like result pagination and an enhanced search history.
  * **Dependencies:** Requires the existing SvelteKit frontend and the backend search API (`ContextService`) to be functional.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Increase daily user engagement by making the extension more intuitive and informative.
      * Reduce the time it takes for a user to find and act upon a search result.
  * **User Success Metrics:**
      * 75% of users interact with the rich search results (e.g., clicking to open a file) instead of just copying text.
      * User session duration increases by 20% due to the improved usability of the search history and pagination.
      * The status bar indicator is cited as a helpful feature in user feedback.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin wants the extension to feel like a natural part of VS Code. He needs clear, immediate feedback on the system's status and wants his search results to be easy to navigate and act upon without cumbersome copy-pasting.
  * **Frank (Frontend Developer):** Frank is responsible for implementing the UI. He needs clear specifications for the new interactive components, state management logic for features like toggling views, and a plan for handling lists of data with pagination.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: UX** | **Sprint 1: Status Bar & Guided Tour** | As Devin, I want to see the current status of the Code Context Engine in the VS Code status bar, so that I know if it's ready, indexing, or has an error without having to open the sidebar panel. | 1. A new status bar item is added to the VS Code UI.\<br/\>2. The item displays an icon and text representing the current state (e.g., `$(zap) Ready`, `$(sync~spin) Indexing`, `$(error) Error`).\<br/\>3. Clicking the status bar item opens the main webview panel. | **2 Weeks** |
| | | As a first-time user, I want a brief, interactive tour of the UI after my first successful index, so that I can quickly learn how to use the core features. | 1. After the first indexing completes, a guided tour overlay is shown.\<br/\>2. The tour highlights the query input box, the results area, and the settings icon.\<br/\>3. The user can easily dismiss the tour or step through it. | |
| **Phase 1: UX** | **Sprint 2: Interactive Search Results** | As a user, I want the search results to be interactive cards, so that I can explore my code directly from the UI. | 1. Each search result is displayed as a distinct card.\<br/\>2. The card contains a code snippet with syntax highlighting.\<br/\>3. Clicking the file path on the card opens the file in a new editor tab at the correct line.\<br/\>4. Each card has a "Copy Snippet" button that copies the code to the clipboard. | **2 Weeks** |
| | | As a power user, I want to be able to switch between a user-friendly view of the results and the raw `repomix`-style XML output, so that I can use the best format for my current task. | 1. A toggle switch (e.g., "UI" / "XML") is added to the results view.\<br/\>2. The default view is the user-friendly card layout.\<br/\>3. Toggling to "XML" displays the raw XML output from the backend in a `<pre>` block.\<br/\>4. The user's preference is remembered for the duration of the session. | |
| **Phase 1: UX** | **Sprint 3: Search History & Pagination** | As a user, I want to see my search history with more context, so that I can easily re-run previous queries. | 1. The search history is displayed when the query input is empty.\<br/\>2. Each history item shows the query string, the number of results found, and a timestamp.\<br/\>3. Clicking a history item re-runs that query.\<br/\>4. Search history is persisted across sessions. | **2 Weeks** |
| | | As a user, I want the results to be paginated if there are too many, so that the UI remains fast and I'm not overwhelmed. | 1. If a query returns more than a set number of results (e.g., 20), only the first page is displayed.\<br/\>2. A "Load More" button is shown at the end of the results list.\<br/\>3. Clicking "Load More" fetches and appends the next page of results to the list.\<br/\>4. The button is hidden when all results have been loaded. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 6 Weeks
  * **Sprint 1:** Status Bar & Guided Tour (2 Weeks)
  * **Sprint 2:** Interactive Search Results (2 Weeks)
  * **Sprint 3:** Search History & Pagination (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Risk:** The logic for incremental updates to the status bar could be complex, especially with multiple asynchronous operations running.
      * **Mitigation:** Rely on the `StateManager` as the single source of truth. The status bar component should simply subscribe to state changes and update its display accordingly.
  * **Risk:** Implementing client-side syntax highlighting for code snippets could impact UI performance.
      * **Mitigation:** Use a lightweight and fast syntax highlighting library (e.g., `highlight.js` or `prism.js`) and ensure it runs efficiently within the Svelte component lifecycle.
  * **Assumption:** The backend API can be modified to support pagination for search results (e.g., by accepting `page` and `pageSize` parameters).

-----

### **New Document: Sub-Sprint 1: Status Bar Indicator**

**Objective:**
To implement a persistent status bar item that provides users with at-a-glance feedback on the extension's state.

**Parent Sprint:**
PRD 1, Sprint 1: Status Bar & Guided Tour

**Tasks:**

1.  **Create `StatusBarManager.ts`:** Develop a new manager class responsible for creating and updating the VS Code status bar item.
2.  **Subscribe to `StateManager`:** The `StatusBarManager` will subscribe to events from the `StateManager` to know when to update.
3.  **Implement State Logic:** Update the status bar's text, icon, tooltip, and command based on the current state (e.g., `Ready`, `Indexing`, `Error`).
4.  **Integrate into `ExtensionManager`:** Instantiate the `StatusBarManager` during the extension's activation.

**Acceptance Criteria:**

  * A status bar item appears in the bottom-left of the VS Code window.
  * The icon and text change correctly when the extension's state changes.
  * Clicking the status bar item opens the main extension panel.

**Dependencies:**

  * A functional `StateManager` must be in place.

**Timeline:**

  * **Start Date:** 2025-08-27
  * **End Date:** 2025-09-02

-----

### **New Document: Sub-Sprint 2: Guided Tour**

**Objective:**
To create a simple, dismissible guided tour for users who have completed their first indexing run.

**Parent Sprint:**
PRD 1, Sprint 1: Status Bar & Guided Tour

**Tasks:**

1.  **Create `GuidedTour.svelte` component:** Build a Svelte component that can display an overlay with highlighted sections and descriptive text.
2.  **Implement Tour State:** The tour will have multiple steps, managed by local component state.
3.  **Trigger Tour:** The `IndexingView.svelte` component, upon receiving the "indexing complete" event for the first time, will trigger the tour.
4.  **Persist Tour Completion:** After the user completes or dismisses the tour, set a flag in `vscode.ExtensionContext.globalState` to ensure it doesn't appear again.

**Acceptance Criteria:**

  * The tour appears automatically after the very first successful indexing.
  * The tour correctly highlights the key UI elements.
  * The tour does not appear on subsequent indexing runs.

**Dependencies:**

  * The `IndexingView.svelte` component must be able to signal completion.

**Timeline:**

  * **Start Date:** 2025-09-03
  * **End Date:** 2025-09-09

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - Status Bar & Guided Tour

**Goal:** To implement the status bar indicator and the first-run guided tour.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Create `StatusBarManager.ts`:** Create the new file and class. Implement a method to create the `vscode.StatusBarItem`. | `src/statusBarManager.ts` (New) |
| **1.2** | ☐ To Do | **Implement `updateStatus` method:** In `StatusBarManager`, create a method that takes the extension state and updates the `text`, `tooltip`, and `command` of the status bar item. | `src/statusBarManager.ts` |
| **1.3** | ☐ To Do | **Integrate with `StateManager`:** In `ExtensionManager`, instantiate `StatusBarManager` and have it subscribe to state changes from `StateManager`. | `src/extensionManager.ts` |
| **1.4** | ☐ To Do | **Create `GuidedTour.svelte`:** Build the Svelte component with slots for content and logic to control visibility and steps. | `webview/src/lib/components/GuidedTour.svelte` (New) |
| **1.5** | ☐ To Do | **Implement First-Run Check:** In the main Svelte view, use `vscodeApi` to check a global state flag on mount to determine if the tour should be shown. | `webview/src/routes/+page.svelte` |
| **1.6** | ☐ To Do | **Trigger Tour on Index Completion:** When the `indexingCompleted` message is received, and the first-run flag is not set, activate the guided tour. | `webview/src/lib/components/IndexingView.svelte` |
| **1.7** | ☐ To Do | **Persist Tour Dismissal:** When the tour is finished, send a message to the extension backend to set the global state flag `hasCompletedFirstRun` to true. | `src/messageRouter.ts` |

Of course. Here is the next PRD in our plan, which focuses on enhancing the core indexing engine to be more automated and manageable.

-----

### **New Document: PRD 2: Foundational - Indexing Engine Enhancements**

**1. Title & Overview**

  * **Project:** Code Context Engine - Indexing Engine Enhancements
  * **Summary:** This phase focuses on evolving the indexing process from a manual, one-time operation into a dynamic, automated system. We will implement a file watcher to enable automatic, incremental updates to the index as code changes. We will also add critical management features, allowing users to pause, resume, and clear their index, providing more control and better resource management.
  * **Dependencies:** Requires a functional manual indexing process and the Diagnostics View UI from the previous PRDs.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Significantly increase the long-term value and "stickiness" of the extension by ensuring search results are always current.
      * Improve user trust and control by making the indexing process transparent and manageable.
  * **User Success Metrics:**
      * 90% of file changes (saves) are reflected in the index within 10 seconds of the change.
      * The "pause" and "resume" functionality for indexing is used by at least 20% of users with large repositories (a sign that it's a valued resource management feature).
      * The index health and management features in the Diagnostics panel are used to successfully resolve at least 50% of user-reported indexing issues without needing further support.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin works in a fast-paced environment and expects his tools to keep up. He doesn't want to remember to re-index his project every time he makes a change. He needs the search results to be consistently accurate and up-to-date. During a large refactor, he also wants to be able to pause indexing to maximize his machine's performance for compilation tasks.
  * **Alisha (Backend Developer):** Alisha is responsible for the stability of the indexing pipeline. She needs to implement a robust file-watching system that is efficient and doesn't consume excessive resources. She also needs to add state management and persistence to handle pausing and resuming complex, multi-stage indexing jobs.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Indexing** | **Sprint 4: Automatic & Incremental Indexing** | As a developer, I want the extension to automatically detect when I save changes to a file and update the index in the background, so that my search results are always up-to-date. | 1. The extension uses `vscode.workspace.createFileSystemWatcher` to monitor file changes (`.ts`, `.js`, `.py`, etc.).\<br/\>2. On file save, the specific file is re-parsed and its corresponding vectors are updated in the Qdrant database.\<br/\>3. On file deletion, the corresponding vectors are removed from the database.\<br/\>4. On file creation, the new file is parsed and its vectors are added to the database. | **2 Weeks** |
| **Phase 2: Indexing** | **Sprint 5: Index Management & Control** | As a developer, I want to be able to pause and resume a long-running indexing process, so that I can free up system resources for a CPU-intensive task without losing my progress. | 1. The `IndexingView.svelte` component has "Pause" and "Resume" buttons that are visible during indexing.\<br/\>2. Clicking "Pause" gracefully stops the indexing pipeline and persists its current state (e.g., list of remaining files).\<br/\>3. The `StateManager` reflects the "paused" state.\<br/\>4. Clicking "Resume" successfully continues the indexing process from where it left off. | **2 Weeks** |
| | | As a developer, I want to see the status and size of my current index and have the option to clear it, so that I can manage my disk space and troubleshoot issues. | 1. The `DiagnosticsView.svelte` panel is updated to display the total number of indexed files and vectors.\<br/\>2. A "Clear Index" button is added to the Diagnostics panel.\<br/\>3. Clicking the button completely removes the Qdrant collection for the current workspace and resets the local configuration state. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 4:** Automatic & Incremental Indexing (2 Weeks)
  * **Sprint 5:** Index Management & Control (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Risk:** A naive file watcher implementation could trigger too many indexing jobs in rapid succession (e.g., during a branch switch with many file changes), leading to high CPU usage.
      * **Mitigation:** Implement a debouncing mechanism for the file watcher's event handler. This will batch multiple file changes that occur in a short period into a single, efficient update operation.
  * **Risk:** Persisting the state of a complex, multi-threaded indexing process for pause/resume functionality can be highly complex and prone to bugs.
      * **Mitigation:** Start with a simple implementation. The initial version of "pause" could simply stop the process after the *current file* is finished, saving the queue of remaining files. More granular, mid-file pause states can be a future enhancement.
  * **Assumption:** The Qdrant database API provides an efficient way to delete specific vectors by their ID/metadata, which is necessary for handling file changes and deletions.

-----

### **New Document: Sub-Sprint 5: File System Watcher for Auto-Indexing**

**Objective:**
To implement the core file system watcher that will trigger automatic, incremental index updates.

**Parent Sprint:**
PRD 2, Sprint 4: Automatic & Incremental Indexing

**Tasks:**

1.  **Create `FileSystemWatcherManager.ts`:** Develop a new manager class responsible for creating and managing the `vscode.FileSystemWatcher`.
2.  **Implement Debouncing:** The manager's event handler for file changes must be debounced to prevent excessive updates.
3.  **Handle `onDidChange`, `onDidCreate`, `onDidDelete`:** Implement logic to handle each type of file event.
4.  **Update `IndexingService`:** Add new methods to the `IndexingService` for handling single-file updates (e.g., `updateFileInIndex`, `removeFileFromIndex`).
5.  **Integrate with `ExtensionManager`:** Instantiate the `FileSystemWatcherManager` during extension activation.

**Acceptance Criteria:**

  * Saving a tracked file triggers the `onDidChange` handler after a short debounce period.
  * The `IndexingService` is correctly called to update the single file.
  * Deleting a tracked file triggers the `onDidDelete` handler.

**Dependencies:**

  * A functional `IndexingService` with methods for incremental updates.

**Timeline:**

  * **Start Date:** 2025-09-10
  * **End Date:** 2025-09-16

-----

### **New Document: Sub-Sprint 6: Pause, Resume, and Index Management UI**

**Objective:**
To build the UI components and backend logic for managing and controlling the indexing process.

**Parent Sprint:**
PRD 2, Sprint 5: Index Management & Control

**Tasks:**

1.  **Add Pause/Resume Buttons:** Add "Pause" and "Resume" buttons to the `IndexingView.svelte` component. Their visibility should be controlled by the `isIndexing` state.
2.  **Update `StateManager`:** Add a new "paused" state to the `StateManager` to differentiate between running, paused, and idle states.
3.  **Implement Pause/Resume in `IndexingService`:** Add `pause()` and `resume()` methods to the `IndexingService`. The `pause()` method will set a flag that the indexing loop checks, and it will save the queue of remaining files. `resume()` will restart the loop with the saved queue.
4.  **Update Diagnostics View:** In `DiagnosticsView.svelte`, add a section to display index statistics (e.g., total vectors).
5.  **Implement "Clear Index" Logic:** Add a "Clear Index" button to the `DiagnosticsView` that sends a message to the backend. The backend handler will call a new method in the `QdrantService` to delete the collection for the current workspace.

**Acceptance Criteria:**

  * The "Pause" button successfully stops the indexing process, and the state is updated.
  * The "Resume" button successfully continues indexing from where it left off.
  * The "Clear Index" button removes all indexed data for the current workspace.

**Dependencies:**

  * A functional `StateManager` and `IndexingView.svelte` component.

**Timeline:**

  * **Start Date:** 2025-09-17
  * **End Date:** 2025-09-23

-----

### **New Document: tasklist\_sprint\_04.md**

# Task List: Sprint 4 - Automatic & Incremental Indexing

**Goal:** To implement a file watcher that automatically updates the index when files are changed, created, or deleted.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `FileSystemWatcherManager.ts`:** Create the new file and class. The constructor should accept the `ExtensionManager` to access other services. | `src/fileSystemWatcherManager.ts` (New) |
| **4.2** | ☐ To Do | **Implement Watcher Creation:** In the manager's `initialize` method, use `vscode.workspace.createFileSystemWatcher` with a glob pattern for supported file types. | `src/fileSystemWatcherManager.ts` |
| **4.3** | ☐ To Do | **Implement Debounced Handler:** Create a private method to handle file change events. Use a `setTimeout` and `clearTimeout` combination to debounce calls, ensuring it only runs after a period of inactivity (e.g., 500ms). | `src/fileSystemWatcherManager.ts` |
| **4.4** | ☐ To Do | **Subscribe to Watcher Events:** In the `initialize` method, subscribe to the watcher's `onDidChange`, `onDidCreate`, and `onDidDelete` events, calling your debounced handler for each. | `src/fileSystemWatcherManager.ts` |
| **4.5** | ☐ To Do | **Create `updateFileInIndex` method:** In `IndexingService`, create a new public method that takes a single file path, re-parses it, and updates its vectors in Qdrant. | `src/indexing/indexingService.ts` |
| **4.6** | ☐ To Do | **Create `removeFileFromIndex` method:** In `IndexingService`, create a method that takes a file path and calls a new `QdrantService` method to delete all vectors associated with that path. | `src/indexing/indexingService.ts`, `src/db/qdrantService.ts` |
| **4.7** | ☐ To Do | **Integrate Watcher:** In `ExtensionManager`, instantiate and initialize the `FileSystemWatcherManager`. | `src/extensionManager.ts` |
| **4.8** | ☐ To Do | **Test File Save:** Make a change to a tracked file and save it. Verify (via logs) that the `updateFileInIndex` method is called after the debounce period. | `(Manual Test)` |
| **4.9** | ☐ To Do | **Test File Deletion:** Delete a tracked file. Verify that the `removeFileFromIndex` method is called. | `(Manual Test)` |

-----

### **New Document: tasklist\_sprint\_05.md**

# Task List: Sprint 5 - Index Management & Control

**Goal:** To give users control over the indexing process with pause/resume functionality and index management tools.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **5.1** | ☐ To Do | **Add `isPaused` to `StateManager`:** Add a new boolean state to `StateManager` to track the paused status. | `src/stateManager.ts` |
| **5.2** | ☐ To Do | **Add Pause/Resume Buttons to UI:** In `IndexingView.svelte`, add "Pause" and "Resume" buttons. Use an `{#if}` block to show them only when `isIndexing` is true. | `webview/src/lib/components/IndexingView.svelte` |
| **5.3** | ☐ To Do | **Implement `pause` method:** In `IndexingService`, create a `pause()` method that sets `stateManager.isPaused = true` and saves the list of remaining files to be processed. | `src/indexing/indexingService.ts` |
| **5.4** | ☐ To Do | **Implement `resume` method:** In `IndexingService`, create a `resume()` method that sets `stateManager.isPaused = false` and continues the indexing loop using the saved list of remaining files. | `src/indexing/indexingService.ts` |
| **5.5** | ☐ To Do | **Connect UI to Pause/Resume:** Wire the Svelte buttons to send `pauseIndexing` and `resumeIndexing` messages to the `MessageRouter`, which then calls the `IndexingService`. | `webview/src/lib/components/IndexingView.svelte`, `src/messageRouter.ts` |
| **5.6** | ☐ To Do | **Add Index Stats to Diagnostics UI:** In `DiagnosticsView.svelte`, add a section to display the total number of vectors, fetched from a new `getCollectionInfo` method in `ContextService`. | `webview/src/lib/components/DiagnosticsView.svelte` |
| **5.7** | ☐ To Do | **Add "Clear Index" Button:** Add a "Clear Index" button to the `DiagnosticsView.svelte` component. | `webview/src/lib/components/DiagnosticsView.svelte` |
| **5.8** | ☐ To Do | **Implement `deleteCollection` method:** In `QdrantService`, create a method that deletes the collection for the current workspace. | `src/db/qdrantService.ts` |
| **5.9** | ☐ To Do | **Connect UI to Clear Index:** Wire the "Clear Index" button to send a message to the backend. The `MessageRouter` will delegate this to a new method in `IndexingService` that calls `QdrantService.deleteCollection`. | `webview/src/lib/components/DiagnosticsView.svelte`, `src/messageRouter.ts` |
Of course. Here is the final PRD, which addresses advanced configuration and support for complex development environments.

-----

### **New Document: PRD 3: Foundational - Advanced Configuration & Multi-Workspace Support**

**1. Title & Overview**

  * **Project:** Code Context Engine - Advanced Configuration & Multi-Workspace
  * **Summary:** This final phase focuses on delivering power-user features that provide granular control over the extension's performance and behavior in complex environments. We will implement resource management settings to control indexing intensity and introduce a robust architecture to correctly manage separate indexes for different projects within a multi-workspace setup.
  * **Dependencies:** Requires a functional indexing pipeline and the native VS Code settings UI integration.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Cater to professional developers and teams working in complex, multi-repository environments.
      * Improve the extension's performance and resource-friendliness, making it a better "citizen" on a developer's machine.
  * **User Success Metrics:**
      * The "Low" indexing intensity setting reduces average CPU consumption during indexing by at least 30%.
      * When multiple workspace folders are open, search results from a query in one folder do not include results from other, unrelated folders.
      * The extension correctly maintains and queries separate Qdrant collections for each distinct workspace folder.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin often has multiple microservice repositories open in a single VS Code workspace. He needs the context engine to be "smart" enough to know which repository he's currently working in and provide relevant search results only from that specific project. He also wants to be able to turn down the indexing speed when he's on battery power or running other intensive tasks.
  * **Alisha (Backend Developer):** Alisha needs to implement the architectural changes to support multiple workspaces. This involves refactoring how the extension identifies the current context, manages multiple database collections, and routes queries to the correct index.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 3: Advanced** | **Sprint 6: Resource Management** | As a developer, I want to be able to control the resource consumption of the extension, so that it doesn't slow down my machine. | 1. A new setting, `code-context-engine.indexingIntensity`, is added to the native VS Code settings UI (`package.json`).\<br/\>2. The setting is an enum with options: "Low", "Medium", "High".\<br/\>3. The `IndexingService` reads this setting and adjusts its behavior (e.g., adds delays between file processing on "Low", uses fewer parallel workers). | **2 Weeks** |
| **Phase 3: Advanced** | **Sprint 7: Multi-Workspace Support** | As a developer who works with multiple projects at once, I want the extension to manage a separate index for each of my workspaces, so that search results are always relevant to the project I'm currently focused on. | 1. The extension generates a unique Qdrant collection name for each folder in a VS Code workspace.\<br/\>2. The `IndexingService` correctly indexes each folder into its own separate collection.\<br/\>3. When a query is made, the `ContextService` identifies the active file's workspace folder.\<br/\>4. The query is routed to search only the specific Qdrant collection associated with that folder. | **2 Weeks** |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 6:** Resource Management (2 Weeks)
  * **Sprint 7:** Multi-Workspace Support (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Risk:** The logic to map files to their corresponding workspace folder and Qdrant collection could be complex in nested or overlapping folder structures.
      * **Mitigation:** Rely on the VS Code API `vscode.workspace.getWorkspaceFolder(uri)` which is designed to solve this exact problem. It reliably finds the correct parent workspace folder for any given file URI.
  * **Risk:** Managing multiple indexing processes (one for each workspace) could be resource-intensive.
      * **Mitigation:** Implement a queueing system. The `IndexingService` should only index one workspace folder at a time, even if multiple are added simultaneously. The "Indexing Intensity" setting will also help manage this.
  * **Assumption:** Users with multiple workspace folders want their searches to be scoped to the current folder by default.

-----

### **New Document: Sub-Sprint 7: Indexing Intensity Controls**

**Objective:**
To implement the "Indexing Intensity" setting, allowing users to control the resource consumption of the indexing process.

**Parent Sprint:**
PRD 3, Sprint 6: Resource Management

**Tasks:**

1.  **Add Setting to `package.json`:** Define the `code-context-engine.indexingIntensity` setting with `enum` options "Low", "Medium", "High".
2.  **Read Setting in `ConfigService`:** Add a new getter method in `ConfigService` to retrieve the current intensity level.
3.  **Implement Throttling in `IndexingService`:** In the main file processing loop of the `IndexingService`, read the intensity setting.
4.  **Apply Delays:** If the setting is "Low" or "Medium", add a small `await delay(...)` inside the loop to yield CPU time to other processes.

**Acceptance Criteria:**

  * The new setting appears in the native VS Code settings UI.
  * Setting the intensity to "Low" visibly slows down the indexing process and results in lower average CPU usage.
  * The "High" setting runs the indexing process as fast as possible (current behavior).

**Dependencies:**

  * A functional `IndexingService` and `ConfigService`.

**Timeline:**

  * **Start Date:** 2025-09-24
  * **End Date:** 2025-09-30

-----

### **New Document: Sub-Sprint 8: Per-Folder Indexing**

**Objective:**
To refactor the indexing and query services to support managing a separate index for each folder in a VS Code multi-root workspace.

**Parent Sprint:**
PRD 3, Sprint 7: Multi-Workspace Support

**Tasks:**

1.  **Update Collection Naming:** Modify the `generateCollectionName` logic to take a `vscode.WorkspaceFolder` as an argument and generate a unique, deterministic name based on its path.
2.  **Refactor `IndexingService`:** The main `startIndexing` command should now iterate over all `vscode.workspace.workspaceFolders` and trigger a separate, queued indexing job for each.
3.  **Refactor `ContextService`:** The `queryContext` method must now first determine which workspace the active file or query belongs to.
4.  **Use `vscode.workspace.getWorkspaceFolder`:** Use this VS Code API method to reliably find the correct workspace folder for the current context.
5.  **Route Query to Correct Collection:** Pass the unique collection name for the identified workspace to the `QdrantService` so the search is correctly scoped.

**Acceptance Criteria:**

  * Opening a workspace with two folders results in two distinct collections being created in Qdrant.
  * Querying from a file in `folderA` only returns results from `folderA`.
  * Querying from a file in `folderB` only returns results from `folderB`.

**Dependencies:**

  * A functional end-to-end indexing and querying pipeline.

**Timeline:**

  * **Start Date:** 2025-10-01
  * **End Date:** 2025-10-07

-----

### **New Document: tasklist\_sprint\_06.md**

# Task List: Sprint 6 - Resource Management

**Goal:** To implement the "Indexing Intensity" setting to give users control over CPU consumption.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **6.1** | ☐ To Do | **Define `indexingIntensity` Setting:** In `package.json`, add the new `code-context-engine.indexingIntensity` property to `contributes.configuration`. Set the type to `string`, default to `High`, and provide an `enum` of `["High", "Medium", "Low"]`. | `package.json` |
| **6.2** | ☐ To Do | **Add Getter to `ConfigService`:** In `src/configService.ts`, add a new method `getIndexingIntensity()` that returns the configured value. | `src/configService.ts` |
| **6.3** | ☐ To Do | **Create Delay Helper:** Create a simple async delay function, e.g., `const delay = (ms) => new Promise(res => setTimeout(res, ms));`. | `src/indexing/indexingService.ts` |
| **6.4** | ☐ To Do | **Read Intensity in `IndexingService`:** At the start of the `startIndexing` method, get the intensity level from the `ConfigService`. | `src/indexing/indexingService.ts` |
| **6.5** | ☐ To Do | **Implement Throttling Logic:** Inside the main `for` loop that processes files, add a `switch` statement based on the intensity level. Call `await delay(X)` where X is a small number for "Medium" (e.g., 50ms) and a larger number for "Low" (e.g., 200ms). | `src/indexing/indexingService.ts` |
| **6.6** | ☐ To Do | **Test Low Intensity:** Set the setting to "Low", start indexing a medium-sized project, and monitor system CPU usage. Verify it is noticeably lower than on "High". | `(Manual Test)` |
| **6.7** | ☐ To Do | **Test High Intensity:** Set the setting to "High" and verify the indexing runs at maximum speed with no artificial delays. | `(Manual Test)` |

-----

### **New Document: tasklist\_sprint\_07.md**

# Task List: Sprint 7 - Multi-Workspace Support

**Goal:** To correctly handle multi-root workspaces by creating a separate index for each folder.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **7.1** | ☐ To Do | **Update `generateCollectionName`:** Modify this method in `IndexingService` (or a shared utility) to accept a `vscode.WorkspaceFolder` and return a name derived from its path (e.g., hashing the `folder.uri.fsPath`). | `src/indexing/indexingService.ts` |
| **7.2** | ☐ To Do | **Refactor `startIndexing` Command:** The command handler should now get the list of all workspace folders via `vscode.workspace.workspaceFolders`. | `src/commandManager.ts` |
| **7.3** | ☐ To Do | **Loop Over Workspaces:** The handler should loop through each folder and call a refactored `indexingService.indexWorkspace(folder)` method for each. | `src/commandManager.ts` |
| **7.4** | ☐ To Do | **Refactor `ContextService` Query Method:** The `queryContext` method must be updated to accept a file URI as context. | `src/context/contextService.ts` |
| **7.5** | ☐ To Do | **Identify Active Workspace:** In `queryContext`, use `vscode.workspace.getWorkspaceFolder(fileUri)` to find the correct `WorkspaceFolder` for the query context. | `src/context/contextService.ts` |
| **7.6** | ☐ To Do | **Calculate Collection Name for Query:** Use the `generateCollectionName` method to get the correct collection name for the identified workspace folder. | `src/context/contextService.ts` |
| **7.7** | ☐ To Do | **Pass Collection Name to Search:** Pass the correctly scoped collection name to the `qdrantService.search` method. | `src/context/contextService.ts` |
| **7.8** | ☐ To Do | **Test Multi-Workspace Indexing:** Create a new VS Code workspace with two separate project folders. Run the index command and verify (via logs or Qdrant UI) that two distinct collections are created. | `(Manual Test)` |
| **7.9** | ☐ To Do | **Test Scoped Search:** Open a file in the first folder and run a query. Verify results are only from that folder. Repeat for a file in the second folder and verify the results are correctly scoped. | `(Manual Test)` |

This completes the full set of planned PRDs for the new features and enhancements. You now have a comprehensive roadmap to guide the development of these advanced capabilities.


</prd>
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
````

## File: docs/completed/missing/prd.md
````markdown
<prd>Excellent, I've conducted a full review of the codebase in `repomix-output.xml` against the completed PRDs and task lists. The analysis shows that while significant architectural work has been done to decouple the backend services, there are several key features and refactors from the planning documents that have not yet been implemented.

The most significant unimplemented items are the migration of the frontend to SvelteKit and the UX improvements to integrate with VS Code's native settings and hotkeys.

To get the project to a "complete" state as envisioned in your documents, I have created a final, consolidated PRD. This PRD addresses all remaining activities.

-----

### **New Document: PRD 1: Foundational - Final Architecture & UX Polish**

**1. Title & Overview**

  * **Project:** Code Context Engine - Final Implementation
  * **Summary:** This phase focuses on completing the extension's architecture and user experience as originally planned. The primary goals are to migrate the frontend from a TypeScript DOM-based approach to a modern SvelteKit application, integrate with VS Code's native settings UI for a more seamless experience, and add keyboard shortcuts for power users. This PRD combines the unimplemented goals from the "Svelte Migration" and "UX Enhancements" PRDs.
  * **Dependencies:** The existing decoupled backend architecture (`ExtensionManager`, `CommandManager`, etc.) must be in place.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Deliver a polished, professional, and intuitive user experience that aligns with VS Code's native patterns.
      * Establish a modern and maintainable frontend architecture to accelerate future UI development.
  * **Developer & System Success Metrics:**
      * The `webview/` directory is a fully functional SvelteKit project, and all UI is rendered using `.svelte` components.
      * The extension's settings are managed exclusively through the native VS Code Settings UI, and the old Svelte settings page is repurposed as a "Status & Diagnostics" panel.
      * Key commands are accessible via keyboard shortcuts defined in `package.json`.
      * A `StateManager` is implemented and used to prevent conflicting operations like concurrent indexing.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin wants to manage settings in the same way he does for all his other extensions. He also wants to use keyboard shortcuts to speed up his workflow without reaching for the mouse.
  * **Frank (Frontend Developer):** Frank needs a proper SvelteKit development environment to efficiently build and maintain the UI, rather than manipulating the DOM with plain TypeScript.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Final Polish** | **Sprint 1: SvelteKit Migration** | As Frank, I want to replace the current webview implementation with a SvelteKit application configured with a static adapter, so I have a proper foundation for the UI. | 1. The `webview/` directory is replaced with a new SvelteKit project.\<br/\>2. The project is configured with `@sveltejs/adapter-static` to build into a `build` directory.\<br/\>3. The `WebviewManager` is updated to load the `index.html` from the SvelteKit build output and correctly rewrite asset paths. | **2 Weeks** |
| | | As Frank, I want to recreate the `DatabaseSetup` and `EmbeddingSetup` UI as Svelte components, so the UI is modular and state-driven. | 1. The functionality of `DatabaseSetup.ts` is replicated in a `DatabaseSetup.svelte` component.\<br/\>2. The functionality of `EmbeddingSetup.ts` is replicated in a `EmbeddingSetup.svelte` component.\<br/\>3. A `setupStore.ts` Svelte store is used to manage the onboarding state. | |
| **Phase 1: Final Polish** | **Sprint 2: Native Settings & Hotkeys** | As Devin, I want to use keyboard shortcuts to open the main panel and start indexing, so I can work more efficiently. | 1. A `keybindings` section is added to `package.json`.\<br/\>2. Default shortcuts (e.g., `Ctrl+Alt+C` and `Ctrl+Alt+I`) are assigned to the `openMainPanel` and `startIndexing` commands.\<br/\>3. The shortcuts are functional and documented in the `README.md`. | **2 Weeks** |
| | | As Devin, I want to manage settings in the native VS Code UI, not a custom webview, for a familiar experience. | 1. The `handleOpenSettings` method in `CommandManager` is changed to execute `workbench.action.openSettings` to open the native UI.\<br/\>2. The old Svelte settings page is repurposed into a read-only "Status & Diagnostics" panel.\<br/\>3. A new `openDiagnostics` command is created to show this panel. | |
| | | As Alisha, I want to implement a `StateManager` to prevent concurrent operations, so the extension is more robust. | 1. A `StateManager.ts` file is created.\<br/\>2. The `IndexingService` uses the `StateManager` to set an `isIndexing` flag during operation.\<br/\>3. The `MessageRouter` checks this flag to prevent a new indexing job from starting if one is already running. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** SvelteKit Migration (2 Weeks)
  * **Sprint 2:** Native Settings & Hotkeys (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Risk:** The SvelteKit migration is a significant frontend refactor and might take longer than estimated if the existing DOM manipulation logic is complex.
      * **Mitigation:** Treat the existing TypeScript classes (`DatabaseSetup.ts`, `EmbeddingSetup.ts`) as a clear specification for the Svelte components' functionality to guide the rewrite.
  * **Risk:** Users might be confused by the settings moving to the native UI.
      * **Mitigation:** The new "Status & Diagnostics" panel must have a clear button that links directly to the native settings UI to guide users. Update the `README.md` to explain the change.

-----

### **New Document: Sub-Sprint 1: SvelteKit Project Scaffolding & Migration**

**Objective:**
To replace the current TypeScript DOM-based webview with a new, properly configured SvelteKit project and replicate the existing UI as Svelte components.

**Parent Sprint:**
PRD 1, Sprint 1: SvelteKit Migration

**Tasks:**

1.  **Clear and Re-initialize `webview/`:** Remove all existing content from the `webview/` directory. Run `npm create svelte@latest webview` to scaffold a new SvelteKit project with TypeScript support.
2.  **Configure Static Build:** Install `@sveltejs/adapter-static` and modify `webview/svelte.config.js` to configure a static build into a `build` directory.
3.  **Create UI Components:** Create `DatabaseSetup.svelte` and `EmbeddingSetup.svelte` components, replicating the UI and logic from the existing `.ts` files using Fluent UI components.
4.  **Implement State Management:** Use the existing `setupStore.ts` to manage the state for the new Svelte components, ensuring the "Index Now" button enables correctly.

**Acceptance Criteria:**

  * The `webview/` directory is a SvelteKit project.
  * Running `npm run build` in `webview/` generates a static site in `webview/build/`.
  * The new Svelte UI functionally matches the old TypeScript-based UI.

**Dependencies:**

  * The existing TypeScript UI classes (`DatabaseSetup.ts`, `EmbeddingSetup.ts`) serve as the specification.

**Timeline:**

  * **Start Date:** 2025-08-25
  * **End Date:** 2025-09-05

-----

### **New Document: Sub-Sprint 2: Native Settings, Hotkeys & State Management**

**Objective:**
To integrate the extension more deeply with VS Code by adding keyboard shortcuts, using the native settings UI, and implementing a central state manager.

**Parent Sprint:**
PRD 1, Sprint 2: Native Settings & Hotkeys

**Tasks:**

1.  **Add Keybindings:** Modify `package.json` to add a `contributes.keybindings` section. Define shortcuts for `openMainPanel` and `startIndexing`.
2.  **Refactor "Open Settings" Command:** Change the `handleOpenSettings` method in `src/commandManager.ts` to execute `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:your.extension-id')`.
3.  **Create Diagnostics View:** Repurpose the old settings UI into a read-only "Status & Diagnostics" Svelte component. Add a new `openDiagnostics` command to show it.
4.  **Implement StateManager:** Create the `StateManager.ts` file and class. Inject it via the `ExtensionManager` and use it in `IndexingService` and `MessageRouter` to manage the `isIndexing` state.

**Acceptance Criteria:**

  * Hotkeys successfully trigger their corresponding commands.
  * The "Open Settings" command opens the native VS Code Settings UI, filtered for the extension.
  * A new "Open Diagnostics" command shows a panel with status info and a link to the settings.
  * Attempting to start indexing while another job is running is correctly blocked.

**Dependencies:**

  * Sprint 1 (SvelteKit Migration) must be complete.

**Timeline:**

  * **Start Date:** 2025-09-08
  * **End Date:** 2025-09-19

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - SvelteKit Migration

**Goal:** To migrate the existing webview from plain TypeScript to a modern SvelteKit application.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Backup and Clean `webview/`:** Make a backup of the current `webview/` directory, then delete its contents. | `webview/` |
| **1.2** | ☐ To Do | **Initialize SvelteKit Project:** Run `npm create svelte@latest webview` and select "Skeleton project" with TypeScript support. | `webview/` (New project) |
| **1.3** | ☐ To Do | **Install Static Adapter:** In the `webview/` directory, run `npm install -D @sveltejs/adapter-static`. | `webview/package.json` |
| **1.4** | ☐ To Do | **Configure Static Build:** Modify `webview/svelte.config.js` to use the static adapter, outputting to a `build` directory with `index.html` as the fallback. | `webview/svelte.config.js` |
| **1.5** | ☐ To Do | **Recreate `DatabaseSetup.svelte`:** Create the component and implement the UI and logic from `DatabaseSetup.ts` using Svelte syntax. | `webview/src/lib/components/DatabaseSetup.svelte` (New) |
| **1.6** | ☐ To Do | **Recreate `EmbeddingSetup.svelte`:** Create the component and implement the UI and logic from `EmbeddingSetup.ts`. | `webview/src/lib/components/EmbeddingSetup.svelte` (New) |
| **1.7** | ☐ To Do | **Update `setupStore.ts`:** Ensure the Svelte store (`setupStore.ts`) correctly manages the state for the new components. | `webview/src/lib/stores/setupStore.ts` |
| **1.8** | ☐ To Do | **Create Main Page Layout:** In `webview/src/routes/+page.svelte`, use the store to manage the view and conditionally render the setup components. | `webview/src/routes/+page.svelte` |
| **1.9** | ☐ To Do | **Update `WebviewManager`:** Modify `getWebviewContent` to load `webview/build/index.html` and correctly rewrite asset paths using `asWebviewUri`. | `src/webviewManager.ts` |

-----

### **New Document: tasklist\_sprint\_02.md**

# Task List: Sprint 2 - Native Settings & Hotkeys

**Goal:** To improve UX by adding keyboard shortcuts, using the native VS Code settings UI, and implementing a robust state manager.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Add `keybindings` to `package.json`:** Add a `contributes.keybindings` section and define shortcuts for `openMainPanel` and `startIndexing`. | `package.json` |
| **2.2** | ☐ To Do | **Refactor `handleOpenSettings` Command:** In `src/commandManager.ts`, change the handler to call `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine')`. | `src/commandManager.ts` |
| **2.3** | ☐ To Do | **Create `openDiagnostics` Command:** Add a new command `code-context-engine.openDiagnostics` in `package.json` and `commandManager.ts`. | `package.json`, `src/commandManager.ts` |
| **2.4** | ☐ To Do | **Create `showDiagnosticsPanel` Method:** In `src/webviewManager.ts`, add a method to show a panel that will render the diagnostics view. | `src/webviewManager.ts` |
| **2.5** | ☐ To Do | **Create `DiagnosticsView.svelte`:** Repurpose the old Svelte settings page. Remove configuration inputs and add a button that calls the `openSettings` command. | `webview/src/lib/views/DiagnosticsView.svelte` (New) |
| **2.6** | ☐ To Do | **Create `StateManager.ts`:** Create the new file and implement the `StateManager` class with an `isIndexing` flag. | `src/stateManager.ts` (New) |
| **2.7** | ☐ To Do | **Integrate `StateManager`:** Instantiate the manager in `ExtensionManager` and inject it into `IndexingService` and `MessageRouter`. | `src/extensionManager.ts`, `src/indexing/indexingService.ts`, `src/messageRouter.ts` |
| **2.8** | ☐ To Do | **Add Guard Clause:** In `MessageRouter`, add a check for `stateManager.isIndexing()` before starting a new indexing job. | `src/messageRouter.ts` |Of course. Here is the final PRD to complete the user experience enhancements for your extension.

-----

### **New Document: PRD 2: UI/UX - Status & Diagnostics Panel**

**1. Title & Overview**

  * **Project:** Code Context Engine - Status & Diagnostics Panel
  * **Summary:** This phase completes the user experience overhaul by repurposing the now-legacy Svelte settings page into a dedicated "Status & Diagnostics" panel. This provides a clear, focused UI for users to perform actions like testing service connections and viewing system status, cleanly separating these actions from the configuration, which is now handled by VS Code's native settings UI.
  * **Dependencies:** PRD 1 (Hotkey & Native Settings Integration) must be complete. The command to open the native settings UI must be functional.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Improve user confidence and reduce support issues by providing clear, actionable diagnostic tools.
      * Create a more logical and streamlined UX by separating "what you configure" (VS Code Settings) from "what you do" (Diagnostics Panel).
  * **User Success Metrics:**
      * Users can successfully test their connection to the database and embedding providers from the UI.
      * The panel displays the current configuration in a clear, read-only format, reducing confusion about what settings are active.
      * The user journey from diagnostics to configuration is seamless (e.g., a button in the panel links directly to the native settings UI).

-----

**3. User Personas**

  * **Devin (Developer - End User):** When setting up the extension or troubleshooting, Devin needs a simple way to confirm that his local services (like Qdrant and Ollama) are correctly connected to the extension. This panel gives him a one-click way to verify his setup.
  * **Alisha (Backend Developer):** Alisha benefits from having a dedicated UI for actions that trigger backend processes. This keeps the main query UI clean and provides a specific area for adding future administrative or diagnostic features.

-----

**4. Requirements Breakdown**

| Phase                 | Sprint                            | User Story                                                                                                                                                             | Acceptance Criteria                                                                                                                                                                                                                                                                                                                        | Duration |
| :-------------------- | :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **Phase 2: UX Polish** | **Sprint 2: Repurpose Settings Page** | As Alisha, I want to repurpose the existing Svelte settings page into a "Status & Diagnostics" panel, so we can keep useful actions like connection testing without managing configuration in a custom UI. | 1. The Svelte settings component is renamed to `DiagnosticsView.svelte`.\<br/\>2. All configuration input fields (dropdowns, text inputs for values) are removed from the component.\<br/\>3. Action buttons like "Test Database Connection" and "Test Embedding Provider" remain functional.\<br/\>4. The view is updated to display the current configuration values in a read-only format. | **2 Weeks** |
|                       |                                   | As Devin, I want to be able to open the new "Status & Diagnostics" panel from a command, so I can easily test my connections.                                              | 1. A new command, `code-context-engine.openDiagnostics`, is added in `package.json`.\<br/\>2. A new handler is added to `CommandManager` for this command.\<br/\>3. The handler calls a new method in `WebviewManager` (`showDiagnosticsPanel`) to display the repurposed Svelte view.                                                   |          |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 2 Weeks
  * **Sprint 2:** Repurpose Settings Page to Diagnostics View (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The Svelte components are modular enough that removing the configuration inputs will not break the layout or functionality of the remaining action buttons.
  * **Risk:** The new "Diagnostics" panel could cause user confusion if its purpose is not clearly communicated.
      * **Mitigation:** The UI should have a clear title like "Status & Diagnostics". It should also contain a prominent button or link labeled "Edit Configuration" that executes the `workbench.action.openSettings` command, guiding users to the correct location for making changes.

-----

### **New Document: Sub-Sprint 2: Diagnostics View Refactoring**

**Objective:**
To refactor the Svelte settings page into a read-only diagnostics and status view, and create a new command to open it.

**Parent Sprint:**
PRD 2, Sprint 2: Repurpose Settings Page

**Tasks:**

1.  **Create New Command:** Define and register a new command `code-context-engine.openDiagnostics` in `package.json` and `CommandManager`.
2.  **Create `showDiagnosticsPanel` Method:** In `WebviewManager`, create a new method to show the diagnostics webview, ensuring it's managed as a singleton panel.
3.  **Refactor Svelte Component:** Rename the settings Svelte component to `DiagnosticsView.svelte`.
4.  **Remove Input Elements:** Remove all interactive form elements for *setting* values (e.g., `<select>`, `<input>`).
5.  **Display Read-Only Settings:** Fetch the current configuration and display it as read-only text.
6.  **Add "Edit Settings" Button:** Add a new button that, when clicked, sends a message to the extension to execute the `workbench.action.openSettings` command.
7.  **Preserve Action Buttons:** Ensure that buttons for "Test Connection" remain and are functional.

**Acceptance Criteria:**

  * A new "Code Context Engine: Open Diagnostics" command is available.
  * The new panel displays current settings as text and does not allow editing them.
  * The "Test Connection" buttons work as before.
  * A new "Edit Settings" button correctly opens the native VS Code settings UI.

**Dependencies:**

  * PRD 1 must be complete.

**Timeline:**

  * **Start Date:** 2026-02-09
  * **End Date:** 2026-02-20

-----

### **New Document: tasklist\_sprint\_02.md**

# Task List: Sprint 2 - Repurpose Settings Page to Diagnostics View

**Goal:** To refactor the Svelte settings webview into a dedicated "Status & Diagnostics" panel.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Add `openDiagnostics` Command:** In `package.json`, add a new command definition for `code-context-engine.openDiagnostics` with the title "Code Context Engine: Open Diagnostics". | `package.json` |
| **2.2** | ☐ To Do | **Register `openDiagnostics` Command:** In `src/commandManager.ts`, register the new command. The handler should call a new method on the `WebviewManager`, e.g., `this.webviewManager.showDiagnosticsPanel()`. | `src/commandManager.ts` |
| **2.3** | ☐ To Do | **Implement `showDiagnosticsPanel`:** In `src/webviewManager.ts`, create the new method `showDiagnosticsPanel`. It should manage a new panel instance (`diagnosticsPanel`) using the same singleton pattern as `showMainPanel`. | `src/webviewManager.ts` |
| **2.4** | ☐ To Do | **Rename Svelte Component:** Rename the Svelte settings component file to `DiagnosticsView.svelte`. Update any import paths that reference it. | `webview/src/lib/views/SettingsView.svelte` -\> `DiagnosticsView.svelte` |
| **2.5** | ☐ To Do | **Remove Configuration Inputs:** In `DiagnosticsView.svelte`, delete all `<select>` and `<input>` elements used for setting configuration values. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.6** | ☐ To Do | **Display Read-Only Settings:** Add logic to fetch the current settings on mount and display them as plain text (e.g., `<div>Provider: {$settings.embeddingProvider}</div>`). | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.7** | ☐ To Do | **Add "Edit Settings" Button:** Add a new Fluent UI button to `DiagnosticsView.svelte` labeled "Edit Configuration". | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.8** | ☐ To Do | **Implement "Edit Settings" Action:** The new button's `on:click` handler should send a `MapsToSettings` message to the extension. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.9** | ☐ To Do | **Handle `MapsToSettings` Message:** In `src/messageRouter.ts`, add a case for `MapsToSettings` that calls `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');`. | `src/messageRouter.ts` |
| **2.10** | ☐ To Do | **Verify Action Buttons:** Ensure the "Test Connection" buttons remain in `DiagnosticsView.svelte` and their message-passing logic is still functional. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.11** | ☐ To Do | **Test Full Flow:** Manually test opening the new Diagnostics panel, verifying settings are read-only, and confirming the "Edit Configuration" button opens the correct native UI. | `(Manual Test)` |

This completes the full set of PRDs and task lists for the user experience enhancements. You now have a comprehensive plan to integrate native VS Code features and provide a more streamlined and intuitive interface for your users.</prd> [backlog template]

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
````

## File: docs/completed/missing2/prd.md
````markdown
<prd>Of course. I have conducted a comprehensive review of the entire codebase and all previously generated PRDs. The analysis reveals that while the backend has a solid, decoupled architecture, several key user-facing features and a critical frontend migration are still needed to complete the extension as planned.

The main gaps are:

1.  **The frontend is not yet a SvelteKit application.** It's currently built with plain TypeScript, which was identified as a major piece of technical debt.
2.  **The search and results UI is a basic placeholder.** It lacks the specific controls and output formatting you've requested.
3.  **The settings/onboarding UI needs to be more intuitive** and component-based, with clear sections for system validation, database setup, and provider configuration.

To address these gaps and deliver the full functionality, I have created a series of new, sequential PRDs.

-----

### **New Document: PRD 1: Foundational - SvelteKit UI Migration & Enhanced Settings**

**1. Title & Overview**

  * **Project:** Code Context Engine - SvelteKit UI Migration & Enhanced Onboarding
  * **Summary:** This foundational phase is focused on migrating the entire webview frontend from the current TypeScript DOM-manipulation approach to a modern, component-based SvelteKit application. We will also build a new, highly intuitive and user-friendly onboarding/settings view that incorporates system validation and connection testing to provide a seamless user experience.
  * **Dependencies:** The decoupled backend architecture (`ExtensionManager`, `MessageRouter`, etc.) is already in place and will be the communication target for the new SvelteKit UI.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Establish a modern, maintainable, and scalable frontend architecture to accelerate future UI development.
      * Create a best-in-class, frictionless onboarding experience that maximizes the number of users who successfully configure and index their first repository.
  * **Developer & System Success Metrics:**
      * The `webview/` directory is a fully functional SvelteKit project, and all UI views are rendered using `.svelte` components.
      * The new `SetupView` component provides clear, step-by-step guidance for database and provider configuration.
      * The UI includes interactive connection testers that give users real-time feedback on their configuration.
      * All UI state is managed within Svelte stores, eliminating direct DOM manipulation for state changes.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin has just installed the extension. He needs a setup process that is not just a form, but a guide. He wants to know if his system is compatible, get help starting local services, and be confident that his settings are correct *before* he starts a long indexing process.
  * **Frank (Frontend Developer):** Frank needs a proper SvelteKit development environment to efficiently build and maintain the UI. A component-based architecture allows him to create reusable and testable UI elements like `ValidatedInput` and `ConnectionTester`.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Svelte UI** | **Sprint 1: SvelteKit Migration & Componentization** | As Frank, I want to replace the current webview implementation with a SvelteKit application configured with a static adapter, so I have a proper foundation for the UI. | 1. The `webview/` directory is replaced with a new SvelteKit project.\<br/\>2. The project is configured with `@sveltejs/adapter-static` to build into a `build` directory.\<br/\>3. The `WebviewManager` is updated to load the `index.html` from the SvelteKit build output and correctly rewrite asset paths. | **2 Weeks** |
| | | As Frank, I want to recreate the `Setup`, `Indexing`, and `Query` views as modular Svelte components, so the UI is organized and state-driven. | 1. A `SetupView.svelte`, `IndexingView.svelte`, and `QueryView.svelte` component is created.\<br/\>2. The main page (`+page.svelte`) uses a Svelte store (`viewStore.ts`) to manage which of the three views is currently visible.\<br/\>3. The basic structure and layout of each view are implemented based on the existing HTML placeholders. | |
| **Phase 1: Svelte UI** | **Sprint 2: Intuitive Settings & Diagnostics UI** | As Devin, I want a single, intuitive setup page that validates my system and lets me configure and test my database and provider connections in one place. | 1. A new `ValidatedInput.svelte` component is created for text fields and dropdowns that provides real-time validation feedback.\<br/\>2. A new `ConnectionTester.svelte` component is created that can test a given configuration and display the status (success, error, latency).\<br/\>3. The `SetupView.svelte` component is enhanced to use these new components for a rich, interactive setup experience. | **2 Weeks** |
| | | As Devin, I want the extension to automatically check my system for prerequisites like Docker before I start the setup. | 1. A new `SystemValidator.ts` service is created in the extension backend to check for Docker, network connectivity, etc.\<br/\>2. A `SystemValidation.svelte` component is created in the UI to display the results of this check.\<br/\>3. The `SetupView` displays the system validation results at the top of the page. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** SvelteKit Migration & Componentization (2 Weeks)
  * **Sprint 2:** Intuitive Settings & Diagnostics UI (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The logic from the `webview-backup` components can be effectively translated into a modern SvelteKit component structure.
  * **Risk:** The real-time validation and connection testing might be complex to implement reliably, especially with varying user system configurations.
      * **Mitigation:** The `SystemValidator.ts` and `ConnectionTester.svelte` components should be developed with robust error handling and provide clear, actionable feedback to the user if a check fails.
  * **Risk:** A large, single `SetupView` component could become overly complex.
      * **Mitigation:** Break down the `SetupView` into smaller, self-contained child components (e.g., `DatabaseConfig.svelte`, `ProviderConfig.svelte`) to keep the codebase manageable.

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - SvelteKit Migration & Componentization

**Goal:** To migrate the existing webview from a plain TypeScript implementation to a modern SvelteKit application and structure the UI into modular components.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Backup and Clean `webview/`:** Make a backup of the current `webview/` directory, then delete its contents. | `webview/` |
| **1.2** | ☐ To Do | **Initialize SvelteKit Project:** Run `npm create svelte@latest webview` and select "Skeleton project" with TypeScript support. | `webview/` (New project) |
| **1.3** | ☐ To Do | **Install Static Adapter & Dependencies:** In the `webview/` directory, run `npm install -D @sveltejs/adapter-static` and `npm install @fluentui/web-components`. | `webview/package.json` |
| **1.4** | ☐ To Do | **Configure Static Build:** Modify `webview/svelte.config.js` to use the static adapter, outputting to a `build` directory with `index.html` as the fallback. | `webview/svelte.config.js` |
| **1.5** | ☐ To Do | **Create State Stores:** Create `webview/src/lib/stores/viewStore.ts` to manage the active view and `webview/src/lib/stores/appStore.ts` for global app state. | `webview/src/lib/stores/` (New) |
| **1.6** | ☐ To Do | **Create View Components:** Create the initial component files: `SetupView.svelte`, `IndexingView.svelte`, and `QueryView.svelte` in `webview/src/lib/components/`. | `webview/src/lib/components/` (New) |
| **1.7** | ☐ To Do | **Create Main Page Layout:** In `webview/src/routes/+page.svelte`, import the view components and the `viewStore`. Use an `{#if}` block to conditionally render the correct view based on the store's value. | `webview/src/routes/+page.svelte` (New) |
| **1.8** | ☐ To Do | **Update `WebviewManager`:** Modify the `getWebviewContent` method in `src/webviewManager.ts` to read `webview/build/index.html` and correctly rewrite asset paths using `asWebviewUri`. | `src/webviewManager.ts` |
| **1.9** | ☐ To Do | **Test Build & Load:** Run `npm run build` in `webview/`. Launch the extension and verify that the default SvelteKit UI loads in the webview panel. | `(Manual Test)` |




Of course. Here are the remaining PRDs and task lists to complete the planned functionality for your VS Code extension.

-----

### **New Document: PRD 2: Core Functionality - Advanced Search & XML Output**

**1. Title & Overview**

  * **Project:** Code Context Engine - Advanced Search & XML Output
  * **Summary:** This phase focuses on delivering the core value proposition of the extension: a powerful, context-aware search with a specific, machine-readable output format. We will enhance the search UI with advanced controls, implement backend logic to refine search results, and create a new service to format the final output as a `repomix`-style XML document.
  * **Dependencies:** PRD 1 (SvelteKit UI Migration & Enhanced Settings) must be complete. The extension must have a functional SvelteKit frontend and a backend capable of performing a basic vector search.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Provide a unique and powerful search experience that differentiates the extension from standard text search tools.
      * Deliver a predictable, machine-consumable output format that can be used in other AI-driven workflows.
  * **Developer & System Success Metrics:**
      * The search UI includes controls for specifying the number of results and optionally including file content.
      * The backend successfully deduplicates search results to return only unique file paths.
      * A new `XmlFormatterService` correctly transforms search results into the specified XML format.
      * File content within the XML output is wrapped in `<![CDATA[...]]>` sections to prevent character escaping issues.
      * The end-to-end search-to-XML workflow is completed in under 5 seconds for typical queries.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin needs more control over his search. He wants to specify how many files he gets back and decide whether to immediately see the full content or just the file paths. When he gets the results, he wants to be able to easily copy the formatted XML for use in other tools or scripts.
  * **Alisha (Backend Developer):** Alisha needs to implement the logic that makes the search "smart." This includes handling the deduplication of results from the vector database and creating a reliable service that generates valid, well-formed XML.

-----

**4. Requirements Breakdown**

| Phase                  | Sprint                           | User Story                                                                                                                                              | Acceptance Criteria                                                                                                                                                                                                                                                                                                                         | Duration  |
| :--------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| **Phase 2: Core Search** | **Sprint 3: Advanced Search UI & Logic** | As Devin, I want UI controls to specify the number of search results and to include file content, so I can fine-tune my queries.                      | 1. The `QueryView.svelte` component is updated with a number input for "Max Results".\<br/\>2. A checkbox labeled "Include file content" is added to the `QueryView`.\<br/\>3. The values from these controls are sent to the backend as part of the `queryContext` message.                                                          | **2 Weeks** |
|                        |                                  | As Alisha, I want the backend to process search results to return only unique file paths, so the user isn't shown duplicate entries for the same file. | 1. The `ContextService`'s `queryContext` method is updated.\<br/\>2. It groups raw vector search hits by `filePath`.\<br/\>3. It returns a single, aggregated result for each unique file, using the highest similarity score from that file's chunks.\<br/\>4. The final result list respects the "Max Results" limit specified by the user. |           |
| **Phase 2: Core Search** | **Sprint 4: XML Result Formatting** | As Alisha, I want to create an `XmlFormatterService` that transforms search results into a `repomix`-style XML string, so the output is consistent and machine-readable. | 1. A new `XmlFormatterService.ts` is created in the extension backend.\<br/\>2. It has a method that accepts an array of search results.\<br/\>3. The method generates a valid XML string with a root `<files>` element and nested `<file path="...">` elements for each result.                                                        | **2 Weeks** |
|                        |                                  | As Alisha, I want the `XmlFormatterService` to wrap all file content in `<![CDATA[...]]>` sections, so that special characters like `&` and `<` are preserved correctly. | 1. When "Include file content" is true, the content of each file is placed inside a `CDATA` section within its `<file>` tag.\<br/\>2. The generated XML is parsed without errors by a standard XML parser.\<br/\>3. Special characters within the code are rendered verbatim in the final output.                                       |           |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 3:** Advanced Search UI & Logic (2 Weeks)
  * **Sprint 4:** XML Result Formatting (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The vector search will sometimes return multiple high-scoring chunks from the same file for a single query.
  * **Risk:** Reading the full content for a large number of files could be slow and negatively impact the user experience.
      * **Mitigation:** The file content should be read *after* the initial list of relevant files has been determined and deduplicated. Stream the results to the UI if possible, showing file paths first, then loading content asynchronously.
  * **Risk:** Manually building XML strings is error-prone.
      * **Mitigation:** Use a well-tested third-party library (e.g., `xml-builder-js` or similar) to generate the XML, which will handle character escaping and proper formatting automatically, reducing the risk of invalid output.

-----

### **New Document: tasklist\_sprint\_03.md**

# Task List: Sprint 3 - Advanced Search UI & Logic

**Goal:** To enhance the search UI with advanced controls and implement the backend logic for deduplicating results.

| Task ID | Status    | Task Description (Sequential & Atomic Steps)                                                                                                                            | File(s) To Modify                                    |
| :------ | :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| **3.1** | ☐ To Do   | **Add UI Controls:** In `QueryView.svelte`, add a number input field for "Max Results" and a checkbox for "Include file content".                                       | `webview/src/lib/components/QueryView.svelte`        |
| **3.2** | ☐ To Do   | **Update Svelte State:** Add properties to the component's state to hold the values for the new UI controls.                                                            | `webview/src/lib/components/QueryView.svelte`        |
| **3.3** | ☐ To Do   | **Update Message Payload:** When the search button is clicked, include the values for `maxResults` and `includeContent` in the `queryContext` message sent to the backend. | `webview/src/lib/components/QueryView.svelte`        |
| **3.4** | ☐ To Do   | **Update `ContextService` Method Signature:** Modify the `queryContext` method in `src/context/contextService.ts` to accept the new parameters.                   | `src/context/contextService.ts`                      |
| **3.5** | ☐ To Do   | **Implement Deduplication Logic:** In `queryContext`, after receiving results from Qdrant, create a `Map` to group the results by `filePath`.                        | `src/context/contextService.ts`                      |
| **3.6** | ☐ To Do   | **Aggregate Results:** For each file in the map, determine the highest similarity score among its chunks.                                                               | `src/context/contextService.ts`                      |
| **3.7** | ☐ To Do   | **Limit Final Results:** After aggregation, sort the unique files by their highest score and use `.slice(0, maxResults)` to respect the user's limit.                  | `src/context/contextService.ts`                      |
| **3.8** | ☐ To Do   | **Conditionally Read Content:** If `includeContent` is true, read the file content for the final, deduplicated list of files *before* returning the response.         | `src/context/contextService.ts`                      |
| **3.9** | ☐ To Do   | **Test Deduplication:** Write a unit test for `ContextService` that provides a mock Qdrant response with duplicate files and asserts that the final result is unique.  | `src/test/suite/contextService.test.ts`              |

-----

### **New Document: tasklist\_sprint\_04.md**

# Task List: Sprint 4 - XML Result Formatting

**Goal:** To create a dedicated service for formatting the final, deduplicated search results into a `repomix`-style XML string.

| Task ID | Status    | Task Description (Sequential & Atomic Steps)                                                                                                                  | File(s) To Modify                                        |
| :------ | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------- |
| **4.1** | ☐ To Do   | **Install XML Builder Library:** Add a library like `xml-builder-js` to the extension's dependencies to handle XML creation safely.                                | `package.json`                                           |
| **4.2** | ☐ To Do   | **Create `XmlFormatterService.ts`:** Create a new file for the service that will be responsible for all XML formatting.                                         | `src/formatting/XmlFormatterService.ts` (New)            |
| **4.3** | ☐ To Do   | **Implement `formatResults` Method:** In the new service, create a public method that takes the array of search results and returns an XML string.                 | `src/formatting/XmlFormatterService.ts`                  |
| **4.4** | ☐ To Do   | **Build XML Structure:** Inside `formatResults`, use the XML builder library to create the `<files>` root element and loop through the results to create `<file>` child elements. | `src/formatting/XmlFormatterService.ts`                  |
| **4.5** | ☐ To Do   | **Add `path` Attribute:** For each `<file>` element, add the `path` attribute with the value of the file's path.                                                  | `src/formatting/XmlFormatterService.ts`                  |
| **4.6** | ☐ To Do   | **Wrap Content in CDATA:** If a result includes file content, use the XML builder's CDATA method to wrap the content (e.g., `builder.create('file').dat(content)`). | `src/formatting/XmlFormatterService.ts`                  |
| **4.7** | ☐ To Do   | **Integrate into `MessageRouter`:** In `src/messageRouter.ts`, after getting the results from `ContextService`, pass them to the `XmlFormatterService` to get the final XML string. | `src/messageRouter.ts`                                   |
| **4.8** | ☐ To Do   | **Update `QueryView.svelte`:** Modify the results display area in the Svelte component to render the returned XML string within a `<pre><code>` block for display. | `webview/src/lib/components/QueryView.svelte`            |
| **4.9** | ☐ To Do   | **Test Special Characters:** Write a unit test that passes code containing `<`, `>`, and `&` to the formatter and asserts that the output XML is valid and preserves the characters. | `src/test/suite/xmlFormatterService.test.ts` (New) |


Of course. Here is the final PRD that covers the remaining architectural and operational improvements for your VS Code extension.

-----

### **New Document: PRD 3: Polish & Robustness - State Management & DevOps**

**1. Title & Overview**

  * **Project:** Code Context Engine - State Management, DevOps, & Polish
  * **Summary:** This final phase focuses on making the extension robust, efficient, and ready for public release. We will implement a central state manager to prevent conflicting operations, add keyboard shortcuts for a better user experience, and establish a CI/CD pipeline in GitHub Actions to automate the build, test, and release process.
  * **Dependencies:** All core features from PRD 1 and PRD 2 must be complete. The SvelteKit UI and the backend services should be fully functional.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Increase user trust and satisfaction by delivering a stable, reliable, and professional-quality tool.
      * Improve development velocity and code quality by automating the testing and release pipeline.
  * **Developer & System Success Metrics:**
      * The extension correctly prevents a new indexing job from starting if one is already in progress.
      * Users can trigger key actions (e.g., open panel, start indexing) using configurable keyboard shortcuts.
      * A GitHub Actions workflow automatically builds and tests the extension on every pull request to the `main` branch.
      * The project has a comprehensive `README.md` and `CONTRIBUTING.md` to support users and future contributors.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin is a power user who expects a polished experience. He wants keyboard shortcuts for his most-used commands and trusts that the extension will handle concurrent operations gracefully without crashing or corrupting his index.
  * **Alisha (Backend Developer):** Alisha wants to ensure the long-term health of the project. A CI/CD pipeline gives her confidence that new changes won't introduce regressions, and a central state manager makes the application's behavior more predictable and easier to debug.

-----

**4. Requirements Breakdown**

| Phase            | Sprint                          | User Story                                                                                                                                              | Acceptance Criteria                                                                                                                                                                                                                                                                  | Duration  |
| :--------------- | :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| **Phase 3: Polish** | **Sprint 5: State Management & Hotkeys** | As Alisha, I want to implement a `StateManager` to prevent concurrent operations, so the extension is more robust.                                         | 1. A `StateManager.ts` file is created to hold global state like `isIndexing`.\<br/\>2. The `IndexingService` updates this state when it starts and finishes.\<br/\>3. The `MessageRouter` checks this state and rejects new indexing requests if one is already running. | **2 Weeks** |
|                  |                                 | As Devin, I want to use keyboard shortcuts to open the main panel and start indexing, so I can work more efficiently.                                     | 1. A `keybindings` section is added to `package.json`.\<br/\>2. Default shortcuts are assigned to the `openMainPanel` and `startIndexing` commands.\<br/\>3. The shortcuts are functional and documented in the `README.md`.                                                                   |           |
| **Phase 3: Polish** | **Sprint 6: CI/CD Pipeline & Documentation** | As Alisha, I want a CI/CD pipeline using GitHub Actions to automate builds and testing, so we can ensure code quality and release reliability.          | 1. A `.github/workflows/ci.yml` file is created.\<br/\>2. The workflow runs on pull requests and includes steps for installing dependencies, linting, testing, and building the `.vsix` package.\<br/\>3. The workflow uploads the `.vsix` file as a build artifact. | **2 Weeks** |
|                  |                                 | As Devin, I want clear, comprehensive documentation for the extension, so that I know how to install, configure, and use it effectively.                  | 1. The `README.md` is updated with detailed sections for Features, Installation, and Configuration.\<br/\>2. A `CONTRIBUTING.md` file is created with guidelines for new developers.                                                            |           |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 5:** State Management & Hotkeys (2 Weeks)
  * **Sprint 6:** CI/CD Pipeline & Documentation (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The chosen default keybindings will not have major conflicts with common VS Code shortcuts.
  * **Risk:** The GitHub Actions pipeline may be complex to set up, especially if it involves running services like Docker for integration tests.
      * **Mitigation:** Start with a basic pipeline that only performs linting and unit tests. Add more complex steps like building and integration testing in a separate, follow-up task.
  * **Risk:** The `StateManager` could become a catch-all for unrelated state.
      * **Mitigation:** Enforce a strict policy that the `StateManager` should only contain truly *global* state flags (like `isIndexing`) and not component-level or session-specific data.

-----

### **New Document: tasklist\_sprint\_05.md**

# Task List: Sprint 5 - State Management & Hotkeys

**Goal:** To make the extension more robust by implementing a central state manager and to improve UX by adding keyboard shortcuts.

| Task ID | Status    | Task Description (Sequential & Atomic Steps)                                                                                                                                             | File(s) To Modify                                                         |
| :------ | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| **5.1** | ☐ To Do   | **Create `StateManager.ts` File:** Create the new file and define the `StateManager` class with a private `_isIndexing` flag and public getter/setter methods. | `src/stateManager.ts` (New)                                               |
| **5.2** | ☐ To Do   | **Instantiate `StateManager` in `ExtensionManager`:** In `src/extensionManager.ts`, create a single instance of `StateManager` and pass it to the services that need it via their constructors. | `src/extensionManager.ts`                                                 |
| **5.3** | ☐ To Do   | **Integrate State into `IndexingService`:** Modify `IndexingService` to accept `StateManager` in its constructor. Call `setIndexing(true)` at the start of `startIndexing` and `false` in a `finally` block. | `src/indexing/indexingService.ts`                                         |
| **5.4** | ☐ To Do   | **Add Guard Clause to `MessageRouter`:** In `src/messageRouter.ts`, for the `startIndexing` command, add a guard clause that checks `stateManager.isIndexing()` and returns an error message to the UI if true. | `src/messageRouter.ts`                                                    |
| **5.5** | ☐ To Do   | **Add `keybindings` to `package.json`:** Add the `contributes.keybindings` section and define keyboard shortcuts for the `openMainPanel` and `startIndexing` commands. | `package.json`                                                            |
| **5.6** | ☐ To Do   | **Test Concurrent Indexing:** Manually trigger an indexing job, and while it's running, try to trigger another one. Verify the second job is blocked and a UI notification is shown. | `(Manual Test)`                                                           |
| **5.7** | ☐ To Do   | **Test Hotkeys:** Reload the extension and verify that the newly defined keyboard shortcuts correctly trigger the "Open Main Panel" and "Start Indexing" commands. | `(Manual Test)`                                                           |

-----

### **New Document: tasklist\_sprint\_06.md**

# Task List: Sprint 6 - CI/CD Pipeline & Documentation

**Goal:** To automate the build and test process with GitHub Actions and create comprehensive user and contributor documentation.

| Task ID | Status    | Task Description (Sequential & Atomic Steps)                                                                                                                                                                   | File(s) To Modify                                  |
| :------ | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| **6.1** | ☐ To Do   | **Create GitHub Actions Workflow File:** Create a `.github/workflows/ci.yml` file.                                                                                                                            | `.github/workflows/ci.yml` (New)                   |
| **6.2** | ☐ To Do   | **Configure Workflow Triggers:** In `ci.yml`, set the `on` section to trigger the workflow on `push` to `main` and on `pull_request` events.                                        | `.github/workflows/ci.yml`                         |
| **6.3** | ☐ To Do   | **Define Build & Test Job:** Create a job that checks out the code, sets up Node.js, runs `npm install` in both the root and `/webview` directories, and runs linting and unit tests (`npm run lint`, `npm run test`). | `.github/workflows/ci.yml`                         |
| **6.4** | ☐ To Do   | **Add Build Step:** Add a step to the job that runs the `npm run vscode:prepublish` command to build the extension and create the `.vsix` package.                       | `.github/workflows/ci.yml`                         |
| **6.5** | ☐ To Do   | **Upload Artifact:** Add a final step to the job that uses the `actions/upload-artifact` action to save the generated `.vsix` file as a workflow artifact.                                 | `.github/workflows/ci.yml`                         |
| **6.6** | ☐ To Do   | **Update `README.md`:** Thoroughly document the extension's features, installation steps, and all configuration options available in the native VS Code settings.                             | `README.md`                                        |
| **6.7** | ☐ To Do   | **Create Demo GIF:** Record a short, animated GIF showing the primary user workflow (setup, index, query) and add it to the `README.md`.                                           | `README.md`, `assets/demo.gif` (New) |
| **6.8** | ☐ To Do   | **Create `CONTRIBUTING.md`:** Create a new file with clear guidelines for setting up the development environment, running tests, and submitting pull requests.                          | `CONTRIBUTING.md` (New)                            |
| **6.9** | ☐ To Do   | **Test CI Pipeline:** Push a commit or open a pull request to the `main` branch to trigger the CI workflow and verify that all steps execute successfully.                                                         | `(Manual Test on GitHub)`                          |

This completes the full set of PRDs and task lists for the project. You now have a comprehensive plan that addresses the remaining technical debt and adds the final layers of polish and automation needed for a successful public release.</prd>

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
````

## File: docs/completed/noworkspace/prd.md
````markdown
<prd>### PRD 1: Foundational - No-Workspace User Guidance

**1\. Title & Overview**

- **Project:** Code Context Engine - No-Workspace UI
    
- **Summary:** This phase will implement a user-friendly notice for users who open the extension without having a folder or repository open. The current behavior is undefined or may show a non-functional UI. This feature will detect the "no workspace" state and display a dedicated view within the webview, guiding the user to open a folder to continue.
    
- **Dependencies:** This feature builds upon the existing `WebviewManager`, `MessageRouter`, and the SvelteKit frontend. It requires the ability to pass an initial state from the extension backend to the webview upon creation.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Improve the first-time user experience and reduce initial confusion.
        
    - Increase successful user activation by guiding users past a common setup hurdle.
        
    - Decrease the number of support queries related to the extension not working in an empty VS Code window.
        
- **Developer & System Success Metrics:**
    
    - The extension correctly detects when no workspace folders are open.
        
    - The SvelteKit UI receives an initial state from the backend indicating the workspace status.
        
    - A new, dedicated "No Workspace" view is displayed instead of the main application UI when no folder is open.
        
    - The "Open Folder" button in the new view successfully triggers the native VS Code "Open Folder" dialog.
        

**3\. User Personas**

- **Devin (Developer - End User):** Devin has just installed the extension and opens it in a new, empty VS Code window to see what it does. He needs to be told clearly that a code repository must be open for the extension to function.
    
- **Frank (Frontend Developer):** Frank needs to build a new Svelte component for the "No Workspace" state. He requires a clear signal from the backend to know when to display this new component.
    

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

**Phase 1: Foundation**

 | 

**Sprint 1: Workspace State Detection & UI Scaffolding**

 | 

As Alisha (Backend Developer), I want the extension to detect if a workspace is open when the main panel is activated, so I can inform the UI of the current context.

 | 

1\. When the `openMainPanel` command is triggered, the backend checks `vscode.workspace.workspaceFolders`. <br> 2. An initial state message (e.g., `{ command: 'setInitialState', payload: { workspaceOpen: false } }`) is sent to the webview upon its creation. <br> 3. The `viewStore` in the SvelteKit app is updated to handle this new state.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As Frank (Frontend Developer), I want to create a new Svelte component that is shown when no workspace is open, so I have a dedicated view for this state.

 | 

1\. A new `NoWorkspaceView.svelte` component is created. <br> 2. The main `+page.svelte` is updated to conditionally render this new component if the `workspaceOpen` state is `false`. <br> 3. The new component contains placeholder text indicating that a folder must be opened.

 | 

  


 |
| 

**Phase 1: Foundation**

 | 

**Sprint 2: Fluent UI Implementation & Command Integration**

 | 

As Frank, I want the "No Workspace" view to be built with Fluent UI components and provide a clear call to action, so the UI is professional and guides the user.

 | 

1\. The `NoWorkspaceView.svelte` component is styled using Fluent UI components (e.g., `fluent-card`, `fluent-button`). <br> 2. The view displays a clear message, such as "Please open a folder or repository to get started." <br> 3. A prominent "Open Folder" button is displayed.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As Devin, I want to click the "Open Folder" button in the UI to bring up the native folder selection dialog, so I can easily select a project to index.

 | 

1\. Clicking the "Open Folder" button sends a `requestOpenFolder` message to the extension backend. <br> 2. The `MessageRouter` has a new handler for this message. <br> 3. The handler executes the built-in `vscode.openFolder` command. <br> 4. The native "Open Folder" dialog is successfully displayed to the user.

 | 

  


 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 4 Weeks
    
- **Sprint 1:** Workspace State Detection & UI Scaffolding (2 Weeks)
    
- **Sprint 2:** Fluent UI Implementation & Command Integration (2 Weeks)
    

**6\. Risks & Assumptions**

- **Assumption:** The `vscode.workspace.workspaceFolders` API is a reliable source for determining if a repository is open.
    
- **Risk:** The SvelteKit application's state management might become complex if not handled cleanly.
    
    - **Mitigation:** Use a dedicated Svelte store (e.g., `appStore.ts`) to manage the `workspaceOpen` state, ensuring a single source of truth for the entire UI.
        
- **Risk:** The user might open a folder and the UI doesn't automatically update.
    
    - **Mitigation:** The extension backend should listen for the `vscode.workspace.onDidChangeWorkspaceFolders` event. When a folder is opened, the extension should send a new message to the webview to update its state, causing it to re-render and show the main application UI.
### Sub-Sprint 1: Backend Logic & Svelte Component

**Objective:** To implement the backend logic for detecting the workspace state and to create the new Svelte component scaffolding for the "No Workspace" view.

**Parent Sprint:** PRD 1, Sprint 1: Workspace State Detection & UI Scaffolding

**Tasks:**

1. **Modify `CommandManager`:** In the `handleOpenMainPanel` method, add a check for `vscode.workspace.workspaceFolders`.
    
2. **Send Initial State:** When the `WebviewManager` creates a new panel, immediately `postMessage` with the workspace status (e.g., `{ command: 'initialState', payload: { isWorkspaceOpen: true/false } }`).
    
3. **Update Svelte Store:** In `webview/src/lib/stores/appStore.ts`, add a new state property `isWorkspaceOpen: boolean`.
    
4. **Create `NoWorkspaceView.svelte`:** Create a new Svelte component with placeholder content.
    
5. **Update `+page.svelte`:** Add a message listener to update the `appStore` with the initial state from the backend. Use an `{#if}` block to conditionally render `NoWorkspaceView.svelte` or the main app view based on the store's state.
    

**Acceptance Criteria:**

- When the extension is opened in an empty VS Code window, the new `NoWorkspaceView.svelte` component is rendered.
    
- When the extension is opened with a folder already open, the existing main application view is rendered.
    
- The Svelte store correctly reflects the workspace state.
    

**Dependencies:**

- A functional `MessageRouter` to handle the initial state message.
    

**Timeline:**

- **Start Date:** 2025-09-10
    
- **End Date:** 2025-09-16
    

### Sub-Sprint 2: Fluent UI & "Open Folder" Workflow

**Objective:** To build out the `NoWorkspaceView.svelte` component using Fluent UI and implement the full message-passing workflow for the "Open Folder" button.

**Parent Sprint:** PRD 1, Sprint 2: Fluent UI Implementation & Command Integration

**Tasks:**

1. **Implement `NoWorkspaceView` UI:** Rebuild the component using Fluent UI elements like `<fluent-card>` for the container and `<fluent-button>` for the call to action. Add clear, helpful text.
    
2. **Implement Button Action:** The `on:click` handler for the "Open Folder" button should send a `requestOpenFolder` message to the extension backend via the `vscodeApi` wrapper.
    
3. **Create `MessageRouter` Handler:** In `src/communication/messageRouter.ts`, add a new `case` to the `handleMessage` switch for `requestOpenFolder`.
    
4. **Execute VS Code Command:** The handler for `requestOpenFolder` should call `vscode.commands.executeCommand('vscode.openFolder')`.
    
5. **Implement Workspace Change Listener:** In `ExtensionManager.ts`, subscribe to the `vscode.workspace.onDidChangeWorkspaceFolders` event. When a new folder is added, send an `updateState` message to the webview to set `isWorkspaceOpen` to `true`.
    

**Acceptance Criteria:**

- The "No Workspace" view is styled professionally with Fluent UI.
    
- Clicking the "Open Folder" button successfully opens the native OS folder selection dialog.
    
- After a user selects a folder, the webview automatically re-renders to show the main application UI without requiring a manual reload.
    

**Dependencies:**

- Sub-Sprint 1 must be complete.
    

**Timeline:**

- **Start Date:** 2025-09-17
    
- **End Date:** 2025-09-23

</prd>
````

## File: docs/completed/react2/prd.md
````markdown
<prd>Of course. Based on your confirmation that the React and Simple Svelte webviews are now working, and your decision to standardize on React, I've created a comprehensive migration plan.

I have analyzed the existing SvelteKit application in the `webview/` directory to identify all its features, components, and state management logic. This plan breaks down the migration of that functionality into a new, robust React application within the `webview-react/` folder.

The migration is structured into two main phases, each with its own Product Requirements Document (PRD) and detailed task lists. I've included checkpoints at the end of each major sprint where you can run the extension in debug mode to verify the progress.

Here is the complete migration plan.

-----

### **New Document: `docs/todo/new-react/PRD_1_Foundational_React_Migration_and_Setup_View.md`**

### PRD 1: Foundational - React Migration & Setup View

**1. Title & Overview**

  * **Project:** Code Context Engine - Foundational React Webview Migration
  * **Summary:** This foundational phase focuses on establishing a robust, production-ready React application that will replace the existing SvelteKit webview. The primary goal is to migrate the most critical and complex part of the user interface: the initial **Setup and Diagnostics View**. This includes creating a solid component architecture, implementing a modern state management solution, and ensuring the new React UI can handle system validation, connection testing, and user configuration.
  * **Dependencies:** This project relies on the existing decoupled backend architecture (`ExtensionManager`, `MessageRouter`, etc.) and the basic working React implementation in `webview-react/`.

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Establish a single, modern, and maintainable frontend architecture using React to accelerate future UI development.
      * Create a best-in-class, frictionless onboarding experience that maximizes the number of users who successfully configure and index their first repository.
  * **Developer & System Success Metrics:**
      * The `webview-react/` directory contains a fully functional React application built with Vite and TypeScript.
      * Reusable, high-quality components for common UI patterns (e.g., validated inputs, connection testers) are created, improving development speed.
      * The new React `SetupView` successfully replicates all functionality from the Svelte version, including system checks, connection testing, and configuration.
      * A modern state management solution (e.g., Zustand) is integrated and effectively manages the setup and diagnostics state.

**3. User Personas**

  * **Devin (Developer - End User):** Devin has just installed the extension. He needs a setup process that is a clear guide, not just a form. He wants to know if his system is compatible, get help starting local services, and be confident that his settings are correct *before* he starts a long indexing process.
  * **Frank (Frontend Developer):** Frank needs a proper React development environment to efficiently build and maintain the UI. A component-based architecture allows him to create reusable and testable UI elements like `ValidatedInput` and `ConnectionTester`.

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | **Sprint 1: React Project Foundation & Core Components** | As Frank, I want to establish a robust project structure for the React webview with Fluent UI, Vite, and a state management library, so I have a scalable foundation. | 1. The `webview-react/` project is cleaned and configured with a professional folder structure (e.g., `components/`, `hooks/`, `stores/`).\<br/\>2. `@fluentui/react-components` is fully integrated and a basic theme is applied.\<br/\>3. A state management library (e.g., Zustand) is installed and a central `appStore` is created. | **2 Weeks** |
| | | As Frank, I want to build a library of reusable, high-quality "smart" components for forms and diagnostics, so we can build the UI faster and more consistently. | 1. A `ValidatedInput.svelte` component is migrated to a React `ValidatedInput.tsx` component with similar props and validation logic.\<br/\>2. A `ValidationMessage.svelte` component is migrated to `ValidationMessage.tsx`.\<br/\>3. A `ConnectionTester.svelte` component is migrated to a React `ConnectionTester.tsx` component that handles the UI for connection test states (idle, testing, success, error). | |
| **Phase 1: Foundation** | **Sprint 2: Setup & Diagnostics View** | As Frank, I want to migrate the Svelte `DiagnosticsView.svelte` and `SetupView.svelte` into a unified React view, so users have a single place for onboarding and system checks. | 1. A new `SetupView.tsx` component is created in React.\<br/\>2. It integrates the `ValidatedInput` and `ConnectionTester` components to replicate the full configuration UI for databases and embedding providers.\<br/\>3. It includes a section for system prerequisite checks (e.g., Docker status), replicating the logic from the Svelte implementation. | **2 Weeks** |
| | | As Devin, I want the new React setup view to communicate with the backend to run system checks and connection tests, so I can be confident in my configuration. | 1. The "Test Connection" button in the React `ConnectionTester` successfully sends a message to the `MessageRouter` and displays the success/error result.\<br/\>2. The `SetupView` automatically requests system validation status on mount and displays the results.\<br/\>3. The "Index Now" button is correctly enabled/disabled based on the validation and connection test status stored in the state manager. | |

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** React Project Foundation & Core Components (2 Weeks)
  * **Sprint 2:** Setup & Diagnostics View (2 Weeks)

**6. Risks & Assumptions**

  * **Assumption:** The existing `MessageRouter` backend can support the new React frontend with minimal changes. (This is a safe assumption as the communication protocol is framework-agnostic).
  * **Risk:** Migrating the state logic from Svelte stores to a new state management library in React could be complex.
      * **Mitigation:** The Svelte stores (`appStore.ts`, `viewStore.ts`) provide a clear "spec" for the new React store. The logic can be translated feature by feature. Using a simple state manager like Zustand will minimize boilerplate.
  * **Risk:** Replicating the exact look and feel of Fluent UI components from Svelte to React might have minor inconsistencies.
      * **Mitigation:** Both libraries are based on the same Fluent Design system. A thorough visual review will be part of the acceptance criteria.

-----

### **New Document: `docs/todo/new-react/tasklist_sprint_01.md`**

# Task List: Sprint 1 - React Project Foundation & Core Components

**Goal:** To establish a robust project foundation for the new React webview and create the core reusable components needed for the settings and diagnostics UI.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Clean and Restructure `webview-react/`:** Delete the existing content in `webview-react/src/`. Create new subdirectories: `components/`, `hooks/`, `stores/`, `styles/`, and `utils/`. | `webview-react/src/` |
| **1.2** | ☐ To Do | **Configure Fluent UI Provider:** In `App.tsx`, wrap the main component with `<FluentProvider>` and configure a default theme (e.g., `webDarkTheme`). | `webview-react/src/App.tsx` |
| **1.3** | ☐ To Do | **Install State Management Library:** In the `webview-react/` directory, run `npm install zustand`. | `webview-react/package.json` |
| **1.4** | ☐ To Do | **Create Central App Store:** Create a new file `stores/appStore.ts` and define a Zustand store to hold the global application state, mirroring the structure of the Svelte `appStore`. | `webview-react/src/stores/appStore.ts` (New) |
| **1.5** | ☐ To Do | **Migrate `vscodeApi.ts`:** Copy the existing `webview/src/lib/vscodeApi.ts` utility to `webview-react/src/utils/vscodeApi.ts`. Ensure it is framework-agnostic. | `webview-react/src/utils/vscodeApi.ts` (New) |
| **1.6** | ☐ To Do | **Migrate `validation.ts`:** Copy the existing `webview/src/lib/utils/validation.ts` utility to `webview-react/src/utils/validation.ts`. | `webview-react/src/utils/validation.ts` (New) |
| **1.7** | ☐ To Do | **Create `ValidatedInput.tsx`:** Create a new React component that accepts props for `label`, `value`, `onChange`, and a `validator` function. It should display validation messages. | `webview-react/src/components/ValidatedInput.tsx` (New) |
| **1.8** | ☐ To Do | **Create `ValidationMessage.tsx`:** Create a new React component to display error, warning, and suggestion messages, replicating the style of `ValidationMessage.svelte`. | `webview-react/src/components/ValidationMessage.tsx` (New) |
| **1.9** | ☐ To Do | **Create `ConnectionTester.tsx`:** Create a new React component that takes a `testFunction` prop, shows a "Test Connection" button, and displays the status (testing, success, error) and results. | `webview-react/src/components/ConnectionTester.tsx` (New) |
| **1.10** | ☐ To Do | **Write Unit Tests for Components:** Create basic unit tests for the new reusable components using Vitest and React Testing Library to ensure they render correctly. | `webview-react/src/components/*.test.tsx` (New) |

-----

### **New Document: `docs/todo/new-react/tasklist_sprint_02.md`**

# Task List: Sprint 2 - Setup & Diagnostics View

**Goal:** To migrate the Svelte `SetupView` and `DiagnosticsView` into a single, unified React component, re-establishing the full onboarding and system validation functionality.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create `SetupView.tsx` Component:** Create the main component file that will serve as the container for the entire setup and diagnostics UI. | `webview-react/src/components/SetupView.tsx` (New) |
| **2.2** | ☐ To Do | **Implement System Prerequisite Checks UI:** In `SetupView.tsx`, add a section that messages the backend on mount to get the system validation status (e.g., Docker check) and displays the results. | `webview-react/src/components/SetupView.tsx`, `src/messageRouter.ts` |
| **2.3** | ☐ To Do | **Integrate Database Configuration:** Use the `ValidatedInput` and `ConnectionTester` components to build the UI for configuring the vector database (Qdrant, etc.). | `webview-react/src/components/SetupView.tsx` |
| **2.4** | ☐ To Do | **Integrate Embedding Provider Configuration:** Use `ValidatedInput` and `ConnectionTester` to build the UI for configuring the embedding provider (Ollama, OpenAI). | `webview-react/src/components/SetupView.tsx` |
| **2.5** | ☐ To Do | **Migrate State Logic to Zustand:** Translate the state management logic from the Svelte `setupState` store to the new Zustand `appStore`. This includes `databaseStatus`, `providerStatus`, `selectedDatabase`, etc. | `webview-react/src/stores/appStore.ts` |
| **2.6** | ☐ To Do | **Implement "Index Now" Button Logic:** Add the main call-to-action button. Its `disabled` state must be reactively linked to the Zustand store (enabled only when setup is complete and valid). | `webview-react/src/components/SetupView.tsx` |
| **2.7** | ☐ To Do | **Connect UI to Backend:** Wire up all button clicks and test functions to send the correct messages to the `MessageRouter` via the `vscodeApi` utility. | `webview-react/src/components/SetupView.tsx` |
| **2.8** | ☐ To Do | **Update Main `App.tsx`:** Modify the main app component to render the new `SetupView` as the default view. | `webview-react/src/App.tsx` |
| **2.9** | ☐ To Do | **End-of-Sprint Verification:** **Run the extension in debug mode (`F5`).** Verify that the new React-based `SetupView` appears, system checks run automatically, connection tests work, and the "Index Now" button enables/disables correctly. | `(Manual Test)` |

-----

### **New Document: `docs/todo/new-react/PRD_2_Core_Application_Views_and_Functionality.md`**

### PRD 2: Core Application Views & Functionality

**1. Title & Overview**

  * **Project:** Code Context Engine - Core React Views Migration
  * **Summary:** This phase builds on the foundational React setup to migrate the primary application views that users interact with after their project is indexed. This includes the `IndexingView`, the `QueryView`, and the rich, interactive `ResultCard` components. The goal is to fully replicate and enhance the core user workflow for searching and exploring code context.
  * **Dependencies:** PRD 1 must be complete. The React `SetupView` and its underlying components must be functional.

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Deliver the core value proposition of the extension—searching and viewing results—in the new React UI.
      * Enhance the user experience of browsing search results with interactive, modern components.
  * **Developer & System Success Metrics:**
      * The `IndexingView.tsx` component correctly displays real-time progress updates from the backend.
      * The `QueryView.tsx` allows users to submit searches and displays results.
      * The `ResultCard.tsx` component correctly renders code snippets with syntax highlighting and provides interactive elements (open file, copy snippet).
      * The search history and pagination features are fully functional in the React UI.

**3. User Personas**

  * **Devin (Developer - End User):** After setting up his project, Devin wants to see the indexing progress. Once complete, he needs a clean and powerful interface to ask questions about his code and easily navigate the results. Interactive cards that let him jump to code or copy snippets are essential for his workflow.

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Core Views** | **Sprint 3: Indexing & Query Views** | As Devin, after starting the indexing process, I want to see a dedicated view with a real-time progress bar, so I know the process is running and how far along it is. | 1. A new `IndexingView.tsx` component is created.\<br/\>2. It subscribes to progress messages from the backend via the `MessageRouter`.\<br/\>3. It displays a Fluent UI `<ProgressBar>` that updates in real-time.\<br/\>4. Upon completion, it automatically triggers a state change to show the `QueryView`. | **2 Weeks** |
| | | As Devin, after my project is indexed, I want to see a simple text box where I can type my question, so I can start searching immediately. | 1. A `QueryView.tsx` component is created that contains the main search input field and a results area.\<br/\>2. Submitting a query sends a `search` message to the backend with the query text and parameters.\<br/\>3. The component listens for `searchResult` messages and stores the results in the Zustand store. | |
| **Phase 2: Core Views** | **Sprint 4: Interactive Results & History** | As Devin, I want search results to be displayed as interactive cards with syntax highlighting, so I can quickly understand the code context and take action. | 1. A `ResultCard.tsx` component is created.\<br/\>2. It uses a library like `react-syntax-highlighter` to display the code snippet.\<br/\>3. It includes a clickable file path that sends an `openFile` message to the backend.\<br/\>4. It includes a "Copy" button that copies the snippet to the clipboard. | **2 Weeks** |
| | | As Devin, I want to see my recent searches and be able to load more results if there are many, so I can easily re-run queries and browse large result sets. | 1. A `HistoryView.tsx` component is created to display recent queries from the search history.\<br/\>2. The `QueryView.tsx` conditionally displays the `HistoryView` when the search input is empty.\<br/\>3. Pagination logic is implemented: a "Load More" button appears when `hasMore` is true, which fetches the next page of results and appends them to the list. | |

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 3:** Indexing & Query Views (2 Weeks)
  * **Sprint 4:** Interactive Results & History (2 Weeks)

-----

### **New Document: `docs/todo/new-react/tasklist_sprint_03.md`**

# Task List: Sprint 3 - Indexing & Query Views

**Goal:** To migrate the `IndexingView` and `QueryView` from Svelte to React, establishing the core post-setup user workflow.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Create `IndexingView.tsx`:** Create the new React component file. | `webview-react/src/components/IndexingView.tsx` (New) |
| **3.2** | ☐ To Do | **Implement Indexing UI:** In `IndexingView.tsx`, add a Fluent UI `<ProgressBar>` and text elements to display the indexing progress and current status message. | `webview-react/src/components/IndexingView.tsx` |
| **3.3** | ☐ To Do | **Connect Indexing UI to State:** The component should subscribe to the `indexingState` slice of the Zustand store and update its UI based on `isIndexing`, `progress`, and `message`. | `webview-react/src/components/IndexingView.tsx`, `webview-react/src/stores/appStore.ts` |
| **3.4** | ☐ To Do | **Handle Indexing Completion:** Add logic (e.g., a `useEffect` hook) to detect when `isIndexing` becomes `false` after being `true`, and trigger the state transition to the 'query' view. | `webview-react/src/components/IndexingView.tsx`, `webview-react/src/stores/appStore.ts` |
| **3.5** | ☐ To Do | **Create `QueryView.tsx`:** Create the new React component file for the main search interface. | `webview-react/src/components/QueryView.tsx` (New) |
| **3.6** | ☐ To Do | **Implement Query Input UI:** Add a Fluent UI `<Textarea>` (or similar) for the query input and a `<Button>` to submit the search. | `webview-react/src/components/QueryView.tsx` |
| **3.7** | ☐ To Do | **Connect Query Input to Backend:** Implement the `onSubmit` handler to send a `search` message to the backend via `vscodeApi`, including the query and any advanced parameters. | `webview-react/src/components/QueryView.tsx` |
| **3.8** | ☐ To Do | **Implement Results Area:** Add a container element that will be used to display the search results. | `webview-react/src/components/QueryView.tsx` |
| **3.9** | ☐ To Do | **Listen for Search Results:** In `QueryView.tsx`, add a `useEffect` hook to set up a message listener for `searchResult` messages from the backend and update the Zustand `searchState`. | `webview-react/src/components/QueryView.tsx`, `webview-react/src/stores/appStore.ts` |
| **3.10** | ☐ To Do | **Update `App.tsx` View Logic:** Modify the main `App.tsx` to conditionally render `SetupView`, `IndexingView`, or `QueryView` based on a global state (e.g., from an `appStore` or `viewStore`). | `webview-react/src/App.tsx` |

-----

### **New Document: `docs/todo/new-react/tasklist_sprint_04.md`**

# Task List: Sprint 4 - Interactive Results & History

**Goal:** To migrate the `ResultCard` and `HistoryView` components, providing a rich, interactive experience for browsing search results.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Install Syntax Highlighter:** In `webview-react/`, run `npm install react-syntax-highlighter` and `@types/react-syntax-highlighter`. | `webview-react/package.json` |
| **4.2** | ☐ To Do | **Create `ResultCard.tsx`:** Create the new React component that accepts a `result` object as a prop. | `webview-react/src/components/ResultCard.tsx` (New) |
| **4.3** | ☐ To Do | **Implement Syntax Highlighting:** Use the `<SyntaxHighlighter>` component to render the `result.snippet` with the correct language and a VS Code-like theme. | `webview-react/src/components/ResultCard.tsx` |
| **4.4** | ☐ To Do | **Implement "Open File" Action:** Make the file path in the card a clickable element that sends an `openFile` message to the backend with the path and line number. | `webview-react/src/components/ResultCard.tsx` |
| **4.5** | ☐ To Do | **Implement "Copy Snippet" Action:** Add a "Copy" button that uses `navigator.clipboard.writeText()` to copy the snippet. | `webview-react/src/components/ResultCard.tsx` |
| **4.6** | ☐ To Do | **Integrate `ResultCard` into `QueryView`:** Modify `QueryView.tsx` to map over the `searchResults` from the store and render a `ResultCard` for each item. | `webview-react/src/components/QueryView.tsx` |
| **4.7** | ☐ To Do | **Create `HistoryView.tsx`:** Create a new React component to display the list of search history items. | `webview-react/src/components/HistoryView.tsx` (New) |
| **4.8** | ☐ To Do | **Integrate `HistoryView`:** In `QueryView.tsx`, conditionally render the `HistoryView` component when the search input is empty and there are no results. | `webview-react/src/components/QueryView.tsx` |
| **4.9** | ☐ To Do | **Implement Pagination Logic:** In `QueryView.tsx`, add a "Load More" button that is visible only when `hasMore` is true in the `searchState`. | `webview-react/src/components/QueryView.tsx` |
| **4.10** | ☐ To Do | **Connect "Load More":** The button's click handler should send a new `search` message to the backend, but with an incremented `page` number. | `webview-react/src/components/QueryView.tsx` |
| **4.11**| ☐ To Do | **Append Paginated Results:** The message listener in `QueryView.tsx` must be updated to *append* new results to the existing list when the response is for a page \> 1. | `webview-react/src/components/QueryView.tsx`, `webview-react/src/stores/appStore.ts` |
| **4.12**| ☐ To Do | **End-of-Sprint Verification:** **Run the extension in debug mode (`F5`).** Perform a search. Verify that results appear as interactive cards with syntax highlighting. Test the "Open File" and "Copy" buttons. Test pagination with a large result set. Clear the search to see the history view. | `(Manual Test)` |

-----

This concludes the detailed migration plan. Following these PRDs will guide your team through a structured and comprehensive process to transition your webview to a modern React architecture.</prd>

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
````

## File: docs/completed/setup/prd.md
````markdown
<prd>Of course. I've analyzed the roadmap and will now generate the detailed Product Requirements Documents (PRDs) for each phase of the VS Code extension project.

Here is the first PRD, which covers the foundational setup of the extension.

-----

### **New Document: PRD 1: Foundational - Extension Boilerplate & UI Setup**

**1. Title & Overview**

  * **Project:** Code Context Engine - VS Code Extension
  * **Summary:** This phase establishes the core technical foundation for the VS Code extension. It includes setting up the project with the chosen technology stack (SvelteKit and TypeScript), creating the basic user interface using Microsoft's Fluent UI, and ensuring the basic extension can be loaded and run within a VS Code development environment.
  * **Dependencies:** Requires Node.js, npm/yarn, and the VS Code Extension Development Kit.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Rapidly create a tangible, runnable prototype to validate the chosen technology stack.
      * Establish a solid foundation for the user interface that can be easily extended in future phases.
  * **Developer & System Success Metrics:**
      * The VS Code extension can be successfully compiled, loaded, and activated in a development host.
      * The main SvelteKit-based UI panel renders correctly within VS Code.
      * Core UI components (buttons, progress bars) from the Fluent UI library are successfully integrated and functional.
      * The project structure is well-organized, with clear separation between the extension's backend (TypeScript) and frontend (SvelteKit) concerns.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin works on large, complex codebases and needs a tool to help him quickly understand code context. He expects a clean, intuitive, and responsive user interface that feels native to the VS Code environment.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | **Sprint 1: Boilerplate & UI Scaffolding** | As a developer, I want a VS Code extension project set up with SvelteKit for the UI and TypeScript for the backend logic, so we have a standard, modern technology stack. | 1. A new VS Code extension project is generated using the official templates.\<br\>2. SvelteKit is successfully integrated as the webview provider for the extension's UI.\<br\>3. TypeScript is configured for both the extension's main process (backend) and the SvelteKit frontend.\<br\>4. The project can be compiled and run without errors. | **2 Weeks** |
| | | As Devin, I want to see a main panel for the extension with a clear "Index Now" button, so I know how to start the core process. | 1. The extension contributes a new view/panel to the VS Code UI.\<br\>2. This panel renders a SvelteKit component.\<br\>3. The component displays a prominent button with the text "Index Now" using a Fluent UI `Button` component.\<br\>4. A placeholder for a progress bar is visible on the UI. | |
| | | As a developer, I want to integrate Microsoft's Fluent UI library into the SvelteKit project, so we can build a consistent and professional-looking UI quickly. | 1. The Fluent UI Svelte library is added as a project dependency.\<br\>2. A sample Fluent UI component (e.g., a button or card) is successfully rendered within the extension's webview.\<br\>3. The styling of the Fluent UI components matches the user's current VS Code theme (light/dark). | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 2 Weeks
  * **Sprint 1:** Boilerplate & UI Scaffolding (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** SvelteKit can be integrated smoothly as a webview UI for a VS Code extension without significant compatibility issues.
  * **Risk:** Integrating Fluent UI with SvelteKit might have unforeseen styling conflicts or component incompatibilities.
      * **Mitigation:** Dedicate early time in the sprint to create a small proof-of-concept integrating a few key Fluent UI components to identify and resolve any issues.
  * **Risk:** The initial project setup and build configuration for a hybrid TypeScript/SvelteKit extension might be more complex than anticipated.
      * **Mitigation:** Allocate sufficient time for research and follow best practices from official documentation and community examples.

-----

### **New Document: Sub-Sprint 1: VS Code Extension Boilerplate Setup**

**Objective:**
To create the fundamental file structure and configuration for a new VS Code extension using TypeScript.

**Parent Sprint:**
PRD 1, Sprint 1: Boilerplate & UI Scaffolding

**Tasks:**

1.  **Generate Extension:** Use `yo code` to generate a new TypeScript-based VS Code extension.
2.  **Configure `package.json`:** Define the extension's name, publisher, and activation events.
3.  **Establish Project Structure:** Create separate directories for the `extension` (backend) and `webview` (frontend) source code.
4.  **Initial Backend Logic:** Write the initial `extension.ts` file, including the `activate` and `deactivate` functions.

**Acceptance Criteria:**

  * The extension can be launched in a VS Code development host.
  * A "Hello World" command from the extension can be successfully executed from the command palette.
  * The project structure is clean and logically separated.

**Dependencies:**

  * Node.js and `yo code` generator installed.

**Timeline:**

  * **Start Date:** 2025-10-27
  * **End Date:** 2025-10-31

-----

### **New Document: Sub-Sprint 2: SvelteKit and Fluent UI Integration**

**Objective:**
To set up the SvelteKit frontend and integrate the Fluent UI component library, creating the initial user interface.

**Parent Sprint:**
PRD 1, Sprint 1: Boilerplate & UI Scaffolding

**Tasks:**

1.  **Initialize SvelteKit:** Set up a new SvelteKit project within the `webview` directory.
2.  **Configure Webview:** In `extension.ts`, create the logic to render the SvelteKit app inside a VS Code webview panel.
3.  **Install Fluent UI:** Add the Fluent UI Svelte library as a dependency to the SvelteKit project.
4.  **Implement UI:** Create a Svelte component for the main panel that includes an "Index Now" button and a progress bar from the Fluent UI library.
5.  **Theme Integration:** Ensure the UI components automatically adapt to VS Code's light and dark themes.

**Acceptance Criteria:**

  * The SvelteKit application renders correctly inside the VS Code extension panel.
  * The "Index Now" button is visible and interactive.
  * UI components correctly reflect the active VS Code theme.

**Dependencies:**

  * Sub-Sprint 1 must be complete.

**Timeline:**

  * **Start Date:** 2025-11-03
  * **End Date:** 2025-11-07

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - Boilerplate & UI Scaffolding

**Goal:** To establish the project's foundation by setting up the VS Code extension with a SvelteKit frontend and Fluent UI.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Generate VS Code Extension:** Run `npx yo code` and select "New Extension (TypeScript)". | `(Project Root)` |
| **1.2** | ☐ To Do | **Initialize SvelteKit Project:** In a new `webview` directory, run `npm create svelte@latest .` and configure it for a single-page app. | `webview/` |
| **1.3** | ☐ To Do | **Install Dependencies:** Add `svelte-fluent-ui` to the `webview`'s `package.json` and install. | `webview/package.json` |
| **1.4** | ☐ To Do | **Create Webview Panel Logic:** In `extension.ts`, write the TypeScript code to create and manage a `WebviewPanel`. | `src/extension.ts` |
| **1.5** | ☐ To Do | **Load Svelte App in Webview:** Configure the webview to load the compiled `index.html` from the SvelteKit `build` directory. | `src/extension.ts` |
| **1.6** | ☐ To Do | **Build Main UI Component:** Create a `MainPanel.svelte` component displaying a `<Button>` and `<ProgressBar>` from Fluent UI. | `webview/src/lib/MainPanel.svelte` |
| **1.7** | ☐ To Do | **Implement Theme Handling:** Use VS Code theme CSS variables to ensure Fluent UI components adapt to light/dark modes. | `webview/src/app.html` |
| **1.8** | ☐ To Do | **Test Extension:** Run the extension in a development host to verify the UI panel opens and displays the SvelteKit app correctly. | `(Launch Configuration)` |

Of course. Here are the final PRDs and task lists to complete the project plan for your VS Code extension.

-----

### **New Document: PRD 3: Context Engine API & Feature Enhancement**

**1. Title & Overview**

  * **Project:** Code Context Engine - API & Settings
  * **Summary:** This phase focuses on exposing the indexed data through an internal API and building the user-facing settings UI. This will enable the core functionality of the extension—querying the codebase for context—and allow users to configure the extension to their specific needs, such as changing the database connection or selecting a different embedding provider.
  * **Dependencies:** PRD 2 must be complete. The codebase must be successfully indexed and stored in a Qdrant instance.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Deliver the primary value proposition of the extension by allowing users to query their code contextually.
      * Increase user retention and satisfaction by providing customization options.
  * **Developer & System Success Metrics:**
      * The internal API successfully handles queries like "list files related to X" and "get content of Y" by performing a vector search.
      * API response times for typical queries are under 500ms.
      * The settings UI correctly reads from and writes to the VS Code workspace configuration.
      * Changing a setting (e.g., the embedding provider) is correctly reflected in the indexing service on the next run.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin wants to ask his codebase questions in plain English. He needs to be able to ask for the content of a specific file or find other files related to the one he's working on to speed up his development workflow. He also wants to easily configure the extension to use his preferred embedding model.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 3: API & Settings** | **Sprint 4: Context Query API** | As Devin, I want to be able to ask the extension to retrieve the content of a specific file so I can view it without having to manually search for it. | 1. An internal API endpoint is created to handle "get file content" requests.\<br/\>2. The API performs a search in the vector index to find the most likely file matching the query.\<br/\>3. The full, up-to-date content of the identified file is returned. | **2 Weeks** |
| | | As Devin, I want to ask for a list of files related to a specific file or concept so I can understand the connections within my codebase. | 1. An internal API endpoint is created for "find related files" requests.\<br/\>2. The API vectorizes the input query and performs a similarity search in Qdrant.\<br/\>3. A ranked list of the top 5 most relevant file paths is returned based on the search results. | |
| **Phase 3: API & Settings** | **Sprint 5: Settings UI & Configuration** | As Devin, I want a dedicated settings page for the extension so I can configure the database and embedding provider for each of my projects. | 1. A new webview panel is created for the extension's settings.\<br/\>2. The UI includes a dropdown to select an embedding provider (Ollama, OpenAI, etc.).\<br/\>3. The UI includes a text input for the database connection string.\<br/\>4. The settings are saved to the workspace's `settings.json` file under a unique extension-specific key. | **2 Weeks** |
| | | As a developer, I want the extension's backend services to read their configuration from the workspace settings so that user changes are applied correctly. | 1. The `IndexingService` reads the selected embedding provider from the VS Code workspace configuration.\<br/\>2. The `QdrantService` reads the database connection string from the configuration.\<br/\>3. The extension gracefully handles missing or invalid configuration values by falling back to sensible defaults. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 4:** Context Query API (2 Weeks)
  * **Sprint 5:** Settings UI & Configuration (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** Simple vector similarity search will be sufficient to find "related" files accurately for the initial version.
  * **Risk:** The quality of search results might be poor if the user's query is ambiguous, leading to user frustration.
      * **Mitigation:** For the initial version, focus on clear query patterns. In a future phase, introduce an LLM to refine user queries before they are sent to the vector search.
  * **Risk:** Securely storing and handling user-provided secrets (like an OpenAI API key) is critical.
      * **Mitigation:** Use VS Code's official `SecretStorage` API for any sensitive information instead of storing it in plain text in the settings file.

-----

### **New Document: Sub-Sprint 5: Implement Context Query API**

**Objective:**
To build the internal backend API that will allow the frontend to query the indexed codebase.

**Parent Sprint:**
PRD 3, Sprint 4: Context Query API

**Tasks:**

1.  **Create `ContextService`:** Develop a new service in the TypeScript backend to orchestrate context retrieval.
2.  **Implement `getFileContent`:** Create a method that takes a file path query, uses the embedding provider and Qdrant client to find the best match, and then reads the file content from the disk.
3.  **Implement `findRelatedFiles`:** Create a method that takes a concept or file path, generates an embedding for it, and performs a vector similarity search in Qdrant to find the top N most similar file chunks.
4.  **Expose via Message Passing:** Use the standard VS Code webview message passing interface to allow the SvelteKit frontend to call these backend service methods.

**Acceptance Criteria:**

  * Sending a "getFileContent" message from the webview returns the correct file's content.
  * Sending a "findRelatedFiles" message returns an array of relevant file paths.
  * The API handles cases where no relevant files are found gracefully.

**Dependencies:**

  * PRD 2 must be complete.

**Timeline:**

  * **Start Date:** 2025-11-24
  * **End Date:** 2025-11-28

-----

### **New Document: Sub-Sprint 6: Develop Settings UI**

**Objective:**
To create the user-facing settings panel where users can configure the extension's behavior.

**Parent Sprint:**
PRD 3, Sprint 5: Settings UI & Configuration

**Tasks:**

1.  **Register Settings Command:** Add a new command to `package.json` that will open the settings webview.
2.  **Create Settings Webview:** Develop the TypeScript logic in `extension.ts` to create and show a new webview panel for settings.
3.  **Build Svelte UI:** Create a `Settings.svelte` component using Fluent UI components (`<Select>`, `<TextField>`) for the provider and database configuration.
4.  **Implement State Management:** The Svelte component should read the current configuration from VS Code settings on load and use message passing to send updated values back to the extension backend to be saved.

**Acceptance Criteria:**

  * A new command in the command palette successfully opens the settings UI.
  * The UI correctly displays the currently saved settings.
  * Changing a value in the UI and clicking "Save" correctly updates the workspace `settings.json` file.

**Dependencies:**

  * Sub-Sprint 5 must be complete.

**Timeline:**

  * **Start Date:** 2025-12-01
  * **End Date:** 2025-12-05

-----

### **New Document: tasklist\_sprint\_04.md**

# Task List: Sprint 4 - Context Query API

**Goal:** To build and expose the internal API for querying the indexed code context.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `ContextService`:** In the backend, create a new `contextService.ts` file to house the query logic. | `src/context/contextService.ts` |
| **4.2** | ☐ To Do | **Implement `getFileContent` method:** Add logic to perform a vector search for the file path and then read the content from disk using `vscode.workspace.fs`. | `src/context/contextService.ts` |
| **4.3** | ☐ To Do | **Implement `findRelatedFiles` method:** Add logic to perform a similarity search in Qdrant and return a list of unique file paths from the results. | `src/context/contextService.ts` |
| **4.4** | ☐ To Do | **Set up Webview Message Handling:** In `extension.ts`, add a `message` listener to the webview panel to handle incoming requests from the frontend. | `src/extension.ts` |
| **4.5** | ☐ To Do | **Route API Calls:** In the message handler, create a `switch` statement to route requests (e.g., `'getFileContent'`) to the appropriate method in `ContextService`. | `src/extension.ts` |
| **4.6** | ☐ To Do | **Send Results to Frontend:** Use the `webview.postMessage` method to send the results from the service back to the SvelteKit UI. | `src/extension.ts` |
| **4.7** | ☐ To Do | **Create Frontend API Client:** In the SvelteKit app, create a wrapper service (`vscodeApi.ts`) that simplifies posting and listening for messages from the extension backend. | `webview/src/lib/vscodeApi.ts` |

-----

### **New Document: tasklist\_sprint\_05.md**

# Task List: Sprint 5 - Settings UI & Configuration

**Goal:** To build the settings UI and connect it to the VS Code configuration system.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **5.1** | ☐ To Do | **Define Configuration Schema:** In `package.json`, under the `contributes.configuration` section, define the properties for the settings (e.g., `code-context.embeddingProvider`). | `package.json` |
| **5.2** | ☐ To Do | **Register `openSettings` command:** In `package.json`, add a new command to the `contributes.commands` section. | `package.json` |
| **5.3** | ☐ To Do | **Implement command in `extension.ts`:** Register the command to create and show the settings webview panel. | `src/extension.ts` |
| **5.4** | ☐ To Do | **Create `Settings.svelte` component:** Build the UI with a `<Select>` for providers and a `<TextField>` for the database URI. | `webview/src/routes/settings.svelte` |
| **5.5** | ☐ To Do | **Load Initial Settings:** In the Svelte component, use the `vscodeApi` service to request the current configuration when the component mounts. | `webview/src/routes/settings.svelte` |
| **5.6** | ☐ To Do | **Save Settings:** On button click, send a message with the updated settings object to the extension backend. | `webview/src/routes/settings.svelte` |
| **5.7** | ☐ To Do | **Implement `saveConfiguration` handler:** In the backend message listener, handle the "saveSettings" message by calling `vscode.workspace.getConfiguration().update()`. | `src/extension.ts` |
| **5.8** | ☐ To Do | **Refactor Services to Use Config:** Update `IndexingService` and `QdrantService` to read their settings from `vscode.workspace.getConfiguration()` instead of hardcoded values. | `src/indexing/indexingService.ts`, `src/db/qdrantService.ts` |

-----

### **New Document: PRD 4: Advanced Features & Polish**

**1. Title & Overview**

  * **Project:** Code Context Engine - Advanced Indexing & Publishing
  * **Summary:** This final phase focuses on enhancing the quality of the index by integrating data from the Language Server Protocol (LSP), establishing a professional release process with a CI/CD pipeline, and creating comprehensive documentation to support users and future contributors.
  * **Dependencies:** PRD 3 must be complete.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Gain a competitive advantage by creating a more intelligent and contextually-aware index than simple AST parsing can provide.
      * Ensure long-term project health and user trust through a reliable release process and clear documentation.
  * **Developer & System Success Metrics:**
      * The indexing process can successfully capture and store LSP data like "go to definition" and "find all references" links between code chunks.
      * A GitHub Actions workflow is created that automatically builds, lints, tests, and packages the extension on every push to the `main` branch.
      * The extension is successfully published to the Visual Studio Code Marketplace.
      * A `README.md` and contributing guide are created that meet open-source community standards.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 4: Polish** | **Sprint 6: LSP Integration & DevOps** | As Alisha, I want to enhance the index by capturing data from the Language Server Protocol (LSP) so that we can understand relationships between code. | 1. The extension can programmatically access the active LSP for supported languages.\<br/\>2. During indexing, the system queries the LSP for information like definitions and references for each code chunk.\<br/\>3. This relationship data is stored as metadata alongside the vectors in Qdrant. | **2 Weeks** |
| | | As Alisha, I want to create a CI/CD pipeline using GitHub Actions so that we can automate the build, test, and release process. | 1. A new GitHub Actions workflow file is created.\<br/\>2. The workflow is triggered on pushes and pull requests.\<br/\>3. The workflow includes stages for installing dependencies, linting, running unit tests, and building the extension package (`.vsix`). | |
| **Phase 4: Polish** | **Sprint 7: Documentation & Publishing** | As Devin, I want clear, comprehensive documentation for the extension so that I know how to install, configure, and use it effectively. | 1. The `README.md` file is updated with a feature list, installation instructions, and a guide on configuring the settings.\<br/\>2. An animated GIF is included in the README to demonstrate the core workflow.\<br/\>3. A `CONTRIBUTING.md` file is created with guidelines for new developers. | **2 Weeks** |
| | | As a project owner, I want to publish the extension to the VS Code Marketplace so that it is easily discoverable and accessible to all users. | 1. A publisher identity is created on the VS Code Marketplace.\<br/\>2. The GitHub Actions pipeline is updated with a manual "release" trigger.\<br/\>3. When triggered, the pipeline automatically packages and publishes the latest version of the extension to the marketplace. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 6:** LSP Integration & DevOps (2 Weeks)
  * **Sprint 7:** Documentation & Publishing (2 Weeks)

-----

### **New Document: tasklist\_sprint\_06.md**

# Task List: Sprint 6 - LSP Integration & DevOps

**Goal:** To enrich the index with LSP data and automate the build and test process.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **6.1** | ☐ To Do | **Research LSP Interaction:** Investigate how to programmatically interact with a language server using the `vscode.lsp` API. | `(Documentation)` |
| **6.2** | ☐ To Do | **Update `IndexingService` for LSP:** Modify the service to, for each chunk, invoke LSP commands like `vscode.executeDefinitionProvider` to find related symbols. | `src/indexing/indexingService.ts` |
| **6.3** | ☐ To Do | **Extend Qdrant Metadata:** Update the `QdrantService` to store the new relationship metadata (e.g., `definesSymbol`, `referencesSymbol`) along with the vector. | `src/db/qdrantService.ts` |
| **6.4** | ☐ To Do | **Create GitHub Actions Workflow:** Create a `.github/workflows/ci.yml` file. | `.github/workflows/ci.yml` |
| **6.5** | ☐ To Do | **Add Linting and Testing Steps:** Add jobs to the workflow for running `eslint` and `vitest`. | `.github/workflows/ci.yml` |
| **6.6** | ☐ To Do | **Add Build Step:** Add a job that runs `vsce package` to create the `.vsix` extension file and uploads it as a build artifact. | `.github/workflows/ci.yml` |

-----

### **New Document: tasklist\_sprint\_07.md**

# Task List: Sprint 7 - Documentation & Publishing

**Goal:** To create high-quality documentation and publish the extension to the marketplace.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **7.1** | ☐ To Do | **Write `README.md` Content:** Draft the main sections: Features, Requirements, Installation, and Configuration. | `README.md` |
| **7.2** | ☐ To Do | **Create Demo GIF:** Use screen recording software to capture the indexing and querying workflow and save it as an optimized GIF. | `assets/demo.gif` |
| **7.3** | ☐ To Do | **Write `CONTRIBUTING.md`:** Create a guide for developers on how to set up the project, run tests, and submit pull requests. | `CONTRIBUTING.md` |
| **7.4** | ☐ To Do | **Create Marketplace Publisher:** Register a new publisher ID in the Microsoft Partner Center. | `(External)` |
| **7.5** | ☐ To Do | **Add Release Workflow:** Update the `ci.yml` file to include a manually triggered `release` job. | `.github/workflows/ci.yml` |
| **7.6** | ☐ To Do | **Implement Publishing Step:** The `release` job should use `vsce publish` with a personal access token (stored as a GitHub secret) to upload the extension. | `.github/workflows/ci.yml` |
| **7.7** | ☐ To Do | **Test the Release:** Manually trigger the release workflow for a `v1.0.0` tag and verify that the extension appears on the VS Code Marketplace. | `(External)` |

This completes the full set of PRDs and task lists for the Code Context Engine project. You now have a comprehensive, phased plan to guide you from the initial boilerplate to a published and feature-rich VS Code extension.

Of course. Here is a comprehensive guide to implementing Sprint 2: "AST Parser & Code Chunking" for your VS Code extension. This guide includes analysis, code examples, and API information based on the PRD and my research.

### **Analysis of `repomix-roocode.xml`**

The provided `repomix-roocode.xml` file confirms that the project is a standard SvelteKit application using TypeScript and Vitest for testing. The presence of `setup.ts` with JSDOM mocks indicates a robust testing environment. The project structure appears to be conventional, which makes integrating the new services straightforward. The key takeaway is that the new backend services should be written in TypeScript and can be unit-tested using the existing Vitest setup.

-----

### **Prerequisites and Setup**

Before you start coding, you'll need to add a few dependencies to your project for file parsing and AST manipulation.

**1. Install `tree-sitter` and Language Grammars:**

`tree-sitter` is a powerful parser generator tool. You'll need the core library and the specific grammar for each language you want to support.

```bash
npm install tree-sitter tree-sitter-typescript tree-sitter-python tree-sitter-c-sharp
```

**2. Install Helper Libraries:**

You'll also need a library to handle `.gitignore` files and another for efficient file system traversal.

```bash
npm install glob ignore
```

-----

### **Implementation Guide**

Here's a step-by-step guide to building the services outlined in `tasklist_sprint_02.md`.

#### **1. The `FileWalker` Service**

This service is responsible for finding all the files in the workspace that need to be indexed, while respecting the rules in `.gitignore`.

**API Information:**

  * **`vscode.workspace.fs`:** The official VS Code API for reading files and directories. It's asynchronous and designed to work with virtual file systems.
  * **`glob` package:** A library for matching files using patterns.
  * **`ignore` package:** A high-performance library for parsing `.gitignore` files.

**Code Example (`src/indexing/fileWalker.ts`):**

```typescript
import * as vscode from 'vscode';
import { glob } from 'glob';
import { promises as fs } from 'fs';
import path from 'path';
import ignore from 'ignore';

export class FileWalker {
    private ig = ignore();

    constructor(private workspaceRoot: string) {}

    private async loadGitignore(): Promise<void> {
        try {
            const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
            const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
            this.ig.add(gitignoreContent);
        } catch (error) {
            console.log("No .gitignore file found or could not be read.");
        }
    }

    public async findAllFiles(): Promise<string[]> {
        await this.loadGitignore();
        const files = await glob('**/*.{ts,js,py,cs}', {
            cwd: this.workspaceRoot,
            nodir: true,
            absolute: true,
        });

        return files.filter(file => !this.ig.ignores(path.relative(this.workspaceRoot, file)));
    }
}
```

#### **2. The `AstParser` Service**

This service takes a file and its content, and using `tree-sitter`, parses it into an Abstract Syntax Tree (AST).

**API Information:**

  * **`tree-sitter` package:** The core library for parsing.
  * **Language-specific `tree-sitter` packages:** (e.g., `tree-sitter-typescript`) provide the grammars.

**Code Example (`src/parsing/astParser.ts`):**

```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import CSharp from 'tree-sitter-c-sharp';

export class AstParser {
    private parser = new Parser();

    public parse(language: 'typescript' | 'python' | 'csharp', code: string): Parser.Tree {
        switch (language) {
            case 'typescript':
                this.parser.setLanguage(TypeScript.typescript);
                break;
            case 'python':
                this.parser.setLanguage(Python);
                break;
            case 'csharp':
                this.parser.setLanguage(CSharp);
                break;
        }
        return this.parser.parse(code);
    }
}
```

#### **3. The `Chunker` Service**

This service takes an AST and chunks the code into meaningful segments (e.g., functions, classes).

**API Information:**

  * **`tree-sitter` `Query` API:** This allows you to find specific nodes in the AST using a LISP-like query language.

**Code Example (`src/parsing/chunker.ts`):**

```typescript
import Parser from 'tree-sitter';

export interface CodeChunk {
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    type: string;
}

export class Chunker {
    public chunk(filePath: string, tree: Parser.Tree, code: string): CodeChunk[] {
        const query = new Parser.Query(tree.getLanguage(), `
            (function_declaration) @function
            (class_declaration) @class
            (method_declaration) @method
        `);

        const matches = query.matches(tree.rootNode);
        const chunks: CodeChunk[] = [];

        for (const match of matches) {
            for (const capture of match.captures) {
                const node = capture.node;
                chunks.push({
                    filePath,
                    content: node.text,
                    startLine: node.startPosition.row,
                    endLine: node.endPosition.row,
                    type: capture.name,
                });
            }
        }
        return chunks;
    }
}
```

#### **4. The `IndexingService` (Orchestrator)**

This service brings everything together. It uses the `FileWalker` to get the files, the `AstParser` to parse them, and the `Chunker` to create the final code chunks.

**API Information:**

  * **`vscode.window.withProgress`:** A VS Code API for showing progress notifications to the user.

**Code Example (`src/indexing/indexingService.ts`):**

```typescript
import * as vscode from 'vscode';
import { FileWalker } from './fileWalker';
import { AstParser } from '../parsing/astParser';
import { Chunker, CodeChunk } from '../parsing/chunker';

export class IndexingService {
    private fileWalker: FileWalker;
    private astParser = new AstParser();
    private chunker = new Chunker();

    constructor(private workspaceRoot: string) {
        this.fileWalker = new FileWalker(workspaceRoot);
    }

    public async startIndexing(): Promise<CodeChunk[]> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Indexing Repository",
            cancellable: true
        }, async (progress, token) => {
            if (token.isCancellationRequested) {
                return [];
            }

            progress.report({ message: "Discovering files..." });
            const files = await this.fileWalker.findAllFiles();
            const totalFiles = files.length;
            let indexedFiles = 0;
            const allChunks: CodeChunk[] = [];

            for (const file of files) {
                if (token.isCancellationRequested) {
                    break;
                }

                indexedFiles++;
                progress.report({
                    message: `Parsing ${file}`,
                    increment: (1 / totalFiles) * 100
                });

                const content = await vscode.workspace.fs.readFile(vscode.Uri.file(file)).then(buffer => buffer.toString());
                const language = this.getLanguage(file);
                if (language) {
                    const tree = this.astParser.parse(language, content);
                    const chunks = this.chunker.chunk(file, tree, content);
                    allChunks.push(...chunks);
                }
            }

            return allChunks;
        });
    }

    private getLanguage(filePath: string): 'typescript' | 'python' | 'csharp' | null {
        if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
            return 'typescript';
        }
        if (filePath.endsWith('.py')) {
            return 'python';
        }
        if (filePath.endsWith('.cs')) {
            return 'csharp';
        }
        return null;
    }
}
```

### **Putting It All Together**

You would trigger the `IndexingService` from your main `extension.ts` file, likely when the user clicks the "Index Now" button you created in Sprint 1.

**Code Example (`src/extension.ts`):**

```typescript
import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';

export function activate(context: vscode.ExtensionContext) {
    // ... other activation code

    let disposable = vscode.commands.registerCommand('your-extension.startIndexing', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const indexingService = new IndexingService(workspaceRoot);
            const chunks = await indexingService.startIndexing();
            console.log(`Indexing complete. Found ${chunks.length} chunks.`);
            // Here you would proceed to Sprint 3: Vectorization & DB Integration
        } else {
            vscode.window.showErrorMessage("Please open a folder or workspace to index.");
        }
    });

    context.subscriptions.push(disposable);
}
```

This guide provides the core implementation for Sprint 2. You now have a robust system for walking the file tree, parsing code with `tree-sitter`, and chunking it into meaningful segments. The next step will be to take these chunks and vectorize them for storage in Qdrant, as outlined in Sprint 3.

Of course. Here is the implementation guide for Sprint 3, which focuses on vectorizing the code chunks and storing them in the Qdrant database.

### **Analysis of `repomix-roocode.xml`**

The `repomix-roocode.xml` file shows a standard SvelteKit project setup. The key takeaway is that the project is well-structured, uses TypeScript, and has a testing framework in place. This means that the new services for vectorization and database interaction can be seamlessly integrated and tested within the existing architecture. The presence of a `setup.ts` file for tests also indicates that we can easily mock external services like Ollama, OpenAI, and the Qdrant client for robust unit testing.

-----

### **Prerequisites and Setup**

Before you begin, you need to set up the necessary tools and dependencies for this sprint.

**1. Install Docker:**

If you don't already have it, install **Docker Desktop** on your development machine. This is required to run the Qdrant vector database locally.

**2. Install Dependencies:**

You'll need the official Qdrant client and a library for making HTTP requests to Ollama or other embedding providers.

```bash
npm install @qdrant/js-client-rest axios
```

**3. Set up a `.env` file (Optional but Recommended):**

Create a `.env` file in the root of your project to store API keys and other secrets. Make sure to add `.env` to your `.gitignore` file.

```
OPENAI_API_KEY="your-openai-api-key"
```

-----

### **Implementation Guide**

Here's a step-by-step guide to building the services outlined in `tasklist_sprint_03.md`.

#### **1. Docker Compose for Qdrant**

Create a `docker-compose.yml` file in the root of your project. This will allow you to easily start and stop the Qdrant database.

**Code Example (`docker-compose.yml`):**

```yaml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
```

You can now start Qdrant by running `docker-compose up` in your terminal.

#### **2. The `QdrantService`**

This service will handle all communication with the Qdrant database, including creating collections and upserting data.

**API Information:**

  * **`@qdrant/js-client-rest` package:** The official JavaScript/TypeScript client for Qdrant.
  * **Key methods:**
      * `QdrantClient`: The main class for interacting with the Qdrant API.
      * `client.getCollections()`: Lists all available collections.
      * `client.createCollection()`: Creates a new collection with a specified schema.
      * `client.upsert()`: Inserts or updates points (vectors and their payloads) in a collection.

**Code Example (`src/db/qdrantService.ts`):**

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';
import type { CodeChunk } from '../parsing/chunker';

export class QdrantService {
    private client = new QdrantClient({ url: 'http://localhost:6333' });

    public async createCollectionIfNotExists(collectionName: string): Promise<void> {
        const collections = await this.client.getCollections();
        if (!collections.collections.find(c => c.name === collectionName)) {
            await this.client.createCollection(collectionName, {
                vectors: { size: 768, distance: 'Cosine' }, // Adjust size based on your embedding model
            });
        }
    }

    public async upsertChunks(collectionName: string, chunks: CodeChunk[], vectors: number[][]): Promise<void> {
        const points = chunks.map((chunk, i) => ({
            id: `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}`,
            vector: vectors[i],
            payload: {
                filePath: chunk.filePath,
                content: chunk.content,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                type: chunk.type,
            },
        }));

        await this.client.upsert(collectionName, {
            wait: true,
            points,
        });
    }
}
```

#### **3. The Embedding Provider Interface and Implementations**

To keep the code clean and extensible, you'll create an interface for embedding providers and then implement it for Ollama and OpenAI.

**Code Example (`src/embeddings/embeddingProvider.ts`):**

```typescript
export interface IEmbeddingProvider {
    generateEmbeddings(chunks: string[]): Promise<number[][]>;
}
```

**Code Example (`src/embeddings/ollamaProvider.ts`):**

```typescript
import axios from 'axios';
import { IEmbeddingProvider } from './embeddingProvider';

export class OllamaProvider implements IEmbeddingProvider {
    public async generateEmbeddings(chunks: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        for (const chunk of chunks) {
            const response = await axios.post('http://localhost:11434/api/embeddings', {
                model: 'nomic-embed-text', // Or your preferred model
                prompt: chunk,
            });
            embeddings.push(response.data.embedding);
        }
        return embeddings;
    }
}
```

**Code Example (`src/embeddings/openaiProvider.ts`):**

```typescript
import axios from 'axios';
import { IEmbeddingProvider } from './embeddingProvider';
import * as vscode from 'vscode';


export class OpenAIProvider implements IEmbeddingProvider {
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = vscode.workspace.getConfiguration('your-extension').get('openaiApiKey');
    }

    public async generateEmbeddings(chunks: string[]): Promise<number[][]> {
        if (!this.apiKey) {
            vscode.window.showErrorMessage("OpenAI API key not found. Please set it in the extension settings.");
            return [];
        }

        const response = await axios.post('https://api.openai.com/v1/embeddings', {
            model: 'text-embedding-ada-002',
            input: chunks,
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        return response.data.data.map((item: any) => item.embedding);
    }
}
```

#### **4. Updating the `IndexingService`**

Finally, you'll update the `IndexingService` to use the new `QdrantService` and an embedding provider to complete the indexing process.

**Code Example (`src/indexing/indexingService.ts`):**

```typescript
import * as vscode from 'vscode';
import { FileWalker } from './fileWalker';
import { AstParser } from '../parsing/astParser';
import { Chunker, CodeChunk } from '../parsing/chunker';
import { QdrantService } from '../db/qdrantService';
import { IEmbeddingProvider } from '../embeddings/embeddingProvider';
import { OllamaProvider } from '../embeddings/ollamaProvider'; // Default provider

export class IndexingService {
    private fileWalker: FileWalker;
    private astParser = new AstParser();
    private chunker = new Chunker();
    private qdrantService = new QdrantService();
    private embeddingProvider: IEmbeddingProvider;

    constructor(private workspaceRoot: string) {
        this.fileWalker = new FileWalker(workspaceRoot);
        // This will be updated in a later sprint to be configurable
        this.embeddingProvider = new OllamaProvider();
    }

    public async startIndexing(): Promise<void> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Indexing Repository",
            cancellable: true
        }, async (progress, token) => {
            // ... (file walking, parsing, and chunking logic from Sprint 2)

            const allChunks: CodeChunk[] = []; // Assume this is populated

            progress.report({ message: "Generating embeddings..." });
            const contents = allChunks.map(chunk => chunk.content);
            const vectors = await this.embeddingProvider.generateEmbeddings(contents);

            progress.report({ message: "Storing in vector database..." });
            const collectionName = path.basename(this.workspaceRoot);
            await this.qdrantService.createCollectionIfNotExists(collectionName);
            await this.qdrantService.upsertChunks(collectionName, allChunks, vectors);

            vscode.window.showInformationMessage("Indexing complete!");
        });
    }

    // ... (getLanguage method from Sprint 2)
}
```

This completes the implementation guide for Sprint 3. You now have a complete pipeline for finding, parsing, chunking, vectorizing, and storing your code. The next logical step is to build the API and UI to actually *use* this indexed data, as outlined in the subsequent PRDs.
</prd>


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
````

## File: docs/completed/sidebar/prd.md
````markdown
<prd>Of course. After reviewing the codebase, I can confirm that the automated versioning scripts and the dedicated sidebar view are not yet implemented. The current method for opening the UI relies on commands, not a persistent icon in the Activity Bar.

To address this, I've created a new PRD to add these crucial UX and DevOps features. Following the PRD, I'll provide guidance on generating an icon for your extension.

-----

### **New Document: PRD 1: Foundational - Enhanced Publishing & UI Entry Point**

**1. Title & Overview**

  * **Project:** Code Context Engine - Publishing & UI Accessibility
  * **Summary:** This phase focuses on two key improvements: streamlining the release process with an automated versioning and publishing script, and enhancing the user experience by adding a dedicated entry point for the extension in the VS Code Activity Bar (the main sidebar). This will make the extension easier to release for developers and more accessible for end-users.
  * **Dependencies:** A functional build process (`npm run package`) and a valid VS Code Marketplace PAT are required.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Improve the release workflow, enabling faster and more reliable deployments of new versions.
      * Increase user engagement and discoverability by providing a persistent and easily accessible UI entry point in the Activity Bar.
  * **Developer & System Success Metrics:**
      * A developer can publish a new `patch`, `minor`, or `major` version of the extension with a single npm command (e.g., `npm run release -- patch`).
      * The extension contributes a new icon to the VS Code Activity Bar.
      * Clicking the new icon successfully opens the main webview UI in the sidebar.
      * The version number in `package.json` is correctly incremented, and a corresponding git tag is created automatically during the release process.

-----

**3. User Personas**

  * **Alisha (Backend Developer/Maintainer):** Alisha is responsible for releasing new versions. She needs a simple, foolproof command that handles version bumping, git tagging, and publishing to the marketplace to avoid manual errors.
  * **Devin (Developer - End User):** Devin wants to quickly access the Code Context Engine. He expects to see an icon in his sidebar that he can click to open the UI, rather than having to remember a command or a keyboard shortcut.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Enhancements** | **Sprint 1: Automated Versioning & Publishing** | As Alisha, I want a single npm script to automatically increment the version, tag the release, and publish the extension, so I can release new versions quickly and reliably. | 1. A new `release` script is added to the root `package.json`.\<br/\>2. The script accepts an argument for the version type (`patch`, `minor`, `major`).\<br/\>3. Running `npm run release -- patch` correctly increments the patch version in `package.json`, creates a git tag, and publishes the new version to the marketplace.\<br/\>4. The script fails gracefully if the `VSCE_PAT` environment variable is not set. | **2 Weeks** |
| **Phase 1: Enhancements** | **Sprint 2: Sidebar View Integration** | As Devin, I want to see an icon for the Code Context Engine in the VS Code Activity Bar, so I have a consistent and easy-to-find entry point to the extension. | 1. A `viewsContainers` contribution point is added to `package.json` to define a new container in the Activity Bar.\<br/\>2. The contribution includes an `id`, `title`, and a path to an `icon` (SVG).\<br/\>3. Upon installation, the new icon appears in the Activity Bar. | **2 Weeks** |
| | | As Devin, I want to click the sidebar icon to open the extension's main UI, so I can start interacting with it immediately. | 1. A `views` contribution point is added to `package.json` that links a `webview` to the new container.\<br/\>2. The `WebviewManager` is updated with a `resolveWebviewView` method to handle rendering the SvelteKit app within the sidebar view context.\<br/\>3. Clicking the icon opens the main UI in the sidebar, and all functionality (indexing, searching) works as expected. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** Automated Versioning & Publishing Script (2 Weeks)
  * **Sprint 2:** Sidebar View Integration (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The user running the `release` script has the necessary permissions to create git tags and push to the main branch of the repository.
  * **Risk:** The automated publishing script could be run accidentally.
      * **Mitigation:** The script will first run the build and test commands to ensure quality. Add a confirmation prompt to the script as an extra safeguard before the final publish step.
  * **Risk:** The SvelteKit application's layout may not be responsive enough to look good in a narrow sidebar view.
      * **Mitigation:** The frontend team should review and adjust the CSS for the main Svelte components, using media queries or container queries to ensure the layout is flexible and usable in both a wide panel and a narrow sidebar.

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - Automated Versioning & Publishing

**Goal:** To create a unified npm script that automates the process of versioning and publishing the extension.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Install `shelljs`:** Add `shelljs` as a dev dependency to run shell commands from a Node.js script. | `package.json` |
| **1.2** | ☐ To Do | **Create `scripts/release.js`:** Create a new Node.js script to handle the release logic. | `scripts/release.js` (New) |
| **1.3** | ☐ To Do | **Implement Version Logic:** In `release.js`, read the version type (`patch`, `minor`, `major`) from the command-line arguments. Use `shelljs.exec` to run `npm version <type>`. | `scripts/release.js` |
| **1.4** | ☐ To Do | **Implement Publish Logic:** In `release.js`, after the version command, run `vsce publish`. Check for the `VSCE_PAT` environment variable and exit with an error if it's not set. | `scripts/release.js` |
| **1.5** | ☐ To Do | **Implement Git Push Logic:** After a successful publish, use `shelljs.exec` to run `git push` and `git push --tags`. | `scripts/release.js` |
| **1.6** | ☐ To Do | **Create `release` npm script:** In the root `package.json`, add a script: `"release": "node scripts/release.js"`. | `package.json` |
| **1.7** | ☐ To Do | **Document the Script:** In `README.md` or `CONTRIBUTING.md`, document how to use the new `npm run release -- <version_type>` command. | `README.md` |

-----

### **New Document: tasklist\_sprint\_02.md**

# Task List: Sprint 2 - Sidebar View Integration

**Goal:** To add a persistent icon to the VS Code Activity Bar that opens the extension's UI in the sidebar.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create Icon:** Create an SVG icon for the extension (e.g., `media/icon.svg`). The icon should be monochrome (white) to adapt to VS Code themes. | `media/icon.svg` (New) |
| **2.2** | ☐ To Do | **Add `viewsContainers`:** In `package.json`, add the `contributes.viewsContainers` section to define a new container in the `activitybar`. | `package.json` |
| **2.3** | ☐ To Do | **Add `views`:** In `package.json`, add the `contributes.views` section to associate a new `webviewView` with the container created in the previous step. | `package.json` |
| **2.4** | ☐ To Do | **Implement `WebviewViewProvider`:** In `webviewManager.ts`, implement the `vscode.WebviewViewProvider` interface. | `src/webviewManager.ts` |
| **2.5** | ☐ To Do | **Implement `resolveWebviewView`:** The required method for the provider. This method will be responsible for setting the webview's HTML content by calling your existing `getWebviewContent` helper. | `src/webviewManager.ts` |
| **2.6** | ☐ To Do | **Register the Provider:** In `extension.ts` (or `ExtensionManager`), use `vscode.window.registerWebviewViewProvider` to register your `WebviewManager` as the provider for the new view. | `src/extension.ts` |
| **2.7** | ☐ To Do | **Adapt UI for Sidebar:** Review and adjust the CSS of the SvelteKit components to ensure they are responsive and look good in a narrow sidebar view. | `webview/src/lib/components/*.svelte` |

-----

### Icon Generation Guidance

You've asked for a prompt to generate an icon and for guidance on sizing.

#### Icon Prompt

For an AI image generator, you can use a prompt like this. The key is to ask for a simple, monochrome SVG icon.

> "Create a minimalist, modern, flat, single-color SVG logo for a software development tool called 'Code Context Engine'. The logo should be abstract and represent concepts like 'code', 'search', and 'intelligence'. It must be a single, solid shape, suitable for a small sidebar icon. The color should be white on a transparent background."

#### Icon Sizing

**The best practice for VS Code extensions is to use an SVG icon.** An SVG (Scalable Vector Graphic) is an XML-based image format that can scale to any size without losing quality. VS Code will automatically handle resizing it for different parts of the UI. This means you only need to provide **one `icon.svg` file**.

If you must use a PNG, you would need to provide different sizes for different resolutions, but this is no longer the recommended approach. VS Code's documentation strongly recommends SVG for theme adaptability (it can change the icon's color to match the theme) and high-DPI displays. Stick with SVG.

Of course. Here is the final PRD to complete the technical debt and refactoring initiative.

-----

### **New Document: PRD 2: Advanced Refactoring - Webview & Communication**

**1. Title & Overview**

  * **Project:** Code Context Engine - Webview & Communication Refactoring
  * **Summary:** This phase completes the decoupling of `extension.ts` by creating dedicated managers for webview lifecycle and message routing. A `WebviewManager` will centralize the logic for creating, showing, and disposing of all webview panels. A `MessageRouter` will handle all communication between the webview and the extension's backend services, creating a clean and robust communication layer.
  * **Dependencies:** PRD 1 (Backend Decoupling & Refactoring) must be complete. The `ExtensionManager` and `CommandManager` should be in place.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Finalize the architectural refactoring to create a fully modular, scalable, and maintainable codebase.
      * Improve the reliability of the UI and its communication with the backend, leading to a better user experience.
  * **Developer & System Success Metrics:**
      * `extension.ts` is purely an activator and contains no direct webview or message handling logic.
      * All webview panel creation and management logic is consolidated within the `WebviewManager`.
      * The large `switch` statement for message handling is replaced by the `MessageRouter`, which cleanly delegates tasks to the appropriate services.
      * Adding a new webview or a new message command is a simple, low-risk operation that requires changes in only one or two focused files.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** Alisha can now add new commands and backend logic without ever needing to touch the UI or communication layers. Her work is isolated to the services she owns.
  * **Frank (Frontend Developer):** Frank works on the SvelteKit UI. He now has a single, predictable `MessageRouter` to interact with. He doesn't need to know which backend service implements a feature; he just sends a command, and the router handles the rest.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Refactoring** | **Sprint 3: Webview Management** | As a developer, I want to create a `WebviewManager` to handle the lifecycle of all webview panels so that UI creation logic is centralized and reusable. | 1. A new `WebviewManager` class is created. \<br/\> 2. All `vscode.window.createWebviewPanel` logic is moved from `extension.ts` (or `CommandManager`) into the `WebviewManager`. \<br/\> 3. The manager handles showing the main panel and the settings panel, ensuring only one of each can exist at a time. \<br/\> 4. The manager is responsible for panel disposal and is properly disposed of by the `ExtensionManager`. | **2 Weeks** |
| | | As Frank, I want the `WebviewManager` to be responsible for providing the correct HTML content so that the webview loading process is standardized. | 1. The logic for reading the `index.html` file from the `webview/dist` directory is moved into a private method in `WebviewManager`. \<br/\> 2. The method correctly replaces asset paths with `webview.asWebviewUri` to ensure CSS and JS files load correctly. \<br/\> 3. The `showMainPanel` and `showSettingsPanel` methods use this helper to set the panel's HTML. | |
| **Phase 2: Refactoring** | **Sprint 4: Communication & State Mgmt** | As a developer, I want to create a `MessageRouter` to handle all incoming messages from the webview so that communication logic is decoupled and clean. | 1. A new `MessageRouter` class is created. \<br/\> 2. The `onDidReceiveMessage` listener for each webview is set up to delegate to an instance of the `MessageRouter`. \<br/\> 3. The `MessageRouter`'s `routeMessage` method contains the `switch` statement that calls the appropriate service based on the message command. \<br/\> 4. The router sends results back to the webview with a consistent response format (e.g., `{ command, requestId, result, error }`). | **2 Weeks** |
| | | As Alisha, I want to introduce a basic `StateManager` to track the global state of the extension so that services don't need to communicate directly with each other for status updates. | 1. A new `StateManager` class is created to hold simple boolean flags (e.g., `isIndexing`, `isBackendHealthy`). \<br/\> 2. Services can update the state via the manager (e.g., `stateManager.setIndexing(true)`). \<br/\> 3. The `MessageRouter` can query the state to prevent conflicting actions (e.g., don't start a new index if `isIndexing` is true). | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 3:** Webview Management (2 Weeks)
  * **Sprint 4:** Communication & State Management (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The message-passing API between the webview and the extension is stable and performant enough for all communication needs.
  * **Risk:** Incorrectly managing panel/webview lifecycles in the `WebviewManager` could lead to memory leaks or "ghost" panels that are not properly disposed of.
      * **Mitigation:** Ensure that the `onDidDispose` event for every created panel is correctly handled and that all disposables are added to the extension's context subscriptions.
  * **Risk:** The `StateManager` could become a complex bottleneck if too much logic is added to it.
      * **Mitigation:** Keep the initial `StateManager` extremely simple, holding only essential, global boolean flags. Avoid putting business logic into the state manager itself; its only job is to store and retrieve state.

-----

### **New Document: Sub-Sprint 3: Centralized Webview Management**

**Objective:**
To create the `WebviewManager` class and move all webview panel creation and lifecycle logic into it, cleaning up the command handlers and `extension.ts`.

**Parent Sprint:**
PRD 2, Sprint 3: Webview Management

**Tasks:**

1.  **Create `WebviewManager.ts`:** Develop the new class with a constructor that accepts the `vscode.ExtensionContext`.
2.  **Implement `showMainPanel`:** Create a method that contains the logic for creating and showing the main webview panel. It should ensure only one instance of the main panel can exist.
3.  **Implement `showSettingsPanel`:** Create a method that contains the logic for creating and showing the settings webview panel.
4.  **Implement `getWebviewContent`:** Create a private helper method that reads the `index.html`, prepares it with the correct URIs for webview assets, and returns the HTML string.
5.  **Refactor `CommandManager`:** Update the callbacks for the `openMainPanel` and `openSettings` commands to simply call the appropriate methods on the `WebviewManager` instance.

**Acceptance Criteria:**

  * All `vscode.window.createWebviewPanel` calls are located exclusively within `WebviewManager.ts`.
  * The `openMainPanel` and `openSettings` commands correctly open their respective UIs.
  * Attempting to open a panel that is already open simply brings the existing panel into focus.

**Dependencies:**

  * `CommandManager` from PRD 1 must be implemented.

**Timeline:**

  * **Start Date:** 2025-09-22
  * **End Date:** 2025-10-03

-----

### **New Document: Sub-Sprint 4: Message Routing & State**

**Objective:**
To create the `MessageRouter` and `StateManager` classes to formalize the communication layer and centralize the extension's global state.

**Parent Sprint:**
PRD 2, Sprint 4: Communication & State Mgmt

**Tasks:**

1.  **Create `StateManager.ts`:** Develop a simple class with private properties (e.g., `_isIndexing = false`) and public getter/setter methods.
2.  **Create `MessageRouter.ts`:** Develop the class with a constructor that accepts the `ExtensionManager` (to access all services and managers) and the `vscode.Webview`. The constructor will set up the `onDidReceiveMessage` listener.
3.  **Implement `routeMessage` method:** Move the message-handling `switch` statement from `extension.ts` into this private method within the `MessageRouter`.
4.  **Integrate `StateManager`:** In the `MessageRouter`, check the state before delegating actions. For example: `if (this.stateManager.isIndexing) { /* return error */ }`.
5.  **Update Services:** Modify services like `IndexingService` to update the central state (e.g., `this.stateManager.setIndexing(true)` at the start and `false` at the end).
6.  **Integrate `MessageRouter`:** In `WebviewManager`, when a panel is created, instantiate a `MessageRouter` for it, passing in the necessary dependencies.

**Acceptance Criteria:**

  * The `onDidReceiveMessage` listener in `WebviewManager` is a single line that instantiates and uses the `MessageRouter`.
  * The `MessageRouter` correctly routes commands to the appropriate services.
  * Attempting to start a new indexing job while one is already running is gracefully rejected with an error message sent back to the UI.

**Dependencies:**

  * Sub-Sprint 3 must be complete.

**Timeline:**

  * **Start Date:** 2025-10-06
  * **End Date:** 2025-10-17

-----

### **New Document: tasklist\_sprint\_03.md**

# Task List: Sprint 3 - Webview Management

**Goal:** To centralize all webview creation and lifecycle logic into a dedicated `WebviewManager` class.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Create `WebviewManager.ts`:** Create the new file and the `WebviewManager` class structure with a constructor and a `dispose` method. | `src/webviewManager.ts` (New) |
| **3.2** | ☐ To Do | **Implement `getWebviewContent`:** Create a private helper method that takes a webview instance, reads `webview/dist/index.html`, replaces asset paths using `webview.asWebviewUri`, and returns the final HTML string. | `src/webviewManager.ts` |
| **3.3** | ☐ To Do | **Implement `showMainPanel`:** Create a public method that checks if a main panel instance already exists. If not, it calls `vscode.window.createWebviewPanel`, sets its HTML using the helper, and stores the instance. If it exists, it calls `.reveal()`. | `src/webviewManager.ts` |
| **3.4** | ☐ To Do | **Implement `showSettingsPanel`:** Create a public method with the same logic as `showMainPanel`, but for the settings UI, using a different panel ID and title. | `src/webviewManager.ts` |
| **3.5** | ☐ To Do | **Handle Panel Disposal:** In the `show...` methods, add the `onDidDispose` listener to the created panel to nullify the stored instance variable (e.g., `this.mainPanel = undefined`). | `src/webviewManager.ts` |
| **3.6** | ☐ To Do | **Update `ExtensionManager`:** Instantiate the `WebviewManager` in the `ExtensionManager`'s constructor. | `src/extensionManager.ts` |
| **3.7** | ☐ To Do | **Refactor `CommandManager`:** Change the `openMainPanel` and `openSettings` command callbacks to call `extensionManager.webviewManager.showMainPanel()` and `showSettingsPanel()` respectively. | `src/commandManager.ts` |

-----

### **New Document: tasklist\_sprint\_04.md**

# Task List: Sprint 4 - Communication & State Mgmt

**Goal:** To formalize the webview communication layer with a `MessageRouter` and centralize global state with a `StateManager`.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `StateManager.ts`:** Create the new file and a simple `StateManager` class. Add a private boolean `_isIndexing` and public `isIndexing()` getter and `setIndexing(state: boolean)` setter. | `src/stateManager.ts` (New) |
| **4.2** | ☐ To Do | **Create `MessageRouter.ts`:** Create the new file and the `MessageRouter` class. Its constructor will accept the `ExtensionManager` and `vscode.Webview`. | `src/messageRouter.ts` (New) |
| **4.3** | ☐ To Do | **Implement `routeMessage`:** Move the message handling `switch` statement into a private `async routeMessage` method in `MessageRouter`. | `src/messageRouter.ts` |
| **4.4** | ☐ To Do | **Integrate State Check:** In `routeMessage`, before the `startIndexing` case, add a check: `if (this.extensionManager.stateManager.isIndexing()) { ... post error message ... }`. | `src/messageRouter.ts` |
| **4.5** | ☐ To Do | **Update `IndexingService`:** Inject the `StateManager` instance into the `IndexingService`. Call `this.stateManager.setIndexing(true)` at the beginning of `startIndexing` and `false` in a `finally` block at the end. | `src/indexing/indexingService.ts` |
| **4.6** | ☐ To Do | **Instantiate `MessageRouter`:** In `WebviewManager`, when a panel is created, remove the old `onDidReceiveMessage` logic and replace it with `new MessageRouter(this.extensionManager, this.mainPanel.webview)`. | `src/webviewManager.ts` |
| **4.7** | ☐ To Do | **Instantiate `StateManager`:** In `ExtensionManager`, create a public instance of the `StateManager` so it can be accessed by other services. | `src/extensionManager.ts` |
| **4.8** | ☐ To Do | **Update Service Constructors:** Update the constructors of services (like `IndexingService`) that now need the `StateManager`, and update the instantiation logic in `ExtensionManager`. | `src/extensionManager.ts`, `src/indexing/indexingService.ts` |

This completes the full set of PRDs for the refactoring initiative. You now have a comprehensive plan to transform your extension's architecture into a more robust, maintainable, and scalable system.

</prd>[backlog template]

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
````

## File: docs/completed/svelte-continue/prd.md
````markdown
<prd>Of course. You've correctly identified a significant architectural issue. Hardcoding the entire frontend within HTML strings in `extension.ts` is not scalable or maintainable.

My analysis of the `repomix-output.xml` file confirms your assessment. The functions `getWebviewContent`, `getSettingsWebviewContent`, and `getSetupWebviewContent` in `src/extension.ts` contain large blocks of HTML and inline JavaScript. The current `webview` directory has a basic webpack setup but isn't a proper SvelteKit application.

To address this technical debt, I've created a foundational PRD focused on migrating this inline HTML into a dedicated and properly structured SvelteKit application. This will establish a clean separation between the extension's backend logic and its frontend UI.

-----

### **New Document: PRD 1: Foundational - SvelteKit Webview Migration**

**1. Title & Overview**

  * **Project:** Code Context Engine - SvelteKit Webview Migration
  * **Summary:** This phase focuses on refactoring the entire frontend from inline HTML strings within `extension.ts` into a dedicated SvelteKit application in the `webview/` directory. This will create a clean, modern, and maintainable frontend architecture, enabling faster development and better organization of UI components and logic.
  * **Dependencies:** The existing `extension.ts` file serves as the functional specification for the UI.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Significantly improve developer velocity and maintainability for all future frontend work.
      * Establish a professional and scalable frontend architecture that separates UI from backend logic.
  * **Developer & System Success Metrics:**
      * All UI-related HTML and inline JavaScript is removed from `src/extension.ts`.
      * The `webview/` directory contains a fully functional SvelteKit application.
      * The SvelteKit application is built into a static `dist` or `build` directory.
      * The `extension.ts` file now only loads the `index.html` from the SvelteKit build output.
      * All previous UI functionality (buttons, inputs, status updates) is replicated in the new SvelteKit application and communicates with `extension.ts` via a standardized message-passing API.

-----

**3. User Personas**

  * **Frank (Frontend Developer):** Frank is currently unable to work efficiently because all UI code is tangled inside a TypeScript file. He needs a proper frontend development environment with Svelte components, state management, and a standard build process to create and iterate on the UI effectively.
  * **Alisha (Backend Developer):** Alisha wants to focus on the extension's core logic without having to modify large HTML strings in `extension.ts`. A clean separation allows her to work on the backend without impacting the UI, and vice-versa.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Migration** | **Sprint 1: SvelteKit Scaffolding & UI Components** | As Frank, I want to set up a new SvelteKit project in the `webview/` directory configured with a static adapter, so I have a proper foundation for the UI. | 1. The `webview/` directory is replaced with a new SvelteKit skeleton project.\<br/\>2. The project is configured to use `@sveltejs/adapter-static`.\<br/\>3. Fluent UI web components are installed as a dependency.\<br/\>4. The project can be successfully built using `npm run build`. | **2 Weeks** |
| | | As Frank, I want to recreate the three main UI views (Setup, Indexing, Query) as separate Svelte components based on the existing HTML in `extension.ts`. | 1. A `SetupView.svelte` component is created, replicating the database and provider selection UI.\<br/\>2. An `IndexingView.svelte` component is created with a progress bar and status text.\<br/\>3. A `QueryView.svelte` component is created with the search input and results area.\<br/\>4. A main `+page.svelte` or `ViewManager.svelte` component is created to conditionally render the correct view based on application state. | |
| **Phase 1: Migration** | **Sprint 2: Extension Integration & Communication** | As Alisha, I want to refactor `extension.ts` to load the SvelteKit application instead of generating inline HTML, so that the UI is fully decoupled. | 1. The `getWebviewContent` and similar functions in `extension.ts` are removed.\<br/\>2. A new, simpler function reads the `index.html` from the SvelteKit build directory.\<br/\>3. The function correctly rewrites asset paths (`/_app/...`) using `webview.asWebviewUri` to ensure JS and CSS load.\<br/\>4. The extension successfully loads and renders the SvelteKit application in the webview panel. | **2 Weeks** |
| | | As Frank, I want a standardized API client (`vscodeApi.ts`) in the SvelteKit app for communicating with the extension, so I don't have to use the global `acquireVsCodeApi` in every component. | 1. A `vscodeApi.ts` module is created that wraps `acquireVsCodeApi`.\<br/\>2. It provides simple `postMessage` and `onMessage` functions.\<br/\>3. The client handles request-response pairing using a unique `requestId` for asynchronous operations.\<br/\>4. All Svelte components use this new module for communication instead of the raw API. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** SvelteKit Scaffolding & UI Components (2 Weeks)
  * **Sprint 2:** Extension Integration & Communication (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The existing UI functionality described in the `extension.ts` HTML is the complete and desired feature set for the initial version.
  * **Risk:** The path rewriting logic to load SvelteKit's static assets (`/_app/...`) in a webview can be tricky and may require adjustments based on the SvelteKit version.
      * **Mitigation:** Dedicate a specific task to creating a robust path-rewriting function and test it thoroughly across different asset types (JS, CSS, fonts).
  * **Risk:** Migrating the inline JavaScript logic to a proper Svelte state management and message-passing system might reveal inconsistencies in the original implementation.
      * **Mitigation:** Create a clear mapping of all existing `postMessage` calls and event listeners before starting the Svelte implementation. Use a Svelte store for managing shared UI state.

-----

### **New Document: Sub-Sprint 1: SvelteKit Project Scaffolding**

**Objective:**
To replace the existing `webview/` content with a new, properly configured SvelteKit project and add the Fluent UI component library.

**Parent Sprint:**
PRD 1, Sprint 1: SvelteKit Scaffolding & UI Components

**Tasks:**

1.  **Clear Existing `webview/`:** Remove the current webpack-based content from the `webview/` directory.
2.  **Initialize SvelteKit:** Run `npm create svelte@latest webview` to scaffold a new SvelteKit "Skeleton project" with TypeScript support.
3.  **Install Static Adapter:** Add `@sveltejs/adapter-static` as a dev dependency.
4.  **Configure `svelte.config.js`:** Update the config file to use the static adapter, setting the output directory to `build` and the fallback to `index.html`.
5.  **Install Fluent UI:** Add `@fluentui/web-components` as a dependency.

**Acceptance Criteria:**

  * The `webview/` directory contains a clean SvelteKit project.
  * Running `npm run build` inside `webview/` successfully generates a static site in `webview/build/`.
  * Fluent UI is listed as a dependency.

**Dependencies:**

  * Node.js and npm installed.

**Timeline:**

  * **Start Date:** 2025-08-25
  * **End Date:** 2025-08-29

-----

### **New Document: Sub-Sprint 2: Recreate UI as Svelte Components**

**Objective:**
To build the three primary UI views as distinct Svelte components, replicating the functionality and layout from the original inline HTML.

**Parent Sprint:**
PRD 1, Sprint 1: SvelteKit Scaffolding & UI Components

**Tasks:**

1.  **Create View Components:** Create `SetupView.svelte`, `IndexingView.svelte`, and `QueryView.svelte` inside `webview/src/lib/components/`.
2.  **Translate HTML to Svelte:** For each component, translate the corresponding HTML structure from `extension.ts` into Svelte syntax, replacing standard HTML elements with Fluent UI components (e.g., `<fluent-button>`, `<fluent-progress-bar>`).
3.  **Create State Store:** Create a `viewStore.ts` to manage the current visible view (e.g., `'setup' | 'indexing' | 'query'`).
4.  **Create View Manager:** Build a main component (`+page.svelte`) that imports the three views and uses the state store to conditionally render the active one.

**Acceptance Criteria:**

  * The three core view components exist and contain the correct UI elements.
  * The application renders one of the three views based on the value in a central store.
  * The UI layout and elements closely match the original design specified in `extension.ts`.

**Dependencies:**

  * Sub-Sprint 1 must be complete.

**Timeline:**

  * **Start Date:** 2025-09-01
  * **End Date:** 2025-09-05

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - SvelteKit Scaffolding & UI Components

**Goal:** To establish the new SvelteKit frontend project and recreate the existing UI with modular components.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Clear and Re-initialize Project:** Delete the contents of `webview/` and run `npm create svelte@latest webview` to create a new SvelteKit project with TypeScript. | `webview/` |
| **1.2** | ☐ To Do | **Install Static Adapter:** In the `webview/` directory, run `npm install -D @sveltejs/adapter-static`. | `webview/package.json` |
| **1.3** | ☐ To Do | **Configure Static Build:** Modify `webview/svelte.config.js` to import and use `adapter-static`, setting the output to a `build` directory. | `webview/svelte.config.js` |
| **1.4** | ☐ To Do | **Install Fluent UI:** In the `webview/` directory, run `npm install @fluentui/web-components`. | `webview/package.json` |
| **1.5** | ☐ To Do | **Create State Store:** Create a new file `webview/src/lib/stores/viewStore.ts` and use Svelte's `writable` to manage the current view state. | `webview/src/lib/stores/viewStore.ts` |
| **1.6** | ☐ To Do | **Create View Components:** Create the files `SetupView.svelte`, `IndexingView.svelte`, and `QueryView.svelte` in `webview/src/lib/components/`. | `webview/src/lib/components/` |
| **1.7** | ☐ To Do | **Implement `SetupView` UI:** Replicate the setup form from `getSetupWebviewContent` in `extension.ts` using Fluent UI components. | `webview/src/lib/components/SetupView.svelte` |
| **1.8** | ☐ To Do | **Implement `IndexingView` UI:** Replicate the progress bar UI from `getWebviewContent` in `extension.ts`. | `webview/src/lib/components/IndexingView.svelte` |
| **1.9** | ☐ To Do | **Implement `QueryView` UI:** Replicate the search input and results area from `getWebviewContent` in `extension.ts`. | `webview/src/lib/components/QueryView.svelte` |
| **1.10**| ☐ To Do | **Create Main Page:** In `webview/src/routes/+page.svelte`, import the view components and the store, and use an `{#if}` block to render the correct view based on the store's value. | `webview/src/routes/+page.svelte` |

-----

### **New Document: tasklist\_sprint\_02.md**

# Task List: Sprint 2 - Extension Integration & Communication

**Goal:** To connect the new SvelteKit application to the extension backend and re-establish all communication logic.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Refactor `getWebviewContent`:** Remove the large HTML string from `getWebviewContent` in `extension.ts`. | `src/extension.ts` |
| **2.2** | ☐ To Do | **Implement Static HTML Loading:** The new `getWebviewContent` should read `webview/build/index.html` using `fs.readFileSync`. | `src/extension.ts` |
| **2.3** | ☐ To Do | **Implement Asset Path Rewriting:** In `getWebviewContent`, use a regular expression to find all `/_app/...` asset paths and replace them with the correct `webview.asWebviewUri` version. | `src/extension.ts` |
| **2.4** | ☐ To Do | **Test Webview Loading:** Run the extension and confirm the SvelteKit application loads correctly, including all CSS and JavaScript assets. | `(Manual Test)` |
| **2.5** | ☐ To Do | **Create `vscodeApi.ts`:** Create a new file `webview/src/lib/vscodeApi.ts` to wrap the `acquireVsCodeApi()` call. | `webview/src/lib/vscodeApi.ts` |
| **2.6** | ☐ To Do | **Implement `postMessage` Wrapper:** In `vscodeApi.ts`, create a simple function that calls `vscode.postMessage(message)`. | `webview/src/lib/vscodeApi.ts` |
| **2.7** | ☐ To Do | **Implement `onMessage` Wrapper:** In `vscodeApi.ts`, create a function that adds a listener to `window.addEventListener('message', ...)`. | `webview/src/lib/vscodeApi.ts` |
| **2.8** | ☐ To Do | **Refactor Components to Use `vscodeApi`:** Update all Svelte components to import from `vscodeApi.ts` for all communication. | `webview/src/lib/components/*.svelte` |
| **2.9** | ☐ To Do | **Re-implement "Start Database" Action:** Connect the button's `on:click` event in `SetupView.svelte` to send a `startDatabase` message using `vscodeApi.postMessage`. | `webview/src/lib/components/SetupView.svelte` |
| **2.10**| ☐ To Do | **Re-implement `databaseStatus` Listener:** In `SetupView.svelte`, use `vscodeApi.onMessage` to listen for `databaseStatus` messages and update the UI accordingly. | `webview/src/lib/components/SetupView.svelte` |
| **2.11**| ☐ To Do | **Verify End-to-End Communication:** Manually test that clicking the "Start Database" button in the Svelte UI correctly triggers the terminal command in the extension backend. | `(Manual Test)` |


Of course. Here is the final PRD to complete the technical debt and refactoring initiative.

-----

### **New Document: PRD 2: Advanced Refactoring - Webview & Communication**

**1. Title & Overview**

  * **Project:** Code Context Engine - Webview & Communication Refactoring
  * **Summary:** This phase completes the decoupling of `extension.ts` by creating dedicated managers for webview lifecycle and message routing. A `WebviewManager` will centralize the logic for creating, showing, and disposing of all webview panels. A `MessageRouter` will handle all communication between the webview and the extension's backend services, creating a clean and robust communication layer.
  * **Dependencies:** PRD 1 (Backend Decoupling & Refactoring) must be complete. The `ExtensionManager` and `CommandManager` should be in place.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Finalize the architectural refactoring to create a fully modular, scalable, and maintainable codebase.
      * Improve the reliability of the UI and its communication with the backend, leading to a better user experience.
  * **Developer & System Success Metrics:**
      * `extension.ts` is purely an activator and contains no direct webview or message handling logic.
      * All webview panel creation and management logic is consolidated within the `WebviewManager`.
      * The large `switch` statement for message handling is replaced by the `MessageRouter`, which cleanly delegates tasks to the appropriate services.
      * Adding a new webview or a new message command is a simple, low-risk operation that requires changes in only one or two focused files.

-----

**3. User Personas**

  * **Alisha (Backend Developer):** Alisha can now add new commands and backend logic without ever needing to touch the UI or communication layers. Her work is isolated to the services she owns.
  * **Frank (Frontend Developer):** Frank works on the SvelteKit UI. He now has a single, predictable `MessageRouter` to interact with. He doesn't need to know which backend service implements a feature; he just sends a command, and the router handles the rest.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Refactoring** | **Sprint 3: Webview Management** | As a developer, I want to create a `WebviewManager` to handle the lifecycle of all webview panels so that UI creation logic is centralized and reusable. | 1. A new `WebviewManager` class is created. \<br/\> 2. All `vscode.window.createWebviewPanel` logic is moved from `extension.ts` (or `CommandManager`) into the `WebviewManager`. \<br/\> 3. The manager handles showing the main panel and the settings panel, ensuring only one of each can exist at a time. \<br/\> 4. The manager is responsible for panel disposal and is properly disposed of by the `ExtensionManager`. | **2 Weeks** |
| | | As Frank, I want the `WebviewManager` to be responsible for providing the correct HTML content so that the webview loading process is standardized. | 1. The logic for reading the `index.html` file from the `webview/dist` directory is moved into a private method in `WebviewManager`. \<br/\> 2. The method correctly replaces asset paths with `webview.asWebviewUri` to ensure CSS and JS files load correctly. \<br/\> 3. The `showMainPanel` and `showSettingsPanel` methods use this helper to set the panel's HTML. | |
| **Phase 2: Refactoring** | **Sprint 4: Communication & State Mgmt** | As a developer, I want to create a `MessageRouter` to handle all incoming messages from the webview so that communication logic is decoupled and clean. | 1. A new `MessageRouter` class is created. \<br/\> 2. The `onDidReceiveMessage` listener for each webview is set up to delegate to an instance of the `MessageRouter`. \<br/\> 3. The `MessageRouter`'s `routeMessage` method contains the `switch` statement that calls the appropriate service based on the message command. \<br/\> 4. The router sends results back to the webview with a consistent response format (e.g., `{ command, requestId, result, error }`). | **2 Weeks** |
| | | As Alisha, I want to introduce a basic `StateManager` to track the global state of the extension so that services don't need to communicate directly with each other for status updates. | 1. A new `StateManager` class is created to hold simple boolean flags (e.g., `isIndexing`, `isBackendHealthy`). \<br/\> 2. Services can update the state via the manager (e.g., `stateManager.setIndexing(true)`). \<br/\> 3. The `MessageRouter` can query the state to prevent conflicting actions (e.g., don't start a new index if `isIndexing` is true). | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 3:** Webview Management (2 Weeks)
  * **Sprint 4:** Communication & State Management (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The message-passing API between the webview and the extension is stable and performant enough for all communication needs.
  * **Risk:** Incorrectly managing panel/webview lifecycles in the `WebviewManager` could lead to memory leaks or "ghost" panels that are not properly disposed of.
      * **Mitigation:** Ensure that the `onDidDispose` event for every created panel is correctly handled and that all disposables are added to the extension's context subscriptions.
  * **Risk:** The `StateManager` could become a complex bottleneck if too much logic is added to it.
      * **Mitigation:** Keep the initial `StateManager` extremely simple, holding only essential, global boolean flags. Avoid putting business logic into the state manager itself; its only job is to store and retrieve state.

-----

### **New Document: Sub-Sprint 3: Centralized Webview Management**

**Objective:**
To create the `WebviewManager` class and move all webview panel creation and lifecycle logic into it, cleaning up the command handlers and `extension.ts`.

**Parent Sprint:**
PRD 2, Sprint 3: Webview Management

**Tasks:**

1.  **Create `WebviewManager.ts`:** Develop the new class with a constructor that accepts the `vscode.ExtensionContext`.
2.  **Implement `showMainPanel`:** Create a method that contains the logic for creating and showing the main webview panel. It should ensure only one instance of the main panel can exist.
3.  **Implement `showSettingsPanel`:** Create a method that contains the logic for creating and showing the settings webview panel.
4.  **Implement `getWebviewContent`:** Create a private helper method that reads the `index.html`, prepares it with the correct URIs for webview assets, and returns the HTML string.
5.  **Refactor `CommandManager`:** Update the callbacks for the `openMainPanel` and `openSettings` commands to simply call the appropriate methods on the `WebviewManager` instance.

**Acceptance Criteria:**

  * All `vscode.window.createWebviewPanel` calls are located exclusively within `WebviewManager.ts`.
  * The `openMainPanel` and `openSettings` commands correctly open their respective UIs.
  * Attempting to open a panel that is already open simply brings the existing panel into focus.

**Dependencies:**

  * `CommandManager` from PRD 1 must be implemented.

**Timeline:**

  * **Start Date:** 2025-09-22
  * **End Date:** 2025-10-03

-----

### **New Document: Sub-Sprint 4: Message Routing & State**

**Objective:**
To create the `MessageRouter` and `StateManager` classes to formalize the communication layer and centralize the extension's global state.

**Parent Sprint:**
PRD 2, Sprint 4: Communication & State Mgmt

**Tasks:**

1.  **Create `StateManager.ts`:** Develop a simple class with private properties (e.g., `_isIndexing = false`) and public getter/setter methods.
2.  **Create `MessageRouter.ts`:** Develop the class with a constructor that accepts the `ExtensionManager` (to access all services and managers) and the `vscode.Webview`. The constructor will set up the `onDidReceiveMessage` listener.
3.  **Implement `routeMessage` method:** Move the message-handling `switch` statement from `extension.ts` into this private method within the `MessageRouter`.
4.  **Integrate `StateManager`:** In the `MessageRouter`, check the state before delegating actions. For example: `if (this.stateManager.isIndexing) { /* return error */ }`.
5.  **Update Services:** Modify services like `IndexingService` to update the central state (e.g., `this.stateManager.setIndexing(true)` at the start and `false` at the end).
6.  **Integrate `MessageRouter`:** In `WebviewManager`, when a panel is created, instantiate a `MessageRouter` for it, passing in the necessary dependencies.

**Acceptance Criteria:**

  * The `onDidReceiveMessage` listener in `WebviewManager` is a single line that instantiates and uses the `MessageRouter`.
  * The `MessageRouter` correctly routes commands to the appropriate services.
  * Attempting to start a new indexing job while one is already running is gracefully rejected with an error message sent back to the UI.

**Dependencies:**

  * Sub-Sprint 3 must be complete.

**Timeline:**

  * **Start Date:** 2025-10-06
  * **End Date:** 2025-10-17

-----

### **New Document: tasklist\_sprint\_03.md**

# Task List: Sprint 3 - Webview Management

**Goal:** To centralize all webview creation and lifecycle logic into a dedicated `WebviewManager` class.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **3.1** | ☐ To Do | **Create `WebviewManager.ts`:** Create the new file and the `WebviewManager` class structure with a constructor and a `dispose` method. | `src/webviewManager.ts` (New) |
| **3.2** | ☐ To Do | **Implement `getWebviewContent`:** Create a private helper method that takes a webview instance, reads `webview/dist/index.html`, replaces asset paths using `webview.asWebviewUri`, and returns the final HTML string. | `src/webviewManager.ts` |
| **3.3** | ☐ To Do | **Implement `showMainPanel`:** Create a public method that checks if a main panel instance already exists. If not, it calls `vscode.window.createWebviewPanel`, sets its HTML using the helper, and stores the instance. If it exists, it calls `.reveal()`. | `src/webviewManager.ts` |
| **3.4** | ☐ To Do | **Implement `showSettingsPanel`:** Create a public method with the same logic as `showMainPanel`, but for the settings UI, using a different panel ID and title. | `src/webviewManager.ts` |
| **3.5** | ☐ To Do | **Handle Panel Disposal:** In the `show...` methods, add the `onDidDispose` listener to the created panel to nullify the stored instance variable (e.g., `this.mainPanel = undefined`). | `src/webviewManager.ts` |
| **3.6** | ☐ To Do | **Update `ExtensionManager`:** Instantiate the `WebviewManager` in the `ExtensionManager`'s constructor. | `src/extensionManager.ts` |
| **3.7** | ☐ To Do | **Refactor `CommandManager`:** Change the `openMainPanel` and `openSettings` command callbacks to call `extensionManager.webviewManager.showMainPanel()` and `showSettingsPanel()` respectively. | `src/commandManager.ts` |

-----

### **New Document: tasklist\_sprint\_04.md**

# Task List: Sprint 4 - Communication & State Mgmt

**Goal:** To formalize the webview communication layer with a `MessageRouter` and centralize global state with a `StateManager`.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Create `StateManager.ts`:** Create the new file and a simple `StateManager` class. Add a private boolean `_isIndexing` and public `isIndexing()` getter and `setIndexing(state: boolean)` setter. | `src/stateManager.ts` (New) |
| **4.2** | ☐ To Do | **Create `MessageRouter.ts`:** Create the new file and the `MessageRouter` class. Its constructor will accept the `ExtensionManager` and `vscode.Webview`. | `src/messageRouter.ts` (New) |
| **4.3** | ☐ To Do | **Implement `routeMessage`:** Move the message handling `switch` statement into a private `async routeMessage` method in `MessageRouter`. | `src/messageRouter.ts` |
| **4.4** | ☐ To Do | **Integrate State Check:** In `routeMessage`, before the `startIndexing` case, add a check: `if (this.extensionManager.stateManager.isIndexing()) { ... post error message ... }`. | `src/messageRouter.ts` |
| **4.5** | ☐ To Do | **Update `IndexingService`:** Inject the `StateManager` instance into the `IndexingService`. Call `this.stateManager.setIndexing(true)` at the beginning of `startIndexing` and `false` in a `finally` block at the end. | `src/indexing/indexingService.ts` |
| **4.6** | ☐ To Do | **Instantiate `MessageRouter`:** In `WebviewManager`, when a panel is created, remove the old `onDidReceiveMessage` logic and replace it with `new MessageRouter(this.extensionManager, this.mainPanel.webview)`. | `src/webviewManager.ts` |
| **4.7** | ☐ To Do | **Instantiate `StateManager`:** In `ExtensionManager`, create a public instance of the `StateManager` so it can be accessed by other services. | `src/extensionManager.ts` |
| **4.8** | ☐ To Do | **Update Service Constructors:** Update the constructors of services (like `IndexingService`) that now need the `StateManager`, and update the instantiation logic in `ExtensionManager`. | `src/extensionManager.ts`, `src/indexing/indexingService.ts` |

This completes the full set of PRDs for the refactoring initiative. You now have a comprehensive plan to transform your extension's architecture into a more robust, maintainable, and scalable system.</prd>

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
````

## File: docs/completed/ux/prd.md
````markdown
<prd>Of course. Here are the detailed PRDs focusing specifically on the frontend UI/UX development for your VS Code extension, broken down by each user-facing view.

-----

### **New Document: PRD 1: Foundational - Onboarding & Setup UI**

**1. Title & Overview**

  * **Project:** Code Context Engine - Onboarding UI/UX
  * **Summary:** This phase focuses on building the user's first interaction with the extension: the onboarding and setup view. This UI is critical for user activation and must clearly guide the user through configuring the necessary database and embedding providers for a new, un-indexed repository.
  * **Dependencies:** Requires the foundational SvelteKit and Fluent UI boilerplate (from the previous UI/UX roadmap) to be in place. The VS Code extension must be able to detect whether a repository has an existing configuration.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Maximize the rate of successful user onboarding (i.e., users who complete the setup and start indexing).
      * Minimize user confusion and support requests by making the setup process intuitive and self-explanatory.
  * **User Success Metrics:**
      * A new user can successfully configure and start the indexing process in under 2 minutes.
      * The UI provides clear feedback and status indicators (e.g., "database is running") to build user confidence.
      * The setup completion rate (users who click "Index Now") is above 85% for first-time users.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin has just installed the extension and opened a project. He needs a simple, step-by-step process to get started. He doesn't want to read lengthy documentation; the UI should guide him through the necessary choices and actions.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Onboarding** | **Sprint 1: Setup View Implementation** | As Devin, when I open an un-indexed project, I want to see a clear setup screen so I know what I need to do to get started. | 1. The extension correctly identifies when no `code-context.json` file is present and displays the `SetupView` component.\<br/\>2. The view contains distinct sections for "Database Configuration" and "Embedding Provider".\<br/\>3. The primary call-to-action button ("Index Now") is initially disabled. | **2 Weeks** |
| | | As Devin, I want to select my desired vector database and get help starting it if it's not running. | 1. A dropdown allows selecting "Qdrant".\<br/\>2. A button labeled "Start Local Qdrant" is visible.\<br/\>3. Clicking the button opens a new VS Code terminal and executes the `docker-compose up` command.\<br/\>4. A status icon next to the dropdown changes from "Not Running" to "Running" after a successful health check to the backend service. | |
| | | As Devin, I want to choose which embedding model to use for indexing my code. | 1. A dropdown allows selecting an embedding provider (e.g., "Ollama", "OpenAI").\<br/\>2. The "Index Now" button becomes enabled only after both the database is confirmed running and an embedding provider has been selected.\<br/\>3. The chosen configuration is saved to a state management store. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 2 Weeks
  * **Sprint 1:** Setup View Implementation (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** Users will have Docker installed and running on their machine for local database setup.
  * **Risk:** The logic for detecting if a local service (like Qdrant) is running could be unreliable across different user machine setups.
      * **Mitigation:** Rely on the C\# backend to perform the health check and pass a simple boolean status to the frontend. This centralizes the logic and makes the UI's job simpler.
  * **Risk:** The user might be confused about what to do if the Docker command fails.
      * **Mitigation:** The TypeScript extension should monitor the terminal process it creates. If the process exits with a non-zero code, display a VS Code error notification with a link to a troubleshooting guide in the `README`.

-----

### **New Document: Sub-Sprint 1: Database Configuration Component**

**Objective:**
To build the Svelte component for the database selection and management part of the setup view.

**Parent Sprint:**
PRD 1, Sprint 1: Setup View Implementation

**Tasks:**

1.  **Create `DatabaseSetup.svelte` component:** Build the UI with a Fluent UI `<Select>` component for the database choice.
2.  **Implement "Start" button:** Add a Fluent UI `<Button>` that, when clicked, sends a message to the TypeScript extension backend to execute the Docker command.
3.  **Display Status Indicator:** Add a small status icon and text (e.g., "⚫ Not Running" / "🟢 Running") that is bound to a reactive variable from a Svelte store.
4.  **Backend Message Handling:** The TypeScript extension will listen for the "startDatabase" message, create a new VS Code `Terminal`, and run the command.

**Acceptance Criteria:**

  * The dropdown displays "Qdrant" as an option.
  * Clicking the button successfully opens a terminal and runs `docker-compose up`.
  * The UI status correctly reflects the health status received from the backend.

**Dependencies:**

  * VS Code extension boilerplate must be complete.
  * A `docker-compose.yml` file must exist in the project root.

**Timeline:**

  * **Start Date:** 2026-01-05
  * **End Date:** 2026-01-09

-----

### **New Document: Sub-Sprint 2: Embedding Provider & Workflow Logic**

**Objective:**
To build the embedding provider selection component and the final workflow logic to enable indexing.

**Parent Sprint:**
PRD 1, Sprint 1: Setup View Implementation

**Tasks:**

1.  **Create `EmbeddingSetup.svelte` component:** Build the UI with a Fluent UI `<Select>` to choose between "Ollama" and "OpenAI".
2.  **Implement Main "Index Now" Button:** Create the primary call-to-action button for the setup view.
3.  **Create Svelte Store for State:** Implement a Svelte writable store to manage the overall setup state (e.g., `databaseReady`, `providerSelected`).
4.  **Conditional Button Logic:** The "Index Now" button's `disabled` attribute should be reactively bound to the store's state, enabling only when all conditions are met.
5.  **Trigger Indexing:** When clicked, the button sends a "startIndexing" message to the backend with the selected configuration.

**Acceptance Criteria:**

  * The dropdown displays "Ollama" and "OpenAI" as options.
  * The "Index Now" button is disabled by default.
  * The button becomes enabled after the database is running AND a provider is selected.
  * Clicking the button successfully sends the configuration details to the extension backend.

**Dependencies:**

  * Sub-Sprint 1 must be complete.

**Timeline:**

  * **Start Date:** 2026-01-12
  * **End Date:** 2026-01-16

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - Setup View Implementation

**Goal:** To build the complete user onboarding and setup UI within the VS Code extension's webview.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Create `SetupView.svelte` main component:** This component will act as the container for the setup process. | `webview/src/lib/views/SetupView.svelte` |
| **1.2** | ☐ To Do | **Implement `DatabaseSetup.svelte` component:** Build the UI for database selection, the "Start" button, and status indicator. | `webview/src/lib/components/DatabaseSetup.svelte` |
| **1.3** | ☐ To Do | **Implement `EmbeddingSetup.svelte` component:** Build the UI for embedding provider selection. | `webview/src/lib/components/EmbeddingSetup.svelte` |
| **1.4** | ☐ To Do | **Create `setupStore.ts`:** Define a Svelte store to manage the configuration state (`database`, `provider`, `isDbRunning`). | `webview/src/lib/stores/setupStore.ts` |
| **1.5** | ☐ To Do | **Add `runCommandInTerminal` to extension backend:** In `extension.ts`, create a handler that receives a command string from the webview and executes it in a new VS Code terminal. | `src/extension.ts` |
| **1.6** | ☐ To Do | **Implement state logic:** Connect the components to the store so that selecting options updates the state. | `webview/src/lib/views/SetupView.svelte` |
| **1.7** | ☐ To Do | **Bind "Index Now" button's disabled state:** Use a reactive statement in Svelte (`$:`) to derive the button's state from the store. | `webview/src/lib/views/SetupView.svelte` |
| **1.8** | ☐ To Do | **Test full UI flow:** Manually test the entire onboarding process: start database, select provider, and ensure the "Index Now" button enables correctly. | `(Manual Test)` |

</prd>

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
````

## File: docs/completed/ux2/prd.md
````markdown
<prd>Excellent plan. Improving the user experience by integrating more deeply with VS Code's native features like the settings UI and keybindings is a great strategic move. It makes the extension feel more polished and intuitive for developers.

Based on my review of your codebase, this is a very achievable goal. The foundation you've built with the `ConfigService` and the declared settings in `package.json` makes this transition straightforward.

Here is the PRD for this initiative.

-----

### **New Document: PRD 1: Foundational - UX Enhancements with Native Settings & Hotkeys**

**1. Title & Overview**

  * **Project:** Code Context Engine - UX Enhancements
  * **Summary:** This phase focuses on improving the overall user experience by integrating keybindings for common actions and migrating configuration management to VS Code's native settings UI. We will also repurpose our existing Svelte settings page into a "Status & Diagnostics" panel, providing users with a central place to test connections and view system status without mixing it with configuration.
  * **Dependencies:** The extension must have a working command structure and a defined configuration schema in `package.json`.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Increase user adoption and satisfaction by providing a more native, seamless, and efficient user experience.
      * Reduce user friction by aligning with standard VS Code patterns for configuration and shortcuts.
  * **Developer & System Success Metrics:**
      * Key commands (Open Panel, Start Indexing) are accessible via keyboard shortcuts.
      * The extension's configuration is fully manageable through the built-in VS Code Settings UI (`Ctrl+,`).
      * The custom Svelte "Settings" page is successfully repurposed as a "Status & Diagnostics" view.
      * The `ConfigService` continues to correctly read all settings without modification.

-----

**3. User Personas**

  * **Devin (Developer - End User):** Devin is a power user who prefers keyboard-driven workflows. He wants to open the context engine and start indexing without reaching for the mouse. He also expects to manage his settings in the same place he manages all his other VS Code settings.
  * **Alisha (Backend Developer):** Alisha wants to ensure that the settings are managed in a standard, reliable way. Using the native VS Code settings reduces the amount of custom UI code she has to maintain and debug.

-----

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: UX Enhancements** | **Sprint 1: Hotkey Integration** | As Devin, I want to use keyboard shortcuts to open the main panel and start indexing, so I can work more efficiently without using the mouse. | 1. A new `keybindings` contribution is added to `package.json`.\<br/\>2. A default keybinding (e.g., `Ctrl+Alt+C`) is assigned to the `code-context-engine.openMainPanel` command.\<br/\>3. A default keybinding (e.g., `Ctrl+Alt+I`) is assigned to the `code-context-engine.startIndexing` command.\<br/\>4. The keybindings are functional and do not conflict with common VS Code shortcuts. | **2 Weeks** |
| | | As Devin, I want the "Open Settings" command to take me directly to the native VS Code settings UI for the extension, so I can manage configuration in a familiar way. | 1. The `handleOpenSettings` method in `CommandManager` is refactored.\<br/\>2. The method now uses the `vscode.commands.executeCommand('workbench.action.openSettings', ...)` API.\<br/\>3. The command is configured to directly filter the settings UI to show only "code-context-engine" settings.\<br/\>4. The old `WebviewManager.showSettingsPanel` method can be deprecated or removed. | |
| **Phase 1: UX Enhancements** | **Sprint 2: Repurpose Settings Page** | As Alisha, I want to repurpose the existing Svelte settings page into a "Status & Diagnostics" panel, so we can keep useful actions like connection testing without managing configuration in a custom UI. | 1. The Svelte settings component is renamed to `DiagnosticsView.svelte`.\<br/\>2. All configuration input fields (dropdowns, text inputs for values) are removed from the component.\<br/\>3. Action buttons like "Test Database Connection" and "Test Embedding Provider" remain functional.\<br/\>4. The view is updated to display the current configuration values in a read-only format. | **2 Weeks** |
| | | As Devin, I want to be able to open the new "Status & Diagnostics" panel from a command, so I can easily test my connections. | 1. A new command, `code-context-engine.openDiagnostics`, is added in `package.json`.\<br/\>2. A new handler is added to `CommandManager` for this command.\<br/\>3. The handler calls a new method in `WebviewManager` (`showDiagnosticsPanel`) to display the repurposed Svelte view. | |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** Hotkey & Native Settings Integration (2 Weeks)
  * **Sprint 2:** Repurpose Settings Page to Diagnostics View (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The settings defined in `package.json`'s `contributes.configuration` section are comprehensive and correctly structured for VS Code's native UI to render them.
  * **Risk:** The chosen default keybindings might conflict with a user's custom shortcuts or other extensions.
      * **Mitigation:** Choose key combinations that are less common. Clearly document the default shortcuts in the `README.md` and mention that users can rebind them in VS Code's Keyboard Shortcuts editor.
  * **Risk:** Users may be confused if they can't find the old settings page.
      * **Mitigation:** Add a section to the `README.md` explaining the change. The new "Status & Diagnostics" page can also include a read-only view of the current settings with a button that says "Edit Settings," which would then execute the command to open the native VS Code settings UI.

-----

### **New Document: Sub-Sprint 1: Hotkey Definition & Native Settings Command**

**Objective:**
To define and implement keyboard shortcuts for core commands and to redirect the "Open Settings" command to the native VS Code settings UI.

**Parent Sprint:**
PRD 1, Sprint 1: Hotkey Integration

**Tasks:**

1.  **Define Keybindings in `package.json`:** Add the `keybindings` contribution point to the `package.json` file.
2.  **Assign Hotkey for Main Panel:** Assign a key combination (e.g., `ctrl+alt+c` on Windows/Linux, `cmd+alt+c` on macOS) to the `code-context-engine.openMainPanel` command.
3.  **Assign Hotkey for Indexing:** Assign a key combination (e.g., `ctrl+alt+i` / `cmd+alt+i`) to the `code-context-engine.startIndexing` command.
4.  **Refactor `handleOpenSettings`:** Modify the `handleOpenSettings` method in `src/commandManager.ts` to use `vscode.commands.executeCommand` to open the native settings UI, filtered for the extension.
5.  **Deprecate `showSettingsPanel`:** Mark the `showSettingsPanel` method in `src/webviewManager.ts` as deprecated, as it will no longer be used by the primary settings command.

**Acceptance Criteria:**

  * Pressing the defined hotkeys correctly triggers the corresponding commands.
  * Running the "Code Context Engine: Open Settings" command from the command palette opens the native VS Code settings window, pre-filtered to "code-context-engine".
  * The old Svelte-based settings webview is no longer opened by the main settings command.

**Dependencies:**

  * Existing commands must be correctly registered in `CommandManager`.

**Timeline:**

  * **Start Date:** 2026-02-02
  * **End Date:** 2026-02-06

-----

### **New Document: tasklist\_sprint\_01.md**

# Task List: Sprint 1 - Hotkey & Native Settings Integration

**Goal:** To add keyboard shortcuts for key actions and integrate with the native VS Code settings UI.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Add `keybindings` to `package.json`:** In the `contributes` section of `package.json`, add a new `keybindings` array. | `package.json` |
| **1.2** | ☐ To Do | **Define `openMainPanel` Keybinding:** Inside the `keybindings` array, add an object for the `openMainPanel` command with `key` properties for `win`/`linux` (`ctrl+alt+c`) and `mac` (`cmd+alt+c`). | `package.json` |
| **1.3** | ☐ To Do | **Define `startIndexing` Keybinding:** Add another object to the `keybindings` array for the `startIndexing` command with `key` properties for `win`/`linux` (`ctrl+alt+i`) and `mac` (`cmd+alt+i`). | `package.json` |
| **1.4** | ☐ To Do | **Refactor `handleOpenSettings`:** Open `src/commandManager.ts`. Change the implementation of the `handleOpenSettings` method to execute a built-in VS Code command. | `src/commandManager.ts` |
| **1.5** | ☐ To Do | **Implement Native Settings Command:** The new implementation for `handleOpenSettings` should be: `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');` (replace publisher and extension name as needed). | `src/commandManager.ts` |
| **1.6** | ☐ To Do | **Deprecate Old Webview Method:** In `src/webviewManager.ts`, add a `/** @deprecated */` JSDoc comment above the `showSettingsPanel` method to indicate it should no longer be used for primary settings. | `src/webviewManager.ts` |
| **1.7** | ☐ To Do | **Test Hotkeys:** Reload the extension and test both new keyboard shortcuts to ensure they trigger the correct actions. | `(Manual Test)` |
| **1.8** | ☐ To Do | **Test Settings Command:** Run the "Code Context Engine: Open Settings" command from the command palette and verify it opens the native settings UI, correctly filtered. | `(Manual Test)` |

Of course. Here is the final PRD to complete the user experience enhancements for your extension.

-----

### **New Document: PRD 2: UI/UX - Status & Diagnostics Panel**

**1. Title & Overview**

  * **Project:** Code Context Engine - Status & Diagnostics Panel
  * **Summary:** This phase completes the user experience overhaul by repurposing the now-legacy Svelte settings page into a dedicated "Status & Diagnostics" panel. This provides a clear, focused UI for users to perform actions like testing service connections and viewing system status, cleanly separating these actions from the configuration, which is now handled by VS Code's native settings UI.
  * **Dependencies:** PRD 1 (Hotkey & Native Settings Integration) must be complete. The command to open the native settings UI must be functional.

-----

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Improve user confidence and reduce support issues by providing clear, actionable diagnostic tools.
      * Create a more logical and streamlined UX by separating "what you configure" (VS Code Settings) from "what you do" (Diagnostics Panel).
  * **User Success Metrics:**
      * Users can successfully test their connection to the database and embedding providers from the UI.
      * The panel displays the current configuration in a clear, read-only format, reducing confusion about what settings are active.
      * The user journey from diagnostics to configuration is seamless (e.g., a button in the panel links directly to the native settings UI).

-----

**3. User Personas**

  * **Devin (Developer - End User):** When setting up the extension or troubleshooting, Devin needs a simple way to confirm that his local services (like Qdrant and Ollama) are correctly connected to the extension. This panel gives him a one-click way to verify his setup.
  * **Alisha (Backend Developer):** Alisha benefits from having a dedicated UI for actions that trigger backend processes. This keeps the main query UI clean and provides a specific area for adding future administrative or diagnostic features.

-----

**4. Requirements Breakdown**

| Phase                 | Sprint                            | User Story                                                                                                                                                             | Acceptance Criteria                                                                                                                                                                                                                                                                                                                        | Duration |
| :-------------------- | :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **Phase 2: UX Polish** | **Sprint 2: Repurpose Settings Page** | As Alisha, I want to repurpose the existing Svelte settings page into a "Status & Diagnostics" panel, so we can keep useful actions like connection testing without managing configuration in a custom UI. | 1. The Svelte settings component is renamed to `DiagnosticsView.svelte`.\<br/\>2. All configuration input fields (dropdowns, text inputs for values) are removed from the component.\<br/\>3. Action buttons like "Test Database Connection" and "Test Embedding Provider" remain functional.\<br/\>4. The view is updated to display the current configuration values in a read-only format. | **2 Weeks** |
|                       |                                   | As Devin, I want to be able to open the new "Status & Diagnostics" panel from a command, so I can easily test my connections.                                              | 1. A new command, `code-context-engine.openDiagnostics`, is added in `package.json`.\<br/\>2. A new handler is added to `CommandManager` for this command.\<br/\>3. The handler calls a new method in `WebviewManager` (`showDiagnosticsPanel`) to display the repurposed Svelte view.                                                   |          |

-----

**5. Timeline & Sprints**

  * **Total Estimated Time:** 2 Weeks
  * **Sprint 2:** Repurpose Settings Page to Diagnostics View (2 Weeks)

-----

**6. Risks & Assumptions**

  * **Assumption:** The Svelte components are modular enough that removing the configuration inputs will not break the layout or functionality of the remaining action buttons.
  * **Risk:** The new "Diagnostics" panel could cause user confusion if its purpose is not clearly communicated.
      * **Mitigation:** The UI should have a clear title like "Status & Diagnostics". It should also contain a prominent button or link labeled "Edit Configuration" that executes the `workbench.action.openSettings` command, guiding users to the correct location for making changes.

-----

### **New Document: Sub-Sprint 2: Diagnostics View Refactoring**

**Objective:**
To refactor the Svelte settings page into a read-only diagnostics and status view, and create a new command to open it.

**Parent Sprint:**
PRD 2, Sprint 2: Repurpose Settings Page

**Tasks:**

1.  **Create New Command:** Define and register a new command `code-context-engine.openDiagnostics` in `package.json` and `CommandManager`.
2.  **Create `showDiagnosticsPanel` Method:** In `WebviewManager`, create a new method to show the diagnostics webview, ensuring it's managed as a singleton panel.
3.  **Refactor Svelte Component:** Rename the settings Svelte component to `DiagnosticsView.svelte`.
4.  **Remove Input Elements:** Remove all interactive form elements for *setting* values (e.g., `<select>`, `<input>`).
5.  **Display Read-Only Settings:** Fetch the current configuration and display it as read-only text.
6.  **Add "Edit Settings" Button:** Add a new button that, when clicked, sends a message to the extension to execute the `workbench.action.openSettings` command.
7.  **Preserve Action Buttons:** Ensure that buttons for "Test Connection" remain and are functional.

**Acceptance Criteria:**

  * A new "Code Context Engine: Open Diagnostics" command is available.
  * The new panel displays current settings as text and does not allow editing them.
  * The "Test Connection" buttons work as before.
  * A new "Edit Settings" button correctly opens the native VS Code settings UI.

**Dependencies:**

  * PRD 1 must be complete.

**Timeline:**

  * **Start Date:** 2026-02-09
  * **End Date:** 2026-02-20

-----

### **New Document: tasklist\_sprint\_02.md**

# Task List: Sprint 2 - Repurpose Settings Page to Diagnostics View

**Goal:** To refactor the Svelte settings webview into a dedicated "Status & Diagnostics" panel.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Add `openDiagnostics` Command:** In `package.json`, add a new command definition for `code-context-engine.openDiagnostics` with the title "Code Context Engine: Open Diagnostics". | `package.json` |
| **2.2** | ☐ To Do | **Register `openDiagnostics` Command:** In `src/commandManager.ts`, register the new command. The handler should call a new method on the `WebviewManager`, e.g., `this.webviewManager.showDiagnosticsPanel()`. | `src/commandManager.ts` |
| **2.3** | ☐ To Do | **Implement `showDiagnosticsPanel`:** In `src/webviewManager.ts`, create the new method `showDiagnosticsPanel`. It should manage a new panel instance (`diagnosticsPanel`) using the same singleton pattern as `showMainPanel`. | `src/webviewManager.ts` |
| **2.4** | ☐ To Do | **Rename Svelte Component:** Rename the Svelte settings component file to `DiagnosticsView.svelte`. Update any import paths that reference it. | `webview/src/lib/views/SettingsView.svelte` -\> `DiagnosticsView.svelte` |
| **2.5** | ☐ To Do | **Remove Configuration Inputs:** In `DiagnosticsView.svelte`, delete all `<select>` and `<input>` elements used for setting configuration values. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.6** | ☐ To Do | **Display Read-Only Settings:** Add logic to fetch the current settings on mount and display them as plain text (e.g., `<div>Provider: {$settings.embeddingProvider}</div>`). | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.7** | ☐ To Do | **Add "Edit Settings" Button:** Add a new Fluent UI button to `DiagnosticsView.svelte` labeled "Edit Configuration". | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.8** | ☐ To Do | **Implement "Edit Settings" Action:** The new button's `on:click` handler should send a `MapsToSettings` message to the extension. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.9** | ☐ To Do | **Handle `MapsToSettings` Message:** In `src/messageRouter.ts`, add a case for `MapsToSettings` that calls `vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');`. | `src/messageRouter.ts` |
| **2.10** | ☐ To Do | **Verify Action Buttons:** Ensure the "Test Connection" buttons remain in `DiagnosticsView.svelte` and their message-passing logic is still functional. | `webview/src/lib/views/DiagnosticsView.svelte` |
| **2.11** | ☐ To Do | **Test Full Flow:** Manually test opening the new Diagnostics panel, verifying settings are read-only, and confirming the "Edit Configuration" button opens the correct native UI. | `(Manual Test)` |

This completes the full set of PRDs and task lists for the user experience enhancements. You now have a comprehensive plan to integrate native VS Code features and provide a more streamlined and intuitive interface for your users.</prd>
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
````

## File: docs/todo/fix-settings/prd.md
````markdown
<prd>
This plan addresses the removal of unnecessary configuration options and streamlines the application's startup behavior, leading to a cleaner and more user-friendly experience.

-----

### **New Document: `docs/todo/webview-cleanup/PRD_1_Webview_Simplification.md`**

### PRD 1: Foundational - Webview Simplification & Cleanup

**1. Title & Overview**

  * **Project:** Code Context Engine - Webview Simplification & Cleanup
  * **Summary:** This phase focuses on removing deprecated debugging features from the webview and its configuration. The primary goal is to streamline the webview loading process by eliminating the "React Webview Test" as the default view and removing the associated settings from `package.json`.
  * **Dependencies:** This project relies on the existing webview architecture and build process.

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Improve the user experience by providing a direct path to the main application view.
      * Reduce code complexity and potential for configuration errors by removing unused settings.
  * **Developer & System Success Metrics:**
      * The `code-context-engine.webview.routeOverride` and `code-context-engine.webview.basicTestMode` settings are completely removed from `package.json`.
      * The main application view loads by default when the extension is activated.
      * The `WebviewManager` is simplified by removing all logic related to the deprecated settings.

**3. User Personas**

  * **Devin (Developer - End User):** Devin expects the extension to open directly to its main functionality without intermediate test pages. He also benefits from a cleaner settings interface with fewer, more relevant options.
  * **Frank (Frontend Developer):** Frank needs a simplified and predictable webview loading process. Removing debugging-specific logic reduces the surface area for bugs and makes the codebase easier to maintain.

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Cleanup** | **Sprint 1: Configuration & Code Removal** | As Frank, I want to remove the `routeOverride` and `basicTestMode` settings from `package.json`, so that users are not exposed to confusing or irrelevant options. | 1. The `code-context-engine.webview.routeOverride` setting is removed from the `contributes.configuration.properties` section in `package.json`.\<br\>2. The `code-context-engine.webview.basicTestMode` setting is also removed from `package.json`. | **1 Week** |
| | | As Frank, I want to remove the logic in the `WebviewManager` that handles the deprecated settings, so that the code is cleaner and easier to understand. | 1. All code that reads `webview.routeOverride` and `webview.basicTestMode` from the configuration is removed from `src/webviewManager.ts`.\<br\>2. The `getBasicTestHtml` method is removed from `src/webviewManager.ts`.\<br\>3. The logic for injecting the route override script into the webview's HTML is removed. | |

**5. Timeline & Sprints**

  * **Total Estimated Time:** 1 Week
  * **Sprint 1:** Configuration & Code Removal (1 Week)

**6. Risks & Assumptions**

  * **Assumption:** No other parts of the application depend on the `routeOverride` or `basicTestMode` settings.
  * **Risk:** Removing the test mode might make it slightly harder to diagnose certain types of Remote SSH issues in the future.
      * **Mitigation:** The comprehensive logging and diagnostics systems already in place are sufficient for troubleshooting. This cleanup simplifies the codebase, which outweighs the benefit of keeping a separate test mode.

-----

### **New Document: `docs/todo/webview-cleanup/tasklist_sprint_01.md`**

# Task List: Sprint 1 - Configuration & Code Removal

**Goal:** To remove deprecated debugging settings and associated code to streamline the webview loading process.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Remove `routeOverride` Setting:** In `package.json`, locate and delete the entire `code-context-engine.webview.routeOverride` property from the `contributes.configuration.properties` object. | `package.json` |
| **1.2** | ☐ To Do | **Remove `basicTestMode` Setting:** In `package.json`, locate and delete the entire `code-context-engine.webview.basicTestMode` property. | `package.json` |
| **1.3** | ☐ To Do | **Remove `getBasicTestHtml` Method:** In `src/webviewManager.ts`, locate and delete the entire `getBasicTestHtml` method. | `src/webviewManager.ts` |
| **1.4** | ☐ To Do | **Remove Test Mode Logic:** In the `getWebviewContent` method of `src/webviewManager.ts`, remove the `if (basicTestMode)` block that calls `getBasicTestHtml`. | `src/webviewManager.ts` |
| **1.5** | ☐ To Do | **Remove Route Override Logic:** In the `getWebviewContent` method of `src/webviewManager.ts`, remove the code block that reads the `webview.routeOverride` setting and injects the navigation script. | `src/webviewManager.ts` |
| **1.6** | ☐ To Do | **End-of-Sprint Verification:** **Run the extension in debug mode (`F5`).** Verify that the main application view loads directly and that the test page no longer appears. Check the VS Code settings UI to confirm the deprecated settings are gone. | `(Manual Test)` |

Based on my comprehensive analysis of the project's documentation and codebase, there is one final set of planned features related to advanced webview resilience and performance that has not yet been implemented. The existing `shared/connectionMonitor.js` file provides a strong foundation for this work.

I have created a final Product Requirements Document (PRD) to guide the implementation of these remaining features. This plan is designed to build upon the existing, robust architecture.

-----

### **New Document: `docs/todo/resilience/PRD_1_Advanced_Webview_Resilience_and_Optimization.md`**

### PRD 1: Advanced Webview Resilience & Optimization

**1. Title & Overview**

  * **Project:** Code Context Engine - Advanced Webview Resilience & Optimization
  * **Summary:** This phase builds upon the foundational webview system by implementing advanced resilience features, performance optimizations, and production-ready error handling. The focus is on creating a self-healing webview that can recover from transient failures—especially common in Remote SSH environments—and provide an optimal user experience across all network conditions.
  * **Dependencies:** This project depends on a functional React webview and the `MessageRouter` communication layer. The existing `shared/connectionMonitor.js` will serve as the foundation for this work.

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Achieve 99.9% webview uptime across all supported environments, including local and Remote SSH.
      * Implement automatic recovery mechanisms for common failure scenarios to reduce user friction and support tickets.
      * Optimize webview performance, particularly for users on low-bandwidth connections.
  * **Developer & System Success Metrics:**
      * The webview automatically recovers from 90% of transient communication failures without user intervention.
      * Initial webview load time is under 3 seconds, even in Remote SSH environments.
      * The `ConnectionMonitor` successfully detects connection loss within 10 seconds and initiates a reconnection protocol.

**3. User Personas**

  * **Sarah (Remote Developer):** Experiences occasional network interruptions while using Remote SSH. She needs the webview to recover gracefully without requiring a full window reload.
  * **Mike (Performance-Conscious Developer):** Works on large codebases and needs the webview to remain responsive and memory-efficient during extended coding sessions.

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Resilience** | **Sprint 1: Auto-Recovery & Health Monitoring** | As Sarah, I want the webview to automatically detect and recover from communication failures so I don't lose functionality during network interruptions. | 1. The `ConnectionMonitor` implements a heartbeat mechanism to detect lost connections.\<br\>2. When a connection is lost, it automatically attempts to reconnect using an exponential backoff strategy.\<br\>3. The UI displays a clear indicator of the connection status (e.g., "Connected", "Reconnecting..."). | **2 Weeks** |
| | | As an extension developer, I want comprehensive health monitoring that tracks webview performance and errors so issues can be identified proactively. | 1. The `ConnectionMonitor` collects performance metrics (e.g., message latency, load time).\<br\>2. The extension backend can request and log these health metrics from the webview.\<br\>3. Configurable alerting thresholds are in place for critical metrics like high latency or repeated connection failures. | |
| **Phase 1: Resilience** | **Sprint 2: Performance Optimization & Caching** | As Mike, I want optimized resource loading and caching so the webview performs well even with large codebases and slow connections. | 1. The Vite build configuration is optimized for minimal bundle size using code splitting.\<br\>2. A service worker is implemented in the React webview to cache static assets locally.\<br\>3. Subsequent loads of the webview are significantly faster due to caching. | **2 Weeks** |
| | | As Sarah, I want graceful degradation when network conditions are poor so I can continue working with reduced functionality rather than experiencing a complete failure. | 1. The `ConnectionMonitor` detects bandwidth and adjusts UI behavior accordingly (e.g., disabling animations).\<br\>2. User actions are queued when offline and sent automatically upon reconnection.\<br\>3. The UI clearly notifies the user when it is in a "degraded" or "offline" mode. | |

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** Auto-Recovery & Health Monitoring (2 Weeks)
  * **Sprint 2:** Performance Optimization & Caching (2 Weeks)

**6. Risks & Assumptions**

  * **Assumption:** Most connection interruptions in Remote SSH are temporary and recoverable.
  * **Risk:** Caching mechanisms could lead to users seeing stale UI or data after an extension update.
      * **Mitigation:** Implement a robust cache-busting strategy. The service worker should check for a new version of the extension on activation and invalidate the cache.
  * **Risk:** The auto-recovery logic might mask underlying, persistent infrastructure issues.
      * **Mitigation:** The `ConnectionMonitor` must log all disconnects, reconnect attempts, and failures to the centralized logging service, ensuring developers can still diagnose persistent problems.

-----

### **New Document: `docs/todo/resilience/Sub_Sprint_1_Auto_Recovery.md`**

### Sub-Sprint 1: Auto-Recovery System

**Objective:**
To fully implement and integrate an automatic recovery system for webview communication failures, ensuring graceful handling of network interruptions.

**Parent Sprint:**
PRD 1, Sprint 1: Auto-Recovery & Health Monitoring

**Tasks:**

1.  **Integrate `ConnectionMonitor`:** Fully integrate the existing `shared/connectionMonitor.js` into the React application's lifecycle (`App.tsx`).
2.  **Implement Heartbeat:** The monitor should send a `heartbeat` message to the extension every 5 seconds. The `MessageRouter` must respond with a `heartbeatResponse`.
3.  **Implement Reconnection Logic:** If a `heartbeatResponse` is not received within a timeout period, the `ConnectionMonitor` should enter a "disconnected" state and begin reconnection attempts with exponential backoff.
4.  **Add Connection Status UI:** Create a React component that subscribes to the `ConnectionMonitor`'s state and displays a visual indicator of the connection status.

**Acceptance Criteria:**

  * The webview detects a lost connection within 10 seconds of the extension becoming unresponsive.
  * The UI clearly indicates "Connected", "Disconnected", and "Reconnecting..." states.
  * The system successfully recovers the connection after a temporary interruption.

**Dependencies:**

  * The `shared/connectionMonitor.js` file must be available.

**Timeline:**

  * **Start Date:** 2025-09-01
  * **End Date:** 2025-09-05

-----

### **New Document: `docs/todo/resilience/Sub_Sprint_2_Health_Monitoring.md`**

### Sub-Sprint 2: Health Monitoring API

**Objective:**
To implement a system for collecting and reporting webview health and performance metrics to the extension backend for logging and proactive issue detection.

**Parent Sprint:**
PRD 1, Sprint 1: Auto-Recovery & Health Monitoring

**Tasks:**

1.  **Implement Metrics Collection:** The `ConnectionMonitor` should collect key metrics, including message latency (from the heartbeat), reconnection attempts, and error counts.
2.  **Create Health Status API:** The `MessageRouter` will get a new handler for a `getHealthStatus` command.
3.  **Implement Frontend Handler:** When the webview receives a `getHealthStatus` message, it should gather the latest metrics from the `ConnectionMonitor` and send them back in a `healthStatusResponse` message.
4.  **Implement Backend Logging:** The extension backend, upon receiving the `healthStatusResponse`, will log the metrics using the `CentralizedLoggingService`.
5.  **Add Configurable Alerting:** The backend will check the received metrics against thresholds defined in the VS Code settings and trigger a `NotificationService` warning if a threshold is breached.

**Acceptance Criteria:**

  * The extension can successfully request and receive a health status report from the webview.
  * Metrics like latency and error counts are correctly logged.
  * A VS Code warning notification is displayed if the webview's message latency exceeds the configured threshold.

**Dependencies:**

  * Sub-Sprint 1 (Auto-Recovery) must be complete.

**Timeline:**

  * **Start Date:** 2025-09-08
  * **End Date:** 2025-09-12

-----

### **New Document: `docs/todo/resilience/tasklist_sprint_01.md`**

# Task List: Sprint 1 - Auto-Recovery & Health Monitoring

**Goal:** To implement automatic recovery mechanisms and comprehensive health monitoring for proactive webview issue detection and resolution.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Integrate `ConnectionMonitor`:** In `App.tsx`, import and initialize the `connectionMonitor` singleton, passing it the `vscodeApi` instance. | `webview-react/src/App.tsx` |
| **1.2** | ☐ To Do | **Implement Heartbeat Handler:** In `src/messageRouter.ts`, add a handler for the `heartbeat` command that immediately posts back a `heartbeatResponse`. | `src/communication/messageRouter.ts` |
| **1.3** | ☐ To Do | **Implement Reconnection Logic:** In `shared/connectionMonitor.js`, implement the exponential backoff logic for reconnection attempts. | `shared/connectionMonitor.js` |
| **1.4** | ☐ To Do | **Create `ConnectionStatus.tsx` Component:** Create a new React component to display the connection status. It should subscribe to events from the `connectionMonitor`. | `webview-react/src/components/ConnectionStatus.tsx` (New) |
| **1.5** | ☐ To Do | **Add `ConnectionStatus` to UI:** Add the new `ConnectionStatus` component to the main `App.tsx` layout. | `webview-react/src/App.tsx` |
| **1.6** | ☐ To Do | **Implement Metrics Collection:** In `shared/connectionMonitor.js`, add logic to track metrics like latency and error counts. | `shared/connectionMonitor.js` |
| **1.7** | ☐ To Do | **Add `getHealthStatus` Handler:** In `src/messageRouter.ts`, add a handler for the `getHealthStatus` command. | `src/communication/messageRouter.ts` |
| **1.8** | ☐ To Do | **Implement Frontend Handler:** The `connectionMonitor` should listen for `getHealthStatus` and respond with its collected metrics. | `shared/connectionMonitor.js` |
| **1.9** | ☐ To Do | **Implement Backend Logging:** The `MessageRouter` should log the received health status using the `CentralizedLoggingService`. | `src/communication/messageRouter.ts` |
| **1.10** | ☐ To Do | **Add Alerting Thresholds:** Add settings for health monitoring (e.g., `latencyThreshold`) to `package.json`. | `package.json` |
| **1.11** | ☐ To Do | **Implement Alerting Logic:** The backend should check metrics against the configured thresholds and use `NotificationService` to show warnings. | `src/extensionManager.ts` or a new `HealthManager` service |

-----
</prd>
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
</notes>:
````
