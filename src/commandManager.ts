/**
 * CommandManager.ts - Central Command Management for Code Context Engine Extension
 *
 * This file serves as the command registration and handling hub for the VS Code extension.
 * It implements a clean separation of concerns by centralizing all command-related logic
 * in one place, making it easier to maintain and extend the extension's functionality.
 *
 * Key Responsibilities:
 * - Command registration with VS Code's command system
 * - Command callback implementations with proper error handling
 * - Integration with core services (IndexingService, WebviewManager)
 * - Resource management through proper disposal of command registrations
 * - User feedback through notifications and progress indicators
 *
 * Architecture:
 * This class follows the singleton pattern within the extension lifecycle and is
 * instantiated during extension activation. It depends on other core services
 * which are injected via the constructor, following dependency injection principles.
 */

import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';
import { IIndexingService } from './services/IndexingService';
import { WebviewManager } from './webviewManager';
import { NotificationService } from './notifications/notificationService';
import { CentralizedLoggingService } from './logging/centralizedLoggingService';

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
 * - User feedback and error handling
 * - Progress reporting for long-running operations
 */
export class CommandManager {
    // Service dependencies injected via constructor
    private indexingService: IndexingService;
    private enhancedIndexingService?: IIndexingService;
    private webviewManager: WebviewManager;
    private notificationService: NotificationService;
    private loggingService: CentralizedLoggingService;

    /**
     * Creates a new CommandManager instance
     *
     * The constructor follows dependency injection pattern, receiving instances of
     * required services. This approach promotes loose coupling and testability.
     *
     * @param indexingService - The IndexingService instance for handling indexing commands
     *                         and file processing operations
     * @param webviewManager - The WebviewManager instance for handling webview operations
     *                        and UI panel management
     * @param notificationService - The NotificationService instance for user notifications
     * @param loggingService - The CentralizedLoggingService instance for logging
     */
    constructor(
        indexingService: IndexingService,
        webviewManager: WebviewManager,
        notificationService: NotificationService,
        loggingService: CentralizedLoggingService
    ) {
        this.indexingService = indexingService;
        this.webviewManager = webviewManager;
        this.notificationService = notificationService;
        this.loggingService = loggingService;
    }

    /**
     * Sets the enhanced indexing service for pause/resume functionality
     *
     * @param enhancedIndexingService - The enhanced IndexingService instance
     */
    setEnhancedIndexingService(enhancedIndexingService: IIndexingService): void {
        this.enhancedIndexingService = enhancedIndexingService;
    }

    /**
     * Registers all extension commands and returns their disposables
     *
     * This method is called during extension activation to register all commands
     * that the extension responds to. Each command is registered with a unique
     * identifier and a callback handler method.
     *
     * The method returns an array of Disposable objects that should be disposed
     * during extension deactivation to clean up resources and prevent memory leaks.
     *
     * Registered Commands:
     * - code-context-engine.openMainPanel: Opens the main extension panel
     * - code-context-engine.startIndexing: Initiates the code indexing process
     * - code-context-engine.openSettings: Opens extension settings
     * - code-context-engine.setupProject: Launches the project setup wizard
     * - code-context-engine.openDiagnostics: Opens the diagnostics panel
     *
     * @returns Array of disposables for the registered commands
     */
    registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Register the main panel command - primary entry point for the extension UI
        const openMainPanelDisposable = vscode.commands.registerCommand(
            'code-context-engine.openMainPanel',
            this.handleOpenMainPanel.bind(this)
        );
        disposables.push(openMainPanelDisposable);

        // Register the start indexing command - triggers the code analysis and indexing process
        const startIndexingDisposable = vscode.commands.registerCommand(
            'code-context-engine.startIndexing',
            this.handleStartIndexing.bind(this)
        );
        disposables.push(startIndexingDisposable);

        // Register the open settings command - provides access to extension configuration
        const openSettingsDisposable = vscode.commands.registerCommand(
            'code-context-engine.openSettings',
            this.handleOpenSettings.bind(this)
        );
        disposables.push(openSettingsDisposable);

        // Register the setup project command - guides users through initial project configuration
        const setupProjectDisposable = vscode.commands.registerCommand(
            'code-context-engine.setupProject',
            this.handleSetupProject.bind(this)
        );
        disposables.push(setupProjectDisposable);

        // Register the open diagnostics command - provides system status and troubleshooting
        const openDiagnosticsDisposable = vscode.commands.registerCommand(
            'code-context-engine.openDiagnostics',
            this.handleOpenDiagnostics.bind(this)
        );
        disposables.push(openDiagnosticsDisposable);

        // Register enhanced indexing control commands
        const pauseIndexingDisposable = vscode.commands.registerCommand(
            'bigcontext.pauseIndexing',
            this.handlePauseIndexing.bind(this)
        );
        disposables.push(pauseIndexingDisposable);

        const resumeIndexingDisposable = vscode.commands.registerCommand(
            'bigcontext.resumeIndexing',
            this.handleResumeIndexing.bind(this)
        );
        disposables.push(resumeIndexingDisposable);

        const showIndexingStatusDisposable = vscode.commands.registerCommand(
            'bigcontext.showIndexingStatus',
            this.handleShowIndexingStatus.bind(this)
        );
        disposables.push(showIndexingStatusDisposable);

        const triggerFullReindexDisposable = vscode.commands.registerCommand(
            'bigcontext.triggerFullReindex',
            this.handleTriggerFullReindex.bind(this)
        );
        disposables.push(triggerFullReindexDisposable);

        this.loggingService.info('All commands registered successfully', {
            commandCount: disposables.length
        }, 'CommandManager');
        return disposables;
    }

    /**
     * Checks workspace availability with retry logic
     *
     * This method handles timing issues where VS Code might not have fully
     * initialized workspace folders when the extension starts. It retries
     * workspace detection with a small delay to ensure accurate results.
     *
     * @returns Promise<boolean> - True if workspace folders are available
     */
    private async checkWorkspaceWithRetry(): Promise<boolean> {
        const maxRetries = 5;
        const retryDelay = 200; // 200ms delay between retries

        console.log('CommandManager: Starting workspace detection with retry logic...');

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const folders = vscode.workspace.workspaceFolders;
            const isWorkspaceOpen = !!folders && folders.length > 0;

            console.log(`CommandManager: Attempt ${attempt + 1}/${maxRetries}:`);
            console.log(`  - workspaceFolders:`, folders);
            console.log(`  - folders length:`, folders?.length || 0);
            console.log(`  - isWorkspaceOpen:`, isWorkspaceOpen);

            if (isWorkspaceOpen || attempt === maxRetries - 1) {
                console.log(`CommandManager: Final result - workspace open: ${isWorkspaceOpen}`);
                return isWorkspaceOpen;
            }

            console.log(`CommandManager: Retrying in ${retryDelay}ms...`);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        return false;
    }

    /**
     * Handles the 'code-context-engine.openMainPanel' command
     *
     * This command serves as the primary entry point to the extension's user interface.
     * It delegates to the WebviewManager to display the main panel where users can
     * interact with the Code Context Engine features.
     *
     * Error Handling:
     * - Catches and logs any exceptions during panel opening
     * - Shows user-friendly error message via VS Code notification system
     *
     * @returns Promise that resolves when the panel is opened or rejects on error
     */
    private async handleOpenMainPanel(): Promise<void> {
        try {
            this.loggingService.info('Opening main panel', {}, 'CommandManager');

            // Check if workspace folders are available with retry logic for timing issues
            const isWorkspaceOpen = await this.checkWorkspaceWithRetry();

            // Delegate to WebviewManager to handle the actual panel creation and display
            // Pass the workspace state to the WebviewManager
            this.webviewManager.showMainPanel({ isWorkspaceOpen });

            this.loggingService.info('Main panel opened successfully', {
                isWorkspaceOpen
            }, 'CommandManager');
        } catch (error) {
            // Log detailed error for debugging purposes
            this.loggingService.error('Failed to open main panel', {
                error: error instanceof Error ? error.message : String(error)
            }, 'CommandManager');
            // Show user-friendly error message
            this.notificationService.error('Failed to open Code Context Engine panel');
        }
    }

    /**
     * Handles the 'code-context-engine.startIndexing' command
     *
     * This is a complex command that initiates the code indexing process. It:
     * 1. Validates prerequisites (service availability, workspace folder)
     * 2. Shows progress notification to keep users informed
     * 3. Delegates to IndexingService for the actual indexing work
     * 4. Provides real-time progress updates during indexing
     * 5. Shows completion status with statistics
     *
     * The indexing process can be lengthy, so it's important to provide good
     * user feedback throughout the operation.
     *
     * Error Handling:
     * - Validates service availability before starting
     * - Checks for workspace folder existence
     * - Handles indexing errors gracefully
     * - Provides detailed error messages to users
     *
     * @returns Promise that resolves when indexing completes or rejects on error
     */
    private async handleStartIndexing(): Promise<void> {
        try {
            this.loggingService.info('Starting indexing via command', {}, 'CommandManager');

            // Validate that the indexing service is available
            if (!this.indexingService) {
                throw new Error('IndexingService not available');
            }

            // Check if workspace is available - indexing requires a workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                this.notificationService.warning('No workspace folder is open. Please open a folder to index.');
                return;
            }

            // Use VS Code's progress API to show a non-cancellable progress notification
            // This provides better UX than a simple message for long-running operations
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Code Context Engine',
                cancellable: false  // Indexing shouldn't be interrupted once started
            }, async (progress) => {
                // Initial progress message
                progress.report({ message: 'Starting indexing process...' });

                // Start the indexing process with a progress callback
                // The callback will be invoked periodically to update the progress UI
                const result = await this.indexingService.startIndexing((progressInfo) => {
                    // Calculate progress percentage based on processed vs total files
                    const progressPercentage = (progressInfo.processedFiles / progressInfo.totalFiles) * 100;

                    // Update progress with current phase and file being processed
                    progress.report({
                        message: `${progressInfo.currentPhase}: ${progressInfo.currentFile}`,
                        increment: progressPercentage
                    });
                });

                // Handle indexing completion
                if (result.success) {
                    // Show final success message
                    progress.report({ message: 'Indexing completed successfully!' });

                    // Show detailed completion statistics in an information message
                    this.notificationService.success(
                        `Indexing completed! Processed ${result.processedFiles} files with ${result.chunks.length} code chunks.`
                    );

                    // Open the main panel and trigger first-run guidance
                    const isWorkspaceOpen = !!vscode.workspace.workspaceFolders?.length;
                    this.webviewManager.showMainPanel({ isWorkspaceOpen });
                    // Switch to the query view and mark first run complete in the webview
                    this.webviewManager.postMessage('codeContextMain', { type: 'changeView', view: 'query' });
                    this.webviewManager.postMessage('codeContextMain', { type: 'firstRunComplete' });
                } else {
                    // Handle indexing failure with error details
                    throw new Error(`Indexing failed with ${result.errors.length} errors`);
                }
            });

            this.loggingService.info('Indexing completed successfully via command', {}, 'CommandManager');
        } catch (error) {
            // Log detailed error for debugging
            this.loggingService.error('Failed to start indexing via command', {
                error: error instanceof Error ? error.message : String(error)
            }, 'CommandManager');

            // Show user-friendly error message with error details
            vscode.window.showErrorMessage(`Failed to start indexing: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handles the 'code-context-engine.openSettings' command
     *
     * This command provides access to the extension's configuration settings
     * through a dedicated webview panel. It uses the WebviewManager to create
     * and manage a settings panel with a custom interface.
     *
     * The command uses WebviewManager.showSettingsPanel() to create a custom
     * webview-based settings interface with single-instance management.
     *
     * Error Handling:
     * - Catches and logs any exceptions during settings panel creation
     * - Shows user-friendly error message via VS Code notification system
     *
     * @returns Promise that resolves when settings panel is opened or rejects on error
     */
    private async handleOpenSettings(): Promise<void> {
        try {
            console.log('CommandManager: Opening native VS Code settings for Code Context Engine...');

            // Open VS Code Settings scoped to this extension (aligns with PRD)
            await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:icelabz.code-context-engine');
        } catch (error) {
            // Log detailed error for debugging
            console.error('CommandManager: Failed to open settings:', error);
            // Show user-friendly error message
            vscode.window.showErrorMessage('Failed to open Code Context Engine settings');
        }
    }

    /**
     * Handles the 'code-context-engine.setupProject' command
     *
     * This command serves as an onboarding wizard for new users or projects.
     * It guides users through the initial setup process by presenting options
     * for common first-time tasks.
     *
     * Current Implementation:
     * - Validates workspace availability
     * - Shows a welcome message with action choices
     * - Routes to appropriate commands based on user selection
     *
     * Future Enhancements:
     * - Multi-step setup wizard
     * - Project type detection and configuration
     * - Integration with project templates
     *
     * Error Handling:
     * - Validates workspace folder existence
     * - Handles user cancellation gracefully
     * - Provides error feedback for setup failures
     *
     * @returns Promise that resolves when setup is completed or rejects on error
     */
    private async handleSetupProject(): Promise<void> {
        try {
            console.log('CommandManager: Starting project setup...');

            // Check if workspace is available - setup requires a workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace folder is open. Please open a folder to setup.');
                return;
            }

            // Show a simple setup dialog with common first-time actions
            // This is a basic implementation that could be expanded into a full wizard
            const setupChoice = await vscode.window.showInformationMessage(
                'Welcome to Code Context Engine! Would you like to start indexing your project?',
                'Start Indexing',
                'Configure Settings',
                'Cancel'
            );

            // Route to appropriate command based on user selection
            switch (setupChoice) {
                case 'Start Indexing':
                    // Delegate to the indexing command handler
                    await this.handleStartIndexing();
                    break;
                case 'Configure Settings':
                    // Delegate to the settings command handler
                    await this.handleOpenSettings();
                    break;
                default:
                    // User cancelled or dismissed the dialog
                    console.log('CommandManager: Project setup cancelled');
                    break;
            }

            console.log('CommandManager: Project setup completed');
        } catch (error) {
            // Log detailed error for debugging
            console.error('CommandManager: Failed to setup project:', error);
            // Show user-friendly error message
            vscode.window.showErrorMessage('Failed to setup Code Context Engine project');
        }
    }

    /**
     * Handles the 'code-context-engine.openDiagnostics' command
     *
     * This command provides access to the diagnostics panel, which offers:
     * - System status information
     * - Connection testing capabilities
     * - Performance metrics
     * - Troubleshooting tools
     *
     * The diagnostics panel is implemented as a webview and managed by the
     * WebviewManager, following the same pattern as other UI panels.
     *
     * Error Handling:
     * - Catches and logs any exceptions during diagnostics panel opening
     * - Shows user-friendly error message via VS Code notification system
     *
     * @returns Promise that resolves when diagnostics panel is opened or rejects on error
     */
    private async handleOpenDiagnostics(): Promise<void> {
        try {
            console.log('CommandManager: Opening diagnostics panel...');

            // Delegate to WebviewManager to handle the diagnostics panel creation and display
            this.webviewManager.showDiagnosticsPanel();

            console.log('CommandManager: Diagnostics panel opened successfully');
        } catch (error) {
            // Log detailed error for debugging
            console.error('CommandManager: Failed to open diagnostics panel:', error);
            // Show user-friendly error message
            vscode.window.showErrorMessage('Failed to open Code Context Engine diagnostics');
        }
    }

    /**
     * Handles the pause indexing command
     *
     * Pauses the current indexing process if it's running.
     * Shows appropriate user feedback based on the current state.
     */
    private async handlePauseIndexing(): Promise<void> {
        try {
            console.log('CommandManager: Pausing indexing...');

            if (!this.enhancedIndexingService) {
                vscode.window.showWarningMessage('Enhanced indexing service not available');
                return;
            }

            const currentState = await this.enhancedIndexingService.getIndexState();

            if (currentState !== 'indexing') {
                vscode.window.showInformationMessage('No active indexing process to pause');
                return;
            }

            await this.enhancedIndexingService.pauseIndexing();
            vscode.window.showInformationMessage('Indexing paused successfully');

        } catch (error) {
            console.error('CommandManager: Error pausing indexing:', error);
            vscode.window.showErrorMessage(`Failed to pause indexing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handles the resume indexing command
     *
     * Resumes a paused indexing process.
     * Shows appropriate user feedback based on the current state.
     */
    private async handleResumeIndexing(): Promise<void> {
        try {
            console.log('CommandManager: Resuming indexing...');

            if (!this.enhancedIndexingService) {
                vscode.window.showWarningMessage('Enhanced indexing service not available');
                return;
            }

            const currentState = await this.enhancedIndexingService.getIndexState();

            if (currentState !== 'paused') {
                vscode.window.showInformationMessage('No paused indexing process to resume');
                return;
            }

            await this.enhancedIndexingService.resumeIndexing();
            vscode.window.showInformationMessage('Indexing resumed successfully');

        } catch (error) {
            console.error('CommandManager: Error resuming indexing:', error);
            vscode.window.showErrorMessage(`Failed to resume indexing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handles the show indexing status command
     *
     * Displays detailed information about the current indexing state.
     */
    private async handleShowIndexingStatus(): Promise<void> {
        try {
            console.log('CommandManager: Showing indexing status...');

            if (!this.enhancedIndexingService) {
                vscode.window.showWarningMessage('Enhanced indexing service not available');
                return;
            }

            const currentState = await this.enhancedIndexingService.getIndexState();

            let message: string;
            let actions: string[] = [];

            switch (currentState) {
                case 'idle':
                    message = 'Indexing is complete and ready for search';
                    actions = ['Start Reindexing'];
                    break;
                case 'indexing':
                    message = 'Indexing is currently in progress';
                    actions = ['Pause Indexing'];
                    break;
                case 'paused':
                    message = 'Indexing is paused and can be resumed';
                    actions = ['Resume Indexing', 'Stop Indexing'];
                    break;
                case 'error':
                    message = 'Indexing encountered an error';
                    actions = ['Retry Indexing', 'View Logs'];
                    break;
                default:
                    message = `Unknown indexing state: ${currentState}`;
                    actions = ['Refresh Status'];
            }

            const action = await vscode.window.showInformationMessage(message, ...actions);

            // Handle user action
            switch (action) {
                case 'Start Reindexing':
                case 'Retry Indexing':
                    await this.handleTriggerFullReindex();
                    break;
                case 'Pause Indexing':
                    await this.handlePauseIndexing();
                    break;
                case 'Resume Indexing':
                    await this.handleResumeIndexing();
                    break;
                case 'View Logs':
                    vscode.commands.executeCommand('workbench.action.toggleDevTools');
                    break;
                case 'Refresh Status':
                    await this.handleShowIndexingStatus();
                    break;
            }

        } catch (error) {
            console.error('CommandManager: Error showing indexing status:', error);
            vscode.window.showErrorMessage(`Failed to get indexing status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handles the trigger full reindex command
     *
     * Starts a complete reindexing of the workspace.
     */
    private async handleTriggerFullReindex(): Promise<void> {
        try {
            console.log('CommandManager: Triggering full reindex...');

            if (!this.enhancedIndexingService) {
                vscode.window.showWarningMessage('Enhanced indexing service not available');
                return;
            }

            const confirmation = await vscode.window.showWarningMessage(
                'This will reindex all files in the workspace. Continue?',
                'Yes, Reindex',
                'Cancel'
            );

            if (confirmation !== 'Yes, Reindex') {
                return;
            }

            await this.enhancedIndexingService.triggerFullReindex();
            vscode.window.showInformationMessage('Full reindexing started');

        } catch (error) {
            console.error('CommandManager: Error triggering full reindex:', error);
            vscode.window.showErrorMessage(`Failed to start reindexing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
