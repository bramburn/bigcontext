import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MessageRouter } from './messageRouter';

/**
 * WebviewManager class responsible for managing all webview panels and their lifecycle.
 * 
 * This class centralizes webview creation, content management, and message handling,
 * providing a clean separation between webview logic and command handlers.
 * It handles:
 * - Main panel and settings panel creation and lifecycle
 * - Webview content loading with proper resource URIs
 * - Panel state management (showing, hiding, disposing)
 * - Integration with ExtensionManager for service access
 */
export class WebviewManager {
    private context: vscode.ExtensionContext;
    private extensionManager: any; // Will be properly typed when we integrate
    private mainPanel: vscode.WebviewPanel | undefined;
    private settingsPanel: vscode.WebviewPanel | undefined;
    private messageRouter: MessageRouter | undefined;

    /**
     * Creates a new WebviewManager instance
     * @param context - The VS Code extension context
     * @param extensionManager - The ExtensionManager instance for service access
     */
    constructor(context: vscode.ExtensionContext, extensionManager: any) {
        this.context = context;
        this.extensionManager = extensionManager;
        this.initializeMessageRouter();
    }

    /**
     * Initializes the MessageRouter with services from ExtensionManager
     */
    private initializeMessageRouter(): void {
        try {
            if (this.extensionManager &&
                this.extensionManager.getContextService &&
                this.extensionManager.getIndexingService) {

                const contextService = this.extensionManager.getContextService();
                const indexingService = this.extensionManager.getIndexingService();

                if (contextService && indexingService) {
                    this.messageRouter = new MessageRouter(contextService, indexingService);

                    // Set advanced managers if available
                    if (this.extensionManager.getSearchManager &&
                        this.extensionManager.getConfigurationManager &&
                        this.extensionManager.getPerformanceManager) {

                        const searchManager = this.extensionManager.getSearchManager();
                        const configurationManager = this.extensionManager.getConfigurationManager();
                        const performanceManager = this.extensionManager.getPerformanceManager();

                        if (searchManager && configurationManager && performanceManager) {
                            this.messageRouter.setAdvancedManagers(
                                searchManager,
                                configurationManager,
                                performanceManager
                            );
                        }
                    }

                    console.log('WebviewManager: MessageRouter initialized');
                }
            }
        } catch (error) {
            console.error('WebviewManager: Failed to initialize MessageRouter:', error);
        }
    }

    /**
     * Shows the main Code Context Engine panel
     * Creates a new panel if one doesn't exist, or reveals the existing one
     */
    public showMainPanel(): void {
        // If panel already exists, just reveal it
        if (this.mainPanel) {
            this.mainPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Create new main panel
        this.mainPanel = vscode.window.createWebviewPanel(
            'codeContextMain',
            'Code Context Engine',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))
                ]
            }
        );

        // Set the webview content
        this.mainPanel.webview.html = this.getWebviewContent(this.mainPanel.webview, 'main');

        // Handle panel disposal
        this.mainPanel.onDidDispose(() => {
            this.mainPanel = undefined;
        });

        // Set up message handling for the main panel
        this.setupMessageHandling(this.mainPanel.webview);

        console.log('WebviewManager: Main panel created and shown');
    }

    /**
     * Shows the settings panel
     * Creates a new panel if one doesn't exist, or reveals the existing one
     */
    public showSettingsPanel(): void {
        // If panel already exists, just reveal it
        if (this.settingsPanel) {
            this.settingsPanel.reveal(vscode.ViewColumn.Two);
            return;
        }

        // Create new settings panel
        this.settingsPanel = vscode.window.createWebviewPanel(
            'codeContextSettings',
            'Code Context Settings',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))
                ]
            }
        );

        // Set the webview content
        this.settingsPanel.webview.html = this.getWebviewContent(this.settingsPanel.webview, 'settings');

        // Handle panel disposal
        this.settingsPanel.onDidDispose(() => {
            this.settingsPanel = undefined;
        });

        // Set up message handling for the settings panel
        this.setupMessageHandling(this.settingsPanel.webview);

        console.log('WebviewManager: Settings panel created and shown');
    }

    /**
     * Gets the HTML content for a webview panel
     * Reads the HTML template and replaces placeholders with proper webview URIs
     * @param webview - The webview instance
     * @param panelName - The name of the panel ('main' or 'settings')
     * @returns The HTML content with proper resource URIs
     */
    private getWebviewContent(webview: vscode.Webview, panelName: string): string {
        try {
            // Path to the webview HTML file
            const htmlPath = path.join(this.context.extensionPath, 'webview', 'dist', 'index.html');

            // Check if the HTML file exists
            if (!fs.existsSync(htmlPath)) {
                console.warn('WebviewManager: HTML file not found, using fallback content');
                return this.getFallbackContent(panelName);
            }

            // Read the HTML content
            let htmlContent = fs.readFileSync(htmlPath, 'utf8');

            // Replace relative paths with webview-specific URIs using regex
            // This handles webpack-generated assets like bundle.js, styles, etc.
            htmlContent = htmlContent.replace(
                /(<script[^>]+src="|<link[^>]+href="|src="|href=")(?!https?:\/\/)([^"]*\.(?:js|css|png|jpg|jpeg|gif|svg|ico))"/g,
                (_match, prefix, relativePath) => {
                    const resourcePath = path.join(this.context.extensionPath, 'webview', 'dist', relativePath);
                    const uri = webview.asWebviewUri(vscode.Uri.file(resourcePath));
                    return `${prefix}${uri}"`;
                }
            );

            return htmlContent;
        } catch (error) {
            console.error('WebviewManager: Error loading webview content:', error);
            return this.getFallbackContent(panelName);
        }
    }

    /**
     * Provides fallback HTML content when the main webview files are not available
     * @param panelName - The name of the panel
     * @returns Basic HTML content
     */
    private getFallbackContent(panelName: string): string {
        const title = panelName === 'main' ? 'Code Context Engine' : 'Code Context Settings';
        const content = panelName === 'main' 
            ? `
                <h1>Code Context Engine</h1>
                <p>Welcome to Code Context Engine!</p>
                <p>This is a placeholder interface. The full webview is being developed.</p>
                <button onclick="startIndexing()">Start Indexing</button>
                <script>
                    const vscode = acquireVsCodeApi();
                    function startIndexing() {
                        vscode.postMessage({ command: 'startIndexing' });
                    }
                </script>
            `
            : `
                <h1>Code Context Settings</h1>
                <p>Configure your Code Context Engine settings here.</p>
                <p>This is a placeholder interface. The full settings panel is being developed.</p>
            `;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
        }
        h1 {
            color: var(--vscode-textLink-foreground);
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    }

    /**
     * Sets up message handling for a webview using MessageRouter
     * @param webview - The webview to set up message handling for
     */
    private setupMessageHandling(webview: vscode.Webview): void {
        webview.onDidReceiveMessage(async (message) => {
            try {
                console.log('WebviewManager: Received message:', message.command);

                if (this.messageRouter) {
                    // Use MessageRouter for centralized message handling
                    await this.messageRouter.handleMessage(message, webview);
                } else {
                    // Fallback for basic commands when MessageRouter is not available
                    console.warn('WebviewManager: MessageRouter not available, using fallback handling');

                    switch (message.command) {
                        case 'startIndexing':
                            // Delegate to command
                            await vscode.commands.executeCommand('code-context-engine.startIndexing');
                            break;
                        default:
                            console.log('WebviewManager: Unknown command:', message.command);
                            await webview.postMessage({
                                command: 'error',
                                message: `Command not supported: ${message.command}`
                            });
                            break;
                    }
                }
            } catch (error) {
                console.error('WebviewManager: Error handling message:', error);
                await webview.postMessage({
                    command: 'error',
                    message: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }

    /**
     * Disposes of all webview panels and cleans up resources
     */
    public dispose(): void {
        console.log('WebviewManager: Starting disposal...');

        if (this.mainPanel) {
            this.mainPanel.dispose();
            this.mainPanel = undefined;
        }

        if (this.settingsPanel) {
            this.settingsPanel.dispose();
            this.settingsPanel = undefined;
        }

        console.log('WebviewManager: Disposal completed');
    }

    /**
     * Gets the current main panel instance
     * @returns The main panel or undefined if not created
     */
    public getMainPanel(): vscode.WebviewPanel | undefined {
        return this.mainPanel;
    }

    /**
     * Gets the current settings panel instance
     * @returns The settings panel or undefined if not created
     */
    public getSettingsPanel(): vscode.WebviewPanel | undefined {
        return this.settingsPanel;
    }
}
