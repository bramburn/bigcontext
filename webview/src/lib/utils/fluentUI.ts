/**
 * Centralized Fluent UI Configuration
 * 
 * This file centralizes all Fluent UI component imports and registration
 * to optimize bundle size through tree-shaking and avoid duplicate registrations.
 */

import { 
    provideFluentDesignSystem,
    fluentButton,
    fluentTextField,
    fluentSelect,
    fluentOption,
    fluentProgressRing,
    fluentCard,
    fluentBadge,
    fluentAccordion,
    fluentAccordionItem
} from '@fluentui/web-components';

// Track which components have been registered to avoid duplicates
const registeredComponents = new Set<string>();

/**
 * Register core Fluent UI components that are used across the application
 */
export function registerCoreComponents(): void {
    if (registeredComponents.has('core')) return;

    const designSystem = provideFluentDesignSystem();
    
    designSystem.register(
        fluentButton(),
        fluentTextField(),
        fluentCard(),
        fluentProgressRing()
    );

    registeredComponents.add('core');
}

/**
 * Register form-related Fluent UI components
 */
export function registerFormComponents(): void {
    if (registeredComponents.has('form')) return;

    const designSystem = provideFluentDesignSystem();
    
    designSystem.register(
        fluentSelect(),
        fluentOption()
    );

    registeredComponents.add('form');
}

/**
 * Register display-related Fluent UI components
 */
export function registerDisplayComponents(): void {
    if (registeredComponents.has('display')) return;

    const designSystem = provideFluentDesignSystem();
    
    designSystem.register(
        fluentBadge(),
        fluentAccordion(),
        fluentAccordionItem()
    );

    registeredComponents.add('display');
}

/**
 * Register all Fluent UI components at once
 * Use this for components that need all features
 */
export function registerAllComponents(): void {
    registerCoreComponents();
    registerFormComponents();
    registerDisplayComponents();
}

/**
 * Get the design system instance
 */
export function getDesignSystem() {
    return provideFluentDesignSystem();
}

/**
 * Check if a component group has been registered
 */
export function isRegistered(componentGroup: 'core' | 'form' | 'display'): boolean {
    return registeredComponents.has(componentGroup);
}

/**
 * Reset registration tracking (useful for testing)
 */
export function resetRegistrations(): void {
    registeredComponents.clear();
}
