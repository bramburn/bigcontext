### User Story 1: Open Settings UI from Command Palette

**As a** user, **I want to** open the extension's settings UI from the VS Code Command Palette, **so that** I can easily access and configure the extension.

**Actions to Undertake:**
1.  **Filepath**: `package.json`
    -   **Action**: Define a new command in `package.json` to open the settings webview.
    -   **Implementation**: (Add to `contributes.commands` section)
        ```json
        {
            "command": "code-context-engine.openSettings",
            "title": "Code Context Engine: Open Settings"
        }
        ```
    -   **Imports**: None.
2.  **Filepath**: `src/extension.ts`
    -   **Action**: Register the new command in `extension.ts` to create and show the settings webview panel.
    -   **Implementation**: (Add to `activate` function)
        ```typescript
        import * as vscode from 'vscode';
        import * as path from 'path';
        import * as fs from 'fs';

        // ... existing activate function content ...

        let settingsPanel: vscode.WebviewPanel | undefined = undefined;

        context.subscriptions.push(
            vscode.commands.registerCommand('code-context-engine.openSettings', () => {
                const columnToShowIn = vscode.window.activeTextEditor
                    ? vscode.window.activeTextEditor.viewColumn
                    : undefined;

                if (settingsPanel) {
                    settingsPanel.reveal(columnToShowIn);
                } else {
                    settingsPanel = vscode.window.createWebviewPanel(
                        'codeContextEngineSettings',
                        'Code Context Engine Settings',
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

                    let htmlContent = fs.readFileSync(svelteAppPath.fsPath, 'utf8');
                    htmlContent = htmlContent.replace(/\/\_app\//g, settingsPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist', '_app'))).toString() + '/');

                    settingsPanel.webview.html = htmlContent;

                    settingsPanel.onDidDispose(
                        () => {
                            settingsPanel = undefined;
                        },
                        null,
                        context.subscriptions
                    );
                }
            })
        );
        ```
    -   **Imports**: `import * as vscode from 'vscode';`, `import * as path from 'path';`, `import * as fs from 'fs';`

### User Story 2: Display and Edit Settings in UI

**As a** user, **I want to** see and edit the extension's configuration settings (e.g., embedding provider, database connection string) in a dedicated UI, **so that** I can customize its behavior.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/routes/settings.svelte` (New File)
    -   **Action**: Create a new Svelte component for the settings UI, using Fluent UI components for input fields (e.g., `<fluent-select>`, `<fluent-text-field>`).
    -   **Implementation**: 
        ```html
        <script lang="ts">
          import { provideFluentDesignSystem, fluentSelect, fluentOption, fluentTextField, fluentButton } from "@fluentui/web-components";
          import { onMount } from 'svelte';
          import { postMessage, onMessage } from '../lib/vscodeApi';

          provideFluentDesignSystem().register(
            fluentSelect(),
            fluentOption(),
            fluentTextField(),
            fluentButton()
          );

          let embeddingProvider: string = 'Ollama'; // Default value
          let databaseConnectionString: string = '';

          onMount(() => {
            // Request current settings from extension backend on component mount
            postMessage({ command: 'getSettings' });

            onMessage(message => {
              if (message.command === 'settingsResult') {
                embeddingProvider = message.settings.embeddingProvider || 'Ollama';
                databaseConnectionString = message.settings.databaseConnectionString || '';
              }
            });
          });

          function saveSettings() {
            const settings = {
              embeddingProvider,
              databaseConnectionString,
            };
            postMessage({ command: 'saveSettings', settings });
          }
        </script>

        <main>
          <h1>Extension Settings</h1>

          <fluent-text-field
            appearance="outline"
            placeholder="Database Connection String"
            bind:value={databaseConnectionString}
            style="width: 100%; margin-bottom: 15px;"
          >
            Database Connection String
          </fluent-text-field>

          <fluent-select
            appearance="outline"
            bind:value={embeddingProvider}
            style="width: 100%; margin-bottom: 20px;"
          >
            <fluent-option value="Ollama">Ollama</fluent-option>
            <fluent-option value="OpenAI">OpenAI</fluent-option>
            <!-- Add more options as needed -->
          </fluent-select>

          <fluent-button appearance="accent" @click={saveSettings}>Save Settings</fluent-button>
        </main>

        <style>
          main {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-editor-foreground);
          }
          /* Basic styling for Fluent UI components to match VS Code theme */
          fluent-text-field,
          fluent-select {
            --neutral-fill-rest: var(--vscode-input-background);
            --neutral-foreground-rest: var(--vscode-input-foreground);
            --neutral-stroke-rest: var(--vscode-input-border);
            --neutral-fill-stealth-rest: var(--vscode-input-background);
            --neutral-fill-stealth-hover: var(--vscode-input-background);
            --neutral-fill-stealth-active: var(--vscode-input-background);
            --neutral-foreground-hover: var(--vscode-input-foreground);
            --neutral-foreground-active: var(--vscode-input-foreground);
            --neutral-stroke-hover: var(--vscode-input-border);
            --neutral-stroke-active: var(--vscode-input-border);
          }
          fluent-button {
            --accent-fill-rest: var(--vscode-button-background);
            --accent-foreground-rest: var(--vscode-button-foreground);
            --accent-fill-hover: var(--vscode-button-hoverBackground);
          }
        </style>
        ```
    -   **Imports**: `import { provideFluentDesignSystem, fluentSelect, fluentOption, fluentTextField, fluentButton } from "@fluentui/web-components";`, `import { onMount } from 'svelte';`, `import { postMessage, onMessage } from '../lib/vscodeApi';`
2.  **Filepath**: `src/extension.ts`
    -   **Action**: Implement a message handler in `extension.ts` to retrieve current settings from VS Code configuration and send them to the webview.
    -   **Implementation**: (Inside `onDidReceiveMessage` handler)
        ```typescript
        // ... existing message handling ...

        case 'getSettings':
            const config = vscode.workspace.getConfiguration('code-context-engine');
            const currentSettings = {
                embeddingProvider: config.get('embeddingProvider'),
                databaseConnectionString: config.get('databaseConnectionString'),
            };
            settingsPanel?.webview.postMessage({ command: 'settingsResult', settings: currentSettings });
            return;
        ```
    -   **Imports**: None.

### User Story 3: Save Settings to VS Code Configuration

**As a** user, **I want to** save my changes to the extension's settings, **so that** my preferences are persisted across VS Code sessions.

**Actions to Undertake:**
1.  **Filepath**: `src/extension.ts`
    -   **Action**: Implement a message handler in `extension.ts` to receive updated settings from the webview and save them to VS Code workspace configuration.
    -   **Implementation**: (Inside `onDidReceiveMessage` handler)
        ```typescript
        // ... existing message handling ...

        case 'saveSettings':
            const newSettings = message.settings;
            const configToUpdate = vscode.workspace.getConfiguration('code-context-engine');
            await configToUpdate.update('embeddingProvider', newSettings.embeddingProvider, vscode.ConfigurationTarget.Global);
            await configToUpdate.update('databaseConnectionString', newSettings.databaseConnectionString, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('Settings saved!');
            return;
        ```
    -   **Imports**: None.
2.  **Filepath**: `package.json`
    -   **Action**: Define the configuration schema in `package.json` under `contributes.configuration`.
    -   **Implementation**: (Add to `contributes` section)
        ```json
        "configuration": {
            "title": "Code Context Engine Configuration",
            "properties": {
                "code-context-engine.embeddingProvider": {
                    "type": "string",
                    "default": "Ollama",
                    "description": "Select the embedding provider to use (e.g., Ollama, OpenAI)."
                },
                "code-context-engine.databaseConnectionString": {
                    "type": "string",
                    "default": "http://localhost:6333",
                    "description": "Connection string for the Qdrant database."
                }
            }
        }
        ```
    -   **Imports**: None.

### User Story 4: Services Read from Configuration

**As a** developer, **I want to** ensure the extension's backend services (e.g., `IndexingService`, `QdrantService`) read their configuration from the VS Code workspace settings, **so that** user changes are applied correctly.

**Actions to Undertake:**
1.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Update `IndexingService` to read the selected embedding provider from the VS Code configuration.
    -   **Implementation**: (Modify constructor or relevant method)
        ```typescript
        // In IndexingService constructor or a setup method
        const config = vscode.workspace.getConfiguration('code-context-engine');
        const providerName = config.get<string>('embeddingProvider', 'Ollama');
        if (providerName === 'OpenAI') {
            this.embeddingProvider = new OpenAIProvider();
        } else {
            this.embeddingProvider = new OllamaProvider();
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`, `import { OpenAIProvider } from '../embeddings/openaiProvider';`, `import { OllamaProvider } from '../embeddings/ollamaProvider';`
2.  **Filepath**: `src/db/qdrantService.ts`
    -   **Action**: Update `QdrantService` to read the database connection string from the VS Code configuration.
    -   **Implementation**: (Modify constructor or client initialization)
        ```typescript
        // In QdrantService constructor
        const config = vscode.workspace.getConfiguration('code-context-engine');
        const connectionString = config.get<string>('databaseConnectionString', 'http://localhost:6333');
        this.client = new QdrantClient({ url: connectionString });
        ```
    -   **Imports**: `import * as vscode from 'vscode';`

**Acceptance Criteria:**
-   A new command "Code Context Engine: Open Settings" appears in the Command Palette.
-   Executing the command opens a new webview panel titled "Code Context Engine Settings".
-   The settings UI displays the default values for embedding provider and database connection string.
-   Changing values in the settings UI and clicking "Save Settings" updates the `settings.json` file (either user or workspace settings).
-   After saving, if the extension is reloaded or the relevant services are re-initialized, they pick up the new configuration values.

**Testing Plan:**
-   **Test Case 1**: Open the Command Palette, search for and execute "Code Context Engine: Open Settings". Verify the panel opens.
-   **Test Case 2**: Change the "Embedding Provider" to "OpenAI" and the "Database Connection String" to a custom value. Click "Save Settings". Close and reopen VS Code. Verify the settings persist.
-   **Test Case 3**: Verify that `IndexingService` and `QdrantService` instances (after re-initialization or extension reload) use the newly saved configuration values.
-   **Test Case 4**: Test with invalid connection strings or provider names to ensure graceful fallback to defaults or error handling.
