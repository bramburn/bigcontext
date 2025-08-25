import * as vscode from 'vscode';

/**
 * Configuration interfaces for different providers
 */
export interface OllamaConfig {
    apiUrl: string;
    model: string;
    timeout?: number;
    maxBatchSize?: number;
}

export interface OpenAIConfig {
    apiKey: string;
    model: string;
    timeout?: number;
    maxBatchSize?: number;
}

export interface DatabaseConfig {
    type: 'qdrant';
    connectionString: string;
}

export interface IndexingConfig {
    excludePatterns: string[];
    supportedLanguages: string[];
    maxFileSize?: number;
    chunkSize?: number;
    chunkOverlap?: number;
}

/**
 * Main extension configuration interface
 */
export interface ExtensionConfig {
    database: DatabaseConfig;
    embeddingProvider: 'ollama' | 'openai';
    ollama: OllamaConfig;
    openai: OpenAIConfig;
    indexing: IndexingConfig;
}

/**
 * Centralized configuration service for the Code Context Engine extension.
 * 
 * This service encapsulates all extension settings, providing a single source of truth
 * and preventing direct vscode.workspace.getConfiguration() calls throughout the codebase.
 * It improves testability by centralizing configuration access and makes it easier to
 * manage configuration changes.
 */
export class ConfigService {
    private config: vscode.WorkspaceConfiguration;
    private readonly configSection = 'code-context-engine';

    constructor() {
        // Load the configuration once during instantiation
        this.config = vscode.workspace.getConfiguration(this.configSection);
    }

    /**
     * Refresh configuration from VS Code settings
     * Call this when configuration might have changed
     */
    public refresh(): void {
        this.config = vscode.workspace.getConfiguration(this.configSection);
    }

    /**
     * Get the Qdrant database connection string
     */
    public getQdrantConnectionString(): string {
        return this.config.get<string>('databaseConnectionString') || 'http://localhost:6333';
    }

    /**
     * Get the database configuration
     */
    public getDatabaseConfig(): DatabaseConfig {
        return {
            type: 'qdrant',
            connectionString: this.getQdrantConnectionString()
        };
    }

    /**
     * Get the current embedding provider type
     */
    public getEmbeddingProvider(): 'ollama' | 'openai' {
        return this.config.get<'ollama' | 'openai'>('embeddingProvider') || 'ollama';
    }

    /**
     * Get Ollama configuration
     */
    public getOllamaConfig(): OllamaConfig {
        return {
            apiUrl: this.config.get<string>('ollama.apiUrl') || 'http://localhost:11434',
            model: this.config.get<string>('ollama.model') || 'nomic-embed-text',
            timeout: this.config.get<number>('ollama.timeout') || 30000,
            maxBatchSize: this.config.get<number>('ollama.maxBatchSize') || 10
        };
    }

    /**
     * Get OpenAI configuration
     */
    public getOpenAIConfig(): OpenAIConfig {
        return {
            apiKey: this.config.get<string>('openai.apiKey') || '',
            model: this.config.get<string>('openai.model') || 'text-embedding-ada-002',
            timeout: this.config.get<number>('openai.timeout') || 30000,
            maxBatchSize: this.config.get<number>('openai.maxBatchSize') || 100
        };
    }

    /**
     * Get indexing configuration
     */
    public getIndexingConfig(): IndexingConfig {
        return {
            excludePatterns: this.config.get<string[]>('indexing.excludePatterns') || [
                '**/node_modules/**',
                '**/dist/**',
                '**/build/**',
                '**/.git/**',
                '**/coverage/**'
            ],
            supportedLanguages: this.config.get<string[]>('indexing.supportedLanguages') || [
                'typescript',
                'javascript',
                'python',
                'csharp',
                'java',
                'cpp',
                'rust'
            ],
            maxFileSize: this.config.get<number>('indexing.maxFileSize') || 1024 * 1024, // 1MB
            chunkSize: this.config.get<number>('indexing.chunkSize') || 1000,
            chunkOverlap: this.config.get<number>('indexing.chunkOverlap') || 200
        };
    }

    /**
     * Get the complete extension configuration
     */
    public getFullConfig(): ExtensionConfig {
        return {
            database: this.getDatabaseConfig(),
            embeddingProvider: this.getEmbeddingProvider(),
            ollama: this.getOllamaConfig(),
            openai: this.getOpenAIConfig(),
            indexing: this.getIndexingConfig()
        };
    }

    /**
     * Check if a specific provider is properly configured
     */
    public isProviderConfigured(provider: 'ollama' | 'openai'): boolean {
        switch (provider) {
            case 'ollama':
                const ollamaConfig = this.getOllamaConfig();
                return !!(ollamaConfig.apiUrl && ollamaConfig.model);
            case 'openai':
                const openaiConfig = this.getOpenAIConfig();
                return !!(openaiConfig.apiKey && openaiConfig.model);
            default:
                return false;
        }
    }

    /**
     * Get configuration for the currently selected embedding provider
     */
    public getCurrentProviderConfig(): OllamaConfig | OpenAIConfig {
        const provider = this.getEmbeddingProvider();
        return provider === 'ollama' ? this.getOllamaConfig() : this.getOpenAIConfig();
    }
}
