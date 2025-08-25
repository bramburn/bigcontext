### Implementation Guide: Sub-Sprint 2 - SvelteKit and Fluent UI Integration

**Objective:** To set up the SvelteKit frontend and integrate the Fluent UI component library, creating the initial user interface.

#### **Analysis**

This sub-sprint focuses on the frontend development of the VS Code extension. The core idea is to leverage SvelteKit for building a modern, reactive UI within a VS Code webview. Fluent UI is chosen for its consistency with Microsoft's design language, ensuring a native feel within VS Code. The integration requires careful handling of webview communication and theme adaptation.

#### **Prerequisites and Setup**

1.  **Sub-Sprint 1 Completion:** Ensure the basic VS Code extension boilerplate is set up as per Sub-Sprint 1's guide.
2.  **Node.js and npm/yarn:** Already installed from previous steps.

#### **Implementation Guide**

Here's a step-by-step guide to integrating SvelteKit and Fluent UI:

**1. Initialize SvelteKit Project within `webview` Directory**

Navigate into the `webview` directory you created in Sub-Sprint 1 and initialize a new SvelteKit project. Choose the "Skeleton project" and enable TypeScript, ESLint, Prettier, and Vitest for a robust development environment.

  *   **Command:**
    ```bash
    cd webview
    npm create svelte@latest .
    ```
  *   **Prompts to select:**
      *   `? Which Svelte project template?` -> `Skeleton project`
      *   `? Add TypeScript?` -> `Yes, using TypeScript syntax`
      *   `? Add ESLint for code linting?` -> `Yes`
      *   `? Add Prettier for code formatting?` -> `Yes`
      *   `? Add Playwright for browser testing?` -> `No` (or Yes, if desired for e2e)
      *   `? Add Vitest for unit testing?` -> `Yes`

  *   **Install dependencies:**
    ```bash
    npm install
    ```

**2. Configure Webview in `extension.ts` to Load SvelteKit App**

Your `extension.ts` needs to create a `WebviewPanel` and load the compiled SvelteKit application's `index.html` into it. SvelteKit builds to a `dist` folder by default.

  *   **File:** `src/extension.ts`
  *   **API Information:**
      *   `vscode.window.createWebviewPanel()`: Creates and shows a new webview panel.
      *   `panel.webview.html`: Sets the HTML content of the webview.
      *   `panel.webview.options.localResourceRoots`: Allows the webview to load local resources (like CSS/JS from your SvelteKit build).
      *   `vscode.Uri.file()` and `path.join()`: Used to construct absolute paths to your SvelteKit build assets.
      *   `fs.readFileSync()`: Node.js file system module to read the `index.html` file. You might need to add `import * as fs from 'fs';` at the top of `extension.ts`.

  *   **Implementation Example:**
    ```typescript
    import * as vscode from 'vscode';
    import * as path from 'path';
    import * as fs from 'fs'; // Add this import

    export function activate(context: vscode.ExtensionContext) {
        console.log('Congratulations, your extension "code-context-engine" is now active!');

        let currentPanel: vscode.WebviewPanel | undefined = undefined;

        context.subscriptions.push(
            vscode.commands.registerCommand('code-context-engine.openSveltePanel', () => {
                const columnToShowIn = vscode.window.activeTextEditor
                    ? vscode.window.activeTextEditor.viewColumn
                    : undefined;

                if (currentPanel) {
                    currentPanel.reveal(columnToShowIn);
                } else {
                    currentPanel = vscode.window.createWebviewPanel(
                        'codeContextEngine',
                        'Code Context Engine',
                        columnToShowIn || vscode.ViewColumn.One,
                        {
                            enableScripts: true,
                            localResourceRoots: [
                                vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))
                            ]
                        }
                    );

                    const svelteAppPath = vscode.Uri.file(
                        path.join(context.extensionPath, 'webview', 'dist', 'index.html')
                    );

                    // Read the SvelteKit index.html and set it as the webview content
                    let htmlContent = fs.readFileSync(svelteAppPath.fsPath, 'utf8');

                    // Important: Replace relative paths with webview-specific URIs
                    // This ensures that SvelteKit's JS/CSS assets are loaded correctly
                    htmlContent = htmlContent.replace(/\/\_app\//g, currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist', '_app'))).toString() + '/');

                    currentPanel.webview.html = htmlContent;

                    currentPanel.onDidDispose(
                        () => {
                            currentPanel = undefined;
                        },
                        null,
                        context.subscriptions
                    );
                }
            })
        );
    }

    export function deactivate() {}
    ```
    *   **Note on `htmlContent.replace`**: SvelteKit generates paths like `/_app/`. You need to convert these to `webview-uri`s so the webview can load them. The regex ` /\/_app\//g` targets these paths.

**3. Install Fluent UI Svelte Library**

While the PRD mentioned `svelte-fluent-ui`, the official Fluent UI components are often used as web components or React components. For Svelte, you can use the `@fluentui/web-components` directly or a community-maintained Svelte wrapper if available and preferred. For this guide, I will use the official web components as they are framework-agnostic.

  *   **Command (from `webview` directory):**
    ```bash
    cd webview
    npm install @fluentui/web-components
    ```

**4. Implement UI with Fluent UI Components**

Create your main Svelte component (e.g., `src/routes/+page.svelte` or a new component like `src/lib/MainPanel.svelte`) and use Fluent UI components.

  *   **File:** `webview/src/routes/+page.svelte` (or `webview/src/lib/MainPanel.svelte`)
  *   **API Information:**
      *   `provideFluentDesignSystem().register(...)`: Registers the Fluent UI web components for use.
      *   `<fluent-button>`: Fluent UI button component.
      *   `<fluent-progress-ring>`: Fluent UI progress indicator.

  *   **Implementation Example (`webview/src/routes/+page.svelte`):**
    ```html
    <script lang="ts">
      import { provideFluentDesignSystem, fluentButton, fluentProgressRing } from "@fluentui/web-components";

      // Register Fluent UI components
      provideFluentDesignSystem().register(
        fluentButton(),
        fluentProgressRing()
      );

      function handleIndexNow() {
        console.log("Index Now button clicked!");
        // In a real scenario, this would trigger the backend indexing process
      }
    </script>

    <main>
      <h1>Code Context Engine</h1>
      <p>Click the button to start indexing your repository.</p>
      <fluent-button appearance="accent" @click="{handleIndexNow}">Index Now</fluent-button>
      <div style="margin-top: 20px;">
        <p>Indexing Progress:</p>
        <fluent-progress-ring></fluent-progress-ring>
      </div>
    </main>

    <style>
      /* Basic styling for the page */
      main {
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        line-height: 1.5;
      }

      h1 {
        color: var(--vscode-editor-foreground);
      }

      p {
        color: var(--vscode-editor-foreground);
      }

      /* Ensure Fluent UI components inherit VS Code theme colors */
      fluent-button {
        --accent-fill-rest: var(--vscode-button-background);
        --accent-fill-hover: var(--vscode-button-hoverBackground);
        --accent-fill-active: var(--vscode-button-background);
        --accent-foreground-rest: var(--vscode-button-foreground);
        --neutral-fill-rest: var(--vscode-button-background);
        --neutral-fill-hover: var(--vscode-button-hoverBackground);
        --neutral-fill-active: var(--vscode-button-background);
        --neutral-foreground-rest: var(--vscode-button-foreground);
      }

      fluent-progress-ring {
        --accent-fill-rest: var(--vscode-progressBar-background);
      }
    </style>
    ```

**5. Theme Integration**

VS Code exposes its theme colors as CSS variables. You can use these variables in your SvelteKit application's global CSS or directly within components to ensure your UI adapts to the user's chosen theme.

  *   **File:** `webview/src/app.css` (or directly in your Svelte components' `<style>` tags)
  *   **API Information:** VS Code CSS Variables (e.g., `--vscode-editor-background`, `--vscode-editor-foreground`, `--vscode-button-background`).

  *   **Implementation Example (`webview/src/app.css`):**
    ```css
    /* Global styles for the webview */
    body {
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }

    /* Example of applying VS Code theme colors to Fluent UI components */
    fluent-button {
      --accent-fill-rest: var(--vscode-button-background);
      --accent-fill-hover: var(--vscode-button-hoverBackground);
      --accent-fill-active: var(--vscode-button-background);
      --accent-foreground-rest: var(--vscode-button-foreground);
    }

    fluent-progress-ring {
      --accent-fill-rest: var(--vscode-progressBar-background);
    }
    ```

**Build the SvelteKit App:**

Before running the extension, you need to build your SvelteKit application so that `extension.ts` can load the `index.html` and other assets from the `dist` folder.

  *   **Command (from `webview` directory):**
    ```bash
    cd webview
    npm run build
    ```

This completes the integration of SvelteKit and Fluent UI into your VS Code extension. You now have a visually consistent and interactive frontend ready to communicate with your extension's backend.