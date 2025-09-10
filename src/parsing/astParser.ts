/**
 * Abstract Syntax Tree Parser Module
 *
 * This module provides functionality for parsing source code into Abstract Syntax Trees (ASTs)
 * using the tree-sitter library. It supports multiple programming languages including TypeScript,
 * JavaScript, Python, and C#. The parser enables code analysis, traversal, and querying of
 * syntax nodes within the parsed code.
 *
 * Key features:
 * - Multi-language support with extensible architecture
 * - Robust error recovery and reporting during parsing
 * - Configuration-driven error handling behavior
 * - File extension to language detection
 * - AST traversal and node querying capabilities
 * - Utility functions for working with syntax nodes
 * - Graceful handling of syntax errors with optional skipping
 */

import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import Python from "tree-sitter-python";
import CSharp from "tree-sitter-c-sharp";
import { IConfigurationService } from '../services/interfaces/IConfigurationService';

// TODO: (agent) Setup mono repo for our application to build and setup our ast parser modules

/**
 * Defines the programming languages supported by the AST parser.
 * Currently supports TypeScript, JavaScript, Python, and C#.
 */
export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "csharp";

/**
 * Parse result with error information and configuration-aware behavior
 */
export interface ParseResult {
  /** The parsed syntax tree, null if parsing failed completely */
  tree: Parser.Tree | null;
  /** Array of syntax errors encountered during parsing */
  errors: string[];
  /** Whether parsing was successful (tree is not null) */
  success: boolean;
  /** Whether syntax errors were skipped based on configuration */
  errorsSkipped: boolean;
  /** File path that was parsed */
  filePath?: string;
}

/**
 * AstParser class provides functionality to parse and analyze source code
 * using the tree-sitter library across multiple programming languages.
 * Integrates with configuration service for error handling behavior.
 */
export class AstParser {
  /** The tree-sitter parser instance used for parsing source code */
  private parser: Parser;

  /** Map of supported languages to their corresponding tree-sitter grammar */
  private languages: Map<SupportedLanguage, any>;

  /** Configuration service for error handling behavior */
  private configService?: IConfigurationService;

  /**
   * Initializes a new instance of the AstParser class.
   * Sets up the parser and registers all supported language grammars.
   *
   * @param configService Optional configuration service for error handling
   */
  constructor(configService?: IConfigurationService) {
    this.parser = new Parser();
    this.languages = new Map();
    this.configService = configService;

    // Initialize supported languages
    this.languages.set("typescript", TypeScript.typescript);
    this.languages.set("javascript", TypeScript.javascript);
    this.languages.set("python", Python);
    this.languages.set("csharp", CSharp);
  }

  /**
   * Parses source code into an Abstract Syntax Tree (AST).
   *
   * @param language - The programming language of the source code
   * @param code - The source code string to parse
   * @returns The parsed AST or null if parsing fails
   * @throws Error if the language is not supported or parsing fails
   */
  public parse(language: SupportedLanguage, code: string): Parser.Tree | null {
    try {
      // Validate input parameters
      if (!language) {
        throw new Error('Language parameter is required');
      }

      if (code === null || code === undefined) {
        throw new Error('Code parameter cannot be null or undefined');
      }

      if (typeof code !== 'string') {
        throw new Error(`Code parameter must be a string, got ${typeof code}`);
      }

      // Check for binary data or invalid characters that might cause parsing issues
      if (code.includes('\0')) {
        throw new Error('Code contains null bytes - likely binary data');
      }

      // Get the language grammar for the specified language
      const languageGrammar = this.languages.get(language);
      if (!languageGrammar) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Validate the grammar object
      if (typeof languageGrammar !== 'object' || languageGrammar === null) {
        throw new Error(`Invalid language grammar for ${language}: ${typeof languageGrammar}`);
      }

      // Configure the parser with the appropriate language grammar
      try {
        this.parser.setLanguage(languageGrammar);
        console.log(`AstParser: Language ${language} set successfully`);
      } catch (setLanguageError) {
        throw new Error(`Failed to set language ${language}: ${setLanguageError instanceof Error ? setLanguageError.message : String(setLanguageError)}`);
      }

      // Additional validation before parsing
      console.log(`AstParser: Parsing ${language} code (${code.length} characters)`);

      // Try parsing with additional error handling for tree-sitter issues
      let tree: Parser.Tree | null = null;
      try {
        tree = this.parser.parse(code);
      } catch (parseError) {
        console.error(`AstParser: Tree-sitter parse error for ${language}:`, parseError);
        // For Python files, try to handle encoding issues
        if (language === 'python') {
          try {
            // Try parsing with normalized line endings
            const normalizedCode = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            tree = this.parser.parse(normalizedCode);
            if (tree) {
              console.log(`AstParser: Successfully parsed ${language} after normalizing line endings`);
            }
          } catch (retryError) {
            console.error(`AstParser: Retry parse failed for ${language}:`, retryError);
          }
        }

        if (!tree) {
          throw new Error(`Tree-sitter parse failed for ${language}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
      }

      if (!tree) {
        // Provide more detailed error information
        const codePreview = code.substring(0, 200).replace(/\n/g, '\\n');
        throw new Error(`Failed to parse code for language: ${language}. Code preview: "${codePreview}..."`);
      }

      // Validate the parsed tree
      if (!tree.rootNode) {
        throw new Error(`Parsed tree has no root node for language: ${language}`);
      }

      console.log(`AstParser: Successfully parsed ${language} code - root node type: ${tree.rootNode.type}`);
      return tree;
    } catch (error) {
      console.error(`Error parsing code for language ${language}:`, error);
      console.error(`Code sample (first 100 chars): "${code?.substring(0, 100)}..."`);
      console.error(`Code type: ${typeof code}, length: ${code?.length}`);
      return null;
    }
  }

  /**
   * Parses source code with robust error handling and configuration-aware behavior.
   * This method integrates with the configuration service to determine whether to skip
   * syntax errors or fail completely when errors are encountered.
   *
   * @param filePath - The path to the file being parsed (for logging)
   * @param code - The source code string to parse
   * @param language - The programming language of the source code
   * @returns A ParseResult object with tree, errors, and metadata
   */
  public parseRobust(
    filePath: string,
    code: string,
    language: SupportedLanguage,
  ): ParseResult {
    const errors: string[] = [];
    let tree: Parser.Tree | null = null;
    let errorsSkipped = false;

    try {
      // Check if we should skip syntax errors based on configuration
      const shouldSkipErrors = this.shouldSkipSyntaxErrors();

      // Attempt to parse the code
      tree = this.parse(language, code);

      if (tree && tree.rootNode.hasError) {
        // Collect syntax errors
        this.collectSyntaxErrors(tree.rootNode, errors);

        if (errors.length > 0) {
          console.warn(`AstParser: Found ${errors.length} syntax errors in ${filePath}`);

          if (shouldSkipErrors) {
            console.log(`AstParser: Skipping syntax errors in ${filePath} due to configuration`);
            errorsSkipped = true;
            // Keep the tree even with errors for partial processing
          } else {
            console.error(`AstParser: Failing parse due to syntax errors in ${filePath}`);
            tree = null; // Fail the parse if not configured to skip errors
          }
        }
      }

      return {
        tree,
        errors,
        success: tree !== null,
        errorsSkipped,
        filePath,
      };

    } catch (error) {
      const errorMessage = `Parse error: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMessage);

      console.error(`AstParser: Exception during parsing of ${filePath}:`, error);

      return {
        tree: null,
        errors,
        success: false,
        errorsSkipped: false,
        filePath,
      };
    }
  }

  /**
   * Parses source code with error recovery, collecting syntax errors encountered during parsing.
   * This method is useful for partial or incomplete code that may contain syntax errors.
   *
   * @param language - The programming language of the source code
   * @param code - The source code string to parse
   * @returns An object containing the parsed tree (or null) and an array of error messages
   */
  public parseWithErrorRecovery(
    language: SupportedLanguage,
    code: string,
  ): { tree: Parser.Tree | null; errors: string[] } {
    const errors: string[] = [];

    try {
      const tree = this.parse(language, code);

      if (tree && tree.rootNode.hasError) {
        this.collectSyntaxErrors(tree.rootNode, errors);
      }

      return { tree, errors };
    } catch (error) {
      // Handle any exceptions during parsing
      errors.push(
        `Parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { tree: null, errors };
    }
  }

  /**
   * Checks if the parser should skip syntax errors based on configuration.
   *
   * @returns True if syntax errors should be skipped
   */
  public shouldSkipSyntaxErrors(): boolean {
    if (!this.configService) {
      return true; // Default to skipping errors if no config service
    }

    try {
      const config = this.configService.getConfiguration();
      return config.treeSitter.skipSyntaxErrors;
    } catch (error) {
      console.warn('AstParser: Failed to get configuration, defaulting to skip errors:', error);
      return true;
    }
  }

  /**
   * Collects syntax errors from the AST recursively.
   *
   * @param node - The syntax node to examine
   * @param errors - Array to collect error messages
   */
  private collectSyntaxErrors(node: Parser.SyntaxNode, errors: string[]): void {
    if (node.hasError) {
      if (node.type === "ERROR") {
        // Convert to 1-based line and column numbers for human readability
        errors.push(
          `Syntax error at line ${node.startPosition.row + 1}, column ${node.startPosition.column + 1}`,
        );
      }

      // Recursively check all child nodes for errors
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          this.collectSyntaxErrors(child, errors);
        }
      }
    }
  }

  /**
   * Determines the programming language based on a file's extension.
   *
   * @param filePath - The path to the file
   * @returns The detected language or null if the extension is not supported
   */
  public getLanguageFromFilePath(filePath: string): SupportedLanguage | null {
    const extension = filePath.toLowerCase().split(".").pop();

    switch (extension) {
      case "ts":
      case "tsx":
        return "typescript";
      case "js":
      case "jsx":
        return "javascript";
      case "py":
        return "python";
      case "cs":
        return "csharp";
      default:
        return null;
    }
  }

  /**
   * Gets a list of all supported programming languages.
   *
   * @returns An array of supported language identifiers
   */
  public getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.languages.keys());
  }

  /**
   * Checks if a given language is supported by the parser.
   * This is a type guard function that narrows the type of the language parameter.
   *
   * @param language - The language identifier to check
   * @returns True if the language is supported, false otherwise
   */
  public isLanguageSupported(language: string): language is SupportedLanguage {
    return this.languages.has(language as SupportedLanguage);
  }

  /**
   * Extracts the text content of a syntax node from the original source code.
   *
   * @param node - The syntax node to extract text from
   * @param code - The original source code string
   * @returns The text content of the node
   */
  public getNodeText(node: Parser.SyntaxNode, code: string): string {
    return code.slice(node.startIndex, node.endIndex);
  }

  /**
   * Gets the location information for a syntax node in human-readable format.
   * Converts from tree-sitter's 0-based indices to 1-based line and column numbers.
   *
   * @param node - The syntax node to get location information for
   * @returns An object containing start/end line and column numbers (1-based)
   */
  public getNodeLocation(node: Parser.SyntaxNode): {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
  } {
    return {
      startLine: node.startPosition.row + 1, // Convert to 1-based line numbers
      endLine: node.endPosition.row + 1,
      startColumn: node.startPosition.column + 1, // Convert to 1-based column numbers
      endColumn: node.endPosition.column + 1,
    };
  }

  /**
   * Finds all syntax nodes of a specific type in the AST.
   *
   * @param tree - The parsed syntax tree to search
   * @param nodeType - The type of nodes to find (e.g., 'function_declaration')
   * @returns An array of matching syntax nodes
   */
  public findNodesByType(
    tree: Parser.Tree,
    nodeType: string,
  ): Parser.SyntaxNode[] {
    const nodes: Parser.SyntaxNode[] = [];

    /**
     * Recursive helper function to traverse the AST and collect nodes of the specified type
     * @param node - The current node being examined
     */
    const traverse = (node: Parser.SyntaxNode) => {
      if (node.type === nodeType) {
        nodes.push(node);
      }

      // Recursively traverse all child nodes
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    // Start traversal from the root node
    traverse(tree.rootNode);
    return nodes;
  }

  /**
   * Executes a tree-sitter query against the AST to find matching patterns.
   * Queries use tree-sitter's query language to match specific patterns in the syntax tree.
   *
   * @param tree - The parsed syntax tree to query
   * @param language - The programming language of the source code
   * @param queryString - The tree-sitter query string
   * @returns An array of query matches or an empty array if the query fails
   */
  public queryNodes(
    tree: Parser.Tree,
    language: SupportedLanguage,
    queryString: string,
  ): Parser.QueryMatch[] {
    try {
      const languageGrammar = this.languages.get(language);
      if (!languageGrammar) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Create and execute the query against the root node
      const query = new Parser.Query(languageGrammar, queryString);
      return query.matches(tree.rootNode);
    } catch (error) {
      console.error(`Error executing query for language ${language}:`, error);
      return [];
    }
  }
}
