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