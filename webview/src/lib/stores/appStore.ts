/**
 * Application State Store
 * 
 * Centralized state management for the Code Context Engine application.
 * This store manages the overall application state and coordinates between different feature stores.
 */

import { writable, derived, type Readable } from 'svelte/store';
import { currentView, type ViewType } from './viewStore';

// Application-wide state interfaces
export interface AppState {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    lastActivity: Date | null;
}

export interface SetupState {
    databaseStatus: 'idle' | 'starting' | 'ready' | 'error';
    providerStatus: 'idle' | 'starting' | 'ready' | 'error';
    selectedDatabase: string;
    selectedProvider: string;
    isSetupComplete: boolean;
    setupErrors: string[];
}

export interface IndexingState {
    isIndexing: boolean;
    progress: number;
    message: string;
    filesProcessed: number;
    totalFiles: number;
    currentFile: string;
    stats: {
        totalChunks: number;
        processedChunks: number;
        errors: number;
        startTime: Date | null;
        estimatedTimeRemaining: string;
    };
}

export interface SearchState {
    query: string;
    isSearching: boolean;
    results: SearchResult[];
    history: string[];
    stats: {
        totalResults: number;
        searchTime: number;
        query: string;
    };
}

export interface SearchResult {
    id: string;
    file: string;
    content: string;
    score: number;
    lineNumber?: number;
    context?: string;
    relatedFiles?: RelatedFile[];
}

export interface RelatedFile {
    file: string;
    score: number;
    reason: string;
}

// Create individual stores
export const appState = writable<AppState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    lastActivity: null
});

export const setupState = writable<SetupState>({
    databaseStatus: 'idle',
    providerStatus: 'idle',
    selectedDatabase: '',
    selectedProvider: '',
    isSetupComplete: false,
    setupErrors: []
});

export const indexingState = writable<IndexingState>({
    isIndexing: false,
    progress: 0,
    message: 'Ready to start indexing...',
    filesProcessed: 0,
    totalFiles: 0,
    currentFile: '',
    stats: {
        totalChunks: 0,
        processedChunks: 0,
        errors: 0,
        startTime: null,
        estimatedTimeRemaining: ''
    }
});

export const searchState = writable<SearchState>({
    query: '',
    isSearching: false,
    results: [],
    history: [],
    stats: {
        totalResults: 0,
        searchTime: 0,
        query: ''
    }
});

// Derived stores for computed values
export const isSetupComplete: Readable<boolean> = derived(
    setupState,
    ($setupState) => $setupState.databaseStatus === 'ready' && $setupState.providerStatus === 'ready'
);

export const canStartIndexing: Readable<boolean> = derived(
    [setupState, indexingState],
    ([$setupState, $indexingState]) => 
        $setupState.databaseStatus === 'ready' && 
        $setupState.providerStatus === 'ready' && 
        !$indexingState.isIndexing
);

export const hasSearchResults: Readable<boolean> = derived(
    searchState,
    ($searchState) => $searchState.results.length > 0
);

export const currentError: Readable<string | null> = derived(
    [appState, setupState],
    ([$appState, $setupState]) => {
        if ($appState.error) return $appState.error;
        if ($setupState.setupErrors.length > 0) return $setupState.setupErrors[0];
        return null;
    }
);

// Action creators for updating state
export const appActions = {
    initialize: () => {
        appState.update(state => ({
            ...state,
            isInitialized: true,
            lastActivity: new Date()
        }));
    },

    setLoading: (loading: boolean) => {
        appState.update(state => ({
            ...state,
            isLoading: loading,
            lastActivity: new Date()
        }));
    },

    setError: (error: string | null) => {
        appState.update(state => ({
            ...state,
            error,
            lastActivity: new Date()
        }));
    },

    clearError: () => {
        appState.update(state => ({
            ...state,
            error: null
        }));
        setupState.update(state => ({
            ...state,
            setupErrors: []
        }));
    },

    updateActivity: () => {
        appState.update(state => ({
            ...state,
            lastActivity: new Date()
        }));
    }
};

export const setupActions = {
    setDatabaseStatus: (status: SetupState['databaseStatus']) => {
        setupState.update(state => ({
            ...state,
            databaseStatus: status
        }));
    },

    setProviderStatus: (status: SetupState['providerStatus']) => {
        setupState.update(state => ({
            ...state,
            providerStatus: status
        }));
    },

    setSelectedDatabase: (database: string) => {
        setupState.update(state => ({
            ...state,
            selectedDatabase: database,
            databaseStatus: 'idle'
        }));
    },

    setSelectedProvider: (provider: string) => {
        setupState.update(state => ({
            ...state,
            selectedProvider: provider,
            providerStatus: 'idle'
        }));
    },

    addSetupError: (error: string) => {
        setupState.update(state => ({
            ...state,
            setupErrors: [...state.setupErrors, error]
        }));
    },

    clearSetupErrors: () => {
        setupState.update(state => ({
            ...state,
            setupErrors: []
        }));
    }
};

export const indexingActions = {
    startIndexing: () => {
        indexingState.update(state => ({
            ...state,
            isIndexing: true,
            progress: 0,
            message: 'Starting indexing process...',
            stats: {
                ...state.stats,
                startTime: new Date(),
                errors: 0
            }
        }));
    },

    updateProgress: (progress: number, message: string, filesProcessed?: number, totalFiles?: number, currentFile?: string) => {
        indexingState.update(state => ({
            ...state,
            progress,
            message,
            filesProcessed: filesProcessed ?? state.filesProcessed,
            totalFiles: totalFiles ?? state.totalFiles,
            currentFile: currentFile ?? state.currentFile
        }));
    },

    completeIndexing: (success: boolean, totalFiles?: number) => {
        indexingState.update(state => ({
            ...state,
            isIndexing: false,
            progress: success ? 100 : state.progress,
            message: success ? 'Indexing completed successfully!' : 'Indexing failed.',
            totalFiles: totalFiles ?? state.totalFiles
        }));
    },

    stopIndexing: () => {
        indexingState.update(state => ({
            ...state,
            isIndexing: false,
            message: 'Indexing stopped by user.'
        }));
    }
};

export const searchActions = {
    setQuery: (query: string) => {
        searchState.update(state => ({
            ...state,
            query
        }));
    },

    startSearch: () => {
        searchState.update(state => ({
            ...state,
            isSearching: true,
            results: []
        }));
    },

    setResults: (results: SearchResult[], stats: SearchState['stats']) => {
        searchState.update(state => ({
            ...state,
            isSearching: false,
            results,
            stats,
            history: state.query && !state.history.includes(state.query) 
                ? [state.query, ...state.history.slice(0, 9)] 
                : state.history
        }));
    },

    setSearchError: () => {
        searchState.update(state => ({
            ...state,
            isSearching: false,
            results: []
        }));
    },

    setHistory: (history: string[]) => {
        searchState.update(state => ({
            ...state,
            history
        }));
    }
};

// Helper function to reset all state (useful for testing or cleanup)
export const resetAllState = () => {
    appState.set({
        isInitialized: false,
        isLoading: false,
        error: null,
        lastActivity: null
    });

    setupState.set({
        databaseStatus: 'idle',
        providerStatus: 'idle',
        selectedDatabase: '',
        selectedProvider: '',
        isSetupComplete: false,
        setupErrors: []
    });

    indexingState.set({
        isIndexing: false,
        progress: 0,
        message: 'Ready to start indexing...',
        filesProcessed: 0,
        totalFiles: 0,
        currentFile: '',
        stats: {
            totalChunks: 0,
            processedChunks: 0,
            errors: 0,
            startTime: null,
            estimatedTimeRemaining: ''
        }
    });

    searchState.set({
        query: '',
        isSearching: false,
        results: [],
        history: [],
        stats: {
            totalResults: 0,
            searchTime: 0,
            query: ''
        }
    });
};
