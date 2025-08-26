"use strict";
/**
 * DatabaseSetup Component
 *
 * Handles database selection and management for the onboarding process.
 * Provides UI for selecting database type, starting services, and monitoring status.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseSetupStyles = exports.DatabaseSetup = void 0;
const setupStore_1 = require("../stores/setupStore");
const vscodeApi_1 = require("../vscodeApi");
const ChromaDBConfig_1 = require("./ChromaDBConfig");
const PineconeConfig_1 = require("./PineconeConfig");
class DatabaseSetup {
    constructor(container) {
        this.selectElement = null;
        this.startButton = null;
        this.statusElement = null;
        this.configContainer = null;
        this.unsubscribe = null;
        // Database-specific configuration components
        this.chromaDBConfig = null;
        this.pineconeConfig = null;
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.subscribeToStore();
    }
    /**
     * Render the database setup UI
     */
    render() {
        this.container.innerHTML = `
            <div class="database-setup">
                <h3>Database Configuration</h3>
                <p>Select and configure your vector database for code indexing.</p>
                
                <div class="form-group">
                    <label for="database-select">Vector Database:</label>
                    <select id="database-select" class="database-select">
                        <option value="">Select a database...</option>
                        <option value="qdrant">Qdrant (Local/Docker)</option>
                        <option value="chromadb">ChromaDB (Local/Docker)</option>
                        <option value="pinecone">Pinecone (Cloud)</option>
                    </select>
                </div>

                <div id="database-config-container" class="database-config-container">
                    <!-- Database-specific configuration will be inserted here -->
                </div>

                <div class="database-actions">
                    <button id="start-database-btn" class="start-button" disabled>
                        Start Local Qdrant
                    </button>
                    <div id="database-status" class="status-indicator">
                        <span class="status-dot not-running"></span>
                        <span class="status-text">Not Configured</span>
                    </div>
                </div>

                <div class="database-info">
                    <p class="info-text">
                        <strong>Note:</strong> This will start a local Qdrant instance using Docker. 
                        Make sure Docker is installed and running on your system.
                    </p>
                </div>
            </div>
        `;
        // Get references to elements
        this.selectElement = this.container.querySelector('#database-select');
        this.startButton = this.container.querySelector('#start-database-btn');
        this.statusElement = this.container.querySelector('#database-status');
        this.configContainer = this.container.querySelector('#database-config-container');
    }
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (this.selectElement) {
            this.selectElement.addEventListener('change', (e) => {
                const target = e.target;
                this.handleDatabaseSelection(target.value);
            });
        }
        if (this.startButton) {
            this.startButton.addEventListener('click', () => {
                this.handleStartDatabase();
            });
        }
    }
    /**
     * Subscribe to store updates
     */
    subscribeToStore() {
        this.unsubscribe = setupStore_1.setupStore.subscribe((state) => {
            this.updateUI(state);
        });
    }
    /**
     * Handle database selection
     */
    handleDatabaseSelection(database) {
        const dbProvider = database;
        setupStore_1.setupActions.selectDatabase(dbProvider);
        // Update configuration UI based on selected database
        this.updateDatabaseConfiguration(dbProvider);
        // Enable start button if database is selected (except for Pinecone which doesn't need starting)
        if (this.startButton) {
            this.startButton.disabled = !database;
            // Update button text based on database type
            if (database === 'pinecone') {
                this.startButton.textContent = 'Validate Configuration';
                this.startButton.style.display = 'inline-block';
            }
            else if (database === 'chromadb') {
                this.startButton.textContent = 'Start Local ChromaDB';
                this.startButton.style.display = 'inline-block';
            }
            else if (database === 'qdrant') {
                this.startButton.textContent = 'Start Local Qdrant';
                this.startButton.style.display = 'inline-block';
            }
            else {
                this.startButton.style.display = 'none';
            }
        }
    }
    /**
     * Update database configuration UI based on selected provider
     */
    updateDatabaseConfiguration(database) {
        if (!this.configContainer)
            return;
        // Clean up existing configuration components
        this.cleanupConfigComponents();
        this.configContainer.innerHTML = '';
        if (!database)
            return;
        // Inject styles for the configuration components
        this.injectConfigStyles();
        switch (database) {
            case 'chromadb':
                this.chromaDBConfig = new ChromaDBConfig_1.ChromaDBConfigComponent(this.configContainer);
                break;
            case 'pinecone':
                this.pineconeConfig = new PineconeConfig_1.PineconeConfigComponent(this.configContainer);
                break;
            case 'qdrant':
                // Qdrant uses simple connection string, no complex config needed
                this.configContainer.innerHTML = `
                    <div class="simple-config">
                        <h4>Qdrant Configuration</h4>
                        <p>Qdrant will run locally on <code>http://localhost:6333</code></p>
                        <p>Click "Start Local Qdrant" to launch it with Docker.</p>
                    </div>
                `;
                break;
        }
    }
    /**
     * Inject CSS styles for configuration components
     */
    injectConfigStyles() {
        const styleId = 'database-config-styles';
        if (document.getElementById(styleId))
            return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            ${ChromaDBConfig_1.chromaDBConfigStyles}
            ${PineconeConfig_1.pineconeConfigStyles}
            .simple-config {
                padding: 15px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                background-color: var(--vscode-editor-background);
            }
            .simple-config h4 {
                margin: 0 0 8px 0;
                color: var(--vscode-textLink-foreground);
                font-size: 14px;
            }
            .simple-config p {
                margin: 0 0 8px 0;
                color: var(--vscode-foreground);
                font-size: 13px;
            }
            .simple-config code {
                padding: 2px 4px;
                background-color: var(--vscode-textCodeBlock-background);
                border-radius: 2px;
                font-family: var(--vscode-editor-font-family);
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);
    }
    /**
     * Clean up configuration components
     */
    cleanupConfigComponents() {
        if (this.chromaDBConfig) {
            this.chromaDBConfig.dispose();
            this.chromaDBConfig = null;
        }
        if (this.pineconeConfig) {
            this.pineconeConfig.dispose();
            this.pineconeConfig = null;
        }
    }
    /**
     * Handle start database button click
     */
    async handleStartDatabase() {
        const state = setupStore_1.setupStore.getState();
        if (!state.selectedDatabase) {
            setupStore_1.setupActions.setError('Please select a database first');
            return;
        }
        try {
            setupStore_1.setupActions.clearError();
            switch (state.selectedDatabase) {
                case 'qdrant':
                    await this.startQdrant();
                    break;
                case 'chromadb':
                    await this.startChromaDB();
                    break;
                case 'pinecone':
                    await this.validatePinecone();
                    break;
                default:
                    setupStore_1.setupActions.setError(`Unsupported database: ${state.selectedDatabase}`);
            }
        }
        catch (error) {
            console.error('Failed to handle database operation:', error);
            setupStore_1.setupActions.setError(`Failed to handle database: ${error}`);
            setupStore_1.setupActions.updateDatabaseStatus('error');
        }
    }
    /**
     * Start Qdrant database
     */
    async startQdrant() {
        setupStore_1.setupActions.updateDatabaseStatus('starting');
        vscodeApi_1.vscodeApi.postMessage({
            command: 'startDatabase',
            database: 'qdrant'
        });
        console.log('Qdrant start command sent to extension');
    }
    /**
     * Start ChromaDB database
     */
    async startChromaDB() {
        // Validate ChromaDB configuration first
        if (this.chromaDBConfig) {
            const validation = this.chromaDBConfig.validateConfiguration();
            if (!validation.isValid) {
                setupStore_1.setupActions.setError(`ChromaDB configuration errors: ${validation.errors.join(', ')}`);
                return;
            }
        }
        setupStore_1.setupActions.updateDatabaseStatus('starting');
        vscodeApi_1.vscodeApi.postMessage({
            command: 'startDatabase',
            database: 'chromadb',
            config: setupStore_1.setupStore.getState().databaseConfig
        });
        console.log('ChromaDB start command sent to extension');
    }
    /**
     * Validate Pinecone configuration
     */
    async validatePinecone() {
        if (!this.pineconeConfig) {
            setupStore_1.setupActions.setError('Pinecone configuration not available');
            return;
        }
        const validation = this.pineconeConfig.validateConfiguration();
        if (!validation.isValid) {
            setupStore_1.setupActions.setError(`Pinecone configuration errors: ${validation.errors.join(', ')}`);
            return;
        }
        setupStore_1.setupActions.updateDatabaseStatus('starting');
        // For Pinecone, we just validate the connection since it's cloud-based
        vscodeApi_1.vscodeApi.postMessage({
            command: 'validateDatabase',
            database: 'pinecone',
            config: setupStore_1.setupStore.getState().databaseConfig
        });
        console.log('Pinecone validation command sent to extension');
    }
    /**
     * Update UI based on store state
     */
    updateUI(state) {
        // Update select value
        if (this.selectElement && this.selectElement.value !== state.selectedDatabase) {
            this.selectElement.value = state.selectedDatabase;
        }
        // Update start button
        if (this.startButton) {
            this.startButton.disabled = !state.selectedDatabase || state.databaseStatus === 'starting';
            this.startButton.textContent = state.databaseStatus === 'starting' ? 'Starting...' : 'Start Local Qdrant';
        }
        // Update status indicator
        if (this.statusElement) {
            this.updateStatusIndicator(state.databaseStatus);
        }
    }
    /**
     * Update status indicator based on database status
     */
    updateStatusIndicator(status) {
        if (!this.statusElement)
            return;
        const statusDot = this.statusElement.querySelector('.status-dot');
        const statusText = this.statusElement.querySelector('.status-text');
        if (!statusDot || !statusText)
            return;
        // Remove all status classes
        statusDot.className = 'status-dot';
        switch (status) {
            case 'not-configured':
                statusDot.classList.add('not-running');
                statusText.textContent = 'Not Configured';
                break;
            case 'starting':
                statusDot.classList.add('starting');
                statusText.textContent = 'Starting...';
                break;
            case 'running':
                statusDot.classList.add('running');
                statusText.textContent = 'Running';
                break;
            case 'error':
                statusDot.classList.add('error');
                statusText.textContent = 'Error';
                break;
        }
    }
    /**
     * Handle database status updates from extension
     */
    handleDatabaseStatusUpdate(status) {
        setupStore_1.setupActions.updateDatabaseStatus(status);
    }
    /**
     * Cleanup component
     */
    dispose() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.cleanupConfigComponents();
    }
}
exports.DatabaseSetup = DatabaseSetup;
// CSS styles for the component
exports.databaseSetupStyles = `
.database-setup {
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    margin-bottom: 20px;
    background-color: var(--vscode-sideBar-background);
}

.database-setup h3 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
}

.database-setup p {
    margin: 0 0 15px 0;
    color: var(--vscode-descriptionForeground);
    font-size: 14px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: var(--vscode-foreground);
}

.database-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-family: inherit;
    font-size: 14px;
}

.database-select:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
}

.database-actions {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
}

.start-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.start-button:hover:not(:disabled) {
    background-color: var(--vscode-button-hoverBackground);
}

.start-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    transition: background-color 0.2s ease;
}

.status-dot.not-running {
    background-color: var(--vscode-charts-gray);
}

.status-dot.starting {
    background-color: var(--vscode-charts-yellow);
    animation: pulse 1.5s infinite;
}

.status-dot.running {
    background-color: var(--vscode-charts-green);
}

.status-dot.error {
    background-color: var(--vscode-charts-red);
}

.status-text {
    font-size: 13px;
    color: var(--vscode-foreground);
}

.database-config-container {
    margin-top: 15px;
    margin-bottom: 15px;
}

.database-info {
    padding: 10px;
    background-color: var(--vscode-textCodeBlock-background);
    border-radius: 4px;
    border-left: 3px solid var(--vscode-textLink-foreground);
}

.info-text {
    margin: 0;
    font-size: 13px;
    color: var(--vscode-foreground);
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
`;
//# sourceMappingURL=DatabaseSetup.js.map