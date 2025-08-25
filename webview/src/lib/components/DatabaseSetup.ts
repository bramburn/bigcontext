/**
 * DatabaseSetup Component
 * 
 * Handles database selection and management for the onboarding process.
 * Provides UI for selecting database type, starting services, and monitoring status.
 */

import { setupStore, setupActions, SetupState } from '../stores/setupStore';
import { vscodeApi } from '../vscodeApi';

export class DatabaseSetup {
    private container: HTMLElement;
    private selectElement: HTMLSelectElement | null = null;
    private startButton: HTMLButtonElement | null = null;
    private statusElement: HTMLElement | null = null;
    private unsubscribe: (() => void) | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.subscribeToStore();
    }

    /**
     * Render the database setup UI
     */
    private render(): void {
        this.container.innerHTML = `
            <div class="database-setup">
                <h3>Database Configuration</h3>
                <p>Select and configure your vector database for code indexing.</p>
                
                <div class="form-group">
                    <label for="database-select">Vector Database:</label>
                    <select id="database-select" class="database-select">
                        <option value="">Select a database...</option>
                        <option value="qdrant">Qdrant (Recommended)</option>
                    </select>
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
        this.selectElement = this.container.querySelector('#database-select') as HTMLSelectElement;
        this.startButton = this.container.querySelector('#start-database-btn') as HTMLButtonElement;
        this.statusElement = this.container.querySelector('#database-status') as HTMLElement;
    }

    /**
     * Set up event listeners
     */
    private setupEventListeners(): void {
        if (this.selectElement) {
            this.selectElement.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
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
    private subscribeToStore(): void {
        this.unsubscribe = setupStore.subscribe((state) => {
            this.updateUI(state);
        });
    }

    /**
     * Handle database selection
     */
    private handleDatabaseSelection(database: string): void {
        setupActions.selectDatabase(database);
        
        // Enable start button if database is selected
        if (this.startButton) {
            this.startButton.disabled = !database;
        }
    }

    /**
     * Handle start database button click
     */
    private async handleStartDatabase(): Promise<void> {
        const state = setupStore.getState();
        
        if (!state.selectedDatabase) {
            setupActions.setError('Please select a database first');
            return;
        }

        try {
            // Update status to starting
            setupActions.updateDatabaseStatus('starting');
            setupActions.clearError();

            // Send message to extension to start database
            vscodeApi.postMessage({
                command: 'startDatabase',
                database: state.selectedDatabase
            });

            console.log('Database start command sent to extension');

        } catch (error) {
            console.error('Failed to start database:', error);
            setupActions.setError(`Failed to start database: ${error}`);
            setupActions.updateDatabaseStatus('error');
        }
    }

    /**
     * Update UI based on store state
     */
    private updateUI(state: SetupState): void {
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
    private updateStatusIndicator(status: SetupState['databaseStatus']): void {
        if (!this.statusElement) return;

        const statusDot = this.statusElement.querySelector('.status-dot');
        const statusText = this.statusElement.querySelector('.status-text');

        if (!statusDot || !statusText) return;

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
    public handleDatabaseStatusUpdate(status: SetupState['databaseStatus']): void {
        setupActions.updateDatabaseStatus(status);
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
export const databaseSetupStyles = `
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
