### Implementation Guide: Sub-Sprint 6 - Develop Settings UI

**Objective:** To create the user-facing settings panel where users can configure the extension's behavior.

#### **Analysis**

This sub-sprint focuses on providing a user-friendly interface for configuring the extension. It involves extending the `package.json` to declare new configuration properties and a command to open the settings UI. The settings UI itself will be a SvelteKit webview, leveraging Fluent UI components for a consistent look and feel. Crucially, the UI will interact with the VS Code configuration API to read and write settings, ensuring persistence and proper application of user preferences across the extension's backend services.

#### **Prerequisites and Setup**

1.  **Sub-Sprint 2 Completion:** A working SvelteKit webview integrated into the VS Code extension.
2.  **Sub-Sprint 5 Completion:** The backend services are in place, which will eventually consume these settings.
3.  **Fluent UI Web Components:** Ensure `@fluentui/web-components` is installed in your `webview` project.

#### **Implementation Guide**

Here's a step-by-step guide to developing the Settings UI:

**1. Register Settings Command in `package.json`**

First, define a new command that users can execute from the VS Code Command Palette to open your settings UI.

  *   **File:** `package.json`
  *   **Key Concept:** The `contributes.commands` section in `package.json` is used to declare commands that your extension provides.

  *   **Implementation Example (add to `contributes.commands` array):**
    ```json
    {
        "command": "code-context-engine.openSettings",
        "title": "Code Context Engine: Open Settings",
        "category": "Code Context Engine"
    }
    ```

**2. Create and Show Settings Webview in `extension.ts`**

Implement the logic in your main extension file (`extension.ts`) to handle the `openSettings` command. This will involve creating a new `WebviewPanel` specifically for your settings UI.

  *   **File:** `src/extension.ts`
  *   **API Information:**
      *   `vscode.commands.registerCommand()`: To link your declared command to a function.
      *   `vscode.window.createWebviewPanel()`: To create the webview instance.
      *   `panel.webview.html`: To load the SvelteKit app into the webview.
      *   `path.join()` and `vscode.Uri.file()`: For constructing correct paths to your SvelteKit build output.

  *   **Implementation Example (within `activate` function):**
    ```typescript
    import * as vscode from 'vscode';
    import * as path from 'path';
    import * as fs from 'fs';

    // ... (existing code for main panel, if any)

    let settingsPanel: vscode.WebviewPanel | undefined; // Declare a variable to hold the settings panel instance

    context.subscriptions.push(
        vscode.commands.registerCommand('code-context-engine.openSettings', () => {
            const columnToShowIn = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.viewColumn
                : undefined;

            if (settingsPanel) {
                settingsPanel.reveal(columnToShowIn); // If panel already exists, just reveal it
            } else {
                // Create a new webview panel
                settingsPanel = vscode.window.createWebviewPanel(
                    'codeContextEngineSettings', // Unique ID
                    'Code Context Engine Settings', // Title
                    columnToShowIn || vscode.ViewColumn.One, // Column to show in
                    {
                        enableScripts: true,
                        localResourceRoots: [
                            vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))
                        ]
                    }
                );

                // Get path to SvelteKit's built index.html
                const svelteAppPath = vscode.Uri.file(
                    path.join(context.extensionPath, 'webview', 'dist', 'index.html')
                );

                // Read and set the HTML content
                let htmlContent = fs.readFileSync(svelteAppPath.fsPath, 'utf8');
                // Important: Adjust paths for webview to load SvelteKit assets correctly
                htmlContent = htmlContent.replace(/\/\_app\//g, settingsPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist', '_app'))).toString() + '/');

                settingsPanel.webview.html = htmlContent;

                // Handle panel disposal (e.g., when user closes it)
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

**3. Build Svelte UI for Settings**

Create a new Svelte component (e.g., `webview/src/routes/settings/+page.svelte` or `webview/src/lib/Settings.svelte`) that will serve as your settings page. Use Fluent UI components for input fields.

  *   **File:** `webview/src/routes/settings/+page.svelte` (or similar)
  *   **API Information:**
      *   `@fluentui/web-components`: Provides `<fluent-select>`, `<fluent-option>`, `<fluent-text-field>`, `<fluent-button>`.
      *   `bind:value`: Svelte directive for two-way data binding with input elements.
      *   `onMount`: Svelte lifecycle hook to run code after the component is first rendered.
      *   `postMessage`, `onMessage` (from `vscodeApi.ts`): For communication with the extension backend.

  *   **Implementation Example:**
    ```html
    <script lang="ts">
      import { provideFluentDesignSystem, fluentSelect, fluentOption, fluentTextField, fluentButton } from "@fluentui/web-components";
      import { onMount } from 'svelte';
      import { postMessage, onMessage } from '../../lib/vscodeApi'; // Adjust path as needed

      // Register Fluent UI components
      provideFluentDesignSystem().register(
        fluentSelect(),
        fluentOption(),
        fluentTextField(),
        fluentButton()
      );

      let embeddingProvider: string = 'Ollama'; // Default value, will be overwritten by loaded settings
      let databaseConnectionString: string = '';

      onMount(() => {
        // Request current settings from extension backend on component mount
        postMessage({ command: 'getSettings' });

        // Listen for settings data from the extension backend
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
        // Send updated settings to the extension backend to be saved
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
      /* Basic styling for the page and Fluent UI components to match VS Code theme */
      main {
        padding: 20px;
        font-family: var(--vscode-font-family);
        color: var(--vscode-editor-foreground);
      }
      h1 {
        color: var(--vscode-editor-foreground);
      }
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

**4. Implement State Management and VS Code Configuration Interaction**

This is the core of saving and loading settings. You'll use VS Code's `workspace.getConfiguration()` API.

  *   **File:** `src/extension.ts`
  *   **API Information:**
      *   `vscode.workspace.getConfiguration('your-extension-id')`: Gets a configuration object for your extension.
      *   `config.get<T>(key, defaultValue)`: Reads a setting.
      *   `config.update(key, value, target)`: Writes a setting. `target` can be `vscode.ConfigurationTarget.Global`, `Workspace`, or `WorkspaceFolder`.
      *   `panel.webview.postMessage()` and `panel.webview.onDidReceiveMessage()`: For communication between extension and webview.

  *   **Implementation Example (within `extension.ts` `onDidReceiveMessage` handler for `settingsPanel`):**
    ```typescript
    // ... (inside settingsPanel.webview.onDidReceiveMessage)
    switch (message.command) {
        case 'getSettings':
            const config = vscode.workspace.getConfiguration('code-context-engine');
            const currentSettings = {
                embeddingProvider: config.get<string>('embeddingProvider', 'Ollama'),
                databaseConnectionString: config.get<string>('databaseConnectionString', 'http://localhost:6333'),
            };
            settingsPanel?.webview.postMessage({ command: 'settingsResult', settings: currentSettings });
            return;

        case 'saveSettings':
            const newSettings = message.settings;
            const configToUpdate = vscode.workspace.getConfiguration('code-context-engine');
            
            // Update settings. Use Global target for user-level settings, or Workspace for workspace-specific
            await configToUpdate.update('embeddingProvider', newSettings.embeddingProvider, vscode.ConfigurationTarget.Global);
            await configToUpdate.update('databaseConnectionString', newSettings.databaseConnectionString, vscode.ConfigurationTarget.Global);
            
            vscode.window.showInformationMessage('Code Context Engine settings saved!');
            return;
    }
    ```

**5. Define Configuration Schema in `package.json`**

To make your settings discoverable and provide type-checking and descriptions in VS Code's built-in settings UI, you must define them in `package.json`.

  *   **File:** `package.json`
  *   **Key Concept:** The `contributes.configuration` section defines the properties for your extension's settings.

  *   **Implementation Example (add to `contributes` section):**
    ```json
    "configuration": {
        "title": "Code Context Engine Configuration",
        "properties": {
            "code-context-engine.embeddingProvider": {
                "type": "string",
                "enum": ["Ollama", "OpenAI"],
                "default": "Ollama",
                "description": "Select the embedding provider to use for generating code embeddings."
            },
            "code-context-engine.databaseConnectionString": {
                "type": "string",
                "default": "http://localhost:6333",
                "description": "The connection string for the Qdrant vector database."
            }
        }
    }
    ```

**6. Refactor Services to Use Configuration**

Finally, ensure your `IndexingService` and `QdrantService` (and any other services that need configuration) read their values from the VS Code configuration instead of hardcoded defaults.

  *   **File:** `src/indexing/indexingService.ts`, `src/db/qdrantService.ts`
  *   **API Information:** `vscode.workspace.getConfiguration('your-extension-id').get<T>(key, defaultValue)`.

  *   **Implementation Example (`src/indexing/indexingService.ts` constructor):**
    ```typescript
    import * as vscode from 'vscode';
    // ... other imports

    export class IndexingService {
        // ... other properties
        private embeddingProvider: IEmbeddingProvider;

        constructor(private workspaceRoot: string) {
            // ...
            const config = vscode.workspace.getConfiguration('code-context-engine');
            const providerName = config.get<string>('embeddingProvider', 'Ollama');

            if (providerName === 'OpenAI') {
                this.embeddingProvider = new OpenAIProvider(); // Assuming OpenAIProvider exists
            } else {
                this.embeddingProvider = new OllamaProvider(); // Assuming OllamaProvider exists
            }
        }
        // ...
    }
    ```

  *   **Implementation Example (`src/db/qdrantService.ts` constructor):**
    ```typescript
    import { QdrantClient } from '@qdrant/js-client-rest';
    import * as vscode from 'vscode';

    export class QdrantService {
        private client: QdrantClient;

        constructor() {
            const config = vscode.workspace.getConfiguration('code-context-engine');
            const connectionString = config.get<string>('databaseConnectionString', 'http://localhost:6333');
            this.client = new QdrantClient({ url: connectionString });
        }
        // ...
    }
    ```

This completes the implementation guide for Sub-Sprint 6. You now have a fully functional settings UI that allows users to configure your extension, with those settings being correctly consumed by your backend services.