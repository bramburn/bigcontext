# Task List: Sprint 1 - SvelteKit Migration

**Goal:** To migrate the existing webview from plain TypeScript to a modern SvelteKit application.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Backup and Clean `webview/`:** Make a backup of the current `webview/` directory, then delete its contents. | `webview/` |
| **1.2** | ☐ To Do | **Initialize SvelteKit Project:** Run `npm create svelte@latest webview` and select "Skeleton project" with TypeScript support. | `webview/` (New project) |
| **1.3** | ☐ To Do | **Install Static Adapter:** In the `webview/` directory, run `npm install -D @sveltejs/adapter-static`. | `webview/package.json` |
| **1.4** | ☐ To Do | **Configure Static Build:** Modify `webview/svelte.config.js` to use the static adapter, outputting to a `build` directory with `index.html` as the fallback. | `webview/svelte.config.js` |
| **1.5** | ☐ To Do | **Recreate `DatabaseSetup.svelte`:** Create the component and implement the UI and logic from `DatabaseSetup.ts` using Svelte syntax. | `webview/src/lib/components/DatabaseSetup.svelte` (New) |
| **1.6** | ☐ To Do | **Recreate `EmbeddingSetup.svelte`:** Create the component and implement the UI and logic from `EmbeddingSetup.ts`. | `webview/src/lib/components/EmbeddingSetup.svelte` (New) |
| **1.7** | ☐ To Do | **Update `setupStore.ts`:** Ensure the Svelte store (`setupStore.ts`) correctly manages the state for the new components. | `webview/src/lib/stores/setupStore.ts` |
| **1.8** | ☐ To Do | **Create Main Page Layout:** In `webview/src/routes/+page.svelte`, use the store to manage the view and conditionally render the setup components. | `webview/src/routes/+page.svelte` |
| **1.9** | ☐ To Do | **Update `WebviewManager`:** Modify `getWebviewContent` to load `webview/build/index.html` and correctly rewrite asset paths using `asWebviewUri`. | `src/webviewManager.ts` |
