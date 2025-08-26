"use strict";
/**
 * PineconeConfig Component
 *
 * Handles Pinecone-specific configuration including API key, environment,
 * and index management for cloud-based vector database.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pineconeConfigStyles = exports.PineconeConfigComponent = void 0;
const setupStore_1 = require("../stores/setupStore");
class PineconeConfigComponent {
    constructor(container) {
        this.apiKeyInput = null;
        this.environmentInput = null;
        this.indexNameInput = null;
        this.testButton = null;
        this.statusElement = null;
        this.container = container;
        this.render();
        this.setupEventListeners();
    }
    /**
     * Render the Pinecone configuration UI
     */
    render() {
        this.container.innerHTML = `
            <div class="pinecone-config">
                <h4>Pinecone Configuration</h4>
                <p class="config-description">
                    Configure your Pinecone cloud vector database. You'll need a Pinecone account and API key.
                    <a href="https://www.pinecone.io/" target="_blank" rel="noopener">Sign up for Pinecone</a>
                </p>

                <div class="config-grid">
                    <div class="config-item">
                        <label for="pinecone-api-key">API Key:</label>
                        <input type="password" id="pinecone-api-key" placeholder="Enter your Pinecone API key">
                        <small>Your Pinecone API key (stored securely in VS Code)</small>
                    </div>

                    <div class="config-item">
                        <label for="pinecone-environment">Environment:</label>
                        <input type="text" id="pinecone-environment" placeholder="e.g., us-east-1-aws">
                        <small>Your Pinecone environment (found in Pinecone console)</small>
                    </div>

                    <div class="config-item">
                        <label for="pinecone-index-name">Index Name:</label>
                        <input type="text" id="pinecone-index-name" placeholder="e.g., code-context-index">
                        <small>Name for your vector index (will be created if it doesn't exist)</small>
                    </div>
                </div>

                <div class="config-actions">
                    <button id="test-pinecone-connection" class="test-button">Test Connection</button>
                    <div id="pinecone-status" class="connection-status">
                        <span class="status-dot unknown"></span>
                        <span class="status-text">Not tested</span>
                    </div>
                </div>

                <div class="config-info">
                    <div class="info-section">
                        <h5>🔑 Getting Your API Key</h5>
                        <ol>
                            <li>Sign up at <a href="https://www.pinecone.io/" target="_blank">pinecone.io</a></li>
                            <li>Go to your Pinecone console</li>
                            <li>Navigate to "API Keys" section</li>
                            <li>Copy your API key</li>
                        </ol>
                    </div>
                    
                    <div class="info-section">
                        <h5>🌍 Finding Your Environment</h5>
                        <p>Your environment is shown in the Pinecone console URL or dashboard. Common environments:</p>
                        <ul>
                            <li><code>us-east-1-aws</code> (US East)</li>
                            <li><code>us-west-2-aws</code> (US West)</li>
                            <li><code>eu-west-1-aws</code> (Europe)</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h5>📊 Index Configuration</h5>
                        <p>The index will be created automatically with these settings:</p>
                        <ul>
                            <li><strong>Dimension:</strong> Based on your embedding model</li>
                            <li><strong>Metric:</strong> Cosine similarity</li>
                            <li><strong>Pod Type:</strong> Starter (free tier)</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        // Get references to elements
        this.apiKeyInput = this.container.querySelector('#pinecone-api-key');
        this.environmentInput = this.container.querySelector('#pinecone-environment');
        this.indexNameInput = this.container.querySelector('#pinecone-index-name');
        this.testButton = this.container.querySelector('#test-pinecone-connection');
        this.statusElement = this.container.querySelector('#pinecone-status');
    }
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Update configuration when inputs change
        [this.apiKeyInput, this.environmentInput, this.indexNameInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.updateConfiguration());
                input.addEventListener('change', () => this.updateConfiguration());
            }
        });
        // Test connection button
        if (this.testButton) {
            this.testButton.addEventListener('click', () => this.testConnection());
        }
        // API key validation
        if (this.apiKeyInput) {
            this.apiKeyInput.addEventListener('input', () => this.validateApiKey());
        }
    }
    /**
     * Validate API key format
     */
    validateApiKey() {
        if (!this.apiKeyInput)
            return;
        const apiKey = this.apiKeyInput.value;
        const isValid = apiKey.length > 20 && /^[a-f0-9-]+$/i.test(apiKey);
        if (apiKey && !isValid) {
            this.apiKeyInput.style.borderColor = 'var(--vscode-inputValidation-errorBorder)';
        }
        else {
            this.apiKeyInput.style.borderColor = '';
        }
    }
    /**
     * Update configuration in store
     */
    updateConfiguration() {
        if (!this.apiKeyInput || !this.environmentInput || !this.indexNameInput)
            return;
        const config = {
            apiKey: this.apiKeyInput.value,
            environment: this.environmentInput.value,
            indexName: this.indexNameInput.value
        };
        setupStore_1.setupActions.setDatabaseConfig(config);
    }
    /**
     * Test Pinecone connection
     */
    async testConnection() {
        if (!this.testButton || !this.statusElement)
            return;
        const config = this.getConfiguration();
        // Validate required fields
        if (!config.apiKey || !config.environment) {
            this.updateStatus('error', 'API key and environment are required');
            return;
        }
        // Update UI to show testing state
        this.testButton.disabled = true;
        this.testButton.textContent = 'Testing...';
        this.updateStatus('testing', 'Testing connection...');
        try {
            // Test connection by listing indexes
            const response = await fetch(`https://controller.${config.environment}.pinecone.io/databases`, {
                method: 'GET',
                headers: {
                    'Api-Key': config.apiKey,
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            if (response.ok) {
                const data = await response.json();
                this.updateStatus('success', 'Connection successful!');
                setupStore_1.setupActions.updateDatabaseStatus('running');
                // Check if index exists
                if (config.indexName && Array.isArray(data)) {
                    const indexExists = data.some((index) => index.name === config.indexName);
                    if (indexExists) {
                        this.updateStatus('success', 'Connection successful! Index found.');
                    }
                    else {
                        this.updateStatus('success', 'Connection successful! Index will be created.');
                    }
                }
            }
            else if (response.status === 401) {
                this.updateStatus('error', 'Invalid API key');
            }
            else if (response.status === 403) {
                this.updateStatus('error', 'Access denied - check your API key permissions');
            }
            else {
                this.updateStatus('error', `Connection failed: ${response.status} ${response.statusText}`);
            }
        }
        catch (error) {
            console.error('Pinecone connection test failed:', error);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    this.updateStatus('error', 'Connection timeout - check your environment');
                }
                else if (error.message.includes('Failed to fetch')) {
                    this.updateStatus('error', 'Network error - check your internet connection');
                }
                else {
                    this.updateStatus('error', `Connection error: ${error.message}`);
                }
            }
            else {
                this.updateStatus('error', 'Unknown connection error');
            }
        }
        finally {
            // Reset button state
            this.testButton.disabled = false;
            this.testButton.textContent = 'Test Connection';
        }
    }
    /**
     * Update connection status display
     */
    updateStatus(type, message) {
        if (!this.statusElement)
            return;
        const statusDot = this.statusElement.querySelector('.status-dot');
        const statusText = this.statusElement.querySelector('.status-text');
        if (statusDot && statusText) {
            // Remove all status classes
            statusDot.className = 'status-dot';
            statusDot.classList.add(type);
            statusText.textContent = message;
        }
    }
    /**
     * Get current configuration
     */
    getConfiguration() {
        return {
            apiKey: this.apiKeyInput?.value || '',
            environment: this.environmentInput?.value || '',
            indexName: this.indexNameInput?.value || ''
        };
    }
    /**
     * Load configuration from external source
     */
    loadConfiguration(config) {
        if (this.apiKeyInput)
            this.apiKeyInput.value = config.apiKey;
        if (this.environmentInput)
            this.environmentInput.value = config.environment;
        if (this.indexNameInput)
            this.indexNameInput.value = config.indexName;
        this.updateConfiguration();
    }
    /**
     * Validate configuration
     */
    validateConfiguration() {
        const errors = [];
        const config = this.getConfiguration();
        if (!config.apiKey || config.apiKey.trim() === '') {
            errors.push('API key is required');
        }
        else if (config.apiKey.length < 20) {
            errors.push('API key appears to be invalid (too short)');
        }
        if (!config.environment || config.environment.trim() === '') {
            errors.push('Environment is required');
        }
        if (!config.indexName || config.indexName.trim() === '') {
            errors.push('Index name is required');
        }
        else if (!/^[a-z0-9-]+$/.test(config.indexName)) {
            errors.push('Index name must contain only lowercase letters, numbers, and hyphens');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Cleanup component
     */
    dispose() {
        // Remove event listeners if needed
    }
}
exports.PineconeConfigComponent = PineconeConfigComponent;
// CSS styles for Pinecone configuration
exports.pineconeConfigStyles = `
.pinecone-config {
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
}

.pinecone-config h4 {
    margin: 0 0 8px 0;
    color: var(--vscode-textLink-foreground);
    font-size: 14px;
}

.config-description {
    margin: 0 0 15px 0;
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
    line-height: 1.4;
}

.config-description a {
    color: var(--vscode-textLink-foreground);
    text-decoration: none;
}

.config-description a:hover {
    text-decoration: underline;
}

.config-grid {
    display: grid;
    gap: 15px;
    margin-bottom: 15px;
}

.config-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.config-item label {
    font-weight: 500;
    color: var(--vscode-foreground);
    font-size: 13px;
}

.config-item input {
    padding: 6px 8px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 3px;
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-family: inherit;
    font-size: 13px;
}

.config-item input:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
}

.config-item small {
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
}

.config-actions {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
}

.test-button {
    padding: 6px 12px;
    border: none;
    border-radius: 3px;
    background-color: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
}

.test-button:hover:not(:disabled) {
    background-color: var(--vscode-button-secondaryHoverBackground);
}

.test-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.connection-status {
    display: flex;
    align-items: center;
    gap: 6px;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transition: background-color 0.2s ease;
}

.status-dot.unknown {
    background-color: var(--vscode-charts-gray);
}

.status-dot.testing {
    background-color: var(--vscode-charts-yellow);
    animation: pulse 1.5s infinite;
}

.status-dot.success {
    background-color: var(--vscode-charts-green);
}

.status-dot.error {
    background-color: var(--vscode-charts-red);
}

.status-text {
    font-size: 12px;
    color: var(--vscode-foreground);
}

.config-info {
    border-top: 1px solid var(--vscode-panel-border);
    padding-top: 15px;
    margin-top: 15px;
}

.info-section {
    margin-bottom: 15px;
}

.info-section h5 {
    margin: 0 0 8px 0;
    color: var(--vscode-textLink-foreground);
    font-size: 13px;
}

.info-section p {
    margin: 0 0 6px 0;
    color: var(--vscode-foreground);
    font-size: 12px;
    line-height: 1.4;
}

.info-section ol,
.info-section ul {
    margin: 6px 0;
    padding-left: 20px;
    color: var(--vscode-foreground);
    font-size: 12px;
}

.info-section li {
    margin-bottom: 3px;
    line-height: 1.3;
}

.info-section code {
    padding: 2px 4px;
    background-color: var(--vscode-textCodeBlock-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 2px;
    font-family: var(--vscode-editor-font-family);
    font-size: 11px;
    color: var(--vscode-textPreformat-foreground);
}

.info-section a {
    color: var(--vscode-textLink-foreground);
    text-decoration: none;
}

.info-section a:hover {
    text-decoration: underline;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
`;
//# sourceMappingURL=PineconeConfig.js.map