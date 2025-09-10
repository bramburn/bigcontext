/**
 * Enhanced File Monitor Service
 * 
 * This service implements the IFileMonitorService interface and provides
 * real-time file system monitoring capabilities with debouncing, filtering,
 * and integration with the indexing service.
 * 
 * Based on specifications in:
 * - specs/002-for-the-next/contracts/services.ts
 * - specs/002-for-the-next/data-model.md
 * 
 * This service builds on the existing FileWatcherService but provides
 * a cleaner interface that matches the contract requirements.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import ignore from 'ignore';
import { 
    FileMonitorConfig, 
    FileMonitorStats, 
    FileChangeEvent 
} from '../types/indexing';
import { IIndexingService } from './indexingService';

/**
 * Interface contract that this service implements
 */
export interface IFileMonitorService {
    /**
     * Starts monitoring the workspace for file changes.
     */
    startMonitoring(): void;

    /**
     * Stops monitoring the workspace for file changes.
     */
    stopMonitoring(): void;

    /**
     * Gets the current monitoring configuration.
     */
    getConfig(): FileMonitorConfig;

    /**
     * Gets monitoring statistics.
     */
    getStats(): FileMonitorStats;

    /**
     * Checks if monitoring is currently active.
     */
    isMonitoring(): boolean;

    /**
     * Adds a change event listener.
     */
    onFileChange(listener: (event: FileChangeEvent) => void): vscode.Disposable;
}

/**
 * Default configuration for file monitoring
 */
const DEFAULT_CONFIG: FileMonitorConfig = {
    debounceDelay: 500, // 500ms debounce
    patterns: [
        '**/*.{ts,js,tsx,jsx,py,java,cpp,c,h,hpp,cs,php,rb,go,rs,swift,kt,scala,clj,hs,ml,fs,vb,sql,html,css,scss,sass,less,vue,svelte,md,mdx,txt,json,yaml,yml,xml,toml,ini,cfg,conf}'
    ],
    respectGitignore: true,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    skipBinaryFiles: true
};

/**
 * Enhanced FileMonitorService that implements the IFileMonitorService interface
 * 
 * This service provides real-time file system monitoring with:
 * - Debounced event handling to prevent event storms
 * - File filtering based on patterns, size, and type
 * - Integration with IndexingService for automatic index updates
 * - Comprehensive statistics tracking
 */
export class FileMonitorService implements IFileMonitorService {
    private watcher: vscode.FileSystemWatcher | null = null;
    private config: FileMonitorConfig;
    private stats: FileMonitorStats;
    private isActive: boolean = false;
    private disposables: vscode.Disposable[] = [];
    private ignoreInstance: ReturnType<typeof ignore> | null = null;
    
    // Debouncing mechanism
    private debounceTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private pendingChanges: Set<string> = new Set();
    
    // Event listeners
    private changeListeners: ((event: FileChangeEvent) => void)[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private indexingService?: IIndexingService,
        config?: Partial<FileMonitorConfig>
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.stats = {
            watchedFiles: 0,
            changeEvents: 0,
            createEvents: 0,
            deleteEvents: 0,
            debouncedEvents: 0,
            startTime: Date.now()
        };
    }

    /**
     * Starts monitoring the workspace for file changes.
     */
    public startMonitoring(): void {
        if (this.isActive) {
            console.log('FileMonitorService: Already monitoring');
            return;
        }

        try {
            console.log('FileMonitorService: Starting file monitoring...');

            // Load .gitignore patterns if respectGitignore is enabled
            if (this.config.respectGitignore) {
                this.loadGitignorePatterns();
            }

            // Create file system watcher
            const pattern = `{${this.config.patterns.join(',')}}`;
            this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

            // Register event handlers
            this.watcher.onDidCreate(this.handleFileCreate.bind(this));
            this.watcher.onDidChange(this.handleFileChange.bind(this));
            this.watcher.onDidDelete(this.handleFileDelete.bind(this));

            this.disposables.push(this.watcher);
            this.isActive = true;
            this.stats.startTime = Date.now();

            console.log(`FileMonitorService: Started monitoring with pattern: ${pattern}`);
        } catch (error) {
            console.error('FileMonitorService: Failed to start monitoring:', error);
            throw error;
        }
    }

    /**
     * Stops monitoring the workspace for file changes.
     */
    public stopMonitoring(): void {
        if (!this.isActive) {
            console.log('FileMonitorService: Not currently monitoring');
            return;
        }

        console.log('FileMonitorService: Stopping file monitoring...');

        // Clear all debounce timeouts
        this.debounceTimeouts.forEach(timeout => clearTimeout(timeout));
        this.debounceTimeouts.clear();
        this.pendingChanges.clear();

        // Dispose of all resources
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables.length = 0;

        this.watcher = null;
        this.isActive = false;

        console.log('FileMonitorService: Stopped monitoring');
    }

    /**
     * Gets the current monitoring configuration.
     */
    public getConfig(): FileMonitorConfig {
        return { ...this.config };
    }

    /**
     * Gets monitoring statistics.
     */
    public getStats(): FileMonitorStats {
        return { ...this.stats };
    }

    /**
     * Checks if monitoring is currently active.
     */
    public isMonitoring(): boolean {
        return this.isActive;
    }

    /**
     * Handles file creation events
     */
    private async handleFileCreate(uri: vscode.Uri): Promise<void> {
        const filePath = uri.fsPath;
        
        if (!this.shouldProcessFile(filePath)) {
            return;
        }

        const event: FileChangeEvent = {
            type: 'create',
            filePath,
            timestamp: Date.now()
        };

        this.stats.createEvents++;
        this.notifyListeners(event);

        // Debounce the file processing
        this.debounceFileOperation(filePath, async () => {
            try {
                if (this.indexingService) {
                    await this.indexingService.addFileToIndex(uri);
                }
                console.log(`FileMonitorService: Added file to index: ${filePath}`);
            } catch (error) {
                console.error(`FileMonitorService: Error adding file ${filePath}:`, error);
            }
        });
    }

    /**
     * Handles file change events
     */
    private async handleFileChange(uri: vscode.Uri): Promise<void> {
        const filePath = uri.fsPath;
        
        if (!this.shouldProcessFile(filePath)) {
            return;
        }

        const event: FileChangeEvent = {
            type: 'change',
            filePath,
            timestamp: Date.now()
        };

        this.stats.changeEvents++;
        this.notifyListeners(event);

        // Debounce the file processing
        this.debounceFileOperation(filePath, async () => {
            try {
                if (this.indexingService) {
                    await this.indexingService.updateFileInIndex(uri);
                }
                console.log(`FileMonitorService: Updated file in index: ${filePath}`);
            } catch (error) {
                console.error(`FileMonitorService: Error updating file ${filePath}:`, error);
            }
        });
    }

    /**
     * Handles file deletion events
     */
    private async handleFileDelete(uri: vscode.Uri): Promise<void> {
        const filePath = uri.fsPath;

        const event: FileChangeEvent = {
            type: 'delete',
            filePath,
            timestamp: Date.now()
        };

        this.stats.deleteEvents++;
        this.notifyListeners(event);

        // No debouncing for deletions - process immediately
        try {
            if (this.indexingService) {
                await this.indexingService.removeFileFromIndex(uri);
            }
            console.log(`FileMonitorService: Removed file from index: ${filePath}`);
        } catch (error) {
            console.error(`FileMonitorService: Error removing file ${filePath}:`, error);
        }
    }

    /**
     * Debounces file operations to prevent event storms
     */
    private debounceFileOperation(filePath: string, operation: () => Promise<void>): void {
        // Clear existing timeout for this file
        const existingTimeout = this.debounceTimeouts.get(filePath);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.stats.debouncedEvents++;
        }

        // Set new timeout
        const timeout = setTimeout(async () => {
            this.debounceTimeouts.delete(filePath);
            this.pendingChanges.delete(filePath);
            await operation();
        }, this.config.debounceDelay);

        this.debounceTimeouts.set(filePath, timeout);
        this.pendingChanges.add(filePath);
    }

    /**
     * Load .gitignore patterns for the workspace
     */
    private loadGitignorePatterns(): void {
        if (this.ignoreInstance) {
            return; // Already loaded
        }

        this.ignoreInstance = ignore();

        // Add common patterns to ignore by default
        this.ignoreInstance.add([
            'node_modules/**',
            '.git/**',
            'dist/**',
            'build/**',
            'out/**',
            '*.min.js',
            '*.map',
            '.vscode/**',
            '.idea/**',
            '*.log',
            'coverage/**',
            '.nyc_output/**',
        ]);

        // Load .gitignore file if it exists
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                return;
            }

            const gitignorePath = path.join(workspaceRoot, '.gitignore');
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

            const lines = gitignoreContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));

            this.ignoreInstance.add(lines);
            console.log(`FileMonitorService: Loaded ${lines.length} patterns from .gitignore`);
        } catch (error) {
            // .gitignore file not found or not readable, continue with default patterns
            console.log('FileMonitorService: No .gitignore file found, using default ignore patterns');
        }
    }

    /**
     * Determines if a file should be processed based on configuration
     */
    public shouldProcessFile(filePath: string): boolean {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

            // Check .gitignore patterns if enabled and workspace is available
            if (this.config.respectGitignore && this.ignoreInstance && workspaceRoot) {
                const relativePath = path.relative(workspaceRoot, filePath);
                if (this.ignoreInstance.ignores(relativePath)) {
                    return false;
                }
            }

            // Check file size
            if (this.config.maxFileSize > 0) {
                const stats = fs.statSync(filePath);
                if (stats.size > this.config.maxFileSize) {
                    return false;
                }
            }

            // Check if binary file (basic check)
            if (this.config.skipBinaryFiles) {
                const ext = path.extname(filePath).toLowerCase();
                const binaryExtensions = ['.exe', '.dll', '.so', '.dylib', '.bin', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.pdf', '.zip', '.tar', '.gz'];
                if (binaryExtensions.includes(ext)) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            // If we can't check the file, assume it should be processed
            console.warn(`FileMonitorService: Could not check file ${filePath}:`, error);
            return true;
        }
    }

    /**
     * Adds a change event listener
     */
    public onFileChange(listener: (event: FileChangeEvent) => void): vscode.Disposable {
        this.changeListeners.push(listener);
        
        return new vscode.Disposable(() => {
            const index = this.changeListeners.indexOf(listener);
            if (index >= 0) {
                this.changeListeners.splice(index, 1);
            }
        });
    }

    /**
     * Notifies all change listeners
     */
    private notifyListeners(event: FileChangeEvent): void {
        this.changeListeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('FileMonitorService: Error in change listener:', error);
            }
        });
    }

    /**
     * Updates the configuration
     */
    public updateConfig(newConfig: Partial<FileMonitorConfig>): void {
        const wasMonitoring = this.isActive;
        
        if (wasMonitoring) {
            this.stopMonitoring();
        }
        
        this.config = { ...this.config, ...newConfig };
        
        if (wasMonitoring) {
            this.startMonitoring();
        }
    }

    /**
     * Disposes of the service and cleans up resources
     */
    public dispose(): void {
        this.stopMonitoring();
        this.changeListeners.length = 0;
    }
}
