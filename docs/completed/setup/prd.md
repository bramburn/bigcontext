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