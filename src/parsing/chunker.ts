import Parser from 'tree-sitter';
import { SupportedLanguage } from './astParser';
import { LSPMetadata } from '../lsp/lspService';
// TODO: (agent) we should be able to process all files except for executables
export interface CodeChunk {
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    type: ChunkType;
    name?: string;
    signature?: string;
    docstring?: string;
    language: SupportedLanguage;
    metadata?: Record<string, any>;
    /** LSP metadata including symbols, definitions, and references */
    lspMetadata?: LSPMetadata;
}

export enum ChunkType {
    FUNCTION = 'function',
    CLASS = 'class',
    METHOD = 'method',
    INTERFACE = 'interface',
    ENUM = 'enum',
    VARIABLE = 'variable',
    IMPORT = 'import',
    COMMENT = 'comment',
    MODULE = 'module',
    NAMESPACE = 'namespace',
    PROPERTY = 'property',
    CONSTRUCTOR = 'constructor',
    DECORATOR = 'decorator',
    TYPE_ALIAS = 'type_alias',
    GENERIC = 'generic'
}

export class Chunker {
    private languageQueries: Map<SupportedLanguage, Map<ChunkType, string>>;

    constructor() {
        this.languageQueries = new Map();
        this.initializeQueries();
    }

    private initializeQueries(): void {
        // TypeScript/JavaScript queries
        const tsQueries = new Map<ChunkType, string>();
        tsQueries.set(ChunkType.FUNCTION, `
            (function_declaration
                name: (identifier) @name
                parameters: (formal_parameters) @params
                body: (statement_block) @body) @function
        `);
        tsQueries.set(ChunkType.CLASS, `
            (class_declaration
                name: (type_identifier) @name
                body: (class_body) @body) @class
        `);
        tsQueries.set(ChunkType.METHOD, `
            (method_definition
                name: (property_identifier) @name
                parameters: (formal_parameters) @params
                body: (statement_block) @body) @method
        `);
        tsQueries.set(ChunkType.INTERFACE, `
            (interface_declaration
                name: (type_identifier) @name
                body: (object_type) @body) @interface
        `);
        tsQueries.set(ChunkType.ENUM, `
            (enum_declaration
                name: (identifier) @name
                body: (enum_body) @body) @enum
        `);
        tsQueries.set(ChunkType.IMPORT, `
            (import_statement) @import
        `);

        this.languageQueries.set('typescript', tsQueries);
        this.languageQueries.set('javascript', tsQueries);

        // Python queries
        const pyQueries = new Map<ChunkType, string>();
        pyQueries.set(ChunkType.FUNCTION, `
            (function_definition
                name: (identifier) @name
                parameters: (parameters) @params
                body: (block) @body) @function
        `);
        pyQueries.set(ChunkType.CLASS, `
            (class_definition
                name: (identifier) @name
                body: (block) @body) @class
        `);
        pyQueries.set(ChunkType.METHOD, `
            (function_definition
                name: (identifier) @name
                parameters: (parameters) @params
                body: (block) @body) @method
        `);
        pyQueries.set(ChunkType.IMPORT, `
            (import_statement) @import
            (import_from_statement) @import
        `);

        this.languageQueries.set('python', pyQueries);

        // C# queries
        const csQueries = new Map<ChunkType, string>();
        csQueries.set(ChunkType.CLASS, `
            (class_declaration
                name: (identifier) @name
                body: (declaration_list) @body) @class
        `);
        csQueries.set(ChunkType.METHOD, `
            (method_declaration
                name: (identifier) @name
                parameters: (parameter_list) @params
                body: (block) @body) @method
        `);
        csQueries.set(ChunkType.INTERFACE, `
            (interface_declaration
                name: (identifier) @name
                body: (declaration_list) @body) @interface
        `);
        csQueries.set(ChunkType.NAMESPACE, `
            (namespace_declaration
                name: (identifier) @name
                body: (declaration_list) @body) @namespace
        `);

        this.languageQueries.set('csharp', csQueries);
    }

    public chunk(filePath: string, tree: Parser.Tree, code: string, language: SupportedLanguage): CodeChunk[] {
        const chunks: CodeChunk[] = [];
        const queries = this.languageQueries.get(language);

        if (!queries) {
            console.warn(`No queries defined for language: ${language}`);
            return this.createFileChunk(filePath, code, language);
        }

        // Extract chunks for each type
        for (const [chunkType, queryString] of queries) {
            try {
                const languageGrammar = this.getLanguageGrammar(language);
                if (!languageGrammar) continue;

                const query = new Parser.Query(languageGrammar, queryString);
                const matches = query.matches(tree.rootNode);

                for (const match of matches) {
                    const chunk = this.createChunkFromMatch(filePath, match, code, chunkType, language);
                    if (chunk) {
                        chunks.push(chunk);
                    }
                }
            } catch (error) {
                console.error(`Error processing ${chunkType} chunks for ${language}:`, error);
            }
        }

        // If no chunks were found, create a file-level chunk
        if (chunks.length === 0) {
            chunks.push(...this.createFileChunk(filePath, code, language));
        }

        return chunks;
    }

    private createChunkFromMatch(
        filePath: string,
        match: Parser.QueryMatch,
        code: string,
        chunkType: ChunkType,
        language: SupportedLanguage
    ): CodeChunk | null {
        const captures = match.captures;
        const mainCapture = captures.find((c: any) => c.name === chunkType) || captures[0];
        
        if (!mainCapture) return null;

        const node = mainCapture.node;
        const content = code.slice(node.startIndex, node.endIndex);
        
        // Extract name if available
        const nameCapture = captures.find((c: any) => c.name === 'name');
        const name = nameCapture ? code.slice(nameCapture.node.startIndex, nameCapture.node.endIndex) : undefined;

        // Extract parameters/signature if available
        const paramsCapture = captures.find((c: any) => c.name === 'params');
        const signature = paramsCapture ? code.slice(paramsCapture.node.startIndex, paramsCapture.node.endIndex) : undefined;

        // Extract docstring for Python
        let docstring: string | undefined;
        if (language === 'python' && chunkType === ChunkType.FUNCTION) {
            docstring = this.extractPythonDocstring(node, code);
        }

        return {
            filePath,
            content,
            startLine: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
            type: chunkType,
            name,
            signature,
            docstring,
            language,
            metadata: {
                nodeType: node.type,
                hasError: node.hasError,
                byteLength: node.endIndex - node.startIndex
            }
        };
    }

    private createFileChunk(filePath: string, code: string, language: SupportedLanguage): CodeChunk[] {
        const lines = code.split('\n');
        return [{
            filePath,
            content: code,
            startLine: 1,
            endLine: lines.length,
            type: ChunkType.MODULE,
            name: filePath.split('/').pop()?.split('.')[0],
            language,
            metadata: {
                isFileLevel: true,
                lineCount: lines.length,
                charCount: code.length
            }
        }];
    }

    private extractPythonDocstring(node: Parser.SyntaxNode, code: string): string | undefined {
        // Look for string literal as first statement in function body
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child?.type === 'block') {
                const firstStatement = child.child(1); // Skip the colon
                if (firstStatement?.type === 'expression_statement') {
                    const expr = firstStatement.child(0);
                    if (expr?.type === 'string') {
                        return code.slice(expr.startIndex, expr.endIndex);
                    }
                }
                break;
            }
        }
        return undefined;
    }

    private getLanguageGrammar(language: SupportedLanguage): any {
        // Import the actual language grammars
        try {
            switch (language) {
                case 'typescript':
                    return require('tree-sitter-typescript').typescript;
                case 'javascript':
                    return require('tree-sitter-typescript').javascript;
                case 'python':
                    return require('tree-sitter-python');
                case 'csharp':
                    return require('tree-sitter-c-sharp');
                default:
                    return null;
            }
        } catch (error) {
            console.error(`Failed to load grammar for ${language}:`, error);
            return null;
        }
    }

    public getChunksByType(chunks: CodeChunk[], type: ChunkType): CodeChunk[] {
        return chunks.filter(chunk => chunk.type === type);
    }

    public getChunkStats(chunks: CodeChunk[]): Record<ChunkType, number> {
        const stats: Record<ChunkType, number> = {} as Record<ChunkType, number>;
        
        for (const chunk of chunks) {
            stats[chunk.type] = (stats[chunk.type] || 0) + 1;
        }
        
        return stats;
    }
}
