import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Interface representing a workspace folder with additional metadata
 */
export interface WorkspaceInfo {
    /** The workspace folder object from VS Code */
    folder: vscode.WorkspaceFolder;
    /** Unique identifier for this workspace */
    id: string;
    /** Display name for the workspace */
    name: string;
    /** Full path to the workspace root */
    path: string;
    /** Whether this is the currently active workspace */
    isActive: boolean;
}

/**
 * WorkspaceManager handles multi-workspace support for the Code Context Engine.
 * 
 * This manager provides functionality to:
 * - Detect and manage multiple workspace folders
 * - Switch between workspaces
 * - Generate workspace-specific identifiers
 * - Handle workspace change events
 * 
 * The manager ensures that each workspace has its own isolated index and
 * configuration, allowing users to work with multiple projects simultaneously
 * without interference.
 */
export class WorkspaceManager {
    /** Currently active workspace */
    private currentWorkspace: WorkspaceInfo | null = null;
    
    /** List of all available workspaces */
    private workspaces: WorkspaceInfo[] = [];
    
    /** Event listeners for workspace changes */
    private changeListeners: Array<(workspace: WorkspaceInfo | null) => void> = [];
    
    /** Disposables for cleanup */
    private disposables: vscode.Disposable[] = [];

    /**
     * Creates a new WorkspaceManager instance
     * 
     * Initializes the manager and sets up event listeners for workspace changes.
     * The manager will automatically detect the current workspace and any
     * workspace folder changes.
     */
    constructor() {
        this.setupEventListeners();
        this.refreshWorkspaces();
    }

    /**
     * Sets up event listeners for workspace changes
     * 
     * Listens for workspace folder changes and updates the internal
     * workspace list accordingly.
     */
    private setupEventListeners(): void {
        // Listen for workspace folder changes
        const workspaceFoldersChangeListener = vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.refreshWorkspaces();
        });
        
        this.disposables.push(workspaceFoldersChangeListener);
    }

    /**
     * Refreshes the list of available workspaces
     * 
     * Scans the current VS Code workspace folders and updates the internal
     * workspace list. This method is called automatically when workspace
     * folders change.
     */
    private refreshWorkspaces(): void {
        const workspaceFolders = vscode.workspace.workspaceFolders || [];
        
        this.workspaces = workspaceFolders.map((folder, index) => {
            const workspaceInfo: WorkspaceInfo = {
                folder,
                id: this.generateWorkspaceId(folder),
                name: folder.name,
                path: folder.uri.fsPath,
                isActive: false
            };
            
            return workspaceInfo;
        });

        // Set the first workspace as active if we don't have a current workspace
        if (this.workspaces.length > 0 && !this.currentWorkspace) {
            this.setActiveWorkspace(this.workspaces[0]);
        } else if (this.currentWorkspace) {
            // Update the current workspace reference if it still exists
            const updatedCurrent = this.workspaces.find(w => w.id === this.currentWorkspace!.id);
            if (updatedCurrent) {
                this.setActiveWorkspace(updatedCurrent);
            } else {
                // Current workspace was removed, switch to first available
                this.setActiveWorkspace(this.workspaces[0] || null);
            }
        }

        console.log(`WorkspaceManager: Refreshed workspaces, found ${this.workspaces.length} workspace(s)`);
    }

    /**
     * Generates a unique identifier for a workspace
     * 
     * Creates a stable, unique identifier based on the workspace path.
     * This identifier is used for collection naming and workspace tracking.
     * 
     * @param folder - The workspace folder to generate an ID for
     * @returns A unique identifier string
     */
    private generateWorkspaceId(folder: vscode.WorkspaceFolder): string {
        // Use the folder name and a hash of the path for uniqueness
        const folderName = folder.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const pathHash = this.simpleHash(folder.uri.fsPath);
        return `${folderName}_${pathHash}`;
    }

    /**
     * Simple hash function for generating workspace identifiers
     * 
     * @param str - String to hash
     * @returns A simple hash as a string
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Sets the active workspace
     * 
     * Changes the currently active workspace and notifies all listeners
     * of the change. This triggers index switching and UI updates.
     * 
     * @param workspace - The workspace to set as active, or null for no workspace
     */
    public setActiveWorkspace(workspace: WorkspaceInfo | null): void {
        // Update active flags
        this.workspaces.forEach(w => w.isActive = false);
        
        if (workspace) {
            workspace.isActive = true;
        }
        
        this.currentWorkspace = workspace;
        
        // Notify listeners of the change
        this.changeListeners.forEach(listener => {
            try {
                listener(workspace);
            } catch (error) {
                console.error('WorkspaceManager: Error in change listener:', error);
            }
        });

        console.log(`WorkspaceManager: Active workspace changed to: ${workspace?.name || 'none'}`);
    }

    /**
     * Gets the currently active workspace
     * 
     * @returns The current workspace info or null if no workspace is active
     */
    public getCurrentWorkspace(): WorkspaceInfo | null {
        return this.currentWorkspace;
    }

    /**
     * Gets all available workspaces
     * 
     * @returns Array of all workspace information objects
     */
    public getAllWorkspaces(): WorkspaceInfo[] {
        return [...this.workspaces]; // Return a copy to prevent external modification
    }

    /**
     * Gets a workspace by its ID
     * 
     * @param id - The workspace ID to search for
     * @returns The workspace info or null if not found
     */
    public getWorkspaceById(id: string): WorkspaceInfo | null {
        return this.workspaces.find(w => w.id === id) || null;
    }

    /**
     * Switches to a workspace by ID
     * 
     * @param id - The ID of the workspace to switch to
     * @returns True if the switch was successful, false if workspace not found
     */
    public switchToWorkspace(id: string): boolean {
        const workspace = this.getWorkspaceById(id);
        if (workspace) {
            this.setActiveWorkspace(workspace);
            return true;
        }
        return false;
    }

    /**
     * Adds a listener for workspace changes
     * 
     * @param listener - Function to call when the active workspace changes
     * @returns Disposable to remove the listener
     */
    public onWorkspaceChanged(listener: (workspace: WorkspaceInfo | null) => void): vscode.Disposable {
        this.changeListeners.push(listener);
        
        return {
            dispose: () => {
                const index = this.changeListeners.indexOf(listener);
                if (index >= 0) {
                    this.changeListeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Generates a collection name for the current workspace
     * 
     * Creates a unique collection name that includes the workspace identifier.
     * This ensures that each workspace has its own isolated index.
     * 
     * @returns A unique collection name for the current workspace
     */
    public generateCollectionName(): string {
        if (!this.currentWorkspace) {
            return 'code_context_default';
        }
        
        return `code_context_${this.currentWorkspace.id}`;
    }

    /**
     * Checks if there are multiple workspaces available
     * 
     * @returns True if there are multiple workspaces, false otherwise
     */
    public hasMultipleWorkspaces(): boolean {
        return this.workspaces.length > 1;
    }

    /**
     * Gets workspace statistics
     * 
     * @returns Object containing workspace count and current workspace info
     */
    public getWorkspaceStats(): { total: number; current: string | null } {
        return {
            total: this.workspaces.length,
            current: this.currentWorkspace?.name || null
        };
    }

    /**
     * Disposes of the WorkspaceManager and cleans up resources
     * 
     * This method should be called when the WorkspaceManager is no longer needed
     * to prevent memory leaks.
     */
    public dispose(): void {
        // Dispose all event listeners
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
        
        // Clear listeners
        this.changeListeners = [];
        
        console.log('WorkspaceManager: Disposed successfully');
    }
}
