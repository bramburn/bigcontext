/**
 * SettingsView Component
 * 
 * Advanced settings view for configuring search behavior, query expansion,
 * result limits, and AI model selection. This component provides power users
 * with fine-grained control over the search engine's behavior.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Button,
  Text,
  Body1,
  Caption1,
  Switch,
  Input,
  Dropdown,
  Option,
  Divider,
  Badge,
  makeStyles,
  tokens,

} from '@fluentui/react-components';
import {
  Settings24Regular,
  Search24Regular,
  Brain24Regular,
  NumberSymbol24Regular,
  Save24Regular,
  Dismiss24Regular
} from '@fluentui/react-icons';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';

/**
 * Interface for advanced search configuration
 */
interface AdvancedSearchConfig {
  queryExpansion: {
    enabled: boolean;
    maxExpandedTerms: number;
    useSemanticSimilarity: boolean;
  };
  resultLimit: number;
  aiModel: {
    embedding: string;
    llm: string;
  };
  searchBehavior: {
    minSimilarity: number;
    includeComments: boolean;
    includeTests: boolean;
  };
}

/**
 * Available AI models for selection
 */
interface AIModel {
  id: string;
  name: string;
  description: string;
  type: 'embedding' | 'llm';
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL
  },
  headerIcon: {
    color: tokens.colorBrandBackground
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  headerDescription: {
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXS
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS
  },
  card: {
    padding: tokens.spacingVerticalL
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM
  },
  formRowHorizontal: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM
  },
  label: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightMedium
  },
  description: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalL
  },
  badge: {
    marginLeft: tokens.spacingHorizontalXS
  }
});

export const SettingsView: React.FC = () => {
  const styles = useStyles();
  
  // State for configuration
  const [config, setConfig] = useState<AdvancedSearchConfig>({
    queryExpansion: {
      enabled: false,
      maxExpandedTerms: 3,
      useSemanticSimilarity: true
    },
    resultLimit: 20,
    aiModel: {
      embedding: 'text-embedding-ada-002',
      llm: 'gpt-3.5-turbo'
    },
    searchBehavior: {
      minSimilarity: 0.5,
      includeComments: true,
      includeTests: false
    }
  });

  // State for available models
  const [availableModels] = useState<AIModel[]>([
    { id: 'text-embedding-ada-002', name: 'OpenAI Ada-002', description: 'High-quality embeddings', type: 'embedding' },
    { id: 'nomic-embed-text', name: 'Nomic Embed', description: 'Open source embeddings', type: 'embedding' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient', type: 'llm' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model', type: 'llm' }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    postMessage('getConfiguration');
    
    const unsubscribe = onMessageCommand('configurationResponse', (data) => {
      if (data.success && data.config) {
        setConfig(prevConfig => ({
          ...prevConfig,
          ...data.config.advancedSearch
        }));
      }
    });

    return unsubscribe;
  }, []);

  // Handle configuration changes
  const handleConfigChange = useCallback((updates: Partial<AdvancedSearchConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Handle query expansion toggle
  const handleQueryExpansionToggle = useCallback((enabled: boolean) => {
    handleConfigChange({
      queryExpansion: { ...config.queryExpansion, enabled }
    });
  }, [config.queryExpansion, handleConfigChange]);

  // Handle result limit change
  const handleResultLimitChange = useCallback((value: string) => {
    const limit = parseInt(value, 10);
    if (!isNaN(limit) && limit > 0 && limit <= 100) {
      handleConfigChange({ resultLimit: limit });
    }
  }, [handleConfigChange]);

  // Handle AI model selection
  const handleModelChange = useCallback((modelType: 'embedding' | 'llm', modelId: string) => {
    handleConfigChange({
      aiModel: {
        ...config.aiModel,
        [modelType]: modelId
      }
    });
  }, [config.aiModel, handleConfigChange]);

  // Save configuration
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      postMessage('setConfiguration', {
        advancedSearch: config
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Reset configuration
  const handleReset = useCallback(() => {
    postMessage('getConfiguration');
    setHasChanges(false);
  }, []);

  const embeddingModels = availableModels.filter(m => m.type === 'embedding');
  const llmModels = availableModels.filter(m => m.type === 'llm');

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Settings24Regular />
        </div>
        <div>
          <Text size={800} weight="bold" className={styles.title}>
            Advanced Search Settings
          </Text>
          <Body1 className={styles.headerDescription}>
            Configure advanced search behavior, query expansion, and AI model selection
          </Body1>
        </div>
      </div>

      {/* Query Expansion Settings */}
      <div className={styles.section}>
        <Text size={600} className={styles.sectionTitle}>
          <Search24Regular />
          Query Expansion
          {config.queryExpansion.enabled && (
            <Badge appearance="filled" color="brand" className={styles.badge}>
              Enabled
            </Badge>
          )}
        </Text>
        
        <Card className={styles.card}>
          <div className={styles.formRowHorizontal}>
            <Switch
              checked={config.queryExpansion.enabled}
              onChange={(_, data) => handleQueryExpansionToggle(data.checked)}
            />
            <div>
              <Text className={styles.label}>Enable Query Expansion</Text>
              <Caption1 className={styles.description}>
                Automatically expand search queries with synonyms and related terms
              </Caption1>
            </div>
          </div>

          {config.queryExpansion.enabled && (
            <>
              <Divider />
              <div className={styles.formRow}>
                <Text className={styles.label}>Maximum Expanded Terms</Text>
                <Input
                  type="number"
                  value={config.queryExpansion.maxExpandedTerms.toString()}
                  onChange={(_, data) => {
                    const value = parseInt(data.value, 10);
                    if (!isNaN(value) && value >= 1 && value <= 10) {
                      handleConfigChange({
                        queryExpansion: { ...config.queryExpansion, maxExpandedTerms: value }
                      });
                    }
                  }}
                  min={1}
                  max={10}
                />
                <Caption1 className={styles.description}>
                  Number of additional terms to generate (1-10)
                </Caption1>
              </div>

              <div className={styles.formRowHorizontal}>
                <Switch
                  checked={config.queryExpansion.useSemanticSimilarity}
                  onChange={(_, data) => handleConfigChange({
                    queryExpansion: { ...config.queryExpansion, useSemanticSimilarity: data.checked }
                  })}
                />
                <div>
                  <Text className={styles.label}>Use Semantic Similarity</Text>
                  <Caption1 className={styles.description}>
                    Generate semantically similar terms instead of just synonyms
                  </Caption1>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Result Limit Settings */}
      <div className={styles.section}>
        <Text size={600} className={styles.sectionTitle}>
          <NumberSymbol24Regular />
          Result Limits
        </Text>

        <Card className={styles.card}>
          <div className={styles.formRow}>
            <Text className={styles.label}>Maximum Search Results</Text>
            <Input
              type="number"
              value={config.resultLimit.toString()}
              onChange={(_, data) => handleResultLimitChange(data.value)}
              min={1}
              max={100}
            />
            <Caption1 className={styles.description}>
              Maximum number of results to return per search (1-100)
            </Caption1>
          </div>

          <div className={styles.formRow}>
            <Text className={styles.label}>Minimum Similarity Threshold</Text>
            <Input
              type="number"
              value={config.searchBehavior.minSimilarity.toString()}
              onChange={(_, data) => {
                const value = parseFloat(data.value);
                if (!isNaN(value) && value >= 0 && value <= 1) {
                  handleConfigChange({
                    searchBehavior: { ...config.searchBehavior, minSimilarity: value }
                  });
                }
              }}
              step={0.1}
              min={0}
              max={1}
            />
            <Caption1 className={styles.description}>
              Minimum similarity score for results (0.0-1.0)
            </Caption1>
          </div>
        </Card>
      </div>

      {/* AI Model Selection */}
      <div className={styles.section}>
        <Text size={600} className={styles.sectionTitle}>
          <Brain24Regular />
          AI Model Selection
        </Text>

        <Card className={styles.card}>
          <div className={styles.formRow}>
            <Text className={styles.label}>Embedding Model</Text>
            <Dropdown
              placeholder="Select embedding model"
              value={embeddingModels.find(m => m.id === config.aiModel.embedding)?.name || ''}
              onOptionSelect={(_, data) => handleModelChange('embedding', data.optionValue as string)}
            >
              {embeddingModels.map(model => (
                <Option key={model.id} value={model.id}>
                  {model.name}
                </Option>
              ))}
            </Dropdown>
            <Caption1 className={styles.description}>
              Model used for generating text embeddings
            </Caption1>
          </div>

          <div className={styles.formRow}>
            <Text className={styles.label}>Language Model (LLM)</Text>
            <Dropdown
              placeholder="Select language model"
              value={llmModels.find(m => m.id === config.aiModel.llm)?.name || ''}
              onOptionSelect={(_, data) => handleModelChange('llm', data.optionValue as string)}
            >
              {llmModels.map(model => (
                <Option key={model.id} value={model.id}>
                  {model.name}
                </Option>
              ))}
            </Dropdown>
            <Caption1 className={styles.description}>
              Model used for query expansion and re-ranking
            </Caption1>
          </div>
        </Card>
      </div>

      {/* Search Behavior Settings */}
      <div className={styles.section}>
        <Text size={600} className={styles.sectionTitle}>
          Search Behavior
        </Text>

        <Card className={styles.card}>
          <div className={styles.formRowHorizontal}>
            <Switch
              checked={config.searchBehavior.includeComments}
              onChange={(_, data) => handleConfigChange({
                searchBehavior: { ...config.searchBehavior, includeComments: data.checked }
              })}
            />
            <div>
              <Text className={styles.label}>Include Comments</Text>
              <Caption1 className={styles.description}>
                Include code comments in search results
              </Caption1>
            </div>
          </div>

          <div className={styles.formRowHorizontal}>
            <Switch
              checked={config.searchBehavior.includeTests}
              onChange={(_, data) => handleConfigChange({
                searchBehavior: { ...config.searchBehavior, includeTests: data.checked }
              })}
            />
            <div>
              <Text className={styles.label}>Include Test Files</Text>
              <Caption1 className={styles.description}>
                Include test files in search results
              </Caption1>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <Button
          appearance="secondary"
          icon={<Dismiss24Regular />}
          onClick={handleReset}
          disabled={!hasChanges || isLoading}
        >
          Reset
        </Button>
        <Button
          appearance="primary"
          icon={<Save24Regular />}
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsView;
