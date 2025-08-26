/**
 * Code Context Engine Extension
 *
 * This is the main entry point for the VS Code extension that provides AI-powered
 * code context and search capabilities for your workspace. The extension manages
 * code indexing, semantic search, and provides an intuitive interface for
 * navigating and understanding codebases.
 */

import * as vscode from 'vscode';
import { ExtensionManager } from './extensionManager';

/**
 * Singleton class to manage extension state and resources
 *
 * This class implements the singleton pattern to ensure there's only one instance
 * of the extension state manager throughout the application lifecycle. It manages
 * the ExtensionManager instance and ensures proper cleanup of resources during
 * deactivation to prevent memory leaks.
 */
class ExtensionStateManager {
    // Static property to hold the single instance of the class
    private static instance: ExtensionStateManager;
    
    // Reference to the ExtensionManager that handles all extension services
    private extensionManager: ExtensionManager | null = null;

    /**
     * Private constructor to prevent direct instantiation of the class.
     * This enforces the singleton pattern by requiring use of getInstance().
     */
    private constructor() {}

    /**
     * Gets the singleton instance of ExtensionStateManager.
     * Creates a new instance if one doesn't exist yet.
     *
     * @returns {ExtensionStateManager} The singleton instance
     */
    static getInstance(): ExtensionStateManager {
        if (!ExtensionStateManager.instance) {
            ExtensionStateManager.instance = new ExtensionStateManager();
        }
        return ExtensionStateManager.instance;
    }

    /**
     * Sets the ExtensionManager instance.
     * This method is called during extension activation to store the manager
     * that handles all extension services and commands.
     *
     * @param {ExtensionManager} manager - The ExtensionManager instance to store
     */
    setExtensionManager(manager: ExtensionManager): void {
        this.extensionManager = manager;
    }

    /**
     * Gets the stored ExtensionManager instance.
     * This allows other parts of the extension to access the manager
     * for accessing services and commands.
     *
     * @returns {ExtensionManager | null} The ExtensionManager instance or null if not set
     */
    getExtensionManager(): ExtensionManager | null {
        return this.extensionManager;
    }

    /**
     * Disposes of all resources held by the ExtensionManager.
     * This method is called during extension deactivation to ensure
     * proper cleanup and prevent memory leaks.
     */
    dispose(): void {
        if (this.extensionManager) {
            // Dispose the ExtensionManager which will clean up all its resources
            this.extensionManager.dispose();
            // Set to null to prevent further access after disposal
            this.extensionManager = null;
        }
    }
}

// Global extension state manager instance
// This provides a single point of access to the extension state throughout the codebase
const extensionState = ExtensionStateManager.getInstance();

/**
 * Extension activation point
 *
 * This function is called by VS Code when the extension is activated. It initializes
 * all necessary components, sets up the ExtensionManager, and handles any initialization
 * errors that might occur.
 *
 * @param {vscode.ExtensionContext} context - The extension context provided by VS Code
 * @returns {Promise<void>} A promise that resolves when activation is complete
 * @throws {Error} Throws an error if initialization fails
 */
export async function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "code-context-engine" is now active!');

    try {
        // Initialize ExtensionManager and all services
        // The ExtensionManager is responsible for coordinating all extension services
        const manager = new ExtensionManager(context);
        
        // Asynchronously initialize all services and register commands
        await manager.initialize();
        
        // Store the manager in the state manager for global access
        extensionState.setExtensionManager(manager);
        console.log('ExtensionManager initialized successfully');
        
        // All commands are now registered through the ExtensionManager's CommandManager
        // All webview management is handled through the WebviewManager
        // All message routing is handled through the MessageRouter
        
    } catch (error) {
        // Log detailed error information for debugging
        console.error('Failed to initialize ExtensionManager:', error);
        
        // Show user-friendly error message in the UI
        vscode.window.showErrorMessage('Code Context Engine failed to initialize. Please check the logs.');
        
        // Re-throw the error to ensure VS Code is aware of the activation failure
        throw error;
    }
}

/**
 * Extension deactivation point
 *
 * This function is called by VS Code when the extension is deactivated. It ensures
 * proper cleanup of all resources by disposing the ExtensionManager through the
 * state manager. This prevents memory leaks and ensures a clean shutdown.
 */
export function deactivate() {
    // Use the state manager to clean up all resources
    // This will trigger the dispose() method of ExtensionStateManager
    extensionState.dispose();
}
