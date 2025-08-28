<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {
        provideFluentDesignSystem,
        fluentButton,
        fluentCard,
        fluentBadge,
        fluentProgressRing
    } from '@fluentui/web-components';
    import { postMessage, onMessage } from '$lib/vscodeApi';
    import { setupState, appActions } from '$lib/stores/appStore';
    import ConnectionTester from './ConnectionTester.svelte';
    import WorkspaceSelector from './WorkspaceSelector.svelte';
    
    // Register Fluent UI components
    provideFluentDesignSystem().register(
        fluentButton(),
        fluentCard(),
        fluentBadge(),
        fluentProgressRing()
    );

    // Local state for diagnostics
    let systemStatus = {
        database: 'unknown',
        provider: 'unknown',
        lastIndexed: null as Date | null,
        totalChunks: 0,
        lastError: null as string | null
    };

    // Index management state
    let indexInfo = {
        fileCount: 0,
        vectorCount: 0,
        collectionName: 'No collection found'
    };

    // Workspace management state
    let workspaceInfo = {
        current: null as string | null,
        total: 0,
        hasMultiple: false
    };

    let isTestingConnections = false;
    let isClearingIndex = false;
    let testResults = {
        database: null as any,
        provider: null as any
    };

    // Message handlers
    let unsubscribeFunctions: (() => void)[] = [];

    onMount(() => {
        // Set up message listeners
        unsubscribeFunctions.push(
            onMessage('systemStatus', (message) => {
                systemStatus = { ...systemStatus, ...message.data };
            }),
            onMessage('connectionTestResult', (message) => {
                if (message.data.type === 'database') {
                    testResults.database = message.data.result;
                } else if (message.data.type === 'provider') {
                    testResults.provider = message.data.result;
                }
                isTestingConnections = false;
            }),
            onMessage('getIndexInfoResponse', (message) => {
                if (message.success) {
                    indexInfo = { ...indexInfo, ...message.data };
                }
            }),
            onMessage('clearIndexResponse', (message) => {
                isClearingIndex = false;
                if (message.success) {
                    // Refresh index info after clearing
                    indexInfo = {
                        fileCount: 0,
                        vectorCount: 0,
                        collectionName: 'No collection found'
                    };
                    // Clear any previous errors since the operation was successful
                    appActions.clearError();
                } else {
                    appActions.setError(message.error || 'Failed to clear index');
                }
            }),
            onMessage('workspaceStatsResponse', (message) => {
                if (message.success) {
                    workspaceInfo = {
                        current: message.data.current,
                        total: message.data.total,
                        hasMultiple: message.data.total > 1
                    };
                }
            }),
            onMessage('workspaceChanged', (message) => {
                // Refresh workspace and index info when workspace changes
                if (message.data.workspace) {
                    workspaceInfo.current = message.data.workspace.name;
                    // Refresh index info for the new workspace
                    postMessage('getIndexInfo');
                }
            }),
            onMessage('error', (message) => {
                systemStatus.lastError = message.message;
                appActions.setError(message.message);
                isTestingConnections = false;
                isClearingIndex = false;
            })
        );

        // Request initial system status, index info, and workspace stats
        postMessage('getSystemStatus');
        postMessage('getIndexInfo');
        postMessage('getWorkspaceStats');
    });

    onDestroy(() => {
        // Clean up message listeners
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    });

    function openSettings() {
        postMessage('openSettings');
    }

    function testDatabaseConnection() {
        if (isTestingConnections) return;
        
        isTestingConnections = true;
        testResults.database = null;
        
        postMessage('testDatabaseConnection', {
            type: $setupState.selectedDatabase,
            config: {
                // Use current configuration from settings
                host: 'localhost', // This would come from actual settings
                port: $setupState.selectedDatabase === 'qdrant' ? 6333 : 8000
            }
        });
    }

    function testProviderConnection() {
        if (isTestingConnections) return;
        
        isTestingConnections = true;
        testResults.provider = null;
        
        postMessage('testProviderConnection', {
            type: $setupState.selectedProvider,
            config: {
                // Use current configuration from settings
                endpoint: $setupState.selectedProvider === 'ollama' ? 'http://localhost:11434' : undefined
            }
        });
    }

    function refreshStatus() {
        postMessage('getSystemStatus');
    }

    function clearError() {
        systemStatus.lastError = null;
        appActions.clearError();
    }

    function refreshIndexInfo() {
        postMessage('getIndexInfo');
    }

    function clearIndex() {
        if (isClearingIndex) return;

        // Confirm with user before clearing
        if (confirm('Are you sure you want to clear the entire index? This action cannot be undone.')) {
            isClearingIndex = true;
            postMessage('clearIndex');
        }
    }

    // Helper functions
    function getStatusBadgeAppearance(status: string) {
        switch (status) {
            case 'ready':
            case 'connected':
                return 'accent';
            case 'error':
            case 'disconnected':
                return 'important';
            case 'starting':
            case 'connecting':
                return 'neutral';
            default:
                return 'neutral';
        }
    }

    function formatDate(date: Date | null): string {
        if (!date) return 'Never';
        return date.toLocaleString();
    }

    // Helper function for keyboard event handling
    function handleKeyboardClick(event: KeyboardEvent, callback: () => void) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback();
        }
    }
</script>

<div class="diagnostics-view">
    <div class="diagnostics-header">
        <h1>Status & Diagnostics</h1>
        <p>Monitor system status, test connections, and access configuration settings.</p>

        <!-- Workspace Selection -->
        {#if workspaceInfo.hasMultiple}
            <WorkspaceSelector showLabel={true} compact={false} />
        {/if}

        <div class="header-actions">
            <fluent-button
                appearance="accent"
                on:click={openSettings}
                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, openSettings)}
                role="button"
                tabindex="0"
            >
                ⚙️ Edit Configuration
            </fluent-button>
            <fluent-button
                on:click={refreshStatus}
                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, refreshStatus)}
                role="button"
                tabindex="0"
            >
                🔄 Refresh Status
            </fluent-button>
        </div>
    </div>

    <!-- Error Display -->
    {#if systemStatus.lastError}
        <div class="error-banner">
            <div class="error-content">
                <strong>⚠️ Error:</strong> {systemStatus.lastError}
            </div>
            <fluent-button
                appearance="stealth"
                on:click={clearError}
                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, clearError)}
                role="button"
                tabindex="0"
            >×</fluent-button>
        </div>
    {/if}

    <!-- Current Configuration Display -->
    <fluent-card class="config-section">
        <h3>Current Configuration</h3>
        <div class="config-grid">
            <div class="config-item">
                <label for="database-value">Database:</label>
                <div class="config-value">
                    <span id="database-value">{$setupState.selectedDatabase || 'Not configured'}</span>
                    <fluent-badge appearance={getStatusBadgeAppearance($setupState.databaseStatus)}>
                        {$setupState.databaseStatus}
                    </fluent-badge>
                </div>
            </div>
            
            <div class="config-item">
                <label for="provider-value">Embedding Provider:</label>
                <div class="config-value">
                    <span id="provider-value">{$setupState.selectedProvider || 'Not configured'}</span>
                    <fluent-badge appearance={getStatusBadgeAppearance($setupState.providerStatus)}>
                        {$setupState.providerStatus}
                    </fluent-badge>
                </div>
            </div>
            
            <div class="config-item">
                <label for="last-indexed-value">Last Indexed:</label>
                <div class="config-value">
                    <span id="last-indexed-value">{formatDate(systemStatus.lastIndexed)}</span>
                </div>
            </div>
            
            <div class="config-item">
                <label for="total-chunks-value">Total Chunks:</label>
                <div class="config-value">
                    <span id="total-chunks-value">{systemStatus.totalChunks.toLocaleString()}</span>
                </div>
            </div>
        </div>
    </fluent-card>

    <!-- Index Management -->
    <fluent-card class="index-section">
        <h3>Index Management</h3>
        <p>Monitor and manage your workspace index.</p>

        {#if workspaceInfo.current}
            <div class="workspace-context">
                <span class="workspace-label">Current Workspace:</span>
                <span class="workspace-name">{workspaceInfo.current}</span>
                {#if workspaceInfo.hasMultiple}
                    <span class="workspace-count">({workspaceInfo.total} total)</span>
                {/if}
            </div>
        {/if}

        <div class="index-grid">
            <div class="index-item">
                <label for="file-count-value">Indexed Files:</label>
                <div class="index-value">
                    <span id="file-count-value">{indexInfo.fileCount.toLocaleString()}</span>
                </div>
            </div>

            <div class="index-item">
                <label for="vector-count-value">Total Vectors:</label>
                <div class="index-value">
                    <span id="vector-count-value">{indexInfo.vectorCount.toLocaleString()}</span>
                </div>
            </div>

            <div class="index-item">
                <label for="collection-name-value">Collection:</label>
                <div class="index-value">
                    <span id="collection-name-value">{indexInfo.collectionName}</span>
                </div>
            </div>
        </div>

        <div class="index-actions">
            <fluent-button
                appearance="outline"
                on:click={refreshIndexInfo}
                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, refreshIndexInfo)}
                role="button"
                tabindex="0"
            >
                🔄 Refresh Index Info
            </fluent-button>

            <fluent-button
                appearance="outline"
                disabled={isClearingIndex || indexInfo.vectorCount === 0}
                on:click={clearIndex}
                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, clearIndex)}
                role="button"
                tabindex="0"
                style="color: var(--vscode-errorForeground);"
            >
                {#if isClearingIndex}
                    <fluent-progress-ring></fluent-progress-ring>
                    Clearing...
                {:else}
                    🗑️ Clear Index
                {/if}
            </fluent-button>
        </div>
    </fluent-card>

    <!-- Connection Testing -->
    <fluent-card class="testing-section">
        <h3>Connection Testing</h3>
        <p>Test your database and embedding provider connections to ensure everything is working correctly.</p>
        
        <div class="test-grid">
            <!-- Database Connection Test -->
            <div class="test-item">
                <h4>Database Connection</h4>
                <div class="test-actions">
                    <fluent-button
                        appearance="outline"
                        disabled={isTestingConnections || !$setupState.selectedDatabase}
                        on:click={testDatabaseConnection}
                        on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, testDatabaseConnection)}
                        role="button"
                        tabindex="0"
                    >
                        {#if isTestingConnections && testResults.database === null}
                            <fluent-progress-ring></fluent-progress-ring>
                            Testing...
                        {:else}
                            🔍 Test Database
                        {/if}
                    </fluent-button>
                </div>
                
                {#if testResults.database}
                    <div class="test-result" class:success={testResults.database.success} class:error={!testResults.database.success}>
                        <strong>{testResults.database.success ? '✅ Success' : '❌ Failed'}:</strong>
                        {testResults.database.message}
                        {#if testResults.database.details}
                            <div class="test-details">{testResults.database.details}</div>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Provider Connection Test -->
            <div class="test-item">
                <h4>Embedding Provider</h4>
                <div class="test-actions">
                    <fluent-button
                        appearance="outline"
                        disabled={isTestingConnections || !$setupState.selectedProvider}
                        on:click={testProviderConnection}
                        on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, testProviderConnection)}
                        role="button"
                        tabindex="0"
                    >
                        {#if isTestingConnections && testResults.provider === null}
                            <fluent-progress-ring></fluent-progress-ring>
                            Testing...
                        {:else}
                            🔍 Test Provider
                        {/if}
                    </fluent-button>
                </div>
                
                {#if testResults.provider}
                    <div class="test-result" class:success={testResults.provider.success} class:error={!testResults.provider.success}>
                        <strong>{testResults.provider.success ? '✅ Success' : '❌ Failed'}:</strong>
                        {testResults.provider.message}
                        {#if testResults.provider.details}
                            <div class="test-details">{testResults.provider.details}</div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </fluent-card>

    <!-- Quick Actions -->
    <fluent-card class="actions-section">
        <h3>Quick Actions</h3>
        <div class="action-buttons">
            <fluent-button
                appearance="accent"
                on:click={openSettings}
                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, openSettings)}
                role="button"
                tabindex="0"
            >
                ⚙️ Open Settings
            </fluent-button>
            <fluent-button
                on:click={() => postMessage('openMainPanel')}
                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, () => postMessage('openMainPanel'))}
                role="button"
                tabindex="0"
            >
                🏠 Main Panel
            </fluent-button>
            <fluent-button
                on:click={() => postMessage('startIndexing')}
                disabled={!$setupState.isSetupComplete}
                on:keydown={(e: KeyboardEvent) => handleKeyboardClick(e, () => postMessage('startIndexing'))}
                role="button"
                tabindex="0"
            >
                🚀 Start Indexing
            </fluent-button>
        </div>
    </fluent-card>
</div>

<style>
    .diagnostics-view {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
        font-family: var(--vscode-font-family);
    }

    .diagnostics-header {
        text-align: center;
        margin-bottom: 30px;
    }

    .diagnostics-header h1 {
        margin: 0 0 10px 0;
        color: var(--vscode-textLink-foreground);
        font-size: 28px;
    }

    .diagnostics-header p {
        margin: 0 0 20px 0;
        color: var(--vscode-descriptionForeground);
        font-size: 16px;
    }

    .header-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
    }

    .error-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        margin-bottom: 20px;
        background-color: var(--vscode-inputValidation-errorBackground);
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        border-radius: 4px;
        color: var(--vscode-inputValidation-errorForeground);
    }

    .error-content {
        flex: 1;
    }

    .config-section, .index-section, .testing-section, .actions-section {
        margin-bottom: 20px;
        padding: 20px;
    }

    .config-section h3, .index-section h3, .testing-section h3, .actions-section h3 {
        margin: 0 0 15px 0;
        color: var(--vscode-textLink-foreground);
    }

    .config-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
    }

    .config-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .config-item label {
        font-weight: 600;
        color: var(--vscode-foreground);
        font-size: 14px;
    }

    .config-value {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .config-value span {
        color: var(--vscode-descriptionForeground);
    }

    .index-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    }

    .index-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .index-item label {
        font-weight: 600;
        color: var(--vscode-foreground);
        font-size: 14px;
    }

    .index-value {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .index-value span {
        color: var(--vscode-descriptionForeground);
        font-size: 16px;
        font-weight: 500;
    }

    .index-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-start;
    }

    .workspace-context {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 15px;
        padding: 8px 12px;
        background-color: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 4px;
        border-left: 3px solid var(--vscode-textLink-foreground);
    }

    .workspace-label {
        font-weight: 600;
        color: var(--vscode-foreground);
        font-size: 13px;
    }

    .workspace-name {
        color: var(--vscode-textLink-foreground);
        font-weight: 500;
        font-size: 13px;
    }

    .workspace-count {
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        font-style: italic;
    }

    .test-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }

    .test-item {
        padding: 15px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        background-color: var(--vscode-textCodeBlock-background);
    }

    .test-item h4 {
        margin: 0 0 10px 0;
        color: var(--vscode-foreground);
    }

    .test-actions {
        margin-bottom: 15px;
    }

    .test-result {
        padding: 10px;
        border-radius: 4px;
        font-size: 14px;
    }

    .test-result.success {
        background-color: var(--vscode-charts-green);
        color: white;
    }

    .test-result.error {
        background-color: var(--vscode-inputValidation-errorBackground);
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        color: var(--vscode-inputValidation-errorForeground);
    }

    .test-details {
        margin-top: 5px;
        font-size: 12px;
        opacity: 0.9;
    }

    .action-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    @media (max-width: 600px) {
        .config-grid {
            grid-template-columns: 1fr;
        }
        
        .test-grid {
            grid-template-columns: 1fr;
        }
        
        .header-actions, .action-buttons {
            flex-direction: column;
            align-items: center;
        }
    }
</style>
