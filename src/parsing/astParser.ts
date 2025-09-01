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
 * - Error recovery and reporting during parsing
 * - File extension to language detection
 * - AST traversal and node querying capabilities
 * - Utility functions for working with syntax nodes
 */

import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import Python from "tree-sitter-python";
import CSharp from "tree-sitter-c-sharp";

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
 * AstParser class provides functionality to parse and analyze source code
 * using the tree-sitter library across multiple programming languages.
 */
export class AstParser {
  /** The tree-sitter parser instance used for parsing source code */
  private parser: Parser;

  /** Map of supported languages to their corresponding tree-sitter grammar */
  private languages: Map<SupportedLanguage, any>;

  /**
   * Initializes a new instance of the AstParser class.
   * Sets up the parser and registers all supported language grammars.
   */
  constructor() {
    this.parser = new Parser();
    this.languages = new Map();

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

      const tree = this.parser.parse(code);

      if (!tree) {
        throw new Error(`Failed to parse code for language: ${language}`);
      }

      return tree;
    } catch (error) {
      console.error(`Error parsing code for language ${language}:`, error);
      console.error(`Code sample (first 100 chars): "${code?.substring(0, 100)}..."`);
      console.error(`Code type: ${typeof code}, length: ${code?.length}`);
      return null;
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
        // Walk the tree to find error nodes
        const cursor = tree.walk();

        /**
         * Recursive helper function to find and collect error nodes in the AST
         * @param node - The current syntax node being examined
         */
        const findErrors = (node: Parser.SyntaxNode) => {
          if (node.hasError) {
            if (node.type === "ERROR") {
              // Convert to 1-based line and column numbers for human readability
              errors.push(
                `Syntax error at line ${node.startPosition.row + 1}, column ${node.startPosition.column + 1}`,
              );
            }

            // Recursively check all child nodes for errors
            for (let i = 0; i < node.childCount; i++) {
              findErrors(node.child(i)!);
            }
          }
        };

        // Start error detection from the root node
        findErrors(tree.rootNode);
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
