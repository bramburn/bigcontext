/**
 * Type definitions for the React webview application
 */

// View types
export type ViewType = 'setup' | 'indexing' | 'query' | 'diagnostics' | 'settings' | 'indexingDashboard';

// App state types
export interface AppState {
  isWorkspaceOpen: boolean;
  currentView: ViewType;
  isLoading: boolean;
  error: string | null;
  hasCompletedFirstRun: boolean;
}

// Database configuration types
export interface QdrantConfig {
  url: string;
  apiKey?: string;
  collection?: string;
  timeout?: number;
}

export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
  namespace?: string;
  timeout?: number;
}

export interface ChromaConfig {
  host: string;
  port?: number;
  ssl?: boolean;
  apiKey?: string;
  timeout?: number;
}

export type DatabaseConfig = QdrantConfig | PineconeConfig | ChromaConfig;

// AI Provider configuration types
export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout?: number;
  availableModels?: string[];
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  organization?: string;
  timeout?: number;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  timeout?: number;
}

export type ProviderConfig = OllamaConfig | OpenAIConfig | AnthropicConfig;

// Setup state types
export interface SetupState {
  selectedDatabase: 'qdrant' | 'pinecone' | 'chroma';
  selectedProvider: 'ollama' | 'openai' | 'anthropic';
  databaseStatus: 'unknown' | 'connected' | 'error' | 'testing';
  providerStatus: 'unknown' | 'connected' | 'error' | 'testing';
  databaseConfig: DatabaseConfig;
  providerConfig: ProviderConfig;
  validationErrors: Record<string, string>;
  isSetupComplete: boolean;
  // New fields for enhanced UX
  availableModels: string[];
  isLoadingModels: boolean;
  modelSuggestions: string[];
}

// Indexing state types
export interface IndexingStats {
  startTime: Date | null;
  endTime: Date | null;
  duration: number;
  chunksCreated: number;
  errors: string[];
}

export interface IndexingState {
  isIndexing: boolean;
  isPaused?: boolean;
  progress: number;
  message: string;
  filesProcessed: number;
  totalFiles: number;
  currentFile: string;
  stats: IndexingStats;
}

// Search state types
export interface SearchResult {
  id: string;
  filePath: string;
  lineNumber: number;
  content: string;
  score: number;
  context?: string;
  relatedFiles?: string[];
}

export interface SearchStats {
  totalResults: number;
  searchTime: number;
  lastSearched: Date | null;
}

export interface SearchState {
  query: string;
  isSearching: boolean;
  results: SearchResult[];
  history: string[];
  stats: SearchStats;
  hasMore: boolean;
  currentPage: number;
}

// Connection test types
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  latency?: number;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  message: string;
  suggestions?: string[];
}

// Message types for VS Code communication
export interface WebviewMessage {
  command: string;
  [key: string]: any;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

// Form field types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'checkbox';
  value: any;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validator?: (value: any) => ValidationResult;
}

// Diagnostics types
export interface SystemStatus {
  database: 'unknown' | 'connected' | 'error';
  provider: 'unknown' | 'connected' | 'error';
  lastIndexed: Date | null;
  totalChunks: number;
  lastError: string | null;
}

// Tour step types
export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showSkip?: boolean;
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}
