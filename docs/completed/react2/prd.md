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