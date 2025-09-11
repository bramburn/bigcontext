import { useEffect, useState } from 'react';
import { onMessageCommand, postMessage } from '../utils/vscodeApi';

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
          <label className="text-sm">
            <span className="block mb-1">Provider</span>
            <select
              className="w-full rounded border bg-transparent px-2 py-1"
              value={settings.embeddingModel.provider}
              onChange={(e)=>update(s=>{s.embeddingModel.provider = e.target.value as Provider;})}
            >
              <option value="OpenAI">OpenAI</option>
              <option value="Mimic Embed">Mimic Embed</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="block mb-1">API Key</span>
            <input
              type="password"
              className="w-full rounded border bg-transparent px-2 py-1"
              value={settings.embeddingModel.apiKey}
              onChange={(e)=>update(s=>{s.embeddingModel.apiKey = e.target.value;})}
            />
          </label>

          {settings.embeddingModel.provider === 'OpenAI' ? (
            <label className="text-sm">
              <span className="block mb-1">Model</span>
              <select
                className="w-full rounded border bg-transparent px-2 py-1"
                value={settings.embeddingModel.modelName}
                onChange={(e)=>update(s=>{s.embeddingModel.modelName = e.target.value;})}
              >
                <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                <option value="text-embedding-3-small">text-embedding-3-small</option>
                <option value="text-embedding-3-large">text-embedding-3-large</option>
              </select>
            </label>
          ) : (
            <label className="text-sm">
              <span className="block mb-1">Model Name</span>
              <input
                className="w-full rounded border bg-transparent px-2 py-1"
                value={settings.embeddingModel.modelName}
                onChange={(e)=>update(s=>{s.embeddingModel.modelName = e.target.value;})}
              />
            </label>
          )}

          {settings.embeddingModel.provider === 'Mimic Embed' && (
            <label className="text-sm md:col-span-2">
              <span className="block mb-1">Endpoint URL</span>
              <input
                className="w-full rounded border bg-transparent px-2 py-1"
                placeholder="https://your-mimic-embed-endpoint.com"
                value={settings.embeddingModel.endpoint || ''}
                onChange={(e)=>update(s=>{s.embeddingModel.endpoint = e.target.value;})}
              />
            </label>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Qdrant Database</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block mb-1">Host</span>
            <input
              className="w-full rounded border bg-transparent px-2 py-1"
              value={settings.qdrantDatabase.host}
              onChange={(e)=>update(s=>{s.qdrantDatabase.host = e.target.value;})}
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1">Port</span>
            <input
              type="number"
              className="w-full rounded border bg-transparent px-2 py-1"
              value={settings.qdrantDatabase.port}
              onChange={(e)=>update(s=>{s.qdrantDatabase.port = parseInt(e.target.value||'6333',10)||6333;})}
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1">Collection Name</span>
            <input
              className="w-full rounded border bg-transparent px-2 py-1"
              value={settings.qdrantDatabase.collectionName}
              onChange={(e)=>update(s=>{s.qdrantDatabase.collectionName = e.target.value;})}
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1">API Key (Optional)</span>
            <input
              type="password"
              className="w-full rounded border bg-transparent px-2 py-1"
              value={settings.qdrantDatabase.apiKey || ''}
              onChange={(e)=>update(s=>{s.qdrantDatabase.apiKey = e.target.value;})}
            />
          </label>
        </div>
      </section>

      <div className="flex gap-2">
        <button className="rounded bg-[var(--vscode-button-background,#0e639c)] px-3 py-1.5 text-white hover:opacity-95 disabled:opacity-50" disabled={saving||loading} onClick={onSave}>Save Settings</button>
        <button className="rounded border px-3 py-1.5 hover:bg-white/5 disabled:opacity-50" disabled={testing||loading} onClick={onTest}>Test Connection</button>
        <button className="rounded border px-3 py-1.5 hover:bg-white/5" onClick={onReset}>Reset to Defaults</button>
      </div>
    </div>
  );
}

