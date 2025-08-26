/**
 * EmbeddingSetup Component
 * 
 * Handles embedding provider selection for the onboarding process.
 * Provides UI for selecting between different embedding providers (Ollama, OpenAI).
 */

import { setupStore, setupActions, SetupState, EmbeddingProvider } from '../stores/setupStore';
import { OllamaConfigComponent, ollamaConfigStyles } from './OllamaConfig';
import { OpenAIConfigComponent, openAIConfigStyles } from './OpenAIConfig';

export class EmbeddingSetup {
    private container: HTMLElement;
    private selectElement: HTMLSelectElement | null = null;
    private configSection: HTMLElement | null = null;
    private unsubscribe: (() => void) | null = null;

    // Provider-specific configuration components
    private ollamaConfig: OllamaConfigComponent | null = null;
    private openaiConfig: OpenAIConfigComponent | null = null;

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
        const embeddingProvider = provider as EmbeddingProvider | '';
        setupActions.selectProvider(embeddingProvider);
        this.updateProviderConfig(embeddingProvider);
    }

    /**
     * Update provider-specific configuration UI
     */
    private updateProviderConfig(provider: EmbeddingProvider | ''): void {
        if (!this.configSection) return;

        // Clean up existing configuration components
        this.cleanupConfigComponents();
        this.configSection.innerHTML = '';

        if (!provider) {
            this.configSection.classList.add('hidden');
            return;
        }

        this.configSection.classList.remove('hidden');

        // Inject styles for the configuration components
        this.injectConfigStyles();

        switch (provider) {
            case 'ollama':
                this.ollamaConfig = new OllamaConfigComponent(this.configSection);
                break;
            case 'openai':
                this.openaiConfig = new OpenAIConfigComponent(this.configSection);
                break;
        }
    }

    /**
     * Inject CSS styles for configuration components
     */
    private injectConfigStyles(): void {
        const styleId = 'embedding-config-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            ${ollamaConfigStyles}
            ${openAIConfigStyles}
        `;
        document.head.appendChild(style);
    }

    /**
     * Clean up configuration components
     */
    private cleanupConfigComponents(): void {
        if (this.ollamaConfig) {
            this.ollamaConfig.dispose();
            this.ollamaConfig = null;
        }
        if (this.openaiConfig) {
            this.openaiConfig.dispose();
            this.openaiConfig = null;
        }
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

        this.cleanupConfigComponents();
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
