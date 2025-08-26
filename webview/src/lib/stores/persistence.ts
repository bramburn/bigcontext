/**
 * State Persistence Utility
 * 
 * Handles saving and loading application state using VS Code's webview state API.
 * This ensures that the application state persists across webview reloads.
 */

import { getState, setState } from '$lib/vscodeApi';
import { 
    appState, 
    setupState, 
    indexingState, 
    searchState,
    type AppState,
    type SetupState,
    type IndexingState,
    type SearchState
} from './appStore';

// State keys for persistence
const STATE_KEYS = {
    APP: 'app',
    SETUP: 'setup',
    INDEXING: 'indexing',
    SEARCH: 'search'
} as const;

// Interface for persisted state
interface PersistedState {
    app?: Partial<AppState>;
    setup?: Partial<SetupState>;
    indexing?: Partial<IndexingState>;
    search?: Partial<SearchState>;
    version?: string;
    timestamp?: number;
}

// Current state version for migration purposes
const STATE_VERSION = '1.0.0';

/**
 * Save current application state to VS Code's webview state
 */
export function saveState(): void {
    try {
        // Get current state values
        let currentAppState: AppState;
        let currentSetupState: SetupState;
        let currentIndexingState: IndexingState;
        let currentSearchState: SearchState;

        // Subscribe to get current values
        const unsubscribeApp = appState.subscribe(state => currentAppState = state);
        const unsubscribeSetup = setupState.subscribe(state => currentSetupState = state);
        const unsubscribeIndexing = indexingState.subscribe(state => currentIndexingState = state);
        const unsubscribeSearch = searchState.subscribe(state => currentSearchState = state);

        // Clean up subscriptions immediately
        unsubscribeApp();
        unsubscribeSetup();
        unsubscribeIndexing();
        unsubscribeSearch();

        // Create persisted state object
        const persistedState: PersistedState = {
            app: {
                isInitialized: currentAppState!.isInitialized,
                error: null, // Don't persist errors
                lastActivity: currentAppState!.lastActivity
            },
            setup: {
                databaseStatus: currentSetupState!.databaseStatus,
                providerStatus: currentSetupState!.providerStatus,
                selectedDatabase: currentSetupState!.selectedDatabase,
                selectedProvider: currentSetupState!.selectedProvider,
                isSetupComplete: currentSetupState!.isSetupComplete,
                setupErrors: [] // Don't persist errors
            },
            indexing: {
                isIndexing: false, // Don't persist active indexing state
                progress: currentIndexingState!.progress,
                message: currentIndexingState!.message,
                filesProcessed: currentIndexingState!.filesProcessed,
                totalFiles: currentIndexingState!.totalFiles,
                currentFile: '', // Don't persist current file
                stats: {
                    ...currentIndexingState!.stats,
                    startTime: null // Don't persist start time
                }
            },
            search: {
                query: currentSearchState!.query,
                isSearching: false, // Don't persist active search state
                results: [], // Don't persist results (they may be stale)
                history: currentSearchState!.history,
                stats: currentSearchState!.stats
            },
            version: STATE_VERSION,
            timestamp: Date.now()
        };

        // Save to VS Code state
        setState(persistedState);
        
        console.log('State saved successfully');
    } catch (error) {
        console.error('Failed to save state:', error);
    }
}

/**
 * Load application state from VS Code's webview state
 */
export function loadState(): void {
    try {
        const persistedState = getState() as PersistedState | null;
        
        if (!persistedState) {
            console.log('No persisted state found, using defaults');
            return;
        }

        // Check version compatibility
        if (persistedState.version !== STATE_VERSION) {
            console.warn(`State version mismatch. Expected ${STATE_VERSION}, got ${persistedState.version}. Using defaults.`);
            return;
        }

        // Check if state is too old (older than 24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (persistedState.timestamp && (Date.now() - persistedState.timestamp) > maxAge) {
            console.log('Persisted state is too old, using defaults');
            return;
        }

        // Restore app state
        if (persistedState.app) {
            appState.update(current => ({
                ...current,
                ...persistedState.app,
                isLoading: false, // Always start with loading false
                error: null // Never restore errors
            }));
        }

        // Restore setup state
        if (persistedState.setup) {
            setupState.update(current => ({
                ...current,
                ...persistedState.setup,
                setupErrors: [] // Never restore errors
            }));
        }

        // Restore indexing state
        if (persistedState.indexing) {
            indexingState.update(current => ({
                ...current,
                ...persistedState.indexing,
                isIndexing: false, // Never restore active indexing
                currentFile: '', // Don't restore current file
                stats: {
                    ...current.stats,
                    ...persistedState.indexing.stats,
                    startTime: null // Don't restore start time
                }
            }));
        }

        // Restore search state
        if (persistedState.search) {
            searchState.update(current => ({
                ...current,
                ...persistedState.search,
                isSearching: false, // Never restore active search
                results: [] // Don't restore stale results
            }));
        }

        console.log('State loaded successfully');
    } catch (error) {
        console.error('Failed to load state:', error);
    }
}

/**
 * Clear all persisted state
 */
export function clearPersistedState(): void {
    try {
        setState(null);
        console.log('Persisted state cleared');
    } catch (error) {
        console.error('Failed to clear persisted state:', error);
    }
}

/**
 * Set up automatic state saving
 * This will save state whenever any store changes
 */
export function setupAutoSave(): () => void {
    const unsubscribeFunctions: (() => void)[] = [];
    
    // Debounce save operations to avoid excessive saves
    let saveTimeout: NodeJS.Timeout | null = null;
    
    const debouncedSave = () => {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveTimeout = setTimeout(() => {
            saveState();
            saveTimeout = null;
        }, 1000); // Save 1 second after last change
    };

    // Subscribe to all stores
    unsubscribeFunctions.push(
        appState.subscribe(debouncedSave),
        setupState.subscribe(debouncedSave),
        indexingState.subscribe(debouncedSave),
        searchState.subscribe(debouncedSave)
    );

    // Return cleanup function
    return () => {
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
    };
}

/**
 * Initialize persistence system
 * Call this once when the application starts
 */
export function initializePersistence(): () => void {
    // Load existing state
    loadState();
    
    // Set up auto-save
    const cleanupAutoSave = setupAutoSave();
    
    // Save state when the page is about to unload
    const handleBeforeUnload = () => {
        saveState();
    };
    
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    // Return cleanup function
    return () => {
        cleanupAutoSave();
        if (typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    };
}
