import * as vscode from 'vscode';

/**
 * StateManager class responsible for managing global application state
 * and preventing conflicting operations.
 * 
 * This class provides centralized state management for the extension,
 * ensuring that operations like indexing don't run concurrently and
 * maintaining consistency across different services.
 */
export class StateManager {
    private _isIndexing: boolean = false;
    private _isInitialized: boolean = false;
    private _lastError: string | null = null;
    private _indexingStartTime: Date | null = null;
    private _indexingProgress: number = 0;
    private _currentOperation: string | null = null;

    // Event emitters for state changes
    private _onStateChanged = new vscode.EventEmitter<StateChangeEvent>();
    public readonly onStateChanged = this._onStateChanged.event;

    /**
     * Creates a new StateManager instance
     */
    constructor() {
        console.log('StateManager: Initialized');
    }

    /**
     * Gets the current state snapshot
     */
    public getState(): ApplicationState {
        return {
            isIndexing: this._isIndexing,
            isInitialized: this._isInitialized,
            lastError: this._lastError,
            indexingStartTime: this._indexingStartTime,
            indexingProgress: this._indexingProgress,
            currentOperation: this._currentOperation
        };
    }

    /**
     * Checks if indexing is currently in progress
     */
    public isIndexing(): boolean {
        return this._isIndexing;
    }

    /**
     * Checks if the extension is initialized
     */
    public isInitialized(): boolean {
        return this._isInitialized;
    }

    /**
     * Gets the last error message
     */
    public getLastError(): string | null {
        return this._lastError;
    }

    /**
     * Gets the current indexing progress (0-100)
     */
    public getIndexingProgress(): number {
        return this._indexingProgress;
    }

    /**
     * Gets the current operation description
     */
    public getCurrentOperation(): string | null {
        return this._currentOperation;
    }

    /**
     * Sets the indexing state
     * @param isIndexing - Whether indexing is in progress
     * @param operation - Optional description of the current operation
     */
    public setIndexing(isIndexing: boolean, operation?: string): void {
        const previousState = this.getState();
        
        this._isIndexing = isIndexing;
        this._currentOperation = operation || null;
        
        if (isIndexing) {
            this._indexingStartTime = new Date();
            this._indexingProgress = 0;
            this._lastError = null; // Clear previous errors when starting
            console.log(`StateManager: Indexing started - ${operation || 'No description'}`);
        } else {
            this._indexingStartTime = null;
            this._currentOperation = null;
            console.log('StateManager: Indexing stopped');
        }

        this._emitStateChange(previousState, this.getState());
    }

    /**
     * Updates the indexing progress
     * @param progress - Progress percentage (0-100)
     * @param operation - Optional description of the current operation
     */
    public updateIndexingProgress(progress: number, operation?: string): void {
        if (!this._isIndexing) {
            console.warn('StateManager: Attempted to update progress while not indexing');
            return;
        }

        const previousState = this.getState();
        
        this._indexingProgress = Math.max(0, Math.min(100, progress));
        if (operation) {
            this._currentOperation = operation;
        }

        this._emitStateChange(previousState, this.getState());
    }

    /**
     * Sets the initialization state
     * @param isInitialized - Whether the extension is initialized
     */
    public setInitialized(isInitialized: boolean): void {
        const previousState = this.getState();
        
        this._isInitialized = isInitialized;
        console.log(`StateManager: Initialization state changed to ${isInitialized}`);

        this._emitStateChange(previousState, this.getState());
    }

    /**
     * Sets an error state
     * @param error - Error message or null to clear
     */
    public setError(error: string | null): void {
        const previousState = this.getState();
        
        this._lastError = error;
        
        if (error) {
            console.error(`StateManager: Error set - ${error}`);
        } else {
            console.log('StateManager: Error cleared');
        }

        this._emitStateChange(previousState, this.getState());
    }

    /**
     * Clears the error state
     */
    public clearError(): void {
        this.setError(null);
    }

    /**
     * Attempts to start an operation, returns false if another operation is in progress
     * @param operationName - Name of the operation to start
     * @returns True if operation can start, false if blocked
     */
    public tryStartOperation(operationName: string): boolean {
        if (this._isIndexing) {
            console.warn(`StateManager: Cannot start '${operationName}' - indexing already in progress`);
            return false;
        }

        console.log(`StateManager: Operation '${operationName}' can proceed`);
        return true;
    }

    /**
     * Gets the duration of the current indexing operation
     * @returns Duration in milliseconds, or null if not indexing
     */
    public getIndexingDuration(): number | null {
        if (!this._isIndexing || !this._indexingStartTime) {
            return null;
        }

        return Date.now() - this._indexingStartTime.getTime();
    }

    /**
     * Resets all state to initial values
     */
    public reset(): void {
        const previousState = this.getState();
        
        this._isIndexing = false;
        this._isInitialized = false;
        this._lastError = null;
        this._indexingStartTime = null;
        this._indexingProgress = 0;
        this._currentOperation = null;

        console.log('StateManager: State reset to initial values');
        this._emitStateChange(previousState, this.getState());
    }

    /**
     * Disposes of the StateManager and cleans up resources
     */
    public dispose(): void {
        this._onStateChanged.dispose();
        console.log('StateManager: Disposed');
    }

    /**
     * Emits a state change event
     */
    private _emitStateChange(previousState: ApplicationState, currentState: ApplicationState): void {
        this._onStateChanged.fire({
            previousState,
            currentState,
            timestamp: new Date()
        });
    }
}

/**
 * Interface representing the application state
 */
export interface ApplicationState {
    isIndexing: boolean;
    isInitialized: boolean;
    lastError: string | null;
    indexingStartTime: Date | null;
    indexingProgress: number;
    currentOperation: string | null;
}

/**
 * Interface for state change events
 */
export interface StateChangeEvent {
    previousState: ApplicationState;
    currentState: ApplicationState;
    timestamp: Date;
}
