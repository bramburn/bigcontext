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
 * Extension deactivation point
 * 
 * This function is called when the extension is deactivated.
 * Currently empty as all cleanup is handled by the disposables added to context.subscriptions.
 */
export function deactivate() {
    // No additional cleanup needed - VS Code handles disposal of registered disposables
}
