<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { registerCoreComponents } from '$lib/utils/fluentUI';
    import { 
        testDatabaseConnection, 
        testProviderConnection,
        type ConnectionTestResult,
        type ConnectionTestStatus,
        type DatabaseTestConfig,
        type ProviderTestConfig
    } from '$lib/utils/connectionTesting';
    import ValidationMessage from './ValidationMessage.svelte';
    import { connectionTestToValidation } from '$lib/utils/connectionTesting';

    // Register Fluent UI components
    registerCoreComponents();

    // Props
    export let type: 'database' | 'provider';
    export let config: DatabaseTestConfig | ProviderTestConfig;
    export let disabled: boolean = false;
    export let autoTest: boolean = false;
    export let showDetails: boolean = true;
    export let compact: boolean = false;

    // State
    let status: ConnectionTestStatus = 'idle';
    let testResult: ConnectionTestResult | null = null;
    let lastTestedConfig: string = '';

    // Event dispatcher
    const dispatch = createEventDispatcher<{
        testStart: void;
        testComplete: { result: ConnectionTestResult };
        testError: { error: string };
    }>();

    // Reactive statements
    $: configString = JSON.stringify(config);
    $: hasConfigChanged = configString !== lastTestedConfig;
    $: canTest = !disabled && config && Object.keys(config).length > 0;
    $: showTestButton = status === 'idle' || status === 'success' || status === 'error';

    // Auto-test when config changes (if enabled)
    $: if (autoTest && hasConfigChanged && canTest && status === 'idle') {
        testConnection();
    }

    /**
     * Test the connection
     */
    async function testConnection(): Promise<void> {
        if (!canTest || status === 'testing') return;

        status = 'testing';
        testResult = null;
        dispatch('testStart');

        try {
            let result: ConnectionTestResult;
            
            if (type === 'database') {
                result = await testDatabaseConnection(config as DatabaseTestConfig);
            } else {
                result = await testProviderConnection(config as ProviderTestConfig);
            }

            testResult = result;
            status = result.success ? 'success' : 'error';
            lastTestedConfig = configString;
            
            dispatch('testComplete', { result });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            testResult = {
                success: false,
                message: `Connection test failed: ${errorMessage}`,
                details: 'Please check your configuration and try again'
            };
            status = 'error';
            
            dispatch('testError', { error: errorMessage });
        }
    }

    /**
     * Reset the test state
     */
    function resetTest(): void {
        status = 'idle';
        testResult = null;
        lastTestedConfig = '';
    }

    /**
     * Get status icon
     */
    function getStatusIcon(currentStatus: ConnectionTestStatus): string {
        switch (currentStatus) {
            case 'testing': return '🔄';
            case 'success': return '✅';
            case 'error': return '❌';
            default: return '🔗';
        }
    }

    /**
     * Get status message
     */
    function getStatusMessage(currentStatus: ConnectionTestStatus): string {
        switch (currentStatus) {
            case 'testing': return 'Testing connection...';
            case 'success': return 'Connection successful';
            case 'error': return 'Connection failed';
            default: return 'Ready to test';
        }
    }
</script>

<div class="connection-tester" class:compact>
    <div class="tester-header">
        <div class="status-indicator">
            <span class="status-icon">{getStatusIcon(status)}</span>
            <span class="status-text">{getStatusMessage(status)}</span>
        </div>

        {#if showTestButton}
            <fluent-button
                appearance={status === 'success' ? 'outline' : 'accent'}
                disabled={!canTest || disabled}
                on:click={testConnection}
                on:keydown={(e) => e.key === 'Enter' && testConnection()}
                size={compact ? 'small' : 'medium'}
                role="button"
                tabindex="0"
                aria-label="Test connection"
            >
                {#if hasConfigChanged && status !== 'idle'}
                    🔄 Retest
                {:else if status === 'success'}
                    ✓ Test Again
                {:else}
                    🔗 Test Connection
                {/if}
            </fluent-button>
        {:else if status === 'testing'}
            <div class="testing-indicator">
                <fluent-progress-ring size={compact ? 'small' : 'medium'}></fluent-progress-ring>
                <span class="testing-text">Testing...</span>
            </div>
        {/if}
    </div>

    {#if testResult && showDetails}
        <div class="test-results">
            <ValidationMessage 
                result={connectionTestToValidation(testResult)}
                showIcon={true}
                compact={compact}
                maxMessages={3}
            />

            {#if testResult.success && (testResult.latency || testResult.version)}
                <div class="connection-details">
                    {#if testResult.latency}
                        <div class="detail-item">
                            <span class="detail-label">Latency:</span>
                            <span class="detail-value">{testResult.latency}ms</span>
                        </div>
                    {/if}
                    
                    {#if testResult.version}
                        <div class="detail-item">
                            <span class="detail-label">Version:</span>
                            <span class="detail-value">{testResult.version}</span>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}

    {#if hasConfigChanged && testResult}
        <div class="config-changed-notice">
            <span class="notice-icon">⚠️</span>
            <span class="notice-text">Configuration has changed. Test again to verify the new settings.</span>
        </div>
    {/if}
</div>

<style>
    .connection-tester {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 16px;
        background-color: var(--vscode-textCodeBlock-background);
        margin: 12px 0;
    }

    .connection-tester.compact {
        padding: 12px;
        margin: 8px 0;
    }

    .tester-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .compact .tester-header {
        margin-bottom: 8px;
    }

    .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .status-icon {
        font-size: 16px;
    }

    .compact .status-icon {
        font-size: 14px;
    }

    .status-text {
        font-size: 14px;
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .compact .status-text {
        font-size: 12px;
    }

    .testing-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .testing-text {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
    }

    .compact .testing-text {
        font-size: 11px;
    }

    .test-results {
        margin-top: 12px;
    }

    .compact .test-results {
        margin-top: 8px;
    }

    .connection-details {
        margin-top: 8px;
        padding: 8px;
        background-color: var(--vscode-editor-background);
        border-radius: 4px;
        border: 1px solid var(--vscode-panel-border);
    }

    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        font-size: 12px;
    }

    .detail-item:last-child {
        margin-bottom: 0;
    }

    .detail-label {
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
    }

    .detail-value {
        color: var(--vscode-foreground);
        font-family: var(--vscode-editor-font-family);
    }

    .config-changed-notice {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        padding: 6px 8px;
        background-color: var(--vscode-inputValidation-warningBackground);
        border: 1px solid var(--vscode-inputValidation-warningBorder);
        border-radius: 4px;
        font-size: 11px;
        color: var(--vscode-inputValidation-warningForeground);
    }

    .notice-icon {
        flex-shrink: 0;
        font-size: 12px;
    }

    .notice-text {
        flex: 1;
        line-height: 1.3;
    }

    /* Animation for status changes */
    .status-indicator {
        transition: all 0.3s ease;
    }

    .testing-indicator {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    /* Responsive design */
    @media (max-width: 600px) {
        .tester-header {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
        }

        .status-indicator {
            justify-content: center;
        }

        .connection-details {
            font-size: 11px;
        }
    }
</style>
