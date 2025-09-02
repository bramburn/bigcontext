import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../../stores/appStore';
import { SearchResult, IndexingStats, SearchStats } from '../../types';

// Mock vscode API
const mockVscodeApi = {
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
};

// @ts-ignore
global.acquireVsCodeApi = () => mockVscodeApi;

describe('AppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAppStore());
    act(() => {
      // Reset to initial state
      result.current.setCurrentView('setup');
      result.current.setWorkspaceOpen(false);
      result.current.setLoading(false);
      result.current.setError(null);
      result.current.setFirstRunComplete(false);
      result.current.setSelectedDatabase('qdrant');
      result.current.setSelectedProvider('ollama');
      result.current.setDatabaseStatus('unknown');
      result.current.setProviderStatus('unknown');
      result.current.setSetupComplete(false);
      result.current.setIndexing(false);
      result.current.setSearching(false);
      result.current.setQuery('');
      result.current.setSearchResults([]);
      result.current.clearHistory();
    });
    
    vi.clearAllMocks();
  });

  describe('App State Management', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAppStore());
      
      expect(result.current.isWorkspaceOpen).toBe(false);
      expect(result.current.currentView).toBe('setup');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.hasCompletedFirstRun).toBe(false);
    });

    it('should update workspace open state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setWorkspaceOpen(true);
      });
      
      expect(result.current.isWorkspaceOpen).toBe(true);
    });

    it('should update current view', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setCurrentView('indexing');
      });
      
      expect(result.current.currentView).toBe('indexing');
    });

    it('should update loading state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
    });

    it('should update error state', () => {
      const { result } = renderHook(() => useAppStore());
      const errorMessage = 'Test error message';
      
      act(() => {
        result.current.setError(errorMessage);
      });
      
      expect(result.current.error).toBe(errorMessage);
    });

    it('should update first run completion state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setFirstRunComplete(true);
      });
      
      expect(result.current.hasCompletedFirstRun).toBe(true);
    });
  });

  describe('Setup State Management', () => {
    it('should update selected database', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setSelectedDatabase('pinecone');
      });
      
      expect(result.current.selectedDatabase).toBe('pinecone');
    });

    it('should update selected provider', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setSelectedProvider('openai');
      });
      
      expect(result.current.selectedProvider).toBe('openai');
    });

    it('should update database status', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setDatabaseStatus('connected');
      });
      
      expect(result.current.databaseStatus).toBe('connected');
    });

    it('should update provider status', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setProviderStatus('connected');
      });

      expect(result.current.providerStatus).toBe('connected');
    });

    it('should update database configuration', () => {
      const { result } = renderHook(() => useAppStore());
      const newConfig = { url: 'http://localhost:8080' };
      
      act(() => {
        result.current.updateDatabaseConfig(newConfig);
      });
      
      expect(result.current.databaseConfig).toMatchObject(newConfig);
    });

    it('should update provider configuration', () => {
      const { result } = renderHook(() => useAppStore());
      const newConfig = { model: 'gpt-4', baseUrl: 'https://api.openai.com' };
      
      act(() => {
        result.current.updateProviderConfig(newConfig);
      });
      
      expect(result.current.providerConfig).toMatchObject(newConfig);
    });

    it('should manage validation errors', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setValidationError('database.url', 'Invalid URL format');
      });
      
      expect(result.current.validationErrors['database.url']).toBe('Invalid URL format');
      
      act(() => {
        result.current.clearValidationError('database.url');
      });
      
      expect(result.current.validationErrors['database.url']).toBeUndefined();
    });

    it('should update setup completion state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setSetupComplete(true);
      });
      
      expect(result.current.isSetupComplete).toBe(true);
    });

    it('should manage available models', () => {
      const { result } = renderHook(() => useAppStore());
      const models = ['model1', 'model2', 'model3'];
      
      act(() => {
        result.current.setAvailableModels(models);
      });
      
      expect(result.current.availableModels).toEqual(models);
    });

    it('should update loading models state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setLoadingModels(true);
      });
      
      expect(result.current.isLoadingModels).toBe(true);
    });
  });

  describe('Indexing State Management', () => {
    it('should update indexing state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setIndexing(true);
      });
      
      expect(result.current.isIndexing).toBe(true);
    });

    it('should update indexing progress', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setIndexingProgress(75);
      });
      
      expect(result.current.progress).toBe(75);
    });

    it('should update indexing message', () => {
      const { result } = renderHook(() => useAppStore());
      const message = 'Processing files...';
      
      act(() => {
        result.current.setIndexingMessage(message);
      });
      
      expect(result.current.message).toBe(message);
    });

    it('should update files processed', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setFilesProcessed(50, 100);
      });
      
      expect(result.current.filesProcessed).toBe(50);
      expect(result.current.totalFiles).toBe(100);
    });

    it('should update current file', () => {
      const { result } = renderHook(() => useAppStore());
      const fileName = '/path/to/file.ts';
      
      act(() => {
        result.current.setCurrentFile(fileName);
      });
      
      expect(result.current.currentFile).toBe(fileName);
    });

    it('should start indexing', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.startIndexing();
      });
      
      expect(result.current.isIndexing).toBe(true);
      expect(result.current.progress).toBe(0);
      expect(result.current.message).toBe('Starting indexing...');
    });

    it('should complete indexing with stats', () => {
      const { result } = renderHook(() => useAppStore());
      const stats: Partial<IndexingStats> = {
        duration: 30000,
        chunksCreated: 500,
      };
      
      act(() => {
        result.current.setIndexing(true);
        result.current.completeIndexing(stats);
      });
      
      expect(result.current.isIndexing).toBe(false);
      expect(result.current.indexingStats).toMatchObject(stats);
    });
  });

  describe('Search State Management', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useAppStore());
      const query = 'test search query';
      
      act(() => {
        result.current.setQuery(query);
      });
      
      expect(result.current.query).toBe(query);
    });

    it('should update searching state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setSearching(true);
      });
      
      expect(result.current.isSearching).toBe(true);
    });

    it('should update search results', () => {
      const { result } = renderHook(() => useAppStore());
      const results: SearchResult[] = [
        {
          id: '1',
          filePath: '/test/file1.ts',
          content: 'test content 1',
          score: 0.95,
          lineNumber: 1,
        },
        {
          id: '2',
          filePath: '/test/file2.ts',
          content: 'test content 2',
          score: 0.85,
          lineNumber: 10,
        },
      ];
      
      act(() => {
        result.current.setSearchResults(results);
      });
      
      expect(result.current.results).toEqual(results);
    });

    it('should manage search history', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.addToHistory('query 1');
        result.current.addToHistory('query 2');
        result.current.addToHistory('query 3');
      });
      
      expect(result.current.history).toEqual(['query 3', 'query 2', 'query 1']);
      
      act(() => {
        result.current.clearHistory();
      });
      
      expect(result.current.history).toEqual([]);
    });

    it('should update search stats', () => {
      const { result } = renderHook(() => useAppStore());
      const stats: Partial<SearchStats> = {
        totalResults: 25,
        searchTime: 150,
      };
      
      act(() => {
        result.current.setSearchStats(stats);
      });
      
      expect(result.current.searchStats).toMatchObject(stats);
    });

    it('should manage pagination', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setHasMore(true);
        result.current.setCurrentPage(2);
      });
      
      expect(result.current.hasMore).toBe(true);
      expect(result.current.currentPage).toBe(2);
    });
  });

  describe('State Persistence', () => {
    it('should maintain state consistency across multiple updates', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setWorkspaceOpen(true);
        result.current.setCurrentView('query');
        result.current.setSelectedDatabase('qdrant');
        result.current.setSelectedProvider('openai');
        result.current.setQuery('test query');
      });
      
      expect(result.current.isWorkspaceOpen).toBe(true);
      expect(result.current.currentView).toBe('query');
      expect(result.current.selectedDatabase).toBe('qdrant');
      expect(result.current.selectedProvider).toBe('openai');
      expect(result.current.query).toBe('test query');
    });

    it('should handle complex state updates', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        // Simulate a complete setup flow
        result.current.setCurrentView('setup');
        result.current.setSelectedDatabase('qdrant');
        result.current.updateDatabaseConfig({ url: 'http://localhost:6333' });
        result.current.setDatabaseStatus('connected');
        result.current.setSelectedProvider('ollama');
        result.current.updateProviderConfig({ model: 'nomic-embed-text' });
        result.current.setProviderStatus('connected');
        result.current.setSetupComplete(true);
        result.current.setCurrentView('indexing');
      });
      
      expect(result.current.currentView).toBe('indexing');
      expect(result.current.isSetupComplete).toBe(true);
      expect(result.current.databaseStatus).toBe('connected');
      expect(result.current.providerStatus).toBe('connected');
    });
  });
});
