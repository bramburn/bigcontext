import './styles.css';
import {
    provideFluentDesignSystem,
    fluentButton,
    fluentTextField,
    fluentProgressRing
} from '@fluentui/web-components';

// Register Fluent UI components
provideFluentDesignSystem()
    .register(
        fluentButton(),
        fluentTextField(),
        fluentProgressRing()
    );

// VS Code API interface
declare const acquireVsCodeApi: () => {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
};

class CodeContextWebview {
    private vscode: ReturnType<typeof acquireVsCodeApi>;
    private indexButton: HTMLElement | null;
    private progressSection: HTMLElement | null;
    private progressRing: HTMLElement | null;
    private progressText: HTMLElement | null;
    private searchButton: HTMLElement | null;
    private searchInput: HTMLElement | null;
    private searchResults: HTMLElement | null;
    private settingsButton: HTMLElement | null;

    constructor() {
        this.vscode = acquireVsCodeApi();
        this.initializeElements();
        this.setupEventListeners();
        this.setupMessageListener();
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

        this.settingsButton?.addEventListener('click', () => {
            this.openSettings();
        });
    }

    private setupMessageListener(): void {
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

    private startIndexing(): void {
        this.vscode.postMessage({
            command: 'startIndexing'
        });

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

    private indexingComplete(): void {
        if (this.progressText) {
            this.progressText.textContent = 'Indexing complete!';
        }
        if (this.indexButton) {
            (this.indexButton as any).disabled = false;
        }
        
        // Hide progress section after a delay
        setTimeout(() => {
            this.progressSection?.classList.remove('visible');
        }, 2000);
    }

    private performSearch(): void {
        const searchTerm = (this.searchInput as any)?.value;
        if (!searchTerm) return;

        this.vscode.postMessage({
            command: 'search',
            query: searchTerm
        });

        // Show loading state
        if (this.searchResults) {
            this.searchResults.innerHTML = '<p>Searching...</p>';
        }
    }

    private displaySearchResults(results: any[]): void {
        if (!this.searchResults) return;

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

    private openSettings(): void {
        this.vscode.postMessage({
            command: 'openSettings'
        });
    }
}

// Initialize the webview when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeContextWebview();
});
