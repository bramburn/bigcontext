import axios, { AxiosInstance } from 'axios';
import { IEmbeddingProvider, EmbeddingConfig } from './embeddingProvider';

export class OllamaProvider implements IEmbeddingProvider {
    private client: AxiosInstance;
    private model: string;
    private baseUrl: string;
    private maxBatchSize: number;
    private timeout: number;

    constructor(config: EmbeddingConfig) {
        this.model = config.model || 'nomic-embed-text';
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.maxBatchSize = config.maxBatchSize || 10;
        this.timeout = config.timeout || 30000;

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async generateEmbeddings(chunks: string[]): Promise<number[][]> {
        if (chunks.length === 0) {
            return [];
        }

        const embeddings: number[][] = [];
        const errors: string[] = [];

        // Process chunks in batches to avoid overwhelming the API
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
            console.warn(`Ollama embedding generation completed with ${errors.length} errors`);
        }

        return embeddings;
    }

    private async processBatch(chunks: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];

        // Ollama API typically processes one embedding at a time
        for (const chunk of chunks) {
            try {
                const response = await this.client.post('/api/embeddings', {
                    model: this.model,
                    prompt: chunk
                });

                if (response.data && response.data.embedding) {
                    embeddings.push(response.data.embedding);
                } else {
                    throw new Error('Invalid response format from Ollama API');
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                        throw new Error(`Model '${this.model}' not found. Please pull the model first: ollama pull ${this.model}`);
                    } else if (error.code === 'ECONNREFUSED') {
                        throw new Error('Cannot connect to Ollama. Please ensure Ollama is running on ' + this.baseUrl);
                    } else {
                        throw new Error(`Ollama API error: ${error.response?.data?.error || error.message}`);
                    }
                } else {
                    throw error;
                }
            }
        }

        return embeddings;
    }

    getDimensions(): number {
        // Common dimensions for popular Ollama embedding models
        const modelDimensions: Record<string, number> = {
            'nomic-embed-text': 768,
            'all-minilm': 384,
            'sentence-transformers/all-MiniLM-L6-v2': 384,
            'mxbai-embed-large': 1024
        };

        return modelDimensions[this.model] || 768; // Default to 768 if unknown
    }

    getProviderName(): string {
        return `ollama:${this.model}`;
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Check if Ollama is running
            const response = await this.client.get('/api/tags');
            
            // Check if the specific model is available
            if (response.data && response.data.models) {
                const modelExists = response.data.models.some((model: any) => 
                    model.name === this.model || model.name.startsWith(this.model + ':')
                );
                
                if (!modelExists) {
                    console.warn(`Model '${this.model}' not found in Ollama. Available models:`, 
                        response.data.models.map((m: any) => m.name));
                    return false;
                }
            }

            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
                console.error('Ollama is not running. Please start Ollama service.');
            } else {
                console.error('Failed to check Ollama availability:', error);
            }
            return false;
        }
    }

    /**
     * Get available models from Ollama
     */
    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await this.client.get('/api/tags');
            if (response.data && response.data.models) {
                return response.data.models.map((model: any) => model.name);
            }
            return [];
        } catch (error) {
            console.error('Failed to get available models:', error);
            return [];
        }
    }

    /**
     * Pull a model from Ollama registry
     */
    async pullModel(modelName: string): Promise<boolean> {
        try {
            console.log(`Pulling model '${modelName}' from Ollama...`);
            await this.client.post('/api/pull', {
                name: modelName
            });
            console.log(`Model '${modelName}' pulled successfully`);
            return true;
        } catch (error) {
            console.error(`Failed to pull model '${modelName}':`, error);
            return false;
        }
    }
}
