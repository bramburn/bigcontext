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