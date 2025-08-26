<script>
    import { createEventDispatcher } from 'svelte';
    import hljs from 'highlight.js';
    import 'highlight.js/styles/github-dark.css';
    import { postMessage } from '../vscodeApi';

    const dispatch = createEventDispatcher();

    // Props
    export let result;
    export let index = 0;

    // State
    let highlightedCode = '';
    let isExpanded = false;
    let copyButtonText = 'Copy';

    // Reactive highlighting
    $: if (result && result.content) {
        try {
            // Detect language from file extension
            const language = detectLanguage(result.file);
            highlightedCode = hljs.highlight(result.content, {
                language: language,
                ignoreIllegals: true
            }).value;
        } catch (e) {
            console.error('Highlighting failed:', e);
            highlightedCode = escapeHtml(result.content); // Fallback to escaped plain text
        }
    }

    function detectLanguage(filePath) {
        if (!filePath) return 'plaintext';
        
        const ext = filePath.split('.').pop()?.toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'bash',
            'fish': 'bash',
            'ps1': 'powershell',
            'sql': 'sql',
            'html': 'html',
            'htm': 'html',
            'xml': 'xml',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'json': 'json',
            'yaml': 'yaml',
            'yml': 'yaml',
            'toml': 'toml',
            'ini': 'ini',
            'cfg': 'ini',
            'conf': 'ini',
            'md': 'markdown',
            'markdown': 'markdown',
            'dockerfile': 'dockerfile',
            'makefile': 'makefile',
            'r': 'r',
            'R': 'r',
            'dart': 'dart',
            'vue': 'vue',
            'svelte': 'svelte'
        };
        
        return languageMap[ext] || 'plaintext';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function openFile() {
        postMessage('openFile', {
            path: result.file,
            line: result.lineNumber || 1
        });
    }

    async function copySnippet() {
        try {
            await navigator.clipboard.writeText(result.content);
            copyButtonText = 'Copied!';
            setTimeout(() => {
                copyButtonText = 'Copy';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            copyButtonText = 'Failed';
            setTimeout(() => {
                copyButtonText = 'Copy';
            }, 2000);
        }
    }

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }

    function getScoreColor(score) {
        if (score >= 0.8) return 'var(--vscode-charts-green)';
        if (score >= 0.6) return 'var(--vscode-charts-yellow)';
        if (score >= 0.4) return 'var(--vscode-charts-orange)';
        return 'var(--vscode-charts-red)';
    }

    function truncateContent(content, maxLines = 10) {
        if (!content) return '';
        const lines = content.split('\n');
        if (lines.length <= maxLines) return content;
        return lines.slice(0, maxLines).join('\n') + '\n...';
    }

    // Reactive content for display
    $: displayContent = isExpanded ? result.content : truncateContent(result.content);
    $: displayHighlighted = isExpanded ? highlightedCode : truncateContent(highlightedCode);
</script>

<div class="result-card" data-tour="results">
    <div class="card-header">
        <div class="file-info">
            <button 
                class="file-path" 
                on:click={openFile}
                title="Click to open file in editor"
            >
                <span class="file-icon">📄</span>
                <span class="file-name">{result.file}</span>
                {#if result.lineNumber}
                    <span class="line-number">:{result.lineNumber}</span>
                {/if}
            </button>
        </div>
        
        <div class="card-actions">
            <div class="score-badge" style="background-color: {getScoreColor(result.score)}">
                {Math.round(result.score * 100)}%
            </div>
            
            <button 
                class="action-btn copy-btn" 
                on:click={copySnippet}
                title="Copy code snippet"
            >
                {copyButtonText}
            </button>
            
            {#if result.content && result.content.split('\n').length > 10}
                <button 
                    class="action-btn expand-btn" 
                    on:click={toggleExpanded}
                    title={isExpanded ? 'Collapse' : 'Expand'}
                >
                    {isExpanded ? '▲' : '▼'}
                </button>
            {/if}
        </div>
    </div>

    <div class="card-content">
        <pre class="code-snippet"><code class="hljs">{@html displayHighlighted}</code></pre>
    </div>

    {#if result.context}
        <div class="card-context">
            <strong>Context:</strong> {result.context}
        </div>
    {/if}

    {#if result.relatedFiles && result.relatedFiles.length > 0}
        <details class="related-files">
            <summary>Related Files ({result.relatedFiles.length})</summary>
            <div class="related-files-list">
                {#each result.relatedFiles as relatedFile}
                    <div class="related-file">
                        <button 
                            class="file-path related-file-link" 
                            on:click={() => postMessage('openFile', { path: relatedFile.file })}
                            title="Open related file"
                        >
                            📄 {relatedFile.file}
                        </button>
                        <span class="related-reason">{relatedFile.reason}</span>
                        <div class="score-badge small" style="background-color: {getScoreColor(relatedFile.score)}">
                            {Math.round(relatedFile.score * 100)}%
                        </div>
                    </div>
                {/each}
            </div>
        </details>
    {/if}
</div>

<style>
    .result-card {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        margin-bottom: 12px;
        overflow: hidden;
        transition: box-shadow 0.2s ease;
    }

    .result-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-color: var(--vscode-focusBorder);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--vscode-titleBar-activeBackground);
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .file-info {
        flex: 1;
        min-width: 0;
    }

    .file-path {
        background: none;
        border: none;
        color: var(--vscode-textLink-foreground);
        cursor: pointer;
        font-family: var(--vscode-font-family);
        font-size: 13px;
        padding: 0;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: color 0.2s ease;
    }

    .file-path:hover {
        color: var(--vscode-textLink-activeForeground);
        text-decoration: underline;
    }

    .file-icon {
        font-size: 14px;
    }

    .file-name {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .line-number {
        color: var(--vscode-descriptionForeground);
        font-weight: normal;
    }

    .card-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .score-badge {
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 12px;
        white-space: nowrap;
    }

    .score-badge.small {
        font-size: 10px;
        padding: 2px 6px;
    }

    .action-btn {
        background-color: var(--vscode-button-secondaryBackground);
        border: none;
        border-radius: 4px;
        color: var(--vscode-button-secondaryForeground);
        cursor: pointer;
        font-size: 11px;
        padding: 6px 10px;
        transition: background-color 0.2s ease;
    }

    .action-btn:hover {
        background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .copy-btn {
        min-width: 50px;
    }

    .expand-btn {
        width: 24px;
        padding: 6px;
    }

    .card-content {
        padding: 0;
    }

    .code-snippet {
        margin: 0;
        padding: 16px;
        background-color: var(--vscode-textCodeBlock-background);
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        line-height: 1.4;
        overflow-x: auto;
        white-space: pre;
    }

    .code-snippet code {
        background: none;
        padding: 0;
    }

    .card-context {
        padding: 12px 16px;
        background-color: var(--vscode-textBlockQuote-background);
        border-top: 1px solid var(--vscode-panel-border);
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .related-files {
        border-top: 1px solid var(--vscode-panel-border);
    }

    .related-files summary {
        padding: 12px 16px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        color: var(--vscode-foreground);
        background-color: var(--vscode-sideBar-background);
        transition: background-color 0.2s ease;
    }

    .related-files summary:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .related-files-list {
        padding: 8px 16px 12px;
        background-color: var(--vscode-sideBar-background);
    }

    .related-file {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        font-size: 11px;
    }

    .related-file-link {
        font-size: 11px;
    }

    .related-reason {
        flex: 1;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
    }

    /* Responsive adjustments */
    @media (max-width: 600px) {
        .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }

        .card-actions {
            align-self: flex-end;
        }

        .file-name {
            max-width: 200px;
        }
    }
</style>
