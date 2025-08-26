# Task List: Sprint 1 - SvelteKit Migration & Componentization

**Goal:** To migrate the existing webview from a plain TypeScript implementation to a modern SvelteKit application and structure the UI into modular components.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Backup Existing Webview:** Open a terminal and run `mv webview webview-backup-$(date +%Y%m%d-%H%M%S)` to create a timestamped backup of the current webview implementation. | `webview/` (directory) |
| **1.2** | ☐ To Do | **Initialize SvelteKit Project:** In the root directory, run `npm create svelte@latest webview`. When prompted, select: **Skeleton project**, **Yes, using TypeScript syntax**, **Add ESLint**, and **Add Prettier**. | `webview/` (new directory) |
| **1.3** | ☐ To Do | **Install Static Adapter:** `cd` into the new `webview` directory and run `npm install -D @sveltejs/adapter-static`. | `webview/package.json` |
| **1.4** | ☐ To Do | **Install Fluent UI Components:** While in the `webview` directory, run `npm install @fluentui/web-components`. | `webview/package.json` |
| **1.5** | ☐ To Do | **Configure Static Build:** Replace the contents of `webview/svelte.config.js` with the provided code to configure the static adapter and set the output directory to `build`. | `webview/svelte.config.js` |
| **1.6** | ☐ To Do | **Create Stores Directory:** Create a new directory at `webview/src/lib/stores`. | `webview/src/lib/stores/` |
| **1.7** | ☐ To Do | **Create View Store:** Create a new file `viewStore.ts` inside the `stores` directory and add the exported `writable` store to manage the active view (`setup`, `indexing`, or `query`). | `webview/src/lib/stores/viewStore.ts` |
| **1.8** | ☐ To Do | **Create App Store:** Create a new file `appStore.ts` inside the `stores` directory for future global app state (e.g., error messages, notifications). Leave it empty for now. | `webview/src/lib/stores/appStore.ts` |
| **1.9** | ☐ To Do | **Create Components Directory:** Create a new directory at `webview/src/lib/components`. | `webview/src/lib/components/` |
| **1.10** | ☐ To Do | **Create `SetupView` Component:** Create `SetupView.svelte` in the `components` directory with a basic `<h1>Setup</h1>` placeholder. | `webview/src/lib/components/SetupView.svelte` |
| **1.11** | ☐ To Do | **Create `IndexingView` Component:** Create `IndexingView.svelte` in the `components` directory with a basic `<h1>Indexing</h1>` placeholder. | `webview/src/lib/components/IndexingView.svelte` |
| **1.12** | ☐ To Do | **Create `QueryView` Component:** Create `QueryView.svelte` in the `components` directory with a basic `<h1>Query</h1>` placeholder. | `webview/src/lib/components/QueryView.svelte` |
| **1.13** | ☐ To Do | **Implement Main Page Layout:** Replace the contents of `webview/src/routes/+page.svelte`. Import the three view components and the `viewStore`, and use an `{#if}` block to conditionally render the correct view based on the store's value. | `webview/src/routes/+page.svelte` |
| **1.14**| ☐ To Do | **Update `WebviewManager` Path Logic:** In `src/webviewManager.ts`, find the `getWebviewContent` method. Modify the `htmlPath` variable to point to `webview/build/index.html`. | `src/webviewManager.ts` |
| **1.15**| ☐ To Do | **Update `WebviewManager` Asset Rewriting:** In the same method, ensure the regex for rewriting asset paths correctly converts paths for the webview using `webview.asWebviewUri`. The existing logic should be close, but verify it works with the new `build` directory structure. | `src/webviewManager.ts` |
| **1.16**| ☐ To Do | **Test Build & Load:** `cd` into `webview/` and run `npm run build`. Then, launch the extension in VS Code (F5) and run the `Open Main Panel` command. Verify the `SetupView` component loads correctly. | `(Manual Test)` |
