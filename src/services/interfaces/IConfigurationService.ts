/**
 * Configuration Service Interface
 * 
 * Defines the contract for managing application configuration,
 * including persistence and Git integration.
 */

import { Configuration, ConfigurationValidationResult } from '../../types/configuration';

/**
 * Configuration service interface
 */
export interface IConfigurationService {
  /**
   * Loads the application configuration from the persistent store.
   * If the configuration file doesn't exist, returns default configuration.
   * 
   * @returns A Promise that resolves with the loaded configuration object
   */
  loadConfiguration(): Promise<Configuration>;

  /**
   * Saves the provided configuration to the persistent store.
   * Also handles updating the .gitignore file if configured.
   * 
   * @param config The configuration object to save
   * @returns A Promise that resolves when the configuration is successfully saved
   */
  saveConfiguration(config: Configuration): Promise<void>;

  /**
   * Retrieves the current configuration settings.
   * 
   * @returns The current configuration object
   */
  getConfiguration(): Configuration;

  /**
   * Updates a specific setting within the configuration.
   * Uses dot notation for nested properties (e.g., 'qdrant.host').
   * 
   * @param key The key of the setting to update
   * @param value The new value for the setting
   * @returns A Promise that resolves when the setting is updated and saved
   */
  updateSetting(key: string, value: any): Promise<void>;

  /**
   * Validates the current configuration.
   * 
   * @param config Optional configuration to validate, defaults to current config
   * @returns Validation result with errors and warnings
   */
  validateConfiguration(config?: Configuration): ConfigurationValidationResult;

  /**
   * Checks if the Qdrant index information in the configuration is valid.
   * This includes verifying that the collection exists and the content hash matches.
   * 
   * @returns A Promise that resolves to true if the index information is valid
   */
  isQdrantIndexValid(): Promise<boolean>;

  /**
   * Updates the Qdrant index information in the configuration.
   * This should be called after a successful indexing operation.
   * 
   * @param indexInfo The new index information
   * @returns A Promise that resolves when the index info is updated
   */
  updateQdrantIndexInfo(indexInfo: {
    collectionName: string;
    lastIndexedTimestamp: string;
    contentHash: string;
  }): Promise<void>;

  /**
   * Clears the Qdrant index information from the configuration.
   * This should be called when the index becomes invalid or is deleted.
   * 
   * @returns A Promise that resolves when the index info is cleared
   */
  clearQdrantIndexInfo(): Promise<void>;

  /**
   * Gets the path to the configuration file.
   * 
   * @returns The absolute path to the .context/config.json file
   */
  getConfigurationFilePath(): string;

  /**
   * Checks if the configuration file exists.
   * 
   * @returns A Promise that resolves to true if the file exists
   */
  configurationFileExists(): Promise<boolean>;

  /**
   * Resets the configuration to default values.
   * 
   * @returns A Promise that resolves when the configuration is reset
   */
  resetToDefaults(): Promise<void>;
}

/**
 * Tree-sitter parser interface with error handling capabilities
 */
export interface ITreeSitterParser {
  /**
   * Parses a given file content using Tree-sitter.
   * 
   * @param filePath The path to the file being parsed
   * @param fileContent The content of the file
   * @param language The programming language of the file
   * @returns A Promise that resolves with the parsed AST or null if parsing failed
   */
  parse(filePath: string, fileContent: string, language: string): Promise<any | null>;

  /**
   * Checks if the parser should skip syntax errors based on configuration.
   * 
   * @returns True if syntax errors should be skipped
   */
  shouldSkipSyntaxErrors(): boolean;
}

/**
 * Git ignore manager interface
 */
export interface IGitIgnoreManager {
  /**
   * Ensures a given pattern is present in the .gitignore file.
   * Creates the .gitignore file if it doesn't exist.
   * 
   * @param pattern The pattern to add (e.g., '.context/config.json')
   * @param workspaceRoot The workspace root directory
   * @returns A Promise that resolves when the .gitignore is updated
   */
  ensurePatternPresent(pattern: string, workspaceRoot: string): Promise<void>;

  /**
   * Checks if a pattern exists in the .gitignore file.
   * 
   * @param pattern The pattern to check for
   * @param workspaceRoot The workspace root directory
   * @returns A Promise that resolves to true if the pattern exists
   */
  patternExists(pattern: string, workspaceRoot: string): Promise<boolean>;

  /**
   * Creates a .gitignore file if it doesn't exist.
   * 
   * @param workspaceRoot The workspace root directory
   * @returns A Promise that resolves when the file is created
   */
  createGitIgnoreIfNotExists(workspaceRoot: string): Promise<void>;
}
