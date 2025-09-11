/**
 * Startup Flow Integration Tests
 * 
 * Integration tests for the complete startup flow with persistent configuration
 */

import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { StartupService, StartupResult } from '../../services/StartupService';
import { ConfigurationService } from '../../services/ConfigurationService';
import { GitIgnoreManager } from '../../services/GitIgnoreManager';
import { Configuration, DEFAULT_CONFIGURATION } from '../../types/configuration';

// Mock QdrantService for testing
class MockQdrantService {
  private shouldConnect: boolean;
  private hasValidCollection: boolean;

  constructor(shouldConnect = true, hasValidCollection = true) {
    this.shouldConnect = shouldConnect;
    this.hasValidCollection = hasValidCollection;
  }

  async testConnection(): Promise<boolean> {
    return this.shouldConnect;
  }

  async healthCheck(): Promise<boolean> {
    return this.shouldConnect;
  }

  async collectionExists(collectionName: string): Promise<boolean> {
    return this.hasValidCollection;
  }

  setConnectionStatus(status: boolean): void {
    this.shouldConnect = status;
  }

  setCollectionStatus(status: boolean): void {
    this.hasValidCollection = status;
  }
}

describe('Startup Flow Integration Tests', () => {
  let tempDir: string;
  let configService: ConfigurationService;
  let gitIgnoreManager: GitIgnoreManager;
  let mockQdrantService: MockQdrantService;
  let startupService: StartupService;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'startup-test-'));
    
    // Initialize services
    configService = new ConfigurationService(tempDir);
    gitIgnoreManager = new GitIgnoreManager();
    mockQdrantService = new MockQdrantService();
    startupService = new StartupService(
      configService,
      mockQdrantService as any,
      gitIgnoreManager
    );
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  describe('Fresh Installation Flow', () => {
    it('should handle first-time setup with no configuration', async () => {
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.action, 'showSetup');
      assert.ok(result.reason.includes('No configuration found')); // Reverted to match unit test
      assert.strictEqual(result.configurationLoaded, true);
      assert.strictEqual(result.qdrantConnected, false);
      assert.strictEqual(result.indexValid, false);
      assert.strictEqual(result.reindexingNeeded, false);
    });

    it('should load default configuration on first run without creating file', async () => {
      const result = await startupService.executeStartupFlow(tempDir);

      // Verify configuration file was NOT created (StartupService doesn't save defaults)
      const configExists = await configService.configurationFileExists();
      assert.strictEqual(configExists, false);

      // Verify that default configuration is loaded in memory
      const config = await configService.loadConfiguration();
      assert.deepStrictEqual(config, DEFAULT_CONFIGURATION);

      // Verify startup result
      assert.strictEqual(result.action, 'showSetup');
      assert.strictEqual(result.configurationLoaded, true);
    });

    it('should set up .gitignore on first run', async () => {
      await startupService.executeStartupFlow(tempDir);
      
      // Verify .gitignore was created and contains config pattern
      const gitignorePath = path.join(tempDir, '.gitignore');
      const exists = await fs.access(gitignorePath).then(() => true).catch(() => false);
      assert.strictEqual(exists, true);
      
      const content = await fs.readFile(gitignorePath, 'utf-8');
      assert.ok(content.includes('.context/config.json'));
    });
  });

  describe('Existing Configuration Flow', () => {
    beforeEach(async () => {
      // Generate the actual content hash for the temp directory
      const actualContentHash = await configService.generateContentHash(tempDir);

      // Set up existing configuration
      const testConfig: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          host: 'test-host',
          port: 6333,
          indexInfo: {
            collectionName: 'test-collection',
            lastIndexedTimestamp: new Date().toISOString(),
            contentHash: actualContentHash,
          },
        },
      };

      await configService.saveConfiguration(testConfig);
    });

    it('should proceed to search when everything is valid', async () => {
      mockQdrantService.setConnectionStatus(true);
      mockQdrantService.setCollectionStatus(true);

      const result = await startupService.executeStartupFlow(tempDir);

      assert.strictEqual(result.action, 'proceedToSearch');
      assert.ok(result.reason.includes('Configuration valid') && result.reason.includes('index exists'));
      assert.strictEqual(result.configurationLoaded, true);
      assert.strictEqual(result.qdrantConnected, true);
      assert.strictEqual(result.indexValid, true);
      assert.strictEqual(result.reindexingNeeded, false);
    });

    it('should trigger reindexing when content has changed', async () => {
      mockQdrantService.setConnectionStatus(true);
      mockQdrantService.setCollectionStatus(true);

      // Create some files to change content hash
      await fs.writeFile(path.join(tempDir, 'test.ts'), 'console.log("test");');

      const result = await startupService.executeStartupFlow(tempDir);

      assert.strictEqual(result.action, 'triggerReindexing');
      assert.ok(result.reason.includes('Content has changed since last indexing'));
      assert.strictEqual(result.configurationLoaded, true);
      assert.strictEqual(result.qdrantConnected, true);
      assert.strictEqual(result.indexValid, true);
      assert.strictEqual(result.reindexingNeeded, true);
    });

    it('should show setup when Qdrant connection fails', async () => {
      mockQdrantService.setConnectionStatus(false);
      
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.action, 'showSetup');
      assert.strictEqual(result.reason, 'Qdrant connection failed');
      assert.strictEqual(result.configurationLoaded, true);
      assert.strictEqual(result.qdrantConnected, false);
      assert.strictEqual(result.indexValid, false);
    });

    it('should trigger reindexing when collection does not exist', async () => {
      mockQdrantService.setConnectionStatus(true);
      mockQdrantService.setCollectionStatus(false);

      const result = await startupService.executeStartupFlow(tempDir);

      assert.strictEqual(result.action, 'triggerReindexing');
      assert.ok(result.reason.includes('Index collection does not exist'));
      assert.strictEqual(result.configurationLoaded, true);
      assert.strictEqual(result.qdrantConnected, true);
      assert.strictEqual(result.indexValid, false);
      assert.strictEqual(result.reindexingNeeded, true);
    });
  });

  describe('Configuration Validation', () => {
    it('should handle invalid configuration gracefully', async () => {
      // Create invalid configuration file
      const configPath = path.join(tempDir, '.context', 'config.json');
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, '{ invalid json');

      const result = await startupService.executeStartupFlow(tempDir);

      // Service should fall back to defaults and continue, eventually triggering reindexing
      assert.strictEqual(result.action, 'triggerReindexing');
      assert.strictEqual(result.configurationLoaded, true); // Should fall back to defaults
    });

    it('should validate Qdrant configuration', async () => {
      const invalidConfig: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          host: '', // Invalid empty host
        },
      };

      // Should throw error when trying to save invalid configuration
      await assert.rejects(
        () => configService.saveConfiguration(invalidConfig),
        /Invalid configuration: Qdrant host is required/
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Try to run startup in a non-existent directory
      const nonExistentDir = path.join(tempDir, 'non-existent');

      const result = await startupService.executeStartupFlow(nonExistentDir);

      // Should handle the error and provide meaningful result
      assert.strictEqual(result.action, 'showSetup');
      assert.strictEqual(result.reason, 'No configuration found');
      assert.strictEqual(result.configurationLoaded, true);
    });

    it('should handle Qdrant service errors gracefully', async () => {
      // Create a valid configuration first
      await configService.saveConfiguration({
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          host: 'test-host',
          port: 6333,
        },
      });

      // Mock Qdrant service to throw errors
      const errorQdrantService = {
        healthCheck: async () => { throw new Error('Connection failed'); },
        collectionExists: async () => { throw new Error('Query failed'); },
      };

      const errorStartupService = new StartupService(
        configService,
        errorQdrantService as any,
        gitIgnoreManager
      );

      const result = await errorStartupService.executeStartupFlow(tempDir);

      assert.strictEqual(result.action, 'showSetup');
      assert.strictEqual(result.reason, 'Qdrant connection failed');
      assert.strictEqual(result.configurationLoaded, true);
      assert.strictEqual(result.qdrantConnected, false);
    });
  });

  describe('Content Change Detection', () => {
    it('should detect when workspace content changes', async () => {
      // Set up initial configuration with content hash
      const initialConfig: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          indexInfo: {
            collectionName: 'test-collection',
            lastIndexedTimestamp: new Date().toISOString(),
            contentHash: 'initial-hash',
          },
        },
      };
      
      await configService.saveConfiguration(initialConfig);
      
      // Add some files to change content
      await fs.writeFile(path.join(tempDir, 'new-file.ts'), 'console.log("new content");');
      
      mockQdrantService.setConnectionStatus(true);
      mockQdrantService.setCollectionStatus(true);
      
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.reindexingNeeded, true); // Content changed, should need reindexing
      assert.strictEqual(result.action, 'triggerReindexing'); // Should trigger reindexing due to content change
    });

    it('should not trigger reindexing when content is unchanged', async () => {
      // Generate current content hash
      const currentHash = await configService.generateContentHash(tempDir);
      
      const config: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          indexInfo: {
            collectionName: 'test-collection',
            lastIndexedTimestamp: new Date().toISOString(),
            contentHash: currentHash,
          },
        },
      };
      
      await configService.saveConfiguration(config);
      
      mockQdrantService.setConnectionStatus(true);
      mockQdrantService.setCollectionStatus(true);
      
      const result = await startupService.executeStartupFlow(tempDir);
      
      assert.strictEqual(result.reindexingNeeded, false);
      assert.strictEqual(result.action, 'proceedToSearch'); // Should proceed to search when everything is valid
    });
  });

  describe('GitIgnore Integration', () => {
    it('should ensure .gitignore is properly configured', async () => {
      await startupService.executeStartupFlow(tempDir);
      
      // Verify .gitignore contains the config pattern
      const hasPattern = await gitIgnoreManager.patternExists('.context/config.json', tempDir);
      assert.strictEqual(hasPattern, true);
    });

    it('should not duplicate .gitignore entries on multiple runs', async () => {
      // Run startup multiple times
      await startupService.executeStartupFlow(tempDir);
      await startupService.executeStartupFlow(tempDir);
      await startupService.executeStartupFlow(tempDir);
      
      // Check that pattern appears only once
      const gitignorePath = path.join(tempDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf-8');
      const occurrences = (content.match(/\.context\/config\.json/g) || []).length;
      
      assert.strictEqual(occurrences, 1);
    });
  });
});
