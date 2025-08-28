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
    } catch (error) {
        console.error('Failed to initialize ExtensionManager:', error);
        vscode.window.showErrorMessage('Code Context Engine failed to initialize. Please check the logs.');
        throw error;
    }
}

export function deactivate() {
    extensionState.dispose();
}
