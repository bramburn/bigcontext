<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { postMessage, onMessage } from '../vscodeApi';

    const dispatch = createEventDispatcher();

    // Props
    export let historyItems = [];
    export let maxItems = 20;

    // State
    let loading = false;
    let error = null;
    let searchTerm = '';
    let filteredItems = [];

    // Reactive filtering
    $: filteredItems = searchTerm 
        ? historyItems.filter(item => 
            item.query.toLowerCase().includes(searchTerm.toLowerCase())
          ).slice(0, maxItems)
        : historyItems.slice(0, maxItems);

    onMount(() => {
        // Request search history when component mounts
        loadHistory();

        // Listen for history updates
        const unsubscribe = onMessage('searchHistoryResponse', (message) => {
            historyItems = message.history || [];
            loading = false;
            error = null;
        });

        const unsubscribeAdded = onMessage('searchHistoryAdded', (message) => {
            if (message.success) {
                // Refresh history after adding new item
                loadHistory();
            }
        });

        const unsubscribeCleared = onMessage('searchHistoryCleared', (message) => {
            if (message.success) {
                historyItems = [];
                error = null;
            }
        });

        return () => {
            unsubscribe();
            unsubscribeAdded();
            unsubscribeCleared();
        };
    });

    function loadHistory() {
        loading = true;
        error = null;
        postMessage('getSearchHistory', { limit: 50 });
    }

    function handleRerun(query) {
        dispatch('rerun', { query });
    }

    function handleRemoveItem(itemId) {
        // For now, we'll just filter it out locally
        // In a full implementation, you'd send a message to remove it from storage
        historyItems = historyItems.filter(item => item.id !== itemId);
    }

    function clearAllHistory() {
        if (confirm('Are you sure you want to clear all search history? This action cannot be undone.')) {
            loading = true;
            postMessage('clearSearchHistory');
        }
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    function formatResultsCount(count) {
        if (count === 0) return 'No results';
        if (count === 1) return '1 result';
        return `${count} results`;
    }

    function getQueryPreview(query, maxLength = 60) {
        if (query.length <= maxLength) return query;
        return query.substring(0, maxLength) + '...';
    }
</script>

<div class="history-container">
    <div class="history-header">
        <h3 class="history-title">
            <span class="history-icon">🕒</span>
            Search History
        </h3>
        
        <div class="history-actions">
            <button 
                class="action-btn refresh-btn" 
                on:click={loadHistory}
                disabled={loading}
                title="Refresh history"
            >
                {loading ? '⟳' : '↻'}
            </button>
            
            {#if historyItems.length > 0}
                <button 
                    class="action-btn clear-btn" 
                    on:click={clearAllHistory}
                    title="Clear all history"
                >
                    🗑️
                </button>
            {/if}
        </div>
    </div>

    {#if historyItems.length > 5}
        <div class="search-filter">
            <input 
                type="text" 
                placeholder="Filter history..." 
                bind:value={searchTerm}
                class="filter-input"
            />
        </div>
    {/if}

    <div class="history-content">
        {#if loading}
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <span>Loading history...</span>
            </div>
        {:else if error}
            <div class="error-state">
                <span class="error-icon">⚠️</span>
                <span class="error-message">{error}</span>
                <button class="retry-btn" on:click={loadHistory}>Retry</button>
            </div>
        {:else if filteredItems.length === 0}
            <div class="empty-state">
                {#if searchTerm}
                    <span class="empty-icon">🔍</span>
                    <span class="empty-message">No history items match "{searchTerm}"</span>
                    <button class="clear-filter-btn" on:click={() => searchTerm = ''}>
                        Clear filter
                    </button>
                {:else}
                    <span class="empty-icon">📝</span>
                    <span class="empty-message">No search history yet</span>
                    <span class="empty-hint">Your search queries will appear here</span>
                {/if}
            </div>
        {:else}
            <div class="history-list">
                {#each filteredItems as item (item.id)}
                    <div class="history-item" on:click={() => handleRerun(item.query)}>
                        <div class="item-content">
                            <div class="item-header">
                                <span class="query-text" title={item.query}>
                                    {getQueryPreview(item.query)}
                                </span>
                                <button 
                                    class="remove-btn" 
                                    on:click|stopPropagation={() => handleRemoveItem(item.id)}
                                    title="Remove from history"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div class="item-meta">
                                <span class="results-count">
                                    {formatResultsCount(item.resultsCount)}
                                </span>
                                
                                {#if item.resultFormat}
                                    <span class="format-badge {item.resultFormat}">
                                        {item.resultFormat.toUpperCase()}
                                    </span>
                                {/if}
                                
                                <span class="timestamp">
                                    {formatTimestamp(item.timestamp)}
                                </span>
                                
                                {#if item.executionTime}
                                    <span class="execution-time">
                                        {item.executionTime}ms
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
            
            {#if historyItems.length > maxItems}
                <div class="history-footer">
                    <span class="items-info">
                        Showing {Math.min(maxItems, filteredItems.length)} of {historyItems.length} items
                    </span>
                </div>
            {/if}
        {/if}
    </div>
</div>

<style>
    .history-container {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        overflow: hidden;
    }

    .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--vscode-titleBar-activeBackground);
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .history-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--vscode-titleBar-activeForeground);
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .history-icon {
        font-size: 16px;
    }

    .history-actions {
        display: flex;
        gap: 8px;
    }

    .action-btn {
        background: none;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        color: var(--vscode-foreground);
        cursor: pointer;
        font-size: 12px;
        padding: 4px 8px;
        transition: all 0.2s ease;
    }

    .action-btn:hover:not(:disabled) {
        background-color: var(--vscode-button-secondaryHoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .refresh-btn {
        animation: spin 1s linear infinite;
    }

    .refresh-btn:not(.loading) {
        animation: none;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .search-filter {
        padding: 12px 16px;
        border-bottom: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-sideBar-background);
    }

    .filter-input {
        width: 100%;
        background-color: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        color: var(--vscode-input-foreground);
        font-size: 13px;
        padding: 6px 8px;
    }

    .filter-input:focus {
        border-color: var(--vscode-focusBorder);
        outline: none;
    }

    .history-content {
        max-height: 400px;
        overflow-y: auto;
    }

    .loading-state, .error-state, .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        text-align: center;
        color: var(--vscode-descriptionForeground);
    }

    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--vscode-panel-border);
        border-top: 2px solid var(--vscode-progressBar-foreground);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 8px;
    }

    .error-icon, .empty-icon {
        font-size: 24px;
        margin-bottom: 8px;
    }

    .error-message, .empty-message {
        font-size: 13px;
        margin-bottom: 8px;
    }

    .empty-hint {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.7;
    }

    .retry-btn, .clear-filter-btn {
        background-color: var(--vscode-button-secondaryBackground);
        border: none;
        border-radius: 4px;
        color: var(--vscode-button-secondaryForeground);
        cursor: pointer;
        font-size: 11px;
        padding: 4px 8px;
        margin-top: 8px;
    }

    .history-list {
        padding: 8px 0;
    }

    .history-item {
        cursor: pointer;
        padding: 8px 16px;
        transition: background-color 0.2s ease;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .history-item:last-child {
        border-bottom: none;
    }

    .history-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .item-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
    }

    .query-text {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
        line-height: 1.3;
        word-break: break-word;
    }

    .remove-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        opacity: 0;
        padding: 0;
        transition: all 0.2s ease;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .history-item:hover .remove-btn {
        opacity: 1;
    }

    .remove-btn:hover {
        color: var(--vscode-errorForeground);
        background-color: var(--vscode-inputValidation-errorBackground);
        border-radius: 2px;
    }

    .item-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    .results-count {
        font-weight: 500;
    }

    .format-badge {
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: 3px;
        padding: 1px 4px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
    }

    .format-badge.json {
        background-color: var(--vscode-charts-blue);
    }

    .format-badge.xml {
        background-color: var(--vscode-charts-orange);
    }

    .timestamp {
        color: var(--vscode-descriptionForeground);
    }

    .execution-time {
        color: var(--vscode-charts-green);
        font-family: var(--vscode-editor-font-family);
    }

    .history-footer {
        padding: 8px 16px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-sideBar-background);
        text-align: center;
    }

    .items-info {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }
</style>
