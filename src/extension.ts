/**
 * Code Context Engine Extension
 * 
 * This is the main entry point for the VS Code extension that provides AI-powered
 * code context and search capabilities for your workspace.
 */

import * as vscode from 'vscode';
import { ExtensionManager } from './extensionManager';

/**
 * Singleton class to manage extension state and resources
 * This ensures proper cleanup and prevents memory leaks
 */
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

    getExtensionManager(): ExtensionManager | null {
        return this.extensionManager;
    }

    dispose(): void {
        if (this.extensionManager) {
            this.extensionManager.dispose();
            this.extensionManager = null;
        }
    }
}

// Global extension state manager instance
const extensionState = ExtensionStateManager.getInstance();

/**
 * Extension activation point
 * 
 * This function is called when the extension is activated.
 * It initializes the ExtensionManager which handles all services and commands.
 */
export async function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "code-context-engine" is now active!');

    try {
        // Initialize ExtensionManager and all services
        const manager = new ExtensionManager(context);
        await manager.initialize();
        extensionState.setExtensionManager(manager);
        console.log('ExtensionManager initialized successfully');
        
        // All commands are now registered through the ExtensionManager's CommandManager
        // All webview management is handled through the WebviewManager
        // All message routing is handled through the MessageRouter
        
    } catch (error) {
        console.error('Failed to initialize ExtensionManager:', error);
        vscode.window.showErrorMessage('Code Context Engine failed to initialize. Please check the logs.');
        throw error;
    }
}

/**
 * Extension deactivation point
 *
 * This function is called when the extension is deactivated.
 * Properly disposes of the ExtensionManager and all its resources.
 */
export function deactivate() {
    // Use the state manager to clean up all resources
    extensionState.dispose();
}
