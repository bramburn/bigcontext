/**
 * File Scanner for Enhanced Progress Messages
 * 
 * This module provides file scanning functionality specifically designed for
 * the enhanced progress messages feature. It builds upon the existing FileWalker
 * but focuses on providing real-time progress updates during file discovery.
 * 
 * The FileScanner is responsible for:
 * - Scanning the full file structure with progress updates
 * - Counting total files and ignored files
 * - Sending progress messages via postMessage
 * - Handling empty repositories gracefully
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import fastGlob from 'fast-glob';
import ignore from 'ignore';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

/**
 * Interface for sending file scan progress messages
 */
export interface IFileScanMessageSender {
  sendScanStart(message: string): void;
  sendScanProgress(scannedFiles: number, ignoredFiles: number, message: string): void;
  sendScanComplete(totalFiles: number, ignoredFiles: number, message: string): void;
}

/**
 * Progress message types for file scanning
 */
export interface ScanStartMessage {
  type: 'scanStart';
  payload: {
    message: string;
  };
}

export interface ScanProgressMessage {
  type: 'scanProgress';
  payload: {
    scannedFiles: number;
    ignoredFiles: number;
    message: string;
  };
}

export interface ScanCompleteMessage {
  type: 'scanComplete';
  payload: {
    totalFiles: number;
    ignoredFiles: number;
    message: string;
  };
}

export type ProgressMessage = ScanStartMessage | ScanProgressMessage | ScanCompleteMessage;

/**
 * Callback function type for progress updates
 */
export type ProgressCallback = (message: ProgressMessage) => void;

/**
 * File scanning statistics
 */
export interface ScanStatistics {
  totalFiles: number;
  ignoredFiles: number;
  scannedFiles: number;
  isEmpty: boolean;
}

/**
 * FileScanner class for enhanced file scanning with progress messages
 */
export class FileScanner {
  private workspaceRoot: string;
  private ignoreInstance: ReturnType<typeof ignore>;
  private messageSender?: IFileScanMessageSender;
  private loggingService?: CentralizedLoggingService;

  constructor(
    workspaceRoot: string,
    messageSender?: IFileScanMessageSender,
    loggingService?: CentralizedLoggingService
  ) {
    this.workspaceRoot = workspaceRoot;
    this.messageSender = messageSender;
    this.loggingService = loggingService;
    this.ignoreInstance = ignore();

    // Add common patterns to ignore by default
    this.ignoreInstance.add([
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'out/**',
      '*.min.js',
      '*.map',
      '.vscode/**',
      '.idea/**',
      '*.log',
      'coverage/**',
      '.nyc_output/**',
    ]);
  }

  /**
   * Load .gitignore and .geminiignore patterns
   */
  private async loadIgnorePatterns(): Promise<void> {
    const ignoreFiles = ['.gitignore', '.geminiignore'];
    
    for (const ignoreFile of ignoreFiles) {
      const ignorePath = path.join(this.workspaceRoot, ignoreFile);
      
      try {
        const ignoreContent = await fs.promises.readFile(ignorePath, 'utf8');
        const lines = ignoreContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        
        this.ignoreInstance.add(lines);
      } catch (error) {
        // Ignore file not found or not readable - this is normal
        console.log(`No ${ignoreFile} file found or not readable`);
      }
    }
  }

  /**
   * Check if the repository is empty
   */
  private async isRepositoryEmpty(): Promise<boolean> {
    try {
      const entries = await fs.promises.readdir(this.workspaceRoot);
      // Filter out hidden files and common non-code directories
      const relevantEntries = entries.filter(entry => 
        !entry.startsWith('.') && 
        entry !== 'node_modules' &&
        entry !== 'dist' &&
        entry !== 'build' &&
        entry !== 'out'
      );
      return relevantEntries.length === 0;
    } catch (error) {
      console.error('Error checking if repository is empty:', error);
      return false;
    }
  }

  /**
   * Send progress message using message sender
   */
  private sendProgressMessage(message: ProgressMessage): void {
    if (!this.messageSender) {
      return;
    }

    switch (message.type) {
      case 'scanStart':
        this.messageSender.sendScanStart(message.payload.message);
        break;
      case 'scanProgress':
        this.messageSender.sendScanProgress(
          message.payload.scannedFiles,
          message.payload.ignoredFiles,
          message.payload.message
        );
        break;
      case 'scanComplete':
        this.messageSender.sendScanComplete(
          message.payload.totalFiles,
          message.payload.ignoredFiles,
          message.payload.message
        );
        break;
    }
  }

  /**
   * Scan the full file structure with progress updates
   */
  public async scanWithProgress(): Promise<ScanStatistics> {
    try {
      this.loggingService?.info(
        'Starting file scan with progress',
        { workspaceRoot: this.workspaceRoot },
        'FileScanner'
      );

      // Send scan start message
      this.sendProgressMessage({
        type: 'scanStart',
        payload: {
          message: 'Scanning full file structure...'
        }
      });

      // Check if repository is empty
      const isEmpty = await this.isRepositoryEmpty();
      if (isEmpty) {
        const stats: ScanStatistics = {
          totalFiles: 0,
          ignoredFiles: 0,
          scannedFiles: 0,
          isEmpty: true
        };

        this.sendProgressMessage({
          type: 'scanComplete',
          payload: {
            totalFiles: 0,
            ignoredFiles: 0,
            message: 'Scan complete: Repository is empty.'
          }
        });

        return stats;
      }

      // Load ignore patterns
      await this.loadIgnorePatterns();

      // Initialize counters
      let totalFiles = 0;
      let ignoredFiles = 0;
      let scannedFiles = 0;

      // Define file patterns to search for
      const patterns = [
        '**/*.ts',
        '**/*.tsx',
        '**/*.js',
        '**/*.jsx',
        '**/*.py',
        '**/*.java',
        '**/*.c',
        '**/*.cpp',
        '**/*.h',
        '**/*.hpp',
        '**/*.cs',
        '**/*.php',
        '**/*.rb',
        '**/*.go',
        '**/*.rs',
        '**/*.swift',
        '**/*.kt',
        '**/*.scala',
        '**/*.clj',
        '**/*.hs',
        '**/*.ml',
        '**/*.fs',
        '**/*.elm',
        '**/*.dart',
        '**/*.lua',
        '**/*.r',
        '**/*.m',
        '**/*.sh',
        '**/*.bash',
        '**/*.zsh',
        '**/*.fish',
        '**/*.ps1',
        '**/*.bat',
        '**/*.cmd',
        '**/*.sql',
        '**/*.html',
        '**/*.css',
        '**/*.scss',
        '**/*.sass',
        '**/*.less',
        '**/*.vue',
        '**/*.svelte',
        '**/*.md',
        '**/*.mdx',
        '**/*.json',
        '**/*.yaml',
        '**/*.yml',
        '**/*.xml',
        '**/*.toml',
        '**/*.ini',
        '**/*.cfg',
        '**/*.conf',
        '**/*.config',
        '**/*.txt',
        '**/*.dockerfile',
        '**/Dockerfile*',
        '**/Makefile*',
        '**/*.mk'
      ];

      const updateInterval = 1000; // Update every 1000 files or every 2 seconds
      let lastUpdateTime = Date.now();

      try {
        // Use fast-glob for efficient file discovery
        const allFiles = await fastGlob(patterns, {
          cwd: this.workspaceRoot,
          absolute: true,
          dot: false,
          onlyFiles: true,
          ignore: ['node_modules/**', '.git/**'] // Basic ignore patterns for performance
        });

        totalFiles = allFiles.length;

        // Process files and apply ignore patterns
        for (const filePath of allFiles) {
          scannedFiles++;

          // Check if file should be ignored
          const relativePath = path.relative(this.workspaceRoot, filePath);
          if (this.ignoreInstance.ignores(relativePath)) {
            ignoredFiles++;
          }

          // Send progress update periodically
          const now = Date.now();
          if (scannedFiles % updateInterval === 0 || now - lastUpdateTime > 2000) {
            this.sendProgressMessage({
              type: 'scanProgress',
              payload: {
                scannedFiles,
                ignoredFiles,
                message: `Scanned ${scannedFiles} files, ${ignoredFiles} ignored...`
              }
            });
            lastUpdateTime = now;
          }
        }

        const stats: ScanStatistics = {
          totalFiles,
          ignoredFiles,
          scannedFiles,
          isEmpty: false
        };

        this.loggingService?.info(
          'File scan completed successfully',
          {
            totalFiles,
            ignoredFiles,
            scannedFiles,
            workspaceRoot: this.workspaceRoot
          },
          'FileScanner'
        );

        // Send completion message
        this.sendProgressMessage({
          type: 'scanComplete',
          payload: {
            totalFiles,
            ignoredFiles,
            message: `Scan complete: ${totalFiles} files in repo, ${ignoredFiles} files not considered.`
          }
        });

        return stats;

      } catch (innerError) {
        // Handle errors from the inner try block (fast-glob operations)
        throw innerError;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.loggingService?.error(
        'Error during file scanning',
        {
          error: errorMessage,
          workspaceRoot: this.workspaceRoot,
          scannedFiles: 0,
          ignoredFiles: 0
        },
        'FileScanner'
      );

      // Send error completion message
      this.sendProgressMessage({
        type: 'scanComplete',
        payload: {
          totalFiles: 0,
          ignoredFiles: 0,
          message: `Scan failed: ${errorMessage}`
        }
      });

      return {
        totalFiles: 0,
        ignoredFiles: 0,
        scannedFiles: 0,
        isEmpty: false
      };
    }
  }
}
