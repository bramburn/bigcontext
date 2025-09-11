import { useEffect, useState } from 'react';
import ValidatedInput, { ValidationResult } from './ValidatedInput';
import ConnectionTester, { ConnectionTestResult } from './ConnectionTester';
import SetupGuide from './SetupGuides';

interface OllamaConfig { baseUrl: string; model: string; }
interface OpenAIConfig { apiKey: string; model: string; organization?: string; }

interface ProviderConfigFormProps {
  providerType: 'ollama' | 'openai';
  config: OllamaConfig | OpenAIConfig;
  availableModels: string[];
  isLoadingModels: boolean;
  onConfigChange: (config: Partial<OllamaConfig | OpenAIConfig>) => void;
  onLoadModels: () => void;
  onTest: () => Promise<ConnectionTestResult>;
}

const validateUrl = (value: string): ValidationResult => {
  if (!value.trim()) return { isValid: false, message: 'Base URL is required' };
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
  if (!value.trim()) return { isValid: false, message: 'API key is required' };
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
  if (!value.trim()) return { isValid: false, message: `${fieldName} is required` };
  return { isValid: true, message: `${fieldName} is valid` };
};

const DEFAULT_MODELS = {
  ollama: ['nomic-embed-text', 'all-minilm', 'mxbai-embed-large'],
  openai: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']
};

export default function ProviderConfigForm({
  providerType,
  config,
  availableModels,
  isLoadingModels,
  onConfigChange,
  onLoadModels,
  onTest
}: ProviderConfigFormProps) {
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setModelSuggestions(DEFAULT_MODELS[providerType] || []);
  }, [providerType]);

  const renderOllamaConfig = (config: OllamaConfig) => (
    <div className="space-y-3">
      <ValidatedInput
        label="Base URL"
        value={config.baseUrl}
        onChange={(value) => onConfigChange({ baseUrl: value })}
        validator={validateUrl}
        placeholder="http://localhost:11434"
        required
      />
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Model</span>
          <button
            className="rounded border px-2 py-1 text-xs hover:bg-white/5 disabled:opacity-50"
            onClick={onLoadModels}
            disabled={isLoadingModels}
          >
            {isLoadingModels ? (
              <span className="flex items-center gap-1">
                <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Loading...
              </span>
            ) : (
              '🔄 Detect Models'
            )}
          </button>
        </div>
        
        {availableModels.length > 0 ? (
          <select
            className="w-full rounded border bg-transparent px-2 py-1"
            value={config.model}
            onChange={(e) => onConfigChange({ model: e.target.value })}
          >
            <option value="">Select a model</option>
            {availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
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
          <div className="rounded border border-yellow-600/40 bg-yellow-500/10 px-2 py-1 text-xs">
            💡 Suggested models: {modelSuggestions.join(', ')}
            <br />
            Run: <code>ollama pull {modelSuggestions[0]}</code> to install the recommended model
          </div>
        )}
        
        {availableModels.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <div className="h-3 w-3 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
            Found {availableModels.length} available models
          </div>
        )}
      </div>
    </div>
  );

  const renderOpenAIConfig = (config: OpenAIConfig) => (
    <div className="space-y-3">
      <ValidatedInput
        label="API Key"
        type="password"
        value={config.apiKey}
        onChange={(value) => onConfigChange({ apiKey: value })}
        validator={validateApiKey}
        placeholder="sk-..."
        required
      />
      
      <label className="text-sm">
        <span className="block mb-1">Embedding Model</span>
        <select
          className="w-full rounded border bg-transparent px-2 py-1"
          value={config.model}
          onChange={(e) => onConfigChange({ model: e.target.value })}
        >
          <option value="">Select embedding model</option>
          {DEFAULT_MODELS.openai.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </label>
      
      <ValidatedInput
        label="Organization (Optional)"
        value={config.organization || ''}
        onChange={(value) => onConfigChange({ organization: value })}
        placeholder="org-..."
      />
    </div>
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
    <div className="space-y-4">
      <SetupGuide type={providerType} />

      {providerType === 'ollama' && renderOllamaConfig(config as OllamaConfig)}
      {providerType === 'openai' && renderOpenAIConfig(config as OpenAIConfig)}

      <ConnectionTester
        title="AI Provider Connection"
        description={getConnectionDescription()}
        testFunction={onTest}
      />
    </div>
  );
}
