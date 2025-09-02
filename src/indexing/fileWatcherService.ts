/**
 * FileWatcherService - Automatic file system monitoring for incremental indexing
 * 
 * This service implements real-time file system monitoring to automatically update
 * the search index when files are created, modified, or deleted. It provides
 * debounced event handling to prevent excessive indexing during rapid file changes.
 * 
 * Key features:
 * - VS Code FileSystemWatcher integration
 * - Debounced change handling to prevent event storms
 * - Automatic index updates for file changes
 * - File deletion cleanup from index
 * - Integration with IndexingService
 */

import * as vscode from 'vscode';
import { IndexingService } from './indexingService';

/**
 * Configuration options for the file watcher
 */
interface FileWatcherConfig {
    /** Debounce delay in milliseconds to prevent event storms */
    debounceDelay: number;
    /** File patterns to watch */
    patterns: string[];
    /** Whether to ignore files in .gitignore */
    respectGitignore: boolean;
}

/**
 * Default configuration for the file watcher
 */
const DEFAULT_CONFIG: FileWatcherConfig = {
    debounceDelay: 500, // 500ms debounce
    patterns: ['**/*.{ts,js,tsx,jsx,py,java,cpp,c,h,hpp,cs,php,rb,go,rs,swift,kt,scala,clj,hs,ml,fs,vb,sql,html,css,scss,sass,less,vue,svelte,md,mdx,txt,json,yaml,yml,xml,toml,ini,cfg,conf}'],
    respectGitignore: true
};

/**
 * FileWatcherService class for monitoring file system changes and updating the index
 * 
 * This service sets up VS Code's FileSystemWatcher to monitor workspace changes
 * and automatically triggers indexing operations to keep the search index current.
 */
export class FileWatcherService implements vscode.Disposable {
    private watcher: vscode.FileSystemWatcher | null = null;
    private indexingService: IndexingService;
    private config: FileWatcherConfig;
    private disposables: vscode.Disposable[] = [];
    
    // Debouncing mechanism to prevent event storms
    private debounceTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private pendingChanges: Set<string> = new Set();

    /**
     * Creates a new FileWatcherService instance
     * 
     * @param indexingService - The indexing service to use for file operations
     * @param config - Optional configuration overrides
     */
    constructor(indexingService: IndexingService, config?: Partial<FileWatcherConfig>) {
        this.indexingService = indexingService;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Initializes the file watcher and starts monitoring for changes
     * 
     * This method sets up the VS Code FileSystemWatcher with the configured
     * file patterns and registers event handlers for file changes, creations,
     * and deletions.
     * 
     * @returns Promise that resolves when the watcher is successfully initialized
     */
    public async initialize(): Promise<void> {
        try {
            console.log('FileWatcherService: Initializing file system watcher...');
            
            // Create the file system watcher with all configured patterns
            const pattern = `{${this.config.patterns.join(',')}}`;
            this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
            
            // Register event handlers
            this.watcher.onDidChange(this.handleFileChange.bind(this));
            this.watcher.onDidCreate(this.handleFileCreate.bind(this));
            this.watcher.onDidDelete(this.handleFileDelete.bind(this));
            
            // Add the watcher to disposables
            this.disposables.push(this.watcher);
            
            console.log(`FileWatcherService: Initialized with pattern: ${pattern}`);
            console.log(`FileWatcherService: Debounce delay: ${this.config.debounceDelay}ms`);
            
        } catch (error) {
            console.error('FileWatcherService: Failed to initialize watcher:', error);
            throw new Error(`Failed to initialize file system watcher: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handles file change events with debouncing
     * 
     * @param uri - The URI of the changed file
     */
    private handleFileChange(uri: vscode.Uri): void {
        this.debounceFileOperation(uri, 'change');
    }

    /**
     * Handles file creation events with debouncing
     * 
     * @param uri - The URI of the created file
     */
    private handleFileCreate(uri: vscode.Uri): void {
        this.debounceFileOperation(uri, 'create');
    }

    /**
     * Handles file deletion events (no debouncing needed for deletions)
     * 
     * @param uri - The URI of the deleted file
     */
    private handleFileDelete(uri: vscode.Uri): void {
        // File deletions don't need debouncing as they're immediate
        this.processFileDelete(uri);
    }

    /**
     * Debounces file operations to prevent event storms during rapid changes
     * 
     * @param uri - The URI of the file
     * @param operation - The type of operation (change or create)
     */
    private debounceFileOperation(uri: vscode.Uri, operation: 'change' | 'create'): void {
        const filePath = uri.fsPath;
        
        // Clear existing timeout for this file
        const existingTimeout = this.debounceTimeouts.get(filePath);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        
        // Add to pending changes
        this.pendingChanges.add(filePath);
        
        // Set new timeout
        const timeout = setTimeout(() => {
            this.debounceTimeouts.delete(filePath);
            this.pendingChanges.delete(filePath);
            
            if (operation === 'change') {
                this.processFileChange(uri);
            } else {
                this.processFileCreate(uri);
            }
        }, this.config.debounceDelay);
        
        this.debounceTimeouts.set(filePath, timeout);
    }

    /**
     * Processes a file change by updating it in the index
     * 
     * @param uri - The URI of the changed file
     */
    private async processFileChange(uri: vscode.Uri): Promise<void> {
        try {
            console.log(`FileWatcherService: Processing file change: ${uri.fsPath}`);
            await this.indexingService.updateFileInIndex(uri);
            console.log(`FileWatcherService: Successfully updated file in index: ${uri.fsPath}`);
        } catch (error) {
            console.error(`FileWatcherService: Failed to update file in index: ${uri.fsPath}`, error);
        }
    }

    /**
     * Processes a file creation by adding it to the index
     * 
     * @param uri - The URI of the created file
     */
    private async processFileCreate(uri: vscode.Uri): Promise<void> {
        try {
            console.log(`FileWatcherService: Processing file creation: ${uri.fsPath}`);
            await this.indexingService.updateFileInIndex(uri);
            console.log(`FileWatcherService: Successfully added file to index: ${uri.fsPath}`);
        } catch (error) {
            console.error(`FileWatcherService: Failed to add file to index: ${uri.fsPath}`, error);
        }
    }

    /**
     * Processes a file deletion by removing it from the index
     * 
     * @param uri - The URI of the deleted file
     */
    private async processFileDelete(uri: vscode.Uri): Promise<void> {
        try {
            console.log(`FileWatcherService: Processing file deletion: ${uri.fsPath}`);
            await this.indexingService.removeFileFromIndex(uri);
            console.log(`FileWatcherService: Successfully removed file from index: ${uri.fsPath}`);
        } catch (error) {
            console.error(`FileWatcherService: Failed to remove file from index: ${uri.fsPath}`, error);
        }
    }

    /**
     * Gets the current status of the file watcher
     * 
     * @returns Object containing watcher status information
     */
    public getStatus(): { isActive: boolean; pendingChanges: number; watchedPatterns: string[] } {
        return {
            isActive: this.watcher !== null,
            pendingChanges: this.pendingChanges.size,
            watchedPatterns: this.config.patterns
        };
    }

    /**
     * Disposes of the file watcher and cleans up resources
     */
    public dispose(): void {
        console.log('FileWatcherService: Disposing file watcher...');
        
        // Clear all pending timeouts
        for (const timeout of this.debounceTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.debounceTimeouts.clear();
        this.pendingChanges.clear();
        
        // Dispose of all disposables
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        
        this.watcher = null;
        console.log('FileWatcherService: Disposed successfully');
    }
}
