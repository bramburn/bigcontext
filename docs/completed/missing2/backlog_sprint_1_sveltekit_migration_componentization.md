### User Story 1: SvelteKit Project Setup
**As a** Frontend Developer, **I want to** replace the current webview implementation with a SvelteKit application configured with a static adapter, **so that** I have a proper foundation for the UI.

**Actions to Undertake:**
1.  **Filepath**: `webview/`
    -   **Action**: Backup the existing `webview/` directory to `webview-backup-YYYYMMDD-HHMMSS`.
    -   **Implementation**: Use shell command: `mv webview webview-backup-$(date +%Y%m%d-%H%M%S)`
    -   **Imports**: N/A
2.  **Filepath**: `webview/` (new)
    -   **Action**: Initialize a new SvelteKit project.
    -   **Implementation**: Run `npm create svelte@latest webview` and select "Skeleton project", "TypeScript", "ESLint", and "Prettier".
    -   **Imports**: N/A
3.  **Filepath**: `webview/package.json`
    -   **Action**: Install necessary dependencies for static site generation and UI components.
    -   **Implementation**: In the `webview` directory, run `npm install -D @sveltejs/adapter-static` and `npm install @fluentui/web-components`.
    -   **Imports**: N/A
4.  **Filepath**: `webview/svelte.config.js`
    -   **Action**: Configure the SvelteKit project to use the static adapter and output to a `build` directory.
    -   **Implementation**: 
        ```javascript
        import adapter from '@sveltejs/adapter-static';

        /** @type {import('@sveltejs/kit').Config} */
        const config = {
          kit: {
            adapter: adapter({
              pages: 'build',
              assets: 'build',
              fallback: 'index.html',
              precompress: false
            }),
            prerender: {
              entries: ['*']
            }
          }
        };

        export default config;
        ```
    -   **Imports**: `import adapter from '@sveltejs/adapter-static';`
5.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Update the `getWebviewContent` method to load the `index.html` from the new SvelteKit build output and correctly rewrite asset paths.
    -   **Implementation**: Modify the method to point to `webview/build/index.html` and use `webview.asWebviewUri` for all local script and link tags.
    -   **Imports**: `import * as path from 'path';`, `import * as fs from 'fs';`

**Acceptance Criteria:**
-   The `webview/` directory is a valid SvelteKit project.
-   Running `npm run build` inside `webview/` generates static files in a `webview/build` directory.
-   The extension's main webview panel loads the `index.html` from the `build` directory without errors.
-   All CSS and JS assets are loaded correctly in the webview.

**Testing Plan:**
-   **Test Case 1**: Run `npm run build` in `webview/` and verify the `build` directory is created with `index.html` and an `_app` subdirectory.
-   **Test Case 2**: Launch the VS Code extension and open the main panel. Verify the default SvelteKit welcome page is displayed.
-   **Test Case 3**: Use VS Code's developer tools to check the webview's console for any 404 errors related to assets.

---

### User Story 2: UI Componentization
**As a** Frontend Developer, **I want to** recreate the `Setup`, `Indexing`, and `Query` views as modular Svelte components, **so that** the UI is organized and state-driven.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/stores/viewStore.ts` (New File)
    -   **Action**: Create a Svelte store to manage which view is currently active.
    -   **Implementation**: 
        ```typescript
        import { writable } from 'svelte/store';

        export type View = 'setup' | 'indexing' | 'query';

        export const currentView = writable<View>('setup');
        ```
    -   **Imports**: `import { writable } from 'svelte/store';`
2.  **Filepath**: `webview/src/lib/components/SetupView.svelte` (New File)
    -   **Action**: Create a placeholder component for the Setup view.
    -   **Implementation**: `<div id="setup-view"><h1>Setup</h1><!-- Configuration form will go here --></div>`
    -   **Imports**: N/A
3.  **Filepath**: `webview/src/lib/components/IndexingView.svelte` (New File)
    -   **Action**: Create a placeholder component for the Indexing view.
    -   **Implementation**: `<div id="indexing-view"><h1>Indexing Progress</h1><!-- Progress bar and logs will go here --></div>`
    -   **Imports**: N/A
4.  **Filepath**: `webview/src/lib/components/QueryView.svelte` (New File)
    -   **Action**: Create a placeholder component for the Query view.
    -   **Implementation**: `<div id="query-view"><h1>Context Query</h1><!-- Query input and results will go here --></div>`
    -   **Imports**: N/A
5.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: Implement the main page to conditionally render the active view based on the `viewStore`.
    -   **Implementation**:
        ```html
        <script lang="ts">
          import { currentView } from '$lib/stores/viewStore';
          import SetupView from '$lib/components/SetupView.svelte';
          import IndexingView from '$lib/components/IndexingView.svelte';
          import QueryView from '$lib/components/QueryView.svelte';
        </script>

        <main>
          {#if $currentView === 'setup'}
            <SetupView />
          {:else if $currentView === 'indexing'}
            <IndexingView />
          {:else if $currentView === 'query'}
            <QueryView />
          {/if}
        </main>
        ```
    -   **Imports**: `import { currentView } from '$lib/stores/viewStore';`, etc.

**Acceptance Criteria:**
-   `SetupView.svelte`, `IndexingView.svelte`, and `QueryView.svelte` files are created.
-   A `viewStore.ts` file exists and exports a writable Svelte store.
-   The main page (`+page.svelte`) correctly displays the `SetupView` component by default.
-   Changing the value of the `currentView` store programmatically causes the displayed component to change.

**Testing Plan:**
-   **Test Case 1**: Verify the `SetupView` is shown when the webview first loads.
-   **Test Case 2**: Use browser developer tools to execute `$currentView.set('query')` in the console and verify the `QueryView` component is rendered.
-   **Test Case 3**: Ensure no console errors appear when switching between views.
