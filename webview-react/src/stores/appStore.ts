/**
 * Zustand store for React webview application state
 * 
 * This store manages the global state of the React webview application,
 * including app state, setup state, indexing state, and search state.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  AppState,
  SetupState,
  ViewType,
  SearchResult,
  IndexingStats,
  SearchStats,
  DatabaseConfig,
  ProviderConfig,
  QdrantConfig,
  OllamaConfig
} from '../types';

interface AppStore extends AppState, SetupState {
  // Navigation state
  selectedNavItem: string;
  selectedSearchTab: 'query' | 'saved';

  // Indexing state
  isIndexing: boolean;
  isPaused: boolean;
  progress: number;
  message: string;
  filesProcessed: number;
  totalFiles: number;
  currentFile: string;
  indexingStats: IndexingStats;

  // Search state
  query: string;
  isSearching: boolean;
  results: SearchResult[];
  history: string[];
  searchStats: SearchStats;
  hasMore: boolean;
  currentPage: number;
  savedSearches: Array<{id: string; name: string; query: string; timestamp: Date}>;
  // Navigation actions
  setSelectedNavItem: (item: string) => void;
  setSelectedSearchTab: (tab: 'query' | 'saved') => void;

  // App actions
  setCurrentView: (view: ViewType) => void;
  setWorkspaceOpen: (isOpen: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFirstRunComplete: (completed: boolean) => void;

  // Setup actions
  setSelectedDatabase: (database: 'qdrant' | 'pinecone' | 'chroma') => void;
  setSelectedProvider: (provider: 'ollama' | 'openai' | 'anthropic') => void;
  setDatabaseStatus: (status: SetupState['databaseStatus']) => void;
  setProviderStatus: (status: SetupState['providerStatus']) => void;
  updateDatabaseConfig: (config: Partial<DatabaseConfig>) => void;
  updateProviderConfig: (config: Partial<ProviderConfig>) => void;
  setValidationError: (field: string, error: string) => void;
  clearValidationError: (field: string) => void;
  setSetupComplete: (complete: boolean) => void;
  setAvailableModels: (models: string[]) => void;
  setLoadingModels: (loading: boolean) => void;

  // Indexing actions
  setIndexing: (isIndexing: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  setIndexingProgress: (progress: number) => void;
  setIndexingMessage: (message: string) => void;
  setFilesProcessed: (processed: number, total: number) => void;
  setCurrentFile: (file: string) => void;
  startIndexing: () => void;
  completeIndexing: (stats: Partial<IndexingStats>) => void;

  // Search actions
  setQuery: (query: string) => void;
  setSearching: (isSearching: boolean) => void;
  setSearchResults: (results: SearchResult[]) => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  setSearchStats: (stats: Partial<SearchStats>) => void;
  setHasMore: (hasMore: boolean) => void;
  setCurrentPage: (page: number) => void;
  addSavedSearch: (name: string, query: string) => void;
  removeSavedSearch: (id: string) => void;
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set) => ({
    // Initial navigation state
    selectedNavItem: 'search',
    selectedSearchTab: 'query',

    // Initial app state
    isWorkspaceOpen: false,
    currentView: 'setup',
    isLoading: false,
    error: null,
    hasCompletedFirstRun: false,

    // Initial setup state
    selectedDatabase: 'qdrant',
    selectedProvider: 'ollama',
    databaseStatus: 'unknown',
    providerStatus: 'unknown',
    databaseConfig: {
      url: 'http://localhost:6333'
    } as QdrantConfig,
    providerConfig: {
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434'
    } as OllamaConfig,
    validationErrors: {},
    isSetupComplete: false,
    availableModels: [],
    isLoadingModels: false,
    modelSuggestions: [],

    // Initial indexing state
    isIndexing: false,
    isPaused: false,
    progress: 0,
    message: '',
    filesProcessed: 0,
    totalFiles: 0,
    currentFile: '',
    indexingStats: {
      startTime: null,
      endTime: null,
      duration: 0,
      chunksCreated: 0,
      errors: []
    },

    // Initial search state
    query: '',
    isSearching: false,
    results: [],
    history: [],
    searchStats: {
      totalResults: 0,
      searchTime: 0,
      lastSearched: null
    },
    hasMore: false,
    currentPage: 1,
    savedSearches: [],

    // Navigation actions
    setSelectedNavItem: (item) => set({ selectedNavItem: item }),
    setSelectedSearchTab: (tab) => set({ selectedSearchTab: tab }),

    // App actions
    setCurrentView: (view) => set({ currentView: view }),
    setWorkspaceOpen: (isOpen) => set({ isWorkspaceOpen: isOpen }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setFirstRunComplete: (completed) => set({ hasCompletedFirstRun: completed }),

    // Setup actions
    setSelectedDatabase: (database) => set((state) => {
      // Reset database config when switching providers
      let newDatabaseConfig: DatabaseConfig;
      switch (database) {
        case 'qdrant':
          newDatabaseConfig = { url: 'http://localhost:6333' } as QdrantConfig;
          break;
        case 'pinecone':
          newDatabaseConfig = { apiKey: '', environment: '', indexName: '' } as any;
          break;
        case 'chroma':
          newDatabaseConfig = { host: 'localhost' } as any;
          break;
        default:
          newDatabaseConfig = state.databaseConfig;
      }
      return {
        selectedDatabase: database,
        databaseConfig: newDatabaseConfig,
        databaseStatus: 'unknown'
      };
    }),
    setSelectedProvider: (provider) => set((state) => {
      // Reset provider config when switching providers
      let newProviderConfig: ProviderConfig;
      switch (provider) {
        case 'ollama':
          newProviderConfig = {
            model: 'nomic-embed-text',
            baseUrl: 'http://localhost:11434'
          } as OllamaConfig;
          break;
        case 'openai':
          newProviderConfig = {
            apiKey: '',
            model: 'text-embedding-3-small'
          } as any;
          break;
        case 'anthropic':
          newProviderConfig = {
            apiKey: '',
            model: 'claude-3-haiku-20240307'
          } as any;
          break;
        default:
          newProviderConfig = state.providerConfig;
      }
      return {
        selectedProvider: provider,
        providerConfig: newProviderConfig,
        providerStatus: 'unknown',
        availableModels: []
      };
    }),
    setDatabaseStatus: (status) => set({ databaseStatus: status }),
    setProviderStatus: (status) => set({ providerStatus: status }),
    updateDatabaseConfig: (config) => set((state) => ({
      databaseConfig: { ...state.databaseConfig, ...config }
    })),
    updateProviderConfig: (config) => set((state) => ({
      providerConfig: { ...state.providerConfig, ...config }
    })),
    setValidationError: (field, error) => set((state) => ({
      validationErrors: { ...state.validationErrors, [field]: error }
    })),
    clearValidationError: (field) => set((state) => {
      const { [field]: _, ...rest } = state.validationErrors;
      return { validationErrors: rest };
    }),
    setSetupComplete: (complete) => set({ isSetupComplete: complete }),
    setAvailableModels: (models) => set({ availableModels: models }),
    setLoadingModels: (loading) => set({ isLoadingModels: loading }),

    // Indexing actions
    setIndexing: (isIndexing) => set({ isIndexing }),
    setPaused: (isPaused) => set({ isPaused }),
    setIndexingProgress: (progress) => set({ progress }),
    setIndexingMessage: (message) => set({ message }),
    setFilesProcessed: (processed, total) => set({
      filesProcessed: processed,
      totalFiles: total
    }),
    setCurrentFile: (file) => set({ currentFile: file }),
    startIndexing: () => set((state) => ({
      isIndexing: true,
      isPaused: false,
      progress: 0,
      message: 'Starting indexing...',
      indexingStats: {
        ...state.indexingStats,
        startTime: new Date(),
        endTime: null,
        errors: []
      }
    })),
    completeIndexing: (stats) => set((state) => ({
      isIndexing: false,
      isPaused: false,
      progress: 100,
      message: 'Indexing completed',
      indexingStats: {
        ...state.indexingStats,
        ...stats,
        endTime: new Date()
      }
    })),

    // Search actions
    setQuery: (query) => set({ query }),
    setSearching: (isSearching) => set({ isSearching }),
    setSearchResults: (results) => set({ results }),
    addToHistory: (query) => set((state) => {
      const newHistory = [query, ...state.history.filter(h => h !== query)].slice(0, 10);
      return { history: newHistory };
    }),
    clearHistory: () => set({ history: [] }),
    setSearchStats: (stats) => set((state) => ({
      searchStats: { ...state.searchStats, ...stats }
    })),
    setHasMore: (hasMore) => set({ hasMore }),
    setCurrentPage: (page) => set({ currentPage: page }),
    addSavedSearch: (name, query) => set((state) => ({
      savedSearches: [...state.savedSearches, {
        id: Date.now().toString(),
        name,
        query,
        timestamp: new Date()
      }]
    })),
    removeSavedSearch: (id) => set((state) => ({
      savedSearches: state.savedSearches.filter(search => search.id !== id)
    }))
  }))
);

// Selectors for easier state access
export const useCurrentView = () => useAppStore((state) => state.currentView);
export const useIsWorkspaceOpen = () => useAppStore((state) => state.isWorkspaceOpen);
export const useSetupState = () => useAppStore((state) => ({
  selectedDatabase: state.selectedDatabase,
  selectedProvider: state.selectedProvider,
  databaseStatus: state.databaseStatus,
  providerStatus: state.providerStatus,
  databaseConfig: state.databaseConfig,
  providerConfig: state.providerConfig,
  validationErrors: state.validationErrors,
  isSetupComplete: state.isSetupComplete,
  availableModels: state.availableModels,
  isLoadingModels: state.isLoadingModels,
  modelSuggestions: state.modelSuggestions
}));
export const useIndexingState = () => useAppStore((state) => ({
  isIndexing: state.isIndexing,
  isPaused: state.isPaused,
  progress: state.progress,
  message: state.message,
  filesProcessed: state.filesProcessed,
  totalFiles: state.totalFiles,
  currentFile: state.currentFile,
  stats: state.indexingStats
}));
export const useSearchState = () => useAppStore((state) => ({
  query: state.query,
  isSearching: state.isSearching,
  results: state.results,
  history: state.history,
  stats: state.searchStats,
  hasMore: state.hasMore,
  currentPage: state.currentPage
}));
