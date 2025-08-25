/**
 * Interface for embedding providers that can generate vector embeddings from text
 */
export interface IEmbeddingProvider {
    /**
     * Generate embeddings for an array of text chunks
     * @param chunks - Array of text strings to embed
     * @returns Promise resolving to array of embedding vectors
     */
    generateEmbeddings(chunks: string[]): Promise<number[][]>;

    /**
     * Get the dimension size of embeddings produced by this provider
     * @returns The vector dimension size
     */
    getDimensions(): number;

    /**
     * Get the name/identifier of this embedding provider
     * @returns Provider name
     */
    getProviderName(): string;

    /**
     * Check if the provider is properly configured and available
     * @returns Promise resolving to true if provider is ready
     */
    isAvailable(): Promise<boolean>;
}

/**
 * Configuration for embedding providers
 */
export interface EmbeddingConfig {
    provider: 'ollama' | 'openai';
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    maxBatchSize?: number;
    timeout?: number;
}

/**
 * Result of embedding generation
 */
export interface EmbeddingResult {
    embeddings: number[][];
    totalTokens?: number;
    processingTime: number;
    errors: string[];
}

/**
 * Factory for creating embedding providers
 */
export class EmbeddingProviderFactory {
    static async createProvider(config: EmbeddingConfig): Promise<IEmbeddingProvider> {
        switch (config.provider) {
            case 'ollama':
                const { OllamaProvider } = await import('./ollamaProvider');
                return new OllamaProvider(config);
            case 'openai':
                const { OpenAIProvider } = await import('./openaiProvider');
                return new OpenAIProvider(config);
            default:
                throw new Error(`Unsupported embedding provider: ${config.provider}`);
        }
    }

    static getSupportedProviders(): string[] {
        return ['ollama', 'openai'];
    }
}
