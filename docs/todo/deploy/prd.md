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