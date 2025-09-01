/**
 * SetupView Component
 * 
 * Main setup view for configuring database and provider connections.
 * Allows users to select and configure their preferred services.
 */

import React, { useCallback, useEffect } from 'react';
import {
  Card,
  Button,
  Text,
  Body1,
  Dropdown,
  Option,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { Settings24Regular, Play24Regular } from '@fluentui/react-icons';
import { useAppStore, useSetupState } from '../stores/appStore';
import { DatabaseConfigForm } from './database/DatabaseConfigForm';
import { ProviderConfigForm } from './provider/ProviderConfigForm';
import { ConnectionTestResult } from '../types';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXL,
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    marginBottom: tokens.spacingVerticalXL,
    textAlign: 'center'
  },
  title: {
    marginBottom: tokens.spacingVerticalS
  },
  description: {
    color: tokens.colorNeutralForeground2
  },
  section: {
    marginBottom: tokens.spacingVerticalXL
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalM,
    fontWeight: tokens.fontWeightSemibold
  },
  card: {
    padding: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalM
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalXL
  }
});

const DATABASE_OPTIONS = [
  { value: 'qdrant', label: 'Qdrant' },
  { value: 'chroma', label: 'ChromaDB' },
  { value: 'pinecone', label: 'Pinecone' }
];

const PROVIDER_OPTIONS = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' }
];

export const SetupView: React.FC = () => {
  const styles = useStyles();
  const setupState = useSetupState();
  const {
    setSelectedDatabase,
    setSelectedProvider,
    updateDatabaseConfig,
    updateProviderConfig,
    setCurrentView,
    setAvailableModels,
    setLoadingModels
  } = useAppStore();

  // Model detection for Ollama
  const handleLoadModels = useCallback(async () => {
    if (setupState.selectedProvider !== 'ollama') return;

    setLoadingModels(true);
    try {
      // Import the service dynamically to avoid issues with SSR
      const { OllamaService } = await import('../services/apiService');
      const ollamaService = new OllamaService((setupState.providerConfig as any).baseUrl);

      // First check if Ollama is running
      const isRunning = await ollamaService.isRunning();
      if (!isRunning) {
        console.error('Ollama is not running or not accessible');
        setAvailableModels([]);
        return;
      }

      // Get embedding models specifically
      const models = await ollamaService.getEmbeddingModels();
      const modelNames = models.map(model => model.name);
      setAvailableModels(modelNames);

      // If no embedding models found, get all models
      if (modelNames.length === 0) {
        const allModels = await ollamaService.getModels();
        const allModelNames = allModels.map(model => model.name);
        setAvailableModels(allModelNames);
      }
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [setupState.selectedProvider, setupState.providerConfig, setAvailableModels, setLoadingModels]);

  // Test functions
  const testDatabaseConnection = useCallback(async (): Promise<ConnectionTestResult> => {
    return new Promise((resolve) => {
      // Send test request to extension
      postMessage('testDatabaseConnection', {
        database: setupState.selectedDatabase,
        config: setupState.databaseConfig
      });

      // Listen for response
      const handleResponse = (event: MessageEvent) => {
        const message = event.data;
        if (message.command === 'databaseConnectionTestResult') {
          window.removeEventListener('message', handleResponse);
          resolve({
            success: message.success,
            message: message.data.message,
            details: message.data.details,
            latency: message.data.latency
          });
        }
      };

      window.addEventListener('message', handleResponse);

      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        resolve({
          success: false,
          message: 'Connection test timed out'
        });
      }, 30000);
    });
  }, [setupState.selectedDatabase, setupState.databaseConfig]);

  const testProviderConnection = useCallback(async (): Promise<ConnectionTestResult> => {
    return new Promise((resolve) => {
      // Send test request to extension
      postMessage('testProviderConnection', {
        provider: setupState.selectedProvider,
        config: setupState.providerConfig
      });

      // Listen for response
      const handleResponse = (event: MessageEvent) => {
        const message = event.data;
        if (message.command === 'providerConnectionTestResult') {
          window.removeEventListener('message', handleResponse);
          resolve({
            success: message.success,
            message: message.data.message,
            details: message.data.details,
            latency: message.data.latency
          });
        }
      };

      window.addEventListener('message', handleResponse);

      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        resolve({
          success: false,
          message: 'Connection test timed out'
        });
      }, 30000);
    });
  }, [setupState.selectedProvider, setupState.providerConfig]);

  // Set up message listeners for setup completion
  useEffect(() => {
    const unsubscribeSetupComplete = onMessageCommand('setupComplete', (data) => {
      console.log('Setup completed successfully:', data);
      // The view change is already handled by the button click,
      // but we could add additional logic here if needed
    });

    const unsubscribeSetupError = onMessageCommand('setupError', (data) => {
      console.error('Setup error:', data.error);
      // Show error to user and stay on setup view
      alert(`Setup failed: ${data.error}`);
    });

    return () => {
      unsubscribeSetupComplete();
      unsubscribeSetupError();
    };
  }, []);

  const handleStartIndexing = () => {
    postMessage('startSetup', {
      database: setupState.selectedDatabase,
      provider: setupState.selectedProvider,
      databaseConfig: setupState.databaseConfig,
      providerConfig: setupState.providerConfig
    });
    setCurrentView('indexing');
  };

  const isSetupValid = () => {
    // Database validation
    const dbValid = (() => {
      switch (setupState.selectedDatabase) {
        case 'qdrant':
          return !!(setupState.databaseConfig as any).url;
        case 'pinecone':
          const pineconeConfig = setupState.databaseConfig as any;
          return !!(pineconeConfig.apiKey && pineconeConfig.environment && pineconeConfig.indexName);
        case 'chroma':
          return !!(setupState.databaseConfig as any).host;
        default:
          return false;
      }
    })();

    // Provider validation
    const providerValid = (() => {
      switch (setupState.selectedProvider) {
        case 'ollama':
          const ollamaConfig = setupState.providerConfig as any;
          return !!(ollamaConfig.baseUrl && ollamaConfig.model);
        case 'openai':
        case 'anthropic':
          const apiConfig = setupState.providerConfig as any;
          return !!(apiConfig.apiKey && apiConfig.model);
        default:
          return false;
      }
    })();

    return dbValid && providerValid;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={800} weight="bold" className={styles.title}>
          <Settings24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
          Setup Code Context Engine
        </Text>
        <Body1 className={styles.description}>
          Configure your database and AI provider to get started with intelligent code search.
        </Body1>
      </div>

      {/* Database Configuration */}
      <div className={styles.section}>
        <Text size={600} className={styles.sectionTitle}>
          Database Configuration
        </Text>
        <Card className={styles.card}>
          <div className={styles.formRow}>
            <Dropdown
              placeholder="Select database"
              value={setupState.selectedDatabase}
              selectedOptions={[setupState.selectedDatabase]}
              onOptionSelect={(_, data) => setSelectedDatabase(data.optionValue as 'qdrant' | 'pinecone' | 'chroma')}
            >
              {DATABASE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </div>

          <DatabaseConfigForm
            databaseType={setupState.selectedDatabase}
            config={setupState.databaseConfig}
            onConfigChange={updateDatabaseConfig}
            onTest={testDatabaseConnection}
          />
        </Card>
      </div>

      {/* Provider Configuration */}
      <div className={styles.section}>
        <Text size={600} className={styles.sectionTitle}>
          AI Provider Configuration
        </Text>
        <Card className={styles.card}>
          <div className={styles.formRow}>
            <Dropdown
              placeholder="Select AI provider"
              value={setupState.selectedProvider}
              selectedOptions={[setupState.selectedProvider]}
              onOptionSelect={(_, data) => setSelectedProvider(data.optionValue as 'ollama' | 'openai' | 'anthropic')}
            >
              {PROVIDER_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </div>

          <ProviderConfigForm
            providerType={setupState.selectedProvider}
            config={setupState.providerConfig}
            availableModels={setupState.availableModels}
            isLoadingModels={setupState.isLoadingModels}
            onConfigChange={updateProviderConfig}
            onLoadModels={handleLoadModels}
            onTest={testProviderConnection}
          />
        </Card>
      </div>

      <div className={styles.actions}>
        <Button
          appearance="primary"
          size="large"
          icon={<Play24Regular />}
          disabled={!isSetupValid()}
          onClick={handleStartIndexing}
        >
          Start Indexing
        </Button>
      </div>
    </div>
  );
};

export default SetupView;
