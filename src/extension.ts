import * as vscode from 'vscode';
import { ExtensionManager } from './extensionManager';

class ExtensionStateManager {
    private static instance: ExtensionStateManager;
    private extensionManager: ExtensionManager | null = null;

    private constructor() {}

    static getInstance(): ExtensionStateManager {
        if (!ExtensionStateManager.instance) {
            ExtensionStateManager.instance = new ExtensionStateManager();
        }
        return ExtensionStateManager.instance;
    }

    setExtensionManager(manager: ExtensionManager): void {
        this.extensionManager = manager;
    }

    dispose(): void {
        if (this.extensionManager) {
            this.extensionManager.dispose();
            this.extensionManager = null;
        }
    }
}

const extensionState = ExtensionStateManager.getInstance();

export async function activate(context: vscode.ExtensionContext) {
    const startTime = Date.now();

    try {
        const manager = new ExtensionManager(context);
        await manager.initialize();
        extensionState.setExtensionManager(manager);

        // Get logging service from manager for proper logging
        const loggingService = manager.getLoggingService();
        const activationDuration = Date.now() - startTime;

        loggingService.info('Code Context Engine extension activated successfully', {
            activationDuration,
            extensionVersion: context.extension.packageJSON.version,
            vscodeVersion: vscode.version,
            platform: process.platform,
            nodeVersion: process.version
        }, 'Extension');

        // Register health check command for debugging webview issues
        const healthCheckCommand = vscode.commands.registerCommand('codeContextEngine.healthCheck', async () => {
            const diagnostics = {
                environment: process.platform,
                isRemote: vscode.env.remoteName !== undefined,
                remoteName: vscode.env.remoteName || 'local',
                extensionPath: context.extensionPath,
                extensionUri: context.extensionUri.toString(),
                webviewSupport: true,
                timestamp: new Date().toISOString()
            };

            const message = `Health Check Results:\n${JSON.stringify(diagnostics, null, 2)}`;
            loggingService.info('Health check executed', diagnostics, 'HealthCheck');
            vscode.window.showInformationMessage('Health check completed. See output channel for details.');

            // Also try to create a test webview to verify webview functionality
            try {
                const testPanel = vscode.window.createWebviewPanel(
                    'healthCheck',
                    'Health Check Test',
                    vscode.ViewColumn.One,
                    { enableScripts: true, retainContextWhenHidden: true }
                );
                testPanel.webview.html = `
                    <!DOCTYPE html>
                    <html>
                    <head><title>Health Check</title></head>
                    <body>
                        <h1>Webview Test Successful</h1>
                        <pre>${message}</pre>
                        <script>
                            console.log('Test webview loaded successfully');
                            const vscode = acquireVsCodeApi();
                            vscode.postMessage({ command: 'healthCheckSuccess' });
                        </script>
                    </body>
                    </html>
                `;

                // Auto-close after 3 seconds
                setTimeout(() => testPanel.dispose(), 3000);
            } catch (webviewError) {
                loggingService.error('Webview creation failed during health check', {
                    error: webviewError instanceof Error ? webviewError.message : String(webviewError)
                }, 'HealthCheck');
                vscode.window.showErrorMessage(`Webview creation failed: ${webviewError}`);
            }
        });

        context.subscriptions.push(healthCheckCommand);

        // Register URI handler for deep linking
        const uriHandler = {
            handleUri(uri: vscode.Uri) {
                loggingService.info('URI handler invoked', {
                    uri: uri.toString(),
                    scheme: uri.scheme,
                    authority: uri.authority,
                    path: uri.path,
                    query: uri.query
                }, 'URIHandler');

                const params = new URLSearchParams(uri.query);
                const resultId = params.get('resultId');

                if (resultId) {
                    // Focus the webview and tell it to highlight the result
                    manager.focusAndShowResult(resultId);
                    loggingService.debug('URI handler focusing result', { resultId }, 'URIHandler');
                } else {
                    loggingService.warn('URI received without resultId parameter', {
                        uri: uri.toString(),
                        availableParams: Array.from(params.keys())
                    }, 'URIHandler');
                }
            }
        };

        context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

        // Register Sprint 18 command palette commands
        const showSearchCommand = vscode.commands.registerCommand('code-context-engine.showSearch', async () => {
            try {
                const webviewManager = manager.getWebviewManager();
                await webviewManager.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders });
                // Send message to webview to navigate to search
                webviewManager.sendMessageToWebview('navigateToView', { view: 'search' });
            } catch (error) {
                loggingService.error('Failed to show search view', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to open search view');
            }
        });

        const showIndexingCommand = vscode.commands.registerCommand('code-context-engine.showIndexing', async () => {
            try {
                const webviewManager = manager.getWebviewManager();
                await webviewManager.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders });
                webviewManager.sendMessageToWebview('navigateToView', { view: 'indexing' });
            } catch (error) {
                loggingService.error('Failed to show indexing view', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to open indexing view');
            }
        });

        const showHelpCommand = vscode.commands.registerCommand('code-context-engine.showHelp', async () => {
            try {
                const webviewManager = manager.getWebviewManager();
                await webviewManager.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders });
                webviewManager.sendMessageToWebview('navigateToView', { view: 'help' });
            } catch (error) {
                loggingService.error('Failed to show help view', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to open help view');
            }
        });

        const reindexCommand = vscode.commands.registerCommand('code-context-engine.reindex', async () => {
            try {
                const indexingService = manager.getIndexingService();
                await indexingService.startIndexing();
                loggingService.info('Indexing started via command', {}, 'CommandHandler');
                vscode.window.showInformationMessage('Indexing started');
            } catch (error) {
                loggingService.error('Failed to start indexing via command', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to start indexing');
            }
        });

        const pauseIndexingCommand = vscode.commands.registerCommand('code-context-engine.pauseIndexing', async () => {
            try {
                const indexingService = manager.getIndexingService();
                await indexingService.pause();
                loggingService.info('Indexing paused via command', {}, 'CommandHandler');
                vscode.window.showInformationMessage('Indexing paused');
            } catch (error) {
                loggingService.error('Failed to pause indexing via command', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to pause indexing');
            }
        });

        const resumeIndexingCommand = vscode.commands.registerCommand('code-context-engine.resumeIndexing', async () => {
            try {
                const indexingService = manager.getIndexingService();
                await indexingService.resume();
                loggingService.info('Indexing resumed via command', {}, 'CommandHandler');
                vscode.window.showInformationMessage('Indexing resumed');
            } catch (error) {
                loggingService.error('Failed to resume indexing via command', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to resume indexing');
            }
        });

        const clearIndexCommand = vscode.commands.registerCommand('code-context-engine.clearIndex', async () => {
            try {
                const result = await vscode.window.showWarningMessage(
                    'Are you sure you want to clear the entire index? This action cannot be undone.',
                    { modal: true },
                    'Clear Index'
                );
                if (result === 'Clear Index') {
                    const indexingService = manager.getIndexingService();
                    await indexingService.clearIndex();
                    vscode.window.showInformationMessage('Index cleared successfully');
                }
            } catch (error) {
                loggingService.error('Failed to clear index via command', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to clear index');
            }
        });

        const searchCodeCommand = vscode.commands.registerCommand('code-context-engine.searchCode', async () => {
            try {
                const query = await vscode.window.showInputBox({
                    prompt: 'Enter your search query',
                    placeHolder: 'e.g., function that handles authentication'
                });
                if (query) {
                    const webviewManager = manager.getWebviewManager();
                    await webviewManager.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders });
                    webviewManager.sendMessageToWebview('navigateToView', { view: 'search' });
                    webviewManager.sendMessageToWebview('setQuery', { query });
                    loggingService.info('Search initiated via command', { query }, 'CommandHandler');
                }
            } catch (error) {
                loggingService.error('Failed to search code via command', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to perform search');
            }
        });

        const showSavedSearchesCommand = vscode.commands.registerCommand('code-context-engine.showSavedSearches', async () => {
            try {
                const webviewManager = manager.getWebviewManager();
                await webviewManager.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders });
                webviewManager.sendMessageToWebview('navigateToView', { view: 'search' });
                webviewManager.sendMessageToWebview('setSearchTab', { tab: 'saved' });
                loggingService.info('Saved searches view opened via command', {}, 'CommandHandler');
            } catch (error) {
                loggingService.error('Failed to show saved searches via command', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to open saved searches');
            }
        });

        const diagnoseStylingCommand = vscode.commands.registerCommand('codeContextEngine.diagnoseStyling', async () => {
            try {
                const webviewManager = manager.getWebviewManager();
                await webviewManager.diagnoseStyling();
                loggingService.info('Styling diagnosis completed via command', {}, 'CommandHandler');
                vscode.window.showInformationMessage('Styling diagnosis completed. Check docs/diagnosis-styling.md');
            } catch (error) {
                loggingService.error('Failed to run styling diagnosis via command', {
                    error: error instanceof Error ? error.message : String(error)
                }, 'CommandHandler');
                vscode.window.showErrorMessage('Failed to run styling diagnosis');
            }
        });

        // Register all new commands
        context.subscriptions.push(
            showSearchCommand,
            showIndexingCommand,
            showHelpCommand,
            reindexCommand,
            pauseIndexingCommand,
            resumeIndexingCommand,
            clearIndexCommand,
            searchCodeCommand,
            showSavedSearchesCommand,
            diagnoseStylingCommand
        );

    } catch (error) {
        // Create a temporary logging service for error reporting if manager failed to initialize
        const tempOutputChannel = vscode.window.createOutputChannel("Code Context Engine");
        tempOutputChannel.appendLine(`[ERROR] Failed to initialize ExtensionManager: ${error instanceof Error ? error.message : String(error)}`);
        tempOutputChannel.show();

        vscode.window.showErrorMessage('Code Context Engine failed to initialize. Please check the output channel for details.');
        throw error;
    }
}

export function deactivate() {
    try {
        extensionState.dispose();
        // Note: Logging service will be disposed by ExtensionManager
    } catch (error) {
        console.error('Error during extension deactivation:', error);
    }
}
