/**
 * Code Context Engine Extension
 * 
 * This extension provides AI-powered code context and search capabilities for VS Code workspaces.
 * It creates a webview panel that allows users to index their repository and search through code.
 */

import * as vscode from 'vscode'; // Import VS Code extension API
import * as path from 'path'; // Import Node.js path module for file path operations

// Global variable to track the current webview panel instance
let currentPanel: vscode.WebviewPanel | undefined = undefined;

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

            // Handle messages sent from the webview to the extension
            currentPanel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'startIndexing':
                            // When user clicks "Index Repository" button in the webview
                            vscode.commands.executeCommand('code-context-engine.startIndexing');
                            return;
                        case 'search':
                            // When user performs a search in the webview
                            if (currentPanel) {
                                handleSearch(message.query, currentPanel.webview);
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
            
            // Show progress notification while indexing is in progress
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification, // Show in notification area
                title: "Indexing Repository",
                cancellable: true // Allow user to cancel the operation
            }, async (progress, token) => {
                // Report initial progress
                progress.report({ message: "Starting indexing process..." });
                
                // TODO: Implement actual indexing logic in future sprints
                // Currently just a placeholder with a delay to simulate work
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Show completion message if the operation wasn't cancelled
                if (!token.isCancellationRequested) {
                    vscode.window.showInformationMessage('Indexing complete! (Placeholder implementation)');
                }
            });
        } else {
            // Show error if no workspace is open
            vscode.window.showErrorMessage("Please open a folder or workspace to index.");
        }
    });

    // Add all disposables to the extension context's subscriptions
    // This ensures they get properly cleaned up when the extension is deactivated
    context.subscriptions.push(openPanelDisposable, indexingDisposable);
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
function handleSearch(query: string, webview: vscode.Webview) {
    // TODO: Implement actual search logic in future sprints
    // For now, return mock results based on the query
    const mockResults = [
        {
            file: 'src/extension.ts',
            snippet: `function activate(context: vscode.ExtensionContext) { // Found: ${query}`,
            line: 8
        },
        {
            file: 'package.json',
            snippet: `"name": "code-context-engine" // Search term: ${query}`,
            line: 2
        }
    ];

    // Send the search results back to the webview
    webview.postMessage({
        command: 'searchResults', // Command identifier for the webview to recognize
        results: mockResults      // The actual search results
    });
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
 * Extension deactivation point
 * 
 * This function is called when the extension is deactivated.
 * Currently empty as all cleanup is handled by the disposables added to context.subscriptions.
 */
export function deactivate() {
    // No additional cleanup needed - VS Code handles disposal of registered disposables
}
