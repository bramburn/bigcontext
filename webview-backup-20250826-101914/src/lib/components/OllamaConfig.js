"use strict";
/**
 * OllamaConfig Component
 *
 * Enhanced Ollama configuration with support for custom endpoints,
 * model validation, and connection testing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaConfigStyles = exports.OllamaConfigComponent = void 0;
const setupStore_1 = require("../stores/setupStore");
class OllamaConfigComponent {
    constructor(container) {
        this.endpointInput = null;
        this.modelSelect = null;
        this.apiKeyInput = null;
        this.timeoutInput = null;
        this.testButton = null;
        this.refreshModelsButton = null;
        this.statusElement = null;
        this.availableModels = [];
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.loadAvailableModels();
    }
    /**
     * Render the Ollama configuration UI
     */
    render() {
        this.container.innerHTML = `
            <div class="ollama-config">
                <h4>Ollama Configuration</h4>
                <p class="config-description">
                    Configure your Ollama instance. Ollama can run locally or on a remote server.
                    <a href="https://ollama.ai/" target="_blank" rel="noopener">Learn more about Ollama</a>
                </p>

                <div class="config-grid">
                    <div class="config-item">
                        <label for="ollama-endpoint">Endpoint URL:</label>
                        <input type="text" id="ollama-endpoint" value="http://localhost:11434" placeholder="http://localhost:11434">
                        <small>Ollama server endpoint (local or remote)</small>
                    </div>

                    <div class="config-item">
                        <label for="ollama-model">Embedding Model:</label>
                        <div class="model-selection">
                            <select id="ollama-model" class="model-select">
                                <option value="">Loading models...</option>
                            </select>
                            <button id="refresh-models" class="refresh-button" title="Refresh available models">
                                🔄
                            </button>
                        </div>
                        <small>Choose an embedding model (will be downloaded if not available)</small>
                    </div>

                    <div class="config-item">
                        <label for="ollama-api-key">API Key (Optional):</label>
                        <input type="password" id="ollama-api-key" placeholder="Enter API key if required">
                        <small>Leave empty for local instances without authentication</small>
                    </div>

                    <div class="config-item">
                        <label for="ollama-timeout">Request Timeout (seconds):</label>
                        <input type="number" id="ollama-timeout" value="30" min="5" max="300">
                        <small>Timeout for model requests (5-300 seconds)</small>
                    </div>
                </div>

                <div class="config-actions">
                    <button id="test-ollama-connection" class="test-button">Test Connection</button>
                    <div id="ollama-status" class="connection-status">
                        <span class="status-dot unknown"></span>
                        <span class="status-text">Not tested</span>
                    </div>
                </div>

                <div class="config-info">
                    <div class="info-section">
                        <h5>🏠 Local Installation</h5>
                        <p>Install Ollama locally:</p>
                        <ol>
                            <li>Download from <a href="https://ollama.ai/" target="_blank">ollama.ai</a></li>
                            <li>Install and start the service</li>
                            <li>Pull an embedding model: <code>ollama pull nomic-embed-text</code></li>
                        </ol>
                    </div>
                    
                    <div class="info-section">
                        <h5>🌐 Remote Setup</h5>
                        <p>Connect to a remote Ollama instance:</p>
                        <ul>
                            <li>Update the endpoint URL to your server</li>
                            <li>Add API key if authentication is enabled</li>
                            <li>Ensure the server is accessible from your network</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h5>📊 Recommended Models</h5>
                        <ul>
                            <li><strong>nomic-embed-text</strong> - High quality, 768 dimensions</li>
                            <li><strong>all-minilm</strong> - Fast and efficient, 384 dimensions</li>
                            <li><strong>mxbai-embed-large</strong> - Large model, 1024 dimensions</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        // Get references to elements
        this.endpointInput = this.container.querySelector('#ollama-endpoint');
        this.modelSelect = this.container.querySelector('#ollama-model');
        this.apiKeyInput = this.container.querySelector('#ollama-api-key');
        this.timeoutInput = this.container.querySelector('#ollama-timeout');
        this.testButton = this.container.querySelector('#test-ollama-connection');
        this.refreshModelsButton = this.container.querySelector('#refresh-models');
        this.statusElement = this.container.querySelector('#ollama-status');
    }
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Update configuration when inputs change
        [this.endpointInput, this.modelSelect, this.apiKeyInput, this.timeoutInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.updateConfiguration());
                input.addEventListener('change', () => this.updateConfiguration());
            }
        });
        // Test connection button
        if (this.testButton) {
            this.testButton.addEventListener('click', () => this.testConnection());
        }
        // Refresh models button
        if (this.refreshModelsButton) {
            this.refreshModelsButton.addEventListener('click', () => this.loadAvailableModels());
        }
        // Endpoint change should reload models
        if (this.endpointInput) {
            this.endpointInput.addEventListener('blur', () => {
                setTimeout(() => this.loadAvailableModels(), 500);
            });
        }
    }
    /**
     * Load available models from Ollama
     */
    async loadAvailableModels() {
        if (!this.modelSelect || !this.endpointInput || !this.refreshModelsButton)
            return;
        const endpoint = this.endpointInput.value || 'http://localhost:11434';
        // Update UI to show loading
        this.refreshModelsButton.disabled = true;
        this.refreshModelsButton.textContent = '⏳';
        this.modelSelect.innerHTML = '<option value="">Loading models...</option>';
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            // Add API key if provided
            if (this.apiKeyInput?.value) {
                headers['Authorization'] = `Bearer ${this.apiKeyInput.value}`;
            }
            const response = await fetch(`${endpoint}/api/tags`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(10000)
            });
            if (response.ok) {
                const data = await response.json();
                this.availableModels = data.models?.map((model) => model.name) || [];
                this.updateModelOptions();
                this.updateStatus('success', 'Models loaded successfully');
            }
            else {
                throw new Error(`Failed to load models: ${response.status}`);
            }
        }
        catch (error) {
            console.error('Failed to load Ollama models:', error);
            this.availableModels = [];
            this.updateModelOptions(true);
            if (error instanceof Error && error.name === 'AbortError') {
                this.updateStatus('error', 'Connection timeout - check endpoint');
            }
            else {
                this.updateStatus('error', 'Could not load models - using defaults');
            }
        }
        finally {
            // Reset button state
            this.refreshModelsButton.disabled = false;
            this.refreshModelsButton.textContent = '🔄';
        }
    }
    /**
     * Update model selection options
     */
    updateModelOptions(useDefaults = false) {
        if (!this.modelSelect)
            return;
        const currentValue = this.modelSelect.value;
        this.modelSelect.innerHTML = '';
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a model...';
        this.modelSelect.appendChild(defaultOption);
        // Add available models or defaults
        const models = useDefaults ? [
            'nomic-embed-text',
            'all-minilm',
            'mxbai-embed-large'
        ] : this.availableModels;
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            this.modelSelect.appendChild(option);
        });
        // Restore previous selection if still available
        if (currentValue && models.includes(currentValue)) {
            this.modelSelect.value = currentValue;
        }
        // Add note about default models if using fallback
        if (useDefaults) {
            const noteOption = document.createElement('option');
            noteOption.disabled = true;
            noteOption.textContent = '--- Default models (will be downloaded) ---';
            this.modelSelect.insertBefore(noteOption, this.modelSelect.children[1]);
        }
    }
    /**
     * Update configuration in store
     */
    updateConfiguration() {
        if (!this.endpointInput || !this.modelSelect || !this.timeoutInput)
            return;
        const config = {
            endpoint: this.endpointInput.value || 'http://localhost:11434',
            model: this.modelSelect.value,
            apiKey: this.apiKeyInput?.value || undefined,
            timeout: parseInt(this.timeoutInput.value) || 30
        };
        setupStore_1.setupActions.setEmbeddingConfig(config);
    }
    /**
     * Test Ollama connection and model availability
     */
    async testConnection() {
        if (!this.testButton || !this.statusElement)
            return;
        const config = this.getConfiguration();
        // Validate required fields
        if (!config.endpoint || !config.model) {
            this.updateStatus('error', 'Endpoint and model are required');
            return;
        }
        // Update UI to show testing state
        this.testButton.disabled = true;
        this.testButton.textContent = 'Testing...';
        this.updateStatus('testing', 'Testing connection...');
        try {
            // Test basic connection
            const headers = {
                'Content-Type': 'application/json'
            };
            if (config.apiKey) {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }
            // First test: Check if Ollama is running
            const healthResponse = await fetch(`${config.endpoint}/api/tags`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(config.timeout * 1000)
            });
            if (!healthResponse.ok) {
                throw new Error(`Ollama not responding: ${healthResponse.status}`);
            }
            // Second test: Check if model is available
            const modelsData = await healthResponse.json();
            const availableModels = modelsData.models?.map((m) => m.name) || [];
            if (!availableModels.includes(config.model)) {
                this.updateStatus('warning', `Model '${config.model}' not found - will be downloaded when needed`);
            }
            else {
                this.updateStatus('success', 'Connection successful! Model is available.');
            }
        }
        catch (error) {
            console.error('Ollama connection test failed:', error);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    this.updateStatus('error', 'Connection timeout - check endpoint and timeout settings');
                }
                else if (error.message.includes('Failed to fetch')) {
                    this.updateStatus('error', 'Cannot reach Ollama - check if it\'s running and endpoint is correct');
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
            endpoint: this.endpointInput?.value || 'http://localhost:11434',
            model: this.modelSelect?.value || '',
            apiKey: this.apiKeyInput?.value || undefined,
            timeout: parseInt(this.timeoutInput?.value || '30')
        };
    }
    /**
     * Load configuration from external source
     */
    loadConfiguration(config) {
        if (this.endpointInput)
            this.endpointInput.value = config.endpoint;
        if (this.modelSelect)
            this.modelSelect.value = config.model;
        if (this.apiKeyInput)
            this.apiKeyInput.value = config.apiKey || '';
        if (this.timeoutInput)
            this.timeoutInput.value = (config.timeout || 30).toString();
        this.updateConfiguration();
    }
    /**
     * Validate configuration
     */
    validateConfiguration() {
        const errors = [];
        const config = this.getConfiguration();
        if (!config.endpoint || config.endpoint.trim() === '') {
            errors.push('Endpoint URL is required');
        }
        else {
            try {
                new URL(config.endpoint);
            }
            catch {
                errors.push('Endpoint URL is not valid');
            }
        }
        if (!config.model || config.model.trim() === '') {
            errors.push('Model selection is required');
        }
        if (config.timeout < 5 || config.timeout > 300) {
            errors.push('Timeout must be between 5 and 300 seconds');
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
exports.OllamaConfigComponent = OllamaConfigComponent;
// CSS styles for Ollama configuration
exports.ollamaConfigStyles = `
.ollama-config {
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
}

.ollama-config h4 {
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

.config-item input,
.config-item select {
    padding: 6px 8px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 3px;
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-family: inherit;
    font-size: 13px;
}

.config-item input:focus,
.config-item select:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
}

.model-selection {
    display: flex;
    gap: 6px;
    align-items: center;
}

.model-select {
    flex: 1;
}

.refresh-button {
    padding: 6px 8px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 3px;
    background-color: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    cursor: pointer;
    font-size: 12px;
    min-width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.refresh-button:hover:not(:disabled) {
    background-color: var(--vscode-button-secondaryHoverBackground);
}

.refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

.status-dot.warning {
    background-color: var(--vscode-charts-orange);
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
//# sourceMappingURL=OllamaConfig.js.map