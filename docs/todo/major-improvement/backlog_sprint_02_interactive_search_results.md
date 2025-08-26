# Backlog: Sprint 2 - Interactive Search Results

**Objective:** To transform the search results view from plain text into a rich, interactive experience and provide a way for power users to see the raw data.

---

### User Story 1: Interactive Result Cards
**As a** user, **I want** the search results to be interactive cards, **so that** I can explore my code directly from the UI.

**Acceptance Criteria:**
- Each search result is displayed as a distinct card.
- The card contains a code snippet with syntax highlighting.
- Clicking the file path on the card opens the file in a new editor tab at the correct line.
- Each card has a "Copy Snippet" button that copies the code to the clipboard.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/ResultCard.svelte` (New File)
    -   **Action**: Create a new Svelte component to display a single search result.
    -   **Implementation**:
        ```svelte
        <script>
          export let result; // Pass result object as a prop
          // function to handle file open
          // function to handle copy
        </script>

        <div class="result-card">
          <div class="file-path" on:click={openFile}>{result.filePath}:{result.lineNumber}</div>
          <pre><code>{result.snippet}</code></pre>
          <button on:click={copySnippet}>Copy Snippet</button>
        </div>
        ```
    -   **Imports**: None.
2.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: Modify the results view to loop through the results and render a `ResultCard` for each one.
    -   **Implementation**:
        ```svelte
        <script>
            import ResultCard from '$lib/components/ResultCard.svelte';
            let results = []; // assume this is populated from the backend
        </script>

        {#each results as result (result.id)}
            <ResultCard {result} />
        {/each}
        ```
    -   **Imports**: `import ResultCard from '$lib/components/ResultCard.svelte';`
3.  **Filepath**: `webview/src/lib/components/ResultCard.svelte`
    -   **Action**: Implement syntax highlighting for the code snippet.
    -   **Implementation**: Use a library like `highlight.js`.
        ```svelte
        <script>
            import hljs from 'highlight.js';
            import 'highlight.js/styles/github-dark.css';
            export let result;
            let highlightedCode;

            $: {
                highlightedCode = hljs.highlight(result.snippet, {language: result.language}).value;
            }
        </script>

        <pre><code class="hljs">{@html highlightedCode}</code></pre>
        ```
    -   **Imports**: `import hljs from 'highlight.js';`

---

### User Story 2: Raw XML View Toggle
**As a** power user, **I want** to be able to switch between a user-friendly view of the results and the raw `repomix`-style XML output, **so that** I can use the best format for my current task.

**Acceptance Criteria:**
- A toggle switch (e.g., "UI" / "XML") is added to the results view.
- The default view is the user-friendly card layout.
- Toggling to "XML" displays the raw XML output from the backend in a `<pre>` block.
- The user's preference is remembered for the duration of the session.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: Add a state variable and a UI toggle switch.
    -   **Implementation**:
        ```svelte
        <script>
            let viewMode = 'UI'; // 'UI' or 'XML'
        </script>

        <div class="toggle-switch">
            <button on:click={() => viewMode = 'UI'} class:active={viewMode === 'UI'}>UI</button>
            <button on:click={() => viewMode = 'XML'} class:active={viewMode === 'XML'}>XML</button>
        </div>
        ```
    -   **Imports**: None.
2.  **Filepath**: `webview/src/routes/+page.svelte`
    -   **Action**: Conditionally render either the list of `ResultCard` components or the raw XML based on the `viewMode` state.
    -   **Implementation**:
        ```svelte
        {#if viewMode === 'UI'}
            {#each results as result (result.id)}
                <ResultCard {result} />
            {/each}
        {:else}
            <pre>{rawXmlOutput}</pre>
        {/if}
        ```
    -   **Imports**: None.

**Testing Plan:**
-   **Test Case 1**: Run a search and verify results appear as interactive cards.
-   **Test Case 2**: Click a file path on a card and verify the correct file opens at the correct line.
-   **Test Case 3**: Click "Copy Snippet" and verify the code is in the clipboard.
-   **Test Case 4**: Click the "XML" toggle and verify the view changes to show the raw XML.
-   **Test Case 5**: Toggle back to "UI" and verify the card view is restored.
