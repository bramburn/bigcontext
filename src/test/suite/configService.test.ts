import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../configService';

/**
 * Test suite for ConfigService
 *
 * These tests verify that the ConfigService correctly reads and provides
 * configuration values from VS Code settings.
 */
suite('ConfigService Tests', () => {
    let configService: ConfigService;

    setup(() => {
        configService = new ConfigService();
    });

    test('should provide default Qdrant connection string', () => {
        const connectionString = configService.getQdrantConnectionString();
        assert.strictEqual(typeof connectionString, 'string');
        assert.ok(connectionString.length > 0);
    });

    test('should provide database configuration', () => {
        const dbConfig = configService.getDatabaseConfig();
        assert.strictEqual(dbConfig.type, 'qdrant');
        assert.strictEqual(typeof dbConfig.connectionString, 'string');
    });

    test('should provide embedding provider type', () => {
        const provider = configService.getEmbeddingProvider();
        assert.ok(provider === 'ollama' || provider === 'openai');
    });

    test('should provide Ollama configuration', () => {
        const ollamaConfig = configService.getOllamaConfig();
        assert.strictEqual(typeof ollamaConfig.apiUrl, 'string');
        assert.strictEqual(typeof ollamaConfig.model, 'string');
        assert.strictEqual(typeof ollamaConfig.timeout, 'number');
        assert.strictEqual(typeof ollamaConfig.maxBatchSize, 'number');
    });

    test('should provide OpenAI configuration', () => {
        const openaiConfig = configService.getOpenAIConfig();
        assert.strictEqual(typeof openaiConfig.apiKey, 'string');
        assert.strictEqual(typeof openaiConfig.model, 'string');
        assert.strictEqual(typeof openaiConfig.timeout, 'number');
        assert.strictEqual(typeof openaiConfig.maxBatchSize, 'number');
    });

    test('should provide indexing configuration', () => {
        const indexingConfig = configService.getIndexingConfig();
        assert.ok(Array.isArray(indexingConfig.excludePatterns));
        assert.ok(Array.isArray(indexingConfig.supportedLanguages));
        assert.strictEqual(typeof indexingConfig.maxFileSize, 'number');
        assert.strictEqual(typeof indexingConfig.chunkSize, 'number');
        assert.strictEqual(typeof indexingConfig.chunkOverlap, 'number');
    });

    test('should provide full configuration', () => {
        const fullConfig = configService.getFullConfig();
        assert.ok(fullConfig.database);
        assert.ok(fullConfig.embeddingProvider);
        assert.ok(fullConfig.ollama);
        assert.ok(fullConfig.openai);
        assert.ok(fullConfig.indexing);
    });

    test('should check provider configuration status', () => {
        const ollamaConfigured = configService.isProviderConfigured('ollama');
        const openaiConfigured = configService.isProviderConfigured('openai');
        
        assert.strictEqual(typeof ollamaConfigured, 'boolean');
        assert.strictEqual(typeof openaiConfigured, 'boolean');
    });

    test('should get current provider configuration', () => {
        const currentConfig = configService.getCurrentProviderConfig();
        assert.ok(currentConfig);
        
        // Should have either Ollama or OpenAI properties
        const hasOllamaProps = 'apiUrl' in currentConfig;
        const hasOpenAIProps = 'apiKey' in currentConfig;
        assert.ok(hasOllamaProps || hasOpenAIProps);
    });

    test('should refresh configuration', () => {
        // This test verifies that refresh doesn't throw an error
        assert.doesNotThrow(() => {
            configService.refresh();
        });
    });
});
