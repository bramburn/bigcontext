/**
 * API Service for handling provider-specific operations
 * 
 * This service handles communication with different AI providers and databases,
 * including model detection, connection testing, and configuration validation.
 */

import { PineconeConfig, QdrantConfig, ChromaConfig } from '../types';

export interface ModelInfo {
  name: string;
  size?: string;
  modified?: string;
  digest?: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaResponse {
  models: ModelInfo[];
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  latency?: number;
}

/**
 * Ollama API Service
 */
export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Check if Ollama is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  /**
   * Get list of available models
   */
  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      throw error;
    }
  }

  /**
   * Get embedding models specifically
   */
  async getEmbeddingModels(): Promise<ModelInfo[]> {
    const allModels = await this.getModels();
    
    // Filter for embedding models (models that contain 'embed' in their name)
    const embeddingModels = allModels.filter(model => 
      model.name.toLowerCase().includes('embed') ||
      model.name.toLowerCase().includes('embedding')
    );

    return embeddingModels;
  }

  /**
   * Test embedding generation with a model
   */
  async testEmbedding(model: string, text: string = 'test'): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: text,
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Failed to generate embedding: ${response.status} ${response.statusText}`,
          details: { error: errorText, model },
          latency
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully generated embedding with ${model}`,
        details: { 
          model, 
          embeddingLength: data.embedding?.length || 0,
          responseTime: latency
        },
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: { error, model },
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to pull model:', error);
      return false;
    }
  }
}

/**
 * Database connection testing utilities
 */
export class DatabaseService {
  /**
   * Test Qdrant connection
   */
  static async testQdrant(config: QdrantConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (config.apiKey) {
        headers['api-key'] = config.apiKey;
      }

      const response = await fetch(`${config.url}/collections`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          message: `Qdrant connection failed: ${response.status} ${response.statusText}`,
          latency
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Successfully connected to Qdrant',
        details: { 
          collections: data.result?.collections || [],
          version: response.headers.get('server') || 'unknown'
        },
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Test Pinecone connection
   */
  static async testPinecone(config: PineconeConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`https://${config.indexName}-${config.environment}.svc.pinecone.io/describe_index_stats`, {
        method: 'POST',
        headers: {
          'Api-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          message: `Pinecone connection failed: ${response.status} ${response.statusText}`,
          latency
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Successfully connected to Pinecone',
        details: { 
          indexStats: data,
          environment: config.environment,
          indexName: config.indexName
        },
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Test ChromaDB connection
   */
  static async testChroma(config: ChromaConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const protocol = config.ssl ? 'https' : 'http';
    const port = config.port ? `:${config.port}` : '';
    const baseUrl = `${protocol}://${config.host}${port}`;
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(`${baseUrl}/api/v1/heartbeat`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          message: `ChromaDB connection failed: ${response.status} ${response.statusText}`,
          latency
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Successfully connected to ChromaDB',
        details: { 
          heartbeat: data,
          endpoint: baseUrl
        },
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        latency: Date.now() - startTime
      };
    }
  }
}

/**
 * Recommended models for each provider
 */
export const RECOMMENDED_MODELS = {
  ollama: {
    embedding: [
      'nomic-embed-text',
      'all-minilm',
      'mxbai-embed-large',
      'snowflake-arctic-embed'
    ],
    chat: [
      'llama3.1',
      'mistral',
      'codellama',
      'phi3'
    ]
  },
  openai: {
    embedding: [
      'text-embedding-3-small',
      'text-embedding-3-large',
      'text-embedding-ada-002'
    ],
    chat: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-3.5-turbo'
    ]
  },
  anthropic: {
    chat: [
      'claude-3-5-sonnet-20241022',
      'claude-3-haiku-20240307',
      'claude-3-sonnet-20240229'
    ]
  }
};
