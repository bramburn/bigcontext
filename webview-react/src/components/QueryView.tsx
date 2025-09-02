/**
 * QueryView Component
 * 
 * Main search interface for querying the indexed codebase.
 * Provides search input, results display, and search history.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Text,
  Body1,
  Input,
  Spinner,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  Search24Regular,
  History24Regular,
  Dismiss24Regular,
  ThumbLike20Regular,
  ThumbDislike20Regular,
  Share20Regular
} from '@fluentui/react-icons';
import { useAppStore, useSearchState } from '../stores/appStore';
import { SearchResult } from '../types';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';
import FilterPanel, { FilterOptions } from './FilterPanel';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalL,
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    marginBottom: tokens.spacingVerticalL,
    textAlign: 'center'
  },
  title: {
    marginBottom: tokens.spacingVerticalS
  },
  description: {
    color: tokens.colorNeutralForeground2
  },
  searchSection: {
    marginBottom: tokens.spacingVerticalL
  },
  searchCard: {
    padding: tokens.spacingVerticalL
  },
  searchInput: {
    marginBottom: tokens.spacingVerticalM
  },
  searchActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center'
  },
  historySection: {
    marginBottom: tokens.spacingVerticalL
  },
  historyCard: {
    padding: tokens.spacingVerticalM
  },
  historyItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS
  },
  historyItem: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase200,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3
    }
  },
  resultsSection: {
    marginBottom: tokens.spacingVerticalL
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM
  },
  resultCard: {
    marginBottom: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1
    }
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingVerticalS
  },
  filePath: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  score: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall
  },
  content: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusSmall,
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    maxHeight: '200px'
  },
  context: {
    marginTop: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXL,
    gap: tokens.spacingHorizontalS
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground2
  }
});

export const QueryView: React.FC = () => {
  const styles = useStyles();
  const searchState = useSearchState();
  const { 
    setQuery, 
    setSearching, 
    setSearchResults, 
    addToHistory, 
    clearHistory,
    setSearchStats 
  } = useAppStore();
  
  const [inputValue, setInputValue] = useState(searchState.query);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [availableFileTypes, setAvailableFileTypes] = useState<string[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<string>>(new Set());

  // Set up message listeners for search results
  useEffect(() => {
    const unsubscribeResults = onMessageCommand('searchResponse', (message) => {
      const payload = message.data || message.payload || message;
      const normalized = (payload.results || []).map((r: any) => {
        // Case 1: Type-safe results with flat fields
        if (r.filePath && (r.preview || r.content || r.explanation || r.similarity !== undefined)) {
          return {
            id: String(r.id ?? `${r.filePath}:${r.lineNumber ?? 0}`),
            filePath: r.filePath,
            lineNumber: r.lineNumber ?? 0,
            content: r.preview ?? r.content ?? '',
            score: r.finalScore ?? r.llmScore ?? r.similarity ?? 0,
            context: r.explanation,
          } as SearchResult;
        }
        // Case 2: Qdrant-style results { payload: { filePath, content, startLine }, score }
        if (r.payload?.filePath) {
          return {
            id: String(r.id ?? `${r.payload.filePath}:${r.payload.startLine ?? 0}`),
            filePath: r.payload.filePath,
            lineNumber: r.payload.startLine ?? 0,
            content: r.payload.content ?? '',
            score: r.score ?? 0,
          } as SearchResult;
        }
        // Fallback: attempt to coerce
        return {
          id: String(r.id ?? Math.random()),
          filePath: r.filePath ?? r.payload?.filePath ?? '',
          lineNumber: r.lineNumber ?? r.payload?.startLine ?? 0,
          content: r.preview ?? r.content ?? r.payload?.content ?? '',
          score: r.finalScore ?? r.llmScore ?? r.similarity ?? r.score ?? 0,
        } as SearchResult;
      });

      setSearchResults(normalized);
      setSearchStats({
        totalResults: payload.totalResults ?? payload.data?.totalResults ?? normalized.length,
        searchTime: payload.searchTime ?? payload.processingTime ?? 0,
        lastSearched: new Date()
      });

      // Extract available file types from results
      const fileTypes = new Set<string>();
      normalized.forEach((result: SearchResult) => {
        if (result.filePath) {
          const extension = result.filePath.split('.').pop() || '';
          if (extension) {
            fileTypes.add('.' + extension);
          }
        }
      });
      setAvailableFileTypes(Array.from(fileTypes).sort());

      setSearching(false);
    });

    const unsubscribeError = onMessageCommand('error', (data) => {
      console.error('Search error:', data.message || data.error);
      setSearching(false);
    });

    return () => {
      unsubscribeResults();
      unsubscribeError();
    };
  }, [setSearchResults, setSearchStats, setSearching]);

  const handleSearch = useCallback(() => {
    if (!inputValue.trim()) return;

    setQuery(inputValue);
    setSearching(true);
    addToHistory(inputValue);

    // Convert filters to the format expected by the backend
    const searchFilters: any = {};

    if (filters.fileType) {
      searchFilters.fileType = filters.fileType;
    }

    if (filters.dateRange?.from || filters.dateRange?.to) {
      searchFilters.dateRange = {};
      if (filters.dateRange.from) {
        searchFilters.dateRange.gte = new Date(filters.dateRange.from).getTime();
      }
      if (filters.dateRange.to) {
        searchFilters.dateRange.lte = new Date(filters.dateRange.to).getTime();
      }
    }

    postMessage('search', {
      query: inputValue,
      filters: searchFilters
    });
  }, [inputValue, filters, setQuery, setSearching, addToHistory]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleHistoryClick = (query: string) => {
    setInputValue(query);
    setQuery(query);
    setSearching(true);
    
    postMessage('search', {
      query
    });
  };

  const handleResultClick = (result: SearchResult) => {
    postMessage('openFile', {
      filePath: result.filePath,
      lineNumber: result.lineNumber
    });
  };

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    // Trigger new search if there's a current query
    if (inputValue.trim()) {
      // Use setTimeout to ensure state is updated before search
      setTimeout(() => {
        handleSearch();
      }, 0);
    }
  }, [inputValue, handleSearch]);

  const handleFeedback = useCallback((result: SearchResult, feedbackType: 'positive' | 'negative') => {
    if (feedbackSubmitted.has(result.id)) return;

    postMessage('submitFeedback', {
      query: searchState.query,
      resultId: result.id,
      filePath: result.filePath,
      feedback: feedbackType
    });

    // Mark feedback as submitted for this result
    setFeedbackSubmitted(prev => new Set(prev).add(result.id));
  }, [searchState.query, feedbackSubmitted]);

  const handleShare = useCallback((result: SearchResult) => {
    // Generate the deep link URI using the correct extension ID from package.json
    const extensionId = 'icelabz.code-context-engine'; // publisher.name from package.json
    const link = `vscode://${extensionId}/view?resultId=${encodeURIComponent(result.id)}`;

    // Copy to clipboard via backend
    postMessage('copyToClipboard', {
      text: link
    });
  }, []);

  const handleClearHistory = () => {
    clearHistory();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={800} weight="bold" className={styles.title}>
          <Search24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
          Search Your Code
        </Text>
        <Body1 className={styles.description}>
          Use natural language to search through your indexed codebase.
        </Body1>
      </div>

      {/* Search Input */}
      <div className={styles.searchSection}>
        <Card className={styles.searchCard}>
          <Input
            size="large"
            placeholder="Describe what you're looking for..."
            value={inputValue}
            onChange={(_, data) => setInputValue(data.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
            data-tour="search-input"
          />
          <div className={styles.searchActions}>
            <Button
              appearance="primary"
              icon={<Search24Regular />}
              disabled={!inputValue.trim() || searchState.isSearching}
              onClick={handleSearch}
            >
              {searchState.isSearching ? 'Searching...' : 'Search'}
            </Button>
            {searchState.isSearching && <Spinner size="small" />}
          </div>
        </Card>
      </div>

      {/* Filter Panel */}
      <div data-tour="filter-panel">
        <FilterPanel
          availableFileTypes={availableFileTypes}
          onFilterChange={handleFilterChange}
          currentFilters={filters}
        />
      </div>

      {/* Search History */}
      {searchState.history.length > 0 && (
        <div className={styles.historySection}>
          <Card className={styles.historyCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text size={400} weight="semibold">
                <History24Regular style={{ marginRight: tokens.spacingHorizontalXS }} />
                Recent Searches
              </Text>
              <Button
                appearance="subtle"
                size="small"
                icon={<Dismiss24Regular />}
                onClick={handleClearHistory}
              >
                Clear
              </Button>
            </div>
            <div className={styles.historyItems}>
              {searchState.history.map((query, index) => (
                <div
                  key={index}
                  className={styles.historyItem}
                  onClick={() => handleHistoryClick(query)}
                >
                  {query}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Search Results */}
      <div className={styles.resultsSection} data-tour="results-section">
        {searchState.isSearching ? (
          <div className={styles.loadingContainer}>
            <Spinner />
            <Text>Searching your codebase...</Text>
          </div>
        ) : searchState.results.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <Text size={500} weight="semibold">
                Search Results ({searchState.stats.totalResults})
              </Text>
              {searchState.stats.searchTime > 0 && (
                <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                  {searchState.stats.searchTime}ms
                </Text>
              )}
            </div>
            {searchState.results.map((result) => {
              const isFeedbackSubmitted = feedbackSubmitted.has(result.id);
              return (
                <Card
                  key={result.id}
                  className={styles.resultCard}
                >
                  <div onClick={() => handleResultClick(result)} style={{ cursor: 'pointer' }}>
                    <div className={styles.resultHeader}>
                      <Text className={styles.filePath}>
                        {result.filePath}:{result.lineNumber}
                      </Text>
                      <div className={styles.score}>
                        {Math.round(result.score * 100)}%
                      </div>
                    </div>
                    <div className={styles.content}>
                      {result.content}
                    </div>
                    {result.context && (
                      <div className={styles.context}>
                        Context: {result.context}
                      </div>
                    )}
                  </div>

                  {/* Action Icons */}
                  <div style={{
                    display: 'flex',
                    gap: tokens.spacingHorizontalS,
                    marginTop: tokens.spacingVerticalS,
                    paddingTop: tokens.spacingVerticalS,
                    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                    opacity: isFeedbackSubmitted ? 0.5 : 1
                  }}>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Share20Regular />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(result);
                      }}
                      title="Share this result"
                    >
                      Share
                    </Button>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ThumbLike20Regular />}
                      disabled={isFeedbackSubmitted}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(result, 'positive');
                      }}
                    >
                      Helpful
                    </Button>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ThumbDislike20Regular />}
                      disabled={isFeedbackSubmitted}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(result, 'negative');
                      }}
                    >
                      Not helpful
                    </Button>
                    {isFeedbackSubmitted && (
                      <Text size={200} style={{
                        color: tokens.colorNeutralForeground2,
                        alignSelf: 'center',
                        marginLeft: tokens.spacingHorizontalS
                      }}>
                        Thank you for your feedback!
                      </Text>
                    )}
                  </div>
                </Card>
              );
            })}
          </>
        ) : searchState.query ? (
          <div className={styles.emptyState}>
            <Text size={400}>
              No results found for "{searchState.query}"
            </Text>
            <Body1 style={{ marginTop: tokens.spacingVerticalS }}>
              Try rephrasing your search or using different keywords.
            </Body1>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Text size={400}>
              Enter a search query to find relevant code in your workspace.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryView;
