import { useEffect, useState } from 'react';
import { onMessageCommand, postMessage } from '../utils/vscodeApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

export type Provider = 'OpenAI' | 'Mimic Embed';

interface ExtensionSettings {
  embeddingModel: {
    provider: Provider;
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

export default function SettingsView() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info'; text: string }|null>(null);

  useEffect(() => {
    setLoading(true);
    postMessage('getSettings', { requestId: `getSettings_${Date.now()}` });
    const off1 = onMessageCommand('getSettingsResponse', (m) => {
      if (m && m.settings) setSettings(m.settings as ExtensionSettings);
      setLoading(false);
    });
    const off2 = onMessageCommand('postSettingsResponse', (m) => {
      setSaving(false);
      setMessage(m.success ? { type: 'success', text: 'Settings saved successfully!' } : { type: 'error', text: m.message || 'Failed to save settings' });
    });
    const off3 = onMessageCommand('testSettingsResponse', (m) => {
      setTesting(false);
      setMessage(m.success ? { type: 'success', text: m.message || 'Connection OK' } : { type: 'error', text: m.message || 'Connection failed' });
    });
    return () => { off1(); off2(); off3(); };
  }, []);

  const update = (path: (s: ExtensionSettings) => void) => setSettings(s => { const c = structuredClone(s); path(c); return c; });

  const onSave = () => { setSaving(true); setMessage(null); postMessage('postSettings', { settings, requestId: `postSettings_${Date.now()}` }); };
  const onTest = () => { setTesting(true); setMessage(null); postMessage('testSettings', { settings, requestId: `testSettings_${Date.now()}` }); };
  const onReset = () => { setSettings(DEFAULT_SETTINGS); setMessage({ type: 'info', text: 'Settings reset to defaults (not saved).' }); };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Extension Settings</h2>
        <p className="text-sm opacity-80">Configure your embedding model and vector database</p>
      </header>

      {message && (
        <div className={`rounded border px-3 py-2 text-sm ${message.type==='success'?'border-green-600/40 bg-green-500/10':message.type==='error'?'border-red-600/40 bg-red-500/10':'border-blue-600/40 bg-blue-500/10'}`}>{message.text}</div>
      )}

      {loading && <div className="text-sm opacity-80">Loading settings…</div>}

      <section className="space-y-3">
        <h3 className="font-medium">Embedding Model</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="provider-select">Provider</Label>
            <Select
              value={settings.embeddingModel.provider}
              onValueChange={(value) => update(s => { s.embeddingModel.provider = value as Provider; })}
            >
              <SelectTrigger id="provider-select">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OpenAI">OpenAI</SelectItem>
                <SelectItem value="Mimic Embed">Mimic Embed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key-input">API Key</Label>
            <Input
              id="api-key-input"
              type="password"
              value={settings.embeddingModel.apiKey}
              onChange={(e) => update(s => { s.embeddingModel.apiKey = e.target.value; })}
              placeholder="Enter your API key"
            />
          </div>

          {settings.embeddingModel.provider === 'OpenAI' ? (
            <div className="space-y-2">
              <Label htmlFor="model-select">Model</Label>
              <Select
                value={settings.embeddingModel.modelName}
                onValueChange={(value) => update(s => { s.embeddingModel.modelName = value; })}
              >
                <SelectTrigger id="model-select">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                  <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                  <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="model-name-input">Model Name</Label>
              <Input
                id="model-name-input"
                value={settings.embeddingModel.modelName}
                onChange={(e) => update(s => { s.embeddingModel.modelName = e.target.value; })}
                placeholder="Enter model name"
              />
            </div>
          )}

          {settings.embeddingModel.provider === 'Mimic Embed' && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endpoint-input">Endpoint URL</Label>
              <Input
                id="endpoint-input"
                placeholder="https://your-mimic-embed-endpoint.com"
                value={settings.embeddingModel.endpoint || ''}
                onChange={(e) => update(s => { s.embeddingModel.endpoint = e.target.value; })}
              />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Qdrant Database</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="host-input">Host</Label>
            <Input
              id="host-input"
              value={settings.qdrantDatabase.host}
              onChange={(e) => update(s => { s.qdrantDatabase.host = e.target.value; })}
              placeholder="localhost"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port-input">Port</Label>
            <Input
              id="port-input"
              type="number"
              value={settings.qdrantDatabase.port}
              onChange={(e) => update(s => { s.qdrantDatabase.port = parseInt(e.target.value || '6333', 10) || 6333; })}
              placeholder="6333"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="collection-input">Collection Name</Label>
            <Input
              id="collection-input"
              value={settings.qdrantDatabase.collectionName}
              onChange={(e) => update(s => { s.qdrantDatabase.collectionName = e.target.value; })}
              placeholder="code-embeddings"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="db-api-key-input">API Key (Optional)</Label>
            <Input
              id="db-api-key-input"
              type="password"
              value={settings.qdrantDatabase.apiKey || ''}
              onChange={(e) => update(s => { s.qdrantDatabase.apiKey = e.target.value; })}
              placeholder="Enter API key if required"
            />
          </div>
        </div>
      </section>

      <div className="flex gap-2">
        <Button disabled={saving || loading} onClick={onSave}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button variant="outline" disabled={testing || loading} onClick={onTest}>
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button variant="outline" onClick={onReset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

