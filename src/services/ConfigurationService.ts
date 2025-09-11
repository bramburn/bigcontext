/**
 * Configuration Service
 *
 * Manages persistent application configuration through .context/config.json file.
 * Handles loading, saving, validation, and Git integration for configuration settings.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  Configuration,
  DEFAULT_CONFIGURATION,
  ConfigurationValidationResult,
  QdrantIndexInfo,
} from '../types/configuration';
import { IConfigurationService } from './interfaces/IConfigurationService';
import { GitIgnoreManager } from './GitIgnoreManager';
import { QdrantService } from '../db/qdrantService';
import * as crypto from 'crypto';

/**
 * Implementation of the configuration service
 */
export class ConfigurationService implements IConfigurationService {
  private static readonly CONFIG_DIR = '.context';
  private static readonly CONFIG_FILENAME = 'config.json';

  private currentConfig: Configuration;
  private gitIgnoreManager: GitIgnoreManager;
  private workspaceRoot: string;
  private qdrantService?: QdrantService;

  /**
   * Creates a new configuration service instance
   *
   * @param workspaceRoot The workspace root directory
   * @param qdrantService Optional Qdrant service for index validation
   */
  constructor(workspaceRoot: string, qdrantService?: QdrantService) {
    this.workspaceRoot = workspaceRoot;
    this.currentConfig = { ...DEFAULT_CONFIGURATION };
    this.gitIgnoreManager = new GitIgnoreManager();
    this.qdrantService = qdrantService;
  }

  /**
   * Loads the application configuration from the persistent store
   */
  public async loadConfiguration(): Promise<Configuration> {
    try {
      const configPath = this.getConfigurationFilePath();

      // Check if configuration file exists
      const exists = await this.configurationFileExists();
      if (!exists) {
        console.log('ConfigurationService: Configuration file not found, using defaults');
        this.currentConfig = { ...DEFAULT_CONFIGURATION };
        return this.currentConfig;
      }

      // Read and parse configuration file
      const configContent = await fs.readFile(configPath, 'utf-8');
      const parsedConfig = JSON.parse(configContent) as Partial<Configuration>;

      // Merge with defaults to ensure all required fields are present
      this.currentConfig = this.mergeWithDefaults(parsedConfig);

      console.log('ConfigurationService: Configuration loaded successfully');
      return this.currentConfig;
    } catch (error) {
      console.error('ConfigurationService: Failed to load configuration:', error);

      // Fall back to defaults on error
      this.currentConfig = { ...DEFAULT_CONFIGURATION };

      // Show error to user
      vscode.window.showWarningMessage(
        'Failed to load configuration file. Using default settings. ' +
          'Please check the .context/config.json file for syntax errors.'
      );

      return this.currentConfig;
    }
  }

  /**
   * Saves the provided configuration to the persistent store
   */
  public async saveConfiguration(config: Configuration): Promise<void> {
    try {
      // Validate configuration before saving
      const validation = this.validateConfiguration(config);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Ensure .context directory exists
      const configDir = path.dirname(this.getConfigurationFilePath());
      await fs.mkdir(configDir, { recursive: true });

      // Save configuration file
      const configPath = this.getConfigurationFilePath();
      const configContent = JSON.stringify(config, null, 2);
      await fs.writeFile(configPath, configContent, 'utf-8');

      // Update current configuration
      this.currentConfig = { ...config };

      // Update .gitignore if configured
      if (config.git.ignoreConfig) {
        await this.gitIgnoreManager.ensureConfigPatternPresent(this.workspaceRoot);
      }

      console.log('ConfigurationService: Configuration saved successfully');
    } catch (error) {
      console.error('ConfigurationService: Failed to save configuration:', error);
      throw new Error(
        `Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Retrieves the current configuration settings
   */
  public getConfiguration(): Configuration {
    return { ...this.currentConfig };
  }

  /**
   * Updates a specific setting within the configuration
   */
  public async updateSetting(key: string, value: any): Promise<void> {
    try {
      const updatedConfig = { ...this.currentConfig };

      // Use dot notation to set nested properties
      this.setNestedProperty(updatedConfig, key, value);

      // Save the updated configuration
      await this.saveConfiguration(updatedConfig);
    } catch (error) {
      console.error(`ConfigurationService: Failed to update setting '${key}':`, error);
      throw error;
    }
  }

  /**
   * Validates the configuration
   */
  public validateConfiguration(config?: Configuration): ConfigurationValidationResult {
    const configToValidate = config || this.currentConfig;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate Qdrant configuration
    if (!configToValidate.qdrant.host || configToValidate.qdrant.host.trim() === '') {
      errors.push('Qdrant host is required');
    }

    if (
      !configToValidate.qdrant.port ||
      configToValidate.qdrant.port <= 0 ||
      configToValidate.qdrant.port > 65535
    ) {
      errors.push('Qdrant port must be a valid port number (1-65535)');
    }

    // Validate Ollama configuration
    if (!configToValidate.ollama.endpoint || configToValidate.ollama.endpoint.trim() === '') {
      errors.push('Ollama endpoint is required');
    }

    if (!configToValidate.ollama.model || configToValidate.ollama.model.trim() === '') {
      errors.push('Ollama model is required');
    }

    // Validate Ollama endpoint format
    try {
      new URL(configToValidate.ollama.endpoint);
    } catch {
      errors.push('Ollama endpoint must be a valid URL');
    }

    // Check for index info warnings
    if (!configToValidate.qdrant.indexInfo) {
      warnings.push('No Qdrant index information found - reindexing may be required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Checks if the Qdrant index information is valid
   */
  public async isQdrantIndexValid(): Promise<boolean> {
    try {
      const indexInfo = this.currentConfig.qdrant.indexInfo;
      if (!indexInfo) {
        console.log('ConfigurationService: No index info found');
        return false;
      }

      // Basic validation - check if all required fields are present
      if (!(indexInfo.collectionName && indexInfo.lastIndexedTimestamp && indexInfo.contentHash)) {
        console.log('ConfigurationService: Index info missing required fields');
        return false;
      }

      // If Qdrant service is available, validate against actual database
      if (this.qdrantService) {
        try {
          const collections = await this.qdrantService.getCollections();
          const collectionExists = collections.includes(indexInfo.collectionName);

          if (!collectionExists) {
            console.log(
              `ConfigurationService: Collection '${indexInfo.collectionName}' does not exist`
            );
            return false;
          }

          // Check if collection has points
          const collectionInfo = await this.qdrantService.getCollectionInfo(
            indexInfo.collectionName
          );
          if (!collectionInfo || (collectionInfo.points_count || 0) === 0) {
            console.log(`ConfigurationService: Collection '${indexInfo.collectionName}' is empty`);
            return false;
          }

          console.log(
            `ConfigurationService: Index validation successful for collection '${indexInfo.collectionName}'`
          );
          return true;
        } catch (error) {
          console.warn('ConfigurationService: Failed to validate index against Qdrant:', error);
          return false;
        }
      }

      // If no Qdrant service, just validate structure
      console.log('ConfigurationService: No Qdrant service available, validating structure only');
      return true;
    } catch (error) {
      console.error('ConfigurationService: Error validating Qdrant index:', error);
      return false;
    }
  }

  /**
   * Updates the Qdrant index information
   */
  public async updateQdrantIndexInfo(indexInfo: QdrantIndexInfo): Promise<void> {
    const updatedConfig = { ...this.currentConfig };
    updatedConfig.qdrant.indexInfo = { ...indexInfo };
    await this.saveConfiguration(updatedConfig);
  }

  /**
   * Clears the Qdrant index information
   */
  public async clearQdrantIndexInfo(): Promise<void> {
    const updatedConfig = { ...this.currentConfig };
    delete updatedConfig.qdrant.indexInfo;
    await this.saveConfiguration(updatedConfig);
  }

  /**
   * Gets the path to the configuration file
   */
  public getConfigurationFilePath(): string {
    return path.join(
      this.workspaceRoot,
      ConfigurationService.CONFIG_DIR,
      ConfigurationService.CONFIG_FILENAME
    );
  }

  /**
   * Checks if the configuration file exists
   */
  public async configurationFileExists(): Promise<boolean> {
    try {
      await fs.access(this.getConfigurationFilePath());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resets the configuration to default values
   */
  public async resetToDefaults(): Promise<void> {
    await this.saveConfiguration({ ...DEFAULT_CONFIGURATION });
  }

  /**
   * Merges partial configuration with defaults
   */
  private mergeWithDefaults(partial: Partial<Configuration>): Configuration {
    return {
      treeSitter: { ...DEFAULT_CONFIGURATION.treeSitter, ...partial.treeSitter },
      qdrant: { ...DEFAULT_CONFIGURATION.qdrant, ...partial.qdrant },
      ollama: { ...DEFAULT_CONFIGURATION.ollama, ...partial.ollama },
      git: { ...DEFAULT_CONFIGURATION.git, ...partial.git },
    };
  }

  /**
   * Generates a content hash for the workspace to detect changes
   *
   * @param workspaceRoot The workspace root directory
   * @returns A hash representing the current state of the workspace
   */
  public async generateContentHash(workspaceRoot?: string): Promise<string> {
    try {
      const root = workspaceRoot || this.workspaceRoot;
      const hash = crypto.createHash('sha256');

      // Get list of files to include in hash
      const files = await this.getIndexableFiles(root);

      // Sort files for consistent hashing
      files.sort();

      // Add file paths and modification times to hash
      for (const filePath of files) {
        try {
          const stats = await fs.stat(filePath);
          hash.update(`${filePath}:${stats.mtime.getTime()}`);
        } catch (error) {
          // Skip files that can't be accessed
          console.warn(`ConfigurationService: Could not stat file ${filePath}:`, error);
        }
      }

      return hash.digest('hex');
    } catch (error) {
      console.error('ConfigurationService: Failed to generate content hash:', error);
      // Return a timestamp-based hash as fallback
      return crypto.createHash('sha256').update(Date.now().toString()).digest('hex');
    }
  }

  /**
   * Checks if reindexing is needed based on content changes
   *
   * @param workspacePath Optional workspace path to check (defaults to current workspace)
   * @returns True if reindexing is needed
   */
  public async isReindexingNeeded(workspacePath?: string): Promise<boolean> {
    try {
      const indexInfo = this.currentConfig.qdrant.indexInfo;
      if (!indexInfo) {
        console.log('ConfigurationService: No index info - reindexing needed');
        return true;
      }

      // Check if index is valid first
      const isValid = await this.isQdrantIndexValid();
      if (!isValid) {
        console.log('ConfigurationService: Index is invalid - reindexing needed');
        return true;
      }

      // Generate current content hash
      const currentHash = await this.generateContentHash(workspacePath);

      // Compare with stored hash
      if (currentHash !== indexInfo.contentHash) {
        console.log('ConfigurationService: Content hash mismatch - reindexing needed');
        return true;
      }

      console.log('ConfigurationService: Content hash matches - no reindexing needed');
      return false;
    } catch (error) {
      console.error('ConfigurationService: Error checking if reindexing needed:', error);
      return true; // Default to reindexing on error
    }
  }

  /**
   * Gets a list of indexable files in the workspace
   *
   * @param workspaceRoot The workspace root directory
   * @returns Array of file paths that should be included in indexing
   */
  private async getIndexableFiles(workspaceRoot: string): Promise<string[]> {
    try {
      const files: string[] = [];
      const extensions = ['.ts', '.js', '.py', '.java', '.cs', '.cpp', '.c', '.h', '.md'];

      const walkDir = async (dir: string): Promise<void> => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip common directories that shouldn't be indexed
            if (entry.isDirectory()) {
              if (
                !['node_modules', '.git', 'dist', 'build', '.vscode', '.context'].includes(
                  entry.name
                )
              ) {
                await walkDir(fullPath);
              }
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name).toLowerCase();
              if (extensions.includes(ext)) {
                files.push(fullPath);
              }
            }
          }
        } catch (error) {
          // Skip directories that can't be accessed
          console.warn(`ConfigurationService: Could not read directory ${dir}:`, error);
        }
      };

      await walkDir(workspaceRoot);
      return files;
    } catch (error) {
      console.error('ConfigurationService: Failed to get indexable files:', error);
      return [];
    }
  }

  /**
   * Sets a nested property using dot notation
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}
