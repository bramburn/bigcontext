<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { ValidationResult } from '$lib/utils/validation';

    // Props
    export let result: ValidationResult | null = null;
    export let showIcon: boolean = true;
    export let showDismiss: boolean = false;
    export let compact: boolean = false;
    export let maxMessages: number = 5;

    // Event dispatcher
    const dispatch = createEventDispatcher<{
        dismiss: void;
    }>();

    // Computed properties
    $: hasErrors = result?.errors.length > 0;
    $: hasWarnings = result?.warnings.length > 0;
    $: hasSuggestions = result?.suggestions.length > 0;
    $: hasAnyMessages = hasErrors || hasWarnings || hasSuggestions;

    // Get the primary message type for styling
    $: primaryType = hasErrors ? 'error' : hasWarnings ? 'warning' : 'suggestion';

    // Truncate messages if needed
    $: displayErrors = result?.errors.slice(0, maxMessages) || [];
    $: displayWarnings = result?.warnings.slice(0, maxMessages) || [];
    $: displaySuggestions = result?.suggestions.slice(0, maxMessages) || [];
    $: hasMoreMessages = (result?.errors.length || 0) + (result?.warnings.length || 0) + (result?.suggestions.length || 0) > maxMessages;

    function handleDismiss(): void {
        dispatch('dismiss');
    }

    function getIcon(type: 'error' | 'warning' | 'suggestion'): string {
        switch (type) {
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'suggestion': return '💡';
            default: return '';
        }
    }
</script>

{#if result && hasAnyMessages}
    <div 
        class="validation-message-container {primaryType}" 
        class:compact
        role="alert" 
        aria-live="polite"
    >
        <div class="validation-content">
            {#if showIcon}
                <div class="validation-icon">
                    {getIcon(primaryType)}
                </div>
            {/if}

            <div class="validation-messages">
                <!-- Error messages -->
                {#if hasErrors}
                    <div class="message-group errors">
                        {#each displayErrors as error}
                            <div class="message-item error">
                                {#if !showIcon || compact}
                                    <span class="inline-icon">{getIcon('error')}</span>
                                {/if}
                                <span class="message-text">{error}</span>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Warning messages -->
                {#if hasWarnings}
                    <div class="message-group warnings">
                        {#each displayWarnings as warning}
                            <div class="message-item warning">
                                {#if !showIcon || compact}
                                    <span class="inline-icon">{getIcon('warning')}</span>
                                {/if}
                                <span class="message-text">{warning}</span>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Suggestion messages -->
                {#if hasSuggestions}
                    <div class="message-group suggestions">
                        {#each displaySuggestions as suggestion}
                            <div class="message-item suggestion">
                                {#if !showIcon || compact}
                                    <span class="inline-icon">{getIcon('suggestion')}</span>
                                {/if}
                                <span class="message-text">{suggestion}</span>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- More messages indicator -->
                {#if hasMoreMessages}
                    <div class="more-messages">
                        <span class="more-text">
                            ... and {((result?.errors.length || 0) + (result?.warnings.length || 0) + (result?.suggestions.length || 0)) - maxMessages} more message{((result?.errors.length || 0) + (result?.warnings.length || 0) + (result?.suggestions.length || 0)) - maxMessages === 1 ? '' : 's'}
                        </span>
                    </div>
                {/if}
            </div>

            {#if showDismiss}
                <button 
                    class="dismiss-button"
                    on:click={handleDismiss}
                    on:keydown={(e) => e.key === 'Enter' && handleDismiss()}
                    aria-label="Dismiss validation messages"
                    title="Dismiss"
                >
                    ✕
                </button>
            {/if}
        </div>
    </div>
{/if}

<style>
    .validation-message-container {
        border-radius: 4px;
        padding: 12px;
        margin: 8px 0;
        border-left: 4px solid;
        background-color: var(--vscode-textCodeBlock-background);
        transition: all 0.2s ease;
    }

    .validation-message-container.compact {
        padding: 8px;
        margin: 4px 0;
    }

    .validation-message-container.error {
        border-left-color: var(--vscode-inputValidation-errorBorder);
        background-color: var(--vscode-inputValidation-errorBackground);
    }

    .validation-message-container.warning {
        border-left-color: var(--vscode-inputValidation-warningBorder);
        background-color: var(--vscode-inputValidation-warningBackground);
    }

    .validation-message-container.suggestion {
        border-left-color: var(--vscode-textLink-foreground);
        background-color: var(--vscode-textCodeBlock-background);
    }

    .validation-content {
        display: flex;
        align-items: flex-start;
        gap: 8px;
    }

    .validation-icon {
        flex-shrink: 0;
        font-size: 16px;
        margin-top: 2px;
    }

    .compact .validation-icon {
        font-size: 14px;
        margin-top: 1px;
    }

    .validation-messages {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .compact .validation-messages {
        gap: 4px;
    }

    .message-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .compact .message-group {
        gap: 2px;
    }

    .message-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 13px;
        line-height: 1.4;
    }

    .compact .message-item {
        font-size: 12px;
        gap: 4px;
    }

    .message-item.error {
        color: var(--vscode-inputValidation-errorForeground);
    }

    .message-item.warning {
        color: var(--vscode-inputValidation-warningForeground);
    }

    .message-item.suggestion {
        color: var(--vscode-textLink-foreground);
    }

    .inline-icon {
        flex-shrink: 0;
        font-size: 12px;
        margin-top: 1px;
    }

    .compact .inline-icon {
        font-size: 10px;
    }

    .message-text {
        flex: 1;
        word-break: break-word;
    }

    .more-messages {
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px solid var(--vscode-panel-border);
    }

    .more-text {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
    }

    .dismiss-button {
        flex-shrink: 0;
        background: none;
        border: none;
        color: var(--vscode-foreground);
        cursor: pointer;
        font-size: 14px;
        padding: 2px 4px;
        border-radius: 2px;
        transition: background-color 0.2s ease;
        margin-top: -2px;
    }

    .dismiss-button:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .dismiss-button:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: 1px;
    }

    /* Animation for new messages */
    .validation-message-container {
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Responsive design */
    @media (max-width: 600px) {
        .validation-message-container {
            padding: 8px;
            margin: 6px 0;
        }

        .message-item {
            font-size: 12px;
        }

        .validation-icon {
            font-size: 14px;
        }
    }
</style>
