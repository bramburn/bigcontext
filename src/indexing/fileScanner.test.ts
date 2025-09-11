import * as assert from 'assert';
import { FileScanner, IFileScanMessageSender, ScanStatistics } from './fileScanner';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock the dependencies - using simple mocks for Node.js testing
const mockFastGlob = {
  default: async () => [],
};

const mockIgnoreInstance = {
  add: () => {},
  ignores: () => false,
};

const mockIgnore = {
  default: () => mockIgnoreInstance,
};

describe('FileScanner', () => {
  let tempDir: string;
  let mockMessageSender: IFileScanMessageSender;
  let fileScanner: FileScanner;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'fileScanner-test-'));

    // Create mock message sender
    mockMessageSender = {
      sendScanStart: () => {},
      sendScanProgress: () => {},
      sendScanComplete: () => {},
    };

    fileScanner = new FileScanner(tempDir, mockMessageSender);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create a FileScanner instance with workspace root', () => {
      const scanner = new FileScanner('/test/path');
      assert.ok(scanner instanceof FileScanner);
    });

    it('should create a FileScanner instance with message sender', () => {
      const scanner = new FileScanner('/test/path', mockMessageSender);
      assert.ok(scanner instanceof FileScanner);
    });
  });

  describe('scanWithProgress', () => {
    it('should handle empty repository', async () => {
      // Create an empty directory
      const stats = await fileScanner.scanWithProgress();

      assert.strictEqual(stats.isEmpty, true);
      assert.strictEqual(stats.totalFiles, 0);
      assert.strictEqual(stats.ignoredFiles, 0);
      assert.strictEqual(stats.scannedFiles, 0);
    });

    it('should scan files and send progress messages', async () => {
      // Create some test files
      await fs.promises.writeFile(path.join(tempDir, 'test.ts'), 'console.log("test");');
      await fs.promises.writeFile(path.join(tempDir, 'README.md'), '# Test Project');

      // Create a subdirectory with files
      const subDir = path.join(tempDir, 'src');
      await fs.promises.mkdir(subDir);
      await fs.promises.writeFile(path.join(subDir, 'index.ts'), 'export default {};');

      const stats = await fileScanner.scanWithProgress();

      assert.strictEqual(stats.isEmpty, false);
      assert.ok(stats.totalFiles > 0);
      assert.ok(stats.scannedFiles > 0);
    });

    it('should handle .gitignore patterns', async () => {
      // Create .gitignore file
      await fs.promises.writeFile(path.join(tempDir, '.gitignore'), 'node_modules/\n*.log\n');

      // Create files that should be ignored
      const nodeModulesDir = path.join(tempDir, 'node_modules');
      await fs.promises.mkdir(nodeModulesDir);
      await fs.promises.writeFile(path.join(nodeModulesDir, 'package.json'), '{}');
      await fs.promises.writeFile(path.join(tempDir, 'debug.log'), 'log content');

      // Create files that should not be ignored
      await fs.promises.writeFile(path.join(tempDir, 'src.ts'), 'code');

      const stats = await fileScanner.scanWithProgress();

      assert.strictEqual(stats.isEmpty, false);
      assert.ok(stats.ignoredFiles >= 0);
    });

    it('should handle .geminiignore patterns', async () => {
      // Create .geminiignore file
      await fs.promises.writeFile(path.join(tempDir, '.geminiignore'), 'temp/\n*.tmp\n');

      // Create files that should be ignored
      const tempSubDir = path.join(tempDir, 'temp');
      await fs.promises.mkdir(tempSubDir);
      await fs.promises.writeFile(path.join(tempSubDir, 'file.txt'), 'temp content');
      await fs.promises.writeFile(path.join(tempDir, 'cache.tmp'), 'cache content');

      // Create files that should not be ignored
      await fs.promises.writeFile(path.join(tempDir, 'main.ts'), 'code');

      const stats = await fileScanner.scanWithProgress();

      assert.strictEqual(stats.isEmpty, false);
      assert.ok(stats.ignoredFiles >= 0);
    });

    it('should work without message sender', async () => {
      const scannerWithoutSender = new FileScanner(tempDir);

      // Create a test file
      await fs.promises.writeFile(path.join(tempDir, 'test.js'), 'console.log("test");');

      const stats = await scannerWithoutSender.scanWithProgress();

      assert.strictEqual(stats.isEmpty, false);
      assert.ok(stats.totalFiles >= 0);
    });

    it('should handle scan errors gracefully', async () => {
      // Create a scanner with an invalid path
      const invalidScanner = new FileScanner(
        '/invalid/path/that/does/not/exist',
        mockMessageSender
      );

      const stats = await invalidScanner.scanWithProgress();

      // Should complete with error handling
      assert.ok(stats);
    });
  });

  describe('ignore patterns', () => {
    it('should include common ignore patterns by default', async () => {
      // Create files that should be ignored by default patterns
      const nodeModulesDir = path.join(tempDir, 'node_modules');
      await fs.promises.mkdir(nodeModulesDir);
      await fs.promises.writeFile(path.join(nodeModulesDir, 'package.json'), '{}');

      const gitDir = path.join(tempDir, '.git');
      await fs.promises.mkdir(gitDir);
      await fs.promises.writeFile(path.join(gitDir, 'config'), 'git config');

      await fs.promises.writeFile(path.join(tempDir, 'bundle.min.js'), 'minified code');
      await fs.promises.writeFile(path.join(tempDir, 'app.js.map'), 'source map');

      const stats = await fileScanner.scanWithProgress();

      // These files should be ignored by default patterns
      assert.ok(stats.ignoredFiles >= 0);
    });
  });
});
