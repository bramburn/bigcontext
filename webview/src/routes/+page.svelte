<script lang="ts">
    import { onMount } from 'svelte';
    import { currentView, type ViewType } from '$lib/stores/viewStore';
    import { initializePersistence } from '$lib/stores/persistence';
    import { appActions } from '$lib/stores/appStore';
    import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
    import GuidedTour from '$lib/components/GuidedTour.svelte';
    import { performanceTracker, measureComponentLoad } from '$lib/utils/performance';
    import { registerCoreComponents } from '$lib/utils/fluentUI';
    import { fadeIn, slideInFromBottom } from '$lib/utils/animations';
    import { postMessage, onMessage } from '$lib/vscodeApi';

    // Dynamic imports for code splitting
    let SetupView: any = null;
    let IndexingView: any = null;
    let QueryView: any = null;
    let DiagnosticsView: any = null;

    // Loading states
    let componentsLoaded = {
        setup: false,
        indexing: false,
        query: false,
        diagnostics: false
    };

    // Component container references for animations
    let componentContainer: HTMLElement;

    // Current view state
    let view: ViewType = 'setup';

    // Guided tour state
    let guidedTourComponent: GuidedTour;
    let hasCompletedFirstRun = true; // Default to true, will be updated from extension

    /**
     * Animate component when it loads
     */
    function animateComponentLoad() {
        if (componentContainer) {
            slideInFromBottom(componentContainer, { duration: 400 });
        }
    }

    /**
     * Dynamically load a component
     */
    async function loadComponent(componentName: 'setup' | 'indexing' | 'query' | 'diagnostics') {
        if (componentsLoaded[componentName]) return;

        const loadMeasure = measureComponentLoad(componentName);
        loadMeasure.start();

        try {
            switch (componentName) {
                case 'setup':
                    if (!SetupView) {
                        const module = await import('$lib/components/SetupView.svelte');
                        SetupView = module.default;
                        componentsLoaded.setup = true;
                        // Trigger animation after component is ready
                        setTimeout(animateComponentLoad, 50);
                    }
                    break;
                case 'indexing':
                    if (!IndexingView) {
                        const module = await import('$lib/components/IndexingView.svelte');
                        IndexingView = module.default;
                        componentsLoaded.indexing = true;
                    }
                    break;
                case 'query':
                    if (!QueryView) {
                        const module = await import('$lib/components/QueryView.svelte');
                        QueryView = module.default;
                        componentsLoaded.query = true;
                    }
                    break;
                case 'diagnostics':
                    if (!DiagnosticsView) {
                        const module = await import('$lib/components/DiagnosticsView.svelte');
                        DiagnosticsView = module.default;
                        componentsLoaded.diagnostics = true;
                    }
                    break;
            }
            loadMeasure.end();
        } catch (error) {
            loadMeasure.end();
            console.error(`Failed to load ${componentName} component:`, error);
        }
    }

    /**
     * Preload components based on current view
     */
    async function preloadComponents(currentView: ViewType) {
        // Always load the current view
        await loadComponent(currentView);

        // Preload likely next views
        if (currentView === 'setup') {
            // Preload indexing view as it's the next logical step
            setTimeout(() => loadComponent('indexing'), 100);
        } else if (currentView === 'indexing') {
            // Preload query view as it's the final step
            setTimeout(() => loadComponent('query'), 100);
        }
    }

    // Subscribe to view store changes
    onMount(() => {
        // Start performance tracking
        performanceTracker.start('app-initialization');

        // Register core Fluent UI components
        registerCoreComponents();

        // Initialize persistence system
        const cleanupPersistence = initializePersistence();

        // Initialize app
        appActions.initialize();

        // End performance tracking
        performanceTracker.end('app-initialization');

        const unsubscribe = currentView.subscribe(async (newView) => {
            view = newView;
            await preloadComponents(newView);
        });

        // VS Code API for receiving initial view state
        const vscode = (window as any).acquireVsCodeApi();

        // Listen for view change messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'setView') {
                currentView.set(message.view);
            } else if (message.command === 'globalStateResponse') {
                // Handle global state response for first-run check
                if (message.key === 'hasCompletedFirstRun') {
                    hasCompletedFirstRun = message.value ?? false;
                }
            } else if (message.command === 'startTour') {
                // Start the guided tour
                if (guidedTourComponent && !hasCompletedFirstRun) {
                    guidedTourComponent.startTour();
                }
            }
        });

        // Request initial view state
        vscode.postMessage({ command: 'getInitialView' });

        // Request first-run state
        vscode.postMessage({ command: 'getGlobalState', key: 'hasCompletedFirstRun' });

        // Load initial component
        preloadComponents(view);

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
            {#if SetupView}
                <div bind:this={componentContainer} class="component-container">
                    <svelte:component this={SetupView} />
                </div>
            {:else}
                <div class="loading-component">
                    <div class="loading-spinner"></div>
                    <p>Loading Setup...</p>
                </div>
            {/if}
        {:else if view === 'indexing'}
            {#if IndexingView}
                <svelte:component this={IndexingView} />
            {:else}
                <div class="loading-component">
                    <div class="loading-spinner"></div>
                    <p>Loading Indexing...</p>
                </div>
            {/if}
        {:else if view === 'query'}
            {#if QueryView}
                <svelte:component this={QueryView} />
            {:else}
                <div class="loading-component">
                    <div class="loading-spinner"></div>
                    <p>Loading Query...</p>
                </div>
            {/if}
        {:else if view === 'diagnostics'}
            {#if DiagnosticsView}
                <svelte:component this={DiagnosticsView} />
            {:else}
                <div class="loading-component">
                    <div class="loading-spinner"></div>
                    <p>Loading Diagnostics...</p>
                </div>
            {/if}
        {:else}
            <!-- Fallback to setup view -->
            {#if SetupView}
                <svelte:component this={SetupView} />
            {:else}
                <div class="loading-component">
                    <div class="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            {/if}
        {/if}
    </ErrorBoundary>

    <!-- Guided Tour Component -->
    <GuidedTour bind:this={guidedTourComponent} on:tourCompleted={() => {
        hasCompletedFirstRun = true;
    }} />
</main>

<style>
    .app-container {
        min-height: 100vh;
        background-color: var(--vscode-editor-background);
        color: var(--vscode-foreground);
        container-type: inline-size;
        padding: 8px;
    }

    /* Responsive adjustments for sidebar view */
    @media (max-width: 400px) {
        .app-container {
            padding: 4px;
            min-height: auto;
        }
    }

    @container (max-width: 350px) {
        .app-container {
            padding: 2px;
        }
    }

    .component-container {
        /* Initial state for animation */
        opacity: 0;
        transform: translateY(20px);
    }

    .loading-component {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        padding: 40px 20px;
        text-align: center;
    }

    .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--vscode-panel-border);
        border-top: 3px solid var(--vscode-button-background);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
    }

    .loading-component p {
        margin: 0;
        font-size: 14px;
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Fade in animation for loaded components */
    :global(.component-fade-in) {
        animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
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
