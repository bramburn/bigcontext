"use strict";
/**
 * Setup Store for Onboarding & Configuration Management
 *
 * This store manages the state during the user onboarding process,
 * tracking database status, embedding provider selection, and overall setup progress.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupActions = exports.setupStore = void 0;
class SetupStore {
    constructor() {
        this.state = {
            selectedDatabase: '',
            databaseConfig: null,
            isDatabaseRunning: false,
            databaseStatus: 'not-configured',
            selectedProvider: '',
            embeddingConfig: null,
            providerConfigured: false,
            isSetupComplete: false,
            isIndexing: false,
            setupStep: 'database',
            lastError: null
        };
        this.listeners = [];
    }
    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
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
    getState() {
        return { ...this.state };
    }
    /**
     * Update database selection
     */
    setSelectedDatabase(database) {
        this.updateState({
            selectedDatabase: database,
            databaseConfig: null,
            databaseStatus: database ? 'not-configured' : 'not-configured'
        });
    }
    /**
     * Update database configuration
     */
    setDatabaseConfig(config) {
        this.updateState({
            databaseConfig: config
        });
    }
    /**
     * Update database status
     */
    setDatabaseStatus(status) {
        this.updateState({
            databaseStatus: status,
            isDatabaseRunning: status === 'running',
            setupStep: status === 'running' ? 'provider' : 'database'
        });
    }
    /**
     * Update embedding provider selection
     */
    setSelectedProvider(provider) {
        this.updateState({
            selectedProvider: provider,
            embeddingConfig: null,
            providerConfigured: !!provider,
            setupStep: provider && this.state.isDatabaseRunning ? 'ready' : this.state.setupStep
        });
        this.checkSetupComplete();
    }
    /**
     * Update embedding provider configuration
     */
    setEmbeddingConfig(config) {
        this.updateState({
            embeddingConfig: config,
            providerConfigured: true
        });
        this.checkSetupComplete();
    }
    /**
     * Set indexing state
     */
    setIndexing(isIndexing) {
        this.updateState({
            isIndexing,
            setupStep: isIndexing ? 'indexing' : 'ready'
        });
    }
    /**
     * Set error state
     */
    setError(error) {
        this.updateState({
            lastError: error
        });
    }
    /**
     * Clear error state
     */
    clearError() {
        this.setError(null);
    }
    /**
     * Reset setup state
     */
    reset() {
        this.state = {
            selectedDatabase: '',
            databaseConfig: null,
            isDatabaseRunning: false,
            databaseStatus: 'not-configured',
            selectedProvider: '',
            embeddingConfig: null,
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
    checkSetupComplete() {
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
    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }
    /**
     * Notify all listeners of state changes
     */
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
    /**
     * Derived getters for common state checks
     */
    get canStartIndexing() {
        return this.state.isSetupComplete && !this.state.isIndexing;
    }
    get isConfiguring() {
        return this.state.setupStep === 'database' || this.state.setupStep === 'provider';
    }
    get isReady() {
        return this.state.setupStep === 'ready';
    }
}
// Export singleton instance
exports.setupStore = new SetupStore();
// Export convenience functions for common operations
exports.setupActions = {
    selectDatabase: (database) => exports.setupStore.setSelectedDatabase(database),
    setDatabaseConfig: (config) => exports.setupStore.setDatabaseConfig(config),
    updateDatabaseStatus: (status) => exports.setupStore.setDatabaseStatus(status),
    selectProvider: (provider) => exports.setupStore.setSelectedProvider(provider),
    setEmbeddingConfig: (config) => exports.setupStore.setEmbeddingConfig(config),
    startIndexing: () => exports.setupStore.setIndexing(true),
    stopIndexing: () => exports.setupStore.setIndexing(false),
    setError: (error) => exports.setupStore.setError(error),
    clearError: () => exports.setupStore.clearError(),
    reset: () => exports.setupStore.reset()
};
//# sourceMappingURL=setupStore.js.map