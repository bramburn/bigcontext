import ValidatedInput, { ValidationResult } from './ValidatedInput';
import ConnectionTester, { ConnectionTestResult } from './ConnectionTester';
import SetupGuide from './SetupGuides';

interface QdrantConfig { url: string; apiKey?: string; collection?: string; }
interface PineconeConfig { apiKey: string; environment: string; indexName: string; namespace?: string; }
interface ChromaConfig { host: string; port?: number; apiKey?: string; }

interface DatabaseConfigFormProps {
  databaseType: 'qdrant' | 'pinecone' | 'chroma';
  config: QdrantConfig | PineconeConfig | ChromaConfig;
  onConfigChange: (config: Partial<QdrantConfig | PineconeConfig | ChromaConfig>) => void;
  onTest: () => Promise<ConnectionTestResult>;
}

const validateUrl = (value: string): ValidationResult => {
  if (!value.trim()) return { isValid: false, message: 'URL is required' };
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

const validatePort = (value: string): ValidationResult => {
  if (!value.trim()) return { isValid: true, message: 'Port is optional (will use default)' };
  const port = parseInt(value);
  if (isNaN(port) || port < 1 || port > 65535) {
    return { 
      isValid: false, 
      message: 'Invalid port number',
      suggestions: ['Use a number between 1 and 65535', 'Leave empty to use default port']
    };
  }
  return { isValid: true, message: 'Valid port number' };
};

export default function DatabaseConfigForm({
  databaseType,
  config,
  onConfigChange,
  onTest
}: DatabaseConfigFormProps) {
  const renderQdrantConfig = (config: QdrantConfig) => (
    <div className="space-y-3">
      <ValidatedInput
        label="Qdrant URL"
        value={config.url}
        onChange={(value) => onConfigChange({ url: value })}
        validator={validateUrl}
        placeholder="http://localhost:6333"
        required
      />
      
      <ValidatedInput
        label="API Key (Optional)"
        type="password"
        value={config.apiKey || ''}
        onChange={(value) => onConfigChange({ apiKey: value })}
        placeholder="Enter API key if authentication is enabled"
      />
      
      <ValidatedInput
        label="Collection Name (Optional)"
        value={config.collection || ''}
        onChange={(value) => onConfigChange({ collection: value })}
        placeholder="code_context (default)"
      />
    </div>
  );

  const renderPineconeConfig = (config: PineconeConfig) => (
    <div className="space-y-3">
      <ValidatedInput
        label="API Key"
        type="password"
        value={config.apiKey}
        onChange={(value) => onConfigChange({ apiKey: value })}
        validator={validateApiKey}
        placeholder="Enter your Pinecone API key"
        required
      />
      
      <ValidatedInput
        label="Environment"
        value={config.environment}
        onChange={(value) => onConfigChange({ environment: value })}
        validator={(value) => validateRequired(value, 'Environment')}
        placeholder="us-west1-gcp-free (example)"
        required
      />
      
      <ValidatedInput
        label="Index Name"
        value={config.indexName}
        onChange={(value) => onConfigChange({ indexName: value })}
        validator={(value) => validateRequired(value, 'Index name')}
        placeholder="code-context-index"
        required
      />
      
      <ValidatedInput
        label="Namespace (Optional)"
        value={config.namespace || ''}
        onChange={(value) => onConfigChange({ namespace: value })}
        placeholder="Leave empty for default namespace"
      />
    </div>
  );

  const renderChromaConfig = (config: ChromaConfig) => (
    <div className="space-y-3">
      <ValidatedInput
        label="Host"
        value={config.host}
        onChange={(value) => onConfigChange({ host: value })}
        validator={(value) => validateRequired(value, 'Host')}
        placeholder="localhost"
        required
      />
      
      <ValidatedInput
        label="Port (Optional)"
        value={config.port?.toString() || ''}
        onChange={(value) => onConfigChange({ port: value ? parseInt(value) : undefined })}
        validator={validatePort}
        placeholder="8000 (default)"
      />
      
      <ValidatedInput
        label="API Key (Optional)"
        type="password"
        value={config.apiKey || ''}
        onChange={(value) => onConfigChange({ apiKey: value })}
        placeholder="Enter API key if authentication is enabled"
      />
    </div>
  );

  const getConnectionDescription = () => {
    switch (databaseType) {
      case 'qdrant':
        return 'Test connection to your Qdrant vector database instance.';
      case 'pinecone':
        return 'Test connection to Pinecone and verify index accessibility.';
      case 'chroma':
        return 'Test connection to your ChromaDB instance.';
      default:
        return 'Test your database connection.';
    }
  };

  return (
    <div className="space-y-4">
      <SetupGuide type={databaseType} />

      {databaseType === 'qdrant' && renderQdrantConfig(config as QdrantConfig)}
      {databaseType === 'pinecone' && renderPineconeConfig(config as PineconeConfig)}
      {databaseType === 'chroma' && renderChromaConfig(config as ChromaConfig)}

      <ConnectionTester
        title="Database Connection"
        description={getConnectionDescription()}
        testFunction={onTest}
      />
    </div>
  );
}
