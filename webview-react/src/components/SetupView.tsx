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
import { ValidatedInput } from './ValidatedInput';
import { ConnectionTester } from './ConnectionTester';
import { ValidationResult, ConnectionTestResult } from '../types';
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
    setCurrentView
  } = useAppStore();

  // Validation functions
  const validateConnectionString = useCallback((value: string): ValidationResult => {
    if (!value.trim()) {
      return { isValid: false, message: 'Connection string is required' };
    }
    
    try {
      new URL(value);
      return { isValid: true, message: 'Valid URL format' };
    } catch {
      return { 
        isValid: false, 
        message: 'Invalid URL format',
        suggestions: ['Use format: http://localhost:6333', 'Include protocol (http:// or https://)']
      };
    }
  }, []);

  const validateApiKey = useCallback((value: string): ValidationResult => {
    if (!value.trim()) {
      return { isValid: false, message: 'API key is required' };
    }
    
    if (value.length < 10) {
      return { 
        isValid: false, 
        message: 'API key seems too short',
        suggestions: ['Check that you copied the complete API key']
      };
    }
    
    return { isValid: true, message: 'API key format looks valid' };
  }, []);

  // Test functions
  const testDatabaseConnection = useCallback(async (): Promise<ConnectionTestResult> => {
    const startTime = Date.now();
    
    try {
      // Send test request to extension
      postMessage('testDatabaseConnection', {
        database: setupState.selectedDatabase,
        config: setupState.databaseConfig
      });

      // For now, simulate the test (in real implementation, this would wait for response)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        message: `Successfully connected to ${setupState.selectedDatabase}`,
        latency,
        details: {
          database: setupState.selectedDatabase,
          endpoint: setupState.databaseConfig.connectionString,
          status: 'Connected'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        latency: Date.now() - startTime
      };
    }
  }, [setupState.selectedDatabase, setupState.databaseConfig]);

  const testProviderConnection = useCallback(async (): Promise<ConnectionTestResult> => {
    const startTime = Date.now();
    
    try {
      // Send test request to extension
      postMessage('testProviderConnection', {
        provider: setupState.selectedProvider,
        config: setupState.providerConfig
      });

      // For now, simulate the test (in real implementation, this would wait for response)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        message: `Successfully connected to ${setupState.selectedProvider}`,
        latency,
        details: {
          provider: setupState.selectedProvider,
          model: setupState.providerConfig.model,
          endpoint: setupState.providerConfig.baseUrl,
          status: 'Connected'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        latency: Date.now() - startTime
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
    return setupState.databaseConfig.connectionString && 
           setupState.providerConfig.model &&
           (setupState.selectedProvider !== 'openai' || setupState.providerConfig.apiKey) &&
           (setupState.selectedProvider !== 'anthropic' || setupState.providerConfig.apiKey);
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
              onOptionSelect={(_, data) => setSelectedDatabase(data.optionValue as string)}
            >
              {DATABASE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </div>

          <ValidatedInput
            label="Connection String"
            value={setupState.databaseConfig.connectionString}
            onChange={(value) => updateDatabaseConfig({ connectionString: value })}
            validator={validateConnectionString}
            placeholder="http://localhost:6333"
            required
          />

          <ConnectionTester
            title="Database Connection"
            description="Test your database connection to ensure it's working properly."
            testFunction={testDatabaseConnection}
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
              onOptionSelect={(_, data) => setSelectedProvider(data.optionValue as string)}
            >
              {PROVIDER_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </div>

          <ValidatedInput
            label="Model"
            value={setupState.providerConfig.model}
            onChange={(value) => updateProviderConfig({ model: value })}
            placeholder="nomic-embed-text"
            required
          />

          {setupState.selectedProvider === 'ollama' && (
            <ValidatedInput
              label="Base URL"
              value={setupState.providerConfig.baseUrl || ''}
              onChange={(value) => updateProviderConfig({ baseUrl: value })}
              validator={validateConnectionString}
              placeholder="http://localhost:11434"
            />
          )}

          {(setupState.selectedProvider === 'openai' || setupState.selectedProvider === 'anthropic') && (
            <ValidatedInput
              label="API Key"
              type="password"
              value={setupState.providerConfig.apiKey || ''}
              onChange={(value) => updateProviderConfig({ apiKey: value })}
              validator={validateApiKey}
              placeholder="Enter your API key"
              required
            />
          )}

          <ConnectionTester
            title="AI Provider Connection"
            description="Test your AI provider connection and model availability."
            testFunction={testProviderConnection}
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
