import * as vscode from 'vscode';
import { ConfigService } from './configService';

/**
 * Configuration validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration change event
 */
export interface ConfigurationChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

/**
 * Configuration preset for quick setup
 */
export interface ConfigurationPreset {
  name: string;
  description: string;
  settings: Record<string, any>;
}

/**
 * ConfigurationManager class responsible for advanced configuration management.
 *
 * This class provides enhanced configuration capabilities including:
 * - Configuration validation and error checking
 * - Configuration presets and templates
 * - Change tracking and history
 * - Import/export functionality
 * - Real-time configuration updates
 */
export class ConfigurationManager {
  private configService: ConfigService;
  private changeListeners: ((event: ConfigurationChangeEvent) => void)[] = [];
  private configurationWatcher: vscode.Disposable | undefined;

  /**
   * Creates a new ConfigurationManager instance
   * @param configService - The ConfigService instance
   */
  constructor(configService: ConfigService) {
    this.configService = configService;
    this.setupConfigurationWatcher();
  }

  /**
   * Validates the current configuration
   * @returns Validation result with errors and warnings
   */
  async validateConfiguration(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Validate database configuration
      const dbConfig = this.configService.getDatabaseConfig();
      if (!dbConfig.connectionString) {
        result.errors.push('Database connection string is required');
        result.isValid = false;
      } else {
        try {
          new URL(dbConfig.connectionString);
        } catch {
          result.errors.push('Invalid database connection string format');
          result.isValid = false;
        }
      }

      // Validate embedding provider configuration
      const embeddingProvider = this.configService.getEmbeddingProvider();
      const isProviderConfigured = this.configService.isProviderConfigured(embeddingProvider);

      if (!isProviderConfigured) {
        if (embeddingProvider === 'openai') {
          const openaiConfig = this.configService.getOpenAIConfig();
          if (!openaiConfig.apiKey) {
            result.errors.push('OpenAI API key is required when using OpenAI provider');
            result.isValid = false;
          }
        } else if (embeddingProvider === 'ollama') {
          const ollamaConfig = this.configService.getOllamaConfig();
          if (!ollamaConfig.apiUrl) {
            result.errors.push('Ollama API URL is required when using Ollama provider');
            result.isValid = false;
          }
        }
      }

      // Validate indexing configuration
      const indexingConfig = this.configService.getIndexingConfig();
      if (indexingConfig.chunkSize !== undefined && indexingConfig.chunkSize <= 0) {
        result.errors.push('Chunk size must be greater than 0');
        result.isValid = false;
      }

      if (indexingConfig.chunkOverlap !== undefined && indexingConfig.chunkOverlap < 0) {
        result.errors.push('Chunk overlap cannot be negative');
        result.isValid = false;
      }

      if (
        indexingConfig.chunkOverlap !== undefined &&
        indexingConfig.chunkSize !== undefined &&
        indexingConfig.chunkOverlap >= indexingConfig.chunkSize
      ) {
        result.warnings.push('Chunk overlap should be smaller than chunk size');
      }

      // Check for performance warnings
      if (indexingConfig.chunkSize !== undefined && indexingConfig.chunkSize > 2000) {
        result.warnings.push('Large chunk size may impact performance');
      }

      const openaiConfig = this.configService.getOpenAIConfig();
      if (openaiConfig.maxBatchSize !== undefined && openaiConfig.maxBatchSize > 100) {
        result.warnings.push('Large batch size may hit API rate limits');
      }
    } catch (error) {
      result.errors.push(
        `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      result.isValid = false;
    }

    return result;
  }

  /**
   * Gets available configuration presets
   * @returns Array of configuration presets
   */
  getConfigurationPresets(): ConfigurationPreset[] {
    return [
      {
        name: 'Local Development',
        description: 'Optimized for local development with Ollama',
        settings: {
          'code-context-engine.embeddingProvider': 'ollama',
          'code-context-engine.ollama.apiUrl': 'http://localhost:11434',
          'code-context-engine.ollama.model': 'nomic-embed-text',
          'code-context-engine.databaseConnectionString': 'http://localhost:6333',
          'code-context-engine.indexing.chunkSize': 1000,
          'code-context-engine.indexing.chunkOverlap': 200,
        },
      },
      {
        name: 'Cloud Production',
        description: 'Optimized for production use with OpenAI',
        settings: {
          'code-context-engine.embeddingProvider': 'openai',
          'code-context-engine.openai.model': 'text-embedding-ada-002',
          'code-context-engine.openai.maxBatchSize': 50,
          'code-context-engine.indexing.chunkSize': 1500,
          'code-context-engine.indexing.chunkOverlap': 300,
        },
      },
      {
        name: 'Performance Optimized',
        description: 'Optimized for large codebases',
        settings: {
          'code-context-engine.indexing.chunkSize': 800,
          'code-context-engine.indexing.chunkOverlap': 100,
          'code-context-engine.indexing.maxFileSize': 2097152, // 2MB
          'code-context-engine.ollama.maxBatchSize': 5,
          'code-context-engine.openai.maxBatchSize': 20,
        },
      },
      {
        name: 'Minimal Setup',
        description: 'Minimal configuration for quick testing',
        settings: {
          'code-context-engine.embeddingProvider': 'ollama',
          'code-context-engine.indexing.chunkSize': 500,
          'code-context-engine.indexing.chunkOverlap': 50,
          'code-context-engine.indexing.excludePatterns': [
            '**/node_modules/**',
            '**/dist/**',
            '**/.git/**',
          ],
        },
      },
    ];
  }

  /**
   * Applies a configuration preset
   * @param presetName - Name of the preset to apply
   * @returns Promise resolving when preset is applied
   */
  async applyPreset(presetName: string): Promise<void> {
    const preset = this.getConfigurationPresets().find(p => p.name === presetName);
    if (!preset) {
      throw new Error(`Configuration preset '${presetName}' not found`);
    }

    const config = vscode.workspace.getConfiguration();

    for (const [key, value] of Object.entries(preset.settings)) {
      await config.update(key, value, vscode.ConfigurationTarget.Workspace);
    }

    // Refresh the config service
    this.configService.refresh();

    console.log(`ConfigurationManager: Applied preset '${presetName}'`);
  }

  /**
   * Exports current configuration to a JSON object
   * @returns Configuration export object
   */
  exportConfiguration(): Record<string, any> {
    const fullConfig = this.configService.getFullConfig();

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      configuration: {
        database: fullConfig.database,
        embeddingProvider: fullConfig.embeddingProvider,
        ollama: fullConfig.ollama,
        openai: {
          ...fullConfig.openai,
          apiKey: fullConfig.openai.apiKey ? '[REDACTED]' : '',
        },
        indexing: fullConfig.indexing,
      },
    };
  }

  /**
   * Imports configuration from a JSON object
   * @param configData - Configuration data to import
   * @returns Promise resolving when configuration is imported
   */
  async importConfiguration(configData: any): Promise<void> {
    if (!configData.configuration) {
      throw new Error('Invalid configuration format');
    }

    const config = vscode.workspace.getConfiguration();
    const settings = configData.configuration;

    // Import database settings
    if (settings.database?.connectionString) {
      await config.update(
        'code-context-engine.databaseConnectionString',
        settings.database.connectionString,
        vscode.ConfigurationTarget.Workspace
      );
    }

    // Import embedding provider settings
    if (settings.embeddingProvider) {
      await config.update(
        'code-context-engine.embeddingProvider',
        settings.embeddingProvider,
        vscode.ConfigurationTarget.Workspace
      );
    }

    // Import Ollama settings
    if (settings.ollama) {
      for (const [key, value] of Object.entries(settings.ollama)) {
        await config.update(
          `code-context-engine.ollama.${key}`,
          value,
          vscode.ConfigurationTarget.Workspace
        );
      }
    }

    // Import OpenAI settings (excluding API key for security)
    if (settings.openai) {
      for (const [key, value] of Object.entries(settings.openai)) {
        if (key !== 'apiKey') {
          await config.update(
            `code-context-engine.openai.${key}`,
            value,
            vscode.ConfigurationTarget.Workspace
          );
        }
      }
    }

    // Import indexing settings
    if (settings.indexing) {
      for (const [key, value] of Object.entries(settings.indexing)) {
        await config.update(
          `code-context-engine.indexing.${key}`,
          value,
          vscode.ConfigurationTarget.Workspace
        );
      }
    }

    // Refresh the config service
    this.configService.refresh();

    console.log('ConfigurationManager: Configuration imported successfully');
  }

  /**
   * Resets configuration to defaults
   * @returns Promise resolving when configuration is reset
   */
  async resetToDefaults(): Promise<void> {
    const config = vscode.workspace.getConfiguration();
    const configKeys = [
      'code-context-engine.databaseConnectionString',
      'code-context-engine.embeddingProvider',
      'code-context-engine.ollama.apiUrl',
      'code-context-engine.ollama.model',
      'code-context-engine.ollama.timeout',
      'code-context-engine.ollama.maxBatchSize',
      'code-context-engine.openai.apiKey',
      'code-context-engine.openai.model',
      'code-context-engine.openai.timeout',
      'code-context-engine.openai.maxBatchSize',
      'code-context-engine.indexing.excludePatterns',
      'code-context-engine.indexing.supportedLanguages',
      'code-context-engine.indexing.maxFileSize',
      'code-context-engine.indexing.chunkSize',
      'code-context-engine.indexing.chunkOverlap',
    ];

    for (const key of configKeys) {
      await config.update(key, undefined, vscode.ConfigurationTarget.Workspace);
    }

    // Refresh the config service
    this.configService.refresh();

    console.log('ConfigurationManager: Configuration reset to defaults');
  }

  /**
   * Adds a configuration change listener
   * @param listener - Function to call when configuration changes
   */
  onConfigurationChange(listener: (event: ConfigurationChangeEvent) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Sets up configuration watcher for real-time updates
   */
  private setupConfigurationWatcher(): void {
    this.configurationWatcher = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('code-context-engine')) {
        // Refresh the config service
        this.configService.refresh();

        // Notify listeners
        const changeEvent: ConfigurationChangeEvent = {
          key: 'code-context-engine',
          oldValue: null, // Would need to track previous values
          newValue: this.configService.getFullConfig(),
          timestamp: new Date(),
        };

        this.changeListeners.forEach(listener => {
          try {
            listener(changeEvent);
          } catch (error) {
            console.error('ConfigurationManager: Error in change listener:', error);
          }
        });

        console.log('ConfigurationManager: Configuration changed');
      }
    });
  }

  /**
   * Disposes of the ConfigurationManager and cleans up resources
   */
  dispose(): void {
    if (this.configurationWatcher) {
      this.configurationWatcher.dispose();
    }
    this.changeListeners = [];
    console.log('ConfigurationManager: Disposed');
  }
}
