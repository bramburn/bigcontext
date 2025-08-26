/**
 * ChromaDBConfig Component
 * 
 * Handles ChromaDB-specific configuration including connection settings,
 * authentication, and health checking.
 */

import { setupActions, ChromaDBConfig } from '../stores/setupStore';

export class ChromaDBConfigComponent {
    private container: HTMLElement;
    private hostInput: HTMLInputElement | null = null;
    private portInput: HTMLInputElement | null = null;
    private sslCheckbox: HTMLInputElement | null = null;
    private authTokenInput: HTMLInputElement | null = null;
    private testButton: HTMLButtonElement | null = null;
    private statusElement: HTMLElement | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the ChromaDB configuration UI
     */
    private render(): void {
        this.container.innerHTML = `
            <div class="chromadb-config">
                <h4>ChromaDB Configuration</h4>
                <p class="config-description">
                    Configure your ChromaDB connection settings. ChromaDB is an open-source vector database 
                    that can run locally or in the cloud.
                </p>

                <div class="config-grid">
                    <div class="config-item">
                        <label for="chromadb-host">Host:</label>
                        <input type="text" id="chromadb-host" value="localhost" placeholder="localhost">
                        <small>ChromaDB server hostname or IP address</small>
                    </div>

                    <div class="config-item">
                        <label for="chromadb-port">Port:</label>
                        <input type="number" id="chromadb-port" value="8000" placeholder="8000" min="1" max="65535">
                        <small>ChromaDB server port (default: 8000)</small>
                    </div>

                    <div class="config-item checkbox-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="chromadb-ssl">
                            <span class="checkmark"></span>
                            Use SSL/HTTPS
                        </label>
                        <small>Enable secure connection (recommended for production)</small>
                    </div>

                    <div class="config-item">
                        <label for="chromadb-auth-token">Authentication Token (Optional):</label>
                        <input type="password" id="chromadb-auth-token" placeholder="Enter auth token if required">
                        <small>Leave empty if authentication is not configured</small>
                    </div>
                </div>

                <div class="config-actions">
                    <button id="test-chromadb-connection" class="test-button">Test Connection</button>
                    <div id="chromadb-status" class="connection-status">
                        <span class="status-dot unknown"></span>
                        <span class="status-text">Not tested</span>
                    </div>
                </div>

                <div class="config-info">
                    <div class="info-section">
                        <h5>🐳 Docker Setup</h5>
                        <p>To run ChromaDB locally with Docker:</p>
                        <code>docker run -p 8000:8000 chromadb/chroma</code>
                    </div>
                    
                    <div class="info-section">
                        <h5>🔧 Manual Installation</h5>
                        <p>Install and run ChromaDB manually:</p>
                        <code>pip install chromadb && chroma run --host 0.0.0.0 --port 8000</code>
                    </div>
                </div>
            </div>
        `;

        // Get references to elements
        this.hostInput = this.container.querySelector('#chromadb-host') as HTMLInputElement;
        this.portInput = this.container.querySelector('#chromadb-port') as HTMLInputElement;
        this.sslCheckbox = this.container.querySelector('#chromadb-ssl') as HTMLInputElement;
        this.authTokenInput = this.container.querySelector('#chromadb-auth-token') as HTMLInputElement;
        this.testButton = this.container.querySelector('#test-chromadb-connection') as HTMLButtonElement;
        this.statusElement = this.container.querySelector('#chromadb-status') as HTMLElement;
    }

    /**
     * Set up event listeners
     */
    private setupEventListeners(): void {
        // Update configuration when inputs change
        [this.hostInput, this.portInput, this.sslCheckbox, this.authTokenInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.updateConfiguration());
                input.addEventListener('change', () => this.updateConfiguration());
            }
        });

        // Test connection button
        if (this.testButton) {
            this.testButton.addEventListener('click', () => this.testConnection());
        }
    }

    /**
     * Update configuration in store
     */
    private updateConfiguration(): void {
        if (!this.hostInput || !this.portInput || !this.sslCheckbox || !this.authTokenInput) return;

        const config: ChromaDBConfig = {
            host: this.hostInput.value || 'localhost',
            port: parseInt(this.portInput.value) || 8000,
            ssl: this.sslCheckbox.checked,
            authToken: this.authTokenInput.value || undefined
        };

        setupActions.setDatabaseConfig(config);
    }

    /**
     * Test ChromaDB connection
     */
    private async testConnection(): Promise<void> {
        if (!this.testButton || !this.statusElement) return;

        // Update UI to show testing state
        this.testButton.disabled = true;
        this.testButton.textContent = 'Testing...';
        this.updateStatus('testing', 'Testing connection...');

        try {
            const config = this.getConfiguration();
            const protocol = config.ssl ? 'https' : 'http';
            const url = `${protocol}://${config.host}:${config.port}/api/v1/heartbeat`;

            // Add auth header if token is provided
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            
            if (config.authToken) {
                headers['Authorization'] = `Bearer ${config.authToken}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (response.ok) {
                const data = await response.json();
                if (data && typeof data === 'object') {
                    this.updateStatus('success', 'Connection successful!');
                    setupActions.updateDatabaseStatus('running');
                } else {
                    this.updateStatus('error', 'Invalid response from ChromaDB');
                }
            } else {
                this.updateStatus('error', `Connection failed: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            console.error('ChromaDB connection test failed:', error);
            
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    this.updateStatus('error', 'Connection timeout - check host and port');
                } else if (error.message.includes('Failed to fetch')) {
                    this.updateStatus('error', 'Cannot reach ChromaDB - check if it\'s running');
                } else {
                    this.updateStatus('error', `Connection error: ${error.message}`);
                }
            } else {
                this.updateStatus('error', 'Unknown connection error');
            }
        } finally {
            // Reset button state
            this.testButton.disabled = false;
            this.testButton.textContent = 'Test Connection';
        }
    }

    /**
     * Update connection status display
     */
    private updateStatus(type: 'testing' | 'success' | 'error' | 'unknown', message: string): void {
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
    private getConfiguration(): ChromaDBConfig {
        return {
            host: this.hostInput?.value || 'localhost',
            port: parseInt(this.portInput?.value || '8000'),
            ssl: this.sslCheckbox?.checked || false,
            authToken: this.authTokenInput?.value || undefined
        };
    }

    /**
     * Load configuration from external source
     */
    public loadConfiguration(config: ChromaDBConfig): void {
        if (this.hostInput) this.hostInput.value = config.host;
        if (this.portInput) this.portInput.value = config.port.toString();
        if (this.sslCheckbox) this.sslCheckbox.checked = config.ssl;
        if (this.authTokenInput) this.authTokenInput.value = config.authToken || '';
        
        this.updateConfiguration();
    }

    /**
     * Validate configuration
     */
    public validateConfiguration(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const config = this.getConfiguration();

        if (!config.host || config.host.trim() === '') {
            errors.push('Host is required');
        }

        if (!config.port || config.port < 1 || config.port > 65535) {
            errors.push('Port must be between 1 and 65535');
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

// CSS styles for ChromaDB configuration
export const chromaDBConfigStyles = `
.chromadb-config {
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
}

.chromadb-config h4 {
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

.config-item input[type="text"],
.config-item input[type="number"],
.config-item input[type="password"] {
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

.checkbox-item {
    flex-direction: row;
    align-items: center;
    gap: 8px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
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
    margin-bottom: 12px;
}

.info-section h5 {
    margin: 0 0 6px 0;
    color: var(--vscode-textLink-foreground);
    font-size: 13px;
}

.info-section p {
    margin: 0 0 4px 0;
    color: var(--vscode-foreground);
    font-size: 12px;
}

.info-section code {
    display: block;
    padding: 6px 8px;
    background-color: var(--vscode-textCodeBlock-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 3px;
    font-family: var(--vscode-editor-font-family);
    font-size: 11px;
    color: var(--vscode-textPreformat-foreground);
    overflow-x: auto;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
`;
