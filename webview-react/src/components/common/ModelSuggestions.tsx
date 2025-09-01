/**
 * Model Suggestions Component
 * 
 * Displays helpful suggestions for users when no models are detected
 * or when they need to install recommended models for their provider.
 */

import React from 'react';
import {
  Card,
  Text,
  Button,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { Info24Regular, ArrowDownload24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  suggestionCard: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  suggestionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  suggestionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  suggestionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
  },
  commandCode: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  installButton: {
    minWidth: 'auto',
  }
});

interface ModelSuggestionsProps {
  provider: 'ollama' | 'openai' | 'anthropic';
  onInstallModel?: (modelName: string) => void;
  isInstalling?: boolean;
  installingModel?: string;
}

const SUGGESTED_MODELS = {
  ollama: [
    {
      name: 'nomic-embed-text',
      description: 'High-quality embedding model (137M parameters)',
      command: 'ollama pull nomic-embed-text',
      recommended: true
    },
    {
      name: 'all-minilm',
      description: 'Lightweight embedding model (23M parameters)',
      command: 'ollama pull all-minilm',
      recommended: false
    },
    {
      name: 'mxbai-embed-large',
      description: 'Large embedding model (335M parameters)',
      command: 'ollama pull mxbai-embed-large',
      recommended: false
    }
  ],
  openai: [
    {
      name: 'text-embedding-3-small',
      description: 'Cost-effective embedding model',
      recommended: true
    },
    {
      name: 'text-embedding-3-large',
      description: 'High-performance embedding model',
      recommended: false
    }
  ],
  anthropic: [
    {
      name: 'claude-3-haiku-20240307',
      description: 'Fast and efficient model',
      recommended: true
    },
    {
      name: 'claude-3-sonnet-20240229',
      description: 'Balanced performance model',
      recommended: false
    }
  ]
};

export const ModelSuggestions: React.FC<ModelSuggestionsProps> = ({
  provider,
  onInstallModel,
  isInstalling = false,
  installingModel
}) => {
  const styles = useStyles();
  const suggestions = SUGGESTED_MODELS[provider] || [];

  if (suggestions.length === 0) {
    return null;
  }

  const handleInstall = (modelName: string) => {
    if (onInstallModel) {
      onInstallModel(modelName);
    }
  };

  const renderOllamaSuggestions = () => (
    <Card className={styles.suggestionCard}>
      <div className={styles.suggestionHeader}>
        <Info24Regular color={tokens.colorPaletteBlueBackground2} />
        <Text weight="semibold">Recommended Embedding Models</Text>
      </div>
      
      <Text size={200} style={{ marginBottom: tokens.spacingVerticalS }}>
        No embedding models detected. Install one of these recommended models:
      </Text>
      
      <ul className={styles.suggestionList}>
        {suggestions.map((model) => (
          <li key={model.name} className={styles.suggestionItem}>
            <div>
              <Text weight={model.recommended ? 'semibold' : 'regular'}>
                {model.name} {model.recommended && '(Recommended)'}
              </Text>
              <br />
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                {model.description}
              </Text>
              <br />
              {'command' in model && <code className={styles.commandCode}>{model.command}</code>}
            </div>
            
            {onInstallModel && (
              <Button
                appearance="subtle"
                size="small"
                icon={<ArrowDownload24Regular />}
                onClick={() => handleInstall(model.name)}
                disabled={isInstalling}
                className={styles.installButton}
              >
                {isInstalling && installingModel === model.name ? 'Installing...' : 'Install'}
              </Button>
            )}
          </li>
        ))}
      </ul>
      
      <Text size={200} style={{ marginTop: tokens.spacingVerticalS, color: tokens.colorNeutralForeground2 }}>
        💡 Tip: Run the command in your terminal, then click "Detect Models" to refresh the list.
      </Text>
    </Card>
  );

  const renderCloudProviderSuggestions = () => (
    <Card className={styles.suggestionCard}>
      <div className={styles.suggestionHeader}>
        <Info24Regular color={tokens.colorPaletteBlueBackground2} />
        <Text weight="semibold">Recommended Models</Text>
      </div>
      
      <ul className={styles.suggestionList}>
        {suggestions.map((model) => (
          <li key={model.name} className={styles.suggestionItem}>
            <div>
              <Text weight={model.recommended ? 'semibold' : 'regular'}>
                {model.name} {model.recommended && '(Recommended)'}
              </Text>
              <br />
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                {model.description}
              </Text>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );

  return provider === 'ollama' ? renderOllamaSuggestions() : renderCloudProviderSuggestions();
};

export default ModelSuggestions;
