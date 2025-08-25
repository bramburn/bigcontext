import axios, { AxiosInstance } from 'axios';
import { IEmbeddingProvider, EmbeddingConfig } from './embeddingProvider';

export class OpenAIProvider implements IEmbeddingProvider {
    private client: AxiosInstance;
    private model: string;
    private apiKey: string;
    private maxBatchSize: number;
    private timeout: number;

    constructor(config: EmbeddingConfig) {
        this.model = config.model || 'text-embedding-ada-002';
        this.apiKey = config.apiKey || '';
        this.maxBatchSize = config.maxBatchSize || 100; // OpenAI supports larger batches
        this.timeout = config.timeout || 60000; // Longer timeout for OpenAI

        if (!this.apiKey) {
            throw new Error('OpenAI API key is required. Please set it in VS Code settings.');
        }

        this.client = axios.create({
            baseURL: 'https://api.openai.com/v1',
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
    }

    async generateEmbeddings(chunks: string[]): Promise<number[][]> {
        if (chunks.length === 0) {
            return [];
        }

        const embeddings: number[][] = [];
        const errors: string[] = [];

        // Process chunks in batches
        for (let i = 0; i < chunks.length; i += this.maxBatchSize) {
            const batch = chunks.slice(i, i + this.maxBatchSize);
            
            try {
                const batchEmbeddings = await this.processBatch(batch);
                embeddings.push(...batchEmbeddings);
            } catch (error) {
                const errorMessage = `Failed to process batch ${Math.floor(i / this.maxBatchSize) + 1}: ${error instanceof Error ? error.message : String(error)}`;
                errors.push(errorMessage);
                console.error(errorMessage);
                
                // Add zero vectors for failed chunks to maintain array alignment
                for (let j = 0; j < batch.length; j++) {
                    embeddings.push(new Array(this.getDimensions()).fill(0));
                }
            }
        }

        if (errors.length > 0) {
            console.warn(`OpenAI embedding generation completed with ${errors.length} errors`);
        }

        return embeddings;
    }

    private async processBatch(chunks: string[]): Promise<number[][]> {
        try {
            const response = await this.client.post('/embeddings', {
                model: this.model,
                input: chunks,
                encoding_format: 'float'
            });

            if (response.data && response.data.data) {
                // OpenAI returns embeddings in the same order as input
                return response.data.data.map((item: any) => item.embedding);
            } else {
                throw new Error('Invalid response format from OpenAI API');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Invalid OpenAI API key. Please check your API key in VS Code settings.');
                } else if (error.response?.status === 429) {
                    throw new Error('OpenAI API rate limit exceeded. Please try again later.');
                } else if (error.response?.status === 400) {
                    const errorData = error.response.data;
                    if (errorData?.error?.code === 'invalid_request_error') {
                        throw new Error(`OpenAI API error: ${errorData.error.message}`);
                    }
                    throw new Error('Bad request to OpenAI API. Check your input data.');
                } else if (error.response?.status === 404) {
                    throw new Error(`Model '${this.model}' not found. Please check the model name.`);
                } else {
                    throw new Error(`OpenAI API error (${error.response?.status}): ${error.response?.data?.error?.message || error.message}`);
                }
            } else {
                throw error;
            }
        }
    }

    getDimensions(): number {
        // Dimensions for OpenAI embedding models
        const modelDimensions: Record<string, number> = {
            'text-embedding-ada-002': 1536,
            'text-embedding-3-small': 1536,
            'text-embedding-3-large': 3072
        };

        return modelDimensions[this.model] || 1536; // Default to ada-002 dimensions
    }

    getProviderName(): string {
        return `openai:${this.model}`;
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Test with a simple embedding request
            const response = await this.client.post('/embeddings', {
                model: this.model,
                input: 'test',
                encoding_format: 'float'
            });

            return response.status === 200 && response.data?.data?.length > 0;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    console.error('OpenAI API key is invalid or missing');
                } else if (error.response?.status === 404) {
                    console.error(`OpenAI model '${this.model}' not found`);
                } else if (error.response?.status === 429) {
                    console.warn('OpenAI API rate limit exceeded, but service is available');
                    return true; // Rate limit means the service is available
                } else {
                    console.error('OpenAI API availability check failed:', error.response?.data || error.message);
                }
            } else {
                console.error('Failed to check OpenAI availability:', error);
            }
            return false;
        }
    }

    /**
     * Get usage statistics for the last request
     */
    getLastUsage(): { prompt_tokens?: number; total_tokens?: number } {
        // This would need to be implemented to track usage from the last response
        // For now, return empty object
        return {};
    }

    /**
     * Estimate token count for text (rough approximation)
     */
    estimateTokens(text: string): number {
        // Rough approximation: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }

    /**
     * Check if text is within token limits
     */
    isWithinTokenLimit(text: string, maxTokens: number = 8191): boolean {
        return this.estimateTokens(text) <= maxTokens;
    }

    /**
     * Truncate text to fit within token limits
     */
    truncateToTokenLimit(text: string, maxTokens: number = 8191): string {
        const estimatedTokens = this.estimateTokens(text);
        if (estimatedTokens <= maxTokens) {
            return text;
        }

        // Rough truncation based on character count
        const maxChars = maxTokens * 4;
        return text.substring(0, maxChars - 3) + '...';
    }
}
