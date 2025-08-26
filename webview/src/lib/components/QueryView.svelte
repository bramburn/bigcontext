<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {
        provideFluentDesignSystem,
        fluentButton,
        fluentTextField,
        fluentCard,
        fluentBadge,
        fluentAccordion,
        fluentAccordionItem
    } from '@fluentui/web-components';
    import { postMessage, onMessage } from '$lib/vscodeApi';
    import {
        searchState,
        searchActions,
        appActions
    } from '$lib/stores/appStore';
    
    // Register Fluent UI components
    provideFluentDesignSystem().register(
        fluentButton(),
        fluentTextField(),
        fluentCard(),
        fluentBadge(),
        fluentAccordion(),
        fluentAccordionItem()
    );

    // Component state
    let searchQuery = '';
    let maxResults = 20; // Default max results
    let includeContent = false; // Default to not include file content
    let isSearching = false;
    let searchResults: SearchResult[] = [];
    let xmlResults = ''; // For XML formatted results
    let resultFormat: 'json' | 'xml' = 'json'; // Track result format
    let searchHistory: string[] = [];
    let errorMessage = '';
    let searchStats = {
        totalResults: 0,
        searchTime: 0,
        query: ''
    };

    interface SearchResult {
        id: string;
        file: string;
        content: string;
        score: number;
        lineNumber?: number;
        context?: string;
        relatedFiles?: RelatedFile[];
    }

    interface RelatedFile {
        file: string;
        score: number;
        reason: string;
    }

    // Message handlers
    let unsubscribeFunctions: (() => void)[] = [];

    onMount(() => {
        // Set up message listeners using the wrapper
        unsubscribeFunctions.push(
            onMessage('searchResults', (message) => {
                isSearching = false;
                resultFormat = message.format || 'json';

                if (resultFormat === 'xml') {
                    // Handle XML results
                    xmlResults = message.results || '';
                    searchResults = []; // Clear JSON results
                } else {
                    // Handle JSON results
                    searchResults = message.results || [];
                    xmlResults = ''; // Clear XML results
                }

                searchStats = {
                    totalResults: message.totalResults || 0,
                    searchTime: message.searchTime || 0,
                    query: message.query || ''
                };

                if ((resultFormat === 'json' && searchResults.length === 0) ||
                    (resultFormat === 'xml' && !xmlResults.trim())) {
                    if (searchQuery.trim()) {
                        errorMessage = 'No results found for your query.';
                    }
                }
            }),
            onMessage('searchHistory', (message) => {
                searchHistory = message.history || [];
            }),
            onMessage('searchError', (message) => {
                isSearching = false;
                errorMessage = message.message || 'Search failed. Please try again.';
            }),
            onMessage('error', (message) => {
                errorMessage = message.message;
            })
        );

        // Request search history
        postMessage('getSearchHistory');
    });

    onDestroy(() => {
        // Clean up message listeners
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    });



    function handleSearch() {
        if (!searchQuery.trim()) {
            errorMessage = 'Please enter a search query.';
            return;
        }

        isSearching = true;
        errorMessage = '';
        searchResults = [];

        postMessage('search', {
            query: searchQuery.trim(),
            maxResults: maxResults,
            includeContent: includeContent
        });
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }

    function selectHistoryItem(query: string) {
        searchQuery = query;
        handleSearch();
    }

    function openFile(filePath: string, lineNumber?: number) {
        postMessage('openFile', {
            file: filePath,
            line: lineNumber
        });
    }

    function clearMessages() {
        errorMessage = '';
    }

    function formatSearchTime(ms: number): string {
        if (ms < 1000) {
            return `${Math.round(ms)}ms`;
        } else {
            return `${(ms / 1000).toFixed(2)}s`;
        }
    }

    function getScoreColor(score: number): string {
        if (score >= 0.8) return 'var(--vscode-charts-green)';
        if (score >= 0.6) return 'var(--vscode-charts-yellow)';
        if (score >= 0.4) return 'var(--vscode-charts-orange)';
        return 'var(--vscode-charts-red)';
    }

    function truncateContent(content: string, maxLength: number = 200): string {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    }

    // Helper function for keyboard event handling
    function handleKeyboardClick(event: KeyboardEvent, callback: () => void) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback();
        }
    }
</script>

<div class="query-view">
    <div class="query-header">
        <h1>Code Search</h1>
        <p>Search through your indexed codebase using semantic similarity.</p>
    </div>

    <!-- Search Input -->
    <fluent-card class="search-section">
        <div class="search-input-container">
            <fluent-text-field
                placeholder="Enter your search query (e.g., 'function that handles user authentication')"
                value={searchQuery}
                on:input={(e: Event) => searchQuery = (e.target as HTMLInputElement).value}
                on:keypress={handleKeyPress}
                class="search-input"
                size="large"
                role="textbox"
                tabindex="0"
            ></fluent-text-field>

            <fluent-button
                appearance="accent"
                disabled={isSearching || !searchQuery.trim()}
                on:click={handleSearch}
                on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                class="search-button"
                role="button"
                tabindex="0"
            >
                {#if isSearching}
                    Searching...
                {:else}
                    🔍 Search
                {/if}
            </fluent-button>
        </div>

        <!-- Advanced Search Controls -->
        <div class="advanced-controls">
            <div class="control-group">
                <label for="max-results">Max Results:</label>
                <fluent-text-field
                    id="max-results"
                    type="number"
                    value={maxResults.toString()}
                    on:input={(e: Event) => maxResults = parseInt((e.target as HTMLInputElement).value) || 20}
                    min="1"
                    max="100"
                    class="number-input"
                    size="small"
                ></fluent-text-field>
            </div>

            <div class="control-group">
                <label for="include-content" class="checkbox-label">
                    <input
                        id="include-content"
                        type="checkbox"
                        bind:checked={includeContent}
                        class="checkbox-input"
                    />
                    <span class="checkbox-text">Include file content</span>
                </label>
            </div>
        </div>

        {#if searchStats.query && searchStats.totalResults > 0}
            <div class="search-stats">
                Found {searchStats.totalResults} results for "{searchStats.query}" 
                in {formatSearchTime(searchStats.searchTime)}
            </div>
        {/if}
    </fluent-card>

    <!-- Error Messages -->
    {#if errorMessage}
        <div class="notification error">
            {errorMessage}
            <button
                class="notification-close"
                on:click={clearMessages}
                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, clearMessages)}
                role="button"
                tabindex="0"
            >×</button>
        </div>
    {/if}

    <!-- Search History -->
    {#if searchHistory.length > 0 && !isSearching && searchResults.length === 0}
        <fluent-card class="search-history">
            <h3>Recent Searches</h3>
            <div class="history-items">
                {#each searchHistory.slice(0, 5) as historyItem}
                    <button
                        class="history-item"
                        on:click={() => selectHistoryItem(historyItem)}
                        on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, () => selectHistoryItem(historyItem))}
                        role="button"
                        tabindex="0"
                    >
                        {historyItem}
                    </button>
                {/each}
            </div>
        </fluent-card>
    {/if}

    <!-- Search Results (JSON Format) -->
    {#if resultFormat === 'json' && searchResults.length > 0}
        <div class="results-section">
            {#each searchResults as result}
                <fluent-card class="result-item">
                    <div class="result-header">
                        <div class="result-file">
                            <button
                                class="file-link"
                                on:click={() => openFile(result.file, result.lineNumber)}
                                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, () => openFile(result.file, result.lineNumber))}
                                role="button"
                                tabindex="0"
                            >
                                📄 {result.file}
                                {#if result.lineNumber}
                                    <span class="line-number">:{result.lineNumber}</span>
                                {/if}
                            </button>
                        </div>

                        <fluent-badge
                            style="background-color: {getScoreColor(result.score)}"
                        >
                            {Math.round(result.score * 100)}%
                        </fluent-badge>
                    </div>

                    <div class="result-content">
                        <pre><code>{truncateContent(result.content)}</code></pre>
                    </div>

                    {#if result.context}
                        <div class="result-context">
                            <strong>Context:</strong> {result.context}
                        </div>
                    {/if}

                    {#if result.relatedFiles && result.relatedFiles.length > 0}
                        <fluent-accordion class="related-files">
                            <fluent-accordion-item>
                                <span slot="heading">Related Files ({result.relatedFiles.length})</span>
                                <div class="related-files-list">
                                    {#each result.relatedFiles as relatedFile}
                                        <div class="related-file">
                                            <button
                                                class="file-link"
                                                on:click={() => openFile(relatedFile.file)}
                                                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, () => openFile(relatedFile.file))}
                                                role="button"
                                                tabindex="0"
                                            >
                                                📄 {relatedFile.file}
                                            </button>
                                            <span class="related-reason">{relatedFile.reason}</span>
                                            <fluent-badge>
                                                {Math.round(relatedFile.score * 100)}%
                                            </fluent-badge>
                                        </div>
                                    {/each}
                                </div>
                            </fluent-accordion-item>
                        </fluent-accordion>
                    {/if}
                </fluent-card>
            {/each}
        </div>
    {/if}

    <!-- Search Results (XML Format) -->
    {#if resultFormat === 'xml' && xmlResults}
        <div class="results-section">
            <fluent-card class="xml-results">
                <div class="xml-header">
                    <h3>📄 Search Results (XML Format)</h3>
                    <div class="xml-actions">
                        <fluent-button
                            appearance="outline"
                            on:click={() => navigator.clipboard.writeText(xmlResults)}
                            on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, () => navigator.clipboard.writeText(xmlResults))}
                            role="button"
                            tabindex="0"
                        >
                            📋 Copy XML
                        </fluent-button>
                    </div>
                </div>
                <div class="xml-content">
                    <pre><code>{xmlResults}</code></pre>
                </div>
            </fluent-card>
        </div>
    {/if}

    <!-- Loading State -->
    {#if isSearching}
        <fluent-card class="loading-state">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>Searching through your codebase...</p>
            </div>
        </fluent-card>
    {/if}

    <!-- Empty State -->
    {#if !isSearching && searchResults.length === 0 && !xmlResults && !searchQuery.trim() && searchHistory.length === 0}
        <fluent-card class="empty-state">
            <div class="empty-content">
                <div class="empty-icon">🔍</div>
                <h3>Ready to Search</h3>
                <p>Enter a search query above to find relevant code in your indexed codebase.</p>
                <div class="search-tips">
                    <h4>Search Tips:</h4>
                    <ul>
                        <li>Use natural language: "function that validates email"</li>
                        <li>Describe functionality: "code that handles file uploads"</li>
                        <li>Ask questions: "how to connect to database"</li>
                    </ul>
                </div>
            </div>
        </fluent-card>
    {/if}
</div>

<style>
    .query-view {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        font-family: var(--vscode-font-family);
    }

    .query-header {
        text-align: center;
        margin-bottom: 30px;
    }

    .query-header h1 {
        margin: 0 0 10px 0;
        color: var(--vscode-textLink-foreground);
        font-size: 28px;
    }

    .query-header p {
        margin: 0;
        color: var(--vscode-descriptionForeground);
        font-size: 16px;
    }

    .search-section {
        margin-bottom: 20px;
        padding: 20px;
    }

    .search-input-container {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
    }

    .search-input {
        flex: 1;
    }

    .search-button {
        min-width: 120px;
    }

    .search-stats {
        font-size: 14px;
        color: var(--vscode-descriptionForeground);
        text-align: center;
    }

    .search-history {
        margin-bottom: 20px;
        padding: 20px;
    }

    .search-history h3 {
        margin: 0 0 15px 0;
        color: var(--vscode-textLink-foreground);
    }

    .history-items {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }

    .history-item {
        padding: 8px 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        background-color: var(--vscode-sideBar-background);
        color: var(--vscode-foreground);
        cursor: pointer;
        font-family: inherit;
        font-size: 14px;
        transition: background-color 0.2s ease;
    }

    .history-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .results-section {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .result-item {
        padding: 20px;
    }

    .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .result-file {
        flex: 1;
    }

    .file-link {
        background: none;
        border: none;
        color: var(--vscode-textLink-foreground);
        cursor: pointer;
        font-family: inherit;
        font-size: 16px;
        font-weight: 500;
        text-decoration: underline;
        padding: 0;
    }

    .file-link:hover {
        color: var(--vscode-textLink-activeForeground);
    }

    .line-number {
        color: var(--vscode-descriptionForeground);
        font-weight: normal;
    }

    .result-content {
        margin-bottom: 15px;
    }

    .result-content pre {
        margin: 0;
        padding: 15px;
        background-color: var(--vscode-textCodeBlock-background);
        border-radius: 4px;
        overflow-x: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: 14px;
        line-height: 1.4;
    }

    .result-content code {
        color: var(--vscode-foreground);
    }

    .result-context {
        margin-bottom: 15px;
        padding: 10px;
        background-color: var(--vscode-sideBar-background);
        border-radius: 4px;
        font-size: 14px;
        color: var(--vscode-foreground);
    }

    .related-files {
        margin-top: 15px;
    }

    .related-files-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px 0;
    }

    .related-file {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        background-color: var(--vscode-sideBar-background);
        border-radius: 4px;
    }

    .related-reason {
        flex: 1;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .loading-state {
        padding: 40px;
        text-align: center;
    }

    .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
    }

    .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--vscode-panel-border);
        border-top: 3px solid var(--vscode-button-background);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .empty-state {
        padding: 40px;
        text-align: center;
    }

    .empty-content {
        max-width: 500px;
        margin: 0 auto;
    }

    .empty-icon {
        font-size: 48px;
        margin-bottom: 20px;
    }

    .empty-content h3 {
        margin: 0 0 10px 0;
        color: var(--vscode-textLink-foreground);
    }

    .empty-content p {
        margin: 0 0 20px 0;
        color: var(--vscode-descriptionForeground);
    }

    .search-tips {
        text-align: left;
        background-color: var(--vscode-sideBar-background);
        padding: 20px;
        border-radius: 6px;
    }

    .search-tips h4 {
        margin: 0 0 10px 0;
        color: var(--vscode-textLink-foreground);
    }

    .search-tips ul {
        margin: 0;
        padding-left: 20px;
        color: var(--vscode-foreground);
    }

    .search-tips li {
        margin-bottom: 5px;
    }

    .notification {
        padding: 12px 16px;
        border-radius: 4px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .notification.error {
        background-color: var(--vscode-inputValidation-errorBackground);
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        color: var(--vscode-inputValidation-errorForeground);
    }

    .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
    }

    /* Advanced Controls Styles */
    .advanced-controls {
        display: flex;
        gap: 20px;
        align-items: center;
        margin-top: 15px;
        padding: 15px;
        background-color: var(--vscode-sideBar-background);
        border-radius: 6px;
        border: 1px solid var(--vscode-panel-border);
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .control-group label {
        font-size: 14px;
        color: var(--vscode-foreground);
        font-weight: 500;
        white-space: nowrap;
    }

    .number-input {
        width: 80px;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
    }

    .checkbox-input {
        margin: 0;
        cursor: pointer;
    }

    .checkbox-text {
        font-size: 14px;
        color: var(--vscode-foreground);
        cursor: pointer;
    }

    @media (max-width: 600px) {
        .advanced-controls {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }
    }

    /* Sidebar-specific responsive styles */
    @media (max-width: 400px) {
        .query-container {
            padding: 8px;
        }

        .search-section {
            padding: 12px;
        }

        .advanced-controls {
            padding: 12px;
        }

        .control-group {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
        }

        .number-input {
            width: 100%;
            max-width: 120px;
        }

        .xml-actions {
            flex-direction: column;
            gap: 8px;
        }

        .xml-content {
            padding: 10px;
            max-height: 300px;
        }
    }

    @container (max-width: 350px) {
        .query-container {
            padding: 4px;
        }

        .search-section,
        .advanced-controls {
            padding: 8px;
        }

        .xml-content {
            padding: 8px;
            max-height: 250px;
        }
    }

    /* XML Results Styles */
    .xml-results {
        margin-bottom: 20px;
    }

    .xml-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .xml-header h3 {
        margin: 0;
        color: var(--vscode-textLink-foreground);
        font-size: 16px;
    }

    .xml-actions {
        display: flex;
        gap: 10px;
    }

    .xml-content {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 15px;
        overflow-x: auto;
        max-height: 500px;
        overflow-y: auto;
    }

    .xml-content pre {
        margin: 0;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        line-height: 1.4;
        color: var(--vscode-editor-foreground);
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .xml-content code {
        background: none;
        padding: 0;
        border: none;
        font-family: inherit;
        font-size: inherit;
        color: inherit;
    }
</style>
