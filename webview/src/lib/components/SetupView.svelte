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
        setupActions,
        indexingActions,
        appActions,
        isSetupComplete,
        canStartIndexing
    } from '$lib/stores/appStore';
    import ValidatedInput from './ValidatedInput.svelte';
    import ConnectionTester from './ConnectionTester.svelte';
    import { validators } from '$lib/utils/validation';
    import type { ValidationResult } from '$lib/utils/validation';
    
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

    // Validation state
    let databaseValidation: ValidationResult | null = null;
    let providerValidation: ValidationResult | null = null;
    let databaseConfigFields = {
        host: '',
        port: '',
        apiKey: '',
        environment: ''
    };
    let providerConfigFields = {
        apiKey: '',
        endpoint: '',
        model: ''
    };

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
        
        <ValidatedInput
            type="select"
            label="Vector Database"
            value={$setupState.selectedDatabase}
            required={true}
            placeholder="Select a database..."
            options={[
                { value: "qdrant", label: "Qdrant (Local/Docker)" },
                { value: "chromadb", label: "ChromaDB (Local/Docker)" },
                { value: "pinecone", label: "Pinecone (Cloud)" }
            ]}
            validator={(value) => validators.required(value, 'Database')}
            on:input={(e) => {
                setupActions.setSelectedDatabase(e.detail.value);
                errorMessage = '';
            }}
            on:validation={(e) => {
                databaseValidation = e.detail.result;
            }}
        />

        {#if $setupState.selectedDatabase}
            <!-- Database-specific configuration fields -->
            {#if $setupState.selectedDatabase === 'qdrant' || $setupState.selectedDatabase === 'chromadb'}
                <div class="config-fields">
                    <ValidatedInput
                        type="text"
                        label="Host"
                        value={databaseConfigFields.host}
                        placeholder="localhost"
                        validator={(value) => value ? validators.url(`http://${value}`, 'Host') : { isValid: true, errors: [], warnings: [], suggestions: ['Default localhost will be used'] }}
                        on:input={(e) => {
                            databaseConfigFields.host = e.detail.value;
                        }}
                    />

                    <ValidatedInput
                        type="number"
                        label="Port"
                        value={databaseConfigFields.port}
                        placeholder={$setupState.selectedDatabase === 'qdrant' ? '6333' : '8000'}
                        validator={(value) => value ? validators.port(value, 'Port') : { isValid: true, errors: [], warnings: [], suggestions: [`Default port ${$setupState.selectedDatabase === 'qdrant' ? '6333' : '8000'} will be used`] }}
                        on:input={(e) => {
                            databaseConfigFields.port = e.detail.value;
                        }}
                    />
                </div>
            {:else if $setupState.selectedDatabase === 'pinecone'}
                <div class="config-fields">
                    <ValidatedInput
                        type="password"
                        label="API Key"
                        value={databaseConfigFields.apiKey}
                        placeholder="Enter your Pinecone API key"
                        required={true}
                        validator={(value) => validators.apiKey(value, 'Pinecone API Key')}
                        on:input={(e) => {
                            databaseConfigFields.apiKey = e.detail.value;
                        }}
                    />

                    <ValidatedInput
                        type="text"
                        label="Environment"
                        value={databaseConfigFields.environment}
                        placeholder="us-west1-gcp"
                        required={true}
                        validator={(value) => validators.stringLength(value, 1, 50, 'Environment')}
                        on:input={(e) => {
                            databaseConfigFields.environment = e.detail.value;
                        }}
                    />
                </div>
            {/if}

            <!-- Connection Testing -->
            <ConnectionTester
                type="database"
                config={{
                    type: $setupState.selectedDatabase as 'qdrant' | 'chromadb' | 'pinecone',
                    host: databaseConfigFields.host || 'localhost',
                    port: databaseConfigFields.port ? parseInt(databaseConfigFields.port) : undefined,
                    apiKey: databaseConfigFields.apiKey,
                    environment: databaseConfigFields.environment
                }}
                disabled={$setupState.databaseStatus === 'starting'}
                showDetails={true}
                on:testComplete={(e) => {
                    if (e.detail.result.success) {
                        successMessage = 'Database connection test successful!';
                    } else {
                        errorMessage = `Database connection test failed: ${e.detail.result.message}`;
                    }
                }}
            />

            <div class="action-section">
                <fluent-button
                    appearance="accent"
                    disabled={$setupState.databaseStatus === 'starting' || $setupState.databaseStatus === 'ready'}
                    on:click={startDatabase}
                    role="button"
                    tabindex="0"
                    on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && startDatabase()}
                >
                    {#if $setupState.databaseStatus === 'starting'}
                        <fluent-progress-ring></fluent-progress-ring>
                        Starting...
                    {:else if $setupState.databaseStatus === 'ready'}
                        ✓ Database Ready
                    {:else}
                        Start {$setupState.selectedDatabase === 'pinecone' ? 'Validate' : 'Local'} {$setupState.selectedDatabase}
                    {/if}
                </fluent-button>
            </div>
        {/if}
    </fluent-card>

    <!-- Provider Setup -->
    <fluent-card class="setup-section">
        <h3>Embedding Provider Configuration</h3>
        <p>Choose your AI embedding provider for semantic code search.</p>
        
        <ValidatedInput
            type="select"
            label="Embedding Provider"
            value={$setupState.selectedProvider}
            required={true}
            placeholder="Select a provider..."
            options={[
                { value: "ollama", label: "Ollama (Local)" },
                { value: "openai", label: "OpenAI" },
                { value: "azure", label: "Azure OpenAI" }
            ]}
            validator={(value) => validators.required(value, 'Provider')}
            on:input={(e) => {
                setupActions.setSelectedProvider(e.detail.value);
                errorMessage = '';
            }}
            on:validation={(e) => {
                providerValidation = e.detail.result;
            }}
        />

        {#if $setupState.selectedProvider}
            <!-- Provider-specific configuration fields -->
            {#if $setupState.selectedProvider === 'openai'}
                <div class="config-fields">
                    <ValidatedInput
                        type="password"
                        label="OpenAI API Key"
                        value={providerConfigFields.apiKey}
                        placeholder="sk-..."
                        required={true}
                        validator={(value) => validators.apiKey(value, 'OpenAI API Key')}
                        on:input={(e) => {
                            providerConfigFields.apiKey = e.detail.value;
                        }}
                    />

                    <ValidatedInput
                        type="text"
                        label="Model (Optional)"
                        value={providerConfigFields.model}
                        placeholder="text-embedding-ada-002"
                        validator={(value) => value ? validators.stringLength(value, 1, 100, 'Model') : { isValid: true, errors: [], warnings: [], suggestions: [] }}
                        on:input={(e) => {
                            providerConfigFields.model = e.detail.value;
                        }}
                    />
                </div>
            {:else if $setupState.selectedProvider === 'azure'}
                <div class="config-fields">
                    <ValidatedInput
                        type="password"
                        label="Azure API Key"
                        value={providerConfigFields.apiKey}
                        placeholder="Enter your Azure API key"
                        required={true}
                        validator={(value) => validators.apiKey(value, 'Azure API Key')}
                        on:input={(e) => {
                            providerConfigFields.apiKey = e.detail.value;
                        }}
                    />

                    <ValidatedInput
                        type="url"
                        label="Azure Endpoint"
                        value={providerConfigFields.endpoint}
                        placeholder="https://your-resource.openai.azure.com/"
                        required={true}
                        validator={(value) => validators.url(value, 'Azure Endpoint')}
                        on:input={(e) => {
                            providerConfigFields.endpoint = e.detail.value;
                        }}
                    />
                </div>
            {:else if $setupState.selectedProvider === 'ollama'}
                <div class="config-fields">
                    <ValidatedInput
                        type="url"
                        label="Ollama Endpoint"
                        value={providerConfigFields.endpoint}
                        placeholder="http://localhost:11434"
                        validator={(value) => value ? validators.url(value, 'Ollama Endpoint') : { isValid: true, errors: [], warnings: [], suggestions: ['Default endpoint http://localhost:11434 will be used'] }}
                        on:input={(e) => {
                            providerConfigFields.endpoint = e.detail.value;
                        }}
                    />

                    <ValidatedInput
                        type="text"
                        label="Model (Optional)"
                        value={providerConfigFields.model}
                        placeholder="nomic-embed-text"
                        validator={(value) => value ? validators.stringLength(value, 1, 100, 'Model') : { isValid: true, errors: [], warnings: [], suggestions: [] }}
                        on:input={(e) => {
                            providerConfigFields.model = e.detail.value;
                        }}
                    />
                </div>
            {/if}

            <!-- Connection Testing -->
            <ConnectionTester
                type="provider"
                config={{
                    type: $setupState.selectedProvider as 'ollama' | 'openai' | 'azure',
                    apiKey: providerConfigFields.apiKey,
                    endpoint: providerConfigFields.endpoint,
                    model: providerConfigFields.model
                }}
                disabled={$setupState.providerStatus === 'starting'}
                showDetails={true}
                on:testComplete={(e) => {
                    if (e.detail.result.success) {
                        successMessage = 'Provider connection test successful!';
                    } else {
                        errorMessage = `Provider connection test failed: ${e.detail.result.message}`;
                    }
                }}
            />

            <div class="action-section">
                <fluent-button
                    appearance="accent"
                    disabled={$setupState.providerStatus === 'starting' || $setupState.providerStatus === 'ready'}
                    on:click={configureProvider}
                    role="button"
                    tabindex="0"
                    on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && configureProvider()}
                >
                    {#if $setupState.providerStatus === 'starting'}
                        <fluent-progress-ring></fluent-progress-ring>
                        Configuring...
                    {:else if $setupState.providerStatus === 'ready'}
                        ✓ Provider Ready
                    {:else}
                        Configure {$setupState.selectedProvider}
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
            disabled={!$canStartIndexing}
            on:click={startIndexing}
            role="button"
            tabindex="0"
            on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && startIndexing()}
        >
            {#if $indexingState.isIndexing}
                <fluent-progress-ring></fluent-progress-ring>
                Indexing...
            {:else}
                🚀 Index Now
            {/if}
        </fluent-button>
        
        <p class="action-help">
            {#if $isSetupComplete}
                Ready to index your codebase!
            {:else}
                Complete the configuration above to enable indexing.
            {/if}
        </p>
    </div>

    <!-- Indexing Progress -->
    {#if $indexingState.isIndexing}
        <fluent-card class="indexing-progress">
            <h3>Indexing in Progress</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: {$indexingState.progress}%"></div>
            </div>
            <p class="progress-text">{$indexingState.message}</p>
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

    .config-fields {
        margin: 20px 0;
        padding: 16px;
        background-color: var(--vscode-textCodeBlock-background);
        border-radius: 6px;
        border: 1px solid var(--vscode-panel-border);
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
