/**
 * Configuration Service Tests
 * 
 * Tests for the persistent configuration service that manages .context/config.json
 */

import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ConfigurationService } from '../../services/ConfigurationService';
import { Configuration, DEFAULT_CONFIGURATION } from '../../types/configuration';

describe('ConfigurationService', () => {
  let tempDir: string;
  let configService: ConfigurationService;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-test-'));
    configService = new ConfigurationService(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  describe('loadConfiguration', () => {
    it('should return default configuration when file does not exist', async () => {
      const config = await configService.loadConfiguration();
      assert.deepStrictEqual(config, DEFAULT_CONFIGURATION);
    });

    it('should load configuration from existing file', async () => {
      // Create a test configuration file
      const testConfig: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          host: 'test-host',
          port: 9999,
        },
      };

      const configDir = path.join(tempDir, '.context');
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, 'config.json'),
        JSON.stringify(testConfig, null, 2)
      );

      const loadedConfig = await configService.loadConfiguration();
      assert.strictEqual(loadedConfig.qdrant.host, 'test-host');
      assert.strictEqual(loadedConfig.qdrant.port, 9999);
    });

    it('should merge partial configuration with defaults', async () => {
      // Create a partial configuration file
      const partialConfig = {
        qdrant: {
          host: 'partial-host',
        },
      };

      const configDir = path.join(tempDir, '.context');
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, 'config.json'),
        JSON.stringify(partialConfig, null, 2)
      );

      const loadedConfig = await configService.loadConfiguration();
      assert.strictEqual(loadedConfig.qdrant.host, 'partial-host');
      assert.strictEqual(loadedConfig.qdrant.port, DEFAULT_CONFIGURATION.qdrant.port);
      assert.deepStrictEqual(loadedConfig.treeSitter, DEFAULT_CONFIGURATION.treeSitter);
    });

    it('should handle malformed JSON gracefully', async () => {
      const configDir = path.join(tempDir, '.context');
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, 'config.json'),
        '{ invalid json'
      );

      const loadedConfig = await configService.loadConfiguration();
      assert.deepStrictEqual(loadedConfig, DEFAULT_CONFIGURATION);
    });
  });

  describe('saveConfiguration', () => {
    it('should save configuration to file', async () => {
      const testConfig: Configuration = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          host: 'save-test-host',
          port: 8888,
        },
      };

      await configService.saveConfiguration(testConfig);

      // Verify file was created
      const configPath = configService.getConfigurationFilePath();
      const exists = await fs.access(configPath).then(() => true).catch(() => false);
      assert.strictEqual(exists, true);

      // Verify content
      const savedContent = await fs.readFile(configPath, 'utf-8');
      const savedConfig = JSON.parse(savedContent);
      assert.strictEqual(savedConfig.qdrant.host, 'save-test-host');
      assert.strictEqual(savedConfig.qdrant.port, 8888);
    });

    it('should create .context directory if it does not exist', async () => {
      const testConfig = { ...DEFAULT_CONFIGURATION };
      await configService.saveConfiguration(testConfig);

      const configDir = path.dirname(configService.getConfigurationFilePath());
      const dirExists = await fs.access(configDir).then(() => true).catch(() => false);
      assert.strictEqual(dirExists, true);
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          host: '', // Invalid empty host
        },
      };

      await assert.rejects(
        () => configService.saveConfiguration(invalidConfig),
        /Invalid configuration/
      );
    });
  });

  describe('validateConfiguration', () => {
    it('should validate correct configuration', () => {
      const result = configService.validateConfiguration(DEFAULT_CONFIGURATION);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should detect missing required fields', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          host: '',
        },
      };

      const result = configService.validateConfiguration(invalidConfig);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(error => error.includes('host is required')));
    });

    it('should detect invalid port numbers', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIGURATION,
        qdrant: {
          ...DEFAULT_CONFIGURATION.qdrant,
          port: -1,
        },
      };

      const result = configService.validateConfiguration(invalidConfig);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(error => error.includes('port must be')));
    });

    it('should detect invalid URLs', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIGURATION,
        ollama: {
          ...DEFAULT_CONFIGURATION.ollama,
          endpoint: 'not-a-url',
        },
      };

      const result = configService.validateConfiguration(invalidConfig);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(error => error.includes('valid URL')));
    });
  });

  describe('updateSetting', () => {
    it('should update nested settings using dot notation', async () => {
      await configService.updateSetting('qdrant.host', 'updated-host');
      
      const config = configService.getConfiguration();
      assert.strictEqual(config.qdrant.host, 'updated-host');
    });

    it('should persist setting updates', async () => {
      await configService.updateSetting('qdrant.port', 7777);
      
      // Create new service instance to test persistence
      const newService = new ConfigurationService(tempDir);
      const loadedConfig = await newService.loadConfiguration();
      assert.strictEqual(loadedConfig.qdrant.port, 7777);
    });
  });

  describe('generateContentHash', () => {
    it('should generate consistent hash for same content', async () => {
      // Create some test files
      await fs.writeFile(path.join(tempDir, 'test.ts'), 'console.log("test");');
      await fs.writeFile(path.join(tempDir, 'test.js'), 'console.log("test2");');

      const hash1 = await configService.generateContentHash(tempDir);
      const hash2 = await configService.generateContentHash(tempDir);
      
      assert.strictEqual(hash1, hash2);
      assert.ok(hash1.length > 0);
    });

    it('should generate different hash when content changes', async () => {
      // Create initial file
      await fs.writeFile(path.join(tempDir, 'test.ts'), 'console.log("test");');
      const hash1 = await configService.generateContentHash(tempDir);

      // Wait a bit to ensure different modification time
      await new Promise(resolve => setTimeout(resolve, 10));

      // Modify file
      await fs.writeFile(path.join(tempDir, 'test.ts'), 'console.log("modified");');
      const hash2 = await configService.generateContentHash(tempDir);

      assert.notStrictEqual(hash1, hash2);
    });
  });

  describe('Qdrant index management', () => {
    it('should update and clear index info', async () => {
      const indexInfo = {
        collectionName: 'test-collection',
        lastIndexedTimestamp: new Date().toISOString(),
        contentHash: 'test-hash',
      };

      await configService.updateQdrantIndexInfo(indexInfo);
      
      let config = configService.getConfiguration();
      assert.deepStrictEqual(config.qdrant.indexInfo, indexInfo);

      await configService.clearQdrantIndexInfo();
      
      config = configService.getConfiguration();
      assert.strictEqual(config.qdrant.indexInfo, undefined);
    });
  });

  describe('file operations', () => {
    it('should correctly report file existence', async () => {
      let exists = await configService.configurationFileExists();
      assert.strictEqual(exists, false);

      await configService.saveConfiguration(DEFAULT_CONFIGURATION);
      
      exists = await configService.configurationFileExists();
      assert.strictEqual(exists, true);
    });

    it('should provide correct file path', () => {
      const expectedPath = path.join(tempDir, '.context', 'config.json');
      const actualPath = configService.getConfigurationFilePath();
      assert.strictEqual(actualPath, expectedPath);
    });
  });
});
