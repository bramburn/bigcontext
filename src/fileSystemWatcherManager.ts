/**
 * File System Watcher Manager
 * 
 * This module provides automatic indexing capabilities by monitoring file system changes
 * in the workspace. It uses VS Code's FileSystemWatcher to detect file changes, creations,
 * and deletions, then triggers appropriate indexing operations to keep the search index
 * up-to-date in real-time.
 * 
 * Key features:
 * - Debounced file change handling to prevent excessive indexing during rapid changes
 * - Support for multiple file types (TypeScript, JavaScript, Python, Markdown, etc.)
 * - Automatic cleanup of deleted files from the index
 * - Integration with IndexingService for seamless index updates
 */

import * as vscode from 'vscode';
import { IndexingService } from './indexing/indexingService';

/**
 * Configuration for file system watching behavior
 */
interface WatcherConfig {
    /** File patterns to watch (glob patterns) */
    patterns: string[];
    /** Debounce delay in milliseconds for file change events */
    debounceDelay: number;
    /** Whether to watch for file creation events */
    watchCreation: boolean;
    /** Whether to watch for file modification events */
    watchModification: boolean;
    /** Whether to watch for file deletion events */
    watchDeletion: boolean;
}

/**
 * Statistics for file system watcher operations
 */
interface WatcherStats {
    /** Total number of file change events processed */
    totalChanges: number;
    /** Total number of file creation events processed */
    totalCreations: number;
    /** Total number of file deletion events processed */
    totalDeletions: number;
    /** Number of events currently being debounced */
    pendingEvents: number;
    /** Timestamp of last processed event */
    lastEventTime: Date | null;
}

/**
 * Manager class for handling file system watching and automatic indexing
 * 
 * This class encapsulates all file system watching logic and provides a clean
 * interface for monitoring workspace changes. It integrates with the IndexingService
 * to ensure that the search index stays synchronized with file system changes.
 */
export class FileSystemWatcherManager implements vscode.Disposable {
    private watcher: vscode.FileSystemWatcher | null = null;
    private indexingService: IndexingService;
    private config: WatcherConfig;
    private stats: WatcherStats;
    
    // Debouncing mechanism
    private debounceTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private pendingChanges: Set<string> = new Set();
    
    // Disposables for cleanup
    private disposables: vscode.Disposable[] = [];

    /**
     * Creates a new FileSystemWatcherManager instance
     * 
     * @param indexingService - The IndexingService instance to use for index updates
     * @param config - Optional configuration for watcher behavior
     */
    constructor(indexingService: IndexingService, config?: Partial<WatcherConfig>) {
        this.indexingService = indexingService;
        
        // Set up default configuration
        this.config = {
            patterns: [
                '**/*.{ts,tsx,js,jsx}',  // TypeScript and JavaScript files
                '**/*.{py,pyx,pyi}',     // Python files
                '**/*.{md,mdx}',         // Markdown files
                '**/*.{json,jsonc}',     // JSON files
                '**/*.{yaml,yml}',       // YAML files
                '**/*.{xml,html,htm}',   // Markup files
                '**/*.{css,scss,sass}',  // Stylesheet files
                '**/*.{sql,sqlite}',     // SQL files
                '**/*.{sh,bash,zsh}',    // Shell scripts
                '**/*.{go,rs,cpp,c,h}',  // Other programming languages
            ],
            debounceDelay: 1000,         // 1 second debounce
            watchCreation: true,
            watchModification: true,
            watchDeletion: true,
            ...config
        };

        // Initialize statistics
        this.stats = {
            totalChanges: 0,
            totalCreations: 0,
            totalDeletions: 0,
            pendingEvents: 0,
            lastEventTime: null
        };
    }

    /**
     * Initializes the file system watcher and starts monitoring for changes
     * 
     * This method sets up the VS Code FileSystemWatcher with the configured
     * file patterns and registers event handlers for file changes, creations,
     * and deletions.
     * 
     * @returns Promise that resolves when the watcher is successfully initialized
     */
    public async initialize(): Promise<void> {
        try {
            console.log('FileSystemWatcherManager: Initializing file system watcher...');
            
            // Create the file system watcher with all configured patterns
            const pattern = `{${this.config.patterns.join(',')}}`;
            this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
            
            // Register event handlers based on configuration
            if (this.config.watchCreation) {
                const createDisposable = this.watcher.onDidCreate(uri => this.handleFileCreate(uri));
                this.disposables.push(createDisposable);
            }
            
            if (this.config.watchModification) {
                const changeDisposable = this.watcher.onDidChange(uri => this.handleFileChange(uri));
                this.disposables.push(changeDisposable);
            }
            
            if (this.config.watchDeletion) {
                const deleteDisposable = this.watcher.onDidDelete(uri => this.handleFileDelete(uri));
                this.disposables.push(deleteDisposable);
            }
            
            // Add the watcher itself to disposables
            this.disposables.push(this.watcher);
            
            console.log(`FileSystemWatcherManager: Initialized with pattern: ${pattern}`);
            console.log(`FileSystemWatcherManager: Watching ${this.config.patterns.length} file patterns`);
            console.log(`FileSystemWatcherManager: Debounce delay: ${this.config.debounceDelay}ms`);
            
        } catch (error) {
            console.error('FileSystemWatcherManager: Failed to initialize watcher:', error);
            throw new Error(`Failed to initialize file system watcher: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handles file creation events
     * 
     * When a new file is created, this method triggers indexing of the new file
     * to ensure it becomes searchable immediately.
     * 
     * @param uri - The URI of the created file
     */
    private async handleFileCreate(uri: vscode.Uri): Promise<void> {
        try {
            console.log(`FileSystemWatcherManager: File created: ${uri.fsPath}`);
            this.stats.totalCreations++;
            this.stats.lastEventTime = new Date();
            
            // For file creation, we can process immediately since it's a new file
            await this.indexingService.updateFileInIndex(uri);
            
            console.log(`FileSystemWatcherManager: Successfully indexed new file: ${uri.fsPath}`);
        } catch (error) {
            console.error(`FileSystemWatcherManager: Failed to index created file ${uri.fsPath}:`, error);
        }
    }

    /**
     * Handles file change events with debouncing
     * 
     * When a file is modified, this method uses debouncing to prevent excessive
     * indexing operations during rapid successive changes (e.g., during typing).
     * 
     * @param uri - The URI of the changed file
     */
    private handleFileChange(uri: vscode.Uri): void {
        const filePath = uri.fsPath;
        
        console.log(`FileSystemWatcherManager: File changed: ${filePath}`);
        this.stats.totalChanges++;
        this.stats.lastEventTime = new Date();
        
        // Clear any existing timeout for this file
        const existingTimeout = this.debounceTimeouts.get(filePath);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.debounceTimeouts.delete(filePath);
        } else {
            // This is a new pending change
            this.pendingChanges.add(filePath);
            this.stats.pendingEvents++;
        }
        
        // Set up new debounced timeout
        const timeout = setTimeout(async () => {
            try {
                console.log(`FileSystemWatcherManager: Processing debounced change for: ${filePath}`);
                
                // Remove from pending changes
                this.pendingChanges.delete(filePath);
                this.debounceTimeouts.delete(filePath);
                this.stats.pendingEvents--;
                
                // Update the file in the index
                await this.indexingService.updateFileInIndex(uri);
                
                console.log(`FileSystemWatcherManager: Successfully updated index for: ${filePath}`);
            } catch (error) {
                console.error(`FileSystemWatcherManager: Failed to update index for ${filePath}:`, error);
            }
        }, this.config.debounceDelay);
        
        this.debounceTimeouts.set(filePath, timeout);
    }

    /**
     * Handles file deletion events
     * 
     * When a file is deleted, this method immediately removes all associated
     * vectors from the search index to prevent stale search results.
     * 
     * @param uri - The URI of the deleted file
     */
    private async handleFileDelete(uri: vscode.Uri): Promise<void> {
        try {
            console.log(`FileSystemWatcherManager: File deleted: ${uri.fsPath}`);
            this.stats.totalDeletions++;
            this.stats.lastEventTime = new Date();
            
            // For file deletion, we process immediately since the file is gone
            await this.indexingService.removeFileFromIndex(uri);
            
            console.log(`FileSystemWatcherManager: Successfully removed from index: ${uri.fsPath}`);
        } catch (error) {
            console.error(`FileSystemWatcherManager: Failed to remove deleted file ${uri.fsPath} from index:`, error);
        }
    }

    /**
     * Gets current statistics about watcher operations
     * 
     * @returns Current watcher statistics
     */
    public getStats(): WatcherStats {
        return { ...this.stats };
    }

    /**
     * Gets current configuration
     * 
     * @returns Current watcher configuration
     */
    public getConfig(): WatcherConfig {
        return { ...this.config };
    }

    /**
     * Updates the watcher configuration
     * 
     * Note: This requires reinitialization to take effect
     * 
     * @param newConfig - Partial configuration to merge with current config
     */
    public updateConfig(newConfig: Partial<WatcherConfig>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('FileSystemWatcherManager: Configuration updated. Reinitialize to apply changes.');
    }

    /**
     * Checks if the watcher is currently active
     * 
     * @returns True if the watcher is initialized and active
     */
    public isActive(): boolean {
        return this.watcher !== null;
    }

    /**
     * Gets the number of pending (debounced) file changes
     * 
     * @returns Number of files with pending change events
     */
    public getPendingChangesCount(): number {
        return this.pendingChanges.size;
    }

    /**
     * Forces processing of all pending debounced changes
     * 
     * This can be useful when you want to ensure all changes are processed
     * immediately, such as before closing the extension.
     */
    public async flushPendingChanges(): Promise<void> {
        console.log(`FileSystemWatcherManager: Flushing ${this.pendingChanges.size} pending changes...`);
        
        // Clear all timeouts and process changes immediately
        for (const [filePath, timeout] of this.debounceTimeouts.entries()) {
            clearTimeout(timeout);
            
            try {
                const uri = vscode.Uri.file(filePath);
                await this.indexingService.updateFileInIndex(uri);
                console.log(`FileSystemWatcherManager: Flushed change for: ${filePath}`);
            } catch (error) {
                console.error(`FileSystemWatcherManager: Failed to flush change for ${filePath}:`, error);
            }
        }
        
        // Clear all tracking data
        this.debounceTimeouts.clear();
        this.pendingChanges.clear();
        this.stats.pendingEvents = 0;
        
        console.log('FileSystemWatcherManager: All pending changes flushed');
    }

    /**
     * Disposes of the file system watcher and cleans up resources
     * 
     * This method should be called when the extension is deactivated or when
     * the watcher is no longer needed.
     */
    public dispose(): void {
        console.log('FileSystemWatcherManager: Disposing file system watcher...');
        
        // Clear all pending timeouts
        for (const timeout of this.debounceTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.debounceTimeouts.clear();
        this.pendingChanges.clear();
        
        // Dispose of all VS Code disposables
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        
        // Clear the watcher reference
        this.watcher = null;
        
        console.log('FileSystemWatcherManager: Disposed successfully');
    }
}
