import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';
import { WebviewManager } from './webviewManager';

/**
 * CommandManager class responsible for registering and managing all VS Code commands
 * for the Code Context Engine extension.
 * 
 * This class centralizes command registration and provides a clean separation between
 * command handling logic and the main extension activation. It handles:
 * - Registration of all extension commands
 * - Command callback implementations
 * - Integration with core services
 * - Proper disposal of command registrations
 */
export class CommandManager {
    private indexingService: IndexingService;
    private webviewManager: WebviewManager;

    /**
     * Creates a new CommandManager instance
     * @param indexingService - The IndexingService instance for handling indexing commands
     * @param webviewManager - The WebviewManager instance for handling webview operations
     */
    constructor(indexingService: IndexingService, webviewManager: WebviewManager) {
        this.indexingService = indexingService;
        this.webviewManager = webviewManager;
    }

    /**
     * Registers all extension commands and returns their disposables
     * @returns Array of disposables for the registered commands
     */
    registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Register the main panel command
        const openMainPanelDisposable = vscode.commands.registerCommand(
            'code-context-engine.openMainPanel',
            this.handleOpenMainPanel.bind(this)
        );
        disposables.push(openMainPanelDisposable);

        // Register the start indexing command
        const startIndexingDisposable = vscode.commands.registerCommand(
            'code-context-engine.startIndexing',
            this.handleStartIndexing.bind(this)
        );
        disposables.push(startIndexingDisposable);

        // Register the open settings command
        const openSettingsDisposable = vscode.commands.registerCommand(
            'code-context-engine.openSettings',
            this.handleOpenSettings.bind(this)
        );
        disposables.push(openSettingsDisposable);

        // Register the setup project command
        const setupProjectDisposable = vscode.commands.registerCommand(
            'code-context-engine.setupProject',
            this.handleSetupProject.bind(this)
        );
        disposables.push(setupProjectDisposable);

        // Register the open diagnostics command
        const openDiagnosticsDisposable = vscode.commands.registerCommand(
            'code-context-engine.openDiagnostics',
            this.handleOpenDiagnostics.bind(this)
        );
        disposables.push(openDiagnosticsDisposable);

        console.log('CommandManager: All commands registered successfully');
        return disposables;
    }

    /**
     * Handles the 'code-context-engine.openMainPanel' command
     * Opens the main Code Context Engine panel using WebviewManager
     */
    private async handleOpenMainPanel(): Promise<void> {
        try {
            console.log('CommandManager: Opening main panel...');

            this.webviewManager.showMainPanel();

            console.log('CommandManager: Main panel opened successfully');
        } catch (error) {
            console.error('CommandManager: Failed to open main panel:', error);
            vscode.window.showErrorMessage('Failed to open Code Context Engine panel');
        }
    }

    /**
     * Handles the 'code-context-engine.startIndexing' command
     * Starts the indexing process for the current workspace
     */
    private async handleStartIndexing(): Promise<void> {
        try {
            console.log('CommandManager: Starting indexing...');

            if (!this.indexingService) {
                throw new Error('IndexingService not available');
            }

            // Check if workspace is available
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace folder is open. Please open a folder to index.');
                return;
            }

            // Show progress notification
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Code Context Engine',
                cancellable: false
            }, async (progress) => {
                progress.report({ message: 'Starting indexing process...' });

                // Start the indexing process
                const result = await this.indexingService.startIndexing((progressInfo) => {
                    progress.report({ 
                        message: `${progressInfo.currentPhase}: ${progressInfo.currentFile}`,
                        increment: (progressInfo.processedFiles / progressInfo.totalFiles) * 100
                    });
                });

                if (result.success) {
                    progress.report({ message: 'Indexing completed successfully!' });
                    vscode.window.showInformationMessage(
                        `Indexing completed! Processed ${result.processedFiles} files with ${result.chunks.length} code chunks.`
                    );
                } else {
                    throw new Error(`Indexing failed with ${result.errors.length} errors`);
                }
            });

            console.log('CommandManager: Indexing completed successfully');
        } catch (error) {
            console.error('CommandManager: Failed to start indexing:', error);
            vscode.window.showErrorMessage(`Failed to start indexing: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handles the 'code-context-engine.openSettings' command
     * Opens the native VS Code settings UI filtered for this extension
     */
    private async handleOpenSettings(): Promise<void> {
        try {
            console.log('CommandManager: Opening native settings...');

            // Open the native VS Code settings UI, filtered for this extension
            await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bramburn.code-context-engine');

            console.log('CommandManager: Native settings opened successfully');
        } catch (error) {
            console.error('CommandManager: Failed to open settings:', error);
            vscode.window.showErrorMessage('Failed to open Code Context Engine settings');
        }
    }

    /**
     * Handles the 'code-context-engine.setupProject' command
     * Opens the project setup wizard
     */
    private async handleSetupProject(): Promise<void> {
        try {
            console.log('CommandManager: Starting project setup...');

            // Check if workspace is available
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace folder is open. Please open a folder to setup.');
                return;
            }

            // For now, show a simple setup dialog
            const setupChoice = await vscode.window.showInformationMessage(
                'Welcome to Code Context Engine! Would you like to start indexing your project?',
                'Start Indexing',
                'Configure Settings',
                'Cancel'
            );

            switch (setupChoice) {
                case 'Start Indexing':
                    await this.handleStartIndexing();
                    break;
                case 'Configure Settings':
                    await this.handleOpenSettings();
                    break;
                default:
                    console.log('CommandManager: Project setup cancelled');
                    break;
            }

            console.log('CommandManager: Project setup completed');
        } catch (error) {
            console.error('CommandManager: Failed to setup project:', error);
            vscode.window.showErrorMessage('Failed to setup Code Context Engine project');
        }
    }

    /**
     * Handles the 'code-context-engine.openDiagnostics' command
     * Opens the diagnostics panel for testing connections and viewing system status
     */
    private async handleOpenDiagnostics(): Promise<void> {
        try {
            console.log('CommandManager: Opening diagnostics panel...');

            this.webviewManager.showDiagnosticsPanel();

            console.log('CommandManager: Diagnostics panel opened successfully');
        } catch (error) {
            console.error('CommandManager: Failed to open diagnostics panel:', error);
            vscode.window.showErrorMessage('Failed to open Code Context Engine diagnostics');
        }
    }
}
