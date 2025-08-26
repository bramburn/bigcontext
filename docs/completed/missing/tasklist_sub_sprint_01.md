# Task List: Sub-Sprint 1 - SvelteKit Migration

**Goal:** To migrate the existing webview from plain TypeScript to a modern SvelteKit application.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Backup and Clean `webview/`:** Make a backup of the current `webview/` directory, then delete its contents to prepare for the new project. | `webview/` |
| **1.2** | ☐ To Do | **Initialize SvelteKit Project:** Run `npm create svelte@latest webview` in the root directory. Select the "Skeleton project" option and choose "Yes, using TypeScript syntax". | `webview/` (New project) |
| **1.3** | ☐ To Do | **Install Static Adapter:** Navigate into the new `webview` directory and run `npm install -D @sveltejs/adapter-static`. | `webview/package.json` |
| **1.4** | ☐ To Do | **Configure Static Build for SPA:** Modify `webview/svelte.config.js` to import and use `adapter-static`, ensuring you set the `fallback: 'index.html'` property to enable SPA mode. | `webview/svelte.config.js` |
| **1.5** | ☐ To Do | **Create `vscodeApi.ts` Helper:** Create a new file `webview/src/lib/vscodeApi.ts` that exports the `acquireVsCodeApi()` instance for easy use in components. | `webview/src/lib/vscodeApi.ts` (New) |
| **1.6** | ☐ To Do | **Recreate `DatabaseSetup.svelte` Component:** Create the component file. Replicate the UI and logic from the original `DatabaseSetup.ts` using Svelte syntax and Fluent UI components. | `webview/src/lib/components/DatabaseSetup.svelte` (New) |
| **1.7** | ☐ To Do | **Recreate `EmbeddingSetup.svelte` Component:** Create the component file and implement the UI and logic from the original `EmbeddingSetup.ts`. | `webview/src/lib/components/EmbeddingSetup.svelte` (New) |
| **1.8** | ☐ To Do | **Update `setupStore.ts` for Svelte:** Ensure the Svelte store at `webview/src/lib/stores/setupStore.ts` correctly manages the state for the new Svelte components. No changes may be needed if it's already a standard Svelte store. | `webview/src/lib/stores/setupStore.ts` |
| **1.9** | ☐ To Do | **Create Main Page Layout (`+page.svelte`):** In `webview/src/routes/+page.svelte`, import the store and the new setup components. Use the store's state to conditionally render the correct component. | `webview/src/routes/+page.svelte` (New) |
| **1.10** | ☐ To Do | **Update `WebviewManager` to Use Build Output:** Modify the `getWebviewContent` method in `src/webviewManager.ts` to read `webview/build/index.html`. | `src/webviewManager.ts` |
| **1.11** | ☐ To Do | **Implement Asset Path Rewriting in `WebviewManager`:** In `getWebviewContent`, add the logic to replace all `href` and `src` paths with correctly formatted `panel.webview.asWebviewUri` paths. | `src/webviewManager.ts` |
| **1.12** | ☐ To Do | **Add Content Security Policy (CSP):** In `getWebviewContent`, inject the necessary `<meta>` tag for the CSP, including a `nonce` for all script tags, to ensure the webview loads securely. | `src/webviewManager.ts` |
| **1.13** | ☐ To Do | **Test: Build and Load Webview:** Run `npm run build` in the `webview` directory. Launch the extension and verify the new Svelte-based UI loads correctly. | `(Manual Test)` |
