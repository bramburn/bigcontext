import * as vscode from 'vscode';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

/**
 * Global configuration that persists across repositories
 */
export interface GlobalConfiguration {
  // Database configuration
  qdrant: {
    connectionString: string;
    isConfigured: boolean;
    lastValidated: number;
  };

  // Embedding provider configuration
  embeddingProvider: {
    type: 'ollama' | 'openai';
    ollama?: {
      apiUrl: string;
      model: string;
      isConfigured: boolean;
      lastValidated: number;
    };
    openai?: {
      apiKey: string;
      model: string;
      isConfigured: boolean;
      lastValidated: number;
    };
  };

  // Indexing preferences
  indexing: {
    intensity: 'low' | 'medium' | 'high';
    batchSize: number;
    parallelProcessing: boolean;
    autoIndex: boolean;
  };

  // Search preferences
  search: {
    maxResults: number;
    minSimilarity: number;
    enableReranking: boolean;
  };

  // UI preferences
  ui: {
    theme: 'auto' | 'light' | 'dark';
    compactMode: boolean;
    showAdvancedOptions: boolean;
  };

  // Metadata
  version: string;
  lastUpdated: number;
  setupCompleted: boolean;
}

/**
 * Repository-specific configuration
 */
export interface RepositoryConfiguration {
  repositoryPath: string;
  collectionName: string;
  lastIndexed: number;
  indexedFileCount: number;
  indexingEnabled: boolean;
  customFilters: string[];
  excludePatterns: string[];
  includePatterns: string[];
}

/**
 * Global Configuration Manager
 *
 * Manages configuration that persists across repositories and VS Code sessions.
 * This allows users to set up their database and embedding provider once
 * and use it across all repositories.
 */
export class GlobalConfigurationManager {
  private context: vscode.ExtensionContext;
  private loggingService: CentralizedLoggingService;
  private globalConfig: GlobalConfiguration;
  private repositoryConfigs: Map<string, RepositoryConfiguration> = new Map();
  private changeListeners: Array<(config: GlobalConfiguration) => void> = [];

  private static readonly GLOBAL_CONFIG_KEY = 'bigcontext.globalConfiguration';
  private static readonly REPO_CONFIGS_KEY = 'bigcontext.repositoryConfigurations';
  private static readonly CONFIG_VERSION = '1.0.0';

  constructor(context: vscode.ExtensionContext, loggingService: CentralizedLoggingService) {
    this.context = context;
    this.loggingService = loggingService;
    this.globalConfig = this.getDefaultGlobalConfiguration();
    this.loadConfiguration();
  }

  /**
   * Get default global configuration
   */
  private getDefaultGlobalConfiguration(): GlobalConfiguration {
    return {
      qdrant: {
        connectionString: 'http://localhost:6333',
        isConfigured: false,
        lastValidated: 0,
      },
      embeddingProvider: {
        type: 'ollama',
        ollama: {
          apiUrl: 'http://localhost:11434',
          model: 'nomic-embed-text',
          isConfigured: false,
          lastValidated: 0,
        },
        openai: {
          apiKey: '',
          model: 'text-embedding-ada-002',
          isConfigured: false,
          lastValidated: 0,
        },
      },
      indexing: {
        intensity: 'medium',
        batchSize: 100,
        parallelProcessing: true,
        autoIndex: false,
      },
      search: {
        maxResults: 20,
        minSimilarity: 0.5,
        enableReranking: true,
      },
      ui: {
        theme: 'auto',
        compactMode: false,
        showAdvancedOptions: false,
      },
      version: GlobalConfigurationManager.CONFIG_VERSION,
      lastUpdated: Date.now(),
      setupCompleted: false,
    };
  }

  /**
   * Load configuration from VS Code global state
   */
  private loadConfiguration(): void {
    try {
      // Load global configuration
      const savedGlobalConfig = this.context.globalState.get<GlobalConfiguration>(
        GlobalConfigurationManager.GLOBAL_CONFIG_KEY
      );

      if (savedGlobalConfig) {
        // Merge with defaults to handle version upgrades
        this.globalConfig = this.mergeWithDefaults(savedGlobalConfig);
        this.loggingService.info(
          'Loaded global configuration',
          { setupCompleted: this.globalConfig.setupCompleted },
          'GlobalConfigurationManager'
        );
      }

      // Load repository configurations
      const savedRepoConfigs = this.context.globalState.get<
        Record<string, RepositoryConfiguration>
      >(GlobalConfigurationManager.REPO_CONFIGS_KEY);

      if (savedRepoConfigs) {
        Object.entries(savedRepoConfigs).forEach(([path, config]) => {
          this.repositoryConfigs.set(path, config);
        });

        this.loggingService.info(
          'Loaded repository configurations',
          { count: this.repositoryConfigs.size },
          'GlobalConfigurationManager'
        );
      }
    } catch (error) {
      this.loggingService.error(
        'Failed to load configuration',
        { error: error instanceof Error ? error.message : String(error) },
        'GlobalConfigurationManager'
      );
    }
  }

  /**
   * Merge saved configuration with defaults for version compatibility
   */
  private mergeWithDefaults(saved: Partial<GlobalConfiguration>): GlobalConfiguration {
    const defaults = this.getDefaultGlobalConfiguration();

    return {
      ...defaults,
      ...saved,
      qdrant: { ...defaults.qdrant, ...saved.qdrant },
      embeddingProvider: {
        ...defaults.embeddingProvider,
        ...saved.embeddingProvider,
        ollama: saved.embeddingProvider?.ollama
          ? { ...defaults.embeddingProvider.ollama, ...saved.embeddingProvider.ollama }
          : defaults.embeddingProvider.ollama,
        openai: saved.embeddingProvider?.openai
          ? { ...defaults.embeddingProvider.openai, ...saved.embeddingProvider.openai }
          : defaults.embeddingProvider.openai,
      },
      indexing: { ...defaults.indexing, ...saved.indexing },
      search: { ...defaults.search, ...saved.search },
      ui: { ...defaults.ui, ...saved.ui },
      version: GlobalConfigurationManager.CONFIG_VERSION,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Save configuration to VS Code global state
   */
  private async saveConfiguration(): Promise<void> {
    try {
      this.globalConfig.lastUpdated = Date.now();

      await this.context.globalState.update(
        GlobalConfigurationManager.GLOBAL_CONFIG_KEY,
        this.globalConfig
      );

      // Save repository configurations
      const repoConfigsObject = Object.fromEntries(this.repositoryConfigs);
      await this.context.globalState.update(
        GlobalConfigurationManager.REPO_CONFIGS_KEY,
        repoConfigsObject
      );

      this.loggingService.debug(
        'Configuration saved successfully',
        {},
        'GlobalConfigurationManager'
      );
    } catch (error) {
      this.loggingService.error(
        'Failed to save configuration',
        { error: error instanceof Error ? error.message : String(error) },
        'GlobalConfigurationManager'
      );
      throw error;
    }
  }

  /**
   * Get global configuration
   */
  public getGlobalConfiguration(): GlobalConfiguration {
    return { ...this.globalConfig };
  }

  /**
   * Update global configuration
   */
  public async updateGlobalConfiguration(updates: Partial<GlobalConfiguration>): Promise<void> {
    const oldConfig = { ...this.globalConfig };
    this.globalConfig = this.mergeWithDefaults({ ...this.globalConfig, ...updates });

    await this.saveConfiguration();

    // Notify listeners
    this.notifyConfigurationChange();

    this.loggingService.info(
      'Global configuration updated',
      { changes: Object.keys(updates) },
      'GlobalConfigurationManager'
    );
  }

  /**
   * Get repository configuration
   */
  public getRepositoryConfiguration(repositoryPath: string): RepositoryConfiguration | null {
    return this.repositoryConfigs.get(repositoryPath) || null;
  }

  /**
   * Update repository configuration
   */
  public async updateRepositoryConfiguration(
    repositoryPath: string,
    config: Partial<RepositoryConfiguration>
  ): Promise<void> {
    const existing = this.repositoryConfigs.get(repositoryPath);
    const updated: RepositoryConfiguration = {
      repositoryPath,
      collectionName: `code_context_${this.generateRepositoryId(repositoryPath)}`,
      lastIndexed: 0,
      indexedFileCount: 0,
      indexingEnabled: true,
      customFilters: [],
      excludePatterns: [],
      includePatterns: [],
      ...existing,
      ...config,
    };

    this.repositoryConfigs.set(repositoryPath, updated);
    await this.saveConfiguration();

    this.loggingService.info(
      'Repository configuration updated',
      { repositoryPath, changes: Object.keys(config) },
      'GlobalConfigurationManager'
    );
  }

  /**
   * Generate a unique ID for a repository
   */
  private generateRepositoryId(repositoryPath: string): string {
    // Simple hash function for generating repository IDs
    let hash = 0;
    for (let i = 0; i < repositoryPath.length; i++) {
      const char = repositoryPath.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if global setup is completed
   */
  public isSetupCompleted(): boolean {
    return !!(
      this.globalConfig.setupCompleted &&
      this.globalConfig.qdrant.isConfigured &&
      (this.globalConfig.embeddingProvider.ollama?.isConfigured ||
        this.globalConfig.embeddingProvider.openai?.isConfigured)
    );
  }

  /**
   * Mark setup as completed
   */
  public async markSetupCompleted(): Promise<void> {
    await this.updateGlobalConfiguration({ setupCompleted: true });
  }

  /**
   * Validate and update provider configuration
   */
  public async validateAndUpdateProvider(
    type: 'ollama' | 'openai',
    config: any,
    isValid: boolean
  ): Promise<void> {
    const updates: Partial<GlobalConfiguration> = {
      embeddingProvider: {
        ...this.globalConfig.embeddingProvider,
        type,
      },
    };

    if (type === 'ollama') {
      updates.embeddingProvider!.ollama = {
        ...this.globalConfig.embeddingProvider.ollama,
        ...config,
        isConfigured: isValid,
        lastValidated: Date.now(),
      };
    } else {
      updates.embeddingProvider!.openai = {
        ...this.globalConfig.embeddingProvider.openai,
        ...config,
        isConfigured: isValid,
        lastValidated: Date.now(),
      };
    }

    await this.updateGlobalConfiguration(updates);
  }

  /**
   * Validate and update Qdrant configuration
   */
  public async validateAndUpdateQdrant(connectionString: string, isValid: boolean): Promise<void> {
    await this.updateGlobalConfiguration({
      qdrant: {
        connectionString,
        isConfigured: isValid,
        lastValidated: Date.now(),
      },
    });
  }

  /**
   * Add configuration change listener
   */
  public onConfigurationChange(listener: (config: GlobalConfiguration) => void): vscode.Disposable {
    this.changeListeners.push(listener);

    return {
      dispose: () => {
        const index = this.changeListeners.indexOf(listener);
        if (index >= 0) {
          this.changeListeners.splice(index, 1);
        }
      },
    };
  }

  /**
   * Notify configuration change listeners
   */
  private notifyConfigurationChange(): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(this.getGlobalConfiguration());
      } catch (error) {
        this.loggingService.error(
          'Error in configuration change listener',
          { error: error instanceof Error ? error.message : String(error) },
          'GlobalConfigurationManager'
        );
      }
    });
  }

  /**
   * Reset configuration to defaults
   */
  public async resetConfiguration(): Promise<void> {
    this.globalConfig = this.getDefaultGlobalConfiguration();
    this.repositoryConfigs.clear();
    await this.saveConfiguration();
    this.notifyConfigurationChange();

    this.loggingService.info('Configuration reset to defaults', {}, 'GlobalConfigurationManager');
  }

  /**
   * Export configuration for backup
   */
  public exportConfiguration(): {
    global: GlobalConfiguration;
    repositories: Record<string, RepositoryConfiguration>;
  } {
    return {
      global: this.getGlobalConfiguration(),
      repositories: Object.fromEntries(this.repositoryConfigs),
    };
  }

  /**
   * Import configuration from backup
   */
  public async importConfiguration(data: {
    global?: Partial<GlobalConfiguration>;
    repositories?: Record<string, RepositoryConfiguration>;
  }): Promise<void> {
    if (data.global) {
      this.globalConfig = this.mergeWithDefaults(data.global);
    }

    if (data.repositories) {
      this.repositoryConfigs.clear();
      Object.entries(data.repositories).forEach(([path, config]) => {
        this.repositoryConfigs.set(path, config);
      });
    }

    await this.saveConfiguration();
    this.notifyConfigurationChange();

    this.loggingService.info(
      'Configuration imported successfully',
      { hasGlobal: !!data.global, repoCount: Object.keys(data.repositories || {}).length },
      'GlobalConfigurationManager'
    );
  }
}
