### User Story 1: Centralized Webview Panel Management
**As Alisha, I want a** `WebviewManager` class to handle the creation and disposal of webview panels, **so that** UI logic is centralized and decoupled from `extension.ts`.

**Actions to Undertake:**
1.  **Filepath**: `src/webviewManager.ts` (New File)
    -   **Action**: Create a new file `webviewManager.ts` and define the `WebviewManager` class.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import * as path from 'path';

        export class WebviewManager {
            private static instance: WebviewManager;
            private panel: vscode.WebviewPanel | undefined;
            private readonly context: vscode.ExtensionContext;

            private constructor(context: vscode.ExtensionContext) {
                this.context = context;
            }

            public static getInstance(context: vscode.ExtensionContext): WebviewManager {
                if (!WebviewManager.instance) {
                    WebviewManager.instance = new WebviewManager(context);
                }
                return WebviewManager.instance;
            }

            public showMainPanel() {
                if (this.panel) {
                    this.panel.reveal(vscode.ViewColumn.One);
                    return;
                }

                this.panel = vscode.window.createWebviewPanel(
                    'codeContextEngine',
                    'Code Context Engine',
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))]
                    }
                );

                this.panel.webview.html = this.getWebviewContent();

                this.panel.onDidDispose(() => {
                    this.panel = undefined;
                }, null, this.context.subscriptions);
            }

            private getWebviewContent(): string {
                // This will be implemented in the next user story
                return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Code Context Engine</title>
                </head>
                <body>
                    <h1>Loading Webview...</h1>
                </body>
                </html>`;
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode'; import * as path from 'path';`
2.  **Filepath**: `src/extension.ts`
    -   **Action**: Instantiate `WebviewManager` and call `showMainPanel` from a command.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { WebviewManager } from './webviewManager'; // Add this import

        export function activate(context: vscode.ExtensionContext) {
            console.log('Congratulations, your extension "code-context-engine" is now active!');

            // Instantiate WebviewManager
            const webviewManager = WebviewManager.getInstance(context);

            let disposable = vscode.commands.registerCommand('code-context-engine.openMainPanel', () => {
                webviewManager.showMainPanel(); // Delegate to WebviewManager
            });

            context.subscriptions.push(disposable);
        }

        export function deactivate() {}
        ```
    -   **Imports**: `import { WebviewManager } from './webviewManager';`

**Acceptance Criteria:**
-   A new file `src/webviewManager.ts` exists containing the `WebviewManager` class.
-   The `WebviewManager` class has a `showMainPanel()` method.
-   Executing the `code-context-engine.openMainPanel` command opens a new VS Code webview panel.
-   If the panel is already open, executing the command reveals the existing panel instead of creating a new one.
-   Closing the webview panel correctly disposes of its instance within the `WebviewManager`.

**Testing Plan:**
-   **Test Case 1**: Run the extension, execute the "Code Context Engine: Open Main Panel" command. Verify a new webview panel appears.
-   **Test Case 2**: Execute the command again. Verify the existing panel is revealed and no new panel is created.
-   **Test Case 3**: Close the webview panel. Execute the command again. Verify a new panel is created.

### User Story 2: Load SvelteKit Build Output
**As Frank, I want the** `WebviewManager` to correctly load the SvelteKit build output, **so my** application renders properly inside VS Code.

**Actions to Undertake:**
1.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Implement `getWebviewContent` to read `index.html` and replace asset paths.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import * as path from 'path';
        import * as fs from 'fs'; // Add this import

        export class WebviewManager {
            // ... existing code ...

            private getWebviewContent(): string {
                const webviewPath = path.join(this.context.extensionPath, 'webview', 'dist', 'index.html');
                let htmlContent = fs.readFileSync(webviewPath, 'utf8');

                // Replace relative paths with webview-specific URIs
                htmlContent = htmlContent.replace(
                    /(<script src="|\ssrc="|<link href=")(?!https?:\/\/)([^"]*)"/g,
                    (match, p1, p2) => {
                        const resourcePath = path.join(this.context.extensionPath, 'webview', 'dist', p2);
                        const uri = this.panel!.webview.asWebviewUri(vscode.Uri.file(resourcePath));
                        return `${p1}${uri}"`;
                    }
                );

                return htmlContent;
            }
        }
        ```
    -   **Imports**: `import * as fs from 'fs';`

**Acceptance Criteria:**
-   The SvelteKit application's `index.html` is read and loaded into the webview.
-   All relative asset paths (e.g., `/_app/assets/`) within the `index.html` are correctly converted to `webview.asWebviewUri` format.
-   The SvelteKit application renders correctly within the VS Code webview panel, including its CSS and JavaScript.

**Testing Plan:**
-   **Test Case 1**: Run the extension and open the main panel. Verify the SvelteKit application loads and displays its UI elements (e.g., text, buttons, styling).
-   **Test Case 2**: Open the webview's developer tools (right-click on the webview and select "Inspect Element"). Verify that all loaded resources (JS, CSS) have `vscode-resource:` URIs.
-   **Test Case 3**: Check the console for any errors related to failed resource loading.

### User Story 3: Command Delegation to CommandManager
**As a** developer, **I want the** main panel command to be handled by the `CommandManager`, which delegates to the `WebviewManager`.

**Actions to Undertake:**
1.  **Filepath**: `src/commandManager.ts` (New File)
    -   **Action**: Create a new file `commandManager.ts` and define the `CommandManager` class.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { WebviewManager } from './webviewManager';

        export class CommandManager {
            private readonly context: vscode.ExtensionContext;
            private readonly webviewManager: WebviewManager;

            constructor(context: vscode.ExtensionContext, webviewManager: WebviewManager) {
                this.context = context;
                this.webviewManager = webviewManager;
            }

            public registerCommands() {
                this.context.subscriptions.push(
                    vscode.commands.registerCommand('code-context-engine.openMainPanel', () => {
                        this.webviewManager.showMainPanel();
                    })
                );
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode'; import { WebviewManager } from './webviewManager';`
2.  **Filepath**: `src/extension.ts`
    -   **Action**: Instantiate `CommandManager` and register commands. Remove direct command registration.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { WebviewManager } from './webviewManager';
        import { CommandManager } from './commandManager'; // Add this import

        export function activate(context: vscode.ExtensionContext) {
            console.log('Congratulations, your extension "code-context-engine" is now active!');

            const webviewManager = WebviewManager.getInstance(context);
            const commandManager = new CommandManager(context, webviewManager); // Instantiate CommandManager
            commandManager.registerCommands(); // Register commands

            // Remove the old disposable for 'code-context-engine.openMainPanel'
            // let disposable = vscode.commands.registerCommand('code-context-engine.openMainPanel', () => {
            //     webviewManager.showMainPanel();
            // });
            // context.subscriptions.push(disposable);
        }

        export function deactivate() {}
        ```
    -   **Imports**: `import { CommandManager } from './commandManager';`

**Acceptance Criteria:**
-   A new file `src/commandManager.ts` exists containing the `CommandManager` class.
-   The `CommandManager` registers the `code-context-engine.openMainPanel` command.
-   The `extension.ts` file no longer directly registers the `openMainPanel` command but delegates to `CommandManager`.
-   Executing the `code-context-engine.openMainPanel` command still successfully opens/reveals the webview panel.

**Testing Plan:**
-   **Test Case 1**: Run the extension, execute the "Code Context Engine: Open Main Panel" command. Verify the webview panel opens.
-   **Test Case 2**: Inspect `extension.ts` to confirm that the direct `vscode.commands.registerCommand` for `openMainPanel` has been removed.
-   **Test Case 3**: Verify that the `CommandManager` is instantiated and its `registerCommands` method is called in `extension.ts`.
