import * as vscode from 'vscode';
import { randomUUID } from 'crypto';

/**
 * Interface representing a search history item
 */
export interface HistoryItem {
    /** The search query string */
    query: string;
    /** Number of results returned for this query */
    resultsCount: number;
    /** Timestamp when the search was performed */
    timestamp: number;
    /** Unique identifier for the history item */
    id: string;
    /** Optional: The format of results (json/xml) */
    resultFormat?: 'json' | 'xml';
    /** Optional: Execution time in milliseconds */
    executionTime?: number;
}

/**
 * HistoryManager class responsible for managing search history persistence
 * using VS Code's global state storage.
 * 
 * This class provides:
 * - Persistent storage of search queries and their metadata
 * - Automatic deduplication (moving existing queries to top)
 * - Configurable history size limits
 * - Efficient retrieval and management operations
 */
export class HistoryManager implements vscode.Disposable {
    private readonly HISTORY_KEY = 'bigcontext.searchHistory';
    private readonly MAX_HISTORY_ITEMS = 100;

    /**
     * Creates a new HistoryManager instance
     * @param context - VS Code extension context for state persistence
     */
    constructor(private context: vscode.ExtensionContext) {
        console.log('HistoryManager: Initialized');
    }

    /**
     * Retrieves the complete search history
     * @returns Array of history items, sorted by most recent first
     */
    public getHistory(): HistoryItem[] {
        try {
            const history = this.context.globalState.get<HistoryItem[]>(this.HISTORY_KEY, []);
            console.log(`HistoryManager: Retrieved ${history.length} history items`);
            return history;
        } catch (error) {
            console.error('HistoryManager: Failed to retrieve history:', error);
            return [];
        }
    }

    /**
     * Adds a new search query to the history
     * If the query already exists, it will be moved to the top
     * @param query - The search query string
     * @param resultsCount - Number of results returned
     * @param resultFormat - Format of the results (optional)
     * @param executionTime - Query execution time in milliseconds (optional)
     */
    public async addHistoryItem(
        query: string, 
        resultsCount: number, 
        resultFormat?: 'json' | 'xml',
        executionTime?: number
    ): Promise<void> {
        try {
            // Validate input
            if (!query || query.trim().length === 0) {
                console.warn('HistoryManager: Cannot add empty query to history');
                return;
            }

            const trimmedQuery = query.trim();
            const history = this.getHistory();
            
            // Create new history item
            const newItem: HistoryItem = {
                query: trimmedQuery,
                resultsCount: Math.max(0, resultsCount), // Ensure non-negative
                timestamp: Date.now(),
                id: randomUUID(),
                resultFormat,
                executionTime
            };

            // Remove existing entry for the same query (case-insensitive)
            const filteredHistory = history.filter(
                item => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
            );
            
            // Add new item to the top and limit the total number
            const newHistory = [newItem, ...filteredHistory].slice(0, this.MAX_HISTORY_ITEMS);

            // Save to global state
            await this.context.globalState.update(this.HISTORY_KEY, newHistory);
            
            console.log(`HistoryManager: Added history item for query: "${trimmedQuery}" (${resultsCount} results)`);
        } catch (error) {
            console.error('HistoryManager: Failed to add history item:', error);
        }
    }

    /**
     * Removes a specific history item by ID
     * @param id - The unique identifier of the history item to remove
     */
    public async removeHistoryItem(id: string): Promise<void> {
        try {
            const history = this.getHistory();
            const filteredHistory = history.filter(item => item.id !== id);
            
            if (filteredHistory.length === history.length) {
                console.warn(`HistoryManager: No history item found with ID: ${id}`);
                return;
            }

            await this.context.globalState.update(this.HISTORY_KEY, filteredHistory);
            console.log(`HistoryManager: Removed history item with ID: ${id}`);
        } catch (error) {
            console.error('HistoryManager: Failed to remove history item:', error);
        }
    }

    /**
     * Clears all search history
     */
    public async clearHistory(): Promise<void> {
        try {
            await this.context.globalState.update(this.HISTORY_KEY, []);
            console.log('HistoryManager: Cleared all search history');
        } catch (error) {
            console.error('HistoryManager: Failed to clear history:', error);
        }
    }

    /**
     * Gets recent history items (last N items)
     * @param count - Number of recent items to retrieve (default: 10)
     * @returns Array of recent history items
     */
    public getRecentHistory(count: number = 10): HistoryItem[] {
        try {
            const history = this.getHistory();
            return history.slice(0, Math.max(0, count));
        } catch (error) {
            console.error('HistoryManager: Failed to get recent history:', error);
            return [];
        }
    }

    /**
     * Searches history items by query text
     * @param searchTerm - Term to search for in query strings
     * @returns Array of matching history items
     */
    public searchHistory(searchTerm: string): HistoryItem[] {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                return this.getHistory();
            }

            const history = this.getHistory();
            const lowerSearchTerm = searchTerm.toLowerCase();
            
            return history.filter(item => 
                item.query.toLowerCase().includes(lowerSearchTerm)
            );
        } catch (error) {
            console.error('HistoryManager: Failed to search history:', error);
            return [];
        }
    }

    /**
     * Gets statistics about the search history
     * @returns Object containing history statistics
     */
    public getHistoryStats(): {
        totalItems: number;
        totalSearches: number;
        averageResults: number;
        mostRecentSearch?: Date;
        oldestSearch?: Date;
    } {
        try {
            const history = this.getHistory();
            
            if (history.length === 0) {
                return {
                    totalItems: 0,
                    totalSearches: 0,
                    averageResults: 0
                };
            }

            const totalResults = history.reduce((sum, item) => sum + item.resultsCount, 0);
            const timestamps = history.map(item => item.timestamp);
            
            return {
                totalItems: history.length,
                totalSearches: history.length,
                averageResults: Math.round(totalResults / history.length),
                mostRecentSearch: new Date(Math.max(...timestamps)),
                oldestSearch: new Date(Math.min(...timestamps))
            };
        } catch (error) {
            console.error('HistoryManager: Failed to get history stats:', error);
            return {
                totalItems: 0,
                totalSearches: 0,
                averageResults: 0
            };
        }
    }

    /**
     * Exports history to a JSON string
     * @returns JSON string representation of the history
     */
    public exportHistory(): string {
        try {
            const history = this.getHistory();
            return JSON.stringify(history, null, 2);
        } catch (error) {
            console.error('HistoryManager: Failed to export history:', error);
            return '[]';
        }
    }

    /**
     * Imports history from a JSON string
     * @param jsonData - JSON string containing history data
     * @param merge - Whether to merge with existing history (default: false)
     */
    public async importHistory(jsonData: string, merge: boolean = false): Promise<void> {
        try {
            const importedHistory: HistoryItem[] = JSON.parse(jsonData);
            
            if (!Array.isArray(importedHistory)) {
                throw new Error('Invalid history data format');
            }

            let newHistory: HistoryItem[];
            
            if (merge) {
                const existingHistory = this.getHistory();
                // Merge and deduplicate by query
                const combined = [...importedHistory, ...existingHistory];
                const uniqueQueries = new Map<string, HistoryItem>();
                
                combined.forEach(item => {
                    const key = item.query.toLowerCase();
                    if (!uniqueQueries.has(key) || uniqueQueries.get(key)!.timestamp < item.timestamp) {
                        uniqueQueries.set(key, item);
                    }
                });
                
                newHistory = Array.from(uniqueQueries.values())
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, this.MAX_HISTORY_ITEMS);
            } else {
                newHistory = importedHistory
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, this.MAX_HISTORY_ITEMS);
            }

            await this.context.globalState.update(this.HISTORY_KEY, newHistory);
            console.log(`HistoryManager: Imported ${newHistory.length} history items (merge: ${merge})`);
        } catch (error) {
            console.error('HistoryManager: Failed to import history:', error);
            throw error;
        }
    }

    /**
     * Dispose of the HistoryManager and clean up resources
     */
    public dispose(): void {
        console.log('HistoryManager: Disposed');
        // No cleanup needed for this implementation
    }
}
