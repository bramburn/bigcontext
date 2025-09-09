import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as contract from '../../contracts/get-settings.json';
import { SettingsApi } from '../../../../src/api/SettingsApi';

// Mock vscode API used inside SettingsApi/SettingsService
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: () => ({ get: vi.fn(), update: vi.fn() }),
    onDidChangeConfiguration: vi.fn()
  },
  ConfigurationTarget: { Workspace: 1 }
}));

/**
 * Contract Test for GET /settings endpoint
 *
 * This test validates the API contract defined in:
 * /Users/bramburn/dev/bigcontext/specs/001-we-currently-have/contracts/get-settings.json
 *
 * Expected Response Schema:
 * {
 *   "embeddingModel": {
 *     "provider": "Nomic Embed" | "OpenAI",
 *     "apiKey": string (password format),
 *     "endpoint": string (uri format, optional),
 *     "modelName": string (optional)
 *   },
 *   "qdrantDatabase": {
 *     "host": string,
 *     "port": number (optional),
 *     "apiKey": string (password format, optional),
 *     "collectionName": string
 *   }
 * }
 */

describe('GET /settings Contract Test', () => {
  let mockSettingsService: any;
  let settingsApi: SettingsApi;
  let messages: any[];
  const webview = { postMessage: async (msg: any) => { messages.push(msg); } } as any;

  beforeEach(() => {
    messages = [];
    mockSettingsService = {};
    settingsApi = new SettingsApi(mockSettingsService as any);
  });

  it('should define the correct response structure from contract', () => {
    const expectedResponseProperties = contract.response.properties;
    expect(expectedResponseProperties.embeddingModel).toBeDefined();
    expect(expectedResponseProperties.qdrantDatabase).toBeDefined();

    // Validate embeddingModel schema
    const embeddingModelProps = expectedResponseProperties.embeddingModel.properties;
    expect(embeddingModelProps.provider).toBeDefined();
    expect(embeddingModelProps.apiKey).toBeDefined();
    expect(embeddingModelProps.endpoint).toBeDefined();
    expect(embeddingModelProps.modelName).toBeDefined();

    // Validate qdrantDatabase schema
    const qdrantProps = expectedResponseProperties.qdrantDatabase.properties;
    expect(qdrantProps.host).toBeDefined();
    expect(qdrantProps.port).toBeDefined();
    expect(qdrantProps.apiKey).toBeDefined();
    expect(qdrantProps.collectionName).toBeDefined();
  });

  it('should return success with valid settings when settings exist', async () => {
    // Arrange
    const expectedSettings = {
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
    mockSettingsService.getSettings = vi.fn().mockReturnValue(expectedSettings);

    // Act
    await settingsApi.handleGetSettings({ requestId: 't1' }, webview);

    // Assert
    expect(messages.length).toBe(1);
    const msg = messages[0];
    expect(msg.command).toBe('getSettingsResponse');
    expect(msg.success).toBe(true);
    expect(msg.settings).toEqual(expectedSettings);
    expect(['Nomic Embed', 'OpenAI']).toContain(msg.settings.embeddingModel.provider);
    expect(msg.settings.qdrantDatabase.collectionName).toBeDefined();
  });

  it('should return error when no settings are configured', async () => {
    // Arrange
    mockSettingsService.getSettings = vi.fn(() => { throw new Error('Settings not found'); });

    // Act
    await settingsApi.handleGetSettings({ requestId: 't2' }, webview);

    // Assert
    expect(messages.length).toBe(1);
    const msg = messages[0];
    expect(msg.command).toBe('getSettingsResponse');
    expect(msg.success).toBe(false);
    expect(String(msg.error).toLowerCase()).toContain('not');
  });
});