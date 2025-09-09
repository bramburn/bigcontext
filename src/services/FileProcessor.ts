/**
 * File Processor Service
 * 
 * This service handles file discovery, reading, parsing, and chunking operations
 * for the RAG for LLM VS Code extension. It processes project files and converts
 * them into chunks suitable for embedding generation and vector storage.
 * 
 * The service supports multiple programming languages and file types, handles
 * binary file detection, and respects .gitignore patterns.
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as glob from 'glob';
import { 
  ProjectFileMetadata, 
  DetailedFileMetadata,
  FileChunk,
  FileProcessingError,
  FileFilterConfig,
  SupportedLanguage,
  ChunkType,
  createFileMetadata,
  LANGUAGE_DETECTION,
  DEFAULT_FILE_FILTER
} from '../models/projectFileMetadata';
import { IndexingConfiguration } from '../models/indexingProgress';

/**
 * File processing result
 */
export interface FileProcessingResult {
  /** Whether processing was successful */
  success: boolean;
  
  /** File metadata */
  metadata: DetailedFileMetadata;
  
  /** Generated chunks */
  chunks: FileChunk[];
  
  /** Processing errors */
  errors: FileProcessingError[];
  
  /** Processing duration in milliseconds */
  duration: number;
}

/**
 * Chunk generation options
 */
export interface ChunkOptions {
  /** Target chunk size in characters */
  targetSize: number;
  
  /** Overlap between chunks in characters */
  overlap: number;
  
  /** Minimum chunk size in characters */
  minSize: number;
  
  /** Maximum chunk size in characters */
  maxSize: number;
  
  /** Whether to preserve code structure */
  preserveStructure: boolean;
}

/**
 * FileProcessor Class
 * 
 * Provides comprehensive file processing capabilities including:
 * - File discovery and filtering
 * - Content reading and encoding detection
 * - Language detection and parsing
 * - Code chunking and structure analysis
 * - Binary file detection and handling
 * - Error handling and recovery
 */
export class FileProcessor {
  /** VS Code extension context */
  private context: vscode.ExtensionContext;
  
  /** File filter configuration */
  private filterConfig: FileFilterConfig;
  
  /** Default chunk options */
  private defaultChunkOptions: ChunkOptions = {
    targetSize: 1000,
    overlap: 200,
    minSize: 100,
    maxSize: 2000,
    preserveStructure: true,
  };
  
  /**
   * Creates a new FileProcessor instance
   * 
   * @param context VS Code extension context
   * @param filterConfig Optional file filter configuration
   */
  constructor(context: vscode.ExtensionContext, filterConfig?: FileFilterConfig) {
    this.context = context;
    this.filterConfig = filterConfig || DEFAULT_FILE_FILTER;
  }
  
  /**
   * Discover files in workspace
   * 
   * Finds all files in the workspace that match the filter criteria
   * and indexing configuration.
   * 
   * @param workspaceRoot Workspace root directory
   * @param config Indexing configuration
   * @returns Array of file metadata
   */
  public async discoverFiles(
    workspaceRoot: string,
    config: IndexingConfiguration
  ): Promise<ProjectFileMetadata[]> {
    try {
      const files: ProjectFileMetadata[] = [];
      
      // Use glob patterns to find files
      const patterns = config.includePatterns.length > 0 
        ? config.includePatterns 
        : this.filterConfig.include;
      
      for (const pattern of patterns) {
        const matches = await this.globFiles(pattern, workspaceRoot);
        
        for (const filePath of matches) {
          // Check if file should be excluded
          if (this.shouldExcludeFile(filePath, workspaceRoot, config)) {
            continue;
          }
          
          try {
            const stats = await fs.stat(filePath);
            
            // Check file size limits
            if (stats.size > config.maxFileSize || stats.size < 1) {
              continue;
            }
            
            // Create file metadata
            const metadata = createFileMetadata(filePath, workspaceRoot, stats);
            
            // Detect if file is binary
            metadata.isBinary = await this.isBinaryFile(filePath);
            
            // Skip binary files if not configured to process them
            if (metadata.isBinary && !config.processBinaryFiles) {
              continue;
            }
            
            files.push(metadata);
            
          } catch (error) {
            console.warn(`FileProcessor: Failed to stat file ${filePath}:`, error);
          }
        }
      }
      
      console.log(`FileProcessor: Discovered ${files.length} files for processing`);
      return files;
      
    } catch (error) {
      console.error('FileProcessor: Failed to discover files:', error);
      throw new Error(`File discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Process a single file
   * 
   * Reads, parses, and chunks a file, returning detailed processing results.
   * 
   * @param fileMetadata File metadata
   * @param chunkOptions Optional chunk options
   * @returns Processing result
   */
  public async processFile(
    fileMetadata: ProjectFileMetadata,
    chunkOptions?: ChunkOptions
  ): Promise<FileProcessingResult> {
    const startTime = Date.now();
    const errors: FileProcessingError[] = [];
    const options = { ...this.defaultChunkOptions, ...chunkOptions };
    
    try {
      // Read file content
      const content = await this.readFileContent(fileMetadata.filePath);
      
      // Update metadata with content information
      const detailedMetadata: DetailedFileMetadata = {
        ...fileMetadata,
        lineCount: content.split('\n').length,
        characterCount: content.length,
        processing: {
          startTime: new Date(startTime),
        },
        chunking: {
          totalChunks: 0,
          averageChunkSize: 0,
          chunkOverlap: options.overlap,
          chunkingStrategy: 'sliding_window',
        },
        analysis: {
          symbols: {
            functions: 0,
            classes: 0,
            interfaces: 0,
            variables: 0,
            imports: 0,
            exports: 0,
          },
        },
        errors: [],
        performance: {
          parseTime: 0,
          chunkTime: 0,
          embeddingTime: 0,
          storageTime: 0,
        },
      };
      
      // Generate chunks
      const chunkStartTime = Date.now();
      const chunks = await this.generateChunks(fileMetadata, content, options);
      const chunkEndTime = Date.now();
      
      // Update chunking metadata
      detailedMetadata.chunking.totalChunks = chunks.length;
      detailedMetadata.chunking.averageChunkSize = chunks.length > 0 
        ? Math.round(chunks.reduce((sum, chunk) => sum + chunk.size, 0) / chunks.length)
        : 0;
      detailedMetadata.performance!.chunkTime = chunkEndTime - chunkStartTime;
      
      // Update processing completion
      const endTime = Date.now();
      detailedMetadata.processing.endTime = new Date(endTime);
      detailedMetadata.processing.duration = endTime - startTime;
      detailedMetadata.status = 'completed';
      
      return {
        success: true,
        metadata: detailedMetadata,
        chunks,
        errors,
        duration: endTime - startTime,
      };
      
    } catch (error) {
      const processingError: FileProcessingError = {
        id: `error_${Date.now()}`,
        type: 'read_error',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
        recoverable: false,
        timestamp: new Date(),
      };
      
      errors.push(processingError);
      
      return {
        success: false,
        metadata: {
          ...fileMetadata,
          status: 'failed',
          processing: {
            startTime: new Date(startTime),
            endTime: new Date(),
            duration: Date.now() - startTime,
          },
          chunking: {
            totalChunks: 0,
            averageChunkSize: 0,
            chunkOverlap: 0,
            chunkingStrategy: 'none',
          },
          analysis: {},
          errors: [processingError],
        } as DetailedFileMetadata,
        chunks: [],
        errors,
        duration: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Generate chunks from file content
   * 
   * @param fileMetadata File metadata
   * @param content File content
   * @param options Chunk options
   * @returns Array of file chunks
   */
  private async generateChunks(
    fileMetadata: ProjectFileMetadata,
    content: string,
    options: ChunkOptions
  ): Promise<FileChunk[]> {
    const chunks: FileChunk[] = [];
    const lines = content.split('\n');
    
    // For now, implement simple sliding window chunking
    // In a real implementation, this would use AST parsing for code structure
    
    let currentChunk = '';
    let currentStartLine = 1;
    let currentStartChar = 0;
    let chunkIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineWithNewline = line + (i < lines.length - 1 ? '\n' : '');
      
      // Check if adding this line would exceed target size
      if (currentChunk.length + lineWithNewline.length > options.targetSize && currentChunk.length >= options.minSize) {
        // Create chunk
        const chunk = this.createChunk(
          fileMetadata,
          currentChunk,
          chunkIndex,
          currentStartLine,
          i,
          currentStartChar,
          currentStartChar + currentChunk.length
        );
        
        chunks.push(chunk);
        
        // Start new chunk with overlap
        const overlapLines = Math.floor(options.overlap / (currentChunk.length / (i - currentStartLine + 1)));
        const overlapStartLine = Math.max(currentStartLine, i - overlapLines + 1);
        
        currentChunk = lines.slice(overlapStartLine, i + 1).join('\n') + '\n';
        currentStartLine = overlapStartLine + 1;
        currentStartChar += currentChunk.length - (lines.slice(overlapStartLine, i + 1).join('\n') + '\n').length;
        chunkIndex++;
      } else {
        currentChunk += lineWithNewline;
      }
    }
    
    // Add final chunk if there's remaining content
    if (currentChunk.trim().length >= options.minSize) {
      const chunk = this.createChunk(
        fileMetadata,
        currentChunk,
        chunkIndex,
        currentStartLine,
        lines.length,
        currentStartChar,
        currentStartChar + currentChunk.length
      );
      
      chunks.push(chunk);
    }
    
    return chunks;
  }
  
  /**
   * Create a file chunk
   * 
   * @param fileMetadata File metadata
   * @param content Chunk content
   * @param index Chunk index
   * @param startLine Start line number
   * @param endLine End line number
   * @param startChar Start character position
   * @param endChar End character position
   * @returns File chunk
   */
  private createChunk(
    fileMetadata: ProjectFileMetadata,
    content: string,
    index: number,
    startLine: number,
    endLine: number,
    startChar: number,
    endChar: number
  ): FileChunk {
    return {
      id: `${fileMetadata.id}_chunk_${index}`,
      fileId: fileMetadata.id,
      chunkIndex: index,
      type: this.detectChunkType(content, fileMetadata.language),
      content: content.trim(),
      startLine,
      endLine,
      startChar,
      endChar,
      size: content.trim().length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  /**
   * Detect chunk type based on content and language
   * 
   * @param content Chunk content
   * @param language Programming language
   * @returns Chunk type
   */
  private detectChunkType(content: string, language: SupportedLanguage): ChunkType {
    // Simple heuristic-based detection
    // In a real implementation, this would use AST analysis
    
    const trimmedContent = content.trim();
    
    if (trimmedContent.includes('function ') || trimmedContent.includes('def ')) {
      return 'function';
    }
    
    if (trimmedContent.includes('class ')) {
      return 'class';
    }
    
    if (trimmedContent.includes('interface ')) {
      return 'interface';
    }
    
    if (trimmedContent.includes('import ') || trimmedContent.includes('from ')) {
      return 'import';
    }
    
    if (trimmedContent.includes('export ')) {
      return 'export';
    }
    
    if (trimmedContent.startsWith('//') || trimmedContent.startsWith('/*') || trimmedContent.startsWith('#')) {
      return 'comment';
    }
    
    return 'code_block';
  }
  
  /**
   * Read file content with encoding detection
   * 
   * @param filePath File path
   * @returns File content as string
   */
  private async readFileContent(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath);
      
      // Simple UTF-8 detection and fallback
      try {
        return buffer.toString('utf8');
      } catch {
        return buffer.toString('latin1');
      }
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check if file is binary
   * 
   * @param filePath File path
   * @returns True if file is binary
   */
  private async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath, { encoding: null });
      
      // Check for null bytes (common in binary files)
      for (let i = 0; i < Math.min(buffer.length, 8000); i++) {
        if (buffer[i] === 0) {
          return true;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }
  
  /**
   * Use glob to find files matching pattern
   * 
   * @param pattern Glob pattern
   * @param workspaceRoot Workspace root
   * @returns Array of file paths
   */
  private async globFiles(pattern: string, workspaceRoot: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      glob.glob(pattern, {
        cwd: workspaceRoot,
        absolute: true,
        nodir: true,
        dot: false,
      }, (err, matches) => {
        if (err) {
          reject(err);
        } else {
          resolve(matches);
        }
      });
    });
  }
  
  /**
   * Check if file should be excluded
   * 
   * @param filePath File path
   * @param workspaceRoot Workspace root
   * @param config Indexing configuration
   * @returns True if file should be excluded
   */
  private shouldExcludeFile(
    filePath: string,
    workspaceRoot: string,
    config: IndexingConfiguration
  ): boolean {
    const relativePath = path.relative(workspaceRoot, filePath);
    
    // Check exclude patterns
    for (const pattern of config.excludePatterns) {
      if (this.matchesPattern(relativePath, pattern)) {
        return true;
      }
    }
    
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (config.supportedExtensions.length > 0 && !config.supportedExtensions.includes(ext)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if path matches glob pattern
   * 
   * @param filePath File path
   * @param pattern Glob pattern
   * @returns True if matches
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple pattern matching - in real implementation would use minimatch
    if (pattern.includes('**')) {
      const parts = pattern.split('**');
      return filePath.includes(parts[0]) && (parts[1] ? filePath.endsWith(parts[1]) : true);
    }
    
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    
    return filePath.includes(pattern);
  }
}
