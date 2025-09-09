import * as vscode from 'vscode';
import { ContextService, ContextQuery } from './context/contextService';
import { SearchResult } from './db/qdrantService';
import { QueryExpansionService, ExpandedQuery } from './search/queryExpansionService';
import { LLMReRankingService, ReRankingResult } from './search/llmReRankingService';
import { ConfigService } from './configService';
import { CentralizedLoggingService } from './logging/centralizedLoggingService';
import { NotificationService } from './notifications/notificationService';
import { TelemetryService } from './telemetry/telemetryService';

/**
 * Search filters and options for advanced search functionality
 */
export interface SearchFilters {
    fileTypes?: string[];
    languages?: string[];
    dateRange?: {
        from?: Date;
        to?: Date;
        gte?: number;  // Unix timestamp for greater than or equal
        lte?: number;  // Unix timestamp for less than or equal
    };
    fileType?: string;  // Single file type filter
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
    /** LLM relevance score (if re-ranking was used) */
    llmScore?: number;
    /** Final combined score */
    finalScore?: number;
    /** Explanation of relevance (if available) */
    explanation?: string;
    /** Whether this result was re-ranked */
    wasReRanked?: boolean;
}

/**
 * Search history entry for tracking user searches
 */
export interface SearchHistoryEntry {
    query: string;
    filters: SearchFilters;
    timestamp: Date;
    resultCount: number;
    /** Whether query expansion was used */
    usedExpansion?: boolean;
    /** Whether re-ranking was used */
    usedReRanking?: boolean;
    /** Expanded query terms (if expansion was used) */
    expandedTerms?: string[];
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
    private queryExpansionService: QueryExpansionService;
    private llmReRankingService: LLMReRankingService;
    private configService: ConfigService;
    private loggingService: CentralizedLoggingService;
    private notificationService: NotificationService;
    private telemetryService?: TelemetryService;
    private searchHistory: SearchHistoryEntry[] = [];
    private resultCache: Map<string, EnhancedSearchResult[]> = new Map();
    private readonly maxHistoryEntries = 50;
    private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

    /**
     * Creates a new SearchManager instance
     * @param contextService - The ContextService instance for performing searches
     * @param configService - The ConfigService instance for configuration
     * @param loggingService - The CentralizedLoggingService instance for logging
     * @param notificationService - The NotificationService instance for user notifications
     * @param queryExpansionService - Optional QueryExpansionService instance
     * @param llmReRankingService - Optional LLMReRankingService instance
     * @param telemetryService - Optional TelemetryService instance for analytics
     */
    constructor(
        contextService: ContextService,
        configService: ConfigService,
        loggingService: CentralizedLoggingService,
        notificationService: NotificationService,
        queryExpansionService?: QueryExpansionService,
        llmReRankingService?: LLMReRankingService,
        telemetryService?: TelemetryService
    ) {
        this.contextService = contextService;
        this.configService = configService;
        this.loggingService = loggingService;
        this.notificationService = notificationService;
        this.telemetryService = telemetryService;
        this.queryExpansionService = queryExpansionService || new QueryExpansionService(configService);
        this.llmReRankingService = llmReRankingService || new LLMReRankingService(configService);
        this.loadSearchHistory();
    }
    /**
     * Performs semantic vector search using embeddings
     * @param query - The search query string
     * @param limit - Maximum number of results to return
     * @returns Promise resolving to search results with similarity scores
     */
    async performSemanticSearch(query: string, limit: number = 20): Promise<SearchResult[]> {
        try {
            this.loggingService.info('Performing semantic search', { query, limit }, 'SearchManager');

            // Use ContextService which already handles semantic search via IndexingService
            const contextQuery: ContextQuery = {
                query,
                maxResults: limit,
                minSimilarity: 0.3, // Lower threshold for semantic search
            };

            const contextResult = await this.contextService.queryContext(contextQuery);

            // ContextResult.results are already SearchResult[] from QdrantService
            // Just return them directly since they have the correct structure
            const searchResults: SearchResult[] = contextResult.results;

            this.loggingService.info(`Semantic search completed: ${searchResults.length} results`, {}, 'SearchManager');
            return searchResults;

        } catch (error) {
            this.loggingService.error('Semantic search failed', {
                error: error instanceof Error ? error.message : String(error),
                query
            }, 'SearchManager');
            return [];
        }
    }

    /**
     * Main search method - delegates to semantic search by default
     * @param query - The search query string
     * @param filters - Search filters and options
     * @returns Promise resolving to enhanced search results
     */
    async search(query: string, filters: SearchFilters = {}): Promise<EnhancedSearchResult[]> {
        // For now, use semantic search as the primary method
        const semanticResults = await this.performSemanticSearch(query, filters.maxResults);

        // Transform to EnhancedSearchResult format
        return this.transformSearchResults(semanticResults, query, filters);
    }

    /**
     * Performs an advanced search with filters and options
     * @param query - The search query string
     * @param filters - Search filters and options
     * @returns Promise resolving to enhanced search results
     */
    async performKeywordSearch(query: string, filters: SearchFilters = {}): Promise<EnhancedSearchResult[]> {
        const startTime = performance.now();
        try {
            this.loggingService.info('Performing advanced search', { query, filters }, 'SearchManager');

            // Check cache first
            const cacheKey = this.generateCacheKey(query, filters);
            const cachedResults = this.resultCache.get(cacheKey);
            if (cachedResults) {
                this.loggingService.debug('Returning cached results', {}, 'SearchManager');

                // Track cached search
                const latency = performance.now() - startTime;
                this.telemetryService?.trackEvent('search_performed', {
                    latency: Math.round(latency),
                    resultCount: cachedResults.length,
                    cached: true,
                    hasFilters: Object.keys(filters).length > 0
                });

                return cachedResults;
            }

            // Step 1: Query Expansion
            let expandedQuery: ExpandedQuery | null = null;
            let searchQuery = query;

            if (this.queryExpansionService.isEnabled()) {
                this.loggingService.debug('Expanding query...', {}, 'SearchManager');
                expandedQuery = await this.queryExpansionService.expandQuery(query);
                searchQuery = expandedQuery.combinedQuery;
                this.loggingService.debug(`Query expanded from "${query}" to "${searchQuery}"`, {}, 'SearchManager');
                this.loggingService.debug(`Expanded terms: ${expandedQuery.expandedTerms.join(', ')}`, {}, 'SearchManager');
            }

            // Get result limit from configuration
            const config = this.configService.getFullConfig();
            const resultLimit = filters.maxResults || 20;
            const minSimilarity = filters.minSimilarity || 0.5;

            // Build context query from search parameters
            const contextQuery: ContextQuery & { fileType?: string; dateRange?: any } = {
                query: searchQuery, // Use expanded query
                maxResults: resultLimit,
                minSimilarity: minSimilarity,
                fileTypes: filters.fileTypes
            };

            // Perform the search
            const contextResults = await this.contextService.queryContext(contextQuery);

            // Transform results to enhanced format
            let enhancedResults = await this.transformResults(contextResults.relatedFiles || []);

            // Step 2: LLM Re-ranking (if enabled and we have results)
            let reRankingResult: ReRankingResult | null = null;

            if (this.llmReRankingService.isEnabled() && enhancedResults.length > 0) {
                console.log('SearchManager: Re-ranking results with LLM...');

                // Convert enhanced results to format expected by re-ranking service
                const resultsForReRanking = enhancedResults.map(result => ({
                    chunk: {
                        id: result.id,
                        content: result.preview,
                        filePath: result.filePath,
                        type: result.chunkType as any,
                        startLine: result.lineNumber,
                        endLine: result.lineNumber + 10, // Estimate
                        language: 'typescript' as any // Default language, will be improved later
                    },
                    score: result.similarity
                }));

                reRankingResult = await this.llmReRankingService.reRankResults(query, resultsForReRanking);

                if (reRankingResult.success) {
                    // Update enhanced results with re-ranking scores
                    enhancedResults = enhancedResults.map((result, index) => {
                        const rankedResult = reRankingResult!.rankedResults[index];
                        if (rankedResult) {
                            return {
                                ...result,
                                llmScore: rankedResult.llmScore,
                                finalScore: rankedResult.finalScore,
                                explanation: rankedResult.explanation,
                                wasReRanked: true,
                                similarity: rankedResult.finalScore // Update main similarity score
                            };
                        }
                        return result;
                    });

                    console.log(`SearchManager: Re-ranked ${reRankingResult.processedCount} results`);
                }
            }

            // Apply additional filtering
            const filteredResults = this.applyAdvancedFilters(enhancedResults, filters);

            // Sort results by relevance and similarity (now potentially including LLM scores)
            const sortedResults = this.sortResults(filteredResults);

            // Cache the results
            this.cacheResults(cacheKey, sortedResults);

            // Add to search history with expansion/re-ranking info
            this.addToHistory(
                query,
                filters,
                sortedResults.length,
                expandedQuery?.expandedTerms,
                expandedQuery !== null,
                reRankingResult?.success || false
            );

            // Track successful search
            const latency = performance.now() - startTime;
            this.telemetryService?.trackEvent('search_performed', {
                latency: Math.round(latency),
                resultCount: sortedResults.length,
                cached: false,
                hasFilters: Object.keys(filters).length > 0,
                queryExpanded: expandedQuery !== null,
                reRanked: reRankingResult?.success || false
            });

            this.loggingService.info(`Found ${sortedResults.length} results`, {}, 'SearchManager');
            return sortedResults;

        } catch (error) {
            // Track failed search
            const latency = performance.now() - startTime;
            this.telemetryService?.trackEvent('error_occurred', {
                errorType: 'search_failed',
                latency: Math.round(latency),
                hasFilters: Object.keys(filters).length > 0
            });

            this.loggingService.error('Search failed', { error: error instanceof Error ? error.message : String(error) }, 'SearchManager');
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
     * Transforms QdrantService SearchResult[] to EnhancedSearchResult[]
     */
    private async transformSearchResults(
        searchResults: SearchResult[],
        query: string,
        filters: SearchFilters = {}
    ): Promise<EnhancedSearchResult[]> {
        const results: EnhancedSearchResult[] = [];

        for (const result of searchResults) {
            try {
                const enhanced: EnhancedSearchResult = {
                    id: String(result.id),
                    title: this.extractTitleFromPayload(result.payload),
                    description: this.extractDescriptionFromPayload(result.payload),
                    filePath: result.payload.filePath,
                    language: result.payload.language || 'unknown',
                    lineNumber: result.payload.startLine || 1,
                    similarity: result.score,
                    context: result.payload.content || '',
                    preview: result.payload.content?.substring(0, 200) + '...' || '',
                    lastModified: new Date(), // Would be populated from file stats
                    fileSize: 0, // Would be populated from file stats
                    chunkType: result.payload.type || 'code',
                    finalScore: result.score,
                    wasReRanked: false
                };

                results.push(enhanced);
            } catch (error) {
                this.loggingService.warn('Failed to transform search result', {
                    error: error instanceof Error ? error.message : String(error),
                    resultId: result.id
                }, 'SearchManager');
            }
        }

        return results;
    }

    /**
     * Extract title from QdrantPoint payload
     */
    private extractTitleFromPayload(payload: any): string {
        return payload.name || payload.signature || `${payload.type || 'Code'} in ${payload.filePath}`;
    }

    /**
     * Extract description from QdrantPoint payload
     */
    private extractDescriptionFromPayload(payload: any): string {
        return payload.docstring || payload.content?.substring(0, 100) + '...' || 'No description available';
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
    private addToHistory(
        query: string,
        filters: SearchFilters,
        resultCount: number,
        expandedTerms?: string[],
        usedExpansion?: boolean,
        usedReRanking?: boolean
    ): void {
        const entry: SearchHistoryEntry = {
            query,
            filters,
            timestamp: new Date(),
            resultCount,
            expandedTerms,
            usedExpansion,
            usedReRanking
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
