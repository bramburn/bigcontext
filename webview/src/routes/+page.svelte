<script lang="ts">
    import { onMount } from 'svelte';
    import { currentView, type ViewType } from '$lib/stores/viewStore';
    import { initializePersistence } from '$lib/stores/persistence';
    import { appActions } from '$lib/stores/appStore';
    import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
    import SetupView from '$lib/components/SetupView.svelte';
    import IndexingView from '$lib/components/IndexingView.svelte';
    import QueryView from '$lib/components/QueryView.svelte';

    // Current view state
    let view: ViewType = 'setup';

    // Subscribe to view store changes
    onMount(() => {
        // Initialize persistence system
        const cleanupPersistence = initializePersistence();

        // Initialize app
        appActions.initialize();

        const unsubscribe = currentView.subscribe((newView) => {
            view = newView;
        });

        // VS Code API for receiving initial view state
        const vscode = (window as any).acquireVsCodeApi();

        // Listen for view change messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'setView') {
                currentView.set(message.view);
            }
        });

        // Request initial view state
        vscode.postMessage({ command: 'getInitialView' });

        return () => {
            unsubscribe();
            cleanupPersistence();
        };
    });
</script>

<main class="app-container">
    <ErrorBoundary
        fallbackMessage="The application encountered an error. Please try refreshing or contact support if the problem persists."
        showDetails={true}
        onError={(error) => console.error('Application error:', error)}
    >
        {#if view === 'setup'}
            <SetupView />
        {:else if view === 'indexing'}
            <IndexingView />
        {:else if view === 'query'}
            <QueryView />
        {:else}
            <!-- Fallback to setup view -->
            <SetupView />
        {/if}
    </ErrorBoundary>
</main>

<style>
    .app-container {
        min-height: 100vh;
        background-color: var(--vscode-editor-background);
        color: var(--vscode-foreground);
    }

    :global(body) {
        margin: 0;
        padding: 0;
        font-family: var(--vscode-font-family);
        background-color: var(--vscode-editor-background);
        color: var(--vscode-foreground);
    }

    :global(*) {
        box-sizing: border-box;
    }
</style>
