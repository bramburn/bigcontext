<prd>### PRD 1: Foundational - No-Workspace User Guidance

**1\. Title & Overview**

- **Project:** Code Context Engine - No-Workspace UI
    
- **Summary:** This phase will implement a user-friendly notice for users who open the extension without having a folder or repository open. The current behavior is undefined or may show a non-functional UI. This feature will detect the "no workspace" state and display a dedicated view within the webview, guiding the user to open a folder to continue.
    
- **Dependencies:** This feature builds upon the existing `WebviewManager`, `MessageRouter`, and the SvelteKit frontend. It requires the ability to pass an initial state from the extension backend to the webview upon creation.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Improve the first-time user experience and reduce initial confusion.
        
    - Increase successful user activation by guiding users past a common setup hurdle.
        
    - Decrease the number of support queries related to the extension not working in an empty VS Code window.
        
- **Developer & System Success Metrics:**
    
    - The extension correctly detects when no workspace folders are open.
        
    - The SvelteKit UI receives an initial state from the backend indicating the workspace status.
        
    - A new, dedicated "No Workspace" view is displayed instead of the main application UI when no folder is open.
        
    - The "Open Folder" button in the new view successfully triggers the native VS Code "Open Folder" dialog.
        

**3\. User Personas**

- **Devin (Developer - End User):** Devin has just installed the extension and opens it in a new, empty VS Code window to see what it does. He needs to be told clearly that a code repository must be open for the extension to function.
    
- **Frank (Frontend Developer):** Frank needs to build a new Svelte component for the "No Workspace" state. He requires a clear signal from the backend to know when to display this new component.
    

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

**Phase 1: Foundation**

 | 

**Sprint 1: Workspace State Detection & UI Scaffolding**

 | 

As Alisha (Backend Developer), I want the extension to detect if a workspace is open when the main panel is activated, so I can inform the UI of the current context.

 | 

1\. When the `openMainPanel` command is triggered, the backend checks `vscode.workspace.workspaceFolders`. <br> 2. An initial state message (e.g., `{ command: 'setInitialState', payload: { workspaceOpen: false } }`) is sent to the webview upon its creation. <br> 3. The `viewStore` in the SvelteKit app is updated to handle this new state.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As Frank (Frontend Developer), I want to create a new Svelte component that is shown when no workspace is open, so I have a dedicated view for this state.

 | 

1\. A new `NoWorkspaceView.svelte` component is created. <br> 2. The main `+page.svelte` is updated to conditionally render this new component if the `workspaceOpen` state is `false`. <br> 3. The new component contains placeholder text indicating that a folder must be opened.

 | 

  


 |
| 

**Phase 1: Foundation**

 | 

**Sprint 2: Fluent UI Implementation & Command Integration**

 | 

As Frank, I want the "No Workspace" view to be built with Fluent UI components and provide a clear call to action, so the UI is professional and guides the user.

 | 

1\. The `NoWorkspaceView.svelte` component is styled using Fluent UI components (e.g., `fluent-card`, `fluent-button`). <br> 2. The view displays a clear message, such as "Please open a folder or repository to get started." <br> 3. A prominent "Open Folder" button is displayed.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As Devin, I want to click the "Open Folder" button in the UI to bring up the native folder selection dialog, so I can easily select a project to index.

 | 

1\. Clicking the "Open Folder" button sends a `requestOpenFolder` message to the extension backend. <br> 2. The `MessageRouter` has a new handler for this message. <br> 3. The handler executes the built-in `vscode.openFolder` command. <br> 4. The native "Open Folder" dialog is successfully displayed to the user.

 | 

  


 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 4 Weeks
    
- **Sprint 1:** Workspace State Detection & UI Scaffolding (2 Weeks)
    
- **Sprint 2:** Fluent UI Implementation & Command Integration (2 Weeks)
    

**6\. Risks & Assumptions**

- **Assumption:** The `vscode.workspace.workspaceFolders` API is a reliable source for determining if a repository is open.
    
- **Risk:** The SvelteKit application's state management might become complex if not handled cleanly.
    
    - **Mitigation:** Use a dedicated Svelte store (e.g., `appStore.ts`) to manage the `workspaceOpen` state, ensuring a single source of truth for the entire UI.
        
- **Risk:** The user might open a folder and the UI doesn't automatically update.
    
    - **Mitigation:** The extension backend should listen for the `vscode.workspace.onDidChangeWorkspaceFolders` event. When a folder is opened, the extension should send a new message to the webview to update its state, causing it to re-render and show the main application UI.
### Sub-Sprint 1: Backend Logic & Svelte Component

**Objective:** To implement the backend logic for detecting the workspace state and to create the new Svelte component scaffolding for the "No Workspace" view.

**Parent Sprint:** PRD 1, Sprint 1: Workspace State Detection & UI Scaffolding

**Tasks:**

1. **Modify `CommandManager`:** In the `handleOpenMainPanel` method, add a check for `vscode.workspace.workspaceFolders`.
    
2. **Send Initial State:** When the `WebviewManager` creates a new panel, immediately `postMessage` with the workspace status (e.g., `{ command: 'initialState', payload: { isWorkspaceOpen: true/false } }`).
    
3. **Update Svelte Store:** In `webview/src/lib/stores/appStore.ts`, add a new state property `isWorkspaceOpen: boolean`.
    
4. **Create `NoWorkspaceView.svelte`:** Create a new Svelte component with placeholder content.
    
5. **Update `+page.svelte`:** Add a message listener to update the `appStore` with the initial state from the backend. Use an `{#if}` block to conditionally render `NoWorkspaceView.svelte` or the main app view based on the store's state.
    

**Acceptance Criteria:**

- When the extension is opened in an empty VS Code window, the new `NoWorkspaceView.svelte` component is rendered.
    
- When the extension is opened with a folder already open, the existing main application view is rendered.
    
- The Svelte store correctly reflects the workspace state.
    

**Dependencies:**

- A functional `MessageRouter` to handle the initial state message.
    

**Timeline:**

- **Start Date:** 2025-09-10
    
- **End Date:** 2025-09-16
    

### Sub-Sprint 2: Fluent UI & "Open Folder" Workflow

**Objective:** To build out the `NoWorkspaceView.svelte` component using Fluent UI and implement the full message-passing workflow for the "Open Folder" button.

**Parent Sprint:** PRD 1, Sprint 2: Fluent UI Implementation & Command Integration

**Tasks:**

1. **Implement `NoWorkspaceView` UI:** Rebuild the component using Fluent UI elements like `<fluent-card>` for the container and `<fluent-button>` for the call to action. Add clear, helpful text.
    
2. **Implement Button Action:** The `on:click` handler for the "Open Folder" button should send a `requestOpenFolder` message to the extension backend via the `vscodeApi` wrapper.
    
3. **Create `MessageRouter` Handler:** In `src/communication/messageRouter.ts`, add a new `case` to the `handleMessage` switch for `requestOpenFolder`.
    
4. **Execute VS Code Command:** The handler for `requestOpenFolder` should call `vscode.commands.executeCommand('vscode.openFolder')`.
    
5. **Implement Workspace Change Listener:** In `ExtensionManager.ts`, subscribe to the `vscode.workspace.onDidChangeWorkspaceFolders` event. When a new folder is added, send an `updateState` message to the webview to set `isWorkspaceOpen` to `true`.
    

**Acceptance Criteria:**

- The "No Workspace" view is styled professionally with Fluent UI.
    
- Clicking the "Open Folder" button successfully opens the native OS folder selection dialog.
    
- After a user selects a folder, the webview automatically re-renders to show the main application UI without requiring a manual reload.
    

**Dependencies:**

- Sub-Sprint 1 must be complete.
    

**Timeline:**

- **Start Date:** 2025-09-17
    
- **End Date:** 2025-09-23

</prd>