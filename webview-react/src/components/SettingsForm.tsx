/**
 * Settings Form Component
 * 
 * This component provides a user interface for configuring the RAG for LLM
 * VS Code extension settings. It handles embedding model configuration and
 * Qdrant database settings with validation and testing capabilities.
 * 
 * The component follows Fluent UI design patterns and integrates with the
 * VS Code webview communication system for saving and retrieving settings.
 */

import React, { useState, useEffect } from 'react';
import {
  Stack,
  TextField,
  Dropdown,
  IDropdownOption,
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Label,
  Separator,
  Text,
  Link,
} from '@fluentui/react';
import { postMessageToVsCode } from '../utils/vscode';

/**
 * Extension settings interface
 */
interface ExtensionSettings {
  embeddingModel: {
    provider: 'OpenAI' | 'Mimic Embed';
    apiKey: string;
    modelName: string;
    endpoint?: string;
  };
  qdrantDatabase: {
    host: string;
    port: number;
    collectionName: string;
    apiKey?: string;
  };
}

/**
 * Component state interface
 */
interface SettingsFormState {
  settings: ExtensionSettings;
  isLoading: boolean;
  isSaving: boolean;
  isTesting: boolean;
  message: {
    type: MessageBarType;
    text: string;
  } | null;
  validationErrors: string[];
}

/**
 * SettingsForm Component Props
 */
interface SettingsFormProps {
  /** Initial settings (optional) */
  initialSettings?: ExtensionSettings;
  
  /** Callback when settings are saved */
  onSettingsSaved?: (settings: ExtensionSettings) => void;
  
  /** Whether the form is in read-only mode */
  readOnly?: boolean;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: ExtensionSettings = {
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
};

/**
 * Embedding provider options
 */
const EMBEDDING_PROVIDERS: IDropdownOption[] = [
  { key: 'OpenAI', text: 'OpenAI' },
  { key: 'Mimic Embed', text: 'Mimic Embed' },
];

/**
 * OpenAI model options
 */
const OPENAI_MODELS: IDropdownOption[] = [
  { key: 'text-embedding-ada-002', text: 'text-embedding-ada-002' },
  { key: 'text-embedding-3-small', text: 'text-embedding-3-small' },
  { key: 'text-embedding-3-large', text: 'text-embedding-3-large' },
];

/**
 * SettingsForm Component
 */
export const SettingsForm: React.FC<SettingsFormProps> = ({
  initialSettings,
  onSettingsSaved,
  readOnly = false,
}) => {
  const [state, setState] = useState<SettingsFormState>({
    settings: initialSettings || DEFAULT_SETTINGS,
    isLoading: false,
    isSaving: false,
    isTesting: false,
    message: null,
    validationErrors: [],
  });

  /**
   * Load settings from extension
   */
  useEffect(() => {
    if (!initialSettings) {
      loadSettings();
    }
  }, [initialSettings]);

  /**
   * Load current settings from the extension
   */
  const loadSettings = async () => {
    setState(prev => ({ ...prev, isLoading: true, message: null }));

    try {
      // Send message to extension to get current settings
      postMessageToVsCode({
        command: 'getSettings',
        requestId: `getSettings_${Date.now()}`,
      });

      // Note: Response will be handled by message listener in parent component
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        message: {
          type: MessageBarType.error,
          text: `Failed to load settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }));
    }
  };

  /**
   * Save settings to extension
   */
  const saveSettings = async () => {
    // Validate settings first
    const validation = validateSettings(state.settings);
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        validationErrors: validation.errors,
        message: {
          type: MessageBarType.error,
          text: 'Please fix the validation errors before saving.',
        },
      }));
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, message: null, validationErrors: [] }));

    try {
      // Send message to extension to save settings
      postMessageToVsCode({
        command: 'postSettings',
        settings: state.settings,
        requestId: `postSettings_${Date.now()}`,
      });

      // Note: Response will be handled by message listener
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        message: {
          type: MessageBarType.error,
          text: `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }));
    }
  };

  /**
   * Test connection with current settings
   */
  const testConnection = async () => {
    setState(prev => ({ ...prev, isTesting: true, message: null }));

    try {
      // Send message to extension to test settings
      postMessageToVsCode({
        command: 'testSettings',
        settings: state.settings,
        requestId: `testSettings_${Date.now()}`,
      });

      // Note: Response will be handled by message listener
    } catch (error) {
      setState(prev => ({
        ...prev,
        isTesting: false,
        message: {
          type: MessageBarType.error,
          text: `Failed to test connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }));
    }
  };

  /**
   * Reset settings to defaults
   */
  const resetSettings = () => {
    setState(prev => ({
      ...prev,
      settings: { ...DEFAULT_SETTINGS },
      validationErrors: [],
      message: {
        type: MessageBarType.info,
        text: 'Settings reset to defaults. Remember to save your changes.',
      },
    }));
  };

  /**
   * Update embedding model settings
   */
  const updateEmbeddingModel = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        embeddingModel: {
          ...prev.settings.embeddingModel,
          [field]: value,
        },
      },
      validationErrors: [],
    }));
  };

  /**
   * Update Qdrant database settings
   */
  const updateQdrantDatabase = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        qdrantDatabase: {
          ...prev.settings.qdrantDatabase,
          [field]: value,
        },
      },
      validationErrors: [],
    }));
  };

  /**
   * Validate settings
   */
  const validateSettings = (settings: ExtensionSettings): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate embedding model
    if (!settings.embeddingModel.provider) {
      errors.push('Embedding provider is required');
    }
    if (!settings.embeddingModel.apiKey.trim()) {
      errors.push('API key is required');
    }
    if (!settings.embeddingModel.modelName.trim()) {
      errors.push('Model name is required');
    }
    if (settings.embeddingModel.provider === 'Mimic Embed' && !settings.embeddingModel.endpoint?.trim()) {
      errors.push('Endpoint is required for Mimic Embed provider');
    }

    // Validate Qdrant database
    if (!settings.qdrantDatabase.host.trim()) {
      errors.push('Qdrant host is required');
    }
    if (!settings.qdrantDatabase.collectionName.trim()) {
      errors.push('Collection name is required');
    }
    if (settings.qdrantDatabase.port < 1 || settings.qdrantDatabase.port > 65535) {
      errors.push('Port must be between 1 and 65535');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20, maxWidth: 600 } }}>
      {/* Header */}
      <Stack>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          Extension Settings
        </Text>
        <Text variant="medium" styles={{ root: { color: '#666' } }}>
          Configure your embedding model and vector database settings
        </Text>
      </Stack>

      {/* Message Bar */}
      {state.message && (
        <MessageBar
          messageBarType={state.message.type}
          onDismiss={() => setState(prev => ({ ...prev, message: null }))}
        >
          {state.message.text}
        </MessageBar>
      )}

      {/* Validation Errors */}
      {state.validationErrors.length > 0 && (
        <MessageBar messageBarType={MessageBarType.error}>
          <div>
            <strong>Please fix the following errors:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              {state.validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </MessageBar>
      )}

      {/* Loading Spinner */}
      {state.isLoading && (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 10 }}>
          <Spinner size={SpinnerSize.medium} label="Loading settings..." />
        </Stack>
      )}

      {/* Embedding Model Settings */}
      <Stack tokens={{ childrenGap: 15 }}>
        <Label styles={{ root: { fontSize: 16, fontWeight: 600 } }}>
          Embedding Model Configuration
        </Label>
        
        <Dropdown
          label="Provider"
          options={EMBEDDING_PROVIDERS}
          selectedKey={state.settings.embeddingModel.provider}
          onChange={(_, option) => updateEmbeddingModel('provider', option?.key)}
          disabled={readOnly}
          required
        />

        <TextField
          label="API Key"
          type="password"
          value={state.settings.embeddingModel.apiKey}
          onChange={(_, value) => updateEmbeddingModel('apiKey', value || '')}
          disabled={readOnly}
          required
          canRevealPassword
        />

        {state.settings.embeddingModel.provider === 'OpenAI' ? (
          <Dropdown
            label="Model"
            options={OPENAI_MODELS}
            selectedKey={state.settings.embeddingModel.modelName}
            onChange={(_, option) => updateEmbeddingModel('modelName', option?.key)}
            disabled={readOnly}
            required
          />
        ) : (
          <TextField
            label="Model Name"
            value={state.settings.embeddingModel.modelName}
            onChange={(_, value) => updateEmbeddingModel('modelName', value || '')}
            disabled={readOnly}
            required
          />
        )}

        {state.settings.embeddingModel.provider === 'Mimic Embed' && (
          <TextField
            label="Endpoint URL"
            value={state.settings.embeddingModel.endpoint || ''}
            onChange={(_, value) => updateEmbeddingModel('endpoint', value || '')}
            disabled={readOnly}
            required
            placeholder="https://your-mimic-embed-endpoint.com"
          />
        )}
      </Stack>

      <Separator />

      {/* Qdrant Database Settings */}
      <Stack tokens={{ childrenGap: 15 }}>
        <Label styles={{ root: { fontSize: 16, fontWeight: 600 } }}>
          Qdrant Database Configuration
        </Label>

        <TextField
          label="Host"
          value={state.settings.qdrantDatabase.host}
          onChange={(_, value) => updateQdrantDatabase('host', value || '')}
          disabled={readOnly}
          required
          placeholder="localhost"
        />

        <TextField
          label="Port"
          type="number"
          value={state.settings.qdrantDatabase.port.toString()}
          onChange={(_, value) => updateQdrantDatabase('port', parseInt(value || '6333', 10))}
          disabled={readOnly}
          required
        />

        <TextField
          label="Collection Name"
          value={state.settings.qdrantDatabase.collectionName}
          onChange={(_, value) => updateQdrantDatabase('collectionName', value || '')}
          disabled={readOnly}
          required
          placeholder="code-embeddings"
        />

        <TextField
          label="API Key (Optional)"
          type="password"
          value={state.settings.qdrantDatabase.apiKey || ''}
          onChange={(_, value) => updateQdrantDatabase('apiKey', value || '')}
          disabled={readOnly}
          canRevealPassword
        />
      </Stack>

      {/* Action Buttons */}
      {!readOnly && (
        <Stack horizontal tokens={{ childrenGap: 10 }} horizontalAlign="start">
          <PrimaryButton
            text="Save Settings"
            onClick={saveSettings}
            disabled={state.isSaving || state.isLoading}
            iconProps={{ iconName: 'Save' }}
          />
          
          <DefaultButton
            text="Test Connection"
            onClick={testConnection}
            disabled={state.isTesting || state.isLoading}
            iconProps={{ iconName: 'PlugConnected' }}
          />
          
          <DefaultButton
            text="Reset to Defaults"
            onClick={resetSettings}
            disabled={state.isLoading}
            iconProps={{ iconName: 'Refresh' }}
          />
        </Stack>
      )}

      {/* Loading States */}
      {(state.isSaving || state.isTesting) && (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 10 }}>
          <Spinner 
            size={SpinnerSize.small} 
            label={state.isSaving ? 'Saving settings...' : 'Testing connection...'} 
          />
        </Stack>
      )}

      {/* Help Text */}
      <Stack tokens={{ childrenGap: 10 }}>
        <Text variant="small" styles={{ root: { color: '#666' } }}>
          <strong>Need help?</strong> Check the{' '}
          <Link href="#" onClick={() => postMessageToVsCode({ command: 'openDocumentation' })}>
            documentation
          </Link>{' '}
          for setup instructions and troubleshooting tips.
        </Text>
      </Stack>
    </Stack>
  );
};
