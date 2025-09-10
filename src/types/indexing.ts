/**
 * Enhanced Indexing and File Monitoring Types
 * 
 * This module defines the core types for the enhanced indexing system
 * that supports pause/resume functionality, configuration change detection,
 * and real-time file monitoring.
 * 
 * Based on specifications in:
 * - specs/002-for-the-next/data-model.md
 * - specs/002-for-the-next/contracts/services.ts
 */

/**
 * Represents the current status of the indexing process
 * 
 * States:
 * - 'idle': The indexer is not running and ready to start
 * - 'indexing': The indexer is actively processing files
 * - 'paused': The indexer is paused and can be resumed
 * - 'error': The indexer has encountered an error
 */
export type IndexState = 'idle' | 'indexing' | 'paused' | 'error';

/**
 * Represents metadata for an indexed file, used to track its state
 * and determine if it needs to be re-indexed
 */
export interface FileMetadata {
    /** The absolute path to the file */
    filePath: string;
    
    /** Unix timestamp when the file was last successfully indexed */
    lastIndexed: number;
    
    /** SHA-256 hash of the file content at the time of indexing */
    contentHash: string;
}

/**
 * Configuration options for file monitoring
 */
export interface FileMonitorConfig {
    /** Debounce delay in milliseconds to prevent event storms */
    debounceDelay: number;
    
    /** File patterns to watch */
    patterns: string[];
    
    /** Whether to ignore files in .gitignore */
    respectGitignore: boolean;
    
    /** Maximum file size to index (in bytes) */
    maxFileSize: number;
    
    /** Whether to skip binary files */
    skipBinaryFiles: boolean;
}

/**
 * Statistics for file monitoring operations
 */
export interface FileMonitorStats {
    /** Number of files currently being watched */
    watchedFiles: number;
    
    /** Number of file change events processed */
    changeEvents: number;
    
    /** Number of file creation events processed */
    createEvents: number;
    
    /** Number of file deletion events processed */
    deleteEvents: number;
    
    /** Number of events that were debounced/skipped */
    debouncedEvents: number;
    
    /** Timestamp when monitoring started */
    startTime: number;
}

/**
 * Event data for file system changes
 */
export interface FileChangeEvent {
    /** Type of file system event */
    type: 'create' | 'change' | 'delete';
    
    /** Path to the affected file */
    filePath: string;
    
    /** Timestamp when the event occurred */
    timestamp: number;
    
    /** Whether this event was debounced */
    debounced?: boolean;
}

/**
 * Configuration change event data
 */
export interface ConfigurationChangeEvent {
    /** The configuration section that changed */
    section: string;
    
    /** Whether this change requires a full re-index */
    requiresReindex: boolean;
    
    /** Timestamp when the change occurred */
    timestamp: number;
}
