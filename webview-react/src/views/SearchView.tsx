import { useCallback, useEffect, useMemo, useState } from 'react';
import { onMessageCommand, postMessage } from '../utils/vscodeApi';
import FilterPanel, { FilterOptions } from '../ui/FilterPanel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface SearchResult { id: string; filePath: string; lineNumber?: number; content: string; score?: number }

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});

  const availableFileTypes = useMemo(() => {
    const set = new Set<string>();
    for (const r of results) {
      if (!r.filePath) continue;
      const dot = r.filePath.lastIndexOf('.');
      if (dot !== -1) set.add(r.filePath.slice(dot));
    }
    return Array.from(set).sort();
  }, [results]);

  const visibleResults = useMemo(() => {
    return results.filter((r) => {
      if (filters.fileType) {
        const dot = r.filePath.lastIndexOf('.');
        const ext = dot !== -1 ? r.filePath.slice(dot) : '';
        if (ext !== filters.fileType) return false;
      }
      return true;
    });
  }, [results, filters]);

  useEffect(() => {
    const off = onMessageCommand('searchResponse', (m) => {
      const payload = m.data || m.payload || m;
      const normalized: SearchResult[] = (payload.results || []).map((r: any) => ({
        id: String(r.id ?? `${r.filePath ?? r.payload?.filePath}:${r.lineNumber ?? r.payload?.startLine ?? 0}`),
        filePath: r.filePath ?? r.payload?.filePath ?? '',
        lineNumber: r.lineNumber ?? r.payload?.startLine ?? 0,
        content: r.preview ?? r.content ?? r.payload?.content ?? '',
        score: r.finalScore ?? r.llmScore ?? r.similarity ?? r.score ?? 0,
      }));
      setResults(normalized);
      setSearching(false);
    });
    return () => off();
  }, []);

  const onSearch = useCallback(() => {
    if (!query.trim()) return;
    setSearching(true);
    postMessage('search', { query });
  }, [query]);

  const open = (r: SearchResult) => postMessage('openFile', { filePath: r.filePath, lineNumber: r.lineNumber ?? 0 });

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <Input
          className="flex-1"
          placeholder="Search your codebase"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
        />
        <Button disabled={searching} onClick={onSearch}>
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {searching && <div className="text-sm opacity-80">Searching • please wait</div>}

      <FilterPanel availableFileTypes={availableFileTypes} currentFilters={filters} onFilterChange={setFilters} />

      <div className="space-y-1">
        {visibleResults.length === 0 && !searching && (
          <div className="rounded border p-2 text-sm opacity-80">No results. Try a different query.</div>
        )}
        {visibleResults.map((r) => (
          <div key={r.id} className="rounded border p-2 hover:bg-white/5">
            <div className="flex items-start justify-between gap-2">
              <div className="font-mono text-sm text-[var(--vscode-descriptionForeground,#9aa0a6)] break-all">{r.filePath}:{r.lineNumber ?? 0}</div>
              <div className="text-xs opacity-70">score: {typeof r.score==='number'?r.score.toFixed(3):'-'}</div>
            </div>
            <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-black/20 p-2 text-xs">{r.content}</pre>
            <div className="mt-1">
              <button className="rounded border px-2 py-1 text-xs hover:bg-white/5" onClick={()=>open(r)}>Open</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

