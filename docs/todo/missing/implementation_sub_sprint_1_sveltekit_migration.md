# Implementation Guide: Sprint 1 - SvelteKit Migration

**Goal:** To migrate the existing webview from plain TypeScript to a modern SvelteKit application.

This guide provides the technical steps to replace the current `webview/` directory with a new SvelteKit project, configure it for static output, and integrate it back into the VS Code extension.

---

### **Part 1: SvelteKit Project Scaffolding**

#### **1.1: Clean and Re-initialize `webview/` Directory**

First, ensure you have a backup of the existing `webview/` directory if needed, then clear it.

Next, scaffold a new SvelteKit project. You will be prompted to select a template; choose "Skeleton project" and add TypeScript support.

```bash
# Navigate to the project root
# Make a backup if you need one
# mv webview webview_backup

# Remove the old directory
rm -rf webview

# Create the new SvelteKit project
npm create svelte@latest webview
```

#### **1.2: Install and Configure Static Adapter**

The `@sveltejs/adapter-static` allows us to build the SvelteKit app into a collection of static HTML, CSS, and JavaScript files, which is ideal for a VS Code Webview.

1.  **Install the adapter:**
    ```bash
    cd webview
    npm install -D @sveltejs/adapter-static
    cd ..
    ```

2.  **Configure `svelte.config.js`:**
    Modify `webview/svelte.config.js` to use the static adapter. We will configure it to output a Single-Page Application (SPA) by specifying a fallback page. This is crucial for the webview's routing to work correctly.

    ```javascript
    // webview/svelte.config.js
    import adapter from '@sveltejs/adapter-static';
    import { vitePreprocess } from '@sveltejs/kit/vite';

    /** @type {import('@sveltejs/kit').Config} */
    const config = {
        preprocess: vitePreprocess(),

        kit: {
            adapter: adapter({
                // Default options are fine
                pages: 'build',
                assets: 'build',
                // This is the key for SPA mode
                fallback: 'index.html', 
                precompress: false,
                strict: true
            }),
            // Ensure client-side routing for the SPA
            prerender: {
                handleHttpError: 'ignore'
            }
        }
    };

    export default config;
    ```

After this step, running `npm run build` inside the `webview/` directory will generate a `build/` folder with the static assets.

---

### **Part 2: Recreating UI and State Management**

#### **2.1: Recreate Svelte Components**

Re-implement the functionality from the old `DatabaseSetup.ts` and `EmbeddingSetup.ts` files into new `.svelte` components.

*   **File:** `webview/src/lib/components/DatabaseSetup.svelte`
*   **File:** `webview/src/lib/components/EmbeddingSetup.svelte`

The goal is to replicate the existing UI and logic using Svelte's component-based structure. You can use standard HTML or a component library like Fluent UI for Svelte.

#### **2.2: Update State Management (`setupStore.ts`)**

Ensure the existing `webview/src/lib/stores/setupStore.ts` is adapted to work with the new Svelte components. The store should hold the state for the setup process, and the components should subscribe to it to react to changes.

#### **2.3: Create the Main Page (`+page.svelte`)**

The main entry point for the UI will be `webview/src/routes/+page.svelte`. This page will import the components and use the `setupStore` to conditionally render the correct setup view.

```html
<!-- webview/src/routes/+page.svelte -->
<script lang="ts">
    import DatabaseSetup from '$lib/components/DatabaseSetup.svelte';
    import EmbeddingSetup from '$lib/components/EmbeddingSetup.svelte';
    import { setupStore } from '$lib/stores/setupStore';

    // Example logic to switch between views
    let currentStep;
    setupStore.subscribe(store => {
        currentStep = store.step;
    });
</script>

<main>
    {#if currentStep === 'database'}
        <DatabaseSetup />
    {:else if currentStep === 'embedding'}
        <EmbeddingSetup />
    {/if}
</main>

<style>
    main {
        padding: 1rem;
    }
</style>
```

---

### **Part 3: Integrating with VS Code Webview**

#### **3.1: Update `WebviewManager.ts`**

The final step is to make the extension load the new SvelteKit build. The `getWebviewContent` method in `src/webviewManager.ts` needs to be updated.

The core tasks are:
1.  Read the `index.html` from the `webview/build` directory.
2.  Use `panel.webview.asWebviewUri` to generate correct, security-compliant URIs for all CSS and JS assets referenced in the HTML.
3.  Inject a Content Security Policy (CSP) meta tag to allow the webview to load the scripts and styles.

```typescript
// src/webviewManager.ts (Example Snippet)
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// ... inside the WebviewManager class ...

private getWebviewContent(panel: vscode.WebviewPanel): string {
    const buildPath = path.join(this.context.extensionPath, 'webview', 'build');
    const indexPath = path.join(buildPath, 'index.html');

    let html = fs.readFileSync(indexPath, 'utf8');
    const nonce = this.getNonce();

    // 1. Replace all relative paths with webview-safe URIs
    html = html.replace(/(href|src)="\/([^"]*)"/g, (match, p1, p2) => {
        const resourcePath = path.join(buildPath, p2);
        const resourceUri = vscode.Uri.file(resourcePath);
        const webviewUri = panel.webview.asWebviewUri(resourceUri);
        return `${p1}="${webviewUri}"`;
    });

    // 2. Add nonce to all script tags for CSP
    html = html.replace(/<script/g, `<script nonce="${nonce}"`);

    // 3. Inject the Content Security Policy
    const csp = `
        <meta http-equiv="Content-Security-Policy" content="
            default-src 'none';
            style-src ${panel.webview.cspSource};
            script-src 'nonce-${nonce}';
            img-src ${panel.webview.cspSource} https:;
        ">
    `;
    html = html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />${csp}`);

    return html;
}

private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
```

This completes the migration. The extension will now serve a modern, maintainable SvelteKit application as its webview UI.
