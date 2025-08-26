<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { postMessage } from '../vscodeApi';

    const dispatch = createEventDispatcher();

    // Tour state
    let showTour = false;
    let currentStep = 0;
    let tourSteps = [];

    // Tour configuration
    const tourConfig = [
        {
            id: 'query-input',
            title: 'Search Your Code',
            content: 'Use this input box to ask questions about your codebase. Try queries like "how does authentication work?" or "find all database connections".',
            target: '#query-input, .query-input, [data-tour="query-input"]',
            position: 'bottom'
        },
        {
            id: 'results-area',
            title: 'View Results',
            content: 'Your search results will appear here. You can click on file paths to open them directly in the editor, or copy code snippets to your clipboard.',
            target: '#results-area, .results-area, [data-tour="results"]',
            position: 'top'
        },
        {
            id: 'settings-button',
            title: 'Configure Settings',
            content: 'Access extension settings and diagnostics here. You can configure your embedding provider, database connection, and indexing preferences.',
            target: '#settings-button, .settings-button, [data-tour="settings"]',
            position: 'left'
        }
    ];

    // Initialize tour
    onMount(() => {
        tourSteps = tourConfig;
    });

    // Public API for starting the tour
    export function startTour() {
        showTour = true;
        currentStep = 0;
        highlightCurrentStep();
    }

    // Public API for stopping the tour
    export function stopTour() {
        showTour = false;
        currentStep = 0;
        removeHighlights();
        dispatch('tourCompleted');
        
        // Notify the extension that the tour is completed
        postMessage('setGlobalState', {
            key: 'hasCompletedFirstRun',
            value: true
        });
    }

    function nextStep() {
        if (currentStep < tourSteps.length - 1) {
            currentStep++;
            highlightCurrentStep();
        } else {
            stopTour();
        }
    }

    function previousStep() {
        if (currentStep > 0) {
            currentStep--;
            highlightCurrentStep();
        }
    }

    function skipTour() {
        stopTour();
    }

    function highlightCurrentStep() {
        // Remove previous highlights
        removeHighlights();
        
        // Add highlight to current step target
        const step = tourSteps[currentStep];
        if (step && step.target) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                targetElement.classList.add('tour-highlight');
                
                // Scroll element into view
                targetElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }
    }

    function removeHighlights() {
        // Remove all tour highlights
        const highlightedElements = document.querySelectorAll('.tour-highlight');
        highlightedElements.forEach(el => el.classList.remove('tour-highlight'));
    }

    // Reactive statement to handle step changes
    $: if (showTour && currentStep >= 0) {
        setTimeout(highlightCurrentStep, 100);
    }

    // Get current step data
    $: currentStepData = tourSteps[currentStep] || {};
</script>

{#if showTour}
    <!-- Tour overlay -->
    <div class="tour-overlay" on:click={skipTour} on:keydown={(e) => e.key === 'Escape' && skipTour()} role="button" tabindex="0">
        <!-- Tour modal -->
        <div class="tour-modal" on:click|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
            <!-- Header -->
            <div class="tour-header">
                <h3 class="tour-title">{currentStepData.title || 'Welcome Tour'}</h3>
                <button class="tour-close" on:click={skipTour} title="Close tour">
                    ×
                </button>
            </div>

            <!-- Content -->
            <div class="tour-content">
                <p>{currentStepData.content || 'Welcome to Code Context Engine!'}</p>
            </div>

            <!-- Footer -->
            <div class="tour-footer">
                <div class="tour-progress">
                    <span class="tour-step-counter">
                        Step {currentStep + 1} of {tourSteps.length}
                    </span>
                    <div class="tour-progress-bar">
                        <div 
                            class="tour-progress-fill" 
                            style="width: {((currentStep + 1) / tourSteps.length) * 100}%"
                        ></div>
                    </div>
                </div>

                <div class="tour-buttons">
                    <button 
                        class="tour-btn tour-btn-secondary" 
                        on:click={skipTour}
                    >
                        Skip Tour
                    </button>
                    
                    {#if currentStep > 0}
                        <button 
                            class="tour-btn tour-btn-secondary" 
                            on:click={previousStep}
                        >
                            Previous
                        </button>
                    {/if}
                    
                    <button 
                        class="tour-btn tour-btn-primary" 
                        on:click={nextStep}
                    >
                        {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .tour-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(2px);
    }

    .tour-modal {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        animation: tourSlideIn 0.3s ease-out;
    }

    @keyframes tourSlideIn {
        from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .tour-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-titleBar-activeBackground);
    }

    .tour-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--vscode-titleBar-activeForeground);
    }

    .tour-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: var(--vscode-titleBar-activeForeground);
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    .tour-close:hover {
        background-color: var(--vscode-titleBar-inactiveBackground);
    }

    .tour-content {
        padding: 20px;
        line-height: 1.5;
        color: var(--vscode-foreground);
    }

    .tour-content p {
        margin: 0;
    }

    .tour-footer {
        padding: 16px 20px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-panel-background);
    }

    .tour-progress {
        margin-bottom: 16px;
    }

    .tour-step-counter {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 8px;
        display: block;
    }

    .tour-progress-bar {
        width: 100%;
        height: 4px;
        background-color: var(--vscode-progressBar-background);
        border-radius: 2px;
        overflow: hidden;
    }

    .tour-progress-fill {
        height: 100%;
        background-color: var(--vscode-progressBar-foreground);
        transition: width 0.3s ease;
    }

    .tour-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .tour-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
    }

    .tour-btn-primary {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
    }

    .tour-btn-primary:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .tour-btn-secondary {
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
    }

    .tour-btn-secondary:hover {
        background-color: var(--vscode-button-secondaryHoverBackground);
    }

    /* Global highlight style for tour targets */
    :global(.tour-highlight) {
        position: relative;
        z-index: 9999;
        box-shadow: 0 0 0 2px var(--vscode-focusBorder), 0 0 0 4px rgba(0, 122, 255, 0.2);
        border-radius: 4px;
        transition: box-shadow 0.3s ease;
    }
</style>
