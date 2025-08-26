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