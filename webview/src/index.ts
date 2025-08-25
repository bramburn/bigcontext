import './styles.css';
import {
    provideFluentDesignSystem,
    fluentButton,
    fluentTextField,
    fluentProgressRing,
    fluentCard,
    fluentBadge,
    fluentAccordion,
    fluentAccordionItem
} from '@fluentui/web-components';
import { vscodeApi, type SearchResult, type RelatedFile, type ServiceStatus } from './lib/vscodeApi';

// Setup state interface
interface SetupState {
    databaseReady: boolean;
    providerSelected: boolean;
    selectedProvider: string;
    databaseType: string;
}

// Register Fluent UI components
provideFluentDesignSystem()
    .register(
        fluentButton(),
        fluentTextField(),
        fluentProgressRing(),
        fluentCard(),
        fluentBadge(),
        fluentAccordion(),
        fluentAccordionItem()
    );

class CodeContextWebview {
    private indexButton: HTMLElement | null;
    private progressSection: HTMLElement | null;
    private progressRing: HTMLElement | null;
    private progressText: HTMLElement | null;
    private searchButton: HTMLElement | null;
    private searchInput: HTMLElement | null;
    private searchResults: HTMLElement | null;
    private settingsButton: HTMLElement | null;
    private serviceStatus: HTMLElement | null;
    private relatedFilesSection: HTMLElement | null;
    private currentQuery: string = '';
    private isSetupMode: boolean = false;
    private setupState: SetupState = {
        databaseReady: false,
        providerSelected: false,
        selectedProvider: '',
        databaseType: 'qdrant'
    };

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.setupMessageListener();
        this.checkWorkspaceSetup();
    }

    private initializeElements(): void {
        this.indexButton = document.getElementById('index-button');
        this.progressSection = document.getElementById('progress-section');
        this.progressRing = document.getElementById('progress-ring');
        this.progressText = document.getElementById('progress-text');
        this.searchButton = document.getElementById('search-button');
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        this.settingsButton = document.getElementById('settings-button');
        this.serviceStatus = document.getElementById('service-status');
        this.relatedFilesSection = document.getElementById('related-files');
    }

    private setupEventListeners(): void {
        this.indexButton?.addEventListener('click', () => {
            this.startIndexing();
        });

        this.searchButton?.addEventListener('click', () => {
            this.performSearch();
        });

        this.searchInput?.addEventListener('keypress', (event) => {
            if ((event as KeyboardEvent).key === 'Enter') {
                this.performSearch();
            }
        });

        // Add search suggestions
        this.searchInput?.addEventListener('input', () => {
            this.showSearchSuggestions();
        });

        this.settingsButton?.addEventListener('click', () => {
            this.openSettings();
        });
    }

    private setupMessageListener(): void {
        // Listen for indexing progress updates
        vscodeApi.onMessage('indexingProgress', (event) => {
            this.updateIndexingProgress(event.data.progress, event.data.message);
        });

        // Listen for indexing completion
        vscodeApi.onMessage('indexingComplete', (event) => {
            this.indexingComplete(event.data.result);
        });

        // Listen for search results
        vscodeApi.onMessage('searchResults', (event) => {
            this.displaySearchResults(event.data.results, event.data.error);
        });

        // Setup-specific message listeners
        vscodeApi.onMessage('databaseStarted', (event) => {
            this.updateSetupStatus('Database is starting...', 'info');
        });

        vscodeApi.onMessage('databaseStatus', (event) => {
            this.handleDatabaseStatusUpdate(event.data);
        });

        vscodeApi.onMessage('setupIndexingStarted', (event) => {
            this.updateSetupStatus('Configuration saved and indexing started!', 'success');
        });

        vscodeApi.onMessage('setupIndexingProgress', (event) => {
            this.updateSetupStatus(`Indexing: ${event.data.progress.message}`, 'info');
        });

        vscodeApi.onMessage('setupIndexingComplete', (event) => {
            this.updateSetupStatus('Setup and indexing completed successfully!', 'success');
            // Switch to main UI after successful setup
            setTimeout(() => {
                this.isSetupMode = false;
                this.showMainUI();
                this.checkServiceStatus();
            }, 2000);
        });

        vscodeApi.onMessage('setupIndexingError', (event) => {
            this.updateSetupStatus(event.data.error, 'error');
        });
    }

    private handleSetupStatusResponse(message: any): void {
        // This method handles the response from checkSetupStatus
        // It's called by the vscodeApi when a response is received
        if (message.error) {
            console.error('Setup status check failed:', message.error);
            this.showMainUI();
            this.checkServiceStatus();
        }
    }

    private startIndexing(): void {
        vscodeApi.startIndexing();

        // Show progress section
        this.progressSection?.classList.add('visible');
        if (this.indexButton) {
            (this.indexButton as any).disabled = true;
        }
    }

    private updateIndexingProgress(progress: number, message: string): void {
        if (this.progressText) {
            this.progressText.textContent = message;
        }
        // Update progress ring if needed
    }

    private indexingComplete(result?: any): void {
        if (this.progressText) {
            if (result && result.success) {
                this.progressText.textContent = `Indexing complete! Processed ${result.processedFiles} files, created ${result.chunks.length} chunks.`;
            } else {
                this.progressText.textContent = 'Indexing complete!';
            }
        }
        if (this.indexButton) {
            (this.indexButton as any).disabled = false;
        }

        // Hide progress section after a delay
        setTimeout(() => {
            this.progressSection?.classList.remove('visible');
        }, 3000);

        // Refresh service status
        this.checkServiceStatus();
    }

    private async performSearch(): Promise<void> {
        const searchTerm = (this.searchInput as any)?.value;
        if (!searchTerm) return;

        this.currentQuery = searchTerm;

        // Add to search history
        this.addToSearchHistory(searchTerm);

        // Show loading state
        if (this.searchResults) {
            this.searchResults.innerHTML = '<p>Searching...</p>';
        }

        try {
            // Perform search using the new API
            const results = await vscodeApi.search(searchTerm);
            this.displaySearchResults(results);

            // Find related files
            const relatedFiles = await vscodeApi.findRelatedFiles(searchTerm, undefined, 5, 0.6);
            this.displayRelatedFiles(relatedFiles);

        } catch (error) {
            this.displaySearchResults([], `Search failed: ${error}`);
        }
    }

    private displaySearchResults(results: SearchResult[], error?: string): void {
        if (!this.searchResults) return;

        if (error) {
            this.searchResults.innerHTML = `<p style="color: var(--vscode-errorForeground);">${error}</p>`;
            return;
        }

        if (results.length === 0) {
            this.searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }

        const resultsHtml = results.map(result => `
            <fluent-card style="margin-bottom: 15px; padding: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h4 style="margin: 0; color: var(--vscode-textLink-foreground);">${result.file}</h4>
                    ${result.score ? `<fluent-badge appearance="accent">${(result.score * 100).toFixed(1)}%</fluent-badge>` : ''}
                </div>
                ${result.type && result.name ? `<p style="margin: 4px 0; font-size: 0.9em; color: var(--vscode-descriptionForeground);"><strong>${result.type}:</strong> ${result.name}</p>` : ''}
                <p style="margin: 8px 0; font-family: var(--vscode-editor-font-family); background: var(--vscode-textCodeBlock-background); padding: 8px; border-radius: 4px; font-size: 0.9em;">${result.snippet}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small style="color: var(--vscode-descriptionForeground);">Line ${result.line}${result.language ? ` • ${result.language}` : ''}</small>
                    <fluent-button appearance="stealth" onclick="this.openFile('${result.file}', ${result.line})">Open</fluent-button>
                </div>
            </fluent-card>
        `).join('');

        this.searchResults.innerHTML = resultsHtml;
    }

    private openSettings(): void {
        vscodeApi.openSettings();
    }

    private addToSearchHistory(query: string): void {
        const history = this.getSearchHistory();

        // Remove if already exists to avoid duplicates
        const index = history.indexOf(query);
        if (index > -1) {
            history.splice(index, 1);
        }

        // Add to beginning
        history.unshift(query);

        // Keep only last 10 searches
        if (history.length > 10) {
            history.splice(10);
        }

        localStorage.setItem('searchHistory', JSON.stringify(history));
    }

    private getSearchHistory(): string[] {
        try {
            const history = localStorage.getItem('searchHistory');
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    }

    private showSearchSuggestions(): void {
        if (!this.searchInput) return;

        const query = (this.searchInput as any).value.trim().toLowerCase();
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }

        const history = this.getSearchHistory();
        const suggestions = history.filter(item =>
            item.toLowerCase().includes(query) && item.toLowerCase() !== query
        ).slice(0, 5);

        if (suggestions.length > 0) {
            this.displaySuggestions(suggestions);
        } else {
            this.hideSuggestions();
        }
    }

    private displaySuggestions(suggestions: string[]): void {
        // Remove existing suggestions
        this.hideSuggestions();

        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'search-suggestions';
        suggestionsContainer.className = 'search-suggestions';

        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = suggestion;
            suggestionItem.addEventListener('click', () => {
                if (this.searchInput) {
                    (this.searchInput as any).value = suggestion;
                    this.performSearch();
                    this.hideSuggestions();
                }
            });
            suggestionsContainer.appendChild(suggestionItem);
        });

        // Insert after search input
        this.searchInput?.parentNode?.insertBefore(suggestionsContainer, this.searchInput.nextSibling);
    }

    private hideSuggestions(): void {
        const existing = document.getElementById('search-suggestions');
        if (existing) {
            existing.remove();
        }
    }

    private displayRelatedFiles(relatedFiles: RelatedFile[]): void {
        if (!this.relatedFilesSection) return;

        if (relatedFiles.length === 0) {
            this.relatedFilesSection.innerHTML = '<p>No related files found.</p>';
            return;
        }

        const relatedHtml = relatedFiles.map(file => `
            <fluent-card style="margin-bottom: 10px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h5 style="margin: 0; color: var(--vscode-textLink-foreground);">${file.filePath}</h5>
                        <p style="margin: 4px 0; font-size: 0.85em; color: var(--vscode-descriptionForeground);">${file.reason}</p>
                        <small style="color: var(--vscode-descriptionForeground);">${file.chunkCount} chunks • ${(file.similarity * 100).toFixed(1)}% similarity${file.language ? ` • ${file.language}` : ''}</small>
                    </div>
                    <fluent-button appearance="stealth" onclick="this.openFile('${file.filePath}')">Open</fluent-button>
                </div>
            </fluent-card>
        `).join('');

        this.relatedFilesSection.innerHTML = `
            <h3>Related Files</h3>
            ${relatedHtml}
        `;
    }

    private async checkWorkspaceSetup(): Promise<void> {
        try {
            // Check if workspace is configured
            const setupStatus = await vscodeApi.checkSetupStatus();
            this.isSetupMode = !setupStatus.isConfigured;

            if (this.isSetupMode) {
                this.showSetupUI();
            } else {
                this.showMainUI();
                this.checkServiceStatus();
            }
        } catch (error) {
            console.error('Failed to check workspace setup:', error);
            // Default to main UI if check fails
            this.showMainUI();
            this.checkServiceStatus();
        }
    }

    private async checkServiceStatus(): Promise<void> {
        try {
            const status = await vscodeApi.getServiceStatus();
            this.displayServiceStatus(status);
        } catch (error) {
            console.error('Failed to get service status:', error);
        }
    }

    private displayServiceStatus(status: ServiceStatus): void {
        if (!this.serviceStatus) return;

        const qdrantStatus = status.qdrantConnected ?
            '<fluent-badge appearance="accent">Connected</fluent-badge>' :
            '<fluent-badge appearance="important">Disconnected</fluent-badge>';

        const embeddingStatus = status.embeddingProvider ?
            `<fluent-badge appearance="accent">${status.embeddingProvider}</fluent-badge>` :
            '<fluent-badge appearance="neutral">Not configured</fluent-badge>';

        const collectionStatus = status.collectionExists ?
            '<fluent-badge appearance="accent">Ready</fluent-badge>' :
            '<fluent-badge appearance="neutral">Not indexed</fluent-badge>';

        this.serviceStatus.innerHTML = `
            <div style="display: flex; gap: 15px; align-items: center; font-size: 0.9em;">
                <span>Database: ${qdrantStatus}</span>
                <span>Embeddings: ${embeddingStatus}</span>
                <span>Collection: ${collectionStatus}</span>
            </div>
        `;
    }

    private async openFile(filePath: string, line?: number): Promise<void> {
        try {
            // This would need to be implemented in the extension
            // For now, we can show file content in a modal or new section
            const content = await vscodeApi.getFileContent(filePath, true);
            this.showFileContent(content, line);
        } catch (error) {
            console.error('Failed to open file:', error);
        }
    }

    private showFileContent(content: any, line?: number): void {
        // Create a modal or new section to show file content
        // This is a simplified implementation
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 1000;
            display: flex; align-items: center; justify-content: center;
        `;

        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px; padding: 20px; max-width: 80%; max-height: 80%;
            overflow: auto; position: relative;
        `;

        contentDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3>${content.filePath}</h3>
                <fluent-button appearance="stealth" onclick="this.parentElement.parentElement.remove()">×</fluent-button>
            </div>
            <pre style="background: var(--vscode-textCodeBlock-background); padding: 15px; border-radius: 4px; overflow: auto; font-family: var(--vscode-editor-font-family); font-size: 0.9em;">${content.content}</pre>
            <div style="margin-top: 10px; font-size: 0.85em; color: var(--vscode-descriptionForeground);">
                Size: ${content.size} bytes • Modified: ${new Date(content.lastModified).toLocaleString()}
                ${content.language ? ` • Language: ${content.language}` : ''}
            </div>
        `;

        modal.appendChild(contentDiv);
        document.body.appendChild(modal);

        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    private showSetupUI(): void {
        // Hide main UI elements
        const mainSections = document.querySelectorAll('.section');
        mainSections.forEach(section => {
            (section as HTMLElement).style.display = 'none';
        });

        // Show or create setup UI
        this.createSetupUI();
    }

    private showMainUI(): void {
        // Show main UI elements
        const mainSections = document.querySelectorAll('.section');
        mainSections.forEach(section => {
            (section as HTMLElement).style.display = 'block';
        });

        // Hide setup UI if it exists
        const setupContainer = document.getElementById('setup-container');
        if (setupContainer) {
            setupContainer.style.display = 'none';
        }
    }

    private createSetupUI(): void {
        // Check if setup UI already exists
        let setupContainer = document.getElementById('setup-container');
        if (!setupContainer) {
            setupContainer = document.createElement('div');
            setupContainer.id = 'setup-container';
            setupContainer.className = 'setup-container';

            setupContainer.innerHTML = `
                <div class="setup-header">
                    <h1>Welcome to Code Context Engine!</h1>
                    <p>Let's set up your workspace for AI-powered code search and context discovery.</p>
                </div>

                <div class="setup-section">
                    <h2>Database Configuration</h2>
                    <div class="setup-item">
                        <label for="database-select">Vector Database:</label>
                        <fluent-text-field id="database-select" value="Qdrant" readonly></fluent-text-field>
                        <p class="setup-description">Qdrant is a high-performance vector database for storing code embeddings</p>
                    </div>

                    <div class="setup-item">
                        <label for="database-connection">Connection String:</label>
                        <fluent-text-field id="database-connection" value="http://localhost:6333" placeholder="http://localhost:6333"></fluent-text-field>
                    </div>

                    <div class="setup-controls">
                        <fluent-button id="start-database-btn" appearance="stealth">Start Local Qdrant</fluent-button>
                        <fluent-button id="check-database-btn" appearance="stealth">Check Status</fluent-button>
                        <span id="database-status" class="status-indicator">
                            <span class="status-dot status-unknown"></span>
                            <span>Status unknown</span>
                        </span>
                    </div>
                </div>

                <div class="setup-section">
                    <h2>Embedding Provider</h2>
                    <div class="setup-item">
                        <label for="provider-select">Provider:</label>
                        <select id="provider-select" class="setup-select">
                            <option value="">Select a provider...</option>
                            <option value="ollama">Ollama (Local)</option>
                            <option value="openai">OpenAI (Cloud)</option>
                        </select>
                        <p class="setup-description">Choose between local Ollama or cloud-based OpenAI for generating embeddings</p>
                    </div>

                    <div id="ollama-config" class="provider-config" style="display: none;">
                        <label for="ollama-model">Ollama Model:</label>
                        <select id="ollama-model" class="setup-select">
                            <option value="nomic-embed-text">nomic-embed-text (768 dimensions)</option>
                            <option value="all-minilm">all-minilm (384 dimensions)</option>
                            <option value="mxbai-embed-large">mxbai-embed-large (1024 dimensions)</option>
                        </select>
                    </div>

                    <div id="openai-config" class="provider-config" style="display: none;">
                        <label for="openai-key">OpenAI API Key:</label>
                        <fluent-text-field id="openai-key" type="password" placeholder="sk-..."></fluent-text-field>
                    </div>
                </div>

                <div class="setup-actions">
                    <fluent-button id="index-now-btn" appearance="accent" disabled>Index Now</fluent-button>
                    <p id="setup-status" class="setup-status"></p>
                </div>
            `;

            // Insert setup UI at the beginning of the container
            const container = document.querySelector('.container');
            if (container) {
                container.insertBefore(setupContainer, container.firstChild);
            }
        } else {
            setupContainer.style.display = 'block';
        }

        // Setup event listeners for setup UI
        this.setupSetupEventListeners();
    }

    private setupSetupEventListeners(): void {
        // Database controls
        const startDbBtn = document.getElementById('start-database-btn');
        const checkDbBtn = document.getElementById('check-database-btn');
        const providerSelect = document.getElementById('provider-select') as HTMLSelectElement;
        const indexNowBtn = document.getElementById('index-now-btn');

        startDbBtn?.addEventListener('click', () => this.startDatabase());
        checkDbBtn?.addEventListener('click', () => this.checkDatabaseStatus());
        providerSelect?.addEventListener('change', () => this.onProviderChange());
        indexNowBtn?.addEventListener('click', () => this.startSetupIndexing());
    }

    private startDatabase(): void {
        vscodeApi.postMessage({
            command: 'startDatabase',
            databaseType: this.setupState.databaseType
        });

        this.updateSetupStatus('Starting database...', 'info');
    }

    private checkDatabaseStatus(): void {
        vscodeApi.postMessage({
            command: 'checkDatabaseStatus',
            databaseType: this.setupState.databaseType
        });

        this.updateSetupStatus('Checking database status...', 'info');
    }

    private onProviderChange(): void {
        const providerSelect = document.getElementById('provider-select') as HTMLSelectElement;
        const selectedProvider = providerSelect.value;

        // Hide all provider configs
        document.querySelectorAll('.provider-config').forEach(config => {
            (config as HTMLElement).style.display = 'none';
        });

        // Show selected provider config
        if (selectedProvider === 'ollama') {
            const ollamaConfig = document.getElementById('ollama-config');
            if (ollamaConfig) ollamaConfig.style.display = 'block';
        } else if (selectedProvider === 'openai') {
            const openaiConfig = document.getElementById('openai-config');
            if (openaiConfig) openaiConfig.style.display = 'block';
        }

        // Update setup state
        this.setupState.selectedProvider = selectedProvider;
        this.setupState.providerSelected = selectedProvider !== '';
        this.updateIndexNowButton();
    }

    private updateIndexNowButton(): void {
        const indexNowBtn = document.getElementById('index-now-btn') as any;
        if (indexNowBtn) {
            indexNowBtn.disabled = !(this.setupState.databaseReady && this.setupState.providerSelected);
        }
    }

    private updateSetupStatus(message: string, type: 'info' | 'success' | 'error'): void {
        const statusElement = document.getElementById('setup-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `setup-status ${type}`;
        }
    }

    private startSetupIndexing(): void {
        const config = {
            databaseType: this.setupState.databaseType,
            databaseConnection: (document.getElementById('database-connection') as any)?.value || 'http://localhost:6333',
            embeddingProvider: this.setupState.selectedProvider,
            embeddingModel: this.getSelectedEmbeddingModel()
        };

        vscodeApi.postMessage({
            command: 'startSetupIndexing',
            config: config
        });

        this.updateSetupStatus('Starting indexing process...', 'info');
    }

    private getSelectedEmbeddingModel(): string {
        if (this.setupState.selectedProvider === 'ollama') {
            const modelSelect = document.getElementById('ollama-model') as HTMLSelectElement;
            return modelSelect?.value || 'nomic-embed-text';
        } else if (this.setupState.selectedProvider === 'openai') {
            return 'text-embedding-ada-002';
        }
        return '';
    }

    private handleDatabaseStatusUpdate(data: any): void {
        const statusElement = document.getElementById('database-status');
        if (statusElement) {
            const statusDot = statusElement.querySelector('.status-dot');
            const statusText = statusElement.querySelector('span:last-child');

            if (statusDot && statusText) {
                if (data.status === 'running') {
                    statusDot.className = 'status-dot status-running';
                    statusText.textContent = 'Running';
                    this.setupState.databaseReady = true;
                } else {
                    statusDot.className = 'status-dot status-stopped';
                    statusText.textContent = 'Stopped';
                    this.setupState.databaseReady = false;
                }

                this.updateIndexNowButton();
            }
        }
    }
}

// Initialize the webview when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeContextWebview();
});
