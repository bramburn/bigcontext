<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import type { ValidationResult } from '$lib/utils/validation';
    import { createDebouncedValidator } from '$lib/utils/validation';
    import { registerFormComponents } from '$lib/utils/fluentUI';

    // Register required Fluent UI components
    registerFormComponents();

    // Props
    export let value: string = '';
    export let type: 'text' | 'password' | 'url' | 'number' | 'select' = 'text';
    export let placeholder: string = '';
    export let label: string = '';
    export let required: boolean = false;
    export let disabled: boolean = false;
    export let options: { value: string; label: string }[] = []; // For select type
    export let validator: ((value: string) => ValidationResult) | null = null;
    export let validateOnChange: boolean = true;
    export let validateOnBlur: boolean = true;
    export let debounceMs: number = 300;
    export let showValidationIcon: boolean = true;
    export let size: 'small' | 'medium' | 'large' = 'medium';

    // State
    let validationResult: ValidationResult | null = null;
    let isValidating: boolean = false;
    let hasBeenTouched: boolean = false;
    let inputElement: HTMLElement | null = null;

    // Event dispatcher
    const dispatch = createEventDispatcher<{
        input: { value: string; isValid: boolean };
        validation: { result: ValidationResult };
        blur: { value: string };
        focus: { value: string };
    }>();

    // Create debounced validator
    let debouncedValidator: ((value: string) => Promise<ValidationResult>) | null = null;
    
    $: if (validator) {
        debouncedValidator = createDebouncedValidator(validator, debounceMs);
    }

    // Validation state
    $: isValid = validationResult?.isValid ?? true;
    $: hasErrors = (validationResult?.errors?.length ?? 0) > 0;
    $: hasWarnings = (validationResult?.warnings?.length ?? 0) > 0;
    $: hasSuggestions = (validationResult?.suggestions?.length ?? 0) > 0;

    // CSS classes based on validation state
    $: validationClass = hasBeenTouched ? (hasErrors ? 'error' : isValid ? 'valid' : '') : '';

    /**
     * Perform validation
     */
    async function performValidation(inputValue: string, immediate: boolean = false): Promise<void> {
        if (!validator || !hasBeenTouched) return;

        isValidating = true;

        try {
            let result: ValidationResult;
            
            if (immediate || !debouncedValidator) {
                result = validator(inputValue);
            } else {
                result = await debouncedValidator(inputValue);
            }

            validationResult = result;
            dispatch('validation', { result });
        } catch (error) {
            console.error('Validation error:', error);
            validationResult = {
                isValid: false,
                errors: ['Validation failed'],
                warnings: [],
                suggestions: []
            };
        } finally {
            isValidating = false;
        }
    }

    /**
     * Handle input change
     */
    function handleInput(event: Event): void {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        value = target.value;
        hasBeenTouched = true;

        dispatch('input', { value, isValid });

        if (validateOnChange) {
            performValidation(value);
        }
    }

    /**
     * Handle input blur
     */
    function handleBlur(event: Event): void {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        hasBeenTouched = true;
        
        dispatch('blur', { value: target.value });

        if (validateOnBlur) {
            performValidation(value, true);
        }
    }

    /**
     * Handle input focus
     */
    function handleFocus(event: Event): void {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        dispatch('focus', { value: target.value });
    }

    /**
     * Clear validation state
     */
    export function clearValidation(): void {
        validationResult = null;
        hasBeenTouched = false;
        isValidating = false;
    }

    /**
     * Trigger immediate validation
     */
    export function validate(): Promise<ValidationResult | null> {
        hasBeenTouched = true;
        if (validator) {
            performValidation(value, true);
            return Promise.resolve(validationResult);
        }
        return Promise.resolve(null);
    }

    /**
     * Focus the input
     */
    export function focus(): void {
        if (inputElement) {
            inputElement.focus();
        }
    }

    onMount(() => {
        // Initial validation if value is provided
        if (value && validator) {
            performValidation(value, true);
        }
    });
</script>

<div class="validated-input {validationClass}" class:disabled>
    {#if label}
        <label for="input-{label}" class="input-label">
            {label}
            {#if required}
                <span class="required-indicator">*</span>
            {/if}
        </label>
    {/if}

    <div class="input-container">
        {#if type === 'select'}
            <fluent-select
                bind:this={inputElement}
                id="input-{label}"
                {value}
                {disabled}
                on:change={handleInput}
                on:blur={handleBlur}
                on:focus={handleFocus}
                class="input-field {size}"
                role="combobox"
                aria-label={label || placeholder}
                aria-invalid={hasErrors}
                aria-expanded="false"
                aria-controls="options-{label}"
                aria-describedby={hasErrors || hasWarnings || hasSuggestions ? `validation-${label}` : undefined}
            >
                {#if placeholder}
                    <fluent-option value="">{placeholder}</fluent-option>
                {/if}
                {#each options as option}
                    <fluent-option value={option.value}>{option.label}</fluent-option>
                {/each}
            </fluent-select>
        {:else}
            <fluent-text-field
                bind:this={inputElement}
                id="input-{label}"
                {type}
                {value}
                {placeholder}
                {disabled}
                on:input={handleInput}
                on:blur={handleBlur}
                on:focus={handleFocus}
                class="input-field {size}"
                role="textbox"
                aria-label={label || placeholder}
                aria-invalid={hasErrors}
                aria-describedby={hasErrors || hasWarnings || hasSuggestions ? `validation-${label}` : undefined}
            ></fluent-text-field>
        {/if}

        {#if showValidationIcon && hasBeenTouched}
            <div class="validation-icon">
                {#if isValidating}
                    <div class="loading-spinner"></div>
                {:else if hasErrors}
                    <span class="error-icon" title="Validation errors">⚠️</span>
                {:else if isValid}
                    <span class="success-icon" title="Valid">✅</span>
                {/if}
            </div>
        {/if}
    </div>

    {#if validationResult && hasBeenTouched && (hasErrors || hasWarnings || hasSuggestions)}
        <div id="validation-{label}" class="validation-messages" role="alert" aria-live="polite">
            {#if hasErrors}
                <div class="validation-errors">
                    {#each validationResult.errors as error}
                        <div class="validation-message error">
                            <span class="message-icon">❌</span>
                            <span class="message-text">{error}</span>
                        </div>
                    {/each}
                </div>
            {/if}

            {#if hasWarnings}
                <div class="validation-warnings">
                    {#each validationResult.warnings as warning}
                        <div class="validation-message warning">
                            <span class="message-icon">⚠️</span>
                            <span class="message-text">{warning}</span>
                        </div>
                    {/each}
                </div>
            {/if}

            {#if hasSuggestions}
                <div class="validation-suggestions">
                    {#each validationResult.suggestions as suggestion}
                        <div class="validation-message suggestion">
                            <span class="message-icon">💡</span>
                            <span class="message-text">{suggestion}</span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .validated-input {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
    }

    .validated-input.disabled {
        opacity: 0.6;
        pointer-events: none;
    }

    .input-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--vscode-foreground);
        margin-bottom: 4px;
    }

    .required-indicator {
        color: var(--vscode-errorForeground);
        margin-left: 2px;
    }

    .input-container {
        position: relative;
        display: flex;
        align-items: center;
    }

    .input-field {
        flex: 1;
        transition: border-color 0.2s ease;
    }

    .input-field.small {
        font-size: 12px;
    }

    .input-field.medium {
        font-size: 14px;
    }

    .input-field.large {
        font-size: 16px;
    }

    .validated-input.error .input-field {
        border-color: var(--vscode-inputValidation-errorBorder);
        background-color: var(--vscode-inputValidation-errorBackground);
    }

    .validated-input.valid .input-field {
        border-color: var(--vscode-charts-green);
    }

    .validation-icon {
        position: absolute;
        right: 8px;
        display: flex;
        align-items: center;
        pointer-events: none;
    }

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--vscode-panel-border);
        border-top: 2px solid var(--vscode-button-background);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error-icon, .success-icon {
        font-size: 16px;
    }

    .validation-messages {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .validation-message {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 12px;
        line-height: 1.4;
        padding: 4px 0;
    }

    .validation-message.error {
        color: var(--vscode-inputValidation-errorForeground);
    }

    .validation-message.warning {
        color: var(--vscode-inputValidation-warningForeground);
    }

    .validation-message.suggestion {
        color: var(--vscode-textLink-foreground);
    }

    .message-icon {
        flex-shrink: 0;
        font-size: 12px;
        margin-top: 1px;
    }

    .message-text {
        flex: 1;
    }

    /* Responsive design */
    @media (max-width: 600px) {
        .validated-input {
            margin-bottom: 12px;
        }

        .validation-message {
            font-size: 11px;
        }
    }
</style>
