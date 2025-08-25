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