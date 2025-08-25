/**
 * Language Server Protocol (LSP) Service
 * 
 * This service provides integration with VS Code's language servers to enrich
 * code chunks with semantic information like definitions, references, symbols,
 * and type information. It leverages the existing language servers that VS Code
 * uses for features like Go to Definition, Find References, etc.
 */

import * as vscode from 'vscode';
import { SupportedLanguage } from '../parsing/astParser';

/**
 * Represents a symbol definition from the LSP
 */
export interface LSPDefinition {
    /** The URI of the file containing the definition */
    uri: string;
    /** The range of the definition in the file */
    range: vscode.Range;
    /** The name of the symbol */
    name: string;
    /** The kind of symbol (function, class, variable, etc.) */
    kind: vscode.SymbolKind;
    /** Additional detail about the symbol */
    detail?: string;
}

/**
 * Represents a reference to a symbol from the LSP
 */
export interface LSPReference {
    /** The URI of the file containing the reference */
    uri: string;
    /** The range of the reference in the file */
    range: vscode.Range;
    /** Whether this is a definition or just a reference */
    isDefinition: boolean;
}

/**
 * Represents a symbol from the LSP
 */
export interface LSPSymbol {
    /** The name of the symbol */
    name: string;
    /** The kind of symbol */
    kind: vscode.SymbolKind;
    /** The range of the symbol */
    range: vscode.Range;
    /** The selection range (typically the name) */
    selectionRange: vscode.Range;
    /** Additional detail about the symbol */
    detail?: string;
    /** Child symbols (for classes, namespaces, etc.) */
    children?: LSPSymbol[];
}

/**
 * Represents hover information from the LSP
 */
export interface LSPHoverInfo {
    /** The hover content as markdown */
    contents: vscode.MarkdownString[];
    /** The range the hover applies to */
    range?: vscode.Range;
}

/**
 * LSP metadata that can be attached to code chunks
 */
export interface LSPMetadata {
    /** Symbols defined in this chunk */
    definitions: LSPDefinition[];
    /** References to other symbols from this chunk */
    references: LSPReference[];
    /** All symbols in this chunk */
    symbols: LSPSymbol[];
    /** Hover information for key symbols */
    hoverInfo: Record<string, LSPHoverInfo>;
    /** The language this metadata applies to */
    language: SupportedLanguage;
    /** Whether LSP data was successfully retrieved */
    hasLSPData: boolean;
}

/**
 * Service for interacting with VS Code's Language Server Protocol
 */
export class LSPService {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Get LSP metadata for a code chunk
     * 
     * @param filePath - The path to the file
     * @param content - The content of the code chunk
     * @param startLine - The starting line of the chunk
     * @param endLine - The ending line of the chunk
     * @param language - The programming language
     * @returns Promise resolving to LSP metadata
     */
    async getMetadataForChunk(
        filePath: string,
        content: string,
        startLine: number,
        endLine: number,
        language: SupportedLanguage
    ): Promise<LSPMetadata> {
        try {
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            
            // Create range for the chunk
            const range = new vscode.Range(
                new vscode.Position(startLine, 0),
                new vscode.Position(endLine, Number.MAX_SAFE_INTEGER)
            );

            // Get symbols in the document
            const symbols = await this.getDocumentSymbols(document);
            const chunkSymbols = this.filterSymbolsInRange(symbols, range);

            // Get definitions and references for symbols in the chunk
            const definitions: LSPDefinition[] = [];
            const references: LSPReference[] = [];
            const hoverInfo: Record<string, LSPHoverInfo> = {};

            for (const symbol of chunkSymbols) {
                // Get definition information
                const symbolDefinitions = await this.getDefinitions(document, symbol.selectionRange.start);
                definitions.push(...symbolDefinitions);

                // Get references
                const symbolReferences = await this.getReferences(document, symbol.selectionRange.start);
                references.push(...symbolReferences);

                // Get hover information
                const hover = await this.getHoverInfo(document, symbol.selectionRange.start);
                if (hover) {
                    hoverInfo[symbol.name] = hover;
                }
            }

            return {
                definitions,
                references,
                symbols: chunkSymbols,
                hoverInfo,
                language,
                hasLSPData: true
            };
        } catch (error) {
            console.warn(`Failed to get LSP metadata for ${filePath}:`, error);
            return {
                definitions: [],
                references: [],
                symbols: [],
                hoverInfo: {},
                language,
                hasLSPData: false
            };
        }
    }

    /**
     * Get document symbols from the LSP
     */
    private async getDocumentSymbols(document: vscode.TextDocument): Promise<LSPSymbol[]> {
        try {
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            return symbols ? this.convertDocumentSymbols(symbols) : [];
        } catch (error) {
            console.warn('Failed to get document symbols:', error);
            return [];
        }
    }

    /**
     * Convert VS Code DocumentSymbol to our LSPSymbol format
     */
    private convertDocumentSymbols(symbols: vscode.DocumentSymbol[]): LSPSymbol[] {
        return symbols.map(symbol => ({
            name: symbol.name,
            kind: symbol.kind,
            range: symbol.range,
            selectionRange: symbol.selectionRange,
            detail: symbol.detail,
            children: symbol.children ? this.convertDocumentSymbols(symbol.children) : undefined
        }));
    }

    /**
     * Filter symbols that are within the specified range
     */
    private filterSymbolsInRange(symbols: LSPSymbol[], range: vscode.Range): LSPSymbol[] {
        const result: LSPSymbol[] = [];

        for (const symbol of symbols) {
            if (range.intersection(symbol.range)) {
                const filteredSymbol: LSPSymbol = {
                    ...symbol,
                    children: symbol.children ? this.filterSymbolsInRange(symbol.children, range) : undefined
                };
                result.push(filteredSymbol);
            }
        }

        return result;
    }

    /**
     * Get definitions for a symbol at a specific position
     */
    private async getDefinitions(document: vscode.TextDocument, position: vscode.Position): Promise<LSPDefinition[]> {
        try {
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                document.uri,
                position
            );

            if (!locations) return [];

            return locations.map(location => ({
                uri: location.uri.toString(),
                range: location.range,
                name: '', // Will be filled by caller
                kind: vscode.SymbolKind.Null, // Will be determined by caller
                detail: undefined
            }));
        } catch (error) {
            console.warn('Failed to get definitions:', error);
            return [];
        }
    }

    /**
     * Get references for a symbol at a specific position
     */
    private async getReferences(document: vscode.TextDocument, position: vscode.Position): Promise<LSPReference[]> {
        try {
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                document.uri,
                position
            );

            if (!locations) return [];

            return locations.map(location => ({
                uri: location.uri.toString(),
                range: location.range,
                isDefinition: false // This would need more sophisticated logic to determine
            }));
        } catch (error) {
            console.warn('Failed to get references:', error);
            return [];
        }
    }

    /**
     * Get hover information for a symbol at a specific position
     */
    private async getHoverInfo(document: vscode.TextDocument, position: vscode.Position): Promise<LSPHoverInfo | null> {
        try {
            const hover = await vscode.commands.executeCommand<vscode.Hover>(
                'vscode.executeHoverProvider',
                document.uri,
                position
            );

            if (!hover) return null;

            return {
                contents: hover.contents as vscode.MarkdownString[],
                range: hover.range
            };
        } catch (error) {
            console.warn('Failed to get hover info:', error);
            return null;
        }
    }

    /**
     * Check if LSP is available for a given language
     */
    async isLSPAvailable(language: SupportedLanguage): Promise<boolean> {
        try {
            // Create a temporary document to test LSP availability
            const tempContent = this.getTestContent(language);
            const tempDoc = await vscode.workspace.openTextDocument({
                content: tempContent,
                language: this.getVSCodeLanguageId(language)
            });

            // Try to get symbols - if this works, LSP is available
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                tempDoc.uri
            );

            return symbols !== undefined;
        } catch (error) {
            console.warn(`LSP not available for ${language}:`, error);
            return false;
        }
    }

    /**
     * Get test content for checking LSP availability
     */
    private getTestContent(language: SupportedLanguage): string {
        switch (language) {
            case 'typescript':
                return 'function test() { return "hello"; }';
            case 'javascript':
                return 'function test() { return "hello"; }';
            case 'python':
                return 'def test():\n    return "hello"';
            case 'csharp':
                return 'public class Test { public string Method() { return "hello"; } }';
            default:
                return '';
        }
    }

    /**
     * Convert our language enum to VS Code language identifiers
     */
    private getVSCodeLanguageId(language: SupportedLanguage): string {
        switch (language) {
            case 'typescript':
                return 'typescript';
            case 'javascript':
                return 'javascript';
            case 'python':
                return 'python';
            case 'csharp':
                return 'csharp';
            default:
                return 'plaintext';
        }
    }
}
