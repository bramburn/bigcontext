import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('vscode', () => {
  const configStore: Record<string, any> = {};
  return {
    workspace: {
      getConfiguration: () => ({
        get: (key: string, def?: any) => (key in configStore ? configStore[key] : def),
        update: async (key: string, value: any) => {
          configStore[key] = value;
        },
      }),
      onDidChangeConfiguration: vi.fn(),
    },
    ConfigurationTarget: { Workspace: 1 },
    default: {},
  };
});

import { SettingsService, type ExtensionSettings } from '../../services/SettingsService';

describe('SettingsService', () => {
  let settingsService: SettingsService;

  beforeEach(() => {
    // @ts-ignore context not used by our mocked paths
    settingsService = new SettingsService({} as any);
  });

  it('validateSettings should fail with empty settings', () => {
    const invalid: ExtensionSettings = {
      // @ts-ignore intentional incomplete structure
      embeddingModel: {},
      // @ts-ignore intentional incomplete structure
      qdrantDatabase: {},
    };

    const result = settingsService.validateSettings(invalid);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('saveSettings should succeed with minimal valid settings', async () => {
    const valid: ExtensionSettings = {
      embeddingModel: {
        provider: 'OpenAI',
        modelName: 'text-embedding-3-small',
        apiKey: 'sk-test',
      } as any,
      qdrantDatabase: {
        host: 'localhost',
        port: 6333,
        useSSL: false,
        collectionName: 'code-embeddings',
      } as any,
    };

    const result = await settingsService.saveSettings(valid);
    expect(result.success).toBe(true);
  });
});

