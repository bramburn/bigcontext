# Task List: Sprint 01 - SvelteKit Scaffolding & UI Components

**Goal:** To replace the legacy webview implementation with a new, properly structured SvelteKit application and recreate the core UI views as modular components.

**Methodology:** These tasks are sequential. Each step should be completed before moving to the next. TDD is encouraged: for logic-heavy parts like the state store, consider writing a test first.

---

### **Part 1: Project Scaffolding**

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Backup & Clean `webview` Directory:** Before deleting, make a backup of the existing `webview/` directory to another location, then delete all contents within `webview/`. | `webview/` |
| **1.2** | ☐ To Do | **Initialize SvelteKit Project:** In the root directory, run `npm create svelte@latest webview`. Select the `Skeleton project` template and choose `Yes` for TypeScript support. | `webview/` (New project) |
| **1.3** | ☐ To Do | **Install Static Adapter:** `cd` into the `webview` directory. Run `npm install -D @sveltejs/adapter-static`. This is required to build the SvelteKit app into static files the extension can load. | `webview/package.json` |
| **1.4** | ☐ To Do | **Configure Static Adapter:** Modify `webview/svelte.config.js` to import and use the static adapter. Set the output `pages` and `assets` directory to `build` and set `fallback` to `index.html`. | `webview/svelte.config.js` |
| **1.5** | ☐ To Do | **Install Fluent UI Components:** In the `webview/` directory, run `npm install @fluentui/web-components` to add the UI component library. | `webview/package.json` |
| **1.6** | ☐ To Do | **Verify Build:** In the `webview/` directory, run `npm run build`. Ensure a `build` directory is created inside `webview/` and that it contains an `index.html` file. | `webview/build/` |

---

### **Part 2: UI Component Creation**

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.7** | ☐ To Do | **Create View State Store:** Create a new file for a Svelte writable store to manage the currently active view. The default value should be `'setup'`. | `webview/src/lib/stores/viewStore.ts` (New) |
| **1.8** | ☐ To Do | **Create `SetupView` Component:** Create the file for the Setup view. Copy the HTML structure from the `getSetupWebviewContent` function in `src/extension.ts` and convert it to Svelte syntax using Fluent UI components. | `webview/src/lib/components/SetupView.svelte` (New) |
| **1.9** | ☐ To Do | **Create `IndexingView` Component:** Create the file for the Indexing view. Replicate the progress bar and status text UI from `getWebviewContent` in `src/extension.ts`. | `webview/src/lib/components/IndexingView.svelte` (New) |
| **1.10**| ☐ To Do | **Create `QueryView` Component:** Create the file for the Query view. Replicate the search input and results area from `getWebviewContent` in `src/extension.ts`. | `webview/src/lib/components/QueryView.svelte` (New) |
| **1.11**| ☐ To Do | **Create Main Page Layout:** In the main Svelte page, import the three view components and the `viewStore`. Use an `{#if}` block to conditionally render the correct view based on the store's value. | `webview/src/routes/+page.svelte` |
| **1.12**| ☐ To Do | **Verify View Switching:** Run the dev server with `npm run dev` in `webview/`. Open the browser console and manually set the store's value (e.g., `(await import('./src/lib/stores/viewStore.ts')).currentView.set('query')`) to confirm the view changes. | `(Manual Test)` |
