import { useCallback, useEffect } from 'react';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';
import DatabaseConfigForm from '../ui/DatabaseConfigForm';
import ProviderConfigForm from '../ui/ProviderConfigForm';
import { useAppStore, useSetupState } from '../stores/appStore';

const DATABASE_OPTIONS = [
  { value: 'qdrant', label: 'Qdrant' },
  { value: 'chroma', label: 'ChromaDB' },
  { value: 'pinecone', label: 'Pinecone' }
];

const PROVIDER_OPTIONS = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'openai', label: 'OpenAI' }
];

export default function SetupView() {
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
  const testDatabaseConnection = useCallback(async (): Promise<any> => {
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

  const testProviderConnection = useCallback(async (): Promise<any> => {
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
    });

    const unsubscribeSetupError = onMessageCommand('setupError', (data) => {
      console.error('Setup error:', data.error);
      alert(`Setup failed: ${data.error}`);
    });

    const unsubscribeConfigLoaded = onMessageCommand('configLoaded', (data) => {
      if (data.success && data.config) {
        console.log('Persistent config loaded:', data.config);
        setSelectedDatabase(data.config.database || 'qdrant');
        setSelectedProvider(data.config.provider || 'ollama');
        updateDatabaseConfig(data.config.databaseConfig || {});
        updateProviderConfig(data.config.providerConfig || {});

        if (data.config.indexInfo) {
          console.log('Valid index found, navigating to query');
          setCurrentView('query');
        }
      }
    });

    const unsubscribeConfigSaved = onMessageCommand('configSaved', (data) => {
      if (data.success) {
        console.log('Persistent config saved successfully');
      } else {
        console.error('Failed to save persistent config:', data.error);
      }
    });

    return () => {
      unsubscribeSetupComplete();
      unsubscribeSetupError();
      unsubscribeConfigLoaded();
      unsubscribeConfigSaved();
    };
  }, []);

  // Load persistent configuration on mount
  useEffect(() => {
    postMessage('loadPersistentConfig', {
      requestId: `loadPersistentConfig_${Date.now()}`
    });
  }, []);

  const handleStartIndexing = () => {
    // First save the configuration to persistent storage
    postMessage('savePersistentConfig', {
      database: setupState.selectedDatabase,
      provider: setupState.selectedProvider,
      databaseConfig: setupState.databaseConfig,
      providerConfig: setupState.providerConfig,
      requestId: `savePersistentConfig_${Date.now()}`
    });

    // Then start the setup process
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
          const apiConfig = setupState.providerConfig as any;
          return !!(apiConfig.apiKey && apiConfig.model);
        default:
          return false;
      }
    })();

    return dbValid && providerValid;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">⚙️ Setup Code Context Engine</h1>
        <p className="text-sm opacity-80">Configure your database and AI provider to get started with intelligent code search.</p>
      </div>

      {/* Database Configuration */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Database Configuration</h2>
        <div className="rounded border p-4 space-y-4">
          <label className="text-sm">
            <span className="block mb-1">Database Type</span>
            <select
              className="w-full rounded border bg-transparent px-2 py-1"
              value={setupState.selectedDatabase}
              onChange={(e) => setSelectedDatabase(e.target.value as any)}
            >
              {DATABASE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <DatabaseConfigForm
            databaseType={setupState.selectedDatabase}
            config={setupState.databaseConfig}
            onConfigChange={updateDatabaseConfig}
            onTest={testDatabaseConnection}
          />
        </div>
      </section>

      {/* Provider Configuration */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">AI Provider Configuration</h2>
        <div className="rounded border p-4 space-y-4">
          <label className="text-sm">
            <span className="block mb-1">AI Provider</span>
            <select
              className="w-full rounded border bg-transparent px-2 py-1"
              value={setupState.selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
            >
              {PROVIDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <ProviderConfigForm
            providerType={setupState.selectedProvider}
            config={setupState.providerConfig}
            availableModels={setupState.availableModels}
            isLoadingModels={setupState.isLoadingModels}
            onConfigChange={updateProviderConfig}
            onLoadModels={handleLoadModels}
            onTest={testProviderConnection}
          />
        </div>
      </section>

      <div className="flex justify-center">
        <button
          className="rounded bg-[var(--vscode-button-background,#0e639c)] px-6 py-2 text-white disabled:opacity-50"
          disabled={!isSetupValid()}
          onClick={handleStartIndexing}
        >
          ▶️ Start Indexing
        </button>
      </div>
    </div>
  );
}
