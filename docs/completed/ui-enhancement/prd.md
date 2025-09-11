# PRD 17: Comprehensive UI/UX Navigation Overhaul

**1\. Title & Overview**

- **Project:** Code Context Engine - Comprehensive UI/UX Navigation Overhaul
    
- **Summary:** This phase focuses on a significant refactoring of the user interface to implement a professional, multi-faceted navigation system. We will introduce a primary **Activity Bar** entry, a hierarchical **Sidebar Tree Navigation**, and a **Tabbed Interface** within main panels. This will dramatically improve feature discoverability and create a more intuitive workflow, moving from a single-view panel to a full-featured extension interface.
    
- **Dependencies:** This is a major UI refactoring that will touch all existing webview components.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Enhance the product's professional look and feel to be on par with top-tier VS Code extensions.
        
    - Improve user engagement by making all features, including advanced ones, easily discoverable.
        
- **Developer & System Success Metrics:**
    
    - All major views (Search, Indexing, Settings, etc.) are accessible via a primary icon in the VS Code Activity Bar.
        
    - The sidebar provides a clear, hierarchical tree view that allows navigation to all sub-panels.
        
    - Users can switch between related views (e.g., "Quick Search," "Saved Searches") using tabs without losing their context.
        

**3\. User Personas**

- **Devin (Developer - End User):** Devin wants the extension to feel like a natural part of VS Code. He expects to find it in the Activity Bar and wants a clear, organized way to navigate between its various functions without feeling lost.
    
- **Nina (New Developer):** Nina is exploring the extension for the first time. A clear navigation hierarchy in the sidebar will help her discover features like the "Code Relationship Map" or "Performance Dashboard" organically.
    

**4\. Requirements Breakdown**

| 
Phase

 | 

Sprint

 | 

User Story

 | 

Acceptance Criteria

 | 

Duration

 |
| --- | --- | --- | --- | --- |
| 

**Phase 7: UI/UX**

 | 

**Sprint 17: Navigation**

 | 

As Devin, I want to access the extension from the VS Code Activity Bar so that I can quickly open its main panel.

 | 

1\. A new "Code Context" icon is contributed to the Activity Bar via `package.json`.<br>2. Clicking the icon opens a webview container in the sidebar.<br>3. The view is persistent and maintains its state when the user switches to other activity bar items and back.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As Nina, I want a hierarchical sidebar navigation tree so that I can see all available features and drill down into specific areas.

 | 

1\. The main webview is structured with a primary sidebar for navigation.<br>2. A tree component (e.g., from Fluent UI) is used to display top-level items (Search, Indexing, etc.) with collapsible children.<br>3. Clicking a child node in the tree renders the corresponding view in the main content area.

 | 

  


 |
| 

  


 | 

  


 | 

As Devin, I want a tabbed interface within the search section so that I can switch between "Quick Search" and "Saved Searches" easily.

 | 

1\. The content area for the "Search" section is implemented with a tab component.<br>2. The tabs allow switching between the `QueryView` and the `SavedSearchesView` without re-triggering the sidebar navigation.<br>3. The active tab state is preserved during the session.

 | 

  


 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 2 Weeks
    
- **Sprint 17:** Comprehensive UI/UX Navigation Overhaul (2 Weeks)
    

**6\. Risks & Assumptions**

- **Risk:** Refactoring the entire UI structure could introduce regressions in existing components.
    
    - **Mitigation:** Create a new main layout component (`Shell.tsx` or similar) and progressively migrate existing views into it, testing each one thoroughly after migration.
        
- **Assumption:** A single webview panel can effectively manage the state for all navigation elements (sidebar, tabs, content).
    
    - **Mitigation:** Use a lightweight state management library (like Zustand or React Context) specifically for managing the UI's navigation state.


# Task List: Sprint 17 - Comprehensive UI/UX Navigation Overhaul

**Goal:** To refactor the entire webview UI to use a modern, multi-part navigation system including an Activity Bar entry, sidebar tree, and tabs.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**17.1**

 | 

☐ To Do

 | 

**Contribute to Activity Bar:** In `package.json`, add a `contributes.viewsContainers` section to define a new container in the Activity Bar.

 | 

`package.json`

 |
| 

**17.2**

 | 

☐ To Do

 | 

**Define Webview View:** In `package.json`, add a `contributes.views` section to place your main webview inside the new container.

 | 

`package.json`

 |
| 

**17.3**

 | 

☐ To Do

 | 

**Update `WebviewManager`:** Refactor `src/managers/WebviewManager.ts` to register a `vscode.window.registerWebviewViewProvider` instead of creating a standalone panel.

 | 

`src/managers/WebviewManager.ts`

 |
| 

**17.4**

 | 

☐ To Do

 | 

**Create `Layout.tsx`:** In `webview-react/src/components/`, create a new main layout component. This component will contain the sidebar and a content area.

 | 

`webview-react/src/components/Layout.tsx` (New)

 |
| 

**17.5**

 | 

☐ To Do

 | 

**Implement Sidebar Tree:** In `Layout.tsx`, use a library component (e.g., Fluent UI's `Nav`) to build the hierarchical navigation tree with items like "Search", "Indexing Status", etc.

 | 

`webview-react/src/components/Layout.tsx`

 |
| 

**17.6**

 | 

☐ To Do

 | 

**Implement Navigation State:** Introduce a simple state management solution (e.g., `useState` in `App.tsx` or a React Context) to track the currently selected view.

 | 

`webview-react/src/App.tsx`

 |
| 

**17.7**

 | 

☐ To Do

 | 

**Implement Content Routing:** The `Layout.tsx`'s content area should conditionally render the correct view component (`QueryView`, `IndexingDashboard`, etc.) based on the navigation state.

 | 

`webview-react/src/components/Layout.tsx`

 |
| 

**17.8**

 | 

☐ To Do

 | 

**Implement Tabbed View:** For the "Search" section, create a `SearchContainer.tsx` component that uses a `TabList` component to manage switching between `QueryView` and `SavedSearchesView`.

 | 

`webview-react/src/components/SearchContainer.tsx` (New)

 |
| 

**17.9**

 | 

☐ To Do

 | 

**Migrate Existing Views:** Update `App.tsx` to render the new `Layout.tsx` as its primary child, effectively migrating all existing views into the new navigation shell.

 | 

`webview-react/src/App.tsx`

 |
# PRD 18: Workflow Integration & User Assistance

**1\. Title & Overview**

- **Project:** Code Context Engine - Workflow Integration & User Assistance
    
- **Summary:** This phase focuses on deeply integrating the extension into a developer's natural workflow and providing robust in-app support. We will implement comprehensive **Command Palette Integration** for all key actions, allowing for fast, keyboard-driven access. We will also create a dedicated **Help & Documentation** view within the extension, providing users with tutorials and FAQs without needing to leave their editor.
    
- **Dependencies:** Requires the core backend services and the new navigation structure from Sprint 17.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Increase adoption among power users who rely on keyboard-centric workflows.
        
    - Reduce user friction and support load by providing accessible, in-app documentation.
        
- **Developer & System Success Metrics:**
    
    - At least 10 distinct extension commands are accessible and functional from the VS Code Command Palette.
        
    - The new Help view successfully renders documentation content.
        
    - User analytics show that Command Palette invocations become a significant source of feature usage.
        

**3\. User Personas**

- **Kael (Keyboard-Only Developer):** Kael lives in the Command Palette (`Ctrl+Shift+P`). He wants to type "Code Context: Re-index Project" to trigger an action without having to click through the UI.
    
- **Nina (New Developer):** Nina is unsure how to configure the extension for a new language. She wants to open a "Help" section within the extension to find a guide on multi-language support.
    

**4\. Requirements Breakdown**

| 
Phase

 | 

Sprint

 | 

User Story

 | 

Acceptance Criteria

 | 

Duration

 |
| --- | --- | --- | --- | --- |
| 

**Phase 7: UI/UX**

 | 

**Sprint 18: Workflow & Help**

 | 

As a power user, I want to use the Command Palette to access all major features so that I can work quickly without using the mouse.

 | 

1\. A `contributes.commands` section is added to `package.json` for actions like "Show Search", "Re-index", "Open Settings".<br>2. Each command is registered in `extension.ts` using `vscode.commands.registerCommand`.<br>3. Executing a command successfully triggers the corresponding backend action or focuses the relevant UI view.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As a new user, I want to access tutorials and FAQs within the extension so that I can learn how to use it effectively.

 | 

1\. A new `HelpView.tsx` component is created.<br>2. This component renders structured help content (e.g., from a local Markdown file or hardcoded JSX).<br>3. The Help view is accessible from the main sidebar navigation.<br>4. The content includes guides for key features and answers to frequently asked questions.

 | 

  


 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 2 Weeks
    
- **Sprint 18:** Workflow Integration & User Assistance (2 Weeks)
    

**6\. Risks & Assumptions**

- **Risk:** The list of commands in the Command Palette could become overly long.
    
    - **Mitigation:** Use a consistent prefix for all commands (e.g., "Code Context: ...") to make them easy to filter and discover.
        
- **Assumption:** Static, compiled-in help documentation is sufficient for the initial version.
    
    - **Mitigation:** If documentation needs to be updated more frequently, the `HelpView` can be modified in a future sprint to fetch content from a remote URL.



# Task List: Sprint 18 - Workflow Integration & User Assistance

**Goal:** To register all key extension actions in the Command Palette and create a dedicated in-app view for help and documentation.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**18.1**

 | 

☐ To Do

 | 

**Define Commands in `package.json`:** Add a `contributes.commands` array. For each command, provide a `command` ID (e.g., `code-context.reindex`) and a `title` (e.g., "Code Context: Re-index Current Project").

 | 

`package.json`

 |
| 

**18.2**

 | 

☐ To Do

 | 

**Add Commands to Palette Menu:** Add a `contributes.menus.commandPalette` array to specify which commands should appear in the Command Palette.

 | 

`package.json`

 |
| 

**18.3**

 | 

☐ To Do

 | 

**Register Command Handlers:** In `src/extension.ts`, for each command defined in `package.json`, create a `vscode.commands.registerCommand` call.

 | 

`src/extension.ts`

 |
| 

**18.4**

 | 

☐ To Do

 | 

**Implement Command Logic (Backend):** The handler for a command like `code-context.reindex` should call the appropriate method on the `IndexingService`.

 | 

`src/extension.ts`, `src/indexing/indexingService.ts`

 |
| 

**18.5**

 | 

☐ To Do

 | 

**Implement Command Logic (Frontend):** The handler for a command like `code-context.showSettings` should call a method on the `WebviewManager` to send a message to the webview, telling it to switch to the settings view.

 | 

`src/extension.ts`, `src/managers/WebviewManager.ts`

 |
| 

**18.6**

 | 

☐ To Do

 | 

**Create `HelpView.tsx` Component:** Create a new file `webview-react/src/components/HelpView.tsx`.

 | 

`webview-react/src/components/HelpView.tsx` (New)

 |
| 

**18.7**

 | 

☐ To Do

 | 

**Add Static Help Content:** Populate the `HelpView` component with JSX that includes headings, paragraphs, and code snippets explaining how to use the extension's features.

 | 

`webview-react/src/components/HelpView.tsx`

 |
| 

**18.8**

 | 

☐ To Do

 | 

**Add Help to Navigation:** In `webview-react/src/components/Layout.tsx`, add a "Help" entry to the sidebar navigation tree.

 | 

`webview-react/src/components/Layout.tsx`

 |
| 

**18.9**

 | 

☐ To Do

 | 

**Route to Help View:** Update the content router logic in `Layout.tsx` to render the `HelpView` component when "Help" is selected in the sidebar.

 | 

`webview-react/src/components/Layout.tsx`

 |