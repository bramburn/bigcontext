### User Story 1: SvelteKit Webview Integration

**As a** developer, **I want to** integrate a SvelteKit application into a VS Code webview, **so that** I can build a rich and interactive user interface for the extension.

**Actions to Undertake:**
1.  **Filepath**: `webview/`
    -   **Action**: Initialize a new SvelteKit project within the `webview` directory.
    -   **Implementation**: `cd webview && npm create svelte@latest .` (select "Skeleton project", "TypeScript", "ESLint", "Prettier", "Vitest")
    -   **Imports**: None.
2.  **Filepath**: `src/extension.ts`
    -   **Action**: Create the logic in `extension.ts` to render the SvelteKit app inside a VS Code webview panel.
    -   **Implementation**: (Add `createWebviewPanel` and `resolveWebviewView` logic, loading `index.html` from SvelteKit's build output)
        ```typescript
        import * as vscode from 'vscode';
        import * as path from 'path';

        export function activate(context: vscode.ExtensionContext) {
            // ... existing code ...

            let panel: vscode.WebviewPanel | undefined = undefined;

            context.subscriptions.push(
                vscode.commands.registerCommand('code-context-engine.openPanel', () => {
                    if (panel) {
                        panel.reveal(vscode.ViewColumn.One);
                    } else {
                        panel = vscode.window.createWebviewPanel(
                            'codeContextEngine',
                            'Code Context Engine',
                            vscode.ViewColumn.One,
                            {
                                enableScripts: true,
                                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))]
                            }
                        );

                        const svelteAppPath = vscode.Uri.file(
                            path.join(context.extensionPath, 'webview', 'dist', 'index.html')
                        );
                        panel.webview.html = fs.readFileSync(svelteAppPath.fsPath, 'utf8');

                        panel.onDidDispose(
                            () => {
                                panel = undefined;
                            },
                            null,
                            context.subscriptions
                        );
                    }
                })
            );
        }

        // ... deactivate function ...
        ```
    -   **Imports**: `import * as path from 'path';`, `import * as fs from 'fs';` (need to import `fs` for `readFileSync`)

### User Story 2: Fluent UI Integration

**As a** developer, **I want to** integrate Microsoft's Fluent UI library into the SvelteKit project, **so that** I can build a consistent and professional-looking UI quickly.

**Actions to Undertake:**
1.  **Filepath**: `webview/package.json`
    -   **Action**: Add the Fluent UI Svelte library as a dependency to the SvelteKit project.
    -   **Implementation**: `cd webview && npm install @fluentui/web-components @fluentui/web-components-react @fluentui/react-components` (Note: The PRD mentions `svelte-fluent-ui`, but the official Fluent UI for web components is `@fluentui/web-components`. I will use the official one. If `svelte-fluent-ui` is a specific Svelte wrapper, it should be installed instead. I will assume the user meant the official Fluent UI components.)
    -   **Imports**: None.
2.  **Filepath**: `webview/src/routes/index.svelte` (or a new component like `MainPanel.svelte`)
    -   **Action**: Create a Svelte component for the main panel that includes an "Index Now" button and a placeholder for a progress bar from the Fluent UI library.
    -   **Implementation**: (Example using Fluent UI Web Components)
        ```html
        <script lang="ts">
          import { provideFluentDesignSystem, fluentButton, fluentProgressRing } from "@fluentui/web-components";

          provideFluentDesignSystem().register(
            fluentButton(),
            fluentProgressRing()
          );

          function handleIndexNow() {
            console.log("Index Now clicked!");
            // Logic to trigger indexing
          }
        </script>

        <main>
          <h1>Code Context Engine</h1>
          <fluent-button appearance="accent" @click="{handleIndexNow}">Index Now</fluent-button>
          <fluent-progress-ring style="margin-top: 20px;"></fluent-progress-ring>
        </main>

        <style>
          /* Basic styling */
          main {
            padding: 20px;
            font-family: sans-serif;
          }
        </style>
        ```
    -   **Imports**: `import { provideFluentDesignSystem, fluentButton, fluentProgressRing } from "@fluentui/web-components";`
3.  **Filepath**: `webview/src/app.html` (or global CSS)
    -   **Action**: Ensure the UI components automatically adapt to VS Code's light and dark themes.
    -   **Implementation**: (Utilize VS Code CSS variables for theming)
        ```html
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <link rel="icon" href="/favicon.ico" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            %sveltekit.head%
            <style>
              /* Apply VS Code theme colors */
              body {
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
              }
              /* Example for Fluent UI components */
              fluent-button {
                --accent-fill-rest: var(--vscode-button-background);
                --accent-fill-hover: var(--vscode-button-hoverBackground);
                --accent-fill-active: var(--vscode-button-background);
                --accent-foreground-rest: var(--vscode-button-foreground);
              }
              fluent-progress-ring {
                --accent-fill-rest: var(--vscode-progressBar-background);
              }
            </style>
          </head>
          <body data-sveltekit-preload-data="hover">
            <div style="display: contents">%sveltekit.body%</div>
          </body>
        </html>
        ```
    -   **Imports**: None.

**Acceptance Criteria:**
-   The SvelteKit application renders correctly inside the VS Code extension panel when the command to open it is executed.
-   The "Index Now" button is visible and interactive (e.g., logs a message to the console when clicked).
-   UI components (button, progress bar) correctly reflect the active VS Code theme (light/dark) without manual intervention.

**Testing Plan:**
-   **Test Case 1**: Run the extension in a development host. Execute the command to open the webview panel. Verify the SvelteKit app loads and displays the "Index Now" button and progress bar.
-   **Test Case 2**: Click the "Index Now" button and check the VS Code developer console for the logged message.
-   **Test Case 3**: Change the VS Code theme (e.g., from Light to Dark) and observe if the Fluent UI components' styling (background, text color) adapts accordingly.
