/**
 * Project File Metadata Data Models
 * 
 * This module defines the data models for tracking project files and their metadata
 * during the indexing process. These models support file processing, chunking,
 * and embedding generation workflows.
 * 
 * These models align with:
 * - Existing file processing patterns in the codebase
 * - Chunking and parsing requirements
 * - Vector storage and retrieval needs
 */

/**
 * Supported programming languages for file processing
 */
export type SupportedLanguage = 
  | "typescript"
  | "javascript" 
  | "python"
  | "java"
  | "cpp"
  | "c"
  | "csharp"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "scala"
  | "html"
  | "css"
  | "json"
  | "yaml"
  | "markdown"
  | "text"
  | "unknown";

/**
 * File processing status
 */
export type FileProcessingStatus = 
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

/**
 * Chunk type classification
 */
export type ChunkType = 
  | "function"
  | "class"
  | "interface"
  | "method"
  | "property"
  | "comment"
  | "import"
  | "export"
  | "variable"
  | "type"
  | "namespace"
  | "module"
  | "documentation"
  | "code_block"
  | "text_block"
  | "unknown";

/**
 * Core project file metadata
 * 
 * This interface represents essential information about a file
 * in the project that is being indexed.
 */
export interface ProjectFileMetadata {
  /** Unique identifier for the file */
  id: string;
  
  /** Absolute file path */
  filePath: string;
  
  /** Relative path from project root */
  relativePath: string;
  
  /** File name with extension */
  fileName: string;
  
  /** File extension */
  extension: string;
  
  /** Detected programming language */
  language: SupportedLanguage;
  
  /** File size in bytes */
  fileSize: number;
  
  /** File modification timestamp */
  lastModified: Date;
  
  /** File creation timestamp */
  created: Date;
  
  /** Processing status */
  status: FileProcessingStatus;
  
  /** Number of lines in the file */
  lineCount: number;
  
  /** Number of characters in the file */
  characterCount: number;
  
  /** File encoding (e.g., 'utf-8') */
  encoding: string;
  
  /** Whether the file is binary */
  isBinary: boolean;
  
  /** Git information (if available) */
  git?: {
    lastCommit?: string;
    lastAuthor?: string;
    lastCommitDate?: Date;
    branch?: string;
  };
}

/**
 * Extended file metadata with processing details
 */
export interface DetailedFileMetadata extends ProjectFileMetadata {
  /** Processing timestamps */
  processing: {
    startTime?: Date;
    endTime?: Date;
    duration?: number; // milliseconds
  };
  
  /** Chunking information */
  chunking: {
    totalChunks: number;
    averageChunkSize: number;
    chunkOverlap: number;
    chunkingStrategy: string;
  };
  
  /** Content analysis */
  analysis: {
    /** Complexity metrics */
    complexity?: {
      cyclomaticComplexity?: number;
      cognitiveComplexity?: number;
      linesOfCode?: number;
      linesOfComments?: number;
    };
    
    /** Detected symbols and structures */
    symbols?: {
      functions: number;
      classes: number;
      interfaces: number;
      variables: number;
      imports: number;
      exports: number;
    };
    
    /** Dependencies */
    dependencies?: string[];
    
    /** Keywords and tags */
    keywords?: string[];
    tags?: string[];
  };
  
  /** Processing errors */
  errors?: FileProcessingError[];
  
  /** Performance metrics */
  performance?: {
    parseTime: number; // milliseconds
    chunkTime: number; // milliseconds
    embeddingTime: number; // milliseconds
    storageTime: number; // milliseconds
  };
}

/**
 * File chunk metadata
 * 
 * Represents a chunk of content extracted from a file
 * along with its metadata and embedding information.
 */
export interface FileChunk {
  /** Unique chunk identifier */
  id: string;
  
  /** Parent file identifier */
  fileId: string;
  
  /** Chunk sequence number within the file */
  chunkIndex: number;
  
  /** Chunk type classification */
  type: ChunkType;
  
  /** Raw text content of the chunk */
  content: string;
  
  /** Processed/cleaned content for embedding */
  processedContent?: string;
  
  /** Start line number in the original file */
  startLine: number;
  
  /** End line number in the original file */
  endLine: number;
  
  /** Start character position in the original file */
  startChar: number;
  
  /** End character position in the original file */
  endChar: number;
  
  /** Chunk size in characters */
  size: number;
  
  /** Embedding vector (if generated) */
  embedding?: number[];
  
  /** Embedding metadata */
  embeddingMetadata?: {
    model: string;
    dimensions: number;
    generatedAt: Date;
    processingTime: number; // milliseconds
  };
  
  /** Contextual information */
  context?: {
    /** Surrounding chunks for context */
    previousChunk?: string;
    nextChunk?: string;
    
    /** Function/class/namespace context */
    parentScope?: string;
    
    /** Related symbols */
    relatedSymbols?: string[];
  };
  
  /** Semantic information */
  semantics?: {
    /** Detected intent or purpose */
    intent?: string;
    
    /** Complexity score */
    complexity?: number;
    
    /** Importance score */
    importance?: number;
    
    /** Quality score */
    quality?: number;
  };
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * File processing error
 */
export interface FileProcessingError {
  /** Error identifier */
  id: string;
  
  /** Error type */
  type: "read_error" | "parse_error" | "chunk_error" | "encoding_error" | "size_error" | "permission_error";
  
  /** Error message */
  message: string;
  
  /** Line number where error occurred (if applicable) */
  line?: number;
  
  /** Column number where error occurred (if applicable) */
  column?: number;
  
  /** Error severity */
  severity: "warning" | "error" | "critical";
  
  /** Whether processing can continue */
  recoverable: boolean;
  
  /** Timestamp when error occurred */
  timestamp: Date;
  
  /** Additional error details */
  details?: any;
}

/**
 * File processing statistics
 */
export interface FileProcessingStats {
  /** Total files processed */
  totalFiles: number;
  
  /** Files processed successfully */
  successfulFiles: number;
  
  /** Files that failed processing */
  failedFiles: number;
  
  /** Files skipped */
  skippedFiles: number;
  
  /** Total chunks created */
  totalChunks: number;
  
  /** Average chunks per file */
  averageChunksPerFile: number;
  
  /** Total processing time */
  totalProcessingTime: number; // milliseconds
  
  /** Average processing time per file */
  averageProcessingTimePerFile: number; // milliseconds
  
  /** File type breakdown */
  fileTypeStats: Record<SupportedLanguage, {
    count: number;
    totalChunks: number;
    averageSize: number;
    processingTime: number;
  }>;
  
  /** Error statistics */
  errorStats: {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByFile: Record<string, number>;
  };
}

/**
 * File filter configuration
 */
export interface FileFilterConfig {
  /** Include patterns (glob patterns) */
  include: string[];
  
  /** Exclude patterns (glob patterns) */
  exclude: string[];
  
  /** Maximum file size in bytes */
  maxFileSize: number;
  
  /** Minimum file size in bytes */
  minFileSize: number;
  
  /** Supported file extensions */
  extensions: string[];
  
  /** Whether to process binary files */
  includeBinary: boolean;
  
  /** Whether to follow symbolic links */
  followSymlinks: boolean;
  
  /** Maximum directory depth */
  maxDepth: number;
}

/**
 * Default file filter configuration
 */
export const DEFAULT_FILE_FILTER: FileFilterConfig = {
  include: ["**/*"],
  exclude: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**",
    "**/.next/**",
    "**/.nuxt/**",
    "**/vendor/**",
    "**/target/**",
    "**/bin/**",
    "**/obj/**",
  ],
  maxFileSize: 1024 * 1024, // 1 MB
  minFileSize: 1, // 1 byte
  extensions: [
    ".ts", ".tsx", ".js", ".jsx",
    ".py", ".pyx", ".pyi",
    ".java", ".kt", ".scala",
    ".cpp", ".cc", ".cxx", ".c", ".h", ".hpp",
    ".cs", ".fs", ".vb",
    ".go", ".rs", ".swift",
    ".php", ".rb", ".pl",
    ".html", ".htm", ".css", ".scss", ".sass",
    ".json", ".yaml", ".yml", ".toml",
    ".md", ".txt", ".rst",
  ],
  includeBinary: false,
  followSymlinks: false,
  maxDepth: 20,
};

/**
 * Language detection mapping
 */
export const LANGUAGE_DETECTION: Record<string, SupportedLanguage> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".py": "python",
  ".pyx": "python",
  ".pyi": "python",
  ".java": "java",
  ".kt": "kotlin",
  ".scala": "scala",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".c": "c",
  ".h": "c",
  ".hpp": "cpp",
  ".cs": "csharp",
  ".fs": "csharp",
  ".vb": "csharp",
  ".go": "go",
  ".rs": "rust",
  ".swift": "swift",
  ".php": "php",
  ".rb": "ruby",
  ".pl": "php",
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".scss": "css",
  ".sass": "css",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "yaml",
  ".md": "markdown",
  ".txt": "text",
  ".rst": "text",
};

/**
 * Create file metadata from file path
 */
export function createFileMetadata(
  filePath: string,
  projectRoot: string,
  stats: any
): ProjectFileMetadata {
  const relativePath = filePath.replace(projectRoot, "").replace(/^\//, "");
  const fileName = filePath.split("/").pop() || "";
  const extension = fileName.includes(".") ? "." + fileName.split(".").pop() : "";
  const language = LANGUAGE_DETECTION[extension.toLowerCase()] || "unknown";
  
  return {
    id: generateFileId(filePath),
    filePath,
    relativePath,
    fileName,
    extension,
    language,
    fileSize: stats.size || 0,
    lastModified: stats.mtime || new Date(),
    created: stats.birthtime || stats.ctime || new Date(),
    status: "pending",
    lineCount: 0, // Will be populated during processing
    characterCount: 0, // Will be populated during processing
    encoding: "utf-8", // Default, will be detected
    isBinary: false, // Will be detected
  };
}

/**
 * Generate unique file ID
 */
function generateFileId(filePath: string): string {
  // Simple hash function for file ID generation
  let hash = 0;
  for (let i = 0; i < filePath.length; i++) {
    const char = filePath.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `file_${Math.abs(hash).toString(36)}`;
}
