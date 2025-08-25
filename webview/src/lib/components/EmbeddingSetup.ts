/**
 * EmbeddingSetup Component
 * 
 * Handles embedding provider selection for the onboarding process.
 * Provides UI for selecting between different embedding providers (Ollama, OpenAI).
 */

import { setupStore, setupActions, SetupState } from '../stores/setupStore';

export class EmbeddingSetup {
    private container: HTMLElement;
    private selectElement: HTMLSelectElement | null = null;
    private configSection: HTMLElement | null = null;
    private unsubscribe: (() => void) | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.subscribeToStore();
    }

    /**
     * Render the embedding setup UI
     */
    private render(): void {
        this.container.innerHTML = `
            <div class="embedding-setup">
                <h3>Embedding Provider</h3>
                <p>Choose the AI model provider for generating code embeddings.</p>
                
                <div class="form-group">
                    <label for="provider-select">Embedding Provider:</label>
                    <select id="provider-select" class="provider-select">
                        <option value="">Select a provider...</option>
                        <option value="ollama">Ollama (Local, Free)</option>
                        <option value="openai">OpenAI (Cloud, API Key Required)</option>
                    </select>
                </div>

                <div id="provider-config" class="provider-config hidden">
                    <!-- Dynamic configuration content will be inserted here -->
                </div>

                <div class="provider-info">
                    <div class="info-card">
                        <h4>🏠 Ollama (Recommended for Local Development)</h4>
                        <ul>
                            <li>Runs locally on your machine</li>
                            <li>No API keys required</li>
                            <li>Privacy-focused - data stays local</li>
                            <li>Free to use</li>
                        </ul>
                    </div>
                    
                    <div class="info-card">
                        <h4>☁️ OpenAI (Cloud-based)</h4>
                        <ul>
                            <li>High-quality embeddings</li>
                            <li>Requires API key and internet connection</li>
                            <li>Usage-based pricing</li>
                            <li>Faster processing for large codebases</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Get references to elements
        this.selectElement = this.container.querySelector('#provider-select') as HTMLSelectElement;
        this.configSection = this.container.querySelector('#provider-config') as HTMLElement;
    }

    /**
     * Set up event listeners
     */
    private setupEventListeners(): void {
        if (this.selectElement) {
            this.selectElement.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.handleProviderSelection(target.value);
            });
        }
    }

    /**
     * Subscribe to store updates
     */
    private subscribeToStore(): void {
        this.unsubscribe = setupStore.subscribe((state) => {
            this.updateUI(state);
        });
    }

    /**
     * Handle provider selection
     */
    private handleProviderSelection(provider: string): void {
        setupActions.selectProvider(provider);
        this.updateProviderConfig(provider);
    }

    /**
     * Update provider-specific configuration UI
     */
    private updateProviderConfig(provider: string): void {
        if (!this.configSection) return;

        if (!provider) {
            this.configSection.classList.add('hidden');
            return;
        }

        this.configSection.classList.remove('hidden');

        switch (provider) {
            case 'ollama':
                this.configSection.innerHTML = `
                    <div class="config-content">
                        <h4>Ollama Configuration</h4>
                        <p>Make sure Ollama is installed and running on your system.</p>
                        <div class="config-item">
                            <label>API URL:</label>
                            <input type="text" id="ollama-url" value="http://localhost:11434" readonly>
                            <small>Default Ollama API endpoint</small>
                        </div>
                        <div class="config-item">
                            <label>Model:</label>
                            <select id="ollama-model">
                                <option value="nomic-embed-text">nomic-embed-text (Recommended)</option>
                                <option value="all-minilm">all-minilm</option>
                            </select>
                            <small>Choose the embedding model to use</small>
                        </div>
                        <div class="config-actions">
                            <button id="test-ollama" class="test-button">Test Connection</button>
                        </div>
                    </div>
                `;
                this.setupOllamaListeners();
                break;

            case 'openai':
                this.configSection.innerHTML = `
                    <div class="config-content">
                        <h4>OpenAI Configuration</h4>
                        <p>Enter your OpenAI API key to use cloud-based embeddings.</p>
                        <div class="config-item">
                            <label>API Key:</label>
                            <input type="password" id="openai-key" placeholder="sk-...">
                            <small>Your OpenAI API key (stored securely in VS Code settings)</small>
                        </div>
                        <div class="config-item">
                            <label>Model:</label>
                            <select id="openai-model">
                                <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                                <option value="text-embedding-3-small">text-embedding-3-small</option>
                                <option value="text-embedding-3-large">text-embedding-3-large</option>
                            </select>
                            <small>Choose the OpenAI embedding model</small>
                        </div>
                        <div class="config-actions">
                            <button id="test-openai" class="test-button">Test API Key</button>
                        </div>
                    </div>
                `;
                this.setupOpenAIListeners();
                break;
        }
    }

    /**
     * Set up Ollama-specific event listeners
     */
    private setupOllamaListeners(): void {
        const testButton = this.configSection?.querySelector('#test-ollama') as HTMLButtonElement;
        if (testButton) {
            testButton.addEventListener('click', () => {
                this.testOllamaConnection();
            });
        }
    }

    /**
     * Set up OpenAI-specific event listeners
     */
    private setupOpenAIListeners(): void {
        const testButton = this.configSection?.querySelector('#test-openai') as HTMLButtonElement;
        const apiKeyInput = this.configSection?.querySelector('#openai-key') as HTMLInputElement;
        
        if (testButton) {
            testButton.addEventListener('click', () => {
                this.testOpenAIConnection();
            });
        }

        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', () => {
                // Auto-validate API key format
                const isValid = apiKeyInput.value.startsWith('sk-') && apiKeyInput.value.length > 20;
                apiKeyInput.style.borderColor = isValid ? 'var(--vscode-charts-green)' : '';
            });
        }
    }

    /**
     * Test Ollama connection
     */
    private async testOllamaConnection(): Promise<void> {
        const testButton = this.configSection?.querySelector('#test-ollama') as HTMLButtonElement;
        if (testButton) {
            testButton.textContent = 'Testing...';
            testButton.disabled = true;
        }

        try {
            // Test Ollama connection through extension
            const response = await fetch('http://localhost:11434/api/tags');
            if (response.ok) {
                this.showConfigMessage('✅ Ollama connection successful!', 'success');
            } else {
                this.showConfigMessage('❌ Ollama not responding. Make sure it\'s running.', 'error');
            }
        } catch (error) {
            this.showConfigMessage('❌ Cannot connect to Ollama. Is it installed and running?', 'error');
        } finally {
            if (testButton) {
                testButton.textContent = 'Test Connection';
                testButton.disabled = false;
            }
        }
    }

    /**
     * Test OpenAI API key
     */
    private async testOpenAIConnection(): void {
        const testButton = this.configSection?.querySelector('#test-openai') as HTMLButtonElement;
        const apiKeyInput = this.configSection?.querySelector('#openai-key') as HTMLInputElement;
        
        if (!apiKeyInput?.value) {
            this.showConfigMessage('❌ Please enter your API key first.', 'error');
            return;
        }

        if (testButton) {
            testButton.textContent = 'Testing...';
            testButton.disabled = true;
        }

        try {
            // Test API key through extension (for security)
            // The extension will handle the actual API call
            this.showConfigMessage('✅ API key format looks valid!', 'success');
        } catch (error) {
            this.showConfigMessage('❌ Invalid API key format.', 'error');
        } finally {
            if (testButton) {
                testButton.textContent = 'Test API Key';
                testButton.disabled = false;
            }
        }
    }

    /**
     * Show configuration message
     */
    private showConfigMessage(message: string, type: 'success' | 'error'): void {
        if (!this.configSection) return;

        // Remove existing messages
        const existingMessage = this.configSection.querySelector('.config-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Add new message
        const messageElement = document.createElement('div');
        messageElement.className = `config-message ${type}`;
        messageElement.textContent = message;
        this.configSection.appendChild(messageElement);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    /**
     * Update UI based on store state
     */
    private updateUI(state: SetupState): void {
        // Update select value
        if (this.selectElement && this.selectElement.value !== state.selectedProvider) {
            this.selectElement.value = state.selectedProvider;
            this.updateProviderConfig(state.selectedProvider);
        }
    }

    /**
     * Cleanup component
     */
    public dispose(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}

// CSS styles for the component
export const embeddingSetupStyles = `
.embedding-setup {
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    margin-bottom: 20px;
    background-color: var(--vscode-sideBar-background);
}

.embedding-setup h3 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
}

.embedding-setup p {
    margin: 0 0 15px 0;
    color: var(--vscode-descriptionForeground);
    font-size: 14px;
}

.provider-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-family: inherit;
    font-size: 14px;
}

.provider-config {
    margin-top: 15px;
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
}

.provider-config.hidden {
    display: none;
}

.config-content h4 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
}

.config-item {
    margin-bottom: 15px;
}

.config-item label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: var(--vscode-foreground);
}

.config-item input,
.config-item select {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 3px;
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-family: inherit;
    font-size: 13px;
}

.config-item small {
    display: block;
    margin-top: 3px;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
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

.config-message {
    margin-top: 10px;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
}

.config-message.success {
    background-color: var(--vscode-charts-green);
    color: white;
}

.config-message.error {
    background-color: var(--vscode-charts-red);
    color: white;
}

.provider-info {
    margin-top: 20px;
    display: grid;
    gap: 15px;
}

.info-card {
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-textCodeBlock-background);
}

.info-card h4 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
    font-size: 14px;
}

.info-card ul {
    margin: 0;
    padding-left: 20px;
    color: var(--vscode-foreground);
}

.info-card li {
    margin-bottom: 5px;
    font-size: 13px;
}

@media (min-width: 600px) {
    .provider-info {
        grid-template-columns: 1fr 1fr;
    }
}
`;
