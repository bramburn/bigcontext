<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {
        provideFluentDesignSystem,
        fluentButton,
        fluentProgressRing,
        fluentCard,
        fluentBadge
    } from '@fluentui/web-components';
    import { postMessage, onMessage } from '$lib/vscodeApi';
    import {
        indexingState,
        indexingActions,
        appActions
    } from '$lib/stores/appStore';
    
    // Register Fluent UI components
    provideFluentDesignSystem().register(
        fluentButton(),
        fluentProgressRing(),
        fluentCard(),
        fluentBadge()
    );

    // Component state
    let isIndexing = false;
    let indexingProgress = 0;
    let indexingMessage = 'Ready to start indexing...';
    let filesProcessed = 0;
    let totalFiles = 0;
    let currentFile = '';
    let indexingStats = {
        totalChunks: 0,
        processedChunks: 0,
        errors: 0,
        startTime: null as Date | null,
        estimatedTimeRemaining: ''
    };
    let errorMessage = '';
    let successMessage = '';

    // Message handlers
    let unsubscribeFunctions: (() => void)[] = [];

    onMount(() => {
        // Set up message listeners using the wrapper
        unsubscribeFunctions.push(
            onMessage('indexingStarted', () => {
                indexingActions.startIndexing();
                errorMessage = '';
                successMessage = '';
            }),
            onMessage('indexingProgress', (message) => {
                indexingActions.updateProgress(
                    message.percentage || 0,
                    message.message || 'Indexing in progress...',
                    message.filesProcessed,
                    message.totalFiles,
                    message.currentFile
                );
            }),
            onMessage('indexingCompleted', (message) => {
                indexingActions.completeIndexing(message.success ?? false, message.totalFiles);

                if (message.success) {
                    successMessage = `Indexing completed successfully! Processed ${message.totalFiles || 0} files.`;
                } else {
                    errorMessage = 'Indexing failed. Please check the logs and try again.';
                }
            }),
            onMessage('indexingStopped', () => {
                indexingActions.stopIndexing();
            }),
            onMessage('indexingStatus', (message) => {
                if (message.isIndexing) {
                    indexingActions.startIndexing();
                }
                indexingActions.updateProgress(
                    message.progress || 0,
                    message.message || 'Ready to start indexing...'
                );
            }),
            onMessage('error', (message) => {
                errorMessage = message.message;
                appActions.setError(message.message);
            })
        );

        // Request current indexing status
        postMessage('getIndexingStatus');
    });

    onDestroy(() => {
        // Clean up message listeners
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    });



    function startIndexing() {
        errorMessage = '';
        successMessage = '';
        
        postMessage('startIndexing');
    }

    function stopIndexing() {
        postMessage('stopIndexing');
    }

    function clearMessages() {
        errorMessage = '';
        successMessage = '';
    }

    function formatTime(seconds: number): string {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }

    function getElapsedTime(): string {
        if (!indexingStats.startTime) return '';
        const elapsed = (Date.now() - indexingStats.startTime.getTime()) / 1000;
        return formatTime(elapsed);
    }

    $: progressPercentage = Math.round(indexingProgress);
    $: fileProgressText = totalFiles > 0 ? `${filesProcessed} / ${totalFiles} files` : '';
</script>

<div class="indexing-view">
    <div class="indexing-header">
        <h1>Code Indexing</h1>
        <p>Monitor the progress of your codebase indexing process.</p>
    </div>

    <!-- Error/Success Messages -->
    {#if errorMessage}
        <div class="notification error">
            {errorMessage}
            <button class="notification-close" on:click={clearMessages}>×</button>
        </div>
    {/if}

    {#if successMessage}
        <div class="notification success">
            {successMessage}
            <button class="notification-close" on:click={clearMessages}>×</button>
        </div>
    {/if}

    <!-- Main Indexing Status -->
    <fluent-card class="indexing-status">
        <div class="status-header">
            <h2>Indexing Status</h2>
            <fluent-badge 
                appearance={isIndexing ? 'accent' : (successMessage ? 'success' : 'neutral')}
            >
                {isIndexing ? 'In Progress' : (successMessage ? 'Completed' : 'Ready')}
            </fluent-badge>
        </div>

        <div class="progress-section">
            <div class="progress-info">
                <span class="progress-label">{indexingMessage}</span>
                <span class="progress-percentage">{progressPercentage}%</span>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: {progressPercentage}%"></div>
            </div>

            {#if fileProgressText}
                <div class="file-progress">
                    {fileProgressText}
                </div>
            {/if}

            {#if currentFile}
                <div class="current-file">
                    Processing: <code>{currentFile}</code>
                </div>
            {/if}
        </div>

        <div class="action-section">
            {#if isIndexing}
                <fluent-button
                    appearance="accent"
                    on:click={stopIndexing}
                    role="button"
                    tabindex="0"
                    on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && stopIndexing()}
                >
                    Stop Indexing
                </fluent-button>
            {:else}
                <fluent-button
                    appearance="accent"
                    on:click={startIndexing}
                    role="button"
                    tabindex="0"
                    on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && startIndexing()}
                >
                    <span class="button-icon">🚀</span>
                    Start Indexing
                </fluent-button>
            {/if}
        </div>
    </fluent-card>

    <!-- Indexing Statistics -->
    {#if isIndexing || indexingStats.totalChunks > 0}
        <fluent-card class="indexing-stats">
            <h3>Statistics</h3>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Files Processed</span>
                    <span class="stat-value">{filesProcessed}</span>
                </div>
                
                <div class="stat-item">
                    <span class="stat-label">Total Files</span>
                    <span class="stat-value">{totalFiles}</span>
                </div>
                
                <div class="stat-item">
                    <span class="stat-label">Chunks Created</span>
                    <span class="stat-value">{indexingStats.processedChunks}</span>
                </div>
                
                <div class="stat-item">
                    <span class="stat-label">Errors</span>
                    <span class="stat-value" class:error={indexingStats.errors > 0}>
                        {indexingStats.errors}
                    </span>
                </div>
                
                {#if indexingStats.startTime}
                    <div class="stat-item">
                        <span class="stat-label">Elapsed Time</span>
                        <span class="stat-value">{getElapsedTime()}</span>
                    </div>
                {/if}
                
                {#if indexingStats.estimatedTimeRemaining}
                    <div class="stat-item">
                        <span class="stat-label">Est. Remaining</span>
                        <span class="stat-value">{indexingStats.estimatedTimeRemaining}</span>
                    </div>
                {/if}
            </div>
        </fluent-card>
    {/if}

    <!-- Progress Ring for Active Indexing -->
    {#if isIndexing}
        <div class="progress-ring-container">
            <fluent-progress-ring></fluent-progress-ring>
        </div>
    {/if}
</div>

<style>
    .indexing-view {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        font-family: var(--vscode-font-family);
    }

    .indexing-header {
        text-align: center;
        margin-bottom: 30px;
    }

    .indexing-header h1 {
        margin: 0 0 10px 0;
        color: var(--vscode-textLink-foreground);
        font-size: 28px;
    }

    .indexing-header p {
        margin: 0;
        color: var(--vscode-descriptionForeground);
        font-size: 16px;
    }

    .indexing-status {
        margin-bottom: 20px;
        padding: 20px;
    }

    .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .status-header h2 {
        margin: 0;
        color: var(--vscode-textLink-foreground);
    }

    .progress-section {
        margin-bottom: 20px;
    }

    .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .progress-label {
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .progress-percentage {
        color: var(--vscode-textLink-foreground);
        font-weight: bold;
    }

    .progress-bar {
        width: 100%;
        height: 12px;
        background-color: var(--vscode-progressBar-background);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 10px;
    }

    .progress-fill {
        height: 100%;
        background-color: var(--vscode-progressBar-foreground);
        transition: width 0.3s ease;
        border-radius: 6px;
    }

    .file-progress {
        font-size: 14px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 5px;
    }

    .current-file {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .current-file code {
        background-color: var(--vscode-textCodeBlock-background);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: var(--vscode-editor-font-family);
    }

    .action-section {
        text-align: center;
    }

    .button-icon {
        margin-right: 8px;
    }

    .indexing-stats {
        margin-bottom: 20px;
        padding: 20px;
    }

    .indexing-stats h3 {
        margin: 0 0 15px 0;
        color: var(--vscode-textLink-foreground);
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .stat-label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
        font-weight: 500;
    }

    .stat-value {
        font-size: 18px;
        font-weight: bold;
        color: var(--vscode-foreground);
    }

    .stat-value.error {
        color: var(--vscode-errorForeground);
    }

    .progress-ring-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
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

    .notification.success {
        background-color: var(--vscode-charts-green);
        color: white;
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
</style>
