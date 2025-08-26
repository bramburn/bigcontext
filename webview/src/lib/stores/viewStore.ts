import { writable } from 'svelte/store';

/**
 * Type definition for the different views available in the application
 */
export type ViewType = 'setup' | 'indexing' | 'query' | 'diagnostics';

/**
 * Writable store to manage the currently active view
 * Default value is 'setup' as users typically start with setup
 */
export const currentView = writable<ViewType>('setup');

/**
 * Helper function to set the current view
 * @param view - The view to switch to
 */
export function setCurrentView(view: ViewType) {
    currentView.set(view);
}

/**
 * Helper function to get the current view value
 * @returns Promise that resolves to the current view
 */
export function getCurrentView(): Promise<ViewType> {
    return new Promise((resolve) => {
        const unsubscribe = currentView.subscribe((view) => {
            unsubscribe();
            resolve(view);
        });
    });
}
