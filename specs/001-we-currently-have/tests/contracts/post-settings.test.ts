import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as contract from '../../contracts/post-settings.json';
import { SettingsApi } from '../../../../src/api/SettingsApi';

// Mock vscode API
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: () => ({ get: vi.fn(), update: vi.fn() }),
    onDidChangeConfiguration: vi.fn()
  },
  ConfigurationTarget: { Workspace: 1 }
}));

/**
 * Contract Test for POST /settings endpoint
 *
 * This test validates the API contract defined in:
 * /Users/bramburn/dev/bigcontext/specs/001-we-currently-have/contracts/post-settings.json
 *
 * Expected Request Schema:
 * {
 *   "embeddingModel": {
 *     "provider": "Nomic Embed" | "OpenAI",
 *     "apiKey": string,
 *     "endpoint": string (uri format, optional),
 *     "modelName": string (optional)
 *   },
 *   "qdrantDatabase": {
 *     "host": string,
 *     "port": number (optional),
 *     "apiKey": string (optional),
 *     "collectionName": string
 *   }
 * }
 *
 * Expected Response Schema:
 * {
 *   "success": boolean,
 *   "message": string
 * }
 */

describe('POST /settings Contract Test', () => {
  let mockSettingsService: any;
  let settingsApi: SettingsApi;
  let messages: any[];
  const webview = { postMessage: async (msg: any) => { messages.push(msg); } } as any;

  beforeEach(() => {
    messages = [];
    mockSettingsService = {};
    settingsApi = new SettingsApi(mockSettingsService as any);
  });

  it('should define the correct request structure from contract', () => {
    const expectedRequestProperties = contract.request.properties;
    expect(expectedRequestProperties.embeddingModel).toBeDefined();
    expect(expectedRequestProperties.qdrantDatabase).toBeDefined();

    // Validate embeddingModel request schema
    const embeddingModelProps = expectedRequestProperties.embeddingModel.properties;
    expect(embeddingModelProps.provider).toBeDefined();
    expect(embeddingModelProps.apiKey).toBeDefined();
    expect(embeddingModelProps.endpoint).toBeDefined();
    expect(embeddingModelProps.modelName).toBeDefined();

    // Validate qdrantDatabase request schema
    const qdrantProps = expectedRequestProperties.qdrantDatabase.properties;
    expect(qdrantProps.host).toBeDefined();
    expect(qdrantProps.port).toBeDefined();
    expect(qdrantProps.apiKey).toBeDefined();
    expect(qdrantProps.collectionName).toBeDefined();
  });

  it('should define the correct response structure from contract', () => {
    const expectedResponseProperties = contract.response.properties;
    expect(expectedResponseProperties.success).toBeDefined();
    expect(expectedResponseProperties.message).toBeDefined();

    // Validate response types
    expect(expectedResponseProperties.success.type).toBe('boolean');
    expect(expectedResponseProperties.message.type).toBe('string');
  });

  it('should return success response when valid settings are saved', async () => {
    // Arrange
    const validSettings = {
      embeddingModel: {
        provider: 'OpenAI',
        apiKey: 'sk-test-key',
        endpoint: 'https://api.openai.com/v1',
        modelName: 'text-embedding-ada-002'
      },
      qdrantDatabase: {
        host: 'localhost',
        port: 6333,
        apiKey: 'test-api-key',
        collectionName: 'code-embeddings'
      }
    };
    mockSettingsService.saveSettings = vi.fn().mockResolvedValue({ success: true, message: 'Settings saved' });

    // Act
    await settingsApi.handlePostSettings({ settings: validSettings, requestId: 't1' }, webview);

    // Assert
    expect(messages.length).toBe(1);
    const msg = messages[0];
    expect(msg.command).toBe('postSettingsResponse');
    expect(msg.success).toBe(true);
    expect(msg.message).toBeDefined();
    expect(typeof msg.message).toBe('string');
  });

  it('should return error when required fields are missing', async () => {
    // Arrange
    const invalidSettings = {
      embeddingModel: {
        // Missing required provider and apiKey
        endpoint: 'https://api.openai.com/v1'
      },
      qdrantDatabase: {
        // Missing required host and collectionName
        port: 6333
      }
    };
    mockSettingsService.saveSettings = vi.fn().mockResolvedValue({
      success: false,
      message: 'Settings validation failed',
      errors: ['Embedding provider is required', 'API key is required']
    });

    // Act
    await settingsApi.handlePostSettings({ settings: invalidSettings as any, requestId: 't2' }, webview);

    // Assert
    expect(messages.length).toBe(1);
    const msg = messages[0];
    expect(msg.command).toBe('postSettingsResponse');
    expect(msg.success).toBe(false);
    expect(msg.message).toContain('validation');
  });

  it('should validate provider enum values', async () => {
    // Arrange
    const settingsWithInvalidProvider = {
      embeddingModel: {
        provider: 'InvalidProvider', // Should only be 'Nomic Embed' or 'OpenAI'
        apiKey: 'test-key'
      },
      qdrantDatabase: {
        host: 'localhost',
        collectionName: 'test-collection'
      }
    };

    // Mock the saveSettings method of mockSettingsService to simulate validation failure
    mockSettingsService.saveSettings = vi.fn().mockResolvedValue({
      success: false,
      message: 'Invalid embedding provider',
      errors: ['Invalid embedding provider: InvalidProvider']
    });

    // Act
    await settingsApi.handlePostSettings({ settings: settingsWithInvalidProvider as any, requestId: 't3' }, webview);

    // Assert
    expect(messages.length).toBe(1);
    const msg = messages[0];
    expect(msg.command).toBe('postSettingsResponse');
    expect(msg.success).toBe(false);
    expect(msg.message).toContain('provider');
  });
});