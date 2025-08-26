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