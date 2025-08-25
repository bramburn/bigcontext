/**
 * Setup Store for Onboarding & Configuration Management
 * 
 * This store manages the state during the user onboarding process,
 * tracking database status, embedding provider selection, and overall setup progress.
 */

export interface SetupState {
    // Database configuration
    selectedDatabase: string;
    isDatabaseRunning: boolean;
    databaseStatus: 'not-configured' | 'starting' | 'running' | 'error';
    
    // Embedding provider configuration
    selectedProvider: string;
    providerConfigured: boolean;
    
    // Overall setup state
    isSetupComplete: boolean;
    isIndexing: boolean;
    setupStep: 'database' | 'provider' | 'ready' | 'indexing';
    
    // Error handling
    lastError: string | null;
}

class SetupStore {
    private state: SetupState = {
        selectedDatabase: '',
        isDatabaseRunning: false,
        databaseStatus: 'not-configured',
        selectedProvider: '',
        providerConfigured: false,
        isSetupComplete: false,
        isIndexing: false,
        setupStep: 'database',
        lastError: null
    };

    private listeners: Array<(state: SetupState) => void> = [];

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: SetupState) => void): () => void {
        this.listeners.push(listener);
        listener(this.state); // Immediately call with current state
        
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Get current state
     */
    getState(): SetupState {
        return { ...this.state };
    }

    /**
     * Update database selection
     */
    setSelectedDatabase(database: string): void {
        this.updateState({
            selectedDatabase: database,
            databaseStatus: database ? 'not-configured' : 'not-configured'
        });
    }

    /**
     * Update database status
     */
    setDatabaseStatus(status: SetupState['databaseStatus']): void {
        this.updateState({
            databaseStatus: status,
            isDatabaseRunning: status === 'running',
            setupStep: status === 'running' ? 'provider' : 'database'
        });
    }

    /**
     * Update embedding provider selection
     */
    setSelectedProvider(provider: string): void {
        this.updateState({
            selectedProvider: provider,
            providerConfigured: !!provider,
            setupStep: provider && this.state.isDatabaseRunning ? 'ready' : this.state.setupStep
        });
        this.checkSetupComplete();
    }

    /**
     * Set indexing state
     */
    setIndexing(isIndexing: boolean): void {
        this.updateState({
            isIndexing,
            setupStep: isIndexing ? 'indexing' : 'ready'
        });
    }

    /**
     * Set error state
     */
    setError(error: string | null): void {
        this.updateState({
            lastError: error
        });
    }

    /**
     * Clear error state
     */
    clearError(): void {
        this.setError(null);
    }

    /**
     * Reset setup state
     */
    reset(): void {
        this.state = {
            selectedDatabase: '',
            isDatabaseRunning: false,
            databaseStatus: 'not-configured',
            selectedProvider: '',
            providerConfigured: false,
            isSetupComplete: false,
            isIndexing: false,
            setupStep: 'database',
            lastError: null
        };
        this.notifyListeners();
    }

    /**
     * Check if setup is complete and update state accordingly
     */
    private checkSetupComplete(): void {
        const isComplete = this.state.isDatabaseRunning && this.state.providerConfigured;
        if (isComplete !== this.state.isSetupComplete) {
            this.updateState({
                isSetupComplete: isComplete
            });
        }
    }

    /**
     * Update state and notify listeners
     */
    private updateState(updates: Partial<SetupState>): void {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    /**
     * Notify all listeners of state changes
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }

    /**
     * Derived getters for common state checks
     */
    get canStartIndexing(): boolean {
        return this.state.isSetupComplete && !this.state.isIndexing;
    }

    get isConfiguring(): boolean {
        return this.state.setupStep === 'database' || this.state.setupStep === 'provider';
    }

    get isReady(): boolean {
        return this.state.setupStep === 'ready';
    }
}

// Export singleton instance
export const setupStore = new SetupStore();

// Export convenience functions for common operations
export const setupActions = {
    selectDatabase: (database: string) => setupStore.setSelectedDatabase(database),
    updateDatabaseStatus: (status: SetupState['databaseStatus']) => setupStore.setDatabaseStatus(status),
    selectProvider: (provider: string) => setupStore.setSelectedProvider(provider),
    startIndexing: () => setupStore.setIndexing(true),
    stopIndexing: () => setupStore.setIndexing(false),
    setError: (error: string) => setupStore.setError(error),
    clearError: () => setupStore.clearError(),
    reset: () => setupStore.reset()
};

// Export types
export type { SetupState };
