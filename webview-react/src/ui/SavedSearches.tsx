import { useState } from 'react';
import { postMessage } from '../utils/vscodeApi';
import { useAppStore } from '../stores/appStore';

export default function SavedSearches() {
  const { savedSearches, query, addSavedSearch, removeSavedSearch, setQuery } = useAppStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [q, setQ] = useState('');

  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);

  const exec = (searchQuery: string) => {
    setQuery(searchQuery);
    postMessage('search', { query: searchQuery });
  };

  const onSave = () => {
    if (!name.trim() || !q.trim()) return;
    addSavedSearch(name.trim(), q.trim());
    setName(''); setQ(''); setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-base font-semibold">Saved Searches</div>
          <div className="text-xs opacity-70">{savedSearches.length} saved</div>
        </div>
        <button
          className="rounded bg-[var(--vscode-button-background,#0e639c)] px-3 py-1.5 text-white disabled:opacity-50"
          onClick={() => { setQ(query); setOpen(true); }}
          disabled={!query.trim()}
        >
          Save Current Search
        </button>
      </div>

      {savedSearches.length === 0 ? (
        <div className="rounded border p-6 text-center text-sm opacity-80">
          No saved searches yet. Run a search and click "Save Current Search".
        </div>
      ) : (
        <div className="space-y-2">
          {savedSearches.map((s) => (
            <div key={s.id} className="rounded border p-3 hover:bg-white/5">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{s.name}</div>
                <div className="flex gap-2">
                  <button className="rounded border px-2 py-1 text-xs hover:bg-white/5" onClick={(e)=>{e.stopPropagation(); exec(s.query);}}>Run</button>
                  <button className="rounded border px-2 py-1 text-xs hover:bg-white/5" onClick={(e)=>{e.stopPropagation(); removeSavedSearch(s.id);}}>Delete</button>
                </div>
              </div>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-black/20 p-2 text-xs">{s.query}</pre>
              <div className="mt-1 text-xs opacity-70">Saved on {formatDate(s.timestamp)}</div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          <div className="w-[min(90vw,520px)] rounded border bg-[var(--vscode-editor-background,#1e1e1e)] p-4 shadow-xl">
            <div className="text-base font-semibold">Save Search</div>
            <div className="mt-3 space-y-3">
              <label className="text-sm block">
                <span className="mb-1 block">Search Name</span>
                <input className="w-full rounded border bg-transparent px-2 py-1" value={name} onChange={(e)=>setName(e.target.value)} />
              </label>
              <label className="text-sm block">
                <span className="mb-1 block">Query</span>
                <textarea className="w-full rounded border bg-transparent px-2 py-1" rows={3} value={q} onChange={(e)=>setQ(e.target.value)} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-3 py-1.5" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="rounded bg-[var(--vscode-button-background,#0e639c)] px-3 py-1.5 text-white disabled:opacity-50" onClick={onSave} disabled={!name.trim() || !q.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

