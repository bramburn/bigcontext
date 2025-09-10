/**
 * Configuration Change Detector
 * 
 * This service detects configuration changes that require re-indexing
 * and provides a centralized way to handle configuration change events.
 * 
 * Based on specifications in:
 * - specs/002-for-the-next/spec.md (FR-003, FR-004)
 * - specs/002-for-the-next/data-model.md
 */

import * as vscode from 'vscode';
import { ConfigurationChangeEvent } from '../types/indexing';
import { ConfigService } from '../configService';

/**
 * Configuration sections that require re-indexing when changed
 */
const REINDEX_REQUIRED_SECTIONS = [
    'code-context-engine.embeddingProvider',
    'code-context-engine.ollamaModel',
    'code-context-engine.ollamaApiUrl',
    'code-context-engine.openaiModel',
    'code-context-engine.openaiApiKey',
    'code-context-engine.databaseConnectionString',
    'code-context-engine.qdrantCollection',
    'code-context-engine.indexingChunkSize',
    'code-context-engine.indexingChunkOverlap'
];

/**
 * Configuration sections that don't require re-indexing
 */
const NO_REINDEX_SECTIONS = [
    'code-context-engine.maxSearchResults',
    'code-context-engine.minSimilarityThreshold',
    'code-context-engine.enableDebugLogging',
    'code-context-engine.autoIndexOnStartup',
    'code-context-engine.indexingIntensity'
];

/**
 * Configuration Change Detector Service
 * 
 * This service monitors VS Code configuration changes and determines
 * which changes require a full re-index of the workspace.
 */
export class ConfigurationChangeDetector {
    private configService: ConfigService;
    private disposables: vscode.Disposable[] = [];
    private changeListeners: ((event: ConfigurationChangeEvent) => void)[] = [];
    private previousConfig: any = {};

    constructor(configService: ConfigService) {
        this.configService = configService;
        this.previousConfig = this.captureCurrentConfig();
        this.setupConfigurationWatcher();
    }

    /**
     * Sets up the VS Code configuration change watcher
     */
    private setupConfigurationWatcher(): void {
        const watcher = vscode.workspace.onDidChangeConfiguration(event => {
            this.handleConfigurationChange(event);
        });

        this.disposables.push(watcher);
    }

    /**
     * Handles VS Code configuration change events
     */
    private async handleConfigurationChange(event: vscode.ConfigurationChangeEvent): Promise<void> {
        // Check if any of our configuration sections were affected
        const affectedSections = this.getAffectedSections(event);
        
        if (affectedSections.length === 0) {
            return;
        }

        // Refresh the config service to get latest values
        this.configService.refresh();

        // Capture new configuration
        const newConfig = this.captureCurrentConfig();

        // Generate change events for affected sections
        const changeEvents = this.generateChangeEvents(affectedSections, newConfig);

        // Update previous config
        this.previousConfig = newConfig;

        // Notify listeners
        changeEvents.forEach(changeEvent => {
            this.notifyListeners(changeEvent);
        });

        console.log(`ConfigurationChangeDetector: Detected ${changeEvents.length} configuration changes`);
    }

    /**
     * Gets the configuration sections that were affected by the change
     */
    private getAffectedSections(event: vscode.ConfigurationChangeEvent): string[] {
        const allSections = [...REINDEX_REQUIRED_SECTIONS, ...NO_REINDEX_SECTIONS];
        return allSections.filter(section => event.affectsConfiguration(section));
    }

    /**
     * Captures the current configuration state
     */
    private captureCurrentConfig(): any {
        const ollamaConfig = this.configService.getOllamaConfig();
        const openaiConfig = this.configService.getOpenAIConfig();
        const indexingConfig = this.configService.getIndexingConfig();

        return {
            embeddingProvider: this.configService.getEmbeddingProvider(),
            ollamaModel: ollamaConfig.model,
            ollamaApiUrl: ollamaConfig.apiUrl,
            openaiModel: openaiConfig.model,
            openaiApiKey: openaiConfig.apiKey,
            databaseConnectionString: this.configService.getQdrantConnectionString(),
            qdrantCollection: 'default', // Default collection name
            indexingChunkSize: indexingConfig.chunkSize,
            indexingChunkOverlap: indexingConfig.chunkOverlap,
            maxSearchResults: this.configService.getMaxSearchResults(),
            minSimilarityThreshold: this.configService.getMinSimilarityThreshold(),
            enableDebugLogging: this.configService.getEnableDebugLogging(),
            autoIndexOnStartup: this.configService.getAutoIndexOnStartup(),
            indexingIntensity: this.configService.getIndexingIntensity()
        };
    }

    /**
     * Generates configuration change events for affected sections
     */
    private generateChangeEvents(affectedSections: string[], newConfig: any): ConfigurationChangeEvent[] {
        const changeEvents: ConfigurationChangeEvent[] = [];

        affectedSections.forEach(section => {
            const requiresReindex = REINDEX_REQUIRED_SECTIONS.includes(section);
            
            const changeEvent: ConfigurationChangeEvent = {
                section,
                requiresReindex,
                timestamp: Date.now()
            };

            changeEvents.push(changeEvent);
        });

        return changeEvents;
    }

    /**
     * Notifies all change listeners
     */
    private notifyListeners(event: ConfigurationChangeEvent): void {
        this.changeListeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('ConfigurationChangeDetector: Error in change listener:', error);
            }
        });
    }

    /**
     * Adds a configuration change listener
     */
    public onConfigurationChange(listener: (event: ConfigurationChangeEvent) => void): vscode.Disposable {
        this.changeListeners.push(listener);
        
        return new vscode.Disposable(() => {
            const index = this.changeListeners.indexOf(listener);
            if (index >= 0) {
                this.changeListeners.splice(index, 1);
            }
        });
    }

    /**
     * Manually detects configuration changes (for testing or manual triggers)
     */
    public detectConfigChanges(): ConfigurationChangeEvent[] {
        const currentConfig = this.captureCurrentConfig();
        const changes: ConfigurationChangeEvent[] = [];

        // Compare current config with previous config
        Object.keys(currentConfig).forEach(key => {
            if (currentConfig[key] !== this.previousConfig[key]) {
                const section = this.mapConfigKeyToSection(key);
                if (section) {
                    const requiresReindex = REINDEX_REQUIRED_SECTIONS.includes(section);
                    
                    changes.push({
                        section,
                        requiresReindex,
                        timestamp: Date.now()
                    });
                }
            }
        });

        return changes;
    }

    /**
     * Maps configuration keys to their corresponding VS Code configuration sections
     */
    private mapConfigKeyToSection(key: string): string | null {
        const keyToSectionMap: Record<string, string> = {
            'embeddingProvider': 'code-context-engine.embeddingProvider',
            'ollamaModel': 'code-context-engine.ollamaModel',
            'ollamaApiUrl': 'code-context-engine.ollamaApiUrl',
            'openaiModel': 'code-context-engine.openaiModel',
            'openaiApiKey': 'code-context-engine.openaiApiKey',
            'databaseConnectionString': 'code-context-engine.databaseConnectionString',
            'qdrantCollection': 'code-context-engine.qdrantCollection',
            'indexingChunkSize': 'code-context-engine.indexingChunkSize',
            'indexingChunkOverlap': 'code-context-engine.indexingChunkOverlap',
            'maxSearchResults': 'code-context-engine.maxSearchResults',
            'minSimilarityThreshold': 'code-context-engine.minSimilarityThreshold',
            'enableDebugLogging': 'code-context-engine.enableDebugLogging',
            'autoIndexOnStartup': 'code-context-engine.autoIndexOnStartup',
            'indexingIntensity': 'code-context-engine.indexingIntensity'
        };

        return keyToSectionMap[key] || null;
    }

    /**
     * Checks if a specific configuration section requires re-indexing
     */
    public doesSectionRequireReindex(section: string): boolean {
        return REINDEX_REQUIRED_SECTIONS.includes(section);
    }

    /**
     * Gets all configuration sections that require re-indexing
     */
    public getReindexRequiredSections(): string[] {
        return [...REINDEX_REQUIRED_SECTIONS];
    }

    /**
     * Gets all configuration sections that don't require re-indexing
     */
    public getNoReindexSections(): string[] {
        return [...NO_REINDEX_SECTIONS];
    }

    /**
     * Disposes of the service and cleans up resources
     */
    public dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables.length = 0;
        this.changeListeners.length = 0;
    }
}
