/**
 * SystemValidation Component
 * 
 * Displays system validation results and provides access to troubleshooting guides.
 * Shows pre-flight checks, system requirements, and interactive problem resolution.
 */

import { vscodeApi } from '../vscodeApi';

export interface ValidationResult {
    isValid: boolean;
    category: 'docker' | 'network' | 'system' | 'ports';
    check: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: string;
    fixSuggestion?: string;
    autoFixAvailable?: boolean;
}

export interface SystemValidationReport {
    overallStatus: 'pass' | 'warning' | 'fail';
    results: ValidationResult[];
    summary: {
        passed: number;
        warnings: number;
        failed: number;
    };
}

export interface TroubleshootingGuide {
    id: string;
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    estimatedTime: string;
}

export class SystemValidationComponent {
    private container: HTMLElement;
    private runValidationButton: HTMLButtonElement | null = null;
    private validationResults: HTMLElement | null = null;
    private troubleshootingSection: HTMLElement | null = null;
    private currentReport: SystemValidationReport | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.setupMessageHandlers();
    }

    /**
     * Render the system validation UI
     */
    private render(): void {
        this.container.innerHTML = `
            <div class="system-validation">
                <div class="validation-header">
                    <h3>System Validation</h3>
                    <p>Check your system for compatibility and resolve any issues before setup.</p>
                    <button id="run-validation" class="validation-button">
                        <span class="button-icon">🔍</span>
                        Run System Check
                    </button>
                </div>

                <div id="validation-results" class="validation-results hidden">
                    <!-- Validation results will be inserted here -->
                </div>

                <div id="troubleshooting-section" class="troubleshooting-section hidden">
                    <h4>Recommended Troubleshooting Guides</h4>
                    <div id="troubleshooting-guides" class="troubleshooting-guides">
                        <!-- Troubleshooting guides will be inserted here -->
                    </div>
                </div>

                <div class="validation-info">
                    <h4>What We Check</h4>
                    <div class="check-categories">
                        <div class="check-category">
                            <h5>🐳 Docker</h5>
                            <ul>
                                <li>Docker installation and version</li>
                                <li>Docker daemon status</li>
                                <li>Container runtime availability</li>
                            </ul>
                        </div>
                        <div class="check-category">
                            <h5>🌐 Network</h5>
                            <ul>
                                <li>Internet connectivity</li>
                                <li>API endpoint accessibility</li>
                                <li>Proxy and firewall settings</li>
                            </ul>
                        </div>
                        <div class="check-category">
                            <h5>💻 System</h5>
                            <ul>
                                <li>Available memory and disk space</li>
                                <li>Node.js version compatibility</li>
                                <li>Operating system requirements</li>
                            </ul>
                        </div>
                        <div class="check-category">
                            <h5>🔌 Ports</h5>
                            <ul>
                                <li>Port availability for services</li>
                                <li>Conflict detection and resolution</li>
                                <li>Service binding capabilities</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Get references to elements
        this.runValidationButton = this.container.querySelector('#run-validation') as HTMLButtonElement;
        this.validationResults = this.container.querySelector('#validation-results') as HTMLElement;
        this.troubleshootingSection = this.container.querySelector('#troubleshooting-section') as HTMLElement;
    }

    /**
     * Set up event listeners
     */
    private setupEventListeners(): void {
        if (this.runValidationButton) {
            this.runValidationButton.addEventListener('click', () => {
                this.runSystemValidation();
            });
        }
    }

    /**
     * Set up message handlers for extension communication
     */
    private setupMessageHandlers(): void {
        vscodeApi.onMessage('validationResults', (event) => {
            this.displayValidationResults(event.data);
        });

        vscodeApi.onMessage('troubleshootingGuides', (event) => {
            this.displayTroubleshootingGuides(event.data);
        });
    }

    /**
     * Run system validation
     */
    private async runSystemValidation(): Promise<void> {
        if (!this.runValidationButton) return;

        // Update button state
        this.runValidationButton.disabled = true;
        this.runValidationButton.innerHTML = '<span class="button-icon">⏳</span> Running Checks...';

        // Hide previous results
        if (this.validationResults) {
            this.validationResults.classList.add('hidden');
        }
        if (this.troubleshootingSection) {
            this.troubleshootingSection.classList.add('hidden');
        }

        try {
            // Send validation request to extension
            vscodeApi.postMessage({
                command: 'runSystemValidation'
            });

        } catch (error) {
            console.error('Failed to run system validation:', error);
            this.showError('Failed to run system validation. Please try again.');
        } finally {
            // Reset button state
            this.runValidationButton.disabled = false;
            this.runValidationButton.innerHTML = '<span class="button-icon">🔍</span> Run System Check';
        }
    }

    /**
     * Display validation results
     */
    private displayValidationResults(report: SystemValidationReport): void {
        if (!this.validationResults) return;

        this.currentReport = report;

        // Create results HTML
        const resultsHTML = `
            <div class="validation-summary">
                <div class="summary-header">
                    <h4>Validation Results</h4>
                    <div class="overall-status ${report.overallStatus}">
                        ${this.getStatusIcon(report.overallStatus)} ${this.getStatusText(report.overallStatus)}
                    </div>
                </div>
                <div class="summary-stats">
                    <div class="stat passed">
                        <span class="stat-number">${report.summary.passed}</span>
                        <span class="stat-label">Passed</span>
                    </div>
                    <div class="stat warnings">
                        <span class="stat-number">${report.summary.warnings}</span>
                        <span class="stat-label">Warnings</span>
                    </div>
                    <div class="stat failed">
                        <span class="stat-number">${report.summary.failed}</span>
                        <span class="stat-label">Failed</span>
                    </div>
                </div>
            </div>

            <div class="validation-details">
                ${this.renderValidationDetails(report.results)}
            </div>
        `;

        this.validationResults.innerHTML = resultsHTML;
        this.validationResults.classList.remove('hidden');

        // Set up event listeners for auto-fix buttons
        this.setupAutoFixListeners();

        // Request troubleshooting guides if there are issues
        if (report.summary.warnings > 0 || report.summary.failed > 0) {
            vscodeApi.postMessage({
                command: 'getTroubleshootingGuides',
                validationResults: report.results
            });
        }
    }

    /**
     * Render validation details
     */
    private renderValidationDetails(results: ValidationResult[]): string {
        const categories = this.groupResultsByCategory(results);
        
        return Object.entries(categories).map(([category, categoryResults]) => `
            <div class="category-section">
                <h5>${this.getCategoryIcon(category)} ${this.getCategoryTitle(category)}</h5>
                <div class="category-results">
                    ${categoryResults.map(result => this.renderValidationResult(result)).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Render individual validation result
     */
    private renderValidationResult(result: ValidationResult): string {
        return `
            <div class="validation-result ${result.status}">
                <div class="result-header">
                    <span class="result-icon">${this.getStatusIcon(result.status)}</span>
                    <span class="result-check">${result.check}</span>
                    <span class="result-status">${result.status.toUpperCase()}</span>
                </div>
                <div class="result-message">${result.message}</div>
                ${result.details ? `<div class="result-details">${result.details}</div>` : ''}
                ${result.fixSuggestion ? `
                    <div class="result-fix">
                        <span class="fix-label">💡 Suggestion:</span>
                        <span class="fix-text">${result.fixSuggestion}</span>
                        ${result.autoFixAvailable ? `
                            <button class="auto-fix-button" data-check="${result.check}">
                                Auto Fix
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Display troubleshooting guides
     */
    private displayTroubleshootingGuides(guides: TroubleshootingGuide[]): void {
        if (!this.troubleshootingSection || guides.length === 0) return;

        const guidesContainer = this.troubleshootingSection.querySelector('#troubleshooting-guides');
        if (!guidesContainer) return;

        const guidesHTML = guides.map(guide => `
            <div class="troubleshooting-guide ${guide.severity}">
                <div class="guide-header">
                    <h6>${guide.title}</h6>
                    <div class="guide-meta">
                        <span class="guide-severity ${guide.severity}">${guide.severity.toUpperCase()}</span>
                        <span class="guide-time">⏱️ ${guide.estimatedTime}</span>
                    </div>
                </div>
                <div class="guide-description">${guide.description}</div>
                <button class="guide-button" data-guide-id="${guide.id}">
                    Start Guide
                </button>
            </div>
        `).join('');

        guidesContainer.innerHTML = guidesHTML;
        this.troubleshootingSection.classList.remove('hidden');

        // Set up event listeners for guide buttons
        this.setupGuideListeners();
    }

    /**
     * Set up auto-fix button listeners
     */
    private setupAutoFixListeners(): void {
        const autoFixButtons = this.validationResults?.querySelectorAll('.auto-fix-button');
        autoFixButtons?.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const check = target.dataset.check;
                if (check) {
                    this.runAutoFix(check);
                }
            });
        });
    }

    /**
     * Set up troubleshooting guide button listeners
     */
    private setupGuideListeners(): void {
        const guideButtons = this.troubleshootingSection?.querySelectorAll('.guide-button');
        guideButtons?.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const guideId = target.dataset.guideId;
                if (guideId) {
                    this.openTroubleshootingGuide(guideId);
                }
            });
        });
    }

    /**
     * Run auto-fix for a specific check
     */
    private async runAutoFix(check: string): Promise<void> {
        vscodeApi.postMessage({
            command: 'runAutoFix',
            check: check
        });
    }

    /**
     * Open troubleshooting guide
     */
    private openTroubleshootingGuide(guideId: string): void {
        vscodeApi.postMessage({
            command: 'openTroubleshootingGuide',
            guideId: guideId
        });
    }

    /**
     * Helper methods
     */
    private groupResultsByCategory(results: ValidationResult[]): Record<string, ValidationResult[]> {
        return results.reduce((groups, result) => {
            if (!groups[result.category]) {
                groups[result.category] = [];
            }
            groups[result.category].push(result);
            return groups;
        }, {} as Record<string, ValidationResult[]>);
    }

    private getStatusIcon(status: string): string {
        switch (status) {
            case 'pass': return '✅';
            case 'warning': return '⚠️';
            case 'fail': return '❌';
            default: return '❓';
        }
    }

    private getStatusText(status: string): string {
        switch (status) {
            case 'pass': return 'All Checks Passed';
            case 'warning': return 'Issues Found';
            case 'fail': return 'Critical Issues';
            default: return 'Unknown Status';
        }
    }

    private getCategoryIcon(category: string): string {
        switch (category) {
            case 'docker': return '🐳';
            case 'network': return '🌐';
            case 'system': return '💻';
            case 'ports': return '🔌';
            default: return '📋';
        }
    }

    private getCategoryTitle(category: string): string {
        switch (category) {
            case 'docker': return 'Docker';
            case 'network': return 'Network';
            case 'system': return 'System';
            case 'ports': return 'Ports';
            default: return category.charAt(0).toUpperCase() + category.slice(1);
        }
    }

    private showError(message: string): void {
        if (this.validationResults) {
            this.validationResults.innerHTML = `
                <div class="validation-error">
                    <span class="error-icon">❌</span>
                    <span class="error-message">${message}</span>
                </div>
            `;
            this.validationResults.classList.remove('hidden');
        }
    }

    /**
     * Cleanup component
     */
    public dispose(): void {
        // Remove event listeners if needed
    }
}

// CSS styles for SystemValidation component
export const systemValidationStyles = `
.system-validation {
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    margin-bottom: 20px;
    background-color: var(--vscode-sideBar-background);
}

.validation-header {
    text-align: center;
    margin-bottom: 20px;
}

.validation-header h3 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
}

.validation-header p {
    margin: 0 0 15px 0;
    color: var(--vscode-descriptionForeground);
    font-size: 14px;
}

.validation-button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.validation-button:hover:not(:disabled) {
    background-color: var(--vscode-button-hoverBackground);
}

.validation-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.validation-results {
    margin-bottom: 20px;
}

.validation-results.hidden,
.troubleshooting-section.hidden {
    display: none;
}

.validation-summary {
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    margin-bottom: 15px;
    background-color: var(--vscode-editor-background);
}

.summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.summary-header h4 {
    margin: 0;
    color: var(--vscode-textLink-foreground);
}

.overall-status {
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 13px;
}

.overall-status.pass {
    background-color: var(--vscode-charts-green);
    color: white;
}

.overall-status.warning {
    background-color: var(--vscode-charts-orange);
    color: white;
}

.overall-status.fail {
    background-color: var(--vscode-charts-red);
    color: white;
}

.summary-stats {
    display: flex;
    gap: 20px;
    justify-content: center;
}

.stat {
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 4px;
}

.stat.passed .stat-number {
    color: var(--vscode-charts-green);
}

.stat.warnings .stat-number {
    color: var(--vscode-charts-orange);
}

.stat.failed .stat-number {
    color: var(--vscode-charts-red);
}

.stat-label {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
}

.category-section {
    margin-bottom: 20px;
}

.category-section h5 {
    margin: 0 0 10px 0;
    color: var(--vscode-textLink-foreground);
    font-size: 14px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--vscode-panel-border);
}

.validation-result {
    padding: 12px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    margin-bottom: 8px;
    background-color: var(--vscode-editor-background);
}

.validation-result.pass {
    border-left: 3px solid var(--vscode-charts-green);
}

.validation-result.warning {
    border-left: 3px solid var(--vscode-charts-orange);
}

.validation-result.fail {
    border-left: 3px solid var(--vscode-charts-red);
}

.result-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.result-check {
    flex: 1;
    font-weight: 500;
    color: var(--vscode-foreground);
}

.result-status {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 2px;
    background-color: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
}

.result-message {
    color: var(--vscode-foreground);
    font-size: 13px;
    margin-bottom: 4px;
}

.result-details {
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    font-family: var(--vscode-editor-font-family);
    margin-bottom: 8px;
}

.result-fix {
    padding: 8px;
    background-color: var(--vscode-textCodeBlock-background);
    border-radius: 3px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.fix-label {
    font-weight: 500;
    color: var(--vscode-textLink-foreground);
}

.fix-text {
    flex: 1;
    color: var(--vscode-foreground);
}

.auto-fix-button {
    padding: 4px 8px;
    border: 1px solid var(--vscode-button-border);
    border-radius: 3px;
    background-color: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    font-size: 11px;
    cursor: pointer;
}

.auto-fix-button:hover {
    background-color: var(--vscode-button-secondaryHoverBackground);
}

.troubleshooting-section {
    margin-top: 20px;
}

.troubleshooting-section h4 {
    margin: 0 0 15px 0;
    color: var(--vscode-textLink-foreground);
}

.troubleshooting-guide {
    padding: 15px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    margin-bottom: 10px;
    background-color: var(--vscode-editor-background);
}

.troubleshooting-guide.critical {
    border-left: 3px solid var(--vscode-charts-red);
}

.troubleshooting-guide.high {
    border-left: 3px solid var(--vscode-charts-orange);
}

.troubleshooting-guide.medium {
    border-left: 3px solid var(--vscode-charts-yellow);
}

.troubleshooting-guide.low {
    border-left: 3px solid var(--vscode-charts-blue);
}

.guide-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.guide-header h6 {
    margin: 0;
    color: var(--vscode-textLink-foreground);
    font-size: 14px;
}

.guide-meta {
    display: flex;
    gap: 8px;
    align-items: center;
}

.guide-severity {
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 2px;
    font-weight: bold;
}

.guide-severity.critical {
    background-color: var(--vscode-charts-red);
    color: white;
}

.guide-severity.high {
    background-color: var(--vscode-charts-orange);
    color: white;
}

.guide-severity.medium {
    background-color: var(--vscode-charts-yellow);
    color: black;
}

.guide-severity.low {
    background-color: var(--vscode-charts-blue);
    color: white;
}

.guide-time {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
}

.guide-description {
    color: var(--vscode-foreground);
    font-size: 13px;
    margin-bottom: 10px;
}

.guide-button {
    padding: 6px 12px;
    border: none;
    border-radius: 3px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    font-size: 12px;
    cursor: pointer;
}

.guide-button:hover {
    background-color: var(--vscode-button-hoverBackground);
}

.validation-info {
    margin-top: 20px;
    padding: 15px;
    background-color: var(--vscode-textCodeBlock-background);
    border-radius: 4px;
}

.validation-info h4 {
    margin: 0 0 15px 0;
    color: var(--vscode-textLink-foreground);
}

.check-categories {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.check-category h5 {
    margin: 0 0 8px 0;
    color: var(--vscode-textLink-foreground);
    font-size: 13px;
}

.check-category ul {
    margin: 0;
    padding-left: 16px;
    color: var(--vscode-foreground);
}

.check-category li {
    font-size: 12px;
    margin-bottom: 3px;
}

.validation-error {
    padding: 15px;
    border: 1px solid var(--vscode-inputValidation-errorBorder);
    border-radius: 4px;
    background-color: var(--vscode-inputValidation-errorBackground);
    color: var(--vscode-inputValidation-errorForeground);
    display: flex;
    align-items: center;
    gap: 8px;
}
`;
