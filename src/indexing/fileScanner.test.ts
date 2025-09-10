import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileScanner, IFileScanMessageSender, ScanStatistics } from './fileScanner';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock the dependencies
vi.mock('fast-glob', () => ({
  default: vi.fn().mockResolvedValue([]),
}));

vi.mock('ignore', () => ({
  default: vi.fn(() => ({
    add: vi.fn(),
    ignores: vi.fn().mockReturnValue(false),
  })),
}));

describe('FileScanner', () => {
  let tempDir: string;
  let mockMessageSender: IFileScanMessageSender;
  let fileScanner: FileScanner;
  let mockFastGlob: any;
  let mockIgnoreInstance: any;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'fileScanner-test-'));

    // Create mock message sender
    mockMessageSender = {
      sendScanStart: vi.fn(),
      sendScanProgress: vi.fn(),
      sendScanComplete: vi.fn(),
    };

    // Get the mocked modules
    const fastGlob = await import('fast-glob');
    const ignore = await import('ignore');

    mockFastGlob = vi.mocked(fastGlob.default);
    mockIgnoreInstance = {
      add: vi.fn(),
      ignores: vi.fn().mockReturnValue(false),
    };

    // Reset mocks
    vi.clearAllMocks();
    mockFastGlob.mockResolvedValue([]);
    vi.mocked(ignore.default).mockReturnValue(mockIgnoreInstance);

    fileScanner = new FileScanner(tempDir, mockMessageSender);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.promises.rmdir(tempDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create a FileScanner instance with workspace root', () => {
      const scanner = new FileScanner('/test/path');
      expect(scanner).toBeInstanceOf(FileScanner);
    });

    it('should create a FileScanner instance with message sender', () => {
      const scanner = new FileScanner('/test/path', mockMessageSender);
      expect(scanner).toBeInstanceOf(FileScanner);
    });
  });

  describe('scanWithProgress', () => {
    it('should handle empty repository', async () => {
      // Create an empty directory
      const stats = await fileScanner.scanWithProgress();

      expect(stats.isEmpty).toBe(true);
      expect(stats.totalFiles).toBe(0);
      expect(stats.ignoredFiles).toBe(0);
      expect(stats.scannedFiles).toBe(0);

      // Verify messages were sent
      expect(mockMessageSender.sendScanStart).toHaveBeenCalledWith('Scanning full file structure...');
      expect(mockMessageSender.sendScanComplete).toHaveBeenCalledWith(
        0,
        0,
        'Scan complete: Repository is empty.'
      );
    });

    it('should scan files and send progress messages', async () => {
      // Create some test files
      await fs.promises.writeFile(path.join(tempDir, 'test.ts'), 'console.log("test");');
      await fs.promises.writeFile(path.join(tempDir, 'README.md'), '# Test Project');

      // Create a subdirectory with files
      const subDir = path.join(tempDir, 'src');
      await fs.promises.mkdir(subDir);
      await fs.promises.writeFile(path.join(subDir, 'index.ts'), 'export default {};');

      // Mock fast-glob to return the files we created
      const mockFiles = [
        path.join(tempDir, 'test.ts'),
        path.join(tempDir, 'README.md'),
        path.join(subDir, 'index.ts'),
      ];
      mockFastGlob.mockResolvedValue(mockFiles);

      const stats = await fileScanner.scanWithProgress();

      expect(stats.isEmpty).toBe(false);
      expect(stats.totalFiles).toBe(3);
      expect(stats.scannedFiles).toBe(3);

      // Verify scan start message was sent
      expect(mockMessageSender.sendScanStart).toHaveBeenCalledWith('Scanning full file structure...');

      // Verify scan complete message was sent
      expect(mockMessageSender.sendScanComplete).toHaveBeenCalled();
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

      // Mock fast-glob to return all files
      const mockFiles = [
        path.join(nodeModulesDir, 'package.json'),
        path.join(tempDir, 'debug.log'),
        path.join(tempDir, 'src.ts'),
      ];
      mockFastGlob.mockResolvedValue(mockFiles);

      // Mock ignore to return true for ignored files
      mockIgnoreInstance.ignores.mockImplementation((filePath: string) => {
        return filePath.includes('node_modules') || filePath.endsWith('.log');
      });

      const stats = await fileScanner.scanWithProgress();

      expect(stats.isEmpty).toBe(false);
      expect(stats.ignoredFiles).toBe(2); // package.json and debug.log should be ignored
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

      expect(stats.isEmpty).toBe(false);
      expect(stats.ignoredFiles).toBeGreaterThan(0);
    });

    it('should work without message sender', async () => {
      const scannerWithoutSender = new FileScanner(tempDir);
      
      // Create a test file
      await fs.promises.writeFile(path.join(tempDir, 'test.js'), 'console.log("test");');

      const stats = await scannerWithoutSender.scanWithProgress();

      expect(stats.isEmpty).toBe(false);
      expect(stats.totalFiles).toBeGreaterThan(0);
    });

    it('should handle scan errors gracefully', async () => {
      // Create a scanner with an invalid path
      const invalidScanner = new FileScanner('/invalid/path/that/does/not/exist', mockMessageSender);

      const stats = await invalidScanner.scanWithProgress();

      // Should complete with error handling
      expect(stats).toBeDefined();
      expect(mockMessageSender.sendScanComplete).toHaveBeenCalled();
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
      expect(stats.ignoredFiles).toBeGreaterThan(0);
    });
  });
});
