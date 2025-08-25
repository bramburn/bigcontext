import * as vscode from 'vscode';
import { ContextService, ContextQuery } from './context/contextService';

/**
 * Search filters and options for advanced search functionality
 */
export interface SearchFilters {
    fileTypes?: string[];
    languages?: string[];
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    minSimilarity?: number;
    maxResults?: number;
    includeTests?: boolean;
    includeComments?: boolean;
}

/**
 * Enhanced search result with additional metadata
 */
export interface EnhancedSearchResult {
    id: string;
    title: string;
    description: string;
    filePath: string;
    language: string;
    lineNumber: number;
    similarity: number;
    context: string;
    preview: string;
    lastModified: Date;
    fileSize: number;
    chunkType: string;
}

/**
 * Search history entry for tracking user searches
 */
export interface SearchHistoryEntry {
    query: string;
    filters: SearchFilters;
    timestamp: Date;
    resultCount: number;
}

/**
 * SearchManager class responsible for advanced search functionality and result management.
 * 
 * This class provides enhanced search capabilities including:
 * - Advanced filtering and sorting options
 * - Search history and suggestions
 * - Result caching and performance optimization
 * - File preview and context extraction
 * - Search analytics and insights
 */
export class SearchManager {
    private contextService: ContextService;
    private searchHistory: SearchHistoryEntry[] = [];
    private resultCache: Map<string, EnhancedSearchResult[]> = new Map();
    private readonly maxHistoryEntries = 50;
    private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

    /**
     * Creates a new SearchManager instance
     * @param contextService - The ContextService instance for performing searches
     */
    constructor(contextService: ContextService) {
        this.contextService = contextService;
        this.loadSearchHistory();
    }

    /**
     * Performs an advanced search with filters and options
     * @param query - The search query string
     * @param filters - Search filters and options
     * @returns Promise resolving to enhanced search results
     */
    async search(query: string, filters: SearchFilters = {}): Promise<EnhancedSearchResult[]> {
        try {
            console.log('SearchManager: Performing advanced search:', { query, filters });

            // Check cache first
            const cacheKey = this.generateCacheKey(query, filters);
            const cachedResults = this.resultCache.get(cacheKey);
            if (cachedResults) {
                console.log('SearchManager: Returning cached results');
                return cachedResults;
            }

            // Build context query from search parameters
            const contextQuery: ContextQuery = {
                query,
                maxResults: filters.maxResults || 20,
                minSimilarity: filters.minSimilarity || 0.5,
                fileTypes: filters.fileTypes
            };

            // Perform the search
            const contextResults = await this.contextService.queryContext(contextQuery);

            // Transform results to enhanced format
            const enhancedResults = await this.transformResults(contextResults.relatedFiles || []);

            // Apply additional filtering
            const filteredResults = this.applyAdvancedFilters(enhancedResults, filters);

            // Sort results by relevance and similarity
            const sortedResults = this.sortResults(filteredResults);

            // Cache the results
            this.cacheResults(cacheKey, sortedResults);

            // Add to search history
            this.addToHistory(query, filters, sortedResults.length);

            console.log(`SearchManager: Found ${sortedResults.length} results`);
            return sortedResults;

        } catch (error) {
            console.error('SearchManager: Search failed:', error);
            throw error;
        }
    }

    /**
     * Gets search suggestions based on query and history
     * @param partialQuery - Partial query string for suggestions
     * @returns Array of suggested search terms
     */
    getSuggestions(partialQuery: string): string[] {
        const suggestions = new Set<string>();

        // Add suggestions from search history
        this.searchHistory
            .filter(entry => entry.query.toLowerCase().includes(partialQuery.toLowerCase()))
            .slice(0, 5)
            .forEach(entry => suggestions.add(entry.query));

        // Add common programming terms if relevant
        const programmingTerms = [
            'function', 'class', 'interface', 'method', 'variable',
            'import', 'export', 'async', 'await', 'promise',
            'error', 'exception', 'test', 'mock', 'config'
        ];

        programmingTerms
            .filter(term => term.toLowerCase().includes(partialQuery.toLowerCase()))
            .slice(0, 3)
            .forEach(term => suggestions.add(term));

        return Array.from(suggestions).slice(0, 8);
    }

    /**
     * Gets recent search history
     * @param limit - Maximum number of history entries to return
     * @returns Array of recent search history entries
     */
    getSearchHistory(limit: number = 10): SearchHistoryEntry[] {
        return this.searchHistory
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Clears search history
     */
    clearSearchHistory(): void {
        this.searchHistory = [];
        this.saveSearchHistory();
        console.log('SearchManager: Search history cleared');
    }

    /**
     * Gets file preview for a search result
     * @param filePath - Path to the file
     * @param lineNumber - Line number to center the preview around
     * @param contextLines - Number of lines to include before and after
     * @returns File preview with syntax highlighting
     */
    async getFilePreview(filePath: string, lineNumber: number, contextLines: number = 5): Promise<string> {
        try {
            const fileContent = await this.contextService.getFileContent(filePath);
            if (!fileContent.content) {
                return 'File content not available';
            }

            const lines = fileContent.content.split('\n');
            const startLine = Math.max(0, lineNumber - contextLines - 1);
            const endLine = Math.min(lines.length, lineNumber + contextLines);

            const previewLines = lines.slice(startLine, endLine);
            
            return previewLines
                .map((line, index) => {
                    const actualLineNumber = startLine + index + 1;
                    const isTargetLine = actualLineNumber === lineNumber;
                    const prefix = isTargetLine ? '→ ' : '  ';
                    return `${prefix}${actualLineNumber.toString().padStart(4)}: ${line}`;
                })
                .join('\n');

        } catch (error) {
            console.error('SearchManager: Failed to get file preview:', error);
            return 'Preview not available';
        }
    }

    /**
     * Transforms context service results to enhanced search results
     */
    private async transformResults(chunks: any[]): Promise<EnhancedSearchResult[]> {
        const results: EnhancedSearchResult[] = [];

        for (const chunk of chunks) {
            try {
                const result: EnhancedSearchResult = {
                    id: `${chunk.filePath}-${chunk.startLine}`,
                    title: this.extractTitle(chunk),
                    description: this.extractDescription(chunk),
                    filePath: chunk.filePath,
                    language: chunk.language || 'unknown',
                    lineNumber: chunk.startLine || 1,
                    similarity: chunk.similarity || 0,
                    context: chunk.content || '',
                    preview: chunk.content?.substring(0, 200) + '...' || '',
                    lastModified: new Date(), // Would be populated from file stats
                    fileSize: 0, // Would be populated from file stats
                    chunkType: chunk.type || 'unknown'
                };

                results.push(result);
            } catch (error) {
                console.error('SearchManager: Error transforming result:', error);
            }
        }

        return results;
    }

    /**
     * Applies advanced filters to search results
     */
    private applyAdvancedFilters(results: EnhancedSearchResult[], filters: SearchFilters): EnhancedSearchResult[] {
        let filtered = results;

        // Filter by file types
        if (filters.fileTypes && filters.fileTypes.length > 0) {
            filtered = filtered.filter(result => 
                filters.fileTypes!.some(type => result.filePath.endsWith(type))
            );
        }

        // Filter by languages
        if (filters.languages && filters.languages.length > 0) {
            filtered = filtered.filter(result => 
                filters.languages!.includes(result.language)
            );
        }

        // Filter by date range
        if (filters.dateRange) {
            if (filters.dateRange.from) {
                filtered = filtered.filter(result => 
                    result.lastModified >= filters.dateRange!.from!
                );
            }
            if (filters.dateRange.to) {
                filtered = filtered.filter(result => 
                    result.lastModified <= filters.dateRange!.to!
                );
            }
        }

        // Filter by minimum similarity
        if (filters.minSimilarity !== undefined) {
            filtered = filtered.filter(result => 
                result.similarity >= filters.minSimilarity!
            );
        }

        return filtered;
    }

    /**
     * Sorts search results by relevance and similarity
     */
    private sortResults(results: EnhancedSearchResult[]): EnhancedSearchResult[] {
        return results.sort((a, b) => {
            // Primary sort: similarity score
            if (a.similarity !== b.similarity) {
                return b.similarity - a.similarity;
            }

            // Secondary sort: file type preference (source files over tests)
            const aIsTest = a.filePath.includes('test') || a.filePath.includes('spec');
            const bIsTest = b.filePath.includes('test') || b.filePath.includes('spec');
            if (aIsTest !== bIsTest) {
                return aIsTest ? 1 : -1;
            }

            // Tertiary sort: last modified date
            return b.lastModified.getTime() - a.lastModified.getTime();
        });
    }

    /**
     * Generates cache key for search results
     */
    private generateCacheKey(query: string, filters: SearchFilters): string {
        return `${query}-${JSON.stringify(filters)}`;
    }

    /**
     * Caches search results with timeout
     */
    private cacheResults(key: string, results: EnhancedSearchResult[]): void {
        this.resultCache.set(key, results);
        
        // Set timeout to clear cache entry
        setTimeout(() => {
            this.resultCache.delete(key);
        }, this.cacheTimeout);
    }

    /**
     * Adds search to history
     */
    private addToHistory(query: string, filters: SearchFilters, resultCount: number): void {
        const entry: SearchHistoryEntry = {
            query,
            filters,
            timestamp: new Date(),
            resultCount
        };

        // Remove duplicate queries
        this.searchHistory = this.searchHistory.filter(h => h.query !== query);
        
        // Add new entry at the beginning
        this.searchHistory.unshift(entry);

        // Limit history size
        if (this.searchHistory.length > this.maxHistoryEntries) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryEntries);
        }

        this.saveSearchHistory();
    }

    /**
     * Extracts title from chunk content
     */
    private extractTitle(chunk: any): string {
        if (chunk.metadata?.functionName) {
            return `Function: ${chunk.metadata.functionName}`;
        }
        if (chunk.metadata?.className) {
            return `Class: ${chunk.metadata.className}`;
        }
        
        // Extract first meaningful line
        const lines = chunk.content?.split('\n') || [];
        const meaningfulLine = lines.find((line: string) =>
            line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('*')
        );
        
        return meaningfulLine?.trim().substring(0, 50) + '...' || 'Code snippet';
    }

    /**
     * Extracts description from chunk content
     */
    private extractDescription(chunk: any): string {
        const content = chunk.content || '';
        const lines = content.split('\n');
        
        // Look for comments that might describe the code
        const commentLine = lines.find((line: string) =>
            line.trim().startsWith('//') || line.trim().startsWith('*')
        );
        
        if (commentLine) {
            return commentLine.trim().replace(/^[\/\*\s]+/, '').substring(0, 100);
        }
        
        // Fallback to first few lines
        return lines.slice(0, 2).join(' ').trim().substring(0, 100) + '...';
    }

    /**
     * Loads search history from storage
     */
    private loadSearchHistory(): void {
        // In a real implementation, this would load from VS Code's global state
        // For now, we'll start with an empty history
        this.searchHistory = [];
    }

    /**
     * Saves search history to storage
     */
    private saveSearchHistory(): void {
        // In a real implementation, this would save to VS Code's global state
        console.log('SearchManager: Search history saved');
    }

    /**
     * Disposes of the SearchManager and cleans up resources
     */
    dispose(): void {
        this.resultCache.clear();
        console.log('SearchManager: Disposed');
    }
}
