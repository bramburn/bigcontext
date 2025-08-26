# Implementation Guidance: Sprint 2 - Interactive Search Results

**Objective:** To enhance the user experience by creating interactive search result cards with syntax highlighting and providing a toggle for a raw XML view.

---

### **Part 1: Interactive Result Cards with Syntax Highlighting**

**High-Level Plan:**
1.  Create a reusable Svelte component, `ResultCard.svelte`, to represent a single search result.
2.  This component will receive a `result` object as a prop.
3.  Integrate a lightweight syntax highlighting library to colorize the code snippet within the card.
4.  Implement click handlers on the component to open the file in the VS Code editor and to copy the snippet to the clipboard.

**Recommended Library for Syntax Highlighting:**
*   **`highlight.js`**: A very popular, versatile, and easy-to-use syntax highlighter. It supports a vast number of languages and has good performance.
*   **Installation (in `webview` directory):**
    ```bash
    npm install highlight.js
    ```
*   **Usage in Svelte:**
    -   Import the library and a CSS theme.
    -   Use a reactive block (`$:`) to re-run the highlighting function whenever the `result` prop changes.
    -   Use the `{@html ...}` tag to render the resulting HTML for the highlighted code. This is necessary because `highlight.js` returns an HTML string.

**Code Example (`ResultCard.svelte`):**
```svelte
<script>
    import hljs from 'highlight.js';
    // Choose a theme. `github-dark` is a good choice for VS Code.
    import 'highlight.js/styles/github-dark.css';
    import { vscode } from '../lib/vscode'; // Assuming a vscode api wrapper

    export let result; // { id, filePath, lineNumber, snippet, language }

    // Reactive block for syntax highlighting
    let highlightedCode = '';
    $: if (result && result.snippet) {
        try {
            highlightedCode = hljs.highlight(result.snippet, {
                language: result.language || 'plaintext',
                ignoreIllegals: true
            }).value;
        } catch (e) {
            console.error('Highlighting failed:', e);
            highlightedCode = result.snippet; // Fallback to plain text
        }
    }

    function openFile() {
        vscode.postMessage({
            command: 'openFile',
            path: result.filePath,
            line: result.lineNumber
        });
    }

    function copySnippet() {
        navigator.clipboard.writeText(result.snippet);
    }
</script>

<div class="result-card">
    <div class="card-header">
        <span class="file-path" on:click={openFile} title="Click to open file">
            {result.filePath}:{result.lineNumber}
        </span>
        <button on:click={copySnippet}>Copy</button>
    </div>
    <pre class="code-snippet"><code class="hljs {@html highlightedCode}"></code></pre>
</div>

<style>
    /* Add styles for the card, header, etc. */
</style>
```

**Backend Handler for `openFile`:**
In `messageRouter.ts`, you will need a case to handle the `openFile` message.

```typescript
// in messageRouter.ts
case 'openFile':
    const { path, line } = message;
    const uri = vscode.Uri.file(path);
    const options: vscode.TextDocumentShowOptions = {
        selection: new vscode.Range(line - 1, 0, line - 1, 0),
        preview: true, // Opens in a temporary tab
    };
    vscode.window.showTextDocument(uri, options);
    break;
```

---

### **Part 2: Raw XML View Toggle**

**High-Level Plan:**
1.  Introduce a local state variable in your main results view component (e.g., `+page.svelte`) to track the current view mode (`'UI'` or `'XML'`).
2.  Add a simple button group or toggle switch to the UI that updates this state variable.
3.  Use a Svelte `{#if...}{:else}...{/if}` block to conditionally render the content.
    -   If the mode is `'UI'`, render the loop of `<ResultCard>` components.
    -   If the mode is `'XML'`, render the raw XML string inside a `<pre>` tag for proper formatting.
4.  Ensure the raw XML data is passed from the backend along with the parsed results, or is stored before parsing.

**Code Example (`+page.svelte`):**
```svelte
<script>
    import ResultCard from '$lib/components/ResultCard.svelte';
    
    let viewMode = 'UI'; // or 'XML'
    let searchResults = []; // Parsed results for card view
    let rawXml = ''; // Raw XML string from backend

    // This would be populated by a message from the backend
    function handleNewResults(data) {
        searchResults = data.parsedResults;
        rawXml = data.rawXml;
        viewMode = 'UI'; // Default to UI view on new results
    }
</script>

<div class="view-toggle">
    <button class:active={viewMode === 'UI'} on:click={() => viewMode = 'UI'}>UI View</button>
    <button class:active={viewMode === 'XML'} on:click={() => viewMode = 'XML'}>XML View</button>
</div>

<div class="results-container">
    {#if viewMode === 'UI'}
        {#each searchResults as result (result.id)}
            <ResultCard {result} />
        {/each}
    {:else}
        <pre class="raw-xml-view">{rawXml}</pre>
    {/if}
</div>

<style>
    .view-toggle button.active {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
    }
    .raw-xml-view {
        white-space: pre-wrap;
        word-break: break-all;
    }
</style>
```
