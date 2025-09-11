/**
 * Settings Service
 *
 * This service manages extension settings for the RAG for LLM VS Code extension.
 * It provides a centralized interface for reading, writing, and validating
 * embedding model and Qdrant database settings.
 *
 * The service follows the existing patterns in the codebase and integrates
 * with VS Code's configuration system while providing type-safe access
 * to all settings defined in the API contracts.
 */

import * as vscode from 'vscode';
import {
  EmbeddingSettings,
  EmbeddingModelSettings,
  EmbeddingSettingsValidation,
} from '../models/embeddingSettings';
import {
  QdrantSettings,
  QdrantDatabaseSettings,
  QdrantSettingsValidation,
} from '../models/qdrantSettings';

/**
 * Complete extension settings interface
 *
 * This interface represents the full settings structure as defined
 * in the API contracts for GET/POST /settings endpoints.
 */
export interface ExtensionSettings {
  /** Embedding model configuration */
  embeddingModel: EmbeddingModelSettings;

  /** Qdrant database configuration */
  qdrantDatabase: QdrantDatabaseSettings;
}

/**
 * Settings validation result
 */
export interface SettingsValidationResult {
  /** Whether all settings are valid */
  isValid: boolean;

  /** Validation errors */
  errors: string[];

  /** Warning messages */
  warnings: string[];

  /** Embedding model validation details */
  embeddingValidation?: EmbeddingSettingsValidation;

  /** Qdrant database validation details */
  qdrantValidation?: QdrantSettingsValidation;
}

/**
 * Settings save result
 */
export interface SettingsSaveResult {
  /** Whether the save operation was successful */
  success: boolean;

  /** Result message */
  message: string;

  /** Validation errors (if any) */
  errors?: string[];
}

/**
 * SettingsService Class
 *
 * Provides centralized management of extension settings including:
 * - Reading settings from VS Code configuration
 * - Writing settings to VS Code configuration
 * - Validating settings before saving
 * - Providing default values
 * - Type-safe access to all configuration values
 */
export class SettingsService {
  /** VS Code extension context */
  private context: vscode.ExtensionContext;

  /** Configuration section name */
  private readonly configSection = 'rag-for-llm';

  /** Current cached configuration */
  private config: vscode.WorkspaceConfiguration;

  /**
   * Creates a new SettingsService instance
   *
   * @param context VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.config = vscode.workspace.getConfiguration(this.configSection);

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(this.onConfigurationChanged.bind(this));
  }

  /**
   * Get current extension settings
   *
   * Retrieves the current embedding model and Qdrant database settings
   * from VS Code configuration, providing defaults where necessary.
   *
   * @returns Current extension settings
   */
  public getSettings(): ExtensionSettings {
    const embeddingModel = this.getEmbeddingModelSettings();
    const qdrantDatabase = this.getQdrantDatabaseSettings();

    return {
      embeddingModel,
      qdrantDatabase,
    };
  }

  /**
   * Save extension settings
   *
   * Validates and saves the provided settings to VS Code configuration.
   * Performs validation before saving and returns detailed results.
   *
   * @param settings Settings to save
   * @returns Save operation result
   */
  public async saveSettings(settings: ExtensionSettings): Promise<SettingsSaveResult> {
    try {
      // Validate settings before saving
      const validation = this.validateSettings(settings);

      if (!validation.isValid) {
        return {
          success: false,
          message: 'Settings validation failed',
          errors: validation.errors,
        };
      }

      // Save embedding model settings
      await this.config.update(
        'embeddingModel',
        settings.embeddingModel,
        vscode.ConfigurationTarget.Workspace
      );

      // Save Qdrant database settings
      await this.config.update(
        'qdrantDatabase',
        settings.qdrantDatabase,
        vscode.ConfigurationTarget.Workspace
      );

      // Refresh cached configuration
      this.refresh();

      return {
        success: true,
        message: 'Settings saved successfully',
      };
    } catch (error) {
      console.error('SettingsService: Failed to save settings:', error);
      return {
        success: false,
        message: `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate extension settings
   *
   * Performs comprehensive validation of embedding model and Qdrant database settings.
   *
   * @param settings Settings to validate
   * @returns Validation result
   */
  public validateSettings(settings: ExtensionSettings): SettingsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate embedding model settings
    const embeddingValidation = this.validateEmbeddingSettings(settings.embeddingModel);
    if (!embeddingValidation.isValid) {
      errors.push(...embeddingValidation.errors);
    }
    warnings.push(...embeddingValidation.warnings);

    // Validate Qdrant database settings
    const qdrantValidation = this.validateQdrantSettings(settings.qdrantDatabase);
    if (!qdrantValidation.isValid) {
      errors.push(...qdrantValidation.errors);
    }
    warnings.push(...qdrantValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      embeddingValidation,
      qdrantValidation,
    };
  }

  /**
   * Check if settings are configured
   *
   * Determines whether the extension has been properly configured
   * with valid embedding model and database settings.
   *
   * @returns True if settings are configured
   */
  public isConfigured(): boolean {
    const settings = this.getSettings();
    const validation = this.validateSettings(settings);
    return validation.isValid;
  }

  /**
   * Reset settings to defaults
   *
   * Clears all current settings and resets to default values.
   */
  public async resetToDefaults(): Promise<void> {
    await this.config.update('embeddingModel', undefined, vscode.ConfigurationTarget.Workspace);
    await this.config.update('qdrantDatabase', undefined, vscode.ConfigurationTarget.Workspace);
    this.refresh();
  }

  /**
   * Refresh configuration from VS Code settings
   *
   * Call this method when configuration might have changed to ensure
   * the service has the latest values.
   */
  public refresh(): void {
    this.config = vscode.workspace.getConfiguration(this.configSection);
  }

  /**
   * Get embedding model settings
   *
   * @returns Current embedding model settings with defaults
   */
  private getEmbeddingModelSettings(): EmbeddingModelSettings {
    const embeddingModel = this.config.get<EmbeddingModelSettings>('embeddingModel');

    if (!embeddingModel) {
      // Return default settings
      return {
        provider: 'OpenAI',
        apiKey: '',
        modelName: 'text-embedding-ada-002',
      };
    }

    return embeddingModel;
  }

  /**
   * Get Qdrant database settings
   *
   * @returns Current Qdrant database settings with defaults
   */
  private getQdrantDatabaseSettings(): QdrantDatabaseSettings {
    const qdrantDatabase = this.config.get<QdrantDatabaseSettings>('qdrantDatabase');

    if (!qdrantDatabase) {
      // Return default settings
      return {
        host: 'localhost',
        port: 6333,
        collectionName: 'code-embeddings',
      };
    }

    return qdrantDatabase;
  }

  /**
   * Validate embedding model settings
   *
   * @param settings Embedding model settings to validate
   * @returns Validation result
   */
  private validateEmbeddingSettings(settings: EmbeddingModelSettings): EmbeddingSettingsValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate provider
    if (!settings.provider) {
      errors.push('Embedding provider is required');
    } else if (!['Nomic Embed', 'OpenAI'].includes(settings.provider)) {
      errors.push('Invalid embedding provider. Must be "Nomic Embed" or "OpenAI"');
    }

    // Validate API key
    if (!settings.apiKey || settings.apiKey.trim().length === 0) {
      errors.push('API key is required');
    } else if (settings.apiKey.length < 10) {
      warnings.push('API key seems too short');
    }

    // Provider-specific validation
    if (settings.provider === 'Nomic Embed' && !settings.endpoint) {
      errors.push('Endpoint is required for Nomic Embed provider');
    }

    if (settings.provider === 'OpenAI' && settings.apiKey && !settings.apiKey.startsWith('sk-')) {
      warnings.push('OpenAI API keys typically start with "sk-"');
    }

    // Validate endpoint URL format
    if (settings.endpoint) {
      try {
        new URL(settings.endpoint);
      } catch {
        errors.push('Invalid endpoint URL format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate Qdrant database settings
   *
   * @param settings Qdrant database settings to validate
   * @returns Validation result
   */
  private validateQdrantSettings(settings: QdrantDatabaseSettings): QdrantSettingsValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate host
    if (!settings.host || settings.host.trim().length === 0) {
      errors.push('Qdrant host is required');
    }

    // Validate port
    if (settings.port !== undefined) {
      if (settings.port < 1 || settings.port > 65535) {
        errors.push('Port must be between 1 and 65535');
      }
    }

    // Validate collection name
    if (!settings.collectionName || settings.collectionName.trim().length === 0) {
      errors.push('Collection name is required');
    } else {
      // Check for valid characters
      if (!/^[a-zA-Z0-9_-]+$/.test(settings.collectionName)) {
        errors.push('Collection name can only contain letters, numbers, hyphens, and underscores');
      }

      if (settings.collectionName.length > 255) {
        errors.push('Collection name must be 255 characters or less');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Handle configuration changes
   *
   * @param event Configuration change event
   */
  private onConfigurationChanged(event: vscode.ConfigurationChangeEvent): void {
    if (event.affectsConfiguration(this.configSection)) {
      this.refresh();
      console.log('SettingsService: Configuration changed, refreshed settings');
    }
  }
}
