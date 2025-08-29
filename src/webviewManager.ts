import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MessageRouter } from './messageRouter';
import { ExtensionManager } from './extensionManager';
import { CentralizedLoggingService } from './logging/centralizedLoggingService';
import { NotificationService } from './notifications/notificationService';

/**
 * Webview panel configuration interface
 * 
 * Defines the configuration options for creating a webview panel in VS Code.
 * These options determine how the webview behaves, what resources it can access,
 * and how it's displayed in the editor.
 */
export interface WebviewConfig {
    /** Unique identifier for the webview panel */
    id: string;
    /** Title displayed in the webview panel's tab */
    title: string;
    /** Editor column where the webview should be shown (defaults to first column) */
    viewColumn?: vscode.ViewColumn;
    /** Whether to preserve focus when showing the panel (defaults to false) */
    preserveFocus?: boolean;
    /** Whether to enable JavaScript in the webview (defaults to true) */
    enableScripts?: boolean;
    /** Whether to enable command URIs in the webview (defaults to false) */
    enableCommandUris?: boolean;
    /** Local resources that the webview can access (defaults to resources folder) */
    localResourceRoots?: vscode.Uri[];
    /** Port mapping for local development servers */
    portMapping?: vscode.WebviewPortMapping[];
}

/**
 * Enhanced webview panel interface with metadata
 * 
 * Extends the basic VS Code webview panel with additional metadata for tracking
 * panel state, configuration, and message handlers. This interface provides
 * a comprehensive view of the webview panel's current state and capabilities.
 */
export interface WebviewPanel {
    /** Unique identifier for the webview panel */
    id: string;
    /** The underlying VS Code webview panel */
    panel: vscode.WebviewPanel;
    /** Configuration used to create this panel */
    config: WebviewConfig;
    /** Whether the panel is currently visible */
    visible: boolean;
    /** Timestamp of the last update to this panel */
    lastUpdated: Date;
    /** Map of message type to handler functions for processing webview messages */
    messageHandlers: Map<string, Function>;
}

/**
 * Webview message structure
 * 
 * Defines the standard format for messages exchanged between the extension
 * and webview content. This standardized format ensures consistent
 * message handling and processing across all webview communications.
 */
export interface WebviewMessage {
    /** Type of message for routing to appropriate handlers */
    type: string;
    /** Message payload containing the actual data */
    data: any;
    /** Timestamp when the message was created */
    timestamp: Date;
}

/**
 * Centralized webview management system for VS Code extensions
 * 
 * The WebviewManager class provides a comprehensive solution for managing multiple
 * webview panels within a VS Code extension. It handles the complete lifecycle of
 * webview panels including creation, configuration, message passing, resource management,
 * and disposal. This manager implements a debounced message queue system to optimize
 * performance and prevent excessive updates to webview content.
 * 
 * Key features:
 * - Dynamic creation and configuration of webview panels with customizable options
 * - Bidirectional message passing between extension and webview content
 * - Resource management with secure local file access through webview URIs
 * - Panel lifecycle management with proper disposal and cleanup
 * - Event-driven updates and notifications with debouncing for performance
 * - Centralized error handling and logging throughout all operations
 */
export class WebviewManager implements vscode.WebviewViewProvider {
    /** Extension context for resolving webview URIs */
    private context: vscode.ExtensionContext;
    /** Extension manager for accessing all services */
    private extensionManager: ExtensionManager;
    /** Centralized logging service for unified logging */
    private loggingService: CentralizedLoggingService;
    /** Notification service for user notifications */
    private notificationService: NotificationService;
    /** Map storing all managed webview panels by their unique IDs */
    private panels: Map<string, WebviewPanel> = new Map();
    /** Array of disposable resources for cleanup */
    private disposables: vscode.Disposable[] = [];
    /** Message queues for each panel to enable debounced updates */
    private messageQueue: Map<string, WebviewMessage[]> = new Map();
    /** Update timers for debouncing message processing */
    private updateTimers: Map<string, NodeJS.Timeout> = new Map();
    /** Debounce delay in milliseconds for message processing */
    private readonly updateDebounceMs = 100;

    /** Reference to the main panel for single-instance management */
    private mainPanel: vscode.WebviewPanel | undefined;
    /** Reference to the settings panel for single-instance management */
    private settingsPanel: vscode.WebviewPanel | undefined;

    /**
     * Initializes a new WebviewManager instance
     *
     * Sets up the manager with empty data structures and registers
     * event listeners for configuration changes and other system events.
     *
     * @param context - The VS Code extension context for resolving webview URIs
     * @param extensionManager - The extension manager for accessing all services
     * @param loggingService - The CentralizedLoggingService instance for logging
     * @param notificationService - The NotificationService instance for user notifications
     */
    constructor(
        context: vscode.ExtensionContext,
        extensionManager: ExtensionManager,
        loggingService: CentralizedLoggingService,
        notificationService: NotificationService
    ) {
        this.context = context;
        this.extensionManager = extensionManager;
        this.loggingService = loggingService;
        this.notificationService = notificationService;
        this.setupEventListeners();
    }

    /**
     * Resolves the webview view for the sidebar
     *
     * This method is called by VS Code when the sidebar view needs to be rendered.
     * It implements the WebviewViewProvider interface to provide content for the
     * sidebar webview.
     *
     * @param webviewView - The webview view to resolve
     * @param context - The webview view resolve context
     * @param token - Cancellation token
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        try {
            // Configure webview options
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview', 'build')]
            };

            // Set HTML content using the helper method
            webviewView.webview.html = this.getWebviewContent(webviewView.webview, this.context.extensionUri);

            // Set up message handling
            webviewView.webview.onDidReceiveMessage(
                message => {
                    this.handleSidebarMessage(message);
                },
                undefined,
                this.disposables
            );

            // Send initial state message to the webview
            webviewView.webview.postMessage({
                type: 'initialState',
                data: {
                    isWorkspaceOpen: !!vscode.workspace.workspaceFolders?.length,
                    isSidebar: true
                }
            });

            this.loggingService.info('Sidebar webview resolved successfully', {}, 'WebviewManager');
        } catch (error) {
            this.loggingService.error('Failed to resolve sidebar webview', { error: error instanceof Error ? error.message : String(error) }, 'WebviewManager');
        }
    }

    /**
     * Handles messages from the sidebar webview
     *
     * @param message - The message received from the sidebar webview
     */
    private handleSidebarMessage(message: any): void {
        try {
            this.loggingService.debug('Received sidebar message', { type: message.type }, 'WebviewManager');

            // Handle sidebar-specific messages here
            switch (message.type) {
                case 'openMainPanel':
                    // Open the main panel when requested from sidebar
                    this.showMainPanel({ isWorkspaceOpen: !!vscode.workspace.workspaceFolders?.length });
                    break;
                default:
                    // For other messages, you might want to delegate to a general message handler
                    this.loggingService.debug('Unhandled sidebar message type', { type: message.type }, 'WebviewManager');
                    break;
            }
        } catch (error) {
            this.loggingService.error('Error handling sidebar message', { error: error instanceof Error ? error.message : String(error) }, 'WebviewManager');
        }
    }

    /**
     * Creates a new webview panel with the specified configuration
     * 
     * This method creates a VS Code webview panel and wraps it with additional
     * metadata and functionality. It sets up message handling, disposal callbacks,
     * and stores the panel in the internal management system.
     * 
     * @param config - Configuration object defining the webview panel properties
     * @returns The unique ID of the created webview panel
     * @throws Error if panel creation fails
     */
    createPanel(config: WebviewConfig): string {
        try {
            this.loggingService.info('Creating webview panel', { configId: config.id }, 'WebviewManager');

            // Check if panel already exists to prevent duplicates
            if (this.panels.has(config.id)) {
                this.loggingService.warn(`Panel with ID '${config.id}' already exists`, {}, 'WebviewManager');
                return config.id;
            }

            // Create VS Code webview panel with specified configuration
            const panel = vscode.window.createWebviewPanel(
                config.id,
                config.title,
                config.viewColumn || vscode.ViewColumn.One,
                {
                    enableScripts: config.enableScripts || true,
                    enableCommandUris: config.enableCommandUris || false,
                    localResourceRoots: config.localResourceRoots || [vscode.Uri.joinPath(vscode.Uri.file(__dirname), 'resources')],
                    portMapping: config.portMapping
                }
            );

            // Set up message handling using MessageRouter for centralized routing
            const messageRouter = new MessageRouter(
                this.extensionManager.getContextService(),
                this.extensionManager.getIndexingService(),
                this.context,
                this.extensionManager.getStateManager()
            );

            // Set up advanced managers if available
            try {
                messageRouter.setAdvancedManagers(
                    this.extensionManager.getSearchManager(),
                    this.extensionManager.getConfigurationManager(),
                    this.extensionManager.getPerformanceManager(),
                    this.extensionManager.getXmlFormatterService()
                );
            } catch (error) {
                console.warn('WebviewManager: Some advanced managers not available during panel creation:', error);
            }

            panel.webview.onDidReceiveMessage(
                message => messageRouter.handleMessage(message, panel.webview),
                undefined,
                this.disposables
            );

            // Handle panel disposal to maintain consistent state
            panel.onDidDispose(
                () => this.handlePanelDispose(config.id),
                undefined,
                this.disposables
            );

            // Create enhanced panel object with metadata
            const webviewPanel: WebviewPanel = {
                id: config.id,
                panel,
                config,
                visible: true,
                lastUpdated: new Date(),
                messageHandlers: new Map()
            };

            // Store the panel in our management system
            this.panels.set(config.id, webviewPanel);
            
            this.loggingService.info(`Created webview panel '${config.id}'`, {}, 'WebviewManager');
            return config.id;

        } catch (error) {
            this.loggingService.error('Failed to create webview panel', { error: error instanceof Error ? error.message : String(error) }, 'WebviewManager');
            throw error;
        }
    }

    /**
     * Shows an existing webview panel by bringing it to focus
     * 
     * This method reveals a previously created or hidden webview panel,
     * making it visible in the specified editor column. The panel's
     * visibility state is updated accordingly.
     * 
     * @param id - Unique identifier of the webview panel to show
     */
    showPanel(id: string): void {
        try {
            const webviewPanel = this.panels.get(id);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${id}' not found`);
                return;
            }

            // Reveal the panel in the specified column with focus options
            webviewPanel.panel.reveal(webviewPanel.config.viewColumn, webviewPanel.config.preserveFocus);
            webviewPanel.visible = true;
            webviewPanel.lastUpdated = new Date();

            console.log(`WebviewManager: Showed webview panel '${id}'`);

        } catch (error) {
            console.error('WebviewManager: Failed to show webview panel:', error);
        }
    }

    /**
     * Hides a webview panel by disposing its VS Code panel instance
     * 
     * This method disposes the underlying VS Code webview panel,
     * effectively hiding it from view while maintaining the panel
     * metadata in our management system for potential later use.
     * 
     * @param id - Unique identifier of the webview panel to hide
     */
    hidePanel(id: string): void {
        try {
            const webviewPanel = this.panels.get(id);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${id}' not found`);
                return;
            }

            // Dispose the VS Code panel to hide it
            webviewPanel.panel.dispose();
            webviewPanel.visible = false;
            webviewPanel.lastUpdated = new Date();

            console.log(`WebviewManager: Hid webview panel '${id}'`);

        } catch (error) {
            console.error('WebviewManager: Failed to hide webview panel:', error);
        }
    }

    /**
     * Toggles the visibility state of a webview panel
     * 
     * This method provides a convenient way to switch between showing
     * and hiding a webview panel based on its current visibility state.
     * If the panel is visible, it will be hidden; if hidden, it will be shown.
     * 
     * @param id - Unique identifier of the webview panel to toggle
     */
    togglePanel(id: string): void {
        try {
            const webviewPanel = this.panels.get(id);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${id}' not found`);
                return;
            }

            // Toggle visibility based on current state
            if (webviewPanel.visible) {
                this.hidePanel(id);
            } else {
                this.showPanel(id);
            }

        } catch (error) {
            console.error('WebviewManager: Failed to toggle webview panel:', error);
        }
    }

    /**
     * Retrieves a webview panel by its unique identifier
     * 
     * This method provides access to the enhanced webview panel object
     * containing both the VS Code panel and additional metadata.
     * 
     * @param id - Unique identifier of the webview panel to retrieve
     * @returns The webview panel object if found, undefined otherwise
     */
    getPanel(id: string): WebviewPanel | undefined {
        return this.panels.get(id);
    }

    /**
     * Retrieves all managed webview panels
     * 
     * This method returns an array of all webview panels currently
     * managed by this WebviewManager instance, regardless of their
     * visibility state.
     * 
     * @returns Array of all managed webview panels
     */
    getAllPanels(): WebviewPanel[] {
        return Array.from(this.panels.values());
    }

    /**
     * Retrieves all currently visible webview panels
     * 
     * This method filters the managed panels to return only those
     * that are currently visible to the user.
     * 
     * @returns Array of visible webview panels
     */
    getVisiblePanels(): WebviewPanel[] {
        return Array.from(this.panels.values()).filter(panel => panel.visible);
    }

    /**
     * Completely removes a webview panel from management
     * 
     * This method performs a full cleanup of the specified webview panel,
     * including disposal of the VS Code panel, removal from internal maps,
     * and cleanup of any associated timers and message queues.
     * 
     * @param id - Unique identifier of the webview panel to delete
     */
    deletePanel(id: string): void {
        try {
            const webviewPanel = this.panels.get(id);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${id}' not found`);
                return;
            }

            // Dispose the VS Code panel to free resources
            webviewPanel.panel.dispose();
            
            // Remove from our management system
            this.panels.delete(id);
            this.messageQueue.delete(id);
            
            // Clear any pending update timers
            const timer = this.updateTimers.get(id);
            if (timer) {
                clearTimeout(timer);
                this.updateTimers.delete(id);
            }

            console.log(`WebviewManager: Deleted webview panel '${id}'`);

        } catch (error) {
            console.error('WebviewManager: Failed to delete webview panel:', error);
        }
    }

    /**
     * Sets the HTML content for a webview panel
     * 
     * This method updates the webview panel's HTML content, which will
     * be immediately rendered in the panel. The content can include
     * references to local resources through the webview's URI system.
     * 
     * @param id - Unique identifier of the webview panel
     * @param html - HTML content to set for the webview
     */
    setHtml(id: string, html: string): void {
        try {
            const webviewPanel = this.panels.get(id);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${id}' not found`);
                return;
            }

            // Set the HTML content directly on the webview
            webviewPanel.panel.webview.html = html;
            webviewPanel.lastUpdated = new Date();

            console.log(`WebviewManager: Set HTML for panel '${id}'`);

        } catch (error) {
            console.error('WebviewManager: Failed to set HTML:', error);
        }
    }

    /**
     * Posts a message to a webview panel with debouncing
     * 
     * This method queues messages for delivery to webview panels,
     * implementing a debouncing mechanism to optimize performance.
     * Messages are standardized to the WebviewMessage format and
     * processed in batches to minimize webview updates.
     * 
     * @param id - Unique identifier of the webview panel
     * @param message - Message data to post (can be string or object)
     */
    postMessage(id: string, message: any): void {
        try {
            const webviewPanel = this.panels.get(id);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${id}' not found`);
                return;
            }

            // Initialize message queue for this panel if it doesn't exist
            if (!this.messageQueue.has(id)) {
                this.messageQueue.set(id, []);
            }
            
            // Standardize message format for consistent handling
            const webviewMessage: WebviewMessage = {
                type: typeof message === 'string' ? message : message.type || 'default',
                data: typeof message === 'string' ? { text: message } : message.data || message,
                timestamp: new Date()
            };

            // Add message to queue and schedule debounced processing
            this.messageQueue.get(id)!.push(webviewMessage);
            this.scheduleMessageUpdate(id);

        } catch (error) {
            console.error('WebviewManager: Failed to post message:', error);
        }
    }

    /**
     * Registers a message handler for a specific message type
     * 
     * This method allows the extension to handle incoming messages
     * from the webview content. Each message type can have its own
     * dedicated handler function for processing the message data.
     * 
     * @param id - Unique identifier of the webview panel
     * @param messageType - Type of message to handle
     * @param handler - Function to process messages of this type
     */
    registerMessageHandler(id: string, messageType: string, handler: Function): void {
        try {
            const webviewPanel = this.panels.get(id);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${id}' not found`);
                return;
            }

            // Register the handler for the specified message type
            webviewPanel.messageHandlers.set(messageType, handler);
            console.log(`WebviewManager: Registered message handler for '${messageType}' on panel '${id}'`);

        } catch (error) {
            console.error('WebviewManager: Failed to register message handler:', error);
        }
    }

    /**
     * Unregisters a previously registered message handler
     * 
     * This method removes a message handler for a specific message type,
     * effectively stopping the processing of messages of that type.
     * 
     * @param id - Unique identifier of the webview panel
     * @param messageType - Type of message to unregister
     */
    unregisterMessageHandler(id: string, messageType: string): void {
        try {
            const webviewPanel = this.panels.get(id);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${id}' not found`);
                return;
            }

            // Remove the handler for the specified message type
            webviewPanel.messageHandlers.delete(messageType);
            console.log(`WebviewManager: Unregistered message handler for '${messageType}' on panel '${id}'`);

        } catch (error) {
            console.error('WebviewManager: Failed to unregister message handler:', error);
        }
    }

    /**
     * Gets a webview-compatible URI for local resources
     * 
     * This method converts local file paths to webview-compatible URIs
     * that can be safely accessed from within the webview content.
     * This is essential for loading local resources like images, stylesheets,
     * or scripts in the webview.
     * 
     * @param id - Unique identifier of the webview panel
     * @param path - Relative path to the local resource
     * @returns Webview-compatible URI for the resource, or undefined if panel not found
     */
    getLocalResourceUri(id: string, path: string): vscode.Uri | undefined {
        try {
            const webviewPanel = this.panels.get(id);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${id}' not found`);
                return undefined;
            }

            // Create a file URI and convert it to a webview URI
            const resourcePath = vscode.Uri.joinPath(vscode.Uri.file(__dirname), path);
            return webviewPanel.panel.webview.asWebviewUri(resourcePath);

        } catch (error) {
            console.error('WebviewManager: Failed to get local resource URI:', error);
            return undefined;
        }
    }

    /**
     * Processes incoming messages from webview panels
     * 
     * This private method handles messages received from webview content,
     * routing them to the appropriate registered handlers based on the
     * message type. It provides centralized message processing with
     * error handling and logging.
     * 
     * @param panelId - Unique identifier of the source webview panel
     * @param message - The message data received from the webview
     */
    private handleMessage(panelId: string, message: any): void {
        try {
            const webviewPanel = this.panels.get(panelId);
            if (!webviewPanel) {
                console.warn(`WebviewManager: Panel with ID '${panelId}' not found`);
                return;
            }

            // Determine message type and get appropriate handler
            const messageType = message.type || 'default';
            const handler = webviewPanel.messageHandlers.get(messageType);
            
            if (handler) {
                // Execute the handler with the message data
                handler(message);
            } else {
                console.warn(`WebviewManager: No handler registered for message type '${messageType}' on panel '${panelId}'`);
            }

        } catch (error) {
            console.error('WebviewManager: Failed to handle message:', error);
        }
    }

    /**
     * Handles the disposal of webview panels
     * 
     * This private method is called when a webview panel is disposed,
     * either by the user or programmatically. It updates the panel's
     * visibility state and cleans up associated resources like message
     * queues and update timers.
     * 
     * @param panelId - Unique identifier of the disposed webview panel
     */
    private handlePanelDispose(panelId: string): void {
        try {
            const webviewPanel = this.panels.get(panelId);
            if (webviewPanel) {
                // Update panel state to reflect disposal
                webviewPanel.visible = false;
                webviewPanel.lastUpdated = new Date();
                console.log(`WebviewManager: Panel '${panelId}' disposed`);
            }

            // Clean up associated resources
            this.messageQueue.delete(panelId);
            const timer = this.updateTimers.get(panelId);
            if (timer) {
                clearTimeout(timer);
                this.updateTimers.delete(panelId);
            }

        } catch (error) {
            console.error('WebviewManager: Failed to handle panel disposal:', error);
        }
    }

    /**
     * Schedules debounced message processing for a panel
     * 
     * This private method implements the debouncing mechanism for message
     * processing. It cancels any existing timer for the panel and creates
     * a new one to process the message queue after the specified delay.
     * This prevents excessive updates and improves performance.
     * 
     * @param panelId - Unique identifier of the webview panel
     */
    private scheduleMessageUpdate(panelId: string): void {
        // Cancel any existing timer for this panel
        const existingTimer = this.updateTimers.get(panelId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Create a new timer to process messages after debounce delay
        const timer = setTimeout(() => {
            this.processMessageQueue(panelId);
            this.updateTimers.delete(panelId);
        }, this.updateDebounceMs);

        this.updateTimers.set(panelId, timer);
    }

    /**
     * Processes the message queue for a specific panel
     * 
     * This private method processes all queued messages for a panel,
     * sending them to the webview content in a batch. It clears the
     * queue after processing to prepare for new messages.
     * 
     * @param panelId - Unique identifier of the webview panel
     */
    private processMessageQueue(panelId: string): void {
        try {
            const webviewPanel = this.panels.get(panelId);
            if (!webviewPanel) {
                return;
            }

            const messages = this.messageQueue.get(panelId);
            if (!messages || messages.length === 0) {
                return;
            }

            // Send all queued messages to the webview
            messages.forEach(message => {
                webviewPanel.panel.webview.postMessage(message);
            });

            // Clear the queue after processing
            this.messageQueue.set(panelId, []);

            console.log(`WebviewManager: Processed ${messages.length} messages for panel '${panelId}'`);

        } catch (error) {
            console.error('WebviewManager: Failed to process message queue:', error);
        }
    }

    /**
     * Sets up event listeners for system and configuration changes
     * 
     * This private method registers event listeners for various system
     * events that may affect webview panels, such as configuration changes.
     * These listeners ensure that webview panels remain synchronized with
     * the current system state.
     */
    private setupEventListeners(): void {
        // Listen for configuration changes that might affect webviews
        const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
            console.log('WebviewManager: Configuration changed, updating webview panels');
            // Update panels based on configuration changes
            this.panels.forEach((webviewPanel, id) => {
                // Re-apply configuration if needed
                if (webviewPanel.visible) {
                    webviewPanel.lastUpdated = new Date();
                }
            });
        });

        // Store the listener for proper cleanup
        this.disposables.push(configChangeListener);
    }

    /**
     * Shows the main panel with single-instance management
     *
     * This method manages the main code context panel, ensuring only one instance
     * exists at a time. If the panel already exists, it brings it into focus.
     * Otherwise, it creates a new panel with proper HTML content loading.
     */
    showMainPanel(options: { isWorkspaceOpen: boolean }): void {
        const panelId = 'codeContextMain';
        const panelTitle = 'Code Context';

        // If main panel already exists, just reveal it
        if (this.mainPanel) {
            this.mainPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Create new main panel
        this.mainPanel = vscode.window.createWebviewPanel(
            panelId,
            panelTitle,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview', 'build')]
            }
        );

        // Set HTML content using the helper method
        this.mainPanel.webview.html = this.getWebviewContent(this.mainPanel.webview, this.context.extensionUri);

        // Send initial state message to the webview
        this.mainPanel.webview.postMessage({
            type: 'initialState',
            data: { isWorkspaceOpen: options.isWorkspaceOpen }
        });

        // Set up MessageRouter for message handling
        const messageRouter = new MessageRouter(
            this.extensionManager.getContextService(),
            this.extensionManager.getIndexingService(),
            this.context,
            this.extensionManager.getStateManager()
        );

        // Set up advanced managers if available
        try {
            messageRouter.setAdvancedManagers(
                this.extensionManager.getSearchManager(),
                this.extensionManager.getConfigurationManager(),
                this.extensionManager.getPerformanceManager(),
                this.extensionManager.getXmlFormatterService()
            );
        } catch (error) {
            console.warn('WebviewManager: Some advanced managers not available for main panel:', error);
        }

        this.mainPanel.webview.onDidReceiveMessage(
            message => messageRouter.handleMessage(message, this.mainPanel!.webview),
            undefined,
            this.disposables
        );

        // Set up disposal listener to clear the reference
        this.mainPanel.onDidDispose(() => {
            this.mainPanel = undefined;
            this.deletePanel(panelId);
        }, null, this.disposables);

        // Add to general panels map for consistent management
        this.panels.set(panelId, {
            id: panelId,
            panel: this.mainPanel,
            config: { id: panelId, title: panelTitle, enableScripts: true },
            visible: true,
            lastUpdated: new Date(),
            messageHandlers: new Map()
        });

        console.log('WebviewManager: Main panel created and displayed');
    }

    /**
     * Shows the settings panel with single-instance management
     *
     * This method manages the settings panel, ensuring only one instance
     * exists at a time. If the panel already exists, it brings it into focus.
     * Otherwise, it creates a new panel with proper HTML content loading.
     */
    showSettingsPanel(): void {
        const panelId = 'codeContextSettings';
        const panelTitle = 'Code Context Settings';

        // If settings panel already exists, just reveal it
        if (this.settingsPanel) {
            this.settingsPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Create new settings panel
        this.settingsPanel = vscode.window.createWebviewPanel(
            panelId,
            panelTitle,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview', 'build')]
            }
        );

        // Set HTML content using the helper method
        this.settingsPanel.webview.html = this.getWebviewContent(this.settingsPanel.webview, this.context.extensionUri);

        // Set up MessageRouter for message handling
        const messageRouter = new MessageRouter(
            this.extensionManager.getContextService(),
            this.extensionManager.getIndexingService(),
            this.context,
            this.extensionManager.getStateManager()
        );

        // Set up advanced managers if available
        try {
            messageRouter.setAdvancedManagers(
                this.extensionManager.getSearchManager(),
                this.extensionManager.getConfigurationManager(),
                this.extensionManager.getPerformanceManager(),
                this.extensionManager.getXmlFormatterService()
            );
        } catch (error) {
            console.warn('WebviewManager: Some advanced managers not available for settings panel:', error);
        }

        this.settingsPanel.webview.onDidReceiveMessage(
            message => messageRouter.handleMessage(message, this.settingsPanel!.webview),
            undefined,
            this.disposables
        );

        // Set up disposal listener to clear the reference
        this.settingsPanel.onDidDispose(() => {
            this.settingsPanel = undefined;
            this.deletePanel(panelId);
        }, null, this.disposables);

        // Add to general panels map for consistent management
        this.panels.set(panelId, {
            id: panelId,
            panel: this.settingsPanel,
            config: { id: panelId, title: panelTitle, enableScripts: true },
            visible: true,
            lastUpdated: new Date(),
            messageHandlers: new Map()
        });

        console.log('WebviewManager: Settings panel created and displayed');
    }

    /**
     * Shows the diagnostics panel (legacy compatibility method)
     *
     * This method provides backward compatibility with the expected interface.
     * It creates or shows the diagnostics panel.
     */
    showDiagnosticsPanel(): void {
        const diagnosticsPanelId = 'codeContextDiagnostics';

        // Check if panel already exists
        if (this.panels.has(diagnosticsPanelId)) {
            this.showPanel(diagnosticsPanelId);
            return;
        }

        // Create new diagnostics panel
        this.createPanel({
            id: diagnosticsPanelId,
            title: 'Code Context Diagnostics',
            viewColumn: vscode.ViewColumn.Two,
            enableScripts: true
        });
    }

    /**
     * Updates the workspace state in all webview panels
     *
     * This method sends a message to all webview panels to update their
     * workspace state, which will trigger UI updates as needed.
     *
     * @param isWorkspaceOpen - Whether a workspace is currently open
     */
    updateWorkspaceState(isWorkspaceOpen: boolean): void {
        try {
            // Send workspace state update to all visible panels
            this.panels.forEach((webviewPanel, id) => {
                if (webviewPanel.visible) {
                    webviewPanel.panel.webview.postMessage({
                        type: 'workspaceStateChanged',
                        data: { isWorkspaceOpen }
                    });
                    console.log(`WebviewManager: Sent workspace state update to panel '${id}'`);
                }
            });
        } catch (error) {
            console.error('WebviewManager: Failed to update workspace state:', error);
        }
    }

    /**
     * Static property for view type (legacy compatibility)
     */
    static readonly viewType = 'codeContextMain';

    /**
     * Loads and prepares webview HTML content with proper asset URI resolution
     *
     * This helper method reads the index.html file from the webview/build directory
     * and replaces relative asset paths with webview-compatible URIs using
     * webview.asWebviewUri. This ensures that CSS, JavaScript, and other assets
     * load correctly within the webview context.
     *
     * @param webview - The webview instance for URI resolution
     * @param extensionUri - The extension's base URI
     * @returns The processed HTML content with resolved asset URIs
     */
    private getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        try {
            const htmlPath = path.join(extensionUri.fsPath, 'webview', 'build', 'index.html');

            // Check if the HTML file exists
            if (!fs.existsSync(htmlPath)) {
                console.warn(`WebviewManager: HTML file not found at ${htmlPath}, using fallback content`);
                return this.getFallbackHtmlContent();
            }

            let html = fs.readFileSync(htmlPath, 'utf8');

            // Generate a nonce for inline scripts
            const nonce = this.generateNonce();

            // Add Content Security Policy for VS Code webview with nonce
            const cspSource = webview.cspSource;
            const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'nonce-${nonce}'; font-src ${cspSource}; img-src ${cspSource} https: data:; connect-src ${cspSource};">`;

            // Insert CSP after the charset meta tag
            html = html.replace(
                /<meta charset="utf-8" \/>/,
                `<meta charset="utf-8" />\n\t\t\t${csp}`
            );

            // Replace relative paths with webview-compatible URIs
            // This handles SvelteKit's typical asset patterns
            html = html.replace(/(src|href)="(\/_app\/[^"]+)"/g, (match, attr, src) => {
                const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'webview', 'build', src));
                console.log(`WebviewManager: Replacing ${src} with ${resourceUri}`);
                return `${attr}="${resourceUri}"`;
            });

            // Also handle any other relative paths that might exist
            html = html.replace(/(src|href)="(\/[^"]+\.(js|css|png|jpg|jpeg|gif|svg|ico|json))"/g, (match, attr, src) => {
                const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'webview', 'build', src));
                console.log(`WebviewManager: Replacing ${src} with ${resourceUri}`);
                return `${attr}="${resourceUri}"`;
            });

            // Replace import() calls in inline scripts to use webview URIs
            html = html.replace(/import\("(\/_app\/[^"]+)"\)/g, (match, src) => {
                const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'webview', 'build', src));
                return `import("${resourceUri}")`;
            });

            // Add nonce to inline scripts
            html = html.replace(/<script>/g, `<script nonce="${nonce}">`);

            // Inject fetch interceptor for SvelteKit runtime requests
            const fetchInterceptor = `
                <script nonce="${nonce}">
                    // Intercept fetch requests for SvelteKit assets
                    const originalFetch = window.fetch;
                    window.fetch = function(url, options) {
                        // Handle relative URLs that start with /_app/
                        if (typeof url === 'string' && url.startsWith('/_app/')) {
                            console.log('Intercepting fetch for:', url);
                            // For version.json, return a mock response since it's just used for cache busting
                            if (url.includes('version.json')) {
                                return Promise.resolve(new Response('{"version":"${Date.now()}"}', {
                                    status: 200,
                                    headers: { 'Content-Type': 'application/json' }
                                }));
                            }
                        }
                        return originalFetch.call(this, url, options);
                    };
                </script>
            `;

            // Insert fetch interceptor before the first script tag
            html = html.replace(/<script/, fetchInterceptor + '<script');

            return html;
        } catch (error) {
            console.error('WebviewManager: Error loading webview content:', error);
            return this.getFallbackHtmlContent();
        }
    }

    /**
     * Provides fallback HTML content when the main HTML file cannot be loaded
     *
     * @returns Basic HTML content for the webview
     */
    private getFallbackHtmlContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Code Context Engine</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        margin: 0;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        text-align: center;
                    }
                    .error {
                        color: var(--vscode-errorForeground);
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Code Context Engine</h1>
                    <div class="error">
                        <p>Unable to load the main interface. Please ensure the webview assets are built.</p>
                        <p>Run <code>npm run build:webview</code> to build the webview assets.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Generates a cryptographically secure nonce for Content Security Policy
     *
     * @returns A base64-encoded nonce string
     */
    private generateNonce(): string {
        const crypto = require('crypto');
        return crypto.randomBytes(16).toString('base64');
    }

    /**
     * Disposes of the WebviewManager and all associated resources
     *
     * This method performs a complete cleanup of all resources managed
     * by the WebviewManager, including all webview panels, timers,
     * message queues, and event listeners. This should be called when
     * the extension is deactivated to prevent memory leaks.
     */
    dispose(): void {
        try {
            // Clear all pending update timers
            this.updateTimers.forEach(timer => clearTimeout(timer));
            this.updateTimers.clear();

            // Dispose all managed webview panels
            this.panels.forEach(webviewPanel => {
                webviewPanel.panel.dispose();
            });
            this.panels.clear();

            // Clear all message queues
            this.messageQueue.clear();

            // Dispose all registered event listeners
            this.disposables.forEach(disposable => disposable.dispose());
            this.disposables = [];

            console.log('WebviewManager: Disposed');

        } catch (error) {
            console.error('WebviewManager: Error during disposal:', error);
        }
    }
}