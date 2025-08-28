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
import { WebviewManager } from './webviewManager';
import { NotificationService } from './notifications/notificationService';

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
    private webviewManager: WebviewManager;
    private notificationService: NotificationService;

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
     */
    constructor(indexingService: IndexingService, webviewManager: WebviewManager, notificationService: NotificationService) {
        this.indexingService = indexingService;
        this.webviewManager = webviewManager;
        this.notificationService = notificationService;
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

        console.log('CommandManager: All commands registered successfully');
        return disposables;
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
            console.log('CommandManager: Opening main panel...');

            // Check if workspace folders are available
            const folders = vscode.workspace.workspaceFolders;
            const isWorkspaceOpen = !!folders && folders.length > 0;

            // Delegate to WebviewManager to handle the actual panel creation and display
            // Pass the workspace state to the WebviewManager
            this.webviewManager.showMainPanel({ isWorkspaceOpen });

            console.log('CommandManager: Main panel opened successfully');
        } catch (error) {
            // Log detailed error for debugging purposes
            console.error('CommandManager: Failed to open main panel:', error);
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
            console.log('CommandManager: Starting indexing...');

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
                } else {
                    // Handle indexing failure with error details
                    throw new Error(`Indexing failed with ${result.errors.length} errors`);
                }
            });

            console.log('CommandManager: Indexing completed successfully');
        } catch (error) {
            // Log detailed error for debugging
            console.error('CommandManager: Failed to start indexing:', error);
            
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
            console.log('CommandManager: Opening settings panel...');

            // Use WebviewManager to show the settings panel
            // This creates a custom webview-based settings interface
            this.webviewManager.showSettingsPanel();

            console.log('CommandManager: Settings panel opened successfully');
        } catch (error) {
            // Log detailed error for debugging
            console.error('CommandManager: Failed to open settings panel:', error);
            // Show user-friendly error message
            vscode.window.showErrorMessage('Failed to open Code Context Engine settings panel');
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
}
