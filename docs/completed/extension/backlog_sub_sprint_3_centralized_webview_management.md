### User Story 1: Create WebviewManager
**As a** developer, **I want to** create a `WebviewManager` to handle the lifecycle of all webview panels, **so that** UI creation logic is centralized and reusable.

**Actions to Undertake:**
1.  **Filepath**: `src/webviewManager.ts` (New File)
    -   **Action**: Create the new file and the `WebviewManager` class structure with a constructor that accepts `vscode.ExtensionContext` and a `dispose` method.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import * as path from 'path';

        export class WebviewManager implements vscode.Disposable {
            private mainPanel: vscode.WebviewPanel | undefined;
            private settingsPanel: vscode.WebviewPanel | undefined;

            constructor(private context: vscode.ExtensionContext) {}

            private getWebviewContent(webview: vscode.Webview, panelName: string): string {
                const htmlPath = path.join(this.context.extensionPath, 'webview', 'dist', 'index.html');
                let htmlContent = fs.readFileSync(htmlPath, 'utf8');

                // Replace placeholders for webview assets
                const scriptUri = webview.asWebviewUri(vscode.Uri.file(
                    path.join(this.context.extensionPath, 'webview', 'dist', 'index.js')
                ));
                const styleUri = webview.asWebviewUri(vscode.Uri.file(
                    path.join(this.context.extensionPath, 'webview', 'dist', 'styles.css')
                ));

                htmlContent = htmlContent.replace('{{scriptUri}}', scriptUri.toString());
                htmlContent = htmlContent.replace('{{styleUri}}', styleUri.toString());

                // You might want to pass initial data to the webview here
                // For example, a global variable or a message
                htmlContent = htmlContent.replace('{{panelName}}', panelName);

                return htmlContent;
            }

            public showMainPanel(): void {
                if (this.mainPanel) {
                    this.mainPanel.reveal(vscode.ViewColumn.One);
                    return;
                }

                this.mainPanel = vscode.window.createWebviewPanel(
                    'codeContextEngineMain',
                    'Code Context Engine',
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))]
                    }
                );

                this.mainPanel.webview.html = this.getWebviewContent(this.mainPanel.webview, 'main');

                this.mainPanel.onDidDispose(() => {
                    this.mainPanel = undefined;
                }, null, this.context.subscriptions);
            }

            public showSettingsPanel(): void {
                if (this.settingsPanel) {
                    this.settingsPanel.reveal(vscode.ViewColumn.Two);
                    return;
                }

                this.settingsPanel = vscode.window.createWebviewPanel(
                    'codeContextEngineSettings',
                    'Code Context Settings',
                    vscode.ViewColumn.Two,
                    {
                        enableScripts: true,
                        localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))]
                    }
                );

                this.settingsPanel.webview.html = this.getWebviewContent(this.settingsPanel.webview, 'settings');

                this.settingsPanel.onDidDispose(() => {
                    this.settingsPanel = undefined;
                }, null, this.context.subscriptions);
            }

            public dispose(): void {
                this.mainPanel?.dispose();
                this.settingsPanel?.dispose();
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode'; import * as path from 'path'; import * as fs from 'fs';`
2.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Instantiate the `WebviewManager` in the `ExtensionManager`'s constructor and make it accessible.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        // ... other imports ...
        import { WebviewManager } from './webviewManager';

        export class ExtensionManager implements vscode.Disposable {
            // ... existing private members ...
            public webviewManager: WebviewManager;

            constructor(private context: vscode.ExtensionContext) {
                // ... existing instantiations ...

                // Instantiate WebviewManager
                this.webviewManager = new WebviewManager(this.context);

                // Instantiate CommandManager (pass services it needs, including webviewManager)
                this.commandManager = new CommandManager(this.indexingService, this.webviewManager);
            }

            // ... rest of the class ...
        }
        ```
    -   **Imports**: `import { WebviewManager } from './webviewManager';`
3.  **Filepath**: `src/commandManager.ts`
    -   **Action**: Update the `CommandManager` to accept `WebviewManager` and change the `openMainPanel` and `openSettings` command callbacks to call the appropriate methods on the `WebviewManager` instance.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { IndexingService } from './indexing/indexingService';
        import { WebviewManager } from './webviewManager';

        export class CommandManager {
            constructor(private indexingService: IndexingService, private webviewManager: WebviewManager) {}

            public registerCommands(): vscode.Disposable[] {
                const disposables: vscode.Disposable[] = [];

                disposables.push(
                    vscode.commands.registerCommand('code-context-engine.openMainPanel', () => {
                        this.webviewManager.showMainPanel();
                    }),
                    vscode.commands.registerCommand('code-context-engine.startIndexing', () => {
                        this.indexingService.startIndexing();
                        vscode.window.showInformationMessage('Indexing started!');
                    }),
                    vscode.commands.registerCommand('code-context-engine.openSettings', () => {
                        this.webviewManager.showSettingsPanel();
                    })
                );

                return disposables;
            }
        }
        ```
    -   **Imports**: `import { WebviewManager } from './webviewManager';`

**Acceptance Criteria:**
- All `vscode.window.createWebviewPanel` calls are located exclusively within `WebviewManager.ts`.
- The `openMainPanel` and `openSettings` commands correctly open their respective UIs.
- Attempting to open a panel that is already open simply brings the existing panel into focus.

**Testing Plan:**
- **Test Case 1**: Run the extension. Execute the command `code-context-engine.openMainPanel` from the Command Palette. Verify that the main webview panel opens.
- **Test Case 2**: Execute `code-context-engine.openMainPanel` again. Verify that a new panel is NOT opened, but the existing main panel is brought into focus.
- **Test Case 3**: Run the extension. Execute the command `code-context-engine.openSettings` from the Command Palette. Verify that the settings webview panel opens.
- **Test Case 4**: Execute `code-context-engine.openSettings` again. Verify that a new panel is NOT opened, but the existing settings panel is brought into focus.
- **Test Case 5**: Close both webview panels. Execute the commands again to ensure they can be reopened correctly.
- **Test Case 6**: Verify that the webview content (HTML, JS, CSS) loads correctly within the panels. (This might require inspecting the webview developer tools).
