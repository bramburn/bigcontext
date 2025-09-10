/**
 * StartupService Tests
 * 
 * Unit tests for the StartupService that orchestrates application startup
 */

import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { StartupService, StartupResult } from '../../services/StartupService';
import { ConfigurationService } from '../../services/ConfigurationService';
import { GitIgnoreManager } from '../../services/GitIgnoreManager';
import { Configuration, DEFAULT_CONFIGURATION } from '../../types/configuration';

// Mock services for isolated testing
class MockConfigurationService {
  private config: Configuration = { ...DEFAULT_CONFIGURATION };
  private shouldThrow = false;

  async loadConfiguration(): Promise<Configuration> {
    if (this.shouldThrow) {
      throw new Error('Configuration load failed');
    }
    return this.config;
  }

  async saveConfiguration(config: Configuration): Promise<void> {
    this.config = config;
  }

  getConfiguration(): Configuration {
    return this.config;
  }

  async generateContentHash(workspacePath: string): Promise<string> {
    return 'mock-hash-' + Date.now();
  }

  async isReindexingNeeded(workspacePath: string): Promise<boolean> {
    return this.config.qdrant.indexInfo?.contentHash !== await this.generateContentHash(workspacePath);
  }

  setConfiguration(config: Configuration): void {
    this.config = config;
  }

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }
}

class MockQdrantService {
  private connectionStatus = true;
  private collectionExists = true;

  async testConnection(): Promise<boolean> {
    return this.connectionStatus;
  }

  async collectionExists(collectionName: string): Promise<boolean> {
    return this.collectionExists;
  }

  setConnectionStatus(status: boolean): void {
    this.connectionStatus = status;
  }

  setCollectionExists(exists: boolean): void {
    this.collectionExists = exists;
  }
}

class MockGitIgnoreManager {
  private shouldThrow = false;

  async ensureConfigPatternPresent(workspacePath: string): Promise<void> {
    if (this.shouldThrow) {
      throw new Error('GitIgnore operation failed');
    }
  }

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }
}

describe('StartupService', () => {
  let mockConfigService: MockConfigurationService;
  let mockQdrantService: MockQdrantService;
  let mockGitIgnoreManager: MockGitIgnoreManager;
  let startupService: StartupService;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'startup-service-test-'));
    
    mockConfigService = new MockConfigurationService();
    mockQdrantService = new MockQdrantService();
    mockGitIgnoreManager = new MockGitIgnoreManager();
    
    startupService = new StartupService(
      mockConfigService as any,
      mockQdrantService as any,
      mockGitIgnoreManager as any
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  describe('executeStartupFlow', () => {
    it('should show setup for fresh installation', async () => {
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.action, 'showSetup');
      assert.strictEqual(result.reason, 'No configuration found');
      assert.strictEqual(result.configurationLoaded, true);
      assert.strictEqual(result.qdrantConnected, false);
      assert.strictEqual(result.indexValid, false);
      assert.strictEqual(result.reindexingNeeded, false);
    });

    it('should proceed to search when everything is valid', async () => {
      // Set up valid configuration with index info
      const configWithIndex: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          indexInfo: {
            collectionName: 'test-collection',
            lastIndexedTimestamp: new Date().toISOString(),
            contentHash: 'mock-hash-' + Date.now(),
          },
        },
      };
      
      mockConfigService.setConfiguration(configWithIndex);
      mockQdrantService.setConnectionStatus(true);
      mockQdrantService.setCollectionExists(true);
      
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.action, 'proceedToSearch');
      assert.strictEqual(result.reason, 'Configuration valid, index exists');
      assert.strictEqual(result.configurationLoaded, true);
      assert.strictEqual(result.qdrantConnected, true);
      assert.strictEqual(result.indexValid, true);
    });

    it('should trigger reindexing when content has changed', async () => {
      // Set up configuration with outdated content hash
      const configWithOldHash: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          indexInfo: {
            collectionName: 'test-collection',
            lastIndexedTimestamp: new Date().toISOString(),
            contentHash: 'old-hash',
          },
        },
      };
      
      mockConfigService.setConfiguration(configWithOldHash);
      mockQdrantService.setConnectionStatus(true);
      mockQdrantService.setCollectionExists(true);
      
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.action, 'triggerReindexing');
      assert.strictEqual(result.reason, 'Content has changed since last indexing');
      assert.strictEqual(result.reindexingNeeded, true);
    });

    it('should show setup when Qdrant connection fails', async () => {
      const configWithIndex: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          indexInfo: {
            collectionName: 'test-collection',
            lastIndexedTimestamp: new Date().toISOString(),
            contentHash: 'test-hash',
          },
        },
      };
      
      mockConfigService.setConfiguration(configWithIndex);
      mockQdrantService.setConnectionStatus(false);
      
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.action, 'showSetup');
      assert.strictEqual(result.reason, 'Qdrant connection failed');
      assert.strictEqual(result.qdrantConnected, false);
    });

    it('should trigger reindexing when collection does not exist', async () => {
      const configWithIndex: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          indexInfo: {
            collectionName: 'test-collection',
            lastIndexedTimestamp: new Date().toISOString(),
            contentHash: 'test-hash',
          },
        },
      };
      
      mockConfigService.setConfiguration(configWithIndex);
      mockQdrantService.setConnectionStatus(true);
      mockQdrantService.setCollectionExists(false);
      
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.action, 'triggerReindexing');
      assert.strictEqual(result.reason, 'Index collection does not exist');
      assert.strictEqual(result.indexValid, false);
      assert.strictEqual(result.reindexingNeeded, true);
    });
  });

  describe('error handling', () => {
    it('should handle configuration loading errors', async () => {
      mockConfigService.setShouldThrow(true);
      
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.action, 'showSetup');
      assert.ok(result.reason.includes('Failed to load configuration'));
      assert.strictEqual(result.configurationLoaded, false);
    });

    it('should handle Qdrant connection errors', async () => {
      // Mock Qdrant to throw an error
      const errorQdrantService = {
        testConnection: async () => { throw new Error('Network error'); },
        collectionExists: async () => { throw new Error('Query error'); },
      };
      
      const errorStartupService = new StartupService(
        mockConfigService as any,
        errorQdrantService as any,
        mockGitIgnoreManager as any
      );
      
      const result = await errorStartupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.action, 'showSetup');
      assert.ok(result.reason.includes('Qdrant connection failed'));
    });

    it('should handle GitIgnore errors gracefully', async () => {
      mockGitIgnoreManager.setShouldThrow(true);
      
      const result = await startupService.executeStartupFlow(tempDir);
      
      // Should still complete startup flow despite GitIgnore error
      assert.ok(result.action);
      assert.ok(result.reason);
    });
  });

  describe('startup result validation', () => {
    it('should always provide valid startup result structure', async () => {
      const result = await startupService.executeStartupFlow(tempDir);
      
      // Verify all required fields are present
      assert.ok(typeof result.action === 'string');
      assert.ok(typeof result.reason === 'string');
      assert.ok(typeof result.configurationLoaded === 'boolean');
      assert.ok(typeof result.qdrantConnected === 'boolean');
      assert.ok(typeof result.indexValid === 'boolean');
      assert.ok(typeof result.reindexingNeeded === 'boolean');
      
      // Verify action is one of the expected values
      const validActions = ['showSetup', 'proceedToSearch', 'triggerReindexing'];
      assert.ok(validActions.includes(result.action));
    });

    it('should provide meaningful reasons for each action', async () => {
      // Test different scenarios and verify reasons are descriptive
      const scenarios = [
        { config: DEFAULT_CONFIGURATION, expectedAction: 'showSetup' },
      ];
      
      for (const scenario of scenarios) {
        mockConfigService.setConfiguration(scenario.config);
        const result = await startupService.executeStartupFlow(tempDir);
        
        assert.strictEqual(result.action, scenario.expectedAction);
        assert.ok(result.reason.length > 0);
        assert.ok(!result.reason.includes('undefined'));
      }
    });
  });

  describe('configuration state tracking', () => {
    it('should accurately track configuration loading state', async () => {
      // Test successful configuration loading
      const result1 = await startupService.executeStartupFlow(tempDir);
      assert.strictEqual(result1.configurationLoaded, true);
      
      // Test failed configuration loading
      mockConfigService.setShouldThrow(true);
      const result2 = await startupService.executeStartupFlow(tempDir);
      assert.strictEqual(result2.configurationLoaded, false);
    });

    it('should accurately track Qdrant connection state', async () => {
      const configWithIndex: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          indexInfo: {
            collectionName: 'test-collection',
            lastIndexedTimestamp: new Date().toISOString(),
            contentHash: 'test-hash',
          },
        },
      };
      
      mockConfigService.setConfiguration(configWithIndex);
      
      // Test successful connection
      mockQdrantService.setConnectionStatus(true);
      const result1 = await startupService.executeStartupFlow(tempDir);
      assert.strictEqual(result1.qdrantConnected, true);
      
      // Test failed connection
      mockQdrantService.setConnectionStatus(false);
      const result2 = await startupService.executeStartupFlow(tempDir);
      assert.strictEqual(result2.qdrantConnected, false);
    });

    it('should accurately track index validity', async () => {
      const configWithIndex: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          indexInfo: {
            collectionName: 'test-collection',
            lastIndexedTimestamp: new Date().toISOString(),
            contentHash: 'test-hash',
          },
        },
      };
      
      mockConfigService.setConfiguration(configWithIndex);
      mockQdrantService.setConnectionStatus(true);
      
      // Test valid index (collection exists)
      mockQdrantService.setCollectionExists(true);
      const result1 = await startupService.executeStartupFlow(tempDir);
      assert.strictEqual(result1.indexValid, true);
      
      // Test invalid index (collection doesn't exist)
      mockQdrantService.setCollectionExists(false);
      const result2 = await startupService.executeStartupFlow(tempDir);
      assert.strictEqual(result2.indexValid, false);
    });
  });
});
