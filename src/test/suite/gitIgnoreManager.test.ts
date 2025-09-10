/**
 * GitIgnore Manager Tests
 * 
 * Tests for the GitIgnore manager that handles .gitignore file operations
 */

import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { GitIgnoreManager } from '../../services/GitIgnoreManager';

describe('GitIgnoreManager', () => {
  let tempDir: string;
  let gitIgnoreManager: GitIgnoreManager;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitignore-test-'));
    gitIgnoreManager = new GitIgnoreManager();
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  describe('createGitIgnoreIfNotExists', () => {
    it('should create .gitignore file if it does not exist', async () => {
      await gitIgnoreManager.createGitIgnoreIfNotExists(tempDir);
      
      const gitignorePath = path.join(tempDir, '.gitignore');
      const exists = await fs.access(gitignorePath).then(() => true).catch(() => false);
      assert.strictEqual(exists, true);
    });

    it('should not overwrite existing .gitignore file', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      const existingContent = 'node_modules/\n*.log\n';
      await fs.writeFile(gitignorePath, existingContent);

      await gitIgnoreManager.createGitIgnoreIfNotExists(tempDir);
      
      const content = await fs.readFile(gitignorePath, 'utf-8');
      assert.strictEqual(content, existingContent);
    });
  });

  describe('patternExists', () => {
    it('should return false when .gitignore does not exist', async () => {
      const exists = await gitIgnoreManager.patternExists('.context/config.json', tempDir);
      assert.strictEqual(exists, false);
    });

    it('should return false when pattern does not exist in .gitignore', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n*.log\n');

      const exists = await gitIgnoreManager.patternExists('.context/config.json', tempDir);
      assert.strictEqual(exists, false);
    });

    it('should return true when pattern exists in .gitignore', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n.context/config.json\n*.log\n');

      const exists = await gitIgnoreManager.patternExists('.context/config.json', tempDir);
      assert.strictEqual(exists, true);
    });

    it('should handle whitespace and empty lines correctly', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, '\nnode_modules/\n  \n.context/config.json  \n\n*.log\n');

      const exists = await gitIgnoreManager.patternExists('.context/config.json', tempDir);
      assert.strictEqual(exists, true);
    });
  });

  describe('ensurePatternPresent', () => {
    it('should add pattern to new .gitignore file', async () => {
      await gitIgnoreManager.ensurePatternPresent('.context/config.json', tempDir);
      
      const gitignorePath = path.join(tempDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf-8');
      
      assert.ok(content.includes('.context/config.json'));
      assert.ok(content.includes('# Code Context Engine configuration'));
    });

    it('should add pattern to existing .gitignore file', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      const existingContent = 'node_modules/\n*.log\n';
      await fs.writeFile(gitignorePath, existingContent);

      await gitIgnoreManager.ensurePatternPresent('.context/config.json', tempDir);
      
      const content = await fs.readFile(gitignorePath, 'utf-8');
      
      assert.ok(content.includes('node_modules/'));
      assert.ok(content.includes('*.log'));
      assert.ok(content.includes('.context/config.json'));
      assert.ok(content.includes('# Code Context Engine configuration'));
    });

    it('should not duplicate pattern if it already exists', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n.context/config.json\n*.log\n');

      await gitIgnoreManager.ensurePatternPresent('.context/config.json', tempDir);
      
      const content = await fs.readFile(gitignorePath, 'utf-8');
      const occurrences = (content.match(/\.context\/config\.json/g) || []).length;
      
      assert.strictEqual(occurrences, 1);
    });

    it('should handle empty .gitignore file', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, '');

      await gitIgnoreManager.ensurePatternPresent('.context/config.json', tempDir);
      
      const content = await fs.readFile(gitignorePath, 'utf-8');
      
      assert.ok(content.includes('.context/config.json'));
      assert.ok(content.includes('# Code Context Engine configuration'));
    });

    it('should handle .gitignore file with only whitespace', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, '   \n\n  \n');

      await gitIgnoreManager.ensurePatternPresent('.context/config.json', tempDir);
      
      const content = await fs.readFile(gitignorePath, 'utf-8');
      
      assert.ok(content.includes('.context/config.json'));
      assert.ok(content.includes('# Code Context Engine configuration'));
    });

    it('should format content properly with existing content', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n*.log');

      await gitIgnoreManager.ensurePatternPresent('.context/config.json', tempDir);
      
      const content = await fs.readFile(gitignorePath, 'utf-8');
      const lines = content.split('\n');
      
      // Should have proper spacing and formatting
      assert.ok(lines.includes('node_modules/'));
      assert.ok(lines.includes('*.log'));
      assert.ok(lines.includes(''));
      assert.ok(lines.includes('# Code Context Engine configuration'));
      assert.ok(lines.includes('.context/config.json'));
    });
  });

  describe('ensureConfigPatternPresent', () => {
    it('should add default config pattern', async () => {
      await gitIgnoreManager.ensureConfigPatternPresent(tempDir);
      
      const gitignorePath = path.join(tempDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf-8');
      
      assert.ok(content.includes('.context/config.json'));
    });
  });

  describe('error handling', () => {
    it('should handle permission errors gracefully', async () => {
      // This test might not work on all systems, but we can test the error handling structure
      const invalidPath = '/root/invalid-path-that-should-not-exist';
      
      await assert.rejects(
        () => gitIgnoreManager.ensurePatternPresent('.context/config.json', invalidPath),
        /Failed to update \.gitignore/
      );
    });

    it('should handle invalid workspace paths', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent-directory');
      
      await assert.rejects(
        () => gitIgnoreManager.ensurePatternPresent('.context/config.json', nonExistentPath),
        /Failed to update \.gitignore/
      );
    });
  });

  describe('edge cases', () => {
    it('should handle patterns with special characters', async () => {
      const specialPattern = '.context/*.json';
      
      await gitIgnoreManager.ensurePatternPresent(specialPattern, tempDir);
      
      const exists = await gitIgnoreManager.patternExists(specialPattern, tempDir);
      assert.strictEqual(exists, true);
    });

    it('should handle very long patterns', async () => {
      const longPattern = '.context/' + 'a'.repeat(200) + '.json';
      
      await gitIgnoreManager.ensurePatternPresent(longPattern, tempDir);
      
      const exists = await gitIgnoreManager.patternExists(longPattern, tempDir);
      assert.strictEqual(exists, true);
    });

    it('should handle patterns with leading/trailing whitespace', async () => {
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, '  .context/config.json  \n');

      const exists = await gitIgnoreManager.patternExists('.context/config.json', tempDir);
      assert.strictEqual(exists, true);
    });
  });
});
