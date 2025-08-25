import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import CSharp from 'tree-sitter-c-sharp';

export type SupportedLanguage = 'typescript' | 'javascript' | 'python' | 'csharp';

export class AstParser {
    private parser: Parser;
    private languages: Map<SupportedLanguage, any>;

    constructor() {
        this.parser = new Parser();
        this.languages = new Map();
        
        // Initialize supported languages
        this.languages.set('typescript', TypeScript.typescript);
        this.languages.set('javascript', TypeScript.javascript);
        this.languages.set('python', Python);
        this.languages.set('csharp', CSharp);
    }

    public parse(language: SupportedLanguage, code: string): Parser.Tree | null {
        try {
            const languageGrammar = this.languages.get(language);
            if (!languageGrammar) {
                throw new Error(`Unsupported language: ${language}`);
            }

            this.parser.setLanguage(languageGrammar);
            const tree = this.parser.parse(code);
            
            if (!tree) {
                throw new Error(`Failed to parse code for language: ${language}`);
            }

            return tree;
        } catch (error) {
            console.error(`Error parsing code for language ${language}:`, error);
            return null;
        }
    }

    public parseWithErrorRecovery(language: SupportedLanguage, code: string): { tree: Parser.Tree | null; errors: string[] } {
        const errors: string[] = [];
        
        try {
            const tree = this.parse(language, code);
            
            if (tree && tree.rootNode.hasError()) {
                // Walk the tree to find error nodes
                const cursor = tree.walk();
                
                const findErrors = (node: Parser.SyntaxNode) => {
                    if (node.hasError()) {
                        if (node.type === 'ERROR') {
                            errors.push(`Syntax error at line ${node.startPosition.row + 1}, column ${node.startPosition.column + 1}`);
                        }
                        
                        for (let i = 0; i < node.childCount; i++) {
                            findErrors(node.child(i)!);
                        }
                    }
                };
                
                findErrors(tree.rootNode);
            }
            
            return { tree, errors };
        } catch (error) {
            errors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
            return { tree: null, errors };
        }
    }

    public getLanguageFromFilePath(filePath: string): SupportedLanguage | null {
        const extension = filePath.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'ts':
            case 'tsx':
                return 'typescript';
            case 'js':
            case 'jsx':
                return 'javascript';
            case 'py':
                return 'python';
            case 'cs':
                return 'csharp';
            default:
                return null;
        }
    }

    public getSupportedLanguages(): SupportedLanguage[] {
        return Array.from(this.languages.keys());
    }

    public isLanguageSupported(language: string): language is SupportedLanguage {
        return this.languages.has(language as SupportedLanguage);
    }

    public getNodeText(node: Parser.SyntaxNode, code: string): string {
        return code.slice(node.startIndex, node.endIndex);
    }

    public getNodeLocation(node: Parser.SyntaxNode): { startLine: number; endLine: number; startColumn: number; endColumn: number } {
        return {
            startLine: node.startPosition.row + 1, // Convert to 1-based line numbers
            endLine: node.endPosition.row + 1,
            startColumn: node.startPosition.column + 1, // Convert to 1-based column numbers
            endColumn: node.endPosition.column + 1
        };
    }

    public findNodesByType(tree: Parser.Tree, nodeType: string): Parser.SyntaxNode[] {
        const nodes: Parser.SyntaxNode[] = [];
        
        const traverse = (node: Parser.SyntaxNode) => {
            if (node.type === nodeType) {
                nodes.push(node);
            }
            
            for (let i = 0; i < node.childCount; i++) {
                traverse(node.child(i)!);
            }
        };
        
        traverse(tree.rootNode);
        return nodes;
    }

    public queryNodes(tree: Parser.Tree, language: SupportedLanguage, queryString: string): Parser.QueryMatch[] {
        try {
            const languageGrammar = this.languages.get(language);
            if (!languageGrammar) {
                throw new Error(`Unsupported language: ${language}`);
            }

            const query = new Parser.Query(languageGrammar, queryString);
            return query.matches(tree.rootNode);
        } catch (error) {
            console.error(`Error executing query for language ${language}:`, error);
            return [];
        }
    }
}
