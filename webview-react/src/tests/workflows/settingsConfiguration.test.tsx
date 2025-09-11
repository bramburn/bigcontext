import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SettingsView from '../../views/SettingsView';

// Mock the VS Code API
const mockPostMessage = vi.fn();
const mockOnMessageCommand = vi.fn();

vi.mock('../../utils/vscodeApi', () => ({
  postMessage: mockPostMessage,
  onMessageCommand: mockOnMessageCommand,
}));

describe('Settings Configuration Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockOnMessageCommand.mockImplementation((command, callback) => {
      if (command === 'getSettingsResponse') {
        setTimeout(() => callback({
          settings: {
            embeddingModel: {
              provider: 'OpenAI',
              apiKey: '',
              modelName: 'text-embedding-ada-002',
            },
            qdrantDatabase: {
              host: 'localhost',
              port: 6333,
              collectionName: 'code-embeddings',
            },
          }
        }), 0);
      }
      return vi.fn(); // Return cleanup function
    });
  });

  it('completes full settings configuration workflow', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    });

    // Step 1: Configure embedding provider
    const providerSelect = screen.getByRole('combobox', { name: /provider/i });
    await user.click(providerSelect);
    
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('OpenAI'));

    // Step 2: Enter API key
    const apiKeyInput = screen.getByLabelText('API Key');
    await user.type(apiKeyInput, 'sk-test-api-key-12345');

    // Step 3: Select model
    const modelSelect = screen.getByRole('combobox', { name: /model/i });
    await user.click(modelSelect);
    
    await waitFor(() => {
      expect(screen.getByText('text-embedding-3-small')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('text-embedding-3-small'));

    // Step 4: Configure database settings
    const hostInput = screen.getByLabelText('Host');
    await user.clear(hostInput);
    await user.type(hostInput, 'qdrant.example.com');

    const portInput = screen.getByLabelText('Port');
    await user.clear(portInput);
    await user.type(portInput, '6333');

    const collectionInput = screen.getByLabelText('Collection Name');
    await user.clear(collectionInput);
    await user.type(collectionInput, 'my-code-collection');

    // Step 5: Save settings
    const saveButton = screen.getByText('Save Settings');
    await user.click(saveButton);

    // Verify the save message was sent with correct data
    expect(mockPostMessage).toHaveBeenCalledWith('postSettings', {
      settings: {
        embeddingModel: {
          provider: 'OpenAI',
          apiKey: 'sk-test-api-key-12345',
          modelName: 'text-embedding-3-small',
        },
        qdrantDatabase: {
          host: 'qdrant.example.com',
          port: 6333,
          collectionName: 'my-code-collection',
        },
      },
      requestId: expect.stringMatching(/postSettings_\d+/),
    });
  });

  it('handles provider switching workflow', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    });

    // Switch to Mimic Embed
    const providerSelect = screen.getByRole('combobox', { name: /provider/i });
    await user.click(providerSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Mimic Embed')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Mimic Embed'));

    // Verify UI changes for Mimic Embed
    await waitFor(() => {
      expect(screen.getByLabelText('Model Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Endpoint URL')).toBeInTheDocument();
    });

    // Configure Mimic Embed settings
    const modelNameInput = screen.getByLabelText('Model Name');
    await user.type(modelNameInput, 'custom-embedding-model');

    const endpointInput = screen.getByLabelText('Endpoint URL');
    await user.type(endpointInput, 'https://api.example.com/embed');

    // Save and verify
    const saveButton = screen.getByText('Save Settings');
    await user.click(saveButton);

    expect(mockPostMessage).toHaveBeenCalledWith('postSettings', {
      settings: expect.objectContaining({
        embeddingModel: expect.objectContaining({
          provider: 'Mimic Embed',
          modelName: 'custom-embedding-model',
          endpoint: 'https://api.example.com/embed',
        }),
      }),
      requestId: expect.stringMatching(/postSettings_\d+/),
    });
  });

  it('handles test connection workflow', async () => {
    const user = userEvent.setup();
    
    // Mock successful test response
    mockOnMessageCommand.mockImplementation((command, callback) => {
      if (command === 'getSettingsResponse') {
        setTimeout(() => callback({
          settings: {
            embeddingModel: { provider: 'OpenAI', apiKey: 'test-key', modelName: 'text-embedding-ada-002' },
            qdrantDatabase: { host: 'localhost', port: 6333, collectionName: 'test-collection' },
          }
        }), 0);
      } else if (command === 'testSettingsResponse') {
        setTimeout(() => callback({ success: true, message: 'Connection successful!' }), 100);
      }
      return vi.fn();
    });

    render(<SettingsView />);

    await waitFor(() => {
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
    });

    const testButton = screen.getByText('Test Connection');
    await user.click(testButton);

    // Verify loading state
    expect(screen.getByText('Testing...')).toBeInTheDocument();

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Connection successful!')).toBeInTheDocument();
    });

    expect(mockPostMessage).toHaveBeenCalledWith('testSettings', {
      settings: expect.any(Object),
      requestId: expect.stringMatching(/testSettings_\d+/),
    });
  });

  it('handles reset to defaults workflow', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    await waitFor(() => {
      expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
    });

    // Modify some settings first
    const apiKeyInput = screen.getByLabelText('API Key');
    await user.type(apiKeyInput, 'modified-key');

    // Reset to defaults
    const resetButton = screen.getByText('Reset to Defaults');
    await user.click(resetButton);

    // Verify reset message appears
    await waitFor(() => {
      expect(screen.getByText(/Settings reset to defaults/)).toBeInTheDocument();
    });

    // Verify API key is cleared
    expect(apiKeyInput).toHaveValue('');
  });

  it('shows proper error handling for failed operations', async () => {
    const user = userEvent.setup();
    
    // Mock error response
    mockOnMessageCommand.mockImplementation((command, callback) => {
      if (command === 'getSettingsResponse') {
        setTimeout(() => callback({
          settings: {
            embeddingModel: { provider: 'OpenAI', apiKey: '', modelName: 'text-embedding-ada-002' },
            qdrantDatabase: { host: 'localhost', port: 6333, collectionName: 'test-collection' },
          }
        }), 0);
      } else if (command === 'postSettingsResponse') {
        setTimeout(() => callback({ success: false, message: 'Failed to save settings: Invalid API key' }), 100);
      }
      return vi.fn();
    });

    render(<SettingsView />);

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Settings');
    await user.click(saveButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to save settings: Invalid API key')).toBeInTheDocument();
    });
  });
});
