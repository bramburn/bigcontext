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

        // Register URI handler for deep linking
        const uriHandler = {
            handleUri(uri: vscode.Uri) {
                console.log(`Extension: Received URI: ${uri.toString()}`);
                const params = new URLSearchParams(uri.query);
                const resultId = params.get('resultId');

                if (resultId) {
                    // Focus the webview and tell it to highlight the result
                    manager.focusAndShowResult(resultId);
                } else {
                    console.warn('Extension: URI received without resultId parameter');
                }
            }
        };

        context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

    } catch (error) {
        console.error('Failed to initialize ExtensionManager:', error);
        vscode.window.showErrorMessage('Code Context Engine failed to initialize. Please check the logs.');
        throw error;
    }
}

export function deactivate() {
    extensionState.dispose();
}
