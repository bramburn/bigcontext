/**
 * Embedding Provider Service
 * 
 * This service handles embedding generation for the RAG for LLM VS Code extension.
 * It supports multiple embedding providers (OpenAI, Mimic Embed) and provides
 * a unified interface for generating embeddings from text content.
 * 
 * The service handles provider configuration, connection testing, batch processing,
 * and error handling for embedding generation operations.
 */

import * as vscode from 'vscode';
import { EmbeddingModelSettings, EmbeddingSettingsValidation } from '../models/embeddingSettings';

/**
 * Embedding generation result
 */
export interface EmbeddingResult {
  /** Generated embedding vector */
  embedding: number[];
  
  /** Input text that was embedded */
  text: string;
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Token count (if available) */
  tokenCount?: number;
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  /** Array of embedding vectors */
  embeddings: number[][];
  
  /** Input texts that were embedded */
  texts: string[];
  
  /** Total processing time in milliseconds */
  totalProcessingTime: number;
  
  /** Individual processing times */
  individualTimes: number[];
  
  /** Total token count (if available) */
  totalTokens?: number;
  
  /** Success status */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Provider connection test result
 */
export interface ConnectionTestResult {
  /** Whether connection was successful */
  success: boolean;
  
  /** Response time in milliseconds */
  responseTime: number;
  
  /** Error message if failed */
  error?: string;
  
  /** Provider-specific details */
  details?: {
    modelName?: string;
    dimensions?: number;
    maxTokens?: number;
  };
}

/**
 * Abstract base class for embedding providers
 */
abstract class BaseEmbeddingProvider {
  protected settings: EmbeddingModelSettings;
  
  constructor(settings: EmbeddingModelSettings) {
    this.settings = settings;
  }
  
  abstract generateEmbedding(text: string): Promise<EmbeddingResult>;
  abstract generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult>;
  abstract testConnection(): Promise<ConnectionTestResult>;
  abstract getModelName(): string;
  abstract getDimensions(): number;
  abstract getMaxTokens(): number;
}

/**
 * OpenAI embedding provider
 */
class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  private readonly baseUrl = 'https://api.openai.com/v1/embeddings';
  
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest([text]);
      const endTime = Date.now();
      
      if (response.data && response.data.length > 0) {
        return {
          embedding: response.data[0].embedding,
          text,
          processingTime: endTime - startTime,
          tokenCount: response.usage?.total_tokens,
        };
      }
      
      throw new Error('No embedding data received from OpenAI');
      
    } catch (error) {
      throw new Error(`OpenAI embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    
    try {
      // Process in batches to avoid API limits
      const batchSize = 100; // OpenAI limit
      const allEmbeddings: number[][] = [];
      const individualTimes: number[] = [];
      let totalTokens = 0;
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchStartTime = Date.now();
        
        const response = await this.makeRequest(batch);
        const batchEndTime = Date.now();
        
        if (response.data) {
          allEmbeddings.push(...response.data.map((item: any) => item.embedding));
          individualTimes.push(...batch.map(() => batchEndTime - batchStartTime));
          totalTokens += response.usage?.total_tokens || 0;
        }
      }
      
      const endTime = Date.now();
      
      return {
        embeddings: allEmbeddings,
        texts,
        totalProcessingTime: endTime - startTime,
        individualTimes,
        totalTokens,
        success: true,
      };
      
    } catch (error) {
      return {
        embeddings: [],
        texts,
        totalProcessingTime: Date.now() - startTime,
        individualTimes: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(['test']);
      const endTime = Date.now();
      
      return {
        success: true,
        responseTime: endTime - startTime,
        details: {
          modelName: this.settings.modelName,
          dimensions: response.data?.[0]?.embedding?.length || 1536,
          maxTokens: 8191, // OpenAI default
        },
      };
      
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  private async makeRequest(texts: string[]): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
        model: this.settings.modelName || 'text-embedding-ada-002',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    return response.json();
  }
  
  getModelName(): string {
    return this.settings.modelName || 'text-embedding-ada-002';
  }
  
  getDimensions(): number {
    // OpenAI embedding dimensions by model
    const modelDimensions: Record<string, number> = {
      'text-embedding-ada-002': 1536,
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
    };
    
    return modelDimensions[this.getModelName()] || 1536;
  }
  
  getMaxTokens(): number {
    return 8191; // OpenAI default
  }
}

/**
 * Mimic Embed provider
 */
class MimicEmbedProvider extends BaseEmbeddingProvider {
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest([text]);
      const endTime = Date.now();
      
      if (response.embeddings && response.embeddings.length > 0) {
        return {
          embedding: response.embeddings[0],
          text,
          processingTime: endTime - startTime,
        };
      }
      
      throw new Error('No embedding data received from Mimic Embed');
      
    } catch (error) {
      throw new Error(`Mimic Embed generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(texts);
      const endTime = Date.now();
      
      if (response.embeddings) {
        return {
          embeddings: response.embeddings,
          texts,
          totalProcessingTime: endTime - startTime,
          individualTimes: texts.map(() => endTime - startTime),
          success: true,
        };
      }
      
      throw new Error('No embedding data received from Mimic Embed');
      
    } catch (error) {
      return {
        embeddings: [],
        texts,
        totalProcessingTime: Date.now() - startTime,
        individualTimes: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(['test']);
      const endTime = Date.now();
      
      return {
        success: true,
        responseTime: endTime - startTime,
        details: {
          modelName: this.settings.modelName,
          dimensions: response.embeddings?.[0]?.length || 384,
        },
      };
      
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  private async makeRequest(texts: string[]): Promise<any> {
    if (!this.settings.endpoint) {
      throw new Error('Mimic Embed endpoint not configured');
    }
    
    const response = await fetch(`${this.settings.endpoint}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        model: this.settings.modelName,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Mimic Embed API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }
    
    return response.json();
  }
  
  getModelName(): string {
    return this.settings.modelName || 'mimic-embed';
  }
  
  getDimensions(): number {
    return 384; // Default Mimic Embed dimensions
  }
  
  getMaxTokens(): number {
    return 512; // Default Mimic Embed token limit
  }
}

/**
 * EmbeddingProvider Class
 * 
 * Main service class that provides a unified interface for embedding generation
 * across different providers. Handles provider selection, configuration,
 * and delegation to the appropriate provider implementation.
 */
export class EmbeddingProvider {
  /** VS Code extension context */
  private context: vscode.ExtensionContext;
  
  /** Current provider instance */
  private provider: BaseEmbeddingProvider | undefined;
  
  /** Current settings */
  private settings: EmbeddingModelSettings | undefined;
  
  /**
   * Creates a new EmbeddingProvider instance
   * 
   * @param context VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }
  
  /**
   * Initialize provider with settings
   * 
   * @param settings Embedding model settings
   */
  public async initialize(settings: EmbeddingModelSettings): Promise<void> {
    this.settings = settings;
    
    switch (settings.provider) {
      case 'OpenAI':
        this.provider = new OpenAIEmbeddingProvider(settings);
        break;
      case 'Mimic Embed':
        this.provider = new MimicEmbedProvider(settings);
        break;
      default:
        throw new Error(`Unsupported embedding provider: ${settings.provider}`);
    }
  }
  
  /**
   * Generate embedding for single text
   * 
   * @param text Text to embed
   * @returns Embedding result
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    if (!this.provider) {
      throw new Error('Embedding provider not initialized');
    }
    
    const result = await this.provider.generateEmbedding(text);
    return result.embedding;
  }
  
  /**
   * Generate embeddings for multiple texts
   * 
   * @param texts Texts to embed
   * @returns Array of embedding vectors
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.provider) {
      throw new Error('Embedding provider not initialized');
    }
    
    const result = await this.provider.generateEmbeddings(texts);
    
    if (!result.success) {
      throw new Error(`Batch embedding generation failed: ${result.error}`);
    }
    
    return result.embeddings;
  }
  
  /**
   * Test connection to embedding provider
   * 
   * @returns Connection test result
   */
  public async testConnection(): Promise<ConnectionTestResult> {
    if (!this.provider) {
      throw new Error('Embedding provider not initialized');
    }
    
    return this.provider.testConnection();
  }
  
  /**
   * Get current model name
   * 
   * @returns Model name
   */
  public getModelName(): string {
    if (!this.provider) {
      return 'unknown';
    }
    
    return this.provider.getModelName();
  }
  
  /**
   * Get embedding dimensions
   * 
   * @returns Number of dimensions
   */
  public getDimensions(): number {
    if (!this.provider) {
      return 0;
    }
    
    return this.provider.getDimensions();
  }
  
  /**
   * Get maximum token limit
   * 
   * @returns Maximum tokens
   */
  public getMaxTokens(): number {
    if (!this.provider) {
      return 0;
    }
    
    return this.provider.getMaxTokens();
  }
  
  /**
   * Check if provider is initialized
   * 
   * @returns True if initialized
   */
  public isInitialized(): boolean {
    return this.provider !== undefined;
  }
  
  /**
   * Get current provider name
   * 
   * @returns Provider name
   */
  public getProviderName(): string {
    return this.settings?.provider || 'unknown';
  }
}
