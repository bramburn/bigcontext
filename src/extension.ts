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
    console.log('Congratulations, your extension "code-context-engine" is now active!');

    try {
        const manager = new ExtensionManager(context);
        await manager.initialize();
        extensionState.setExtensionManager(manager);
        console.log('ExtensionManager initialized successfully');

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
            console.log('Code Context Engine Health Check:', diagnostics);
            vscode.window.showInformationMessage('Health check completed. See console for details.');

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
                console.error('Webview creation failed:', webviewError);
                vscode.window.showErrorMessage(`Webview creation failed: ${webviewError}`);
            }
        });

        context.subscriptions.push(healthCheckCommand);

        // Register Sprint 18 command palette commands
        const showSearchCommand = vscode.commands.registerCommand('code-context-engine.showSearch', async () => {
            try {
                const webviewManager = manager.getWebviewManager();
                await webviewManager.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders });
                // Send message to webview to navigate to search
                webviewManager.sendMessageToWebview('navigateToView', { view: 'search' });
            } catch (error) {
                console.error('Failed to show search:', error);
                vscode.window.showErrorMessage('Failed to open search view');
            }
        });

        const showIndexingCommand = vscode.commands.registerCommand('code-context-engine.showIndexing', async () => {
            try {
                const webviewManager = manager.getWebviewManager();
                await webviewManager.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders });
                webviewManager.sendMessageToWebview('navigateToView', { view: 'indexing' });
            } catch (error) {
                console.error('Failed to show indexing:', error);
                vscode.window.showErrorMessage('Failed to open indexing view');
            }
        });

        const showHelpCommand = vscode.commands.registerCommand('code-context-engine.showHelp', async () => {
            try {
                const webviewManager = manager.getWebviewManager();
                await webviewManager.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders });
                webviewManager.sendMessageToWebview('navigateToView', { view: 'help' });
            } catch (error) {
                console.error('Failed to show help:', error);
                vscode.window.showErrorMessage('Failed to open help view');
            }
        });

        const reindexCommand = vscode.commands.registerCommand('code-context-engine.reindex', async () => {
            try {
                const indexingService = manager.getIndexingService();
                await indexingService.startIndexing();
                vscode.window.showInformationMessage('Indexing started');
            } catch (error) {
                console.error('Failed to start indexing:', error);
                vscode.window.showErrorMessage('Failed to start indexing');
            }
        });

        const pauseIndexingCommand = vscode.commands.registerCommand('code-context-engine.pauseIndexing', async () => {
            try {
                const indexingService = manager.getIndexingService();
                await indexingService.pauseIndexing();
                vscode.window.showInformationMessage('Indexing paused');
            } catch (error) {
                console.error('Failed to pause indexing:', error);
                vscode.window.showErrorMessage('Failed to pause indexing');
            }
        });

        const resumeIndexingCommand = vscode.commands.registerCommand('code-context-engine.resumeIndexing', async () => {
            try {
                const indexingService = manager.getIndexingService();
                await indexingService.resumeIndexing();
                vscode.window.showInformationMessage('Indexing resumed');
            } catch (error) {
                console.error('Failed to resume indexing:', error);
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
                console.error('Failed to clear index:', error);
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
                }
            } catch (error) {
                console.error('Failed to search code:', error);
                vscode.window.showErrorMessage('Failed to perform search');
            }
        });

        const showSavedSearchesCommand = vscode.commands.registerCommand('code-context-engine.showSavedSearches', async () => {
            try {
                const webviewManager = manager.getWebviewManager();
                await webviewManager.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders });
                webviewManager.sendMessageToWebview('navigateToView', { view: 'search' });
                webviewManager.sendMessageToWebview('setSearchTab', { tab: 'saved' });
            } catch (error) {
                console.error('Failed to show saved searches:', error);
                vscode.window.showErrorMessage('Failed to open saved searches');
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
            showSavedSearchesCommand
        );

    } catch (error) {
        console.error('Failed to initialize ExtensionManager:', error);
        vscode.window.showErrorMessage('Code Context Engine failed to initialize. Please check the logs.');
        throw error;
    }
}

export function deactivate() {
    extensionState.dispose();
}
