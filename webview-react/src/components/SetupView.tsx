/**
 * SetupView Component
 * 
 * Main setup view for configuring database and provider connections.
 * Allows users to select and configure their preferred services.
 */

import React, { useCallback } from 'react';
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
import { postMessage } from '../utils/vscodeApi';

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
    try {
      // Import the service dynamically
      const { DatabaseService } = await import('../services/apiService');

      // Test connection based on database type
      switch (setupState.selectedDatabase) {
        case 'qdrant':
          return await DatabaseService.testQdrant(setupState.databaseConfig as any);
        case 'pinecone':
          return await DatabaseService.testPinecone(setupState.databaseConfig as any);
        case 'chroma':
          return await DatabaseService.testChroma(setupState.databaseConfig as any);
        default:
          return {
            success: false,
            message: 'Unsupported database type'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }, [setupState.selectedDatabase, setupState.databaseConfig]);

  const testProviderConnection = useCallback(async (): Promise<ConnectionTestResult> => {
    try {
      // Test connection based on provider type
      switch (setupState.selectedProvider) {
        case 'ollama': {
          const { OllamaService } = await import('../services/apiService');
          const ollamaConfig = setupState.providerConfig as any;
          const ollamaService = new OllamaService(ollamaConfig.baseUrl);

          // Test embedding generation with the configured model
          return await ollamaService.testEmbedding(ollamaConfig.model);
        }
        case 'openai': {
          // For OpenAI, we'll test by making a simple API call
          const openaiConfig = setupState.providerConfig as any;
          const startTime = Date.now();

          try {
            const response = await fetch('https://api.openai.com/v1/models', {
              headers: {
                'Authorization': `Bearer ${openaiConfig.apiKey}`,
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(10000),
            });

            const latency = Date.now() - startTime;

            if (!response.ok) {
              return {
                success: false,
                message: `OpenAI API error: ${response.status} ${response.statusText}`,
                latency
              };
            }

            return {
              success: true,
              message: 'Successfully connected to OpenAI API',
              latency,
              details: { provider: 'openai', model: openaiConfig.model }
            };
          } catch (error) {
            return {
              success: false,
              message: error instanceof Error ? error.message : 'OpenAI connection failed',
              latency: Date.now() - startTime
            };
          }
        }
        case 'anthropic': {
          // For Anthropic, we'll test by making a simple API call
          const anthropicConfig = setupState.providerConfig as any;
          const startTime = Date.now();

          try {
            // Anthropic doesn't have a simple health check endpoint, so we'll just validate the API key format
            if (!anthropicConfig.apiKey.startsWith('sk-ant-')) {
              return {
                success: false,
                message: 'Invalid Anthropic API key format (should start with sk-ant-)',
                latency: Date.now() - startTime
              };
            }

            return {
              success: true,
              message: 'Anthropic API key format is valid',
              latency: Date.now() - startTime,
              details: { provider: 'anthropic', model: anthropicConfig.model }
            };
          } catch (error) {
            return {
              success: false,
              message: error instanceof Error ? error.message : 'Anthropic validation failed',
              latency: Date.now() - startTime
            };
          }
        }
        default:
          return {
            success: false,
            message: 'Unsupported provider type'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Provider test failed'
      };
    }
  }, [setupState.selectedProvider, setupState.providerConfig]);

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
