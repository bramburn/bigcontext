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