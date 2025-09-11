/**
 * File system traversal and management utilities.
 * This module provides functionality for walking through a workspace,
 * finding files based on patterns, and filtering them according to ignore rules.
 *
 * The FileWalker class is responsible for discovering all relevant code files
 * in a workspace while respecting .gitignore patterns and other exclusion rules.
 * It supports multiple programming languages and file types, making it
 * suitable for diverse codebases.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import ignore from 'ignore';

/**
 * FileWalker class for traversing and filtering files in a workspace.
 * Handles file discovery, pattern matching, and respects gitignore rules.
 *
 * This class implements a comprehensive file discovery system that:
 * - Scans the entire workspace directory tree
 * - Supports multiple programming languages and file extensions
 * - Respects .gitignore and custom ignore patterns
 * - Provides statistics about discovered files
 * - Filters out non-code files and build artifacts
 */
export class FileWalker {
  /** Root directory of the workspace to scan */
  private workspaceRoot: string;
  /** Instance of ignore package to handle file exclusion patterns */
  private ignoreInstance: ReturnType<typeof ignore>;

  /**
   * Creates a new FileWalker instance
   * @param workspaceRoot - The absolute path to the workspace root directory
   *
   * Initializes the FileWalker with the workspace root directory and sets up
   * default ignore patterns for common build artifacts and directories.
   */
  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.ignoreInstance = ignore();

    // Add common patterns to ignore by default
    // These patterns exclude build artifacts, dependencies, and IDE configurations
    this.ignoreInstance.add([
      'node_modules/**', // Node.js dependencies
      '.git/**', // Git version control directory
      'dist/**', // Distribution/build directories
      'build/**', // Build output directories
      'out/**', // Output directories
      '*.min.js', // Minified JavaScript files
      '*.map', // Source map files
      '.vscode/**', // VS Code workspace configuration
      '.idea/**', // IntelliJ IDEA workspace configuration
      '*.log', // Log files
      'coverage/**', // Code coverage reports
      '.nyc_output/**', // NYC test coverage output
    ]);
  }

  /**
   * Loads and parses the .gitignore file from the workspace root
   * Adds all valid ignore patterns to the ignore instance
   * If no .gitignore file is found, continues with default patterns
   *
   * This method reads the .gitignore file (if it exists) and processes each line
   * to extract valid ignore patterns. It filters out comments (lines starting with #)
   * and empty lines, then adds the valid patterns to the ignore instance.
   *
   * @returns Promise that resolves when gitignore is loaded
   */
  private async loadGitignore(): Promise<void> {
    const gitignorePath = path.join(this.workspaceRoot, '.gitignore');

    try {
      // Read the gitignore file content
      const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf8');
      // Process the content: split by lines, trim whitespace, and filter out comments and empty lines
      const lines = gitignoreContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

      // Add the processed patterns to our ignore instance
      this.ignoreInstance.add(lines);
    } catch (error) {
      // .gitignore file not found or not readable, continue with default patterns
      // This is not an error - we just use the default ignore patterns
      console.log('No .gitignore file found or not readable, using default ignore patterns');
    }
  }

  /**
   * Finds all files in the workspace that match the specified patterns
   * and aren't excluded by ignore rules
   *
   * This method performs a comprehensive search for all relevant files in the workspace.
   * It first loads .gitignore patterns, then searches for files matching multiple
   * patterns for different programming languages and file types. The results are
   * deduplicated and filtered according to the ignore rules.
   *
   * @returns Promise resolving to an array of absolute file paths
   */
  public async findAllFiles(): Promise<string[]> {
    // Load gitignore patterns before searching for files
    // This ensures we respect the project's ignore rules
    await this.loadGitignore();

    // Define patterns for code files we want to index
    // Includes most common programming languages and config file types
    const patterns = [
      '**/*.ts', // TypeScript
      '**/*.tsx', // TypeScript React
      '**/*.js', // JavaScript
      '**/*.jsx', // JavaScript React
      '**/*.py', // Python
      '**/*.cs', // C#
      '**/*.java', // Java
      '**/*.cpp', // C++
      '**/*.c', // C
      '**/*.h', // C/C++ header
      '**/*.hpp', // C++ header
      '**/*.go', // Go
      '**/*.rs', // Rust
      '**/*.php', // PHP
      '**/*.rb', // Ruby
      '**/*.swift', // Swift
      '**/*.kt', // Kotlin
      '**/*.scala', // Scala
      '**/*.clj', // Clojure
      '**/*.sh', // Shell script
      '**/*.ps1', // PowerShell
      '**/*.sql', // SQL
      '**/*.md', // Markdown
      '**/*.json', // JSON
      '**/*.yaml', // YAML
      '**/*.yml', // YAML alternative
      '**/*.xml', // XML
      '**/*.html', // HTML
      '**/*.css', // CSS
      '**/*.scss', // SCSS
      '**/*.less', // LESS
    ];

    const allFiles: string[] = [];

    // Process each pattern and collect matching files
    // We use glob to efficiently find files matching each pattern
    for (const pattern of patterns) {
      try {
        // Use glob to find files matching the current pattern
        const files = await new Promise<string[]>((resolve, reject) => {
          glob.glob(
            pattern,
            {
              cwd: this.workspaceRoot,
              absolute: true, // Return absolute paths
              nodir: true, // Don't include directories
              dot: false, // Ignore dot files by default
            },
            (err, matches) => {
              if (err) {
                reject(err);
              } else {
                resolve(matches);
              }
            }
          );
        });
        // Add found files to our collection
        allFiles.push(...files);
      } catch (error) {
        console.error(`Error finding files with pattern ${pattern}:`, error);
      }
    }

    // Remove duplicates (files that match multiple patterns)
    // For example, a .ts file might match both '**/*.ts' and '**/*.tsx' patterns
    const uniqueFiles = [...new Set(allFiles)];

    // Apply ignore patterns to filter out excluded files
    // This respects both .gitignore patterns and our default ignore patterns
    const filteredFiles = uniqueFiles.filter(filePath => {
      // Convert to relative path for ignore pattern matching
      const relativePath = path.relative(this.workspaceRoot, filePath);
      return !this.ignoreInstance.ignores(relativePath);
    });

    return filteredFiles;
  }

  /**
   * Collects statistics about files in the workspace
   *
   * This method provides insights into the composition of the workspace by
   * counting files by their extensions. This information can be useful for
   * understanding the technology stack and estimating indexing time.
   *
   * @returns Promise resolving to an object containing:
   *   - totalFiles: The total number of files found
   *   - filesByExtension: A record mapping file extensions to their count
   */
  public async getFileStats(): Promise<{
    totalFiles: number;
    filesByExtension: Record<string, number>;
  }> {
    // Get all files in the workspace
    const files = await this.findAllFiles();
    const filesByExtension: Record<string, number> = {};

    // Count files by extension
    // This helps understand the distribution of file types in the workspace
    files.forEach(filePath => {
      const ext = path.extname(filePath).toLowerCase();
      filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;
    });

    return {
      totalFiles: files.length,
      filesByExtension,
    };
  }

  /**
   * Determines if a file is a code file based on its extension
   *
   * This method checks if a file has a code-related extension, which helps
   * distinguish between source code files and configuration files, documentation,
   * or other non-code files that might be present in the workspace.
   *
   * @param filePath - The path to the file to check
   * @returns true if the file is a code file, false otherwise
   */
  public isCodeFile(filePath: string): boolean {
    // List of extensions considered as code files
    // This includes most common programming language source files
    const codeExtensions = [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.py',
      '.cs',
      '.java',
      '.cpp',
      '.c',
      '.h',
      '.hpp',
      '.go',
      '.rs',
      '.php',
      '.rb',
      '.swift',
      '.kt',
      '.scala',
      '.clj',
    ];

    // Extract and check the file extension
    const ext = path.extname(filePath).toLowerCase();
    return codeExtensions.includes(ext);
  }
}
