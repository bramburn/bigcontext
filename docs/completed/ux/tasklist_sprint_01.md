# Task List: Sprint 1 - Onboarding & Setup UI

**Goal:** To build the complete user onboarding and setup UI, from initializing the SvelteKit project to enabling the final "Index Now" button based on user configuration.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Project Setup:** In the `webview` directory, initialize a new SvelteKit project with TypeScript support. | `webview/` |
| **1.2** | ☐ To Do | **Project Setup:** Run `npm install` within the new `webview` directory. | `webview/` |
| **1.3** | ☐ To Do | **Configuration:** Install `@sveltejs/adapter-static`. | `webview/package.json` |
| **1.4** | ☐ To Do | **Configuration:** Configure `svelte.config.js` to use `adapter-static` and set the `fallback` page to `index.html`. | `webview/svelte.config.js` |
| **1.5** | ☐ To Do | **UI Framework:** Install Fluent UI dependencies: `@svelte-fui/core` and `@svelte-fui/tailwindcss`. | `webview/package.json` |
| **1.6** | ☐ To Do | **UI Framework:** Configure `tailwind.config.js` to use the `svelte-fui` preset. | `webview/tailwind.config.js` |
| **1.7** | ☐ To Do | **State Management:** Create the Svelte store file `setupStore.ts` with `databaseReady` and `providerSelected` properties. | `webview/src/lib/stores/setupStore.ts` |
| **1.8** | ☐ To Do | **TDD:** Write a basic test for the store to ensure its default state is correct. | `webview/src/lib/stores/setupStore.test.ts` |
| **1.9** | ☐ To Do | **Component:** Create the `DatabaseSetup.svelte` component file. | `webview/src/lib/components/DatabaseSetup.svelte` |
| **1.10**| ☐ To Do | **TDD:** Write a failing test to check that `DatabaseSetup.svelte` renders a select, a button, and a status indicator. | `webview/src/lib/components/DatabaseSetup.test.ts` |
| **1.11**| ☐ To Do | **Component:** Implement the UI for `DatabaseSetup.svelte` using Fluent UI components. | `webview/src/lib/components/DatabaseSetup.svelte` |
| **1.12**| ☐ To Do | **Component:** In `DatabaseSetup.svelte`, bind the status indicator to the `databaseReady` property of the store. | `webview/src/lib/components/DatabaseSetup.svelte` |
| **1.13**| ☐ To Do | **Component:** In `DatabaseSetup.svelte`, implement the `on:click` handler for the "Start" button to send a `startDatabase` message to the extension. | `webview/src/lib/components/DatabaseSetup.svelte` |
| **1.14**| ☐ To Do | **Component:** In `DatabaseSetup.svelte`, add a message listener to handle `databaseStatus` messages from the extension and update the store. | `webview/src/lib/components/DatabaseSetup.svelte` |
| **1.15**| ☐ To Do | **TDD:** Pass the rendering test for `DatabaseSetup.svelte`. | `webview/src/lib/components/DatabaseSetup.test.ts` |
| **1.16**| ☐ To Do | **Component:** Create the `EmbeddingSetup.svelte` component file. | `webview/src/lib/components/EmbeddingSetup.svelte` |
| **1.17**| ☐ To Do | **TDD:** Write a failing test to check that `EmbeddingSetup.svelte` renders a select component. | `webview/src/lib/components/EmbeddingSetup.test.ts` |
| **1.18**| ☐ To Do | **Component:** Implement the UI for `EmbeddingSetup.svelte` with "Ollama" and "OpenAI" options. | `webview/src/lib/components/EmbeddingSetup.svelte` |
| **1.19**| ☐ To Do | **Component:** In `EmbeddingSetup.svelte`, implement the `on:change` handler to update the `providerSelected` property in the store. | `webview/src/lib/components/EmbeddingSetup.svelte` |
| **1.20**| ☐ To Do | **TDD:** Pass the rendering test for `EmbeddingSetup.svelte`. | `webview/src/lib/components/EmbeddingSetup.test.ts` |
| **1.21**| ☐ To Do | **Main View:** Create the main view file `+page.svelte` and import the `DatabaseSetup` and `EmbeddingSetup` components. | `webview/src/routes/+page.svelte` |
| **1.22**| ☐ To Do | **Main View:** In `+page.svelte`, add the "Index Now" button. | `webview/src/routes/+page.svelte` |
| **1.23**| ☐ To Do | **Main View:** In `+page.svelte`, create the derived state `$: canStartIndex` based on the store. | `webview/src/routes/+page.svelte` |
| **1.24**| ☐ To Do | **Main View:** Bind the "Index Now" button's `disabled` state to the `canStartIndex` derived property. | `webview/src/routes/+page.svelte` |
| **1.25**| ☐ To Do | **Main View:** Implement the `startIndexing` click handler to send the configuration from the store to the extension. | `webview/src/routes/+page.svelte` |
| **1.26**| ☐ To Do | **Extension:** In `extension.ts`, add the command `code-context.setup` to create and load the webview panel. | `src/extension.ts` |
| **1.27**| ☐ To Do | **Extension:** In `extension.ts`, implement the message listener to handle `startDatabase` and `startIndexing` commands. | `src/extension.ts` |
| **1.28**| ☐ To Do | **Extension:** In the `startDatabase` handler, implement the logic to create a terminal and run `docker-compose up`. | `src/extension.ts` |
| **1.29**| ☐ To Do | **Extension:** Implement the `pollQdrantHealth` function and call it after starting the database. | `src/extension.ts` |
| **1.30**| ☐ To Do | **Extension:** On successful health check, send the `databaseStatus` message back to the webview. | `src/extension.ts` |
| **1.31**| ☐ To Do | **Integration Test:** Manually test the complete end-to-end flow as described in the PRD's acceptance criteria. | `(Manual Test)` |
