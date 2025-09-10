/**
 * Configuration Types
 * 
 * Type definitions for the persistent configuration system that manages
 * .context/config.json file and application settings.
 */

/**
 * Tree-sitter configuration
 */
export interface TreeSitterConfig {
  /** Whether to skip files with syntax errors during parsing */
  skipSyntaxErrors: boolean;
}

/**
 * Qdrant index information
 */
export interface QdrantIndexInfo {
  /** Name of the Qdrant collection */
  collectionName: string;
  /** Timestamp of the last successful indexing operation */
  lastIndexedTimestamp: string;
  /** Hash representing the content that was last indexed */
  contentHash: string;
}

/**
 * Qdrant database configuration
 */
export interface QdrantConfig {
  /** Hostname or IP address of the Qdrant instance */
  host: string;
  /** Port number of the Qdrant instance */
  port: number;
  /** Information about the Qdrant index (optional) */
  indexInfo?: QdrantIndexInfo;
}

/**
 * Ollama configuration
 */
export interface OllamaConfig {
  /** Name of the Ollama model to use for embeddings */
  model: string;
  /** URL of the Ollama API endpoint */
  endpoint: string;
}

/**
 * Git configuration
 */
export interface GitConfig {
  /** Whether to ensure .context/config.json is added to .gitignore */
  ignoreConfig: boolean;
}

/**
 * Complete application configuration
 */
export interface Configuration {
  /** Tree-sitter parsing configuration */
  treeSitter: TreeSitterConfig;
  /** Qdrant database configuration */
  qdrant: QdrantConfig;
  /** Ollama configuration */
  ollama: OllamaConfig;
  /** Git configuration */
  git: GitConfig;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIGURATION: Configuration = {
  treeSitter: {
    skipSyntaxErrors: true,
  },
  qdrant: {
    host: 'localhost',
    port: 6333,
  },
  ollama: {
    model: 'nomic-embed-text',
    endpoint: 'http://localhost:11434',
  },
  git: {
    ignoreConfig: true,
  },
};

/**
 * Configuration validation result
 */
export interface ConfigurationValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Validation errors if any */
  errors: string[];
  /** Warnings if any */
  warnings: string[];
}

/**
 * Configuration service events
 */
export interface ConfigurationEvents {
  /** Fired when configuration is loaded */
  configurationLoaded: (config: Configuration) => void;
  /** Fired when configuration is saved */
  configurationSaved: (config: Configuration) => void;
  /** Fired when configuration validation fails */
  validationFailed: (errors: string[]) => void;
}
