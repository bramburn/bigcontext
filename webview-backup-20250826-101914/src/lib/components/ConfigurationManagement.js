"use strict";
/**
 * Configuration Management Component
 *
 * Provides UI for configuration import/export, template management,
 * backup/restore functionality, and configuration validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationManagementStyles = exports.ConfigurationManagementComponent = void 0;
const vscodeApi_1 = require("../vscodeApi");
class ConfigurationManagementComponent {
    constructor(container) {
        this.currentTab = 'import-export';
        this.templates = [];
        this.backups = [];
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.setupMessageHandlers();
        this.loadInitialData();
    }
    /**
     * Render the configuration management UI
     */
    render() {
        this.container.innerHTML = `
            <div class="config-management">
                <div class="config-header">
                    <h3>Configuration Management</h3>
                    <p>Manage, import, export, and backup your configurations.</p>
                </div>

                <div class="config-tabs">
                    <button class="tab-button active" data-tab="import-export">
                        📁 Import/Export
                    </button>
                    <button class="tab-button" data-tab="templates">
                        📋 Templates
                    </button>
                    <button class="tab-button" data-tab="backups">
                        💾 Backups
                    </button>
                    <button class="tab-button" data-tab="validation">
                        ✅ Validation
                    </button>
                </div>

                <div class="config-content">
                    <div id="import-export-tab" class="tab-content active">
                        ${this.renderImportExportTab()}
                    </div>
                    <div id="templates-tab" class="tab-content">
                        ${this.renderTemplatesTab()}
                    </div>
                    <div id="backups-tab" class="tab-content">
                        ${this.renderBackupsTab()}
                    </div>
                    <div id="validation-tab" class="tab-content">
                        ${this.renderValidationTab()}
                    </div>
                </div>
            </div>
        `;
    }
    /**
     * Render import/export tab
     */
    renderImportExportTab() {
        return `
            <div class="import-export-section">
                <div class="section-group">
                    <h4>📤 Export Configuration</h4>
                    <p>Export your current configuration to share with team members or backup.</p>
                    <div class="export-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="include-secrets" />
                            Include API keys and secrets (not recommended for sharing)
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="minify-json" />
                            Minify JSON output
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="validate-export" checked />
                            Validate before export
                        </label>
                    </div>
                    <div class="export-actions">
                        <button id="export-config" class="primary-button">
                            📤 Export Configuration
                        </button>
                        <button id="export-template" class="secondary-button">
                            📋 Save as Template
                        </button>
                    </div>
                </div>

                <div class="section-group">
                    <h4>📥 Import Configuration</h4>
                    <p>Import a configuration file to replace or merge with your current setup.</p>
                    <div class="import-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="validate-import" checked />
                            Validate configuration before import
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="backup-before-import" checked />
                            Create backup before import
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="merge-config" />
                            Merge with current configuration
                        </label>
                    </div>
                    <div class="import-actions">
                        <input type="file" id="config-file-input" accept=".json" style="display: none;" />
                        <button id="import-config" class="primary-button">
                            📥 Import Configuration
                        </button>
                        <button id="import-preset" class="secondary-button">
                            🎯 Apply Preset
                        </button>
                    </div>
                </div>

                <div id="import-export-status" class="status-section hidden">
                    <!-- Status messages will appear here -->
                </div>
            </div>
        `;
    }
    /**
     * Render templates tab
     */
    renderTemplatesTab() {
        return `
            <div class="templates-section">
                <div class="section-header">
                    <h4>📋 Configuration Templates</h4>
                    <button id="refresh-templates" class="icon-button">🔄</button>
                </div>
                <p>Use pre-built templates or create your own for quick configuration setup.</p>
                
                <div class="templates-grid" id="templates-grid">
                    ${this.renderTemplatesList()}
                </div>

                <div class="template-actions">
                    <button id="create-template" class="primary-button">
                        ➕ Create Template
                    </button>
                </div>
            </div>
        `;
    }
    /**
     * Render backups tab
     */
    renderBackupsTab() {
        return `
            <div class="backups-section">
                <div class="section-header">
                    <h4>💾 Configuration Backups</h4>
                    <button id="refresh-backups" class="icon-button">🔄</button>
                </div>
                <p>Manage automatic and manual configuration backups.</p>
                
                <div class="backup-actions">
                    <button id="create-backup" class="primary-button">
                        💾 Create Backup
                    </button>
                    <button id="cleanup-backups" class="secondary-button">
                        🗑️ Cleanup Old Backups
                    </button>
                </div>

                <div class="backups-list" id="backups-list">
                    ${this.renderBackupsList()}
                </div>
            </div>
        `;
    }
    /**
     * Render validation tab
     */
    renderValidationTab() {
        return `
            <div class="validation-section">
                <div class="section-header">
                    <h4>✅ Configuration Validation</h4>
                    <button id="validate-current" class="primary-button">
                        🔍 Validate Current Configuration
                    </button>
                </div>
                <p>Validate your configuration for errors and get improvement suggestions.</p>
                
                <div id="validation-results" class="validation-results hidden">
                    <!-- Validation results will appear here -->
                </div>

                <div class="validation-info">
                    <h5>What We Validate</h5>
                    <ul>
                        <li>Configuration schema compliance</li>
                        <li>Required fields and data types</li>
                        <li>Provider-specific settings</li>
                        <li>Performance and security recommendations</li>
                        <li>Cross-section compatibility</li>
                    </ul>
                </div>
            </div>
        `;
    }
    /**
     * Render templates list
     */
    renderTemplatesList() {
        if (this.templates.length === 0) {
            return `
                <div class="empty-state">
                    <p>No templates available. Create your first template or load presets.</p>
                    <button id="load-presets" class="secondary-button">Load Default Presets</button>
                </div>
            `;
        }
        return this.templates.map(template => `
            <div class="template-card ${template.category}">
                <div class="template-header">
                    <h6>${template.name}</h6>
                    <span class="template-category">${template.category.toUpperCase()}</span>
                </div>
                <div class="template-description">${template.description}</div>
                <div class="template-tags">
                    ${template.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="template-actions">
                    <button class="apply-template" data-template-id="${template.id}">
                        Apply
                    </button>
                    <button class="view-template" data-template-id="${template.id}">
                        View
                    </button>
                    ${template.category === 'custom' ? `
                        <button class="delete-template" data-template-id="${template.id}">
                            Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    /**
     * Render backups list
     */
    renderBackupsList() {
        if (this.backups.length === 0) {
            return `
                <div class="empty-state">
                    <p>No backups available. Create your first backup to get started.</p>
                </div>
            `;
        }
        return this.backups.map(backup => `
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-name">${backup.name}</div>
                    <div class="backup-meta">
                        <span class="backup-date">${new Date(backup.timestamp).toLocaleString()}</span>
                        <span class="backup-reason ${backup.metadata.reason}">${backup.metadata.reason.toUpperCase()}</span>
                    </div>
                    ${backup.metadata.description ? `
                        <div class="backup-description">${backup.metadata.description}</div>
                    ` : ''}
                </div>
                <div class="backup-actions">
                    <button class="restore-backup" data-backup-id="${backup.id}">
                        🔄 Restore
                    </button>
                    <button class="delete-backup" data-backup-id="${backup.id}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Tab switching
        this.container.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('tab-button')) {
                const tab = target.dataset.tab;
                this.switchTab(tab);
            }
        });
        // Import/Export actions
        this.setupImportExportListeners();
        // Template actions
        this.setupTemplateListeners();
        // Backup actions
        this.setupBackupListeners();
        // Validation actions
        this.setupValidationListeners();
    }
    /**
     * Set up import/export event listeners
     */
    setupImportExportListeners() {
        const exportButton = this.container.querySelector('#export-config');
        const importButton = this.container.querySelector('#import-config');
        const fileInput = this.container.querySelector('#config-file-input');
        const exportTemplateButton = this.container.querySelector('#export-template');
        const importPresetButton = this.container.querySelector('#import-preset');
        exportButton?.addEventListener('click', () => this.exportConfiguration());
        importButton?.addEventListener('click', () => fileInput?.click());
        exportTemplateButton?.addEventListener('click', () => this.saveAsTemplate());
        importPresetButton?.addEventListener('click', () => this.showPresetDialog());
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                this.importConfiguration(file);
            }
        });
    }
    /**
     * Set up template event listeners
     */
    setupTemplateListeners() {
        this.container.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('apply-template')) {
                const templateId = target.dataset.templateId;
                if (templateId)
                    this.applyTemplate(templateId);
            }
            if (target.classList.contains('view-template')) {
                const templateId = target.dataset.templateId;
                if (templateId)
                    this.viewTemplate(templateId);
            }
            if (target.classList.contains('delete-template')) {
                const templateId = target.dataset.templateId;
                if (templateId)
                    this.deleteTemplate(templateId);
            }
        });
        const refreshButton = this.container.querySelector('#refresh-templates');
        const createButton = this.container.querySelector('#create-template');
        const loadPresetsButton = this.container.querySelector('#load-presets');
        refreshButton?.addEventListener('click', () => this.loadTemplates());
        createButton?.addEventListener('click', () => this.createTemplate());
        loadPresetsButton?.addEventListener('click', () => this.loadPresets());
    }
    /**
     * Set up backup event listeners
     */
    setupBackupListeners() {
        this.container.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('restore-backup')) {
                const backupId = target.dataset.backupId;
                if (backupId)
                    this.restoreBackup(backupId);
            }
            if (target.classList.contains('delete-backup')) {
                const backupId = target.dataset.backupId;
                if (backupId)
                    this.deleteBackup(backupId);
            }
        });
        const createButton = this.container.querySelector('#create-backup');
        const cleanupButton = this.container.querySelector('#cleanup-backups');
        const refreshButton = this.container.querySelector('#refresh-backups');
        createButton?.addEventListener('click', () => this.createBackup());
        cleanupButton?.addEventListener('click', () => this.cleanupBackups());
        refreshButton?.addEventListener('click', () => this.loadBackups());
    }
    /**
     * Set up validation event listeners
     */
    setupValidationListeners() {
        const validateButton = this.container.querySelector('#validate-current');
        validateButton?.addEventListener('click', () => this.validateConfiguration());
    }
    /**
     * Set up message handlers for extension communication
     */
    setupMessageHandlers() {
        vscodeApi_1.vscodeApi.onMessage('configurationTemplates', (event) => {
            this.templates = event.data;
            this.updateTemplatesDisplay();
        });
        vscodeApi_1.vscodeApi.onMessage('configurationBackups', (event) => {
            this.backups = event.data;
            this.updateBackupsDisplay();
        });
        vscodeApi_1.vscodeApi.onMessage('validationResult', (event) => {
            this.displayValidationResults(event.data);
        });
        vscodeApi_1.vscodeApi.onMessage('configurationOperationResult', (event) => {
            this.handleOperationResult(event.data);
        });
    }
    /**
     * Load initial data
     */
    async loadInitialData() {
        this.loadTemplates();
        this.loadBackups();
    }
    /**
     * Switch between tabs
     */
    switchTab(tab) {
        // Update tab buttons
        this.container.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        this.container.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
        // Update tab content
        this.container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        this.container.querySelector(`#${tab}-tab`)?.classList.add('active');
        this.currentTab = tab;
    }
    /**
     * Export configuration
     */
    exportConfiguration() {
        const includeSecrets = this.container.querySelector('#include-secrets')?.checked || false;
        const minify = this.container.querySelector('#minify-json')?.checked || false;
        const validate = this.container.querySelector('#validate-export')?.checked || true;
        vscodeApi_1.vscodeApi.postMessage({
            command: 'exportConfiguration',
            options: {
                includeSecrets,
                minify,
                validate
            }
        });
    }
    /**
     * Import configuration
     */
    importConfiguration(file) {
        const validate = this.container.querySelector('#validate-import')?.checked || true;
        const backup = this.container.querySelector('#backup-before-import')?.checked || true;
        const merge = this.container.querySelector('#merge-config')?.checked || false;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const configData = JSON.parse(e.target?.result);
                vscodeApi_1.vscodeApi.postMessage({
                    command: 'importConfiguration',
                    configData,
                    options: {
                        validate,
                        backup,
                        merge
                    }
                });
            }
            catch (error) {
                this.showStatus('error', 'Invalid JSON file');
            }
        };
        reader.readAsText(file);
    }
    /**
     * Load templates
     */
    loadTemplates() {
        vscodeApi_1.vscodeApi.postMessage({
            command: 'getConfigurationTemplates'
        });
    }
    /**
     * Load backups
     */
    loadBackups() {
        vscodeApi_1.vscodeApi.postMessage({
            command: 'getConfigurationBackups'
        });
    }
    /**
     * Validate configuration
     */
    validateConfiguration() {
        vscodeApi_1.vscodeApi.postMessage({
            command: 'validateConfiguration'
        });
    }
    /**
     * Apply template
     */
    applyTemplate(templateId) {
        vscodeApi_1.vscodeApi.postMessage({
            command: 'applyConfigurationTemplate',
            templateId
        });
    }
    /**
     * Create backup
     */
    createBackup() {
        vscodeApi_1.vscodeApi.postMessage({
            command: 'createConfigurationBackup',
            reason: 'manual',
            description: 'Manual backup created by user'
        });
    }
    /**
     * Restore backup
     */
    restoreBackup(backupId) {
        if (confirm('Are you sure you want to restore this backup? This will replace your current configuration.')) {
            vscodeApi_1.vscodeApi.postMessage({
                command: 'restoreConfigurationBackup',
                backupId
            });
        }
    }
    /**
     * Helper methods for UI updates
     */
    updateTemplatesDisplay() {
        const templatesGrid = this.container.querySelector('#templates-grid');
        if (templatesGrid) {
            templatesGrid.innerHTML = this.renderTemplatesList();
        }
    }
    updateBackupsDisplay() {
        const backupsList = this.container.querySelector('#backups-list');
        if (backupsList) {
            backupsList.innerHTML = this.renderBackupsList();
        }
    }
    displayValidationResults(result) {
        const resultsContainer = this.container.querySelector('#validation-results');
        if (!resultsContainer)
            return;
        resultsContainer.innerHTML = `
            <div class="validation-summary ${result.isValid ? 'valid' : 'invalid'}">
                <h5>${result.isValid ? '✅ Configuration Valid' : '❌ Configuration Invalid'}</h5>
                <p>${result.errors.length} errors, ${result.warnings.length} warnings</p>
            </div>
            
            ${result.errors.length > 0 ? `
                <div class="validation-errors">
                    <h6>Errors</h6>
                    ${result.errors.map(error => `
                        <div class="validation-item error">
                            <strong>${error.path}</strong>: ${error.message}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${result.warnings.length > 0 ? `
                <div class="validation-warnings">
                    <h6>Warnings</h6>
                    ${result.warnings.map(warning => `
                        <div class="validation-item warning">
                            <strong>${warning.path}</strong>: ${warning.message}
                            ${warning.suggestion ? `<br><em>Suggestion: ${warning.suggestion}</em>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
        resultsContainer.classList.remove('hidden');
    }
    handleOperationResult(result) {
        this.showStatus(result.success ? 'success' : 'error', result.message);
        // Refresh data if needed
        if (result.success && result.type === 'template') {
            this.loadTemplates();
        }
        else if (result.success && result.type === 'backup') {
            this.loadBackups();
        }
    }
    showStatus(type, message) {
        const statusSection = this.container.querySelector('#import-export-status');
        if (statusSection) {
            statusSection.innerHTML = `
                <div class="status-message ${type}">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'} ${message}
                </div>
            `;
            statusSection.classList.remove('hidden');
            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusSection.classList.add('hidden');
            }, 5000);
        }
    }
    // Placeholder methods for additional functionality
    saveAsTemplate() {
        // Implementation for saving current config as template
        vscodeApi_1.vscodeApi.postMessage({ command: 'saveConfigurationAsTemplate' });
    }
    showPresetDialog() {
        // Implementation for showing preset selection dialog
        vscodeApi_1.vscodeApi.postMessage({ command: 'showConfigurationPresets' });
    }
    viewTemplate(templateId) {
        // Implementation for viewing template details
        vscodeApi_1.vscodeApi.postMessage({ command: 'viewConfigurationTemplate', templateId });
    }
    deleteTemplate(templateId) {
        if (confirm('Are you sure you want to delete this template?')) {
            vscodeApi_1.vscodeApi.postMessage({ command: 'deleteConfigurationTemplate', templateId });
        }
    }
    deleteBackup(backupId) {
        if (confirm('Are you sure you want to delete this backup?')) {
            vscodeApi_1.vscodeApi.postMessage({ command: 'deleteConfigurationBackup', backupId });
        }
    }
    createTemplate() {
        // Implementation for creating new template
        vscodeApi_1.vscodeApi.postMessage({ command: 'createConfigurationTemplate' });
    }
    loadPresets() {
        // Implementation for loading default presets
        vscodeApi_1.vscodeApi.postMessage({ command: 'loadConfigurationPresets' });
    }
    cleanupBackups() {
        if (confirm('This will remove old backups (keeping the 10 most recent). Continue?')) {
            vscodeApi_1.vscodeApi.postMessage({ command: 'cleanupConfigurationBackups' });
        }
    }
    /**
     * Cleanup component
     */
    dispose() {
        // Remove event listeners if needed
    }
}
exports.ConfigurationManagementComponent = ConfigurationManagementComponent;
// CSS styles for ConfigurationManagement component
exports.configurationManagementStyles = `
.config-management {
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    margin-bottom: 20px;
    background-color: var(--vscode-sideBar-background);
}

.config-header {
    text-align: center;
    margin-bottom: 20px;
}

.config-header h3 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
}

.config-header p {
    margin: 0;
    color: var(--vscode-descriptionForeground);
    font-size: 14px;
}

.config-tabs {
    display: flex;
    border-bottom: 1px solid var(--vscode-panel-border);
    margin-bottom: 20px;
}

.tab-button {
    padding: 10px 16px;
    border: none;
    background: none;
    color: var(--vscode-foreground);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    font-family: inherit;
    font-size: 14px;
    transition: all 0.2s ease;
}

.tab-button:hover {
    background-color: var(--vscode-toolbar-hoverBackground);
}

.tab-button.active {
    color: var(--vscode-textLink-foreground);
    border-bottom-color: var(--vscode-textLink-foreground);
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

.section-group {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
}

.section-group h4 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
    font-size: 16px;
}

.section-group p {
    margin: 0 0 15px 0;
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.section-header h4 {
    margin: 0;
    color: var(--vscode-textLink-foreground);
}

.icon-button {
    padding: 6px;
    border: none;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border-radius: 3px;
    cursor: pointer;
    font-size: 14px;
}

.icon-button:hover {
    background: var(--vscode-button-secondaryHoverBackground);
}

.checkbox-label {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--vscode-foreground);
    cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
    margin-right: 8px;
}

.export-actions,
.import-actions,
.template-actions,
.backup-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.primary-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.primary-button:hover {
    background-color: var(--vscode-button-hoverBackground);
}

.secondary-button {
    padding: 8px 16px;
    border: 1px solid var(--vscode-button-border);
    border-radius: 4px;
    background-color: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.secondary-button:hover {
    background-color: var(--vscode-button-secondaryHoverBackground);
}

.status-section {
    margin-top: 20px;
    padding: 15px;
    border-radius: 4px;
}

.status-section.hidden {
    display: none;
}

.status-message {
    padding: 10px;
    border-radius: 4px;
    font-size: 13px;
}

.status-message.success {
    background-color: var(--vscode-charts-green);
    color: white;
}

.status-message.error {
    background-color: var(--vscode-charts-red);
    color: white;
}

.status-message.warning {
    background-color: var(--vscode-charts-orange);
    color: white;
}

.templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.template-card {
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
}

.template-card.development {
    border-left: 3px solid var(--vscode-charts-blue);
}

.template-card.production {
    border-left: 3px solid var(--vscode-charts-red);
}

.template-card.team {
    border-left: 3px solid var(--vscode-charts-green);
}

.template-card.custom {
    border-left: 3px solid var(--vscode-charts-purple);
}

.template-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.template-header h6 {
    margin: 0;
    color: var(--vscode-textLink-foreground);
    font-size: 14px;
}

.template-category {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 2px;
    background-color: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
}

.template-description {
    color: var(--vscode-foreground);
    font-size: 12px;
    margin-bottom: 10px;
    line-height: 1.4;
}

.template-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 10px;
}

.tag {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 2px;
    background-color: var(--vscode-textCodeBlock-background);
    color: var(--vscode-foreground);
}

.template-actions {
    display: flex;
    gap: 6px;
}

.template-actions button {
    padding: 4px 8px;
    border: none;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
}

.apply-template {
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
}

.view-template {
    background-color: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
}

.delete-template {
    background-color: var(--vscode-charts-red);
    color: white;
}

.backups-list {
    margin-top: 20px;
}

.backup-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    margin-bottom: 10px;
    background-color: var(--vscode-editor-background);
}

.backup-info {
    flex: 1;
}

.backup-name {
    font-weight: 500;
    color: var(--vscode-foreground);
    margin-bottom: 4px;
}

.backup-meta {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 4px;
}

.backup-date {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
}

.backup-reason {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 2px;
    font-weight: bold;
}

.backup-reason.manual {
    background-color: var(--vscode-charts-blue);
    color: white;
}

.backup-reason.auto {
    background-color: var(--vscode-charts-green);
    color: white;
}

.backup-reason.migration {
    background-color: var(--vscode-charts-orange);
    color: white;
}

.backup-description {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    font-style: italic;
}

.backup-actions {
    display: flex;
    gap: 6px;
}

.backup-actions button {
    padding: 4px 8px;
    border: none;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
}

.restore-backup {
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
}

.delete-backup {
    background-color: var(--vscode-charts-red);
    color: white;
}

.validation-results {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
}

.validation-results.hidden {
    display: none;
}

.validation-summary {
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 15px;
}

.validation-summary.valid {
    background-color: var(--vscode-charts-green);
    color: white;
}

.validation-summary.invalid {
    background-color: var(--vscode-charts-red);
    color: white;
}

.validation-summary h5 {
    margin: 0 0 5px 0;
}

.validation-summary p {
    margin: 0;
    font-size: 13px;
}

.validation-errors,
.validation-warnings {
    margin-bottom: 15px;
}

.validation-errors h6,
.validation-warnings h6 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
}

.validation-item {
    padding: 8px;
    border-radius: 3px;
    margin-bottom: 6px;
    font-size: 12px;
}

.validation-item.error {
    background-color: var(--vscode-inputValidation-errorBackground);
    border-left: 3px solid var(--vscode-charts-red);
}

.validation-item.warning {
    background-color: var(--vscode-inputValidation-warningBackground);
    border-left: 3px solid var(--vscode-charts-orange);
}

.validation-info {
    margin-top: 20px;
    padding: 15px;
    background-color: var(--vscode-textCodeBlock-background);
    border-radius: 4px;
}

.validation-info h5 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
}

.validation-info ul {
    margin: 0;
    padding-left: 20px;
    color: var(--vscode-foreground);
}

.validation-info li {
    margin-bottom: 4px;
    font-size: 13px;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--vscode-descriptionForeground);
}

.empty-state p {
    margin-bottom: 15px;
}
`;
//# sourceMappingURL=ConfigurationManagement.js.map