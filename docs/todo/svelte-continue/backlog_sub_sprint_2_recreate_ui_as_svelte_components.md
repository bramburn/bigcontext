# Backlog: Sub-Sprint 2 - Recreate UI as Svelte Components

**Objective:** To build the three primary UI views as distinct Svelte components, replicating the functionality and layout from the original inline HTML.

**Parent Sprint:** PRD 1, Sprint 1: SvelteKit Scaffolding & UI Components

---

### User Story 1: Create Core View Components
**As a** Frontend Developer (Frank), **I want to** create separate Svelte components for each of the main UI views (Setup, Indexing, Query), **so that** the UI is modular, maintainable, and easy to manage.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/SetupView.svelte` (New File)
    -   **Action**: **Create SetupView Component**: Create a new Svelte component and transfer the relevant HTML structure from the `getSetupWebviewContent` function in `src/extension.ts`. Replace standard HTML elements with corresponding Fluent UI components (e.g., `<fluent-select>`, `<fluent-text-field>`, `<fluent-button>`).
    -   **Implementation**: See implementation guide for code structure.
    -   **Imports**: `import "@fluentui/web-components";`
2.  **Filepath**: `webview/src/lib/components/IndexingView.svelte` (New File)
    -   **Action**: **Create IndexingView Component**: Create a new Svelte component for the indexing progress view. This includes the progress bar/ring and status text area from the `getWebviewContent` function.
    -   **Implementation**: See implementation guide for code structure.
    -   **Imports**: `import "@fluentui/web-components";`
3.  **Filepath**: `webview/src/lib/components/QueryView.svelte` (New File)
    -   **Action**: **Create QueryView Component**: Create a new Svelte component for the search/query interface. This includes the search input field, search button, and results area from the `getWebviewContent` function.
    -   **Implementation**: See implementation guide for code structure.
    -   **Imports**: `import "@fluentui/web-components";`

**Acceptance Criteria:**
-   Three new files exist: `SetupView.svelte`, `IndexingView.svelte`, and `QueryView.svelte`.
-   Each file contains the basic UI structure corresponding to its purpose, derived from `extension.ts`.
-   The components use Fluent UI web components for their interactive elements.

**Testing Plan:**
-   **Test Case 1**: Manually inspect each component file to ensure it contains the correct HTML structure and Fluent UI tags.
-   **Test Case 2**: Ensure the project still builds successfully with `npm run build` after creating these components.

---

### User Story 2: Implement View Management
**As a** Frontend Developer (Frank), **I want** a centralized state management system to control which view is currently visible, **so that** the application can easily switch between the Setup, Indexing, and Query states.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/stores/viewStore.ts` (New File)
    -   **Action**: **Create View State Store**: Create a new file to house a Svelte writable store. This store will hold a string value representing the current view state (e.g., 'setup', 'indexing', 'query').
    -   **Implementation**: `import { writable } from 'svelte/store'; export const currentView = writable('setup');`
    -   **Imports**: `import { writable } from 'svelte/store';`
2.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: **Create View Manager**: Modify the main page component to act as a view controller. It should import the three view components and the `viewStore`.
    -   **Implementation**: Use an `{#if ... else if ...}` block that subscribes to the `currentView` store and conditionally renders the correct view component based on the store's value.
    -   **Imports**: `import SetupView from '$lib/components/SetupView.svelte';`, `import IndexingView from '$lib/components/IndexingView.svelte';`, `import QueryView from '$lib/components/QueryView.svelte';`, `import { currentView } from '$lib/stores/viewStore';`

**Acceptance Criteria:**
-   A `viewStore.ts` file exists and exports a writable Svelte store.
-   The main `+page.svelte` correctly imports and uses the store.
-   Changing the value of the store (e.g., via browser devtools) correctly switches the rendered component in the UI.

**Testing Plan:**
-   **Test Case 1**: Run the app using `npm run dev`. Verify the default view (`SetupView`) is displayed.
-   **Test Case 2**: Use the browser's JavaScript console to import the store and set its value (e.g., `window.currentView.set('query')`). Verify the UI correctly updates to show the `QueryView` component.
