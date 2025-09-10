/**
 * AI Provider Configuration Form Component
 * 
 * Renders provider-specific configuration forms with dynamic model selection,
 * validation, and provider-specific features like Ollama model detection.
 */

import React, { useEffect, useState } from 'react';
import { 
  Dropdown, 
  Option, 
  Button, 
  Spinner, 
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ArrowClockwise24Regular, CheckmarkCircle24Regular } from '@fluentui/react-icons';
import { ValidatedInput } from '../ValidatedInput';
import { ConnectionTester } from '../ConnectionTester';
import { ProviderSetupGuide } from '../common/ProviderSetupGuide';
import { OllamaConfig, OpenAIConfig, ValidationResult } from '../../types';

const useStyles = makeStyles({
  modelSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  modelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  modelStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
  },
  suggestion: {
    padding: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  }
});

interface ProviderConfigFormProps {
  providerType: 'ollama' | 'openai';
  config: OllamaConfig | OpenAIConfig;
  availableModels: string[];
  isLoadingModels: boolean;
  onConfigChange: (config: Partial<OllamaConfig | OpenAIConfig>) => void;
  onLoadModels: () => void;
  onTest: () => Promise<any>;
}

// Validation functions
const validateUrl = (value: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, message: 'Base URL is required' };
  }
  
  try {
    new URL(value);
    return { isValid: true, message: 'Valid URL format' };
  } catch {
    return { 
      isValid: false, 
      message: 'Invalid URL format',
      suggestions: ['Use format: http://localhost:11434', 'Include protocol (http:// or https://)']
    };
  }
};

const validateApiKey = (value: string): ValidationResult => {
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
};

const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  return { isValid: true, message: `${fieldName} is valid` };
};

// Default models for each provider
const DEFAULT_MODELS = {
  ollama: ['nomic-embed-text', 'all-minilm', 'mxbai-embed-large'],
  openai: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']
};

export const ProviderConfigForm: React.FC<ProviderConfigFormProps> = ({
  providerType,
  config,
  availableModels,
  isLoadingModels,
  onConfigChange,
  onLoadModels,
  onTest
}) => {
  const styles = useStyles();
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Set default model suggestions based on provider
    setModelSuggestions(DEFAULT_MODELS[providerType] || []);
  }, [providerType]);

  const renderOllamaConfig = (config: OllamaConfig) => (
    <>
      <ValidatedInput
        label="Base URL"
        value={config.baseUrl}
        onChange={(value) => onConfigChange({ baseUrl: value })}
        validator={validateUrl}
        placeholder="http://localhost:11434"
        required
      />
      
      <div className={styles.modelSection}>
        <div className={styles.modelRow}>
          <Text weight="semibold">Model</Text>
          <Button
            appearance="subtle"
            size="small"
            icon={isLoadingModels ? <Spinner size="tiny" /> : <ArrowClockwise24Regular />}
            onClick={onLoadModels}
            disabled={isLoadingModels}
          >
            {isLoadingModels ? 'Loading...' : 'Detect Models'}
          </Button>
        </div>
        
        {availableModels.length > 0 ? (
          <Dropdown
            placeholder="Select a model"
            value={config.model}
            selectedOptions={[config.model]}
            onOptionSelect={(_, data) => onConfigChange({ model: data.optionValue as string })}
          >
            {availableModels.map(model => (
              <Option key={model} value={model}>
                {model}
              </Option>
            ))}
          </Dropdown>
        ) : (
          <ValidatedInput
            label=""
            value={config.model}
            onChange={(value) => onConfigChange({ model: value })}
            validator={(value) => validateRequired(value, 'Model')}
            placeholder="nomic-embed-text"
            required
          />
        )}
        
        {availableModels.length === 0 && !isLoadingModels && (
          <div className={styles.suggestion}>
            <Text size={200}>
              💡 Suggested models: {modelSuggestions.join(', ')}
            </Text>
            <br />
            <Text size={200}>
              Run: <code>ollama pull {modelSuggestions[0]}</code> to install the recommended model
            </Text>
          </div>
        )}
        
        {availableModels.length > 0 && (
          <div className={styles.modelStatus}>
            <CheckmarkCircle24Regular color={tokens.colorPaletteGreenForeground1} />
            <Text size={200}>Found {availableModels.length} available models</Text>
          </div>
        )}
      </div>
    </>
  );

  const renderOpenAIConfig = (config: OpenAIConfig) => (
    <>
      <ValidatedInput
        label="API Key"
        type="password"
        value={config.apiKey}
        onChange={(value) => onConfigChange({ apiKey: value })}
        validator={validateApiKey}
        placeholder="sk-..."
        required
      />
      
      <Dropdown
        placeholder="Select embedding model"
        value={config.model}
        selectedOptions={[config.model]}
        onOptionSelect={(_, data) => onConfigChange({ model: data.optionValue as string })}
      >
        {DEFAULT_MODELS.openai.map(model => (
          <Option key={model} value={model}>
            {model}
          </Option>
        ))}
      </Dropdown>
      
      <ValidatedInput
        label="Organization (Optional)"
        value={config.organization || ''}
        onChange={(value) => onConfigChange({ organization: value })}
        placeholder="org-..."
      />
    </>
  );



  const getConnectionDescription = () => {
    switch (providerType) {
      case 'ollama':
        return 'Test connection to Ollama and verify model availability.';
      case 'openai':
        return 'Test connection to OpenAI API and verify model access.';
      default:
        return 'Test your AI provider connection.';
    }
  };

  return (
    <>
      <ProviderSetupGuide providerType={providerType} />

      {providerType === 'ollama' && renderOllamaConfig(config as OllamaConfig)}
      {providerType === 'openai' && renderOpenAIConfig(config as OpenAIConfig)}

      <ConnectionTester
        title="AI Provider Connection"
        description={getConnectionDescription()}
        testFunction={onTest}
      />
    </>
  );
};

export default ProviderConfigForm;
