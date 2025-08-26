<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {
        provideFluentDesignSystem,
        fluentButton,
        fluentTextField,
        fluentSelect,
        fluentOption,
        fluentProgressRing,
        fluentCard
    } from '@fluentui/web-components';
    import { postMessage, onMessage } from '$lib/vscodeApi';
    import {
        setupState,
        indexingState,
        appState,
        setupActions,
        indexingActions,
        appActions,
        isSetupComplete,
        canStartIndexing
    } from '$lib/stores/appStore';
    
    // Register Fluent UI components
    provideFluentDesignSystem().register(
        fluentButton(),
        fluentTextField(),
        fluentSelect(),
        fluentOption(),
        fluentProgressRing(),
        fluentCard()
    );

    // Local UI state (non-persistent)
    let errorMessage = '';
    let successMessage = '';

    // Message handlers
    let unsubscribeFunctions: (() => void)[] = [];

    onMount(() => {
        // Set up message listeners using the wrapper
        unsubscribeFunctions.push(
            onMessage('databaseStatus', (message) => {
                setupActions.setDatabaseStatus(message.status);
            }),
            onMessage('providerStatus', (message) => {
                setupActions.setProviderStatus(message.status);
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
                    successMessage = 'Indexing completed successfully!';
                } else {
                    errorMessage = 'Indexing failed. Please check the logs.';
                }
            }),
            onMessage('error', (message) => {
                errorMessage = message.message;
                appActions.setError(message.message);
            })
        );

        // Request initial status
        postMessage('getSetupStatus');
    });

    onDestroy(() => {
        // Clean up message listeners
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    });



    function handleDatabaseSelection(event: Event) {
        const target = event.target as HTMLSelectElement;
        setupActions.setSelectedDatabase(target.value);
        errorMessage = '';
    }

    function handleProviderSelection(event: Event) {
        const target = event.target as HTMLSelectElement;
        setupActions.setSelectedProvider(target.value);
        errorMessage = '';
    }

    function startDatabase() {
        const currentSetup = $setupState;
        if (!currentSetup.selectedDatabase) {
            errorMessage = 'Please select a database first';
            return;
        }

        setupActions.setDatabaseStatus('starting');
        errorMessage = '';

        postMessage('startDatabase', {
            database: currentSetup.selectedDatabase
        });
    }

    function configureProvider() {
        const currentSetup = $setupState;
        if (!currentSetup.selectedProvider) {
            errorMessage = 'Please select a provider first';
            return;
        }

        setupActions.setProviderStatus('starting');
        errorMessage = '';

        postMessage('configureProvider', {
            provider: currentSetup.selectedProvider
        });
    }

    function startIndexing() {
        const currentSetup = $setupState;
        if (!$canStartIndexing) {
            errorMessage = 'Please complete database and provider setup first';
            return;
        }

        indexingActions.startIndexing();
        errorMessage = '';

        postMessage('startIndexing', {
            configuration: {
                database: currentSetup.selectedDatabase,
                provider: currentSetup.selectedProvider
            }
        });
    }

    function clearMessages() {
        errorMessage = '';
        successMessage = '';
    }


</script>

<div class="setup-view">
    <div class="setup-header">
        <h1>Welcome to Code Context Engine</h1>
        <p>Let's get you set up! Configure your database and embedding provider to start indexing your code.</p>
    </div>

    <!-- Progress Steps -->
    <div class="setup-progress">
        <div class="progress-step" class:active={$setupState.databaseStatus === 'idle' || $setupState.databaseStatus === 'starting'} class:completed={$setupState.databaseStatus === 'ready'}>
            <div class="step-number">1</div>
            <div class="step-label">Database</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step" class:active={$setupState.providerStatus === 'idle' || $setupState.providerStatus === 'starting'} class:completed={$setupState.providerStatus === 'ready'}>
            <div class="step-number">2</div>
            <div class="step-label">Provider</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step" class:active={$isSetupComplete} class:completed={false}>
            <div class="step-number">3</div>
            <div class="step-label">Ready</div>
        </div>
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

    <!-- Database Setup -->
    <fluent-card class="setup-section">
        <h3>Database Configuration</h3>
        <p>Select and configure your vector database for code indexing.</p>
        
        <div class="form-group">
            <label for="database-select">Vector Database:</label>
            <fluent-select id="database-select" on:change={handleDatabaseSelection}>
                <fluent-option value="">Select a database...</fluent-option>
                <fluent-option value="qdrant">Qdrant (Local/Docker)</fluent-option>
                <fluent-option value="chromadb">ChromaDB (Local/Docker)</fluent-option>
                <fluent-option value="pinecone">Pinecone (Cloud)</fluent-option>
            </fluent-select>
        </div>

        {#if selectedDatabase}
            <div class="action-section">
                <fluent-button
                    appearance="accent"
                    disabled={databaseStatus === 'starting' || databaseStatus === 'ready'}
                    on:click={startDatabase}
                    role="button"
                    tabindex="0"
                    on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && startDatabase()}
                >
                    {#if databaseStatus === 'starting'}
                        <fluent-progress-ring></fluent-progress-ring>
                        Starting...
                    {:else if databaseStatus === 'ready'}
                        ✓ Database Ready
                    {:else}
                        Start {selectedDatabase === 'pinecone' ? 'Validate' : 'Local'} {selectedDatabase}
                    {/if}
                </fluent-button>
            </div>
        {/if}
    </fluent-card>

    <!-- Provider Setup -->
    <fluent-card class="setup-section">
        <h3>Embedding Provider Configuration</h3>
        <p>Choose your AI embedding provider for semantic code search.</p>
        
        <div class="form-group">
            <label for="provider-select">Embedding Provider:</label>
            <fluent-select id="provider-select" on:change={handleProviderSelection}>
                <fluent-option value="">Select a provider...</fluent-option>
                <fluent-option value="ollama">Ollama (Local)</fluent-option>
                <fluent-option value="openai">OpenAI</fluent-option>
                <fluent-option value="azure">Azure OpenAI</fluent-option>
            </fluent-select>
        </div>

        {#if selectedProvider}
            <div class="action-section">
                <fluent-button
                    appearance="accent"
                    disabled={providerStatus === 'starting' || providerStatus === 'ready'}
                    on:click={configureProvider}
                    role="button"
                    tabindex="0"
                    on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && configureProvider()}
                >
                    {#if providerStatus === 'starting'}
                        <fluent-progress-ring></fluent-progress-ring>
                        Configuring...
                    {:else if providerStatus === 'ready'}
                        ✓ Provider Ready
                    {:else}
                        Configure {selectedProvider}
                    {/if}
                </fluent-button>
            </div>
        {/if}
    </fluent-card>

    <!-- Indexing Section -->
    <div class="setup-actions">
        <fluent-button
            appearance="accent"
            size="large"
            disabled={!canStartIndexing}
            on:click={startIndexing}
            role="button"
            tabindex="0"
            on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && startIndexing()}
        >
            {#if isIndexing}
                <fluent-progress-ring></fluent-progress-ring>
                Indexing...
            {:else}
                🚀 Index Now
            {/if}
        </fluent-button>
        
        <p class="action-help">
            {#if isSetupComplete}
                Ready to index your codebase!
            {:else}
                Complete the configuration above to enable indexing.
            {/if}
        </p>
    </div>

    <!-- Indexing Progress -->
    {#if isIndexing}
        <fluent-card class="indexing-progress">
            <h3>Indexing in Progress</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: {indexingProgress}%"></div>
            </div>
            <p class="progress-text">{indexingMessage}</p>
        </fluent-card>
    {/if}
</div>

<style>
    .setup-view {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        font-family: var(--vscode-font-family);
    }

    .setup-header {
        text-align: center;
        margin-bottom: 30px;
    }

    .setup-header h1 {
        margin: 0 0 10px 0;
        color: var(--vscode-textLink-foreground);
        font-size: 28px;
    }

    .setup-header p {
        margin: 0;
        color: var(--vscode-descriptionForeground);
        font-size: 16px;
    }

    .setup-progress {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 40px;
        padding: 20px;
    }

    .progress-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .step-number {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 2px solid var(--vscode-panel-border);
        background-color: var(--vscode-sideBar-background);
        color: var(--vscode-descriptionForeground);
        transition: all 0.3s ease;
    }

    .progress-step.active .step-number {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
    }

    .progress-step.completed .step-number {
        background-color: var(--vscode-charts-green);
        color: white;
        border-color: var(--vscode-charts-green);
    }

    .step-label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
    }

    .progress-step.active .step-label {
        color: var(--vscode-foreground);
    }

    .progress-line {
        width: 60px;
        height: 2px;
        background-color: var(--vscode-panel-border);
        margin: 0 10px;
    }

    .setup-section {
        margin-bottom: 20px;
        padding: 20px;
    }

    .setup-section h3 {
        margin: 0 0 10px 0;
        color: var(--vscode-textLink-foreground);
    }

    .setup-section p {
        margin: 0 0 20px 0;
        color: var(--vscode-descriptionForeground);
    }

    .form-group {
        margin-bottom: 15px;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .action-section {
        margin-top: 15px;
    }

    .setup-actions {
        text-align: center;
        padding: 20px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        background-color: var(--vscode-sideBar-background);
        margin-bottom: 20px;
    }

    .action-help {
        margin: 10px 0 0 0;
        font-size: 14px;
        color: var(--vscode-descriptionForeground);
    }

    .indexing-progress {
        padding: 20px;
    }

    .indexing-progress h3 {
        margin: 0 0 15px 0;
        color: var(--vscode-textLink-foreground);
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background-color: var(--vscode-progressBar-background);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 10px;
    }

    .progress-fill {
        height: 100%;
        background-color: var(--vscode-progressBar-foreground);
        transition: width 0.3s ease;
    }

    .progress-text {
        margin: 0;
        font-size: 14px;
        color: var(--vscode-foreground);
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
