/**
 * Type definitions for the React webview application
 */

// View types
export type ViewType = 'setup' | 'indexing' | 'query' | 'diagnostics';

// App state types
export interface AppState {
  isWorkspaceOpen: boolean;
  currentView: ViewType;
  isLoading: boolean;
  error: string | null;
  hasCompletedFirstRun: boolean;
}

// Setup state types
export interface SetupState {
  selectedDatabase: string;
  selectedProvider: string;
  databaseStatus: 'unknown' | 'connected' | 'error' | 'testing';
  providerStatus: 'unknown' | 'connected' | 'error' | 'testing';
  databaseConfig: {
    connectionString: string;
    apiKey?: string;
  };
  providerConfig: {
    model: string;
    apiKey?: string;
    baseUrl?: string;
  };
  validationErrors: Record<string, string>;
  isSetupComplete: boolean;
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
