// contracts/IConfigurationService.ts

/**
 * @interface IConfigurationService
 * @description Defines the contract for managing application configuration,
 * including persistence and Git integration.
 */
export interface IConfigurationService {
  /**
   * Loads the application configuration from the persistent store.
   * @returns A Promise that resolves with the loaded configuration object.
   */
  loadConfiguration(): Promise<Configuration>;

  /**
   * Saves the provided configuration to the persistent store.
   * Also handles updating the .gitignore file.
   * @param config The configuration object to save.
   * @returns A Promise that resolves when the configuration is successfully saved.
   */
  saveConfiguration(config: Configuration): Promise<void>;

  /**
   * Retrieves the current configuration settings.
   * @returns The current configuration object.
   */
  getSettings(): Configuration;

  /**
   * Updates a specific setting within the configuration.
   * @param key The key of the setting to update (e.g., 'qdrant.host').
   * @param value The new value for the setting.
   * @returns A Promise that resolves when the setting is updated and saved.
   */
  updateSetting(key: string, value: any): Promise<void>;

  /**
   * Checks if the Qdrant index information in the configuration is valid.
   * @returns True if the index information is valid, false otherwise.
   */
  isQdrantIndexValid(): boolean;

  /**
   * Triggers the reindexing process for Qdrant.
   * @returns A Promise that resolves when reindexing is complete.
   */
  triggerReindexing(): Promise<void>;
}

/**
 * @interface ITreeSitterParser
 * @description Defines the contract for a Tree-sitter parser with error handling capabilities.
 */
export interface ITreeSitterParser {
  /**
   * Parses a given file content using Tree-sitter.
   * @param filePath The path to the file being parsed.
   * @param fileContent The content of the file.
   * @returns A Promise that resolves with the parsed AST or null if parsing failed due to unrecoverable errors.
   *          Should handle skipping syntax errors if configured.
   */
  parse(filePath: string, fileContent: string): Promise<any | null>;
}

/**
 * @interface IGitIgnoreManager
 * @description Defines the contract for managing the .gitignore file.
 */
export interface IGitIgnoreManager {
  /**
   * Ensures a given pattern is present in the .gitignore file.
   * Creates the .gitignore file if it doesn't exist.
   * @param pattern The pattern to add (e.g., '.context/config.json').
   * @returns A Promise that resolves when the .gitignore is updated.
   */
  ensurePatternPresent(pattern: string): Promise<void>;
}

// Placeholder for the full Configuration type, to be defined in data-model.md or a dedicated type file.
export type Configuration = {
  treeSitter: {
    skipSyntaxErrors: boolean;
  };
  qdrant: {
    host: string;
    port: number;
    indexInfo?: { // Optional as it might not be present or valid
      collectionName: string;
      lastIndexedTimestamp: string;
      contentHash: string;
    };
  };
  ollama: {
    model: string;
    endpoint: string;
  };
  git: {
    ignoreConfig: boolean;
  };
};
