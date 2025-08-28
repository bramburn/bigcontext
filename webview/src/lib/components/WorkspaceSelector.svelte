<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { postMessage, onMessage } from '../vscodeApi';
    import { appActions } from '../stores/appStore';

    // Component props
    export let showLabel = true;
    export let compact = false;

    // Local state
    let workspaces: Array<{
        id: string;
        name: string;
        path: string;
        isActive: boolean;
    }> = [];
    
    let currentWorkspace: string | null = null;
    let isLoading = false;
    let hasMultipleWorkspaces = false;

    // Cleanup functions
    let unsubscribeFunctions: Array<() => void> = [];

    /**
     * Component initialization
     */
    onMount(() => {
        console.log('WorkspaceSelector: Component mounted');

        // Set up message listeners
        unsubscribeFunctions.push(
            onMessage('workspaceListResponse', (message) => {
                if (message.success) {
                    workspaces = message.data.workspaces || [];
                    currentWorkspace = message.data.current || null;
                    hasMultipleWorkspaces = workspaces.length > 1;
                    console.log(`WorkspaceSelector: Received ${workspaces.length} workspaces`);
                } else {
                    console.error('WorkspaceSelector: Failed to get workspace list:', message.error);
                    appActions.setError(message.error || 'Failed to load workspaces');
                }
                isLoading = false;
            }),
            onMessage('workspaceSwitchResponse', (message) => {
                if (message.success) {
                    currentWorkspace = message.data.workspaceId;
                    // Update the active workspace in our local list
                    workspaces = workspaces.map(w => ({
                        ...w,
                        isActive: w.id === message.data.workspaceId
                    }));
                    console.log(`WorkspaceSelector: Switched to workspace: ${message.data.workspaceId}`);
                    appActions.clearError();
                } else {
                    console.error('WorkspaceSelector: Failed to switch workspace:', message.error);
                    appActions.setError(message.error || 'Failed to switch workspace');
                }
            }),
            onMessage('workspaceChanged', (message) => {
                // Handle workspace changes from external sources
                if (message.data.workspace) {
                    currentWorkspace = message.data.workspace.id;
                    // Refresh the workspace list
                    refreshWorkspaces();
                }
            }),
            onMessage('error', (message) => {
                console.error('WorkspaceSelector: Received error:', message.message);
                appActions.setError(message.message);
                isLoading = false;
            })
        );

        // Request initial workspace list
        refreshWorkspaces();
    });

    /**
     * Component cleanup
     */
    onDestroy(() => {
        console.log('WorkspaceSelector: Component destroyed');
        unsubscribeFunctions.forEach(fn => fn());
    });

    /**
     * Refreshes the workspace list from the backend
     */
    function refreshWorkspaces() {
        isLoading = true;
        postMessage('getWorkspaceList');
    }

    /**
     * Switches to a different workspace
     * @param workspaceId - The ID of the workspace to switch to
     */
    function switchWorkspace(workspaceId: string) {
        if (workspaceId === currentWorkspace) {
            return; // Already on this workspace
        }

        console.log(`WorkspaceSelector: Switching to workspace: ${workspaceId}`);
        postMessage('switchWorkspace', { workspaceId });
    }

    /**
     * Handles keyboard navigation for accessibility
     * @param event - The keyboard event
     * @param callback - The function to call on Enter/Space
     */
    function handleKeyboardClick(event: KeyboardEvent, callback: () => void) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback();
        }
    }

    /**
     * Gets a shortened display name for a workspace
     * @param workspace - The workspace object
     * @returns A shortened display name
     */
    function getDisplayName(workspace: any): string {
        if (compact && workspace.name.length > 20) {
            return workspace.name.substring(0, 17) + '...';
        }
        return workspace.name;
    }

    /**
     * Gets the tooltip text for a workspace
     * @param workspace - The workspace object
     * @returns Tooltip text with full path
     */
    function getTooltip(workspace: any): string {
        return `${workspace.name}\n${workspace.path}`;
    }
</script>

<!-- Only show the component if there are multiple workspaces -->
{#if hasMultipleWorkspaces}
    <div class="workspace-selector" class:compact>
        {#if showLabel && !compact}
            <label for="workspace-select" class="workspace-label">
                Workspace:
            </label>
        {/if}
        
        <div class="workspace-dropdown">
            <fluent-select
                id="workspace-select"
                value={currentWorkspace || ''}
                disabled={isLoading || workspaces.length === 0}
                on:change={(e) => switchWorkspace(e.target.value)}
                aria-label="Select workspace"
            >
                {#if isLoading}
                    <fluent-option value="" disabled>Loading workspaces...</fluent-option>
                {:else if workspaces.length === 0}
                    <fluent-option value="" disabled>No workspaces found</fluent-option>
                {:else}
                    {#each workspaces as workspace (workspace.id)}
                        <fluent-option 
                            value={workspace.id}
                            selected={workspace.isActive}
                            title={getTooltip(workspace)}
                        >
                            {getDisplayName(workspace)}
                            {#if workspace.isActive}
                                <span class="active-indicator">●</span>
                            {/if}
                        </fluent-option>
                    {/each}
                {/if}
            </fluent-select>
            
            {#if !compact}
                <fluent-button
                    appearance="stealth"
                    on:click={refreshWorkspaces}
                    on:keydown={(e) => handleKeyboardClick(e, refreshWorkspaces)}
                    disabled={isLoading}
                    title="Refresh workspace list"
                    aria-label="Refresh workspace list"
                    role="button"
                    tabindex="0"
                >
                    {#if isLoading}
                        <fluent-progress-ring></fluent-progress-ring>
                    {:else}
                        🔄
                    {/if}
                </fluent-button>
            {/if}
        </div>
        
        {#if !compact && currentWorkspace}
            <div class="workspace-info">
                {#each workspaces as workspace (workspace.id)}
                    {#if workspace.isActive}
                        <span class="workspace-path" title={workspace.path}>
                            📁 {workspace.path}
                        </span>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    .workspace-selector {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
        padding: 12px;
        border: 1px solid var(--vscode-widget-border);
        border-radius: 4px;
        background-color: var(--vscode-editor-background);
    }

    .workspace-selector.compact {
        flex-direction: row;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding: 8px;
    }

    .workspace-label {
        font-weight: 600;
        color: var(--vscode-foreground);
        font-size: 14px;
        margin-bottom: 4px;
    }

    .workspace-dropdown {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .workspace-dropdown fluent-select {
        flex: 1;
        min-width: 200px;
    }

    .workspace-dropdown fluent-button {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .workspace-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
    }

    .workspace-path {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        font-family: var(--vscode-editor-font-family);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
    }

    .active-indicator {
        color: var(--vscode-textLink-foreground);
        margin-left: 8px;
        font-weight: bold;
    }

    /* Compact mode adjustments */
    .workspace-selector.compact .workspace-dropdown fluent-select {
        min-width: 150px;
    }

    .workspace-selector.compact .workspace-label {
        margin-bottom: 0;
        font-size: 13px;
        white-space: nowrap;
    }

    /* Loading state */
    fluent-select:disabled {
        opacity: 0.6;
    }

    /* Responsive design */
    @media (max-width: 400px) {
        .workspace-selector:not(.compact) {
            padding: 8px;
        }
        
        .workspace-dropdown fluent-select {
            min-width: 120px;
        }
        
        .workspace-path {
            font-size: 11px;
        }
    }
</style>
