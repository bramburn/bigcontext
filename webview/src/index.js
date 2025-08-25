"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./styles.css");
const web_components_1 = require("@fluentui/web-components");
// Register Fluent UI components
(0, web_components_1.provideFluentDesignSystem)()
    .register((0, web_components_1.fluentButton)(), (0, web_components_1.fluentTextField)(), (0, web_components_1.fluentProgressRing)());
class CodeContextWebview {
    constructor() {
        this.vscode = acquireVsCodeApi();
        this.initializeElements();
        this.setupEventListeners();
        this.setupMessageListener();
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
        this.settingsButton?.addEventListener('click', () => {
            this.openSettings();
        });
    }
    setupMessageListener() {
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'indexingProgress':
                    this.updateIndexingProgress(message.progress, message.message);
                    break;
                case 'indexingComplete':
                    this.indexingComplete();
                    break;
                case 'searchResults':
                    this.displaySearchResults(message.results);
                    break;
            }
        });
    }
    startIndexing() {
        this.vscode.postMessage({
            command: 'startIndexing'
        });
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
    indexingComplete() {
        if (this.progressText) {
            this.progressText.textContent = 'Indexing complete!';
        }
        if (this.indexButton) {
            this.indexButton.disabled = false;
        }
        // Hide progress section after a delay
        setTimeout(() => {
            this.progressSection?.classList.remove('visible');
        }, 2000);
    }
    performSearch() {
        const searchTerm = this.searchInput?.value;
        if (!searchTerm)
            return;
        this.vscode.postMessage({
            command: 'search',
            query: searchTerm
        });
        // Show loading state
        if (this.searchResults) {
            this.searchResults.innerHTML = '<p>Searching...</p>';
        }
    }
    displaySearchResults(results) {
        if (!this.searchResults)
            return;
        if (results.length === 0) {
            this.searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }
        const resultsHtml = results.map(result => `
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 4px;">
                <h4>${result.file}</h4>
                <p>${result.snippet}</p>
                <small>Line ${result.line}</small>
            </div>
        `).join('');
        this.searchResults.innerHTML = resultsHtml;
    }
    openSettings() {
        this.vscode.postMessage({
            command: 'openSettings'
        });
    }
}
// Initialize the webview when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeContextWebview();
});
//# sourceMappingURL=index.js.map