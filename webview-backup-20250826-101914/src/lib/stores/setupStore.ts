/**
 * Setup Store for Onboarding & Configuration Management
 * 
 * This store manages the state during the user onboarding process,
 * tracking database status, embedding provider selection, and overall setup progress.
 */

// Database provider types
export type DatabaseProvider = 'qdrant' | 'chromadb' | 'pinecone';

// Database configuration interfaces
export interface QdrantConfig {
    host: string;
    port: number;
    apiKey?: string;
}

export interface ChromaDBConfig {
    host: string;
    port: number;
    ssl: boolean;
    authToken?: string;
}

export interface PineconeConfig {
    apiKey: string;
    environment: string;
    indexName: string;
}

export type DatabaseConfig = QdrantConfig | ChromaDBConfig | PineconeConfig;

// Embedding provider types
export type EmbeddingProvider = 'ollama' | 'openai';

// Embedding provider configuration interfaces
export interface OllamaConfig {
    endpoint: string;
    model: string;
    apiKey?: string; // For secured Ollama instances
    timeout?: number;
}

export interface OpenAIConfig {
    apiKey: string;
    model: string;
    organization?: string;
    baseURL?: string; // For custom OpenAI-compatible endpoints
}

export type EmbeddingConfig = OllamaConfig | OpenAIConfig;

export interface SetupState {
    // Database configuration
    selectedDatabase: DatabaseProvider | '';
    databaseConfig: DatabaseConfig | null;
    isDatabaseRunning: boolean;
    databaseStatus: 'not-configured' | 'starting' | 'running' | 'error';

    // Embedding provider configuration
    selectedProvider: EmbeddingProvider | '';
    embeddingConfig: EmbeddingConfig | null;
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
    setSelectedDatabase(database: DatabaseProvider | ''): void {
        this.updateState({
            selectedDatabase: database,
            databaseConfig: null, // Reset config when changing database
            databaseStatus: database ? 'not-configured' : 'not-configured'
        });
    }

    /**
     * Update database configuration
     */
    setDatabaseConfig(config: DatabaseConfig): void {
        this.updateState({
            databaseConfig: config
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
    setSelectedProvider(provider: EmbeddingProvider | ''): void {
        this.updateState({
            selectedProvider: provider,
            embeddingConfig: null, // Reset config when changing provider
            providerConfigured: !!provider,
            setupStep: provider && this.state.isDatabaseRunning ? 'ready' : this.state.setupStep
        });
        this.checkSetupComplete();
    }

    /**
     * Update embedding provider configuration
     */
    setEmbeddingConfig(config: EmbeddingConfig): void {
        this.updateState({
            embeddingConfig: config,
            providerConfigured: true
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
    selectDatabase: (database: DatabaseProvider | '') => setupStore.setSelectedDatabase(database),
    setDatabaseConfig: (config: DatabaseConfig) => setupStore.setDatabaseConfig(config),
    updateDatabaseStatus: (status: SetupState['databaseStatus']) => setupStore.setDatabaseStatus(status),
    selectProvider: (provider: EmbeddingProvider | '') => setupStore.setSelectedProvider(provider),
    setEmbeddingConfig: (config: EmbeddingConfig) => setupStore.setEmbeddingConfig(config),
    startIndexing: () => setupStore.setIndexing(true),
    stopIndexing: () => setupStore.setIndexing(false),
    setError: (error: string) => setupStore.setError(error),
    clearError: () => setupStore.clearError(),
    reset: () => setupStore.reset()
};


