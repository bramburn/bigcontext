import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SetupView } from '../../components/SetupView';
import { useAppStore, useSetupState } from '../../stores/appStore';

// Mock the store
vi.mock('../../stores/appStore');

// Mock vscode API
const mockVscodeApi = {
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
};

// @ts-ignore
global.acquireVsCodeApi = () => mockVscodeApi;

describe('SetupView', () => {
  const mockStore = {
    selectedDatabase: 'qdrant',
    selectedProvider: 'ollama',
    databaseStatus: 'unknown',
    providerStatus: 'unknown',
    databaseConfig: { url: 'http://localhost:6333' },
    providerConfig: { model: 'nomic-embed-text', baseUrl: 'http://localhost:11434' },
    validationErrors: {},
    isSetupComplete: false,
    availableModels: ['nomic-embed-text', 'all-minilm'],
    isLoadingModels: false,
    setSelectedDatabase: vi.fn(),
    setSelectedProvider: vi.fn(),
    setDatabaseStatus: vi.fn(),
    setProviderStatus: vi.fn(),
    updateDatabaseConfig: vi.fn(),
    updateProviderConfig: vi.fn(),
    setValidationError: vi.fn(),
    clearValidationError: vi.fn(),
    setSetupComplete: vi.fn(),
    setAvailableModels: vi.fn(),
    setLoadingModels: vi.fn(),
    setCurrentView: vi.fn(),
  };

  const mockSetupState = {
    selectedDatabase: 'qdrant',
    selectedProvider: 'ollama',
    databaseStatus: 'unknown',
    providerStatus: 'unknown',
    databaseConfig: { url: 'http://localhost:6333' },
    providerConfig: { model: 'nomic-embed-text', baseUrl: 'http://localhost:11434' },
    validationErrors: {},
    isSetupComplete: false,
    availableModels: ['nomic-embed-text', 'all-minilm'],
    isLoadingModels: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue(mockStore);
    (useSetupState as any).mockReturnValue(mockSetupState);
  });

  describe('Database Selection', () => {
    it('should render database selection options', () => {
      render(<SetupView />);
      
      expect(screen.getByText('Database Configuration')).toBeInTheDocument();
      expect(screen.getByText('Qdrant')).toBeInTheDocument();
      expect(screen.getByText('Pinecone')).toBeInTheDocument();
      expect(screen.getByText('Chroma')).toBeInTheDocument();
    });

    it('should show selected database as active', () => {
      render(<SetupView />);
      
      const qdrantOption = screen.getByText('Qdrant').closest('button');
      expect(qdrantOption).toHaveClass('selected');
    });

    it('should call setSelectedDatabase when database is changed', () => {
      render(<SetupView />);
      
      const pineconeOption = screen.getByText('Pinecone').closest('button');
      fireEvent.click(pineconeOption!);
      
      expect(mockStore.setSelectedDatabase).toHaveBeenCalledWith('pinecone');
    });

    it('should show database configuration form for selected database', () => {
      render(<SetupView />);
      
      expect(screen.getByLabelText(/qdrant url/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://localhost:6333')).toBeInTheDocument();
    });

    it('should update database config when URL is changed', async () => {
      render(<SetupView />);
      
      const urlInput = screen.getByLabelText(/qdrant url/i);
      fireEvent.change(urlInput, { target: { value: 'http://localhost:8080' } });
      
      await waitFor(() => {
        expect(mockStore.updateDatabaseConfig).toHaveBeenCalledWith({
          url: 'http://localhost:8080'
        });
      });
    });

    it('should show test connection button', () => {
      render(<SetupView />);
      
      expect(screen.getByText(/test connection/i)).toBeInTheDocument();
    });

    it('should show database status', () => {
      const storeWithStatus = {
        ...mockStore,
        databaseStatus: 'connected'
      };
      (useAppStore as any).mockReturnValue(storeWithStatus);
      
      render(<SetupView />);
      
      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    });
  });

  describe('Provider Selection', () => {
    it('should render provider selection options', () => {
      render(<SetupView />);
      
      expect(screen.getByText('Embedding Provider')).toBeInTheDocument();
      expect(screen.getByText('Ollama')).toBeInTheDocument();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
    });

    it('should show selected provider as active', () => {
      render(<SetupView />);
      
      const ollamaOption = screen.getByText('Ollama').closest('button');
      expect(ollamaOption).toHaveClass('selected');
    });

    it('should call setSelectedProvider when provider is changed', () => {
      render(<SetupView />);
      
      const openaiOption = screen.getByText('OpenAI').closest('button');
      fireEvent.click(openaiOption!);
      
      expect(mockStore.setSelectedProvider).toHaveBeenCalledWith('openai');
    });

    it('should show provider configuration form for selected provider', () => {
      render(<SetupView />);
      
      expect(screen.getByLabelText(/ollama url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    });

    it('should show model selection dropdown', () => {
      render(<SetupView />);
      
      const modelSelect = screen.getByLabelText(/model/i);
      expect(modelSelect).toBeInTheDocument();
      expect(screen.getByText('nomic-embed-text')).toBeInTheDocument();
    });

    it('should show load models button', () => {
      render(<SetupView />);
      
      expect(screen.getByText(/load models/i)).toBeInTheDocument();
    });

    it('should show provider status', () => {
      const storeWithStatus = {
        ...mockStore,
        providerStatus: 'configured'
      };
      (useAppStore as any).mockReturnValue(storeWithStatus);
      
      render(<SetupView />);
      
      expect(screen.getByText(/configured/i)).toBeInTheDocument();
    });
  });

  describe('OpenAI Provider', () => {
    beforeEach(() => {
      const storeWithOpenAI = {
        ...mockStore,
        selectedProvider: 'openai',
        providerConfig: { apiKey: '', model: 'text-embedding-ada-002' }
      };
      (useAppStore as any).mockReturnValue(storeWithOpenAI);
    });

    it('should show OpenAI configuration form', () => {
      render(<SetupView />);
      
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    });

    it('should mask API key input', () => {
      render(<SetupView />);
      
      const apiKeyInput = screen.getByLabelText(/api key/i);
      expect(apiKeyInput).toHaveAttribute('type', 'password');
    });

    it('should update provider config when API key is changed', async () => {
      render(<SetupView />);
      
      const apiKeyInput = screen.getByLabelText(/api key/i);
      fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key' } });
      
      await waitFor(() => {
        expect(mockStore.updateProviderConfig).toHaveBeenCalledWith({
          apiKey: 'sk-test-key'
        });
      });
    });
  });

  describe('Validation', () => {
    it('should show validation errors', () => {
      const storeWithErrors = {
        ...mockStore,
        validationErrors: {
          'database.url': 'Invalid URL format',
          'provider.apiKey': 'API key is required'
        }
      };
      (useAppStore as any).mockReturnValue(storeWithErrors);
      
      render(<SetupView />);
      
      expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      expect(screen.getByText('API key is required')).toBeInTheDocument();
    });

    it('should clear validation errors when input is corrected', async () => {
      const storeWithErrors = {
        ...mockStore,
        validationErrors: {
          'database.url': 'Invalid URL format'
        }
      };
      (useAppStore as any).mockReturnValue(storeWithErrors);
      
      render(<SetupView />);
      
      const urlInput = screen.getByLabelText(/qdrant url/i);
      fireEvent.change(urlInput, { target: { value: 'http://localhost:6333' } });
      
      await waitFor(() => {
        expect(mockStore.clearValidationError).toHaveBeenCalledWith('database.url');
      });
    });
  });

  describe('Setup Completion', () => {
    it('should show continue button when setup is complete', () => {
      const storeWithCompleteSetup = {
        ...mockStore,
        isSetupComplete: true,
        databaseStatus: 'connected',
        providerStatus: 'configured'
      };
      (useAppStore as any).mockReturnValue(storeWithCompleteSetup);
      
      render(<SetupView />);
      
      expect(screen.getByText(/continue to indexing/i)).toBeInTheDocument();
    });

    it('should navigate to indexing view when continue is clicked', () => {
      const storeWithCompleteSetup = {
        ...mockStore,
        isSetupComplete: true,
        databaseStatus: 'connected',
        providerStatus: 'configured'
      };
      (useAppStore as any).mockReturnValue(storeWithCompleteSetup);
      
      render(<SetupView />);
      
      const continueButton = screen.getByText(/continue to indexing/i);
      fireEvent.click(continueButton);
      
      expect(mockStore.setCurrentView).toHaveBeenCalledWith('indexing');
    });

    it('should disable continue button when setup is incomplete', () => {
      const storeWithIncompleteSetup = {
        ...mockStore,
        isSetupComplete: false,
        databaseStatus: 'error',
        providerStatus: 'unknown'
      };
      (useAppStore as any).mockReturnValue(storeWithIncompleteSetup);
      
      render(<SetupView />);
      
      const continueButton = screen.queryByText(/continue to indexing/i);
      expect(continueButton).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when testing connection', () => {
      const storeWithLoading = {
        ...mockStore,
        databaseStatus: 'testing'
      };
      (useAppStore as any).mockReturnValue(storeWithLoading);
      
      render(<SetupView />);
      
      expect(screen.getByText(/testing/i)).toBeInTheDocument();
    });

    it('should show loading state when loading models', () => {
      const storeWithLoadingModels = {
        ...mockStore,
        isLoadingModels: true
      };
      (useAppStore as any).mockReturnValue(storeWithLoadingModels);
      
      render(<SetupView />);
      
      expect(screen.getByText(/loading models/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SetupView />);
      
      expect(screen.getByLabelText(/qdrant url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<SetupView />);
      
      expect(screen.getByRole('heading', { name: /database configuration/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /embedding provider/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<SetupView />);
      
      const firstButton = screen.getByText('Qdrant').closest('button');
      const secondButton = screen.getByText('Pinecone').closest('button');
      
      expect(firstButton).toHaveAttribute('tabIndex', '0');
      expect(secondButton).toHaveAttribute('tabIndex', '0');
    });
  });
});
