"use strict";
/**
 * SetupView - Main Onboarding Component
 *
 * This is the main view for user onboarding and initial setup.
 * It orchestrates the database and embedding provider configuration process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupView = void 0;
const setupStore_1 = require("../stores/setupStore");
const DatabaseSetup_1 = require("../components/DatabaseSetup");
const EmbeddingSetup_1 = require("../components/EmbeddingSetup");
const SystemValidation_1 = require("../components/SystemValidation");
const ConfigurationManagement_1 = require("../components/ConfigurationManagement");
const vscodeApi_1 = require("../vscodeApi");
class SetupView {
    constructor(container) {
        this.databaseSetup = null;
        this.embeddingSetup = null;
        this.systemValidation = null;
        this.configurationManagement = null;
        this.indexButton = null;
        this.progressSection = null;
        this.unsubscribe = null;
        this.container = container;
        this.injectStyles();
        this.render();
        this.initializeComponents();
        this.setupEventListeners();
        this.subscribeToStore();
        this.setupMessageHandlers();
    }
    /**
     * Inject CSS styles for all components
     */
    injectStyles() {
        const styleId = 'setup-view-styles';
        if (document.getElementById(styleId))
            return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            ${setupViewStyles}
            ${SystemValidation_1.systemValidationStyles}
            ${DatabaseSetup_1.databaseSetupStyles}
            ${EmbeddingSetup_1.embeddingSetupStyles}
            ${ConfigurationManagement_1.configurationManagementStyles}
        `;
        document.head.appendChild(style);
    }
    /**
     * Render the main setup view
     */
    render() {
        this.container.innerHTML = `
            <div class="setup-view">
                <div class="setup-header">
                    <h1>Welcome to Code Context Engine</h1>
                    <p>Let's get you set up! Configure your database and embedding provider to start indexing your code.</p>
                </div>

                <div class="setup-progress">
                    <div class="progress-step active" data-step="database">
                        <div class="step-number">1</div>
                        <div class="step-label">Database</div>
                    </div>
                    <div class="progress-line"></div>
                    <div class="progress-step" data-step="provider">
                        <div class="step-number">2</div>
                        <div class="step-label">Provider</div>
                    </div>
                    <div class="progress-line"></div>
                    <div class="progress-step" data-step="ready">
                        <div class="step-number">3</div>
                        <div class="step-label">Ready</div>
                    </div>
                </div>

                <div class="setup-content">
                    <div id="system-validation-container"></div>
                    <div id="database-setup-container"></div>
                    <div id="embedding-setup-container"></div>
                    <div id="configuration-management-container"></div>
                </div>

                <div class="setup-actions">
                    <button id="index-now-btn" class="index-button" disabled>
                        <span class="button-icon">🚀</span>
                        Index Now
                    </button>
                    <p class="action-help">
                        Complete the configuration above to enable indexing.
                    </p>
                </div>

                <div id="indexing-progress" class="indexing-progress hidden">
                    <h3>Indexing in Progress</h3>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <p class="progress-text">Starting indexing process...</p>
                </div>
            </div>
        `;
        // Get references to key elements
        this.indexButton = this.container.querySelector('#index-now-btn');
        this.progressSection = this.container.querySelector('#indexing-progress');
    }
    /**
     * Initialize child components
     */
    initializeComponents() {
        const systemValidationContainer = this.container.querySelector('#system-validation-container');
        const databaseContainer = this.container.querySelector('#database-setup-container');
        const embeddingContainer = this.container.querySelector('#embedding-setup-container');
        const configManagementContainer = this.container.querySelector('#configuration-management-container');
        if (systemValidationContainer) {
            this.systemValidation = new SystemValidation_1.SystemValidationComponent(systemValidationContainer);
        }
        if (databaseContainer) {
            this.databaseSetup = new DatabaseSetup_1.DatabaseSetup(databaseContainer);
        }
        if (embeddingContainer) {
            this.embeddingSetup = new EmbeddingSetup_1.EmbeddingSetup(embeddingContainer);
        }
        if (configManagementContainer) {
            this.configurationManagement = new ConfigurationManagement_1.ConfigurationManagementComponent(configManagementContainer);
        }
    }
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (this.indexButton) {
            this.indexButton.addEventListener('click', () => {
                this.handleStartIndexing();
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
     * Set up message handlers for extension communication
     */
    setupMessageHandlers() {
        // Listen for database status updates
        vscodeApi_1.vscodeApi.onMessage('databaseStatus', (event) => {
            if (this.databaseSetup) {
                this.databaseSetup.handleDatabaseStatusUpdate(event.data.status);
            }
        });
        // Listen for indexing progress updates
        vscodeApi_1.vscodeApi.onMessage('indexingProgress', (data) => {
            this.updateIndexingProgress(data);
        });
        // Listen for indexing completion
        vscodeApi_1.vscodeApi.onMessage('indexingCompleted', (data) => {
            this.handleIndexingCompleted(data);
        });
        // Listen for errors
        vscodeApi_1.vscodeApi.onMessage('error', (event) => {
            setupStore_1.setupActions.setError(event.data.message);
        });
    }
    /**
     * Handle start indexing button click
     */
    async handleStartIndexing() {
        const state = setupStore_1.setupStore.getState();
        if (!state.isSetupComplete) {
            setupStore_1.setupActions.setError('Please complete the setup first');
            return;
        }
        try {
            setupStore_1.setupActions.startIndexing();
            setupStore_1.setupActions.clearError();
            // Send indexing command to extension
            vscodeApi_1.vscodeApi.postMessage({
                command: 'startIndexing',
                configuration: {
                    database: state.selectedDatabase,
                    provider: state.selectedProvider
                }
            });
            console.log('Indexing started');
        }
        catch (error) {
            console.error('Failed to start indexing:', error);
            setupStore_1.setupActions.setError(`Failed to start indexing: ${error}`);
            setupStore_1.setupActions.stopIndexing();
        }
    }
    /**
     * Update UI based on store state
     */
    updateUI(state) {
        // Update progress steps
        this.updateProgressSteps(state.setupStep);
        // Update index button
        if (this.indexButton) {
            this.indexButton.disabled = !state.isSetupComplete || state.isIndexing;
            if (state.isIndexing) {
                this.indexButton.innerHTML = '<span class="button-icon">⏳</span> Indexing...';
            }
            else {
                this.indexButton.innerHTML = '<span class="button-icon">🚀</span> Index Now';
            }
        }
        // Update action help text
        const actionHelp = this.container.querySelector('.action-help');
        if (actionHelp) {
            if (state.isSetupComplete) {
                actionHelp.textContent = 'Ready to index your codebase!';
                actionHelp.style.color = 'var(--vscode-charts-green)';
            }
            else {
                actionHelp.textContent = 'Complete the configuration above to enable indexing.';
                actionHelp.style.color = 'var(--vscode-descriptionForeground)';
            }
        }
        // Show/hide indexing progress
        if (this.progressSection) {
            if (state.isIndexing) {
                this.progressSection.classList.remove('hidden');
            }
            else {
                this.progressSection.classList.add('hidden');
            }
        }
        // Show errors
        if (state.lastError) {
            this.showError(state.lastError);
        }
    }
    /**
     * Update progress steps visual state
     */
    updateProgressSteps(currentStep) {
        const steps = this.container.querySelectorAll('.progress-step');
        steps.forEach((step) => {
            const stepElement = step;
            const stepName = stepElement.dataset.step;
            stepElement.classList.remove('active', 'completed');
            if (stepName === currentStep) {
                stepElement.classList.add('active');
            }
            else if (this.isStepCompleted(stepName, currentStep)) {
                stepElement.classList.add('completed');
            }
        });
    }
    /**
     * Check if a step is completed
     */
    isStepCompleted(stepName, currentStep) {
        const stepOrder = ['database', 'provider', 'ready', 'indexing'];
        const currentIndex = stepOrder.indexOf(currentStep);
        const stepIndex = stepOrder.indexOf(stepName || '');
        return stepIndex < currentIndex;
    }
    /**
     * Update indexing progress
     */
    updateIndexingProgress(data) {
        if (!this.progressSection)
            return;
        const progressFill = this.progressSection.querySelector('.progress-fill');
        const progressText = this.progressSection.querySelector('.progress-text');
        if (progressFill && data.percentage !== undefined) {
            progressFill.style.width = `${data.percentage}%`;
        }
        if (progressText && data.message) {
            progressText.textContent = data.message;
        }
    }
    /**
     * Handle indexing completion
     */
    handleIndexingCompleted(data) {
        setupStore_1.setupActions.stopIndexing();
        if (data.success) {
            this.showSuccess('Indexing completed successfully! You can now search your code.');
        }
        else {
            setupStore_1.setupActions.setError('Indexing failed. Please check the logs and try again.');
        }
    }
    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }
    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    /**
     * Show notification
     */
    showNotification(message, type) {
        // Remove existing notifications
        const existing = this.container.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => notification.remove();
        notification.appendChild(closeBtn);
        // Insert at top of setup view
        this.container.insertBefore(notification, this.container.firstChild);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    /**
     * Cleanup component
     */
    dispose() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        if (this.systemValidation) {
            this.systemValidation.dispose();
            this.systemValidation = null;
        }
        if (this.databaseSetup) {
            this.databaseSetup.dispose();
            this.databaseSetup = null;
        }
        if (this.embeddingSetup) {
            this.embeddingSetup.dispose();
            this.embeddingSetup = null;
        }
        if (this.configurationManagement) {
            this.configurationManagement.dispose();
            this.configurationManagement = null;
        }
    }
}
exports.SetupView = SetupView;
// CSS styles for the setup view
const setupViewStyles = `
.setup-view {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.setup-header {
    text-align: center;
    margin-bottom: 30px;
}

.setup-header h1 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
    font-size: 28px;
}

.setup-header p {
    margin: 0;
    color: var(--vscode-descriptionForeground);
    font-size: 16px;
}

.setup-progress {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40px;
    padding: 20px;
}

.progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    border: 2px solid var(--vscode-panel-border);
    background-color: var(--vscode-sideBar-background);
    color: var(--vscode-descriptionForeground);
    transition: all 0.3s ease;
}

.progress-step.active .step-number {
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: var(--vscode-button-background);
}

.progress-step.completed .step-number {
    background-color: var(--vscode-charts-green);
    color: white;
    border-color: var(--vscode-charts-green);
}

.step-label {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    font-weight: 500;
}

.progress-step.active .step-label {
    color: var(--vscode-foreground);
}

.progress-line {
    width: 60px;
    height: 2px;
    background-color: var(--vscode-panel-border);
    margin: 0 10px;
}

.setup-content {
    margin-bottom: 30px;
}

.setup-actions {
    text-align: center;
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    background-color: var(--vscode-sideBar-background);
}

.index-button {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.index-button:hover:not(:disabled) {
    background-color: var(--vscode-button-hoverBackground);
}

.index-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.action-help {
    margin: 10px 0 0 0;
    font-size: 14px;
    color: var(--vscode-descriptionForeground);
}

.indexing-progress {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    background-color: var(--vscode-textCodeBlock-background);
}

.indexing-progress.hidden {
    display: none;
}

.indexing-progress h3 {
    margin: 0 0 15px 0;
    color: var(--vscode-textLink-foreground);
}

.progress-bar {
    width: 100%;
    height: 8px;
    background-color: var(--vscode-progressBar-background);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 10px;
}

.progress-fill {
    height: 100%;
    background-color: var(--vscode-progressBar-foreground);
    transition: width 0.3s ease;
    width: 0%;
}

.progress-text {
    margin: 0;
    font-size: 14px;
    color: var(--vscode-foreground);
}

.notification {
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.notification.error {
    background-color: var(--vscode-inputValidation-errorBackground);
    border: 1px solid var(--vscode-inputValidation-errorBorder);
    color: var(--vscode-inputValidation-errorForeground);
}

.notification.success {
    background-color: var(--vscode-charts-green);
    color: white;
}

.notification-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
}
`;
//# sourceMappingURL=SetupView.js.map