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