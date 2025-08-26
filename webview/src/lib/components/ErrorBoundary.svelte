<script lang="ts">
    import { onMount } from 'svelte';
    import { appActions } from '$lib/stores/appStore';
    import { registerCoreComponents } from '$lib/utils/fluentUI';

    // Register Fluent UI components
    registerCoreComponents();

    // Props
    export let fallbackMessage = 'Something went wrong. Please try again.';
    export let showDetails = false;
    export let onError: ((error: Error) => void) | null = null;

    // State
    let hasError = false;
    let errorMessage = '';
    let errorStack = '';
    let errorDetails = '';

    // Error handler
    function handleError(error: Error | ErrorEvent | PromiseRejectionEvent) {
        hasError = true;
        
        if (error instanceof Error) {
            errorMessage = error.message;
            errorStack = error.stack || '';
            errorDetails = `${error.name}: ${error.message}`;
        } else if (error instanceof ErrorEvent) {
            errorMessage = error.message;
            errorStack = error.error?.stack || '';
            errorDetails = `${error.filename}:${error.lineno}:${error.colno} - ${error.message}`;
        } else if (error instanceof PromiseRejectionEvent) {
            errorMessage = error.reason?.message || 'Promise rejection';
            errorStack = error.reason?.stack || '';
            errorDetails = `Unhandled Promise Rejection: ${error.reason}`;
        } else {
            errorMessage = 'Unknown error occurred';
            errorDetails = String(error);
        }

        // Log error for debugging
        console.error('ErrorBoundary caught error:', error);
        
        // Report to app store
        appActions.setError(errorMessage);
        
        // Call custom error handler if provided
        if (onError && error instanceof Error) {
            try {
                onError(error);
            } catch (handlerError) {
                console.error('Error in custom error handler:', handlerError);
            }
        }
    }

    // Reset error state
    function resetError() {
        hasError = false;
        errorMessage = '';
        errorStack = '';
        errorDetails = '';
        appActions.clearError();
    }

    // Reload the component/page
    function reloadComponent() {
        resetError();
        // Force a re-render by updating a reactive variable
        window.location.reload();
    }

    onMount(() => {
        // Global error handlers
        const handleGlobalError = (event: ErrorEvent) => {
            handleError(event);
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            handleError(event);
        };

        // Add global error listeners
        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    });

    // Reactive statement to catch component errors
    $: if (hasError) {
        console.warn('Component is in error state:', errorMessage);
    }
</script>

{#if hasError}
    <div class="error-boundary">
        <fluent-card class="error-card">
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h3 class="error-title">Oops! Something went wrong</h3>
                <p class="error-message">{fallbackMessage}</p>
                
                {#if showDetails && errorDetails}
                    <details class="error-details">
                        <summary>Technical Details</summary>
                        <div class="error-details-content">
                            <p><strong>Error:</strong> {errorMessage}</p>
                            {#if errorStack}
                                <pre class="error-stack">{errorStack}</pre>
                            {/if}
                        </div>
                    </details>
                {/if}

                <div class="error-actions">
                    <fluent-button
                        appearance="accent"
                        on:click={resetError}
                        on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && resetError()}
                        role="button"
                        tabindex="0"
                    >
                        Try Again
                    </fluent-button>

                    <fluent-button
                        on:click={reloadComponent}
                        on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && reloadComponent()}
                        role="button"
                        tabindex="0"
                    >
                        Reload
                    </fluent-button>
                </div>
            </div>
        </fluent-card>
    </div>
{:else}
    <slot />
{/if}

<style>
    .error-boundary {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
        padding: 20px;
    }

    .error-card {
        max-width: 500px;
        width: 100%;
        padding: 30px;
        text-align: center;
    }

    .error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
    }

    .error-icon {
        font-size: 48px;
        margin-bottom: 10px;
    }

    .error-title {
        margin: 0;
        color: var(--vscode-errorForeground);
        font-size: 20px;
        font-weight: 600;
    }

    .error-message {
        margin: 0;
        color: var(--vscode-foreground);
        font-size: 16px;
        line-height: 1.5;
    }

    .error-details {
        width: 100%;
        margin-top: 15px;
        text-align: left;
    }

    .error-details summary {
        cursor: pointer;
        font-weight: 500;
        color: var(--vscode-textLink-foreground);
        margin-bottom: 10px;
    }

    .error-details summary:hover {
        color: var(--vscode-textLink-activeForeground);
    }

    .error-details-content {
        padding: 10px;
        background-color: var(--vscode-textCodeBlock-background);
        border-radius: 4px;
        border: 1px solid var(--vscode-panel-border);
    }

    .error-details-content p {
        margin: 0 0 10px 0;
        font-size: 14px;
    }

    .error-stack {
        margin: 0;
        padding: 10px;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.4;
        color: var(--vscode-foreground);
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
    }

    .error-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }

    .error-actions fluent-button {
        min-width: 100px;
    }

    /* Responsive design */
    @media (max-width: 600px) {
        .error-boundary {
            padding: 10px;
        }

        .error-card {
            padding: 20px;
        }

        .error-actions {
            flex-direction: column;
            width: 100%;
        }

        .error-actions fluent-button {
            width: 100%;
        }
    }
</style>
