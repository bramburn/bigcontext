/**
 * Embedding Settings Data Models
 *
 * This module defines the data models for embedding provider settings
 * based on the API contract specifications and existing codebase patterns.
 *
 * These models align with:
 * - API contracts in specs/001-we-currently-have/contracts/
 * - Existing EmbeddingConfig interfaces in the codebase
 * - Frontend types in webview-react/src/types/
 */

/**
 * Supported embedding providers
 */
export type EmbeddingProvider = 'Nomic Embed' | 'OpenAI';

/**
 * Base interface for embedding model configuration
 *
 * This interface defines the core properties required for any embedding provider
 * as specified in the API contracts.
 */
export interface EmbeddingModelSettings {
  /** The embedding service provider */
  provider: EmbeddingProvider;

  /** API key for authentication with the embedding service */
  apiKey: string;

  /** Optional custom endpoint URL for the embedding service */
  endpoint?: string;

  /** Optional specific model name to use (e.g., "text-embedding-ada-002") */
  modelName?: string;
}

/**
 * Nomic Embed specific configuration
 */
export interface MimicEmbedSettings extends EmbeddingModelSettings {
  provider: 'Nomic Embed';

  /** Nomic Embed API endpoint (required for this provider) */
  endpoint: string;

  /** Model name for Nomic Embed */
  modelName?: string;

  /** Optional timeout for API requests in milliseconds */
  timeout?: number;

  /** Optional maximum batch size for processing */
  maxBatchSize?: number;
}

/**
 * OpenAI specific configuration
 */
export interface OpenAISettings extends EmbeddingModelSettings {
  provider: 'OpenAI';

  /** OpenAI API key */
  apiKey: string;

  /** Optional OpenAI organization ID */
  organization?: string;

  /** Model name (defaults to text-embedding-ada-002) */
  modelName?: string;

  /** Optional custom endpoint (defaults to OpenAI's API) */
  endpoint?: string;

  /** Optional timeout for API requests in milliseconds */
  timeout?: number;

  /** Optional maximum batch size for processing */
  maxBatchSize?: number;

  /** Optional rate limiting configuration */
  rateLimiting?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

/**
 * Union type for provider-specific settings
 */
export type ProviderSpecificSettings = MimicEmbedSettings | OpenAISettings;

/**
 * Complete embedding settings configuration
 *
 * This interface represents the full embedding configuration including
 * provider-specific settings and common options.
 */
export interface EmbeddingSettings {
  /** Core embedding model settings */
  embeddingModel: EmbeddingModelSettings;

  /** Advanced configuration options */
  advanced?: {
    /** Enable caching of embeddings */
    caching?: {
      enabled: boolean;
      ttl: number; // Time to live in seconds
      maxSize: number; // Maximum cache size in MB
    };

    /** Retry configuration for failed requests */
    retry?: {
      maxRetries: number;
      backoffMultiplier: number;
      initialDelay: number; // Initial delay in milliseconds
    };

    /** Logging configuration */
    logging?: {
      enabled: boolean;
      level: 'debug' | 'info' | 'warn' | 'error';
      includeRequestBodies: boolean;
    };
  };
}

/**
 * Validation result for embedding settings
 */
export interface EmbeddingSettingsValidation {
  /** Whether the settings are valid */
  isValid: boolean;

  /** Validation error messages */
  errors: string[];

  /** Warning messages (non-blocking) */
  warnings: string[];

  /** Suggested improvements */
  suggestions: string[];
}

/**
 * Connection test result for embedding provider
 */
export interface EmbeddingConnectionTest {
  /** Whether the connection test was successful */
  success: boolean;

  /** Test result message */
  message: string;

  /** Response time in milliseconds */
  latency?: number;

  /** Available models from the provider */
  availableModels?: string[];

  /** Provider-specific details */
  details?: {
    version?: string;
    limits?: {
      maxTokens?: number;
      maxBatchSize?: number;
      rateLimits?: {
        requestsPerMinute: number;
        tokensPerMinute: number;
      };
    };
  };

  /** Error details if connection failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Embedding model information
 */
export interface EmbeddingModelInfo {
  /** Model identifier */
  id: string;

  /** Human-readable model name */
  name: string;

  /** Model description */
  description?: string;

  /** Embedding dimensions */
  dimensions: number;

  /** Maximum input tokens */
  maxTokens?: number;

  /** Whether this model is recommended */
  recommended?: boolean;

  /** Pricing information (if available) */
  pricing?: {
    perToken?: number;
    currency?: string;
  };
}

/**
 * Default embedding settings
 */
export const DEFAULT_EMBEDDING_SETTINGS: Partial<EmbeddingSettings> = {
  advanced: {
    caching: {
      enabled: true,
      ttl: 3600, // 1 hour
      maxSize: 100, // 100 MB
    },
    retry: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000, // 1 second
    },
    logging: {
      enabled: true,
      level: 'info',
      includeRequestBodies: false,
    },
  },
};

/**
 * Default model configurations for each provider
 */
export const DEFAULT_PROVIDER_MODELS: Record<EmbeddingProvider, string> = {
  OpenAI: 'text-embedding-ada-002',
  'Nomic Embed': 'all-MiniLM-L6-v2',
};

/**
 * Provider-specific default endpoints
 */
export const DEFAULT_PROVIDER_ENDPOINTS: Record<EmbeddingProvider, string | undefined> = {
  OpenAI: 'https://api.openai.com/v1',
  'Nomic Embed': undefined, // Must be provided by user
};
