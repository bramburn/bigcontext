/**
 * OpenAIConfig Component
 * 
 * Enhanced OpenAI configuration with secure API key storage,
 * model validation, and custom endpoint support.
 */

import { setupActions, OpenAIConfig } from '../stores/setupStore';
import { vscodeApi } from '../vscodeApi';

export class OpenAIConfigComponent {
    private container: HTMLElement;
    private apiKeyInput: HTMLInputElement | null = null;
    private modelSelect: HTMLSelectElement | null = null;
    private organizationInput: HTMLInputElement | null = null;
    private baseURLInput: HTMLInputElement | null = null;
    private testButton: HTMLButtonElement | null = null;
    private saveKeyButton: HTMLButtonElement | null = null;
    private loadKeyButton: HTMLButtonElement | null = null;
    private statusElement: HTMLElement | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.loadSavedApiKey();
    }

    /**
     * Render the OpenAI configuration UI
     */
    private render(): void {
        this.container.innerHTML = `
            <div class="openai-config">
                <h4>OpenAI Configuration</h4>
                <p class="config-description">
                    Configure your OpenAI API settings for cloud-based embeddings.
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">Get your API key</a>
                </p>

                <div class="config-grid">
                    <div class="config-item">
                        <label for="openai-api-key">API Key:</label>
                        <div class="api-key-section">
                            <input type="password" id="openai-api-key" placeholder="sk-...">
                            <div class="key-actions">
                                <button id="save-api-key" class="key-button" title="Save API key securely">💾</button>
                                <button id="load-api-key" class="key-button" title="Load saved API key">📂</button>
                            </div>
                        </div>
                        <small>Your API key is stored securely in VS Code's secret storage</small>
                    </div>

                    <div class="config-item">
                        <label for="openai-model">Embedding Model:</label>
                        <select id="openai-model" class="model-select">
                            <option value="text-embedding-ada-002">text-embedding-ada-002 (Legacy)</option>
                            <option value="text-embedding-3-small" selected>text-embedding-3-small (Recommended)</option>
                            <option value="text-embedding-3-large">text-embedding-3-large (High Performance)</option>
                        </select>
                        <small>Choose the embedding model for your use case</small>
                    </div>

                    <div class="config-item">
                        <label for="openai-organization">Organization ID (Optional):</label>
                        <input type="text" id="openai-organization" placeholder="org-...">
                        <small>Your OpenAI organization ID (if applicable)</small>
                    </div>

                    <div class="config-item">
                        <label for="openai-base-url">Custom Base URL (Optional):</label>
                        <input type="text" id="openai-base-url" placeholder="https://api.openai.com/v1">
                        <small>Custom endpoint for OpenAI-compatible APIs (Azure OpenAI, etc.)</small>
                    </div>
                </div>

                <div class="config-actions">
                    <button id="test-openai-connection" class="test-button">Test API Key</button>
                    <div id="openai-status" class="connection-status">
                        <span class="status-dot unknown"></span>
                        <span class="status-text">Not tested</span>
                    </div>
                </div>

                <div class="config-info">
                    <div class="info-section">
                        <h5>🔑 API Key Management</h5>
                        <ul>
                            <li>API keys are stored securely using VS Code's secret storage</li>
                            <li>Keys are encrypted and never stored in plain text</li>
                            <li>Use the save/load buttons to manage your API key</li>
                        </ul>
                    </div>
                    
                    <div class="info-section">
                        <h5>📊 Model Comparison</h5>
                        <ul>
                            <li><strong>text-embedding-3-small</strong> - Best balance of performance and cost</li>
                            <li><strong>text-embedding-3-large</strong> - Highest quality embeddings</li>
                            <li><strong>text-embedding-ada-002</strong> - Legacy model (deprecated)</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h5>🔧 Custom Endpoints</h5>
                        <p>Supported OpenAI-compatible services:</p>
                        <ul>
                            <li>Azure OpenAI Service</li>
                            <li>OpenAI-compatible local models</li>
                            <li>Third-party OpenAI proxies</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Get references to elements
        this.apiKeyInput = this.container.querySelector('#openai-api-key') as HTMLInputElement;
        this.modelSelect = this.container.querySelector('#openai-model') as HTMLSelectElement;
        this.organizationInput = this.container.querySelector('#openai-organization') as HTMLInputElement;
        this.baseURLInput = this.container.querySelector('#openai-base-url') as HTMLInputElement;
        this.testButton = this.container.querySelector('#test-openai-connection') as HTMLButtonElement;
        this.saveKeyButton = this.container.querySelector('#save-api-key') as HTMLButtonElement;
        this.loadKeyButton = this.container.querySelector('#load-api-key') as HTMLButtonElement;
        this.statusElement = this.container.querySelector('#openai-status') as HTMLElement;
    }

    /**
     * Set up event listeners
     */
    private setupEventListeners(): void {
        // Update configuration when inputs change
        [this.apiKeyInput, this.modelSelect, this.organizationInput, this.baseURLInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.updateConfiguration());
                input.addEventListener('change', () => this.updateConfiguration());
            }
        });

        // Test connection button
        if (this.testButton) {
            this.testButton.addEventListener('click', () => this.testConnection());
        }

        // Save API key button
        if (this.saveKeyButton) {
            this.saveKeyButton.addEventListener('click', () => this.saveApiKey());
        }

        // Load API key button
        if (this.loadKeyButton) {
            this.loadKeyButton.addEventListener('click', () => this.loadSavedApiKey());
        }

        // API key validation
        if (this.apiKeyInput) {
            this.apiKeyInput.addEventListener('input', () => this.validateApiKey());
        }
    }

    /**
     * Validate API key format
     */
    private validateApiKey(): void {
        if (!this.apiKeyInput) return;

        const apiKey = this.apiKeyInput.value;
        const isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
        
        if (apiKey && !isValid) {
            this.apiKeyInput.style.borderColor = 'var(--vscode-inputValidation-errorBorder)';
        } else {
            this.apiKeyInput.style.borderColor = '';
        }
    }

    /**
     * Save API key securely
     */
    private async saveApiKey(): Promise<void> {
        if (!this.apiKeyInput || !this.saveKeyButton) return;

        const apiKey = this.apiKeyInput.value;
        if (!apiKey) {
            this.updateStatus('error', 'No API key to save');
            return;
        }

        this.saveKeyButton.disabled = true;
        this.saveKeyButton.textContent = '💾...';

        try {
            vscodeApi.postMessage({
                command: 'saveSecretValue',
                key: 'openai-api-key',
                value: apiKey
            });

            this.updateStatus('success', 'API key saved securely');
        } catch (error) {
            console.error('Failed to save API key:', error);
            this.updateStatus('error', 'Failed to save API key');
        } finally {
            this.saveKeyButton.disabled = false;
            this.saveKeyButton.textContent = '💾';
        }
    }

    /**
     * Load saved API key
     */
    private async loadSavedApiKey(): Promise<void> {
        if (!this.loadKeyButton) return;

        this.loadKeyButton.disabled = true;
        this.loadKeyButton.textContent = '📂...';

        try {
            // Send message to get secret value
            vscodeApi.postMessage({
                command: 'getSecretValue',
                key: 'openai-api-key'
            });

            // Listen for response (this is a simplified approach - in a real implementation,
            // you'd want to set up proper response handling)
            this.updateStatus('success', 'Attempting to load saved API key...');
        } catch (error) {
            console.error('Failed to load API key:', error);
            this.updateStatus('error', 'Failed to load API key');
        } finally {
            this.loadKeyButton.disabled = false;
            this.loadKeyButton.textContent = '📂';
        }
    }

    /**
     * Update configuration in store
     */
    private updateConfiguration(): void {
        if (!this.apiKeyInput || !this.modelSelect) return;

        const config: OpenAIConfig = {
            apiKey: this.apiKeyInput.value,
            model: this.modelSelect.value,
            organization: this.organizationInput?.value || undefined,
            baseURL: this.baseURLInput?.value || undefined
        };

        setupActions.setEmbeddingConfig(config);
    }

    /**
     * Test OpenAI connection and API key
     */
    private async testConnection(): Promise<void> {
        if (!this.testButton || !this.statusElement) return;

        const config = this.getConfiguration();
        
        // Validate required fields
        if (!config.apiKey) {
            this.updateStatus('error', 'API key is required');
            return;
        }

        // Update UI to show testing state
        this.testButton.disabled = true;
        this.testButton.textContent = 'Testing...';
        this.updateStatus('testing', 'Testing API key...');

        try {
            const baseURL = config.baseURL || 'https://api.openai.com/v1';
            const headers: Record<string, string> = {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            };

            if (config.organization) {
                headers['OpenAI-Organization'] = config.organization;
            }

            // Test API key by listing models
            const response = await fetch(`${baseURL}/models`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                const data = await response.json();
                const hasEmbeddingModels = data.data?.some((model: any) => 
                    model.id.includes('embedding') || model.id === config.model
                );

                if (hasEmbeddingModels) {
                    this.updateStatus('success', 'API key valid! Embedding models available.');
                } else {
                    this.updateStatus('warning', 'API key valid, but embedding models may not be available.');
                }
            } else if (response.status === 401) {
                this.updateStatus('error', 'Invalid API key');
            } else if (response.status === 403) {
                this.updateStatus('error', 'Access denied - check your API key permissions');
            } else {
                this.updateStatus('error', `API test failed: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            console.error('OpenAI connection test failed:', error);
            
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    this.updateStatus('error', 'Connection timeout - check your base URL');
                } else if (error.message.includes('Failed to fetch')) {
                    this.updateStatus('error', 'Network error - check your internet connection');
                } else {
                    this.updateStatus('error', `Connection error: ${error.message}`);
                }
            } else {
                this.updateStatus('error', 'Unknown connection error');
            }
        } finally {
            // Reset button state
            this.testButton.disabled = false;
            this.testButton.textContent = 'Test API Key';
        }
    }

    /**
     * Update connection status display
     */
    private updateStatus(type: 'testing' | 'success' | 'warning' | 'error' | 'unknown', message: string): void {
        if (!this.statusElement) return;

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
    private getConfiguration(): OpenAIConfig {
        return {
            apiKey: this.apiKeyInput?.value || '',
            model: this.modelSelect?.value || 'text-embedding-3-small',
            organization: this.organizationInput?.value || undefined,
            baseURL: this.baseURLInput?.value || undefined
        };
    }

    /**
     * Load configuration from external source
     */
    public loadConfiguration(config: OpenAIConfig): void {
        if (this.apiKeyInput) this.apiKeyInput.value = config.apiKey;
        if (this.modelSelect) this.modelSelect.value = config.model;
        if (this.organizationInput) this.organizationInput.value = config.organization || '';
        if (this.baseURLInput) this.baseURLInput.value = config.baseURL || '';
        
        this.updateConfiguration();
    }

    /**
     * Validate configuration
     */
    public validateConfiguration(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const config = this.getConfiguration();

        if (!config.apiKey || config.apiKey.trim() === '') {
            errors.push('API key is required');
        } else if (!config.apiKey.startsWith('sk-') || config.apiKey.length < 20) {
            errors.push('API key format appears to be invalid');
        }

        if (!config.model || config.model.trim() === '') {
            errors.push('Model selection is required');
        }

        if (config.baseURL) {
            try {
                new URL(config.baseURL);
            } catch {
                errors.push('Base URL is not a valid URL');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Cleanup component
     */
    public dispose(): void {
        // Remove event listeners if needed
    }
}

// CSS styles for OpenAI configuration
export const openAIConfigStyles = `
.openai-config {
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
}

.openai-config h4 {
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

.api-key-section {
    display: flex;
    gap: 6px;
    align-items: center;
}

.api-key-section input {
    flex: 1;
}

.key-actions {
    display: flex;
    gap: 4px;
}

.key-button {
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

.key-button:hover:not(:disabled) {
    background-color: var(--vscode-button-secondaryHoverBackground);
}

.key-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
`;
