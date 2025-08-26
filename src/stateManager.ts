import * as vscode from 'vscode';

/**
 * State change event data
 * 
 * This interface defines the structure of events emitted when state changes occur.
 * It provides information about what changed, including the key, old and new values,
 * and when the change occurred.
 */
export interface StateChangeEvent<T = any> {
    key: string;
    oldValue: T | undefined;
    newValue: T;
    timestamp: Date;
}

/**
 * State change listener function type
 * 
 * This type defines the callback function signature for listening to state changes.
 * Listeners receive a StateChangeEvent object containing details about the change.
 */
export type StateChangeListener<T = any> = (event: StateChangeEvent<T>) => void;

/**
 * State persistence options
 * 
 * This interface defines configuration options for persisting state to VS Code's storage.
 * It allows controlling whether persistence is enabled, the storage key to use,
 * the scope of persistence (global or workspace), and debouncing settings.
 */
export interface StatePersistenceOptions {
    enabled: boolean;
    key?: string;
    scope?: 'global' | 'workspace';
    debounceMs?: number;
}

/**
 * StateManager class responsible for managing global application state.
 * 
 * This class provides a centralized state management system with:
 * - Type-safe state storage and retrieval
 * - State change notifications and subscriptions
 * - Automatic persistence to VS Code storage
 * - State validation and transformation
 * - Performance optimization with debouncing
 * 
 * The StateManager acts as a single source of truth for application state,
 * enabling components to react to state changes and maintain consistency
 * across the extension lifecycle.
 */
export class StateManager {
    private state: Map<string, any> = new Map();
    private listeners: Map<string, Set<StateChangeListener>> = new Map();
    private globalListeners: Set<StateChangeListener> = new Set();
    private persistenceOptions: Map<string, StatePersistenceOptions> = new Map();
    private persistenceTimers: Map<string, NodeJS.Timeout> = new Map();
    private context: vscode.ExtensionContext | null = null;

    /**
     * Creates a new StateManager instance
     * 
     * The constructor initializes the state manager and optionally sets up
     * persistence capabilities by providing a VS Code extension context.
     * If a context is provided, previously persisted state will be loaded.
     * 
     * @param context - VS Code extension context for persistence. If provided,
     *                 enables automatic state persistence and restoration.
     */
    constructor(context?: vscode.ExtensionContext) {
        if (context) {
            this.context = context;
            this.loadPersistedState();
        }
    }

    /**
     * Sets a state value and notifies listeners
     * 
     * This method updates the value associated with a key in the state.
     * If the value has changed, it notifies all registered listeners and
     * schedules persistence if enabled. The method uses strict equality
     * comparison to avoid unnecessary updates and notifications.
     * 
     * @param key - State key identifier. Must be a unique string.
     * @param value - State value to store. Can be of any type.
     * @param options - Optional persistence configuration. If provided and enabled,
     *                 the state will be automatically persisted to VS Code storage.
     */
    set<T>(key: string, value: T, options?: StatePersistenceOptions): void {
        const oldValue = this.state.get(key);
        
        // Only update if value has changed to avoid unnecessary notifications
        if (oldValue !== value) {
            this.state.set(key, value);
            
            // Notify all listeners about the state change
            this.notifyListeners(key, oldValue, value);
            
            // Handle persistence if enabled
            if (options?.enabled) {
                this.persistenceOptions.set(key, options);
                this.schedulePersistence(key);
            }
        }
    }

    /**
     * Gets a state value
     * 
     * Retrieves the value associated with the specified key. If the key
     * doesn't exist in the state, returns the provided default value
     * or undefined if no default is specified.
     * 
     * @param key - State key identifier to retrieve
     * @param defaultValue - Optional default value to return if key doesn't exist
     * @returns State value if key exists, otherwise the default value or undefined
     */
    get<T>(key: string, defaultValue?: T): T | undefined {
        return this.state.has(key) ? this.state.get(key) : defaultValue;
    }

    /**
     * Checks if a state key exists
     * 
     * Determines whether the specified key is present in the state
     * without retrieving the actual value.
     * 
     * @param key - State key identifier to check
     * @returns True if key exists in state, false otherwise
     */
    has(key: string): boolean {
        return this.state.has(key);
    }

    /**
     * Deletes a state value
     * 
     * Removes the specified key and its associated value from the state.
     * Notifies listeners about the deletion and cleans up any related
     * persistence options and timers.
     * 
     * @param key - State key identifier to delete
     */
    delete(key: string): void {
        const oldValue = this.state.get(key);
        this.state.delete(key);
        
        // Notify listeners that the value has been removed (set to undefined)
        this.notifyListeners(key, oldValue, undefined);
        
        // Clear persistence options and timers for this key
        this.persistenceOptions.delete(key);
        const timer = this.persistenceTimers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.persistenceTimers.delete(key);
        }
    }

    /**
     * Clears all state
     * 
     * Removes all key-value pairs from the state, notifies all listeners
     * about each deletion, and cleans up persistence-related data.
     * This method is useful for resetting the application state.
     */
    clear(): void {
        // Create a copy of the current state to notify listeners
        const oldState = new Map(this.state);
        this.state.clear();
        
        // Notify all listeners about each deleted key-value pair
        oldState.forEach((value, key) => {
            this.notifyListeners(key, value, undefined);
        });
        
        // Clear all persistence-related data
        this.persistenceOptions.clear();
        this.persistenceTimers.forEach(timer => clearTimeout(timer));
        this.persistenceTimers.clear();
    }

    /**
     * Subscribes to state changes for a specific key
     * 
     * Registers a listener function that will be called whenever the value
     * associated with the specified key changes. The listener receives
     * a StateChangeEvent object containing details about the change.
     * 
     * @param key - State key to watch for changes
     * @param listener - Callback function to execute when the key's value changes
     * @returns Unsubscribe function that, when called, removes the listener
     */
    subscribe<T>(key: string, listener: StateChangeListener<T>): () => void {
        // Initialize the Set for this key if it doesn't exist
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        
        // Add the listener to the key's listener set
        this.listeners.get(key)!.add(listener);
        
        // Return an unsubscribe function for cleanup
        return () => {
            const keyListeners = this.listeners.get(key);
            if (keyListeners) {
                keyListeners.delete(listener);
                // Clean up empty sets to prevent memory leaks
                if (keyListeners.size === 0) {
                    this.listeners.delete(key);
                }
            }
        };
    }

    /**
     * Subscribes to all state changes
     * 
     * Registers a global listener function that will be called whenever
     * any state value changes, regardless of the key. This is useful for
     * components that need to react to any state change in the application.
     * 
     * @param listener - Callback function to execute when any state value changes
     * @returns Unsubscribe function that, when called, removes the global listener
     */
    subscribeAll(listener: StateChangeListener): () => void {
        this.globalListeners.add(listener);
        
        // Return an unsubscribe function for cleanup
        return () => {
            this.globalListeners.delete(listener);
        };
    }

    /**
     * Gets all state keys
     * 
     * Returns an array of all keys currently stored in the state.
     * The order of keys is not guaranteed.
     * 
     * @returns Array of all state keys
     */
    keys(): string[] {
        return Array.from(this.state.keys());
    }

    /**
     * Gets all state values
     * 
     * Returns an array of all values currently stored in the state.
     * The order of values corresponds to the order of keys returned by keys().
     * 
     * @returns Array of all state values
     */
    values(): any[] {
        return Array.from(this.state.values());
    }

    /**
     * Gets all state entries
     * 
     * Returns an array of key-value pairs for all entries in the state.
     * Each entry is a tuple where the first element is the key and the
     * second element is the associated value.
     * 
     * @returns Array of [key, value] pairs representing all state entries
     */
    entries(): [string, any][] {
        return Array.from(this.state.entries());
    }

    /**
     * Gets the size of the state
     * 
     * Returns the number of key-value pairs currently stored in the state.
     * This is equivalent to the length of the array returned by keys().
     * 
     * @returns Number of state entries
     */
    size(): number {
        return this.state.size;
    }

    /**
     * Transforms state using a provided function
     * 
     * Creates a new StateManager instance with transformed state based on
     * the provided transformer function. The original StateManager remains
     * unchanged. This is useful for creating derived state or applying
     * transformations without modifying the original state.
     * 
     * @param transformer - Function that takes the current state Map and
     *                     returns a new transformed Map
     * @returns New StateManager instance containing the transformed state
     */
    transform(transformer: (state: Map<string, any>) => Map<string, any>): StateManager {
        // Create a copy of the current state to pass to the transformer
        const newState = transformer(new Map(this.state));
        
        // Create a new StateManager with the transformed state
        const newManager = new StateManager();
        newManager.state = newState;
        return newManager;
    }

    /**
     * Validates state using a validator function
     * 
     * Checks if the current state meets certain criteria defined by the
     * validator function. This is useful for ensuring state integrity
     * or validating business rules.
     * 
     * @param validator - Function that takes the state Map and returns
     *                   true if the state is valid, false otherwise
     * @returns True if the state is valid according to the validator, false otherwise
     */
    validate(validator: (state: Map<string, any>) => boolean): boolean {
        // Create a copy of the state to pass to the validator
        return validator(new Map(this.state));
    }

    /**
     * Sets the extension context for persistence
     * 
     * Configures the StateManager with a VS Code extension context, enabling
     * state persistence capabilities. If called after initialization, it will
     * also load any previously persisted state.
     * 
     * @param context - VS Code extension context for persistence
     */
    setContext(context: vscode.ExtensionContext): void {
        this.context = context;
        this.loadPersistedState();
    }

    /**
     * Notifies listeners of state changes
     * 
     * This private method is responsible for notifying all relevant listeners
     * when a state change occurs. It creates a StateChangeEvent object and
     * passes it to both key-specific listeners and global listeners.
     * Errors in listener callbacks are caught and logged to prevent
     * one faulty listener from breaking the notification system.
     */
    private notifyListeners<T>(key: string, oldValue: T | undefined, newValue: T | undefined): void {
        // Create the event object with change details
        const event: StateChangeEvent<T> = {
            key,
            oldValue,
            newValue: newValue as T,
            timestamp: new Date()
        };

        // Notify key-specific listeners
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
            keyListeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    // Log errors but continue notifying other listeners
                    console.error(`StateManager: Error in listener for key '${key}':`, error);
                }
            });
        }

        // Notify global listeners
        this.globalListeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                // Log errors but continue notifying other listeners
                console.error('StateManager: Error in global listener:', error);
            }
        });
    }

    /**
     * Schedules persistence for a state key
     * 
     * This private method handles the debouncing of state persistence to
     * optimize performance. It clears any existing timer for the key and
     * schedules a new persistence operation after the configured delay.
     * This prevents excessive writes to VS Code storage during rapid state changes.
     */
    private schedulePersistence(key: string): void {
        const options = this.persistenceOptions.get(key);
        if (!options || !this.context) {
            return;
        }

        // Clear any existing timer to prevent multiple pending operations
        const existingTimer = this.persistenceTimers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Schedule new persistence with debouncing
        const debounceMs = options.debounceMs || 1000; // Default to 1 second
        const timer = setTimeout(() => {
            this.persistState(key);
            this.persistenceTimers.delete(key);
        }, debounceMs);

        this.persistenceTimers.set(key, timer);
    }

    /**
     * Persists state to VS Code storage
     * 
     * This private method saves the current value of a state key to
     * VS Code's storage system. It uses either global or workspace storage
     * based on the configuration options. Errors during persistence are
     * caught and logged to prevent them from breaking the application.
     */
    private persistState(key: string): void {
        if (!this.context) {
            return;
        }

        const options = this.persistenceOptions.get(key);
        if (!options) {
            return;
        }

        try {
            const value = this.state.get(key);
            // Use the custom key if provided, otherwise generate a default one
            const storageKey = options.key || `state.${key}`;
            
            // Persist to the appropriate storage scope
            if (options.scope === 'workspace') {
                this.context.workspaceState.update(storageKey, value);
            } else {
                this.context.globalState.update(storageKey, value);
            }
            
            console.log(`StateManager: Persisted state for key '${key}'`);
        } catch (error) {
            console.error(`StateManager: Failed to persist state for key '${key}':`, error);
        }
    }

    /**
     * Loads persisted state from VS Code storage
     * 
     * This private method restores previously saved state from VS Code's
     * storage system. It checks both global and workspace storage for keys
     * that match the expected pattern and loads them into the current state.
     * This is typically called during initialization or when setting the context.
     */
    private loadPersistedState(): void {
        if (!this.context) {
            return;
        }

        try {
            // Load from global state storage
            const globalKeys = this.context.globalState.keys();
            globalKeys.forEach(key => {
                if (key.startsWith('state.')) {
                    const stateKey = key.substring(6); // Remove 'state.' prefix
                    const value = this.context!.globalState.get(key);
                    if (value !== undefined) {
                        this.state.set(stateKey, value);
                    }
                }
            });

            // Load from workspace state storage
            const workspaceKeys = this.context.workspaceState.keys();
            workspaceKeys.forEach(key => {
                if (key.startsWith('state.')) {
                    const stateKey = key.substring(6); // Remove 'state.' prefix
                    const value = this.context!.workspaceState.get(key);
                    if (value !== undefined) {
                        this.state.set(stateKey, value);
                    }
                }
            });

            console.log('StateManager: Loaded persisted state');
        } catch (error) {
            console.error('StateManager: Failed to load persisted state:', error);
        }
    }

    /**
     * Disposes of the StateManager and cleans up resources
     *
     * This method should be called when the StateManager is no longer needed
     * to prevent memory leaks. It clears all pending persistence timers,
     * removes all listeners, and performs any other necessary cleanup.
     */
    dispose(): void {
        // Clear all pending persistence timers to prevent memory leaks
        this.persistenceTimers.forEach(timer => clearTimeout(timer));
        this.persistenceTimers.clear();

        // Clear all listener references to prevent memory leaks
        this.listeners.clear();
        this.globalListeners.clear();

        console.log('StateManager: Disposed');
    }

    // Legacy compatibility methods for IndexingService
    // These methods provide backward compatibility with the expected interface

    /**
     * Checks if indexing is currently in progress
     * @returns True if indexing is active, false otherwise
     */
    isIndexing(): boolean {
        return this.get('isIndexing', false) as boolean;
    }

    /**
     * Sets the indexing state
     * @param isIndexing - True if indexing is starting, false if stopping
     * @param message - Optional message describing the indexing state
     */
    setIndexing(isIndexing: boolean, message?: string): void {
        this.set('isIndexing', isIndexing);
        if (message) {
            this.set('indexingMessage', message);
        }
    }

    /**
     * Sets an error message
     * @param error - Error message to store
     */
    setError(error: string): void {
        this.set('lastError', error);
    }

    /**
     * Gets the last error message
     * @returns The last error message or null if no error
     */
    getLastError(): string | null {
        return this.get('lastError', null) as string | null;
    }

    /**
     * Clears the last error
     */
    clearError(): void {
        this.set('lastError', null);
    }

    /**
     * Checks if indexing is currently paused
     * @returns True if indexing is paused, false otherwise
     */
    isPaused(): boolean {
        return this.get('isPaused', false) as boolean;
    }

    /**
     * Sets the paused state for indexing
     * @param isPaused - True if indexing should be paused, false otherwise
     */
    setPaused(isPaused: boolean): void {
        this.set('isPaused', isPaused);
        // When pausing, we're still technically indexing, just paused
        // When resuming, we continue indexing
        if (!isPaused && this.isPaused()) {
            // Resuming from pause - ensure indexing state is maintained
            this.set('isIndexing', true);
        }
    }

    /**
     * Gets the current indexing message
     * @returns The current indexing status message
     */
    getIndexingMessage(): string | null {
        return this.get('indexingMessage', null) as string | null;
    }

    /**
     * Sets the indexing message
     * @param message - Status message for indexing operations
     */
    setIndexingMessage(message: string | null): void {
        this.set('indexingMessage', message);
    }
}