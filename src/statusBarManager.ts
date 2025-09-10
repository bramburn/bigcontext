import * as vscode from 'vscode';
import { CentralizedLoggingService } from './logging/centralizedLoggingService';
import { NotificationService } from './notifications/notificationService';
import { IndexState } from './types/indexing';
import { IIndexingService } from './services/indexingService';

/**
 * Status bar item configuration interface
 * 
 * Defines the structure for configuring a status bar item in VS Code.
 * This interface allows for comprehensive customization of status bar items
 * including text, tooltips, commands, alignment, priority, and styling.
 */
export interface StatusBarConfig {
    /** Unique identifier for the status bar item */
    id: string;
    /** Text to display in the status bar */
    text: string;
    /** Optional tooltip text shown on hover */
    tooltip?: string;
    /** Optional command to execute when clicked */
    command?: string;
    /** Alignment of the item (left or right side of status bar) */
    alignment?: 'left' | 'right';
    /** Priority for positioning when multiple items are on the same side */
    priority?: number;
    /** Text color using VS Code theme color identifier */
    color?: string;
    /** Background color using VS Code theme color identifier */
    backgroundColor?: string;
}

/**
 * Enhanced status bar item with metadata
 * 
 * Extends the basic VS Code status bar item with additional metadata
 * for tracking state, configuration, and update history. This interface
 * is used internally by the StatusBarManager to maintain item state.
 */
export interface StatusBarItem {
    /** Unique identifier for the status bar item */
    id: string;
    /** The actual VS Code status bar item instance */
    item: vscode.StatusBarItem;
    /** Configuration object for the status bar item */
    config: StatusBarConfig;
    /** Current visibility state of the item */
    visible: boolean;
    /** Timestamp of the last update to the item */
    lastUpdated: Date;
}

/**
 * Centralized manager for VS Code status bar items
 * 
 * The StatusBarManager class provides a comprehensive solution for creating,
 * configuring, and managing VS Code status bar items. It offers:
 * - Dynamic creation and configuration of status bar items with full customization
 * - Visibility control and state management for all items
 * - Automatic cleanup and disposal to prevent memory leaks
 * - Event-driven updates that respond to VS Code configuration changes
 * - Priority-based positioning and alignment control
 * - Debounced update mechanism to optimize performance
 * - Comprehensive error handling and logging
 * 
 * This class serves as a singleton-like manager that centralizes all status bar
 * operations, making it easier to maintain and extend status bar functionality.
 */
export class StatusBarManager {
    /** Map storing all status bar items by their unique IDs */
    private items: Map<string, StatusBarItem> = new Map();
    /** Array of disposable resources for cleanup */
    private disposables: vscode.Disposable[] = [];
    /** Queue for debouncing status bar updates */
    private updateQueue: Map<string, StatusBarConfig> = new Map();
    /** Timer reference for debouncing updates */
    private updateTimer: NodeJS.Timeout | null = null;
    /** Debounce delay in milliseconds for status bar updates */
    private readonly updateDebounceMs = 100;
    /** Centralized logging service for unified logging */
    private loggingService: CentralizedLoggingService;
    /** Notification service for user notifications */
    private notificationService: NotificationService;
    /** Indexing service for monitoring index state */
    private indexingService?: IIndexingService;
    /** ID for the indexing status bar item */
    private readonly indexingStatusId = 'bigcontext.indexing.status';

    /**
     * Initializes a new StatusBarManager instance
     *
     * The constructor sets up the initial state of the manager and
     * registers event listeners for automatic updates when VS Code
     * configuration changes occur.
     *
     * @param loggingService - The CentralizedLoggingService instance for logging
     * @param notificationService - The NotificationService instance for user notifications
     * @param context - VS Code extension context (optional for backward compatibility)
     * @param stateManager - StateManager instance (optional for backward compatibility)
     */
    constructor(
        loggingService: CentralizedLoggingService,
        notificationService: NotificationService,
        context?: vscode.ExtensionContext,
        stateManager?: any
    ) {
        this.loggingService = loggingService;
        this.notificationService = notificationService;

        // Store references for potential future use
        if (context) {
            // Could be used for persistence or other context-dependent features
        }
        if (stateManager) {
            // Could be used for state-driven status bar updates
        }

        this.setupEventListeners();
    }

    /**
     * Creates a new status bar item with the specified configuration
     * 
     * This method creates a new VS Code status bar item and configures it
     * according to the provided configuration. The item is stored internally
     * for future management operations.
     * 
     * @param config - Configuration object defining the status bar item properties
     * @returns The unique ID of the created status bar item
     * @throws Error if the status bar item creation fails
     */
    createItem(config: StatusBarConfig): string {
        try {
            this.loggingService.info('Creating status bar item', { configId: config.id }, 'StatusBarManager');

            // Check if item already exists to prevent duplicates
            if (this.items.has(config.id)) {
                this.loggingService.warn(`Item with ID '${config.id}' already exists`, {}, 'StatusBarManager');
                return config.id;
            }

            // Create VS Code status bar item with specified alignment and priority
            // Default to right alignment if not specified
            const alignment = config.alignment === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right;
            const priority = config.priority || 0;
            
            const item = vscode.window.createStatusBarItem(alignment, priority);
            
            // Configure the item with all provided properties
            item.text = config.text;
            if (config.tooltip) {
                item.tooltip = config.tooltip;
            }
            if (config.command) {
                item.command = config.command;
            }
            if (config.color) {
                item.color = new vscode.ThemeColor(config.color);
            }
            if (config.backgroundColor) {
                item.backgroundColor = new vscode.ThemeColor(config.backgroundColor);
            }

            // Create and store the enhanced status bar item with metadata
            const statusBarItem: StatusBarItem = {
                id: config.id,
                item,
                config,
                visible: false, // Items are created hidden by default
                lastUpdated: new Date()
            };

            this.items.set(config.id, statusBarItem);
            
            this.loggingService.info(`Created status bar item '${config.id}'`, {}, 'StatusBarManager');
            return config.id;

        } catch (error) {
            this.loggingService.error('Failed to create status bar item', { error: error instanceof Error ? error.message : String(error) }, 'StatusBarManager');
            throw error;
        }
    }

    /**
     * Updates an existing status bar item with new configuration
     * 
     * This method updates the configuration of an existing status bar item.
     * Updates are debounced to optimize performance when multiple updates
     * occur in rapid succession.
     * 
     * @param id - Unique identifier of the status bar item to update
     * @param config - Partial configuration object with properties to update
     */
    updateItem(id: string, config: Partial<StatusBarConfig>): void {
        try {
            const statusBarItem = this.items.get(id);
            if (!statusBarItem) {
                console.warn(`StatusBarManager: Item with ID '${id}' not found`);
                return;
            }

            // Queue the update for debounced processing
            // This prevents rapid successive updates from causing performance issues
            this.updateQueue.set(id, { ...statusBarItem.config, ...config });
            this.scheduleUpdate();

        } catch (error) {
            console.error('StatusBarManager: Failed to update status bar item:', error);
        }
    }

    /**
     * Displays a previously created status bar item
     * 
     * This method makes a hidden status bar item visible in the VS Code status bar.
     * If the item doesn't exist, a warning is logged.
     * 
     * @param id - Unique identifier of the status bar item to show
     */
    showItem(id: string): void {
        try {
            const statusBarItem = this.items.get(id);
            if (!statusBarItem) {
                console.warn(`StatusBarManager: Item with ID '${id}' not found`);
                return;
            }

            statusBarItem.item.show();
            statusBarItem.visible = true;
            statusBarItem.lastUpdated = new Date();

            console.log(`StatusBarManager: Showed status bar item '${id}'`);

        } catch (error) {
            console.error('StatusBarManager: Failed to show status bar item:', error);
        }
    }

    /**
     * Hides a visible status bar item
     * 
     * This method removes a status bar item from view in the VS Code status bar.
     * The item remains in memory and can be shown again later.
     * 
     * @param id - Unique identifier of the status bar item to hide
     */
    hideItem(id: string): void {
        try {
            const statusBarItem = this.items.get(id);
            if (!statusBarItem) {
                console.warn(`StatusBarManager: Item with ID '${id}' not found`);
                return;
            }

            statusBarItem.item.hide();
            statusBarItem.visible = false;
            statusBarItem.lastUpdated = new Date();

            console.log(`StatusBarManager: Hid status bar item '${id}'`);

        } catch (error) {
            console.error('StatusBarManager: Failed to hide status bar item:', error);
        }
    }

    /**
     * Toggles the visibility of a status bar item
     * 
     * This method switches the visibility state of a status bar item.
     * If the item is visible, it will be hidden, and vice versa.
     * 
     * @param id - Unique identifier of the status bar item to toggle
     */
    toggleItem(id: string): void {
        try {
            const statusBarItem = this.items.get(id);
            if (!statusBarItem) {
                console.warn(`StatusBarManager: Item with ID '${id}' not found`);
                return;
            }

            // Delegate to showItem or hideItem based on current visibility state
            if (statusBarItem.visible) {
                this.hideItem(id);
            } else {
                this.showItem(id);
            }

        } catch (error) {
            console.error('StatusBarManager: Failed to toggle status bar item:', error);
        }
    }

    /**
     * Retrieves a status bar item by its unique identifier
     * 
     * This method returns the enhanced status bar item object including
     * metadata, or undefined if no item with the specified ID exists.
     * 
     * @param id - Unique identifier of the status bar item to retrieve
     * @returns The status bar item with metadata, or undefined if not found
     */
    getItem(id: string): StatusBarItem | undefined {
        return this.items.get(id);
    }

    /**
     * Retrieves all managed status bar items
     * 
     * This method returns an array of all status bar items currently managed
     * by this StatusBarManager instance, regardless of their visibility state.
     * 
     * @returns Array of all status bar items with their metadata
     */
    getAllItems(): StatusBarItem[] {
        return Array.from(this.items.values());
    }

    /**
     * Retrieves all visible status bar items
     * 
     * This method returns an array of status bar items that are currently
     * visible in the VS Code status bar.
     * 
     * @returns Array of visible status bar items with their metadata
     */
    getVisibleItems(): StatusBarItem[] {
        return Array.from(this.items.values()).filter(item => item.visible);
    }

    /**
     * Deletes a status bar item and cleans up resources
     * 
     * This method permanently removes a status bar item from the manager
     * and disposes of the underlying VS Code status bar item to prevent
     * memory leaks. The item cannot be recovered after deletion.
     * 
     * @param id - Unique identifier of the status bar item to delete
     */
    deleteItem(id: string): void {
        try {
            const statusBarItem = this.items.get(id);
            if (!statusBarItem) {
                console.warn(`StatusBarManager: Item with ID '${id}' not found`);
                return;
            }

            // Dispose the VS Code item to free up resources
            statusBarItem.item.dispose();
            
            // Remove from our internal maps
            this.items.delete(id);
            this.updateQueue.delete(id);

            console.log(`StatusBarManager: Deleted status bar item '${id}'`);

        } catch (error) {
            console.error('StatusBarManager: Failed to delete status bar item:', error);
        }
    }

    /**
     * Updates the text of a status bar item
     * 
     * This is a convenience method that updates only the text property
     * of a status bar item using the debounced update mechanism.
     * 
     * @param id - Unique identifier of the status bar item
     * @param text - New text to display
     */
    setText(id: string, text: string): void {
        this.updateItem(id, { text });
    }

    /**
     * Updates the tooltip of a status bar item
     * 
     * This is a convenience method that updates only the tooltip property
     * of a status bar item using the debounced update mechanism.
     * 
     * @param id - Unique identifier of the status bar item
     * @param tooltip - New tooltip text to show on hover
     */
    setTooltip(id: string, tooltip: string): void {
        this.updateItem(id, { tooltip });
    }

    /**
     * Updates the command of a status bar item
     * 
     * This is a convenience method that updates only the command property
     * of a status bar item using the debounced update mechanism.
     * 
     * @param id - Unique identifier of the status bar item
     * @param command - New command to execute on click
     */
    setCommand(id: string, command: string): void {
        this.updateItem(id, { command });
    }

    /**
     * Updates the text color of a status bar item
     * 
     * This is a convenience method that updates only the color property
     * of a status bar item using the debounced update mechanism.
     * 
     * @param id - Unique identifier of the status bar item
     * @param color - New color using VS Code theme color identifier
     */
    setColor(id: string, color: string): void {
        this.updateItem(id, { color });
    }

    /**
     * Updates the background color of a status bar item
     * 
     * This is a convenience method that updates only the background color property
     * of a status bar item using the debounced update mechanism.
     * 
     * @param id - Unique identifier of the status bar item
     * @param backgroundColor - New background color using VS Code theme color identifier
     */
    setBackgroundColor(id: string, backgroundColor: string): void {
        this.updateItem(id, { backgroundColor });
    }

    /**
     * Displays a temporary message in the status bar
     *
     * This method shows a temporary message in the VS Code status bar that
     * automatically disappears after the specified timeout. This is useful for
     * showing transient notifications or status updates.
     *
     * @param text - Message text to display
     * @param hideAfterTimeout - Time in milliseconds after which the message should be hidden (default: 3000ms)
     */
    showTemporaryMessage(text: string, hideAfterTimeout: number = 3000): void {
        try {
            vscode.window.setStatusBarMessage(text, hideAfterTimeout);
            console.log('StatusBarManager: Showed temporary message');
        } catch (error) {
            console.error('StatusBarManager: Failed to show temporary message:', error);
        }
    }

    /**
     * Sets up indexing status monitoring
     *
     * This method initializes the indexing status bar item and sets up
     * automatic updates based on the IndexingService state changes.
     *
     * @param indexingService - The IndexingService instance to monitor
     */
    setupIndexingStatus(indexingService: IIndexingService): void {
        try {
            this.indexingService = indexingService;

            // Create the indexing status bar item
            this.createItem({
                id: this.indexingStatusId,
                text: '$(sync~spin) Initializing...',
                tooltip: 'BigContext Indexing Status',
                command: 'bigcontext.showIndexingStatus',
                alignment: 'right',
                priority: 100
            });

            // Set up state change listener
            const stateChangeDisposable = indexingService.onStateChange(
                this.updateIndexingStatus.bind(this)
            );
            this.disposables.push(stateChangeDisposable);

            // Show the status item
            this.showItem(this.indexingStatusId);

            // Update with current state
            this.updateIndexingStatusFromService();

            this.loggingService.info('Indexing status monitoring setup complete', {}, 'StatusBarManager');
        } catch (error) {
            this.loggingService.error('Failed to setup indexing status monitoring', { error: error instanceof Error ? error.message : String(error) }, 'StatusBarManager');
        }
    }

    /**
     * Updates the indexing status bar item based on the current state
     *
     * @param state - The current IndexState
     */
    private updateIndexingStatus(state: IndexState): void {
        try {
            const statusConfig = this.getStatusConfigForState(state);
            this.updateItem(this.indexingStatusId, statusConfig);
        } catch (error) {
            this.loggingService.error('Failed to update indexing status', { error: error instanceof Error ? error.message : String(error) }, 'StatusBarManager');
        }
    }

    /**
     * Gets the status bar configuration for a given IndexState
     *
     * @param state - The IndexState to get configuration for
     * @returns StatusBarConfig with appropriate text, tooltip, and color
     */
    private getStatusConfigForState(state: IndexState): Partial<StatusBarConfig> {
        switch (state) {
            case 'idle':
                return {
                    text: '$(check) Indexed',
                    tooltip: 'BigContext: Indexing complete - Ready for search',
                    color: 'statusBarItem.prominentForeground'
                };

            case 'indexing':
                return {
                    text: '$(sync~spin) Indexing...',
                    tooltip: 'BigContext: Indexing in progress - Click to view details',
                    color: 'statusBarItem.prominentForeground'
                };

            case 'paused':
                return {
                    text: '$(debug-pause) Paused',
                    tooltip: 'BigContext: Indexing paused - Click to resume',
                    color: 'statusBarItem.warningForeground'
                };

            case 'error':
                return {
                    text: '$(error) Error',
                    tooltip: 'BigContext: Indexing error - Click to view details',
                    color: 'statusBarItem.errorForeground'
                };

            default:
                return {
                    text: '$(question) Unknown',
                    tooltip: 'BigContext: Unknown indexing state',
                    color: 'statusBarItem.foreground'
                };
        }
    }

    /**
     * Updates the indexing status from the IndexingService
     *
     * This method queries the current state from the IndexingService
     * and updates the status bar accordingly.
     */
    private async updateIndexingStatusFromService(): Promise<void> {
        if (!this.indexingService) {
            return;
        }

        try {
            const currentState = await this.indexingService.getIndexState();
            this.updateIndexingStatus(currentState);
        } catch (error) {
            this.loggingService.error('Failed to get current indexing state', { error: error instanceof Error ? error.message : String(error) }, 'StatusBarManager');

            // Show error state if we can't get the current state
            this.updateIndexingStatus('error');
        }
    }

    /**
     * Hides the indexing status bar item
     */
    hideIndexingStatus(): void {
        this.hideItem(this.indexingStatusId);
    }

    /**
     * Shows the indexing status bar item
     */
    showIndexingStatus(): void {
        this.showItem(this.indexingStatusId);
    }

    /**
     * Schedules debounced processing of the update queue
     * 
     * This private method implements a debouncing mechanism for status bar updates.
     * When called, it cancels any existing timer and sets a new one to process
     * the update queue after a short delay. This prevents performance issues
     * when multiple updates occur in rapid succession.
     */
    private scheduleUpdate(): void {
        // Cancel any existing timer to reset the debounce period
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }

        // Set a new timer to process the update queue after the debounce delay
        this.updateTimer = setTimeout(() => {
            this.processUpdateQueue();
            this.updateTimer = null;
        }, this.updateDebounceMs);
    }

    /**
     * Processes all pending updates in the update queue
     * 
     * This private method applies all queued updates to their respective
     * status bar items. It iterates through the update queue, applies each
     * update to the corresponding VS Code status bar item, and updates the
     * internal metadata. Finally, it clears the queue.
     */
    private processUpdateQueue(): void {
        try {
            // Process each update in the queue
            this.updateQueue.forEach((config, id) => {
                const statusBarItem = this.items.get(id);
                if (!statusBarItem) {
                    return; // Skip if item no longer exists
                }

                // Update the VS Code item properties only if they are defined in the config
                // This prevents overwriting existing values with undefined
                if (config.text !== undefined) {
                    statusBarItem.item.text = config.text;
                }
                if (config.tooltip !== undefined) {
                    statusBarItem.item.tooltip = config.tooltip;
                }
                if (config.command !== undefined) {
                    statusBarItem.item.command = config.command;
                }
                if (config.color !== undefined) {
                    statusBarItem.item.color = new vscode.ThemeColor(config.color);
                }
                if (config.backgroundColor !== undefined) {
                    statusBarItem.item.backgroundColor = new vscode.ThemeColor(config.backgroundColor);
                }

                // Update our stored configuration and metadata
                statusBarItem.config = { ...statusBarItem.config, ...config };
                statusBarItem.lastUpdated = new Date();

                console.log(`StatusBarManager: Updated status bar item '${id}'`);
            });

            // Clear the queue after processing all updates
            this.updateQueue.clear();

        } catch (error) {
            console.error('StatusBarManager: Failed to process update queue:', error);
        }
    }

    /**
     * Sets up event listeners for automatic updates
     * 
     * This private method registers event listeners that respond to VS Code
     * configuration changes. When the configuration changes, it automatically
     * updates theme-related properties of all status bar items to ensure
     * consistent styling.
     */
    private setupEventListeners(): void {
        // Listen for VS Code configuration changes
        const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
            console.log('StatusBarManager: Configuration changed, updating status bar items');
            
            // Update all items to reflect potential theme changes
            // This ensures that status bar items maintain consistent styling
            // when the user changes VS Code themes or color settings
            this.items.forEach((statusBarItem, id) => {
                // Re-apply theme colors if they exist in the item's configuration
                if (statusBarItem.config.color) {
                    statusBarItem.item.color = new vscode.ThemeColor(statusBarItem.config.color);
                }
                if (statusBarItem.config.backgroundColor) {
                    statusBarItem.item.backgroundColor = new vscode.ThemeColor(statusBarItem.config.backgroundColor);
                }
            });
        });

        // Store the listener for cleanup during disposal
        this.disposables.push(configChangeListener);
    }

    /**
     * Disposes of the StatusBarManager and cleans up all resources
     * 
     * This method performs a complete cleanup of all resources used by the
     * StatusBarManager, including:
     * - Canceling any pending update timers
     * - Disposing all VS Code status bar items
     * - Clearing internal data structures
     * - Disposing all event listeners
     * 
     * This should be called when the StatusBarManager is no longer needed
     * to prevent memory leaks and ensure proper cleanup.
     */
    dispose(): void {
        try {
            // Clear any pending update timer
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
                this.updateTimer = null;
            }

            // Clean up indexing service reference
            this.indexingService = undefined;

            // Dispose all VS Code status bar items to free resources
            this.items.forEach(statusBarItem => {
                statusBarItem.item.dispose();
            });
            this.items.clear();

            // Clear the update queue
            this.updateQueue.clear();

            // Dispose all event listeners to prevent memory leaks
            this.disposables.forEach(disposable => disposable.dispose());
            this.disposables = [];

            console.log('StatusBarManager: Disposed');

        } catch (error) {
            console.error('StatusBarManager: Error during disposal:', error);
        }
    }
}