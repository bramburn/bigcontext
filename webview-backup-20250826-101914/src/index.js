"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./styles.css");
const web_components_1 = require("@fluentui/web-components");
const vscodeApi_1 = require("./lib/vscodeApi");
const SetupView_1 = require("./lib/views/SetupView");
// Register Fluent UI components
(0, web_components_1.provideFluentDesignSystem)()
    .register((0, web_components_1.fluentButton)(), (0, web_components_1.fluentTextField)(), (0, web_components_1.fluentProgressRing)(), (0, web_components_1.fluentCard)(), (0, web_components_1.fluentBadge)(), (0, web_components_1.fluentAccordion)(), (0, web_components_1.fluentAccordionItem)());
class CodeContextWebview {
    constructor() {
        this.currentQuery = '';
        this.isSetupMode = false;
        this.setupView = null;
        this.setupState = {
            databaseReady: false,
            providerSelected: false,
            selectedProvider: '',
            databaseType: 'qdrant'
        };
        this.initializeElements();
        this.setupEventListeners();
        this.setupMessageListener();
        this.checkWorkspaceSetup();
    }
    initializeElements() {
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
        this.pingButton = document.getElementById('ping-button');
        this.pingResult = document.getElementById('ping-result');
    }
    setupEventListeners() {
        this.indexButton?.addEventListener('click', () => {
            this.startIndexing();
        });
        this.searchButton?.addEventListener('click', () => {
            this.performSearch();
        });
        this.searchInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
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
        this.pingButton?.addEventListener('click', () => {
            this.sendPing();
        });
    }
    setupMessageListener() {
        // Listen for indexing progress updates
        vscodeApi_1.vscodeApi.onMessage('indexingProgress', (event) => {
            this.updateIndexingProgress(event.data.progress, event.data.message);
        });
        // Listen for indexing completion
        vscodeApi_1.vscodeApi.onMessage('indexingComplete', (event) => {
            this.indexingComplete(event.data.result);
        });
        // Listen for search results
        vscodeApi_1.vscodeApi.onMessage('searchResults', (event) => {
            this.displaySearchResults(event.data.results, event.data.error);
        });
        // Setup completion listener - switch to main UI when setup is done
        vscodeApi_1.vscodeApi.onMessage('setupComplete', () => {
            this.isSetupMode = false;
            this.showMainUI();
            this.checkServiceStatus();
        });
    }
    handleSetupStatusResponse(message) {
        // This method handles the response from checkSetupStatus
        // It's called by the vscodeApi when a response is received
        if (message.error) {
            console.error('Setup status check failed:', message.error);
            this.showMainUI();
            this.checkServiceStatus();
        }
    }
    startIndexing() {
        vscodeApi_1.vscodeApi.startIndexing();
        // Show progress section
        this.progressSection?.classList.add('visible');
        if (this.indexButton) {
            this.indexButton.disabled = true;
        }
    }
    updateIndexingProgress(progress, message) {
        if (this.progressText) {
            this.progressText.textContent = message;
        }
        // Update progress ring if needed
    }
    indexingComplete(result) {
        if (this.progressText) {
            if (result && result.success) {
                this.progressText.textContent = `Indexing complete! Processed ${result.processedFiles} files, created ${result.chunks.length} chunks.`;
            }
            else {
                this.progressText.textContent = 'Indexing complete!';
            }
        }
        if (this.indexButton) {
            this.indexButton.disabled = false;
        }
        // Hide progress section after a delay
        setTimeout(() => {
            this.progressSection?.classList.remove('visible');
        }, 3000);
        // Refresh service status
        this.checkServiceStatus();
    }
    async performSearch() {
        const searchTerm = this.searchInput?.value;
        if (!searchTerm)
            return;
        this.currentQuery = searchTerm;
        // Add to search history
        this.addToSearchHistory(searchTerm);
        // Show loading state
        if (this.searchResults) {
            this.searchResults.innerHTML = '<p>Searching...</p>';
        }
        try {
            // Perform search using the new API
            const results = await vscodeApi_1.vscodeApi.search(searchTerm);
            this.displaySearchResults(results);
            // Find related files
            const relatedFiles = await vscodeApi_1.vscodeApi.findRelatedFiles(searchTerm, undefined, 5, 0.6);
            this.displayRelatedFiles(relatedFiles);
        }
        catch (error) {
            this.displaySearchResults([], `Search failed: ${error}`);
        }
    }
    displaySearchResults(results, error) {
        if (!this.searchResults)
            return;
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
    openSettings() {
        vscodeApi_1.vscodeApi.openSettings();
    }
    async sendPing() {
        if (!this.pingResult)
            return;
        try {
            // Show loading state
            this.pingResult.style.display = 'block';
            this.pingResult.style.backgroundColor = 'var(--vscode-textCodeBlock-background)';
            this.pingResult.style.color = 'var(--vscode-foreground)';
            this.pingResult.textContent = 'Sending ping...';
            // Send ping and wait for response
            const response = await vscodeApi_1.vscodeApi.ping();
            // Show success response
            this.pingResult.style.backgroundColor = 'var(--vscode-testing-iconPassed)';
            this.pingResult.style.color = 'white';
            this.pingResult.textContent = `✓ Received pong! Response time: ${response.timestamp}`;
            // Hide after 3 seconds
            setTimeout(() => {
                if (this.pingResult) {
                    this.pingResult.style.display = 'none';
                }
            }, 3000);
        }
        catch (error) {
            // Show error response
            this.pingResult.style.backgroundColor = 'var(--vscode-testing-iconFailed)';
            this.pingResult.style.color = 'white';
            this.pingResult.textContent = `✗ Ping failed: ${error}`;
            // Hide after 5 seconds
            setTimeout(() => {
                if (this.pingResult) {
                    this.pingResult.style.display = 'none';
                }
            }, 5000);
        }
    }
    addToSearchHistory(query) {
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
    getSearchHistory() {
        try {
            const history = localStorage.getItem('searchHistory');
            return history ? JSON.parse(history) : [];
        }
        catch {
            return [];
        }
    }
    showSearchSuggestions() {
        if (!this.searchInput)
            return;
        const query = this.searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }
        const history = this.getSearchHistory();
        const suggestions = history.filter(item => item.toLowerCase().includes(query) && item.toLowerCase() !== query).slice(0, 5);
        if (suggestions.length > 0) {
            this.displaySuggestions(suggestions);
        }
        else {
            this.hideSuggestions();
        }
    }
    displaySuggestions(suggestions) {
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
                    this.searchInput.value = suggestion;
                    this.performSearch();
                    this.hideSuggestions();
                }
            });
            suggestionsContainer.appendChild(suggestionItem);
        });
        // Insert after search input
        this.searchInput?.parentNode?.insertBefore(suggestionsContainer, this.searchInput.nextSibling);
    }
    hideSuggestions() {
        const existing = document.getElementById('search-suggestions');
        if (existing) {
            existing.remove();
        }
    }
    displayRelatedFiles(relatedFiles) {
        if (!this.relatedFilesSection)
            return;
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
    async checkWorkspaceSetup() {
        try {
            // Check if workspace is configured
            const setupStatus = await vscodeApi_1.vscodeApi.checkSetupStatus();
            this.isSetupMode = !setupStatus.isConfigured;
            if (this.isSetupMode) {
                this.showSetupUI();
            }
            else {
                this.showMainUI();
                this.checkServiceStatus();
            }
        }
        catch (error) {
            console.error('Failed to check workspace setup:', error);
            // Default to main UI if check fails
            this.showMainUI();
            this.checkServiceStatus();
        }
    }
    async checkServiceStatus() {
        try {
            const status = await vscodeApi_1.vscodeApi.getServiceStatus();
            this.displayServiceStatus(status);
        }
        catch (error) {
            console.error('Failed to get service status:', error);
        }
    }
    displayServiceStatus(status) {
        if (!this.serviceStatus)
            return;
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
    async openFile(filePath, line) {
        try {
            // This would need to be implemented in the extension
            // For now, we can show file content in a modal or new section
            const content = await vscodeApi_1.vscodeApi.getFileContent(filePath, true);
            this.showFileContent(content, line);
        }
        catch (error) {
            console.error('Failed to open file:', error);
        }
    }
    showFileContent(content, line) {
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
    showSetupUI() {
        // Hide main UI elements
        const mainSections = document.querySelectorAll('.section');
        mainSections.forEach(section => {
            section.style.display = 'none';
        });
        // Show or create setup UI
        this.createSetupUI();
    }
    showMainUI() {
        // Show main UI elements
        const mainSections = document.querySelectorAll('.section');
        mainSections.forEach(section => {
            section.style.display = 'block';
        });
        // Hide setup UI if it exists
        const setupContainer = document.getElementById('setup-container');
        if (setupContainer) {
            setupContainer.style.display = 'none';
        }
    }
    createSetupUI() {
        // Check if setup UI already exists
        let setupContainer = document.getElementById('setup-container');
        if (!setupContainer) {
            setupContainer = document.createElement('div');
            setupContainer.id = 'setup-container';
            setupContainer.className = 'setup-container';
            // Insert setup UI at the beginning of the container
            const container = document.querySelector('.container');
            if (container) {
                container.insertBefore(setupContainer, container.firstChild);
            }
            // Create and initialize the SetupView
            this.setupView = new SetupView_1.SetupView(setupContainer);
        }
        else {
            setupContainer.style.display = 'block';
            // Reinitialize SetupView if needed
            if (!this.setupView) {
                this.setupView = new SetupView_1.SetupView(setupContainer);
            }
        }
    }
}
// Initialize the webview when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeContextWebview();
});
//# sourceMappingURL=index.js.map