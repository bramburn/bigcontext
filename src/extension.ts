/**
 * Code Context Engine Extension
 * 
 * This extension provides AI-powered code context and search capabilities for VS Code workspaces.
 * It creates a webview panel that allows users to index their repository and search through code.
 */

import * as vscode from 'vscode'; // Import VS Code extension API
import * as path from 'path'; // Import Node.js path module for file path operations
import { IndexingService, IndexingProgress, IndexingResult } from './indexing/indexingService'; // Import our indexing service
import { ContextService, ContextQuery, FileContentResult, RelatedFile } from './context/contextService'; // Import context service

// Global variable to track the current webview panel instance
let currentPanel: vscode.WebviewPanel | undefined = undefined;

// Global variable to track the context service instance
let contextService: ContextService | undefined = undefined;

/**
 * Extension activation point
 * 
 * This function is called when the extension is activated.
 * It registers all commands and sets up event handlers.
 * 
 * @param context - The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "code-context-engine" is now active!');

    // Register command to open the main webview panel
    let openPanelDisposable = vscode.commands.registerCommand('code-context-engine.openMainPanel', () => {
        // If panel already exists, bring it to focus
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
        } else {
            // Otherwise, create a new panel
            currentPanel = vscode.window.createWebviewPanel(
                'codeContextEngine', // Unique identifier for the panel
                'Code Context Engine', // Title displayed in the UI
                vscode.ViewColumn.One, // Show in the first column of the editor
                {
                    enableScripts: true, // Enable JavaScript in the webview
                    retainContextWhenHidden: true, // Keep the webview state when hidden
                    localResourceRoots: [
                        // Restrict the webview to only load resources from the dist directory
                        vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))
                    ]
                }
            );

            // Set the HTML content for the webview using the helper function
            currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionPath);

            // Initialize context service for this workspace
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                contextService = new ContextService(workspaceFolders[0].uri.fsPath);
            }

            // Handle messages sent from the webview to the extension
            currentPanel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'startIndexing':
                            // When user clicks "Index Repository" button in the webview
                            vscode.commands.executeCommand('code-context-engine.startIndexing');
                            return;
                        case 'search':
                            // When user performs a search in the webview
                            if (currentPanel) {
                                await handleSearch(message.query, currentPanel.webview);
                            }
                            return;
                        case 'getFileContent':
                            // Get file content with optional related chunks
                            if (currentPanel && contextService) {
                                await handleGetFileContent(message, currentPanel.webview);
                            }
                            return;
                        case 'findRelatedFiles':
                            // Find files related to a query
                            if (currentPanel && contextService) {
                                await handleFindRelatedFiles(message, currentPanel.webview);
                            }
                            return;
                        case 'queryContext':
                            // Advanced context query
                            if (currentPanel && contextService) {
                                await handleQueryContext(message, currentPanel.webview);
                            }
                            return;
                        case 'getServiceStatus':
                            // Get service status
                            if (currentPanel && contextService) {
                                await handleGetServiceStatus(currentPanel.webview);
                            }
                            return;
                        case 'openSettings':
                            // When user clicks "Open Settings" button in the webview
                            vscode.commands.executeCommand('workbench.action.openSettings', 'code-context-engine');
                            return;
                    }
                },
                undefined,
                context.subscriptions // Add to subscriptions for proper disposal
            );

            // Clean up resources when the panel is closed
            currentPanel.onDidDispose(
                () => {
                    // Reset the panel reference when it's closed
                    currentPanel = undefined;
                },
                null,
                context.subscriptions // Add to subscriptions for proper disposal
            );
        }
    });

    // Register command to start the repository indexing process
    let indexingDisposable = vscode.commands.registerCommand('code-context-engine.startIndexing', async () => {
        // Check if there's an open workspace folder to index
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const indexingService = new IndexingService(workspaceRoot);

            // Show progress notification while indexing is in progress
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification, // Show in notification area
                title: "Indexing Repository",
                cancellable: true // Allow user to cancel the operation
            }, async (progress, token) => {
                try {
                    // Start the indexing process with progress updates
                    const result: IndexingResult = await indexingService.startIndexing((indexingProgress: IndexingProgress) => {
                        if (token.isCancellationRequested) {
                            return; // Stop processing if cancelled
                        }

                        // Update the progress notification
                        const percentage = indexingProgress.totalFiles > 0
                            ? Math.round((indexingProgress.processedFiles / indexingProgress.totalFiles) * 100)
                            : 0;

                        progress.report({
                            message: `${indexingProgress.currentPhase}: ${indexingProgress.currentFile ? path.basename(indexingProgress.currentFile) : ''} (${indexingProgress.processedFiles}/${indexingProgress.totalFiles})`,
                            increment: percentage
                        });

                        // Send progress updates to the webview if it's open
                        if (currentPanel) {
                            currentPanel.webview.postMessage({
                                command: 'indexingProgress',
                                progress: indexingProgress
                            });
                        }
                    });

                    // Show completion message if the operation wasn't cancelled
                    if (!token.isCancellationRequested) {
                        const message = result.success
                            ? `Indexing complete! Processed ${result.processedFiles} files, created ${result.chunks.length} chunks in ${Math.round(result.duration / 1000)}s`
                            : `Indexing failed with ${result.errors.length} errors`;

                        if (result.success) {
                            vscode.window.showInformationMessage(message);
                        } else {
                            vscode.window.showErrorMessage(message);
                        }

                        // Send completion message to webview
                        if (currentPanel) {
                            currentPanel.webview.postMessage({
                                command: 'indexingComplete',
                                result: result
                            });
                        }
                    }
                } catch (error) {
                    const errorMessage = `Indexing failed: ${error instanceof Error ? error.message : String(error)}`;
                    vscode.window.showErrorMessage(errorMessage);
                    console.error(errorMessage);
                }
            });
        } else {
            // Show error if no workspace is open
            vscode.window.showErrorMessage("Please open a folder or workspace to index.");
        }
    });

    // Register command to open the settings panel
    let openSettingsDisposable = vscode.commands.registerCommand('code-context-engine.openSettings', () => {
        createSettingsPanel(context);
    });

    // Add all disposables to the extension context's subscriptions
    // This ensures they get properly cleaned up when the extension is deactivated
    context.subscriptions.push(openPanelDisposable, indexingDisposable, openSettingsDisposable);
}

/**
 * Handle search requests from the webview
 * 
 * Processes search queries from the user and returns results.
 * Currently implements mock functionality that will be replaced with actual search in future sprints.
 * 
 * @param query - The search query string entered by the user
 * @param webview - The webview instance to send results back to
 */
async function handleSearch(query: string, webview: vscode.Webview) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            webview.postMessage({
                command: 'searchResults',
                results: [],
                error: 'No workspace folder open'
            });
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const indexingService = new IndexingService(workspaceRoot);

        // Check if Qdrant is available
        const isQdrantAvailable = await indexingService.isQdrantAvailable();
        if (!isQdrantAvailable) {
            webview.postMessage({
                command: 'searchResults',
                results: [],
                error: 'Vector database not available. Please ensure Qdrant is running.'
            });
            return;
        }

        // Perform the search
        const searchResults = await indexingService.searchCode(query, 10);

        // Convert search results to the format expected by the webview
        const formattedResults = searchResults.map(result => ({
            file: result.payload.filePath,
            snippet: result.payload.content.substring(0, 200) + (result.payload.content.length > 200 ? '...' : ''),
            line: result.payload.startLine,
            score: result.score,
            type: result.payload.type,
            name: result.payload.name,
            language: result.payload.language
        }));

        webview.postMessage({
            command: 'searchResults',
            results: formattedResults
        });
    } catch (error) {
        console.error('Search error:', error);
        webview.postMessage({
            command: 'searchResults',
            results: [],
            error: `Search failed: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

/**
 * Handle file content requests from the webview
 */
async function handleGetFileContent(message: any, webview: vscode.Webview) {
    try {
        if (!contextService) {
            throw new Error('Context service not initialized');
        }

        const { filePath, includeRelatedChunks = false } = message;
        const result = await contextService.getFileContent(filePath, includeRelatedChunks);

        webview.postMessage({
            command: 'fileContentResult',
            requestId: message.requestId,
            result: result
        });
    } catch (error) {
        console.error('Get file content error:', error);
        webview.postMessage({
            command: 'fileContentResult',
            requestId: message.requestId,
            error: `Failed to get file content: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

/**
 * Handle related files requests from the webview
 */
async function handleFindRelatedFiles(message: any, webview: vscode.Webview) {
    try {
        if (!contextService) {
            throw new Error('Context service not initialized');
        }

        const { query, currentFilePath, maxResults = 10, minSimilarity = 0.5 } = message;
        const result = await contextService.findRelatedFiles(query, currentFilePath, maxResults, minSimilarity);

        webview.postMessage({
            command: 'relatedFilesResult',
            requestId: message.requestId,
            result: result
        });
    } catch (error) {
        console.error('Find related files error:', error);
        webview.postMessage({
            command: 'relatedFilesResult',
            requestId: message.requestId,
            error: `Failed to find related files: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

/**
 * Handle context query requests from the webview
 */
async function handleQueryContext(message: any, webview: vscode.Webview) {
    try {
        if (!contextService) {
            throw new Error('Context service not initialized');
        }

        const contextQuery: ContextQuery = message.contextQuery;
        const result = await contextService.queryContext(contextQuery);

        webview.postMessage({
            command: 'contextQueryResult',
            requestId: message.requestId,
            result: result
        });
    } catch (error) {
        console.error('Context query error:', error);
        webview.postMessage({
            command: 'contextQueryResult',
            requestId: message.requestId,
            error: `Context query failed: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

/**
 * Handle service status requests from the webview
 */
async function handleGetServiceStatus(webview: vscode.Webview) {
    try {
        if (!contextService) {
            throw new Error('Context service not initialized');
        }

        const status = await contextService.getStatus();

        webview.postMessage({
            command: 'serviceStatusResult',
            result: status
        });
    } catch (error) {
        console.error('Get service status error:', error);
        webview.postMessage({
            command: 'serviceStatusResult',
            error: `Failed to get service status: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

/**
 * Create and configure the settings webview panel
 */
function createSettingsPanel(context: vscode.ExtensionContext) {
    // Create a new webview panel for settings
    const settingsPanel = vscode.window.createWebviewPanel(
        'codeContextEngineSettings',
        'Code Context Engine - Settings',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))
            ]
        }
    );

    // Set the HTML content for the settings panel
    settingsPanel.webview.html = getSettingsWebviewContent(context, settingsPanel.webview);

    // Handle messages from the settings webview
    settingsPanel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'getSettings':
                    await handleGetSettings(settingsPanel.webview);
                    return;
                case 'saveSettings':
                    await handleSaveSettings(message.settings, settingsPanel.webview);
                    return;
                case 'resetSettings':
                    await handleResetSettings(settingsPanel.webview);
                    return;
                case 'testConnection':
                    await handleTestConnection(message.provider, settingsPanel.webview);
                    return;
            }
        },
        undefined,
        context.subscriptions
    );

    // Clean up when panel is disposed
    settingsPanel.onDidDispose(
        () => {
            // Settings panel disposed
        },
        null,
        context.subscriptions
    );
}

/**
 * Handle get settings requests from the settings webview
 */
async function handleGetSettings(webview: vscode.Webview) {
    try {
        const config = vscode.workspace.getConfiguration('code-context-engine');
        const settings = {
            embeddingProvider: config.get('embeddingProvider'),
            databaseConnectionString: config.get('databaseConnectionString'),
            openaiApiKey: config.get('openaiApiKey'),
            ollamaModel: config.get('ollamaModel'),
            openaiModel: config.get('openaiModel'),
            maxSearchResults: config.get('maxSearchResults'),
            minSimilarityThreshold: config.get('minSimilarityThreshold'),
            autoIndexOnStartup: config.get('autoIndexOnStartup'),
            indexingBatchSize: config.get('indexingBatchSize'),
            enableDebugLogging: config.get('enableDebugLogging'),
            excludePatterns: config.get('excludePatterns'),
            supportedLanguages: config.get('supportedLanguages')
        };

        webview.postMessage({
            command: 'settingsLoaded',
            settings: settings
        });
    } catch (error) {
        console.error('Failed to get settings:', error);
        webview.postMessage({
            command: 'settingsError',
            error: `Failed to load settings: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

/**
 * Handle save settings requests from the settings webview
 */
async function handleSaveSettings(settings: any, webview: vscode.Webview) {
    try {
        const config = vscode.workspace.getConfiguration('code-context-engine');

        // Save each setting
        await config.update('embeddingProvider', settings.embeddingProvider, vscode.ConfigurationTarget.Global);
        await config.update('databaseConnectionString', settings.databaseConnectionString, vscode.ConfigurationTarget.Global);
        await config.update('openaiApiKey', settings.openaiApiKey, vscode.ConfigurationTarget.Global);
        await config.update('ollamaModel', settings.ollamaModel, vscode.ConfigurationTarget.Global);
        await config.update('openaiModel', settings.openaiModel, vscode.ConfigurationTarget.Global);
        await config.update('maxSearchResults', settings.maxSearchResults, vscode.ConfigurationTarget.Global);
        await config.update('minSimilarityThreshold', settings.minSimilarityThreshold, vscode.ConfigurationTarget.Global);
        await config.update('autoIndexOnStartup', settings.autoIndexOnStartup, vscode.ConfigurationTarget.Global);
        await config.update('indexingBatchSize', settings.indexingBatchSize, vscode.ConfigurationTarget.Global);
        await config.update('enableDebugLogging', settings.enableDebugLogging, vscode.ConfigurationTarget.Global);
        await config.update('excludePatterns', settings.excludePatterns, vscode.ConfigurationTarget.Global);
        await config.update('supportedLanguages', settings.supportedLanguages, vscode.ConfigurationTarget.Global);

        webview.postMessage({
            command: 'settingsSaved',
            success: true
        });

        vscode.window.showInformationMessage('Settings saved successfully!');
    } catch (error) {
        console.error('Failed to save settings:', error);
        webview.postMessage({
            command: 'settingsError',
            error: `Failed to save settings: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

/**
 * Handle reset settings requests from the settings webview
 */
async function handleResetSettings(webview: vscode.Webview) {
    try {
        const config = vscode.workspace.getConfiguration('code-context-engine');

        // Reset to default values
        await config.update('embeddingProvider', undefined, vscode.ConfigurationTarget.Global);
        await config.update('databaseConnectionString', undefined, vscode.ConfigurationTarget.Global);
        await config.update('openaiApiKey', undefined, vscode.ConfigurationTarget.Global);
        await config.update('ollamaModel', undefined, vscode.ConfigurationTarget.Global);
        await config.update('openaiModel', undefined, vscode.ConfigurationTarget.Global);
        await config.update('maxSearchResults', undefined, vscode.ConfigurationTarget.Global);
        await config.update('minSimilarityThreshold', undefined, vscode.ConfigurationTarget.Global);
        await config.update('autoIndexOnStartup', undefined, vscode.ConfigurationTarget.Global);
        await config.update('indexingBatchSize', undefined, vscode.ConfigurationTarget.Global);
        await config.update('enableDebugLogging', undefined, vscode.ConfigurationTarget.Global);
        await config.update('excludePatterns', undefined, vscode.ConfigurationTarget.Global);
        await config.update('supportedLanguages', undefined, vscode.ConfigurationTarget.Global);

        // Send back the default settings
        await handleGetSettings(webview);

        vscode.window.showInformationMessage('Settings reset to defaults!');
    } catch (error) {
        console.error('Failed to reset settings:', error);
        webview.postMessage({
            command: 'settingsError',
            error: `Failed to reset settings: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

/**
 * Handle test connection requests from the settings webview
 */
async function handleTestConnection(provider: string, webview: vscode.Webview) {
    try {
        if (provider === 'qdrant') {
            // Test Qdrant connection
            const config = vscode.workspace.getConfiguration('code-context-engine');
            const connectionString = config.get<string>('databaseConnectionString') || 'http://localhost:6333';

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const indexingService = new IndexingService(workspaceFolders[0].uri.fsPath);
                const isAvailable = await indexingService.isQdrantAvailable();

                webview.postMessage({
                    command: 'connectionTestResult',
                    provider: 'qdrant',
                    success: isAvailable,
                    message: isAvailable ? 'Qdrant connection successful!' : 'Failed to connect to Qdrant database'
                });
            }
        } else if (provider === 'embedding') {
            // Test embedding provider
            const config = vscode.workspace.getConfiguration('code-context-engine');
            const embeddingProvider = config.get<string>('embeddingProvider') || 'ollama';

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const contextService = new ContextService(workspaceFolders[0].uri.fsPath);
                const isReady = await contextService.isReady();

                webview.postMessage({
                    command: 'connectionTestResult',
                    provider: 'embedding',
                    success: isReady,
                    message: isReady ? `${embeddingProvider} provider is ready!` : `Failed to connect to ${embeddingProvider} provider`
                });
            }
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        webview.postMessage({
            command: 'connectionTestResult',
            provider: provider,
            success: false,
            message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

/**
 * Generate the HTML content for the webview panel
 * 
 * Creates the UI for the extension's main panel, including repository indexing,
 * search functionality, and settings access.
 * 
 * @param webview - The webview instance to generate content for
 * @param extensionPath - The file system path to the extension
 * @returns HTML content as a string
 */
function getWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    // Get the URIs for the built JavaScript bundle file
    // This converts the local file path to a URI that the webview can access
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'webview', 'dist', 'bundle.js')));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Context Engine</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        .progress-section {
            display: none;
        }
        .progress-section.visible {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Code Context Engine</h1>
            <p>AI-powered code context and search for your workspace</p>
        </div>

        <div class="section">
            <h2>Repository Indexing</h2>
            <p>Index your repository to enable AI-powered code search and context analysis.</p>

            <div id="service-status" style="margin-bottom: 15px;">
                <!-- Service status will be populated here -->
            </div>

            <fluent-button id="index-button" appearance="accent">Index Repository</fluent-button>

            <div id="progress-section" class="progress-section">
                <h3>Indexing Progress</h3>
                <fluent-progress-ring id="progress-ring"></fluent-progress-ring>
                <p id="progress-text">Starting indexing process...</p>
            </div>
        </div>

        <div class="section">
            <h2>Search & Context</h2>
            <p>Search through your indexed code and get AI-powered context.</p>
            <fluent-text-field id="search-input" placeholder="Search your code..." style="width: 100%; margin-bottom: 10px;"></fluent-text-field>
            <fluent-button id="search-button">Search</fluent-button>

            <div id="search-results" style="margin-top: 20px;">
                <!-- Search results will be displayed here -->
            </div>

            <div id="related-files" style="margin-top: 20px;">
                <!-- Related files will be displayed here -->
            </div>
        </div>

        <div class="section">
            <h2>Settings</h2>
            <p>Configure your Code Context Engine preferences.</p>
            <fluent-button id="settings-button" appearance="stealth">Open Settings</fluent-button>
        </div>
    </div>

    <script src="${scriptUri}"></script>
</body>
</html>`;
}

/**
 * Generate the HTML content for the settings webview panel
 */
function getSettingsWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Context Engine - Settings</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        .settings-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .setting-group {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            background-color: var(--vscode-editor-background);
        }
        .setting-group h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        .setting-item {
            margin-bottom: 15px;
        }
        .setting-item label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .setting-item input, .setting-item select, .setting-item textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-family: inherit;
            font-size: inherit;
        }
        .setting-item input[type="checkbox"] {
            width: auto;
            margin-right: 8px;
        }
        .setting-item .description {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
        }
        .button-group {
            margin-top: 30px;
            text-align: center;
        }
        .button {
            padding: 10px 20px;
            margin: 0 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: inherit;
        }
        .button-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .button-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button:hover {
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="settings-container">
        <h1>Code Context Engine Settings</h1>

        <div class="setting-group">
            <h3>Embedding Provider</h3>
            <div class="setting-item">
                <label for="embeddingProvider">Provider:</label>
                <select id="embeddingProvider">
                    <option value="ollama">Ollama (Local)</option>
                    <option value="openai">OpenAI (Cloud)</option>
                </select>
                <div class="description">Choose between local Ollama or cloud-based OpenAI for generating embeddings</div>
            </div>

            <div class="setting-item" id="ollamaSettings">
                <label for="ollamaModel">Ollama Model:</label>
                <select id="ollamaModel">
                    <option value="nomic-embed-text">nomic-embed-text (768 dimensions)</option>
                    <option value="all-minilm">all-minilm (384 dimensions)</option>
                    <option value="mxbai-embed-large">mxbai-embed-large (1024 dimensions)</option>
                </select>
                <div class="description">Select the Ollama model for embedding generation</div>
            </div>

            <div class="setting-item" id="openaiSettings" style="display: none;">
                <label for="openaiApiKey">OpenAI API Key:</label>
                <input type="password" id="openaiApiKey" placeholder="sk-...">
                <div class="description">Your OpenAI API key (stored securely in VS Code settings)</div>

                <label for="openaiModel" style="margin-top: 15px;">OpenAI Model:</label>
                <select id="openaiModel">
                    <option value="text-embedding-ada-002">text-embedding-ada-002 (1536 dimensions)</option>
                    <option value="text-embedding-3-small">text-embedding-3-small (1536 dimensions)</option>
                    <option value="text-embedding-3-large">text-embedding-3-large (3072 dimensions)</option>
                </select>
            </div>

            <button class="button button-secondary" onclick="testEmbeddingConnection()">Test Connection</button>
        </div>

        <div class="setting-group">
            <h3>Vector Database</h3>
            <div class="setting-item">
                <label for="databaseConnectionString">Qdrant Connection String:</label>
                <input type="text" id="databaseConnectionString" placeholder="http://localhost:6333">
                <div class="description">URL for your Qdrant vector database instance</div>
            </div>
            <button class="button button-secondary" onclick="testDatabaseConnection()">Test Connection</button>
        </div>

        <div class="button-group">
            <button class="button button-primary" onclick="saveSettings()">Save Settings</button>
            <button class="button button-secondary" onclick="resetSettings()">Reset to Defaults</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Load settings when page loads
        window.addEventListener('load', () => {
            vscode.postMessage({ command: 'getSettings' });
        });

        // Handle provider selection
        document.getElementById('embeddingProvider').addEventListener('change', (e) => {
            const provider = e.target.value;
            document.getElementById('ollamaSettings').style.display = provider === 'ollama' ? 'block' : 'none';
            document.getElementById('openaiSettings').style.display = provider === 'openai' ? 'block' : 'none';
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'settingsLoaded':
                    loadSettings(message.settings);
                    break;
                case 'settingsSaved':
                    if (message.success) {
                        alert('Settings saved successfully!');
                    }
                    break;
                case 'settingsError':
                    alert('Error: ' + message.error);
                    break;
                case 'connectionTestResult':
                    showConnectionResult(message);
                    break;
            }
        });

        function loadSettings(settings) {
            document.getElementById('embeddingProvider').value = settings.embeddingProvider || 'ollama';
            document.getElementById('databaseConnectionString').value = settings.databaseConnectionString || 'http://localhost:6333';
            document.getElementById('openaiApiKey').value = settings.openaiApiKey || '';
            document.getElementById('ollamaModel').value = settings.ollamaModel || 'nomic-embed-text';
            document.getElementById('openaiModel').value = settings.openaiModel || 'text-embedding-ada-002';

            // Trigger provider change to show/hide sections
            document.getElementById('embeddingProvider').dispatchEvent(new Event('change'));
        }

        function saveSettings() {
            const settings = {
                embeddingProvider: document.getElementById('embeddingProvider').value,
                databaseConnectionString: document.getElementById('databaseConnectionString').value,
                openaiApiKey: document.getElementById('openaiApiKey').value,
                ollamaModel: document.getElementById('ollamaModel').value,
                openaiModel: document.getElementById('openaiModel').value
            };

            vscode.postMessage({ command: 'saveSettings', settings });
        }

        function resetSettings() {
            if (confirm('Are you sure you want to reset all settings to their default values?')) {
                vscode.postMessage({ command: 'resetSettings' });
            }
        }

        function testDatabaseConnection() {
            vscode.postMessage({ command: 'testConnection', provider: 'qdrant' });
        }

        function testEmbeddingConnection() {
            vscode.postMessage({ command: 'testConnection', provider: 'embedding' });
        }

        function showConnectionResult(result) {
            const message = result.success ?
                \`✅ \${result.message}\` :
                \`❌ \${result.message}\`;
            alert(message);
        }
    </script>
</body>
</html>`;
}

/**
 * Extension deactivation point
 * 
 * This function is called when the extension is deactivated.
 * Currently empty as all cleanup is handled by the disposables added to context.subscriptions.
 */
export function deactivate() {
    // No additional cleanup needed - VS Code handles disposal of registered disposables
}
