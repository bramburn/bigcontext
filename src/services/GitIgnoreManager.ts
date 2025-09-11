/**
 * Git Ignore Manager Service
 *
 * Handles .gitignore file creation and updates to ensure that
 * .context/config.json is properly excluded from version control.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { IGitIgnoreManager } from './interfaces/IConfigurationService';

/**
 * Implementation of the Git ignore manager
 */
export class GitIgnoreManager implements IGitIgnoreManager {
  private static readonly GITIGNORE_FILENAME = '.gitignore';
  private static readonly CONFIG_PATTERN = '.context/config.json';

  /**
   * Ensures a given pattern is present in the .gitignore file.
   * Creates the .gitignore file if it doesn't exist.
   *
   * @param pattern The pattern to add (e.g., '.context/config.json')
   * @param workspaceRoot The workspace root directory
   */
  public async ensurePatternPresent(pattern: string, workspaceRoot: string): Promise<void> {
    try {
      const gitignorePath = path.join(workspaceRoot, GitIgnoreManager.GITIGNORE_FILENAME);

      // Create .gitignore if it doesn't exist
      await this.createGitIgnoreIfNotExists(workspaceRoot);

      // Check if pattern already exists
      const exists = await this.patternExists(pattern, workspaceRoot);
      if (exists) {
        console.log(`GitIgnoreManager: Pattern '${pattern}' already exists in .gitignore`);
        return;
      }

      // Read current content
      let content = '';
      try {
        content = await fs.readFile(gitignorePath, 'utf-8');
      } catch (error) {
        // File doesn't exist, start with empty content
        console.log('GitIgnoreManager: .gitignore file not found, creating new one');
      }

      // Add pattern with proper formatting
      const normalizedContent = content.trim();
      const newContent = normalizedContent
        ? `${normalizedContent}\n\n# Code Context Engine configuration\n${pattern}\n`
        : `# Code Context Engine configuration\n${pattern}\n`;

      // Write updated content
      await fs.writeFile(gitignorePath, newContent, 'utf-8');
      console.log(`GitIgnoreManager: Added pattern '${pattern}' to .gitignore`);
    } catch (error) {
      console.error(`GitIgnoreManager: Failed to update .gitignore:`, error);
      throw new Error(
        `Failed to update .gitignore: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Checks if a pattern exists in the .gitignore file.
   *
   * @param pattern The pattern to check for
   * @param workspaceRoot The workspace root directory
   * @returns True if the pattern exists
   */
  public async patternExists(pattern: string, workspaceRoot: string): Promise<boolean> {
    try {
      const gitignorePath = path.join(workspaceRoot, GitIgnoreManager.GITIGNORE_FILENAME);

      // Check if .gitignore exists
      try {
        await fs.access(gitignorePath);
      } catch {
        return false; // File doesn't exist
      }

      // Read and check content
      const content = await fs.readFile(gitignorePath, 'utf-8');
      const lines = content.split('\n').map(line => line.trim());

      return lines.includes(pattern);
    } catch (error) {
      console.error(`GitIgnoreManager: Failed to check pattern existence:`, error);
      return false;
    }
  }

  /**
   * Creates a .gitignore file if it doesn't exist.
   *
   * @param workspaceRoot The workspace root directory
   */
  public async createGitIgnoreIfNotExists(workspaceRoot: string): Promise<void> {
    try {
      const gitignorePath = path.join(workspaceRoot, GitIgnoreManager.GITIGNORE_FILENAME);

      // Check if file already exists
      try {
        await fs.access(gitignorePath);
        return; // File exists, nothing to do
      } catch {
        // File doesn't exist, create it
      }

      // Create empty .gitignore file
      await fs.writeFile(gitignorePath, '', 'utf-8');
      console.log('GitIgnoreManager: Created new .gitignore file');
    } catch (error) {
      console.error(`GitIgnoreManager: Failed to create .gitignore:`, error);
      throw new Error(
        `Failed to create .gitignore: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ensures the default configuration pattern is present in .gitignore.
   * This is a convenience method for the most common use case.
   *
   * @param workspaceRoot The workspace root directory
   */
  public async ensureConfigPatternPresent(workspaceRoot: string): Promise<void> {
    await this.ensurePatternPresent(GitIgnoreManager.CONFIG_PATTERN, workspaceRoot);
  }
}
