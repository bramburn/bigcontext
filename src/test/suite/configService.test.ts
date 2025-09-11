import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../configService';

/**
 * Test suite for ConfigService
 *
 * These tests verify that the ConfigService correctly reads and provides
 * configuration values from VS Code settings. The ConfigService acts as a
 * centralized configuration management system for the extension, providing
 * typed access to all configuration options with appropriate defaults.
 */
describe('ConfigService Tests', () => {
  let configService: ConfigService;

  beforeEach(() => {
    // Create a fresh ConfigService instance for each test
    // This ensures tests are isolated and don't affect each other
    configService = new ConfigService();
  });

  test('should provide default Qdrant connection string', () => {
    // Test that the service provides a valid connection string for Qdrant vector database
    // This is essential for the extension to connect to the vector storage backend
    const connectionString = configService.getQdrantConnectionString();
    assert.strictEqual(typeof connectionString, 'string');
    assert.ok(connectionString.length > 0);
  });

  test('should provide database configuration', () => {
    // Test that the service provides a complete database configuration object
    // This includes the database type and connection information
    const dbConfig = configService.getDatabaseConfig();
    assert.strictEqual(dbConfig.type, 'qdrant');
    assert.strictEqual(typeof dbConfig.connectionString, 'string');
  });

  test('should provide embedding provider type', () => {
    // Test that the service correctly identifies the configured embedding provider
    // The extension supports either 'ollama' (local) or 'openai' (cloud) for embeddings
    const provider = configService.getEmbeddingProvider();
    assert.ok(provider === 'ollama' || provider === 'openai');
  });

  test('should provide Ollama configuration', () => {
    // Test that the service provides complete Ollama configuration when selected
    // Ollama is a local embedding provider that runs on the user's machine
    const ollamaConfig = configService.getOllamaConfig();
    assert.strictEqual(typeof ollamaConfig.apiUrl, 'string');
    assert.strictEqual(typeof ollamaConfig.model, 'string');
    assert.strictEqual(typeof ollamaConfig.timeout, 'number');
    assert.strictEqual(typeof ollamaConfig.maxBatchSize, 'number');
  });

  test('should provide OpenAI configuration', () => {
    // Test that the service provides complete OpenAI configuration when selected
    // OpenAI is a cloud-based embedding provider requiring API authentication
    const openaiConfig = configService.getOpenAIConfig();
    assert.strictEqual(typeof openaiConfig.apiKey, 'string');
    assert.strictEqual(typeof openaiConfig.model, 'string');
    assert.strictEqual(typeof openaiConfig.timeout, 'number');
    assert.strictEqual(typeof openaiConfig.maxBatchSize, 'number');
  });

  test('should provide indexing configuration', () => {
    // Test that the service provides indexing-related configuration
    // These settings control how files are processed and chunked for vector storage
    const indexingConfig = configService.getIndexingConfig();
    assert.ok(Array.isArray(indexingConfig.excludePatterns));
    assert.ok(Array.isArray(indexingConfig.supportedLanguages));
    assert.strictEqual(typeof indexingConfig.maxFileSize, 'number');
    assert.strictEqual(typeof indexingConfig.chunkSize, 'number');
    assert.strictEqual(typeof indexingConfig.chunkOverlap, 'number');
  });

  test('should provide full configuration', () => {
    // Test that the service can provide a complete configuration object
    // This is used for comprehensive configuration access and validation
    const fullConfig = configService.getFullConfig();
    assert.ok(fullConfig.database);
    assert.ok(fullConfig.embeddingProvider);
    assert.ok(fullConfig.ollama);
    assert.ok(fullConfig.openai);
    assert.ok(fullConfig.indexing);
  });

  test('should check provider configuration status', () => {
    // Test that the service can determine if a provider is properly configured
    // This is used to validate that required settings are present before use
    const ollamaConfigured = configService.isProviderConfigured('ollama');
    const openaiConfigured = configService.isProviderConfigured('openai');

    assert.strictEqual(typeof ollamaConfigured, 'boolean');
    assert.strictEqual(typeof openaiConfigured, 'boolean');
  });

  test('should get current provider configuration', () => {
    // Test that the service provides configuration for the active provider
    // This allows other services to access provider-specific settings without
    // needing to know which provider is currently active
    const currentConfig = configService.getCurrentProviderConfig();
    assert.ok(currentConfig);

    // Should have either Ollama or OpenAI properties depending on active provider
    const hasOllamaProps = 'apiUrl' in currentConfig;
    const hasOpenAIProps = 'apiKey' in currentConfig;
    assert.ok(hasOllamaProps || hasOpenAIProps);
  });

  test('should refresh configuration', () => {
    // Test that the service can reload its configuration from VS Code settings
    // This allows users to change settings and have them reflected without restarting
    assert.doesNotThrow(() => {
      configService.refresh();
    });
  });

  test('should provide max search results', () => {
    // Test that the service provides the maximum number of search results to return
    // This controls the balance between result comprehensiveness and performance
    const maxResults = configService.getMaxSearchResults();
    assert.strictEqual(typeof maxResults, 'number');
    assert.ok(maxResults > 0);
  });

  test('should provide min similarity threshold', () => {
    // Test that the service provides the minimum similarity threshold for search results
    // This filters out results that are not sufficiently relevant to the query
    const threshold = configService.getMinSimilarityThreshold();
    assert.strictEqual(typeof threshold, 'number');
    assert.ok(threshold >= 0 && threshold <= 1);
  });

  test('should provide auto index on startup setting', () => {
    // Test that the service provides the auto-indexing on startup setting
    // This determines whether the extension should automatically index files when activated
    const autoIndex = configService.getAutoIndexOnStartup();
    assert.strictEqual(typeof autoIndex, 'boolean');
  });

  test('should provide indexing batch size', () => {
    // Test that the service provides the batch size for indexing operations
    // This controls how many files are processed together for performance optimization
    const batchSize = configService.getIndexingBatchSize();
    assert.strictEqual(typeof batchSize, 'number');
    assert.ok(batchSize > 0);
  });

  test('should provide debug logging setting', () => {
    // Test that the service provides the debug logging setting
    // This controls whether detailed debug information is logged for troubleshooting
    const debugLogging = configService.getEnableDebugLogging();
    assert.strictEqual(typeof debugLogging, 'boolean');
  });

  test('should provide indexing intensity', () => {
    // Test that the service provides the indexing intensity setting
    // This controls how aggressively the extension uses system resources during indexing
    const intensity = configService.getIndexingIntensity();
    assert.ok(['High', 'Medium', 'Low'].includes(intensity));
  });
});
