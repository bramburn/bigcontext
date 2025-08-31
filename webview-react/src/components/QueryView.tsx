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
  Dismiss24Regular
} from '@fluentui/react-icons';
import { useAppStore, useSearchState } from '../stores/appStore';
import { SearchResult } from '../types';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';

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
    
    postMessage('search', {
      query: inputValue
    });
  }, [inputValue, setQuery, setSearching, addToHistory]);

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
      <div className={styles.resultsSection}>
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
            {searchState.results.map((result) => (
              <Card
                key={result.id}
                className={styles.resultCard}
                onClick={() => handleResultClick(result)}
              >
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
              </Card>
            ))}
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
