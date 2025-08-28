# Task List: Sprint 2 - Interactive Search Results

**Goal:** To transform the search results view from plain text into a rich, interactive experience and provide a way for power users to see the raw data.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create `ResultCard.svelte`:** Create a new Svelte component to display a single search result. | `webview/src/lib/components/ResultCard.svelte` (New) |
| **2.2** | ☐ To Do | **Modify results view:** In `webview/src/routes/+page.svelte`, modify the results view to loop through the results and render a `ResultCard` for each one. | `webview/src/routes/+page.svelte` |
| **2.3** | ☐ To Do | **Implement syntax highlighting:** In `webview/src/lib/components/ResultCard.svelte`, implement syntax highlighting for the code snippet using a library like `highlight.js`. | `webview/src/lib/components/ResultCard.svelte` |
| **2.4** | ☐ To Do | **Add UI toggle switch:** In `webview/src/routes/+page.svelte`, add a state variable and a UI toggle switch for "UI" / "XML" view. | `webview/src/routes/+page.svelte` |
| **2.5** | ☐ To Do | **Conditionally render results:** In `webview/src/routes/+page.svelte`, conditionally render either the list of `ResultCard` components or the raw XML based on the `viewMode` state. | `webview/src/routes/+page.svelte` |
