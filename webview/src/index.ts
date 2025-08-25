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

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.setupMessageListener();
        this.checkServiceStatus();
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
}

// Initialize the webview when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeContextWebview();
});
