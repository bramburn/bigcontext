### tasklist\_sprint\_01.md

# Task List: Sprint 1 - Workspace State Detection & UI Scaffolding

**Goal:** To implement the backend logic for workspace detection and create the Svelte component structure for the "no workspace" UI state.

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

**1.1**

 | 

☐ To Do

 | 

**Check Workspace in `CommandManager`:** In `src/commandManager.ts`, inside `handleOpenMainPanel`, get the workspace folders via `vscode.workspace.workspaceFolders`.

 | 

`src/commandManager.ts`

 |
| 

**1.2**

 | 

☐ To Do

 | 

**Pass State to `WebviewManager`:** Modify the `webviewManager.showMainPanel()` call to pass a boolean flag indicating if a workspace is open (e.g., `showMainPanel({ isWorkspaceOpen: !!folders && folders.length > 0 })`).

 | 

`src/commandManager.ts`

 |
| 

**1.3**

 | 

☐ To Do

 | 

**Send Initial State Message:** In `src/webviewManager.ts`, update `showMainPanel` to accept the options object. After creating the panel, immediately `postMessage` with the `isWorkspaceOpen` state.

 | 

`src/webviewManager.ts`

 |
| 

**1.4**

 | 

☐ To Do

 | 

**Update Svelte Store:** In `webview/src/lib/stores/appStore.ts`, add a new property `isWorkspaceOpen: boolean` to the `AppState` interface and its initial state.

 | 

`webview/src/lib/stores/appStore.ts`

 |
| 

**1.5**

 | 

☐ To Do

 | 

**Create `NoWorkspaceView.svelte`:** Create the new component file. Add a simple `<div>` with placeholder text like "No workspace is open."

 | 

`webview/src/lib/components/NoWorkspaceView.svelte` (New)

 |
| 

**1.6**

 | 

☐ To Do

 | 

**Handle Initial State in UI:** In `webview/src/routes/+page.svelte`, add a message listener in `onMount` that listens for the initial state message from the backend and updates the `appStore`.

 | 

`webview/src/routes/+page.svelte`

 |
| 

**1.7**

 | 

☐ To Do

 | 

**Implement Conditional Rendering:** In `+page.svelte`, import `NoWorkspaceView` and the `appStore`. Use an `{#if $appStore.isWorkspaceOpen}` block to render either the main app components or the new `NoWorkspaceView`.

 | 

`webview/src/routes/+page.svelte`

 |
| 

**1.8**

 | 

☐ To Do

 | 

**Test Scenarios:** Manually test by launching the extension with and without a folder open to verify the correct view is displayed.

 | 

`(Manual Test)`

 |

### tasklist\_sprint\_02.md

# Task List: Sprint 2 - Fluent UI Implementation & Command Integration

**Goal:** To build the user-facing UI for the "no workspace" state and connect it to the backend to trigger the "Open Folder" dialog.

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

**2.1**

 | 

☐ To Do

 | 

**Import Fluent UI:** In `NoWorkspaceView.svelte`, import `fluent-card` and `fluent-button` from the Fluent UI library.

 | 

`webview/src/lib/components/NoWorkspaceView.svelte`

 |
| 

**2.2**

 | 

☐ To Do

 | 

**Build UI Layout:** Structure the component's HTML using `<fluent-card>` as the main container. Add a heading and descriptive text.

 | 

`webview/src/lib/components/NoWorkspaceView.svelte`

 |
| 

**2.3**

 | 

☐ To Do

 | 

**Add "Open Folder" Button:** Add a `<fluent-button>` with `appearance="accent"` and the label "Open Folder".

 | 

`webview/src/lib/components/NoWorkspaceView.svelte`

 |
| 

**2.4**

 | 

☐ To Do

 | 

**Implement Button Click Handler:** Create a function that is called on the button's `on:click` event. This function should call `postMessage('requestOpenFolder')` using the `vscodeApi` wrapper.

 | 

`webview/src/lib/components/NoWorkspaceView.svelte`

 |
| 

**2.5**

 | 

☐ To Do

 | 

**Add `MessageRouter` Handler:** In `src/communication/messageRouter.ts`, add a new `case 'requestOpenFolder'` to the `handleMessage` method's `switch` statement.

 | 

`src/communication/messageRouter.ts`

 |
| 

**2.6**

 | 

☐ To Do

 | 

**Execute VS Code Command:** The `requestOpenFolder` handler should call `vscode.commands.executeCommand('vscode.openFolder')`.

 | 

`src/communication/messageRouter.ts`

 |
| 

**2.7**

 | 

☐ To Do

 | 

**Add Workspace Change Listener:** In `src/extensionManager.ts`, inside the `initialize` method, subscribe to `vscode.workspace.onDidChangeWorkspaceFolders`.

 | 

`src/extensionManager.ts`

 |
| 

**2.8**

 | 

☐ To Do

 | 

**Implement UI Update on Change:** The change listener's callback should check if workspace folders have been added. If so, it should send a message to the webview (e.g., `updateState`) to set `isWorkspaceOpen` to `true`.

 | 

`src/extensionManager.ts`, `src/webviewManager.ts`

 |
| 

**2.9**

 | 

☐ To Do

 | 

**Handle Update Message in UI:** In `+page.svelte`, add a listener for the `updateState` message and update the `appStore` accordingly.

 | 

`webview/src/routes/+page.svelte`

 |
| 

**2.10**

 | 

☐ To Do

 | 

**Test Full Workflow:** Launch the extension without a folder. Click the "Open Folder" button, select a folder, and verify the UI automatically updates to the main application view.

 | 

`(Manual Test)`

 |