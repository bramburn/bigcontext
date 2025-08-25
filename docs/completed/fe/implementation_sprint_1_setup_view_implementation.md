# Implementation Guidance: Sprint 1 - Setup View Implementation

**Objective:** To provide the technical guidance, code examples, and API information needed to build the onboarding and setup UI using SvelteKit, Fluent UI, and the VS Code Webview API.

---

### 1. Scaffolding the SvelteKit Project in `webview/`

Since the `webview` directory is empty, you will need to create a new SvelteKit project there. This will serve as the foundation for the entire UI.

**Command:**
```bash
# Navigate to the project root
cd /Users/bramburn/dev/bigcontext

# Create a new SvelteKit project inside the webview directory
npm create svelte@latest webview

# Follow the prompts:
# ? Which Svelte app template? › SvelteKit demo app
# ? Add type checking with TypeScript? › Yes, using TypeScript syntax
# ? Select additional options › ESLint, Prettier
```

After creation, `cd webview` and run `npm install`.

### 2. Configuring SvelteKit for VS Code Webviews

For a webview, the SvelteKit app must be exported as a static, single-page application (SPA).

**1. Install Static Adapter:**
```bash
cd /Users/bramburn/dev/bigcontext/webview
npm install -D @sveltejs/adapter-static@next
```

**2. Configure `svelte.config.js`:**
Modify `webview/svelte.config.js` to use the static adapter. This ensures all UI assets are bundled into a `build` directory with predictable paths.

```javascript
// webview/svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: 'index.html', // Important for SPA behavior
            precompress: false
        }),
        // This is crucial for resolving asset paths correctly inside the webview
        paths: {
            base: '{{vscode-resource-base}}' // A placeholder we will replace
        },
        appDir: 'app'
    }
};

export default config;
```

### 3. Integrating Fluent UI

We will use `svelte-fui`, a community-maintained library for Fluent UI components in Svelte.

**1. Install Dependencies:**
```bash
cd /Users/bramburn/dev/bigcontext/webview
npm install @svelte-fui/core @svelte-fui/tailwindcss
```

**2. Configure TailwindCSS:**
Create `webview/tailwind.config.js` and add the `svelte-fui` preset.
```javascript
// webview/tailwind.config.js
/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  presets: [require('@svelte-fui/tailwindcss').preset()],
  theme: {
    extend: {}
  },
  plugins: []
};

module.exports = config;
```
You will also need to set up Tailwind by creating `postcss.config.js` and `src/app.css` as per the SvelteKit Tailwind integration docs.

### 4. Webview Panel Creation and Communication (`src/extension.ts`)

This is the core logic for loading and interacting with the Svelte UI from the extension host.

**1. Loading the UI:**
The `createWebviewPanel` function loads the `index.html` from the SvelteKit `build` directory. We must replace the asset paths with special `vscode-resource` URIs.

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

function createWebviewPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'setupView',
        'Code Context Setup',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview', 'build')]
        }
    );

    const buildPath = vscode.Uri.joinPath(context.extensionUri, 'webview', 'build').fsPath;
    let html = fs.readFileSync(path.join(buildPath, 'index.html'), 'utf8');

    // Create the base URI for webview resources
    const baseUri = panel.webview.asWebviewUri(vscode.Uri.file(buildPath)).toString();
    // Replace our placeholder with the correct base URI
    html = html.replace('{{vscode-resource-base}}', baseUri);

    panel.webview.html = html;
    return panel;
}
```

**2. Bidirectional Messaging:**
Communication relies on `panel.webview.postMessage` and `panel.webview.onDidReceiveMessage`.

*   **From Extension to Webview:**
    ```typescript
    // src/extension.ts
    // Example: Sending database status to the UI
    panel.webview.postMessage({ command: 'databaseStatus', status: 'Running' });
    ```

*   **From Webview to Extension:**
    First, get the VS Code API instance in your Svelte component.
    ```html
    <!-- webview/src/lib/components/DatabaseSetup.svelte -->
    <script lang="ts">
        const vscode = acquireVsCodeApi();

        function startDatabase() {
            vscode.postMessage({
                command: 'startDatabase',
                payload: { type: 'qdrant' }
            });
        }
    </script>
    <Button on:click={startDatabase}>Start Local Qdrant</Button>
    ```
    Then, handle the message in `extension.ts`.
    ```typescript
    // src/extension.ts
    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'startDatabase':
                const terminal = vscode.window.createTerminal(`Qdrant DB`);
                terminal.sendText('docker-compose up');
                terminal.show();
                // Here you would add logic to health-check the DB
                // and post a message back to the webview on success.
                return;
        }
    });
    ```

### 5. Running Commands in a Terminal

The `vscode.window.createTerminal` API is used to create and manage terminal instances from the extension.

**API Reference:** `vscode.window.createTerminal`
*   **`name`**: A string that is shown in the terminal's dropdown.
*   **`shellPath`**: (Optional) Path to a custom shell executable.
*   **`shellArgs`**: (Optional) Arguments for the shell.

**Example:**
```typescript
// src/extension.ts
// This creates a new terminal named "My Command" and runs "echo Hello"
const terminal = vscode.window.createTerminal("My Command");
terminal.sendText("echo Hello");
terminal.show(); // Makes the terminal visible to the user
```
For the PRD requirement, you will use `terminal.sendText('docker-compose up');`. You should also advise the user that this requires `docker-compose.yml` to be present in the workspace root and Docker to be running.
