<script lang="ts">
    import { fluentCard, fluentButton } from '@fluentui/web-components';
    import { postMessage } from '$lib/vscodeApi';

    function handleOpenFolder() {
        postMessage('requestOpenFolder');
    }
</script>

<fluent-card class="no-workspace-container">
    <h2>No Workspace Open</h2>
    <p>No workspace is open. Please open a folder to use the Code Context Engine.</p>
    <fluent-button
        appearance="accent"
        on:click={handleOpenFolder}
        on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && handleOpenFolder()}
        role="button"
        tabindex="0"
    >Open Folder</fluent-button>
</fluent-card>

<style>
    .no-workspace-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 2rem;
        text-align: center;
    }

    h2 {
        color: var(--vscode-foreground);
        margin-bottom: 1rem;
    }

    p {
        color: var(--vscode-descriptionForeground);
        max-width: 500px;
    }
</style>